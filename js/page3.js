/* Page 3 - 第三页交互逻辑 */

(function() {
    'use strict';

    // ==================== 随机文案库 ====================
    const DIVIDER_QUOTES = [
        '跨越次元遇见你',
        '请永远停留在我的掌心',
        '你是我最想留住的幸运',
        '月亮不会奔你而来 但我会',
        '你是迟来的欢喜',
        '所有的温柔都是刚刚好',
        '世界很大 而我刚好遇见你',
        '想把温柔都给你',
        '你来时携风带雨 我无处可避',
        '我在人间贩卖黄昏 只为收集世间温柔去见你',
        '今晚的月色真美',
        '此间的少年 是你',
        '你是我写过最好的故事',
        '所念皆星河 所遇皆温柔',
        '你是我藏在心底的光'
    ];

    const CARD_QUOTES = [
        '今天也是想你的一天',
        '你的名字是我见过最短的情诗',
        '想和你一起浪费时间',
        '你是我所有的不知所措',
        '遇见你 就像找到了我丢失的拼图',
        '我想陪你走过所有的四季',
        '你是例外 也是偏爱',
        '所有的心事都只和你有关',
        '晚安这个词 只有对你说的时候才有意义',
        '我在等你 也在等自己',
        '想见你 在每一个不经意的瞬间',
        '你是我最温柔的心事',
        '我的宇宙为你藏了无数个温柔星球',
        '有些人一旦遇见 便是一辈子',
        '不是所有的遇见都能被称为命运'
    ];

    // ==================== 工具函数 ====================
    function randomItem(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function getDaysFromDate(dateStr) {
        const start = new Date(dateStr);
        const now = new Date();
        const diff = now - start;
        return Math.floor(diff / (1000 * 60 * 60 * 24));
    }

    function getWeekday(date) {
        const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        return days[date.getDay()];
    }

    function getMonthStr(date) {
        const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        return months[date.getMonth()];
    }

    // ==================== 初始化 ====================
    function initPage3() {
        // 设置随机文案
        refreshQuotes();

        // 设置日历
        updateCalendar();

        // 设置纪念日
        updateMemorial();

        // 绑定点击事件
        bindCardEvents();
    }

    // ==================== 刷新随机文案 ====================
    function refreshQuotes() {
        const dividerText = document.querySelector('.p3-quote-text');
        if (dividerText) {
            dividerText.textContent = randomItem(DIVIDER_QUOTES);
        }

        const cardQuote = document.querySelector('.p3-main-card-quote');
        if (cardQuote) {
            cardQuote.textContent = randomItem(CARD_QUOTES);
        }
    }

    // ==================== 更新日历 ====================
    function updateCalendar() {
        const now = new Date();
        const dayEl = document.querySelector('.p3-cal-day');
        const monthEl = document.querySelector('.p3-cal-month');
        const yearEl = document.querySelector('.p3-cal-year');
        const weekdayEl = document.querySelector('.p3-cal-weekday');

        if (dayEl) dayEl.textContent = now.getDate();
        if (monthEl) monthEl.textContent = getMonthStr(now);
        if (yearEl) yearEl.textContent = now.getFullYear();
        if (weekdayEl) weekdayEl.textContent = getWeekday(now);
    }

    // ==================== 更新纪念日 ====================
    function updateMemorial() {
        // 从 localStorage 读取纪念日设置，没有就用默认值
        const memData = JSON.parse(localStorage.getItem('p3_memorial') || 'null') || {
            name: '在一起',
            startDate: '2025-01-01',
            icon: '💕'
        };

        const daysEl = document.querySelector('.p3-mem-days-number');
        const nameEl = document.querySelector('.p3-mem-name');
        const dateEl = document.querySelector('.p3-mem-date');
        const iconEl = document.querySelector('.p3-mem-icon');

        const days = getDaysFromDate(memData.startDate);
        if (daysEl) daysEl.textContent = days;
        if (nameEl) nameEl.textContent = memData.name;
        if (dateEl) dateEl.textContent = '始于 ' + memData.startDate;
        if (iconEl) iconEl.textContent = memData.icon;
    }

    // ==================== 弹窗系统 ====================
    function showPopup(title, options) {
        // 移除已存在的弹窗
        document.querySelector('.p3-popup-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.className = 'p3-popup-overlay';

        let btnsHtml = '';
        options.forEach(opt => {
            const cls = opt.primary ? 'p3-popup-btn-primary' : 'p3-popup-btn-secondary';
            btnsHtml += `<button class="p3-popup-btn ${cls}" data-action="${opt.action}">${opt.label}</button>`;
        });
        btnsHtml += `<button class="p3-popup-btn p3-popup-btn-cancel" data-action="cancel">取消</button>`;

        overlay.innerHTML = `
            <div class="p3-popup">
                <div class="p3-popup-title">${title}</div>
                ${btnsHtml}
            </div>
        `;

        document.body.appendChild(overlay);

        // 动画显示
        requestAnimationFrame(() => overlay.classList.add('active'));

        // 绑定按钮事件
        overlay.querySelectorAll('.p3-popup-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 200);

                // 处理动作
                handlePopupAction(action);
            });
        });

        // 点击遮罩关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 200);
            }
        });
    }

    function handlePopupAction(action) {
        switch (action) {
            case 'edit_main_card':
                // TODO: 编辑主卡片（换背景图、编辑文案库）
                showToast('编辑功能开发中…');
                break;
            case 'enter_main_app':
                // TODO: 进入关联应用
                showToast('应用开发中…');
                break;
            case 'edit_calendar':
                // TODO: 编辑日历组件
                showToast('编辑功能开发中…');
                break;
            case 'enter_calendar_app':
                // TODO: 进入日历应用
                showToast('日历应用开发中…');
                break;
            case 'edit_memorial':
                // TODO: 编辑纪念日
                showToast('编辑功能开发中…');
                break;
            case 'enter_memorial_app':
                // TODO: 进入纪念日应用（日历）
                showToast('应用开发中…');
                break;
            case 'cancel':
            default:
                break;
        }
    }

    function showToast(msg) {
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:white;padding:8px 20px;border-radius:20px;font-size:12px;z-index:99999;transition:opacity 0.3s;';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 1500);
    }

    // ==================== 绑定卡片点击 ====================
    function bindCardEvents() {
        // 主卡片
        const mainCard = document.querySelector('.p3-main-card');
        if (mainCard) {
            mainCard.addEventListener('click', () => {
                showPopup('卡片选项', [
                    { label: '编辑组件', action: 'edit_main_card', primary: false },
                    { label: '进入应用', action: 'enter_main_app', primary: true }
                ]);
            });
        }

        // 日历卡片
        const calCard = document.querySelector('.p3-square-card.p3-calendar-card');
        if (calCard) {
            calCard.addEventListener('click', () => {
                showPopup('日历', [
                    { label: '编辑组件', action: 'edit_calendar', primary: false },
                    { label: '进入日历', action: 'enter_calendar_app', primary: true }
                ]);
            });
        }

        // 纪念日卡片
        const memCard = document.querySelector('.p3-square-card.p3-memorial-card');
        if (memCard) {
            memCard.addEventListener('click', () => {
                showPopup('纪念日', [
                    { label: '编辑组件', action: 'edit_memorial', primary: false },
                    { label: '进入日历', action: 'enter_memorial_app', primary: true }
                ]);
            });
        }
    }

    // ==================== 监听页面切换刷新文案 ====================
    // 当用户滑到第3页时刷新随机文案
    const observer = new MutationObserver(() => {
        const page3 = document.querySelector('.page-3');
        if (page3 && page3.offsetParent !== null) {
            refreshQuotes();
            updateCalendar();
        }
    });

    // ==================== 启动 ====================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPage3);
    } else {
        initPage3();
    }
})();
