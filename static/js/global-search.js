(function() {
    'use strict';
    
    let searchInput = null;
    let allCategoriesCache = []; // Кэш всех категорий
    
    // Загрузка всех категории через API
    function loadAllCategories() {
        return new Promise((resolve, reject) => {
            // Если уже загружены, возвращаею из кэша
            if (allCategoriesCache.length > 0) {
                resolve(allCategoriesCache);
                return;
            }
            
            const csrftoken = getCookie('csrftoken');
            
            fetch('/api/categories/', {
                headers: {
                    'X-CSRFToken': csrftoken,
                    'Content-Type': 'application/json',
                }
            })
            .then(response => response.json())
            .then(categories => {
                allCategoriesCache = categories;
                resolve(categories);
            })
            .catch(error => {
                console.error(' Ошибка загрузки категорий:', error);
                // Если API не работает, пробую собрать со страницы
                const categoriesFromPage = getCategoriesFromPage();
                resolve(categoriesFromPage);
            });
        });
    }
    
    // Получение категорий со страницы (запасной вариант)
    function getCategoriesFromPage() {
        const categories = [];
        
        // Пробует найти на странице
        const categoryElements = document.querySelectorAll('.activiti');
        
        categoryElements.forEach(elem => {
            const link = elem.querySelector('.category-link');
            const nameSpan = elem.querySelector('.text span');
            const smailDiv = elem.querySelector('.smail');
            
            if (link && nameSpan) {
                categories.push({
                    id: link.getAttribute('href')?.split('/')[2],
                    name: nameSpan.innerText.trim(),
                    emoji: smailDiv?.innerText.trim() || '📁',
                    color: smailDiv?.style.backgroundColor || '#C7CEEA',
                    url: link.getAttribute('href')
                });
            }
        });
        
        return categories;
    }
    
    // Поиск по всем категориям
    async function searchCategories(query) {
        if (!query || query.trim() === '') {
            return [];
        }
        
        // Все категории
        const allCategories = await loadAllCategories();
        const lowerQuery = query.toLowerCase().trim();
        
        const results = allCategories.filter(category => {
            return category.name && category.name.toLowerCase().includes(lowerQuery);
        });
        
        return results.slice(0, 4);
    }
    
    // Получение CSRF токена
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
    
    function highlightText(text, query) {
        if (!query || !text) return text || '';
        
        const lowerText = text.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerText.indexOf(lowerQuery);
        
        if (index === -1) return escapeHtml(text);
        
        const before = escapeHtml(text.substring(0, index));
        const match = escapeHtml(text.substring(index, index + query.length));
        const after = escapeHtml(text.substring(index + query.length));
        
        return `${before}<mark>${match}</mark>${after}`;
    }
    
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    async function displayResults(results, query) {
        const searchResults = document.getElementById('searchResults');
        const searchDropdown = document.getElementById('searchDropdown');
        
        if (!searchResults || !searchDropdown) return;
        
        // Если результаты еще не загружены, показываем загрузку
        if (results.then) {
            searchResults.innerHTML = '<div class="search-loading">Поиск...</div>';
            searchDropdown.style.display = 'block';
            results = await results;
        }
        
        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-no-results">
                    <span>Ничего не найдено для "${escapeHtml(query)}"</span>
                </div>
            `;
            searchDropdown.style.display = 'block';
            return;
        }
        
        let html = '';
        results.forEach(category => {
            const highlightedName = highlightText(category.name, query);
            
            html += `
                <div class="search-result-item" data-category-url="/categories/${category.id}/">
                    <div class="result-icon" style="background-color: ${category.color || '#C7CEEA'}">
                        ${category.emoji || '📁'}
                    </div>
                    <div class="result-info">
                        <div class="result-name">${highlightedName}</div>
                    </div>
                </div>
            `;
        });
        
        searchResults.innerHTML = html;
        searchDropdown.style.display = 'block';
        
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
    
    function openFirstCategory() {
        const firstResult = document.querySelector('.search-result-item');
        if (firstResult) {
            const url = firstResult.dataset.categoryUrl;
            if (url) {
                window.location.href = url;
            }
        }
    }
    
    function closeDropdown() {
        const dropdown = document.getElementById('searchDropdown');
        if (dropdown) dropdown.style.display = 'none';
    }
    
    // Создание категории из поиска
    function createCategory(name) {
        const modalBtn = document.getElementById('openCategoryModalBtn');
        if (modalBtn) {
            modalBtn.click();
            const nameInput = document.getElementById('category-name');
            if (nameInput) {
                nameInput.value = name;
            }
            closeDropdown();
        }
    }
    
    // Инициализация
    function initSearch() {
        searchInput = document.getElementById('searchInput');
        
        if (!searchInput) {
            return;
        }
        
        let searchTimeout;
        
        searchInput.addEventListener('input', async function(e) {
            clearTimeout(searchTimeout);
            const query = e.target.value;
            
            if (query.trim() === '') {
                closeDropdown();
                return;
            }
            
            searchTimeout = setTimeout(async () => {
                const results = searchCategories(query);
                await displayResults(results, query);
            }, 300);
        });
        
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                openFirstCategory();
            }
        });
        
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', function(e) {
                e.preventDefault();
                openFirstCategory();
            });
        }
        
        document.addEventListener('click', function(e) {
            const container = document.querySelector('.search-container');
            if (container && !container.contains(e.target)) {
                closeDropdown();
            }
        });
        
    }
    
    // Экспортирует функции
    window.GlobalSearch = {
        init: initSearch,
        createCategory: createCategory,
        refresh: function() {
            allCategoriesCache = [];
            loadAllCategories();
        }
    };
    
    // Запуск
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSearch);
    } else {
        initSearch();
    }
})();