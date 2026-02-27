import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { services, ServiceKey } from '../data/leodessaServices';
import { ColMap, BulkRow, UploadBatch } from '../types';
import { generateId } from '../utils/helpers';
import * as XLSX from 'xlsx';

const LEODESSA_COLOR = 'var(--accent-secondary)';

const KAYNAK_LIST = [
  'Meta Ads', 'Google Ads', 'Instagram', 'WhatsApp',
  'Referans', 'Web Site', 'Yüz Yüze', 'Diğer',
];

function detectColMap(headers: string[]): ColMap {
  const map: ColMap = {
    adSoyad: null, ad: null, soyad: null, telefon: null, email: null,
    sehir: null, kaynak: null,
  };
  headers.forEach((h, i) => {
    const l = (h || '').toLowerCase().trim().replace(/\s+/g, ' ');
    if (['ad soyad', 'ad-soyad', 'adsoyad', 'full name', 'fullname', 'müşteri adı soyadı', 'isim soyisim', 'isim'].includes(l)) {
      if (map.adSoyad === null) { map.adSoyad = i; return; }
    }
    if (['ad', 'first name', 'firstname', 'müşteri adı', 'adı', 'name'].includes(l)) {
      if (map.ad === null) { map.ad = i; return; }
    }
    if (['soyad', 'soyadı', 'last name', 'lastname', 'surname'].includes(l)) {
      if (map.soyad === null) { map.soyad = i; return; }
    }
    if (l.includes('telefon') || l.includes('phone') || l.includes('gsm') || l === 'tel' || l.includes('cep') || l.includes('numara')) {
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
  });
  return map;
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

    if (!firstName && !lastName && !telefon && !email) continue;

    rows.push({
      id: generateId(),
      firstName, lastName, telefon, email, sehir, kaynak,
      isValid: !!(firstName || telefon),
    });
  }
  return rows;
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Ad', 'Soyad', 'Telefon', 'Email', 'Şehir', 'Kaynak'],
    ['Mehmet', 'Yılmaz', '+905551234567', 'mehmet@example.com', 'İstanbul', 'Meta Ads'],
    ['Fatma', 'Demir', '+905559876543', '', 'Ankara', 'Google Ads'],
  ]);
  ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 16 }, { wch: 22 }, { wch: 12 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lead Şablonu');
  XLSX.writeFile(wb, 'leodessa_bulk_lead_sablonu.xlsx');
}

export default function LeodessaUpload() {
  const { setView, setTrackingTransfer, uploadBatches, addUploadBatch, deleteUploadBatch, removeRowFromBatch } = useApp();

  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [bulkService, setBulkService] = useState<ServiceKey>('schengen');
  const [bulkKaynak, setBulkKaynak] = useState('Reklam');

  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeBatch = uploadBatches.find(b => b.id === activeBatchId);

  const processFile = useCallback((file: File) => {
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
        const rows = parseRawRows(raw as unknown[][], colMap);

        const newBatch: UploadBatch = {
          id: generateId(),
          fileName: file.name,
          uploadDate: new Date().toISOString(),
          headers,
          colMap,
          rows
        };

        addUploadBatch(newBatch);
        setActiveBatchId(newBatch.id);
      } catch (err) {
        alert('Dosya okunamadı. Lütfen geçerli bir Excel (.xlsx, .xls) veya CSV dosyası yükleyin.');
      }
    };
    reader.readAsArrayBuffer(file);
  }, [addUploadBatch]);

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

  function handleTransfer(batchId: string, row: BulkRow) {
    const finalKaynak = row.kaynak || bulkKaynak;
    setTrackingTransfer({
      firstName: row.firstName,
      lastName: row.lastName,
      telefon: row.telefon,
      email: row.email,
      sehir: row.sehir,
      kaynak: finalKaynak,
    });

    // Yükleme sırasında Lead Kalifikasyon sayfasına aktar
    removeRowFromBatch(batchId, row.id);
    setView('leodessaTracking');
  }

  return (
    <div style={{ padding: '32px 32px 64px', minHeight: '100vh', background: 'var(--bg-void)' }}>
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: LEODESSA_COLOR, boxShadow: `0 0 12px ${LEODESSA_COLOR}` }} />
            <h1 style={{ fontSize: '28px', color: LEODESSA_COLOR, margin: 0 }}>Toplu Müşteri Portföyü</h1>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", maxWidth: 640 }}>
            Excel dosyası yükleyerek müşterileri havuza atın. İstediğiniz zaman ilgili dosyadan müşteriyi kalifikasyona yönlendirebilirsiniz.
          </div>
        </div>
        {activeBatchId && (
          <button
            onClick={() => setActiveBatchId(null)}
            style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
            ← Klasörlere Geri Dön
          </button>
        )}
      </div>

      <div style={{ maxWidth: 1200 }}>
        {!activeBatchId ? (
          <>
            <div
              onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDragOver ? LEODESSA_COLOR : 'rgba(139,92,246,0.3)'}`,
                borderRadius: 20,
                padding: '48px 40px',
                textAlign: 'center',
                cursor: 'pointer',
                background: isDragOver ? 'rgba(139,92,246,0.06)' : 'var(--bg-card)',
                transition: 'all 0.2s ease',
                marginBottom: 32,
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: 16, lineHeight: 1 }}>�</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>
                Yeni Excel/CSV Yükle
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: 24 }}>
                Dosya sistemi otomatik olarak algılayıp yeni klasör oluşturacaktır
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  style={{ padding: '12px 28px', borderRadius: 12, background: `linear-gradient(135deg, ${LEODESSA_COLOR}, #6366F1)`, border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '14px', boxShadow: '0 4px 20px rgba(168,85,247,0.3)' }}>
                  Yükle
                </button>
                <button
                  onClick={e => { e.stopPropagation(); downloadTemplate(); }}
                  style={{ padding: '12px 28px', borderRadius: 12, background: 'transparent', border: `1px solid ${LEODESSA_COLOR}40`, color: LEODESSA_COLOR, cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                  Şablon İndir
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileInput} style={{ display: 'none' }} />
            </div>

            {uploadBatches.length > 0 ? (
              <div>
                <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: 16, fontFamily: "'Syne', sans-serif" }}>Yüklü Müşteri Klasörleri</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                  {uploadBatches.map(batch => (
                    <div key={batch.id} style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 16,
                      padding: '20px',
                      display: 'flex', flexDirection: 'column', gap: 16,
                      transition: 'transform 0.2s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ fontSize: '28px' }}>�</div>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{batch.fileName}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              {new Date(batch.uploadDate).toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={e => { e.stopPropagation(); deleteUploadBatch(batch.id); }}
                          style={{ padding: '4px', background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '16px' }}
                          title="Klasörü Sil"
                        >
                          🗑️
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          <span style={{ color: LEODESSA_COLOR }}>{batch.rows.length}</span> Bekleyen Lead
                        </div>
                        <button
                          onClick={() => setActiveBatchId(batch.id)}
                          style={{
                            padding: '8px 16px', borderRadius: 8, background: 'rgba(139,92,246,0.1)', color: LEODESSA_COLOR,
                            border: '1px solid rgba(139,92,246,0.2)', fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          İncele →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Henüz yüklenmiş bir dosya bulunmuyor.
              </div>
            )}
          </>
        ) : (
          activeBatch && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '12px 20px', background: 'rgba(139,92,246,0.06)', borderRadius: 14, border: '1px solid rgba(139,92,246,0.15)' }}>
                <span style={{ fontSize: '22px' }}>📂</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{activeBatch.fileName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(activeBatch.uploadDate).toLocaleString('tr-TR')} • {activeBatch.rows.length} satır
                  </div>
                </div>
              </div>

              {activeBatch.colMap && (
                <div style={{ marginBottom: 20, padding: '16px 20px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '11px', color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', fontWeight: 700, marginBottom: 12, letterSpacing: '0.06em' }}>
                    Sütun Eşleşmeleri
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {([
                      { key: 'adSoyad', label: 'Ad Soyad', col: activeBatch.colMap.adSoyad },
                      { key: 'ad', label: 'Ad', col: activeBatch.colMap.ad },
                      { key: 'soyad', label: 'Soyad', col: activeBatch.colMap.soyad },
                      { key: 'telefon', label: 'Telefon', col: activeBatch.colMap.telefon },
                      { key: 'email', label: 'E-posta', col: activeBatch.colMap.email },
                      { key: 'sehir', label: 'Şehir', col: activeBatch.colMap.sehir },
                      { key: 'kaynak', label: 'Kaynak', col: activeBatch.colMap.kaynak },
                    ] as { key: string; label: string; col: number | null }[]).map(item => (
                      <div key={item.key} style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: '12px', fontWeight: 600,
                        background: item.col !== null ? 'rgba(16,185,129,0.08)' : 'rgba(100,116,139,0.08)',
                        color: item.col !== null ? 'var(--accent-emerald)' : 'var(--text-muted)',
                        border: `1px solid ${item.col !== null ? 'rgba(16,185,129,0.2)' : 'rgba(100,116,139,0.15)'}`,
                      }}>
                        {item.col !== null ? '✓' : '—'} {item.label}
                        {item.col !== null && activeBatch.headers[item.col] && (
                          <span style={{ opacity: 0.7, fontWeight: 400, marginLeft: 4 }}>({activeBatch.headers[item.col]})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '20px 24px', marginBottom: 24, display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Hizmet Türü (Kalifikasyon Menüsü İçin)</label>
                  <select className="form-input" value={bulkService} onChange={e => setBulkService(e.target.value as ServiceKey)}>
                    {(Object.keys(services) as ServiceKey[]).map(key => (
                      <option key={key} value={key}>{services[key].icon} {services[key].name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: 4, textTransform: 'uppercase' }}>Varsayılan Kaynak (Excel'de bulunamazsa)</label>
                  <select className="form-input" value={bulkKaynak} onChange={e => setBulkKaynak(e.target.value)}>
                    {KAYNAK_LIST.map(k => <option key={k}>{k}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
                <div style={{ overflowX: 'auto', maxHeight: 800, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-elevated)' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, position: 'sticky', top: 0, background: 'var(--bg-elevated)' }}>#</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, position: 'sticky', top: 0, background: 'var(--bg-elevated)' }}>Müşteri</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, position: 'sticky', top: 0, background: 'var(--bg-elevated)' }}>İletişim</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, position: 'sticky', top: 0, background: 'var(--bg-elevated)' }}>Şehir</th>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, position: 'sticky', top: 0, background: 'var(--bg-elevated)' }}>Kaynak</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, position: 'sticky', top: 0, background: 'var(--bg-elevated)' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeBatch.rows.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Bu klasörde işlem yapılacak müşteri kalmadı.
                          </td>
                        </tr>
                      ) : (
                        activeBatch.rows.map((row, i) => {
                          const effectiveKaynak = row.kaynak || bulkKaynak;

                          return (
                            <tr key={row.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                              <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>{i + 1}</td>
                              <td style={{ padding: '12px 14px', fontWeight: 600 }}>{row.firstName} {row.lastName}</td>
                              <td style={{ padding: '12px 14px' }}>
                                <div style={{ color: 'var(--text-primary)' }}>{row.telefon || '—'}</div>
                                {row.email && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.email}</div>}
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>{row.sehir || '—'}</td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 10, background: 'rgba(139,92,246,0.08)', color: LEODESSA_COLOR, fontSize: '11px' }}>
                                  {effectiveKaynak}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                                <button
                                  onClick={() => handleTransfer(activeBatch.id, row)}
                                  style={{
                                    padding: '8px 16px', borderRadius: 8, background: `linear-gradient(135deg, ${LEODESSA_COLOR}, #8B5CF6)`,
                                    color: '#fff', fontSize: '13px', fontWeight: 700, border: 'none', cursor: 'pointer',
                                    boxShadow: '0 2px 8px rgba(139,92,246,0.3)',
                                  }}
                                >
                                  🚀 Kalifikasyona Aktar
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}
