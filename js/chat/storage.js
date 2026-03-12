/* Storage Manager - 数据存储管理器 */

class StorageManager {
    constructor() {
        this.KEYS = {
            FRIENDS: 'zero_phone_friends',      // 好友数据
            CHATS: 'zero_phone_chats',          // 聊天记录
            MEMORIES: 'zero_phone_memories',    // 记忆总结
            USER: 'zero_phone_user_settings'    // 用户设置
        };
        this.init();
    }
    
    init() {
        // 初始化：如果没有数据就创建空数组
        if (!this.getData(this.KEYS.FRIENDS)) {
            this.saveData(this.KEYS.FRIENDS, []);
        }
        if (!this.getData(this.KEYS.CHATS)) {
            this.saveData(this.KEYS.CHATS, []);
        }
        if (!this.getData(this.KEYS.MEMORIES)) {
            this.saveData(this.KEYS.MEMORIES, []);
        }
        if (!this.getData(this.KEYS.USER)) {
            this.saveData(this.KEYS.USER, {
                userName: '〇',
                userAvatar: '',
                apiKey: ''
            });
        }
    }
    
    // ==================== 通用方法 ====================
    
    // 保存数据
    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('❌ 保存数据失败:', e);
            return false;
        }
    }
    
    // 读取数据
    getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('❌ 读取数据失败:', e);
            return null;
        }
    }
    
    // 删除数据
    deleteData(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('❌ 删除数据失败:', e);
            return false;
        }
    }
    
    // 清空所有数据
    clearAll() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            this.init(); // 重新初始化空数据
            return true;
        } catch (e) {
            console.error('❌ 清空数据失败:', e);
            return false;
        }
    }
    
    // ==================== 好友相关 ====================
    
    // 获取所有好友（只返回未删除的）
    getAllFriends() {
        const allFriends = this.getData(this.KEYS.FRIENDS) || [];
        return allFriends.filter(f => !f.isDeleted);
    }

    // 获取所有好友（包括已删除的）
    getAllFriendsIncludingDeleted() {
        return this.getData(this.KEYS.FRIENDS) || [];
    }

    // 获取已删除的好友列表
    getDeletedFriends() {
        const allFriends = this.getData(this.KEYS.FRIENDS) || [];
        return allFriends.filter(f => f.isDeleted);
    }
    
    // 根据编码获取好友
    getFriendByCode(code) {
        const friends = this.getAllFriends();
        return friends.find(f => f.code === code);
    }
    
    // 添加好友
    addFriend(friendData) {
        try {
            const friends = this.getAllFriends();
            
            // 检查编码是否重复（包括已删除的）
            const existing = friends.find(f => f.code === friendData.code);
            
            if (existing) {
                console.error('❌ 好友编码重复');
                return false;
            }
            
            // 添加软删除标记
            friendData.isDeleted = false;
            friendData.deletedAt = null;
            
            friends.push(friendData);
            return this.saveData(this.KEYS.FRIENDS, friends);
        } catch (e) {
            console.error('❌ 添加好友失败:', e);
            return false;
        }
    }
    
    // 更新好友
    updateFriend(code, updates) {
        try {
            const friends = this.getAllFriends();
            const index = friends.findIndex(f => f.code === code);
            
            if (index === -1) {
                console.error('❌ 找不到好友');
                return false;
            }
            
            // 合并更新
            friends[index] = { ...friends[index], ...updates };
            return this.saveData(this.KEYS.FRIENDS, friends);
        } catch (e) {
            console.error('❌ 更新好友失败:', e);
            return false;
        }
    }
    
    // 删除好友（软删除）
    deleteFriend(code) {
        try {
            const allFriends = this.getAllFriendsIncludingDeleted();
            const friend = allFriends.find(f => f.code === code);
            
            if (!friend) {
                console.error('❌ 找不到好友');
                return false;
            }
            
            // 软删除
            friend.isDeleted = true;
            friend.deletedAt = new Date().toISOString();
            
            return this.saveData(this.KEYS.FRIENDS, allFriends);
        } catch (e) {
            console.error('❌ 删除好友失败:', e);
            return false;
        }
    }
    
    // 恢复好友
    restoreFriend(code) {
        try {
            const allFriends = this.getAllFriendsIncludingDeleted();
            const friend = allFriends.find(f => f.code === code);
            
            if (!friend) {
                console.error('❌ 找不到好友');
                return false;
            }
            
            if (!friend.isDeleted) {
                console.error('❌ 好友未被删除');
                return false;
            }
            
            // 恢复好友
            friend.isDeleted = false;
            friend.deletedAt = null;
            
            return this.saveData(this.KEYS.FRIENDS, allFriends);
        } catch (e) {
            console.error('❌ 恢复好友失败:', e);
            return false;
        }
    }
    
    // ==================== 聊天记录相关 ====================
    
    // 获取所有聊天记录
    getChats() {
        return this.getData(this.KEYS.CHATS) || [];
    }
    
    // ==================== 聊天总结相关 ====================
    
    // 获取聊天总结列表
    getChatSummaries(friendCode) {
        const chat = this.getChatByFriendCode(friendCode);
        return chat?.summaries || [];
    }
    
    // 添加聊天总结
addChatSummary(friendCode, summary) {
    console.log('💾 添加聊天总结:', friendCode);
    
    const chats = this.getChats();
    const chat = chats.find(c => c.friendCode === friendCode);
    
    if (!chat) {
        console.error('❌ 找不到聊天记录');
        return false;
    }
    
    if (!chat.summaries) {
        chat.summaries = [];
    }
    
    // 生成总结ID
    const summaryId = 'summary_' + Date.now();
    
    // 添加总结
    const newSummary = {
        id: summaryId,
        date: summary.date,
        messageCount: summary.messageCount,
        startTime: summary.startTime,
        endTime: summary.endTime,
        summary: summary.summary,           // ← 新增：一句话总结
        content: summary.content,
        createdAt: new Date().toISOString()
    };
    
    chat.summaries.push(newSummary);
    
    // 保存 - 使用正确的key
    this.saveData(this.KEYS.CHATS, chats);  // ✅ 改成这个！
    console.log('✅ 总结添加成功');
    
    return summaryId;
}
    
    // 更新聊天总结
updateChatSummary(friendCode, summaryId, newContent) {
    console.log('💾 更新聊天总结:', summaryId);
    
    const chats = this.getChats();
    const chat = chats.find(c => c.friendCode === friendCode);
    
    if (!chat || !chat.summaries) {
        console.error('❌ 找不到聊天记录或总结列表');
        return false;
    }
    
    const summary = chat.summaries.find(s => s.id === summaryId);
    
    if (!summary) {
        console.error('❌ 找不到指定的总结');
        return false;
    }
    
    summary.content = newContent;
    summary.updatedAt = new Date().toISOString();
    
    this.saveData(this.KEYS.CHATS, chats);
    console.log('✅ 总结更新成功');
    
    return true;
}

   // 完整更新聊天总结（包括一句话总结和详细内容）
   updateChatSummaryFull(friendCode, summaryId, newSummary, newContent) {
    console.log('💾 完整更新聊天总结:', summaryId);
    
    const chats = this.getChats();
    const chat = chats.find(c => c.friendCode === friendCode);
    
    if (!chat || !chat.summaries) {
        console.error('❌ 找不到聊天记录或总结列表');
        return false;
    }
    
    const summary = chat.summaries.find(s => s.id === summaryId);
    
    if (!summary) {
        console.error('❌ 找不到指定的总结');
        return false;
    }
    
    summary.summary = newSummary;
    summary.content = newContent;
    summary.updatedAt = new Date().toISOString();
    
    this.saveData(this.KEYS.CHATS, chats);
    console.log('✅ 总结完整更新成功');
    
    return true;
}
    
    // 删除聊天总结
    deleteChatSummary(friendCode, summaryId) {
        console.log('💾 删除聊天总结:', summaryId);
        
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        
        if (!chat || !chat.summaries) {
            console.error('❌ 找不到聊天记录或总结列表');
            return false;
        }
        
        const index = chat.summaries.findIndex(s => s.id === summaryId);
        
        if (index === -1) {
            console.error('❌ 找不到指定的总结');
            return false;
        }
        
        chat.summaries.splice(index, 1);
        
        this.saveData(this.KEYS.CHATS, chats);
        console.log('✅ 总结删除成功');
        
        return true;
    }
    
    // ==================== 核心记忆相关 ====================

// 获取核心记忆列表
getCoreMemories(friendCode) {
    const chat = this.getChatByFriendCode(friendCode);
    return chat?.coreMemories || [];
}

// 添加核心记忆
addCoreMemory(friendCode, memoryData) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat) { console.error('❌ 找不到聊天记录'); return false; }
        if (!chat.coreMemories) chat.coreMemories = [];
        const id = 'coremem_' + Date.now();
        chat.coreMemories.push({
            id,
            date: memoryData.date,
            content: memoryData.content,
            createdAt: new Date().toISOString(),
            updatedAt: null
        });
        this.saveData(this.KEYS.CHATS, chats);
        console.log('✅ 核心记忆添加成功');
        return id;
    } catch (e) {
        console.error('❌ 添加核心记忆失败:', e);
        return false;
    }
}

// 更新核心记忆
updateCoreMemory(friendCode, memoryId, newDate, newContent) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat || !chat.coreMemories) return false;
        const mem = chat.coreMemories.find(m => m.id === memoryId);
        if (!mem) return false;
        mem.date = newDate;
        mem.content = newContent;
        mem.updatedAt = new Date().toISOString();
        this.saveData(this.KEYS.CHATS, chats);
        console.log('✅ 核心记忆更新成功');
        return true;
    } catch (e) {
        console.error('❌ 更新核心记忆失败:', e);
        return false;
    }
}

// 删除核心记忆
deleteCoreMemory(friendCode, memoryId) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat || !chat.coreMemories) return false;
        const idx = chat.coreMemories.findIndex(m => m.id === memoryId);
        if (idx === -1) return false;
        chat.coreMemories.splice(idx, 1);
        this.saveData(this.KEYS.CHATS, chats);
        console.log('✅ 核心记忆删除成功');
        return true;
    } catch (e) {
        console.error('❌ 删除核心记忆失败:', e);
        return false;
    }
}

// ==================== 记忆碎片相关 ====================

// 获取记忆碎片列表
getMemoryFragments(friendCode) {
    const chat = this.getChatByFriendCode(friendCode);
    return chat?.memoryFragments || [];
}

// 添加记忆碎片（由核心记忆移入）
addMemoryFragment(friendCode, fragmentData) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat) return false;
        if (!chat.memoryFragments) chat.memoryFragments = [];
        const id = 'fragment_' + Date.now();
        chat.memoryFragments.push({
            id,
            originalDate: fragmentData.originalDate,
            originalContent: fragmentData.originalContent,
            createdAt: fragmentData.createdAt,
            deletedAt: new Date().toISOString(),
            reason: fragmentData.reason
        });
        this.saveData(this.KEYS.CHATS, chats);
        console.log('✅ 记忆碎片已保存');
        return id;
    } catch(e) {
        console.error('❌ 添加记忆碎片失败:', e);
        return false;
    }
}

// 永久删除记忆碎片
deleteMemoryFragment(friendCode, fragmentId) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat || !chat.memoryFragments) return false;
        const idx = chat.memoryFragments.findIndex(f => f.id === fragmentId);
        if (idx === -1) return false;
        chat.memoryFragments.splice(idx, 1);
        this.saveData(this.KEYS.CHATS, chats);
        return true;
    } catch(e) {
        return false;
    }
}

    // ==================== 亲密关系相关 ====================

getIntimacyData(friendCode) {
    const chat = this.getChatByFriendCode(friendCode);
    return chat?.intimacyData || { totalRounds: 0 };
}

updateIntimacyData(friendCode, updates) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat) return false;
        if (!chat.intimacyData) chat.intimacyData = { totalRounds: 0 };
        chat.intimacyData = { ...chat.intimacyData, ...updates };
        this.saveData(this.KEYS.CHATS, chats);
        return true;
    } catch(e) { return false; }
}
    
    // 获取某个好友的聊天记录
    getChatByFriendCode(friendCode) {
        const chats = this.getData(this.KEYS.CHATS) || [];
        return chats.find(c => c.friendCode === friendCode);
    }
    
    // 保存消息
    addMessage(friendCode, message) {
        try {
            const chats = this.getData(this.KEYS.CHATS) || [];
            let chat = chats.find(c => c.friendCode === friendCode);
            
            if (!chat) {
                // 如果还没有聊天记录，创建新的
                chat = {
                    friendCode: friendCode,
                    messages: [],
                    tokenStats: {
                        worldBook: 0,
                        persona: 0,
                        chatHistory: 0,
                        input: 0,
                        output: 0,
                        total: 0,
                        lastUpdate: new Date().toISOString()
                    },
                    lastSummaryIndex: 0
                };
                chats.push(chat);
            }
            
            // 添加消息
            chat.messages.push(message);
            
            return this.saveData(this.KEYS.CHATS, chats);
        } catch (e) {
            console.error('❌ 保存消息失败:', e);
            return false;
        }
    }
    
    // ← 在这里添加新方法
// 替换整个消息列表（用于导入）
setMessages(friendCode, messages) {
    try {
        console.log('💾 setMessages() 被调用:', friendCode, messages.length, '条消息');
        
        const chats = this.getData(this.KEYS.CHATS) || [];
        let chat = chats.find(c => c.friendCode === friendCode);
        
        if (!chat) {
            // 如果还没有聊天记录，创建新的
            chat = {
                friendCode: friendCode,
                messages: [],
                tokenStats: {
                    worldBook: 0,
                    persona: 0,
                    chatHistory: 0,
                    input: 0,
                    output: 0,
                    total: 0,
                    lastUpdate: new Date().toISOString()
                },
                lastSummaryIndex: 0
            };
            chats.push(chat);
        }
        
        // 直接替换整个消息列表
        chat.messages = messages;
        
        const success = this.saveData(this.KEYS.CHATS, chats);
        
        if (success) {
            console.log('✅ 消息列表已替换:', friendCode);
        }
        
        return success;
    } catch (e) {
        console.error('❌ 替换消息列表失败:', e);
        return false;
    }
}
    
    // 更新Token统计
    updateTokenStats(friendCode, stats) {
        try {
            const chats = this.getData(this.KEYS.CHATS) || [];
            const chat = chats.find(c => c.friendCode === friendCode);
            
            if (!chat) {
                console.error('❌ 找不到聊天记录');
                return false;
            }
            
            chat.tokenStats = { ...chat.tokenStats, ...stats };
            return this.saveData(this.KEYS.CHATS, chats);
        } catch (e) {
            console.error('❌ 更新Token统计失败:', e);
            return false;
        }
    }
    
    // 删除聊天记录
    deleteChat(friendCode) {
        try {
            const chats = this.getData(this.KEYS.CHATS) || [];
            const filtered = chats.filter(c => c.friendCode !== friendCode);
            return this.saveData(this.KEYS.CHATS, filtered);
        } catch (e) {
            console.error('❌ 删除聊天记录失败:', e);
            return false;
        }
    }
    
    // ==================== 记忆总结相关 ====================
    
    // 获取某个好友的记忆总结
    getMemoriesByFriendCode(friendCode) {
        const memories = this.getData(this.KEYS.MEMORIES) || [];
        return memories.find(m => m.friendCode === friendCode);
    }
    
    // 添加记忆总结
    addMemorySummary(friendCode, summary) {
        try {
            const memories = this.getData(this.KEYS.MEMORIES) || [];
            let memory = memories.find(m => m.friendCode === friendCode);
            
            if (!memory) {
                memory = {
                    friendCode: friendCode,
                    summaries: []
                };
                memories.push(memory);
            }
            
            memory.summaries.push(summary);
            return this.saveData(this.KEYS.MEMORIES, memories);
        } catch (e) {
            console.error('❌ 添加记忆总结失败:', e);
            return false;
        }
    }
    
    // ==================== 用户设置相关 ====================
    
    // 获取用户设置
    getUserSettings() {
        return this.getData(this.KEYS.USER);
    }
    
    // 更新用户设置
    updateUserSettings(updates) {
        try {
            const current = this.getUserSettings();
            const updated = { ...current, ...updates };
            return this.saveData(this.KEYS.USER, updated);
        } catch (e) {
            console.error('❌ 更新用户设置失败:', e);
            return false;
        }
    }
    
    // ==================== 聊天设置相关 ====================
    
    // 获取某个好友的聊天设置
    getChatSettings(friendCode) {
        try {
            const key = `zero_phone_chat_settings_${friendCode}`;
            const settings = localStorage.getItem(key);
            return settings ? JSON.parse(settings) : null;
        } catch (e) {
            console.error('❌ 读取聊天设置失败:', e);
            return null;
        }
    }
    
    // 保存某个好友的聊天设置
    saveChatSettings(friendCode, settings) {
        try {
            const key = `zero_phone_chat_settings_${friendCode}`;
            localStorage.setItem(key, JSON.stringify(settings));
            console.log('💾 聊天设置已保存:', friendCode, settings);
            return true;
        } catch (e) {
            console.error('❌ 保存聊天设置失败:', e);
            return false;
        }
    }
    
    // 删除某个好友的聊天设置
    deleteChatSettings(friendCode) {
        try {
            const key = `zero_phone_chat_settings_${friendCode}`;
            localStorage.removeItem(key);
            console.log('🗑️ 聊天设置已删除:', friendCode);
            return true;
        } catch (e) {
            console.error('❌ 删除聊天设置失败:', e);
            return false;
        }
    }
    
    // ==================== 调试方法 ====================
    
    // 打印所有数据（用于调试）
    printAllData() {
        console.log('=== 所有数据 ===');
        console.log('好友:', this.getAllFriends());
        console.log('聊天:', this.getData(this.KEYS.CHATS));
        console.log('记忆:', this.getData(this.KEYS.MEMORIES));
        console.log('用户:', this.getUserSettings());
    }
    
    // ==================== 聊天列表隐藏相关 ====================

// 从聊天列表隐藏（不删消息）
hideChatFromList(friendCode) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat) return false;
        chat.hiddenFromList = true;
        this.saveData(this.KEYS.CHATS, chats);
        return true;
    } catch(e) { return false; }
}

// 恢复显示
showChatInList(friendCode) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat) return false;
        chat.hiddenFromList = false;
        this.saveData(this.KEYS.CHATS, chats);
        return true;
    } catch(e) { return false; }
}
// ==================== 聊天列表隐藏相关 ====================

/* ==========================================
   StorageManager 亲密关系模块扩展（修正版）
   把下面所有方法粘贴到 storage.js 中
   StorageManager 类的末尾 } 之前
   ========================================== */

// ==================== 幸运字符 ====================

getLuckyCharmData(friendCode) {
    const key = friendCode
        ? `zero_phone_lucky_charms_${friendCode}`
        : 'zero_phone_lucky_charms';
    try {
        const d = localStorage.getItem(key);
        return d ? JSON.parse(d) : this._defaultLuckyCharmData();
    } catch(e) { return this._defaultLuckyCharmData(); }
}


/* ============================================================
   storage.js 补丁 — 只需替换 _defaultLuckyCharmData 这一个方法
   找到原来的 _defaultLuckyCharmData() { ... } 整体替换成下面这个
   ============================================================ */

_defaultLuckyCharmData() {
    return {
        charms: [
            { id:'beauty',    name:'美好',   isBuiltin:true, img:'assets/images/lucky-chars/luck-beautiful.png' },
            { id:'cherish',   name:'珍爱',   isBuiltin:true, img:'assets/images/lucky-chars/luck-cherish.png' },
            { id:'destiny',   name:'宿命',   isBuiltin:true, img:'assets/images/lucky-chars/luck-destiny.png' },
            { id:'dreamland', name:'梦境',   isBuiltin:true, img:'assets/images/lucky-chars/luck-dreamland.png' },
            { id:'eternal',   name:'永恒',   isBuiltin:true, img:'assets/images/lucky-chars/luck-eternal.png' },
            { id:'exclusive', name:'专属',   isBuiltin:true, img:'assets/images/lucky-chars/luck-exclusive.png' },
            { id:'future',    name:'未来',   isBuiltin:true, img:'assets/images/lucky-chars/luck-future.png' },
            { id:'guardian',  name:'守护',   isBuiltin:true, img:'assets/images/lucky-chars/luck-guardian.png' },
            { id:'happiness', name:'幸福',   isBuiltin:true, img:'assets/images/lucky-chars/luck-happiness.png' },
            { id:'meet-you',  name:'遇见你', isBuiltin:true, img:'assets/images/lucky-chars/luck-meet-you.png' },
            { id:'merriment', name:'欢乐',   isBuiltin:true, img:'assets/images/lucky-chars/luck-merriment.png' },
            { id:'mine',      name:'我的',   isBuiltin:true, img:'assets/images/lucky-chars/luck-mine.png' },
            { id:'only',      name:'唯一',   isBuiltin:true, img:'assets/images/lucky-chars/luck-only.png' },
            { id:'sanctuary', name:'庇护所', isBuiltin:true, img:'assets/images/lucky-chars/luck-sanctuary.png' },
            { id:'starlight', name:'星光',   isBuiltin:true, img:'assets/images/lucky-chars/luck-starlight.png' },
            { id:'treasure',  name:'珍宝',   isBuiltin:true, img:'assets/images/lucky-chars/luck-treasure.png' }
        ],
        wearing:     { user: null, ai: null },
        litProgress: {},
        drawHistory: {},
        留言Pending: {}
    };
}

/*
   注意：如果你已经用过旧版本并且 localStorage 里有数据，
   名字不会自动更新（因为数据已经存进去了）。
   如果要强制刷新名字，可以在浏览器控制台里执行：
   
   localStorage.removeItem('zero_phone_lucky_charms');
   
   然后刷新页面，数据会用新名字重新初始化。
   （这会清掉之前的抽卡记录和佩戴状态，只在测试阶段用）
*/

saveLuckyCharmData(data, friendCode) {
    const key = friendCode
        ? `zero_phone_lucky_charms_${friendCode}`
        : 'zero_phone_lucky_charms';
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch(e) { return false; }
}


// ==================== 关系绑定 ====================

getRelationshipTypes() {
    return [
        { id:'bros',     name:'基友',  img:'assets/images/relationship/rel-bros.png' },
        { id:'couple',   name:'情侣',  img:'assets/images/relationship/rel-couple.png' },
        { id:'besties',  name:'闺蜜',  img:'assets/images/relationship/rel-besties.png' },
        { id:'partners', name:'死党',  img:'assets/images/relationship/rel-partners.png' }
    ];
}

getRelationshipBinding(friendCode) {
    const chat = this.getChatByFriendCode(friendCode);
    return chat?.relationshipBinding || null;
}

setRelationshipBinding(friendCode, binding) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat) return false;
        chat.relationshipBinding = { ...binding, boundAt: new Date().toISOString() };
        this.saveData(this.KEYS.CHATS, chats);
        return true;
    } catch(e) { return false; }
}

clearRelationshipBinding(friendCode) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat) return false;
        chat.relationshipBinding = null;
        this.saveData(this.KEYS.CHATS, chats);
        return true;
    } catch(e) { return false; }
}

// ==================== 亲密徽章 ====================

getBadgeDefinitions() {
    return [
        { id:'infinite-overdraft',    name:'无限透支',  img:'assets/images/intimacy-badges/badge-infinite-overdraft.png',
          desc:'你和TA在跨次元兑换所各完成5件事', type:'progress', goal:10 },
        { id:'absolute-shelter',      name:'绝对庇护',  img:'assets/images/intimacy-badges/badge-absolute-shelter.png',
          desc:'在0:00–5:00聊天累计30天（非连续）', type:'night_chat_days', goal:30 },
        { id:'time-anchor',           name:'时间锚点',  img:'assets/images/intimacy-badges/badge-time-anchor.png',
          desc:'互相交换早安+晚安累计60天', type:'greetings', goal:60 },
        { id:'exclusive-exception',   name:'专属例外',  img:'assets/images/intimacy-badges/badge-exclusive-exception.png',
          desc:'在0:00–5:00聊天累计7天', type:'night_chat_days_ex', goal:7 },
        { id:'only-route',            name:'唯一航道',  img:'assets/images/intimacy-badges/badge-only-route.png',
          desc:'小火花连续燃烧365天', type:'spark_days', goal:365 },
        { id:'sleep-guardian',        name:'睡眠守护',  img:'assets/images/intimacy-badges/badge-sleep-guardian.png',
          desc:'双方各说一次晚安', type:'goodnight_once', goal:2 },
        { id:'as-promised',           name:'如约而至',  img:'assets/images/intimacy-badges/badge-as-promised.png',
          desc:'双方各发送一条消息（即刻解锁）', type:'instant', goal:2 },
        { id:'dream-domain',          name:'梦境管辖',  img:'assets/images/intimacy-badges/badge-dream-domain.png',
          desc:'连续7天双方互道晚安（断开重计）', type:'goodnight_streak', goal:7 },
        { id:'heartbeat-limited',     name:'心动限定',  img:'assets/images/intimacy-badges/badge-heartbeat-limited.png',
          desc:'限定版：情人节发送「情人节快乐」；永久版：连续3年情人节', type:'valentines', goal:1, limitedGoal:3 }
    ];
}

getUnlockedBadges(friendCode) {
    const chat = this.getChatByFriendCode(friendCode);
    return chat?.unlockedBadges || [];
}

addUnlockedBadge(friendCode, badgeId, isLimited = false) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat) return false;
        if (!chat.unlockedBadges) chat.unlockedBadges = [];
        if (chat.unlockedBadges.find(b => b.id === badgeId)) return false;
        chat.unlockedBadges.push({ id: badgeId, unlockedAt: new Date().toISOString(), isLimited });
        this.saveData(this.KEYS.CHATS, chats);
        return true;
    } catch(e) { return false; }
}

getCustomBadges(friendCode) {
    try {
        const k = `zero_phone_custom_badges_${friendCode}`;
        const d = localStorage.getItem(k);
        return d ? JSON.parse(d) : [];
    } catch(e) { return []; }
}

saveCustomBadges(friendCode, badges) {
    try { localStorage.setItem(`zero_phone_custom_badges_${friendCode}`, JSON.stringify(badges)); return true; }
    catch(e) { return false; }
}

// ==================== 跨次元兑换所 ====================

getExchangeData(friendCode) {
    const chat = this.getChatByFriendCode(friendCode);
    return chat?.exchangeData || { todos:[], funds:[], shopping:[], delivery:[], letters:[] };
}

saveExchangeData(friendCode, data) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat) return false;
        chat.exchangeData = data;
        this.saveData(this.KEYS.CHATS, chats);
        return true;
    } catch(e) { return false; }
}

addExchangeItem(friendCode, category, item) {
    const data = this.getExchangeData(friendCode);
    if (!data[category]) data[category] = [];
    const id = `ex_${category}_${Date.now()}`;
    data[category].unshift({ id, createdAt: new Date().toISOString(), completed: false, ...item });
    this.saveExchangeData(friendCode, data);
    return id;
}

updateExchangeItem(friendCode, category, itemId, updates) {
    const data = this.getExchangeData(friendCode);
    if (!data[category]) return false;
    const idx = data[category].findIndex(i => i.id === itemId);
    if (idx === -1) return false;
    data[category][idx] = { ...data[category][idx], ...updates };
    return this.saveExchangeData(friendCode, data);
}

deleteExchangeItem(friendCode, category, itemId) {
    const data = this.getExchangeData(friendCode);
    if (!data[category]) return false;
    data[category] = data[category].filter(i => i.id !== itemId);
    return this.saveExchangeData(friendCode, data);
}

// ==================== 岁月胶囊 ====================

getTimeCapsules(friendCode) {
    const chat = this.getChatByFriendCode(friendCode);
    return chat?.timeCapsules || [];
}

addTimeCapsule(friendCode, capsule) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat) return false;
        if (!chat.timeCapsules) chat.timeCapsules = [];
        const id = `capsule_${Date.now()}`;
        chat.timeCapsules.unshift({ id, createdAt: new Date().toISOString(), ...capsule });
        this.saveData(this.KEYS.CHATS, chats);
        return id;
    } catch(e) { return false; }
}

updateTimeCapsule(friendCode, capsuleId, updates) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat || !chat.timeCapsules) return false;
        const idx = chat.timeCapsules.findIndex(c => c.id === capsuleId);
        if (idx === -1) return false;
        chat.timeCapsules[idx] = { ...chat.timeCapsules[idx], ...updates };
        this.saveData(this.KEYS.CHATS, chats);
        return true;
    } catch(e) { return false; }
}

// ==================== 星迹留痕 Timeline ====================

getStarTrailEvents(friendCode) {
    const chat = this.getChatByFriendCode(friendCode);
    return chat?.starTrailEvents || [];
}

addStarTrailEvent(friendCode, event) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat) return false;
        if (!chat.starTrailEvents) chat.starTrailEvents = [];
        const today = new Date().toISOString().slice(0,10);
        const dup = chat.starTrailEvents.find(e => e.type === event.type && e.refId === event.refId && e.date === today);
        if (dup) return dup.id;
        const id = `star_${Date.now()}`;
        chat.starTrailEvents.unshift({
            id, date: today, aiMessage: '', userMessage: '',
            ...event
        });
        this.saveData(this.KEYS.CHATS, chats);
        return id;
    } catch(e) { return false; }
}

updateStarTrailEvent(friendCode, eventId, updates) {
    try {
        const chats = this.getChats();
        const chat = chats.find(c => c.friendCode === friendCode);
        if (!chat || !chat.starTrailEvents) return false;
        const idx = chat.starTrailEvents.findIndex(e => e.id === eventId);
        if (idx === -1) return false;
        chat.starTrailEvents[idx] = { ...chat.starTrailEvents[idx], ...updates };
        this.saveData(this.KEYS.CHATS, chats);
        return true;
    } catch(e) { return false; }
}

}



// 导出（全局使用）
window.StorageManager = StorageManager;