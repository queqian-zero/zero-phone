// ==================== 次元剧场（线下角色扮演模式） ====================
class TheaterMode {
    constructor() {
        this._active = false;
        this._session = null; // 当前剧本session
        this._theme = 'dark'; // dark | light | scifi
        this._backstageOpen = false;
    }

    // ==================== 入口：点击红点弹窗 ====================
    openEntryDialog() {
        document.getElementById('theaterEntryDialog')?.remove();
        const ov = document.createElement('div');
        ov.id = 'theaterEntryDialog';
        ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9500;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);';
        
        ov.innerHTML = `<div style="width:calc(100% - 48px);max-width:340px;background:#1c1c1c;border-radius:20px;border:1px solid rgba(255,255,255,0.08);padding:28px 24px;animation:profileSlideUp 0.25s ease-out;">
            <div style="text-align:center;margin-bottom:6px;font-size:20px;letter-spacing:2px;">&#9670;</div>
            <div style="font-size:18px;font-weight:700;color:#fff;text-align:center;margin-bottom:6px;">次元剧场</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.3);text-align:center;margin-bottom:20px;line-height:1.6;">进入角色扮演模式<br>你和TA将化身剧本中的角色，展开一段故事</div>
            
            <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:16px;">
                <button id="theaterAiScript" style="padding:14px;border:1px solid rgba(240,147,43,0.2);border-radius:12px;background:rgba(240,147,43,0.08);color:#f0932b;font-size:14px;font-weight:600;cursor:pointer;text-align:left;">
                    <div>&#9998; 让TA来写剧本</div>
                    <div style="font-size:11px;font-weight:400;opacity:0.6;margin-top:4px;">AI参考聊天记录，自动构思世界观和角色</div>
                </button>
                <button id="theaterUserScript" style="padding:14px;border:1px solid rgba(255,255,255,0.08);border-radius:12px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.7);font-size:14px;cursor:pointer;text-align:left;">
                    <div>&#9997; 我来写剧本</div>
                    <div style="font-size:11px;opacity:0.4;margin-top:4px;">自己设定世界观、角色和背景</div>
                </button>
            </div>
            
            ${this._hasSavedSessions() ? `<button id="theaterLoadSave" style="width:100%;padding:12px;border:1px solid rgba(255,255,255,0.06);border-radius:10px;background:rgba(255,255,255,0.02);color:rgba(255,255,255,0.35);font-size:13px;cursor:pointer;margin-bottom:10px;">&#9654; 继续上次的剧本</button>` : ''}
            
            <button id="theaterCancel" style="width:100%;padding:10px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,0.2);font-size:13px;cursor:pointer;">取消</button>
        </div>`;
        
        document.body.appendChild(ov);
        
        ov.querySelector('#theaterAiScript')?.addEventListener('click', () => { ov.remove(); this._startAiScript(); });
        ov.querySelector('#theaterUserScript')?.addEventListener('click', () => { ov.remove(); this._openScriptEditor(); });
        ov.querySelector('#theaterLoadSave')?.addEventListener('click', () => { ov.remove(); this._loadSavedSession(); });
        ov.querySelector('#theaterCancel')?.addEventListener('click', () => ov.remove());
    }

    // ==================== 剧本编辑器（用户写剧本） ====================
    _openScriptEditor(prefill = {}) {
        document.getElementById('theaterScriptEditor')?.remove();
        
        const page = document.createElement('div');
        page.id = 'theaterScriptEditor';
        page.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9000;background:#111;display:flex;flex-direction:column;overflow:hidden;';
        
        page.innerHTML = `
            <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">
                <button id="tseBack" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;margin-right:8px;">&#8592;</button>
                <div style="flex:1;font-size:16px;font-weight:600;color:#fff;">编写剧本</div>
                <button id="tseStart" style="padding:6px 16px;border:none;border-radius:8px;background:rgba(240,147,43,0.15);color:#f0932b;font-size:13px;font-weight:600;cursor:pointer;">开演</button>
            </div>
            <div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px;min-height:0;">
                <!-- 世界观 -->
                <div style="margin-bottom:20px;">
                    <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:6px;">&#9670; 世界观 / 故事背景</div>
                    <textarea id="tseWorld" rows="4" placeholder="这个故事发生在什么样的世界？什么时代？有什么特别的设定？" style="width:100%;padding:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#fff;font-size:14px;line-height:1.6;resize:vertical;box-sizing:border-box;font-family:inherit;">${this._esc(prefill.world || '')}</textarea>
                </div>
                
                <!-- AI角色 -->
                <div style="margin-bottom:20px;">
                    <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:6px;">&#9670; TA扮演的角色</div>
                    <input type="text" id="tseCharName" placeholder="角色姓名" value="${this._esc(prefill.charName || '')}" style="width:100%;padding:10px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#fff;font-size:14px;margin-bottom:8px;box-sizing:border-box;">
                    <textarea id="tseCharPersona" rows="4" placeholder="角色的性格、背景、外貌、说话方式..." style="width:100%;padding:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#fff;font-size:14px;line-height:1.6;resize:vertical;box-sizing:border-box;font-family:inherit;">${this._esc(prefill.charPersona || '')}</textarea>
                </div>
                
                <!-- 用户角色 -->
                <div style="margin-bottom:20px;">
                    <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:6px;">&#9670; 你扮演的角色</div>
                    <input type="text" id="tseUserName" placeholder="角色姓名" value="${this._esc(prefill.userName || '')}" style="width:100%;padding:10px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#fff;font-size:14px;margin-bottom:8px;box-sizing:border-box;">
                    <textarea id="tseUserPersona" rows="3" placeholder="你的角色的性格、背景、外貌..." style="width:100%;padding:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#fff;font-size:14px;line-height:1.6;resize:vertical;box-sizing:border-box;font-family:inherit;">${this._esc(prefill.userPersona || '')}</textarea>
                </div>
                
                <!-- 开场白提示 -->
                <div style="margin-bottom:20px;">
                    <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:6px;">&#9670; 开场情境（可选）</div>
                    <textarea id="tseOpening" rows="2" placeholder="故事从哪里开始？第一幕的场景描述..." style="width:100%;padding:12px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;color:#fff;font-size:14px;line-height:1.6;resize:vertical;box-sizing:border-box;font-family:inherit;">${this._esc(prefill.opening || '')}</textarea>
                </div>
            </div>`;
        
        document.body.appendChild(page);
        
        page.querySelector('#tseBack').addEventListener('click', () => { page.remove(); this.openEntryDialog(); });
        page.querySelector('#tseStart').addEventListener('click', () => {
            const script = {
                world: page.querySelector('#tseWorld')?.value.trim() || '',
                charName: page.querySelector('#tseCharName')?.value.trim() || '',
                charPersona: page.querySelector('#tseCharPersona')?.value.trim() || '',
                userName: page.querySelector('#tseUserName')?.value.trim() || '',
                userPersona: page.querySelector('#tseUserPersona')?.value.trim() || '',
                opening: page.querySelector('#tseOpening')?.value.trim() || ''
            };
            if (!script.charName || !script.userName) {
                this._toast('请至少填写双方角色的姓名');
                return;
            }
            page.remove();
            this._startSession(script);
        });
    }

    // ==================== AI写剧本 ====================
    async _startAiScript() {
        const ci = window.chatInterface;
        if (!ci?.apiManager) { this._toast('API不可用'); return; }
        
        this._toast('TA正在构思剧本...');
        
        const friendName = ci.currentFriend?.nickname || ci.currentFriend?.name || 'TA';
        const friendPersona = ci.currentFriend?.persona || '';
        const recentMsgs = ci.messages.slice(-20).map(m => `${m.type === 'user' ? 'user' : friendName}: ${m.text.substring(0, 100)}`).join('\n');
        
        const prompt = `你是${friendName}。现在user想和你玩一个角色扮演游戏（次元剧场）。
请你根据你们的关系和最近的聊天内容，构思一个有趣的剧本。

你的人设：${friendPersona.substring(0, 500)}

最近的聊天片段：
${recentMsgs}

请用以下JSON格式输出剧本（不要输出其他内容）：
{
  "world": "世界观/故事背景（50-200字）",
  "charName": "你在剧本中扮演的角色姓名",
  "charPersona": "你的角色人设（50-150字）",
  "userName": "user在剧本中扮演的角色姓名",
  "userPersona": "user的角色人设（50-150字）",
  "opening": "开场情境描述（30-100字）"
}`;
        
        try {
            const result = await ci.apiManager.callAI([{ type: 'user', text: '请为我们构思一个角色扮演剧本' }], prompt);
            if (!result.success) { this._toast('构思失败：' + (result.error || '未知错误')); return; }
            
            let script;
            try {
                const jsonStr = result.text.replace(/```json|```/g, '').trim();
                script = JSON.parse(jsonStr);
            } catch (e) {
                this._toast('AI返回格式有误，请手动编辑');
                this._openScriptEditor();
                return;
            }
            
            // 打开编辑器让用户确认/修改
            this._openScriptEditor(script);
        } catch (e) {
            this._toast('网络错误');
        }
    }

    // ==================== 开始Session ====================
    _startSession(script) {
        this._session = {
            id: 'theater_' + Date.now(),
            script,
            messages: [],
            backstageMessages: [],
            createdAt: new Date().toISOString(),
            friendCode: window.chatInterface?.currentFriendCode || ''
        };
        this._active = true;
        this._saveCurrentSession();
        this._openTheaterUI();
    }

    // ==================== 剧场主界面 ====================
    _openTheaterUI() {
        if (!this._session) return;
        document.getElementById('theaterUI')?.remove();
        
        const s = this._session.script;
        const theme = this._getThemeStyles();
        
        const ui = document.createElement('div');
        ui.id = 'theaterUI';
        ui.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;z-index:8500;display:flex;flex-direction:column;background:${theme.bg};color:${theme.text};font-family:'PingFang SC','Helvetica Neue',sans-serif;`;
        
        ui.innerHTML = `
            <!-- 顶栏 -->
            <div style="display:flex;align-items:center;padding:10px 14px;border-bottom:1px solid ${theme.border};flex-shrink:0;">
                <button id="theaterExit" style="background:none;border:none;color:${theme.sub};font-size:18px;cursor:pointer;">&#8592;</button>
                <div style="flex:1;text-align:center;">
                    <div style="font-size:14px;font-weight:600;color:${theme.text};">次元剧场</div>
                    <div style="font-size:10px;color:${theme.sub};">${this._esc(s.charName)} & ${this._esc(s.userName)}</div>
                </div>
                <button id="theaterSettings" style="background:none;border:none;color:${theme.sub};font-size:16px;cursor:pointer;">&#9881;</button>
            </div>
            
            <!-- 消息区 -->
            <div id="theaterMessages" style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:12px 16px;min-height:0;">
                ${this._session.messages.length === 0 ? `<div style="text-align:center;padding:30px 0;color:${theme.sub};font-size:12px;line-height:1.8;">
                    &#9670; 幕起 &#9670;<br>${this._esc(s.opening || '故事开始了...')}
                </div>` : ''}
                ${this._session.messages.map(m => this._renderTheaterMessage(m, theme)).join('')}
            </div>
            
            <!-- 输入区 -->
            <div style="padding:10px 14px calc(10px + env(safe-area-inset-bottom));border-top:1px solid ${theme.border};display:flex;gap:8px;flex-shrink:0;align-items:flex-end;">
                <button id="theaterBackstage" style="padding:8px;border:none;border-radius:8px;background:${theme.itemBg};color:${theme.sub};font-size:12px;cursor:pointer;flex-shrink:0;" title="皮下沟通">OOC</button>
                <textarea id="theaterInput" rows="1" placeholder="以 ${this._esc(s.userName)} 的身份说话..." style="flex:1;padding:10px 12px;background:${theme.itemBg};border:1px solid ${theme.border};border-radius:10px;color:${theme.text};font-size:14px;resize:none;font-family:inherit;max-height:100px;"></textarea>
                <button id="theaterSend" style="padding:8px 14px;border:none;border-radius:8px;background:rgba(240,147,43,0.15);color:#f0932b;font-size:13px;font-weight:600;cursor:pointer;flex-shrink:0;">&#9654;</button>
            </div>`;
        
        document.body.appendChild(ui);
        this._bindTheaterEvents(ui);
        this._scrollTheaterBottom();
    }

    // ==================== 渲染单条剧场消息 ====================
    _renderTheaterMessage(msg, theme) {
        if (msg.type === 'system') {
            return `<div style="text-align:center;padding:8px 0;font-size:11px;color:${theme.sub};font-style:italic;">${this._esc(msg.text)}</div>`;
        }
        
        const isChar = msg.type === 'char';
        const name = isChar ? this._session.script.charName : this._session.script.userName;
        const nameColor = isChar ? '#f0932b' : 'rgba(100,180,255,0.8)';
        
        // 状态栏（仅char消息有）
        let statusHtml = '';
        if (isChar && msg.status) {
            const st = msg.status;
            statusHtml = `<div class="theater-status" style="margin-top:8px;padding:10px;background:${theme.itemBg};border-radius:8px;border:1px solid ${theme.border};font-size:11px;line-height:1.8;">
                ${st.mood ? `<div><span style="color:${theme.sub};">&#9829; 心情：</span>${this._esc(st.mood)}</div>` : ''}
                ${st.outfit ? `<div><span style="color:${theme.sub};">&#9734; 衣着：</span>${this._esc(st.outfit)}</div>` : ''}
                ${st.action ? `<div><span style="color:${theme.sub};">&#9654; 动作：</span>${this._esc(st.action)}</div>` : ''}
                ${st.thought ? `<div><span style="color:${theme.sub};">&#9826; 内心：</span><span style="font-style:italic;opacity:0.7;">${this._esc(st.thought)}</span></div>` : ''}
                ${st.note ? `<div><span style="color:${theme.sub};">&#9998; 碎碎念：</span><span style="opacity:0.6;">${this._esc(st.note)}</span></div>` : ''}
                ${st.relationship ? `<div><span style="color:${theme.sub};">&#9734; 关系：</span>${this._esc(st.relationship)}</div>` : ''}
            </div>`;
        }
        
        // 题头（char消息）
        let headerHtml = '';
        if (isChar && msg.header) {
            headerHtml = `<div style="font-size:10px;color:${theme.sub};margin-bottom:6px;">${this._esc(msg.header)}</div>`;
        }
        
        return `<div style="margin-bottom:16px;">
            ${headerHtml}
            <div style="font-size:13px;font-weight:600;color:${nameColor};margin-bottom:4px;">${this._esc(name)}</div>
            <div style="font-size:14px;line-height:1.8;color:${theme.text};white-space:pre-wrap;">${this._esc(msg.text)}</div>
            ${statusHtml}
        </div>`;
    }

    // ==================== 事件绑定 ====================
    _bindTheaterEvents(ui) {
        // 退出
        ui.querySelector('#theaterExit')?.addEventListener('click', () => this._confirmExit('user'));
        
        // 设置
        ui.querySelector('#theaterSettings')?.addEventListener('click', () => this._openTheaterSettings());
        
        // 发送
        ui.querySelector('#theaterSend')?.addEventListener('click', () => this._sendTheaterMessage());
        ui.querySelector('#theaterInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._sendTheaterMessage(); }
        });
        
        // OOC皮下沟通
        ui.querySelector('#theaterBackstage')?.addEventListener('click', () => this._openBackstage());
    }

    // ==================== 发送消息 ====================
    async _sendTheaterMessage() {
        const input = document.getElementById('theaterInput');
        const text = input?.value.trim();
        if (!text) return;
        input.value = '';
        
        // 添加用户消息
        this._session.messages.push({ type: 'user', text, timestamp: new Date().toISOString() });
        this._saveCurrentSession();
        this._openTheaterUI();
        
        // 调用API获取AI回复
        const ci = window.chatInterface;
        if (!ci?.apiManager) return;
        
        const s = this._session.script;
        const now = new Date();
        const timeStr = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${['日','一','二','三','四','五','六'][now.getDay()]} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
        
        const systemPrompt = `【次元剧场】你现在是角色扮演中的角色，不是你平时的人设。
你知道这是一个角色扮演游戏，不是真的见面。

世界观：${s.world}

你扮演的角色：
姓名：${s.charName}
人设：${s.charPersona}

对方扮演的角色：
姓名：${s.userName}
人设：${s.userPersona}

当前时间：${timeStr}

请用以下格式回复（严格遵守）：
HEADER: 时间地点（例：${timeStr} | 咖啡馆二楼靠窗位）
TEXT: 你的角色说的话和动作描写（可以包含*动作描写*和对话）
MOOD: 心情（颜文字+文字，例：(≧▽≦) 超级开心）
OUTFIT: 当前衣着
ACTION: 当前动作
THOUGHT: 内心活动
NOTE: 这轮的碎碎念（可选）
RELATIONSHIP: 与${s.userName}当前的关系感受

如果你想中断角色扮演，回复：[THEATER_END]理由`;
        
        const history = this._session.messages.slice(-20).map(m => ({
            type: m.type === 'user' ? 'user' : 'ai',
            text: m.text
        }));
        
        try {
            const result = await ci.apiManager.callAI(history, systemPrompt);
            if (!result.success) return;
            
            const aiText = result.text.trim();
            
            // 检查是否AI要中断
            if (aiText.includes('[THEATER_END]')) {
                const reason = aiText.replace(/\[THEATER_END\]/, '').trim();
                this._session.messages.push({ type: 'system', text: `${s.charName} 结束了角色扮演${reason ? '：' + reason : ''}` });
                this._saveCurrentSession();
                this._confirmExit('ai');
                return;
            }
            
            // 解析格式化回复
            const msg = this._parseTheaterResponse(aiText);
            this._session.messages.push(msg);
            this._saveCurrentSession();
            this._openTheaterUI();
        } catch (e) {
            console.error('Theater API error:', e);
        }
    }

    // ==================== 解析AI回复 ====================
    _parseTheaterResponse(text) {
        const get = (key) => { const m = text.match(new RegExp(`${key}:\\s*(.+?)(?=\\n[A-Z]+:|$)`, 's')); return m ? m[1].trim() : ''; };
        
        const mainText = get('TEXT') || text;
        const msg = {
            type: 'char',
            text: mainText,
            timestamp: new Date().toISOString(),
            header: get('HEADER') || '',
            status: {
                mood: get('MOOD') || '',
                outfit: get('OUTFIT') || '',
                action: get('ACTION') || '',
                thought: get('THOUGHT') || '',
                note: get('NOTE') || '',
                relationship: get('RELATIONSHIP') || ''
            }
        };
        return msg;
    }

    // ==================== 退出确认 ====================
    async _confirmExit(who) {
        const s = this._session?.script;
        const msg = who === 'ai' 
            ? `${s?.charName || 'TA'} 想要结束这次角色扮演。\n确定退出次元剧场吗？`
            : '确定退出次元剧场吗？\n剧本会自动保存。';
        
        const ok = window.zpConfirm ? await window.zpConfirm('次元剧场', msg, '退出', '继续') : confirm(msg);
        if (!ok) return;
        
        this._saveCurrentSession();
        this._active = false;
        document.getElementById('theaterUI')?.remove();
    }

    // ==================== 皮下沟通（OOC） ====================
    _openBackstage() {
        document.getElementById('theaterBackstagePanel')?.remove();
        
        const panel = document.createElement('div');
        panel.id = 'theaterBackstagePanel';
        panel.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9200;display:flex;flex-direction:column;background:rgba(0,0,0,0.85);backdrop-filter:blur(10px);';
        
        const msgs = this._session?.backstageMessages || [];
        
        panel.innerHTML = `
            <div style="display:flex;align-items:center;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;">
                <button id="bsClose" style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:18px;cursor:pointer;">&#8592;</button>
                <div style="flex:1;text-align:center;font-size:14px;color:rgba(255,255,255,0.6);">皮下沟通（OOC）</div>
            </div>
            <div style="flex:1;padding:12px 16px;font-size:11px;color:rgba(255,255,255,0.25);text-align:center;margin-top:20px;">
                在这里以真实身份交流，不影响剧本进程
            </div>
            <div style="padding:10px 14px calc(10px + env(safe-area-inset-bottom));border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:8px;flex-shrink:0;">
                <textarea id="bsInput" rows="1" placeholder="以真实身份说话..." style="flex:1;padding:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;font-size:14px;resize:none;font-family:inherit;"></textarea>
                <button id="bsSend" style="padding:8px 14px;border:none;border-radius:8px;background:rgba(240,147,43,0.15);color:#f0932b;font-size:13px;cursor:pointer;">发送</button>
            </div>`;
        
        document.body.appendChild(panel);
        panel.querySelector('#bsClose')?.addEventListener('click', () => panel.remove());
    }

    // ==================== 设置面板 ====================
    _openTheaterSettings() {
        document.getElementById('theaterSettingsPanel')?.remove();
        const panel = document.createElement('div');
        panel.id = 'theaterSettingsPanel';
        panel.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9200;display:flex;align-items:flex-end;justify-content:center;background:rgba(0,0,0,0.5);';
        
        panel.innerHTML = `<div style="width:100%;background:#1a1a1a;border-radius:16px 16px 0 0;padding:20px 16px calc(16px + env(safe-area-inset-bottom));max-height:60vh;overflow-y:auto;animation:profileSlideUp 0.25s ease-out;">
            <div style="font-size:16px;font-weight:600;color:#fff;text-align:center;margin-bottom:16px;">剧场设置</div>
            
            <div style="font-size:12px;color:rgba(255,255,255,0.3);margin-bottom:6px;">主题</div>
            <div style="display:flex;gap:8px;margin-bottom:16px;">
                ${['dark', 'light', 'scifi'].map(t => `<button class="theater-theme-btn" data-theme="${t}" style="flex:1;padding:10px;border:1px solid ${this._theme === t ? 'rgba(240,147,43,0.4)' : 'rgba(255,255,255,0.06)'};border-radius:10px;background:${this._theme === t ? 'rgba(240,147,43,0.1)' : 'rgba(255,255,255,0.03)'};color:${this._theme === t ? '#f0932b' : 'rgba(255,255,255,0.5)'};font-size:13px;cursor:pointer;">${{dark:'深色',light:'浅色',scifi:'科幻'}[t]}</button>`).join('')}
            </div>
            
            <button id="theaterViewScript" style="width:100%;padding:12px;border:1px solid rgba(255,255,255,0.06);border-radius:10px;background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.5);font-size:13px;cursor:pointer;margin-bottom:8px;">查看世界观与角色设定</button>
            <button id="theaterExitFromSettings" style="width:100%;padding:12px;border:1px solid rgba(255,60,60,0.15);border-radius:10px;background:rgba(255,60,60,0.05);color:rgba(255,100,100,0.6);font-size:13px;cursor:pointer;margin-bottom:8px;">退出剧场</button>
            <button id="theaterSettingsClose" style="width:100%;padding:10px;border:none;border-radius:10px;background:transparent;color:rgba(255,255,255,0.2);font-size:13px;cursor:pointer;">关闭</button>
        </div>`;
        
        document.body.appendChild(panel);
        
        panel.querySelectorAll('.theater-theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._theme = btn.dataset.theme;
                panel.remove();
                this._openTheaterUI();
            });
        });
        panel.querySelector('#theaterViewScript')?.addEventListener('click', () => { panel.remove(); this._viewScript(); });
        panel.querySelector('#theaterExitFromSettings')?.addEventListener('click', () => { panel.remove(); this._confirmExit('user'); });
        panel.querySelector('#theaterSettingsClose')?.addEventListener('click', () => panel.remove());
    }

    // ==================== 查看剧本 ====================
    _viewScript() {
        const s = this._session?.script;
        if (!s) return;
        document.getElementById('theaterScriptView')?.remove();
        const ov = document.createElement('div');
        ov.id = 'theaterScriptView';
        ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9300;background:#111;display:flex;flex-direction:column;overflow:hidden;';
        ov.innerHTML = `
            <div style="display:flex;align-items:center;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.04);flex-shrink:0;">
                <button id="svBack" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:20px;cursor:pointer;">&#8592;</button>
                <div style="flex:1;font-size:16px;font-weight:600;color:#fff;text-align:center;">剧本设定</div>
            </div>
            <div style="flex:1;overflow-y:auto;padding:16px;min-height:0;">
                <div style="margin-bottom:16px;"><div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:4px;">世界观</div><div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;white-space:pre-wrap;">${this._esc(s.world || '未设定')}</div></div>
                <div style="margin-bottom:16px;"><div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:4px;">${this._esc(s.charName)} 的人设</div><div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;white-space:pre-wrap;">${this._esc(s.charPersona || '未设定')}</div></div>
                <div style="margin-bottom:16px;"><div style="font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:4px;">${this._esc(s.userName)} 的人设</div><div style="font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;white-space:pre-wrap;">${this._esc(s.userPersona || '未设定')}</div></div>
            </div>`;
        document.body.appendChild(ov);
        ov.querySelector('#svBack')?.addEventListener('click', () => { ov.remove(); this._openTheaterSettings(); });
    }

    // ==================== 主题样式 ====================
    _getThemeStyles() {
        const themes = {
            dark: { bg: '#0d0d0d', text: '#e0e0e0', sub: 'rgba(255,255,255,0.3)', border: 'rgba(255,255,255,0.05)', itemBg: 'rgba(255,255,255,0.04)' },
            light: { bg: '#f5f5f0', text: '#222', sub: 'rgba(0,0,0,0.35)', border: 'rgba(0,0,0,0.08)', itemBg: 'rgba(0,0,0,0.03)' },
            scifi: { bg: '#050a15', text: '#a0d4ff', sub: 'rgba(100,180,255,0.3)', border: 'rgba(0,150,255,0.1)', itemBg: 'rgba(0,100,255,0.05)' }
        };
        return themes[this._theme] || themes.dark;
    }

    // ==================== 存档 ====================
    _saveCurrentSession() {
        if (!this._session) return;
        const ci = window.chatInterface;
        if (!ci?.storage) return;
        const data = ci.storage.getIntimacyData(this._session.friendCode);
        if (!data.theaterSessions) data.theaterSessions = [];
        const idx = data.theaterSessions.findIndex(s => s.id === this._session.id);
        if (idx >= 0) data.theaterSessions[idx] = this._session;
        else data.theaterSessions.push(this._session);
        ci.storage.saveIntimacyData(this._session.friendCode, data);
    }

    _hasSavedSessions() {
        const ci = window.chatInterface;
        if (!ci?.storage || !ci.currentFriendCode) return false;
        const data = ci.storage.getIntimacyData(ci.currentFriendCode);
        return (data.theaterSessions || []).length > 0;
    }

    _loadSavedSession() {
        const ci = window.chatInterface;
        if (!ci?.storage) return;
        const data = ci.storage.getIntimacyData(ci.currentFriendCode);
        const sessions = data.theaterSessions || [];
        if (sessions.length === 0) { this._toast('没有保存的剧本'); return; }
        // 加载最近的
        this._session = sessions[sessions.length - 1];
        this._active = true;
        this._openTheaterUI();
    }

    _scrollTheaterBottom() {
        setTimeout(() => {
            const el = document.getElementById('theaterMessages');
            if (el) el.scrollTop = el.scrollHeight;
        }, 50);
    }

    _esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    _toast(msg) { window.chatInterface?.showCssToast?.(msg) || alert(msg); }
}

// 全局
window.theaterMode = new TheaterMode();
