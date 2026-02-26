import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { services, ServiceKey } from '../data/leodessaServices';

const LEODESSA_COLOR = '#a855f7';

function getTemperatureInfo(score: number, disq: boolean) {
  if (disq) return { label: '❌ Diskalifiye', color: '#ef4444', scoreDisplay: '✗' };
  if (score >= 70) return { label: '🔥 Çok Sıcak Lead', color: '#22c55e', scoreDisplay: String(score) };
  if (score >= 45) return { label: '⚡ Sıcak Lead', color: '#22c55e', scoreDisplay: String(score) };
  if (score >= 25) return { label: '🌡️ Ilık Lead', color: '#f59e0b', scoreDisplay: String(score) };
  if (score >= 10) return { label: '❄️ Soğuk Lead', color: '#ef4444', scoreDisplay: String(score) };
  return { label: '— Başlanmadı —', color: '#64748b', scoreDisplay: String(score) };
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
    color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)',
    title: '❌ Kaydı Kapat', canTransfer: false,
    items: ["Müşteriye durumu nazikçe açıklayın", "CRM'de \"Olumsuz\" olarak işaretleyin", 'Diskalifiye sebebini not alanına yazın', 'Satış ekibine aktarmayın'],
  };
  if (score >= 60) return {
    color: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)',
    title: '🔥 HEMEN Satış Ekibine Aktar!', canTransfer: true,
    items: ['Bu dakika satış ekibini ara veya canlı aktar', 'Fiyat teklifini hazır tut (kampanya fiyatı öner)', 'Gerekirse aynı gün randevu ayarla', 'Garanti Vize paketi de sunulabilir', "CRM'de \"Beklemede / Sıcak\" olarak işaretle"],
  };
  if (score >= 35) return {
    color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)',
    title: '⚡ Satış Ekibine İlet + Takip Planla', canTransfer: true,
    items: ['Satış ekibine detaylı brief ile aktar', '24 saat içinde takip araması yap', 'Fiyat bilgisi ver, düşünmesine izin ver', "CRM'de \"Beklemede\" olarak işaretle", 'E-posta ile bilgi dokümanı gönder'],
  };
  return {
    color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)',
    title: '❄️ Soğuk Takip', canTransfer: true,
    items: ['1 hafta sonra takip araması planla', 'E-posta ile genel bilgi gönder', "CRM'de \"Yeni Lead\" olarak bırak", 'Karar aşamasına geldiğinde tekrar ara'],
  };
}

const alertColors: Record<string, { bg: string; border: string; color: string }> = {
  red:    { bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.3)',   color: '#fca5a5' },
  green:  { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.3)',   color: '#86efac' },
  yellow: { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.3)',  color: '#fde68a' },
  blue:   { bg: 'rgba(59,130,246,0.08)',  border: 'rgba(59,130,246,0.3)',  color: '#93c5fd' },
};

// ────── small reusable input style ──────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 13px',
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: '0.85rem',
  outline: 'none', fontFamily: 'inherit',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.68rem', fontWeight: 700,
  fontFamily: "'IBM Plex Mono', monospace",
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--muted)', marginBottom: 5,
};

export default function LeodessaTracking() {
  const { addLeodessaLead, setView } = useApp();

  // ── Lead identity (persistent across service changes) ──
  const [leadAd, setLeadAd]       = useState('');
  const [leadTel, setLeadTel]     = useState('');
  const [leadEmail, setLeadEmail] = useState('');

  // ── Wizard state ──
  // curStep = -1  →  intro (name/phone collection)
  // curStep ≥ 0   →  qualification steps
  // curStep >= totalSteps → result page
  const [curSvc, setCurSvc]       = useState<ServiceKey>('schengen');
  const [curStep, setCurStep]     = useState(-1);
  const [answers, setAnswers]     = useState<Record<string, string>>({});
  const [notes, setNotes]         = useState<Record<string, string>>({});
  const [textAns, setTextAns]     = useState<Record<string, string>>({});
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});

  // ── Transfer modal ──
  const [showTransfer, setShowTransfer] = useState(false);
  const [tAd, setTAd]     = useState('');
  const [tTel, setTTel]   = useState('');
  const [tEmail, setTEmail] = useState('');

  const svc        = services[curSvc];
  const totalSteps = svc.steps.length;
  const isIntro    = curStep === -1;
  const isResult   = curStep >= totalSteps;

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
    setCurStep(-1);          // back to intro (keep contact info)
    setAnswers({});
    setNotes({});
    setTextAns({});
    setOpenNotes({});
  }

  function handleNext() {
    if (isIntro) {
      if (!leadAd.trim() || !leadTel.trim()) return; // guard
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
    setLeadAd('');
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
    text += `Müşteri: ${leadAd} | ${leadTel}${leadEmail ? ` | ${leadEmail}` : ''}\n\n`;
    svc.steps.forEach(st => st.questions.forEach(q => {
      if (q.type === 'textarea') {
        const t = textAns[q.id];
        if (t?.trim()) text += `[${q.text}]\n${t}\n\n`;
      } else if (answers[q.id] && q.options) {
        const o = q.options.find(x => x.value === answers[q.id]);
        if (o) text += `${q.text}: ${o.label}\n`;
        if (notes[q.id]?.trim()) text += `  → Not: ${notes[q.id]}\n`;
      }
    }));
    return text;
  }

  function openTransferModal() {
    setTAd(leadAd);
    setTTel(leadTel);
    setTEmail(leadEmail);
    setShowTransfer(true);
  }

  function handleTransferSubmit() {
    if (!tAd.trim() || !tTel.trim()) return;
    addLeodessaLead({
      ad: tAd.trim(),
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
    setView('leodessaLeads');
  }

  // ────────── Render helpers ──────────

  function renderSidebar() {
    return (
      <aside style={{
        width: 270, minWidth: 270,
        background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0,
      }}>
        {/* Branding */}
        <div style={{ padding: '18px 16px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.65rem', fontFamily: "'IBM Plex Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.1em', color: LEODESSA_COLOR, fontWeight: 700, marginBottom: 3 }}>
            ✈ LEODESSA
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Lead Kalifikasyon Sistemi</div>
        </div>

        {/* Service select */}
        <div style={{ padding: '10px 16px 5px', fontSize: '0.6rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
          Hizmet Seçin
        </div>
        {(Object.keys(services) as ServiceKey[]).map(key => {
          const s = services[key];
          const isActive = curSvc === key;
          return (
            <button key={key} onClick={() => handleSelectService(key)} style={{
              margin: '3px 10px', padding: '10px 12px', borderRadius: 10,
              border: `1px solid ${isActive ? LEODESSA_COLOR : 'var(--border)'}`,
              background: isActive ? `${LEODESSA_COLOR}18` : 'transparent',
              cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: '1.1rem', marginBottom: 3 }}>{s.icon}</div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isActive ? LEODESSA_COLOR : 'var(--text)', lineHeight: 1.3 }}>{s.name}</div>
            </button>
          );
        })}

        {/* Customer info summary (shown once filled) */}
        {(leadAd || leadTel) && (
          <div style={{ margin: '10px 10px 0', padding: '10px 12px', background: `${LEODESSA_COLOR}0d`, borderRadius: 10, border: `1px solid ${LEODESSA_COLOR}30` }}>
            <div style={{ fontSize: '0.6rem', color: LEODESSA_COLOR, fontFamily: "'IBM Plex Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 700 }}>
              👤 Müşteri
            </div>
            {leadAd && <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{leadAd}</div>}
            {leadTel && <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono',monospace" }}>{leadTel}</div>}
          </div>
        )}

        {/* Score panel */}
        <div style={{ margin: '10px 10px 0', padding: '12px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.6rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Lead Skoru</div>
          <div style={{ fontSize: '2.4rem', fontWeight: 800, textAlign: 'center', color: tempInfo.color, fontFamily: "'IBM Plex Mono',monospace" }}>
            {isIntro ? '—' : tempInfo.scoreDisplay}
          </div>
          <div style={{ fontSize: '0.72rem', textAlign: 'center', color: isIntro ? 'var(--muted)' : tempInfo.color, fontWeight: 600, marginTop: 4, fontFamily: "'IBM Plex Mono',monospace" }}>
            {isIntro ? '— Başlanmadı —' : tempInfo.label}
          </div>
        </div>

        {/* Progress */}
        <div style={{ padding: '14px 16px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono',monospace", marginBottom: 6 }}>
            <span>İlerleme</span>
            <span>{progressText}</span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: `linear-gradient(90deg,${LEODESSA_COLOR},#c084fc)`, borderRadius: 3, transition: 'width 0.4s' }} />
          </div>
        </div>
      </aside>
    );
  }

  // ─── Intro step (step -1): collect Ad Soyad + Telefon ───
  function renderIntroStep() {
    const canProceed = leadAd.trim().length > 0 && leadTel.trim().length > 0;
    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{
            width: 36, height: 36, background: LEODESSA_COLOR, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', color: '#fff', flexShrink: 0,
          }}>
            👤
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Müşteri Bilgileri</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: 2 }}>
              {svc.icon} {svc.name} — Görüşmeye başlamadan önce müşteri bilgilerini girin
            </div>
          </div>
        </div>

        {/* Form card */}
        <div style={{
          background: 'var(--bg)', border: `1px solid ${LEODESSA_COLOR}33`,
          borderRadius: 12, padding: '22px 22px 18px',
        }}>
          <div style={{ fontSize: '0.62rem', color: LEODESSA_COLOR, fontFamily: "'IBM Plex Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 18 }}>
            {svc.icon} Müşteri Kimlik Bilgileri
          </div>

          {/* Ad Soyad */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>
              Ad Soyad <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              value={leadAd}
              onChange={e => setLeadAd(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && leadAd.trim()) (document.getElementById('intro-tel') as HTMLInputElement)?.focus(); }}
              placeholder="Müşterinin adı ve soyadı"
              autoFocus
              style={inputStyle}
            />
          </div>

          {/* Telefon */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>
              Telefon <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              id="intro-tel"
              value={leadTel}
              onChange={e => setLeadTel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && leadTel.trim()) (document.getElementById('intro-email') as HTMLInputElement)?.focus(); }}
              placeholder="05XX XXX XX XX"
              style={inputStyle}
            />
          </div>

          {/* E-posta */}
          <div>
            <label style={labelStyle}>
              E-posta <span style={{ color: 'var(--muted)', fontSize: '0.6rem' }}>(isteğe bağlı)</span>
            </label>
            <input
              id="intro-email"
              value={leadEmail}
              onChange={e => setLeadEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && canProceed) handleNext(); }}
              placeholder="ornek@mail.com"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Nav */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, alignItems: 'center' }}>
          <button
            onClick={handleNext}
            disabled={!canProceed}
            style={{
              padding: '11px 28px',
              background: canProceed ? LEODESSA_COLOR : 'rgba(168,85,247,0.25)',
              border: 'none', borderRadius: 8, color: '#fff',
              cursor: canProceed ? 'pointer' : 'not-allowed',
              fontSize: '0.88rem', fontWeight: 700,
              opacity: canProceed ? 1 : 0.6,
            }}
          >
            Görüşmeye Başla →
          </button>
          {!canProceed && (
            <span style={{ fontSize: '0.74rem', color: 'var(--muted)', fontStyle: 'italic' }}>
              Ad Soyad ve Telefon zorunlu
            </span>
          )}
          <button
            onClick={handleReset}
            style={{ marginLeft: 'auto', padding: '10px 16px', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, color: '#ef4444', cursor: 'pointer', fontSize: '0.82rem' }}
          >
            🔄 Temizle
          </button>
        </div>
      </div>
    );
  }

  // ─── Qualification step ───
  function renderStep() {
    if (isIntro)  return renderIntroStep();
    if (isResult) return renderResult();

    const step = svc.steps[curStep];

    return (
      <div>
        {/* Disq banner */}
        {disq && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '2px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: '20px 22px', marginBottom: 20, textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: 6 }}>🚫</div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ef4444', marginBottom: 6 }}>Bu Lead Diskalifiye Edildi</div>
            <div style={{ fontSize: '0.82rem', color: '#fca5a5', marginBottom: 14 }}>{getDisqMsg(disqReason)}</div>
            <button onClick={handleClearDisq} style={{ padding: '8px 18px', background: 'transparent', border: '1px solid rgba(239,68,68,0.5)', borderRadius: 8, color: '#fca5a5', cursor: 'pointer', fontSize: '0.82rem' }}>
              Yanıtı Değiştir
            </button>
          </div>
        )}

        {/* Customer info mini-bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '8px 14px', background: `${LEODESSA_COLOR}0d`, borderRadius: 8, border: `1px solid ${LEODESSA_COLOR}22` }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: LEODESSA_COLOR }}>👤 {leadAd}</span>
          <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono',monospace" }}>{leadTel}</span>
          {leadEmail && <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono',monospace" }}>✉ {leadEmail}</span>}
          <button
            onClick={() => setCurStep(-1)}
            style={{ marginLeft: 'auto', fontSize: '0.65rem', color: 'var(--muted)', background: 'transparent', border: '1px dashed var(--border)', borderRadius: 5, padding: '2px 8px', cursor: 'pointer' }}
          >
            ✏️ Düzenle
          </button>
        </div>

        {/* Step header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, background: LEODESSA_COLOR, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#fff', flexShrink: 0 }}>
            {curStep + 1}
          </div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{step.title}</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: 2 }}>{step.hint}</div>
          </div>
        </div>

        {/* Questions */}
        {step.questions.map((q, qi) => {
          const isAnswered = q.type === 'textarea' ? !!(textAns[q.id]?.trim()) : answers[q.id] !== undefined;
          const selectedAlert = q.alerts && answers[q.id] ? q.alerts[answers[q.id]] : null;
          const noteOpen = openNotes[q.id] || !!(notes[q.id]?.trim());

          return (
            <div key={q.id} style={{
              background: isAnswered ? 'var(--surface)' : 'var(--bg)',
              border: `1px solid ${isAnswered ? `${LEODESSA_COLOR}33` : 'var(--border)'}`,
              borderRadius: 12, padding: '18px 20px', marginBottom: 14, transition: 'border-color 0.2s',
            }}>
              <div style={{ fontSize: '0.62rem', color: LEODESSA_COLOR, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8, fontFamily: "'IBM Plex Mono',monospace" }}>
                {svc.icon} Soru {qi + 1}
                {q.required && <span style={{ color: '#ef4444' }}>*Zorunlu</span>}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{q.text}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--muted)', fontStyle: 'italic', marginBottom: 12, padding: '7px 11px', background: 'rgba(0,0,0,0.2)', borderLeft: `3px solid ${LEODESSA_COLOR}66`, borderRadius: '0 6px 6px 0', lineHeight: 1.5 }}>
                {q.script}
              </div>

              {q.type === 'options' && q.options && (
                <>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                    {q.options.map(opt => {
                      const isSelected = answers[q.id] === opt.value;
                      const cls = opt.cssClass;
                      const scoreStr = opt.score > 0 ? `+${opt.score}` : opt.score < 0 ? `${opt.score}` : '0';
                      let btnBg = isSelected ? `${LEODESSA_COLOR}18` : 'transparent';
                      let btnBorder = isSelected ? LEODESSA_COLOR : 'var(--border)';
                      let btnColor  = isSelected ? LEODESSA_COLOR : 'var(--muted)';
                      if (cls === 'disqualify') {
                        btnBg     = isSelected ? 'rgba(239,68,68,0.18)' : 'rgba(239,68,68,0.04)';
                        btnBorder = isSelected ? '#ef4444' : 'rgba(239,68,68,0.35)';
                        btnColor  = isSelected ? '#fca5a5' : 'rgba(239,68,68,0.7)';
                      } else if (cls === 'boost') {
                        if (!isSelected) btnBorder = 'rgba(34,197,94,0.4)';
                        if (isSelected)  { btnBg = 'rgba(34,197,94,0.12)'; btnBorder = '#22c55e'; btnColor = '#86efac'; }
                      }
                      return (
                        <button key={opt.value} onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.value }))} style={{
                          padding: '7px 14px', borderRadius: 8, border: `1px solid ${btnBorder}`,
                          background: btnBg, color: btnColor, fontSize: '0.8rem', cursor: 'pointer',
                          transition: 'all 0.12s', fontWeight: isSelected ? 700 : 500,
                          display: 'flex', alignItems: 'center', gap: 6,
                        }}>
                          {opt.label}
                          <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{scoreStr}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedAlert && (() => {
                    const ac = alertColors[selectedAlert.type] ?? alertColors.blue;
                    return (
                      <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: '0.8rem', background: ac.bg, border: `1px solid ${ac.border}`, color: ac.color, marginBottom: 8, lineHeight: 1.5 }}>
                        {selectedAlert.text}
                      </div>
                    );
                  })()}
                  {q.hasNote && (
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => setOpenNotes(prev => ({ ...prev, [q.id]: !prev[q.id] }))} style={{ fontSize: '0.72rem', color: noteOpen ? LEODESSA_COLOR : 'var(--muted)', background: 'transparent', border: `1px dashed ${noteOpen ? LEODESSA_COLOR : 'var(--border)'}`, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        ✏️ {noteOpen ? 'Notu Gizle' : 'Manuel Not Ekle'}
                      </button>
                      {noteOpen && (
                        <textarea value={notes[q.id] ?? ''} onChange={e => setNotes(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder="Bu soru ile ilgili ek not..." style={{ display: 'block', marginTop: 8, width: '100%', padding: '8px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '0.82rem', resize: 'vertical', minHeight: 55, outline: 'none', fontFamily: 'inherit' }} />
                      )}
                    </div>
                  )}
                </>
              )}

              {q.type === 'textarea' && (
                <textarea value={textAns[q.id] ?? ''} onChange={e => setTextAns(prev => ({ ...prev, [q.id]: e.target.value }))} placeholder={q.placeholder ?? ''} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: '0.85rem', resize: 'vertical', minHeight: 80, outline: 'none', fontFamily: 'inherit', lineHeight: 1.5 }} />
              )}
            </div>
          );
        })}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={handlePrev} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem' }}>
            ← Önceki
          </button>
          <button onClick={handleNext} disabled={disq} style={{ padding: '10px 24px', background: disq ? 'rgba(168,85,247,0.3)' : LEODESSA_COLOR, border: 'none', borderRadius: 8, color: '#fff', cursor: disq ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: 700, opacity: disq ? 0.5 : 1 }}>
            Sonraki Adım →
          </button>
          <button onClick={handleReset} style={{ marginLeft: 'auto', padding: '10px 18px', background: 'transparent', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}>
            🔄 Sıfırla
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
          if (notes[q.id]?.trim()) summaryItems.push({ label: `✏️ Not: ${q.text}`, value: notes[q.id], isNote: true });
        }
      }
    }));

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: '#fff', flexShrink: 0 }}>✓</div>
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>Görüşme Tamamlandı</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: 2 }}>{svc.name} — Lead kalifikasyon sonucu</div>
          </div>
        </div>

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px' }}>
          {/* Müşteri + Skor */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
            <div style={{ fontSize: '3rem', fontWeight: 800, color: tempInfo.color, fontFamily: "'IBM Plex Mono',monospace" }}>{tempInfo.scoreDisplay}</div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: tempInfo.color }}>{tempInfo.label}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: 2 }}>
                {svc.name} — {leadAd} | {leadTel}
              </div>
            </div>
            <button onClick={() => { const t = buildSummaryText(); navigator.clipboard?.writeText(t).catch(() => {}); }} style={{ marginLeft: 'auto', padding: '7px 14px', background: `${LEODESSA_COLOR}18`, border: `1px solid ${LEODESSA_COLOR}55`, borderRadius: 6, color: LEODESSA_COLOR, fontSize: '0.78rem', cursor: 'pointer' }}>
              📋 Notu Kopyala
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 16px', fontSize: '0.68rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Görüşme Özeti <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {summaryItems.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10, marginBottom: 16 }}>
              {summaryItems.map((item, i) => (
                <div key={i} style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', border: `1px solid ${item.isNote ? 'var(--border)' : `${LEODESSA_COLOR}20`}`, gridColumn: item.isNote ? '1/-1' : undefined }}>
                  <div style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: "'IBM Plex Mono',monospace" }}>{item.label}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{item.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: 16 }}>Henüz cevaplanan soru yok.</div>
          )}

          <div style={{ padding: '14px 16px', borderRadius: 10, border: `1px solid ${action.border}`, background: action.bg }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, color: action.color }}>{action.title}</div>
            <ul style={{ paddingLeft: 18, margin: 0 }}>
              {action.items.map((item, i) => <li key={i} style={{ fontSize: '0.8rem', marginBottom: 4, color: action.color }}>{item}</li>)}
            </ul>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={handlePrev} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem' }}>← Geri Dön</button>
          <button onClick={handleReset} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${LEODESSA_COLOR}55`, borderRadius: 8, color: LEODESSA_COLOR, cursor: 'pointer', fontSize: '0.85rem' }}>🆕 Yeni Lead</button>
          <button onClick={openTransferModal} style={{ marginLeft: 'auto', padding: '10px 22px', background: LEODESSA_COLOR, border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700 }}>
            ⭐ Leodessa'ya Aktar
          </button>
        </div>
      </div>
    );
  }

  // ─── Transfer modal ───
  function renderTransferModal() {
    const canSubmit = tAd.trim() && tTel.trim();
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: 420, maxWidth: '92vw' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>⭐ Leodessa Lead Olarak Kaydet</div>
          <div style={{ fontSize: '0.76rem', color: 'var(--muted)', marginBottom: 18 }}>
            {svc.icon} {svc.name} — {tempInfo.scoreDisplay} puan
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={labelStyle}>Ad Soyad <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={tAd} onChange={e => setTAd(e.target.value)} placeholder="Müşterinin adı soyadı" autoFocus style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Telefon <span style={{ color: '#ef4444' }}>*</span></label>
              <input value={tTel} onChange={e => setTTel(e.target.value)} placeholder="05XX XXX XX XX" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>E-posta <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(isteğe bağlı)</span></label>
              <input value={tEmail} onChange={e => setTEmail(e.target.value)} placeholder="ornek@mail.com" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={() => setShowTransfer(false)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem' }}>İptal</button>
            <button onClick={handleTransferSubmit} disabled={!canSubmit} style={{ flex: 2, padding: '10px', background: canSubmit ? LEODESSA_COLOR : 'rgba(168,85,247,0.3)', border: 'none', borderRadius: 8, color: '#fff', cursor: canSubmit ? 'pointer' : 'not-allowed', fontSize: '0.85rem', fontWeight: 700 }}>
              ⭐ Kaydet & Leodessa Leads'e Git
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ────────── Main render ──────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {renderSidebar()}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        {renderStep()}
      </div>
      {showTransfer && renderTransferModal()}
    </div>
  );
}
