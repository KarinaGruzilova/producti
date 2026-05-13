// pricing.js

document.getElementById('upgradeProBtn')?.addEventListener('click', async function() {
    // Проверка авторизации (на всякий случай)
    const isAuthenticated = document.body.dataset.userAuthenticated === 'true';
    
    if (!isAuthenticated) {
        window.location.href = '/user/login/';
        return;
    }
    
    const csrftoken = getCookie('csrftoken');
    
    try {
        const response = await fetch('/api/activate-pro/', {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken }
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert(data.message);
            location.reload();
        } else {
            alert('Ошибка активации');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка сети');
    }
});

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