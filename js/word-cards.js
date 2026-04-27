/* 字卡区 v3 - Chat-style with settings, avatars, read status, context menu, wallpaper
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
        favorites: 'wc_favorites'
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
        multiReply: true     // 允许多条回复
    };

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

    var overlay = null;
    var chatArea = null;
    var isTyping = false;
    var longPressTimer = null;

    // ==================== 历史 ====================
    function loadHistory() { return load(STORAGE.history, []); }
    function saveHistory(msgs) { save(STORAGE.history, msgs.slice(-300)); }
    function addMsg(role, text) {
        var msgs = loadHistory();
        var msg = { id: Date.now() + Math.random(), role: role, text: text, time: timeStr(), ts: Date.now(), status: role === 'user' ? 'sent' : '' };
        msgs.push(msg);
        saveHistory(msgs);
        return msg;
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
                    '<button class="wc-header-btn" id="wcSettings" title="设置">⚙</button>' +
                    '<button class="wc-header-btn" id="wcManage" title="管理字卡">☰</button>' +
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

        // 加载壁纸
        var wp = localStorage.getItem(STORAGE.wallpaper);
        if (wp) {
            chatArea.style.backgroundImage = 'url(' + wp + ')';
            chatArea.classList.add('has-wallpaper');
        }

        // 事件
        overlay.querySelector('#wcBack').addEventListener('click', close);
        overlay.querySelector('#wcSettings').addEventListener('click', openSettings);
        overlay.querySelector('#wcManage').addEventListener('click', openManage);
        overlay.querySelector('#wcSend').addEventListener('click', sendMsg);
        overlay.querySelector('#wcQuickDraw').addEventListener('click', quickDraw);

        var input = overlay.querySelector('#wcInput');
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
        });
        input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });

        // 点空白关菜单
        chatArea.addEventListener('click', function(e) {
            if (!e.target.closest('.wc-context-menu')) closeContextMenu();
        });

        renderHistory();
    }

    function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    // ==================== 头像 ====================
    function getAvatarHTML(role) {
        var key = role === 'user' ? STORAGE.myAvatar : STORAGE.partnerAvatar;
        var src = localStorage.getItem(key);
        if (src) return '<img src="' + src + '">';
        return role === 'user' ? '🐱' : '🃏';
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
            var isFav = favs.indexOf(String(msg.id)) >= 0;
            appendBubble(msg, false, isFav);
        });

        // 标记已读
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

        // PC端右键
        bubble.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            showContextMenu(e.clientX, e.clientY, msg);
        });

        col.appendChild(bubble);

        // 时间+状态
        var meta = document.createElement('div');
        meta.className = 'wc-msg-meta';
        var timeEl = '<span class="wc-msg-time">' + (msg.time || '') + '</span>';
        var statusEl = '';
        if (isUser) {
            var statusClass = msg.status === 'read' ? 'read' : '';
            var statusText = msg.status === 'read' ? '已读' : (msg.status === 'delivered' ? '已送达' : '已发送');
            statusEl = '<span class="wc-msg-status ' + statusClass + '">' + statusText + '</span>';
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

    // ==================== 标记已读 ====================
    function markAllRead() {
        var msgs = loadHistory();
        var changed = false;
        msgs.forEach(function(m) {
            if (m.role === 'user' && m.status !== 'read') {
                m.status = 'read';
                changed = true;
            }
        });
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

        var empty = chatArea.querySelector('.wc-empty-state');
        if (empty) empty.remove();

        var msg = addMsg('user', text);
        appendBubble(msg, true, false);
        scrollToBottom();

        scheduleReply();
    }

    function scheduleReply() {
        var settings = getSettings();
        var delay = settings.delayMin + Math.random() * (settings.delayMax - settings.delayMin);
        var count = 1;
        if (settings.multiReply) {
            count = Math.random() < 0.75 ? 1 : (Math.random() < 0.8 ? 2 : 3);
        }

        showTypingIndicator();
        isTyping = true;

        // 延迟后先标记已送达
        setTimeout(function() {
            updateUserStatus('delivered');
        }, Math.min(delay * 0.4, 800));

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

            var allQuotes = [].concat(
                load(STORAGE.quotes, DEFAULT_QUOTES),
                load(STORAGE.dividers, DEFAULT_DIVIDERS)
            );

            if (!allQuotes.length) {
                var msg = addMsg('card', '字卡库是空的，去管理页添加一些吧');
                appendBubble(msg, true, false);
                isTyping = false;
                scrollToBottom();
                return;
            }

            var reply = rand(allQuotes);
            var msg = addMsg('card', reply);
            appendBubble(msg, true, false);
            scrollToBottom();

            if (current + 1 < total) {
                setTimeout(function() { showTypingIndicator(); }, 200);
                var settings = getSettings();
                var nextDelay = settings.delayMin * 0.5 + Math.random() * settings.delayMin;
                replySequence(total, current + 1, nextDelay);
            } else {
                isTyping = false;
                updateUserStatus('read');
            }
        }, delay);
    }

    function updateUserStatus(status) {
        var msgs = loadHistory();
        var changed = false;
        msgs.forEach(function(m) {
            if (m.role === 'user' && m.status !== 'read') {
                m.status = status;
                changed = true;
            }
        });
        if (changed) {
            saveHistory(msgs);
            // 更新DOM
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

        var settings = getSettings();
        var delay = settings.delayMin * 0.5 + Math.random() * settings.delayMin;

        setTimeout(function() {
            hideTypingIndicator();
            var allQuotes = [].concat(load(STORAGE.quotes, DEFAULT_QUOTES), load(STORAGE.dividers, DEFAULT_DIVIDERS));
            var reply = allQuotes.length ? rand(allQuotes) : '字卡库是空的';
            var msg = addMsg('card', reply);
            appendBubble(msg, true, false);
            scrollToBottom();
            isTyping = false;
        }, delay);
    }

    // ==================== 正在输入 ====================
    function showTypingIndicator() {
        hideTypingIndicator();
        var settings = getSettings();
        var typing = document.createElement('div');
        typing.className = 'wc-typing';
        typing.id = 'wcTyping';
        typing.innerHTML =
            '<div class="wc-msg-avatar">' + getAvatarHTML('card') + '</div>' +
            '<div class="wc-typing-bubble">' +
                '<div class="wc-typing-dot"></div>' +
                '<div class="wc-typing-dot"></div>' +
                '<div class="wc-typing-dot"></div>' +
            '</div>';
        chatArea.appendChild(typing);
        scrollToBottom();

        // 更新头部状态
        var headerStatus = overlay.querySelector('.wc-header-status');
        if (headerStatus) headerStatus.textContent = settings.partnerName + ' 正在输入...';
    }

    function hideTypingIndicator() {
        var t = document.getElementById('wcTyping');
        if (t) t.remove();
        var headerStatus = overlay ? overlay.querySelector('.wc-header-status') : null;
        if (headerStatus) headerStatus.textContent = '字卡回复 · 随机抽取';
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
            btn.addEventListener('click', function() {
                closeContextMenu();
                handleContextAction(item.action, msg);
            });
            menu.appendChild(btn);
        });

        // 定位
        var maxX = window.innerWidth - 160;
        var maxY = window.innerHeight - 160;
        menu.style.left = Math.min(x, maxX) + 'px';
        menu.style.top = Math.min(y, maxY) + 'px';

        document.body.appendChild(menu);

        // 点击外部关闭
        setTimeout(function() {
            document.addEventListener('click', closeContextMenuOnce);
        }, 10);
    }

    function closeContextMenuOnce(e) {
        if (!e.target.closest('.wc-context-menu')) {
            closeContextMenu();
            document.removeEventListener('click', closeContextMenuOnce);
        }
    }

    function closeContextMenu() {
        var m = document.querySelector('.wc-context-menu');
        if (m) m.remove();
    }

    function handleContextAction(action, msg) {
        if (action === 'copy') {
            navigator.clipboard.writeText(msg.text).catch(function() {
                var ta = document.createElement('textarea');
                ta.value = msg.text; ta.style.cssText = 'position:fixed;opacity:0;';
                document.body.appendChild(ta); ta.select(); document.execCommand('copy');
                document.body.removeChild(ta);
            });
            toast('已复制');
        } else if (action === 'fav') {
            var favs = getFavorites();
            var idx = favs.indexOf(String(msg.id));
            if (idx >= 0) {
                favs.splice(idx, 1);
                toast('已取消收藏');
            } else {
                favs.push(String(msg.id));
                toast('已收藏');
            }
            saveFavorites(favs);
            renderHistory();
        } else if (action === 'delete') {
            var msgs = loadHistory();
            var i = msgs.findIndex(function(m) { return String(m.id) === String(msg.id); });
            if (i >= 0) {
                msgs.splice(i, 1);
                saveHistory(msgs);
                renderHistory();
                toast('已删除');
            }
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
                '<div class="wc-manage-header">' +
                    '<span class="wc-manage-title">设置</span>' +
                    '<button class="wc-manage-close" id="wcSetClose">✕</button>' +
                '</div>' +
                '<div class="wc-manage-body">' +

                    '<div class="wc-settings-section">' +
                        '<div class="wc-settings-label">头像</div>' +
                        '<div class="wc-avatar-edit">' +
                            '<div class="wc-avatar-edit-item" id="wcEditMyAv">' +
                                '<div class="wc-avatar-edit-preview" id="wcMyAvPreview">' + (myAv ? '<img src="'+myAv+'">' : '🐱') + '</div>' +
                                '<span class="wc-avatar-edit-label">我</span>' +
                            '</div>' +
                            '<div class="wc-avatar-edit-item" id="wcEditPartnerAv">' +
                                '<div class="wc-avatar-edit-preview" id="wcPartnerAvPreview">' + (partnerAv ? '<img src="'+partnerAv+'">' : '🃏') + '</div>' +
                                '<span class="wc-avatar-edit-label">字卡</span>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +

                    '<div class="wc-settings-section">' +
                        '<div class="wc-settings-label">昵称</div>' +
                        '<div class="wc-name-row">' +
                            '<input class="wc-name-input" id="wcMyName" placeholder="我的昵称" value="' + esc(settings.myName) + '">' +
                            '<input class="wc-name-input" id="wcPartnerName" placeholder="字卡昵称" value="' + esc(settings.partnerName) + '">' +
                        '</div>' +
                    '</div>' +

                    '<div class="wc-settings-section">' +
                        '<div class="wc-settings-label">回复延迟</div>' +
                        '<div class="wc-settings-row">' +
                            '<span class="wc-settings-row-label">最短延迟</span>' +
                            '<span class="wc-settings-row-value" id="wcDelayMinVal">' + (settings.delayMin/1000).toFixed(1) + 's</span>' +
                        '</div>' +
                        '<input type="range" class="wc-range" id="wcDelayMin" min="200" max="5000" step="100" value="' + settings.delayMin + '">' +
                        '<div class="wc-settings-row">' +
                            '<span class="wc-settings-row-label">最长延迟</span>' +
                            '<span class="wc-settings-row-value" id="wcDelayMaxVal">' + (settings.delayMax/1000).toFixed(1) + 's</span>' +
                        '</div>' +
                        '<input type="range" class="wc-range" id="wcDelayMax" min="500" max="10000" step="100" value="' + settings.delayMax + '">' +
                    '</div>' +

                    '<div class="wc-settings-section">' +
                        '<div class="wc-settings-label">聊天壁纸</div>' +
                        '<div class="wc-wallpaper-row">' +
                            '<button class="wc-wallpaper-btn" id="wcWpUpload">上传壁纸</button>' +
                            '<button class="wc-wallpaper-btn danger" id="wcWpClear">清除</button>' +
                        '</div>' +
                    '</div>' +

                    '<button class="wc-manage-clear-btn" id="wcClearHistory">清空聊天记录</button>' +

                '</div>' +
            '</div>';

        document.body.appendChild(mo);
        requestAnimationFrame(function() { mo.classList.add('active'); });

        // 关闭 + 保存
        function closeAndSave() {
            var s = getSettings();
            s.myName = mo.querySelector('#wcMyName').value.trim() || '我';
            s.partnerName = mo.querySelector('#wcPartnerName').value.trim() || '字卡';
            s.delayMin = parseInt(mo.querySelector('#wcDelayMin').value);
            s.delayMax = parseInt(mo.querySelector('#wcDelayMax').value);
            if (s.delayMax < s.delayMin) s.delayMax = s.delayMin + 500;
            saveSettings(s);

            var headerName = overlay ? overlay.querySelector('#wcHeaderName') : null;
            if (headerName) headerName.textContent = s.partnerName;

            mo.classList.remove('active');
            setTimeout(function() { mo.remove(); }, 200);
        }

        mo.querySelector('#wcSetClose').addEventListener('click', closeAndSave);
        mo.addEventListener('click', function(e) { if (e.target === mo) closeAndSave(); });

        // 延迟滑块实时更新
        mo.querySelector('#wcDelayMin').addEventListener('input', function() {
            mo.querySelector('#wcDelayMinVal').textContent = (this.value/1000).toFixed(1) + 's';
        });
        mo.querySelector('#wcDelayMax').addEventListener('input', function() {
            mo.querySelector('#wcDelayMaxVal').textContent = (this.value/1000).toFixed(1) + 's';
        });

        // 头像上传
        mo.querySelector('#wcEditMyAv').addEventListener('click', function() {
            uploadImage(function(dataUrl) {
                localStorage.setItem(STORAGE.myAvatar, dataUrl);
                mo.querySelector('#wcMyAvPreview').innerHTML = '<img src="'+dataUrl+'">';
                renderHistory();
                toast('头像已更新');
            });
        });
        mo.querySelector('#wcEditPartnerAv').addEventListener('click', function() {
            uploadImage(function(dataUrl) {
                localStorage.setItem(STORAGE.partnerAvatar, dataUrl);
                mo.querySelector('#wcPartnerAvPreview').innerHTML = '<img src="'+dataUrl+'">';
                renderHistory();
                toast('头像已更新');
            });
        });

        // 壁纸
        mo.querySelector('#wcWpUpload').addEventListener('click', function() {
            uploadImage(function(dataUrl) {
                localStorage.setItem(STORAGE.wallpaper, dataUrl);
                if (chatArea) {
                    chatArea.style.backgroundImage = 'url(' + dataUrl + ')';
                    chatArea.classList.add('has-wallpaper');
                }
                toast('壁纸已更新');
            });
        });
        mo.querySelector('#wcWpClear').addEventListener('click', function() {
            localStorage.removeItem(STORAGE.wallpaper);
            if (chatArea) {
                chatArea.style.backgroundImage = '';
                chatArea.classList.remove('has-wallpaper');
            }
            toast('壁纸已清除');
        });

        // 清空记录
        mo.querySelector('#wcClearHistory').addEventListener('click', function() {
            if (confirm('确定清空所有聊天记录吗？')) {
                localStorage.removeItem(STORAGE.history);
                renderHistory();
                closeAndSave();
                toast('已清空');
            }
        });
    }

    function uploadImage(callback) {
        var input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function(ev) { callback(ev.target.result); };
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

        var closeFn = function() {
            mo.classList.remove('active');
            setTimeout(function() { mo.remove(); }, 200);
        };
        mo.querySelector('#wcMClose').addEventListener('click', closeFn);
        mo.addEventListener('click', function(e) { if (e.target === mo) closeFn(); });

        renderManageList(mo, 'wcCardList', 'wcCardCount', STORAGE.quotes, DEFAULT_QUOTES);
        renderManageList(mo, 'wcDivList', 'wcDivCount', STORAGE.dividers, DEFAULT_DIVIDERS);

        mo.querySelector('#wcCardAdd').addEventListener('click', function() {
            var inp = mo.querySelector('#wcCardInput');
            if (inp.value.trim()) {
                var arr = load(STORAGE.quotes, DEFAULT_QUOTES); arr.push(inp.value.trim());
                save(STORAGE.quotes, arr); inp.value = '';
                renderManageList(mo, 'wcCardList', 'wcCardCount', STORAGE.quotes, DEFAULT_QUOTES);
                toast('已添加');
            }
        });
        mo.querySelector('#wcDivAdd').addEventListener('click', function() {
            var inp = mo.querySelector('#wcDivInput');
            if (inp.value.trim()) {
                var arr = load(STORAGE.dividers, DEFAULT_DIVIDERS); arr.push(inp.value.trim());
                save(STORAGE.dividers, arr); inp.value = '';
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
            item.innerHTML = '<span class="wc-manage-item-text">' + esc(q) + '</span><button class="wc-manage-item-del" data-idx="' + i + '">✕</button>';
            item.querySelector('.wc-manage-item-del').addEventListener('click', function() {
                arr.splice(i, 1); save(storageKey, arr);
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
