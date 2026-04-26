/* Page 3 - 第三页交互逻辑 · v2 · 复用现有modal */

(function() {
    'use strict';

    const DIVIDER_QUOTES = [
        '跨越次元遇见你', '请永远停留在我的掌心', '你是我最想留住的幸运',
        '月亮不会奔你而来 但我会', '你是迟来的欢喜', '所有的温柔都是刚刚好',
        '世界很大 而我刚好遇见你', '想把温柔都给你', '你来时携风带雨 我无处可避',
        '我在人间贩卖黄昏 只为收集世间温柔去见你', '今晚的月色真美',
        '此间的少年 是你', '你是我写过最好的故事', '所念皆星河 所遇皆温柔',
        '你是我藏在心底的光'
    ];

    const CARD_QUOTES = [
        '今天也是想你的一天', '你的名字是我见过最短的情诗', '想和你一起浪费时间',
        '你是我所有的不知所措', '遇见你 就像找到了我丢失的拼图',
        '我想陪你走过所有的四季', '你是例外 也是偏爱', '所有的心事都只和你有关',
        '晚安这个词 只有对你说的时候才有意义', '我在等你 也在等自己',
        '想见你 在每一个不经意的瞬间', '你是我最温柔的心事',
        '我的宇宙为你藏了无数个温柔星球', '有些人一旦遇见 便是一辈子',
        '不是所有的遇见都能被称为命运'
    ];

    function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function getDaysFromDate(dateStr) {
        return Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
    }

    function getWeekday(d) { return ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][d.getDay()]; }
    function getMonthStr(d) { return (d.getMonth() + 1) + '月'; }

    function initPage3() {
        refreshQuotes();
        updateCalendar();
        updateMemorial();
        bindCardEvents();
    }

    function refreshQuotes() {
        const dt = document.querySelector('.p3-quote-text');
        if (dt) dt.textContent = randomItem(DIVIDER_QUOTES);
        const cq = document.querySelector('.p3-main-card-quote');
        if (cq) cq.textContent = randomItem(CARD_QUOTES);
    }

    function updateCalendar() {
        const now = new Date();
        const d = document.querySelector('.p3-cal-day');
        const m = document.querySelector('.p3-cal-month');
        const y = document.querySelector('.p3-cal-year');
        const w = document.querySelector('.p3-cal-weekday');
        if (d) d.textContent = now.getDate();
        if (m) m.textContent = getMonthStr(now);
        if (y) y.textContent = now.getFullYear();
        if (w) w.textContent = getWeekday(now);
    }

    function updateMemorial() {
        const mem = JSON.parse(localStorage.getItem('p3_memorial') || 'null') || {
            name: '在一起', startDate: '2025-01-01', icon: '💕'
        };
        const days = getDaysFromDate(mem.startDate);
        const el = (s) => document.querySelector(s);
        if (el('.p3-mem-days-number')) el('.p3-mem-days-number').textContent = days;
        if (el('.p3-mem-name')) el('.p3-mem-name').textContent = mem.name;
        if (el('.p3-mem-date')) el('.p3-mem-date').textContent = '始于 ' + mem.startDate;
        if (el('.p3-mem-icon')) el('.p3-mem-icon').textContent = mem.icon;
    }

    // ====== 复用现有的editModal弹窗 ======
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
            const container = document.createElement('div');
            container.className = 'modal-options';
            container.style.padding = '0';

            options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerHTML = '<span class="option-icon">' + opt.icon + '</span><span class="option-text"><span class="option-title">' + opt.label + '</span></span>';
                btn.addEventListener('click', () => { closeP3Modal(); handleAction(opt.action); });
                container.appendChild(btn);
            });

            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'modal-cancel-btn';
            cancelBtn.textContent = '取消';
            cancelBtn.addEventListener('click', closeP3Modal);
            container.appendChild(cancelBtn);

            modalBody.appendChild(container);
        }

        modal.classList.add('show');
        const backdrop = modal.querySelector('.modal-backdrop');
        if (backdrop) backdrop.onclick = closeP3Modal;
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

    function handleAction(action) {
        const msgs = {
            'edit_main_card': '编辑功能开发中…',
            'enter_main_app': '应用开发中…',
            'edit_calendar': '编辑功能开发中…',
            'enter_calendar_app': '日历应用开发中…',
            'edit_memorial': '编辑功能开发中…',
            'enter_memorial_app': '应用开发中…'
        };
        showToast(msgs[action] || '开发中…');
    }

    function showToast(msg) {
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:white;padding:8px 20px;border-radius:20px;font-size:12px;z-index:99999;transition:opacity 0.3s;';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 1500);
    }

    function bindCardEvents() {
        const mc = document.querySelector('.p3-main-card');
        if (mc) mc.addEventListener('click', () => showP3Modal('卡片选项', [
            { label: '编辑组件', action: 'edit_main_card', icon: '✏️' },
            { label: '进入应用', action: 'enter_main_app', icon: '📱' }
        ]));

        const cc = document.querySelector('.p3-square-card.p3-calendar-card');
        if (cc) cc.addEventListener('click', () => showP3Modal('日历', [
            { label: '编辑组件', action: 'edit_calendar', icon: '✏️' },
            { label: '进入日历', action: 'enter_calendar_app', icon: '📅' }
        ]));

        const mem = document.querySelector('.p3-square-card.p3-memorial-card');
        if (mem) mem.addEventListener('click', () => showP3Modal('纪念日', [
            { label: '编辑组件', action: 'edit_memorial', icon: '✏️' },
            { label: '进入日历', action: 'enter_memorial_app', icon: '💕' }
        ]));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPage3);
    } else {
        initPage3();
    }
})();
