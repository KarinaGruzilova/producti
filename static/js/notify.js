// static/js/notify.js
// Единая система уведомлений и валидации для всех модальных окон

// ══════════════════════════════════════════════
// TOAST — всплывающее уведомление сверху
// ══════════════════════════════════════════════

window.notify = {

    /**
     * Показать уведомление
     * @param {string} message — текст
     * @param {string} type — 'error' | 'success' | 'warning' | 'info'
     * @param {number} duration — время в мс (0 = не скрывать)
     */
    show(message, type = 'error', duration = 4000) {
        // Удаляем предыдущее если есть
        document.querySelectorAll('.notify-toast').forEach(el => el.remove());

        const colors = {
            error:   { bg: '#FFF0F0', border: '#FF4444', icon: '⚠', text: '#8B0000' },
            success: { bg: '#F0FFF1', border: '#4CAF50', icon: '✓', text: '#2E7D32' },
            warning: { bg: '#FFFBF0', border: '#FF8C00', icon: '!', text: '#7A4200' },
            info:    { bg: '#F0F4FF', border: '#2D268C', icon: 'i', text: '#2D268C' },
        };
        const c = colors[type] || colors.error;

        const toast = document.createElement('div');
        toast.className = 'notify-toast';
        toast.style.cssText = `
            position: fixed;
            top: 24px;
            left: 50%;
            transform: translateX(-50%) translateY(-16px);
            background: ${c.bg};
            border: 1.5px solid ${c.border};
            color: ${c.text};
            font-family: 'DVDDS', sans-serif;
            font-size: 14px;
            padding: 14px 20px 14px 16px;
            border-radius: 40px;
            box-shadow: 0 8px 28px rgba(0,0,0,0.12);
            z-index: 99999;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 480px;
            min-width: 260px;
            opacity: 0;
            transition: all 0.3s ease;
            pointer-events: all;
        `;

        toast.innerHTML = `
            <span style="
                width: 22px; height: 22px;
                border-radius: 50%;
                background: ${c.border};
                color: #fff;
                display: flex; align-items: center; justify-content: center;
                font-size: 12px; font-weight: 700;
                flex-shrink: 0;
            ">${c.icon}</span>
            <span style="flex:1; line-height:1.4;">${message}</span>
            <button onclick="this.closest('.notify-toast').remove()" style="
                background: none; border: none; cursor: pointer;
                color: ${c.text}; opacity: 0.6; font-size: 18px;
                padding: 0; line-height: 1; flex-shrink: 0;
            ">×</button>
        `;

        document.body.appendChild(toast);

        // Анимация появления
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Автоскрытие
        if (duration > 0) {
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(-16px)';
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    },

    error(msg, duration)   { return this.show(msg, 'error', duration); },
    success(msg, duration) { return this.show(msg, 'success', duration); },
    warning(msg, duration) { return this.show(msg, 'warning', duration); },
    info(msg, duration)    { return this.show(msg, 'info', duration); },
};


// ══════════════════════════════════════════════
// ВАЛИДАЦИЯ ПОЛЕЙ ФОРМ
// ══════════════════════════════════════════════

window.validate = {

    /**
     * Подсветить поле как ошибочное
     */
    markError(fieldId, message) {
        const el = document.getElementById(fieldId);
        if (!el) return;
        el.style.borderBottomColor = '#FF4444';
        el.style.borderColor = '#FF4444';
        el.addEventListener('input', () => this.clearError(fieldId), { once: true });
        if (message) notify.error(message);
    },

    /**
     * Снять подсветку ошибки
     */
    clearError(fieldId) {
        const el = document.getElementById(fieldId);
        if (!el) return;
        el.style.borderBottomColor = '';
        el.style.borderColor = '';
    },

    /**
     * Сбросить все ошибки в форме
     */
    clearAll(fieldIds = []) {
        fieldIds.forEach(id => this.clearError(id));
        document.querySelectorAll('.notify-toast').forEach(el => el.remove());
    },

    /**
     * Подсветить элемент (не input) — например список категорий
     */
    markElements(selector, color = '#FF4444') {
        document.querySelectorAll(selector).forEach(el => {
            el.style.borderColor = color;
        });
    },

    clearElements(selector) {
        document.querySelectorAll(selector).forEach(el => {
            el.style.borderColor = '';
        });
    },
};


// ══════════════════════════════════════════════
// ЗАМЕНА СТАРЫХ alert() НА notify
// Опционально — раскомментируй если хочешь
// ══════════════════════════════════════════════

// window._originalAlert = window.alert;
// window.alert = function(msg) {
//     if (msg && msg.includes('✅')) notify.success(msg);
//     else if (msg && msg.includes('❌')) notify.error(msg);
//     else notify.info(msg);
// };