import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { services, ServiceKey } from '../data/leodessaServices';
import * as XLSX from 'xlsx';

const LEODESSA_COLOR = 'var(--accent-secondary)';

const KAYNAK_LIST = [
  'Meta Ads', 'Google Ads', 'Instagram', 'WhatsApp',
  'Referans', 'Web Site', 'Yüz Yüze', 'Diğer',
];

const SEHIR_LIST = [
  'Adana', 'Adıyaman', 'Afyonkarahisar', 'Ağrı', 'Amasya', 'Ankara', 'Antalya', 'Artvin',
  'Aydın', 'Balıkesir', 'Bilecik', 'Bingöl', 'Bitlis', 'Bolu', 'Burdur', 'Bursa',
  'Çanakkale', 'Çankırı', 'Çorum', 'Denizli', 'Diyarbakır', 'Edirne', 'Elazığ', 'Erzincan',
  'Erzurum', 'Eskişehir', 'Gaziantep', 'Giresun', 'Gümüşhane', 'Hakkari', 'Hatay', 'Isparta',
  'Mersin', 'İstanbul', 'İzmir', 'Kars', 'Kastamonu', 'Kayseri', 'Kırklareli', 'Kırşehir',
  'Kocaeli', 'Konya', 'Kütahya', 'Malatya', 'Manisa', 'Kahramanmaraş', 'Mardin', 'Muğla',
  'Muş', 'Nevşehir', 'Niğde', 'Ordu', 'Rize', 'Sakarya', 'Samsun', 'Siirt', 'Sinop', 'Sivas',
  'Tekirdağ', 'Tokat', 'Trabzon', 'Tunceli', 'Şanlıurfa', 'Uşak', 'Van', 'Yozgat', 'Zonguldak',
  'Aksaray', 'Bayburt', 'Karaman', 'Kırıkkale', 'Batman', 'Şırnak', 'Bartın', 'Ardahan',
  'Iğdır', 'Yalova', 'Karabük', 'Kilis', 'Osmaniye', 'Düzce', 'Yurt Dışı', 'Diğer',
];

function getTemperatureLabel(score: number): string {
  if (score >= 70) return '🔥 Çok Sıcak Lead';
  if (score >= 45) return '⚡ Sıcak Lead';
  if (score >= 25) return '🌡️ Ilık Lead';
  if (score >= 10) return '❄️ Soğuk Lead';
  return '— Belirsiz —';
}

function getScoreColor(score: number): string {
  if (score >= 45) return 'var(--accent-emerald)';
  if (score >= 25) return 'var(--accent-amber)';
  return 'var(--accent-rose)';
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: '11px', fontFamily: "'Syne', sans-serif",
        textTransform: 'uppercase', letterSpacing: '0.06em',
        color: 'var(--text-secondary)', fontWeight: 600,
      }}>{label}</label>
      {children}
    </div>
  );
}

// ─── Column detection types ────────────────────────────────────────────────
interface ColMap {
  adSoyad: number | null;
  ad: number | null;
  soyad: number | null;
  telefon: number | null;
  email: number | null;
  sehir: number | null;
  kaynak: number | null;
  score: number | null;
  danisman: number | null;
  notlar: number | null;
}

function detectColMap(headers: string[]): ColMap {
  const map: ColMap = {
    adSoyad: null, ad: null, soyad: null, telefon: null, email: null,
    sehir: null, kaynak: null, score: null, danisman: null, notlar: null,
  };
  headers.forEach((h, i) => {
    const l = (h || '').toLowerCase().trim().replace(/\s+/g, ' ');

    // Combined name (check first — higher priority than individual)
    if (['ad soyad', 'ad-soyad', 'adsoyad', 'full name', 'fullname',
      'müşteri adı soyadı', 'isim soyisim', 'isim'].includes(l)) {
      if (map.adSoyad === null) { map.adSoyad = i; return; }
    }
    if (['ad', 'first name', 'firstname', 'müşteri adı', 'adı', 'name'].includes(l)) {
      if (map.ad === null) { map.ad = i; return; }
    }
    if (['soyad', 'soyadı', 'last name', 'lastname', 'surname'].includes(l)) {
      if (map.soyad === null) { map.soyad = i; return; }
    }
    if (l.includes('telefon') || l.includes('phone') || l.includes('gsm') ||
      l === 'tel' || l.includes('cep') || l.includes('numara')) {
      if (map.telefon === null) { map.telefon = i; return; }
    }
    if (l.includes('email') || l.includes('e-posta') || l.includes('eposta') || l === 'mail') {
      if (map.email === null) { map.email = i; return; }
    }
    if (l.includes('şehir') || l.includes('sehir') || l === 'city' || l === 'il' || l.includes('ilçe')) {
      if (map.sehir === null) { map.sehir = i; return; }
    }
    if (l.includes('kaynak') || l.includes('source') || l === 'kanal' || l.includes('platform')) {
      if (map.kaynak === null) { map.kaynak = i; return; }
    }
    if (l.includes('skor') || l.includes('score') || l.includes('puan')) {
      if (map.score === null) { map.score = i; return; }
    }
    if (l.includes('danışman') || l.includes('danisman') || l.includes('consultant') ||
      l.includes('temsilci') || (l.includes('satış') && !l.includes('skor'))) {
      if (map.danisman === null) { map.danisman = i; return; }
    }
    if (l.includes('not') || l.includes('açıklama') || l.includes('yorum') ||
      l === 'notes' || l === 'note' || l.includes('comment')) {
      if (map.notlar === null) { map.notlar = i; return; }
    }
  });
  return map;
}

// ─── Bulk row type ─────────────────────────────────────────────────────────
interface BulkRow {
  id: number;
  firstName: string;
  lastName: string;
  telefon: string;
  email: string;
  sehir: string;
  kaynak: string;       // raw from Excel (may be empty → use global default)
  scoreRaw: string;     // raw from Excel (may be non-numeric → use global default)
  salesConsultant: string; // raw from Excel (may be empty → use global default)
  notlar: string;
  include: boolean;
}

function parseRawRows(data: unknown[][], colMap: ColMap): BulkRow[] {
  const rows: BulkRow[] = [];
  for (let i = 1; i < data.length; i++) {
    const row = (data[i] as (string | number | null | undefined)[]) ?? [];

    let firstName = '';
    let lastName = '';
    if (colMap.adSoyad !== null) {
      const full = String(row[colMap.adSoyad] ?? '').trim();
      const parts = full.split(/\s+/);
      firstName = parts[0] ?? '';
      lastName = parts.slice(1).join(' ');
    } else {
      firstName = colMap.ad !== null ? String(row[colMap.ad] ?? '').trim() : '';
      lastName = colMap.soyad !== null ? String(row[colMap.soyad] ?? '').trim() : '';
    }

    const telefon = colMap.telefon !== null ? String(row[colMap.telefon] ?? '').trim() : '';
    const email = colMap.email !== null ? String(row[colMap.email] ?? '').trim() : '';
    const sehir = colMap.sehir !== null ? String(row[colMap.sehir] ?? '').trim() : '';
    const kaynak = colMap.kaynak !== null ? String(row[colMap.kaynak] ?? '').trim() : '';
    const scoreRaw = colMap.score !== null ? String(row[colMap.score] ?? '').trim() : '';
    const salesConsultant = colMap.danisman !== null ? String(row[colMap.danisman] ?? '').trim() : '';
    const notlar = colMap.notlar !== null ? String(row[colMap.notlar] ?? '').trim() : '';

    // Skip completely empty rows
    if (!firstName && !lastName && !telefon && !email) continue;

    rows.push({
      id: i - 1,
      firstName, lastName, telefon, email, sehir, kaynak,
      scoreRaw, salesConsultant, notlar,
      include: !!(firstName || telefon),
    });
  }
  return rows;
}

// ─── Template download ─────────────────────────────────────────────────────
function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Ad', 'Soyad', 'Telefon', 'Email', 'Şehir', 'Kaynak', 'Skor', 'Danışman', 'Notlar'],
    ['Mehmet', 'Yılmaz', '+905551234567', 'mehmet@example.com', 'İstanbul', 'Meta Ads', '65', 'Ayşe Kaya', 'Schengen vize ilgisi'],
    ['Fatma', 'Demir', '+905559876543', '', 'Ankara', 'Google Ads', '40', 'Dilara Şahin', 'Oturum vizesi sorusu'],
    ['Ali', 'Koç', '+905331112233', 'ali@mail.com', 'İzmir', 'Meta Ads', '80', '', ''],
  ]);
  ws['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 22 },
    { wch: 12 }, { wch: 14 }, { wch: 8 }, { wch: 18 }, { wch: 30 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lead Şablonu');
  XLSX.writeFile(wb, 'leodessa_lead_sablonu.xlsx');
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function LeodessaUpload() {
  const { addLeodessaLead, leodessaLeads, setView } = useApp();
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // ─── Single entry state ────────────────────────────────────────────────
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState<ServiceKey>('schengen');
  const [kaynak, setKaynak] = useState('Meta Ads');
  const [sehir, setSehir] = useState('');
  const [salesConsultant, setSalesConsultant] = useState('');
  const [score, setScore] = useState(30);
  const [notlar, setNotlar] = useState('');
  const [addedCount, setAddedCount] = useState(0);

  // ─── Bulk upload state ─────────────────────────────────────────────────
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkHeaders, setBulkHeaders] = useState<string[]>([]);
  const [bulkColMap, setBulkColMap] = useState<ColMap | null>(null);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkDanisman, setBulkDanisman] = useState('');
  const [bulkKaynak, setBulkKaynak] = useState('Meta Ads');
  const [bulkScore, setBulkScore] = useState(30);
  const [bulkService, setBulkService] = useState<ServiceKey>('schengen');
  const [bulkImportedCount, setBulkImportedCount] = useState(0);
  const [bulkDone, setBulkDone] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tempLabel = getTemperatureLabel(score);
  const scoreColor = getScoreColor(score);
  const canSubmit = firstName.trim() && telefon.trim() && salesConsultant.trim();
  const selectedBulkRows = bulkRows.filter(r => r.include);

  // ─── Single entry submit ───────────────────────────────────────────────
  function handleSubmit() {
    if (!canSubmit) { alert('Ad, Telefon ve Satış Danışmanı zorunludur.'); return; }
    const svc = services[service];
    const summaryLines = [
      `=== MANUEL LEAD GİRİŞİ — ${svc.name} ===`,
      `Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`,
      `Lead Skoru: ${score} — ${tempLabel}`,
      `Müşteri: ${firstName.trim()} ${lastName.trim()} | ${telefon.trim()}${email.trim() ? ` | ${email.trim()}` : ''}${sehir ? ` | ${sehir}` : ''}`,
      `Kaynak: ${kaynak}`,
      `Satış Danışmanı: ${salesConsultant.trim()}`,
      notlar.trim() ? `Notlar:\n${notlar.trim()}` : '',
    ].filter(Boolean).join('\n');

    addLeodessaLead({
      firstName: firstName.trim(), lastName: lastName.trim(),
      telefon: telefon.trim(), email: email.trim(),
      service, serviceName: svc.name, serviceIcon: svc.icon,
      score, temperature: tempLabel,
      isDisqualified: false, answers: {}, notes: {}, textAnswers: {},
      summaryText: summaryLines, status: 'new', crmTransferred: false,
      salesConsultant: salesConsultant.trim(), kaynak, sehir,
    });
    setAddedCount(p => p + 1);
    setFirstName(''); setLastName(''); setTelefon(''); setEmail('');
    setSehir(''); setScore(30); setNotlar('');
    setTimeout(() => (document.getElementById('upload-firstname') as HTMLInputElement)?.focus(), 50);
  }

  // ─── File processing ───────────────────────────────────────────────────
  const processFile = useCallback((file: File) => {
    setBulkDone(false);
    setBulkImportedCount(0);
    setBulkFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result as ArrayBuffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: '' });
        if (raw.length < 2) {
          alert('Dosya en az 1 başlık satırı ve 1 veri satırı içermelidir.');
          return;
        }
        const headers = (raw[0] as string[]).map(h => String(h ?? ''));
        const colMap = detectColMap(headers);
        setBulkHeaders(headers);
        setBulkColMap(colMap);
        setBulkRows(parseRawRows(raw as unknown[][], colMap));
      } catch (err) {
        alert('Dosya okunamadı. Lütfen geçerli bir Excel (.xlsx, .xls) veya CSV dosyası yükleyin.');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }

  function toggleRow(id: number) {
    setBulkRows(prev => prev.map(r => r.id === id ? { ...r, include: !r.include } : r));
  }

  function toggleAll(value: boolean) {
    setBulkRows(prev => prev.map(r => ({ ...r, include: value })));
  }

  function resetBulk() {
    setBulkRows([]);
    setBulkFileName('');
    setBulkHeaders([]);
    setBulkColMap(null);
    setBulkDone(false);
    setBulkImportedCount(0);
  }

  function handleBulkImport() {
    if (selectedBulkRows.length === 0) { alert('Lütfen en az bir lead seçin.'); return; }
    const missingDanisman = selectedBulkRows.some(r => !(r.salesConsultant || bulkDanisman).trim());
    if (missingDanisman) {
      alert('Satış Danışmanı zorunludur. "Genel Satış Danışmanı" alanını doldurun veya Excel dosyasına bir "Danışman" sütunu ekleyin.');
      return;
    }
    const svc = services[bulkService];
    let count = 0;
    selectedBulkRows.forEach(row => {
      const effectiveDanisman = (row.salesConsultant || bulkDanisman).trim();
      const effectiveKaynak = row.kaynak || bulkKaynak;
      const rawNum = parseFloat(row.scoreRaw);
      const effectiveScore = isNaN(rawNum) ? bulkScore : Math.max(0, Math.min(100, Math.round(rawNum)));
      const temp = getTemperatureLabel(effectiveScore);
      const summaryLines = [
        `=== TOPLU EXCEL YÜKLEME — ${svc.name} ===`,
        `Dosya: ${bulkFileName} | Tarih: ${new Date().toLocaleDateString('tr-TR')}`,
        `Müşteri: ${row.firstName} ${row.lastName}${row.telefon ? ` | ${row.telefon}` : ''}${row.email ? ` | ${row.email}` : ''}${row.sehir ? ` | ${row.sehir}` : ''}`,
        `Lead Skoru: ${effectiveScore} — ${temp}`,
        `Kaynak: ${effectiveKaynak}`,
        `Satış Danışmanı: ${effectiveDanisman}`,
        row.notlar ? `Notlar: ${row.notlar}` : '',
      ].filter(Boolean).join('\n');

      addLeodessaLead({
        firstName: row.firstName, lastName: row.lastName,
        telefon: row.telefon, email: row.email,
        service: bulkService, serviceName: svc.name, serviceIcon: svc.icon,
        score: effectiveScore, temperature: temp,
        isDisqualified: false, answers: {}, notes: {}, textAnswers: {},
        summaryText: summaryLines, status: 'new', crmTransferred: false,
        salesConsultant: effectiveDanisman, kaynak: effectiveKaynak, sehir: row.sehir,
      });
      count++;
    });
    setBulkImportedCount(count);
    setAddedCount(p => p + count);
    setBulkDone(true);
    setBulkRows([]);
    setBulkFileName('');
    setBulkHeaders([]);
    setBulkColMap(null);
  }

  const recentLeads = leodessaLeads.slice(0, 8);

  return (
    <div style={{ padding: '32px 32px 64px', minHeight: '100vh', background: 'var(--bg-void)' }}>

      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: LEODESSA_COLOR, boxShadow: `0 0 12px ${LEODESSA_COLOR}` }} />
          <h1 style={{ fontSize: '28px', color: LEODESSA_COLOR, margin: 0 }}>Manuel Lead Girişi</h1>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", maxWidth: 640 }}>
          Google Ads / Meta Ads kampanyalarından gelen lead verilerini sisteme girin.
          Tekil giriş veya toplu Excel yükleme ile lead havuzunu doldurun.
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
          <div style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', fontSize: '13px', color: LEODESSA_COLOR, fontWeight: 600 }}>
            📥 Bu oturumda eklendi: {addedCount}
          </div>
          <div style={{ padding: '8px 16px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', fontSize: '13px', color: 'var(--text-secondary)' }}>
            📊 Toplam havuz: {leodessaLeads.length} lead
          </div>
          <button
            onClick={() => setView('leodessaLeads')}
            style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: `1px solid ${LEODESSA_COLOR}40`, fontSize: '13px', color: LEODESSA_COLOR, cursor: 'pointer', fontWeight: 600 }}
          >
            ⭐ Lead Havuzuna Git →
          </button>
        </div>
      </div>

      {/* ─── Tabs ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 32, borderBottom: '1px solid var(--border-subtle)' }}>
        {[
          { key: 'single', label: '📝 Tekil Giriş', desc: 'Bir lead ekle' },
          { key: 'bulk', label: '📊 Toplu Excel Yükleme', desc: '.xlsx / .xls / .csv' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'single' | 'bulk')}
            style={{
              padding: '12px 28px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? `2px solid ${LEODESSA_COLOR}` : '2px solid transparent',
              color: activeTab === tab.key ? LEODESSA_COLOR : 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontFamily: "'Syne', sans-serif",
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 2,
              marginBottom: -1,
              transition: 'color 0.2s',
            }}
          >
            {tab.label}
            <span style={{ fontSize: '11px', opacity: 0.6, fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SINGLE ENTRY TAB
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'single' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

          {/* Form card */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: '32px' }}>
            <div style={{ fontSize: '12px', color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 28, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: LEODESSA_COLOR }} />
              Yeni Lead Bilgileri
            </div>

            <datalist id="upload-sehir-list">
              {SEHIR_LIST.map(s => <option key={s} value={s} />)}
            </datalist>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Ad + Soyad */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField label="Ad *">
                  <input
                    id="upload-firstname"
                    className="form-input"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') (document.getElementById('upload-lastname') as HTMLInputElement)?.focus(); }}
                    placeholder="Örn: Mehmet"
                    autoFocus
                    style={{ fontSize: '15px' }}
                  />
                </FormField>
                <FormField label="Soyad">
                  <input
                    id="upload-lastname"
                    className="form-input"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') (document.getElementById('upload-tel') as HTMLInputElement)?.focus(); }}
                    placeholder="Örn: Yılmaz"
                    style={{ fontSize: '15px' }}
                  />
                </FormField>
              </div>

              {/* Tel + Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField label="Telefon *">
                  <input
                    id="upload-tel"
                    className="form-input"
                    value={telefon}
                    onChange={e => setTelefon(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') (document.getElementById('upload-email') as HTMLInputElement)?.focus(); }}
                    placeholder="+90 5XX XXX XX XX"
                    style={{ fontSize: '15px' }}
                  />
                </FormField>
                <FormField label="E-posta">
                  <input
                    id="upload-email"
                    className="form-input"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="ornek@mail.com"
                    style={{ fontSize: '15px' }}
                  />
                </FormField>
              </div>

              {/* Şehir */}
              <FormField label="Şehir">
                <input
                  className="form-input"
                  list="upload-sehir-list"
                  value={sehir}
                  onChange={e => setSehir(e.target.value)}
                  placeholder="Şehir seçin veya yazın..."
                  style={{ fontSize: '15px' }}
                />
              </FormField>

              {/* Hizmet + Kaynak */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField label="Hizmet Türü">
                  <select className="form-input" value={service} onChange={e => setService(e.target.value as ServiceKey)} style={{ fontSize: '15px' }}>
                    {(Object.keys(services) as ServiceKey[]).map(key => (
                      <option key={key} value={key}>{services[key].icon} {services[key].name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Lead Kaynağı">
                  <select className="form-input" value={kaynak} onChange={e => setKaynak(e.target.value)} style={{ fontSize: '15px' }}>
                    {KAYNAK_LIST.map(k => <option key={k}>{k}</option>)}
                  </select>
                </FormField>
              </div>

              {/* Satış Danışmanı */}
              <div style={{ padding: '20px', background: 'rgba(139,92,246,0.04)', border: `1px solid rgba(139,92,246,0.25)`, borderRadius: 12 }}>
                <FormField label="Satış Danışmanı Ad Soyad ★">
                  <input
                    className="form-input"
                    value={salesConsultant}
                    onChange={e => setSalesConsultant(e.target.value)}
                    placeholder="Örn: Ayşe Kaya"
                    style={{ fontSize: '15px', border: !salesConsultant.trim() ? '1px solid rgba(244,63,94,0.4)' : undefined }}
                  />
                </FormField>
                <div style={{ fontSize: '11px', color: LEODESSA_COLOR, marginTop: 8, fontStyle: 'italic' }}>
                  Bu lead ile ilgilenen Leodessa danışmanının tam adını girin. Her kayıtta zorunludur.
                </div>
              </div>

              {/* Lead Skoru */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ fontSize: '11px', fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Lead Skoru (0–100)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '24px', fontWeight: 800, color: scoreColor, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{score}</span>
                    <span style={{ fontSize: '12px', color: scoreColor, fontWeight: 600 }}>{tempLabel}</span>
                  </div>
                </div>
                <input type="range" min={0} max={100} step={5} value={score}
                  onChange={e => setScore(Number(e.target.value))}
                  style={{ width: '100%', accentColor: scoreColor, height: 6 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: 4, fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
                  <span>❄️ Soğuk (0)</span>
                  <span>🌡️ Ilık (25)</span>
                  <span>⚡ Sıcak (45)</span>
                  <span>🔥 Çok Sıcak (70)</span>
                </div>
              </div>

              {/* Notlar */}
              <FormField label="Notlar / Özet">
                <textarea className="form-input" value={notlar} onChange={e => setNotlar(e.target.value)}
                  placeholder="Reklamdan gelen müşteri notu, kampanya adı, özel bilgiler..."
                  style={{ minHeight: 96 }} />
              </FormField>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 12, marginTop: 28, paddingTop: 24, borderTop: '1px solid var(--border-subtle)', alignItems: 'center' }}>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  flex: 1, padding: '14px',
                  background: canSubmit ? `linear-gradient(135deg, ${LEODESSA_COLOR}, #6366F1)` : 'var(--bg-elevated)',
                  color: canSubmit ? '#fff' : 'var(--text-muted)',
                  boxShadow: canSubmit ? `0 4px 20px rgba(168,85,247,0.3)` : 'none',
                  fontSize: '15px', fontWeight: 700,
                }}
              >
                ⭐ Lead Havuzuna Ekle
              </button>
              {!canSubmit && (
                <span style={{ fontSize: '12px', color: 'var(--accent-rose)', fontWeight: 500 }}>
                  * Ad, Tel ve Danışman zorunlu
                </span>
              )}
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Score guide */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '20px' }}>
              <div style={{ fontSize: '11px', color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 16 }}>Lead Skor Rehberi</div>
              {[
                { range: '70–100', label: '🔥 Çok Sıcak', desc: 'Hemen satış ekibine aktar', color: 'var(--accent-emerald)' },
                { range: '45–69', label: '⚡ Sıcak', desc: '24 saat içinde takip', color: 'var(--accent-emerald)' },
                { range: '25–44', label: '🌡️ Ilık', desc: '1 hafta içinde takip', color: 'var(--accent-amber)' },
                { range: '0–24', label: '❄️ Soğuk', desc: 'Uzun vadeli nurturing', color: 'var(--accent-rose)' },
              ].map(item => (
                <div key={item.range} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: '11px', fontFamily: "'Syne', sans-serif", fontWeight: 700, color: item.color, minWidth: 56 }}>{item.range}</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: item.color }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recent leads */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '20px' }}>
              <div style={{ fontSize: '11px', color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 16 }}>Son Eklenen Leadler</div>
              {recentLeads.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Henüz lead yok.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recentLeads.map(lead => {
                    const sc = getScoreColor(lead.score);
                    return (
                      <div key={lead.id} style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 10, border: `1px solid var(--border-subtle)`, borderLeft: `3px solid ${sc}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{lead.firstName} {lead.lastName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>{lead.telefon}{lead.salesConsultant ? ` · 👤 ${lead.salesConsultant}` : ''}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>{lead.serviceIcon} {lead.serviceName}{lead.kaynak ? ` · ${lead.kaynak}` : ''}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: sc, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{lead.score}</div>
                            <div style={{ fontSize: '9px', color: sc, fontWeight: 600, marginTop: 2 }}>puan</div>
                          </div>
                        </div>
                        {lead.crmTransferred && <div style={{ fontSize: '10px', color: 'var(--accent-primary)', marginTop: 6, fontWeight: 600 }}>✅ CRM'e Aktarıldı</div>}
                      </div>
                    );
                  })}
                  <button onClick={() => setView('leodessaLeads')}
                    style={{ marginTop: 4, padding: '8px', fontSize: '12px', fontWeight: 600, color: LEODESSA_COLOR, background: 'transparent', border: `1px dashed rgba(139,92,246,0.3)`, borderRadius: 8, cursor: 'pointer' }}>
                    Tüm leadleri gör →
                  </button>
                </div>
              )}
            </div>

            {/* Flow guide */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '20px' }}>
              <div style={{ fontSize: '11px', color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 16 }}>Lead Akış Süreci</div>
              {[
                { step: '1', label: 'Lead Girişi', desc: 'Bu form üzerinden eklenir', color: LEODESSA_COLOR },
                { step: '2', label: 'Lead Havuzu', desc: "Akıllı Lead Havuzu'nda bekler", color: 'var(--accent-amber)' },
                { step: '3', label: "CRM'e Aktar", desc: "SDR Dashboard'a gönderilir", color: 'var(--accent-primary)' },
                { step: '4', label: "Vizemo'ya Devir", desc: 'Pipeline ile Vizemo ekibine geçer', color: 'var(--accent-emerald)' },
              ].map((item, i) => (
                <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < 3 ? 14 : 0 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${item.color}20`, border: `1px solid ${item.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', fontWeight: 800, color: item.color, fontFamily: "'Syne', sans-serif" }}>{item.step}</div>
                  {i < 3 && <div style={{ position: 'relative', marginLeft: -19, marginTop: 26, width: 2, height: 14, background: `${item.color}30` }} />}
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          BULK EXCEL UPLOAD TAB
      ═══════════════════════════════════════════════════════════════ */}
      {activeTab === 'bulk' && (
        <div style={{ maxWidth: 1200 }}>

          {/* ── Success state ── */}
          {bulkDone && (
            <div style={{ padding: '48px 40px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontSize: '56px', marginBottom: 16 }}>✅</div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>
                {bulkImportedCount} Lead Başarıyla Eklendi!
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 28 }}>
                Tüm leadler <strong style={{ color: 'var(--text-secondary)' }}>Leodessa Lead Havuzu</strong>'na aktarıldı ve SDR ekibi tarafından işlenebilir.
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button
                  onClick={resetBulk}
                  style={{ padding: '12px 28px', borderRadius: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                  ➕ Yeni Dosya Yükle
                </button>
                <button
                  onClick={() => setView('leodessaLeads')}
                  style={{ padding: '12px 28px', borderRadius: 12, background: `linear-gradient(135deg, ${LEODESSA_COLOR}, #6366F1)`, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '14px', boxShadow: '0 4px 20px rgba(168,85,247,0.3)' }}>
                  ⭐ Lead Havuzunu Gör →
                </button>
              </div>
            </div>
          )}

          {!bulkDone && (
            <>
              {/* ── Drop zone (shown when no file loaded) ── */}
              {bulkRows.length === 0 && (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${isDragOver ? LEODESSA_COLOR : 'rgba(139,92,246,0.3)'}`,
                    borderRadius: 20,
                    padding: '64px 40px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isDragOver ? 'rgba(139,92,246,0.06)' : 'var(--bg-card)',
                    transition: 'all 0.2s ease',
                    marginBottom: 24,
                  }}
                >
                  <div style={{ fontSize: '60px', marginBottom: 16, lineHeight: 1 }}>📊</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>
                    Excel veya CSV dosyasını buraya sürükleyin
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 28 }}>
                    .xlsx, .xls ve .csv formatları desteklenir &nbsp;•&nbsp; İlk satır başlık satırı olmalıdır
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      style={{ padding: '13px 32px', borderRadius: 12, background: `linear-gradient(135deg, ${LEODESSA_COLOR}, #6366F1)`, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '15px', boxShadow: '0 4px 20px rgba(168,85,247,0.3)' }}>
                      📁 Dosya Seç
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); downloadTemplate(); }}
                      style={{ padding: '13px 32px', borderRadius: 12, background: 'transparent', border: `1px solid ${LEODESSA_COLOR}40`, color: LEODESSA_COLOR, cursor: 'pointer', fontWeight: 600, fontSize: '15px' }}>
                      ⬇️ Excel Şablonu İndir
                    </button>
                  </div>
                  <div style={{ marginTop: 24, padding: '14px 20px', background: 'var(--bg-elevated)', borderRadius: 12, display: 'inline-block', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Desteklenen sütun adları:&nbsp;
                    <strong style={{ color: 'var(--text-secondary)' }}>Ad, Soyad, Ad Soyad, Telefon, Email, Şehir, Kaynak, Skor, Danışman, Notlar</strong>
                  </div>
                  <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileInput} style={{ display: 'none' }} />
                </div>
              )}

              {/* ── File loaded: preview & settings ── */}
              {bulkRows.length > 0 && (
                <>
                  {/* File info bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '12px 20px', background: 'rgba(139,92,246,0.06)', borderRadius: 14, border: '1px solid rgba(139,92,246,0.15)' }}>
                    <span style={{ fontSize: '22px' }}>📄</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{bulkFileName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {bulkRows.length} satır algılandı &nbsp;·&nbsp; {selectedBulkRows.length} seçili
                      </div>
                    </div>
                    <button
                      onClick={() => { resetBulk(); setTimeout(() => fileInputRef.current?.click(), 50); }}
                      style={{ marginLeft: 'auto', padding: '6px 16px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                      🔄 Dosyayı Değiştir
                    </button>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileInput} style={{ display: 'none' }} />
                  </div>

                  {/* Detected columns */}
                  {bulkColMap && (
                    <div style={{ marginBottom: 20, padding: '16px 20px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '11px', color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', fontWeight: 700, marginBottom: 12, letterSpacing: '0.06em' }}>
                        Algılanan Sütunlar
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {([
                          { key: 'adSoyad', label: 'Ad Soyad', col: bulkColMap.adSoyad },
                          { key: 'ad', label: 'Ad', col: bulkColMap.ad },
                          { key: 'soyad', label: 'Soyad', col: bulkColMap.soyad },
                          { key: 'telefon', label: 'Telefon', col: bulkColMap.telefon },
                          { key: 'email', label: 'E-posta', col: bulkColMap.email },
                          { key: 'sehir', label: 'Şehir', col: bulkColMap.sehir },
                          { key: 'kaynak', label: 'Kaynak', col: bulkColMap.kaynak },
                          { key: 'score', label: 'Skor', col: bulkColMap.score },
                          { key: 'danisman', label: 'Danışman', col: bulkColMap.danisman },
                          { key: 'notlar', label: 'Notlar', col: bulkColMap.notlar },
                        ] as { key: string; label: string; col: number | null }[]).map(item => (
                          <div key={item.key} style={{
                            padding: '4px 12px', borderRadius: 20, fontSize: '12px', fontWeight: 600,
                            background: item.col !== null ? 'rgba(16,185,129,0.08)' : 'rgba(100,116,139,0.08)',
                            color: item.col !== null ? 'var(--accent-emerald)' : 'var(--text-muted)',
                            border: `1px solid ${item.col !== null ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.15)'}`,
                          }}>
                            {item.col !== null ? '✓' : '—'} {item.label}
                            {item.col !== null && bulkHeaders[item.col] && (
                              <span style={{ opacity: 0.7, fontWeight: 400, marginLeft: 4 }}>({bulkHeaders[item.col]})</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Global settings */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
                    <div style={{ fontSize: '11px', color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 16 }}>
                      Toplu Yükleme Ayarları
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', marginLeft: 8 }}>
                        — Excel'de boş olan alanlara uygulanır
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                      <div>
                        <FormField label="Genel Satış Danışmanı ★">
                          <input
                            className="form-input"
                            value={bulkDanisman}
                            onChange={e => setBulkDanisman(e.target.value)}
                            placeholder="Tüm batch için danışman adı (zorunlu)"
                            style={{
                              border: !bulkDanisman.trim() && selectedBulkRows.some(r => !r.salesConsultant)
                                ? '1px solid rgba(244,63,94,0.4)' : undefined,
                            }}
                          />
                        </FormField>
                        {!bulkDanisman.trim() && selectedBulkRows.some(r => !r.salesConsultant) && (
                          <div style={{ fontSize: '11px', color: 'var(--accent-rose)', marginTop: 4 }}>
                            ⚠ Danışmanı olmayan satırlar var
                          </div>
                        )}
                      </div>
                      <FormField label="Hizmet Türü">
                        <select className="form-input" value={bulkService} onChange={e => setBulkService(e.target.value as ServiceKey)}>
                          {(Object.keys(services) as ServiceKey[]).map(key => (
                            <option key={key} value={key}>{services[key].icon} {services[key].name}</option>
                          ))}
                        </select>
                      </FormField>
                      <FormField label="Varsayılan Kaynak">
                        <select className="form-input" value={bulkKaynak} onChange={e => setBulkKaynak(e.target.value)}>
                          {KAYNAK_LIST.map(k => <option key={k}>{k}</option>)}
                        </select>
                      </FormField>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <label style={{ fontSize: '11px', fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, minWidth: 190, flexShrink: 0 }}>
                        Varsayılan Skor: <span style={{ color: getScoreColor(bulkScore) }}>{bulkScore}</span>
                      </label>
                      <input
                        type="range" min={0} max={100} step={5}
                        value={bulkScore} onChange={e => setBulkScore(Number(e.target.value))}
                        style={{ flex: 1, accentColor: getScoreColor(bulkScore) }}
                      />
                      <span style={{ fontSize: '13px', color: getScoreColor(bulkScore), fontWeight: 700, minWidth: 130, textAlign: 'right' }}>
                        {getTemperatureLabel(bulkScore)}
                      </span>
                    </div>
                  </div>

                  {/* Preview table */}
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
                    <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-elevated)' }}>
                      <div style={{ fontSize: '12px', color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', fontWeight: 700 }}>
                        Önizleme
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
                        <button
                          onClick={() => toggleAll(true)}
                          style={{ padding: '4px 12px', borderRadius: 6, fontSize: '12px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: LEODESSA_COLOR, cursor: 'pointer', fontWeight: 600 }}>
                          Tümünü Seç
                        </button>
                        <button
                          onClick={() => toggleAll(false)}
                          style={{ padding: '4px 12px', borderRadius: 6, fontSize: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>
                          Seçimi Kaldır
                        </button>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, borderLeft: '1px solid var(--border-subtle)', paddingLeft: 12 }}>
                        {selectedBulkRows.length} / {bulkRows.length} seçili
                      </div>
                    </div>

                    <div style={{ overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-elevated)' }}>
                            <th style={{ padding: '10px 14px', textAlign: 'center', width: 44, color: 'var(--text-muted)', fontWeight: 600, position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 1 }}>✓</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 1 }}>#</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 1 }}>Ad Soyad</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 1 }}>Telefon</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 1 }}>E-posta</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 1 }}>Şehir</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 1 }}>Kaynak</th>
                            <th style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 1 }}>Skor</th>
                            <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', position: 'sticky', top: 0, background: 'var(--bg-elevated)', zIndex: 1 }}>Danışman</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkRows.map((row, i) => {
                            const rawNum = parseFloat(row.scoreRaw);
                            const effectiveScore = isNaN(rawNum) ? bulkScore : Math.max(0, Math.min(100, Math.round(rawNum)));
                            const sc = getScoreColor(effectiveScore);
                            const effectiveDanisman = row.salesConsultant || bulkDanisman;
                            const effectiveKaynak = row.kaynak || bulkKaynak;
                            const hasNoName = !row.firstName && !row.lastName;
                            const hasNoDanisman = !effectiveDanisman.trim();
                            return (
                              <tr
                                key={row.id}
                                onClick={() => toggleRow(row.id)}
                                style={{
                                  cursor: 'pointer',
                                  background: !row.include ? 'rgba(244,63,94,0.02)' : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                                  opacity: row.include ? 1 : 0.4,
                                  borderBottom: '1px solid var(--border-subtle)',
                                  transition: 'opacity 0.15s, background 0.15s',
                                }}
                              >
                                {/* Checkbox */}
                                <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                  <div style={{
                                    width: 18, height: 18, borderRadius: 4,
                                    border: `2px solid ${row.include ? LEODESSA_COLOR : 'var(--border-subtle)'}`,
                                    background: row.include ? LEODESSA_COLOR : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                                    flexShrink: 0,
                                  }}>
                                    {row.include && <span style={{ color: '#fff', fontSize: '11px', lineHeight: 1, fontWeight: 800 }}>✓</span>}
                                  </div>
                                </td>
                                {/* Row number */}
                                <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '11px' }}>{i + 1}</td>
                                {/* Name */}
                                <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                                  {hasNoName
                                    ? <span style={{ color: 'var(--accent-rose)', fontSize: '11px' }}>⚠ İsim yok</span>
                                    : <>{row.firstName} {row.lastName}</>
                                  }
                                </td>
                                {/* Phone */}
                                <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                  {row.telefon || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                </td>
                                {/* Email */}
                                <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '12px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {row.email || <span>—</span>}
                                </td>
                                {/* City */}
                                <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                  {row.sehir || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                                </td>
                                {/* Source */}
                                <td style={{ padding: '10px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                  <span style={{ padding: '2px 8px', borderRadius: 10, background: 'rgba(139,92,246,0.08)', color: LEODESSA_COLOR, fontWeight: 600, fontSize: '11px' }}>
                                    {effectiveKaynak}
                                  </span>
                                  {!row.kaynak && (
                                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 4 }}>(varsayılan)</span>
                                  )}
                                </td>
                                {/* Score */}
                                <td style={{ padding: '10px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                  <span style={{ fontSize: '15px', fontWeight: 800, color: sc, fontFamily: "'Syne', sans-serif" }}>{effectiveScore}</span>
                                  {!row.scoreRaw && (
                                    <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>(varsayılan)</div>
                                  )}
                                </td>
                                {/* Consultant */}
                                <td style={{ padding: '10px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                  {hasNoDanisman
                                    ? <span style={{ color: 'var(--accent-rose)', fontWeight: 600, fontSize: '11px' }}>⚠ Eksik</span>
                                    : <>
                                      <span style={{ color: row.salesConsultant ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: row.salesConsultant ? 600 : 400 }}>
                                        {effectiveDanisman}
                                      </span>
                                      {!row.salesConsultant && bulkDanisman && (
                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 4 }}>(genel)</span>
                                      )}
                                    </>
                                  }
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Import button */}
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center', justifyContent: 'flex-end', padding: '16px 0' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{selectedBulkRows.length}</strong> lead eklenecek
                    </div>
                    <button
                      onClick={handleBulkImport}
                      disabled={selectedBulkRows.length === 0}
                      style={{
                        padding: '14px 36px', borderRadius: 14, fontSize: '16px', fontWeight: 800,
                        background: selectedBulkRows.length > 0
                          ? `linear-gradient(135deg, ${LEODESSA_COLOR}, #6366F1)`
                          : 'var(--bg-elevated)',
                        color: selectedBulkRows.length > 0 ? '#fff' : 'var(--text-muted)',
                        border: 'none',
                        cursor: selectedBulkRows.length > 0 ? 'pointer' : 'default',
                        boxShadow: selectedBulkRows.length > 0 ? '0 4px 24px rgba(168,85,247,0.4)' : 'none',
                        fontFamily: "'Syne', sans-serif",
                        transition: 'all 0.2s',
                      }}
                    >
                      ⭐ {selectedBulkRows.length} Lead'i Havuza Ekle →
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
