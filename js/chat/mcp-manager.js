/* MCP Manager - Model Context Protocol 工具管理 */

class MCPManager {
    constructor() {
        this.STORAGE_KEY_PREFIX = 'zero_phone_mcp_';
        // { serverId: { eventSource, endpoint, status, tools[] } }
        this.connections = {};
    }
    
    // 获取存储实例
    _storage() {
        return window.chatApp?.storage || new StorageManager();
    }

    // ==================== 存储 ====================

    // 获取某个好友的MCP服务器列表
    getServers(friendCode) {
        return this._storage().getData(this.STORAGE_KEY_PREFIX + friendCode) || [];
    }

    // 保存某个好友的MCP服务器列表
    saveServers(friendCode, servers) {
        this._storage().saveData(this.STORAGE_KEY_PREFIX + friendCode, servers);
    }

    // 添加MCP服务器
    addServer(friendCode, name, sseUrl) {
        const servers = this.getServers(friendCode);
        const id = 'mcp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
        servers.push({
            id,
            name,
            sseUrl,
            enabled: true,
            tools: [],
            connectedAt: null
        });
        this.saveServers(friendCode, servers);
        return id;
    }

    // 删除MCP服务器
    removeServer(friendCode, serverId) {
        this.disconnect(serverId);
        let servers = this.getServers(friendCode);
        servers = servers.filter(s => s.id !== serverId);
        this.saveServers(friendCode, servers);
    }

    // 切换服务器启用/禁用
    toggleServer(friendCode, serverId, enabled) {
        const servers = this.getServers(friendCode);
        const server = servers.find(s => s.id === serverId);
        if (server) {
            server.enabled = enabled;
            if (!enabled) this.disconnect(serverId);
            this.saveServers(friendCode, servers);
        }
    }

    // ==================== SSE 连接 ====================

    // 连接到MCP服务器
    async connect(friendCode, serverId) {
        const servers = this.getServers(friendCode);
        const server = servers.find(s => s.id === serverId);
        if (!server) throw new Error('服务器不存在');

        // 先断开旧连接
        this.disconnect(serverId);

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.disconnect(serverId);
                reject(new Error('连接超时（15秒）'));
            }, 15000);

            try {
                console.log(`🔌 [MCP] 连接 SSE: ${server.sseUrl}`);
                const es = new EventSource(server.sseUrl);

                this.connections[serverId] = {
                    eventSource: es,
                    endpoint: null,
                    status: 'connecting'
                };

                es.addEventListener('endpoint', (event) => {
                    console.log(`🔗 [MCP] 收到 endpoint: ${event.data}`);
                    // endpoint可能是相对路径或绝对路径
                    let endpointUrl = event.data;
                    if (!endpointUrl.startsWith('http')) {
                        // 相对路径：基于SSE URL构建
                        const base = new URL(server.sseUrl);
                        endpointUrl = base.origin + endpointUrl;
                    }
                    this.connections[serverId].endpoint = endpointUrl;
                    this.connections[serverId].status = 'connected';
                    clearTimeout(timeout);

                    // 自动执行 initialize 握手
                    this._initialize(serverId)
                        .then(() => this._fetchTools(serverId))
                        .then(tools => {
                            // 更新存储
                            server.tools = tools;
                            server.connectedAt = new Date().toISOString();
                            this.saveServers(friendCode, servers);
                            resolve(tools);
                        })
                        .catch(err => {
                            this.disconnect(serverId);
                            reject(err);
                        });
                });

                es.onerror = (err) => {
                    console.error('❌ [MCP] SSE 错误:', err);
                    clearTimeout(timeout);
                    this.disconnect(serverId);
                    reject(new Error('SSE连接失败，请检查地址是否正确'));
                };
            } catch (err) {
                clearTimeout(timeout);
                reject(err);
            }
        });
    }

    // 断开连接
    disconnect(serverId) {
        const conn = this.connections[serverId];
        if (conn) {
            if (conn.eventSource) {
                conn.eventSource.close();
            }
            delete this.connections[serverId];
            console.log(`🔌 [MCP] 已断开: ${serverId}`);
        }
    }

    // 检查是否连接中
    isConnected(serverId) {
        return this.connections[serverId]?.status === 'connected';
    }

    // ==================== JSON-RPC 调用 ====================

    // 发送 JSON-RPC 请求
    async _jsonRpc(serverId, method, params = {}) {
        const conn = this.connections[serverId];
        if (!conn || !conn.endpoint) {
            throw new Error('服务器未连接');
        }

        const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2, 4);
        const body = {
            jsonrpc: '2.0',
            id: requestId,
            method,
            params
        };

        console.log(`📤 [MCP] JSON-RPC 请求: ${method}`, params);

        const response = await fetch(conn.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`MCP请求失败 (HTTP ${response.status}): ${errText}`);
        }

        const data = await response.json();
        console.log(`📥 [MCP] JSON-RPC 响应:`, data);

        if (data.error) {
            throw new Error(`MCP错误: ${data.error.message || JSON.stringify(data.error)}`);
        }

        return data.result;
    }

    // initialize 握手
    async _initialize(serverId) {
        return this._jsonRpc(serverId, 'initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
                name: 'zero-phone',
                version: '1.0.0'
            }
        });
    }

    // 获取工具列表
    async _fetchTools(serverId) {
        const result = await this._jsonRpc(serverId, 'tools/list', {});
        return (result.tools || []).map(tool => ({
            name: tool.name,
            description: tool.description || '',
            inputSchema: tool.inputSchema || {}
        }));
    }

    // 调用工具
    async callTool(serverId, toolName, args = {}) {
        console.log(`🔧 [MCP] 调用工具: ${toolName}`, args);
        const result = await this._jsonRpc(serverId, 'tools/call', {
            name: toolName,
            arguments: args
        });
        return result;
    }

    // ==================== 聊天集成 ====================

    // 获取某个好友所有已启用且有工具的MCP服务器+工具列表
    getEnabledTools(friendCode) {
        const servers = this.getServers(friendCode);
        const tools = [];
        for (const server of servers) {
            if (!server.enabled || !server.tools || server.tools.length === 0) continue;
            for (const tool of server.tools) {
                tools.push({
                    serverId: server.id,
                    serverName: server.name,
                    toolName: tool.name,
                    description: tool.description,
                    inputSchema: tool.inputSchema
                });
            }
        }
        return tools;
    }

    // 构建注入到系统prompt的工具描述（精简版，省token）
    buildToolPrompt(friendCode) {
        const tools = this.getEnabledTools(friendCode);
        if (tools.length === 0) return '';

        let prompt = '\n\n【MCP工具】你可以通过以下工具与外部服务交互。需要使用工具时，在回复中加入 [TOOL_CALL:工具名:JSON参数] 标签。';
        prompt += '\n⚠️ 注意：JSON参数必须是合法的JSON对象格式（用双引号），不能省略。如果不需要参数就写 {}';
        prompt += '\n⚠️ 一次回复可以调用多个工具，每个工具一个标签。系统会按顺序执行，把结果都返回给你后你再继续回复。';
        prompt += '\n⚠️ 如果你需要调用工具，请只输出工具调用标签，不要同时输出给用户看的回复文字（工具结果返回后你再说话）。';
        prompt += '\n可用工具：';

        const byServer = {};
        for (const t of tools) {
            if (!byServer[t.serverName]) byServer[t.serverName] = [];
            byServer[t.serverName].push(t);
        }

        for (const [serverName, serverTools] of Object.entries(byServer)) {
            prompt += `\n  [${serverName}]`;
            for (const t of serverTools) {
                prompt += `\n    - ${t.toolName}：${t.description || '无描述'}`;
                // 如果有参数schema，给出必填参数提示
                if (t.inputSchema?.required?.length > 0) {
                    prompt += `（必填参数：${t.inputSchema.required.join(', ')}）`;
                }
            }
        }

        prompt += '\n\n调用示例：[TOOL_CALL:search:{"query":"今天天气"}]';
        return prompt;
    }

    // 解析AI回复中的 TOOL_CALL 标签
    parseToolCalls(text) {
        const calls = [];
        // 使用平衡匹配手动解析，支持嵌套JSON
        const prefix = '[TOOL_CALL:';
        let searchFrom = 0;
        while (true) {
            const start = text.indexOf(prefix, searchFrom);
            if (start === -1) break;
            
            // 找工具名（第一个冒号之后到第二个冒号之间）
            const afterPrefix = start + prefix.length;
            const colonPos = text.indexOf(':', afterPrefix);
            if (colonPos === -1) break;
            const toolName = text.substring(afterPrefix, colonPos).trim();
            
            // 找JSON（从冒号后到匹配的 }] ）
            const jsonStart = text.indexOf('{', colonPos);
            if (jsonStart === -1) break;
            
            // 计数大括号找到匹配的闭合
            let depth = 0;
            let jsonEnd = -1;
            for (let i = jsonStart; i < text.length; i++) {
                if (text[i] === '{') depth++;
                else if (text[i] === '}') {
                    depth--;
                    if (depth === 0) { jsonEnd = i; break; }
                }
            }
            if (jsonEnd === -1) break;
            
            // 检查 }] 闭合
            const closeBracket = text.indexOf(']', jsonEnd);
            if (closeBracket === -1) break;
            
            const fullMatch = text.substring(start, closeBracket + 1);
            const jsonStr = text.substring(jsonStart, jsonEnd + 1);
            
            try {
                const args = JSON.parse(jsonStr);
                calls.push({ toolName, args, fullMatch });
            } catch (e) {
                console.warn('⚠️ [MCP] 无法解析工具参数:', jsonStr, e);
                calls.push({ toolName, args: {}, fullMatch, parseError: true });
            }
            
            searchFrom = closeBracket + 1;
        }
        return calls;
    }

    // 根据工具名找到对应的serverId
    findServerForTool(friendCode, toolName) {
        const servers = this.getServers(friendCode);
        for (const server of servers) {
            if (!server.enabled) continue;
            if (server.tools?.some(t => t.name === toolName)) {
                return server.id;
            }
        }
        return null;
    }

    // 确保服务器已连接（如果没连接，尝试重连）
    async ensureConnected(friendCode, serverId) {
        if (this.isConnected(serverId)) return true;
        try {
            await this.connect(friendCode, serverId);
            return true;
        } catch (e) {
            console.error('❌ [MCP] 重连失败:', e);
            return false;
        }
    }

    // 断开所有连接
    disconnectAll() {
        for (const sid of Object.keys(this.connections)) {
            this.disconnect(sid);
        }
    }
}

// 全局单例
window.mcpManager = new MCPManager();
