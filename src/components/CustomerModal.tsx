import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, VISA_TYPES, STATUS_TYPES, PROCESS_TYPES, DECISION_TYPES, QUICK_CHIPS, LEAD_SOURCES, CallOutcome } from '../types';
import { getStatusColor, getStatusBg, getStatusClass } from '../utils/helpers';

const DANISMAN_LIST = ['Eray', 'Dilara', 'Selin', 'Merve', 'Ali', 'Diğer'];
const SEHIR_LIST = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce", "Diğer"];
const KAYNAK_LIST = ['Instagram', 'Referans', 'Web Site', 'Yüz Yüze', 'WhatsApp', 'Reklam', 'Diğer'];
const ULKE_LIST = [
  'Almanya', 'Avusturya', 'Belçika', 'Çekya', 'Danimarka', 'Estonya',
  'Finlandiya', 'Fransa', 'Hırvatistan', 'Hollanda', 'İspanya', 'İsveç',
  'İsviçre', 'İtalya', 'İzlanda', 'Letonya', 'Litvanya', 'Lüksemburg',
  'Macaristan', 'Malta', 'Norveç', 'Polonya', 'Portekiz', 'Slovakya',
  'Slovenya', 'Yunanistan', 'Amerika (ABD)', 'İngiltere', 'Kanada', 'Dubai (BAE)',
];

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: '11px',
        fontFamily: "'Syne', sans-serif",
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--text-secondary)',
        fontWeight: 600,
      }}>{label}</label>
      {children}
    </div>
  );
}

export default function CustomerModal() {
  const { modal, closeModal, customers, addCustomer, updateCustomer, deleteCustomer, currentUser, users, assignSdrToCustomer } = useApp();
  const { isOpen, customerId } = modal;

  const isNew = customerId === null;
  const customer = isNew ? null : customers.find(c => c.id === customerId) ?? null;

  const [form, setForm] = useState({
    firstName: '', lastName: '', telefon: '', email: '', vize: 'Schengen',
    durum: 'Yeni Lead' as Customer['durum'],
    danisman: '', sehir: '', statu: '', kaynak: '', ulke: '', evrakPct: '',
    gorusme: '', takip: '', surec: '', karar: '', not: '',
    leadSource: '', adName: '', assignedSdrId: '',
    sehirDiger: '', kaynakDiger: '',
    doNotContact: false, doNotContactReason: ''
  });
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'log'>('info');

  // Call Log State
  const [showCallForm, setShowCallForm] = useState(false);
  const [callOutcome, setCallOutcome] = useState<CallOutcome>('Ulaşıldı');
  const [callNote, setCallNote] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setShowCallForm(false);
      setCallOutcome('Ulaşıldı');
      setCallNote('');
      setNextFollowup('');
      return;
    }
    setActiveTab('info');
    setActiveChips([]);
    if (customer) {
      setForm({
        firstName: customer.firstName, lastName: customer.lastName, telefon: customer.telefon, email: customer.email,
        vize: customer.vize, durum: customer.durum,
        statu: customer.statu ?? '',
        ulke: customer.ulke ?? '', evrakPct: customer.evrakPct ?? '',
        gorusme: customer.gorusme, takip: customer.takip,
        surec: customer.surec, karar: customer.karar, not: customer.not,
        leadSource: customer.leadSource?.startsWith('Diğer') ? 'Diğer' : (customer.leadSource ?? ''),
        kaynakDiger: customer.leadSource?.startsWith('Diğer:') ? customer.leadSource.replace('Diğer: ', '') : '',
        adName: customer.adName ?? '',
        assignedSdrId: customer.assignedSdrId ?? '',
        sehir: (customer.sehir && !SEHIR_LIST.includes(customer.sehir)) ? 'Diğer' : (customer.sehir ?? ''),
        sehirDiger: (customer.sehir && !SEHIR_LIST.includes(customer.sehir)) ? customer.sehir : '',
        kaynak: customer.kaynak ?? '',
        danisman: customer.danisman ?? '',
        doNotContact: customer.doNotContact ?? false,
        doNotContactReason: customer.doNotContactReason ?? '',
      });

      // Auto-assign logic for SDR
      if (!customer.assignedSdrId && currentUser?.role === 'sdr') {
        setTimeout(() => {
          assignSdrToCustomer(customer.id, currentUser.id);
          setForm(p => ({ ...p, assignedSdrId: currentUser.id }));
        }, 100);
      }

    } else {
      setForm({
        firstName: '', lastName: '', telefon: '', email: '', vize: 'Schengen', durum: 'Yeni Lead',
        danisman: '', sehir: '', statu: '', kaynak: '', ulke: '', evrakPct: '',
        gorusme: '', takip: '', surec: '', karar: '', not: '',
        leadSource: '', adName: '', assignedSdrId: '',
        sehirDiger: '', kaynakDiger: '',
        doNotContact: false, doNotContactReason: ''
      });
    }
  }, [isOpen, customerId, currentUser]);

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
    if (!form.firstName.trim() || !form.lastName.trim()) { alert('Ad ve Soyad zorunlu!'); return; }
    if (form.doNotContact && !form.doNotContactReason.trim()) { alert('Lütfen iletişime geçmeme nedenini belirtin.'); return; }

    const finalSehir = form.sehir === 'Diğer' ? form.sehirDiger : form.sehir;
    const finalLeadSource = form.leadSource === 'Diğer' ? `Diğer: ${form.kaynakDiger}` : form.leadSource;

    const finalNote = generatedNote() || form.not;
    const now = new Date();
    const nowStr = now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    if (isNew) {
      addCustomer({
        ...form,
        sehir: finalSehir,
        leadSource: finalLeadSource,
        not: finalNote,
        doNotContact: form.doNotContact,
        doNotContactReason: form.doNotContact ? form.doNotContactReason : '',
        log: [{ timestamp: nowStr, text: 'Yeni müşteri oluşturuldu.' }],
      });
    } else if (customer) {
      const log = [...customer.log];
      let didInteract = false;

      if (finalNote && finalNote !== customer.not) {
        log.push({ timestamp: nowStr, text: finalNote });
        didInteract = true;
      }
      if (form.durum !== customer.durum) {
        log.push({ timestamp: nowStr, text: `Durum değişti: ${customer.durum} → ${form.durum}` });
        didInteract = true;
      }

      const updatePayload: any = {
        ...form,
        sehir: finalSehir,
        leadSource: finalLeadSource,
        not: finalNote,
        doNotContact: form.doNotContact,
        doNotContactReason: form.doNotContact ? form.doNotContactReason : '',
        log
      };

      if (didInteract) {
        updatePayload.lastActivityDate = new Date().toISOString();
      }

      updateCustomer(customer.id, updatePayload);
    }
    closeModal();
  }

  function handleSaveCallLog() {
    if (!customer) return;
    if (callOutcome !== 'Kapandı' && !nextFollowup) {
      alert('Sonraki Arama Tarihi girilmelidir!');
      return;
    }

    const now = new Date();
    const nowStr = now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const newLog = [...(customer.log || [])];
    newLog.push({ timestamp: nowStr, text: `[Arama - ${callOutcome}] ${callNote}` });

    const newCallLogs = [...(customer.callLogs || [])];
    newCallLogs.push({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      outcome: callOutcome,
      note: callNote,
      callerId: currentUser?.id
    });

    updateCustomer(customer.id, {
      ...customer,
      log: newLog,
      callLogs: newCallLogs,
      nextFollowupDate: callOutcome === 'Kapandı' ? '' : nextFollowup,
      lastActivityDate: new Date().toISOString()
    });

    setShowCallForm(false);
    setCallNote('');
    setNextFollowup('');
    setCallOutcome('Ulaşıldı');
  }

  function handleDelete() {
    if (customer && window.confirm(`${customer.firstName} ${customer.lastName} kalıcı olarak silinsin mi?`)) {
      deleteCustomer(customer.id);
      closeModal();
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
      <div className="modal-content" style={{ width: 800, maxWidth: '96vw', maxHeight: '92vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ fontSize: '24px', fontFamily: "'Syne', sans-serif", fontWeight: 700, color: 'var(--text-primary)' }}>
              {isNew ? '✨ Yeni Müşteri' : `${form.firstName} ${form.lastName}`}
            </div>
            {!isNew && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <span style={{ fontSize: '14px', fontFamily: "'Syne', sans-serif", color: 'var(--text-secondary)' }}>
                  {form.telefon || 'Telefon yok'}
                </span>
                {customer && (
                  <div className={`status-indicator ${getStatusClass(customer.durum)}`}>
                    <span className="status-dot"></span>
                    {customer.durum}
                  </div>
                )}
                {form.doNotContact && (
                  <div style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-rose)', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    🚫 İletişime Geçmeyin
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {!isNew && (
              <>
                <button
                  className="btn-primary"
                  onClick={() => { setActiveTab('log'); setShowCallForm(true); }}
                  disabled={form.doNotContact}
                  style={{
                    padding: '8px 16px',
                    opacity: form.doNotContact ? 0.5 : 1,
                    cursor: form.doNotContact ? 'not-allowed' : 'pointer'
                  }}
                  title={form.doNotContact ? 'Bu müşteriyle iletişime geçilemez.' : ''}
                >
                  📞 Aramayı Kaydet
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleDelete}
                  style={{ color: 'var(--accent-rose)', borderColor: 'rgba(244,63,94,0.3)', padding: '8px 16px' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(244,63,94,0.1)';
                    e.currentTarget.style.borderColor = 'var(--accent-rose)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)';
                  }}
                >
                  Sil
                </button>
              </>
            )}
            <button className="btn-secondary" onClick={closeModal} style={{ padding: '8px 16px' }}>Kapat</button>
          </div>
        </div>

        {/* Tabs */}
        {!isNew && (
          <div style={{ display: 'flex', gap: 24, marginBottom: 24, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 0 }}>
            {(['info', 'log'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0 0 12px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: `2px solid ${activeTab === tab ? 'var(--accent-primary)' : 'transparent'}`,
                  color: activeTab === tab ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                  marginBottom: -1,
                  transition: 'all 0.2s',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {tab === 'info' ? 'Müşteri Bilgileri' : `İşlem Geçmişi (${customer?.log.length ?? 0})`}
              </button>
            ))}
          </div>
        )}

        {/* Log Tab */}
        {activeTab === 'log' && customer && (
          <div style={{ minHeight: 300 }}>
            {showCallForm && (
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-primary)', fontFamily: "'Syne', sans-serif" }}>📞 Arama Kaydı Ekle</div>
                  <button onClick={() => setShowCallForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✖</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <FormField label="Sonuç *">
                    <select className="form-input" value={callOutcome} onChange={e => setCallOutcome(e.target.value as CallOutcome)}>
                      {(['Ulaşıldı', 'Cevap Vermedi', 'Meşgul', 'Numara Kullanılmıyor', 'Yanlış Numara', 'Kapandı'] as CallOutcome[]).map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Sonraki Arama Tarihi (Takip)">
                    <input type="date" className="form-input" value={nextFollowup} onChange={e => setNextFollowup(e.target.value)} disabled={callOutcome === 'Kapandı'} />
                  </FormField>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FormField label="Arama Notu">
                      <textarea className="form-input" value={callNote} onChange={e => setCallNote(e.target.value)} placeholder="Müşteri ne söyledi? Bir sonraki aşama ne olacak?" style={{ minHeight: 80 }} />
                    </FormField>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                  <button className="btn-primary" onClick={handleSaveCallLog}>Kaydet</button>
                </div>
              </div>
            )}
            {customer.log.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0' }}>Henüz aktivite kaydı yok.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[...customer.log].reverse().map((entry, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    gap: 16,
                    paddingBottom: 16,
                    borderBottom: i < customer.log.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  }}>
                    <div style={{
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                      paddingTop: 2
                    }}>{entry.timestamp.substring(0, 16)}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {entry.text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Section: Kişisel Bilgiler */}
            <div>
              <div style={{ fontSize: '12px', fontFamily: "'Syne', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-primary)', marginBottom: 16 }}>
                Kişisel Bilgiler
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <FormField label="Ad *">
                  <input className="form-input" type="text" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="Örn: Ayşe" />
                </FormField>
                <FormField label="Soyad *">
                  <input className="form-input" type="text" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Örn: Kement" />
                </FormField>
                <FormField label="Telefon">
                  <input className="form-input" type="text" value={form.telefon} onChange={e => setForm(p => ({ ...p, telefon: e.target.value }))} placeholder="+90 5xx xxx xx xx" />
                </FormField>
                <FormField label="E-posta">
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="ornek@mail.com" />
                </FormField>
                <FormField label="Şehir">
                  <select className="form-input" value={form.sehir} onChange={e => setForm(p => ({ ...p, sehir: e.target.value }))}>
                    <option value="">Seçin...</option>
                    {SEHIR_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
                {form.sehir === 'Diğer' && (
                  <FormField label="Şehir Belirtin">
                    <input className="form-input" type="text" value={form.sehirDiger} onChange={e => setForm(p => ({ ...p, sehirDiger: e.target.value }))} placeholder="Örn: Londra" />
                  </FormField>
                )}
                <FormField label="Ülke">
                  <select className="form-input" value={form.ulke} onChange={e => setForm(p => ({ ...p, ulke: e.target.value }))}>
                    <option value="">Seçin...</option>
                    <optgroup label="Schengen Ülkeleri">
                      {ULKE_LIST.slice(0, 26).map(u => <option key={u}>{u}</option>)}
                    </optgroup>
                    <optgroup label="Diğer Ülkeler">
                      {ULKE_LIST.slice(26).map(u => <option key={u}>{u}</option>)}
                    </optgroup>
                  </select>
                </FormField>
                <FormField label="Lead Kaynağı">
                  <select className="form-input" value={form.leadSource} onChange={e => setForm(p => ({ ...p, leadSource: e.target.value }))}>
                    <option value="">Seçin...</option>
                    {LEAD_SOURCES.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </FormField>
                {(form.leadSource === 'Meta Ads' || form.leadSource === 'Google Ads') && (
                  <FormField label="Reklam Adı">
                    <input className="form-input" type="text" value={form.adName} onChange={e => setForm(p => ({ ...p, adName: e.target.value }))} placeholder="Kampanya / Reklam adı" required />
                  </FormField>
                )}
                {form.leadSource === 'Diğer' && (
                  <FormField label="Kaynak Açıklaması">
                    <input className="form-input" type="text" value={form.kaynakDiger} onChange={e => setForm(p => ({ ...p, kaynakDiger: e.target.value }))} placeholder="Kaynak detayı" />
                  </FormField>
                )}

                {(currentUser?.role === 'leodessa_admin' || currentUser?.role === 'vizemo_admin') && (
                  <FormField label="SDR Ataması Yapan (Admin)">
                    <select className="form-input" value={form.assignedSdrId} onChange={e => setForm(p => ({ ...p, assignedSdrId: e.target.value }))}>
                      <option value="">SDR Atanmadı</option>
                      {users.filter(u => u.role === 'sdr').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </FormField>
                )}

                <div style={{ gridColumn: '1 / -1', background: form.doNotContact ? 'rgba(244, 63, 94, 0.05)' : 'none', border: form.doNotContact ? '1px solid rgba(244, 63, 94, 0.2)' : '1px solid transparent', padding: '16px', borderRadius: '8px', marginTop: 8, transition: 'all 0.2s' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.doNotContact}
                      onChange={e => setForm(p => ({ ...p, doNotContact: e.target.checked, doNotContactReason: e.target.checked ? p.doNotContactReason : '' }))}
                      style={{ width: 18, height: 18, accentColor: 'var(--accent-rose)', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', fontFamily: "'Syne', sans-serif", fontWeight: 600, color: form.doNotContact ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
                      🚫 Bu Müşteriyle İletişime Geçmeyin (Do Not Contact)
                    </span>
                  </label>
                  {form.doNotContact && (
                    <div style={{ marginTop: 16 }}>
                      <FormField label="İletişime Geçmeme Nedeni *">
                        <textarea
                          className="form-input"
                          value={form.doNotContactReason}
                          onChange={e => setForm(p => ({ ...p, doNotContactReason: e.target.value }))}
                          placeholder="Müşteri şikayeti, ulaşılamadı vb..."
                          style={{ minHeight: 60 }}
                        />
                      </FormField>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Section: Vize & Durum */}
            <div>
              <div style={{ fontSize: '12px', fontFamily: "'Syne', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-primary)', marginBottom: 16 }}>
                Vize & Operasyon
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <FormField label="Vize Türü">
                  <select className="form-input" value={form.vize} onChange={e => setForm(p => ({ ...p, vize: e.target.value }))}>
                    {VISA_TYPES.map(v => <option key={v}>{v}</option>)}
                  </select>
                </FormField>
                <FormField label="Danışman">
                  <select className="form-input" value={form.danisman} onChange={e => setForm(p => ({ ...p, danisman: e.target.value }))}>
                    <option value="">Seçin...</option>
                    {DANISMAN_LIST.map(d => <option key={d}>{d}</option>)}
                  </select>
                </FormField>
                <FormField label="Durum">
                  <select className="form-input" value={form.durum} onChange={e => setForm(p => ({ ...p, durum: e.target.value as Customer['durum'] }))}>
                    {STATUS_TYPES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </FormField>
                <FormField label="Müşteri Statüsü">
                  <input className="form-input" type="text" value={form.statu} onChange={e => setForm(p => ({ ...p, statu: e.target.value }))} placeholder="Örn: Evrak Bekleniyor" />
                </FormField>
                <FormField label="Süreç (Konsolosluk/Başvuru)">
                  <select className="form-input" value={form.surec} onChange={e => setForm(p => ({ ...p, surec: e.target.value }))}>
                    <option value="">Seçin...</option>
                    {PROCESS_TYPES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </FormField>
                <FormField label="Müşteri Kararı / Niyeti">
                  <select className="form-input" value={form.karar} onChange={e => setForm(p => ({ ...p, karar: e.target.value }))}>
                    <option value="">Seçin...</option>
                    {DECISION_TYPES.map(d => <option key={d}>{d}</option>)}
                  </select>
                </FormField>
                <FormField label="Evrak Tamamlanma">
                  <input className="form-input" type="text" value={form.evrakPct} onChange={e => setForm(p => ({ ...p, evrakPct: e.target.value }))} placeholder="Örn: %75" />
                </FormField>
              </div>
            </div>

            {/* Section: Tarihler */}
            <div>
              <div style={{ fontSize: '12px', fontFamily: "'Syne', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-primary)', marginBottom: 16 }}>
                Takvim
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <FormField label="Görüşme Tarihi">
                  <input className="form-input" type="datetime-local" value={form.gorusme} onChange={e => setForm(p => ({ ...p, gorusme: e.target.value }))} />
                </FormField>
                <FormField label="Takip Tarihi">
                  <input className="form-input" type="date" value={form.takip} onChange={e => setForm(p => ({ ...p, takip: e.target.value }))} />
                </FormField>
              </div>
            </div>

            {/* Note builder */}
            <div>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: '11px', fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: 16 }}>
                  Hızlı Not Oluşturucu
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {QUICK_CHIPS.map(chip => {
                    const active = activeChips.includes(chip.text);
                    return (
                      <button
                        key={chip.text}
                        onClick={() => toggleChip(chip.text)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: '11px',
                          fontFamily: "'Syne', sans-serif",
                          fontWeight: 600,
                          cursor: 'pointer',
                          border: `1px solid ${active ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                          background: active ? 'rgba(6,182,212,0.1)' : 'var(--bg-surface)',
                          color: active ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>

                <FormField label="Ek Not / Açıklama">
                  <textarea
                    className="form-input"
                    value={form.not}
                    onChange={e => setForm(p => ({ ...p, not: e.target.value }))}
                    placeholder="Ek detay yazın..."
                    rows={2}
                  />
                </FormField>

                {generatedNote() && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Oluşturulan Not Önizleme</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                      {generatedNote()}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-subtle)' }}>
          <button className="btn-secondary" onClick={closeModal} style={{ padding: '10px 24px' }}>İptal</button>
          <button className="btn-primary" onClick={handleSave} style={{ padding: '10px 32px' }}>Ayarla ve Kaydet</button>
        </div>

      </div>
    </div>
  );
}
