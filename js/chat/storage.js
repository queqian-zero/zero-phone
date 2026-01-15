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
    
    // ==================== 调试方法 ====================
    
    // 打印所有数据（用于调试）
    printAllData() {
        console.log('=== 所有数据 ===');
        console.log('好友:', this.getAllFriends());
        console.log('聊天:', this.getData(this.KEYS.CHATS));
        console.log('记忆:', this.getData(this.KEYS.MEMORIES));
        console.log('用户:', this.getUserSettings());
    }
}

// 导出（全局使用）
window.StorageManager = StorageManager;
