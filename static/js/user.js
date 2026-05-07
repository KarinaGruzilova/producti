// profile.js
document.addEventListener('DOMContentLoaded', function() {
    
    const avatarEditBtn = document.getElementById('avatarEditBtn');
    const avatarInput = document.getElementById('avatarInput');
    
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
    
    if (avatarEditBtn && avatarInput) {
        avatarEditBtn.addEventListener('click', function(e) {
            e.preventDefault();
            avatarInput.click();
        });
    }
    
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;
            
            if (!file.type.startsWith('image/')) {
                alert('Пожалуйста, выберите изображение');
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
                alert('Размер файла не должен превышать 5MB');
                return;
            }
            
            const formData = new FormData();
            formData.append('avatar', file);
            
            const originalContent = avatarEditBtn.innerHTML;
            avatarEditBtn.innerHTML = '⏳';
            avatarEditBtn.disabled = true;
            
            fetch('/api/users/profile/upload-avatar/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    location.reload();
                } else {
                    alert(data.error || 'Ошибка при загрузке');
                    avatarEditBtn.innerHTML = originalContent;
                    avatarEditBtn.disabled = false;
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert('Произошла ошибка при загрузке');
                avatarEditBtn.innerHTML = originalContent;
                avatarEditBtn.disabled = false;
            })
            .finally(() => {
                avatarInput.value = '';
            });
        });
    }
});











// profile.js

document.addEventListener('DOMContentLoaded', function() {
    
    // Элементы
    const editBtn = document.getElementById('editProfileBtn');
    const editPanel = document.getElementById('profileEditPanel');
    const overlay = document.getElementById('profileEditOverlay');
    const closeBtn = document.getElementById('closeEditPanelBtn');
    const cancelBtn = document.getElementById('cancelEditBtn');
    const editForm = document.getElementById('profileEditForm');
    
    // Поля формы
    const firstNameInput = document.getElementById('editFirstName');
    const usernameInput = document.getElementById('editUsername');
    const emailInput = document.getElementById('editEmail');
    const passwordInput = document.getElementById('editPassword');
    const confirmPasswordInput = document.getElementById('editConfirmPassword');
    const usernameError = document.getElementById('usernameError');
    const passwordError = document.getElementById('passwordError');
    
    let originalUsername = '';
    
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
        editPanel.classList.add('open');
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        try {
            const response = await fetch('/api/users/profile/profile-data/', {
                headers: { 'X-CSRFToken': getCookie('csrftoken') }
            });
            const data = await response.json();
            
            firstNameInput.value = data.first_name || '';
            usernameInput.value = data.username || '';
            originalUsername = data.username || '';
            emailInput.value = data.email || '';
            passwordInput.value = '';
            confirmPasswordInput.value = '';
            usernameError.style.display = 'none';
            passwordError.style.display = 'none';
        } catch (error) {
            console.error('Ошибка загрузки:', error);
        }
    }
    
    function closeEditPanel() {
        editPanel.classList.remove('open');
        overlay.style.display = 'none';
        document.body.style.overflow = '';
        usernameError.style.display = 'none';
        passwordError.style.display = 'none';
    }
    
    function validatePassword() {
        const password = passwordInput.value;
        const confirm = confirmPasswordInput.value;
        
        if (password !== confirm) {
            passwordError.textContent = 'Пароли не совпадают';
            passwordError.style.display = 'block';
            return false;
        }
        if (password.length > 0 && password.length < 6) {
            passwordError.textContent = 'Пароль должен содержать не менее 6 символов';
            passwordError.style.display = 'block';
            return false;
        }
        passwordError.style.display = 'none';
        return true;
    }
    
    editForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validatePassword()) return;
        
        const formData = {
            username: usernameInput.value,
            first_name: firstNameInput.value,
            email: emailInput.value,
            password: passwordInput.value
        };
        
        try {
            const response = await fetch('/api/users/profile/update-profile/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                alert('Профиль успешно обновлён! Страница будет перезагружена.');
                location.reload();
            } else {
                if (data.error.includes('логин')) {
                    usernameError.textContent = data.error;
                    usernameError.style.display = 'block';
                } else {
                    alert(data.error || 'Ошибка при обновлении');
                }
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Произошла ошибка');
        }
    });
    
    if (editBtn) editBtn.addEventListener('click', openEditPanel);
    if (closeBtn) closeBtn.addEventListener('click', closeEditPanel);
    if (cancelBtn) cancelBtn.addEventListener('click', closeEditPanel);
    if (overlay) overlay.addEventListener('click', closeEditPanel);
    
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePassword);
    }
    if (passwordInput) {
        passwordInput.addEventListener('input', validatePassword);
    }
    
    let usernameTimeout;
    if (usernameInput) {
        usernameInput.addEventListener('input', async function() {
            clearTimeout(usernameTimeout);
            const username = this.value;
            
            if (username.length < 3) {
                usernameError.style.display = 'none';
                return;
            }
            
            usernameTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/users/profile/check-username/?username=${encodeURIComponent(username)}`, {
                        headers: { 'X-CSRFToken': getCookie('csrftoken') }
                    });
                    const data = await response.json();
                    
                    if (data.exists && username !== originalUsername) {
                        usernameError.textContent = 'Этот логин уже занят';
                        usernameError.style.display = 'block';
                    } else {
                        usernameError.style.display = 'none';
                    }
                } catch (error) {
                    console.error('Ошибка проверки логина:', error);
                }
            }, 500);
        });
    }
});




const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth();
const currentDay = currentDate.getDate();

document.querySelector('.calendar__month').innerText = months[currentDate.getMonth()];
document.querySelector('.calendar__year').innerText = currentYear;

const daysContainer = document.querySelector('.calendar__day-numbers');
daysContainer.innerHTML = '';

const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = воскресенье

const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

let week = document.createElement('div');
week.classList.add('calendar__day-numbers-row');

// Преобразуем так, чтобы понедельник был первым днём
// воскресенье (0) -> 6, понедельник (1) -> 0, вторник (2) -> 1, и т.д.
let emptyCells = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

for (let i = 0; i < emptyCells; i++) {
    let emptyDay = document.createElement('span');
    emptyDay.classList.add('calendar__day-number', 'calendar__day-number--other-month');
    emptyDay.innerText = '';
    week.appendChild(emptyDay);
}

for (let i = 1; i <= daysInMonth; i++) {
    let day = document.createElement('span');
    day.classList.add('calendar__day-number');
    day.innerText = i;
    
    if (i == currentDay) {
        day.classList.add('calendar__day-number--current');
    }
    
    week.appendChild(day);
    
    // 🔥 ВАЖНО: теперь проверяем ВОСКРЕСЕНЬЕ (день 0) как конец недели
    const dayOfWeek = new Date(currentYear, currentMonth, i).getDay();
    const isSunday = dayOfWeek === 0; // воскресенье
    
    if (isSunday || i == daysInMonth) {
        daysContainer.appendChild(week);
        if (i != daysInMonth) {
            week = document.createElement('div');
            week.classList.add('calendar__day-numbers-row');
        }
    }
}


























// активность по месяцам
// chart-trends.js

async function loadMonthlyTrends() {
    try {
        // Получаем данные с сервера
        const response = await fetch('/api/stats/monthly-trends/');
        const data = await response.json();
        
        renderTrendChart(data);
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}

function renderTrendChart(data) {
    const ctx = document.getElementById('categoriesTrendChart').getContext('2d');
    
    // Удаляем старый график, если есть
    const existingChart = Chart.getChart(ctx.canvas);
    if (existingChart) existingChart.destroy();
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.dates, // массив дат (например: ['01.05', '02.05', ...])
            datasets: data.categories.map(cat => ({
                label: cat.name,
                data: cat.values, // массив количества задач по дням
                borderColor: cat.color,
                backgroundColor: cat.color + '20', // прозрачный для заливки
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: cat.color,
                pointBorderColor: 'white',
                pointBorderWidth: 1,
                tension: 0.3,
                fill: false
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        boxWidth: 12,
                        boxHeight: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw} задач`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Количество задач',
                        font: { size: 12 }
                    },
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    },
                    grid: {
                        color: '#F0F0F0'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Дни месяца',
                        font: { size: 12 }
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// Запускаем загрузку
document.addEventListener('DOMContentLoaded', loadMonthlyTrends);