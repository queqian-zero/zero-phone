/* Page 3 - 第三页交互逻辑 · v3 · 含编辑功能 */

(function() {
    'use strict';

    // ==================== 数据存储 ====================
    const STORAGE_KEYS = {
        dividerQuotes: 'p3_divider_quotes',
        cardQuotes: 'p3_card_quotes',
        mainCardBg: 'p3_main_card_bg',
        calendarBg: 'p3_calendar_bg',
        memorialBg: 'p3_memorial_bg',
        memorial: 'p3_memorial'
    };

    // ==================== 内置文案 ====================
    const DEFAULT_DIVIDER_QUOTES = [
        '跨越次元遇见你', '请永远停留在我的掌心', '你是我最想留住的幸运',
        '月亮不会奔你而来 但我会', '你是迟来的欢喜', '所有的温柔都是刚刚好',
        '世界很大 而我刚好遇见你', '想把温柔都给你', '你来时携风带雨 我无处可避',
        '我在人间贩卖黄昏 只为收集世间温柔去见你', '今晚的月色真美',
        '此间的少年 是你', '你是我写过最好的故事', '所念皆星河 所遇皆温柔',
        '你是我藏在心底的光'
    ];

    const DEFAULT_CARD_QUOTES = [
        '今天也是想你的一天', '你的名字是我见过最短的情诗', '想和你一起浪费时间',
        '你是我所有的不知所措', '遇见你 就像找到了我丢失的拼图',
        '我想陪你走过所有的四季', '你是例外 也是偏爱', '所有的心事都只和你有关',
        '晚安这个词 只有对你说的时候才有意义', '我在等你 也在等自己',
        '想见你 在每一个不经意的瞬间', '你是我最温柔的心事',
        '我的宇宙为你藏了无数个温柔星球', '有些人一旦遇见 便是一辈子',
        '不是所有的遇见都能被称为命运'
    ];

    function loadQuotes(key, defaults) {
        const saved = localStorage.getItem(key);
        if (saved) { try { return JSON.parse(saved); } catch(e) {} }
        return [...defaults];
    }

    function saveQuotes(key, arr) { localStorage.setItem(key, JSON.stringify(arr)); }
    function randomItem(arr) { return arr.length ? arr[Math.floor(Math.random() * arr.length)] : ''; }
    function getDaysFromDate(ds) { return Math.floor((new Date() - new Date(ds)) / 86400000); }
    function getWeekday(d) { return ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][d.getDay()]; }
    function getMonthStr(d) { return (d.getMonth()+1)+'月'; }

    // ==================== 初始化 ====================
    function initPage3() {
        refreshQuotes();
        updateCalendar();
        updateMemorial();
        loadBackgrounds();
        bindCardEvents();
    }

    function refreshQuotes() {
        const dq = loadQuotes(STORAGE_KEYS.dividerQuotes, DEFAULT_DIVIDER_QUOTES);
        const cq = loadQuotes(STORAGE_KEYS.cardQuotes, DEFAULT_CARD_QUOTES);
        const dt = document.querySelector('.p3-quote-text');
        if (dt) dt.textContent = randomItem(dq);
        const ct = document.querySelector('.p3-main-card-quote');
        if (ct) ct.textContent = randomItem(cq);
    }

    function updateCalendar() {
        const now = new Date();
        const el = s => document.querySelector(s);
        if (el('.p3-cal-day')) el('.p3-cal-day').textContent = now.getDate();
        if (el('.p3-cal-month')) el('.p3-cal-month').textContent = getMonthStr(now);
        if (el('.p3-cal-year')) el('.p3-cal-year').textContent = now.getFullYear();
        if (el('.p3-cal-weekday')) el('.p3-cal-weekday').textContent = getWeekday(now);
    }

    function updateMemorial() {
        const mem = JSON.parse(localStorage.getItem(STORAGE_KEYS.memorial) || 'null') || {
            name: '在一起', startDate: '2025-01-01', icon: '💕'
        };
        const el = s => document.querySelector(s);
        if (el('.p3-mem-days-number')) el('.p3-mem-days-number').textContent = getDaysFromDate(mem.startDate);
        if (el('.p3-mem-name')) el('.p3-mem-name').textContent = mem.name;
        if (el('.p3-mem-date')) el('.p3-mem-date').textContent = '始于 ' + mem.startDate;
        if (el('.p3-mem-icon')) el('.p3-mem-icon').textContent = mem.icon;
    }

    function loadBackgrounds() {
        const mainBg = localStorage.getItem(STORAGE_KEYS.mainCardBg);
        if (mainBg) document.querySelector('.p3-main-card-bg').style.backgroundImage = 'url('+mainBg+')';
        const calBg = localStorage.getItem(STORAGE_KEYS.calendarBg);
        if (calBg) {
            const cc = document.querySelector('.p3-calendar-card');
            if (cc) { cc.style.backgroundImage = 'url('+calBg+')'; cc.style.backgroundSize = 'cover'; cc.style.backgroundPosition = 'center'; }
        }
        const memBg = localStorage.getItem(STORAGE_KEYS.memorialBg);
        if (memBg) {
            const mc = document.querySelector('.p3-memorial-card');
            if (mc) { mc.style.backgroundImage = 'url('+memBg+')'; mc.style.backgroundSize = 'cover'; mc.style.backgroundPosition = 'center'; }
        }
    }

    // ==================== 弹窗系统 ====================
    function showP3Modal(title, options) {
        const modal = document.getElementById('editModal');
        if (!modal) return;
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = modal.querySelector('.modal-body');
        const modalFooter = modal.querySelector('.modal-footer');
        if (modalTitle) modalTitle.textContent = title;
        if (modalFooter) modalFooter.style.display = 'none';
        if (modalBody) {
            modalBody.innerHTML = '';
            const c = document.createElement('div');
            c.className = 'modal-options'; c.style.padding = '0';
            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerHTML = '<span class="option-icon">'+(opt.icon||'▸')+'</span><span class="option-text"><span class="option-title">'+opt.label+'</span></span>';
                btn.addEventListener('click', () => { closeP3Modal(); if (opt.fn) opt.fn(); else showToast('开发中…'); });
                c.appendChild(btn);
            });
            const cancel = document.createElement('button');
            cancel.className = 'modal-cancel-btn'; cancel.textContent = '取消';
            cancel.addEventListener('click', closeP3Modal);
            c.appendChild(cancel);
            modalBody.appendChild(c);
        }
        modal.classList.add('show');
        modal.querySelector('.modal-backdrop').onclick = closeP3Modal;
    }

    function closeP3Modal() {
        const modal = document.getElementById('editModal');
        if (!modal) return;
        modal.classList.remove('show');
        const f = modal.querySelector('.modal-footer');
        if (f) f.style.display = '';
        const b = modal.querySelector('.modal-body');
        if (b) b.innerHTML = '<input type="text" class="modal-input" id="modalInput" placeholder="请输入内容">';
    }

    function showToast(msg) {
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:white;padding:8px 20px;border-radius:20px;font-size:12px;z-index:99999;transition:opacity 0.3s;';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 1500);
    }

    // ==================== 编辑面板 ====================
    function showEditPanel(title, sections) {
        const overlay = document.createElement('div');
        overlay.className = 'p3-edit-overlay';
        let html = '<div class="p3-edit-panel">';
        html += '<div class="p3-edit-header"><span class="p3-edit-title">'+title+'</span><button class="p3-edit-close">✕</button></div>';
        html += '<div class="p3-edit-body">';
        sections.forEach(sec => { html += sec; });
        html += '</div></div>';
        overlay.innerHTML = html;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('active'));

        overlay.querySelector('.p3-edit-close').addEventListener('click', () => {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 200);
        });
        overlay.addEventListener('click', e => {
            if (e.target === overlay) { overlay.classList.remove('active'); setTimeout(() => overlay.remove(), 200); }
        });
        return overlay;
    }

    // ==================== 图片上传工具 ====================
    function createImageUploader(storageKey, onDone) {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                localStorage.setItem(storageKey, ev.target.result);
                if (onDone) onDone(ev.target.result);
                showToast('背景已更新');
            };
            reader.readAsDataURL(file);
        });
        input.click();
    }

    // ==================== 主卡片编辑 ====================
    function editMainCard() {
        const overlay = showEditPanel('编辑卡片', [
            // 背景图
            '<div class="p3-edit-section"><div class="p3-edit-sec-title">背景图</div><div class="p3-edit-btn-row"><button class="p3-edit-btn" id="p3EditMainBg">上传背景图</button><button class="p3-edit-btn p3-edit-btn-danger" id="p3ClearMainBg">清除</button></div></div>',
            // 分割线文案
            '<div class="p3-edit-section"><div class="p3-edit-sec-title">分割线文案</div><div id="p3DividerList" class="p3-edit-list"></div><div class="p3-edit-add-row"><input type="text" class="p3-edit-input" id="p3DividerInput" placeholder="输入新文案"><button class="p3-edit-btn" id="p3AddDivider">添加</button></div></div>',
            // 卡片文案
            '<div class="p3-edit-section"><div class="p3-edit-sec-title">卡片文案</div><div id="p3CardList" class="p3-edit-list"></div><div class="p3-edit-add-row"><input type="text" class="p3-edit-input" id="p3CardInput" placeholder="输入新文案"><button class="p3-edit-btn" id="p3AddCard">添加</button></div></div>'
        ]);

        // 背景图按钮
        overlay.querySelector('#p3EditMainBg').addEventListener('click', () => {
            createImageUploader(STORAGE_KEYS.mainCardBg, url => {
                document.querySelector('.p3-main-card-bg').style.backgroundImage = 'url('+url+')';
            });
        });
        overlay.querySelector('#p3ClearMainBg').addEventListener('click', () => {
            localStorage.removeItem(STORAGE_KEYS.mainCardBg);
            document.querySelector('.p3-main-card-bg').style.backgroundImage = '';
            showToast('已清除');
        });

        // 渲染文案列表
        renderQuoteList(overlay, 'p3DividerList', STORAGE_KEYS.dividerQuotes, DEFAULT_DIVIDER_QUOTES);
        renderQuoteList(overlay, 'p3CardList', STORAGE_KEYS.cardQuotes, DEFAULT_CARD_QUOTES);

        // 添加文案按钮
        overlay.querySelector('#p3AddDivider').addEventListener('click', () => {
            const input = overlay.querySelector('#p3DividerInput');
            if (input.value.trim()) {
                addQuote(STORAGE_KEYS.dividerQuotes, DEFAULT_DIVIDER_QUOTES, input.value.trim());
                input.value = '';
                renderQuoteList(overlay, 'p3DividerList', STORAGE_KEYS.dividerQuotes, DEFAULT_DIVIDER_QUOTES);
                refreshQuotes();
            }
        });
        overlay.querySelector('#p3AddCard').addEventListener('click', () => {
            const input = overlay.querySelector('#p3CardInput');
            if (input.value.trim()) {
                addQuote(STORAGE_KEYS.cardQuotes, DEFAULT_CARD_QUOTES, input.value.trim());
                input.value = '';
                renderQuoteList(overlay, 'p3CardList', STORAGE_KEYS.cardQuotes, DEFAULT_CARD_QUOTES);
                refreshQuotes();
            }
        });
    }

    function renderQuoteList(overlay, containerId, storageKey, defaults) {
        const container = overlay.querySelector('#' + containerId);
        const quotes = loadQuotes(storageKey, defaults);
        container.innerHTML = '';
        quotes.forEach((q, i) => {
            const row = document.createElement('div');
            row.className = 'p3-edit-list-item';
            row.innerHTML = '<span class="p3-edit-item-text">'+q+'</span><button class="p3-edit-item-del" data-idx="'+i+'">✕</button>';
            row.querySelector('.p3-edit-item-del').addEventListener('click', () => {
                removeQuote(storageKey, defaults, i);
                renderQuoteList(overlay, containerId, storageKey, defaults);
                refreshQuotes();
            });
            container.appendChild(row);
        });
    }

    function addQuote(key, defaults, text) {
        const arr = loadQuotes(key, defaults);
        arr.push(text);
        saveQuotes(key, arr);
    }

    function removeQuote(key, defaults, idx) {
        const arr = loadQuotes(key, defaults);
        arr.splice(idx, 1);
        saveQuotes(key, arr);
    }

    // ==================== 日历编辑 ====================
    function editCalendar() {
        const overlay = showEditPanel('编辑日历', [
            '<div class="p3-edit-section"><div class="p3-edit-sec-title">背景图</div><div class="p3-edit-btn-row"><button class="p3-edit-btn" id="p3EditCalBg">上传背景图</button><button class="p3-edit-btn p3-edit-btn-danger" id="p3ClearCalBg">清除</button></div></div>'
        ]);
        overlay.querySelector('#p3EditCalBg').addEventListener('click', () => {
            createImageUploader(STORAGE_KEYS.calendarBg, url => {
                const c = document.querySelector('.p3-calendar-card');
                if (c) { c.style.backgroundImage = 'url('+url+')'; c.style.backgroundSize = 'cover'; c.style.backgroundPosition = 'center'; }
            });
        });
        overlay.querySelector('#p3ClearCalBg').addEventListener('click', () => {
            localStorage.removeItem(STORAGE_KEYS.calendarBg);
            const c = document.querySelector('.p3-calendar-card');
            if (c) c.style.backgroundImage = '';
            showToast('已清除');
        });
    }

    // ==================== 纪念日编辑 ====================
    function editMemorial() {
        const mem = JSON.parse(localStorage.getItem(STORAGE_KEYS.memorial) || 'null') || {
            name: '在一起', startDate: '2025-01-01', icon: '💕'
        };
        const d = new Date(mem.startDate);

        const overlay = showEditPanel('编辑纪念日', [
            '<div class="p3-edit-section"><div class="p3-edit-sec-title">背景图</div><div class="p3-edit-btn-row"><button class="p3-edit-btn" id="p3EditMemBg">上传背景图</button><button class="p3-edit-btn p3-edit-btn-danger" id="p3ClearMemBg">清除</button></div></div>',
            '<div class="p3-edit-section"><div class="p3-edit-sec-title">纪念日名称</div><input type="text" class="p3-edit-input" id="p3MemName" value="'+mem.name+'" placeholder="例如：在一起"></div>',
            '<div class="p3-edit-section"><div class="p3-edit-sec-title">开始日期</div><div class="p3-wheel-picker" id="p3DatePicker"><div class="p3-wheel" id="p3WheelYear"></div><div class="p3-wheel-label">年</div><div class="p3-wheel" id="p3WheelMonth"></div><div class="p3-wheel-label">月</div><div class="p3-wheel" id="p3WheelDay"></div><div class="p3-wheel-label">日</div></div></div>',
            '<div class="p3-edit-section" style="text-align:center;"><button class="p3-edit-btn p3-edit-btn-save" id="p3SaveMem">保存</button></div>'
        ]);

        // 背景图
        overlay.querySelector('#p3EditMemBg').addEventListener('click', () => {
            createImageUploader(STORAGE_KEYS.memorialBg, url => {
                const c = document.querySelector('.p3-memorial-card');
                if (c) { c.style.backgroundImage = 'url('+url+')'; c.style.backgroundSize = 'cover'; c.style.backgroundPosition = 'center'; }
            });
        });
        overlay.querySelector('#p3ClearMemBg').addEventListener('click', () => {
            localStorage.removeItem(STORAGE_KEYS.memorialBg);
            const c = document.querySelector('.p3-memorial-card');
            if (c) c.style.backgroundImage = '';
            showToast('已清除');
        });

        // 滚轮日期选择器
        initWheelPicker(overlay, d.getFullYear(), d.getMonth()+1, d.getDate());

        // 保存
        overlay.querySelector('#p3SaveMem').addEventListener('click', () => {
            const name = overlay.querySelector('#p3MemName').value.trim() || '在一起';
            const y = getWheelValue(overlay, 'p3WheelYear');
            const m = getWheelValue(overlay, 'p3WheelMonth');
            const day = getWheelValue(overlay, 'p3WheelDay');
            const dateStr = y + '-' + String(m).padStart(2,'0') + '-' + String(day).padStart(2,'0');
            const data = { name, startDate: dateStr, icon: '💕' };
            localStorage.setItem(STORAGE_KEYS.memorial, JSON.stringify(data));
            updateMemorial();
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 200);
            showToast('纪念日已更新');
        });
    }

    // ==================== 滚轮选择器 ====================
    function initWheelPicker(overlay, selYear, selMonth, selDay) {
        const years = []; for (let i = 2000; i <= 2030; i++) years.push(i);
        const months = []; for (let i = 1; i <= 12; i++) months.push(i);
        const days = []; for (let i = 1; i <= 31; i++) days.push(i);

        buildWheel(overlay, 'p3WheelYear', years, selYear);
        buildWheel(overlay, 'p3WheelMonth', months, selMonth);
        buildWheel(overlay, 'p3WheelDay', days, selDay);
    }

    function buildWheel(overlay, id, items, selected) {
        const container = overlay.querySelector('#' + id);
        if (!container) return;
        container.innerHTML = '';

        const ITEM_H = 36;
        const VISIBLE = 5;
        container.style.height = (ITEM_H * VISIBLE) + 'px';
        container.style.overflow = 'hidden';
        container.style.position = 'relative';

        // 高亮条
        const highlight = document.createElement('div');
        highlight.className = 'p3-wheel-highlight';
        highlight.style.cssText = 'position:absolute;top:'+(ITEM_H*2)+'px;left:0;right:0;height:'+ITEM_H+'px;border-top:1px solid rgba(0,0,0,0.1);border-bottom:1px solid rgba(0,0,0,0.1);pointer-events:none;z-index:1;';
        container.appendChild(highlight);

        // 滚动区
        const scroll = document.createElement('div');
        scroll.className = 'p3-wheel-scroll';
        scroll.style.cssText = 'padding-top:'+(ITEM_H*2)+'px;padding-bottom:'+(ITEM_H*2)+'px;';

        items.forEach(val => {
            const item = document.createElement('div');
            item.className = 'p3-wheel-item';
            item.style.cssText = 'height:'+ITEM_H+'px;line-height:'+ITEM_H+'px;text-align:center;font-size:16px;color:var(--color-text-primary);transition:opacity 0.15s;';
            item.textContent = val;
            item.dataset.value = val;
            scroll.appendChild(item);
        });

        container.appendChild(scroll);

        // 设置初始位置
        const idx = items.indexOf(selected);
        if (idx >= 0) container.scrollTop = idx * ITEM_H;

        // 滚动对齐
        let scrollTimeout;
        container.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const nearest = Math.round(container.scrollTop / ITEM_H);
                container.scrollTo({ top: nearest * ITEM_H, behavior: 'smooth' });
                // 更新透明度
                updateWheelOpacity(container, ITEM_H);
            }, 80);
        });

        // 初始透明度
        setTimeout(() => updateWheelOpacity(container, ITEM_H), 50);
    }

    function updateWheelOpacity(container, itemH) {
        const center = container.scrollTop + itemH * 2;
        const items = container.querySelectorAll('.p3-wheel-item');
        items.forEach((item, i) => {
            const itemCenter = i * itemH + itemH / 2;
            const dist = Math.abs(center - itemCenter);
            const opacity = Math.max(0.25, 1 - dist / (itemH * 2.5));
            const scale = Math.max(0.85, 1 - dist / (itemH * 8));
            item.style.opacity = opacity;
            item.style.transform = 'scale('+scale+')';
        });
    }

    function getWheelValue(overlay, id) {
        const container = overlay.querySelector('#' + id);
        if (!container) return 1;
        const ITEM_H = 36;
        const idx = Math.round(container.scrollTop / ITEM_H);
        const items = container.querySelectorAll('.p3-wheel-item');
        return items[idx] ? parseInt(items[idx].dataset.value) : 1;
    }

    // ==================== 绑定卡片事件 ====================
    function bindCardEvents() {
        const mc = document.querySelector('.p3-main-card');
        if (mc) mc.addEventListener('click', () => showP3Modal('卡片选项', [
            { label: '编辑组件', icon: '✏️', fn: editMainCard },
            { label: '进入应用', icon: '📱', fn: () => showToast('应用开发中…') }
        ]));

        const cc = document.querySelector('.p3-square-card.p3-calendar-card');
        if (cc) cc.addEventListener('click', () => showP3Modal('日历', [
            { label: '编辑组件', icon: '✏️', fn: editCalendar },
            { label: '进入日历', icon: '📅', fn: () => showToast('日历应用开发中…') }
        ]));

        const mem = document.querySelector('.p3-square-card.p3-memorial-card');
        if (mem) mem.addEventListener('click', () => showP3Modal('纪念日', [
            { label: '编辑组件', icon: '✏️', fn: editMemorial },
            { label: '进入日历', icon: '💕', fn: () => showToast('应用开发中…') }
        ]));
    }

    // ==================== 启动 ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPage3);
    } else {
        initPage3();
    }
})();
