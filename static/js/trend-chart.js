// static/js/trend-chart.js

async function loadMonthlyTrends() {
    const canvas = document.getElementById('monthlyTrendChart');
    if (!canvas) return;
    
    try {
        const response = await fetch('/api/stats/monthly-trends/');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        renderTrendChart(data);
    } catch (error) {
        console.error('Ошибка загрузки данных для графика:', error);
        showChartError();
    }
}

function renderTrendChart(data) {
    const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
    
    // Удаляем старый график, если есть
    const existingChart = Chart.getChart(ctx.canvas);
    if (existingChart) existingChart.destroy();
    
    if (data.categories.length === 0) {
        showEmptyChart();
        return;
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: data.categories.map(cat => ({
                label: cat.name,
                data: cat.values,
                borderColor: cat.color,
                backgroundColor: cat.color + '20',
                borderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: cat.color,
                pointBorderColor: '#fff',
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

function showEmptyChart() {
    const canvas = document.getElementById('monthlyTrendChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const existingChart = Chart.getChart(ctx.canvas);
    if (existingChart) existingChart.destroy();
    
    ctx.font = '14px "DVDDS", sans-serif';
    ctx.fillStyle = '#757575';
    ctx.textAlign = 'center';
    ctx.fillText('Нет данных за этот месяц', canvas.width / 2, canvas.height / 2);
}

function showChartError() {
    const canvas = document.getElementById('monthlyTrendChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const existingChart = Chart.getChart(ctx.canvas);
    if (existingChart) existingChart.destroy();
    
    ctx.font = '14px "DVDDS", sans-serif';
    ctx.fillStyle = '#FF4444';
    ctx.textAlign = 'center';
    ctx.fillText('Ошибка загрузки данных', canvas.width / 2, canvas.height / 2);
}

// Загружаем данные при загрузке страницы
document.addEventListener('DOMContentLoaded', loadMonthlyTrends);