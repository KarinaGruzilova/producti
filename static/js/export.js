// static/js/export.js

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
        
        function doExport(format) {
            let url = `/user/export/?format=${format}`;
            if (currentDateFrom) url += `&date_from=${currentDateFrom}`;
            if (currentDateTo) url += `&date_to=${currentDateTo}`;
            console.log(`📤 Экспорт ${format}:`, url);
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
                currentDateFrom = dateFromInput?.value || '';
                currentDateTo = dateToInput?.value || '';
                alert(`Фильтр применён: с ${currentDateFrom || 'начала'} по ${currentDateTo || 'сегодня'}`);
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', function() {
                if (dateFromInput) dateFromInput.value = '';
                if (dateToInput) dateToInput.value = '';
                currentDateFrom = '';
                currentDateTo = '';
                alert('Фильтр сброшен');
            });
        }
        
        console.log('✅ Экспорт инициализирован');
    });
    
})();