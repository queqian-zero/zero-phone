/* Import Manager - 全量恢复版（支持大数据/IDB） */
class ImportManager {
    constructor() { this.storage = new StorageManager(); }
    
    async importFull() {
        try {
            const file = await this.selectFile(); if(!file) return false;
            const content = await this.readFile(file);
            let data = file.name.endsWith('.json') ? JSON.parse(content) : this.parseTXT(content);
            
            if(!confirm('确定要导入数据吗？\n\n这将覆盖当前所有数据！')) return false;
            
            let count = 0;
            
            // 优先用_rawStorage全量恢复（v2.1+）
            if(data._rawStorage && typeof data._rawStorage === 'object') {
                Object.entries(data._rawStorage).forEach(([key, value]) => {
                    this.storage.saveData(key, value); // 用saveData走缓存+IDB，不直接写localStorage
                    count++;
                });
            }
            
            // 结构化数据（兼容+补充）
            if(data.friends) { this.storage.saveData(this.storage.KEYS.FRIENDS, data.friends); count++; }
            if(data.chats) { this.storage.saveData(this.storage.KEYS.CHATS, data.chats); count++; }
            if(data.memories) { this.storage.saveData(this.storage.KEYS.MEMORIES, data.memories); count++; }
            if(data.userSettings) { this.storage.saveData(this.storage.KEYS.USER, data.userSettings); count++; }
            if(data.intimacyData && typeof data.intimacyData === 'object') {
                Object.entries(data.intimacyData).forEach(([fc, d]) => { this.storage.saveData('zero_phone_intimacy_'+fc, d); count++; });
            }
            if(data.intimacyConfig) { this.storage.saveData('zero_phone_intimacy_config', data.intimacyConfig); count++; }
            
            // 等待IDB写入完成再刷新
            alert('✅ 导入成功（' + count + '条数据）！页面即将刷新。');
            setTimeout(() => location.reload(), 500);
            return true;
        } catch(e) { console.error('导入失败:',e); alert('导入失败: '+e.message); return false; }
    }
    
    async importStream() {
        try {
            const files = await this.selectMultipleFiles(); if(!files||files.length===0) return false;
            if(!confirm('确定要导入 '+files.length+' 个文件吗？')) return false;
            
            const p=document.createElement('div'); p.innerHTML='正在导入...'; p.style.cssText='position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.12);color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:10000;backdrop-filter:blur(10px);'; document.body.appendChild(p);
            
            for(let i=0;i<files.length;i++){
                const file=files[i]; p.innerHTML='导入 '+(i+1)+'/'+files.length+': '+file.name;
                try{
                    const content=await this.readFile(file);
                    let data=file.name.endsWith('.json')?JSON.parse(content):this.parseTXT(content);
                    
                    if(data.type==='full_dump' && data.data) {
                        Object.entries(data.data).forEach(([key,value])=>{ this.storage.saveData(key, value); });
                    }
                    if(data._rawStorage) {
                        Object.entries(data._rawStorage).forEach(([k,v])=>{ this.storage.saveData(k, v); });
                    }
                    if(data.type==='friends') this.storage.saveData(this.storage.KEYS.FRIENDS,data.data);
                    else if(data.type==='chats') this.storage.saveData(this.storage.KEYS.CHATS,data.data);
                    else if(data.type==='memories') this.storage.saveData(this.storage.KEYS.MEMORIES,data.data);
                    else if(data.type==='intimacy') { if(data.data)Object.entries(data.data).forEach(([fc,d])=>{this.storage.saveData('zero_phone_intimacy_'+fc,d);}); if(data.config)this.storage.saveData('zero_phone_intimacy_config',data.config); }
                    else if(data.type==='settings') this.storage.saveData(this.storage.KEYS.USER,data.data);
                    
                    // 结构化字段
                    if(data.friends) this.storage.saveData(this.storage.KEYS.FRIENDS,data.friends);
                    if(data.chats) this.storage.saveData(this.storage.KEYS.CHATS,data.chats);
                    if(data.userSettings) this.storage.saveData(this.storage.KEYS.USER,data.userSettings);
                    
                    await this.delay(100);
                }catch(e){console.error('导入文件失败 '+file.name+':',e);}
            }
            
            document.body.removeChild(p);
            alert('✅ 导入完成！页面即将刷新。');
            setTimeout(() => location.reload(), 500);
            return true;
        }catch(e){console.error('导入失败:',e);alert('导入失败: '+e.message);return false;}
    }
    
    async importPartial() {
        try{
            const file=await this.selectFile();if(!file)return false;
            const content=await this.readFile(file);
            let data=file.name.endsWith('.json')?JSON.parse(content):this.parseTXT(content);
            if(data.type!=='partial'){alert('该文件不是部分导出格式');return false;}
            
            let desc = [];
            if(data.friends) desc.push(data.friends.length + '个好友');
            if(data.userSettings) desc.push('用户设置');
            if(data.apiConfig) desc.push('API配置');
            if(!confirm('即将导入：' + desc.join('、') + '\n继续？'))return false;
            
            // 用户设置
            if(data.userSettings) this.storage.saveData(this.storage.KEYS.USER, data.userSettings);
            
            // API配置
            if(data.apiConfig) {
                try { new APIManager().saveConfig(data.apiConfig); } catch(e) {}
            }
            
            // 好友数据
            if(data.friends) {
                const curFriends=this.storage.getAllFriendsIncludingDeleted();
                const curChats=this.storage.getData(this.storage.KEYS.CHATS)||[];
                
                data.friends.forEach(ef=>{
                    const fc = ef.code;
                    
                    // 合并好友基本信息
                    const idx=curFriends.findIndex(f=>f.code===fc);
                    if(idx>=0) {
                        const skip = new Set(['code','messages','chatSettings','summaries','coreMemories','memoryFragments','notebook','journal','theaterSessions','aiState','luckyChars','relationship','badges','exchange','capsule','timeline','value','totalMessages','todayMessages','bgImage','worldbooks','chatData','intimacyData']);
                        Object.keys(ef).forEach(k=>{if(!skip.has(k))curFriends[idx][k]=ef[k];});
                    }
                    
                    // 聊天记录+设置
                    if(ef.messages) {
                        const ci=curChats.findIndex(c=>c.friendCode===fc);
                        if(ci>=0) { curChats[ci].messages=ef.messages; if(ef.chatSettings)curChats[ci].settings=ef.chatSettings; }
                        else curChats.push({friendCode:fc,messages:ef.messages,settings:ef.chatSettings||{}});
                    }
                    
                    // 总结+核心记忆+碎片
                    if(ef.summaries||ef.coreMemories||ef.memoryFragments) {
                        const ci=curChats.findIndex(c=>c.friendCode===fc);
                        if(ci>=0) {
                            if(ef.summaries) curChats[ci].summaries=ef.summaries;
                            if(ef.coreMemories) curChats[ci].coreMemories=ef.coreMemories;
                            if(ef.memoryFragments) curChats[ci].memoryFragments=ef.memoryFragments;
                        }
                    }
                    
                    // 亲密关系数据（按块合并到现有数据）
                    const curIntim = this.storage.getIntimacyData(fc);
                    let intimChanged = false;
                    
                    if(ef.notebook) { curIntim.notebook = ef.notebook; intimChanged = true; }
                    if(ef.journal) { curIntim.journal = ef.journal; intimChanged = true; }
                    if(ef.theaterSessions) { curIntim.theaterSessions = ef.theaterSessions; intimChanged = true; }
                    if(ef.aiState) { curIntim.aiState = ef.aiState; intimChanged = true; }
                    if(ef.luckyChars) { curIntim.luckyChars = ef.luckyChars; intimChanged = true; }
                    if(ef.relationship) { curIntim.relationship = ef.relationship; intimChanged = true; }
                    if(ef.badges) { curIntim.badges = ef.badges; intimChanged = true; }
                    if(ef.exchange) { curIntim.exchange = ef.exchange; intimChanged = true; }
                    if(ef.capsule) { curIntim.capsule = ef.capsule; intimChanged = true; }
                    if(ef.timeline) { curIntim.timeline = ef.timeline; intimChanged = true; }
                    if(ef.value !== undefined) { curIntim.value = ef.value; intimChanged = true; }
                    if(ef.bgImage) { curIntim.bgImage = ef.bgImage; intimChanged = true; }
                    
                    // 兼容旧格式（整个intimacyData）
                    if(ef.intimacyData) { this.storage.saveData('zero_phone_intimacy_'+fc, ef.intimacyData); }
                    else if(intimChanged) { this.storage.saveData('zero_phone_intimacy_'+fc, curIntim); }
                });
                
                this.storage.saveData(this.storage.KEYS.FRIENDS,curFriends);
                this.storage.saveData(this.storage.KEYS.CHATS,curChats);
            }
            
            alert('✅ 部分导入成功！页面即将刷新。');
            setTimeout(() => location.reload(), 500);
            return true;
        }catch(e){console.error('部分导入失败:',e);alert('导入失败: '+e.message);return false;}
    }
    
    selectFile(){return new Promise(r=>{const i=document.createElement('input');i.type='file';i.accept='.json,.txt';i.onchange=e=>r(e.target.files[0]);i.click();});}
    selectMultipleFiles(){return new Promise(r=>{const i=document.createElement('input');i.type='file';i.accept='.json,.txt';i.multiple=true;i.onchange=e=>r(Array.from(e.target.files));i.click();});}
    readFile(f){return new Promise((r,j)=>{const rd=new FileReader();rd.onload=e=>r(e.target.result);rd.onerror=e=>j(e);rd.readAsText(f);});}
    parseTXT(c){try{const m=c.match(/\{[\s\S]*\}/);if(m)return JSON.parse(m[0]);throw new Error('无法解析');}catch(e){throw new Error('TXT文件格式不正确');}}
    delay(ms){return new Promise(r=>setTimeout(r,ms));}
}
window.ImportManager=ImportManager;
