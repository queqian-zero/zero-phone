/* Export Manager - 导出功能管理 */

class ExportManager {
    constructor() {
        this.storage = new StorageManager();
    }
    
    // ==================== 完整导出 ====================
    
    // 完整导出
    exportFull(format = 'json') {
        try {
            const data = {
                version: '1.0.0',
                exportTime: new Date().toISOString(),
                friends: this.storage.getAllFriendsIncludingDeleted(),
                chats: this.storage.getData(this.storage.KEYS.CHATS) || [],
                memories: this.storage.getData(this.storage.KEYS.MEMORIES) || [],
                userSettings: this.storage.getUserSettings(),
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
    
    // 流式导出（分类 + 后台导出）
    async exportStream(format = 'json') {
        try {
            // 显示进度提示
            const progressMsg = document.createElement('div');
            progressMsg.className = 'export-progress';
            progressMsg.innerHTML = '正在后台导出...';
            progressMsg.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 212, 255, 0.9);
                color: #fff;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 10000;
            `;
            document.body.appendChild(progressMsg);
            
            // 延迟执行，不阻塞UI
            setTimeout(async () => {
                try {
                    // 好友数据
                    const friendsData = {
                        exportTime: new Date().toISOString(),
                        type: 'friends',
                        data: this.storage.getAllFriendsIncludingDeleted()
                    };
                    
                    // 聊天记录
                    const chatsData = {
                        exportTime: new Date().toISOString(),
                        type: 'chats',
                        data: this.storage.getData(this.storage.KEYS.CHATS) || []
                    };
                    
                    // 记忆库
                    const memoriesData = {
                        exportTime: new Date().toISOString(),
                        type: 'memories',
                        data: this.storage.getData(this.storage.KEYS.MEMORIES) || []
                    };
                    
                    // 世界书（TODO）
                    const worldbookData = {
                        exportTime: new Date().toISOString(),
                        type: 'worldbook',
                        data: []
                    };
                    
                    // 导出文件
                    if (format === 'json') {
                        this.downloadJSON(friendsData, 'zero-phone-friends.json');
                        await this.delay(100);
                        this.downloadJSON(chatsData, 'zero-phone-chats.json');
                        await this.delay(100);
                        this.downloadJSON(memoriesData, 'zero-phone-memories.json');
                        await this.delay(100);
                        this.downloadJSON(worldbookData, 'zero-phone-worldbook.json');
                    } else {
                        this.downloadTXT(this.convertToTXT(friendsData), 'zero-phone-friends.txt');
                        await this.delay(100);
                        this.downloadTXT(this.convertToTXT(chatsData), 'zero-phone-chats.txt');
                        await this.delay(100);
                        this.downloadTXT(this.convertToTXT(memoriesData), 'zero-phone-memories.txt');
                        await this.delay(100);
                        this.downloadTXT(this.convertToTXT(worldbookData), 'zero-phone-worldbook.txt');
                    }
                    
                    // 移除进度提示
                    document.body.removeChild(progressMsg);
                    
                    // 显示完成提示
                    const successMsg = document.createElement('div');
                    successMsg.className = 'export-success';
                    successMsg.innerHTML = '✅ 流式导出完成！';
                    successMsg.style.cssText = progressMsg.style.cssText;
                    successMsg.style.background = 'rgba(46, 213, 115, 0.9)';
                    document.body.appendChild(successMsg);
                    
                    setTimeout(() => {
                        document.body.removeChild(successMsg);
                    }, 2000);
                    
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
    
    // 部分导出
    exportPartial(options, format = 'json') {
        try {
            const data = {
                version: '1.0.0',
                exportTime: new Date().toISOString(),
                type: 'partial'
            };
            
            // 根据选项导出
            if (options.worldbook) {
                data.worldbook = []; // TODO: 世界书数据
            }
            
            if (options.friends) {
                const friends = this.storage.getAllFriendsIncludingDeleted();
                
                // 根据子选项过滤
                data.friends = friends.map(friend => {
                    const exportFriend = { code: friend.code };
                    
                    if (options.persona) {
                        exportFriend.name = friend.name;
                        exportFriend.persona = friend.persona;
                        exportFriend.signature = friend.signature;
                        // ... 其他人设字段
                    }
                    
                    if (options.chats) {
                        const chat = this.storage.getChatByFriendCode(friend.code);
                        if (chat) {
                            exportFriend.chats = chat.messages;
                        }
                    }
                    
                    if (options.memories) {
                        const memories = this.storage.getMemoriesByFriendCode(friend.code);
                        if (memories) {
                            exportFriend.memories = memories;
                        }
                    }
                    
                    if (options.worldbooks) {
                        exportFriend.worldbooks = []; // TODO: 挂载的世界书
                    }
                    
                    return exportFriend;
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
    
    // 下载JSON文件
    downloadJSON(data, filename) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        this.downloadBlob(blob, filename);
    }
    
    // 下载TXT文件
    downloadTXT(text, filename) {
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        this.downloadBlob(blob, filename);
    }
    
    // 下载Blob
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
    
    // 转换为TXT格式
    convertToTXT(data) {
        let text = '';
        text += '='.repeat(50) + '\n';
        text += 'Zero Phone 数据导出\n';
        text += '导出时间: ' + (data.exportTime || new Date().toISOString()) + '\n';
        text += '='.repeat(50) + '\n\n';
        
        // 递归转换对象为文本
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
                    result += `${spaces}${key}: ${value}\n`;
                }
            }
            
            return result;
        };
        
        text += convertObject(data);
        return text;
    }
    
    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 导出
window.ExportManager = ExportManager;
