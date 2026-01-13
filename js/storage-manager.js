/* Storage Manager - 数据存储管理器 */

/**
 * 零手机 - 数据管理核心
 * 负责管理所有数据的增删改查
 */

class StorageManager {
    constructor() {
        this.prefix = 'zeroPhone_'; // 数据前缀
        this.init();
    }

    // 初始化数据结构
    init() {
        // 如果是第一次使用，初始化基础数据
        if (!this.getData('initialized')) {
            this.initDefaultData();
            this.setData('initialized', true);
        }
    }

    // 初始化默认数据
    initDefaultData() {
        // 初始化好友数据
        if (!this.getData('friends')) {
            this.setData('friends', {});
        }

        // 初始化好友分组
        if (!this.getData('friendGroups')) {
            this.setData('friendGroups', {
                groups: [
                    {
                        id: 'group_default',
                        name: '我的好友',
                        isDefault: true,
                        order: 0
                    }
                ]
            });
        }

        // 初始化编码库
        if (!this.getData('friendCodes')) {
            this.setData('friendCodes', {});
        }

        // 初始化记忆库
        if (!this.getData('memories')) {
            this.setData('memories', {});
        }

        // 初始化聊天记录
        if (!this.getData('chats')) {
            this.setData('chats', {});
        }

        console.log('✅ 数据初始化完成');
    }

    // ==================== 通用方法 ====================
    
    // 获取数据
    getData(key) {
        try {
            const data = localStorage.getItem(this.prefix + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`❌ 获取数据失败: ${key}`, error);
            return null;
        }
    }

    // 保存数据
    setData(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`❌ 保存数据失败: ${key}`, error);
            return false;
        }
    }

    // 删除数据
    removeData(key) {
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error(`❌ 删除数据失败: ${key}`, error);
            return false;
        }
    }

    // ==================== 好友管理 ====================

    // 获取所有好友
    getAllFriends() {
        return this.getData('friends') || {};
    }

    // 获取单个好友
    getFriend(friendId) {
        const friends = this.getAllFriends();
        return friends[friendId] || null;
    }

    // 通过编码获取好友
    getFriendByCode(code) {
        const friends = this.getAllFriends();
        for (let friendId in friends) {
            if (friends[friendId].friendCode === code) {
                return friends[friendId];
            }
        }
        return null;
    }

    // 添加好友
    addFriend(friendData) {
        try {
            const friends = this.getAllFriends();
            const friendId = `friend_${friendData.friendCode}`;
            
            // 检查是否已存在
            if (friends[friendId]) {
                console.warn('⚠️ 好友已存在');
                return { success: false, message: '好友已存在' };
            }

            // 添加好友
            friends[friendId] = {
                id: friendId,
                friendCode: friendData.friendCode,
                avatar: friendData.avatar || 'assets/icons/default-avatar.png',
                avatarRecognition: friendData.avatarRecognition !== false,
                nickname: friendData.nickname || '未命名',
                remark: friendData.remark || '',
                realname: friendData.realname || '',
                signature: friendData.signature || '',
                persona: friendData.persona || '',
                pokeSuffix: friendData.pokeSuffix || '的小脑袋',
                group: friendData.group || 'group_default',
                addTime: friendData.addTime || new Date().toLocaleString('zh-CN'),
                addSource: friendData.addSource || '人设添加'
            };

            this.setData('friends', friends);
            console.log('✅ 添加好友成功:', friendId);
            return { success: true, friendId: friendId };
        } catch (error) {
            console.error('❌ 添加好友失败:', error);
            return { success: false, message: '添加失败' };
        }
    }

    // 更新好友信息
    updateFriend(friendId, updates) {
        try {
            const friends = this.getAllFriends();
            if (!friends[friendId]) {
                return { success: false, message: '好友不存在' };
            }

            // 更新好友信息
            friends[friendId] = {
                ...friends[friendId],
                ...updates
            };

            this.setData('friends', friends);
            console.log('✅ 更新好友成功:', friendId);
            return { success: true };
        } catch (error) {
            console.error('❌ 更新好友失败:', error);
            return { success: false, message: '更新失败' };
        }
    }

    // 删除好友（保留记忆库选项）
    deleteFriend(friendId, deleteMemory = false) {
        try {
            const friends = this.getAllFriends();
            const friend = friends[friendId];
            
            if (!friend) {
                return { success: false, message: '好友不存在' };
            }

            // 删除好友数据
            delete friends[friendId];
            this.setData('friends', friends);

            // 删除聊天记录
            this.deleteChat(friendId);

            // 如果选择删除记忆，则删除记忆库
            if (deleteMemory) {
                this.deleteMemory(friendId);
            }

            // 更新编码库状态
            this.updateCodeStatus(friend.friendCode, true);

            console.log('✅ 删除好友成功:', friendId);
            return { success: true };
        } catch (error) {
            console.error('❌ 删除好友失败:', error);
            return { success: false, message: '删除失败' };
        }
    }

    // 获取某个分组的好友列表
    getFriendsByGroup(groupId) {
        const friends = this.getAllFriends();
        const result = [];
        
        for (let friendId in friends) {
            if (friends[friendId].group === groupId) {
                result.push(friends[friendId]);
            }
        }
        
        return result;
    }

    // ==================== 好友分组管理 ====================

    // 获取所有分组
    getAllGroups() {
        const data = this.getData('friendGroups');
        return data ? data.groups : [];
    }

    // 添加分组
    addGroup(groupName) {
        try {
            const data = this.getData('friendGroups');
            const groups = data.groups;
            
            // 检查分组名是否已存在
            if (groups.some(g => g.name === groupName)) {
                return { success: false, message: '分组名已存在' };
            }

            const newGroup = {
                id: `group_${Date.now()}`,
                name: groupName,
                isDefault: false,
                order: groups.length
            };

            groups.push(newGroup);
            this.setData('friendGroups', data);
            
            console.log('✅ 添加分组成功:', groupName);
            return { success: true, groupId: newGroup.id };
        } catch (error) {
            console.error('❌ 添加分组失败:', error);
            return { success: false, message: '添加失败' };
        }
    }

    // 重命名分组
    renameGroup(groupId, newName) {
        try {
            const data = this.getData('friendGroups');
            const group = data.groups.find(g => g.id === groupId);
            
            if (!group) {
                return { success: false, message: '分组不存在' };
            }

            // 检查新名称是否已存在
            if (data.groups.some(g => g.name === newName && g.id !== groupId)) {
                return { success: false, message: '分组名已存在' };
            }

            group.name = newName;
            this.setData('friendGroups', data);
            
            console.log('✅ 重命名分组成功:', newName);
            return { success: true };
        } catch (error) {
            console.error('❌ 重命名分组失败:', error);
            return { success: false, message: '重命名失败' };
        }
    }

    // 删除分组（非默认分组）
    deleteGroup(groupId) {
        try {
            const data = this.getData('friendGroups');
            const group = data.groups.find(g => g.id === groupId);
            
            if (!group) {
                return { success: false, message: '分组不存在' };
            }

            if (group.isDefault) {
                return { success: false, message: '默认分组不能删除' };
            }

            // 将该分组的好友移到默认分组
            const friends = this.getAllFriends();
            for (let friendId in friends) {
                if (friends[friendId].group === groupId) {
                    friends[friendId].group = 'group_default';
                }
            }
            this.setData('friends', friends);

            // 删除分组
            data.groups = data.groups.filter(g => g.id !== groupId);
            this.setData('friendGroups', data);
            
            console.log('✅ 删除分组成功:', groupId);
            return { success: true };
        } catch (error) {
            console.error('❌ 删除分组失败:', error);
            return { success: false, message: '删除失败' };
        }
    }

    // ==================== 好友编码管理 ====================

    // 生成随机编码
    generateFriendCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // 检查是否已存在
        const codes = this.getData('friendCodes') || {};
        if (codes[code]) {
            return this.generateFriendCode(); // 递归生成新的
        }
        
        return code;
    }

    // 添加编码到编码库
    addFriendCode(code, nickname) {
        try {
            const codes = this.getData('friendCodes') || {};
            
            if (codes[code]) {
                return { success: false, message: '编码已存在' };
            }

            codes[code] = {
                code: code,
                nickname: nickname,
                createTime: new Date().toLocaleString('zh-CN'),
                deleteTime: null,
                isDeleted: false
            };

            this.setData('friendCodes', codes);
            console.log('✅ 添加编码成功:', code);
            return { success: true };
        } catch (error) {
            console.error('❌ 添加编码失败:', error);
            return { success: false, message: '添加失败' };
        }
    }

    // 更新编码状态（删除好友时调用）
    updateCodeStatus(code, isDeleted) {
        try {
            const codes = this.getData('friendCodes') || {};
            
            if (codes[code]) {
                codes[code].isDeleted = isDeleted;
                if (isDeleted) {
                    codes[code].deleteTime = new Date().toLocaleString('zh-CN');
                }
                this.setData('friendCodes', codes);
            }

            return { success: true };
        } catch (error) {
            console.error('❌ 更新编码状态失败:', error);
            return { success: false };
        }
    }

    // 获取编码信息
    getCodeInfo(code) {
        const codes = this.getData('friendCodes') || {};
        return codes[code] || null;
    }

    // 获取所有编码
    getAllCodes() {
        return this.getData('friendCodes') || {};
    }

    // 删除编码（彻底删除）
    deleteCode(code) {
        try {
            const codes = this.getData('friendCodes') || {};
            
            if (!codes[code]) {
                return { success: false, message: '编码不存在' };
            }

            // 删除对应的好友
            const friendId = `friend_${code}`;
            this.deleteFriend(friendId, true); // 连记忆一起删

            // 删除编码
            delete codes[code];
            this.setData('friendCodes', codes);

            console.log('✅ 删除编码成功:', code);
            return { success: true };
        } catch (error) {
            console.error('❌ 删除编码失败:', error);
            return { success: false, message: '删除失败' };
        }
    }

    // ==================== 记忆库管理 ====================

    // 获取好友记忆
    getMemory(friendId) {
        const memories = this.getData('memories') || {};
        return memories[friendId] || null;
    }

    // 保存记忆
    saveMemory(friendId, memoryData) {
        try {
            const memories = this.getData('memories') || {};
            
            memories[friendId] = {
                friendId: friendId,
                summary: memoryData.summary || '',
                diary: memoryData.diary || [],
                coreMemory: memoryData.coreMemory || [],
                lastUpdate: new Date().toLocaleString('zh-CN')
            };

            this.setData('memories', memories);
            console.log('✅ 保存记忆成功:', friendId);
            return { success: true };
        } catch (error) {
            console.error('❌ 保存记忆失败:', error);
            return { success: false };
        }
    }

    // 删除记忆
    deleteMemory(friendId) {
        try {
            const memories = this.getData('memories') || {};
            delete memories[friendId];
            this.setData('memories', memories);
            console.log('✅ 删除记忆成功:', friendId);
            return { success: true };
        } catch (error) {
            console.error('❌ 删除记忆失败:', error);
            return { success: false };
        }
    }

    // ==================== 聊天记录管理 ====================

    // 获取聊天记录
    getChat(friendId) {
        const chats = this.getData('chats') || {};
        return chats[friendId] || null;
    }

    // 保存聊天记录
    saveChat(friendId, chatData) {
        try {
            const chats = this.getData('chats') || {};
            
            chats[friendId] = {
                friendId: friendId,
                messages: chatData.messages || [],
                totalTokens: chatData.totalTokens || 0,
                floor: chatData.floor || 0,
                lastMessage: chatData.lastMessage || '',
                lastTime: new Date().toLocaleString('zh-CN')
            };

            this.setData('chats', chats);
            return { success: true };
        } catch (error) {
            console.error('❌ 保存聊天记录失败:', error);
            return { success: false };
        }
    }

    // 删除聊天记录
    deleteChat(friendId) {
        try {
            const chats = this.getData('chats') || {};
            delete chats[friendId];
            this.setData('chats', chats);
            console.log('✅ 删除聊天记录成功:', friendId);
            return { success: true };
        } catch (error) {
            console.error('❌ 删除聊天记录失败:', error);
            return { success: false };
        }
    }

    // 获取所有有聊天记录的好友（用于聊天列表）
    getAllChats() {
        return this.getData('chats') || {};
    }

    // ==================== 数据导入导出 ====================

    // 导出所有数据
    exportAllData() {
        return {
            friends: this.getData('friends'),
            friendGroups: this.getData('friendGroups'),
            friendCodes: this.getData('friendCodes'),
            memories: this.getData('memories'),
            chats: this.getData('chats'),
            exportTime: new Date().toLocaleString('zh-CN')
        };
    }

    // 导入所有数据
    importAllData(data) {
        try {
            if (data.friends) this.setData('friends', data.friends);
            if (data.friendGroups) this.setData('friendGroups', data.friendGroups);
            if (data.friendCodes) this.setData('friendCodes', data.friendCodes);
            if (data.memories) this.setData('memories', data.memories);
            if (data.chats) this.setData('chats', data.chats);
            
            console.log('✅ 导入数据成功');
            return { success: true };
        } catch (error) {
            console.error('❌ 导入数据失败:', error);
            return { success: false, message: '导入失败' };
        }
    }

    // 导出单个好友数据
    exportFriendData(friendId) {
        return {
            friend: this.getFriend(friendId),
            memory: this.getMemory(friendId),
            chat: this.getChat(friendId),
            exportTime: new Date().toLocaleString('zh-CN')
        };
    }

    // 清空所有数据
    clearAllData() {
        try {
            localStorage.clear();
            this.init();
            console.log('✅ 清空数据成功');
            return { success: true };
        } catch (error) {
            console.error('❌ 清空数据失败:', error);
            return { success: false };
        }
    }
}

// 创建全局实例
const storageManager = new StorageManager();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StorageManager;
}
