document.addEventListener('DOMContentLoaded', function() {
    // 1. ВСЕ НЕОБХОДИМЫЕ ЭЛЕМЕНТЫ
    
    // Модальные окна
    const modal1 = document.getElementById('modal');
    const modal2 = document.getElementById('createCategoryModal');
    const modal3 = document.getElementById('startTimerModal');
    
    // Элементы для затемнения
    const overlay = document.getElementById('overlay');
    const contentContainer = document.querySelector('.content-container'); // Контейнер контента
    const openBtn = document.getElementById('openModalBtn');
    const closeBtn = document.querySelector('.close-btn')
    
    // Элементы первого окна
    const startBtn = document.querySelector('.button-mod1 .start');
    const createCategoryBtn = document.querySelector('.button-mod1 .create');
    const closeModal1 = document.querySelector('.close-mod1');
    
    // Элементы второго окна
    const closeModal2 = document.querySelector('.close-mod2');
    const categoryForm = document.getElementById('createCategoryForm');
    const categoryInput = document.getElementById('category-name'); // Поле названия
    
    // Элементы третьего окна
    const closeModal3 = document.querySelector('.close-mod3');
    const startCategoryName = document.getElementById('startCategoryName');
    const startCategoryEmoji = document.getElementById('startCategoryEmoji');
    const startCategoryColor = document.getElementById('startCategoryColor');
    const startTimeDisplay = document.getElementById('startTimeDisplay');
    const startTaskDescription = document.getElementById('startTaskDescription');
    const btnStartCancel = document.querySelector('.btn-start-cancel');
    const btnStartBegin = document.querySelector('.btn-start-begin');
    
    // 2. ЭЛЕМЕНТЫ ВЫПАДАЮЩИХ СПИСКОВ
    
    const categorySelectWrapper = document.querySelector('.category-select-wrapper');
    const categorySelectBtn = document.querySelector('.category-select-btn');
    const categoryOptions = document.querySelectorAll('.category-option:not([data-value="add-new"])');
    const addNewCategoryOption = document.querySelector('.category-option[data-value="add-new"]');
    const categoryButtons = document.querySelectorAll('.categories-row .category:not(.category-select-btn)');
    
    // Выбор времени
    const timeSelect = document.querySelector('.time-select');
    const timeSelected = document.querySelector('.selected-time');
    const timeOptions = document.querySelectorAll('.time-option');
    const hiddenInput = document.getElementById('selected-minutes');
    
    // 3. ЭЛЕМЕНТЫ ЭМОДЗИ ПИКЕРА
    const emojiPickerBtn = document.getElementById('emojiPickerBtn');
    const emojiPickerContainer = document.getElementById('emojiPickerContainer');
    const selectedEmoji = document.getElementById('selectedEmoji');
    const emojiInput = document.getElementById('emojiInput');
    
    // 4. ЭЛЕМЕНТЫ ВЫБОРА ЦВЕТА
    const colorBtn = document.getElementById('colorSelectorBtn');
    const colorDropdown = document.getElementById('colorDropdown');
    const colorOptions = document.querySelectorAll('.color-option');
    const colorPreview = document.getElementById('selectedColorPreview');
    const colorName = document.getElementById('selectedColorName');
    const colorInput = document.getElementById('colorInput');
    const submitBtn = document.getElementById('createCategorySubmit');
    const errorDiv = document.getElementById('categoryError');

    // 5. ФУНКЦИИ УПРАВЛЕНИЯ ЗАТЕМНЕНИЕМ
    
    function dimContentContainer() {
        if (contentContainer) {
            contentContainer.classList.add('dimmed');
        }
    }
    
    function undimContentContainer() {
        if (contentContainer) {
            contentContainer.classList.remove('dimmed');
        }
    }
    
    function showOverlay(opacity = 0.8) {
        if (overlay) {
            overlay.style.opacity = opacity;
            overlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden';
    }
    
    function hideOverlay() {
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.opacity = '';
        }
        document.body.style.overflow = '';
    }
    

    function resetAllDimming() {
        undimContentContainer();
        hideOverlay();
    }
    

    function isAnyModalOpen() {
        return (modal1 && modal1.style.display === 'block') ||
               (modal2 && modal2.style.display === 'block') ||
               (modal3 && modal3.style.display === 'block');
    }

    // 6. ФУНКЦИИ УПРАВЛЕНИЯ ОКНАМИ
    
    window.openCategoryModal = function() {
        if (modal1) modal1.style.display = 'block';
        if (modal2) modal2.style.display = 'none';
        if (modal3) modal3.style.display = 'none';
    };
    
    window.openCreateCategoryModal = function() {
        if (modal2) modal2.style.display = 'block';
        if (modal1) modal1.style.display = 'none';
        if (modal3) modal3.style.display = 'none';
    };
    
    window.openStartTimerModal = function() {
        if (modal3) modal3.style.display = 'block';
        if (modal1) modal1.style.display = 'none';
        if (modal2) modal2.style.display = 'none';
    };

 // 7. ФУНКЦИЯ ОТКРЫТИЯ ТРЕТЬЕГО ОКНА С ДАННЫМИ
    function openStartTimerWithData() {
        // Получаем выбранную категорию
        let selectedCategory = {
            name: 'Не выбрано',
            emoji: '📁',
            color: '#C7CEEA',
            id: null
        };
        
        // Проверяем стандартные категории
        const selectedStandardBtn = document.querySelector('.categories-row .category.selected');
        if (selectedStandardBtn) {
            const spanElement = selectedStandardBtn.querySelector('span');
            selectedCategory.name = spanElement ? spanElement.textContent : 'категория';
            selectedCategory.emoji = '📌';
            selectedCategory.id = selectedStandardBtn.getAttribute('data-value');
            
            const colorMap = {
                'study': '#C7CEEA',
                'read': '#B5EAD7',
                'work': '#FFDAC1',
                'hobby': '#FFB6C1'
            };
            selectedCategory.color = colorMap[selectedCategory.id] || '#C7CEEA';
        }
        
        // Проверяем выбранную категорию из списка
        if (categorySelectBtn && categorySelectBtn.classList.contains('selected')) {
            const spanElement = categorySelectBtn.querySelector('span');
            if (spanElement && spanElement.textContent !== 'выбрать') {
                selectedCategory.name = spanElement.textContent;
                selectedCategory.id = categorySelectBtn.getAttribute('data-value');
                

                const categoryOption = document.querySelector(`.category-option[data-value="${selectedCategory.id}"]`);
                if (categoryOption) {
                    const optionText = categoryOption.innerHTML;
                    // Ищет эмодзи в начале строки
                    const emojiMatch = optionText.match(/^([\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/u);
                    if (emojiMatch) {
                        selectedCategory.emoji = emojiMatch[1];
                    }
                }
            }
        }
        
        // Выбранное время
        const minutes = hiddenInput ? parseInt(hiddenInput.value) : 25;
        
        // Описание задачи
        const taskInput = document.querySelector('.mod1-tasks');
        const taskDescription = taskInput ? taskInput.value.trim() : '';
        
        if (startCategoryName) startCategoryName.textContent = window.truncateText ? window.truncateText(selectedCategory.name, 30) : selectedCategory.name;
        if (startCategoryEmoji) startCategoryEmoji.textContent = selectedCategory.emoji;
        if (startTaskDescription) {
            startTaskDescription.textContent = taskDescription || 'без описания';
        }

        if (startTimeDisplay) {
            startTimeDisplay.textContent = formatTime(minutes * 60);
        }
        
        if (timerCompleteMessage) {
            timerCompleteMessage.style.display = 'none';
        }
        
        if (btnPause) {
            const spanElement = btnPause.querySelector('span');
            if (spanElement) spanElement.textContent = 'взять паузу';
            const imgElement = btnPause.querySelector('img');
            if (imgElement) imgElement.src = "{% static 'icons/pauza.svg' %}";
        }
        isPaused = false;
        
        undimContentContainer();
        showOverlay(0.8);
        window.openStartTimerModal();
        
        // ЗАПУСК ТАЙМЕРА
        const timerData = {
            categoryId: selectedCategory.id,
            categoryName: selectedCategory.name,
            categoryEmoji: selectedCategory.emoji,
            taskDescription: taskDescription
        };
        
        startTimer(minutes * 60, timerData);
    }
   

    // 8. ИНИЦИАЛИЗАЦИЯ ЭМОДЗИ ПИКЕРА
    
    function initEmojiPicker() {
        if (!emojiPickerBtn || !emojiPickerContainer || !selectedEmoji || !emojiInput) {
            return;
        }
        
        // Загружен ли компонент emoji-picker
        if (!customElements.get('emoji-picker')) {
            console.error(' emoji-picker-element не загружен!');
            return;
        }
        
        try {
            const picker = document.createElement('emoji-picker');
            picker.classList.add('light');
            picker.setAttribute('locale', 'ru');
            
            picker.addEventListener('emoji-click', event => {
                const emoji = event.detail.unicode;
                selectedEmoji.textContent = emoji;
                emojiInput.value = emoji;
                emojiPickerContainer.style.display = 'none';
            });
            
            emojiPickerContainer.innerHTML = '';
            emojiPickerContainer.appendChild(picker);
            
            emojiPickerBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const isVisible = emojiPickerContainer.style.display === 'block';
                emojiPickerContainer.style.display = isVisible ? 'none' : 'block';
            });
            
            document.addEventListener('click', function(e) {
                if (!e.target.closest('.emoji-selector-container')) {
                    emojiPickerContainer.style.display = 'none';
                }
            });
            
        } catch (error) {
            console.error(' Ошибка:', error);
        }
    }

    // 9. УПРАВЛЕНИЕ ВЫПАДАЮЩИМ СПИСКОМ ЦВЕТОВ
    
    function initColorSelector() {
        if (!colorBtn || !colorDropdown || !colorOptions.length) {
            return;
        }
        
        // Открытие/закрытие списка
        colorBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            colorDropdown.style.display = colorDropdown.style.display === 'block' ? 'none' : 'block';
        });
        
        colorOptions.forEach(option => {
            option.addEventListener('click', function() {
                const selectedColor = this.dataset.color;
                const selectedName = this.dataset.name;
                
                if (colorPreview) colorPreview.style.backgroundColor = selectedColor;
                if (colorName) colorName.textContent = selectedName;
                
                if (colorInput) {
                    colorInput.value = selectedColor;
                }
                
                colorOptions.forEach(opt => opt.classList.remove('selected'));
                this.classList.add('selected');
                
                colorDropdown.style.display = 'none';
            });
        });
        
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.color-selector-container')) {
                colorDropdown.style.display = 'none';
            }
        });
        
        if (colorInput && !colorInput.value) {
            colorInput.value = '#C7CEEA';
        }
        if (colorPreview && !colorPreview.style.backgroundColor) {
            colorPreview.style.backgroundColor = '#C7CEEA';
        }
    }

    // 10. ОТПРАВКА ФОРМЫ СОЗДАНИЯ КАТЕГОРИИ
    
    function initCategoryForm() {
            
            const form = document.getElementById('createCategoryForm');
            const submitBtn = document.getElementById('createCategorySubmit');
            const errorDiv = document.getElementById('categoryError');
            const nameInput = document.getElementById('category-name');
            const emojiInput = document.getElementById('emojiInput');
            const selectedEmojiSpan = document.getElementById('selectedEmoji');
            const colorInput = document.getElementById('colorInput');
            const colorPreview = document.getElementById('selectedColorPreview');
            const colorName = document.getElementById('selectedColorName');
            
            if (!form) {
                console.error(' Форма createCategoryForm не найдена!');
                return;
            }
            
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // ПРОВЕРКА ЛИМИТА
            const isPro = document.body.dataset.isPro === 'true';
            if (!isPro) {
                try {
                    const limitRes = await fetch('/api/categories/');
                    const cats = await limitRes.json();
                    if (Array.isArray(cats) && cats.length >= 5) {
                        (window.notify ? window.notify.error('Лимит 5 категорий на бесплатном тарифе. Удалите существующую или оформите PRO.') : alert('Лимит 5 категорий'));
                        return;
                    }
                } catch(e) {}
            }
                
                // Проверка названия
                const categoryName = nameInput ? nameInput.value.trim() : '';
                if (!categoryName) {
                    (window.validate ? window.validate.markError('category-name', 'Пожалуйста, введите название категории') : (window.notify ? window.notify.error('Пожалуйста, введите название категории') : alert('Пожалуйста, введите название категории')));
                    return;
                }
                
                // Проверка цвета
                const selectedColor = colorInput ? colorInput.value : '';
                if (!selectedColor) {
                    (window.notify ? window.notify.error('Пожалуйста, выберите цвет категории') : alert('Пожалуйста, выберите цвет категории'));
                    return;
                }
                
                // Синхронизация эмодзи
                if (selectedEmojiSpan && emojiInput) {
                    emojiInput.value = selectedEmojiSpan.textContent;
                }
                
                // Блокируем кнопку
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Создание...';
                }
                if (errorDiv) errorDiv.style.display = 'none';
                
                const formData = new FormData(form);
                
                if (emojiInput && emojiInput.value) {
                    formData.set('emoji', emojiInput.value);
                }
                if (colorInput && colorInput.value) {
                    formData.set('color', colorInput.value);
                }
                
                const csrftoken = getCookie('csrftoken');
                if (!csrftoken) {
                    (window.notify ? window.notify.error('Ошибка безопасности: CSRF токен не найден') : alert('Ошибка безопасности: CSRF токен не найден'));
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = '+ создать';
                    }
                    return;
                }

                const finalEmoji = (selectedEmojiSpan && selectedEmojiSpan.textContent.trim())
                    ? selectedEmojiSpan.textContent.trim()
                    : '📁';
                const finalColor = (colorInput && colorInput.value)
                    ? colorInput.value
                    : '#C7CEEA';

                fetch('/api/categories/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        name: categoryName,
                        emoji: finalEmoji,
                        color: finalColor,
                        description: ''
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.id) {

                        (window.notify ? window.notify.success(`Категория "${data.name}" создана!`) : alert(`Категория "${data.name}" успешно создана!`));
                        
                        // Очищает форму
                        form.reset();
                        if (selectedEmojiSpan) selectedEmojiSpan.textContent = '🎨';
                        if (emojiInput) emojiInput.value = '🎨';
                        if (colorPreview) colorPreview.style.backgroundColor = '#C7CEEA';
                        if (colorName) colorName.textContent = 'Пастельно-лавандовый';
                        if (colorInput) colorInput.value = '#C7CEEA';
                        
                        if (modal2) modal2.style.display = 'none';
                        
                        if (!isAnyModalOpen()) {
                            undimContentContainer();
                        }
                        
                        if (typeof loadUserCategories === 'function') {
                            loadUserCategories();
                        }
                    } else {
                        let errorMessage = 'Ошибка при создании категории:\n';
                        for (let field in data.errors) {
                            errorMessage += `- ${field}: ${data.errors[field].join(', ')}\n`;
                        }
                        
                        if (errorDiv) {
                            errorDiv.textContent = errorMessage;
                            errorDiv.style.display = 'block';
                        } else {
                            (window.notify ? window.notify.error(errorMessage) : alert(errorMessage));
                        }
                    }
                })
                .catch(error => {
                    console.error(' Ошибка:', error);
                    (window.notify ? window.notify.error('Произошла ошибка при отправке запроса') : alert('Произошла ошибка при отправке запроса'));
                })
                .finally(() => {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = '+ создать';
                    }
                });
            });
        }

    // 11. ЗАГРУЗКА КАТЕГОРИЙ ПОЛЬЗОВАТЕЛЯ
    
    function loadUserCategories() {
        
        fetch('/api/categories/', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data)) {
                updateCategoriesDropdown(data);
            }
        })
        .catch(error => console.error(' Ошибка загрузки категорий:', error));
    }

    function updateCategoriesDropdown(categories) {
        const dropdown = document.querySelector('.category-dropdown');
        if (!dropdown) return;
        
        const addNewOption = dropdown.querySelector('[data-value="add-new"]');
        
        dropdown.innerHTML = '';
        
        // Добавляю категории пользователя
categories.forEach(cat => {
            const option = document.createElement('div');
            option.className = 'category-option';
            option.setAttribute('data-value', cat.id);
            option.setAttribute('data-id', cat.id);
            const displayName = window.truncateText ? window.truncateText(cat.name, 30) : cat.name;
            option.innerHTML = `${cat.emoji || '📁'} ${displayName}`;
            
            // Обработчик выбора категории
            option.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const selectedValue = this.getAttribute('data-value');
                const selectedText = this.textContent.trim();
                
                document.querySelectorAll('.categories-row .category:not(.category-select-btn)').forEach(btn => {
                    btn.classList.remove('selected');
                });
                
                // Обнова кнопки "выбрать"
                const categorySelectBtn = document.querySelector('.category-select-btn');
                const spanElement = categorySelectBtn.querySelector('span');
                if (spanElement) {
                    spanElement.textContent = selectedText;
                }
                
                categorySelectBtn.setAttribute('data-value', selectedValue);
                categorySelectBtn.classList.add('selected');
                
                // Закрытие выпадающего списка
                const wrapper = document.querySelector('.category-select-wrapper');
                if (wrapper) {
                    wrapper.classList.remove('active');
                }
                
            });
            
            dropdown.appendChild(option);
        });
        
        // Опция создания новой категории
        if (addNewOption) {
            dropdown.appendChild(addNewOption);
        } else {
            const newOption = document.createElement('div');
            newOption.className = 'category-option';
            newOption.setAttribute('data-value', 'add-new');
            
            newOption.addEventListener('click', function() {
                if (typeof window.openCreateCategoryModal === 'function') {
                    window.openCreateCategoryModal();
                }
            });
            
            dropdown.appendChild(newOption);
        }
        
    }

    // 12. ОБРАБОТЧИКИ ДЛЯ ОСНОВНОГО ОКНА
    
    if (openBtn && modal1 && closeBtn) {
        openBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dimContentContainer();
            modal1.style.display = 'block';
            
            loadUserCategories();
        });
        
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            modal1.style.display = 'none';
            if (!isAnyModalOpen()) {
                undimContentContainer();
            }
        });
    }
    
    // 13. ОБРАБОТЧИКИ ДЛЯ КНОПОК
    
    // Кнопка старт
    if (startBtn) {
        startBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Выбрана ли категория
            const hasSelectedStandard = document.querySelector('.categories-row .category.selected');
            const hasSelectedCustom = categorySelectBtn && categorySelectBtn.classList.contains('selected');
            
            if (!hasSelectedStandard && !hasSelectedCustom) {
                (window.notify ? window.notify.error('Пожалуйста, выберите категорию') : alert('Пожалуйста, выберите категорию'));
                return;
            }
            
            modal1.style.display = 'none';
        
            undimContentContainer();
            openStartTimerWithData();
        });
    }
    

    // ОТКРЫТИЕ ВТОРОГО ОКНА
    if (createCategoryBtn) {
        createCategoryBtn.replaceWith(createCategoryBtn.cloneNode(true));
        
        const newCreateCategoryBtn = document.querySelector('.button-mod1 .create');
        
        if (newCreateCategoryBtn) {
            newCreateCategoryBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                dimContentContainer();
                
                // Закрываем окна
                if (modal1) modal1.style.display = 'none';
                if (modal2) modal2.style.display = 'block';
            });
        }
    }
    
    // Крестик первого окна
    if (closeModal1) {
        closeModal1.addEventListener('click', function() {
            modal1.style.display = 'none';
            if (!isAnyModalOpen()) {
                undimContentContainer();
            }
        });
    }
    
    // Крестик второго окна
    if (closeModal2) {
        closeModal2.addEventListener('click', function() {
            modal2.style.display = 'none';
            if (!isAnyModalOpen()) {
                undimContentContainer();
            }
        });
    }
    
    // Крестик третьего окна
    if (closeModal3) {
        closeModal3.addEventListener('click', function() {
            modal3.style.display = 'none';
            if (!isAnyModalOpen()) {
                hideOverlay();
            }
        });
    }
    
    // Кнопка отмена в третьем окне
    if (btnStartCancel) {
        btnStartCancel.addEventListener('click', function() {
            modal3.style.display = 'none';
            if (!isAnyModalOpen()) {
                hideOverlay();
            }
        });
    }
    
    // Кнопка начать в третьем окне
    if (btnStartBegin) {
        btnStartBegin.addEventListener('click', function() {
            modal3.style.display = 'none';
            
            if (!isAnyModalOpen()) {
                hideOverlay();
            }
            
            (window.notify ? window.notify.info('Задача завершена!') : alert('Задача завершена!'));
        });
    }
    
    // 14. ОБРАБОТЧИК ВЫБОРА "СОЗДАТЬ КАТЕГОРИЮ"
    
    if (addNewCategoryOption) {
        addNewCategoryOption.addEventListener('click', function() {
            window.openCreateCategoryModal();
        });
    }
    
    // 15. ОБРАБОТКА ВЫБОРА КАТЕГОРИЙ ИЗ ВЫПАДАЮЩЕГО СПИСКА
    
    if (categorySelectBtn && categorySelectWrapper) {
        categorySelectBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            document.querySelectorAll('.category-select-wrapper.active').forEach(el => {
                if (el !== categorySelectWrapper) {
                    el.classList.remove('active');
                }
            });
            
            categorySelectWrapper.classList.toggle('active');
        });
    }
    
    if (categoryOptions.length > 0) {
        categoryOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const selectedValue = this.getAttribute('data-value');
                const selectedText = this.textContent.trim();
                
                categoryButtons.forEach(btn => btn.classList.remove('selected'));
                
                const spanElement = categorySelectBtn.querySelector('span');
                if (spanElement) {
                    spanElement.textContent = selectedText;
                }
                
                categorySelectBtn.setAttribute('data-value', selectedValue);
                categorySelectBtn.classList.add('selected');
                
                if (categorySelectWrapper) {
                    categorySelectWrapper.classList.remove('active');
                }
            });
        });
    }
    
    // 16. ОБРАБОТКА СТАНДАРТНЫХ КАТЕГОРИЙ
    
    if (categoryButtons.length > 0) {
        categoryButtons.forEach(button => {
            button.addEventListener('click', function() {
                categoryButtons.forEach(btn => btn.classList.remove('selected'));
                
                if (categorySelectBtn) {
                    categorySelectBtn.classList.remove('selected');
                    const spanElement = categorySelectBtn.querySelector('span');
                    if (spanElement) {
                        spanElement.textContent = 'выбрать';
                    }
                    categorySelectBtn.setAttribute('data-value', 'other');
                }
                
                this.classList.add('selected');
                
                if (categorySelectWrapper) {
                    categorySelectWrapper.classList.remove('active');
                }
            });
        });
    }
    
    // 17. ОБРАБОТКА ВЫБОРА ВРЕМЕНИ
    
    if (timeSelect) {
        timeSelect.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
        });
        
        timeOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.stopPropagation();
                
                const selectedText = this.textContent;
                const selectedMinutes = this.getAttribute('data-minutes');
                
                if (timeSelected) {
                    timeSelected.textContent = selectedText;
                }
                
                if (hiddenInput) {
                    hiddenInput.value = selectedMinutes;
                }
                
                timeSelect.classList.remove('active');
            });
        });
    }
    
    // 18. ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ
    window.addEventListener('click', function(event) {
        if (event.target === overlay) {
            if (modal3 && modal3.style.display === 'block') {
                modal3.style.display = 'none';
                hideOverlay();
            }
        }
        
        if (modal1 && modal1.style.display === 'block' && !modal1.contains(event.target) && event.target !== openBtn) {
            modal1.style.display = 'none';
            if (!isAnyModalOpen()) {
                undimContentContainer();
            }
        }
        
        if (modal2 && modal2.style.display === 'block' && !modal2.contains(event.target)) {
            modal2.style.display = 'none';
            if (!isAnyModalOpen()) {
                undimContentContainer();
            }
        }
    });
    
    // Закрытие по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (modal1 && modal1.style.display === 'block') {
                modal1.style.display = 'none';
                if (!isAnyModalOpen()) undimContentContainer();
            }
            else if (modal2 && modal2.style.display === 'block') {
                modal2.style.display = 'none';
                if (!isAnyModalOpen()) undimContentContainer();
            }
            else if (modal3 && modal3.style.display === 'block') {
                modal3.style.display = 'none';
                if (!isAnyModalOpen()) hideOverlay();
            }
            if (categorySelectWrapper) categorySelectWrapper.classList.remove('active');
            if (timeSelect) timeSelect.classList.remove('active');
            if (colorDropdown) colorDropdown.style.display = 'none';
            if (emojiPickerContainer) emojiPickerContainer.style.display = 'none';
        }
    });



    // ПЕРЕМЕННЫЕ ТАЙМЕРА
    let timerInterval = null;
    let timerSeconds = 0;
    let timerTotalSeconds = 0;
    let isPaused = false;
    let currentTimerData = {
        categoryId: null,
        categoryName: '',
        categoryEmoji: '',
        taskDescription: '',
        startTime: null,
        completedEarly: false
    };

    // Элементы таймера
    const timerDisplay = document.getElementById('startTimeDisplay');
    const timerCompleteMessage = document.getElementById('timerCompleteMessage');
    const btnDistracted = document.getElementById('btnDistracted');
    const btnPause = document.getElementById('btnPause');
    const btnComplete = document.getElementById('btnComplete');

    // ФУНКЦИИ ТАЙМЕРА

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Запуск таймера
    function startTimer(seconds, categoryData) {
        stopTimer();

        timerTotalSeconds = seconds;
        timerSeconds = seconds;
        currentTimerData = {
            ...categoryData,
            startTime: new Date(),
            completedEarly: false
        };
        
        if (timerDisplay) {
            timerDisplay.textContent = formatTime(timerSeconds);
        }
        
        if (timerCompleteMessage) {
            timerCompleteMessage.style.display = 'none';
        }
        
        isPaused = false;
        timerInterval = setInterval(() => {
            if (!isPaused && timerSeconds > 0) {
                timerSeconds--;
                if (timerDisplay) {
                    timerDisplay.textContent = formatTime(timerSeconds);
                }
            
                if (timerSeconds === 0) {
                    handleTimerComplete('natural');
                }
            }
        }, 1000);
    }

    // Остановка таймера
    function stopTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }

    // Получение CSRF токена из куки
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


    function saveTimerResult(seconds, reason) {


            const elapsedSeconds = timerTotalSeconds - seconds;
        if (window._pendingTaskId) {
            const csrftoken = getCookie('csrftoken');
            fetch(`/api/tasks/${window._pendingTaskId}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify({
                    completed: true,
                    duration_seconds: elapsedSeconds
                })
            })
            .then(r => r.json())
            .then(() => {
                window._pendingTaskId = null;
                if (timerCompleteMessage) {
                    timerCompleteMessage.innerHTML = '<span>Задача выполнена!</span>';
                    timerCompleteMessage.style.display = 'block';
                }
            });
            return; // не идём дальше — новую задачу не создаём
        }
        
        const data = {
            category_id: currentTimerData.categoryId,
            task_description: currentTimerData.taskDescription,
            duration_seconds: elapsedSeconds,
            completed: reason === 'natural' || reason === 'complete',
            completed_early: reason === 'complete',
            distracted: reason === 'distracted',
            timestamp: new Date().toISOString()
        };
        
        
        const csrftoken = getCookie('csrftoken');
        
        fetch('/api/save-timer/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                
                if (timerCompleteMessage) {
                    let messageText = '';
                    if (reason === 'natural') {
                        messageText = ' Время вышло! Отличная работа!';
                    } else if (reason === 'complete') {
                        messageText = ' Задача выполнена досрочно!';
                    } else if (reason === 'distracted') {
                        messageText = '⏸ Таймер остановлен';
                    }
                    
                    timerCompleteMessage.innerHTML = `<span>${messageText}</span>`;
                    timerCompleteMessage.style.display = 'block';
                }
            } else {
                console.error(' Ошибка сохранения:', result.error);
            }
        })
        .catch(error => {
            console.error('Ошибка сети:', error);
        });
    }

    // Обработка завершения таймера
    function handleTimerComplete(reason) {
        stopTimer();
        
        const elapsedSeconds = timerTotalSeconds - timerSeconds;

        saveTimerResult(timerSeconds, reason);
        
        if (reason !== 'pause') {
            if (timerCompleteMessage) {
                timerCompleteMessage.style.display = 'block';
            }
        }
    }

    // Кнопка "я отвлекся"
    if (btnDistracted) {
        btnDistracted.addEventListener('click', function() {
            handleTimerComplete('distracted');
            
            setTimeout(() => {
                if (modal3) {
                    modal3.style.display = 'none';
                    hideOverlay();
                }
            }, 2000);
        });
    }

    if (btnPause) {
        btnPause.addEventListener('click', function() {
            isPaused = !isPaused;
            
            const spanElement = btnPause.querySelector('span');
            if (spanElement) {
                spanElement.textContent = isPaused ? 'продолжить' : 'взять паузу';
            }
            
            // Меняем иконку
            const imgElement = btnPause.querySelector('img');
            if (imgElement) {
                imgElement.src = isPaused 
                    ? "{% static 'icons/play.svg' %}" 
                    : "{% static 'icons/pauza.svg' %}";
            }
        });
    }

    // Кнопка "готово!"
    if (btnComplete) {
        btnComplete.addEventListener('click', function() {
            handleTimerComplete('complete');
            setTimeout(() => {
                if (modal3) {
                    modal3.style.display = 'none';
                    hideOverlay();
                }
            }, 2000);
        });
    }

    // Закрытие по крестику
    if (closeModal3) {
        closeModal3.addEventListener('click', function() {
            // Если таймер еще идет, считай как "отвлекся"
            if (timerInterval && timerSeconds > 0 && timerSeconds < timerTotalSeconds) {
                handleTimerComplete('distracted');
            }
            
            modal3.style.display = 'none';
            stopTimer();
            
            if (!isAnyModalOpen()) {
                hideOverlay();
            }
        });
    }
 
    // 19. ЗАПУСК ВСЕХ ИНИЦИАЛИЗАЦИЙ
    
    initEmojiPicker();
    initColorSelector();
    initCategoryForm();
});




// Функция форматирования часов в читаемый вид
function formatHours(hours) {
    const h = Math.floor(hours);
    const min = Math.round((hours - h) * 60);
    if (h === 0 && min === 0) return '0 ч';
    if (h === 0) return `${min} мин`;
    if (min === 0) return `${h} ч`;
    return `${h} ч ${min} мин`;
}

// Показать тултип
function showTooltip(element) {
    const hours = parseFloat(element.dataset.hours);
    const dayName = element.dataset.day;
    
    if (hours === 0) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = `${dayName} — ${formatHours(hours)}`;
    
    element.style.position = 'relative';
    element.appendChild(tooltip);
}

// Скрыть тултип
function hideTooltip(element) {
    const tooltip = element.querySelector('.tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}





// ВОЗОБНОВЛЕНИЕ СЕАНСА
function initResumeSession() {
    const resumeButtons = document.querySelectorAll('.btn-again');
    
    resumeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const categoryId = this.dataset.categoryId;
            const description = this.dataset.description || '';
            
            // Загрузка актуальных категорий
            if (typeof loadUserCategories === 'function') {
                loadUserCategories();
            } else if (typeof window.loadUserCategories === 'function') {
                window.loadUserCategories();
            }
            
            // Первое модальное окно
            const modal1 = document.getElementById('modal');
            const contentContainer = document.querySelector('.content-container');
            if (modal1) {
                modal1.style.display = 'block';
                if (contentContainer) contentContainer.classList.add('dimmed');
            }
            
            // Даём время на обновление списка категорий
            setTimeout(() => {
                // Снимаем выделение со всех стандартных кнопок
                document.querySelectorAll('.categories-row .category:not(.category-select-btn)').forEach(btn => {
                    btn.classList.remove('selected');
                });
                
                const selectBtn = document.querySelector('.category-select-btn');
                if (selectBtn) {
                    const span = selectBtn.querySelector('span');
                    if (span) span.textContent = 'выбрать';
                    selectBtn.classList.remove('selected');
                }
                
                // Ищет и выбирает нужную категорию в выпадающем списке
                const categoryOption = document.querySelector(
                    `.category-option[data-value="${categoryId}"], .category-option[data-id="${categoryId}"]`
                );
                if (categoryOption) {
                    categoryOption.click();
                }
                
                // Заполняем описание
                const taskInput = document.querySelector('.mod1-tasks');
                if (taskInput) taskInput.value = description;
                
            }, 300);
        });
    });
}

// После загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    initResumeSession();
});


document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const searchDropdown = document.getElementById('searchDropdown');
    const searchResults = document.getElementById('searchResults');
    
    let searchTimeout;
    let allCategories = []; // Хранилище всех категорий
    
    function loadCategories() {
        const csrftoken = getCookie('csrftoken');
        
        fetch('/api/categories/', {
            headers: {
                'X-CSRFToken': csrftoken,
                'Content-Type': 'application/json',
            }
        })
        .then(response => response.json())
        .then(categories => {
            allCategories = categories;
        })
        .catch(error => {
            console.error(' Ошибка загрузки категорий:', error);
        });
    }
    
    // Функция получения CSRF токена
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
    
    // Поиск категорий по запросу
    function searchCategories(query) {
        if (!query || query.trim() === '') {
            searchDropdown.style.display = 'none';
            return [];
        }
        
        const lowerQuery = query.toLowerCase().trim();
        const results = allCategories.filter(category => {
            return category.name.toLowerCase().includes(lowerQuery);
        });
        
        // Возвращает максимум 4 результата
        return results.slice(0, 4);
    }
    
    // Отображение результатов поиска
    function displayResults(results, query) {
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-no-results">
                    <span>😕 Ничего не найдено для "${escapeHtml(query)}"</span>
                </div>
            `;
            searchDropdown.style.display = 'block';
            return;
        }
        
        let html = '';
        results.forEach(category => {
            // Подсвечиваем совпадающую часть
            const highlightedName = highlightText(category.name, query);
            
            html += `
                <div class="search-result-item" data-category-id="${category.id}" data-category-url="/categories/${category.id}/">
                    <div class="result-icon" style="background-color: ${category.color}">
                        ${category.emoji || '📁'}
                    </div>
                    <div class="result-info">
                        <div class="result-name">${highlightedName}</div>
                        <div class="result-stats">${category.total_time_formatted || '0ч'} • ${category.Tasks?.length || 0} задач</div>
                    </div>
                </div>
            `;
        });
        
        searchResults.innerHTML = html;
        searchDropdown.style.display = 'block';
        
        // Обработчики кликов на результаты
        document.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                const url = this.dataset.categoryUrl;
                if (url) {
                    window.location.href = url;
                }
            });
        });
    }
    
    // Подсветка текста
    function highlightText(text, query) {
        if (!query) return escapeHtml(text);
        
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);
        
        if (index === -1) return escapeHtml(text);
        
        const before = escapeHtml(text.substring(0, index));
        const match = escapeHtml(text.substring(index, index + query.length));
        const after = escapeHtml(text.substring(index + query.length));
        
        return `${before}<mark>${match}</mark>${after}`;
    }
    
    // Экранирование HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Открыть первую категорию из результатов
    function openFirstCategory() {
        const firstResult = document.querySelector('.search-result-item');
        if (firstResult) {
            const url = firstResult.dataset.categoryUrl;
            if (url) {
                window.location.href = url;
            }
        } else {
            // Если нет результатов, но есть текст в инпуте можно создать новую категорию
            const query = searchInput.value.trim();
            if (query) {
                const createNew = confirm(`Категория "${query}" не найдена. Создать новую?`);
                if (createNew) {
                    const openBtn = document.getElementById('openCategoryModalBtn');
                    if (openBtn) {
                        openBtn.click();
                        const nameInput = document.getElementById('category-name');
                        if (nameInput) {
                            nameInput.value = query;
                        }
                    }
                }
            }
        }
    }
    
    // Обработчик ввода текста
    function onSearchInput() {
        clearTimeout(searchTimeout);
        const query = searchInput.value;
        
        if (query.trim() === '') {
            searchDropdown.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            const results = searchCategories(query);
            displayResults(results, query);
        }, 300); // Задержка 300ms для оптимизации
    }
    
    // Обработчик клавиши Enter
    function onSearchKeyPress(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            openFirstCategory();
        }
    }
    
    // Закрыть выпадающий список при клике вне
    function closeSearchDropdown(e) {
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer && !searchContainer.contains(e.target)) {
            searchDropdown.style.display = 'none';
        }
    }
    
    // Инициализация
    function initSearch() {
        loadCategories();
        
        if (searchInput) {
            searchInput.addEventListener('input', onSearchInput);
            searchInput.addEventListener('keypress', onSearchKeyPress);
        }
        
        if (searchBtn) {
            searchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                openFirstCategory();
            });
        }
        
        document.addEventListener('click', closeSearchDropdown);
    }
    
    initSearch();
});


 //ОБРАБОТКА ПЕРЕХОДА С ДЕТАЛЬНОЙ СТРАНИЦЫ КАТЕГОРИИ
document.addEventListener('DOMContentLoaded', function() {
    const stored = sessionStorage.getItem('resumeTask');
    if (!stored) return;

    let task;
    try {
        task = JSON.parse(stored);
    } catch(e) {
        sessionStorage.removeItem('resumeTask');
        return;
    }
    sessionStorage.removeItem('resumeTask');

    setTimeout(() => {
        // Загружаем категории
        const dropdown = document.querySelector('.category-dropdown');
        if (!dropdown || !dropdown.children.length) {
            // Если список пуст загружаем принудительно
            fetch('/api/categories/', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                .then(r => r.json())
                .then(cats => {
                    if (typeof updateCategoriesDropdown === 'function') {
                        updateCategoriesDropdown(cats);
                    }
                    openModalWithTask(task);
                });
        } else {
            openModalWithTask(task);
        }
    }, 400);
});

function openModalWithTask(task) {
    // Открываем первое модальное окно
    const modal1 = document.getElementById('modal');
    const contentContainer = document.querySelector('.content-container');
    if (modal1) {
        modal1.style.display = 'block';
        if (contentContainer) contentContainer.classList.add('dimmed');
    }

    if (task.mode === 'start' && task.taskId) {
        window._pendingTaskId = task.taskId;
    } else {
        window._pendingTaskId = null;
    }

    setTimeout(() => {
        document.querySelectorAll('.categories-row .category:not(.category-select-btn)').forEach(btn => {
            btn.classList.remove('selected');
        });

        // Сбрасываем кнопку "выбрать"
        const selectBtn = document.querySelector('.category-select-btn');
        if (selectBtn) {
            const span = selectBtn.querySelector('span');
            if (span) span.textContent = 'выбрать';
            selectBtn.classList.remove('selected');
        }

        // Выбираем нужную категорию
        const option = document.querySelector(
            `.category-option[data-value="${task.categoryId}"], .category-option[data-id="${task.categoryId}"]`
        );
        if (option) option.click();

        // Заполняем описание
        const taskInput = document.querySelector('.mod1-tasks');
        if (taskInput) taskInput.value = task.description || '';
    }, 200);
}