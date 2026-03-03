// import_revenue.cjs — Gelir Takibi Excel Import (Supabase)
// Bu script revenue tablosuna önce ALTER TABLE yapıp sonra veriyi yükler.
// Usage: node scripts/import_revenue.cjs
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://fqzvimrfyxzqzenftuqo.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XT56UY-oJIelU7HcKV-MsQ_4PNucauK';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Danışman -> Şehir mapping
const DANISMAN_SEHIR = {
    'Dilara': 'Eskişehir',
    'Eray': 'Eskişehir',
    'Elanur': 'Gaziantep',
};

function parseTRDate(s) {
    if (!s || s === '-' || s.trim() === '' || s.trim() === '-') return '';
    const trimmed = s.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
    const parts = trimmed.split('.');
    if (parts.length === 3) {
        const [day, month, year] = parts;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
}

function parseAmount(s) {
    if (!s || s === '-' || s.trim() === '' || s.trim() === '-') return 0;
    const cleaned = s.toString().replace(/₺/g, '').replace(/,/g, '').replace(/\s/g, '').trim();
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
}

function parseName(fullName) {
    if (!fullName || fullName.trim() === '') return { firstName: '', lastName: '' };
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return { firstName: parts[0], lastName: '' };
    const lastName = parts.pop();
    const firstName = parts.join(' ');
    return { firstName, lastName };
}

async function main() {
    // Step 1: Try to directly insert with the schema used by AppContext
    // (firstName, lastName, danisman, sehir, odemeYontemi, onOdemeTarihi, onOdeme, kalanTarih, kalanOdeme, toplam)
    // If the fiscal table is missing columns, we catch the error and report

    console.log('🔍 Revenue tablosu sütunları kontrol ediliyor...');
    const id = require('crypto').randomUUID();
    await supabase.from('revenue').insert({ id });
    const { data: testRow } = await supabase.from('revenue').select('*').eq('id', id);
    const existingCols = testRow && testRow[0] ? Object.keys(testRow[0]) : [];
    await supabase.from('revenue').delete().eq('id', id);
    console.log('Mevcut sütunlar:', existingCols.join(', '));

    const needsDanisman = !existingCols.includes('danisman');

    if (needsDanisman) {
        console.log('\n⚠️  revenue tablosunda gerekli sütunlar eksik!');
        console.log('Supabase SQL Editor\'da şu komutu çalıştırın:\n');
        console.log(`ALTER TABLE revenue
  ADD COLUMN IF NOT EXISTS "danisman" text,
  ADD COLUMN IF NOT EXISTS "sehir" text,
  ADD COLUMN IF NOT EXISTS "odemeYontemi" text DEFAULT '💵 Elden',
  ADD COLUMN IF NOT EXISTS "onOdemeTarihi" text,
  ADD COLUMN IF NOT EXISTS "onOdeme" numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "kalanTarih" text DEFAULT '-',
  ADD COLUMN IF NOT EXISTS "kalanOdeme" numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "toplam" numeric DEFAULT 0;`);
        console.log('\nSonra bu script\'i tekrar çalıştırın.');
        return;
    }

    console.log('\n📂 Excel dosyası okunuyor...');
    const wb = XLSX.readFile('C:\\Users\\Excalıbur\\Downloads\\gelir_import.xlsx');
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json(ws, { raw: false, defval: '', header: 1 });

    const dataRows = [];
    for (let i = 3; i < raw.length; i++) {
        const row = raw[i];
        const numStr = (row[0] || '').toString().trim();
        if (!numStr || isNaN(parseInt(numStr))) continue;
        const adSoyad = (row[1] || '').toString().trim();
        if (!adSoyad) continue;
        const danisman = (row[2] || '').toString().trim();
        const odemeYontemi = (row[3] || '💵 Elden').toString().trim() || '💵 Elden';
        const onOdemeTarihiRaw = (row[4] || '').toString().trim();
        const onOdemeMiktariRaw = (row[5] || '').toString().trim();
        const kalanOdemeTarihiRaw = (row[6] || '').toString().trim();
        const kalanOdemeMiktariRaw = (row[7] || '').toString().trim();

        const { firstName, lastName } = parseName(adSoyad);
        const onOdemeTarihi = parseTRDate(onOdemeTarihiRaw) || new Date().toISOString().substring(0, 10);
        const onOdeme = parseAmount(onOdemeMiktariRaw);
        const kalanTarih = parseTRDate(kalanOdemeTarihiRaw) || '-';
        const kalanOdeme = parseAmount(kalanOdemeMiktariRaw);
        const toplam = onOdeme + kalanOdeme;
        const sehir = DANISMAN_SEHIR[danisman] || 'Eskişehir';

        dataRows.push({
            id: require('crypto').randomUUID(),
            firstName,
            lastName,
            danisman,
            sehir,
            odemeYontemi,
            onOdemeTarihi,
            onOdeme,
            kalanTarih,
            kalanOdeme,
            toplam,
        });

        const kalanStr = kalanOdeme > 0 ? ` + ₺${kalanOdeme} kalan` : '';
        const tarihStr = onOdemeTarihi || 'tarih yok';
        console.log(`  ✓ ${adSoyad} (${danisman}/${sehir}) | ₺${onOdeme}${kalanStr} = ₺${toplam} | ${tarihStr}`);
    }

    console.log(`\n📊 ${dataRows.length} kayıt hazırlandı. Supabase'e yükleniyor...`);

    // Insert in batches of 10
    const batchSize = 10;
    let successCount = 0;
    for (let i = 0; i < dataRows.length; i += batchSize) {
        const batch = dataRows.slice(i, i + batchSize);
        const { error } = await supabase.from('revenue').insert(batch);
        if (error) {
            console.error(`❌ Batch ${Math.floor(i / batchSize) + 1} hatası:`, error.message);
        } else {
            successCount += batch.length;
            console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} kayıt eklendi`);
        }
    }

    const { count } = await supabase.from('revenue').select('*', { count: 'exact', head: true });
    console.log(`\n✅ TAMAMLANDI! ${successCount}/${dataRows.length} kayıt eklendi. Supabase'deki toplam: ${count}`);
}

main().catch(console.error);
