/* ========================================
   zero-time.js — 全局时间工具
   零手机
   
   所有日期相关计算统一走这里，
   避免 toISOString() 的 UTC 跨天问题，
   并支持用户自定义时区偏移。
   ======================================== */

window.ZeroTime = {

    STORAGE_KEY: 'zero_phone_tz_offset',

    // ── 获取当前配置的 UTC 偏移（小时）──────────────────────────
    // 返回数字，例如 +8 / -5 / +5.5
    // 未配置时自动读取设备本地时区
    getOffset() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored !== null && stored !== '') {
            const v = parseFloat(stored);
            if (!isNaN(v)) return v;
        }
        // 设备本地偏移（getTimezoneOffset 返回分钟，正负相反）
        return -new Date().getTimezoneOffset() / 60;
    },

    // 设置偏移
    setOffset(hours) {
        localStorage.setItem(this.STORAGE_KEY, String(hours));
    },

    // 重置为自动
    resetOffset() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    // 是否使用设备自动时区
    isAuto() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored === null || stored === '';
    },

    // ── 把任意 Date 对象转换到配置时区 ──────────────────────────
    _toZone(date) {
        const offset = this.getOffset();
        // 先取 UTC 毫秒，再加上配置偏移
        const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
        return new Date(utcMs + offset * 3600000);
    },

    // ── 日期字符串 yyyy-mm-dd ────────────────────────────────────
    dateStr(date = new Date()) {
        const d = this._toZone(date);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    },

    // ── 当日零点（配置时区）────────────────────────────────────
    midnight(date = new Date()) {
        const d = this._toZone(date);
        // 返回一个以配置偏移为基准的零点时间戳
        // 用于做天数差计算
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
               - (this.getOffset() * 3600000 - date.getTimezoneOffset() * 60000);
    },

    // ── 两个时间之间相差几天（配置时区，整数）─────────────────
    diffDays(olderDate, newerDate = new Date()) {
        const d1 = this.dateStr(new Date(olderDate));
        const d2 = this.dateStr(new Date(newerDate));
        const t1 = new Date(d1).getTime();
        const t2 = new Date(d2).getTime();
        return Math.round((t2 - t1) / 86400000);
    },

    // ── 格式化时间 HH:MM ────────────────────────────────────────
    formatHM(date = new Date()) {
        const d = this._toZone(date);
        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    },

    // ── 格式化完整时间戳（用于注入系统提示）──────────────────
    formatFull(date = new Date()) {
        const d = this._toZone(date);
        const yyyy = d.getFullYear();
        const MM = String(d.getMonth()+1).padStart(2,'0');
        const dd = String(d.getDate()).padStart(2,'0');
        const hh = String(d.getHours()).padStart(2,'0');
        const mm = String(d.getMinutes()).padStart(2,'0');
        return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
    },

    // ── 获取小时数（用于"凌晨"判断）──────────────────────────
    getHour(date = new Date()) {
        return this._toZone(date).getHours();
    },

    // ── 当前时区描述（展示用）─────────────────────────────────
    getOffsetLabel() {
        if (this.isAuto()) {
            const offset = this.getOffset();
            return `自动 (UTC${offset >= 0 ? '+' : ''}${offset})`;
        }
        const offset = this.getOffset();
        return `UTC${offset >= 0 ? '+' : ''}${offset}`;
    },
};
