document.addEventListener('DOMContentLoaded', function() {
    const deleteCategoryBtn = document.querySelector('.btn-hero-delete');
    
    if (deleteCategoryBtn) {
        const categoryId = deleteCategoryBtn.dataset.id;
        const categoryName = document.querySelector('.category-info h1')?.innerText || 'этой категории';
        
        deleteCategoryBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const confirmed = confirm(`Вы уверены, что хотите удалить категорию "${categoryName}"?\n\nВсе задачи в этой категории также будут удалены. Это действие нельзя отменить.`);
            
            if (!confirmed) return;
            
            const originalText = deleteCategoryBtn.innerHTML;
            deleteCategoryBtn.innerHTML = 'Удаление...';
            deleteCategoryBtn.disabled = true;
            
            const csrftoken = getCookie('csrftoken');
            
            try {
                const response = await fetch(`/api/categories/${categoryId}/`, {
                    method: 'DELETE',
                    headers: {
                        'X-CSRFToken': csrftoken,
                        'Content-Type': 'application/json',
                    }
                });
                
                if (response.status === 204 || response.ok) {
                    alert('Категория успешно удалена!');
                    window.location.href = '/categories/';
                } else {
                    const data = await response.json().catch(() => ({}));
                    alert(`Ошибка при удалении: ${data.error || data.message || 'Неизвестная ошибка'}`);
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Произошла ошибка сети');
            } finally {
                deleteCategoryBtn.innerHTML = originalText;
                deleteCategoryBtn.disabled = false;
            }
        });
    }

    
    // ========== ЭЛЕМЕНТЫ ==========
    const editBtn = document.querySelector('.btn-hero-edit');
    const editPanel = document.getElementById('categoryEditPanel');
    const overlay = document.getElementById('categoryEditOverlay');
    const closeBtn = document.getElementById('closeEditPanelBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const editForm = document.getElementById('categoryEditForm');
    
    // Поля формы
    const nameInput = document.getElementById('editCategoryName');
    const emojiInput = document.getElementById('editEmojiInput');
    const selectedEmojiSpan = document.getElementById('editSelectedEmoji');
    const colorInput = document.getElementById('editColorInput');
    const colorPreview = document.getElementById('editColorPreview');
    const colorName = document.getElementById('editColorName');
    const descriptionInput = document.getElementById('editCategoryDescription');
    
    let categoryId = null;
    let originalName = '';
    
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
    
    async function openEditPanel() {
        if (!editBtn) return;
        categoryId = editBtn.dataset.id;
        
        editPanel.classList.add('open');
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        try {
            const response = await fetch(`/api/categories/${categoryId}/`, {
                headers: { 'X-CSRFToken': getCookie('csrftoken') }
            });
            const data = await response.json();
            
            nameInput.value = data.name || '';
            originalName = data.name || '';
            selectedEmojiSpan.textContent = data.emoji || '🎨';
            emojiInput.value = data.emoji || '🎨';
            colorPreview.style.backgroundColor = data.color || '#C7CEEA';
            colorInput.value = data.color || '#C7CEEA';
            descriptionInput.value = data.description || '';
            
            // Обновляем название цвета
            const colorOption = document.querySelector(`#editColorDropdown .color-option[data-color="${data.color}"]`);
            if (colorOption && colorName) {
                colorName.textContent = colorOption.dataset.name;
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
        }
    }
    
    function closeEditPanel() {
        editPanel.classList.remove('open');
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }
    
    // ========== ОТКРЫТИЕ/ЗАКРЫТИЕ ==========
    if (editBtn) {
        editBtn.addEventListener('click', openEditPanel);
    }
    
    if (closeBtn) closeBtn.addEventListener('click', closeEditPanel);
    if (cancelBtn) cancelBtn.addEventListener('click', closeEditPanel);
    if (overlay) overlay.addEventListener('click', closeEditPanel);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && editPanel.classList.contains('open')) {
            closeEditPanel();
        }
    });
    
    // ========== ВЫБОР ЭМОДЗИ ==========
    const emojiPickerBtn = document.getElementById('editEmojiPickerBtn');
    const emojiContainer = document.getElementById('editEmojiPickerContainer');
    
    if (emojiPickerBtn && emojiContainer) {
        emojiPickerBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            emojiContainer.style.display = emojiContainer.style.display === 'block' ? 'none' : 'block';
        });
        
        if (typeof EmojiPicker !== 'undefined' || customElements.get('emoji-picker')) {
            const picker = document.createElement('emoji-picker');
            picker.addEventListener('emoji-click', (e) => {
                selectedEmojiSpan.textContent = e.detail.unicode;
                emojiInput.value = e.detail.unicode;
                emojiContainer.style.display = 'none';
            });
            emojiContainer.appendChild(picker);
        }
        
        document.addEventListener('click', function(e) {
            if (emojiPickerBtn && emojiContainer && !emojiPickerBtn.contains(e.target) && !emojiContainer.contains(e.target)) {
                emojiContainer.style.display = 'none';
            }
        });
    }
    
// ========== ВЫБОР ЦВЕТА ==========
const colorSelectorBtn = document.getElementById('editColorSelectorBtn');
const colorDropdown = document.getElementById('editColorDropdown');

if (colorSelectorBtn && colorDropdown) {
    // Открытие/закрытие выпадающего списка
    colorSelectorBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = colorDropdown.style.display === 'block';
        colorDropdown.style.display = isOpen ? 'none' : 'block';
    });

    // Делегирование событий — более надежный подход
    colorDropdown.addEventListener('click', function(e) {
        const option = e.target.closest('.color-option');
        if (!option) return;
        
        e.preventDefault();
        e.stopPropagation();
        
        const selectedColor = option.dataset.color;
        const selectedName = option.dataset.name;
        
        console.log('Выбран цвет:', selectedName, selectedColor);
        
        colorPreview.style.backgroundColor = selectedColor;
        colorName.textContent = selectedName;
        colorInput.value = selectedColor;
        colorDropdown.style.display = 'none';
    });

    // Закрытие при клике вне
    document.addEventListener('click', function(e) {
        if (!colorDropdown.contains(e.target) && 
            !colorSelectorBtn.contains(e.target)) {
            colorDropdown.style.display = 'none';
        }
    });
}
    
    // ========== ОТПРАВКА ФОРМЫ ==========
    if (editForm) {
        editForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = nameInput.value.trim();
            if (!name) {
                alert('Введите название категории');
                return;
            }
            
            const formData = {
                name: name,
                emoji: emojiInput.value || '🎨',
                color: colorInput.value,
                description: descriptionInput.value || ''
            };
            
            try {
                const response = await fetch(`/api/categories/${categoryId}/`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken'),
                    },
                    body: JSON.stringify(formData)
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    alert('✅ Категория успешно обновлена! Страница будет перезагружена.');
                    location.reload();
                } else {
                    alert(data.error || data.message || 'Ошибка при обновлении');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Произошла ошибка');
            }
        });
    }
    
    console.log('✅ Панель редактирования категории инициализирована');
});