// static/js/category.js

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== 1. ЭЛЕМЕНТЫ ==========
    const modal = document.getElementById('createCategoryModal');
    const overlay = document.getElementById('modalOverlay');
    const openBtn = document.getElementById('openCategoryModalBtn');
    const closeBtn = modal?.querySelector('.close-mod2');
    
    // Элементы формы
    const form = document.getElementById('createCategoryForm');
    const nameInput = document.getElementById('category-name');
    const submitBtn = document.getElementById('createCategorySubmit');
    
    let colorSelectorInitialized = false;
    let emojiPickerInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 10;
    
    // ========== 2. ФУНКЦИЯ ПОЛУЧЕНИЯ CSRF-ТОКЕНА ==========
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
    
    // ========== 3. УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ ==========
    function openModal() {
        console.log('📂 Открываем модальное окно');
        modal.style.display = 'block';
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        retryCount = 0;
        setTimeout(() => {
            if (!colorSelectorInitialized) {
                initColorSelector();
            }
            if (!emojiPickerInitialized) {
                initEmojiPicker();
            }
        }, 100);
    }
    
    function closeModal() {
        console.log('📁 Закрываем модальное окно');
        modal.style.display = 'none';
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    if (openBtn && modal && overlay) {
        openBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openModal();
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeModal);
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display === 'block') {
            closeModal();
        }
    });
    
    // ========== 4. ВЫБОР ЦВЕТА ==========
    function initColorSelector() {
        const colorBtn = document.getElementById('colorSelectorBtn');
        const colorDropdown = document.getElementById('colorDropdown');
        let colorOptions = document.querySelectorAll('.color-option');
        
        console.log('🎨 Поиск цветов (попытка', retryCount + 1, ')');
        
        if (!colorBtn || !colorDropdown) {
            console.log('⚠️ Цветовой селектор не найден');
            return false;
        }
        
        if (colorOptions.length === 0) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                console.log('⚠️ Нет опций цветов, повторная попытка через 200мс...');
                setTimeout(() => initColorSelector(), 200);
                return false;
            } else {
                console.error('❌ Цвета не загрузились после', MAX_RETRIES, 'попыток');
                return false;
            }
        }
        
        console.log('🎨 Найдено цветов:', colorOptions.length);
        
        // Удаляем старые обработчики
        const newColorBtn = colorBtn.cloneNode(true);
        colorBtn.parentNode.replaceChild(newColorBtn, colorBtn);
        
        newColorBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = colorDropdown.style.display === 'block';
            colorDropdown.style.display = isOpen ? 'none' : 'block';
        });
        
        // Обновляем опции
        colorOptions = document.querySelectorAll('.color-option');
        
        colorOptions.forEach(option => {
            const newOption = option.cloneNode(true);
            option.parentNode.replaceChild(newOption, option);
            
            newOption.addEventListener('click', function(e) {
                e.stopPropagation();
                const selectedColor = this.dataset.color;
                const selectedName = this.dataset.name;
                
                console.log('🎨 Выбран цвет:', selectedName, selectedColor);
                
                // 🔥 ПОЛУЧАЕМ ЭЛЕМЕНТЫ КАЖДЫЙ РАЗ ЗАНОВО (чтобы быть уверенными)
                const previewEl = document.getElementById('selectedColorPreview');
                const nameEl = document.getElementById('selectedColorName');
                const inputEl = document.getElementById('colorInput');
                
                if (previewEl) {
                    previewEl.style.backgroundColor = selectedColor;
                    console.log('✅ Обновлён цвет превью на:', selectedColor);
                } else {
                    console.error('❌ Элемент selectedColorPreview не найден!');
                }
                
                if (nameEl) {
                    nameEl.textContent = selectedName;
                    console.log('✅ Обновлено название цвета на:', selectedName);
                } else {
                    console.error('❌ Элемент selectedColorName не найден!');
                }
                
                if (inputEl) {
                    inputEl.value = selectedColor;
                    console.log('✅ Обновлён input цвета на:', selectedColor);
                } else {
                    console.error('❌ Элемент colorInput не найден!');
                }
                
                // Убираем выделение с других опций
                document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                
                colorDropdown.style.display = 'none';
            });
        });
        
        document.addEventListener('click', function(e) {
            if (newColorBtn && colorDropdown && !newColorBtn.contains(e.target) && !colorDropdown.contains(e.target)) {
                colorDropdown.style.display = 'none';
            }
        });
        
        const initialColorInput = document.getElementById('colorInput');
        if (initialColorInput && !initialColorInput.value) {
            initialColorInput.value = '#C7CEEA';
        }
        
        colorSelectorInitialized = true;
        console.log('✅ Цветовой селектор инициализирован');
        return true;
    }
    
    // ========== 5. ВЫБОР ЭМОДЗИ ==========
    function initEmojiPicker() {
        const emojiBtn = document.getElementById('emojiPickerBtn');
        const emojiContainer = document.getElementById('emojiPickerContainer');
        
        if (!emojiBtn || !emojiContainer) {
            console.log('⚠️ Эмодзи пикер не найден');
            return false;
        }
        
        const hasEmojiPicker = typeof customElements !== 'undefined' && customElements.get('emoji-picker');
        
        if (hasEmojiPicker) {
            try {
                emojiContainer.innerHTML = '';
                const picker = document.createElement('emoji-picker');
                picker.classList.add('light');
                picker.setAttribute('locale', 'ru');
                
                picker.addEventListener('emoji-click', (event) => {
                    const emoji = event.detail.unicode;
                    console.log('✅ Выбран эмодзи:', emoji);
                    
                    // 🔥 ПОЛУЧАЕМ ЭЛЕМЕНТЫ КАЖДЫЙ РАЗ ЗАНОВО
                    const emojiSpan = document.getElementById('selectedEmoji');
                    const emojiInputEl = document.getElementById('emojiInput');
                    
                    if (emojiSpan) {
                        emojiSpan.textContent = emoji;
                        console.log('✅ Обновлён эмодзи на кнопке на:', emoji);
                    } else {
                        console.error('❌ Элемент selectedEmoji не найден!');
                    }
                    
                    if (emojiInputEl) {
                        emojiInputEl.value = emoji;
                        console.log('✅ Обновлён input эмодзи на:', emoji);
                    } else {
                        console.error('❌ Элемент emojiInput не найден!');
                    }
                    
                    emojiContainer.style.display = 'none';
                });
                
                emojiContainer.appendChild(picker);
                
                // Удаляем старые обработчики
                const newEmojiBtn = emojiBtn.cloneNode(true);
                emojiBtn.parentNode.replaceChild(newEmojiBtn, emojiBtn);
                
                newEmojiBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    const isVisible = emojiContainer.style.display === 'block';
                    emojiContainer.style.display = isVisible ? 'none' : 'block';
                });
                
                document.addEventListener('click', function(e) {
                    if (!e.target.closest('.emoji-selector-container')) {
                        emojiContainer.style.display = 'none';
                    }
                });
                
                emojiPickerInitialized = true;
                console.log('✅ Эмодзи пикер инициализирован');
                return true;
            } catch (error) {
                console.error('❌ Ошибка эмодзи:', error);
                return false;
            }
        } else {
            console.warn('⚠️ emoji-picker не загружен');
            emojiBtn.addEventListener('click', function() {
                alert('Выбор эмодзи временно недоступен');
            });
            return false;
        }
    }
    
    // ========== 6. ОТПРАВКА ФОРМЫ ==========
    function initCategoryForm() {
        if (!form) {
            console.log('⚠️ Форма не найдена');
            return;
        }
        
        console.log('✅ Форма найдена');
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const categoryName = nameInput?.value.trim() || '';
            if (!categoryName) {
                alert('Пожалуйста, введите название категории');
                return;
            }
            
            // Синхронизируем эмодзи перед отправкой
            const currentEmojiSpan = document.getElementById('selectedEmoji');
            const currentEmojiInput = document.getElementById('emojiInput');
            if (currentEmojiSpan && currentEmojiInput) {
                currentEmojiInput.value = currentEmojiSpan.textContent;
                console.log('😊 Отправляемый эмодзи:', currentEmojiInput.value);
            }
            
            const currentColorInput = document.getElementById('colorInput');
            const selectedColor = currentColorInput?.value || '';
            console.log('🎨 Отправляемый цвет:', selectedColor);
            
            if (!selectedColor) {
                alert('Пожалуйста, выберите цвет категории');
                return;
            }
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Создание...';
            }
            
            const formData = new FormData(form);
            formData.set('emoji', currentEmojiInput?.value || '🎨');
            formData.set('color', selectedColor);
            
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value || getCookie('csrftoken');
            
            fetch('/categories/create/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('✅ Категория создана:', data.category);
                    alert(`Категория "${data.category.name}" успешно создана!`);
                    closeModal();
                    location.reload();
                } else {
                    let errorMsg = 'Ошибка:\n';
                    for (let field in data.errors) {
                        errorMsg += `- ${data.errors[field].join(', ')}\n`;
                    }
                    alert(errorMsg);
                }
            })
            .catch(error => {
                console.error('❌ Ошибка:', error);
                alert('Произошла ошибка при создании категории');
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '+ создать';
                }
            });
        });
    }
    
    // ========== 7. УДАЛЕНИЕ КАТЕГОРИИ ==========
    function initDeleteButtons() {
        const deleteButtons = document.querySelectorAll('.btn-delete');
        console.log('🔍 Найдено кнопок удаления:', deleteButtons.length);
        
        deleteButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const categoryId = this.dataset.categoryId;
                if (!categoryId) return;
                
                const categoryElement = this.closest('.activiti');
                let categoryName = '';
                if (categoryElement) {
                    const nameSpan = categoryElement.querySelector('.text span');
                    if (nameSpan) categoryName = nameSpan.innerText;
                }
                
                if (!confirm(`Удалить категорию "${categoryName}"?`)) return;
                
                fetch(`/categories/delete/${categoryId}/`, {
                    method: 'POST',
                    headers: { 'X-CSRFToken': getCookie('csrftoken') },
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        if (categoryElement) categoryElement.remove();
                        alert('✅ ' + (data.message || 'Категория удалена'));
                        location.reload();
                    } else {
                        alert('❌ ' + (data.message || 'Ошибка'));
                    }
                })
                .catch(error => {
                    console.error('Ошибка:', error);
                    alert('❌ Ошибка при удалении');
                });
            });
        });
    }
    
    // ========== 8. ЗАПУСК ==========
    initCategoryForm();
    initDeleteButtons();
    
    console.log('🚀 category.js загружен, ожидание открытия окна...');
});