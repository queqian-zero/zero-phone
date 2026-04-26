/* 字卡区 - Word Card Zone
 * 与 page3 共享 localStorage 数据:
 * - p3_divider_quotes (分割线文案)
 * - p3_card_quotes (卡片文案)
 */

(function() {
    'use strict';

    const STORAGE_KEYS = {
        dividerQuotes: 'p3_divider_quotes',
        cardQuotes: 'p3_card_quotes'
    };

    const DEFAULT_DIVIDER = [
        '跨越次元遇见你', '请永远停留在我的掌心', '你是我最想留住的幸运',
        '月亮不会奔你而来 但我会', '你是迟来的欢喜', '所有的温柔都是刚刚好',
        '世界很大 而我刚好遇见你', '想把温柔都给你', '你来时携风带雨 我无处可避',
        '我在人间贩卖黄昏 只为收集世间温柔去见你', '今晚的月色真美',
        '此间的少年 是你', '你是我写过最好的故事', '所念皆星河 所遇皆温柔',
        '你是我藏在心底的光'
    ];

    const DEFAULT_CARD = [
        '今天也是想你的一天', '你的名字是我见过最短的情诗', '想和你一起浪费时间',
        '你是我所有的不知所措', '遇见你 就像找到了我丢失的拼图',
        '我想陪你走过所有的四季', '你是例外 也是偏爱', '所有的心事都只和你有关',
        '晚安这个词 只有对你说的时候才有意义', '我在等你 也在等自己',
        '想见你 在每一个不经意的瞬间', '你是我最温柔的心事',
        '我的宇宙为你藏了无数个温柔星球', '有些人一旦遇见 便是一辈子',
        '不是所有的遇见都能被称为命运'
    ];

    function loadQuotes(key, defaults) {
        try { const s = localStorage.getItem(key); if (s) return JSON.parse(s); } catch(e) {}
        return [...defaults];
    }
    function saveQuotes(key, arr) { localStorage.setItem(key, JSON.stringify(arr)); }
    function randomItem(arr) { return arr.length ? arr[Math.floor(Math.random() * arr.length)] : ''; }

    let currentTab = 'card'; // 'card' or 'divider'
    let overlay = null;

    // ==================== 创建字卡页面 ====================
    function createWordCardPage() {
        if (document.querySelector('.wordcard-overlay')) return;

        overlay = document.createElement('div');
        overlay.className = 'wordcard-overlay';
        overlay.innerHTML = `
            <div class="wc-header">
                <button class="wc-back" id="wcBack">‹</button>
                <span class="wc-title">字卡区</span>
                <button class="wc-manage-btn" id="wcManageBtn">☰</button>
            </div>

            <div class="wc-tabs">
                <button class="wc-tab active" data-tab="card">卡片文案</button>
                <button class="wc-tab" data-tab="divider">分割线文案</button>
            </div>

            <div class="wc-card-area">
                <div class="wc-card" id="wcCard">
                    <div class="wc-card-bg" id="wcCardBg"></div>
                    <div class="wc-card-bg-overlay"></div>
                    <div class="wc-card-body">
                        <div class="wc-card-deco-top">· · ·</div>
                        <div class="wc-card-text" id="wcCardText">点击抽取</div>
                        <div class="wc-card-deco-bottom">· · ·</div>
                        <span class="wc-card-hint">TAP TO DRAW</span>
                    </div>
                </div>
            </div>

            <div class="wc-bottom-bar">
                <button class="wc-action-btn" id="wcCopy" title="复制">📋</button>
                <button class="wc-action-btn primary" id="wcDraw" title="抽卡">✦</button>
                <button class="wc-action-btn" id="wcShare" title="分享">↗</button>
            </div>
        `;

        document.body.appendChild(overlay);

        // 绑定事件
        overlay.querySelector('#wcBack').addEventListener('click', close);
        overlay.querySelector('#wcManageBtn').addEventListener('click', openManage);

        // Tab切换
        overlay.querySelectorAll('.wc-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                overlay.querySelectorAll('.wc-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                currentTab = this.dataset.tab;
                drawCard();
            });
        });

        // 点击卡片抽卡
        overlay.querySelector('#wcCard').addEventListener('click', drawCard);
        overlay.querySelector('#wcDraw').addEventListener('click', drawCard);

        // 复制
        overlay.querySelector('#wcCopy').addEventListener('click', function() {
            const text = overlay.querySelector('#wcCardText').textContent;
            if (text && text !== '点击抽取' && text !== '还没有文案哦') {
                navigator.clipboard.writeText(text).then(() => {
                    showWcToast('已复制');
                }).catch(() => {
                    // fallback
                    const ta = document.createElement('textarea');
                    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
                    document.body.appendChild(ta);
                    ta.select(); document.execCommand('copy');
                    document.body.removeChild(ta);
                    showWcToast('已复制');
                });
            }
        });

        // 分享（暂时复制）
        overlay.querySelector('#wcShare').addEventListener('click', function() {
            const text = overlay.querySelector('#wcCardText').textContent;
            if (navigator.share && text && text !== '点击抽取') {
                navigator.share({ text: text }).catch(() => {});
            } else {
                showWcToast('长按复制分享吧');
            }
        });
    }

    // ==================== 抽卡 ====================
    function drawCard() {
        const key = currentTab === 'card' ? STORAGE_KEYS.cardQuotes : STORAGE_KEYS.dividerQuotes;
        const defaults = currentTab === 'card' ? DEFAULT_CARD : DEFAULT_DIVIDER;
        const quotes = loadQuotes(key, defaults);

        const card = overlay.querySelector('#wcCard');
        const textEl = overlay.querySelector('#wcCardText');

        if (!quotes.length) {
            textEl.textContent = '还没有文案哦';
            return;
        }

        // 翻牌动画
        card.classList.add('flipping');
        setTimeout(() => {
            textEl.textContent = randomItem(quotes);
        }, 200);
        setTimeout(() => {
            card.classList.remove('flipping');
        }, 400);
    }

    // ==================== 管理页 ====================
    function openManage() {
        const existing = document.querySelector('.wc-manage-overlay');
        if (existing) existing.remove();

        const manageOverlay = document.createElement('div');
        manageOverlay.className = 'wc-manage-overlay';
        manageOverlay.innerHTML = `
            <div class="wc-manage-panel">
                <div class="wc-manage-header">
                    <span class="wc-manage-title">管理文案</span>
                    <button class="wc-manage-close" id="wcManageClose">✕</button>
                </div>
                <div class="wc-tabs" style="padding:0 20px;">
                    <button class="wc-tab active" data-mtab="card">卡片文案</button>
                    <button class="wc-tab" data-mtab="divider">分割线文案</button>
                </div>
                <div class="wc-manage-body">
                    <div class="wc-manage-count" id="wcManageCount"></div>
                    <div class="wc-manage-list" id="wcManageList"></div>
                    <div class="wc-manage-add-row">
                        <input type="text" class="wc-manage-input" id="wcManageInput" placeholder="输入新文案">
                        <button class="wc-manage-add-btn" id="wcManageAdd">添加</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(manageOverlay);
        requestAnimationFrame(() => manageOverlay.classList.add('active'));

        let manageTab = 'card';

        // 关闭
        manageOverlay.querySelector('#wcManageClose').addEventListener('click', () => {
            manageOverlay.classList.remove('active');
            setTimeout(() => manageOverlay.remove(), 200);
        });
        manageOverlay.addEventListener('click', e => {
            if (e.target === manageOverlay) {
                manageOverlay.classList.remove('active');
                setTimeout(() => manageOverlay.remove(), 200);
            }
        });

        // Tab切换
        manageOverlay.querySelectorAll('.wc-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                manageOverlay.querySelectorAll('.wc-tab').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                manageTab = this.dataset.mtab;
                renderManageList(manageOverlay, manageTab);
            });
        });

        // 添加
        manageOverlay.querySelector('#wcManageAdd').addEventListener('click', () => {
            const input = manageOverlay.querySelector('#wcManageInput');
            const text = input.value.trim();
            if (!text) return;
            const key = manageTab === 'card' ? STORAGE_KEYS.cardQuotes : STORAGE_KEYS.dividerQuotes;
            const defaults = manageTab === 'card' ? DEFAULT_CARD : DEFAULT_DIVIDER;
            const arr = loadQuotes(key, defaults);
            arr.push(text);
            saveQuotes(key, arr);
            input.value = '';
            renderManageList(manageOverlay, manageTab);
            showWcToast('已添加');
        });

        // 初始渲染
        renderManageList(manageOverlay, manageTab);
    }

    function renderManageList(manageOverlay, tab) {
        const key = tab === 'card' ? STORAGE_KEYS.cardQuotes : STORAGE_KEYS.dividerQuotes;
        const defaults = tab === 'card' ? DEFAULT_CARD : DEFAULT_DIVIDER;
        const quotes = loadQuotes(key, defaults);

        const countEl = manageOverlay.querySelector('#wcManageCount');
        const listEl = manageOverlay.querySelector('#wcManageList');

        countEl.textContent = '共 ' + quotes.length + ' 条';
        listEl.innerHTML = '';

        quotes.forEach((q, i) => {
            const item = document.createElement('div');
            item.className = 'wc-manage-item';
            item.innerHTML = '<span class="wc-manage-item-text">' + q + '</span><button class="wc-manage-item-del" data-idx="' + i + '">✕</button>';
            item.querySelector('.wc-manage-item-del').addEventListener('click', () => {
                quotes.splice(i, 1);
                saveQuotes(key, quotes);
                renderManageList(manageOverlay, tab);
                showWcToast('已删除');
            });
            listEl.appendChild(item);
        });
    }

    // ==================== 工具 ====================
    function showWcToast(msg) {
        const t = document.createElement('div');
        t.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.7);color:white;padding:8px 20px;border-radius:20px;font-size:12px;z-index:999999;transition:opacity 0.3s;';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 1200);
    }

    // ==================== 开关 ====================
    function open() {
        createWordCardPage();
        requestAnimationFrame(() => {
            overlay.classList.add('active');
            drawCard();
        });
    }

    function close() {
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                if (overlay) { overlay.remove(); overlay = null; }
            }, 300);
        }
    }

    // ==================== 暴露全局接口 ====================
    window.wordCardZone = { open: open, close: close };

})();
