const xlsx = require('xlsx');
const fs = require('fs');

const workbook = xlsx.readFile('C:\\Users\\Excalıbur\\Downloads\\lead_import.xlsx');

let idCounter = 1000;

const customerGroups = {
    Eskişehir: [],
    Gaziantep: [],
    İstanbul: []
};

function mapDurum(rawDurum) {
    if (!rawDurum) return 'Yeni Lead';
    const r = rawDurum.trim().toLowerCase();
    if (r.includes('onay') || (r.includes('alındı') && !r.includes('randevu') && !r.includes('ödeme'))) return 'Vize Alındı ✓';
    if (r.includes('randevu')) return 'Randevu Alındı';
    if (r.includes('evrak toplan')) return 'Belgeler İstendi';
    if (r.includes('yeni')) return 'Yeni Lead';
    if (r.includes('olumsuz') || r.includes('red') || r.includes('iptal')) return 'Olumsuz';
    if (r.includes('beklemede')) return 'Müşteriden Geri Dönüş Bekleniyor';
    if (r.includes('tamam')) return 'Tamamlandı';
    return 'Yeni Lead';
}

function normalizeKey(str) {
    return str.toLowerCase().replace(/ş/g, 's').replace(/ı/g, 'i').replace(/i̇/g, 'i').replace(/ğ/g, 'g').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ /g, '').replace(/[^a-z]/g, '');
}

workbook.SheetNames.forEach(sheetName => {
    const parts = sheetName.split('_');
    const city = parts.length > 1 ? parts[1] : 'Eskişehir';

    if (!customerGroups[city]) customerGroups[city] = [];

    const worksheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

    let headerRowIndex = -1;
    for (let i = 0; i < 15; i++) {
        if (rows[i] && rows[i].includes('Telefon')) {
            headerRowIndex = i;
            break;
        }
    }

    if (headerRowIndex !== -1) {
        const headers = rows[headerRowIndex].map(h => typeof h === 'string' ? h.trim() : '');
        for (let i = headerRowIndex + 1; i < rows.length; i++) {
            const rowArr = rows[i];
            if (!rowArr || rowArr.length === 0 || !rowArr.some(cell => typeof cell === 'string' ? cell.trim() !== '' : cell)) continue;

            let rowObj = {};
            headers.forEach((h, colIdx) => {
                if (h) rowObj[h] = rowArr[colIdx] ?? '';
            });

            if (!rowObj['Ad Soyad']) continue;

            const parts = rowObj['Ad Soyad'].trim().split(' ');
            const lastName = parts.length > 1 ? parts.pop() : '';
            const firstName = parts.join(' ');

            const rawDurum = String(rowObj['Durum'] || '');

            const c = {
                id: String(idCounter++),
                firstName: firstName || rowObj['Ad Soyad'].trim(),
                lastName: lastName,
                telefon: String(rowObj['Telefon'] || '').trim(),
                email: String(rowObj['Mail'] || '').trim(),
                vize: String(rowObj['Vize Türü'] || 'Diğer').trim(),
                ulke: String(rowObj['Ülke'] || '').trim(),
                durum: mapDurum(rawDurum),
                durum_raw: rawDurum,
                statu: String(rowObj['Statü'] || '').trim(),
                evrakPct: String(rowObj['Evrak %'] || '').trim(),
                kaynak: String(rowObj['Kaynak'] || '').trim(),
                not: String(rowObj['Notlar'] || '').trim().replace(/\r?\n|\r/g, ' '),
                danisman: String(rowObj['Sorumlu'] || '').trim(),
                sehir: city,
                gorusme: '',
                takip: '',
                surec: '',
                karar: '',
                log: [],
                createdAt: '2026-02-27',
                updatedAt: '2026-02-27'
            };

            customerGroups[city].push(c);
        }
    }
});

let outputStr = `// AUTO-GENERATED from Excel — DO NOT EDIT MANUALLY
import { Customer, StatusType } from "../types";\n\n`;

const varNames = [];

for (const [city, arr] of Object.entries(customerGroups)) {
    const varName = normalizeKey(city) + 'Data';
    varNames.push(varName);
    outputStr += `export const ${varName}: Customer[] = [\n`;
    arr.forEach(c => {
        outputStr += `  ${JSON.stringify(c).replace('"durum":"' + c.durum + '"', '"durum":"' + c.durum + '" as StatusType')},\n`;
    });
    outputStr += `];\n\n`;
}

// Generate the allImportedCustomers combo
outputStr += `export const allImportedCustomers: Customer[] = [${varNames.map(v => '...' + v).join(', ')}];\n\n`;

// Copy the revenueData from existing importedData.ts
const existingData = fs.readFileSync('src/data/importedData.ts', 'utf8');
const revenueMatch = existingData.match(/export interface RevenueEntry[\s\S]*export const revenueData: RevenueEntry\[\] = \[\n([\s\S]*?)\];/);

if (revenueMatch) {
    outputStr += existingData.substring(existingData.indexOf('export interface RevenueEntry'));
} else {
    // If we can't find revenue data, just put empty array
    outputStr += `export interface RevenueEntry { id: string; }\nexport const revenueData: RevenueEntry[] = [];\n`;
}

fs.writeFileSync('src/data/importedData.ts', outputStr, 'utf8');
console.log('Successfully generated src/data/importedData.ts');
