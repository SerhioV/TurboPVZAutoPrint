// ==UserScript==
// @name         OZON: Авто-печать номера ячейки
// @author SerhioVah
// @namespace    http://tampermonkey.net/
// @version      1.2.1907
// @description  Авто-печать номер ячейки при приемке в ТурбоПВЗ (ozon)
// @match        https://turbo-pvz.ozon.ru/*
// @grant        none
// @icon         https://www.cataloged.ru/picos/logo/logo/ozon.png
// @updateURL    https://raw.githubusercontent.com/SerhioV/TurboPVZAutoPrint/refs/heads/main/main_userscript.js
// @downloadURL  https://raw.githubusercontent.com/SerhioV/TurboPVZAutoPrint/refs/heads/main/main_userscript.js
// ==/UserScript==

(function() {
    'use strict';

    // Настройки и константы
    const SELECTOR = '[data-testid="logItemPlace"]'; // CSS-селектор для ячеек
    const CHECK_INTERVAL = 1000; // Интервал проверки новых ячеек в мс

    const bannedLabels = [
        'Расходники',
        'Прямой поток',
        'На проверку',
        'Возврат',
        'Возвраты Почты'
    ];

    let lastPrintedText = null;
    let forcePrintMode = false;
    let labelWidth = 58;
    let labelHeight = 50;
    let autoPrintEnabled = true; // флаг состояния авто-печати

    function printText(cellText) {
        const printHtml = `
            <!DOCTYPE html>
            <html><head><title>Печать</title>
                <style>
                    @page { size: ${labelWidth}mm ${labelHeight}mm; margin: 0; }
                    body {
                        margin: 0;
                        padding: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: ${labelHeight}mm;
                        width: ${labelWidth}mm;
                        font-family: Arial, sans-serif;
                    }
                    .cell {
                        font-size: 35vmin;
                        font-weight: bold;
                        text-align: center;
                        width: 100%;
                        word-wrap: break-word;
                    }
                </style>
            </head>
            <body><div class="cell">${cellText}</div></body></html>`;

        const printWindow = window.open('', '_blank', 'width=600,height=500');
        printWindow.document.write(printHtml);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
            console.log('[AUTO-PRINT] Печать завершена:', cellText);
        }, 500);
    }

    function printCellNumber() {
        if (!autoPrintEnabled) return;

        const cellElement = document.querySelector(SELECTOR);
        if (cellElement && !cellElement.dataset.printed) {
            const cellText = cellElement.textContent.trim();

            if (!forcePrintMode) {
                const normalizedText = cellText.toLowerCase();
                const shouldSkip = bannedLabels.some(label => normalizedText.startsWith(label.toLowerCase()));
                if (shouldSkip) return;

                const duplicateText = "Предмет уже числится на складе";
                const logBlock = cellElement.closest('[data-testid="logItemBlock"]');
                if (logBlock && logBlock.textContent.includes(duplicateText)) return;
            }

            cellElement.dataset.printed = 'true';
            lastPrintedText = cellText;
            printText(cellText);
        }
    }

    function createUI() {
        const togglePanelBtn = document.createElement('button');
        togglePanelBtn.textContent = '🖨️';
        togglePanelBtn.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            z-index: 10000;
            font-size: 22px;
            border-radius: 50%;
            width: 48px;
            height: 48px;
            border: none;
            background: #67c23a;
            color: white;
            cursor: pointer;
        `;

        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed;
            bottom: 70px;
            right: 10px;
            z-index: 9999;
            display: none;
            flex-direction: column;
            gap: 8px;
            font-family: Arial, sans-serif;
            background: white;
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        `;

        togglePanelBtn.onclick = () => {
            container.style.display = container.style.display === 'none' ? 'flex' : 'none';
        };

        const toggleScriptBtn = document.createElement('button');
        toggleScriptBtn.textContent = 'Авто-печать: ВКЛ';
        toggleScriptBtn.style.cssText = buttonStyle('#67c23a');
        toggleScriptBtn.onclick = () => {
            autoPrintEnabled = !autoPrintEnabled;
            toggleScriptBtn.textContent = `Авто-печать: ${autoPrintEnabled ? 'ВКЛ' : 'ВЫКЛ'}`;
            const color = autoPrintEnabled ? '#67c23a' : '#fb6767';
            toggleScriptBtn.style.background = color;
            togglePanelBtn.style.background = color;
            console.log('[AUTO-PRINT] Состояние скрипта:', autoPrintEnabled);
        };

        const repeatButton = document.createElement('button');
        repeatButton.textContent = '🔁 Повторить печать';
        repeatButton.style.cssText = buttonStyle();
        repeatButton.onclick = () => {
            if (lastPrintedText) printText(lastPrintedText);
            else alert('Нет данных для повторной печати');
        };

        const toggleForceButton = document.createElement('button');
        toggleForceButton.textContent = '⚙️ Принудительная печать: выкл';
        toggleForceButton.style.cssText = buttonStyle();
        toggleForceButton.onclick = () => {
            forcePrintMode = !forcePrintMode;
            toggleForceButton.textContent = `⚙️ Принудительная печать: ${forcePrintMode ? 'вкл' : 'выкл'}`;
            toggleForceButton.style.background = forcePrintMode ? '#f88f14' : '#005bff';
        };

        const manualButton = document.createElement('button');
        manualButton.textContent = '✏️ Ручной ввод и печать';
        manualButton.style.cssText = buttonStyle();
        manualButton.onclick = () => {
            const manualText = prompt('Введите номер ячейки для печати:');
            if (manualText) {
                lastPrintedText = manualText.trim();
                printText(lastPrintedText);
            }
        };

        const resizeButton = document.createElement('button');
        resizeButton.textContent = '📐 Задать размер этикетки';
        resizeButton.style.cssText = buttonStyle();
        resizeButton.onclick = () => {
            const w = prompt('Ширина этикетки в мм (например, 58):', labelWidth);
            const h = prompt('Высота этикетки в мм (например, 50):', labelHeight);
            if (w && h && !isNaN(w) && !isNaN(h)) {
                labelWidth = parseFloat(w);
                labelHeight = parseFloat(h);
                alert(`Новый размер установлен: ${labelWidth}мм x ${labelHeight}мм`);
            } else {
                alert('Напишите размеры этикетки цифрами. Арабским пожалуйста.');
            }
        };

        container.appendChild(toggleScriptBtn);
        container.appendChild(repeatButton);
        container.appendChild(toggleForceButton);
        container.appendChild(manualButton);
        container.appendChild(resizeButton);

        document.body.appendChild(togglePanelBtn);
        document.body.appendChild(container);
    }

    function buttonStyle(bg = '#005bff') {
        return `
            padding: 10px 12px;
            font-size: 16px;
            background: ${bg};
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
    }

    document.addEventListener('keydown', (e) => {
        if (e.shiftKey && e.code === 'KeyP') {
            if (lastPrintedText) printText(lastPrintedText);
            else alert('Нет данных для повторной печати');
        }
    });

    createUI();
    setInterval(printCellNumber, CHECK_INTERVAL);
})();
