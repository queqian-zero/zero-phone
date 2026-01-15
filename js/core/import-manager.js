/* Import Manager - 导入功能管理 */

class ImportManager {
    constructor() {
        this.storage = new StorageManager();
    }
    
    // ==================== 完整导入 ====================
    
    // 完整导入
    async importFull() {
        try {
            const file = await this.selectFile();
            if (!file) return false;
            
            const content = await this.readFile(file);
            let data;
            
            // 判断文件格式
            if (file.name.endsWith('.json')) {
                data = JSON.parse(content);
            } else {
                // TXT格式需要解析
                data = this.parseTXT(content);
            }
            
            // 确认导入
            if (!confirm('确定要导入数据吗？\n\n这将覆盖当前所有数据！')) {
                return false;
            }
            
            // 导入数据
            if (data.friends) {
                this.storage.saveData(this.storage.KEYS.FRIENDS, data.friends);
            }
            if (data.chats) {
                this.storage.saveData(this.storage.KEYS.CHATS, data.chats);
            }
            if (data.memories) {
                this.storage.saveData(this.storage.KEYS.MEMORIES, data.memories);
            }
            if (data.userSettings) {
                this.storage.saveData(this.storage.KEYS.USER, data.userSettings);
            }
            
            alert('✅ 导入成功！');
            return true;
        } catch (e) {
            console.error('❌ 导入失败:', e);
            alert('❌ 导入失败: ' + e.message);
            return false;
        }
    }
    
    // ==================== 流式导入 ====================
    
    // 流式导入
    async importStream() {
        try {
            const files = await this.selectMultipleFiles();
            if (!files || files.length === 0) return false;
            
            // 确认导入
            if (!confirm(`确定要导入 ${files.length} 个文件吗？`)) {
                return false;
            }
            
            // 显示进度
            const progressMsg = document.createElement('div');
            progressMsg.className = 'import-progress';
            progressMsg.innerHTML = '正在导入...';
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
            
            // 逐个导入文件
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
                    
                    // 根据文件类型导入
                    if (data.type === 'friends') {
                        this.storage.saveData(this.storage.KEYS.FRIENDS, data.data);
                    } else if (data.type === 'chats') {
                        this.storage.saveData(this.storage.KEYS.CHATS, data.data);
                    } else if (data.type === 'memories') {
                        this.storage.saveData(this.storage.KEYS.MEMORIES, data.data);
                    } else if (data.type === 'worldbook') {
                        // TODO: 世界书导入
                    }
                    
                    await this.delay(100);
                } catch (e) {
                    console.error(`❌ 导入文件失败 ${file.name}:`, e);
                }
            }
            
            document.body.removeChild(progressMsg);
            alert('✅ 导入完成！');
            return true;
        } catch (e) {
            console.error('❌ 流式导入失败:', e);
            alert('❌ 导入失败: ' + e.message);
            return false;
        }
    }
    
    // ==================== 部分导入 ====================
    
    // 部分导入
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
            
            // TODO: 显示选择界面，让用户选择要导入哪些部分
            
            alert('✅ 部分导入功能开发中...');
            return true;
        } catch (e) {
            console.error('❌ 部分导入失败:', e);
            alert('❌ 导入失败: ' + e.message);
            return false;
        }
    }
    
    // ==================== 工具方法 ====================
    
    // 选择单个文件
    selectFile() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,.txt';
            input.onchange = (e) => {
                resolve(e.target.files[0]);
            };
            input.click();
        });
    }
    
    // 选择多个文件
    selectMultipleFiles() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,.txt';
            input.multiple = true;
            input.onchange = (e) => {
                resolve(Array.from(e.target.files));
            };
            input.click();
        });
    }
    
    // 读取文件
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }
    
    // 解析TXT格式（简单实现）
    parseTXT(content) {
        // TODO: 实现更完善的TXT解析
        try {
            // 尝试从TXT中提取JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('无法解析TXT文件');
        } catch (e) {
            throw new Error('TXT文件格式不正确');
        }
    }
    
    // 延迟函数
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 导出
window.ImportManager = ImportManager;
