const xlsx = require('xlsx');
const workbook = xlsx.readFile('C:\\Users\\Excalıbur\\Downloads\\lead_import.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

console.log('Headers:', Object.keys(data[0] || {}));

const danismanlar = new Set();
const sehirler = new Set();
data.forEach(row => {
    if (row['Danışman']) danismanlar.add(row['Danışman'].trim());
    if (row['Şehir']) sehirler.add(row['Şehir'].trim());
});

console.log('Danışmanlar:', Array.from(danismanlar));
console.log('Şehirler:', Array.from(sehirler));

// Print a few rows
console.log('First 3 rows:');
console.log(data.slice(0, 3));
