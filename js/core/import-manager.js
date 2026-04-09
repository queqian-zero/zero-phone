/* Import Manager - 全量恢复版 */
class ImportManager {
    constructor() { this.storage = new StorageManager(); }
    
    async importFull() {
        try {
            const file = await this.selectFile(); if(!file) return false;
            const content = await this.readFile(file);
            let data = file.name.endsWith('.json') ? JSON.parse(content) : this.parseTXT(content);
            
            if(!confirm('确定要导入数据吗？\n\n这将覆盖当前所有数据！')) return false;
            
            // 优先用_rawStorage全量恢复（v2.1+）
            if(data._rawStorage && typeof data._rawStorage === 'object') {
                Object.entries(data._rawStorage).forEach(([key, value]) => {
                    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                });
                alert('✅ 全量恢复成功！页面即将刷新。');
                location.reload();
                return true;
            }
            
            // 兼容旧格式
            if(data.friends) this.storage.saveData(this.storage.KEYS.FRIENDS, data.friends);
            if(data.chats) this.storage.saveData(this.storage.KEYS.CHATS, data.chats);
            if(data.memories) this.storage.saveData(this.storage.KEYS.MEMORIES, data.memories);
            if(data.userSettings) this.storage.saveData(this.storage.KEYS.USER, data.userSettings);
            if(data.intimacyData && typeof data.intimacyData === 'object') {
                Object.entries(data.intimacyData).forEach(([fc, d]) => { this.storage.saveData('zero_phone_intimacy_'+fc, d); });
            }
            if(data.intimacyConfig) this.storage.saveData('zero_phone_intimacy_config', data.intimacyConfig);
            
            alert('✅ 导入成功！页面即将刷新。');
            location.reload();
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
                    
                    // 全量快照格式
                    if(data.type==='full_dump' && data.data) {
                        Object.entries(data.data).forEach(([key,value])=>{localStorage.setItem(key,typeof value==='string'?value:JSON.stringify(value));});
                    }
                    else if(data.type==='friends') this.storage.saveData(this.storage.KEYS.FRIENDS,data.data);
                    else if(data.type==='chats') this.storage.saveData(this.storage.KEYS.CHATS,data.data);
                    else if(data.type==='memories') this.storage.saveData(this.storage.KEYS.MEMORIES,data.data);
                    else if(data.type==='intimacy') { if(data.data)Object.entries(data.data).forEach(([fc,d])=>{this.storage.saveData('zero_phone_intimacy_'+fc,d);}); if(data.config)this.storage.saveData('zero_phone_intimacy_config',data.config); }
                    else if(data.type==='settings') this.storage.saveData(this.storage.KEYS.USER,data.data);
                    
                    // 也尝试_rawStorage
                    if(data._rawStorage) Object.entries(data._rawStorage).forEach(([k,v])=>{localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));});
                    
                    await this.delay(100);
                }catch(e){console.error('导入文件失败 '+file.name+':',e);}
            }
            
            document.body.removeChild(p);
            alert('✅ 导入完成！页面即将刷新。');
            location.reload();
            return true;
        }catch(e){console.error('导入失败:',e);alert('导入失败: '+e.message);return false;}
    }
    
    async importPartial() {
        try{
            const file=await this.selectFile();if(!file)return false;
            const content=await this.readFile(file);
            let data=file.name.endsWith('.json')?JSON.parse(content):this.parseTXT(content);
            if(data.type!=='partial'||!data.friends){alert('该文件不是部分导出格式');return false;}
            if(!confirm('即将导入 '+data.friends.length+' 个好友的数据，继续？'))return false;
            
            const curFriends=this.storage.getAllFriendsIncludingDeleted();
            const curChats=this.storage.getData(this.storage.KEYS.CHATS)||[];
            
            data.friends.forEach(ef=>{
                const idx=curFriends.findIndex(f=>f.code===ef.code);
                if(idx>=0){
                    // 合并所有好友字段
                    Object.keys(ef).forEach(k=>{if(k!=='code'&&k!=='chatData'&&k!=='intimacyData')curFriends[idx][k]=ef[k];});
                }
                if(ef.chatData){
                    const ci=curChats.findIndex(c=>c.friendCode===ef.code);
                    if(ci>=0)curChats[ci]=ef.chatData;else curChats.push(ef.chatData);
                }
                if(ef.intimacyData) this.storage.saveData('zero_phone_intimacy_'+ef.code,ef.intimacyData);
            });
            
            this.storage.saveData(this.storage.KEYS.FRIENDS,curFriends);
            this.storage.saveData(this.storage.KEYS.CHATS,curChats);
            
            alert('✅ 部分导入成功！页面即将刷新。');
            location.reload();
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
