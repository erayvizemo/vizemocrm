import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, VISA_TYPES, LEODESSA_STAGES, VIZEMO_STAGES, LEGACY_STAGES, PROCESS_TYPES, DECISION_TYPES, QUICK_CHIPS, LEAD_SOURCES, CallOutcome, CALL_OUTCOMES, LeadTask } from '../types';
import { getStatusColor, getStatusBg, getStatusClass } from '../utils/helpers';

const DANISMAN_LIST = ['Eray', 'Dilara', 'Elanur'];
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
        fontFamily: "'DM Sans', sans-serif",
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
  const { modal, closeModal, customers, addCustomer, updateCustomer, deleteCustomer, currentUser, users, assignSdrToCustomer, addTask, updateTask, deleteTask } = useApp();
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
    doNotContact: false, doNotContactReason: '',
    arayanDanisman: '', arananTarih: '',
  });
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'log' | 'tasks'>('info');
  const [newNoteInput, setNewNoteInput] = useState(''); // only the new note being typed

  // Call Log State
  const [showCallForm, setShowCallForm] = useState(false);
  const [callOutcome, setCallOutcome] = useState<CallOutcome>('Ulaşıldı - İlgilendi');
  const [callNote, setCallNote] = useState('');
  const [nextFollowup, setNextFollowup] = useState('');

  // Task State
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignedTo, setTaskAssignedTo] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setShowCallForm(false);
      setCallOutcome('Ulaşıldı - İlgilendi');
      setCallNote('');
      setNextFollowup('');
      setShowTaskForm(false);
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate('');
      setTaskAssignedTo('');
      return;
    }
    setActiveTab('info');
    setActiveChips([]);
    setNewNoteInput('');
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
        arayanDanisman: customer.arayanDanisman ?? '',
        arananTarih: customer.arananTarih ?? '',
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
        doNotContact: false, doNotContactReason: '',
        arayanDanisman: '', arananTarih: '',
      });
    }
  }, [isOpen, customerId, currentUser]);

  const generatedNote = (): string => {
    const parts = [...activeChips];
    if (newNoteInput.trim()) parts.push(newNoteInput.trim());
    return parts.join(' ');
  };

  // Always show existing notes from DB as read-only history
  const existingNotes = form.not || '';

  // Timestamp helper
  function makeTimestampedNote(text: string): string {
    const now = new Date();
    const d = now.toLocaleDateString('tr-TR'); // e.g. 03.03.2026
    const t = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }); // e.g. 15:07
    return `[${d} ${t}] — ${text.trim()}`;
  }

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

    const newChipNote = activeChips.join(' ');
    const freshTyped = newNoteInput.trim();

    // Build timestamped new note if anything was typed / chip selected
    let finalNote = existingNotes;
    if (freshTyped || newChipNote) {
      const combined = [newChipNote, freshTyped].filter(Boolean).join(' ');
      const timestamped = makeTimestampedNote(combined);
      // Append to existing notes with separator
      finalNote = existingNotes
        ? existingNotes + '\n' + timestamped
        : timestamped;
    }
    const now = new Date();
    const nowStr = now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const { sehirDiger, kaynakDiger, ...pureForm } = form;

    if (isNew) {
      addCustomer({
        ...pureForm,
        sehir: finalSehir,
        leadSource: finalLeadSource,
        not: finalNote,
        doNotContact: form.doNotContact,
        doNotContactReason: form.doNotContact ? form.doNotContactReason : '',
        arayanDanisman: form.arayanDanisman,
        arananTarih: form.arananTarih,
        log: [{ timestamp: nowStr, text: 'Yeni müşteri oluşturuldu.' }],
      });
    } else if (customer) {
      const log = [...customer.log];
      let didInteract = false;

      if (finalNote !== customer.not) {
        log.push({ timestamp: nowStr, text: `Not eklendi: ${freshTyped || newChipNote}` });
        didInteract = true;
      }
      if (form.durum !== customer.durum) {
        log.push({ timestamp: nowStr, text: `Durum değişti: ${customer.durum} → ${form.durum}` });
        didInteract = true;
      }

      const updatePayload: any = {
        ...pureForm,
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
    if (!nextFollowup) {
      alert('Sonraki Arama / Takip Tarihi zorunludur!');
      return;
    }

    const now = new Date();
    const nowStr = now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const newLog = [...(customer.log || [])];
    newLog.push({ timestamp: nowStr, text: `[Arama - ${callOutcome}] ${callNote}${nextFollowup ? ` | Takip: ${nextFollowup}` : ''}` });

    const newCallLogs = [...(customer.callLogs || [])];
    newCallLogs.push({
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      outcome: callOutcome,
      note: callNote,
      nextFollowupDate: nextFollowup,
      callerId: currentUser?.id
    });

    // Auto-assign SDR if not already assigned
    const updatedAssignedSdrId = customer.assignedSdrId || (currentUser?.role === 'sdr' ? currentUser.id : undefined);

    updateCustomer(customer.id, {
      ...customer,
      log: newLog,
      callLogs: newCallLogs,
      nextFollowupDate: nextFollowup,
      lastActivityDate: new Date().toISOString(),
      ...(updatedAssignedSdrId ? { assignedSdrId: updatedAssignedSdrId } : {}),
    });

    setShowCallForm(false);
    setCallNote('');
    setNextFollowup('');
    setCallOutcome('Ulaşıldı - İlgilendi');
  }

  function handleSaveTask() {
    if (!customer) return;
    if (!taskTitle.trim()) { alert('Task başlığı zorunludur.'); return; }
    if (!taskDueDate) { alert('Son tarih (DDL) zorunludur.'); return; }

    const newTask: LeadTask = {
      id: Math.random().toString(36).substr(2, 9),
      leadId: customer.id,
      createdBy: currentUser?.id || '',
      assignedTo: taskAssignedTo,
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      dueDate: taskDueDate,
      status: 'open',
    };

    addTask(customer.id, newTask);
    setTaskTitle('');
    setTaskDescription('');
    setTaskDueDate('');
    setTaskAssignedTo('');
    setShowTaskForm(false);
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
            <div style={{ fontSize: '24px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, color: 'var(--text-primary)' }}>
              {isNew ? '✨ Yeni Müşteri' : `${form.firstName} ${form.lastName}`}
            </div>
            {!isNew && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <span style={{ fontSize: '14px', fontFamily: "'DM Sans', sans-serif", color: 'var(--text-secondary)' }}>
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
            {(['info', 'log', 'tasks'] as const).map(tab => (
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
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600,
                  marginBottom: -1,
                  transition: 'all 0.2s',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {tab === 'info' ? 'Müşteri Bilgileri' : tab === 'log' ? `İşlem Geçmişi (${customer?.log.length ?? 0})` : `Taskler (${customer?.tasks?.length ?? 0})`}
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
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-primary)', fontFamily: "'DM Sans', sans-serif" }}>📞 Arama Kaydı Ekle</div>
                  <button onClick={() => setShowCallForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>✖</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <FormField label="Arama Sonucu *">
                    <select className="form-input" value={callOutcome} onChange={e => setCallOutcome(e.target.value as CallOutcome)}>
                      {CALL_OUTCOMES.map(o => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Takip / Tekrar Arama Tarihi *">
                    <input type="date" className="form-input" value={nextFollowup} onChange={e => setNextFollowup(e.target.value)} style={{ border: !nextFollowup ? '1px solid rgba(244,63,94,0.4)' : undefined }} />
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
                      fontFamily: "'DM Sans', sans-serif",
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

        {/* Tasks Tab */}
        {activeTab === 'tasks' && customer && (
          <div style={{ minHeight: 300 }}>
            {/* Add Task Button / Form */}
            {!showTaskForm ? (
              <div style={{ marginBottom: 24 }}>
                <button
                  className="btn-primary"
                  onClick={() => setShowTaskForm(true)}
                  style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 300 }}>＋</span> Yeni Task Ekle
                </button>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-glow)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-primary)', fontFamily: "'DM Sans', sans-serif" }}>📋 Yeni Task Ekle</div>
                  <button onClick={() => setShowTaskForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }}>✖</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                  <FormField label="Başlık *">
                    <input className="form-input" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Task başlığı..." autoFocus />
                  </FormField>
                  <FormField label="Son Tarih (DDL) *">
                    <input type="date" className="form-input" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
                  </FormField>
                  <FormField label="Atanan Kişi">
                    <select className="form-input" value={taskAssignedTo} onChange={e => setTaskAssignedTo(e.target.value)}>
                      <option value="">Atanmadı</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                    </select>
                  </FormField>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <FormField label="Açıklama">
                      <textarea className="form-input" value={taskDescription} onChange={e => setTaskDescription(e.target.value)} placeholder="Task detayı, ne yapılmalı?" style={{ minHeight: 72 }} />
                    </FormField>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                  <button className="btn-secondary" onClick={() => setShowTaskForm(false)}>İptal</button>
                  <button className="btn-primary" onClick={handleSaveTask}>Kaydet</button>
                </div>
              </div>
            )}

            {/* Task List */}
            {(!customer.tasks || customer.tasks.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '40px 24px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
                <div style={{ fontSize: '32px', marginBottom: 12 }}>📋</div>
                <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Henüz task eklenmemiş. Yeni task ekleyerek süreci takip edin.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...customer.tasks].sort((a, b) => {
                  if (a.status === 'done' && b.status !== 'done') return 1;
                  if (a.status !== 'done' && b.status === 'done') return -1;
                  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                }).map(task => {
                  const isOverdue = task.status !== 'done' && task.dueDate && new Date(task.dueDate) < new Date();
                  const assignedUser = users.find(u => u.id === task.assignedTo);
                  const isDone = task.status === 'done';
                  return (
                    <div key={task.id} style={{
                      background: isDone ? 'var(--bg-surface)' : 'var(--bg-card)',
                      border: `1px solid ${isDone ? 'var(--border-subtle)' : isOverdue ? 'rgba(244,63,94,0.35)' : 'var(--border-glow)'}`,
                      borderRadius: 12, padding: '16px 20px',
                      opacity: isDone ? 0.65 : 1,
                      transition: 'all 0.2s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{
                              padding: '3px 8px', borderRadius: 6, fontSize: '11px', fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
                              background: isDone ? 'rgba(16,185,129,0.1)' : task.status === 'in_progress' ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)',
                              color: isDone ? 'var(--accent-emerald)' : task.status === 'in_progress' ? 'var(--accent-primary)' : 'var(--accent-amber)',
                              border: `1px solid ${isDone ? 'rgba(16,185,129,0.25)' : task.status === 'in_progress' ? 'rgba(99,102,241,0.25)' : 'rgba(245,158,11,0.25)'}`,
                            }}>
                              {isDone ? '✅ Tamamlandı' : task.status === 'in_progress' ? '⏳ Devam Ediyor' : '📋 Bekliyor'}
                            </span>
                            {isOverdue && !isDone && (
                              <span style={{ fontSize: '11px', color: 'var(--accent-rose)', fontWeight: 700 }}>⚠ Süresi Geçti!</span>
                            )}
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif" }}>
                              📅 {task.dueDate}
                            </span>
                            {assignedUser && (
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                👤 {assignedUser.name}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: isDone ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none', marginBottom: task.description ? 6 : 0 }}>
                            {task.title}
                          </div>
                          {task.description && (
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{task.description}</div>
                          )}
                          {task.completedAt && (
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: 6 }}>
                              Tamamlandı: {new Date(task.completedAt).toLocaleDateString('tr-TR')}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                          {!isDone && (
                            <button
                              className="btn-secondary"
                              onClick={() => updateTask(customer.id, task.id, { status: 'done', completedAt: new Date().toISOString() })}
                              style={{ padding: '6px 12px', fontSize: '13px', borderColor: 'rgba(16,185,129,0.3)', color: 'var(--accent-emerald)' }}
                              title="Tamamlandı olarak işaretle"
                            >
                              ✓
                            </button>
                          )}
                          <button
                            className="btn-secondary"
                            onClick={() => deleteTask(customer.id, task.id)}
                            style={{ padding: '6px 12px', fontSize: '13px', borderColor: 'rgba(244,63,94,0.2)', color: 'var(--accent-rose)' }}
                            title="Sil"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Info Tab */}
        {activeTab === 'info' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Section: Kişisel Bilgiler */}
            <div>
              <div style={{ fontSize: '12px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-primary)', marginBottom: 16 }}>
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

                {(customer?.pipelineType === 'leodessa' || (!customer && isNew)) && (
                  <>
                    <FormField label="Arayan Danışman">
                      <select className="form-input" value={form.arayanDanisman} onChange={e => setForm(p => ({ ...p, arayanDanisman: e.target.value }))}>
                        <option value="">Seçin...</option>
                        <option value="Hanife">Hanife</option>
                        <option value="Zeynep">Zeynep</option>
                      </select>
                    </FormField>
                    <FormField label="Aranan Tarih">
                      <input className="form-input" type="date" value={form.arananTarih} onChange={e => setForm(p => ({ ...p, arananTarih: e.target.value }))} />
                    </FormField>
                  </>
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
                    <span style={{ fontSize: '14px', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, color: form.doNotContact ? 'var(--accent-rose)' : 'var(--text-primary)' }}>
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
              <div style={{ fontSize: '12px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-primary)', marginBottom: 16 }}>
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
                <FormField label="Pipeline Aşaması">
                  <select className="form-input" value={form.durum} onChange={e => setForm(p => ({ ...p, durum: e.target.value as Customer['durum'] }))}>
                    <optgroup label="✈ LeoDessa Aşamaları">
                      {LEODESSA_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </optgroup>
                    <optgroup label="🏢 Vizemo Aşamaları">
                      {VIZEMO_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </optgroup>
                    <optgroup label="📁 Arşiv / Legacy">
                      {LEGACY_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                    </optgroup>
                  </select>
                </FormField>
                <FormField label="Müşteri Statüsü">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      className="form-input"
                      value={['Ofiste Görüşüldü', 'Arandı', 'Evrak Bekleniyor', 'Ulaşılamadı', 'Tekrar Aranacak', ''].includes(form.statu) ? form.statu : 'Diğer'}
                      onChange={e => {
                        const val = e.target.value;
                        if (val !== 'Diğer') setForm(p => ({ ...p, statu: val }));
                        // "Diğer" seçilirse mevcut text kalır, yandaki input ile değiştirilir.
                        if (val === 'Diğer' && ['Ofiste Görüşüldü', 'Arandı', 'Evrak Bekleniyor', 'Ulaşılamadı', 'Tekrar Aranacak', ''].includes(form.statu)) {
                          setForm(p => ({ ...p, statu: 'Özel Statü' })); // Placeholder text for input
                        }
                      }}
                      style={{ flex: 1 }}
                    >
                      <option value="">Seçin...</option>
                      <option>Ofiste Görüşüldü</option>
                      <option>Arandı</option>
                      <option>Evrak Bekleniyor</option>
                      <option>Ulaşılamadı</option>
                      <option>Tekrar Aranacak</option>
                      <option value="Diğer">Diğer...</option>
                    </select>
                    {!['Ofiste Görüşüldü', 'Arandı', 'Evrak Bekleniyor', 'Ulaşılamadı', 'Tekrar Aranacak', ''].includes(form.statu) && (
                      <input
                        className="form-input"
                        type="text"
                        value={form.statu}
                        onChange={e => setForm(p => ({ ...p, statu: e.target.value }))}
                        placeholder="Statü giriniz..."
                        style={{ flex: 1 }}
                      />
                    )}
                  </div>
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
              <div style={{ fontSize: '12px', fontFamily: "'DM Sans', sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-primary)', marginBottom: 16 }}>
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
                <div style={{ fontSize: '11px', fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-cyan)', fontWeight: 600, marginBottom: 16 }}>
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
                          fontFamily: "'DM Sans', sans-serif",
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
                  {/* Mevcut not geçmişi — salt okunur */}
                  {existingNotes && (
                    <div style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      marginBottom: 8,
                      maxHeight: 140,
                      overflowY: 'auto',
                    }}>
                      <div style={{ fontSize: '10px', color: 'var(--accent-cyan)', fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>
                        📅 Not Geçmişi
                      </div>
                      {existingNotes.split('\n').map((line, i) => (
                        <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, borderBottom: i < existingNotes.split('\n').length - 1 ? '1px solid var(--border-subtle)' : 'none', paddingBottom: 4, marginBottom: 4 }}>
                          {line}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Yeni not alanı */}
                  <div style={{ position: 'relative' }}>
                    <textarea
                      className="form-input"
                      value={newNoteInput}
                      onChange={e => setNewNoteInput(e.target.value)}
                      placeholder="Yeni not ekle... (kaydedildiğinde otomatik tarih-saat damgası eklenir)"
                      rows={2}
                    />
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                      📅 Kaydedildiğinde: [{new Date().toLocaleDateString('tr-TR')} {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}] — {newNoteInput.trim() || '(yazan metin)'}
                    </div>
                  </div>
                </FormField>

                {generatedNote() && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bu kaydetmede eklenecek not önizleme</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5, background: 'rgba(6,182,212,0.04)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, padding: '10px 12px' }}>
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
