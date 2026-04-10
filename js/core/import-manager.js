/* Import Manager - 显式等待IDB写入版 */
class ImportManager {
    constructor() { this.storage = new StorageManager(); }
    
    async _saveAndWait(key, value) {
        this.storage._cache[key] = value;
        try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
        for (let i = 0; i < 50; i++) { if (this.storage._dbReady && this.storage._db) break; await new Promise(r => setTimeout(r, 100)); }
        if (this.storage._db) { try { await this.storage._idbSet(key, value); } catch(e) { console.warn('IDB写入失败:', key); } }
    }
    
    _showProgress(text) { let p = document.getElementById('importProgress'); if (!p) { p = document.createElement('div'); p.id = 'importProgress'; p.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(30,30,30,0.95);color:#fff;padding:20px 30px;border-radius:12px;font-size:14px;z-index:99999;text-align:center;min-width:200px;'; document.body.appendChild(p); } p.textContent = text; }
    _hideProgress() { document.getElementById('importProgress')?.remove(); }
    
    async importFull() {
        try {
            const file = await this.selectFile(); if (!file) return false;
            const content = await this.readFile(file);
            let data = file.name.endsWith('.json') ? JSON.parse(content) : this.parseTXT(content);
            if (!confirm('确定要导入吗？将覆盖当前所有数据！')) return false;
            this._showProgress('正在导入...'); let count = 0;
            if (data._rawStorage && typeof data._rawStorage === 'object') { const e = Object.entries(data._rawStorage); for (let i = 0; i < e.length; i++) { this._showProgress('写入 '+(i+1)+'/'+e.length); await this._saveAndWait(e[i][0], e[i][1]); count++; } }
            if (data.friends) { await this._saveAndWait(this.storage.KEYS.FRIENDS, data.friends); count++; }
            if (data.chats) { await this._saveAndWait(this.storage.KEYS.CHATS, data.chats); count++; }
            if (data.memories) { await this._saveAndWait(this.storage.KEYS.MEMORIES, data.memories); count++; }
            if (data.userSettings) { this._showProgress('写入用户设置...'); await this._saveAndWait(this.storage.KEYS.USER, data.userSettings); count++; }
            if (data.intimacyData) { for (const [fc, d] of Object.entries(data.intimacyData)) { await this._saveAndWait('zero_phone_intimacy_'+fc, d); count++; } }
            if (data.intimacyConfig) { await this._saveAndWait('zero_phone_intimacy_config', data.intimacyConfig); count++; }
            this._hideProgress(); alert('✅ 导入成功（'+count+'条）！页面即将刷新。'); location.reload(); return true;
        } catch(e) { this._hideProgress(); alert('导入失败: '+e.message); return false; }
    }
    
    async importStream() {
        try {
            const files = await this.selectMultipleFiles(); if (!files?.length) return false;
            if (!confirm('导入 '+files.length+' 个文件？')) return false;
            for (let i = 0; i < files.length; i++) { const file = files[i]; this._showProgress('导入 '+(i+1)+'/'+files.length+': '+file.name);
                try { const content = await this.readFile(file); let data = file.name.endsWith('.json') ? JSON.parse(content) : this.parseTXT(content);
                    if (data.type==='full_dump'&&data.data) { for (const [k,v] of Object.entries(data.data)) await this._saveAndWait(k,v); }
                    if (data._rawStorage) { for (const [k,v] of Object.entries(data._rawStorage)) await this._saveAndWait(k,v); }
                    if (data.type==='friends') await this._saveAndWait(this.storage.KEYS.FRIENDS,data.data);
                    else if (data.type==='chats') await this._saveAndWait(this.storage.KEYS.CHATS,data.data);
                    else if (data.type==='memories') await this._saveAndWait(this.storage.KEYS.MEMORIES,data.data);
                    else if (data.type==='intimacy') { if(data.data) for(const[fc,d]of Object.entries(data.data))await this._saveAndWait('zero_phone_intimacy_'+fc,d); if(data.config)await this._saveAndWait('zero_phone_intimacy_config',data.config); }
                    else if (data.type==='settings') await this._saveAndWait(this.storage.KEYS.USER,data.data);
                    if (data.friends&&!data.type) await this._saveAndWait(this.storage.KEYS.FRIENDS,data.friends);
                    if (data.userSettings) await this._saveAndWait(this.storage.KEYS.USER,data.userSettings);
                } catch(e) { console.error('导入失败 '+file.name+':',e); }
            }
            this._hideProgress(); alert('✅ 导入完成！页面即将刷新。'); location.reload(); return true;
        } catch(e) { this._hideProgress(); alert('导入失败: '+e.message); return false; }
    }
    
    async importPartial() {
        try {
            const file = await this.selectFile(); if (!file) return false;
            const content = await this.readFile(file);
            let data = file.name.endsWith('.json') ? JSON.parse(content) : this.parseTXT(content);
            if (data.type!=='partial') { alert('不是部分导出格式'); return false; }
            let desc=[]; if(data.friends)desc.push(data.friends.length+'个好友'); if(data.userSettings)desc.push('用户设置'); if(data.apiConfig)desc.push('API配置');
            if (!confirm('导入：'+(desc.join('、')||'数据')+'？')) return false;
            this._showProgress('正在导入...');
            if (data.userSettings) { this._showProgress('写入用户设置...'); await this._saveAndWait(this.storage.KEYS.USER, data.userSettings); }
            if (data.friends) {
                const curF=this.storage.getAllFriendsIncludingDeleted(); const curC=this.storage.getData(this.storage.KEYS.CHATS)||[];
                const skip=new Set(['code','messages','chatSettings','summaries','coreMemories','memoryFragments','notebook','journal','theaterSessions','aiState','luckyChars','relationship','badges','exchange','capsule','timeline','value','totalMessages','todayMessages','bgImage','worldbooks','chatData','intimacyData']);
                for (let fi=0;fi<data.friends.length;fi++) {
                    const ef=data.friends[fi]; const fc=ef.code;
                    this._showProgress('好友 '+(fi+1)+'/'+data.friends.length);
                    const idx=curF.findIndex(f=>f.code===fc);
                    if(idx>=0) Object.keys(ef).forEach(k=>{if(!skip.has(k))curF[idx][k]=ef[k];});
                    if(ef.messages){const ci=curC.findIndex(c=>c.friendCode===fc);if(ci>=0){curC[ci].messages=ef.messages;if(ef.chatSettings)curC[ci].settings=ef.chatSettings;}else curC.push({friendCode:fc,messages:ef.messages,settings:ef.chatSettings||{}});}
                    if(ef.summaries||ef.coreMemories||ef.memoryFragments){const ci=curC.findIndex(c=>c.friendCode===fc);if(ci>=0){if(ef.summaries)curC[ci].summaries=ef.summaries;if(ef.coreMemories)curC[ci].coreMemories=ef.coreMemories;if(ef.memoryFragments)curC[ci].memoryFragments=ef.memoryFragments;}}
                    const curI=this.storage.getIntimacyData(fc); let ch=false;
                    if(ef.notebook){curI.notebook=ef.notebook;ch=true;} if(ef.journal){curI.journal=ef.journal;ch=true;} if(ef.theaterSessions){curI.theaterSessions=ef.theaterSessions;ch=true;} if(ef.aiState){curI.aiState=ef.aiState;ch=true;} if(ef.luckyChars){curI.luckyChars=ef.luckyChars;ch=true;} if(ef.relationship){curI.relationship=ef.relationship;ch=true;} if(ef.badges){curI.badges=ef.badges;ch=true;} if(ef.exchange){curI.exchange=ef.exchange;ch=true;} if(ef.capsule){curI.capsule=ef.capsule;ch=true;} if(ef.timeline){curI.timeline=ef.timeline;ch=true;} if(ef.value!==undefined){curI.value=ef.value;ch=true;} if(ef.bgImage){curI.bgImage=ef.bgImage;ch=true;}
                    if(ef.intimacyData) await this._saveAndWait('zero_phone_intimacy_'+fc,ef.intimacyData);
                    else if(ch) await this._saveAndWait('zero_phone_intimacy_'+fc,curI);
                }
                this._showProgress('保存好友数据...'); await this._saveAndWait(this.storage.KEYS.FRIENDS,curF); await this._saveAndWait(this.storage.KEYS.CHATS,curC);
            }
            this._hideProgress(); alert('✅ 部分导入成功！页面即将刷新。'); location.reload(); return true;
        } catch(e) { this._hideProgress(); alert('导入失败: '+e.message); return false; }
    }
    
    selectFile(){return new Promise(r=>{const i=document.createElement('input');i.type='file';i.accept='.json,.txt';i.onchange=e=>r(e.target.files[0]);i.click();});}
    selectMultipleFiles(){return new Promise(r=>{const i=document.createElement('input');i.type='file';i.accept='.json,.txt';i.multiple=true;i.onchange=e=>r(Array.from(e.target.files));i.click();});}
    readFile(f){return new Promise((r,j)=>{const rd=new FileReader();rd.onload=e=>r(e.target.result);rd.onerror=e=>j(e);rd.readAsText(f);});}
    parseTXT(c){try{const m=c.match(/\{[\s\S]*\}/);if(m)return JSON.parse(m[0]);throw new Error('x');}catch(e){throw new Error('TXT格式不正确');}}
}
window.ImportManager=ImportManager;
