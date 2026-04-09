/* Export Manager - 全量扫描版，一个key都不漏 */
class ExportManager {
    constructor() { this.storage = new StorageManager(); }
    
    _getAllStorageData() {
        const r = {};
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('zero_phone')) {
                try { r[k] = JSON.parse(localStorage.getItem(k)); } catch(e) { r[k] = localStorage.getItem(k); }
            }
        }
        return r;
    }
    
    exportFull(format = 'json') {
        try {
            const data = { version:'2.1.0', exportTime:new Date().toISOString(), _rawStorage:this._getAllStorageData(), friends:this.storage.getAllFriendsIncludingDeleted(), chats:this.storage.getData(this.storage.KEYS.CHATS)||[], memories:this.storage.getData(this.storage.KEYS.MEMORIES)||[], userSettings:this.storage.getUserSettings(), apiConfig:new APIManager().getCurrentConfig(), apiPresets:new APIManager().getPresets(), minimaxConfig:new APIManager().getMinimaxConfig() };
            if (format==='json') this.downloadJSON(data,'zero-phone-full-export.json'); else this.downloadTXT(this.convertToTXT(data),'zero-phone-full-export.txt');
            return true;
        } catch(e) { console.error('导出失败:',e); return false; }
    }
    
    async exportStream(format='json') {
        try {
            const p=document.createElement('div'); p.innerHTML='正在导出...'; p.style.cssText='position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.12);color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:10000;backdrop-filter:blur(10px);'; document.body.appendChild(p);
            setTimeout(()=>{
                try {
                    const d={exportTime:new Date().toISOString(),type:'full_dump',version:'2.1.0',data:this._getAllStorageData()};
                    if(format==='json')this.downloadJSON(d,'zero-phone-full-dump.json'); else this.downloadTXT(this.convertToTXT(d),'zero-phone-full-dump.txt');
                    document.body.removeChild(p);
                    const m=document.createElement('div');m.innerHTML='✅ 导出完成！';m.style.cssText=p.style.cssText;document.body.appendChild(m);setTimeout(()=>document.body.removeChild(m),2000);
                }catch(e){console.error('导出失败:',e);document.body.removeChild(p);}
            },100);
            return true;
        }catch(e){console.error('导出失败:',e);return false;}
    }
    
    exportPartial(options,format='json') {
        try {
            const data={version:'2.1.0',exportTime:new Date().toISOString(),type:'partial'};
            if(options.worldbook) data.worldbook=[];
            if(options.friends) {
                const friends=this.storage.getAllFriendsIncludingDeleted();
                data.friends=friends.map(f=>{
                    const ef={code:f.code};
                    if(options.persona) Object.assign(ef,f);
                    if(options.chats){const c=(this.storage.getData(this.storage.KEYS.CHATS)||[]).find(c=>c.friendCode===f.code);if(c)ef.chatData=c;}
                    if(options.memories){const raw=localStorage.getItem('zero_phone_intimacy_'+f.code);if(raw)try{ef.intimacyData=JSON.parse(raw);}catch(e){}}
                    return ef;
                });
            }
            if(format==='json')this.downloadJSON(data,'zero-phone-partial-export.json'); else this.downloadTXT(this.convertToTXT(data),'zero-phone-partial-export.txt');
            return true;
        }catch(e){console.error('部分导出失败:',e);return false;}
    }
    
    downloadJSON(d,f){const j=JSON.stringify(d,null,2);this.downloadBlob(new Blob([j],{type:'application/json'}),f);}
    downloadTXT(t,f){this.downloadBlob(new Blob([t],{type:'text/plain;charset=utf-8'}),f);}
    downloadBlob(b,f){const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download=f;document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);}
    convertToTXT(data){
        let t='='.repeat(50)+'\nZero Phone 数据导出\n'+new Date().toISOString()+'\n'+'='.repeat(50)+'\n\n';
        const cv=(o,i=0)=>{let r='';const sp='  '.repeat(i);for(const[k,v]of Object.entries(o)){if(v==null)continue;if(typeof v==='object'&&!Array.isArray(v)){r+=sp+k+':\n'+cv(v,i+1);}else if(Array.isArray(v)){r+=sp+k+': ['+v.length+'项]\n';}else{const s=String(v);r+=sp+k+': '+(s.length>150?s.substring(0,150)+'...':s)+'\n';}}return r;};
        t+=cv(data);return t;
    }
    delay(ms){return new Promise(r=>setTimeout(r,ms));}
}
window.ExportManager=ExportManager;
