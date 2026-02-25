import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, VISA_TYPES, STATUS_TYPES, PROCESS_TYPES, DECISION_TYPES, QUICK_CHIPS } from '../types';
import { getStatusColor, getStatusBg } from '../utils/helpers';

const DANISMAN_LIST = ['Eray', 'Dilara', 'Selin', 'Merve', 'Ali', 'Diğer'];
const SEHIR_LIST = ['Eskişehir', 'Gaziantep', 'İstanbul', 'Ankara', 'Diğer'];
const KAYNAK_LIST = ['Instagram', 'Referans', 'Web Site', 'Yüz Yüze', 'WhatsApp', 'Diğer'];
const ULKE_LIST = [
  // Schengen Ülkeleri
  'Almanya', 'Avusturya', 'Belçika', 'Çekya', 'Danimarka', 'Estonya',
  'Finlandiya', 'Fransa', 'Hırvatistan', 'Hollanda', 'İspanya', 'İsveç',
  'İsviçre', 'İtalya', 'İzlanda', 'Letonya', 'Litvanya', 'Lüksemburg',
  'Macaristan', 'Malta', 'Norveç', 'Polonya', 'Portekiz', 'Slovakya',
  'Slovenya', 'Yunanistan',
  // Diğer Ülkeler
  'Amerika (ABD)', 'İngiltere', 'Kanada', 'Dubai (BAE)',
];

const inputStyle: React.CSSProperties = {
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '9px 12px',
  color: 'var(--text)',
  fontSize: '0.82rem',
  fontFamily: "'IBM Plex Sans', sans-serif",
  outline: 'none',
  width: '100%',
  transition: 'border-color 0.15s',
};

const labelStyle: React.CSSProperties = {
  fontSize: '0.68rem',
  fontFamily: "'IBM Plex Mono', monospace",
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: 'var(--muted)',
  marginBottom: 5,
  display: 'block',
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function CustomerModal() {
  const { modal, closeModal, customers, addCustomer, updateCustomer, deleteCustomer } = useApp();
  const { isOpen, customerId } = modal;

  const isNew = customerId === null;
  const customer = isNew ? null : customers.find(c => c.id === customerId) ?? null;

  const [form, setForm] = useState({
    ad: '', telefon: '', email: '', vize: 'Schengen',
    durum: 'Yeni Lead' as Customer['durum'],
    danisman: '', sehir: '', statu: '', kaynak: '', ulke: '', evrakPct: '',
    gorusme: '', takip: '', surec: '', karar: '', not: '',
  });
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'log'>('info');

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('info');
    setActiveChips([]);
    if (customer) {
      setForm({
        ad: customer.ad, telefon: customer.telefon, email: customer.email,
        vize: customer.vize, durum: customer.durum,
        danisman: customer.danisman ?? '', sehir: customer.sehir ?? '',
        statu: customer.statu ?? '', kaynak: customer.kaynak ?? '',
        ulke: customer.ulke ?? '', evrakPct: customer.evrakPct ?? '',
        gorusme: customer.gorusme, takip: customer.takip,
        surec: customer.surec, karar: customer.karar, not: customer.not,
      });
    } else {
      setForm({
        ad: '', telefon: '', email: '', vize: 'Schengen', durum: 'Yeni Lead',
        danisman: '', sehir: '', statu: '', kaynak: '', ulke: '', evrakPct: '',
        gorusme: '', takip: '', surec: '', karar: '', not: '',
      });
    }
  }, [isOpen, customerId]);

  const generatedNote = (): string => {
    const parts = [...activeChips];
    if (form.not.trim()) parts.push(form.not.trim());
    return parts.join(' ');
  };

  function toggleChip(text: string) {
    setActiveChips(prev =>
      prev.includes(text) ? prev.filter(t => t !== text) : [...prev, text]
    );
  }

  function handleSave() {
    if (!form.ad.trim()) { alert('Ad Soyad zorunlu!'); return; }
    const finalNote = generatedNote() || form.not;
    const now = new Date();
    const nowStr = now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    if (isNew) {
      addCustomer({
        ...form,
        not: finalNote,
        log: [{ timestamp: nowStr, text: 'Yeni müşteri oluşturuldu.' }],
      });
    } else if (customer) {
      const log = [...customer.log];
      if (finalNote && finalNote !== customer.not) {
        log.push({ timestamp: nowStr, text: finalNote });
      }
      if (form.durum !== customer.durum) {
        log.push({ timestamp: nowStr, text: `Durum değişti: ${customer.durum} → ${form.durum}` });
      }
      updateCustomer(customer.id, { ...form, not: finalNote, log });
    }
    closeModal();
  }

  function handleDelete() {
    if (customer && window.confirm(`${customer.ad} kalıcı olarak silinsin mi?`)) {
      deleteCustomer(customer.id);
      closeModal();
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
    >
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        width: 780,
        maxWidth: '96vw',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: 28,
        animation: 'slide-up 0.2s ease',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)' }}>
              {isNew ? 'Yeni Müşteri' : form.ad || 'Müşteriyi Düzenle'}
            </div>
            {!isNew && (
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 3 }}>
                {form.telefon || '—'}
                {customer && (
                  <span style={{
                    marginLeft: 10,
                    color: getStatusColor(customer.durum),
                    background: getStatusBg(customer.durum),
                    padding: '1px 7px',
                    borderRadius: 10,
                    fontSize: '0.65rem',
                  }}>{customer.durum}</span>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {!isNew && (
              <button onClick={handleDelete} style={{
                padding: '5px 12px',
                background: 'transparent',
                color: 'var(--danger)',
                border: '1px solid rgba(224,92,92,0.3)',
                borderRadius: 7,
                cursor: 'pointer',
                fontSize: '0.72rem',
                fontFamily: "'IBM Plex Mono', monospace",
              }}>
                🗑 Sil
              </button>
            )}
            <button onClick={closeModal} style={{
              background: 'none', border: 'none', color: 'var(--muted)',
              cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1, padding: 4,
            }}>✕</button>
          </div>
        </div>

        {/* Tabs (only for edit) */}
        {!isNew && (
          <div style={{ display: 'flex', gap: 2, marginBottom: 18, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
            {(['info', 'log'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '7px 16px',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab ? 'var(--accent)' : 'transparent'}`,
                  color: activeTab === tab ? 'var(--accent)' : 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontFamily: "'IBM Plex Mono', monospace",
                  marginBottom: -1,
                  transition: 'all 0.15s',
                }}
              >
                {tab === 'info' ? '📋 Bilgiler' : `🕐 Geçmiş (${customer?.log.length ?? 0})`}
              </button>
            ))}
          </div>
        )}

        {/* Log tab */}
        {activeTab === 'log' && customer && (
          <div>
            {customer.log.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: '0.82rem', padding: '20px 0' }}>Henüz aktivite kaydı yok.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[...customer.log].reverse().map((entry, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: 12,
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <div style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: 'var(--muted)',
                      fontSize: '0.7rem',
                      minWidth: 110,
                      whiteSpace: 'nowrap',
                    }}>{entry.timestamp}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{entry.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info tab */}
        {activeTab === 'info' && (
          <>
            {/* Section: Kişisel Bilgiler */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.62rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 10, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
                👤 Kişisel Bilgiler
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Ad Soyad *">
                  <input
                    type="text"
                    value={form.ad}
                    onChange={e => setForm(p => ({ ...p, ad: e.target.value }))}
                    placeholder="Örn: Ayşe Kement"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </FormField>
                <FormField label="Telefon">
                  <input
                    type="text"
                    value={form.telefon}
                    onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))}
                    placeholder="+90 5xx xxx xx xx"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </FormField>
                <FormField label="E-posta">
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="ornek@mail.com"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </FormField>
                <FormField label="Şehir">
                  <select
                    value={form.sehir}
                    onChange={e => setForm(p => ({ ...p, sehir: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  >
                    <option value="">Seçin...</option>
                    {SEHIR_LIST.map(s => <option key={s}>{s}</option>)}
                  </select>
                </FormField>
                <FormField label="Ülke">
                  <select
                    value={form.ulke}
                    onChange={e => setForm(p => ({ ...p, ulke: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  >
                    <option value="">Seçin...</option>
                    <optgroup label="Schengen Ülkeleri">
                      {ULKE_LIST.slice(0, 26).map(u => <option key={u}>{u}</option>)}
                    </optgroup>
                    <optgroup label="Diğer Ülkeler">
                      {ULKE_LIST.slice(26).map(u => <option key={u}>{u}</option>)}
                    </optgroup>
                  </select>
                </FormField>
                <FormField label="Kaynak">
                  <select
                    value={form.kaynak}
                    onChange={e => setForm(p => ({ ...p, kaynak: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  >
                    <option value="">Seçin...</option>
                    {KAYNAK_LIST.map(k => <option key={k}>{k}</option>)}
                  </select>
                </FormField>
              </div>
            </div>

            {/* Section: Vize & Durum */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.62rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 10, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
                🛂 Vize & Durum Bilgileri
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Vize Türü">
                  <select
                    value={form.vize}
                    onChange={e => setForm(p => ({ ...p, vize: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  >
                    {VISA_TYPES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </FormField>
                <FormField label="Danışman">
                  <select
                    value={form.danisman}
                    onChange={e => setForm(p => ({ ...p, danisman: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  >
                    <option value="">Seçin...</option>
                    {DANISMAN_LIST.map(d => <option key={d}>{d}</option>)}
                  </select>
                </FormField>
                <FormField label="Durum">
                  <select
                    value={form.durum}
                    onChange={e => setForm(p => ({ ...p, durum: e.target.value as Customer['durum'] }))}
                    style={{ ...inputStyle, color: getStatusColor(form.durum) }}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  >
                    {STATUS_TYPES.map(s => <option key={s} style={{ color: 'var(--text)' }}>{s}</option>)}
                  </select>
                </FormField>
                <FormField label="Statü">
                  <input
                    type="text"
                    value={form.statu}
                    onChange={e => setForm(p => ({ ...p, statu: e.target.value }))}
                    placeholder="Örn: Cevap Bekleniyor"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </FormField>
                <FormField label="Süreç Durumu">
                  <select
                    value={form.surec}
                    onChange={e => setForm(p => ({ ...p, surec: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  >
                    <option value="">Seçin...</option>
                    {PROCESS_TYPES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </FormField>
                <FormField label="Müşteri Kararı">
                  <select
                    value={form.karar}
                    onChange={e => setForm(p => ({ ...p, karar: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  >
                    <option value="">Seçin...</option>
                    {DECISION_TYPES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </FormField>
                <FormField label="Evrak Tamamlanma (%)">
                  <input
                    type="text"
                    value={form.evrakPct}
                    onChange={e => setForm(p => ({ ...p, evrakPct: e.target.value }))}
                    placeholder="Örn: %75"
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </FormField>
              </div>
            </div>

            {/* Section: Tarihler */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: '0.62rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', marginBottom: 10, paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
                📅 Tarih Bilgileri
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Görüşme Tarihi & Saati">
                  <input
                    type="datetime-local"
                    value={form.gorusme}
                    onChange={e => setForm(p => ({ ...p, gorusme: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </FormField>
                <FormField label="Takip Tarihi">
                  <input
                    type="date"
                    value={form.takip}
                    onChange={e => setForm(p => ({ ...p, takip: e.target.value }))}
                    style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                </FormField>
              </div>
            </div>

            {/* Note builder */}
            <div style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 16,
              marginTop: 4,
            }}>
              <div style={{ fontSize: '0.68rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--accent)', marginBottom: 10 }}>
                ⚡ Hızlı Not Oluşturucu
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                {QUICK_CHIPS.map(chip => {
                  const active = activeChips.includes(chip.text);
                  return (
                    <button
                      key={chip.text}
                      onClick={() => toggleChip(chip.text)}
                      style={{
                        padding: '4px 11px',
                        borderRadius: 16,
                        fontSize: '0.7rem',
                        fontFamily: "'IBM Plex Mono', monospace",
                        cursor: 'pointer',
                        border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                        background: active ? 'rgba(79,142,247,0.12)' : 'var(--surface)',
                        color: active ? 'var(--accent)' : 'var(--muted)',
                        transition: 'all 0.13s',
                        userSelect: 'none',
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 6 }}>
                OLUŞTURULAN NOT:
              </div>
              <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: '0.78rem',
                color: generatedNote() ? 'var(--text)' : 'var(--muted)',
                fontFamily: "'IBM Plex Mono', monospace",
                minHeight: 44,
                lineHeight: 1.5,
              }}>
                {generatedNote() || 'Chip seçin veya aşağıya yazın...'}
              </div>
            </div>

            {/* Manual note */}
            <div style={{ marginTop: 12 }}>
              <label style={labelStyle}>Ek Not (manuel)</label>
              <textarea
                value={form.not}
                onChange={e => setForm(p => ({ ...p, not: e.target.value }))}
                placeholder="Ek detay yazın..."
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10,
          marginTop: 20,
          paddingTop: 16,
          borderTop: '1px solid var(--border)',
        }}>
          <button
            onClick={closeModal}
            style={{
              padding: '8px 18px',
              background: 'transparent',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            İptal
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 20px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.78rem',
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 500,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#3a7be0')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
          >
            💾 Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
