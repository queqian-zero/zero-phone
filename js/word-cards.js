/* 字卡区 - Chat-style Word Cards (no API)
 * 共享 page3 的 localStorage 数据
 */

(function() {
    'use strict';

    const STORAGE = {
        quotes: 'p3_card_quotes',
        dividers: 'p3_divider_quotes',
        history: 'wc_chat_history',
        settings: 'wc_settings'
    };

    const DEFAULT_QUOTES = [
        '今天也是想你的一天', '你的名字是我见过最短的情诗', '想和你一起浪费时间',
        '你是我所有的不知所措', '遇见你 就像找到了我丢失的拼图',
        '我想陪你走过所有的四季', '你是例外 也是偏爱', '所有的心事都只和你有关',
        '晚安这个词 只有对你说的时候才有意义', '我在等你 也在等自己',
        '想见你 在每一个不经意的瞬间', '你是我最温柔的心事',
        '我的宇宙为你藏了无数个温柔星球', '有些人一旦遇见 便是一辈子',
        '不是所有的遇见都能被称为命运'
    ];

    const DEFAULT_DIVIDERS = [
        '跨越次元遇见你', '请永远停留在我的掌心', '你是我最想留住的幸运',
        '月亮不会奔你而来 但我会', '你是迟来的欢喜', '所有的温柔都是刚刚好',
        '世界很大 而我刚好遇见你', '想把温柔都给你', '你来时携风带雨 我无处可避',
        '今晚的月色真美', '此间的少年 是你', '你是我写过最好的故事',
        '所念皆星河 所遇皆温柔', '你是我藏在心底的光'
    ];

    // 工具
    function load(key, def) { try { var s=localStorage.getItem(key); if(s) return JSON.parse(s); } catch(e){} return [...def]; }
    function save(key, arr) { localStorage.setItem(key, JSON.stringify(arr)); }
    function rand(arr) { return arr.length ? arr[Math.floor(Math.random()*arr.length)] : ''; }
    function now() { var d=new Date(); return d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0'); }

    var overlay = null;
    var chatArea = null;
    var isTyping = false;

    // ==================== 聊天记录 ====================
    function loadHistory() { try { var s=localStorage.getItem(STORAGE.history); if(s) return JSON.parse(s); } catch(e){} return []; }
    function saveHistory(msgs) { localStorage.setItem(STORAGE.history, JSON.stringify(msgs.slice(-200))); }
    function addMsg(role, text) {
        var msgs = loadHistory();
        msgs.push({ role:role, text:text, time:now(), ts:Date.now() });
        saveHistory(msgs);
        return msgs;
    }

    // ==================== 创建页面 ====================
    function create() {
        if (document.querySelector('.wordcard-overlay')) return;

        overlay = document.createElement('div');
        overlay.className = 'wordcard-overlay';
        overlay.innerHTML =
            '<div class="wc-header">' +
                '<button class="wc-back" id="wcBack">‹</button>' +
                '<div class="wc-header-info">' +
                    '<div class="wc-header-name">字卡区</div>' +
                    '<div class="wc-header-status">随机回复 · 不使用API</div>' +
                '</div>' +
                '<div class="wc-header-btns">' +
                    '<button class="wc-header-btn" id="wcManage" title="管理字卡">☰</button>' +
                    '<button class="wc-header-btn" id="wcClear" title="清空记录">🗑</button>' +
                '</div>' +
            '</div>' +
            '<div class="wc-chat-area" id="wcChatArea"></div>' +
            '<div class="wc-input-area">' +
                '<button class="wc-extra-btn" id="wcQuickDraw" title="直接抽卡">🃏</button>' +
                '<textarea class="wc-input" id="wcInput" placeholder="说点什么..." rows="1"></textarea>' +
                '<button class="wc-send-btn" id="wcSend">↑</button>' +
            '</div>';

        document.body.appendChild(overlay);
        chatArea = overlay.querySelector('#wcChatArea');

        // 事件绑定
        overlay.querySelector('#wcBack').addEventListener('click', close);
        overlay.querySelector('#wcManage').addEventListener('click', openManage);
        overlay.querySelector('#wcClear').addEventListener('click', clearHistory);
        overlay.querySelector('#wcSend').addEventListener('click', sendMsg);
        overlay.querySelector('#wcQuickDraw').addEventListener('click', quickDraw);

        // 输入框
        var input = overlay.querySelector('#wcInput');
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
        });
        input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });

        // 渲染历史
        renderHistory();
    }

    // ==================== 渲染历史消息 ====================
    function renderHistory() {
        if (!chatArea) return;
        var msgs = loadHistory();

        if (msgs.length === 0) {
            chatArea.innerHTML =
                '<div class="wc-empty-state">' +
                    '<div class="wc-empty-icon">🃏</div>' +
                    '<div class="wc-empty-text">说点什么吧<br>我会从字卡库里挑一句回复你</div>' +
                '</div>';
            return;
        }

        chatArea.innerHTML = '';
        var lastDate = '';

        msgs.forEach(function(msg) {
            // 日期分割
            var d = new Date(msg.ts);
            var dateStr = d.getFullYear()+'/'+( d.getMonth()+1)+'/'+d.getDate();
            if (dateStr !== lastDate) {
                lastDate = dateStr;
                var divider = document.createElement('div');
                divider.className = 'wc-time-divider';
                divider.textContent = dateStr;
                chatArea.appendChild(divider);
            }

            appendBubble(msg.role, msg.text, msg.time, false);
        });

        scrollToBottom();
    }

    // ==================== 添加气泡 ====================
    function appendBubble(role, text, time, animate) {
        var wrapper = document.createElement('div');
        wrapper.className = 'wc-msg ' + (role === 'user' ? 'wc-msg-right' : 'wc-msg-left');
        if (animate) wrapper.style.animation = 'wcMsgIn 0.3s ease';

        var avatar = document.createElement('div');
        avatar.className = 'wc-msg-avatar';
        avatar.textContent = role === 'user' ? '🐱' : '🃏';

        var bubble = document.createElement('div');
        bubble.className = 'wc-msg-bubble';
        bubble.textContent = text;

        wrapper.appendChild(avatar);
        wrapper.appendChild(bubble);
        chatArea.appendChild(wrapper);
    }

    function scrollToBottom() {
        if (chatArea) {
            setTimeout(function() { chatArea.scrollTop = chatArea.scrollHeight; }, 50);
        }
    }

    // ==================== 发送消息 ====================
    function sendMsg() {
        if (isTyping) return;
        var input = overlay.querySelector('#wcInput');
        var text = input.value.trim();
        if (!text) return;

        input.value = '';
        input.style.height = 'auto';

        // 移除空状态
        var empty = chatArea.querySelector('.wc-empty-state');
        if (empty) empty.remove();

        // 添加用户消息
        addMsg('user', text);
        appendBubble('user', text, now(), true);
        scrollToBottom();

        // 延迟回复
        showTyping();
        isTyping = true;

        // 随机延迟 800ms-2500ms
        var delay = 800 + Math.random() * 1700;

        // 有概率回复多条 (75%一条, 20%两条, 5%三条)
        var count = Math.random() < 0.75 ? 1 : (Math.random() < 0.8 ? 2 : 3);

        replySequence(count, 0, delay);
    }

    function replySequence(total, current, delay) {
        if (current >= total) {
            hideTyping();
            isTyping = false;
            return;
        }

        setTimeout(function() {
            hideTyping();

            // 从两个库里随机取
            var allQuotes = [].concat(
                load(STORAGE.quotes, DEFAULT_QUOTES),
                load(STORAGE.dividers, DEFAULT_DIVIDERS)
            );

            if (allQuotes.length === 0) {
                appendBubble('card', '字卡库是空的哦，去管理页添加一些吧', now(), true);
                addMsg('card', '字卡库是空的哦，去管理页添加一些吧');
                isTyping = false;
                scrollToBottom();
                return;
            }

            var reply = rand(allQuotes);
            addMsg('card', reply);
            appendBubble('card', reply, now(), true);
            scrollToBottom();

            if (current + 1 < total) {
                // 多条回复之间的间隔
                setTimeout(function() { showTyping(); }, 200);
                replySequence(total, current + 1, 600 + Math.random() * 1000);
            } else {
                isTyping = false;
            }
        }, delay);
    }

    // ==================== 直接抽卡（不用输入） ====================
    function quickDraw() {
        if (isTyping) return;

        var empty = chatArea.querySelector('.wc-empty-state');
        if (empty) empty.remove();

        showTyping();
        isTyping = true;

        setTimeout(function() {
            hideTyping();
            var allQuotes = [].concat(
                load(STORAGE.quotes, DEFAULT_QUOTES),
                load(STORAGE.dividers, DEFAULT_DIVIDERS)
            );
            var reply = allQuotes.length ? rand(allQuotes) : '字卡库是空的';
            addMsg('card', reply);
            appendBubble('card', reply, now(), true);
            scrollToBottom();
            isTyping = false;
        }, 600 + Math.random() * 1200);
    }

    // ==================== 正在输入 ====================
    function showTyping() {
        hideTyping();
        var typing = document.createElement('div');
        typing.className = 'wc-typing';
        typing.id = 'wcTyping';
        typing.innerHTML =
            '<div class="wc-msg-avatar">🃏</div>' +
            '<div class="wc-typing-bubble">' +
                '<div class="wc-typing-dot"></div>' +
                '<div class="wc-typing-dot"></div>' +
                '<div class="wc-typing-dot"></div>' +
            '</div>';
        chatArea.appendChild(typing);
        scrollToBottom();
    }

    function hideTyping() {
        var t = document.getElementById('wcTyping');
        if (t) t.remove();
    }

    // ==================== 清空记录 ====================
    function clearHistory() {
        if (!confirm('确定清空所有聊天记录吗？')) return;
        localStorage.removeItem(STORAGE.history);
        renderHistory();
        toast('已清空');
    }

    // ==================== 管理页 ====================
    function openManage() {
        var existing = document.querySelector('.wc-manage-overlay');
        if (existing) existing.remove();

        var mo = document.createElement('div');
        mo.className = 'wc-manage-overlay';
        mo.innerHTML =
            '<div class="wc-manage-panel">' +
                '<div class="wc-manage-header">' +
                    '<span class="wc-manage-title">管理字卡库</span>' +
                    '<button class="wc-manage-close" id="wcMClose">✕</button>' +
                '</div>' +
                '<div class="wc-manage-body">' +
                    '<div class="wc-manage-section">' +
                        '<div class="wc-manage-sec-title">卡片文案</div>' +
                        '<div class="wc-manage-count" id="wcCardCount"></div>' +
                        '<div class="wc-manage-list" id="wcCardList"></div>' +
                        '<div class="wc-manage-add-row">' +
                            '<input type="text" class="wc-manage-input" id="wcCardInput" placeholder="输入新文案">' +
                            '<button class="wc-manage-add-btn" id="wcCardAdd">添加</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="wc-manage-section">' +
                        '<div class="wc-manage-sec-title">分割线文案</div>' +
                        '<div class="wc-manage-count" id="wcDivCount"></div>' +
                        '<div class="wc-manage-list" id="wcDivList"></div>' +
                        '<div class="wc-manage-add-row">' +
                            '<input type="text" class="wc-manage-input" id="wcDivInput" placeholder="输入新文案">' +
                            '<button class="wc-manage-add-btn" id="wcDivAdd">添加</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(mo);
        requestAnimationFrame(function() { mo.classList.add('active'); });

        mo.querySelector('#wcMClose').addEventListener('click', function() {
            mo.classList.remove('active');
            setTimeout(function() { mo.remove(); }, 200);
        });
        mo.addEventListener('click', function(e) {
            if (e.target === mo) { mo.classList.remove('active'); setTimeout(function() { mo.remove(); }, 200); }
        });

        // 渲染列表
        renderManageList(mo, 'wcCardList', 'wcCardCount', STORAGE.quotes, DEFAULT_QUOTES);
        renderManageList(mo, 'wcDivList', 'wcDivCount', STORAGE.dividers, DEFAULT_DIVIDERS);

        // 添加
        mo.querySelector('#wcCardAdd').addEventListener('click', function() {
            var inp = mo.querySelector('#wcCardInput');
            if (inp.value.trim()) {
                var arr = load(STORAGE.quotes, DEFAULT_QUOTES);
                arr.push(inp.value.trim());
                save(STORAGE.quotes, arr);
                inp.value = '';
                renderManageList(mo, 'wcCardList', 'wcCardCount', STORAGE.quotes, DEFAULT_QUOTES);
                toast('已添加');
            }
        });
        mo.querySelector('#wcDivAdd').addEventListener('click', function() {
            var inp = mo.querySelector('#wcDivInput');
            if (inp.value.trim()) {
                var arr = load(STORAGE.dividers, DEFAULT_DIVIDERS);
                arr.push(inp.value.trim());
                save(STORAGE.dividers, arr);
                inp.value = '';
                renderManageList(mo, 'wcDivList', 'wcDivCount', STORAGE.dividers, DEFAULT_DIVIDERS);
                toast('已添加');
            }
        });
    }

    function renderManageList(mo, listId, countId, storageKey, defaults) {
        var list = mo.querySelector('#' + listId);
        var countEl = mo.querySelector('#' + countId);
        var arr = load(storageKey, defaults);

        countEl.textContent = '共 ' + arr.length + ' 条';
        list.innerHTML = '';

        arr.forEach(function(q, i) {
            var item = document.createElement('div');
            item.className = 'wc-manage-item';
            item.innerHTML = '<span class="wc-manage-item-text">' + q + '</span><button class="wc-manage-item-del" data-idx="' + i + '">✕</button>';
            item.querySelector('.wc-manage-item-del').addEventListener('click', function() {
                arr.splice(i, 1);
                save(storageKey, arr);
                renderManageList(mo, listId, countId, storageKey, defaults);
                toast('已删除');
            });
            list.appendChild(item);
        });
    }

    // ==================== 工具 ====================
    function toast(msg) {
        var t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:white;padding:8px 20px;border-radius:20px;font-size:12px;z-index:999999;transition:opacity 0.3s;';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function() { t.style.opacity = '0'; setTimeout(function() { t.remove(); }, 300); }, 1200);
    }

    // ==================== 开关 ====================
    function open() {
        create();
        requestAnimationFrame(function() {
            overlay.classList.add('active');
            scrollToBottom();
        });
    }

    function close() {
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(function() {
                if (overlay) { overlay.remove(); overlay = null; chatArea = null; }
            }, 300);
        }
    }

    window.wordCardZone = { open: open, close: close };
})();
