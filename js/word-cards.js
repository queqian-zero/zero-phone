/* 字卡区 v4 - 第二批功能: 音效 + 表情 + 拍一拍 + 图片
 * 共享 page3 的 localStorage 数据
 */

(function() {
    'use strict';

    var STORAGE = {
        quotes: 'p3_card_quotes',
        dividers: 'p3_divider_quotes',
        history: 'wc_chat_history',
        settings: 'wc_settings',
        wallpaper: 'wc_wallpaper',
        myAvatar: 'wc_my_avatar',
        partnerAvatar: 'wc_partner_avatar',
        favorites: 'wc_favorites',
        pokes: 'wc_pokes'
    };

    var DEFAULT_QUOTES = [
        '今天也是想你的一天', '你的名字是我见过最短的情诗', '想和你一起浪费时间',
        '你是我所有的不知所措', '遇见你 就像找到了我丢失的拼图',
        '我想陪你走过所有的四季', '你是例外 也是偏爱', '所有的心事都只和你有关',
        '晚安这个词 只有对你说的时候才有意义', '我在等你 也在等自己',
        '想见你 在每一个不经意的瞬间', '你是我最温柔的心事',
        '我的宇宙为你藏了无数个温柔星球', '有些人一旦遇见 便是一辈子',
        '不是所有的遇见都能被称为命运'
    ];

    var DEFAULT_DIVIDERS = [
        '跨越次元遇见你', '请永远停留在我的掌心', '你是我最想留住的幸运',
        '月亮不会奔你而来 但我会', '你是迟来的欢喜', '所有的温柔都是刚刚好',
        '世界很大 而我刚好遇见你', '想把温柔都给你', '你来时携风带雨 我无处可避',
        '今晚的月色真美', '此间的少年 是你', '你是我写过最好的故事',
        '所念皆星河 所遇皆温柔', '你是我藏在心底的光'
    ];

    var DEFAULT_SETTINGS = {
        myName: '我',
        partnerName: '字卡',
        delayMin: 800,
        delayMax: 2500,
        multiReply: true,
        soundEnabled: true
    };

    var DEFAULT_POKES = [
        '{me}拍了拍{partner}的肩膀',
        '{me}戳了戳{partner}的脸',
        '{me}向{partner}扔了一个枕头',
        '{me}揉了揉{partner}的头',
        '{me}捏了捏{partner}的脸蛋',
        '{partner}被{me}拍了一下，假装很痛',
        '{me}偷偷戳了{partner}的腰',
        '{partner}被{me}吓了一跳'
    ];

    // ==================== 表情库 ====================
    var EMOJI_SETS = {
        smileys: ['😊','😂','🥺','😍','🤔','😭','🥰','😘','😏','🤣','😅','😳','🙃','😴','🤗','😤','😢','🫣','😋','🤭','😎','🥱','😵','🫠','🤡','👀','💀','✨','❤️','💕','💔','🔥','👋','👏','🤝','💪','🙏','👍','👎','✌️'],
        animals: ['🐱','🐶','🐰','🦊','🐻','🐼','🐨','🐷','🐸','🐵','🦄','🐝','🦋','🐢','🐙','🐳','🐬','🦈','🐧','🐤','🦉','🐺','🦁','🐮','🐴'],
        food: ['☕','🧋','🍰','🍦','🍩','🍪','🍫','🍭','🍓','🍑','🍒','🥑','🍕','🍔','🍜','🍣','🎂','🧁','🍿','🥤'],
        symbols: ['💫','⭐','🌙','☀️','🌈','🍀','🌸','🌺','💐','🎀','🎵','🎶','💌','🏠','🎮','📷','🎨','📚','🔮','🪐']
    };
    var EMOJI_TAB_ICONS = { smileys: '😊', animals: '🐱', food: '☕', symbols: '💫' };

    // ==================== 工具 ====================
    function load(key, def) { try { var s = localStorage.getItem(key); if (s) return JSON.parse(s); } catch(e){} return typeof def === 'object' ? JSON.parse(JSON.stringify(def)) : def; }
    function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
    function rand(arr) { return arr.length ? arr[Math.floor(Math.random() * arr.length)] : ''; }
    function timeStr() { var d = new Date(); return d.getHours().toString().padStart(2,'0') + ':' + d.getMinutes().toString().padStart(2,'0'); }
    function dateStr(ts) { var d = new Date(ts); return d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate(); }
    function getSettings() { return load(STORAGE.settings, DEFAULT_SETTINGS); }
    function saveSettings(s) { save(STORAGE.settings, s); }
    function getFavorites() { return load(STORAGE.favorites, []); }
    function saveFavorites(f) { save(STORAGE.favorites, f); }
    function getPokes() { return load(STORAGE.pokes, DEFAULT_POKES); }
    function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    var overlay = null;
    var chatArea = null;
    var isTyping = false;
    var emojiPanelOpen = false;

    // ==================== 音效（Web Audio API） ====================
    var audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) {
            try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
        }
        return audioCtx;
    }

    function playSound(type) {
        var s = getSettings();
        if (!s.soundEnabled) return;
        var ctx = getAudioCtx();
        if (!ctx) return;

        var osc = ctx.createOscillator();
        var gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.value = 0.08;

        if (type === 'send') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.12);
        } else if (type === 'receive') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(660, ctx.currentTime);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.15);
        } else if (type === 'poke') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.25);
        }
    }

    // ==================== 历史 ====================
    function loadHistory() { return load(STORAGE.history, []); }
    function saveHistory(msgs) { save(STORAGE.history, msgs.slice(-300)); }
    function addMsg(role, text, type) {
        var msgs = loadHistory();
        var msg = { id: Date.now() + '_' + Math.random().toString(36).substr(2,4), role: role, text: text, time: timeStr(), ts: Date.now(), status: role === 'user' ? 'sent' : '', type: type || 'text' };
        msgs.push(msg);
        saveHistory(msgs);
        return msg;
    }

    // ==================== 头像 ====================
    function getAvatarHTML(role) {
        var key = role === 'user' ? STORAGE.myAvatar : STORAGE.partnerAvatar;
        var src = localStorage.getItem(key);
        if (src) return '<img src="' + src + '">';
        return role === 'user' ? '🐱' : '🃏';
    }

    // ==================== 创建页面 ====================
    function create() {
        if (document.querySelector('.wordcard-overlay')) return;
        var settings = getSettings();

        overlay = document.createElement('div');
        overlay.className = 'wordcard-overlay';
        overlay.innerHTML =
            '<div class="wc-header">' +
                '<button class="wc-back" id="wcBack">‹</button>' +
                '<div class="wc-header-info">' +
                    '<div class="wc-header-name" id="wcHeaderName">' + esc(settings.partnerName) + '</div>' +
                    '<div class="wc-header-status">字卡回复 · 随机抽取</div>' +
                '</div>' +
                '<div class="wc-header-btns">' +
                    '<button class="wc-header-btn" id="wcPoke" title="拍一拍">👋</button>' +
                    '<button class="wc-header-btn" id="wcSettings" title="设置">⚙</button>' +
                    '<button class="wc-header-btn" id="wcManage" title="管理字卡">☰</button>' +
                '</div>' +
            '</div>' +
            '<div class="wc-chat-area" id="wcChatArea"></div>' +
            '<div class="wc-input-area">' +
                '<button class="wc-extra-btn" id="wcQuickDraw" title="直接抽卡">🃏</button>' +
                '<button class="wc-extra-btn" id="wcEmojiToggle" title="表情">😊</button>' +
                '<button class="wc-extra-btn" id="wcImageBtn" title="图片">🖼</button>' +
                '<textarea class="wc-input" id="wcInput" placeholder="说点什么..." rows="1"></textarea>' +
                '<button class="wc-send-btn" id="wcSend">↑</button>' +
            '</div>';

        document.body.appendChild(overlay);
        chatArea = overlay.querySelector('#wcChatArea');

        // 壁纸
        var wp = localStorage.getItem(STORAGE.wallpaper);
        if (wp) { chatArea.style.backgroundImage = 'url(' + wp + ')'; chatArea.classList.add('has-wallpaper'); }

        // 事件
        overlay.querySelector('#wcBack').addEventListener('click', close);
        overlay.querySelector('#wcSettings').addEventListener('click', openSettings);
        overlay.querySelector('#wcManage').addEventListener('click', openManage);
        overlay.querySelector('#wcSend').addEventListener('click', sendMsg);
        overlay.querySelector('#wcQuickDraw').addEventListener('click', quickDraw);
        overlay.querySelector('#wcPoke').addEventListener('click', doPoke);
        overlay.querySelector('#wcEmojiToggle').addEventListener('click', toggleEmojiPanel);
        overlay.querySelector('#wcImageBtn').addEventListener('click', pickImage);

        var input = overlay.querySelector('#wcInput');
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
        });
        input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });
        input.addEventListener('focus', function() { closeEmojiPanel(); });

        chatArea.addEventListener('click', function(e) {
            if (!e.target.closest('.wc-context-menu')) closeContextMenu();
        });

        renderHistory();
    }

    // ==================== 渲染历史 ====================
    function renderHistory() {
        if (!chatArea) return;
        var msgs = loadHistory();
        var favs = getFavorites();

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
            var d = dateStr(msg.ts);
            if (d !== lastDate) {
                lastDate = d;
                var div = document.createElement('div');
                div.className = 'wc-time-divider';
                div.textContent = d;
                chatArea.appendChild(div);
            }
            if (msg.type === 'poke') {
                appendPokeMsg(msg.text, false);
            } else {
                var isFav = favs.indexOf(String(msg.id)) >= 0;
                appendBubble(msg, false, isFav);
            }
        });

        markAllRead();
        scrollToBottom();
    }

    // ==================== 气泡 ====================
    function appendBubble(msg, animate, isFav) {
        var isUser = msg.role === 'user';
        var wrapper = document.createElement('div');
        wrapper.className = 'wc-msg ' + (isUser ? 'wc-msg-right' : 'wc-msg-left');
        wrapper.dataset.id = msg.id;
        if (animate) wrapper.style.animation = 'wcMsgIn 0.3s ease';

        var avatar = document.createElement('div');
        avatar.className = 'wc-msg-avatar';
        avatar.innerHTML = getAvatarHTML(msg.role);

        var col = document.createElement('div');

        if (msg.type === 'image') {
            var imgWrap = document.createElement('div');
            imgWrap.className = 'wc-msg-image';
            imgWrap.innerHTML = '<img src="' + msg.text + '">';
            imgWrap.addEventListener('click', function() { previewImage(msg.text); });
            col.appendChild(imgWrap);
        } else {
            var bubble = document.createElement('div');
            bubble.className = 'wc-msg-bubble' + (isFav ? ' favorited' : '');
            bubble.textContent = msg.text;

            // 长按菜单
            var pressTimer;
            bubble.addEventListener('touchstart', function(e) {
                pressTimer = setTimeout(function() {
                    showContextMenu(e.touches[0].clientX, e.touches[0].clientY, msg);
                }, 500);
            }, { passive: true });
            bubble.addEventListener('touchend', function() { clearTimeout(pressTimer); });
            bubble.addEventListener('touchmove', function() { clearTimeout(pressTimer); });
            bubble.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                showContextMenu(e.clientX, e.clientY, msg);
            });
            col.appendChild(bubble);
        }

        // 时间+状态
        var meta = document.createElement('div');
        meta.className = 'wc-msg-meta';
        var timeEl = '<span class="wc-msg-time">' + (msg.time || '') + '</span>';
        var statusEl = '';
        if (isUser) {
            var sc = msg.status === 'read' ? 'read' : '';
            var st = msg.status === 'read' ? '已读' : (msg.status === 'delivered' ? '已送达' : '已发送');
            statusEl = '<span class="wc-msg-status ' + sc + '">' + st + '</span>';
        }
        meta.innerHTML = isUser ? statusEl + timeEl : timeEl;
        col.appendChild(meta);

        wrapper.appendChild(avatar);
        wrapper.appendChild(col);
        chatArea.appendChild(wrapper);
    }

    function scrollToBottom() {
        if (chatArea) setTimeout(function() { chatArea.scrollTop = chatArea.scrollHeight; }, 50);
    }

    function markAllRead() {
        var msgs = loadHistory();
        var changed = false;
        msgs.forEach(function(m) { if (m.role === 'user' && m.status !== 'read') { m.status = 'read'; changed = true; } });
        if (changed) saveHistory(msgs);
    }

    // ==================== 发送消息 ====================
    function sendMsg() {
        if (isTyping) return;
        var input = overlay.querySelector('#wcInput');
        var text = input.value.trim();
        if (!text) return;
        input.value = '';
        input.style.height = 'auto';
        closeEmojiPanel();

        var empty = chatArea.querySelector('.wc-empty-state');
        if (empty) empty.remove();

        var msg = addMsg('user', text);
        appendBubble(msg, true, false);
        scrollToBottom();
        playSound('send');
        scheduleReply();
    }

    function scheduleReply() {
        var settings = getSettings();
        var delay = settings.delayMin + Math.random() * (settings.delayMax - settings.delayMin);
        var count = 1;
        if (settings.multiReply) count = Math.random() < 0.75 ? 1 : (Math.random() < 0.8 ? 2 : 3);

        showTypingIndicator();
        isTyping = true;

        setTimeout(function() { updateUserStatus('delivered'); }, Math.min(delay * 0.4, 800));
        replySequence(count, 0, delay);
    }

    function replySequence(total, current, delay) {
        if (current >= total) {
            hideTypingIndicator();
            isTyping = false;
            updateUserStatus('read');
            return;
        }

        setTimeout(function() {
            hideTypingIndicator();
            var allQuotes = [].concat(load(STORAGE.quotes, DEFAULT_QUOTES), load(STORAGE.dividers, DEFAULT_DIVIDERS));

            if (!allQuotes.length) {
                var msg = addMsg('card', '字卡库是空的，去管理页添加一些吧');
                appendBubble(msg, true, false);
                isTyping = false; scrollToBottom(); return;
            }

            var reply = rand(allQuotes);
            var msg = addMsg('card', reply);
            appendBubble(msg, true, false);
            scrollToBottom();
            playSound('receive');

            if (current + 1 < total) {
                setTimeout(function() { showTypingIndicator(); }, 200);
                var s = getSettings();
                replySequence(total, current + 1, s.delayMin * 0.5 + Math.random() * s.delayMin);
            } else {
                isTyping = false;
                updateUserStatus('read');
            }
        }, delay);
    }

    function updateUserStatus(status) {
        var msgs = loadHistory();
        var changed = false;
        msgs.forEach(function(m) { if (m.role === 'user' && m.status !== 'read') { m.status = status; changed = true; } });
        if (changed) {
            saveHistory(msgs);
            if (chatArea) {
                chatArea.querySelectorAll('.wc-msg-right .wc-msg-status').forEach(function(el) {
                    if (!el.classList.contains('read')) {
                        el.textContent = status === 'read' ? '已读' : '已送达';
                        if (status === 'read') el.classList.add('read');
                    }
                });
            }
        }
    }

    // ==================== 直接抽卡 ====================
    function quickDraw() {
        if (isTyping) return;
        var empty = chatArea.querySelector('.wc-empty-state');
        if (empty) empty.remove();
        showTypingIndicator();
        isTyping = true;
        var s = getSettings();
        setTimeout(function() {
            hideTypingIndicator();
            var allQuotes = [].concat(load(STORAGE.quotes, DEFAULT_QUOTES), load(STORAGE.dividers, DEFAULT_DIVIDERS));
            var reply = allQuotes.length ? rand(allQuotes) : '字卡库是空的';
            var msg = addMsg('card', reply);
            appendBubble(msg, true, false);
            scrollToBottom(); isTyping = false;
            playSound('receive');
        }, s.delayMin * 0.5 + Math.random() * s.delayMin);
    }

    // ==================== 正在输入 ====================
    function showTypingIndicator() {
        hideTypingIndicator();
        var s = getSettings();
        var typing = document.createElement('div');
        typing.className = 'wc-typing'; typing.id = 'wcTyping';
        typing.innerHTML = '<div class="wc-msg-avatar">' + getAvatarHTML('card') + '</div><div class="wc-typing-bubble"><div class="wc-typing-dot"></div><div class="wc-typing-dot"></div><div class="wc-typing-dot"></div></div>';
        chatArea.appendChild(typing);
        scrollToBottom();
        var hs = overlay ? overlay.querySelector('.wc-header-status') : null;
        if (hs) hs.textContent = s.partnerName + ' 正在输入...';
    }

    function hideTypingIndicator() {
        var t = document.getElementById('wcTyping');
        if (t) t.remove();
        var hs = overlay ? overlay.querySelector('.wc-header-status') : null;
        if (hs) hs.textContent = '字卡回复 · 随机抽取';
    }

    // ==================== 表情面板 ====================
    function toggleEmojiPanel() {
        if (emojiPanelOpen) { closeEmojiPanel(); return; }
        var inputArea = overlay.querySelector('.wc-input-area');
        var panel = document.createElement('div');
        panel.className = 'wc-emoji-panel';
        panel.id = 'wcEmojiPanel';

        var tabsHtml = '<div class="wc-emoji-tabs">';
        var keys = Object.keys(EMOJI_SETS);
        keys.forEach(function(k, i) {
            tabsHtml += '<button class="wc-emoji-tab' + (i === 0 ? ' active' : '') + '" data-set="' + k + '">' + EMOJI_TAB_ICONS[k] + '</button>';
        });
        tabsHtml += '</div>';

        var gridHtml = '<div class="wc-emoji-grid" id="wcEmojiGrid">';
        EMOJI_SETS[keys[0]].forEach(function(e) {
            gridHtml += '<div class="wc-emoji-item">' + e + '</div>';
        });
        gridHtml += '</div>';

        panel.innerHTML = tabsHtml + gridHtml;
        inputArea.appendChild(panel);
        emojiPanelOpen = true;

        // Tab切换
        panel.querySelectorAll('.wc-emoji-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                panel.querySelectorAll('.wc-emoji-tab').forEach(function(t) { t.classList.remove('active'); });
                this.classList.add('active');
                var grid = panel.querySelector('#wcEmojiGrid');
                var set = EMOJI_SETS[this.dataset.set] || [];
                grid.innerHTML = '';
                set.forEach(function(e) {
                    var item = document.createElement('div');
                    item.className = 'wc-emoji-item';
                    item.textContent = e;
                    item.addEventListener('click', function() { insertEmoji(e); });
                    grid.appendChild(item);
                });
            });
        });

        // 点击emoji插入
        panel.querySelectorAll('.wc-emoji-item').forEach(function(item) {
            item.addEventListener('click', function() { insertEmoji(this.textContent); });
        });
    }

    function insertEmoji(emoji) {
        var input = overlay.querySelector('#wcInput');
        if (input) {
            var start = input.selectionStart;
            var end = input.selectionEnd;
            input.value = input.value.substring(0, start) + emoji + input.value.substring(end);
            input.selectionStart = input.selectionEnd = start + emoji.length;
            input.focus();
        }
    }

    function closeEmojiPanel() {
        var panel = document.getElementById('wcEmojiPanel');
        if (panel) panel.remove();
        emojiPanelOpen = false;
    }

    // ==================== 图片发送 ====================
    function pickImage() {
        var input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(ev) { sendImage(ev.target.result); };
            reader.readAsDataURL(file);
        });
        input.click();
    }

    function sendImage(dataUrl) {
        var empty = chatArea.querySelector('.wc-empty-state');
        if (empty) empty.remove();

        var msg = addMsg('user', dataUrl, 'image');
        appendBubble(msg, true, false);
        scrollToBottom();
        playSound('send');

        // 对方用文字回复图片
        scheduleReply();
    }

    function previewImage(src) {
        var preview = document.createElement('div');
        preview.className = 'wc-image-preview';
        preview.innerHTML = '<img src="' + src + '">';
        preview.addEventListener('click', function() { preview.remove(); });
        document.body.appendChild(preview);
    }

    // ==================== 拍一拍 ====================
    function doPoke() {
        if (isTyping) return;
        var settings = getSettings();
        var pokes = getPokes();
        var template = rand(pokes);
        var text = template.replace(/\{me\}/g, settings.myName).replace(/\{partner\}/g, settings.partnerName);

        var empty = chatArea.querySelector('.wc-empty-state');
        if (empty) empty.remove();

        addMsg('system', text, 'poke');
        appendPokeMsg(text, true);
        scrollToBottom();
        playSound('poke');

        // 屏幕晃动
        if (overlay) {
            overlay.classList.add('wc-shake');
            setTimeout(function() { overlay.classList.remove('wc-shake'); }, 400);
        }

        // 对方有概率拍回来
        if (Math.random() < 0.4) {
            setTimeout(function() {
                var template2 = rand(pokes);
                var text2 = template2.replace(/\{me\}/g, settings.partnerName).replace(/\{partner\}/g, settings.myName);
                addMsg('system', text2, 'poke');
                appendPokeMsg(text2, true);
                scrollToBottom();
                playSound('poke');
                if (overlay) {
                    overlay.classList.add('wc-shake');
                    setTimeout(function() { overlay.classList.remove('wc-shake'); }, 400);
                }
            }, 1000 + Math.random() * 1500);
        }
    }

    function appendPokeMsg(text, animate) {
        var el = document.createElement('div');
        el.className = 'wc-poke-msg';
        if (!animate) el.style.animation = 'none';
        el.innerHTML = '<span class="wc-poke-text">' + esc(text) + '</span>';
        chatArea.appendChild(el);
    }

    // ==================== 长按菜单 ====================
    function showContextMenu(x, y, msg) {
        closeContextMenu();
        var favs = getFavorites();
        var isFav = favs.indexOf(String(msg.id)) >= 0;
        var menu = document.createElement('div');
        menu.className = 'wc-context-menu';
        var items = [
            { icon: '📋', label: '复制', action: 'copy' },
            { icon: isFav ? '💔' : '❤️', label: isFav ? '取消收藏' : '收藏', action: 'fav' },
            { icon: '🗑', label: '删除', action: 'delete', danger: true }
        ];
        items.forEach(function(item) {
            var btn = document.createElement('button');
            btn.className = 'wc-context-item' + (item.danger ? ' danger' : '');
            btn.innerHTML = '<span class="wc-context-item-icon">' + item.icon + '</span>' + item.label;
            btn.addEventListener('click', function() { closeContextMenu(); handleContextAction(item.action, msg); });
            menu.appendChild(btn);
        });
        menu.style.left = Math.min(x, window.innerWidth - 160) + 'px';
        menu.style.top = Math.min(y, window.innerHeight - 160) + 'px';
        document.body.appendChild(menu);
        setTimeout(function() { document.addEventListener('click', closeContextMenuOnce); }, 10);
    }
    function closeContextMenuOnce(e) { if (!e.target.closest('.wc-context-menu')) { closeContextMenu(); document.removeEventListener('click', closeContextMenuOnce); } }
    function closeContextMenu() { var m = document.querySelector('.wc-context-menu'); if (m) m.remove(); }

    function handleContextAction(action, msg) {
        if (action === 'copy') {
            navigator.clipboard.writeText(msg.text).catch(function() {
                var ta = document.createElement('textarea'); ta.value = msg.text; ta.style.cssText = 'position:fixed;opacity:0;';
                document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
            });
            toast('已复制');
        } else if (action === 'fav') {
            var favs = getFavorites(); var idx = favs.indexOf(String(msg.id));
            if (idx >= 0) { favs.splice(idx, 1); toast('已取消收藏'); }
            else { favs.push(String(msg.id)); toast('已收藏'); }
            saveFavorites(favs); renderHistory();
        } else if (action === 'delete') {
            var msgs = loadHistory(); var i = msgs.findIndex(function(m) { return String(m.id) === String(msg.id); });
            if (i >= 0) { msgs.splice(i, 1); saveHistory(msgs); renderHistory(); toast('已删除'); }
        }
    }

    // ==================== 设置面板 ====================
    function openSettings() {
        var existing = document.querySelector('.wc-manage-overlay');
        if (existing) existing.remove();
        var settings = getSettings();
        var myAv = localStorage.getItem(STORAGE.myAvatar);
        var partnerAv = localStorage.getItem(STORAGE.partnerAvatar);

        var mo = document.createElement('div');
        mo.className = 'wc-manage-overlay';
        mo.innerHTML =
            '<div class="wc-manage-panel">' +
                '<div class="wc-manage-header"><span class="wc-manage-title">设置</span><button class="wc-manage-close" id="wcSetClose">✕</button></div>' +
                '<div class="wc-manage-body">' +
                    '<div class="wc-settings-section"><div class="wc-settings-label">头像</div><div class="wc-avatar-edit"><div class="wc-avatar-edit-item" id="wcEditMyAv"><div class="wc-avatar-edit-preview" id="wcMyAvP">' + (myAv ? '<img src="'+myAv+'">' : '🐱') + '</div><span class="wc-avatar-edit-label">我</span></div><div class="wc-avatar-edit-item" id="wcEditPartnerAv"><div class="wc-avatar-edit-preview" id="wcPartnerAvP">' + (partnerAv ? '<img src="'+partnerAv+'">' : '🃏') + '</div><span class="wc-avatar-edit-label">字卡</span></div></div></div>' +
                    '<div class="wc-settings-section"><div class="wc-settings-label">昵称</div><div class="wc-name-row"><input class="wc-name-input" id="wcMyName" placeholder="我的昵称" value="' + esc(settings.myName) + '"><input class="wc-name-input" id="wcPartnerName" placeholder="字卡昵称" value="' + esc(settings.partnerName) + '"></div></div>' +
                    '<div class="wc-settings-section"><div class="wc-settings-label">回复延迟</div><div class="wc-settings-row"><span class="wc-settings-row-label">最短</span><span class="wc-settings-row-value" id="wcDMinV">' + (settings.delayMin/1000).toFixed(1) + 's</span></div><input type="range" class="wc-range" id="wcDMin" min="200" max="5000" step="100" value="' + settings.delayMin + '"><div class="wc-settings-row"><span class="wc-settings-row-label">最长</span><span class="wc-settings-row-value" id="wcDMaxV">' + (settings.delayMax/1000).toFixed(1) + 's</span></div><input type="range" class="wc-range" id="wcDMax" min="500" max="10000" step="100" value="' + settings.delayMax + '"></div>' +
                    '<div class="wc-settings-section"><div class="wc-settings-label">音效</div><div class="wc-sound-toggle"><span class="wc-settings-row-label">发送/接收提示音</span><button class="wc-switch' + (settings.soundEnabled ? ' on' : '') + '" id="wcSoundToggle"></button></div></div>' +
                    '<div class="wc-settings-section"><div class="wc-settings-label">聊天壁纸</div><div class="wc-wallpaper-row"><button class="wc-wallpaper-btn" id="wcWpUp">上传壁纸</button><button class="wc-wallpaper-btn danger" id="wcWpCl">清除</button></div></div>' +
                    '<div class="wc-settings-section"><div class="wc-settings-label">拍一拍管理</div><div class="wc-manage-count" id="wcPokeCount"></div><div class="wc-manage-list" id="wcPokeList"></div><div class="wc-manage-add-row"><input type="text" class="wc-manage-input" id="wcPokeInput" placeholder="用{me}和{partner}占位"><button class="wc-manage-add-btn" id="wcPokeAdd">添加</button></div></div>' +
                    '<button class="wc-manage-clear-btn" id="wcClearH">清空聊天记录</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(mo);
        requestAnimationFrame(function() { mo.classList.add('active'); });

        // 关闭+保存
        function closeAndSave() {
            var s = getSettings();
            s.myName = mo.querySelector('#wcMyName').value.trim() || '我';
            s.partnerName = mo.querySelector('#wcPartnerName').value.trim() || '字卡';
            s.delayMin = parseInt(mo.querySelector('#wcDMin').value);
            s.delayMax = parseInt(mo.querySelector('#wcDMax').value);
            if (s.delayMax < s.delayMin) s.delayMax = s.delayMin + 500;
            saveSettings(s);
            var hn = overlay ? overlay.querySelector('#wcHeaderName') : null;
            if (hn) hn.textContent = s.partnerName;
            mo.classList.remove('active');
            setTimeout(function() { mo.remove(); }, 200);
        }

        mo.querySelector('#wcSetClose').addEventListener('click', closeAndSave);
        mo.addEventListener('click', function(e) { if (e.target === mo) closeAndSave(); });

        // 滑块
        mo.querySelector('#wcDMin').addEventListener('input', function() { mo.querySelector('#wcDMinV').textContent = (this.value/1000).toFixed(1)+'s'; });
        mo.querySelector('#wcDMax').addEventListener('input', function() { mo.querySelector('#wcDMaxV').textContent = (this.value/1000).toFixed(1)+'s'; });

        // 音效开关
        mo.querySelector('#wcSoundToggle').addEventListener('click', function() {
            this.classList.toggle('on');
            var s = getSettings(); s.soundEnabled = this.classList.contains('on'); saveSettings(s);
        });

        // 头像
        mo.querySelector('#wcEditMyAv').addEventListener('click', function() {
            uploadImage(function(u) { localStorage.setItem(STORAGE.myAvatar, u); mo.querySelector('#wcMyAvP').innerHTML = '<img src="'+u+'">'; renderHistory(); toast('头像已更新'); });
        });
        mo.querySelector('#wcEditPartnerAv').addEventListener('click', function() {
            uploadImage(function(u) { localStorage.setItem(STORAGE.partnerAvatar, u); mo.querySelector('#wcPartnerAvP').innerHTML = '<img src="'+u+'">'; renderHistory(); toast('头像已更新'); });
        });

        // 壁纸
        mo.querySelector('#wcWpUp').addEventListener('click', function() {
            uploadImage(function(u) { localStorage.setItem(STORAGE.wallpaper, u); if (chatArea) { chatArea.style.backgroundImage='url('+u+')'; chatArea.classList.add('has-wallpaper'); } toast('壁纸已更新'); });
        });
        mo.querySelector('#wcWpCl').addEventListener('click', function() {
            localStorage.removeItem(STORAGE.wallpaper); if (chatArea) { chatArea.style.backgroundImage=''; chatArea.classList.remove('has-wallpaper'); } toast('壁纸已清除');
        });

        // 拍一拍管理
        renderPokeList(mo);
        mo.querySelector('#wcPokeAdd').addEventListener('click', function() {
            var inp = mo.querySelector('#wcPokeInput');
            if (inp.value.trim()) {
                var arr = getPokes(); arr.push(inp.value.trim()); save(STORAGE.pokes, arr); inp.value = '';
                renderPokeList(mo); toast('已添加');
            }
        });

        // 清空记录
        mo.querySelector('#wcClearH').addEventListener('click', function() {
            if (confirm('确定清空所有聊天记录吗？')) {
                localStorage.removeItem(STORAGE.history); renderHistory(); closeAndSave(); toast('已清空');
            }
        });
    }

    function renderPokeList(mo) {
        var arr = getPokes();
        var list = mo.querySelector('#wcPokeList');
        var count = mo.querySelector('#wcPokeCount');
        count.textContent = '共 ' + arr.length + ' 条（用{me}代表自己，{partner}代表对方）';
        list.innerHTML = '';
        arr.forEach(function(p, i) {
            var item = document.createElement('div');
            item.className = 'wc-manage-item';
            item.innerHTML = '<span class="wc-manage-item-text">' + esc(p) + '</span><button class="wc-manage-item-del" data-idx="' + i + '">✕</button>';
            item.querySelector('.wc-manage-item-del').addEventListener('click', function() {
                arr.splice(i, 1); save(STORAGE.pokes, arr); renderPokeList(mo); toast('已删除');
            });
            list.appendChild(item);
        });
    }

    function uploadImage(cb) {
        var input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
        input.addEventListener('change', function(e) {
            var file = e.target.files[0]; if (!file) return;
            var reader = new FileReader();
            reader.onload = function(ev) { cb(ev.target.result); };
            reader.readAsDataURL(file);
        });
        input.click();
    }

    // ==================== 管理字卡库 ====================
    function openManage() {
        var existing = document.querySelector('.wc-manage-overlay');
        if (existing) existing.remove();
        var mo = document.createElement('div');
        mo.className = 'wc-manage-overlay';
        mo.innerHTML =
            '<div class="wc-manage-panel">' +
                '<div class="wc-manage-header"><span class="wc-manage-title">管理字卡库</span><button class="wc-manage-close" id="wcMClose">✕</button></div>' +
                '<div class="wc-manage-body">' +
                    '<div class="wc-manage-section"><div class="wc-manage-sec-title">卡片文案</div><div class="wc-manage-count" id="wcCC"></div><div class="wc-manage-list" id="wcCL"></div><div class="wc-manage-add-row"><input type="text" class="wc-manage-input" id="wcCI" placeholder="输入新文案"><button class="wc-manage-add-btn" id="wcCA">添加</button></div></div>' +
                    '<div class="wc-manage-section"><div class="wc-manage-sec-title">分割线文案</div><div class="wc-manage-count" id="wcDC"></div><div class="wc-manage-list" id="wcDL"></div><div class="wc-manage-add-row"><input type="text" class="wc-manage-input" id="wcDI" placeholder="输入新文案"><button class="wc-manage-add-btn" id="wcDA">添加</button></div></div>' +
                '</div>' +
            '</div>';
        document.body.appendChild(mo);
        requestAnimationFrame(function() { mo.classList.add('active'); });
        var closeFn = function() { mo.classList.remove('active'); setTimeout(function() { mo.remove(); }, 200); };
        mo.querySelector('#wcMClose').addEventListener('click', closeFn);
        mo.addEventListener('click', function(e) { if (e.target === mo) closeFn(); });
        renderMList(mo, 'wcCL', 'wcCC', STORAGE.quotes, DEFAULT_QUOTES);
        renderMList(mo, 'wcDL', 'wcDC', STORAGE.dividers, DEFAULT_DIVIDERS);
        mo.querySelector('#wcCA').addEventListener('click', function() { var inp=mo.querySelector('#wcCI'); if(inp.value.trim()){var a=load(STORAGE.quotes,DEFAULT_QUOTES);a.push(inp.value.trim());save(STORAGE.quotes,a);inp.value='';renderMList(mo,'wcCL','wcCC',STORAGE.quotes,DEFAULT_QUOTES);toast('已添加');} });
        mo.querySelector('#wcDA').addEventListener('click', function() { var inp=mo.querySelector('#wcDI'); if(inp.value.trim()){var a=load(STORAGE.dividers,DEFAULT_DIVIDERS);a.push(inp.value.trim());save(STORAGE.dividers,a);inp.value='';renderMList(mo,'wcDL','wcDC',STORAGE.dividers,DEFAULT_DIVIDERS);toast('已添加');} });
    }

    function renderMList(mo, lid, cid, sk, def) {
        var list = mo.querySelector('#'+lid); var cnt = mo.querySelector('#'+cid);
        var arr = load(sk, def); cnt.textContent = '共 '+arr.length+' 条'; list.innerHTML = '';
        arr.forEach(function(q,i) {
            var item = document.createElement('div'); item.className = 'wc-manage-item';
            item.innerHTML = '<span class="wc-manage-item-text">' + esc(q) + '</span><button class="wc-manage-item-del">✕</button>';
            item.querySelector('.wc-manage-item-del').addEventListener('click', function() { arr.splice(i,1); save(sk,arr); renderMList(mo,lid,cid,sk,def); toast('已删除'); });
            list.appendChild(item);
        });
    }

    function toast(msg) {
        var t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:white;padding:8px 20px;border-radius:20px;font-size:12px;z-index:999999;transition:opacity 0.3s;';
        t.textContent = msg; document.body.appendChild(t);
        setTimeout(function() { t.style.opacity = '0'; setTimeout(function() { t.remove(); }, 300); }, 1200);
    }

    function open() {
        create();
        requestAnimationFrame(function() { overlay.classList.add('active'); scrollToBottom(); });
    }
    function close() {
        closeEmojiPanel();
        if (overlay) { overlay.classList.remove('active'); setTimeout(function() { if (overlay) { overlay.remove(); overlay = null; chatArea = null; } }, 300); }
    }

    window.wordCardZone = { open: open, close: close };
})();
