// tasks_calendar.js

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== 1. ПОЛУЧАЕМ ВСЕ НЕОБХОДИМЫЕ ЭЛЕМЕНТЫ ==========
    const modal = document.getElementById('createTaskModal');
    const modalOverlay = document.getElementById('modalOverlay');
    const openModalBtn = document.getElementById('openCreateTaskModal');
    const closeModalBtn = modal?.querySelector('.close-mod1');
    const contentContainer = document.querySelector('.content-container');
    
    // Элементы формы
    const taskTitleInput = document.getElementById('taskTitle');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const taskDueDate = document.getElementById('taskDueDate');
    const taskTime = document.getElementById('taskTime');
    const submitTaskBtn = document.getElementById('submitTaskBtn');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    
    // Элементы выбора категории
    const categoryButtons = document.querySelectorAll('.categories-row .category:not(.category-select-btn)');
    const categorySelectBtn = document.querySelector('.category-select-btn');
    const categoryDropdown = document.querySelector('.category-dropdown');
    const categoryOptions = document.querySelectorAll('.category-option');
    
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
    
    // ========== 3. ЦВЕТА И ЭМОДЗИ ДЛЯ СТАНДАРТНЫХ КАТЕГОРИЙ ==========
    const colorMap = {
        'учеба': '#C7CEEA',
        'чтение': '#B5EAD7',
        'работа': '#FFDAC1',
        'хобби': '#FFB6C1'
    };
    
    const emojiMap = {
        'учеба': '📚',
        'чтение': '📖',
        'работа': '💼',
        'хобби': '🎨'
    };
    
    // ========== 4. ФУНКЦИИ УПРАВЛЕНИЯ ЗАТЕМНЕНИЕМ ==========
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
    
    // ========== 5. ФУНКЦИИ УПРАВЛЕНИЯ ОКНОМ ==========
    function openModal() {
        if (modal) {
            modal.style.display = 'block';
            if (modalOverlay) modalOverlay.style.display = 'block';
            dimContentContainer();
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeModal() {
        if (modal) {
            modal.style.display = 'none';
            if (modalOverlay) modalOverlay.style.display = 'none';
            undimContentContainer();
            document.body.style.overflow = '';
            resetForm();
        }
    }
    
    function resetForm() {
        if (taskTitleInput) taskTitleInput.value = '';
        if (taskDescriptionInput) taskDescriptionInput.value = '';
        if (taskDueDate) taskDueDate.value = '';
        if (taskTime) taskTime.value = '';
        
        categoryButtons.forEach(btn => btn.classList.remove('selected'));
        if (categorySelectBtn) {
            categorySelectBtn.classList.remove('selected');
            const span = categorySelectBtn.querySelector('span');
            if (span) span.textContent = 'выбрать';
            delete categorySelectBtn.dataset.selectedId;
        }
        categoryOptions.forEach(opt => opt.classList.remove('selected'));
        if (categoryDropdown) categoryDropdown.style.display = 'none';
    }
    
    // ========== 6. ОТКРЫТИЕ/ЗАКРЫТИЕ ==========
    if (openModalBtn) {
        openModalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openModal();
        });
    }
    
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && modal.style.display === 'block') {
            closeModal();
        }
    });
    
    // ========== 7. ВЫБОР КАТЕГОРИИ ==========
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryButtons.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            
            if (categorySelectBtn) {
                categorySelectBtn.classList.remove('selected');
                const span = categorySelectBtn.querySelector('span');
                if (span) span.textContent = 'выбрать';
                delete categorySelectBtn.dataset.selectedId;
            }
            categoryOptions.forEach(opt => opt.classList.remove('selected'));
            if (categoryDropdown) categoryDropdown.style.display = 'none';
        });
    });
    
    if (categorySelectBtn) {
        categorySelectBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (categoryDropdown) {
                const isOpen = categoryDropdown.style.display === 'block';
                categoryDropdown.style.display = isOpen ? 'none' : 'block';
            }
        });
    }
    
    categoryOptions.forEach(option => {
        option.addEventListener('click', function() {
            const selectedText = this.textContent;
            const selectedId = this.dataset.id;
            
            if (categorySelectBtn) {
                const span = categorySelectBtn.querySelector('span');
                if (span) span.textContent = selectedText;
                categorySelectBtn.classList.add('selected');
                categorySelectBtn.dataset.selectedId = selectedId;
            }
            
            categoryButtons.forEach(btn => btn.classList.remove('selected'));
            categoryOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            if (categoryDropdown) categoryDropdown.style.display = 'none';
        });
    });
    
    document.addEventListener('click', function(e) {
        if (categoryDropdown && !categorySelectBtn?.contains(e.target) && !categoryDropdown.contains(e.target)) {
            categoryDropdown.style.display = 'none';
        }
    });
    
    // ========== 8. ПОЛУЧЕНИЕ ДАННЫХ КАТЕГОРИИ ==========
    function getSelectedCategoryData() {
        let categoryData = {
            name: null,
            id: null,
            isStandard: false
        };
        
        // Проверяем обычные кнопки (первые 4 категории)
        const selectedStandardBtn = document.querySelector('.categories-row .category.selected:not(.category-select-btn)');
        if (selectedStandardBtn) {
            // Пытаемся получить ID из data-id
            if (selectedStandardBtn.dataset.id) {
                // Это категория из БД
                categoryData.id = parseInt(selectedStandardBtn.dataset.id);
                categoryData.name = selectedStandardBtn.querySelector('span')?.textContent;
                categoryData.isStandard = false;
            } else {
                // Это стандартная категория (учеба, чтение, работа, хобби) без ID
                const spanElement = selectedStandardBtn.querySelector('span');
                categoryData.name = spanElement ? spanElement.textContent : 'категория';
                categoryData.isStandard = true;
                categoryData.id = null;
            }
        }
        
        // Проверяем выбранную из выпадающего списка
        if (!categoryData.name && categorySelectBtn?.classList.contains('selected')) {
            const spanElement = categorySelectBtn.querySelector('span');
            if (spanElement && spanElement.textContent !== 'выбрать') {
                categoryData.name = spanElement.textContent;
                categoryData.isStandard = false;
                categoryData.id = parseInt(categorySelectBtn.dataset.selectedId);
                
                if (!categoryData.id) {
                    const selectedOption = document.querySelector('.category-option.selected');
                    if (selectedOption) {
                        categoryData.id = parseInt(selectedOption.dataset.id);
                    }
                }
            }
        }
        
        return categoryData;
    }
    
    // ========== 9. СОЗДАНИЕ СТАНДАРТНОЙ КАТЕГОРИИ (если нет в БД) ==========
    async function createStandardCategoryIfNeeded(categoryName) {
        const csrftoken = getCookie('csrftoken');
        
        try {
            const response = await fetch('/api/categories/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                }
            });
            
            if (response.ok) {
                const categories = await response.json();
                const existingCategory = categories.find(
                    cat => cat.name.toLowerCase() === categoryName.toLowerCase()
                );
                
                if (existingCategory) {
                    console.log('✅ Стандартная категория уже существует:', existingCategory);
                    return existingCategory.id;
                }
            }
            
            const createResponse = await fetch('/api/categories/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify({
                    name: categoryName,
                    emoji: emojiMap[categoryName.toLowerCase()] || '📌',
                    color: colorMap[categoryName.toLowerCase()] || '#C7CEEA',
                    description: `Стандартная категория "${categoryName}"`
                })
            });
            
            if (createResponse.ok) {
                const data = await createResponse.json();
                console.log('✅ Создана новая стандартная категория:', data);
                return data.id;
            }
            
        } catch (error) {
            console.error('Ошибка при работе с категорией:', error);
        }
        
        return null;
    }
    
    // ========== 10. ПРОВЕРКА ДАТЫ ==========
    function isValidDueDate(dateString) {
        if (!dateString) return true;
        const selectedDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
            alert('Дата не может быть раньше сегодняшнего дня');
            return false;
        }
        return true;
    }
    
    // ========== 11. СОЗДАНИЕ ЗАДАЧИ ==========
    if (submitTaskBtn) {
        submitTaskBtn.addEventListener('click', async function() {
            const title = taskTitleInput?.value.trim();
            const description = taskDescriptionInput?.value.trim() || '';
            const dueDate = taskDueDate?.value;
            const dueTime = taskTime?.value;
            
            if (!title) {
                alert('Введите название задачи');
                return;
            }
            
            const categoryData = getSelectedCategoryData();
            console.log('Выбранная категория:', categoryData);
            
            if (!categoryData.name) {
                alert('Выберите категорию');
                return;
            }
            
            if (!isValidDueDate(dueDate)) return;
            
            let categoryId = categoryData.id;
            
            // Если это стандартная категория (учеба, чтение, работа, хобби) и нет ID
            if (categoryData.isStandard && !categoryId) {
                categoryId = await createStandardCategoryIfNeeded(categoryData.name);
                if (!categoryId) {
                    alert('Ошибка при создании категории');
                    return;
                }
            }
            
            // Проверяем, что есть ID для создания задачи
            if (!categoryId) {
                alert('Категория не найдена. Пожалуйста, выберите категорию из списка');
                return;
            }
            
            const taskData = {
                title: title,
                description: description,
                category: categoryId,
                duration_seconds: 0,
                completed: false,
                due_date: dueDate || null
            };
            if (dueTime) taskData.due_time = dueTime;
            
            const csrftoken = getCookie('csrftoken');
            
            try {
                const response = await fetch('/api/tasks/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                    },
                    body: JSON.stringify(taskData)
                });
                
                const data = await response.json();
                console.log('Ответ сервера:', data);
                
                if (response.ok && data.id) {
                    alert('✅ Задача создана!');
                    closeModal();
                    location.reload();
                } else {
                    let errorMsg = '❌ Ошибка:\n';
                    if (data.errors) {
                        for (let field in data.errors) {
                            errorMsg += `\n${field}: ${data.errors[field].join(', ')}`;
                        }
                    } else if (data.error) {
                        errorMsg += data.error;
                    } else {
                        errorMsg += 'Неизвестная ошибка';
                    }
                    alert(errorMsg);
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('❌ Ошибка сети');
            }
        });
    }
    
    // ========== 12. КНОПКА "НОВАЯ КАТЕГОРИЯ" ==========
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', function() {
            closeModal();
            if (typeof window.openCreateCategoryModal === 'function') {
                window.openCreateCategoryModal();
            } else {
                const categoryModal = document.getElementById('createCategoryModal');
                if (categoryModal) {
                    categoryModal.style.display = 'block';
                    dimContentContainer();
                }
            }
        });
    }
    
    console.log('✅ Модальное окно создания задачи инициализировано');
});