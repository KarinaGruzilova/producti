// static/js/trend-chart.js

async function loadMonthlyTrends() {
    const canvas = document.getElementById('monthlyTrendChart');
    if (!canvas) return;
    
    try {
        const response = await fetch('/api/stats/monthly-trends/');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        renderBeautifulChart(data);
    } catch (error) {
        console.error('Ошибка:', error);
        showChartError();
    }
}

function renderBeautifulChart(data) {
    const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
    
    // Удаляем старый график
    const existingChart = Chart.getChart(ctx.canvas);
    if (existingChart) existingChart.destroy();
    
    if (data.categories.length === 0) {
        showEmptyChart();
        return;
    }
    
    // Создаём градиенты для линий
    const gradients = data.categories.map(cat => {
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, cat.color);
        gradient.addColorStop(1, cat.color + '80');
        return gradient;
    });
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.dates,
            datasets: data.categories.map((cat, index) => ({
                label: cat.name,
                data: cat.values,
                borderColor: cat.color,
                backgroundColor: cat.color + '10',
                borderWidth: 3,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: cat.color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.4,
                fill: true,
                shadowOffsetX: 2,
                shadowOffsetY: 2,
                shadowBlur: 10,
                shadowColor: cat.color + '40'
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle',
                        boxWidth: 10,
                        boxHeight: 10,
                        padding: 15,
                        font: {
                            family: "'DVDDS', sans-serif",
                            size: 12,
                            weight: '500'
                        },
                        color: '#2A2A2A'
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(45, 38, 140, 0.95)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: '#AEBCFE',
                    borderWidth: 1,
                    cornerRadius: 12,
                    padding: 10,
                    callbacks: {
                        label: function(context) {
                            return `📌 ${context.dataset.label}: ${context.raw} задач`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: '#F0F0F5',
                        drawBorder: false,
                        lineWidth: 1
                    },
                    title: {
                        display: true,
                        text: 'количество задач',
                        font: {
                            family: "'DVDDS', sans-serif",
                            size: 11,
                            weight: '400'
                        },
                        color: '#AEBCFE'
                    },
                    ticks: {
                        stepSize: 1,
                        precision: 0,
                        color: '#757575',
                        font: { size: 11 }
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    // title: {
                    //     display: true,
                    //     text: 'дни месяца',
                    //     font: {
                    //         family: "'DVDDS', sans-serif",
                    //         size: 11,
                    //         weight: '400'
                    //     },
                    //     color: '#AEBCFE'
                    // },
                    ticks: {
                        color: '#757575',
                        font: { size: 10 },
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            elements: {
                line: {
                    tension: 0.4,
                    borderJoin: 'round',
                    borderCap: 'round'
                },
                point: {
                    hoverBorderWidth: 3,
                    hoverBorderColor: '#fff'
                }
            },
            layout: {
                padding: {
                    top: 20,
                    bottom: 10,
                    left: 10,
                    right: 10
                }
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
    ctx.fillStyle = '#AEBCFE';
    ctx.textAlign = 'center';
    ctx.fillText('✨ пока нет данных ✨', canvas.width / 2, canvas.height / 2);
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
    ctx.fillText('❌ ошибка загрузки данных', canvas.width / 2, canvas.height / 2);
}

document.addEventListener('DOMContentLoaded', loadMonthlyTrends);