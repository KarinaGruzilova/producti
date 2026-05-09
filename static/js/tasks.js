// tasks_calendar.js

document.addEventListener('DOMContentLoaded', function() {
    
    // ========== 1. ЭЛЕМЕНТЫ ==========
    const modal = document.getElementById('createTaskModal');
    const overlay = document.getElementById('modalOverlay');
    const openBtn = document.getElementById('openCreateTaskModal');
    const closeBtn = modal?.querySelector('.close-mod1');
    const contentContainer = document.querySelector('.content-container');
    
    // Поля формы
    const taskTitleInput = document.getElementById('taskTitle');
    const taskDescriptionInput = document.getElementById('taskDescription');
    const taskDueDate = document.getElementById('taskDueDate');
    const taskTime = document.getElementById('taskTime');
    const submitBtn = document.getElementById('submitTaskBtn');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    
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
    
    // ========== 3. ПРОВЕРКА ДАТЫ (не раньше сегодня) ==========
    function isValidDate(dateString, timeString) {
        if (!dateString && !timeString) return true; // поле необязательное
        
        const now = new Date();
        const selectedDateTime = new Date(dateString + 'T' + (timeString || '00:00'));
        
        if (selectedDateTime < now) {
            alert('Дата и время не могут быть раньше текущего момента');
            return false;
        }
        return true;
    }
    
    // ========== 4. УПРАВЛЕНИЕ ЗАТЕМНЕНИЕМ ==========
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
    
    // ========== 5. УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ ==========
    function openModal() {
        if (modal) {
            modal.style.display = 'block';
            dimContentContainer();
            document.body.style.overflow = 'hidden';
        }
    }
    
    function closeModal() {
        if (modal) {
            modal.style.display = 'none';
            undimContentContainer();
            document.body.style.overflow = '';
            resetForm();
        }
    }
    
    // ========== 6. СБРОС ФОРМЫ ==========
    function resetForm() {
        if (taskTitleInput) taskTitleInput.value = '';
        if (taskDescriptionInput) taskDescriptionInput.value = '';
        if (taskDueDate) taskDueDate.value = '';
        if (taskTime) taskTime.value = '';
        
        // Сбрасываем выделение категорий
        document.querySelectorAll('.category').forEach(btn => btn.classList.remove('selected'));
        const categorySelectBtn = document.querySelector('.category-select-btn');
        if (categorySelectBtn) {
            categorySelectBtn.classList.remove('selected');
            const span = categorySelectBtn.querySelector('span');
            if (span) span.textContent = 'выбрать';
        }
        
        // Убираем ошибки
        document.querySelectorAll('.error-border').forEach(el => el.classList.remove('error-border'));
    }
    
    // ========== 7. ВЫДЕЛЕНИЕ ОШИБКИ ==========
    function showError(input, message) {
        input.classList.add('error-border');
        alert(message);
    }
    
    // ========== 8. ОТКРЫТИЕ/ЗАКРЫТИЕ ==========
    if (openBtn) {
        openBtn.addEventListener('click', function(e) {
            e.preventDefault();
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
    
    // ========== 9. ВЫБОР КАТЕГОРИИ ==========
    const categoryButtons = document.querySelectorAll('.category');
    const categorySelectBtn = document.querySelector('.category-select-btn');
    const categoryDropdown = document.querySelector('.category-dropdown');
    
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryButtons.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
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
    
    // Выбор категории из выпадающего списка
    const dropdownOptions = document.querySelectorAll('.category-option');
    dropdownOptions.forEach(option => {
        option.addEventListener('click', function() {
            const selectedText = this.textContent;
            const selectedId = this.dataset.id;
            
            // Обновляем кнопку "выбрать"
            if (categorySelectBtn) {
                const span = categorySelectBtn.querySelector('span');
                if (span) span.textContent = selectedText;
                categorySelectBtn.classList.add('selected');
                
                // Сохраняем выбранный ID
                categorySelectBtn.dataset.selectedId = selectedId;
            }
            
            // Убираем выделение со стандартных кнопок
            categoryButtons.forEach(b => b.classList.remove('selected'));
            
            // Добавляем класс selected этой опции для визуального выделения
            dropdownOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            // Закрываем выпадающий список
            if (categoryDropdown) categoryDropdown.style.display = 'none';
            
            console.log('Выбрана категория:', selectedText, 'ID:', selectedId);
        });
    });
    
    document.addEventListener('click', function() {
        if (categoryDropdown) categoryDropdown.style.display = 'none';
    });
    
    // СОЗДАНИЕ ЗАДАЧИ
    if (submitBtn) {
        submitBtn.addEventListener('click', async function() {
            const title = taskTitleInput?.value.trim();
            const description = taskDescriptionInput?.value.trim() || '';
            const dueDate = taskDueDate?.value;
            const dueTime = taskTime?.value;
            
            // 1. Проверка названия
            if (!title) {
                alert('Введите название задачи');
                return;
            }
            
            // 2. Получаем ID выбранной категории
            let selectedCategoryId = null;
            
            // Проверяем стандартные кнопки (учеба, чтение, работа, хобби)
            const selectedStandardBtn = document.querySelector('.categories-row .category.selected');
            if (selectedStandardBtn) {
                // Здесь нужно получать ID категории по названию
                const categoryName = selectedStandardBtn.querySelector('span')?.textContent;
                // Ищем опцию в выпадающем списке с таким же названием
                const matchedOption = Array.from(dropdownOptions).find(
                    opt => opt.textContent.toLowerCase() === categoryName?.toLowerCase()
                );
                if (matchedOption) {
                    selectedCategoryId = parseInt(matchedOption.dataset.id);
                }
            }
            
            // Проверяем выбранную из выпадающего списка
            if (!selectedCategoryId && categorySelectBtn?.classList.contains('selected')) {
                selectedCategoryId = parseInt(categorySelectBtn.dataset.selectedId);
                if (!selectedCategoryId) {
                    const selectedOption = document.querySelector('.category-option.selected');
                    if (selectedOption) {
                        selectedCategoryId = parseInt(selectedOption.dataset.id);
                    }
                }
            }
            
            if (!selectedCategoryId) {
                alert('Выберите категорию');
                return;
            }
            
            console.log('Выбранная категория ID:', selectedCategoryId);
            
            // 3. Проверка даты
            if (dueDate) {
                const selectedDate = new Date(dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selectedDate < today) {
                    alert('Дата не может быть раньше сегодняшнего дня');
                    return;
                }
            }
            
            // 4. Формируем данные для API
            const taskData = {
                title: title,
                description: description,
                category: selectedCategoryId,  // ← число, а не строка!
                duration_seconds: 0,
                completed: false
            };
            
            if (dueDate) taskData.due_date = dueDate;
            if (dueTime) taskData.due_time = dueTime;
            
            console.log('Отправка данных:', taskData);
            
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
                alert('❌ Произошла ошибка сети');
            }
        });
    }
    
    // ========== 11. КНОПКА "НОВАЯ КАТЕГОРИЯ" ==========
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', function() {
            closeModal();
            const categoryModal = document.getElementById('createCategoryModal');
            if (categoryModal && typeof window.openCreateCategoryModal === 'function') {
                window.openCreateCategoryModal();
            } else if (categoryModal) {
                categoryModal.style.display = 'block';
                dimContentContainer();
            }
        });
    }
    
    // ========== 12. УБИРАЕМ ОШИБКУ ПРИ ВВОДЕ ==========
    if (taskTitleInput) {
        taskTitleInput.addEventListener('input', function() {
            this.classList.remove('error-border');
        });
    }
    
    console.log('✅ Модальное окно создания задачи инициализировано');
});