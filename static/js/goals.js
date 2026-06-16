// static/js/goals.js

const GOALS_API = '/api/goals/';

let selectedType     = 'time';
let selectedPeriod   = 'week';
let selectedCategoryId = null;

// ── CSRF ──
function getCookie(name) {
    let value = null;
    document.cookie.split(';').forEach(c => {
        const [k, v] = c.trim().split('=');
        if (k === name) value = decodeURIComponent(v);
    });
    return value;
}

// ── СООБЩЕНИЯ ──
function showMessage(msg, type) {
    if (window.notify) {
        if (type === 'error') window.notify.error(msg);
        else if (type === 'success') window.notify.success(msg);
        else window.notify.info(msg);
    }
}

function clearErrors() {
    if (window.validate) {
        window.validate.clearAll(['goalTitle', 'goalTarget', 'goalDeadline']);
        window.validate.clearElements('.goal-cat-item');
    }
}

function markError(fieldId, msg) {
    if (window.validate) window.validate.markError(fieldId, msg);
    else showMessage(msg, 'error');
}

// ── ОТКРЫТИЕ/ЗАКРЫТИЕ МОДАЛКИ ──
function openModal() {
    document.getElementById('goalModal').classList.add('active');
    document.getElementById('goalModalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
    clearErrors();
}

function closeModal() {
    document.getElementById('goalModal').classList.remove('active');
    document.getElementById('goalModalOverlay').classList.remove('active');
    document.body.style.overflow = '';
    resetForm();
}

document.getElementById('openGoalModal')?.addEventListener('click', openModal);
document.getElementById('openGoalModalEmpty')?.addEventListener('click', openModal);
document.getElementById('closeGoalModal')?.addEventListener('click', closeModal);
document.getElementById('goalModalOverlay')?.addEventListener('click', closeModal);

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

// ── КНОПКИ ТИПА ──
document.querySelectorAll('.goal-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.goal-type-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedType = btn.dataset.type;
        const targetInput = document.getElementById('goalTarget');
        if (targetInput) {
            targetInput.placeholder = selectedType === 'time' ? 'Например: 20' : 'Например: 10';
            targetInput.step = selectedType === 'time' ? '0.5' : '1';
        }
    });
});

// ── КНОПКИ ПЕРИОДА ──
document.querySelectorAll('.goal-period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.goal-period-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedPeriod = btn.dataset.period;
        const deadlineWrap = document.getElementById('deadlineWrap');
        if (deadlineWrap) deadlineWrap.classList.toggle('visible', selectedPeriod === 'custom');
    });
});

// ── ПОИСК КАТЕГОРИЙ ──
const catSearch = document.getElementById('catSearch');
if (catSearch) {
    const noResults = document.createElement('p');
    noResults.className = 'goal-cat-no-results';
    noResults.textContent = 'Ничего не найдено';
    document.getElementById('goalCatRow')?.appendChild(noResults);

    catSearch.addEventListener('input', () => {
        const q = catSearch.value.toLowerCase().trim();
        const items = document.querySelectorAll('.goal-cat-item');
        let visible = 0;
        items.forEach(item => {
            const match = item.dataset.name.includes(q);
            item.classList.toggle('hidden', !match);
            if (match) visible++;
        });
        noResults.classList.toggle('visible', visible === 0);
    });
}

// ── ВЫБОР КАТЕГОРИИ ──
document.querySelectorAll('.goal-cat-item').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.goal-cat-item').forEach(p => {
            p.classList.remove('selected');
            p.style.borderColor = '#2d268c';
        });
        item.classList.add('selected');
        selectedCategoryId = item.dataset.id;
        // Сбрасываем ошибку категории
        const errEl = document.getElementById('goalFormError');
        if (errEl && errEl.textContent.includes('категор')) errEl.style.display = 'none';
    });
});

// ── ОТПРАВКА ФОРМЫ ──
document.getElementById('submitGoal')?.addEventListener('click', async () => {
    clearErrors();

    // ── ПРОВЕРКА ЛИМИТА FREE ТАРИФА ──
    const isPro = document.body.dataset.isPro === 'true';
    if (!isPro) {
        try {
            const limitRes = await fetch(GOALS_API);
            const existing = await limitRes.json();
            if (Array.isArray(existing) && existing.length >= 2) {
                showMessage('Лимит 2 цели на бесплатном тарифе. Удалите существующую или оформите PRO.', 'error');
                return;
            }
        } catch(e) {}
    }

    const title    = document.getElementById('goalTitle')?.value.trim();
    // ... остальной код без изменений
    const target = document.getElementById('goalTarget')?.value;
    const deadline = document.getElementById('goalDeadline')?.value;

    let valid = true;

    if (!selectedCategoryId) {
        // Подсвечиваем список категорий
        document.querySelectorAll('.goal-cat-item').forEach(el => {
            el.style.borderColor = '#FF4444';
        });
        showMessage('Выберите категорию из списка', 'error');
        valid = false;
    }

    if (!title) {
        if (valid) markError('goalTitle', 'Введите название цели');
        else document.getElementById('goalTitle').style.borderBottomColor = '#FF4444';
        valid = false;
    }

    if (!target || parseFloat(target) <= 0) {
        if (valid) markError('goalTarget', 'Укажите целевое значение больше 0');
        else document.getElementById('goalTarget').style.borderBottomColor = '#FF4444';
        valid = false;
    }

    if (selectedPeriod === 'custom' && !deadline) {
        if (valid) markError('goalDeadline', 'Укажите дату выполнения');
        else document.getElementById('goalDeadline').style.borderBottomColor = '#FF4444';
        valid = false;
    }

    if (!valid) return;

    const submitBtn = document.getElementById('submitGoal');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Создание...'; }

    try {
        const res = await fetch(GOALS_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            body: JSON.stringify({
                title,
                goal_type:    selectedType,
                category_id:  selectedCategoryId,
                target_value: parseFloat(target),
                period:       selectedPeriod,
                deadline:     selectedPeriod === 'custom' ? deadline : null,
            }),
        });

        const data = await res.json();

        if (res.status === 201) {
            closeModal();
            loadGoals();
        } else {
            showMessage(data.error || 'Ошибка создания цели', 'error');
        }
    } catch (e) {
        showMessage('Ошибка сети', 'error');
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Создать цель'; }
    }
});

// ── ЗАГРУЗКА ЦЕЛЕЙ ──
async function loadGoals() {
    try {
        const [activeRes, archiveRes] = await Promise.all([
            fetch(GOALS_API),
            fetch(GOALS_API + 'archive/'),
        ]);
        const active  = await activeRes.json();
        const archive = await archiveRes.json();
        renderActive(active);
        renderArchive(archive);
    } catch (e) {
        console.error('Ошибка загрузки целей:', e);
    }
}

function renderActive(goals) {
    const grid  = document.getElementById('activeGoalsGrid');
    const empty = document.getElementById('goalsEmptyState');
    if (!grid) return;

    Array.from(grid.children).forEach(c => { if (c.id !== 'goalsEmptyState') c.remove(); });

    if (!Array.isArray(goals) || goals.length === 0) {
        if (empty) empty.style.display = 'block';
        return;
    }
    if (empty) empty.style.display = 'none';
    goals.forEach(goal => grid.insertBefore(createGoalCard(goal, false), empty));
}

function renderArchive(goals) {
    const grid  = document.getElementById('archiveGrid');
    const count = document.getElementById('archiveCount');
    if (!grid) return;

    grid.innerHTML = '';
    if (count) count.textContent = Array.isArray(goals) ? goals.length : 0;

    if (!Array.isArray(goals) || goals.length === 0) {
        grid.innerHTML = '<p style="grid-column:1/-1;font-size:13px;color:#757575;padding:16px 0;">Выполненных целей пока нет</p>';
        return;
    }
    goals.forEach(goal => grid.appendChild(createGoalCard(goal, true)));
}

function createGoalCard(goal, archived) {
    const card = document.createElement('div');
    card.className = `goal-card ${goal.status}`;
    card.style.setProperty('--cat-color', goal.category_color);
    card.style.setProperty('--cat-bg', goal.category_color + '30');

    const statusLabels = { active: 'В процессе', completed: 'Выполнено', failed: 'Просрочено' };
    const periodLabel  = goal.period === 'week' ? 'Неделя'
                       : goal.period === 'month' ? 'Месяц'
                       : 'До ' + (goal.deadline || '—');

    card.innerHTML = `
        <div class="goal-card-header">
            <div class="goal-card-left">
                <span class="goal-category">${goal.category_emoji} ${goal.category_name}</span>
                <div class="goal-title">${goal.title}</div>
            </div>
            ${!archived ? `
            <button class="goal-delete" data-id="${goal.id}" title="Удалить">
                <svg width="11" height="12" viewBox="0 0 12 13" fill="none">
                    <path d="M7.375 5.16667V9.83333M4.625 5.16667V9.83333M1.875 2.5V10.3667C1.875 11.1134 1.875 11.4865 2.02487 11.7717C2.15669 12.0226 2.36689 12.227 2.62561 12.3548C2.91945 12.5 3.30431 12.5 4.07288 12.5H7.92712C8.69569 12.5 9.07999 12.5 9.37383 12.3548C9.63256 12.227 9.84345 12.0226 9.97528 11.7717C10.125 11.4868 10.125 11.114 10.125 10.3687V2.5M1.875 2.5H3.25M1.875 2.5H0.5M3.25 2.5H8.75M8.75 2.5H10.125M10.125 2.5H11.5" stroke="#757575" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>` : ''}
        </div>
        <div class="goal-progress-wrap">
            <div class="goal-progress-bar-bg">
                <div class="goal-progress-bar-fill" style="width:${goal.progress_percent}%"></div>
            </div>
            <div class="goal-progress-meta">
                <span class="goal-progress-value">${goal.current_value} / ${goal.target_value} ${goal.unit}</span>
                <span class="goal-progress-percent">${goal.progress_percent}%</span>
            </div>
        </div>
        <div class="goal-card-footer">
            <span class="goal-period-badge">${periodLabel}</span>
            <span class="goal-status-badge ${goal.status}">${statusLabels[goal.status] || goal.status}</span>
        </div>
    `;

    const delBtn = card.querySelector('.goal-delete');
    if (delBtn) delBtn.addEventListener('click', () => deleteGoal(goal.id));

    return card;
}

async function deleteGoal(id) {
    if (!confirm('Удалить эту цель?')) return;
    try {
        await fetch(GOALS_API + id + '/', {
            method: 'DELETE',
            headers: { 'X-CSRFToken': getCookie('csrftoken') },
        });
        loadGoals();
    } catch (e) {
        showMessage('Ошибка удаления', 'error');
    }
}

// ── АРХИВ TOGGLE ──
document.getElementById('archiveToggle')?.addEventListener('click', () => {
    document.getElementById('archiveGrid')?.classList.toggle('open');
    document.getElementById('archiveArrow')?.classList.toggle('open');
});

// ── СБРОС ФОРМЫ ──
function resetForm() {
    selectedType       = 'time';
    selectedPeriod     = 'week';
    selectedCategoryId = null;

    ['goalTitle', 'goalTarget', 'goalDeadline'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.value = ''; el.style.borderBottomColor = '#757575'; }
    });

    document.querySelectorAll('.goal-type-btn').forEach((b, i)   => b.classList.toggle('selected', i === 0));
    document.querySelectorAll('.goal-period-btn').forEach((b, i)  => b.classList.toggle('selected', i === 0));
    document.querySelectorAll('.goal-cat-item').forEach(p => {
        p.classList.remove('selected');
        p.style.borderColor = '#2d268c';
    });

    const deadlineWrap = document.getElementById('deadlineWrap');
    if (deadlineWrap) deadlineWrap.classList.remove('visible');

    if (catSearch) catSearch.value = '';
    document.querySelectorAll('.goal-cat-item').forEach(el => el.classList.remove('hidden'));
    const noRes = document.querySelector('.goal-cat-no-results');
    if (noRes) noRes.classList.remove('visible');

    clearErrors();
}

// ── ИНИТ ──
loadGoals();