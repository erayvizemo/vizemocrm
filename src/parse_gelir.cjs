const xlsx = require('xlsx');
const fs = require('fs');

function parseExcelDate(excelDate) {
    if (!excelDate || typeof excelDate !== 'number') return '-';
    // Excel epoch is 1900-01-01, JS is 1970-01-01. 25569 is the difference in days.
    const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
    jsDate.setMinutes(jsDate.getMinutes() + jsDate.getTimezoneOffset());
    const yyyy = jsDate.getFullYear();
    const mm = String(jsDate.getMonth() + 1).padStart(2, '0');
    const dd = String(jsDate.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

const workbook = xlsx.readFile('C:\\Users\\Excalıbur\\Downloads\\gelir_import.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 }); // raw: true by default

// Read existing importedData.ts to extract city mapping and keep lead data
const tsPath = 'src/data/importedData.ts';
const existingData = fs.readFileSync(tsPath, 'utf8');

const cityMap = {};
const regex = /"firstName":"([^"]+)","lastName":"([^"]+)",.*?,"sehir":"([^"]+)"/g;
let match;
while ((match = regex.exec(existingData)) !== null) {
    const fullName = `${match[1]} ${match[2]}`.trim().toLowerCase();
    cityMap[fullName] = match[3];
}

const revenueEntries = [];
let idCounter = 1;

// Row 3 is headers, row 0..2 are titles
// We iterate from index 3 just to be safe, find actual header row
let headerRowIndex = -1;
for (let i = 0; i < 10; i++) {
    if (rows[i] && rows[i].includes('Ad Soyad')) {
        headerRowIndex = i;
        break;
    }
}

if (headerRowIndex !== -1) {
    for (let i = headerRowIndex + 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r[1] || r[1] === '💰  TOPLAM GELİR' || r[0] === '💰  TOPLAM GELİR' || r[0] === '📋  TOPLAM MÜŞTERİ SAYISI') continue; // Stop at totals or empty

        const adSoyad = String(r[1]).trim();
        const parts = adSoyad.split(' ');
        const lastName = parts.length > 1 ? parts.pop() : '';
        const firstName = parts.join(' ');
        const fullNameLower = adSoyad.toLowerCase();

        let city = cityMap[fullNameLower];
        if (!city) {
            const danisman = String(r[2] || '');
            if (danisman.toLowerCase() === 'elanur') city = 'İstanbul';
            else city = 'Eskişehir'; // Default fallback
        }

        const entry = {
            id: String(idCounter++),
            firstName,
            lastName,
            danisman: String(r[2] || ''),
            sehir: city,
            odemeYontemi: String(r[3] || ''),
            onOdemeTarihi: parseExcelDate(r[4]),
            onOdeme: Number(r[5]) || 0,
            kalanTarih: parseExcelDate(r[6]),
            kalanOdeme: Number(r[7]) || 0,
            toplam: Number(r[8]) || 0
        };
        revenueEntries.push(entry);
    }
} else {
    console.error('Header row not found in gelir import.');
}

// Generate new Revenue code
let revCode = `export interface RevenueEntry {
  id: string;
  firstName: string;
  lastName: string;
  danisman: string;
  sehir: string;
  odemeYontemi: string;
  onOdemeTarihi: string;
  onOdeme: number;
  kalanTarih: string;
  kalanOdeme: number;
  toplam: number;
}

export const revenueData: RevenueEntry[] = [\n`;

revenueEntries.forEach(r => {
    revCode += `  ${JSON.stringify(r)},\n`;
});
revCode += `];\n`;

const delimiter = 'export interface RevenueEntry';
const delimiterIndex = existingData.indexOf(delimiter);

let newData = '';
if (delimiterIndex !== -1) {
    newData = existingData.substring(0, delimiterIndex) + revCode;
} else {
    newData = existingData + '\n' + revCode;
}

fs.writeFileSync(tsPath, newData, 'utf8');
console.log(`Successfully generated revenueData with ${revenueEntries.length} entries.`);
