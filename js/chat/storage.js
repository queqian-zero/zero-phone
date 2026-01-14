// ==================== 数据存储管理器 ====================
/**
 * StorageManager - 统一管理localStorage数据
 * 负责: 好友数据、聊天记录、记忆总结、用户设置
 */

class StorageManager {
    constructor() {
        // localStorage的键名
        this.KEYS = {
            FRIENDS: 'zero_phone_friends',           // 好友列表
            CHATS: 'zero_phone_chats',               // 聊天记录
            MEMORIES: 'zero_phone_memories',         // 记忆总结
            USER_SETTINGS: 'zero_phone_user_settings', // 用户设置
            GROUPS: 'zero_phone_groups'              // 好友分组
        };
        
        // 初始化
        this.init();
    }

    // ==================== 初始化 ====================
    init() {
        // 如果没有数据，创建默认数据结构
        if (!this.getData(this.KEYS.FRIENDS)) {
            this.setData(this.KEYS.FRIENDS, []);
        }
        if (!this.getData(this.KEYS.CHATS)) {
            this.setData(this.KEYS.CHATS, {});
        }
        if (!this.getData(this.KEYS.MEMORIES)) {
            this.setData(this.KEYS.MEMORIES, {});
        }
        if (!this.getData(this.KEYS.USER_SETTINGS)) {
            this.setData(this.KEYS.USER_SETTINGS, this.getDefaultUserSettings());
        }
        if (!this.getData(this.KEYS.GROUPS)) {
            this.setData(this.KEYS.GROUPS, this.getDefaultGroups());
        }
        
        console.log('✅ StorageManager initialized');
    }

    // ==================== 基础方法 ====================
    
    // 获取数据
    getData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('❌ getData error:', error);
            return null;
        }
    }

    // 保存数据
    setData(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('❌ setData error:', error);
            showToast('❌ 数据保存失败', 'error');
            return false;
        }
    }

    // ==================== 好友管理 ====================
    
    // 获取所有好友
    getAllFriends() {
        return this.getData(this.KEYS.FRIENDS) || [];
    }

    // 根据编码获取好友
    getFriendByCode(code) {
        const friends = this.getAllFriends();
        return friends.find(f => f.code === code);
    }

    // 添加好友
    addFriend(friendData) {
        const friends = this.getAllFriends();
        
        // 检查编码是否已存在
        if (friends.some(f => f.code === friendData.code)) {
            showToast('❌ 该编码已存在', 'error');
            return false;
        }
        
        // 添加时间戳
        friendData.createdAt = new Date().toISOString();
        friendData.updatedAt = new Date().toISOString();
        
        friends.push(friendData);
        const success = this.setData(this.KEYS.FRIENDS, friends);
        
        if (success) {
            showToast('✅ 好友添加成功', 'success');
        }
        
        return success;
    }

    // 更新好友
    updateFriend(code, updates) {
        const friends = this.getAllFriends();
        const index = friends.findIndex(f => f.code === code);
        
        if (index === -1) {
            showToast('❌ 好友不存在', 'error');
            return false;
        }
        
        // 更新数据
        friends[index] = {
            ...friends[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };
        
        const success = this.setData(this.KEYS.FRIENDS, friends);
        
        if (success) {
            showToast('✅ 好友信息已更新', 'success');
        }
        
        return success;
    }

    // 删除好友
    deleteFriend(code) {
        const friends = this.getAllFriends();
        const filtered = friends.filter(f => f.code !== code);
        
        if (filtered.length === friends.length) {
            showToast('❌ 好友不存在', 'error');
            return false;
        }
        
        const success = this.setData(this.KEYS.FRIENDS, filtered);
        
        if (success) {
            // 同时删除相关的聊天记录和记忆
            this.deleteChatByFriendCode(code);
            this.deleteMemoryByFriendCode(code);
            showToast('✅ 好友已删除', 'success');
        }
        
        return success;
    }

    // 根据分组获取好友
    getFriendsByGroup(groupId) {
        const friends = this.getAllFriends();
        return friends.filter(f => f.groupId === groupId);
    }

    // ==================== 聊天记录管理 ====================
    
    // 获取某个好友的聊天记录
    getChatByFriendCode(code) {
        const chats = this.getData(this.KEYS.CHATS) || {};
        return chats[code] || {
            friendCode: code,
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
    }

    // 保存聊天记录
    saveChatByFriendCode(code, chatData) {
        const chats = this.getData(this.KEYS.CHATS) || {};
        chats[code] = chatData;
        return this.setData(this.KEYS.CHATS, chats);
    }

    // 添加一条消息
    addMessage(friendCode, message) {
        const chat = this.getChatByFriendCode(friendCode);
        
        // 添加消息ID和时间戳
        message.id = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        message.timestamp = new Date().toISOString();
        
        chat.messages.push(message);
        
        return this.saveChatByFriendCode(friendCode, chat);
    }

    // 删除聊天记录
    deleteChatByFriendCode(code) {
        const chats = this.getData(this.KEYS.CHATS) || {};
        delete chats[code];
        return this.setData(this.KEYS.CHATS, chats);
    }

    // 清空某个好友的聊天记录
    clearChatMessages(friendCode) {
        const chat = this.getChatByFriendCode(friendCode);
        chat.messages = [];
        chat.lastSummaryIndex = 0;
        const success = this.saveChatByFriendCode(friendCode, chat);
        
        if (success) {
            showToast('✅ 聊天记录已清空', 'success');
        }
        
        return success;
    }

    // ==================== 记忆管理 ====================
    
    // 获取某个好友的记忆
    getMemoryByFriendCode(code) {
        const memories = this.getData(this.KEYS.MEMORIES) || {};
        return memories[code] || {
            friendCode: code,
            summaries: []
        };
    }

    // 保存记忆
    saveMemoryByFriendCode(code, memoryData) {
        const memories = this.getData(this.KEYS.MEMORIES) || {};
        memories[code] = memoryData;
        return this.setData(this.KEYS.MEMORIES, memories);
    }

    // 添加一条记忆总结
    addMemorySummary(friendCode, summary) {
        const memory = this.getMemoryByFriendCode(friendCode);
        
        summary.id = `sum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        summary.createdAt = new Date().toISOString();
        
        memory.summaries.push(summary);
        
        const success = this.saveMemoryByFriendCode(friendCode, memory);
        
        if (success) {
            showToast('✅ 记忆已保存', 'success');
        }
        
        return success;
    }

    // 删除记忆
    deleteMemoryByFriendCode(code) {
        const memories = this.getData(this.KEYS.MEMORIES) || {};
        delete memories[code];
        return this.setData(this.KEYS.MEMORIES, memories);
    }

    // ==================== 用户设置管理 ====================
    
    // 获取默认用户设置
    getDefaultUserSettings() {
        return {
            userName: '用户',
            userAvatar: '',
            userRealName: '',
            userSignature: '',
            userPoke: '戳了戳你',
            apiKey: '',
            apiModel: 'claude-sonnet-4',
            defaultAvatarShape: 'circle',
            enableAIVision: true,
            sendSound: 'assets/sounds/send.mp3',
            receiveSound: 'assets/sounds/receive.mp3',
            notificationSound: 'assets/sounds/notification.mp3'
        };
    }

    // 获取用户设置
    getUserSettings() {
        return this.getData(this.KEYS.USER_SETTINGS) || this.getDefaultUserSettings();
    }

    // 更新用户设置
    updateUserSettings(updates) {
        const settings = this.getUserSettings();
        const newSettings = { ...settings, ...updates };
        const success = this.setData(this.KEYS.USER_SETTINGS, newSettings);
        
        if (success) {
            showToast('✅ 设置已保存', 'success');
        }
        
        return success;
    }

    // ==================== 分组管理 ====================
    
    // 获取默认分组
    getDefaultGroups() {
        return [
            {
                id: 'default',
                name: '我的好友',
                order: 0,
                collapsed: false
            }
        ];
    }

    // 获取所有分组
    getAllGroups() {
        return this.getData(this.KEYS.GROUPS) || this.getDefaultGroups();
    }

    // 添加分组
    addGroup(groupName) {
        const groups = this.getAllGroups();
        const newGroup = {
            id: `group_${Date.now()}`,
            name: groupName,
            order: groups.length,
            collapsed: false
        };
        
        groups.push(newGroup);
        const success = this.setData(this.KEYS.GROUPS, groups);
        
        if (success) {
            showToast('✅ 分组已创建', 'success');
        }
        
        return success;
    }

    // ==================== 数据导出/导入 ====================
    
    // 导出所有数据
    exportAllData() {
        return {
            friends: this.getAllFriends(),
            chats: this.getData(this.KEYS.CHATS),
            memories: this.getData(this.KEYS.MEMORIES),
            userSettings: this.getUserSettings(),
            groups: this.getAllGroups(),
            exportTime: new Date().toISOString()
        };
    }

    // 导入数据
    importData(data) {
        try {
            if (data.friends) this.setData(this.KEYS.FRIENDS, data.friends);
            if (data.chats) this.setData(this.KEYS.CHATS, data.chats);
            if (data.memories) this.setData(this.KEYS.MEMORIES, data.memories);
            if (data.userSettings) this.setData(this.KEYS.USER_SETTINGS, data.userSettings);
            if (data.groups) this.setData(this.KEYS.GROUPS, data.groups);
            
            showToast('✅ 数据导入成功', 'success');
            return true;
        } catch (error) {
            console.error('❌ importData error:', error);
            showToast('❌ 数据导入失败', 'error');
            return false;
        }
    }

    // 清空所有数据
    clearAllData() {
        localStorage.removeItem(this.KEYS.FRIENDS);
        localStorage.removeItem(this.KEYS.CHATS);
        localStorage.removeItem(this.KEYS.MEMORIES);
        localStorage.removeItem(this.KEYS.USER_SETTINGS);
        localStorage.removeItem(this.KEYS.GROUPS);
        
        this.init();
        showToast('✅ 所有数据已清空', 'success');
    }
}

// 创建全局实例
const storageManager = new StorageManager();
window.StorageManager = StorageManager;
window.storageManager = storageManager;
