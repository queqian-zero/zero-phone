/* Storage Manager - 数据存储管理器 (IndexedDB版) */
/* 
 * 大保险柜：内存缓存 + IndexedDB持久化
 * - getData/saveData 保持同步（读写内存缓存）
 * - 后台异步写入IndexedDB
 * - 首次启动自动从localStorage迁移数据
 * - 调用方代码无需任何修改
 */

class StorageManager {
    constructor() {
        this.KEYS = {
            FRIENDS: 'zero_phone_friends',
            CHATS: 'zero_phone_chats',
            MEMORIES: 'zero_phone_memories',
            USER: 'zero_phone_user_settings'
        };
        this._cache = {};
        this._db = null;
        this._dbReady = false;
        this._writeQueue = [];
        this.init();
    }
    
    init() {
        this._loadFromLocalStorage();
        if (!this.getData(this.KEYS.FRIENDS)) this.saveData(this.KEYS.FRIENDS, []);
        if (!this.getData(this.KEYS.CHATS)) this.saveData(this.KEYS.CHATS, []);
        if (!this.getData(this.KEYS.MEMORIES)) this.saveData(this.KEYS.MEMORIES, []);
        if (!this.getData(this.KEYS.USER)) this.saveData(this.KEYS.USER, { userName: '〇', userAvatar: '', apiKey: '' });
        this._initIndexedDB();
    }
    
    _loadFromLocalStorage() {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('zero_phone')) {
                    try { this._cache[key] = JSON.parse(localStorage.getItem(key)); } catch(e) {}
                }
            }
            console.log('📦 从localStorage加载了', Object.keys(this._cache).length, '条数据');
        } catch(e) { console.error('❌ localStorage加载失败:', e); }
    }
    
    async _initIndexedDB() {
        try {
            this._db = await new Promise((resolve, reject) => {
                const req = indexedDB.open('ZeroPhoneDB', 1);
                req.onupgradeneeded = (e) => { if (!e.target.result.objectStoreNames.contains('data')) e.target.result.createObjectStore('data'); };
                req.onsuccess = (e) => resolve(e.target.result);
                req.onerror = (e) => reject(e.target.error);
            });
            const migrated = await this._idbGet('__zp_migrated__');
            if (!migrated) { await this._migrateToIDB(); } else { await this._loadFromIDB(); }
            this._dbReady = true;
            this._flushWriteQueue();
            console.log('✅ 大保险柜就绪（IndexedDB）');
            // 通知页面数据已从IDB加载完成，可以重新渲染
            window.dispatchEvent(new Event('storage-ready'));
        } catch(e) { console.warn('⚠️ IndexedDB初始化失败，继续使用内存缓存:', e.message); }
    }
    
    async _migrateToIDB() {
        console.log('🚚 开始迁移到IndexedDB...');
        const keys = Object.keys(this._cache);
        for (const key of keys) await this._idbSet(key, this._cache[key]);
        await this._idbSet('__zp_migrated__', { time: new Date().toISOString() });
        // 不清理localStorage，保留作为兜底备份
        console.log('✅ 迁移完成！', keys.length, '条数据已同步到大保险柜（localStorage保留备份）');
    }
    
    async _loadFromIDB() {
        try {
            const allKeys = await new Promise((res, rej) => { const r = this._db.transaction('data','readonly').objectStore('data').getAllKeys(); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); });
            for (const key of allKeys) {
                if (key === '__zp_migrated__') continue;
                const v = await this._idbGet(key);
                if (v != null) {
                    this._cache[key] = v;
                    // 回写localStorage（恢复兜底数据）
                    try { localStorage.setItem(key, JSON.stringify(v)); } catch(e) {}
                }
            }
            console.log('📦 从IndexedDB加载了', allKeys.length - 1, '条数据（已同步到localStorage）');
        } catch(e) { console.warn('⚠️ IDB加载失败:', e); }
    }
    
    _flushWriteQueue() {
        if (this._writeQueue.length > 0) {
            const q = [...this._writeQueue]; this._writeQueue = [];
            q.forEach(({key,data}) => this._idbSet(key,data));
        }
    }
    
    _idbSet(key, value) {
        if (!this._db) return Promise.resolve();
        return new Promise((res, rej) => { try { const tx = this._db.transaction('data','readwrite'); tx.objectStore('data').put(value, key); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); } catch(e){rej(e);} });
    }
    _idbGet(key) {
        if (!this._db) return Promise.resolve(null);
        return new Promise((res, rej) => { try { const r = this._db.transaction('data','readonly').objectStore('data').get(key); r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); } catch(e){rej(e);} });
    }
    _idbDelete(key) {
        if (!this._db) return Promise.resolve();
        return new Promise((res, rej) => { try { const tx = this._db.transaction('data','readwrite'); tx.objectStore('data').delete(key); tx.oncomplete=()=>res(); tx.onerror=()=>rej(tx.error); } catch(e){rej(e);} });
    }
    
    // ==================== 通用方法（同步）====================
    saveData(key, data) {
        try {
            this._cache[key] = data;
            // 双写localStorage（兜底，永不丢数据）
            try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
            // 异步写IDB
            if (this._dbReady) { this._idbSet(key, data).catch(e => console.warn('⚠️ IDB写入失败:', key)); }
            else { this._writeQueue.push({key, data}); }
            return true;
        } catch(e) { console.error('❌ 保存数据失败:', e); return false; }
    }
    getData(key) { try { return this._cache[key] || null; } catch(e) { return null; } }
    deleteData(key) {
        try { delete this._cache[key]; try { localStorage.removeItem(key); } catch(e) {} if (this._dbReady) this._idbDelete(key).catch(e=>{}); return true; } catch(e) { return false; }
    }
    clearAll() {
        try {
            this._cache = {};
            if (this._dbReady && this._db) { const tx = this._db.transaction('data','readwrite'); tx.objectStore('data').clear(); }
            try { localStorage.clear(); } catch(e) {}
            this.init(); return true;
        } catch(e) { return false; }
    }
    
    // ==================== 好友相关 ====================
    getAllFriends() { return (this.getData(this.KEYS.FRIENDS) || []).filter(f => !f.isDeleted); }
    getAllFriendsIncludingDeleted() { return this.getData(this.KEYS.FRIENDS) || []; }
    getDeletedFriends() { return (this.getData(this.KEYS.FRIENDS) || []).filter(f => f.isDeleted); }
    getFriendByCode(code) { return this.getAllFriends().find(f => f.code === code); }
    
    addFriend(friendData) {
        try {
            const friends = this.getAllFriends();
            if (friends.find(f => f.code === friendData.code)) { console.error('❌ 好友编码重复'); return false; }
            friendData.isDeleted = false; friendData.deletedAt = null;
            friends.push(friendData);
            return this.saveData(this.KEYS.FRIENDS, friends);
        } catch(e) { console.error('❌ 添加好友失败:', e); return false; }
    }
    updateFriend(code, updates) {
        try {
            const friends = this.getAllFriends();
            const idx = friends.findIndex(f => f.code === code);
            if (idx === -1) return false;
            friends[idx] = { ...friends[idx], ...updates };
            return this.saveData(this.KEYS.FRIENDS, friends);
        } catch(e) { return false; }
    }
    deleteFriend(code) {
        try {
            const all = this.getAllFriendsIncludingDeleted();
            const f = all.find(f => f.code === code);
            if (!f) return false;
            f.isDeleted = true; f.deletedAt = new Date().toISOString();
            return this.saveData(this.KEYS.FRIENDS, all);
        } catch(e) { return false; }
    }
    restoreFriend(code) {
        try {
            const all = this.getAllFriendsIncludingDeleted();
            const f = all.find(f => f.code === code);
            if (!f || !f.isDeleted) return false;
            f.isDeleted = false; f.deletedAt = null;
            return this.saveData(this.KEYS.FRIENDS, all);
        } catch(e) { return false; }
    }
    
    // ==================== 聊天记录相关 ====================
    getChats() { return this.getData(this.KEYS.CHATS) || []; }
    getChatByFriendCode(friendCode) { return (this.getData(this.KEYS.CHATS) || []).find(c => c.friendCode === friendCode); }
    
    addMessage(friendCode, message) {
        try {
            const chats = this.getData(this.KEYS.CHATS) || [];
            let chat = chats.find(c => c.friendCode === friendCode);
            if (!chat) { chat = { friendCode, messages: [], tokenStats: { worldBook:0,persona:0,chatHistory:0,input:0,output:0,total:0,lastUpdate:new Date().toISOString() }, lastSummaryIndex:0 }; chats.push(chat); }
            chat.messages.push(message);
            return this.saveData(this.KEYS.CHATS, chats);
        } catch(e) { console.error('❌ 保存消息失败:', e); return false; }
    }
    setMessages(friendCode, messages) {
        try {
            const chats = this.getData(this.KEYS.CHATS) || [];
            let chat = chats.find(c => c.friendCode === friendCode);
            if (!chat) { chat = { friendCode, messages: [], tokenStats: { worldBook:0,persona:0,chatHistory:0,input:0,output:0,total:0,lastUpdate:new Date().toISOString() }, lastSummaryIndex:0 }; chats.push(chat); }
            chat.messages = messages;
            return this.saveData(this.KEYS.CHATS, chats);
        } catch(e) { return false; }
    }
    updateTokenStats(friendCode, stats) {
        try {
            const chats = this.getData(this.KEYS.CHATS) || [];
            const chat = chats.find(c => c.friendCode === friendCode);
            if (!chat) return false;
            chat.tokenStats = { ...chat.tokenStats, ...stats };
            return this.saveData(this.KEYS.CHATS, chats);
        } catch(e) { return false; }
    }
    deleteChat(friendCode) {
        try { const chats = (this.getData(this.KEYS.CHATS)||[]).filter(c => c.friendCode !== friendCode); return this.saveData(this.KEYS.CHATS, chats); } catch(e) { return false; }
    }
    
    // ==================== 聊天总结相关 ====================
    getChatSummaries(friendCode) { return this.getChatByFriendCode(friendCode)?.summaries || []; }
    addChatSummary(friendCode, summary) {
        const chats = this.getChats(); const chat = chats.find(c=>c.friendCode===friendCode);
        if (!chat) return false; if (!chat.summaries) chat.summaries = [];
        const id = 'summary_'+Date.now();
        chat.summaries.push({ id, date:summary.date, messageCount:summary.messageCount, startTime:summary.startTime, endTime:summary.endTime, summary:summary.summary, content:summary.content, createdAt:new Date().toISOString() });
        this.saveData(this.KEYS.CHATS, chats); return id;
    }
    updateChatSummary(friendCode, summaryId, newContent) {
        const chats=this.getChats(); const chat=chats.find(c=>c.friendCode===friendCode);
        if(!chat||!chat.summaries) return false; const s=chat.summaries.find(s=>s.id===summaryId); if(!s) return false;
        s.content=newContent; s.updatedAt=new Date().toISOString(); this.saveData(this.KEYS.CHATS,chats); return true;
    }
    updateChatSummaryFull(friendCode, summaryId, newSummary, newContent) {
        const chats=this.getChats(); const chat=chats.find(c=>c.friendCode===friendCode);
        if(!chat||!chat.summaries) return false; const s=chat.summaries.find(s=>s.id===summaryId); if(!s) return false;
        s.summary=newSummary; s.content=newContent; s.updatedAt=new Date().toISOString(); this.saveData(this.KEYS.CHATS,chats); return true;
    }
    deleteChatSummary(friendCode, summaryId) {
        const chats=this.getChats(); const chat=chats.find(c=>c.friendCode===friendCode);
        if(!chat||!chat.summaries) return false; const idx=chat.summaries.findIndex(s=>s.id===summaryId); if(idx===-1) return false;
        chat.summaries.splice(idx,1); this.saveData(this.KEYS.CHATS,chats); return true;
    }
    
    // ==================== 核心记忆相关 ====================
    getCoreMemories(friendCode) { return this.getChatByFriendCode(friendCode)?.coreMemories || []; }
    addCoreMemory(friendCode, data) {
        try { const chats=this.getChats(); const chat=chats.find(c=>c.friendCode===friendCode); if(!chat) return false;
        if(!chat.coreMemories) chat.coreMemories=[]; const id='memory_'+Date.now();
        chat.coreMemories.push({id,date:data.date,content:data.content,createdAt:new Date().toISOString(),updatedAt:null});
        this.saveData(this.KEYS.CHATS,chats); return id; } catch(e){return false;}
    }
    updateCoreMemory(friendCode, memoryId, newDate, newContent) {
        try { const chats=this.getChats(); const chat=chats.find(c=>c.friendCode===friendCode); if(!chat||!chat.coreMemories) return false;
        const m=chat.coreMemories.find(m=>m.id===memoryId); if(!m) return false;
        m.date=newDate; m.content=newContent; m.updatedAt=new Date().toISOString(); this.saveData(this.KEYS.CHATS,chats); return true; } catch(e){return false;}
    }
    deleteCoreMemory(friendCode, memoryId) {
        try { const chats=this.getChats(); const chat=chats.find(c=>c.friendCode===friendCode); if(!chat||!chat.coreMemories) return false;
        const idx=chat.coreMemories.findIndex(m=>m.id===memoryId); if(idx===-1) return false;
        chat.coreMemories.splice(idx,1); this.saveData(this.KEYS.CHATS,chats); return true; } catch(e){return false;}
    }
    
    // ==================== 记忆碎片相关 ====================
    getMemoryFragments(friendCode) { return this.getChatByFriendCode(friendCode)?.memoryFragments || []; }
    addMemoryFragment(friendCode, data) {
        try { const chats=this.getChats(); const chat=chats.find(c=>c.friendCode===friendCode); if(!chat) return false;
        if(!chat.memoryFragments) chat.memoryFragments=[]; const id='fragment_'+Date.now();
        chat.memoryFragments.push({id,originalDate:data.originalDate,originalContent:data.originalContent,createdAt:data.createdAt,deletedAt:new Date().toISOString(),reason:data.reason});
        this.saveData(this.KEYS.CHATS,chats); return id; } catch(e){return false;}
    }
    deleteMemoryFragment(friendCode, fragmentId) {
        try { const chats=this.getChats(); const chat=chats.find(c=>c.friendCode===friendCode); if(!chat||!chat.memoryFragments) return false;
        const idx=chat.memoryFragments.findIndex(f=>f.id===fragmentId); if(idx===-1) return false;
        chat.memoryFragments.splice(idx,1); this.saveData(this.KEYS.CHATS,chats); return true; } catch(e){return false;}
    }
    
    // ==================== 记忆总结相关 ====================
    getMemoriesByFriendCode(friendCode) { return (this.getData(this.KEYS.MEMORIES)||[]).find(m=>m.friendCode===friendCode); }
    addMemorySummary(friendCode, summary) {
        try { const memories=this.getData(this.KEYS.MEMORIES)||[]; let m=memories.find(m=>m.friendCode===friendCode);
        if(!m){m={friendCode,summaries:[]};memories.push(m);} m.summaries.push(summary); return this.saveData(this.KEYS.MEMORIES,memories); } catch(e){return false;}
    }
    
    // ==================== 用户设置相关 ====================
    getUserSettings() { return this.getData(this.KEYS.USER); }
    updateUserSettings(updates) { try { return this.saveData(this.KEYS.USER, {...this.getUserSettings(),...updates}); } catch(e){return false;} }
    
    // ==================== 聊天设置相关 ====================
    getChatSettings(friendCode) { return this.getData(`zero_phone_chat_settings_${friendCode}`); }
    saveChatSettings(friendCode, settings) { this.saveData(`zero_phone_chat_settings_${friendCode}`, settings); return true; }
    deleteChatSettings(friendCode) { this.deleteData(`zero_phone_chat_settings_${friendCode}`); return true; }
    
    // ==================== 气泡存档相关 ====================
    getBubbleArchives(friendCode) { return this.getData('zero_phone_bubble_archives_'+(friendCode||'global')) || []; }
    saveBubbleArchives(friendCode, archives) { this.saveData('zero_phone_bubble_archives_'+(friendCode||'global'), archives); }
    
    // ==================== 亲密关系数据（全局，所有char共用） ====================
    
    // 获取亲密关系数据（per friend）
    getIntimacyData(friendCode) {
        const key = `zero_phone_intimacy_${friendCode}`;
        return this.getData(key) || {
            value: 0,                    // 亲密值
            totalMessages: 0,            // 总消息条数（用于每100条+1）
            msgAccumulator: 0,           // 消息累加器（到100清零）
            todayMessages: 0,            // 今日消息数
            todayDate: '',               // 今日日期（用于重置）
            dailyBonusDate: '',          // 日活奖励最后领取日
            goodMorningDate: '',         // 最后互道早安日期
            goodNightDate: '',           // 最后互道晚安日期
            nightOwlDate: '',            // 最后熬夜修仙日期
            timeline: [],                // 星迹档案时间线
            bgImage: '',                 // 亲密关系页背景图
            luckyChars: {                // 幸运字符
                owned: [],               // 已拥有的字符 [{id, name, icon, iconType, litChars:0, totalChars:0, litDate:'', obtainedBy:'user'|'ai', obtainedDate:''}]
                userWearing: '',         // user佩戴的字符id
                aiWearing: '',           // AI佩戴的字符id
                userWearingOn: true,     // user佩戴开关
                aiWearingOn: true,       // AI佩戴开关
                todayDrawsUser: 0,       // user今天抽了几次
                todayDrawsAI: 0,         // AI今天抽了几次
                drawDate: '',            // 抽卡日期（用于重置）
                bgImage: ''              // 幸运字符页背景图
            },
            relationship: {              // 关系绑定
                bound: null,             // 当前绑定 {id, name, icon, iconType, boundDate:'', wearing:true}
                pendingInvite: null,     // 待处理邀请 {from:'user'|'ai', relId, relName, htmlTemplate, timestamp}
                bgImage: ''
            },
            badges: {                    // 亲密徽章
                unlocked: [],            // 已解锁 [{id, name, icon, unlockedDate:''}]
                progress: {},            // 解锁进度 {badgeId: {current:0, target:0, ...}}
                bgImage: ''
            },
            exchange: {                  // 跨次元兑换所
                todos: [],               // 未来要做的事
                funds: [],               // 亲密基金
                shopping: [],            // 网购
                delivery: [],            // 外卖
                letters: [],             // 信件
                bgImage: ''
            },
            capsule: {                   // 岁月胶囊
                reports: [],             // 报告列表
                bgImage: ''
            }
        };
    }
    
    saveIntimacyData(friendCode, data) {
        this.saveData(`zero_phone_intimacy_${friendCode}`, data);
        return true;
    }
    
    // 获取全局亲密关系配置（自定义字符/关系/徽章，所有char共用）
    getIntimacyConfig() {
        return this.getData('zero_phone_intimacy_config') || {
            customLuckyChars: [],        // 自定义幸运字符 [{id, name, icon, iconType}]
            customRelationships: [],     // 自定义关系 [{id, name, icon, iconType}]
            customBadges: []             // 自定义徽章 [{id, name, icon, iconType, condition:''}]
        };
    }
    
    saveIntimacyConfig(config) {
        this.saveData('zero_phone_intimacy_config', config);
        return true;
    }
    
    // 添加星迹档案记录
    addTimelineEntry(friendCode, entry) {
        const data = this.getIntimacyData(friendCode);
        data.timeline.unshift({
            id: 'tl_' + Date.now(),
            date: new Date().toISOString(),
            type: entry.type,            // 'badge_unlock' | 'lucky_char_draw' | 'lucky_char_lit' | 'relation_bind' | 'level_up'
            title: entry.title,
            icon: entry.icon || '',
            userNote: '',                // user寄语
            aiNote: ''                   // AI寄语
        });
        this.saveIntimacyData(friendCode, data);
        return data.timeline[0].id;
    }
    
    // ==================== 调试 ====================
    printAllData() { console.log('=== 大保险柜 ==='); console.log('缓存条目:', Object.keys(this._cache).length, 'IDB:', this._dbReady); }
    getStorageInfo() {
        const s=JSON.stringify(this._cache).length;
        return { entries:Object.keys(this._cache).length, sizeKB:(s/1024).toFixed(2), sizeMB:(s/1048576).toFixed(2), engine:this._dbReady?'IndexedDB':'Cache' };
    }
}

window.StorageManager = StorageManager;
