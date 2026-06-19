(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        
        const exportCsvBtn = document.getElementById('exportCsvBtn');
        const exportJsonBtn = document.getElementById('exportJsonBtn');
        const exportExcelBtn = document.getElementById('exportExcelBtn');
        
        const dateFromInput = document.getElementById('exportDateFrom');
        const dateToInput = document.getElementById('exportDateTo');
        const applyBtn = document.getElementById('applyDateFilter');
        const clearBtn = document.getElementById('clearDateFilter');
        
        let currentDateFrom = '';
        let currentDateTo = '';

        // Проверяет что год в дате состоит ровно из 4 цифр
        function isValidYear(dateString) {
            if (!dateString) return true;
            const year = dateString.split('-')[0];
            return /^\d{4}$/.test(year);
        }
        
        function doExport(format) {
            let url = `/user/export/?format=${format}`;
            if (currentDateFrom) url += `&date_from=${currentDateFrom}`;
            if (currentDateTo) url += `&date_to=${currentDateTo}`;
            window.location.href = url;
        }
        
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', function(e) {
                e.preventDefault();
                doExport('csv');
            });
        }
        
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', function(e) {
                e.preventDefault();
                doExport('json');
            });
        }
        
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', function(e) {
                e.preventDefault();
                doExport('xlsx');
            });
        }
        
        if (applyBtn) {
            applyBtn.addEventListener('click', function() {
                const from = dateFromInput?.value || '';
                const to = dateToInput?.value || '';

                if (!isValidYear(from)) {
                    if (window.validate) window.validate.markError('exportDateFrom', 'Год должен состоять из 4 цифр');
                    else if (window.notify) window.notify.error('Год должен состоять из 4 цифр');
                    return;
                }

                if (!isValidYear(to)) {
                    if (window.validate) window.validate.markError('exportDateTo', 'Год должен состоять из 4 цифр');
                    else if (window.notify) window.notify.error('Год должен состоять из 4 цифр');
                    return;
                }

                if (from && to && from > to) {
                    if (window.notify) window.notify.error('Дата "от" не может быть позже даты "до"');
                    return;
                }

                currentDateFrom = from;
                currentDateTo = to;

                if (window.notify) {
                    window.notify.success(`Фильтр применён: с ${currentDateFrom || 'начала'} по ${currentDateTo || 'сегодня'}`);
                } else {
                    alert(`Фильтр применён: с ${currentDateFrom || 'начала'} по ${currentDateTo || 'сегодня'}`);
                }
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                if (dateFromInput) dateFromInput.value = '';
                if (dateToInput) dateToInput.value = '';
                currentDateFrom = '';
                currentDateTo = '';
                if (window.notify) window.notify.info('Фильтр сброшен');
                else alert('Фильтр сброшен');
            });
        }
        
    });
    
})();