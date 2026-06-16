// static/js/pro_lock.js
// Управление ограничениями Free тарифа

document.addEventListener('DOMContentLoaded', function() {

    const isPro = document.body.dataset.isPro === 'true';
    if (isPro) return;

    // ── SVG ЗАМКА ──
    const LOCK_SVG = `<svg class="lock-icon" viewBox="0 0 574.922 574.922" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M491.102,238.031v-33.892c0-27.472-5.39-54.146-16.021-79.278c-10.26-24.255-24.937-46.028-43.624-64.717c-18.688-18.688-40.462-33.365-64.717-43.623C341.607,5.891,314.934,0.5,287.461,0.5s-54.146,5.391-79.279,16.021c-24.255,10.259-46.028,24.935-64.717,43.623c-18.688,18.688-33.366,40.462-43.624,64.717c-10.63,25.133-16.021,51.806-16.021,79.278v33.892c-29.34,2.925-52.328,27.753-52.328,57.85v220.4c0,32.059,26.082,58.141,58.14,58.141h395.657c32.059,0,58.141-26.082,58.141-58.141v-220.4C543.431,265.784,520.442,240.957,491.102,238.031z M126.662,204.139c0-88.807,71.993-160.799,160.8-160.799c88.807,0,160.8,71.993,160.8,160.799v33.602h-321.6V204.139z M287.461,302.375c-34.337,0-62.272,27.936-62.272,62.273c0,26.639,16.816,49.422,40.388,58.299v49.414c0,4.852,1.699,9.581,4.784,13.316c3.992,4.833,9.874,7.605,16.136,7.605c6.216,0,12.071-2.741,16.063-7.521c3.132-3.751,4.856-8.51,4.856-13.4v-49.078c24.516-8.786,40.986-32.163,40.986-58.17C349.401,330.311,321.799,302.375,287.461,302.375z M287.461,384.082c-10.732,0-19.433-8.701-19.433-19.434s8.701-19.434,19.433-19.434s19.433,8.701,19.433,19.434S298.194,384.082,287.461,384.082z"/>
    </svg>`;

    // ── УВЕДОМЛЕНИЕ О ЛИМИТЕ ──
    function showLimitNotice(message) {
        // Удаляем предыдущее если есть
        const existing = document.getElementById('proLimitNotice');
        if (existing) existing.remove();

        const notice = document.createElement('div');
        notice.id = 'proLimitNotice';
        notice.style.cssText = `
            position: fixed;
            top: 24px;
            left: 50%;
            transform: translateX(-50%);
            background: #2A2A2A;
            color: #fff;
            font-family: 'DVDDS', sans-serif;
            font-size: 14px;
            padding: 14px 24px;
            border-radius: 40px;
            box-shadow: 0 8px 28px rgba(0,0,0,0.2);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 12px;
            max-width: 480px;
            text-align: center;
            animation: slideDown 0.3s ease;
        `;
        notice.innerHTML = `
            ${LOCK_SVG.replace('class="lock-icon"', 'style="width:20px;height:20px;flex-shrink:0;"')}
            <span>${message}</span>
            <a href="/proversion/" style="color:#AEBCFE;white-space:nowrap;text-decoration:none;font-weight:700;">PRO →</a>
        `;

        document.body.appendChild(notice);
        setTimeout(() => {
            notice.style.opacity = '0';
            notice.style.transition = 'opacity 0.3s';
            setTimeout(() => notice.remove(), 300);
        }, 4000);
    }

    // ── БЛОКИРОВКА БЛОКОВ (замок поверх) ──
    function lockBlock(selector, title, desc) {
        const el = document.querySelector(selector);
        if (!el) return;
        el.classList.add('pro-lock-wrapper', 'locked');

        const badge = document.createElement('div');
        badge.className = 'pro-lock-badge';
        badge.innerHTML = `
            ${LOCK_SVG}
            <span class="lock-title">${title}</span>
            ${desc ? `<span class="lock-desc">${desc}</span>` : ''}
            <a href="/proversion/" class="lock-btn">Оформить PRO</a>
        `;
        el.appendChild(badge);
    }

    // ════════════════════════════════════════════
    // СТРАНИЦА ЦЕЛЕЙ
    // Лимит 2 цели — кнопка открывает модалку,
    // но при сабмите показывает уведомление
    // ════════════════════════════════════════════
    const goalsGrid = document.getElementById('activeGoalsGrid');
    if (goalsGrid) {
        // Блокируем весь блок активных целей замком
        const activeSection = document.querySelector('.active');

        // Перехватываем кнопку создания цели
        const openGoalBtn = document.getElementById('openGoalModal');
        const openGoalBtnEmpty = document.getElementById('openGoalModalEmpty');

        function handleGoalOpen(e) {
            // Проверяем текущее количество активных целей
            fetch('/api/goals/')
                .then(r => r.json())
                .then(goals => {
                    if (Array.isArray(goals) && goals.length >= 2) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        showLimitNotice('Лимит 2 цели на бесплатном тарифе. Удалите существующую или оформите PRO.');
                    }
                    // Если меньше 2 — модалка открывается обычно
                })
                .catch(() => {});
        }

        if (openGoalBtn) openGoalBtn.addEventListener('click', handleGoalOpen, true);
        if (openGoalBtnEmpty) openGoalBtnEmpty.addEventListener('click', handleGoalOpen, true);
    }

    // ════════════════════════════════════════════
    // СТРАНИЦА ПРОФИЛЯ — экспорт и аналитика
    // ════════════════════════════════════════════
    if (document.querySelector('.export-section')) {
        lockBlock('.export-section',
            'Экспорт — PRO',
            'Выгружайте данные в CSV, JSON и Excel'
        );
    }

    if (document.querySelector('.trend-chart-container')) {
        lockBlock('.trend-chart-container',
            'Расширенная аналитика — PRO',
            'Динамика активности по категориям за месяц'
        );
    }

    // ════════════════════════════════════════════
    // СТРАНИЦА КАТЕГОРИЙ — лимит 5 шт
    // Кнопка открывает модалку, уведомление при превышении
    // ════════════════════════════════════════════
    const openCategoryBtn = document.getElementById('openCategoryModalBtn');
    if (openCategoryBtn) {
        openCategoryBtn.addEventListener('click', function(e) {
            fetch('/api/categories/')
                .then(r => r.json())
                .then(cats => {
                    if (cats.length >= 5) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        showLimitNotice('Лимит 5 категорий на бесплатном тарифе. Удалите существующую или оформите PRO.');
                    }
                })
                .catch(() => {});
        }, true);
    }

    // ════════════════════════════════════════════
    // СТРАНИЦА ЗАДАЧ — лимит 10 шт
    // Кнопка открывает модалку, уведомление при превышении
    // ════════════════════════════════════════════
    const openTaskBtn = document.getElementById('openCreateTaskModal');
    if (openTaskBtn) {
        openTaskBtn.addEventListener('click', function(e) {
            fetch('/api/tasks/')
                .then(r => r.json())
                .then(tasks => {
                    const active = tasks.filter(t => !t.completed);
                    if (active.length >= 10) {
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        showLimitNotice('Лимит 10 задач на бесплатном тарифе. Выполните или удалите существующие, или оформите PRO.');
                    }
                })
                .catch(() => {});
        }, true);
    }

    console.log('🔒 pro_lock.js загружен — Free тариф');
});