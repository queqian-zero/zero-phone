/* Import Manager - 导入功能管理（含所有新功能数据） */

class ImportManager {
    constructor() {
        this.storage = new StorageManager();
    }
    
    // ==================== 完整导入 ====================
    async importFull() {
        try {
            const file = await this.selectFile();
            if (!file) return false;
            
            const content = await this.readFile(file);
            let data;
            
            if (file.name.endsWith('.json')) {
                data = JSON.parse(content);
            } else {
                data = this.parseTXT(content);
            }
            
            if (!confirm('确定要导入数据吗？\n\n这将覆盖当前所有数据！')) return false;
            
            // 基础数据
            if (data.friends) this.storage.saveData(this.storage.KEYS.FRIENDS, data.friends);
            if (data.chats) this.storage.saveData(this.storage.KEYS.CHATS, data.chats);
            if (data.memories) this.storage.saveData(this.storage.KEYS.MEMORIES, data.memories);
            if (data.userSettings) this.storage.saveData(this.storage.KEYS.USER, data.userSettings);
            
            // 亲密关系数据（v2.0新增）
            if (data.intimacyData && typeof data.intimacyData === 'object') {
                Object.entries(data.intimacyData).forEach(([friendCode, intimData]) => {
                    this.storage.saveData(`zero_phone_intimacy_${friendCode}`, intimData);
                });
            }
            
            // 亲密关系全局配置
            if (data.intimacyConfig) {
                this.storage.saveData('zero_phone_intimacy_config', data.intimacyConfig);
            }
            
            alert('✅ 导入成功！页面即将刷新。');
            location.reload();
            return true;
        } catch (e) {
            console.error('❌ 导入失败:', e);
            alert('❌ 导入失败: ' + e.message);
            return false;
        }
    }
    
    // ==================== 流式导入 ====================
    async importStream() {
        try {
            const files = await this.selectMultipleFiles();
            if (!files || files.length === 0) return false;
            
            if (!confirm(`确定要导入 ${files.length} 个文件吗？`)) return false;
            
            const progressMsg = document.createElement('div');
            progressMsg.innerHTML = '正在导入...';
            progressMsg.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,0.12);color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:10000;backdrop-filter:blur(10px);';
            document.body.appendChild(progressMsg);
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                progressMsg.innerHTML = `正在导入 ${i + 1}/${files.length}: ${file.name}`;
                
                try {
                    const content = await this.readFile(file);
                    let data;
                    
                    if (file.name.endsWith('.json')) {
                        data = JSON.parse(content);
                    } else {
                        data = this.parseTXT(content);
                    }
                    
                    // 根据type字段分类导入
                    if (data.type === 'friends') {
                        this.storage.saveData(this.storage.KEYS.FRIENDS, data.data);
                    } else if (data.type === 'chats') {
                        this.storage.saveData(this.storage.KEYS.CHATS, data.data);
                    } else if (data.type === 'memories') {
                        this.storage.saveData(this.storage.KEYS.MEMORIES, data.data);
                    } else if (data.type === 'intimacy') {
                        // 亲密关系数据
                        if (data.data && typeof data.data === 'object') {
                            Object.entries(data.data).forEach(([friendCode, intimData]) => {
                                this.storage.saveData(`zero_phone_intimacy_${friendCode}`, intimData);
                            });
                        }
                        if (data.config) {
                            this.storage.saveData('zero_phone_intimacy_config', data.config);
                        }
                    } else if (data.type === 'settings') {
                        this.storage.saveData(this.storage.KEYS.USER, data.data);
                    } else if (data.type === 'worldbook') {
                        // TODO
                    }
                    
                    await this.delay(100);
                } catch (e) {
                    console.error(`❌ 导入文件失败 ${file.name}:`, e);
                }
            }
            
            document.body.removeChild(progressMsg);
            alert('✅ 导入完成！页面即将刷新。');
            location.reload();
            return true;
        } catch (e) {
            console.error('❌ 流式导入失败:', e);
            alert('❌ 导入失败: ' + e.message);
            return false;
        }
    }
    
    // ==================== 部分导入 ====================
    async importPartial() {
        try {
            const file = await this.selectFile();
            if (!file) return false;
            
            const content = await this.readFile(file);
            let data;
            
            if (file.name.endsWith('.json')) {
                data = JSON.parse(content);
            } else {
                data = this.parseTXT(content);
            }
            
            if (data.type !== 'partial' || !data.friends) {
                alert('该文件不是部分导出格式');
                return false;
            }
            
            if (!confirm(`即将导入 ${data.friends.length} 个好友的数据，继续？`)) return false;
            
            const currentFriends = this.storage.getAllFriendsIncludingDeleted();
            const currentChats = this.storage.getData(this.storage.KEYS.CHATS) || [];
            
            data.friends.forEach(ef => {
                // 更新好友信息
                const idx = currentFriends.findIndex(f => f.code === ef.code);
                if (idx >= 0) {
                    // 合并人设
                    if (ef.name) currentFriends[idx].name = ef.name;
                    if (ef.nickname) currentFriends[idx].nickname = ef.nickname;
                    if (ef.persona) currentFriends[idx].persona = ef.persona;
                    if (ef.signature) currentFriends[idx].signature = ef.signature;
                    if (ef.avatar) currentFriends[idx].avatar = ef.avatar;
                    if (ef.poke) currentFriends[idx].poke = ef.poke;
                    if (ef.avatarFrameCss) currentFriends[idx].avatarFrameCss = ef.avatarFrameCss;
                    if (ef.bubbleCss) currentFriends[idx].bubbleCss = ef.bubbleCss;
                }
                
                // 合并聊天记录
                if (ef.messages) {
                    const chatIdx = currentChats.findIndex(c => c.friendCode === ef.code);
                    if (chatIdx >= 0) {
                        currentChats[chatIdx].messages = ef.messages;
                        if (ef.summaries) currentChats[chatIdx].summaries = ef.summaries;
                        if (ef.coreMemories) currentChats[chatIdx].coreMemories = ef.coreMemories;
                        if (ef.memoryFragments) currentChats[chatIdx].memoryFragments = ef.memoryFragments;
                        if (ef.chatSettings) currentChats[chatIdx].settings = ef.chatSettings;
                    }
                }
                
                // 合并亲密关系数据
                if (ef.intimacyData) {
                    this.storage.saveData(`zero_phone_intimacy_${ef.code}`, ef.intimacyData);
                }
            });
            
            this.storage.saveData(this.storage.KEYS.FRIENDS, currentFriends);
            this.storage.saveData(this.storage.KEYS.CHATS, currentChats);
            
            alert('✅ 部分导入成功！页面即将刷新。');
            location.reload();
            return true;
        } catch (e) {
            console.error('❌ 部分导入失败:', e);
            alert('❌ 导入失败: ' + e.message);
            return false;
        }
    }
    
    // ==================== 工具方法 ====================
    selectFile() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json,.txt';
            input.onchange = (e) => resolve(e.target.files[0]);
            input.click();
        });
    }
    
    selectMultipleFiles() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file'; input.accept = '.json,.txt'; input.multiple = true;
            input.onchange = (e) => resolve(Array.from(e.target.files));
            input.click();
        });
    }
    
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
    
    parseTXT(content) {
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            throw new Error('无法解析TXT文件');
        } catch (e) {
            throw new Error('TXT文件格式不正确');
        }
    }
    
    delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
}

window.ImportManager = ImportManager;
