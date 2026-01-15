/* API Manager - API配置管理 */

class APIManager {
    constructor() {
        this.storage = new StorageManager();
        this.KEYS = {
            CURRENT_CONFIG: 'zero_phone_api_config',
            PRESETS: 'zero_phone_api_presets',
            MINIMAX: 'zero_phone_minimax_config'
        };
        this.init();
    }
    
    init() {
        // 初始化默认配置
        if (!this.getCurrentConfig()) {
            this.saveCurrentConfig({
                provider: 'google',
                endpoint: '',
                apiKey: '',
                model: '',
                maxTokens: 4096,
                temperature: 0.7
            });
        }
        
        if (!this.getPresets()) {
            this.storage.saveData(this.KEYS.PRESETS, []);
        }
        
        if (!this.getMinimaxConfig()) {
            this.storage.saveData(this.KEYS.MINIMAX, {
                groupId: '',
                apiKey: '',
                voiceModel: 'male-qn-qingse',
                language: 'zh'
            });
        }
    }
    
    // ==================== 当前配置 ====================
    
    // 获取当前配置
    getCurrentConfig() {
        return this.storage.getData(this.KEYS.CURRENT_CONFIG);
    }
    
    // 保存当前配置
    saveCurrentConfig(config) {
        try {
            return this.storage.saveData(this.KEYS.CURRENT_CONFIG, config);
        } catch (e) {
            console.error('❌ 保存配置失败:', e);
            return false;
        }
    }
    
    // 更新当前配置
    updateCurrentConfig(updates) {
        try {
            const current = this.getCurrentConfig();
            const updated = { ...current, ...updates };
            return this.saveCurrentConfig(updated);
        } catch (e) {
            console.error('❌ 更新配置失败:', e);
            return false;
        }
    }
    
    // ==================== 拉取模型 ====================
    
    // 拉取模型列表
    async fetchModels(endpoint, apiKey) {
        try {
            // 尝试标准的 /v1/models 端点
            let url = endpoint;
            if (!url.endsWith('/models')) {
                url = url.replace(/\/$/, '') + '/v1/models';
            }
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // 处理不同API的响应格式
            if (data.data && Array.isArray(data.data)) {
                // OpenAI/Anthropic格式
                return data.data.map(model => ({
                    id: model.id,
                    name: model.id
                }));
            } else if (data.models && Array.isArray(data.models)) {
                // Google格式
                return data.models.map(model => ({
                    id: model.name || model.model,
                    name: model.displayName || model.name || model.model
                }));
            } else if (Array.isArray(data)) {
                // 直接返回数组
                return data.map(model => ({
                    id: typeof model === 'string' ? model : model.id,
                    name: typeof model === 'string' ? model : (model.name || model.id)
                }));
            }
            
            throw new Error('无法解析模型列表');
            
        } catch (e) {
            console.error('❌ 拉取模型失败:', e);
            throw e;
        }
    }
    
    // ==================== 预设管理 ====================
    
    // 获取所有预设
    getPresets() {
        return this.storage.getData(this.KEYS.PRESETS) || [];
    }
    
    // 保存预设
    savePreset(preset) {
        try {
            const presets = this.getPresets();
            
            // 检查名称是否重复
            if (presets.some(p => p.name === preset.name)) {
                console.error('❌ 预设名称重复');
                return false;
            }
            
            // 添加ID和创建时间
            preset.id = 'preset_' + Date.now();
            preset.createdAt = new Date().toISOString();
            
            presets.push(preset);
            return this.storage.saveData(this.KEYS.PRESETS, presets);
        } catch (e) {
            console.error('❌ 保存预设失败:', e);
            return false;
        }
    }
    
    // 加载预设
    loadPreset(presetId) {
        try {
            const presets = this.getPresets();
            const preset = presets.find(p => p.id === presetId);
            
            if (!preset) {
                console.error('❌ 找不到预设');
                return false;
            }
            
            // 将预设配置加载到当前配置
            const config = {
                provider: preset.provider,
                endpoint: preset.endpoint,
                apiKey: preset.apiKey,
                model: preset.model,
                maxTokens: preset.maxTokens,
                temperature: preset.temperature
            };
            
            return this.saveCurrentConfig(config);
        } catch (e) {
            console.error('❌ 加载预设失败:', e);
            return false;
        }
    }
    
    // 更新预设
    updatePreset(presetId, updates) {
        try {
            const presets = this.getPresets();
            const index = presets.findIndex(p => p.id === presetId);
            
            if (index === -1) {
                console.error('❌ 找不到预设');
                return false;
            }
            
            // 如果修改了名称，检查是否重复
            if (updates.name && updates.name !== presets[index].name) {
                if (presets.some((p, i) => i !== index && p.name === updates.name)) {
                    console.error('❌ 预设名称重复');
                    return false;
                }
            }
            
            // 合并更新
            presets[index] = { ...presets[index], ...updates };
            return this.storage.saveData(this.KEYS.PRESETS, presets);
        } catch (e) {
            console.error('❌ 更新预设失败:', e);
            return false;
        }
    }
    
    // 删除预设
    deletePreset(presetId) {
        try {
            const presets = this.getPresets();
            const filtered = presets.filter(p => p.id !== presetId);
            return this.storage.saveData(this.KEYS.PRESETS, filtered);
        } catch (e) {
            console.error('❌ 删除预设失败:', e);
            return false;
        }
    }
    
    // ==================== Minimax语音 ====================
    
    // 获取Minimax配置
    getMinimaxConfig() {
        return this.storage.getData(this.KEYS.MINIMAX);
    }
    
    // 保存Minimax配置
    saveMinimaxConfig(config) {
        try {
            return this.storage.saveData(this.KEYS.MINIMAX, config);
        } catch (e) {
            console.error('❌ 保存Minimax配置失败:', e);
            return false;
        }
    }
    
    // 测试语音
    async testVoice(config) {
        try {
            // TODO: 实现语音测试
            alert('语音测试功能开发中...');
            return true;
        } catch (e) {
            console.error('❌ 测试语音失败:', e);
            return false;
        }
    }
}

// 导出
window.APIManager = APIManager;
