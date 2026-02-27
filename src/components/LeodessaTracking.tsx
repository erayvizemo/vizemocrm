import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { services, ServiceKey } from '../data/leodessaServices';

const LEODESSA_COLOR = 'var(--accent-secondary)';

const SEHIR_LIST = [
  "Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin",
  "Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa",
  "Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan",
  "Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Isparta",
  "Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir",
  "Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla",
  "Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas",
  "Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak",
  "Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan",
  "Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce","Yurt Dışı","Diğer",
];

function getTemperatureInfo(score: number, disq: boolean) {
  if (disq) return { label: '❌ Diskalifiye', color: 'var(--accent-rose)', scoreDisplay: '✗' };
  if (score >= 70) return { label: '🔥 Çok Sıcak Lead', color: 'var(--accent-emerald)', scoreDisplay: String(score) };
  if (score >= 45) return { label: '⚡ Sıcak Lead', color: 'var(--accent-emerald)', scoreDisplay: String(score) };
  if (score >= 25) return { label: '🌡️ Ilık Lead', color: 'var(--accent-amber)', scoreDisplay: String(score) };
  if (score >= 10) return { label: '❄️ Soğuk Lead', color: 'var(--accent-rose)', scoreDisplay: String(score) };
  return { label: '— Başlanmadı —', color: 'var(--text-muted)', scoreDisplay: String(score) };
}

function getDisqMsg(disqReason: string) {
  const val = disqReason.split(':')[1];
  if (val === 'issiz') return 'İşsiz müşteri — finansal yeterlilik sağlanamıyor.';
  if (val === 'is_aramak') return "Avrupa'da iş aramak için oturum kartı başvurusu yapılamaz.";
  if (val === 'sabika_var') return 'Adli sicil kaydı var — İspanya oturum kartı başvurusu yapılamaz.';
  if (val === 'dusuk') return 'Gelir şartı karşılanmıyor — aylık minimum ~2.400€ gerekli.';
  if (val === 'ogrenci') return 'Öğrenci profili bu hizmet için uygun değildir.';
  return 'Bu müşteri profili mevcut başvuru kriterlerini karşılamıyor.';
}

function getActionInfo(score: number, disq: boolean) {
  if (disq) return {
    color: 'var(--accent-rose)', bg: 'rgba(244, 63, 94, 0.08)', border: 'rgba(244, 63, 94, 0.3)',
    title: '❌ Kaydı Kapat', canTransfer: false,
    items: ["Müşteriye durumu nazikçe açıklayın", "CRM'de \"Olumsuz\" olarak işaretleyin", 'Diskalifiye sebebini not alanına yazın', 'Satış ekibine aktarmayın'],
  };
  if (score >= 60) return {
    color: 'var(--accent-emerald)', bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.3)',
    title: '🔥 HEMEN Satış Ekibine Aktar!', canTransfer: true,
    items: ['Bu dakika satış ekibini ara veya canlı aktar', 'Fiyat teklifini hazır tut (kampanya fiyatı öner)', 'Gerekirse aynı gün randevu ayarla', 'Garanti Vize paketi de sunulabilir', "CRM'de \"Beklemede / Sıcak\" olarak işaretle"],
  };
  if (score >= 35) return {
    color: 'var(--accent-amber)', bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.3)',
    title: '⚡ Satış Ekibine İlet + Takip Planla', canTransfer: true,
    items: ['Satış ekibine detaylı brief ile aktar', '24 saat içinde takip araması yap', 'Fiyat bilgisi ver, düşünmesine izin ver', "CRM'de \"Beklemede\" olarak işaretle", 'E-posta ile bilgi dokümanı gönder'],
  };
  return {
    color: 'var(--accent-rose)', bg: 'rgba(244, 63, 94, 0.08)', border: 'rgba(244, 63, 94, 0.3)',
    title: '❄️ Soğuk Takip', canTransfer: true,
    items: ['1 hafta sonra takip araması planla', 'E-posta ile genel bilgi gönder', "CRM'de \"Yeni Lead\" olarak bırak", 'Karar aşamasına geldiğinde tekrar ara'],
  };
}

const alertColors: Record<string, { bg: string; border: string; color: string }> = {
  red: { bg: 'rgba(244, 63, 94, 0.1)', border: 'rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)' },
  green: { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', color: 'var(--accent-emerald)' },
  yellow: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', color: 'var(--accent-amber)' },
  blue: { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.3)', color: 'var(--accent-cyan)' },
};

export default function LeodessaTracking() {
  const { addLeodessaLead, setView } = useApp();

  // ── Lead identity (persistent across service changes) ──
  const [leadFirstName, setLeadFirstName] = useState('');
  const [leadLastName, setLeadLastName] = useState('');
  const [leadSehir, setLeadSehir] = useState('');
  const [leadTel, setLeadTel] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  // Computed full name for display
  const leadAd = [leadFirstName, leadLastName].filter(Boolean).join(' ');

  // ── Wizard state ──
  const [curSvc, setCurSvc] = useState<ServiceKey>('schengen');
  const [curStep, setCurStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [textAns, setTextAns] = useState<Record<string, string>>({});
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});

  // ── Transfer modal ──
  const [showTransfer, setShowTransfer] = useState(false);
  const [tAd, setTAd] = useState('');
  const [tTel, setTTel] = useState('');
  const [tEmail, setTEmail] = useState('');

  const svc = services[curSvc];
  const totalSteps = svc.steps.length;
  const isIntro = curStep === -1;
  const isResult = curStep >= totalSteps;

  // ── Score (derived) ──
  const score = useMemo(() => {
    let s = 0;
    svc.steps.forEach(st => st.questions.forEach(q => {
      if (q.options && answers[q.id]) {
        const o = q.options.find(x => x.value === answers[q.id]);
        if (o) s += o.score;
      }
    }));
    return s;
  }, [svc, answers]);

  // ── Disqualification (derived) ──
  const { disq, disqReason } = useMemo(() => {
    for (const step of svc.steps) {
      for (const q of step.questions) {
        if (q.options && answers[q.id]) {
          const o = q.options.find(x => x.value === answers[q.id]);
          if (o && o.cssClass === 'disqualify' && o.score <= -10) {
            return { disq: true, disqReason: q.id + ':' + o.value };
          }
        }
      }
    }
    return { disq: false, disqReason: '' };
  }, [svc, answers]);

  // ── Progress ──
  const progressPct = isResult ? 100
    : isIntro ? 0
      : Math.round(((curStep + 1) / totalSteps) * 100);
  const progressText = isResult ? `${totalSteps} / ${totalSteps}`
    : isIntro ? `0 / ${totalSteps}`
      : `${curStep + 1} / ${totalSteps}`;

  const tempInfo = getTemperatureInfo(score, disq);

  // ────────── Handlers ──────────

  function handleSelectService(key: ServiceKey) {
    setCurSvc(key);
    setCurStep(-1);
    setAnswers({});
    setNotes({});
    setTextAns({});
    setOpenNotes({});
  }

  function handleNext() {
    if (isIntro) {
      if (!leadFirstName.trim() || !leadTel.trim()) return;
      setCurStep(0);
      return;
    }
    if (disq) return;
    setCurStep(prev => prev + 1);
  }

  function handlePrev() {
    if (isIntro) return;
    if (curStep === 0) { setCurStep(-1); return; }
    setCurStep(prev => prev - 1);
  }

  function handleReset() {
    setCurStep(-1);
    setAnswers({});
    setNotes({});
    setTextAns({});
    setOpenNotes({});
    setLeadFirstName('');
    setLeadLastName('');
    setLeadSehir('');
    setLeadTel('');
    setLeadEmail('');
  }

  function handleClearDisq() {
    const qId = disqReason.split(':')[0];
    setAnswers(prev => { const n = { ...prev }; delete n[qId]; return n; });
  }

  function buildSummaryText() {
    let text = `=== VİZEMO LEAD ÖZET — ${svc.name} ===\n`;
    text += `Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}\n`;
    text += `Lead Skoru: ${score} — ${tempInfo.label}\n`;
    text += `Müşteri: ${leadAd} | ${leadTel}${leadEmail ? ` | ${leadEmail}` : ''}${leadSehir ? ` | ${leadSehir}` : ''}\n\n`;
    svc.steps.forEach(st => st.questions.forEach(q => {
      if (q.type === 'textarea') {
        const t = textAns[q.id];
        if (t?.trim()) text += `[${q.text}]\n${t}\n\n`;
      } else if (answers[q.id] && q.options) {
        const o = q.options.find(x => x.value === answers[q.id]);
        if (o) text += `${q.text}: ${o.label}\n`;
        if (notes[q.id]?.trim()) text += `  → Not: ${notes[q.id]}\n`;
        if (q.subFields && q.subFields.showOnValues.includes(answers[q.id])) {
          q.subFields.fields.forEach(sf => {
            const val = textAns[sf.id];
            if (val?.trim()) text += `  → ${sf.label}: ${val}\n`;
          });
        }
      }
    }));
    return text;
  }

  function openTransferModal() {
    setTAd(leadAd); // combined first + last name
    setTTel(leadTel);
    setTEmail(leadEmail);
    setShowTransfer(true);
  }

  function handleTransferSubmit() {
    if (!tAd.trim() || !tTel.trim()) return;
    const nameParts = tAd.trim().split(' ');
    addLeodessaLead({
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      telefon: tTel.trim(),
      email: tEmail.trim(),
      service: curSvc,
      serviceName: svc.name,
      serviceIcon: svc.icon,
      score,
      temperature: tempInfo.label,
      isDisqualified: disq,
      answers: { ...answers },
      notes: { ...notes },
      textAnswers: { ...textAns },
      summaryText: buildSummaryText(),
      status: 'new',
      crmTransferred: false,
    });
    setShowTransfer(false);
    setView('sdrDashboard');
  }

  // ────────── Render helpers ──────────

  function renderSidebar() {
    return (
      <aside style={{
        width: 320, minWidth: 320,
        background: 'var(--bg-surface)', borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0,
        padding: '24px 16px', zIndex: 10
      }}>
        {/* Branding */}
        <div style={{ marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '12px', fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.12em', color: LEODESSA_COLOR, fontWeight: 800, marginBottom: 6 }}>
            ✈ LEODESSA ASİSTAN
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Müşteri Kalifikasyon Akışı</div>
        </div>

        {/* Service select */}
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 12, paddingLeft: 12 }}>
          Hizmet Menüsü
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 32 }}>
          {(Object.keys(services) as ServiceKey[]).map(key => {
            const s = services[key];
            const isActive = curSvc === key;
            return (
              <button key={key} onClick={() => handleSelectService(key)} style={{
                padding: '12px 16px', borderRadius: 12,
                border: `1px solid ${isActive ? LEODESSA_COLOR : 'transparent'}`,
                background: isActive ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: 12
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ fontSize: '20px' }}>{s.icon}</div>
                <div style={{ fontSize: '14px', fontWeight: isActive ? 700 : 600, fontFamily: "'DM Sans', sans-serif", color: isActive ? LEODESSA_COLOR : 'var(--text-secondary)' }}>{s.name}</div>
              </button>
            );
          })}
        </div>

        {/* Customer info summary (shown once filled) */}
        {(leadFirstName || leadTel) && (
          <div style={{ padding: '16px', background: 'rgba(139, 92, 246, 0.05)', borderRadius: 12, border: `1px solid rgba(139, 92, 246, 0.2)`, marginBottom: 16 }}>
            <div style={{ fontSize: '10px', color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 700 }}>
              👤 Müşteri Kimliği
            </div>
            {leadAd && <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{leadAd}</div>}
            {leadSehir && <div style={{ fontSize: '12px', color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif", marginBottom: 2 }}>📍 {leadSehir}</div>}
            {leadTel && <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'Syne', sans-serif" }}>{leadTel}</div>}
          </div>
        )}

        {/* Score panel */}
        <div style={{ padding: '20px 16px', background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border-subtle)', marginBottom: 'auto' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, textAlign: 'center' }}>
            Anlık Lead Skoru
          </div>
          <div style={{ fontSize: '48px', fontWeight: 800, textAlign: 'center', color: tempInfo.color, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>
            {isIntro ? '—' : tempInfo.scoreDisplay}
          </div>
          <div style={{ fontSize: '12px', textAlign: 'center', color: isIntro ? 'var(--text-muted)' : tempInfo.color, fontWeight: 700, marginTop: 12, fontFamily: "'DM Sans', sans-serif" }}>
            {isIntro ? 'Henüz başlamadı' : tempInfo.label}
          </div>
        </div>

        {/* Progress */}
        <div style={{ padding: '20px 0 0', marginTop: 32, borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, fontWeight: 600 }}>
            <span>İlerleme Seviyesi</span>
            <span style={{ color: 'var(--text-primary)' }}>{progressText}</span>
          </div>
          <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: `linear-gradient(90deg, ${LEODESSA_COLOR}, #6366F1)`, borderRadius: 3, transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
          </div>
        </div>
      </aside>
    );
  }

  // ─── Intro step (step -1): collect Ad + Soyad + Şehir + Telefon ───
  function renderIntroStep() {
    const canProceed = leadFirstName.trim().length > 0 && leadTel.trim().length > 0;
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 32 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, background: 'rgba(139, 92, 246, 0.1)', border: `1px solid rgba(139, 92, 246, 0.3)`, borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', color: LEODESSA_COLOR, flexShrink: 0,
          }}>
            👤
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6, fontFamily: "'Syne', sans-serif" }}>Görüşme Başlangıcı</h2>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {svc.icon} <strong style={{ color: 'var(--text-primary)' }}>{svc.name}</strong> görüşmesine başlamadan önce temasa geçeceğiniz kişinin bilgilerini girin.
            </div>
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: 'var(--bg-card)', border: `1px solid var(--border-subtle)`,
          borderRadius: 16, padding: '32px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }}>
          <div style={{ fontSize: '12px', color: LEODESSA_COLOR, fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: LEODESSA_COLOR }} />
            Müşteri Kimlik Detayları
          </div>

          {/* Datalist for şehir autocomplete */}
          <datalist id="sehir-datalist">
            {SEHIR_LIST.map(s => <option key={s} value={s} />)}
          </datalist>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Ad + Soyad yan yana */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">
                  Ad <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input
                  className="form-input"
                  value={leadFirstName}
                  onChange={e => setLeadFirstName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && leadFirstName.trim()) (document.getElementById('intro-lastname') as HTMLInputElement)?.focus(); }}
                  placeholder="Örn: Ayşe"
                  autoFocus
                  style={{ fontSize: '16px', padding: '12px 16px' }}
                />
              </div>
              <div>
                <label className="form-label">
                  Soyad <span style={{ color: 'var(--text-muted)' }}>(isteğe bağlı)</span>
                </label>
                <input
                  id="intro-lastname"
                  className="form-input"
                  value={leadLastName}
                  onChange={e => setLeadLastName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') (document.getElementById('intro-sehir') as HTMLInputElement)?.focus(); }}
                  placeholder="Örn: Yılmaz"
                  style={{ fontSize: '16px', padding: '12px 16px' }}
                />
              </div>
            </div>

            {/* Şehir (autocomplete) */}
            <div>
              <label className="form-label">
                Şehir <span style={{ color: 'var(--text-muted)' }}>(isteğe bağlı)</span>
              </label>
              <input
                id="intro-sehir"
                className="form-input"
                list="sehir-datalist"
                value={leadSehir}
                onChange={e => setLeadSehir(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') (document.getElementById('intro-tel') as HTMLInputElement)?.focus(); }}
                placeholder="Şehir seçin veya yazın..."
                style={{ fontSize: '16px', padding: '12px 16px' }}
              />
            </div>

            {/* Telefon */}
            <div>
              <label className="form-label">
                Telefon <span style={{ color: 'var(--accent-rose)' }}>*</span>
              </label>
              <input
                id="intro-tel"
                className="form-input"
                value={leadTel}
                onChange={e => setLeadTel(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && leadTel.trim()) (document.getElementById('intro-email') as HTMLInputElement)?.focus(); }}
                placeholder="+90 5XX XXX XX XX"
                style={{ fontSize: '16px', padding: '12px 16px' }}
              />
            </div>

            {/* E-posta */}
            <div>
              <label className="form-label">
                E-posta <span style={{ color: 'var(--text-muted)' }}>(isteğe bağlı)</span>
              </label>
              <input
                id="intro-email"
                className="form-input"
                value={leadEmail}
                onChange={e => setLeadEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && canProceed) handleNext(); }}
                placeholder="ornek@mail.com"
                style={{ fontSize: '16px', padding: '12px 16px' }}
              />
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', gap: 16, marginTop: 32, alignItems: 'center' }}>
          <button
            className="btn-primary"
            onClick={handleNext}
            disabled={!canProceed}
            style={{
              padding: '14px 32px',
              background: canProceed ? `linear-gradient(135deg, ${LEODESSA_COLOR}, #8B5CF6)` : 'var(--bg-elevated)',
              boxShadow: canProceed ? `0 4px 20px rgba(168,85,247,0.3)` : 'none',
              color: canProceed ? '#fff' : 'var(--text-muted)',
              fontSize: '15px'
            }}
          >
            Görüşmeye Başla →
          </button>
          {!canProceed && (
            <span style={{ fontSize: '13px', color: 'var(--accent-rose)', fontWeight: 500 }}>
              * Ad ve Telefon girmelisiniz
            </span>
          )}
          <button
            className="btn-secondary"
            onClick={handleReset}
            style={{ marginLeft: 'auto', borderColor: 'rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)' }}
          >
            Sıfırla
          </button>
        </div>
      </div>
    );
  }

  // ─── Qualification step ───
  function renderStep() {
    if (isIntro) return renderIntroStep();
    if (isResult) return renderResult();

    const step = svc.steps[curStep];

    return (
      <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 16 }}>
        {/* Disq banner */}
        {disq && (
          <div style={{ background: 'rgba(244, 63, 94, 0.05)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: 16, padding: '24px', marginBottom: 32, textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: 12 }}>🚫</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-rose)', fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>Bu Lead Diskalifiye Edildi</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 20 }}>{getDisqMsg(disqReason)}</div>
            <button className="btn-secondary" onClick={handleClearDisq} style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244, 63, 94, 0.4)' }}>
              Yanıtı Değiştir ve Devam Et
            </button>
          </div>
        )}

        {/* Step header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: `linear-gradient(135deg, ${LEODESSA_COLOR}, #8B5CF6)`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '20px', fontFamily: "'Syne', sans-serif", color: '#fff', flexShrink: 0, boxShadow: `0 4px 16px rgba(168,85,247,0.3)` }}>
            {curStep + 1}
          </div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>{step.title}</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{step.hint}</div>
          </div>
        </div>

        {/* Questions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {step.questions.map((q, qi) => {
            const isAnswered = q.type === 'textarea' ? !!(textAns[q.id]?.trim()) : answers[q.id] !== undefined;
            const selectedAlert = q.alerts && answers[q.id] ? q.alerts[answers[q.id]] : null;
            const noteOpen = openNotes[q.id] || !!(notes[q.id]?.trim());

            return (
              <div key={q.id} style={{
                background: isAnswered ? 'rgba(255,255,255,0.02)' : 'var(--bg-card)',
                border: `1px solid ${isAnswered ? 'var(--border-glow)' : 'var(--border-subtle)'}`,
                borderRadius: 16, padding: '24px', transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: '11px', color: LEODESSA_COLOR, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'Syne', sans-serif" }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: LEODESSA_COLOR }} />
                  Soru {qi + 1} {q.required && <span style={{ color: 'var(--accent-rose)' }}>*</span>}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{q.text}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: 20, padding: '10px 14px', background: 'var(--bg-elevated)', borderLeft: `3px solid ${LEODESSA_COLOR}`, borderRadius: '0 8px 8px 0', lineHeight: 1.5 }}>
                  {q.script}
                </div>

                {q.type === 'options' && q.options && (
                  <>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                      {q.options.map(opt => {
                        const isSelected = answers[q.id] === opt.value;
                        const cls = opt.cssClass;
                        const scoreStr = opt.score > 0 ? `+${opt.score}` : opt.score < 0 ? `${opt.score}` : '0';
                        let btnBg = isSelected ? 'rgba(168,85,247,0.1)' : 'var(--bg-elevated)';
                        let btnBorder = isSelected ? LEODESSA_COLOR : 'var(--border-subtle)';
                        let btnColor = isSelected ? LEODESSA_COLOR : 'var(--text-secondary)';

                        if (cls === 'disqualify') {
                          btnBg = isSelected ? 'rgba(244, 63, 94, 0.1)' : 'var(--bg-elevated)';
                          btnBorder = isSelected ? 'var(--accent-rose)' : 'var(--border-subtle)';
                          btnColor = isSelected ? 'var(--accent-rose)' : 'var(--text-secondary)';
                        } else if (cls === 'boost') {
                          btnBorder = isSelected ? 'var(--accent-emerald)' : 'rgba(16, 185, 129, 0.3)';
                          btnColor = isSelected ? 'var(--accent-emerald)' : 'var(--text-secondary)';
                          if (isSelected) { btnBg = 'rgba(16, 185, 129, 0.1)'; }
                        }
                        return (
                          <button key={opt.value} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.value }))} style={{
                            padding: '10px 16px', borderRadius: 10, border: `1px solid ${btnBorder}`,
                            background: btnBg, color: btnColor, fontSize: '14px', cursor: 'pointer',
                            transition: 'all 0.15s', fontWeight: isSelected ? 600 : 500,
                            display: 'flex', alignItems: 'center', gap: 8,
                          }}
                            onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = btnColor; }}
                            onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = btnBorder; }}
                          >
                            {opt.label}
                            <span style={{ fontSize: '11px', fontFamily: "'Syne', sans-serif", fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: 'rgba(0,0,0,0.2)' }}>{scoreStr}</span>
                          </button>
                        );
                      })}
                    </div>
                    {selectedAlert && (() => {
                      const ac = alertColors[selectedAlert.type] ?? alertColors.blue;
                      return (
                        <div style={{ padding: '12px 16px', borderRadius: 10, fontSize: '13px', background: ac.bg, border: `1px solid ${ac.border}`, color: ac.color, marginBottom: 12, lineHeight: 1.5, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '16px' }}>ℹ️</span>
                          <span style={{ paddingTop: 2 }}>{selectedAlert.text}</span>
                        </div>
                      );
                    })()}
                    {q.subFields && answers[q.id] && q.subFields.showOnValues.includes(answers[q.id]) && (
                      <div style={{ padding: '20px', borderRadius: 12, background: 'rgba(245, 158, 11, 0.03)', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: 16 }}>
                        <div style={{ fontSize: '11px', color: 'var(--accent-amber)', fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 16 }}>
                          📋 Ek Bilgiler Gerekiyor
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          {q.subFields.fields.map(sf => (
                            <div key={sf.id}>
                              <label className="form-label">{sf.label}</label>
                              <input
                                className="form-input"
                                value={textAns[sf.id] ?? ''}
                                onChange={e => setTextAns(prev => ({ ...prev, [sf.id]: e.target.value }))}
                                placeholder={sf.placeholder ?? ''}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {q.hasNote && (
                      <div style={{ marginTop: 12 }}>
                        <button onClick={() => setOpenNotes(prev => ({ ...prev, [q.id]: !prev[q.id] }))} style={{ fontSize: '12px', color: noteOpen ? LEODESSA_COLOR : 'var(--text-muted)', background: 'transparent', border: `1px dashed ${noteOpen ? LEODESSA_COLOR : 'var(--border-subtle)'}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', fontWeight: 600 }}>
                          ✏️ {noteOpen ? 'Manuel Notu Gizle' : 'Özel Not Ekle'}
                        </button>
                        {noteOpen && (
                          <textarea className="form-input" value={notes[q.id] ?? ''} onChange={e => setNotes(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder="Bu soruyla ilgili müşterinin belirttiği ekstra detaylar..." style={{ display: 'block', marginTop: 12, minHeight: 80 }} />
                        )}
                      </div>
                    )}
                  </>
                )}

                {q.type === 'textarea' && (
                  <textarea className="form-input" value={textAns[q.id] ?? ''} onChange={e => setTextAns(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder={q.placeholder ?? ''} style={{ minHeight: 120 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 12, marginTop: 32, paddingBottom: 64, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={handlePrev} style={{ padding: '12px 24px', fontSize: '14px' }}>
            ← Geri Dön
          </button>
          <button className="btn-primary" onClick={handleNext} disabled={disq} style={{ padding: '12px 32px', background: disq ? 'var(--bg-elevated)' : `linear-gradient(135deg, ${LEODESSA_COLOR}, #8B5CF6)`, color: disq ? 'var(--text-muted)' : '#fff', opacity: disq ? 0.5 : 1, fontSize: '15px' }}>
            Sonraki Adım →
          </button>
          <button className="btn-secondary" onClick={handleReset} style={{ marginLeft: 'auto', padding: '12px 24px', borderColor: 'rgba(244, 63, 94, 0.3)', color: 'var(--accent-rose)' }}>
            Sıfırla
          </button>
        </div>
      </div>
    );
  }

  // ─── Result page ───
  function renderResult() {
    const action = getActionInfo(score, disq);
    const summaryItems: { label: string; value: string; isNote?: boolean }[] = [];
    svc.steps.forEach(st => st.questions.forEach(q => {
      if (q.type === 'textarea') {
        const t = textAns[q.id];
        if (t?.trim()) summaryItems.push({ label: `📝 ${q.text}`, value: t, isNote: true });
      } else if (answers[q.id] && q.options) {
        const o = q.options.find(x => x.value === answers[q.id]);
        if (o) {
          summaryItems.push({ label: q.text, value: o.label });
          if (notes[q.id]?.trim()) summaryItems.push({ label: `✏️ Ek Not: ${q.text}`, value: notes[q.id], isNote: true });
          if (q.subFields && q.subFields.showOnValues.includes(answers[q.id])) {
            q.subFields.fields.forEach(sf => {
              const val = textAns[sf.id];
              if (val?.trim()) summaryItems.push({ label: `📋 ${sf.label}`, value: val });
            });
          }
        }
      }
    }));

    return (
      <div style={{ maxWidth: 760, margin: '0 auto', paddingTop: 16, paddingBottom: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <div style={{ width: 48, height: 48, background: 'var(--accent-emerald)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '24px', color: '#fff', flexShrink: 0, boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)' }}>✓</div>
          <div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif", marginBottom: 6 }}>Görüşme Tamamlandı</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{svc.name} — Lead kalifikasyon sonucu ve önerilen aksiyonlar</div>
          </div>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 20, padding: '32px' }}>
          {/* Müşteri + Skor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
            <div style={{ fontSize: '64px', fontWeight: 800, color: tempInfo.color, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}>{tempInfo.scoreDisplay}</div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: tempInfo.color, fontFamily: "'Syne', sans-serif", marginBottom: 4 }}>{tempInfo.label}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '2px 8px', borderRadius: 4, background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>{svc.name}</span>
                <span>{leadAd}</span>
                <span style={{ opacity: 0.5 }}>|</span>
                <span style={{ fontFamily: "'DM Sans', sans-serif" }}>{leadTel}</span>
              </div>
            </div>
          </div>

          <div style={{ padding: '24px', borderRadius: 16, border: `1px solid ${action.border}`, background: action.bg, marginBottom: 32 }}>
            <div style={{ fontSize: '14px', fontFamily: "'Syne', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, color: action.color, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: action.color }} />
              Önerilen Aksiyon Planı
            </div>
            <ul style={{ paddingLeft: 24, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {action.items.map((item, i) => <li key={i} style={{ fontSize: '14px', color: action.color, fontWeight: 500 }}>{item}</li>)}
            </ul>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
              Detaylı Görüşme Özeti
            </div>
            <button onClick={() => { const t = buildSummaryText(); navigator.clipboard?.writeText(t).catch(() => { }); }} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px', background: 'rgba(139, 92, 246, 0.1)', color: LEODESSA_COLOR, borderColor: 'rgba(139, 92, 246, 0.3)' }}>
              📋 Metni Kopyala
            </button>
          </div>

          {summaryItems.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {summaryItems.map((item, i) => (
                <div key={i} style={{ background: item.isNote ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-elevated)', borderRadius: 12, padding: '16px 20px', border: `1px solid ${item.isNote ? 'rgba(245, 158, 11, 0.2)' : 'var(--border-subtle)'}` }}>
                  <div style={{ fontSize: '11px', color: item.isNote ? 'var(--accent-amber)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>{item.label}</div>
                  <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{item.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'center', padding: '32px', background: 'var(--bg-elevated)', borderRadius: 12 }}>Seçilmiş yanıt yok.</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 32, alignItems: 'center' }}>
          <button className="btn-secondary" onClick={handlePrev} style={{ padding: '12px 24px', fontSize: '14px' }}>← Geri Dön</button>
          <button className="btn-secondary" onClick={handleReset} style={{ padding: '12px 24px', fontSize: '14px', borderColor: 'var(--accent-secondary)', color: 'var(--accent-secondary)' }}>🆕 Yeni Görüşme Başlat</button>
          <button className="btn-primary" onClick={openTransferModal} style={{ marginLeft: 'auto', padding: '14px 32px', background: `linear-gradient(135deg, ${LEODESSA_COLOR}, #6366F1)`, fontSize: '15px' }}>
            ⭐ Leodessa Yapay Zeka Havuzuna Kaydet
          </button>
        </div>
      </div>
    );
  }

  // ─── Transfer modal ───
  function renderTransferModal() {
    const canSubmit = tAd.trim() && tTel.trim();
    return (
      <div className="modal-overlay" onClick={() => setShowTransfer(false)}>
        <div className="modal-content" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif", marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: LEODESSA_COLOR, boxShadow: `0 0 10px ${LEODESSA_COLOR}` }} />
            Lead Havuzuna Kaydet
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 24 }}>
            {svc.icon} <strong style={{ color: 'var(--text-primary)' }}>{svc.name}</strong> görüşme sonucu
            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: 'var(--bg-elevated)', marginLeft: 8, border: '1px solid var(--border-subtle)' }}>{tempInfo.scoreDisplay} puan</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="form-label">Ad Soyad <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
              <input className="form-input" value={tAd} onChange={e => setTAd(e.target.value)} placeholder="Müşterinin adı soyadı" autoFocus />
            </div>
            <div>
              <label className="form-label">Telefon <span style={{ color: 'var(--accent-rose)' }}>*</span></label>
              <input className="form-input" value={tTel} onChange={e => setTTel(e.target.value)} placeholder="05XX XXX XX XX" />
            </div>
            <div>
              <label className="form-label">E-posta <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(isteğe bağlı)</span></label>
              <input className="form-input" value={tEmail} onChange={e => setTEmail(e.target.value)} placeholder="ornek@mail.com" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 32, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 24 }}>
            <button className="btn-secondary" onClick={() => setShowTransfer(false)}>İptal</button>
            <button className="btn-primary" onClick={handleTransferSubmit} disabled={!canSubmit} style={{
              background: canSubmit ? `linear-gradient(135deg, ${LEODESSA_COLOR}, #8B5CF6)` : 'var(--bg-elevated)',
              boxShadow: canSubmit ? `0 4px 16px rgba(168,85,247,0.3)` : 'none',
              color: canSubmit ? '#fff' : 'var(--text-muted)',
            }}>
              Kaydet & Havuza Git
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ────────── Main render ──────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-void)' }}>
      {renderSidebar()}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        {renderStep()}
      </div>
      {showTransfer && renderTransferModal()}
    </div>
  );
}
