/**
 * ================================================
 * ОСНОВНОЙ СКРИПТ УПРАВЛЕНИЯ МОДАЛЬНЫМИ ОКНАМИ И КАТЕГОРИЯМИ
 * ================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    // ========== 1. ПОЛУЧАЕМ ВСЕ НЕОБХОДИМЫЕ ЭЛЕМЕНТЫ ==========
    
    // Модальные окна
    const modal1 = document.getElementById('modal'); // Окно выбора категории
    const modal2 = document.getElementById('createCategoryModal'); // Окно создания категории
    const modal3 = document.getElementById('startTimerModal'); // Окно старта таймера
    
    // Элементы для затемнения
    const overlay = document.getElementById('overlay'); // Затемнение всего экрана (для 3-го окна)
    const contentContainer = document.querySelector('.content-container'); // Контейнер контента (для 1-го и 2-го окон)
    const openBtn = document.getElementById('openModalBtn'); // Кнопка открытия главного окна
    const closeBtn = document.querySelector('.close-btn'); // Крестик главного окна
    
    // Элементы первого окна (категории)
    const startBtn = document.querySelector('.button-mod1 .start'); // Кнопка "старт"
    const createCategoryBtn = document.querySelector('.button-mod1 .create'); // Кнопка "+ новая категория"
    const closeModal1 = document.querySelector('.close-mod1'); // Крестик первого окна
    
    // Элементы второго окна (создание категории)
    const closeModal2 = document.querySelector('.close-mod2'); // Крестик второго окна
    const categoryForm = document.getElementById('createCategoryForm'); // Форма создания
    const categoryInput = document.getElementById('category-name'); // Поле названия
    
    // Элементы третьего окна (старт таймера)
    const closeModal3 = document.querySelector('.close-mod3'); // Крестик третьего окна
    const startCategoryName = document.getElementById('startCategoryName');
    const startCategoryEmoji = document.getElementById('startCategoryEmoji');
    const startCategoryColor = document.getElementById('startCategoryColor');
    const startTimeDisplay = document.getElementById('startTimeDisplay');
    const startTaskDescription = document.getElementById('startTaskDescription');
    const btnStartCancel = document.querySelector('.btn-start-cancel');
    const btnStartBegin = document.querySelector('.btn-start-begin');
    
    // ========== 2. ЭЛЕМЕНТЫ ВЫПАДАЮЩИХ СПИСКОВ ==========
    
    // Выпадающий список категорий (кнопка "выбрать")
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
    
    // ========== 3. ЭЛЕМЕНТЫ ЭМОДЗИ ПИКЕРА ==========
    const emojiPickerBtn = document.getElementById('emojiPickerBtn');
    const emojiPickerContainer = document.getElementById('emojiPickerContainer');
    const selectedEmoji = document.getElementById('selectedEmoji');
    const emojiInput = document.getElementById('emojiInput');
    
    // ========== 4. ЭЛЕМЕНТЫ ВЫБОРА ЦВЕТА ==========
    const colorBtn = document.getElementById('colorSelectorBtn');
    const colorDropdown = document.getElementById('colorDropdown');
    const colorOptions = document.querySelectorAll('.color-option');
    const colorPreview = document.getElementById('selectedColorPreview');
    const colorName = document.getElementById('selectedColorName');
    const colorInput = document.getElementById('colorInput');
    const submitBtn = document.getElementById('createCategorySubmit');
    const errorDiv = document.getElementById('categoryError');

    // ========== 5. ФУНКЦИИ УПРАВЛЕНИЯ ЗАТЕМНЕНИЕМ ==========
    
    /**
     * Затемнить content-container (для 1-го и 2-го окон)
     */
    function dimContentContainer() {
        if (contentContainer) {
            contentContainer.classList.add('dimmed');
        }
    }
    
    /**
     * Убрать затемнение с content-container
     */
    function undimContentContainer() {
        if (contentContainer) {
            contentContainer.classList.remove('dimmed');
        }
    }
    
    /**
     * Показать overlay на весь экран (для 3-го окна)
     * @param {number} opacity - степень затемнения (0.8 = 80%)
     */
    function showOverlay(opacity = 0.8) {
        if (overlay) {
            overlay.style.opacity = opacity;
            overlay.classList.add('active');
        }
        document.body.style.overflow = 'hidden'; // Блокируем прокрутку
    }
    
    /**
     * Скрыть overlay
     */
    function hideOverlay() {
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.opacity = ''; // Сбрасываем
        }
        document.body.style.overflow = ''; // Возвращаем прокрутку
    }
    
    /**
     * Сбросить все затемнения
     */
    function resetAllDimming() {
        undimContentContainer();
        hideOverlay();
    }
    
    /**
     * Проверить, открыто ли хотя бы одно модальное окно
     */
    function isAnyModalOpen() {
        return (modal1 && modal1.style.display === 'block') ||
               (modal2 && modal2.style.display === 'block') ||
               (modal3 && modal3.style.display === 'block');
    }

    // ========== 6. ФУНКЦИИ УПРАВЛЕНИЯ ОКНАМИ ==========
    
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

    // ========== 7. ФУНКЦИЯ ОТКРЫТИЯ ТРЕТЬЕГО ОКНА С ДАННЫМИ ==========
    
    function openStartTimerWithData() {
        // Получаем выбранную категорию
        let selectedCategory = {
            name: 'Не выбрано',
            emoji: '📁',
            color: '#C7CEEA'
        };
        
        // Проверяем стандартные категории (учеба, чтение, работа, хобби)
        const selectedStandardBtn = document.querySelector('.categories-row .category.selected');
        if (selectedStandardBtn) {
            const spanElement = selectedStandardBtn.querySelector('span');
            selectedCategory.name = spanElement ? spanElement.textContent : 'категория';
            selectedCategory.emoji = '📌'; // Эмодзи по умолчанию для стандартных
            
            // Цвета для стандартных категорий
            const categoryValue = selectedStandardBtn.getAttribute('data-value');
            const colorMap = {
                'study': '#C7CEEA',
                'read': '#B5EAD7',
                'work': '#FFDAC1',
                'hobby': '#FFB6C1'
            };
            selectedCategory.color = colorMap[categoryValue] || '#C7CEEA';
        }
        
        // Проверяем выбранную категорию из выпадающего списка
        if (categorySelectBtn && categorySelectBtn.classList.contains('selected')) {
            const spanElement = categorySelectBtn.querySelector('span');
            if (spanElement && spanElement.textContent !== 'выбрать') {
                selectedCategory.name = spanElement.textContent;
                
                // Пытаемся найти эмодзи для этой категории
                const categoryId = categorySelectBtn.getAttribute('data-value');
                const categoryOption = document.querySelector(`.category-option[data-value="${categoryId}"]`);
                if (categoryOption) {
                    const optionText = categoryOption.innerHTML;
                    // Регулярное выражение для поиска эмодзи в тексте
                    const emojiMatch = optionText.match(/^([\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/u);
                    if (emojiMatch) {
                        selectedCategory.emoji = emojiMatch[1];
                    }
                }
            }
        }
        
        // Получаем выбранное время
        const minutes = hiddenInput ? hiddenInput.value : '25';
        const minutesNum = parseInt(minutes);
        const formattedTime = `${minutesNum.toString().padStart(2, '0')}:00`;
        
        // Получаем описание задачи
        const taskInput = document.querySelector('.mod1-tasks');
        const taskDescription = taskInput ? taskInput.value.trim() : '';
        
        // Обновляем содержимое третьего окна
        if (startCategoryName) startCategoryName.textContent = selectedCategory.name;
        if (startCategoryEmoji) startCategoryEmoji.textContent = selectedCategory.emoji;
        if (startCategoryColor) startCategoryColor.style.backgroundColor = selectedCategory.color;
        if (startTimeDisplay) startTimeDisplay.textContent = formattedTime;
        if (startTaskDescription) {
            startTaskDescription.textContent = taskDescription || 'без описания';
        }
        
        // Убираем затемнение с content-container (если было)
        undimContentContainer();
        
        // Показываем overlay на весь экран (80% затемнение)
        showOverlay(0.8);
        
        // Открываем третье окно
        window.openStartTimerModal();
        
        console.log('⏰ Открыто окно старта таймера с категорией:', selectedCategory);
    }

    // ========== 8. ИНИЦИАЛИЗАЦИЯ ЭМОДЗИ ПИКЕРА ==========
    
    function initEmojiPicker() {
        if (!emojiPickerBtn || !emojiPickerContainer || !selectedEmoji || !emojiInput) {
            console.log('⚠️ Элементы эмодзи не найдены');
            return;
        }
        
        // Проверяем, загружен ли компонент emoji-picker
        if (!customElements.get('emoji-picker')) {
            console.error('❌ emoji-picker-element не загружен!');
            return;
        }
        
        try {
            const picker = document.createElement('emoji-picker');
            picker.classList.add('light');
            picker.setAttribute('locale', 'ru');
            
            picker.addEventListener('emoji-click', event => {
                const emoji = event.detail.unicode;
                console.log('✅ Выбран эмодзи:', emoji);
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
            
            console.log('✅ Эмодзи пикер инициализирован');
        } catch (error) {
            console.error('❌ Ошибка:', error);
        }
    }

    // ========== 9. УПРАВЛЕНИЕ ВЫПАДАЮЩИМ СПИСКОМ ЦВЕТОВ ==========
    
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

    // ========== 10. ОТПРАВКА ФОРМЫ СОЗДАНИЯ КАТЕГОРИИ ==========
    
    function initCategoryForm() {
        console.log('🔍 Инициализация формы создания категории...');
        
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
            console.error('❌ Форма createCategoryForm не найдена!');
            return;
        }
        
        console.log('✅ Форма найдена');
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Проверка названия
            const categoryName = nameInput ? nameInput.value.trim() : '';
            if (!categoryName) {
                alert('Пожалуйста, введите название категории');
                return;
            }
            
            // Проверка цвета
            const selectedColor = colorInput ? colorInput.value : '';
            if (!selectedColor) {
                alert('Пожалуйста, выберите цвет категории');
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
            
            // Создаем FormData
            const formData = new FormData(form);
            
            // Добавляем значения принудительно
            if (emojiInput && emojiInput.value) {
                formData.set('emoji', emojiInput.value);
            }
            if (colorInput && colorInput.value) {
                formData.set('color', colorInput.value);
            }
            
            // CSRF-токен
            const csrftoken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
            if (!csrftoken) {
                alert('Ошибка безопасности: CSRF токен не найден');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '+ создать';
                }
                return;
            }
            
            // Отправка запроса
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
                    
                    // Очищаем форму
                    form.reset();
                    if (selectedEmojiSpan) selectedEmojiSpan.textContent = '🎨';
                    if (emojiInput) emojiInput.value = '🎨';
                    if (colorPreview) colorPreview.style.backgroundColor = '#C7CEEA';
                    if (colorName) colorName.textContent = 'Пастельно-лавандовый';
                    if (colorInput) colorInput.value = '#C7CEEA';
                    
                    // Закрываем окно
                    if (modal2) modal2.style.display = 'none';
                    
                    // Убираем затемнение с content-container, если других окон нет
                    if (!isAnyModalOpen()) {
                        undimContentContainer();
                    }
                    
                    // Обновляем список категорий
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
                        alert(errorMessage);
                    }
                }
            })
            .catch(error => {
                console.error('❌ Ошибка:', error);
                alert('Произошла ошибка при отправке запроса');
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = '+ создать';
                }
            });
        });
        
        console.log('✅ Форма категории полностью инициализирована');
    }

    // ========== 11. ЗАГРУЗКА КАТЕГОРИЙ ПОЛЬЗОВАТЕЛЯ ==========
    
    function loadUserCategories() {
        console.log('📡 Загрузка категорий пользователя...');
        
        fetch('/categories/api/list/', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('📦 Получены категории:', data);
            if (data.categories) {
                updateCategoriesDropdown(data.categories);
            }
        })
        .catch(error => console.error('❌ Ошибка загрузки категорий:', error));
    }

    function updateCategoriesDropdown(categories) {
        const dropdown = document.querySelector('.category-dropdown');
        if (!dropdown) return;
        
        // Сохраняем опцию "создать категорию"
        const addNewOption = dropdown.querySelector('[data-value="add-new"]');
        
        // Очищаем список
        dropdown.innerHTML = '';
        
        // Добавляем категории пользователя
        categories.forEach(cat => {
            const option = document.createElement('div');
            option.className = 'category-option';
            option.setAttribute('data-value', cat.id);
            option.setAttribute('data-id', cat.id);
            option.innerHTML = `${cat.emoji || '📁'} ${cat.name}`;
            
            // Добавляем обработчик выбора категории
            option.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const selectedValue = this.getAttribute('data-value');
                const selectedText = this.textContent.trim();
                
                // Убираем выделение со всех стандартных кнопок
                document.querySelectorAll('.categories-row .category:not(.category-select-btn)').forEach(btn => {
                    btn.classList.remove('selected');
                });
                
                // Обновляем кнопку "выбрать"
                const categorySelectBtn = document.querySelector('.category-select-btn');
                const spanElement = categorySelectBtn.querySelector('span');
                if (spanElement) {
                    spanElement.textContent = selectedText;
                }
                
                categorySelectBtn.setAttribute('data-value', selectedValue);
                categorySelectBtn.classList.add('selected');
                
                // Закрываем выпадающий список
                const wrapper = document.querySelector('.category-select-wrapper');
                if (wrapper) {
                    wrapper.classList.remove('active');
                }
                
                console.log('📌 Выбрана категория:', selectedText);
            });
            
            dropdown.appendChild(option);
        });
        
        // Добавляем опцию создания новой категории
        if (addNewOption) {
            dropdown.appendChild(addNewOption);
        } else {
            const newOption = document.createElement('div');
            newOption.className = 'category-option';
            newOption.setAttribute('data-value', 'add-new');
            newOption.innerHTML = '+ создать категорию';
            
            newOption.addEventListener('click', function() {
                if (typeof window.openCreateCategoryModal === 'function') {
                    window.openCreateCategoryModal();
                }
            });
            
            dropdown.appendChild(newOption);
        }
        
        console.log('✅ Выпадающий список обновлен');
    }

    // ========== 12. ОБРАБОТЧИКИ ДЛЯ ОСНОВНОГО ОКНА ==========
    
    if (openBtn && modal1 && closeBtn) {
        openBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Затемняем только content-container
            dimContentContainer();
            modal1.style.display = 'block';
            
            loadUserCategories();
        });
        
        closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            modal1.style.display = 'none';
            
            // Убираем затемнение с content-container, если других окон нет
            if (!isAnyModalOpen()) {
                undimContentContainer();
            }
        });
    }
    
    // ========== 13. ОБРАБОТЧИКИ ДЛЯ КНОПОК ==========
    
    // Кнопка старт
    if (startBtn) {
        startBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Проверяем, выбрана ли категория
            const hasSelectedStandard = document.querySelector('.categories-row .category.selected');
            const hasSelectedCustom = categorySelectBtn && categorySelectBtn.classList.contains('selected');
            
            if (!hasSelectedStandard && !hasSelectedCustom) {
                alert('Пожалуйста, выберите категорию');
                return;
            }
            
            modal1.style.display = 'none';
            
            // Убираем затемнение с content-container (оно больше не нужно)
            undimContentContainer();
            
            // Открываем третье окно с overlay
            openStartTimerWithData();
        });
    }
    
    // // Кнопка "+ новая категория"
    // if (createCategoryBtn) {
    //     createCategoryBtn.addEventListener('click', function(e) {
    //         e.preventDefault();
            
    //         // Затемняем content-container (если еще не затемнен)
    //         dimContentContainer();
            
    //         modal1.style.display = 'none';
    //         modal2.style.display = 'block';
    //     });
    // }
    // Кнопка "+ новая категория" - ОТКРЫТИЕ ВТОРОГО ОКНА
if (createCategoryBtn) {
    // Удаляем все предыдущие обработчики, чтобы избежать конфликтов
    createCategoryBtn.replaceWith(createCategoryBtn.cloneNode(true));
    
    // Получаем новую ссылку на кнопку
    const newCreateCategoryBtn = document.querySelector('.button-mod1 .create');
    
    if (newCreateCategoryBtn) {
        newCreateCategoryBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Останавливаем всплытие события
            
            console.log('➕ Открытие окна создания категории');
            
            // Затемняем content-container
            dimContentContainer();
            
            // Закрываем первое окно
            if (modal1) modal1.style.display = 'none';
            
            // Открываем второе окно
            if (modal2) modal2.style.display = 'block';
            
            // Сбрасываем выделение категорий в первом окне (опционально)
            // Это не обязательно, но может быть полезно
        });
    }
}
    
    // Крестик первого окна
    if (closeModal1) {
        closeModal1.addEventListener('click', function() {
            modal1.style.display = 'none';
            
            // Убираем затемнение с content-container, если других окон нет
            if (!isAnyModalOpen()) {
                undimContentContainer();
            }
        });
    }
    
    // Крестик второго окна
    if (closeModal2) {
        closeModal2.addEventListener('click', function() {
            modal2.style.display = 'none';
            
            // Убираем затемнение с content-container, если других окон нет
            if (!isAnyModalOpen()) {
                undimContentContainer();
            }
        });
    }
    
    // Крестик третьего окна
    if (closeModal3) {
        closeModal3.addEventListener('click', function() {
            modal3.style.display = 'none';
            
            // Убираем overlay
            if (!isAnyModalOpen()) {
                hideOverlay();
            }
        });
    }
    
    // Кнопка отмена в третьем окне
    if (btnStartCancel) {
        btnStartCancel.addEventListener('click', function() {
            modal3.style.display = 'none';
            
            // Убираем overlay
            if (!isAnyModalOpen()) {
                hideOverlay();
            }
        });
    }
    
    // Кнопка начать в третьем окне
    if (btnStartBegin) {
        btnStartBegin.addEventListener('click', function() {
            console.log('🚀 Таймер запущен!');
            modal3.style.display = 'none';
            
            // Убираем overlay
            if (!isAnyModalOpen()) {
                hideOverlay();
            }
            
            alert('Таймер запущен!');
            // Здесь можно добавить редирект на страницу таймера
            // window.location.href = '/timer/';
        });
    }
    
    // ========== 14. ОБРАБОТЧИК ВЫБОРА "СОЗДАТЬ КАТЕГОРИЮ" ИЗ СПИСКА ==========
    
    if (addNewCategoryOption) {
        addNewCategoryOption.addEventListener('click', function() {
            window.openCreateCategoryModal();
        });
    }
    
    // ========== 15. ОБРАБОТКА ВЫБОРА КАТЕГОРИЙ ИЗ ВЫПАДАЮЩЕГО СПИСКА ==========
    
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
    
    // ========== 16. ОБРАБОТКА СТАНДАРТНЫХ КАТЕГОРИЙ ==========
    
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
    
    // ========== 17. ОБРАБОТКА ВЫБОРА ВРЕМЕНИ ==========
    
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
    
    // ========== 18. ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ ==========
    
    // // Закрытие по клику на overlay (только для 3-го окна)
    // window.addEventListener('click', function(event) {
    //     if (event.target === overlay) {
    //         if (modal3 && modal3.style.display === 'block') {
    //             modal3.style.display = 'none';
    //             hideOverlay();
    //         }
    //     }
    // });
    
    // Закрытие по клику вне модальных окон
    window.addEventListener('click', function(event) {
        // Для overlay (3-е окно)
        if (event.target === overlay) {
            if (modal3 && modal3.style.display === 'block') {
                modal3.style.display = 'none';
                hideOverlay();
            }
        }
        
        // Для первого окна
        if (modal1 && modal1.style.display === 'block' && !modal1.contains(event.target) && event.target !== openBtn) {
            modal1.style.display = 'none';
            if (!isAnyModalOpen()) {
                undimContentContainer();
            }
        }
        
        // Для второго окна
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
            
            // Закрываем выпадающие списки
            if (categorySelectWrapper) categorySelectWrapper.classList.remove('active');
            if (timeSelect) timeSelect.classList.remove('active');
            if (colorDropdown) colorDropdown.style.display = 'none';
            if (emojiPickerContainer) emojiPickerContainer.style.display = 'none';
        }
    });



    // ========== ПЕРЕМЕННЫЕ ТАЙМЕРА ==========
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

// ========== ФУНКЦИИ ТАЙМЕРА ==========

/**
 * Форматирование времени (секунды -> MM:SS)
 */
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Запуск таймера
 */
function startTimer(seconds, categoryData) {
    // Останавливаем предыдущий таймер если был
    stopTimer();
    
    // Сохраняем данные
    timerTotalSeconds = seconds;
    timerSeconds = seconds;
    currentTimerData = {
        ...categoryData,
        startTime: new Date(),
        completedEarly: false
    };
    
    // Обновляем отображение
    if (timerDisplay) {
        timerDisplay.textContent = formatTime(timerSeconds);
    }
    
    // Прячем сообщение о завершении
    if (timerCompleteMessage) {
        timerCompleteMessage.style.display = 'none';
    }
    
    // Запускаем интервал
    isPaused = false;
    timerInterval = setInterval(() => {
        if (!isPaused && timerSeconds > 0) {
            timerSeconds--;
            if (timerDisplay) {
                timerDisplay.textContent = formatTime(timerSeconds);
            }
            
            // Если время вышло
            if (timerSeconds === 0) {
                handleTimerComplete('natural');
            }
        }
    }, 1000);
    
    console.log('▶️ Таймер запущен на', seconds, 'секунд');
}

/**
 * Остановка таймера
 */
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/**
 * Получение CSRF токена из куки
 */
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

/**
 * Сохранение результата таймера
 */
function saveTimerResult(seconds, reason) {
    const elapsedSeconds = timerTotalSeconds - seconds;
    
    const data = {
        category_id: currentTimerData.categoryId,
        task_description: currentTimerData.taskDescription,
        duration_seconds: elapsedSeconds,
        completed: reason === 'natural' || reason === 'complete',
        completed_early: reason === 'complete',
        distracted: reason === 'distracted',
        timestamp: new Date().toISOString()
    };
    
    console.log('💾 Сохранение результата:', data);
    
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
            console.log('✅ Результат сохранен:', result);
            
            // Показываем сообщение об успехе
            if (timerCompleteMessage) {
                let messageText = '';
                if (reason === 'natural') {
                    messageText = '✅ Время вышло! Отличная работа!';
                } else if (reason === 'complete') {
                    messageText = '✅ Задача выполнена досрочно!';
                } else if (reason === 'distracted') {
                    messageText = '⏸️ Таймер остановлен';
                }
                
                timerCompleteMessage.innerHTML = `<span>${messageText}</span>`;
                timerCompleteMessage.style.display = 'block';
            }
        } else {
            console.error('❌ Ошибка сохранения:', result.error);
        }
    })
    .catch(error => {
        console.error('❌ Ошибка сети:', error);
    });
}

/**
 * Обработка завершения таймера
 */
function handleTimerComplete(reason) {
    stopTimer();
    
    const elapsedSeconds = timerTotalSeconds - timerSeconds;
    
    console.log('⏹️ Таймер завершен. Причина:', reason);
    console.log('⏱️ Прошло времени:', elapsedSeconds, 'секунд');
    
    // Сохраняем результат
    saveTimerResult(timerSeconds, reason);
    
    // Если это не пауза, показываем сообщение
    if (reason !== 'pause') {
        if (timerCompleteMessage) {
            timerCompleteMessage.style.display = 'block';
        }
    }
}

// ========== ОБРАБОТЧИКИ КНОПОК ТАЙМЕРА ==========

// Кнопка "я отвлекся"
if (btnDistracted) {
    btnDistracted.addEventListener('click', function() {
        handleTimerComplete('distracted');
        
        // Закрываем окно через 2 секунды
        setTimeout(() => {
            if (modal3) {
                modal3.style.display = 'none';
                hideOverlay();
            }
        }, 2000);
    });
}

// Кнопка "взять паузу"
if (btnPause) {
    btnPause.addEventListener('click', function() {
        isPaused = !isPaused;
        
        // Меняем текст кнопки
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
        
        console.log(isPaused ? '⏸️ Таймер на паузе' : '▶️ Таймер продолжен');
    });
}

// Кнопка "готово!"
if (btnComplete) {
    btnComplete.addEventListener('click', function() {
        handleTimerComplete('complete');
        
        // Закрываем окно через 2 секунды
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
        // Если таймер еще идет, считаем как "отвлекся"
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

// ========== ОБНОВЛЕННАЯ ФУНКЦИЯ ОТКРЫТИЯ ТРЕТЬЕГО ОКНА ==========
function openStartTimerWithData() {
    // Получаем выбранную категорию
    let selectedCategory = {
        name: 'Не выбрано',
        emoji: '📁',
        color: '#C7CEEA',
        id: null
    };
    
    // Проверяем стандартные категории (study, read, work, hobby)
    const selectedStandardBtn = document.querySelector('.categories-row .category.selected');
    if (selectedStandardBtn) {
        const spanElement = selectedStandardBtn.querySelector('span');
        selectedCategory.name = spanElement ? spanElement.textContent : 'категория';
        selectedCategory.emoji = '📌';
        selectedCategory.id = selectedStandardBtn.getAttribute('data-value');
        
        // Цвета для стандартных категорий
        const colorMap = {
            'study': '#C7CEEA',
            'read': '#B5EAD7',
            'work': '#FFDAC1',
            'hobby': '#FFB6C1'
        };
        selectedCategory.color = colorMap[selectedCategory.id] || '#C7CEEA';
    }
    
    // Проверяем выбранную категорию из списка (из БД)
    if (categorySelectBtn && categorySelectBtn.classList.contains('selected')) {
        const spanElement = categorySelectBtn.querySelector('span');
        if (spanElement && spanElement.textContent !== 'выбрать') {
            selectedCategory.name = spanElement.textContent;
            selectedCategory.id = categorySelectBtn.getAttribute('data-value'); // Это будет числовой ID из БД
            
            // Пытаемся найти эмодзи для этой категории
            const categoryOption = document.querySelector(`.category-option[data-value="${selectedCategory.id}"]`);
            if (categoryOption) {
                const optionText = categoryOption.innerHTML;
                // Ищем эмодзи в начале строки
                const emojiMatch = optionText.match(/^([\u{1F300}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}])/u);
                if (emojiMatch) {
                    selectedCategory.emoji = emojiMatch[1];
                }
            }
        }
    }
    
    // Получаем выбранное время (в минутах)
    const minutes = hiddenInput ? parseInt(hiddenInput.value) : 25;
    
    // Получаем описание задачи
    const taskInput = document.querySelector('.mod1-tasks');
    const taskDescription = taskInput ? taskInput.value.trim() : '';
    
    // Обновляем содержимое третьего окна
    if (startCategoryName) startCategoryName.textContent = selectedCategory.name;
    if (startCategoryEmoji) startCategoryEmoji.textContent = selectedCategory.emoji;
    if (startTaskDescription) {
        startTaskDescription.textContent = taskDescription || 'без описания';
    }
    
    // Показываем время
    if (startTimeDisplay) {
        startTimeDisplay.textContent = formatTime(minutes * 60);
    }
    
    // Прячем сообщение о завершении
    if (timerCompleteMessage) {
        timerCompleteMessage.style.display = 'none';
    }
    
    // Сбрасываем кнопку паузы
    if (btnPause) {
        const spanElement = btnPause.querySelector('span');
        if (spanElement) spanElement.textContent = 'взять паузу';
        const imgElement = btnPause.querySelector('img');
        if (imgElement) imgElement.src = "{% static 'icons/pauza.svg' %}";
    }
    isPaused = false;
    
    // Убираем затемнение с content-container
    undimContentContainer();
    
    // Показываем overlay на весь экран
    showOverlay(0.8);
    
    // Открываем третье окно
    window.openStartTimerModal();
    
    // ЗАПУСКАЕМ ТАЙМЕР!
    const timerData = {
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        categoryEmoji: selectedCategory.emoji,
        taskDescription: taskDescription
    };
    
    startTimer(minutes * 60, timerData);
    
    console.log('⏰ Открыто окно таймера с категорией:', selectedCategory);
}
    
    // ========== 19. ЗАПУСК ВСЕХ ИНИЦИАЛИЗАЦИЙ ==========
    
    initEmojiPicker();
    initColorSelector();
    initCategoryForm();
    
    console.log('🚀 Скрипт полностью загружен и инициализирован');
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





// ========== ВОЗОБНОВЛЕНИЕ СЕАНСА ==========
function initResumeSession() {
    const resumeButtons = document.querySelectorAll('.btn-again');
    
    resumeButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const categoryId = this.dataset.categoryId;
            const description = this.dataset.description || '';
            
            console.log('🔄 Возобновление сеанса:', { categoryId, description });
            
            // Находим категорию по ID и выбираем её
            if (categoryId) {
                // Ищем категорию в выпадающем списке
                const categoryOption = document.querySelector(`.category-option[data-value="${categoryId}"]`);
                if (categoryOption) {
                    categoryOption.click();
                } else {
                    // Если категория не найдена в списке, пробуем стандартные
                    console.warn('Категория не найдена в списке, ID:', categoryId);
                }
            }
            
            // Заполняем описание задачи
            const taskInput = document.querySelector('.mod1-tasks');
            if (taskInput && description) {
                taskInput.value = description;
            }
            
            // Открываем модальное окно старта таймера
            setTimeout(() => {
                const startBtn = document.querySelector('.button-mod1 .start');
                if (startBtn) {
                    startBtn.click();
                } else {
                    console.error('Кнопка старта не найдена');
                }
            }, 100);
        });
    });
}

// Вызываем после загрузки страницы
document.addEventListener('DOMContentLoaded', function() {
    // ... существующий код ...
    initResumeSession();
});