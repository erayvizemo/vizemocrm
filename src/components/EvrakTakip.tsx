import { useState, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Customer, HizmetDurumu } from '../types';

const ACCENT = '#4f8ef7';
const ACCENT2 = '#7c5cfc';
const GREEN = '#22c987';
const ORANGE = '#f5a623';
const RED = '#f05252';

// ── Section wrapper ──────────────────────────────────────────
function Section({ icon, title, sub, children, delay = 0 }: {
    icon: string; title: string; sub?: string; children: React.ReactNode; delay?: number;
}) {
    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 14,
            padding: '24px 28px',
            marginBottom: 20,
            animation: `fadeUp 0.3s ease ${delay}s both`,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: `linear-gradient(135deg, ${ACCENT2}, ${ACCENT})`, flexShrink: 0 }}>
                    {icon}
                </div>
                <div>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{title}</div>
                    {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{sub}</div>}
                </div>
            </div>
            {children}
        </div>
    );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px', marginBottom: 3, fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
            {children}
        </div>
    );
}

function InfoVal({ children }: { children: React.ReactNode }) {
    return <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{children || '—'}</div>;
}

// ── Main Component ───────────────────────────────────────────
export default function EvrakTakip() {
    const {
        customers, view, setView,
        evrakCustomerId, setEvrakCustomerId,
        currentUser,
        uploadCustomerDoc, deleteCustomerDoc,
        updateEvrakKarar, addEvrakNot, saveEvrakFields,
        showToast,
    } = useApp();

    const [searchQuery, setSearchQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [noteInput, setNoteInput] = useState('');
    const [kararNot, setKararNot] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Customer selection ──
    const customer = customers.find(c => c.id === evrakCustomerId) ?? null;

    const filteredCustomers = customers.filter(c => {
        const q = searchQuery.toLowerCase();
        const name = `${c.firstName} ${c.lastName}`.toLowerCase();
        return name.includes(q) || c.telefon.includes(q);
    });

    // ── Local editable state (saved on demand) ──
    const [localPasaport, setLocalPasaport] = useState('');
    const [localSeyahatTipi, setLocalSeyahatTipi] = useState<('araba' | 'ucak' | 'gemi')[]>([]);
    const [localSponsor, setLocalSponsor] = useState<boolean | null>(null);
    const [localSchengen, setLocalSchengen] = useState<boolean | null>(null);
    const [localSchengenUlke, setLocalSchengenUlke] = useState('');
    const [localVizeTuru, setLocalVizeTuru] = useState<'turistik' | 'ticari' | 'aile' | null>(null);
    const [localHizmetler, setLocalHizmetler] = useState<HizmetDurumu>({
        otelRezervasyonu: null, ucakRezervasyonu: null, seyahatSigortasi: null, aracSigortasi: null,
    });

    // When a customer is selected, load their saved values
    const loadCustomer = useCallback((c: Customer) => {
        setEvrakCustomerId(c.id);
        setLocalPasaport(c.pasaportNo ?? '');
        setLocalSeyahatTipi(c.seyahatTipi ?? []);
        setLocalSponsor(c.sponsorlu ?? null);
        setLocalSchengen(c.schengenGecmisi ?? null);
        setLocalSchengenUlke(c.schengenUlkesi ?? '');
        setLocalVizeTuru(c.vizeTuru ?? null);
        setLocalHizmetler(c.hizmetler ?? { otelRezervasyonu: null, ucakRezervasyonu: null, seyahatSigortasi: null, aracSigortasi: null });
        setKararNot(c.evrakKararNotu ?? '');
        setNoteInput('');
    }, [setEvrakCustomerId]);

    function toggleSeyahat(type: 'araba' | 'ucak' | 'gemi') {
        setLocalSeyahatTipi(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    }

    async function handleSaveFields() {
        if (!customer) return;
        await saveEvrakFields(customer.id, {
            pasaportNo: localPasaport,
            seyahatTipi: localSeyahatTipi,
            sponsorlu: localSponsor,
            schengenGecmisi: localSchengen,
            schengenUlkesi: localSchengen ? localSchengenUlke : '',
            vizeTuru: localVizeTuru,
            hizmetler: localHizmetler,
        });
    }

    async function handleFileUpload(files: FileList | null) {
        if (!files || !customer) return;
        setUploading(true);
        for (const file of Array.from(files)) {
            await uploadCustomerDoc(customer.id, file, currentUser?.name ?? 'Bilinmiyor');
        }
        setUploading(false);
    }

    async function handleDeleteDoc(docId: string, fileName: string) {
        if (!customer) return;
        if (!confirm(`"${fileName}" silinecek. Emin misiniz?`)) return;
        await deleteCustomerDoc(customer.id, docId, fileName);
    }

    async function handleNoteSubmit() {
        if (!noteInput.trim() || !customer) return;
        await addEvrakNot(customer.id, noteInput.trim(), currentUser?.name ?? 'Bilinmiyor');
        setNoteInput('');
    }

    function appendTag(tag: string) {
        setNoteInput(prev => prev + (prev ? ' ' : '') + tag + ' ');
    }

    async function handleKarar(karar: 'approved' | 'feedback' | 'rejected') {
        if (!customer) return;
        if ((karar === 'feedback' || karar === 'rejected') && !kararNot.trim()) {
            showToast('Lütfen karar notunu doldurun.', 'error');
            return;
        }
        await updateEvrakKarar(customer.id, karar, kararNot);
    }

    // ── CUSTOMER SELECTION SCREEN ──────────────────────────────
    if (!customer) {
        return (
            <div style={{ padding: '32px 32px 64px', minHeight: '100vh', background: 'var(--bg-void)' }}>
                <style>{`
          @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

                <div style={{ marginBottom: 28 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 12px ${ACCENT}` }} />
                        <h1 style={{ fontSize: 28, color: ACCENT, margin: 0, fontFamily: "'Syne', sans-serif" }}>Evrak Takip &amp; Değerlendirme</h1>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                        Evrak kartını açmak istediğiniz müşteriyi seçin.
                    </div>
                </div>

                <div style={{ maxWidth: 640, background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 24 }}>
                    <input
                        className="form-input"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Müşteri adı veya telefon ile ara..."
                        style={{ marginBottom: 16, fontSize: 15 }}
                    />
                    <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {filteredCustomers.length === 0 ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 24 }}>Müşteri bulunamadı.</div>
                        ) : filteredCustomers.map(c => (
                            <button
                                key={c.id}
                                onClick={() => loadCustomer(c)}
                                style={{
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 10,
                                    padding: '12px 16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'border-color 0.15s',
                                    color: 'var(--text-primary)',
                                    textAlign: 'left',
                                }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = ACCENT)}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                            >
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.firstName} {c.lastName}</div>
                                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{c.telefon} · {c.vize ?? '—'} · {c.sehir ?? '—'}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {c.evrakKarar && (
                                        <span style={{
                                            padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                                            background: c.evrakKarar === 'approved' ? 'rgba(34,201,135,0.12)' : c.evrakKarar === 'rejected' ? 'rgba(240,82,82,0.12)' : 'rgba(245,166,35,0.12)',
                                            color: c.evrakKarar === 'approved' ? GREEN : c.evrakKarar === 'rejected' ? RED : ORANGE,
                                            border: `1px solid ${c.evrakKarar === 'approved' ? GREEN + '40' : c.evrakKarar === 'rejected' ? RED + '40' : ORANGE + '40'}`,
                                        }}>
                                            {c.evrakKarar === 'approved' ? '✅ Onaylı' : c.evrakKarar === 'rejected' ? '❌ Reddedildi' : '🔄 Feedback'}
                                        </span>
                                    )}
                                    <span style={{ color: ACCENT, fontSize: 13 }}>Aç →</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── CUSTOMER CARD ──────────────────────────────────────────
    const evraklar = customer.evraklar ?? [];
    const operatorNotlari = customer.evrakOperatorNotlari ?? [];

    return (
        <div style={{ padding: '32px 32px 64px', minHeight: '100vh', background: 'var(--bg-void)' }}>
            <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .toggle-btn-ev { padding: 7px 20px; border-radius: 8px; border: 1px solid var(--border-subtle); background: var(--bg-elevated); color: var(--text-muted); font-size: 13px; cursor: pointer; transition: all 0.15s; font-family: 'DM Sans', sans-serif; }
        .toggle-btn-ev:hover { border-color: ${ACCENT}; }
        .svc-btn-ev { padding: 5px 14px; border-radius: 6px; border: 1px solid var(--border-subtle); background: var(--bg-elevated); color: var(--text-muted); font-size: 12px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
        .svc-btn-ev:hover { border-color: ${ACCENT}; }
      `}</style>

            {/* Top bar */}
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <button
                            onClick={() => setEvrakCustomerId(null)}
                            style={{ padding: '6px 14px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}
                        >← Müşteri Seç</button>
                        <h1 style={{ fontSize: 22, color: ACCENT, margin: 0, fontFamily: "'Syne', sans-serif" }}>
                            Evrak Takip — {customer.firstName} {customer.lastName}
                        </h1>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: "'DM Sans', sans-serif", paddingLeft: 2 }}>
                        Müşteri Kartı &nbsp;·&nbsp; <strong style={{ color: 'var(--text-secondary)' }}>Evrak Takip &amp; Değerlendirme</strong>
                    </div>
                </div>
                {customer.evrakKarar && (
                    <div style={{
                        padding: '8px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14,
                        background: customer.evrakKarar === 'approved' ? 'rgba(34,201,135,0.12)' : customer.evrakKarar === 'rejected' ? 'rgba(240,82,82,0.12)' : 'rgba(245,166,35,0.12)',
                        color: customer.evrakKarar === 'approved' ? GREEN : customer.evrakKarar === 'rejected' ? RED : ORANGE,
                        border: `1px solid ${customer.evrakKarar === 'approved' ? GREEN + '40' : customer.evrakKarar === 'rejected' ? RED + '40' : ORANGE + '40'}`,
                    }}>
                        {customer.evrakKarar === 'approved' ? '✅ ONAYLANDI' : customer.evrakKarar === 'rejected' ? '❌ REDDEDİLDİ' : '🔄 FEEDBACK'}
                    </div>
                )}
            </div>

            <div style={{ maxWidth: 860, margin: '0 auto' }}>

                {/* 1. MÜŞTERİ BİLGİLERİ */}
                <Section icon="👤" title="Müşteri Bilgileri (CRM)" sub="Lead kaydından aktarılan bilgiler" delay={0.05}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                        <div><FieldLabel>Ad Soyad</FieldLabel><InfoVal>{customer.firstName} {customer.lastName}</InfoVal></div>
                        <div><FieldLabel>Telefon</FieldLabel><InfoVal>{customer.telefon}</InfoVal></div>
                        <div><FieldLabel>E-posta</FieldLabel><InfoVal>{customer.email || '—'}</InfoVal></div>
                        <div><FieldLabel>Vize Türü</FieldLabel><InfoVal>{customer.vize}</InfoVal></div>
                        <div>
                            <FieldLabel>Durum</FieldLabel>
                            <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11, background: 'rgba(79,142,247,0.12)', color: ACCENT, border: `1px solid rgba(79,142,247,0.3)` }}>
                                {customer.durum}
                            </span>
                        </div>
                        <div><FieldLabel>Şehir</FieldLabel><InfoVal>{customer.sehir || '—'}</InfoVal></div>
                        <div><FieldLabel>Süreç Durumu</FieldLabel><InfoVal>{customer.surec || '—'}</InfoVal></div>
                        <div><FieldLabel>Müşteri Kararı</FieldLabel><InfoVal>{customer.karar || '—'}</InfoVal></div>
                        <div><FieldLabel>Kayıt Tarihi</FieldLabel><InfoVal>{customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('tr-TR') : '—'}</InfoVal></div>
                    </div>
                    {customer.not && (
                        <>
                            <div style={{ height: 1, background: 'var(--border-subtle)', margin: '16px 0' }} />
                            <div>
                                <FieldLabel>Son Not (CRM)</FieldLabel>
                                <div style={{
                                    background: 'var(--bg-elevated)',
                                    border: '1px solid var(--border-subtle)',
                                    borderRadius: 8,
                                    padding: '10px 12px',
                                    fontSize: 13,
                                    color: 'var(--text-secondary)',
                                    lineHeight: 1.6,
                                    whiteSpace: 'pre-wrap',
                                    maxHeight: 120,
                                    overflowY: 'auto',
                                }}>
                                    {customer.not}
                                </div>
                            </div>
                        </>
                    )}
                </Section>

                {/* 2. VİZE TÜRÜ */}
                <Section icon="🌍" title="Vize Türü" sub="Seyahat amacını seçin" delay={0.1}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {([
                            { val: 'turistik', label: '✈️ Turistik' },
                            { val: 'ticari', label: '💼 Ticari' },
                            { val: 'aile', label: '👨‍👩‍👧 Aile & Arkadaş Ziyareti' },
                        ] as { val: 'turistik' | 'ticari' | 'aile'; label: string }[]).map(opt => (
                            <button
                                key={opt.val}
                                className="toggle-btn-ev"
                                onClick={() => setLocalVizeTuru(localVizeTuru === opt.val ? null : opt.val)}
                                style={{
                                    borderColor: localVizeTuru === opt.val ? ACCENT : 'var(--border-subtle)',
                                    background: localVizeTuru === opt.val ? `rgba(79,142,247,0.1)` : 'var(--bg-elevated)',
                                    color: localVizeTuru === opt.val ? ACCENT : 'var(--text-muted)',
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </Section>

                {/* 3. PASAPORT & SEYAHAT */}
                <Section icon="📄" title="Pasaport & Seyahat Bilgileri" delay={0.15}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <FieldLabel>Pasaport Numarası</FieldLabel>
                            <input
                                className="form-input"
                                value={localPasaport}
                                onChange={e => setLocalPasaport(e.target.value)}
                                placeholder="AA 1234567"
                                maxLength={20}
                            />
                        </div>
                        <div>
                            <FieldLabel>Seyahat Tipi</FieldLabel>
                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                {([
                                    { val: 'araba', label: '🚗 Araba' },
                                    { val: 'ucak', label: '✈️ Uçak' },
                                    { val: 'gemi', label: '🚢 Gemi' },
                                ] as { val: 'araba' | 'ucak' | 'gemi'; label: string }[]).map(opt => (
                                    <button
                                        key={opt.val}
                                        className="toggle-btn-ev"
                                        onClick={() => toggleSeyahat(opt.val)}
                                        style={{
                                            borderColor: localSeyahatTipi.includes(opt.val) ? ACCENT : 'var(--border-subtle)',
                                            background: localSeyahatTipi.includes(opt.val) ? `rgba(79,142,247,0.1)` : 'var(--bg-elevated)',
                                            color: localSeyahatTipi.includes(opt.val) ? ACCENT : 'var(--text-muted)',
                                        }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <FieldLabel>Sponsorlu Seyahat?</FieldLabel>
                            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                <button className="toggle-btn-ev" onClick={() => setLocalSponsor(true)} style={{ borderColor: localSponsor === true ? GREEN : 'var(--border-subtle)', background: localSponsor === true ? 'rgba(34,201,135,0.1)' : 'var(--bg-elevated)', color: localSponsor === true ? GREEN : 'var(--text-muted)' }}>✅ Evet</button>
                                <button className="toggle-btn-ev" onClick={() => setLocalSponsor(false)} style={{ borderColor: localSponsor === false ? RED : 'var(--border-subtle)', background: localSponsor === false ? 'rgba(240,82,82,0.1)' : 'var(--bg-elevated)', color: localSponsor === false ? RED : 'var(--text-muted)' }}>❌ Hayır</button>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* 4. SCHENGEN GEÇMİŞİ */}
                <Section icon="🇪🇺" title="Schengen Geçmişi" sub="Son 2 yıl içinde Schengen vizesi var mı?" delay={0.2}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="toggle-btn-ev" onClick={() => setLocalSchengen(true)} style={{ borderColor: localSchengen === true ? GREEN : 'var(--border-subtle)', background: localSchengen === true ? 'rgba(34,201,135,0.1)' : 'var(--bg-elevated)', color: localSchengen === true ? GREEN : 'var(--text-muted)' }}>✅ Evet</button>
                        <button className="toggle-btn-ev" onClick={() => { setLocalSchengen(false); setLocalSchengenUlke(''); }} style={{ borderColor: localSchengen === false ? RED : 'var(--border-subtle)', background: localSchengen === false ? 'rgba(240,82,82,0.1)' : 'var(--bg-elevated)', color: localSchengen === false ? RED : 'var(--text-muted)' }}>❌ Hayır</button>
                    </div>
                    {localSchengen === true && (
                        <div style={{ marginTop: 14 }}>
                            <FieldLabel>Hangi Schengen Ülkesi?</FieldLabel>
                            <select className="form-input" value={localSchengenUlke} onChange={e => setLocalSchengenUlke(e.target.value)} style={{ marginTop: 4 }}>
                                <option value="">— Ülke seçin —</option>
                                {['🇩🇪 Almanya', '🇫🇷 Fransa', '🇮🇹 İtalya', '🇪🇸 İspanya', '🇳🇱 Hollanda', '🇧🇪 Belçika', '🇦🇹 Avusturya', '🇨🇭 İsviçre', '🇬🇷 Yunanistan', '🇵🇹 Portekiz',
                                    '🇸🇪 İsveç', '🇳🇴 Norveç', '🇩🇰 Danimarka', '🇫🇮 Finlandiya', '🇨🇿 Çek Cumhuriyeti', '🇸🇰 Slovakya', '🇸🇮 Slovenya', '🇭🇺 Macaristan',
                                    '🇵🇱 Polonya', '🇱🇺 Lüksemburg', '🇲🇹 Malta', '🇮🇸 İzlanda', '🇱🇮 Liechtenstein', '🇪🇪 Estonya', '🇱🇻 Letonya', '🇱🇹 Litvanya', '🇭🇷 Hırvatistan'
                                ].map(u => <option key={u}>{u}</option>)}
                            </select>
                        </div>
                    )}
                </Section>

                {/* 5. HİZMET YÖNETİMİ */}
                <Section icon="⚙️" title="Hizmet Yönetimi" sub="Her hizmet için sorumluluğu belirleyin" delay={0.25}>
                    {([
                        { key: 'otelRezervasyonu', label: '🏨 Otel Rezervasyonu' },
                        { key: 'ucakRezervasyonu', label: '✈️ Uçak Rezervasyonu' },
                        { key: 'seyahatSigortasi', label: '🏥 Seyahat Sağlık Sigortası' },
                        { key: 'aracSigortasi', label: '🚗 Araç Sigortası' },
                    ] as { key: keyof HizmetDurumu; label: string }[]).map(h => (
                        <div key={h.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{h.label}</span>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button className="svc-btn-ev"
                                    onClick={() => setLocalHizmetler(p => ({ ...p, [h.key]: p[h.key] === 'biz' ? null : 'biz' }))}
                                    style={{ borderColor: localHizmetler[h.key] === 'biz' ? ACCENT : 'var(--border-subtle)', background: localHizmetler[h.key] === 'biz' ? `rgba(79,142,247,0.1)` : 'var(--bg-elevated)', color: localHizmetler[h.key] === 'biz' ? ACCENT : 'var(--text-muted)' }}
                                >Biz Yapıyoruz</button>
                                <button className="svc-btn-ev"
                                    onClick={() => setLocalHizmetler(p => ({ ...p, [h.key]: p[h.key] === 'gerekmez' ? null : 'gerekmez' }))}
                                    style={{ borderColor: localHizmetler[h.key] === 'gerekmez' ? 'var(--text-muted)' : 'var(--border-subtle)', background: localHizmetler[h.key] === 'gerekmez' ? 'rgba(107,114,128,0.1)' : 'var(--bg-elevated)', color: localHizmetler[h.key] === 'gerekmez' ? 'var(--text-muted)' : 'var(--text-muted)' }}
                                >Gerekmiyor</button>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={handleSaveFields}
                        style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, background: `linear-gradient(135deg, ${ACCENT2}, ${ACCENT})`, border: 'none', color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                        💾 Tüm Bilgileri Kaydet
                    </button>
                </Section>

                {/* 6. EVRAK YÜKLEME */}
                <Section icon="📎" title="Evrak Yükleme" sub="PDF, JPG, PNG desteklenir — maks 10MB" delay={0.3}>
                    <div
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); }}
                        style={{
                            border: `2px dashed ${uploading ? ACCENT : 'var(--border-subtle)'}`,
                            borderRadius: 10,
                            padding: 28,
                            textAlign: 'center',
                            cursor: uploading ? 'wait' : 'pointer',
                            background: uploading ? `rgba(79,142,247,0.04)` : 'var(--bg-elevated)',
                            transition: 'all 0.2s',
                        }}
                    >
                        <div style={{ fontSize: 28, marginBottom: 8 }}>📁</div>
                        <p style={{ color: 'var(--text-muted)', fontSize: 12, margin: 0 }}>
                            {uploading ? '⏳ Yükleniyor...' : <><strong style={{ color: ACCENT }}>Dosya seçmek için tıklayın</strong> veya sürükleyin</>}
                        </p>
                        <p style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4 }}>PDF · JPG · PNG — Maks. 10MB</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        onChange={e => handleFileUpload(e.target.files)}
                    />

                    {evraklar.length > 0 && (
                        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {evraklar.map(doc => (
                                <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ background: 'rgba(79,142,247,0.15)', color: ACCENT, padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                                            {doc.name.split('.').pop()?.toUpperCase()}
                                        </span>
                                        <a href={doc.url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                                            {doc.name}
                                        </a>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                                            {(doc.size / 1024).toFixed(0)} KB · {new Date(doc.uploadedAt).toLocaleString('tr-TR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })} · {doc.uploadedBy}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteDoc(doc.id, doc.name)}
                                            style={{ color: RED, cursor: 'pointer', fontSize: 16, background: 'none', border: 'none', lineHeight: 1 }}
                                            title="Sil"
                                        >×</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {evraklar.length === 0 && (
                        <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>Henüz evrak yüklenmemiş.</div>
                    )}
                </Section>

                {/* 7. OPERATÖR NOTLARI */}
                <Section icon="✏️" title="Operatör Notları" sub="Zaman damgalı kayıt — herkes görebilir" delay={0.35}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                        {['[Takip Gerekli]', '[Eksik Evrak]', '[Müşteri Arandı]', '[Acil]'].map(tag => (
                            <button key={tag} onClick={() => appendTag(tag)} style={{ padding: '4px 10px', borderRadius: 5, border: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: 11, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>
                                {tag === '[Takip Gerekli]' ? '📌' : tag === '[Eksik Evrak]' ? '📄' : tag === '[Müşteri Arandı]' ? '📞' : '🔴'} {tag}
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="form-input"
                        value={noteInput}
                        onChange={e => setNoteInput(e.target.value)}
                        placeholder="Notunuzu buraya yazın..."
                        rows={3}
                        style={{ width: '100%', resize: 'vertical', lineHeight: 1.7 }}
                    />
                    <button
                        onClick={handleNoteSubmit}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '8px 18px', background: `linear-gradient(135deg, ${ACCENT2}, ${ACCENT})`, border: 'none', borderRadius: 8, color: '#fff', fontSize: 12, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', fontWeight: 500 }}
                    >
                        💾 Notu Kaydet
                    </button>
                    {operatorNotlari.length > 0 && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {[...operatorNotlari].reverse().map((n, i) => (
                                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderLeft: `3px solid ${ACCENT2}`, borderRadius: '0 8px 8px 0', padding: '10px 14px', fontSize: 12 }}>
                                    <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>
                                        🕐 {new Date(n.timestamp).toLocaleString('tr-TR')} &nbsp;·&nbsp; {n.author}
                                    </div>
                                    {n.text}
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {/* 8. DEĞERLENDİRME KARARI */}
                <Section icon="⚖️" title="Değerlendirme Kararı" sub="Evrak ve müşteri bilgileri eksiksiz incelendikten sonra karar verin" delay={0.4}>
                    <div style={{ display: 'flex', gap: 14, marginTop: 4 }}>
                        {([
                            { type: 'approved', icon: '✅', label: 'ONAYLANDI', sub: 'Onaylandı — Sürece alındı', color: GREEN },
                            { type: 'feedback', icon: '🔄', label: 'FEEDBACK', sub: 'Düzeltme / Ek Evrak Gerekli', color: ORANGE },
                            { type: 'rejected', icon: '❌', label: 'REDDEDİLDİ', sub: 'Reddedildi — İşlem Sonlandı', color: RED },
                        ] as { type: 'approved' | 'feedback' | 'rejected'; icon: string; label: string; sub: string; color: string }[]).map(opt => (
                            <button
                                key={opt.type}
                                onClick={() => handleKarar(opt.type)}
                                style={{
                                    flex: 1,
                                    padding: 16,
                                    borderRadius: 12,
                                    border: `2px solid ${customer.evrakKarar === opt.type ? opt.color : 'var(--border-subtle)'}`,
                                    background: customer.evrakKarar === opt.type ? `rgba(${opt.color === GREEN ? '34,201,135' : opt.color === ORANGE ? '245,166,35' : '240,82,82'},0.08)` : 'var(--bg-elevated)',
                                    color: customer.evrakKarar === opt.type ? opt.color : 'var(--text-muted)',
                                    fontFamily: "'Syne', sans-serif",
                                    fontWeight: 700,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 6,
                                    transition: 'all 0.2s',
                                }}
                            >
                                <span style={{ fontSize: 26 }}>{opt.icon}</span>
                                <span>{opt.label}</span>
                                <span style={{ fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 400, color: customer.evrakKarar === opt.type ? `${opt.color}B0` : 'var(--text-muted)' }}>{opt.sub}</span>
                            </button>
                        ))}
                    </div>

                    <div style={{ marginTop: 14 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                            Karar Notu {customer.evrakKarar !== 'approved' ? '(Zorunlu)' : '(İsteğe bağlı)'}
                        </div>
                        <textarea
                            className="form-input"
                            value={kararNot}
                            onChange={e => setKararNot(e.target.value)}
                            placeholder="Karar gerekçesini yazın..."
                            rows={2}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {customer.evrakKararTarihi && (
                        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)' }}>
                            Son karar: {new Date(customer.evrakKararTarihi).toLocaleString('tr-TR')}
                        </div>
                    )}
                </Section>

            </div>
        </div>
    );
}
