// static/js/category.js

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== 1. ЭЛЕМЕНТЫ ==========
    const modal = document.getElementById('createCategoryModal');
    // СТАЛО — если оверлея нет, создаём его динамически:
let overlay = document.getElementById('modalOverlay');
if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'modalOverlay';
    overlay.style.cssText = 'display:none; position:fixed; inset:0; background:rgba(20,16,60,0.55); backdrop-filter:blur(6px); z-index:200;';
    document.body.appendChild(overlay);
}
    const openBtn = document.getElementById('openCategoryModalBtn');
    const closeBtn = modal?.querySelector('.close-mod2');
    
    const form = document.getElementById('createCategoryForm');
    const nameInput = document.getElementById('category-name');
    const submitBtn = document.getElementById('createCategorySubmit');
    const categoriesContainer = document.querySelector('.activities');
    
    // Элементы панели редактирования
    const editPanel = document.getElementById('editCategoryPanel');
    const editOverlay = document.getElementById('editCategoryOverlay');
    const closePanelBtn = document.getElementById('closeEditPanelBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const editForm = document.getElementById('editCategoryForm');
    
    // Поля формы редактирования
    const editNameInput = document.getElementById('editCategoryName');
    const editEmojiInput = document.getElementById('editEmojiInput');
    const editSelectedEmojiSpan = document.getElementById('editSelectedEmoji');
    const editColorInput = document.getElementById('editColorInput');
    const editColorPreview = document.getElementById('editColorPreview');
    const editColorName = document.getElementById('editColorName');
    const editDescriptionInput = document.getElementById('editCategoryDescription');
    
    let currentCategoryId = null;
    let colorSelectorInitialized = false;
    let emojiPickerInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 10;
    
    // ========== 2. CSRF ТОКЕН ==========
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    
    // ========== 3. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}ч ${minutes}м`;
        return `${minutes}м`;
    }
    
    // ========== 4. ОТОБРАЖЕНИЕ КАТЕГОРИЙ ==========
    function renderCategories(categories) {
        if (!categoriesContainer) {
            console.error('❌ Контейнер .activities не найден');
            return;
        }
        
        if (categories.length === 0) {
            categoriesContainer.innerHTML = `
                <div class="empty-state">
                    <p>У вас пока нет категорий</p>
                </div>
            `;
            const emptyCreateBtn = document.getElementById('emptyCreateBtn');
            if (emptyCreateBtn) emptyCreateBtn.addEventListener('click', () => openModal());
            return;
        }
        
        let html = '';
        categories.forEach(cat => {
            const totalTime = cat.total_time_formatted || formatDuration(cat.total_time || 0);
            html += `
                <div class="activiti" data-category-id="${cat.id}">
                    <div class="info">
                        <a href="/categories/${cat.id}/" class="category-link">
                            <div class="smail" style="background-color: ${cat.color}">
                                ${cat.emoji || '📁'}
                            </div>
                            <div class="text">
                                <span>${escapeHtml(cat.name)}</span>
                                <p class="info-time">объем работы: ${totalTime}</p>
                            </div>
                        </a>
                    </div>
                    <div class="all-btn">
                        <button class="edit-category-btn" 
                            data-id="${cat.id}"
                            data-name="${escapeHtml(cat.name)}"
                            data-emoji="${cat.emoji || '📁'}"
                            data-color="${cat.color}"
                            data-description="${escapeHtml(cat.description || '')}">
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                <path d="M0.5 12.5H12.5M0.5 12.5V9.42032L6.5 3.26097M0.5 12.5L3.5 12.5L9.49999 6.34064M6.5 3.26097L8.65147 1.05234L8.65277 1.05103C8.94893 0.747003 9.09727 0.59472 9.26827 0.537683C9.41891 0.487439 9.58118 0.487439 9.73181 0.537683C9.90269 0.594679 10.0509 0.74679 10.3466 1.05039L11.6515 2.38989C11.9485 2.69479 12.097 2.84731 12.1527 3.0231C12.2016 3.17774 12.2016 3.34431 12.1527 3.49894C12.0971 3.67461 11.9487 3.8269 11.6521 4.13136L11.6515 4.13202L9.49999 6.34064M6.5 3.26097L9.49999 6.34064" stroke="#2A2A2A" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                        <button class="btn-delete" data-category-id="${cat.id}">
                            <svg width="12" height="13" viewBox="0 0 12 13" fill="none">
                                <path d="M7.375 5.16667V9.83333M4.625 5.16667V9.83333M1.875 2.5V10.3667C1.875 11.1134 1.875 11.4865 2.02487 11.7717C2.15669 12.0226 2.36689 12.227 2.62561 12.3548C2.91945 12.5 3.30431 12.5 4.07288 12.5H7.92712C8.69569 12.5 9.07999 12.5 9.37383 12.3548C9.63256 12.227 9.84345 12.0226 9.97528 11.7717C10.125 11.4868 10.125 11.114 10.125 10.3687V2.5M1.875 2.5H3.25M1.875 2.5H0.5M3.25 2.5H8.75M3.25 2.5C3.25 1.87874 3.25 1.56827 3.35467 1.32324C3.49422 0.996538 3.76172 0.736819 4.09863 0.601494C4.35132 0.5 4.67183 0.5 5.3125 0.5H6.6875C7.32817 0.5 7.6485 0.5 7.90119 0.601494C8.2381 0.736819 8.50571 0.996538 8.64526 1.32324C8.74993 1.56827 8.75 1.87875 8.75 2.5M8.75 2.5H10.125M10.125 2.5H11.5" stroke="#2A2A2A" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
            `;
        });
        
        categoriesContainer.innerHTML = html;
        initDeleteButtons();
        initEditButtons();
    }
    
    // ========== 5. ЗАГРУЗКА КАТЕГОРИЙ ==========
    function loadCategories() {
        console.log('📡 Загрузка категорий...');
        const csrftoken = getCookie('csrftoken');
        
        fetch('/api/categories/', {
            headers: { 'X-CSRFToken': csrftoken, 'Content-Type': 'application/json' }
        })
        .then(response => response.json())
        .then(categories => {
            console.log('📦 Получены категории:', categories);
            renderCategories(categories);
        })
        .catch(error => {
            console.error('❌ Ошибка загрузки категорий:', error);
            if (categoriesContainer) {
                categoriesContainer.innerHTML = `
                    <div class="error-state">
                        <p>❌ Ошибка загрузки категорий</p>
                        <button onclick="location.reload()">Обновить</button>
                    </div>
                `;
            }
        });
    }
    
    // ========== 6. УДАЛЕНИЕ КАТЕГОРИИ ==========
    function initDeleteButtons() {
        const deleteButtons = document.querySelectorAll('.btn-delete');
        console.log('🔍 Найдено кнопок удаления:', deleteButtons.length);
        
        deleteButtons.forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const categoryId = this.dataset.categoryId;
                if (!categoryId) return;
                
                const categoryElement = this.closest('.activiti');
                let categoryName = categoryElement?.querySelector('.text span')?.innerText || 'категорию';
                
                if (!confirm(`Удалить категорию "${categoryName}"?`)) return;
                
                const csrftoken = getCookie('csrftoken');
                
                fetch(`/api/categories/${categoryId}/`, {
                    method: 'DELETE',
                    headers: { 'X-CSRFToken': csrftoken },
                })
                .then(response => {
                    if (response.ok) {
                        categoryElement?.remove();
                        (window.notify ? window.notify.success('✅ Категория удалена') : alert('✅ Категория удалена'));
                        loadCategories();
                    } else {
                        throw new Error('Ошибка при удалении');
                    }
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                    (window.notify ? window.notify.error('❌ Ошибка при удалении') : alert('❌ Ошибка при удалении'));
                });
            });
        });
    }
    
    // ========== 7. РЕДАКТИРОВАНИЕ КАТЕГОРИИ (открытие панели) ==========
    function openEditModal(categoryId, categoryName, categoryEmoji, categoryColor, categoryDesc) {
        if (!editPanel || !editOverlay) {
            console.error('Панель редактирования не найдена');
            return;
        }
        
        currentCategoryId = categoryId;
        if (editNameInput) editNameInput.value = categoryName || '';
        if (editSelectedEmojiSpan) editSelectedEmojiSpan.textContent = categoryEmoji || '🎨';
        if (editEmojiInput) editEmojiInput.value = categoryEmoji || '🎨';
        if (editColorPreview) editColorPreview.style.backgroundColor = categoryColor || '#C7CEEA';
        if (editColorInput) editColorInput.value = categoryColor || '#C7CEEA';
        if (editDescriptionInput) editDescriptionInput.value = categoryDesc || '';
        
        const colorOption = document.querySelector(`#editColorDropdown .color-option[data-color="${categoryColor}"]`);
        if (colorOption && editColorName) {
            editColorName.textContent = colorOption.dataset.name;
        }
        
        editPanel.classList.add('open');
        editOverlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
    
    function closeEditPanel() {
        if (editPanel) editPanel.classList.remove('open');
        if (editOverlay) editOverlay.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    function initEditButtons() {
        const editButtons = document.querySelectorAll('.edit-category-btn');
        console.log('🔍 Найдено кнопок редактирования:', editButtons.length);
        
        editButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openEditModal(
                    this.dataset.id,
                    this.dataset.name,
                    this.dataset.emoji,
                    this.dataset.color,
                    this.dataset.description
                );
            });
        });
    }
    function initColorSelector() {
    if (!colorBtn || !colorDropdown || !colorOptions.length) {
        console.log('⚠️ Элементы выбора цвета не найдены');
        return;
    }
    
    // Открытие/закрытие списка
    colorBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        colorDropdown.style.display = colorDropdown.style.display === 'block' ? 'none' : 'block';
    });
    
    // Выбор цвета
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            const selectedColor = this.dataset.color;
            const selectedName = this.dataset.name;
            
            // Обновляем визуальные элементы
            if (colorPreview) colorPreview.style.backgroundColor = selectedColor;
            if (colorName) colorName.textContent = selectedName;
            
            // 🔥 ВАЖНО: обновляем скрытое поле colorInput
            if (colorInput) {
                colorInput.value = selectedColor;
                console.log('🎨 Цвет сохранён в input:', selectedColor);
            }
            
            // Убираем выделение с других опций
            colorOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            // Закрываем выпадающий список
            colorDropdown.style.display = 'none';
        });
    });
    
    // Закрытие при клике вне
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.color-selector-container')) {
            colorDropdown.style.display = 'none';
        }
    });
    
    // 🔥 ДОБАВЛЯЕМ: устанавливаем дефолтный цвет при загрузке
    if (colorInput && !colorInput.value) {
        colorInput.value = '#C7CEEA';
    }
    if (colorPreview && !colorPreview.style.backgroundColor) {
        colorPreview.style.backgroundColor = '#C7CEEA';
    }
    
    console.log('✅ Инициализация выбора цвета завершена, текущий цвет:', colorInput?.value);
}
    
    // ========== 8. УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ СОЗДАНИЯ ==========
    function openModal() {
        console.log('📂 Открываем модальное окно');
        modal.style.display = 'block';
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        retryCount = 0;
        setTimeout(() => {
            if (!colorSelectorInitialized) initColorSelector();
            if (!emojiPickerInitialized) initEmojiPicker();
        }, 100);
    }
    
    function closeModal() {
        modal.style.display = 'none';
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (overlay) overlay.addEventListener('click', closeModal);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal?.style.display === 'block') closeModal();
        if (e.key === 'Escape' && editPanel?.classList.contains('open')) closeEditPanel();
    });
    
    // Закрытие панели редактирования
    if (closePanelBtn) closePanelBtn.addEventListener('click', closeEditPanel);
    if (cancelBtn) cancelBtn.addEventListener('click', closeEditPanel);
    if (editOverlay) editOverlay.addEventListener('click', closeEditPanel);
    
    // ========== 9. СОХРАНЕНИЕ РЕДАКТИРОВАНИЯ ==========
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = editNameInput?.value.trim();
            if (!name) {
                (window.validate ? window.validate.markError('category-name', 'Введите название категории') : (window.notify ? window.notify.error('Введите название категории') : alert('Введите название категории')));
                return;
            }
            
            const formData = {
                name: name,
                emoji: editEmojiInput?.value || '🎨',
                color: editColorInput?.value,
                description: editDescriptionInput?.value || ''
            };
            
            const csrftoken = getCookie('csrftoken');
            
            try {
                const response = await fetch(`/api/categories/${currentCategoryId}/`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    (window.notify ? window.notify.success('✅ Категория успешно обновлена!') : alert('✅ Категория успешно обновлена!'));
                    location.reload();
                } else {
                    (window.notify ? window.notify.error('❌ Ошибка при обновлении') : alert('❌ Ошибка при обновлении'));
                }
            } catch (error) {
                console.error('Ошибка:', error);
                (window.notify ? window.notify.error('❌ Ошибка сети') : alert('❌ Ошибка сети'));
            }
        });
    }
    
 // ========== ВЫБОР ЦВЕТА (делегирование) ==========
document.addEventListener('click', function(e) {
    // Открытие выпадающего списка
    const colorBtn = e.target.closest('#editColorSelectorBtn');
    if (colorBtn) {
        e.preventDefault();
        e.stopPropagation();
        const dropdown = document.getElementById('editColorDropdown');
        if (dropdown) {
            const isOpen = dropdown.style.display === 'block';
            dropdown.style.display = isOpen ? 'none' : 'block';
        }
        return;
    }
    
    // Выбор цвета
    const colorOption = e.target.closest('#editColorDropdown .color-option');
    if (colorOption) {
        e.preventDefault();
        e.stopPropagation();
        const selectedColor = colorOption.dataset.color;
        const selectedName = colorOption.dataset.name;
        
        const preview = document.getElementById('editColorPreview');
        const nameSpan = document.getElementById('editColorName');
        const input = document.getElementById('editColorInput');
        
        if (preview) preview.style.backgroundColor = selectedColor;
        if (nameSpan) nameSpan.textContent = selectedName;
        if (input) input.value = selectedColor;
        
        const dropdown = document.getElementById('editColorDropdown');
        if (dropdown) dropdown.style.display = 'none';
    }
});

// Закрытие при клике вне
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('editColorDropdown');
    const btn = document.getElementById('editColorSelectorBtn');
    if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});
    
    // ========== 11. ВЫБОР ЭМОДЗИ ==========
    function initEmojiPicker() {
        const emojiBtn = document.getElementById('emojiPickerBtn');
        const emojiContainer = document.getElementById('emojiPickerContainer');
        
        if (!emojiBtn || !emojiContainer) return false;
        
        const hasEmojiPicker = typeof customElements !== 'undefined' && customElements.get('emoji-picker');
        
        if (hasEmojiPicker) {
            try {
                emojiContainer.innerHTML = '';
                const picker = document.createElement('emoji-picker');
                picker.classList.add('light');
                picker.setAttribute('locale', 'ru');
                
                picker.addEventListener('emoji-click', (event) => {
                    const emoji = event.detail.unicode;
                    const emojiSpan = document.getElementById('selectedEmoji');
                    const emojiInputEl = document.getElementById('emojiInput');
                    
                    if (emojiSpan) emojiSpan.textContent = emoji;
                    if (emojiInputEl) emojiInputEl.value = emoji;
                    emojiContainer.style.display = 'none';
                });
                
                emojiContainer.appendChild(picker);
                
                const newEmojiBtn = emojiBtn.cloneNode(true);
                emojiBtn.parentNode.replaceChild(newEmojiBtn, emojiBtn);
                
                newEmojiBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    emojiContainer.style.display = emojiContainer.style.display === 'block' ? 'none' : 'block';
                });
                
                document.addEventListener('click', function(e) {
                    if (!e.target.closest('.emoji-selector-container')) {
                        emojiContainer.style.display = 'none';
                    }
                });
                
                emojiPickerInitialized = true;
                return true;
            } catch (error) {
                console.error('Ошибка эмодзи:', error);
                return false;
            }
        }
        return false;
    }
    
    // ========== 12. СОЗДАНИЕ КАТЕГОРИИ ==========
    function initCategoryForm() {
        if (!form) return;
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const categoryName = nameInput?.value.trim();
            if (!categoryName) {
                (window.validate ? window.validate.markError('category-name', 'Введите название категории') : (window.notify ? window.notify.error('Введите название категории') : alert('Введите название категории')));
                return;
            }
            
            const emojiSpan = document.getElementById('selectedEmoji');
            const emoji = emojiSpan?.textContent || '🎨';
            const colorInputEl = document.getElementById('colorInput');
            const color = colorInputEl?.value || '#C7CEEA';
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Создание...';
            }
            
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || getCookie('csrftoken');
            
            fetch('/api/categories/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify({
                    name: categoryName,
                    emoji: emoji,
                    color: color,
                    description: ''
                })
            })
            .then(response => response.json())
.then(data => {
    if (data.id) {
        (window.notify ? window.notify.success(`Категория "${data.name}" создана!`) : alert(`Категория "${data.name}" успешно создана!`));
        closeModal();
        loadCategories();
        nameInput.value = '';
        if (emojiSpan) emojiSpan.textContent = '🎨';
        const colorPreview = document.getElementById('selectedColorPreview');
        if (colorPreview) colorPreview.style.backgroundColor = '#C7CEEA';
        if (colorInputEl) colorInputEl.value = '#C7CEEA';
        return; // ← добавь это
    }
    // Показываем ошибку только если нет id
    const errorMsg = data.error || data.name?.[0] || 'Ошибка при создании категории';
    (window.notify ? window.notify.error(errorMsg) : alert(errorMsg));
})
            .catch(error => {
                console.error('Ошибка:', error);
                (window.notify ? window.notify.error('Ошибка при создании категории') : alert('Ошибка при создании категории'));
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '+ создать';
                }
            });
        });
    }
    // ── ВЫБОР ЦВЕТА ДЛЯ МОДАЛКИ СОЗДАНИЯ ──
function initColorSelector() {
    const btn      = document.getElementById('colorSelectorBtn');
    const dropdown = document.getElementById('colorDropdown');
    const preview  = document.getElementById('selectedColorPreview');
    const input    = document.getElementById('colorInput');
    if (!btn || !dropdown) return;

    btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });

    dropdown.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            if (preview) preview.style.backgroundColor = this.dataset.color;
            if (input)   input.value = this.dataset.color;
            dropdown.style.display = 'none';
        });
    });

    document.addEventListener('click', function(e) {
        if (!btn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    colorSelectorInitialized = true;
}

// ── ЭМОДЗИ ДЛЯ ПАНЕЛИ РЕДАКТИРОВАНИЯ ──
function initEditEmojiPicker() {
    const emojiBtn       = document.getElementById('editEmojiPickerBtn');
    const emojiContainer = document.getElementById('editEmojiPickerContainer');
    if (!emojiBtn || !emojiContainer) return;

    const hasEmojiPicker = typeof customElements !== 'undefined' && customElements.get('emoji-picker');
    if (!hasEmojiPicker) return;

    try {
        emojiContainer.innerHTML = '';
        const picker = document.createElement('emoji-picker');
        picker.classList.add('light');

    picker.addEventListener('emoji-click', (event) => {
        const emoji = event.detail.unicode;
        const span  = document.getElementById('editSelectedEmoji');
        const input = document.getElementById('editEmojiInput');
        if (span)  span.textContent = emoji;
        if (input) input.value = emoji;
        emojiContainer.style.display = 'none';
    });

        emojiContainer.appendChild(picker);

        const newBtn = emojiBtn.cloneNode(true);
        emojiBtn.parentNode.replaceChild(newBtn, emojiBtn);

        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            emojiContainer.style.display =
                emojiContainer.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', function(e) {
            if (!e.target.closest('#editEmojiPickerContainer') &&
                !e.target.closest('#editEmojiPickerBtn')) {
                emojiContainer.style.display = 'none';
            }
        });
    } catch(err) {
        console.error('Ошибка эмодзи панели:', err);
    }
}
    // ========== 13. ЗАПУСК ==========
    loadCategories();
    initCategoryForm();
    initColorSelector();      // ← добавь
    initEditEmojiPicker(); 
    window.openEditModal = openEditModal;
    
    console.log('🚀 category.js загружен');
});