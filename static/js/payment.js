function copyCode() {
    const codeElement = document.getElementById('promoCode');
    const code = codeElement.innerText;
            
    navigator.clipboard.writeText(code).then(() => {
        showMessage('Промокод скопирован!', 'success');
        const btn = document.querySelector('.copy-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = 'Скопировано!';
        setTimeout(() => {
            btn.innerHTML = originalText;
            }, 2000);
    }).catch(() => {
        showMessage('Не удалось скопировать', 'error');
    });
}

function showMessage(message, type) {
    const container = document.getElementById('messagesContainer');
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.innerHTML = `
        <span>${message}</span>
        <button class="message-close" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(messageDiv);

    setTimeout(() => {
        if (messageDiv && messageDiv.parentElement) {
            messageDiv.remove();
        }
    }, 4000);
}
