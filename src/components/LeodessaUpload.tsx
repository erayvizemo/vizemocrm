import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { services, ServiceKey } from '../data/leodessaServices';

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

export default function LeodessaUpload() {
  const { addLeodessaLead, leodessaLeads, setView } = useApp();

  // Form state
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

  const tempLabel = getTemperatureLabel(score);
  const scoreColor = getScoreColor(score);
  const canSubmit = firstName.trim() && telefon.trim() && salesConsultant.trim();

  function handleSubmit() {
    if (!canSubmit) {
      alert('Ad, Telefon ve Satış Danışmanı zorunludur.');
      return;
    }

    const svc = services[service];

    const summaryLines = [
      `=== MANUEL LEAD GİRİŞİ — ${svc.name} ===`,
      `Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`,
      `Lead Skoru: ${score} — ${tempLabel}`,
      `Müşteri: ${firstName.trim()} ${lastName.trim()} | ${telefon.trim()}${email.trim() ? ` | ${email.trim()}` : ''}${sehir ? ` | ${sehir}` : ''}`,
      `Kaynak: ${kaynak}`,
      `Satış Danışmanı: ${salesConsultant.trim()}`,
      '',
      notlar.trim() ? `Notlar:\n${notlar.trim()}` : '',
    ].filter(l => l !== '').join('\n');

    addLeodessaLead({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      telefon: telefon.trim(),
      email: email.trim(),
      service,
      serviceName: svc.name,
      serviceIcon: svc.icon,
      score,
      temperature: tempLabel,
      isDisqualified: false,
      answers: {},
      notes: {},
      textAnswers: {},
      summaryText: summaryLines,
      status: 'new',
      crmTransferred: false,
      salesConsultant: salesConsultant.trim(),
      kaynak,
      sehir,
    });

    setAddedCount(p => p + 1);

    // Reset fields that change per-lead, keep consultant/source/service for batch entry
    setFirstName('');
    setLastName('');
    setTelefon('');
    setEmail('');
    setSehir('');
    setScore(30);
    setNotlar('');

    // Focus back on first name for fast batch entry
    setTimeout(() => (document.getElementById('upload-firstname') as HTMLInputElement)?.focus(), 50);
  }

  // Recent leads added to LeodessaLeads pool (last 8)
  const recentLeads = leodessaLeads.slice(0, 8);

  return (
    <div style={{ padding: '32px 32px 64px', minHeight: '100vh', background: 'var(--bg-void)' }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: LEODESSA_COLOR, boxShadow: `0 0 12px ${LEODESSA_COLOR}` }} />
          <h1 style={{ fontSize: '28px', color: LEODESSA_COLOR, margin: 0 }}>Manuel Lead Girişi</h1>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: "'DM Sans', sans-serif", maxWidth: 600 }}>
          Google Ads / Meta Ads kampanyalarından gelen lead verilerini sisteme manuel olarak girin.
          Her kayıt, <strong style={{ color: 'var(--text-secondary)' }}>Leodessa Akıllı Lead Havuzu</strong>'na düşer ve SDR ekibi tarafından işlenir.
        </div>

        {/* Info bar */}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

        {/* Form */}
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

            {/* ★ Satış Danışmanı - KEY FIELD */}
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
              <input
                type="range"
                min={0} max={100} step={5}
                value={score}
                onChange={e => setScore(Number(e.target.value))}
                style={{ width: '100%', accentColor: scoreColor, height: 6 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-muted)', marginTop: 4, fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
                <span>❄️ Soğuk (0)</span>
                <span>🌡️ Ilık (25)</span>
                <span>⚡ Sıcak (45)</span>
                <span>🔥 Çok Sıcak (70)</span>
              </div>
            </div>

            {/* Notlar */}
            <FormField label="Notlar / Özet">
              <textarea
                className="form-input"
                value={notlar}
                onChange={e => setNotlar(e.target.value)}
                placeholder="Reklamdan gelen müşteri notu, kampanya adı, özel bilgiler..."
                style={{ minHeight: 96 }}
              />
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

        {/* Right column: Recent leads + stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Score guide */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '20px' }}>
            <div style={{ fontSize: '11px', color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 16 }}>
              Lead Skor Rehberi
            </div>
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
            <div style={{ fontSize: '11px', color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 16 }}>
              Son Eklenen Leadler
            </div>
            {recentLeads.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>
                Henüz lead yok.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentLeads.map(lead => {
                  const sc = getScoreColor(lead.score);
                  return (
                    <div key={lead.id} style={{
                      padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 10,
                      border: `1px solid var(--border-subtle)`,
                      borderLeft: `3px solid ${sc}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {lead.firstName} {lead.lastName}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 2 }}>
                            {lead.telefon} {lead.salesConsultant ? `· 👤 ${lead.salesConsultant}` : ''}
                          </div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 2 }}>
                            {lead.serviceIcon} {lead.serviceName} {lead.kaynak ? `· ${lead.kaynak}` : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: 800, color: sc, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{lead.score}</div>
                          <div style={{ fontSize: '9px', color: sc, fontWeight: 600, marginTop: 2 }}>puan</div>
                        </div>
                      </div>
                      {lead.crmTransferred && (
                        <div style={{ fontSize: '10px', color: 'var(--accent-primary)', marginTop: 6, fontWeight: 600 }}>✅ CRM'e Aktarıldı</div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={() => setView('leodessaLeads')}
                  style={{ marginTop: 4, padding: '8px', fontSize: '12px', fontWeight: 600, color: LEODESSA_COLOR, background: 'transparent', border: `1px dashed rgba(139,92,246,0.3)`, borderRadius: 8, cursor: 'pointer' }}
                >
                  Tüm leadleri gör →
                </button>
              </div>
            )}
          </div>

          {/* Flow guide */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '20px' }}>
            <div style={{ fontSize: '11px', color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 16 }}>
              Lead Akış Süreci
            </div>
            {[
              { step: '1', label: 'Lead Girişi', desc: 'Bu form üzerinden eklenir', color: LEODESSA_COLOR },
              { step: '2', label: 'Lead Havuzu', desc: 'Akıllı Lead Havuzu\'nda bekler', color: 'var(--accent-amber)' },
              { step: '3', label: 'CRM\'e Aktar', desc: 'SDR Dashboard\'a gönderilir', color: 'var(--accent-primary)' },
              { step: '4', label: 'Vizemo\'ya Devir', desc: 'Pipeline ile Vizemo ekibine geçer', color: 'var(--accent-emerald)' },
            ].map((item, i) => (
              <div key={item.step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < 3 ? 14 : 0 }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${item.color}20`, border: `1px solid ${item.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '11px', fontWeight: 800, color: item.color, fontFamily: "'Syne', sans-serif" }}>
                  {item.step}
                </div>
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
    </div>
  );
}
