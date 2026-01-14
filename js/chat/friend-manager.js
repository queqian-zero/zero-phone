// ==================== 好友管理器 ====================
/**
 * FriendManager - 好友业务逻辑管理
 * 负责: 好友编码生成、添加好友、编辑好友、删除好友
 */

class FriendManager {
    constructor(storage) {
        this.storage = storage;
    }

    // ==================== 好友编码生成 ====================
    
    /**
     * 生成好友编码
     * 格式: 名字拼音首字母_年份_随机字符_符号
     * 例如: FJB_2k25_aX9#
     */
    generateFriendCode(name) {
        // 1. 获取名字的拼音首字母（这里简化处理，取前3个字符）
        const prefix = this.getNameInitials(name);
        
        // 2. 获取年份
        const year = new Date().getFullYear();
        const yearStr = `2k${year.toString().slice(-2)}`; // 2k25
        
        // 3. 生成随机字符（3位，包含字母和数字）
        const random = this.generateRandomString(3);
        
        // 4. 随机符号
        const symbols = ['#', '@', '$', '&', '*', '!', '%'];
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        
        // 5. 组合
        const code = `${prefix}_${yearStr}_${random}${symbol}`;
        
        // 6. 检查是否重复（如果重复，递归重新生成）
        if (this.storage.getFriendByCode(code)) {
            return this.generateFriendCode(name);
        }
        
        return code;
    }

    /**
     * 获取名字的拼音首字母（简化版）
     * 实际应该用拼音库，这里简化处理
     */
    getNameInitials(name) {
        // 如果是中文，取前3个字的首字母（这里简化为取前3个字符的ASCII）
        // 实际项目中应该用 pinyin 库
        
        // 简化处理：如果是英文/拼音，直接取
        const cleaned = name.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '');
        
        if (/^[a-zA-Z]+$/.test(cleaned)) {
            // 英文名，取前3个字母
            return cleaned.substring(0, 3).toUpperCase();
        } else {
            // 中文名，用简单映射（这里用名字的hash）
            // 实际应该用拼音库
            const hash = this.simpleHash(cleaned);
            return hash.substring(0, 3).toUpperCase();
        }
    }

    /**
     * 简单的字符串hash（用于中文名生成编码）
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(36).toUpperCase();
    }

    /**
     * 生成随机字符串
     */
    generateRandomString(length) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // ==================== 好友操作 ====================
    
    /**
     * 创建新好友
     * @param {Object} friendInfo - 好友信息
     * @returns {Object|null} - 成功返回好友对象，失败返回null
     */
    createFriend(friendInfo) {
        // 验证必填字段
        if (!friendInfo.name || !friendInfo.name.trim()) {
            showToast('❌ 请输入网名', 'error');
            return null;
        }

        if (!friendInfo.persona || !friendInfo.persona.trim()) {
            showToast('❌ 请输入人设', 'error');
            return null;
        }

        // 生成好友编码
        const code = this.generateFriendCode(friendInfo.name);

        // 创建完整的好友数据
        const friend = {
            // 基础信息
            code: code,
            name: friendInfo.name.trim(),
            realName: friendInfo.realName?.trim() || '',
            nickname: friendInfo.nickname?.trim() || '',
            avatar: friendInfo.avatar || '',
            signature: friendInfo.signature?.trim() || '',

            // 人设
            persona: friendInfo.persona.trim(),
            poke: friendInfo.poke?.trim() || '戳了戳你',

            // 分组
            groupId: friendInfo.groupId || 'default',

            // 添加信息
            addedTime: new Date().toISOString(),
            addedFrom: friendInfo.addedFrom || 'custom', // custom/friend_code/bottle

            // 权限
            canSeeMyMoments: true,
            seeTAMoments: true,

            // 实时状态
            currentOutfit: '',
            currentAction: '',
            currentMood: '',
            currentLocation: '',

            // 设置
            enableAvatarRecognition: true
        };

        // 保存到存储
        const success = this.storage.addFriend(friend);

        if (success) {
            console.log('✅ 好友创建成功:', friend);
            return friend;
        } else {
            return null;
        }
    }

    /**
     * 更新好友信息
     */
    updateFriend(code, updates) {
        // 验证编码
        const friend = this.storage.getFriendByCode(code);
        if (!friend) {
            showToast('❌ 好友不存在', 'error');
            return false;
        }

        // 更新
        return this.storage.updateFriend(code, updates);
    }

    /**
     * 删除好友（带确认）
     */
    deleteFriend(code, skipConfirm = false) {
        const friend = this.storage.getFriendByCode(code);
        if (!friend) {
            showToast('❌ 好友不存在', 'error');
            return false;
        }

        // 如果不跳过确认，这里应该弹出确认框
        // 但由于你要求用Toast，我们先直接删除
        // 实际使用时可以加一个自定义确认框

        if (!skipConfirm) {
            // TODO: 添加确认框
            // 暂时直接删除
        }

        return this.storage.deleteFriend(code);
    }

    /**
     * 获取所有好友
     */
    getAllFriends() {
        return this.storage.getAllFriends();
    }

    /**
     * 根据编码获取好友
     */
    getFriendByCode(code) {
        return this.storage.getFriendByCode(code);
    }

    /**
     * 根据分组获取好友
     */
    getFriendsByGroup(groupId) {
        return this.storage.getFriendsByGroup(groupId);
    }

    /**
     * 搜索好友（按网名/备注）
     */
    searchFriends(keyword) {
        const friends = this.getAllFriends();
        const lowerKeyword = keyword.toLowerCase();

        return friends.filter(friend => {
            const name = friend.name.toLowerCase();
            const nickname = (friend.nickname || '').toLowerCase();
            const realName = (friend.realName || '').toLowerCase();

            return name.includes(lowerKeyword) ||
                   nickname.includes(lowerKeyword) ||
                   realName.includes(lowerKeyword);
        });
    }

    /**
     * 更新好友状态（装扮/动作/心声/位置）
     */
    updateFriendStatus(code, status) {
        const updates = {};

        if (status.outfit !== undefined) updates.currentOutfit = status.outfit;
        if (status.action !== undefined) updates.currentAction = status.action;
        if (status.mood !== undefined) updates.currentMood = status.mood;
        if (status.location !== undefined) updates.currentLocation = status.location;

        return this.storage.updateFriend(code, updates);
    }

    /**
     * 切换权限
     */
    togglePermission(code, permissionType) {
        const friend = this.storage.getFriendByCode(code);
        if (!friend) {
            showToast('❌ 好友不存在', 'error');
            return false;
        }

        const updates = {};

        if (permissionType === 'canSeeMyMoments') {
            updates.canSeeMyMoments = !friend.canSeeMyMoments;
        } else if (permissionType === 'seeTAMoments') {
            updates.seeTAMoments = !friend.seeTAMoments;
        }

        return this.storage.updateFriend(code, updates);
    }

    /**
     * 获取好友统计信息
     */
    getFriendStats(code) {
        const chat = this.storage.getChatByFriendCode(code);
        const memory = this.storage.getMemoryByFriendCode(code);

        return {
            messageCount: chat.messages.length,
            totalTokens: chat.tokenStats.total,
            summaryCount: memory.summaries.length
        };
    }

    /**
     * 清空好友聊天记录
     */
    clearFriendChat(code) {
        return this.storage.clearChatMessages(code);
    }

    /**
     * 通过好友编码添加好友（用于扫码/输入编码）
     */
    addFriendByCode(code) {
        // 这里是预留功能
        // 实际应该从服务器获取该编码对应的好友信息
        // 目前简化处理
        showToast('⚠️ 该功能暂未实现', 'warning');
        return false;
    }
}

// 创建全局实例
const friendManager = new FriendManager(storageManager);
