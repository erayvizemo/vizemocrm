const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('C:\\Users\\Excalıbur\\Downloads\\lead_import.xlsx');

let allData = [];

workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    // Convert sheet to array of arrays
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    // Find the header row
    let headerRowIndex = -1;
    for (let i = 0; i < 10; i++) {
        if (rows[i] && rows[i].includes('Telefon')) {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex !== -1) {
        const headers = rows[headerRowIndex];
        // Process rows after header
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const rowArr = rows[i];
            if (!rowArr || rowArr.length === 0 || !rowArr.some(cell => typeof cell === 'string' ? cell.trim() !== '' : cell)) continue;

            let rowObj = { sheetName };
            headers.forEach((h, colIdx) => {
                if (h && typeof h === 'string') {
                    rowObj[h.trim()] = rowArr[colIdx] ?? '';
                }
            });
            allData.push(rowObj);
        }
    }
});

fs.writeFileSync('src/check_data.json', JSON.stringify(allData, null, 2));
