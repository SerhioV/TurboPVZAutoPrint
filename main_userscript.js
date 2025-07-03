// ==UserScript==
// @name         ТурбоПВЗ: Автопечать номера ячейки
// @author       SerhioVah
// @namespace    OZON_TurboPVZ
// @version      1.0.0307
// @description  Автопечать номер ячейки при приемке в ТурбоПВЗ:Ozon
// @match        https://turbo-pvz.ozon.ru/receiving/receive*
// @grant        none
// @icon         https://www.cataloged.ru/picos/logo/logo/ozon.png
// ==/UserScript==

(function() {
    'use strict';

    const SELECTOR = '[data-testid="logItemPlace"]';
    const CHECK_INTERVAL = 1000; // Интервал проверки появления элемента (в миллисекундах)

    // Список слов и фраз, которые исключаются из печати
    const bannedLabels = [
        'Расходники',
        'Прямой поток',
        'На проверку',
        'Возврат',
        'Возвраты Почты'
    ];

    function printCellNumber() {
        const cellElement = document.querySelector(SELECTOR);
        if (cellElement && !cellElement.dataset.printed) {
            const cellText = cellElement.textContent.trim();

            // Проверка: если строка начинается с запрещённой фразы (даже с суффиксом типа -1) — пропустить
            const normalizedText = cellText.toLowerCase();
            const shouldSkip = bannedLabels.some(label => normalizedText.startsWith(label.toLowerCase()));
            if (shouldSkip) return;

            cellElement.dataset.printed = 'true'; // Чтобы избежать повторной печати одного и того же элемента

            // HTML-шаблон для печати, задаёт стиль и отображение содержимого
            const printHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Печать</title>
                    <style>
                        /* Размер страницы для печати: ширина 58мм, высота 50мм */
                        @page {
                            size: 58mm 50mm;
                            margin: 0; /* Убираем отступы, чтобы всё влезало точно */
                        }

                        body {
                            margin: 0;
                            padding: 0;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 50mm; /* Фиксированная высота страницы */
                            width: 58mm;  /* Фиксированная ширина страницы */
                            font-family: Arial, sans-serif;
                        }

                        .cell {
                            font-size: 35vmin; /* Размер шрифта: 30% от меньшей стороны экрана (адаптивно) */
                            font-weight: bold;
                            text-align: center;
                            width: 100%;
                            word-wrap: break-word;
                        }
                    </style>
                </head>
                <body>
                    <div class="cell">${cellText}</div>
                </body>
                </html>
            `;

            // Открываем новое окно для печати и вставляем туда наш HTML
            const printWindow = window.open('', '_blank', 'width=600,height=500');
            printWindow.document.write(printHtml);
            printWindow.document.close();

            // Даем браузеру немного времени на загрузку перед печатью
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    }

    // Проверяем наличие элемента каждую секунду
    setInterval(printCellNumber, CHECK_INTERVAL);
})();
