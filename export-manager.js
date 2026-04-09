/* Export Manager - 导出功能管理（含所有新功能数据） */

class ExportManager {
    constructor() {
        this.storage = new StorageManager();
    }
    
    // ==================== 完整导出 ====================
    exportFull(format = 'json') {
        try {
            const friends = this.storage.getAllFriendsIncludingDeleted();
            
            // 收集每个好友的亲密关系数据
            const intimacyDataMap = {};
            friends.forEach(f => {
                const d = this.storage.getIntimacyData(f.code);
                if (d && Object.keys(d).length > 0) intimacyDataMap[f.code] = d;
            });
            
            const data = {
                version: '2.0.0',
                exportTime: new Date().toISOString(),
                friends: friends,
                chats: this.storage.getData(this.storage.KEYS.CHATS) || [],
                memories: this.storage.getData(this.storage.KEYS.MEMORIES) || [],
                userSettings: this.storage.getUserSettings(),
                intimacyData: intimacyDataMap,
                intimacyConfig: this.storage.getIntimacyConfig ? this.storage.getIntimacyConfig() : (this.storage.getData('zero_phone_intimacy_config') || {}),
                apiConfig: new APIManager().getCurrentConfig(),
                apiPresets: new APIManager().getPresets(),
                minimaxConfig: new APIManager().getMinimaxConfig()
            };
            
            if (format === 'json') {
                this.downloadJSON(data, 'zero-phone-full-export.json');
            } else {
                this.downloadTXT(this.convertToTXT(data), 'zero-phone-full-export.txt');
            }
            return true;
        } catch (e) {
            console.error('❌ 完整导出失败:', e);
            return false;
        }
    }
    
    // ==================== 流式导出 ====================
    async exportStream(format = 'json') {
        try {
            const progressMsg = document.createElement('div');
            progressMsg.innerHTML = '正在后台导出...';
            progressMsg.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.12);color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:10000;backdrop-filter:blur(10px);';
            document.body.appendChild(progressMsg);
            
            setTimeout(async () => {
                try {
                    const friends = this.storage.getAllFriendsIncludingDeleted();
                    
                    // 好友+人设+亲密关系数据
                    const friendsData = { exportTime: new Date().toISOString(), type: 'friends', data: friends };
                    const intimacyMap = {};
                    friends.forEach(f => {
                        const d = this.storage.getIntimacyData(f.code);
                        if (d && Object.keys(d).length > 0) intimacyMap[f.code] = d;
                    });
                    const intimacyExport = { exportTime: new Date().toISOString(), type: 'intimacy', data: intimacyMap, config: this.storage.getData('zero_phone_intimacy_config') || {} };
                    
                    // 聊天记录（含总结、核心记忆、设置）
                    const chatsData = { exportTime: new Date().toISOString(), type: 'chats', data: this.storage.getData(this.storage.KEYS.CHATS) || [] };
                    
                    // 记忆库
                    const memoriesData = { exportTime: new Date().toISOString(), type: 'memories', data: this.storage.getData(this.storage.KEYS.MEMORIES) || [] };
                    
                    // 用户设置（含base64图库、自定义模板等）
                    const settingsData = { exportTime: new Date().toISOString(), type: 'settings', data: this.storage.getUserSettings() };
                    
                    if (format === 'json') {
                        this.downloadJSON(friendsData, 'zero-phone-friends.json');
                        await this.delay(100);
                        this.downloadJSON(chatsData, 'zero-phone-chats.json');
                        await this.delay(100);
                        this.downloadJSON(memoriesData, 'zero-phone-memories.json');
                        await this.delay(100);
                        this.downloadJSON(intimacyExport, 'zero-phone-intimacy.json');
                        await this.delay(100);
                        this.downloadJSON(settingsData, 'zero-phone-settings.json');
                    } else {
                        this.downloadTXT(this.convertToTXT(friendsData), 'zero-phone-friends.txt');
                        await this.delay(100);
                        this.downloadTXT(this.convertToTXT(chatsData), 'zero-phone-chats.txt');
                        await this.delay(100);
                        this.downloadTXT(this.convertToTXT(memoriesData), 'zero-phone-memories.txt');
                        await this.delay(100);
                        this.downloadTXT(this.convertToTXT(intimacyExport), 'zero-phone-intimacy.txt');
                        await this.delay(100);
                        this.downloadTXT(this.convertToTXT(settingsData), 'zero-phone-settings.txt');
                    }
                    
                    document.body.removeChild(progressMsg);
                    const msg = document.createElement('div');
                    msg.innerHTML = '✅ 流式导出完成！';
                    msg.style.cssText = progressMsg.style.cssText;
                    document.body.appendChild(msg);
                    setTimeout(() => document.body.removeChild(msg), 2000);
                } catch (e) {
                    console.error('❌ 流式导出失败:', e);
                    document.body.removeChild(progressMsg);
                }
            }, 100);
            return true;
        } catch (e) {
            console.error('❌ 流式导出失败:', e);
            return false;
        }
    }
    
    // ==================== 部分导出 ====================
    exportPartial(options, format = 'json') {
        try {
            const data = { version: '2.0.0', exportTime: new Date().toISOString(), type: 'partial' };
            
            if (options.worldbook) data.worldbook = [];
            
            if (options.friends) {
                const friends = this.storage.getAllFriendsIncludingDeleted();
                data.friends = friends.map(friend => {
                    const ef = { code: friend.code };
                    
                    if (options.persona) {
                        ef.name = friend.name;
                        ef.nickname = friend.nickname;
                        ef.persona = friend.persona;
                        ef.signature = friend.signature;
                        ef.avatar = friend.avatar;
                        ef.poke = friend.poke;
                        ef.timezone = friend.timezone;
                        ef.avatarFrameCss = friend.avatarFrameCss;
                        ef.bubbleCss = friend.bubbleCss;
                    }
                    
                    if (options.chats) {
                        const chat = this.storage.getChatByFriendCode(friend.code);
                        if (chat) {
                            ef.messages = chat.messages;
                            ef.summaries = chat.summaries;
                            ef.coreMemories = chat.coreMemories;
                            ef.memoryFragments = chat.memoryFragments;
                            ef.chatSettings = chat.settings;
                        }
                    }
                    
                    if (options.memories) {
                        // 亲密关系全套数据
                        const intim = this.storage.getIntimacyData(friend.code);
                        ef.intimacyData = intim;
                    }
                    
                    if (options.worldbooks) ef.worldbooks = [];
                    
                    return ef;
                });
            }
            
            if (format === 'json') {
                this.downloadJSON(data, 'zero-phone-partial-export.json');
            } else {
                this.downloadTXT(this.convertToTXT(data), 'zero-phone-partial-export.txt');
            }
            return true;
        } catch (e) {
            console.error('❌ 部分导出失败:', e);
            return false;
        }
    }
    
    // ==================== 工具方法 ====================
    downloadJSON(data, filename) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        this.downloadBlob(blob, filename);
    }
    
    downloadTXT(text, filename) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        this.downloadBlob(blob, filename);
    }
    
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    convertToTXT(data) {
        let text = '';
        text += '='.repeat(50) + '\n';
        text += 'Zero Phone 数据导出\n';
        text += '导出时间: ' + (data.exportTime || new Date().toISOString()) + '\n';
        text += '='.repeat(50) + '\n\n';
        
        const convertObject = (obj, indent = 0) => {
            let result = '';
            const spaces = '  '.repeat(indent);
            for (const [key, value] of Object.entries(obj)) {
                if (value === null || value === undefined) continue;
                if (typeof value === 'object' && !Array.isArray(value)) {
                    result += `${spaces}${key}:\n`;
                    result += convertObject(value, indent + 1);
                } else if (Array.isArray(value)) {
                    result += `${spaces}${key}: [${value.length}项]\n`;
                    value.forEach((item, index) => {
                        result += `${spaces}  [${index}]\n`;
                        if (typeof item === 'object') {
                            result += convertObject(item, indent + 2);
                        } else {
                            result += `${spaces}    ${item}\n`;
                        }
                    });
                } else {
                    const v = String(value);
                    result += `${spaces}${key}: ${v.length > 200 ? v.substring(0,200) + '...' : v}\n`;
                }
            }
            return result;
        };
        
        text += convertObject(data);
        return text;
    }
    
    delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
}

window.ExportManager = ExportManager;
