document.addEventListener('DOMContentLoaded', function() {
    
    // ВСЕ НЕОБХОДИМЫЕ ЭЛЕМЕНТЫ
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
    
    // ФУНКЦИЯ ПОЛУЧЕНИЯ CSRF-ТОКЕНА
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
    
    // ЦВЕТА И ЭМОДЗИ ДЛЯ СТАНДАРТНЫХ КАТЕГОРИЙ
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
    
    // УПРАВЛЕНИЕ ОКНОМ И ЗАТЕМНЕНИЕМ
    function openModal() {
        if (modal && contentContainer) {
            modal.style.display = 'block';
            contentContainer.classList.add('dimmed');  // затемнение контейнера
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeModal() {
        if (modal && contentContainer) {
            modal.style.display = 'none';
            contentContainer.classList.remove('dimmed');  // убирает затемнение
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
    
    // ОТКРЫТИЕ/ЗАКРЫТИЕ
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
    
    // ВЫБОР КАТЕГОРИИ
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
    
    // ПОЛУЧЕНИЕ ДАННЫХ КАТЕГОРИИ 
    function getSelectedCategoryData() {
        let categoryData = {
            name: null,
            id: null,
            isStandard: false
        };
        
        const selectedStandardBtn = document.querySelector('.categories-row .category.selected:not(.category-select-btn)');
        if (selectedStandardBtn) {
            if (selectedStandardBtn.dataset.id) {
                categoryData.id = parseInt(selectedStandardBtn.dataset.id);
                categoryData.name = selectedStandardBtn.querySelector('span')?.textContent;
                categoryData.isStandard = false;
            } else {
                const spanElement = selectedStandardBtn.querySelector('span');
                categoryData.name = spanElement ? spanElement.textContent : 'категория';
                categoryData.isStandard = true;
                categoryData.id = null;
            }
        }
        
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
    
    // СОЗДАНИЕ СТАНДАРТНОЙ КАТЕГОРИИ
    async function createStandardCategoryIfNeeded(categoryName) {
        const csrftoken = getCookie('csrftoken');
        
        try {
            const response = await fetch('/api/categories/', {
                method: 'GET',
                headers: { 'X-CSRFToken': csrftoken }
            });
            
            if (response.ok) {
                const categories = await response.json();
                const existingCategory = categories.find(
                    cat => cat.name.toLowerCase() === categoryName.toLowerCase()
                );
                
                if (existingCategory) {
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
                return data.id;
            }
        } catch (error) {
            console.error('Ошибка:', error);
        }
        return null;
    }
    
    // ПРОВЕРКА ДАТЫ
    function isValidDueDate(dateString) {
        if (!dateString) return true;
        const selectedDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate = new Date(today.getFullYear() + 5, today.getMonth(), today.getDate());

        if (isNaN(selectedDate.getTime())) {
            if (window.validate) window.validate.markError('taskDueDate', 'Некорректная дата');
            else if (window.notify) window.notify.error('Некорректная дата');
            return false;
        }
        if (selectedDate < today) {
            if (window.validate) window.validate.markError('taskDueDate', 'Дата не может быть раньше сегодняшнего дня');
            else if (window.notify) window.notify.error('Дата не может быть раньше сегодняшнего дня');
            return false;
        }
        if (selectedDate > maxDate) {
            if (window.validate) window.validate.markError('taskDueDate', 'Дата не должна быть позже чем через 5 лет');
            else if (window.notify) window.notify.error('Дата не должна быть позже чем через 5 лет');
            return false;
        }
        return true;
    }
    
    // СОЗДАНИЕ ЗАДАЧИ
    if (submitTaskBtn) {
        submitTaskBtn.addEventListener('click', async function() {
            const title = taskTitleInput?.value.trim();
            const description = taskDescriptionInput?.value.trim() || '';
            const dueDate = taskDueDate?.value;
            const dueTime = taskTime?.value;

            // ПРОВЕРКА ЛИМИТА БАЗОВОГО ТАРИФА
            const isPro = document.body.dataset.isPro === 'true';
            if (!isPro) {
                try {
                    const limitRes = await fetch('/api/tasks/');
                    const allTasks = await limitRes.json();
                    const activeTasks = allTasks.filter(t => !t.completed);
                    if (activeTasks.length >= 10) {
                        if (window.notify) window.notify.error('Лимит 10 задач на бесплатном тарифе. Выполните или удалите существующие задачи, или оформите PRO.');
                        return;
                    }
                } catch(e) {}
            }
                
            if (!title) {
                if (window.validate) window.validate.markError('taskTitle', 'Введите название задачи');
                else if (window.notify) window.notify.error('Введите название задачи');
                return;
            }

            if (title.length > 100) {
                if (window.validate) window.validate.markError('taskTitle', 'Название не должно превышать 100 символов');
                else if (window.notify) window.notify.error('Название не должно превышать 100 символов');
                return;
            }

            if (description.length > 500) {
                if (window.validate) window.validate.markError('taskDescription', 'Описание не должно превышать 500 символов');
                else if (window.notify) window.notify.error('Описание не должно превышать 500 символов');
                return;
            }
                
            const categoryData = getSelectedCategoryData();
            if (!categoryData.name) {
                if (window.notify) window.notify.error('Выберите категорию');
                document.querySelectorAll('.categories-row .category').forEach(b => {
                    b.style.borderColor = '#FF4444';
                    b.addEventListener('click', () => { b.style.borderColor = ''; }, { once: true });
                });
                return;
            }
                
            if (!isValidDueDate(dueDate)) return;
                
            let categoryId = categoryData.id;
                
            if (categoryData.isStandard && !categoryId) {
                categoryId = await createStandardCategoryIfNeeded(categoryData.name);
                if (!categoryId) {
                    if (window.notify) window.notify.error('Ошибка при создании категории');
                    return;
                }
            }
                
            if (!categoryId) {
                if (window.notify) window.notify.error('Выберите категорию из списка');
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
                    
                if (response.ok && data.id) {
                    if (window.notify) window.notify.success('Задача создана!');
                    closeModal();
                    location.reload();
                } else {
                    let errorMsg = 'Ошибка при создании задачи';
                    if (data && typeof data === 'object') {
                        const firstField = Object.keys(data)[0];
                        if (firstField && Array.isArray(data[firstField])) {
                            errorMsg = data[firstField][0];
                        } else if (data.error) {
                            errorMsg = data.error;
                        }
                    }
                    if (window.notify) window.notify.error(errorMsg);
                }
                } catch (error) {
                    console.error('Ошибка:', error);
                    if (window.notify) window.notify.error('Ошибка сети');
                }
            });
        }
    
    // КНОПКА НОВАЯ КАТЕГОРИЯ
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', function() {
            closeModal();
            const categoryModal = document.getElementById('createCategoryModal');
            if (categoryModal && typeof window.openCreateCategoryModal === 'function') {
                window.openCreateCategoryModal();
            } else if (categoryModal) {
                categoryModal.style.display = 'block';
                contentContainer?.classList.add('dimmed');
            }
        });
    }
    

    // УДАЛЕНИЕ ЗАДАЧИ
    document.querySelectorAll('.btn-del').forEach(btn => {
        btn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();

            const card = this.closest('.task-card');
            const taskId = card?.dataset.taskId;
            if (!taskId) { if (window.notify) window.notify.error('ID задачи не найден'); return; }

            if (!confirm('Удалить задачу?')) return;

            try {
                const res = await fetch(`/api/tasks/${taskId}/`, {
                    method: 'DELETE',
                    headers: { 'X-CSRFToken': getCookie('csrftoken') }
                });
                if (res.ok || res.status === 204) {
                    card.remove();
                    if (window.notify) window.notify.success('Задача удалена');
                } else {
                    if (window.notify) window.notify.error('Ошибка при удалении');
                }
            } catch (err) {
                if (window.notify) window.notify.error('Ошибка сети');
            }
        });
    });

    // ВЫПОЛНИТЬ — переход на дашборд с запуском таймера
    document.querySelectorAll('.btn-done').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const card = this.closest('.task-card');
            const taskId = card?.dataset.taskId;
            const categoryId = card?.dataset.categoryId;
            const title = card?.querySelector('.task-title')?.innerText || '';

            if (!taskId) { if (window.notify) window.notify.error('ID задачи не найден'); return; }

            sessionStorage.setItem('resumeTask', JSON.stringify({
                categoryId: categoryId,
                description: title,
                taskId: taskId,
                mode: 'start'
            }));

            window.location.href = '/dashboard/';
        });
    });
});