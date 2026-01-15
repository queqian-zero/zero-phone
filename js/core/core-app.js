/* Core App - 中枢APP主逻辑 */

class CoreApp {
    constructor() {
        this.apiManager = new APIManager();
        this.exportManager = new ExportManager();
        this.importManager = new ImportManager();
        this.currentExportType = null;
        this.init();
    }
    
    init() {
        // 更新状态栏时间
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        
        // 绑定返回按钮
        document.getElementById('backBtn').addEventListener('click', () => {
            window.history.back();
        });
        
        // 加载当前配置
        this.loadCurrentConfig();
        
        // 加载预设列表
        this.renderPresetList();
        
        // 加载Minimax配置
        this.loadMinimaxConfig();
        
        // 绑定事件
        this.bindEvents();
        
        console.log('✅ Core APP初始化完成');
    }
    
    // 更新时间
    updateTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('statusTime').textContent = `${hours}:${minutes}`;
    }
    
    // ==================== 加载配置 ====================
    
    // 加载当前配置
    loadCurrentConfig() {
        const config = this.apiManager.getCurrentConfig();
        
        // 供应商
        document.querySelector(`input[name="provider"][value="${config.provider}"]`).checked = true;
        
        // 接口地址
        document.getElementById('apiEndpoint').value = config.endpoint || '';
        
        // API密钥
        document.getElementById('apiKey').value = config.apiKey || '';
        
        // 模型
        if (config.model) {
            const modelSelect = document.getElementById('modelSelect');
            modelSelect.innerHTML = `<option value="${config.model}" selected>${config.model}</option>`;
            document.getElementById('modelSelectGroup').style.display = 'block';
        }
        
        // Token数
        document.getElementById('maxTokens').value = config.maxTokens || 4096;
        
        // 温度
        document.getElementById('temperature').value = config.temperature || 0.7;
        document.getElementById('tempValue').textContent = config.temperature || 0.7;
    }
    
    // 加载Minimax配置
    loadMinimaxConfig() {
        const config = this.apiManager.getMinimaxConfig();
        
        document.getElementById('minimaxGroupId').value = config.groupId || '';
        document.getElementById('minimaxApiKey').value = config.apiKey || '';
        document.getElementById('voiceModel').value = config.voiceModel || 'male-qn-qingse';
        document.getElementById('voiceLanguage').value = config.language || 'zh';
    }
    
    // ==================== 渲染预设列表 ====================
    
    renderPresetList() {
        const container = document.getElementById('presetList');
        const presets = this.apiManager.getPresets();
        
        if (presets.length === 0) {
            container.innerHTML = '<div class="empty-placeholder">暂无预设</div>';
            return;
        }
        
        container.innerHTML = presets.map(preset => this.createPresetCard(preset)).join('');
        
        // 绑定预设卡片事件
        this.bindPresetEvents();
    }
    
    // 创建预设卡片
    createPresetCard(preset) {
        const providerNames = {
            'google': 'Google Gemini',
            'openai': 'OpenAI',
            'anthropic': 'Anthropic',
            'siliconflow': 'SiliconFlow',
            'custom': '自定义'
        };
        
        return `
            <div class="preset-card" data-id="${preset.id}">
                <div class="preset-header">
                    <input type="radio" name="activePreset" class="preset-radio" data-id="${preset.id}">
                    <span class="preset-name">${preset.name}</span>
                </div>
                <div class="preset-info">
                    ${providerNames[preset.provider] || preset.provider}
                    <br>
                    ${preset.model || '未选择模型'}
                </div>
                <div class="preset-actions">
                    <button class="load-preset-btn" data-id="${preset.id}">加载</button>
                    <button class="edit-preset-btn" data-id="${preset.id}">编辑</button>
                    <button class="delete-preset-btn" data-id="${preset.id}">删除</button>
                </div>
            </div>
        `;
    }
    
    // 绑定预设事件
    bindPresetEvents() {
        // 加载预设
        document.querySelectorAll('.load-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                this.loadPreset(id);
            });
        });
        
        // 编辑预设
        document.querySelectorAll('.edit-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                alert('编辑预设功能开发中...\n\n暂时请删除后重新创建');
            });
        });
        
        // 删除预设
        document.querySelectorAll('.delete-preset-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                this.deletePreset(id);
            });
        });
    }
    
    // ==================== 绑定事件 ====================
    
    bindEvents() {
        // 温度滑块
        document.getElementById('temperature').addEventListener('input', (e) => {
            document.getElementById('tempValue').textContent = e.target.value;
        });
        
        // 拉取模型
        document.getElementById('fetchModelsBtn').addEventListener('click', () => {
            this.fetchModels();
        });
        
        // 保存当前配置
        document.getElementById('saveConfigBtn').addEventListener('click', () => {
            this.saveCurrentConfig();
        });
        
        // 保存为预设
        document.getElementById('saveAsPresetBtn').addEventListener('click', () => {
            this.openSavePresetModal();
        });
        
        // 测试语音
        document.getElementById('testVoiceBtn').addEventListener('click', () => {
            this.testVoice();
        });
        
        // 导出按钮
        document.getElementById('exportFullBtn').addEventListener('click', () => {
            this.openExportModal('full');
        });
        document.getElementById('exportStreamBtn').addEventListener('click', () => {
            this.openExportModal('stream');
        });
        document.getElementById('exportPartialBtn').addEventListener('click', () => {
            this.openPartialExportModal();
        });
        
        // 导入按钮
        document.getElementById('importFullBtn').addEventListener('click', () => {
            this.importManager.importFull();
        });
        document.getElementById('importStreamBtn').addEventListener('click', () => {
            this.importManager.importStream();
        });
        document.getElementById('importPartialBtn').addEventListener('click', () => {
            this.importManager.importPartial();
        });
        
        // 恢复出厂设置
        document.getElementById('resetFactoryBtn').addEventListener('click', () => {
            this.resetFactory();
        });
        
        // 保存预设弹窗
        document.getElementById('closeSavePresetModal').addEventListener('click', () => {
            this.closeSavePresetModal();
        });
        document.getElementById('confirmSavePresetBtn').addEventListener('click', () => {
            this.savePreset();
        });
        
        // 点击遮罩关闭
        document.getElementById('savePresetModal').addEventListener('click', (e) => {
            if (e.target.id === 'savePresetModal') {
                this.closeSavePresetModal();
            }
        });
        
        // 导出弹窗
        document.getElementById('closeExportModal').addEventListener('click', () => {
            this.closeExportModal();
        });
        document.getElementById('confirmExportBtn').addEventListener('click', () => {
            this.confirmExport();
        });
        document.getElementById('exportModal').addEventListener('click', (e) => {
            if (e.target.id === 'exportModal') {
                this.closeExportModal();
            }
        });
        
        // 部分导出弹窗
        document.getElementById('closePartialExportModal').addEventListener('click', () => {
            this.closePartialExportModal();
        });
        document.getElementById('confirmPartialExportBtn').addEventListener('click', () => {
            this.confirmPartialExport();
        });
        document.getElementById('partialExportModal').addEventListener('click', (e) => {
            if (e.target.id === 'partialExportModal') {
                this.closePartialExportModal();
            }
        });
    }
    
    // ==================== API配置相关 ====================
    
    // 拉取模型
    async fetchModels() {
        const endpoint = document.getElementById('apiEndpoint').value.trim();
        const apiKey = document.getElementById('apiKey').value.trim();
        
        if (!endpoint || !apiKey) {
            alert('❌ 请先填写接口地址和API密钥');
            return;
        }
        
        const btn = document.getElementById('fetchModelsBtn');
        btn.textContent = '拉取中...';
        btn.disabled = true;
        
        try {
            const models = await this.apiManager.fetchModels(endpoint, apiKey);
            
            // 更新模型选择
            const modelSelect = document.getElementById('modelSelect');
            modelSelect.innerHTML = models.map(model => 
                `<option value="${model.id}">${model.name}</option>`
            ).join('');
            
            // 显示模型选择
            document.getElementById('modelSelectGroup').style.display = 'block';
            
            alert(`✅ 成功拉取 ${models.length} 个模型`);
        } catch (e) {
            alert('❌ 拉取模型失败\n\n' + e.message);
        } finally {
            btn.textContent = '拉取模型';
            btn.disabled = false;
        }
    }
    
    // 保存当前配置
    saveCurrentConfig() {
        const provider = document.querySelector('input[name="provider"]:checked').value;
        const endpoint = document.getElementById('apiEndpoint').value.trim();
        const apiKey = document.getElementById('apiKey').value.trim();
        const model = document.getElementById('modelSelect').value;
        const maxTokens = parseInt(document.getElementById('maxTokens').value);
        const temperature = parseFloat(document.getElementById('temperature').value);
        
        if (!endpoint || !apiKey) {
            alert('❌ 请填写接口地址和API密钥');
            return;
        }
        
        const config = {
            provider,
            endpoint,
            apiKey,
            model,
            maxTokens,
            temperature
        };
        
        const success = this.apiManager.saveCurrentConfig(config);
        
        if (success) {
            alert('✅ 保存成功！');
        } else {
            alert('❌ 保存失败！');
        }
    }
    
    // ==================== 预设管理 ====================
    
    // 打开保存预设弹窗
    openSavePresetModal() {
        const config = this.getCurrentFormConfig();
        
        if (!config.endpoint || !config.apiKey) {
            alert('❌ 请先填写接口地址和API密钥');
            return;
        }
        
        // 显示配置预览
        const providerNames = {
            'google': 'Google Gemini',
            'openai': 'OpenAI',
            'anthropic': 'Anthropic',
            'siliconflow': 'SiliconFlow',
            'custom': '自定义'
        };
        
        const preview = document.getElementById('presetConfigPreview');
        preview.innerHTML = `
            <li>供应商: ${providerNames[config.provider]}</li>
            <li>域名: ${config.endpoint}</li>
            <li>模型: ${config.model || '未选择'}</li>
            <li>温度: ${config.temperature}</li>
        `;
        
        // 清空预设名称
        document.getElementById('presetName').value = '';
        
        // 显示弹窗
        document.getElementById('savePresetModal').style.display = 'flex';
    }
    
    // 关闭保存预设弹窗
    closeSavePresetModal() {
        document.getElementById('savePresetModal').style.display = 'none';
    }
    
    // 保存预设
    savePreset() {
        const name = document.getElementById('presetName').value.trim();
        
        if (!name) {
            alert('❌ 请输入预设名称');
            return;
        }
        
        const config = this.getCurrentFormConfig();
        config.name = name;
        
        const success = this.apiManager.savePreset(config);
        
        if (success) {
            this.closeSavePresetModal();
            this.renderPresetList();
            alert('✅ 预设保存成功！');
        } else {
            alert('❌ 预设名称重复！');
        }
    }
    
    // 获取当前表单配置
    getCurrentFormConfig() {
        return {
            provider: document.querySelector('input[name="provider"]:checked').value,
            endpoint: document.getElementById('apiEndpoint').value.trim(),
            apiKey: document.getElementById('apiKey').value.trim(),
            model: document.getElementById('modelSelect').value,
            maxTokens: parseInt(document.getElementById('maxTokens').value),
            temperature: parseFloat(document.getElementById('temperature').value)
        };
    }
    
    // 加载预设
    loadPreset(presetId) {
        const success = this.apiManager.loadPreset(presetId);
        
        if (success) {
            this.loadCurrentConfig();
            alert('✅ 预设加载成功！');
        } else {
            alert('❌ 加载失败！');
        }
    }
    
    // 删除预设
    deletePreset(presetId) {
        if (!confirm('确定要删除此预设吗？')) {
            return;
        }
        
        const success = this.apiManager.deletePreset(presetId);
        
        if (success) {
            this.renderPresetList();
            alert('✅ 删除成功！');
        } else {
            alert('❌ 删除失败！');
        }
    }
    
    // ==================== Minimax语音 ====================
    
    testVoice() {
        const config = {
            groupId: document.getElementById('minimaxGroupId').value.trim(),
            apiKey: document.getElementById('minimaxApiKey').value.trim(),
            voiceModel: document.getElementById('voiceModel').value,
            language: document.getElementById('voiceLanguage').value
        };
        
        if (!config.groupId || !config.apiKey) {
            alert('❌ 请填写Group ID和API Key');
            return;
        }
        
        // 保存配置
        this.apiManager.saveMinimaxConfig(config);
        
        // 测试语音
        this.apiManager.testVoice(config);
    }
    
    // ==================== 导出相关 ====================
    
    // 打开导出弹窗
    openExportModal(type) {
        this.currentExportType = type;
        
        const titles = {
            'full': '完整导出',
            'stream': '流式导出'
        };
        
        const descriptions = {
            'full': `
                <p>导出内容：</p>
                <ul>
                    <li>所有好友</li>
                    <li>所有聊天记录</li>
                    <li>所有记忆库</li>
                    <li>世界书</li>
                    <li>所有设置</li>
                </ul>
            `,
            'stream': `
                <p>说明：</p>
                <p>流式导出将分类后台导出，不会阻塞前台操作</p>
                <p>导出内容：</p>
                <ul>
                    <li>世界书 → 单独文件</li>
                    <li>好友 → 单独文件</li>
                    <li>聊天记录 → 单独文件</li>
                    <li>记忆库 → 单独文件</li>
                </ul>
            `
        };
        
        document.getElementById('exportModalTitle').textContent = titles[type];
        document.getElementById('exportOptionsContainer').innerHTML = descriptions[type];
        document.getElementById('exportModal').style.display = 'flex';
    }
    
    // 关闭导出弹窗
    closeExportModal() {
        document.getElementById('exportModal').style.display = 'none';
    }
    
    // 确认导出
    confirmExport() {
        const format = document.querySelector('input[name="exportFormat"]:checked').value;
        
        this.closeExportModal();
        
        if (this.currentExportType === 'full') {
            this.exportManager.exportFull(format);
        } else if (this.currentExportType === 'stream') {
            this.exportManager.exportStream(format);
        }
    }
    
    // 打开部分导出弹窗
    openPartialExportModal() {
        document.getElementById('partialExportModal').style.display = 'flex';
    }
    
    // 关闭部分导出弹窗
    closePartialExportModal() {
        document.getElementById('partialExportModal').style.display = 'none';
    }
    
    // 确认部分导出
    confirmPartialExport() {
        const format = document.querySelector('input[name="partialExportFormat"]:checked').value;
        
        // 获取选择的内容
        const checkboxes = document.querySelectorAll('#partialExportModal .checkbox-item input[type="checkbox"]');
        const options = {};
        
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                options[checkbox.value] = true;
            }
        });
        
        this.closePartialExportModal();
        this.exportManager.exportPartial(options, format);
    }
    
    // ==================== 恢复出厂设置 ====================
    
    resetFactory() {
        if (!confirm('⚠️ 警告！\n\n恢复出厂设置将删除所有数据：\n• 所有好友\n• 所有聊天记录\n• 所有记忆库\n• 世界书\n• API配置\n• 所有设置\n\n确定要继续吗？')) {
            return;
        }
        
        if (!confirm('⚠️ 最后确认！\n\n此操作不可撤销！\n\n确定要恢复出厂设置吗？')) {
            return;
        }
        
        // 清空所有数据
        const success = this.apiManager.storage.clearAll();
        
        if (success) {
            alert('✅ 已恢复出厂设置\n\n页面将刷新');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            alert('❌ 恢复失败！');
        }
    }
}

// 初始化
const coreApp = new CoreApp();
