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
    
    // ==================== AI调用（新增） ====================
    
    /**
     * 调用AI API
     * @param {Array} messages - 消息历史 [{role: 'user'/'assistant', content: '...'}]
     * @param {String} systemPrompt - 系统提示词（人设）
     * @returns {Object} { success, text, tokens, error }
     */
    async callAI(messages, systemPrompt = '') {
        try {
            console.log('🤖 开始调用AI API');
            
            // 1. 获取配置
            const config = this.getCurrentConfig();
            
            // 验证配置
            if (!config.endpoint || !config.apiKey) {
                throw new Error('API配置不完整\n\n请先在中枢APP配置API');
            }
            
            if (!config.model) {
                throw new Error('未选择模型\n\n请先在中枢APP拉取并选择模型');
            }
            
            console.log('📋 API配置:', {
                provider: config.provider,
                endpoint: config.endpoint,
                model: config.model
            });
            
            // 2. 构建请求体（根据不同provider调整格式）
            const requestBody = this.buildRequestBody(config, messages, systemPrompt);
            
            console.log('📦 请求体:', requestBody);
            
            // 3. 调用API
            const url = this.buildAPIUrl(config);
            console.log('🌐 API地址:', url);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('📡 响应状态:', response.status, response.statusText);
            
            // 4. 检查响应
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(this.parseAPIError(response.status, errorText));
            }
            
            // 5. 解析响应
            const data = await response.json();
            console.log('📥 响应数据:', data);
            
            const result = this.parseAPIResponse(config.provider, data);
            
            console.log('✅ AI调用成功');
            return {
                success: true,
                text: result.text,
                tokens: result.tokens
            };
            
        } catch (e) {
            console.error('❌ AI调用失败:', e);
            return {
                success: false,
                error: e.message
            };
        }
    }
    
    // 构建请求体
    buildRequestBody(config, messages, systemPrompt) {
        const { provider, model, maxTokens, temperature } = config;
        
        // 转换消息格式
        const formattedMessages = messages.map(msg => ({
            role: msg.type === 'user' ? 'user' : 'assistant',
            content: msg.text
        }));
        
        // 根据provider构建不同格式
        switch (provider) {
            case 'google':
                // Google Gemini格式
                return {
                    contents: formattedMessages.map(msg => ({
                        role: msg.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: msg.content }]
                    })),
                    systemInstruction: systemPrompt ? {
                        parts: [{ text: systemPrompt }]
                    } : undefined,
                    generationConfig: {
                        temperature: temperature,
                        maxOutputTokens: maxTokens
                    }
                };
                
            case 'anthropic':
                // Anthropic Claude格式
                return {
                    model: model,
                    max_tokens: maxTokens,
                    temperature: temperature,
                    system: systemPrompt,
                    messages: formattedMessages
                };
                
            default:
                // OpenAI / SiliconFlow / 自定义（通用格式）
                const allMessages = [];
                if (systemPrompt) {
                    allMessages.push({
                        role: 'system',
                        content: systemPrompt
                    });
                }
                allMessages.push(...formattedMessages);
                
                return {
                    model: model,
                    messages: allMessages,
                    max_tokens: maxTokens,
                    temperature: temperature
                };
        }
    }
    
    // 构建API URL
    buildAPIUrl(config) {
        const { provider, endpoint, model } = config;
        
        // 移除末尾斜杠
        let baseUrl = endpoint.replace(/\/$/, '');
        
        switch (provider) {
            case 'google':
                // Google Gemini: endpoint/{model}:generateContent
                return `${baseUrl}/${model}:generateContent`;
                
            case 'anthropic':
                // Anthropic: endpoint/v1/messages
                if (!baseUrl.endsWith('/v1/messages')) {
                    baseUrl += '/v1/messages';
                }
                return baseUrl;
                
            default:
                // OpenAI / SiliconFlow / 自定义: endpoint/v1/chat/completions
                if (!baseUrl.endsWith('/chat/completions')) {
                    if (!baseUrl.endsWith('/v1')) {
                        baseUrl += '/v1';
                    }
                    baseUrl += '/chat/completions';
                }
                return baseUrl;
        }
    }
    
    // 解析API响应
    parseAPIResponse(provider, data) {
        switch (provider) {
            case 'google':
                // Google Gemini响应格式
                const candidate = data.candidates?.[0];
                if (!candidate) {
                    throw new Error('API返回格式错误：找不到candidates');
                }
                
                return {
                    text: candidate.content?.parts?.[0]?.text || '',
                    tokens: {
                        input: data.usageMetadata?.promptTokenCount || 0,
                        output: data.usageMetadata?.candidatesTokenCount || 0,
                        total: data.usageMetadata?.totalTokenCount || 0
                    }
                };
                
            case 'anthropic':
                // Anthropic Claude响应格式
                if (!data.content?.[0]) {
                    throw new Error('API返回格式错误：找不到content');
                }
                
                return {
                    text: data.content[0].text || '',
                    tokens: {
                        input: data.usage?.input_tokens || 0,
                        output: data.usage?.output_tokens || 0,
                        total: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
                    }
                };
                
            default:
                // OpenAI / SiliconFlow / 自定义（通用格式）
                if (!data.choices?.[0]) {
                    throw new Error('API返回格式错误：找不到choices');
                }
                
                return {
                    text: data.choices[0].message?.content || '',
                    tokens: {
                        input: data.usage?.prompt_tokens || 0,
                        output: data.usage?.completion_tokens || 0,
                        total: data.usage?.total_tokens || 0
                    }
                };
        }
    }
    
    // 解析API错误
    parseAPIError(status, errorText) {
        let message = `HTTP ${status} 错误\n\n`;
        
        try {
            const errorData = JSON.parse(errorText);
            
            // 不同provider的错误格式
            if (errorData.error) {
                if (typeof errorData.error === 'string') {
                    message += errorData.error;
                } else if (errorData.error.message) {
                    message += errorData.error.message;
                } else {
                    message += JSON.stringify(errorData.error);
                }
            } else {
                message += errorText;
            }
        } catch (e) {
            message += errorText;
        }
        
        // 常见错误提示
        if (status === 401) {
            message += '\n\n💡 可能是API Key无效或已过期';
        } else if (status === 429) {
            message += '\n\n💡 请求过于频繁，请稍后再试';
        } else if (status === 402 || errorText.includes('insufficient')) {
            message += '\n\n💡 余额不足，请充值';
        } else if (status === 404) {
            message += '\n\n💡 模型不存在或API地址错误';
        } else if (status === 500 || status === 502 || status === 503) {
            message += '\n\n💡 服务器错误，请稍后再试';
        }
        
        return message;
    }
}

// 导出
window.APIManager = APIManager;