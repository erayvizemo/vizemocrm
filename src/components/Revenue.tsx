import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const GOLD = '#f7c94f';
const CITY_COLORS: Record<string, string> = {
  'Eskişehir': '#4f8ef7',
  'Gaziantep': '#f7a14f',
  'İstanbul': '#38d9a9',
};

const DANISMAN_OPTIONS = ['Eray', 'Dilara', 'Elanur'];

function fmt(n: number) {
  return n.toLocaleString('tr-TR') + ' ₺';
}

export default function Revenue() {
  const { revenue, addRevenue } = useApp();
  const [filterDanisman, setFilterDanisman] = useState('');
  const [filterSehir, setFilterSehir] = useState('');
  const [sortCol, setSortCol] = useState<'ad' | 'danisman' | 'sehir' | 'toplam' | 'onOdemeTarihi'>('onOdemeTarihi');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const emptyForm = {
    ad: '', danisman: '', sehir: '', odemeYontemi: '💵 Elden',
    onOdemeTarihi: new Date().toISOString().substring(0, 10),
    onOdeme: '', kalanTarih: '', kalanOdeme: '',
  };
  const [form, setForm] = useState(emptyForm);

  // Unique consultants & cities – merge hardcoded list with dynamic ones
  const consultants = useMemo(() => {
    const s = new Set<string>(DANISMAN_OPTIONS);
    revenue.forEach(r => { if (r.danisman) s.add(r.danisman); });
    return Array.from(s).sort();
  }, [revenue]);

  const cities = useMemo(() => {
    const s = new Set<string>();
    revenue.forEach(r => { if (r.sehir) s.add(r.sehir); });
    return Array.from(s).sort();
  }, [revenue]);

  // KPIs
  const toplam = revenue.reduce((acc, r) => acc + r.toplam, 0);
  const onOdemeToplam = revenue.reduce((acc, r) => acc + r.onOdeme, 0);
  const kalanToplam = revenue.reduce((acc, r) => acc + r.kalanOdeme, 0);

  // Per-consultant
  const danismanStats = useMemo(() => {
    const m: Record<string, { toplam: number; count: number }> = {};
    revenue.forEach(r => {
      if (!m[r.danisman]) m[r.danisman] = { toplam: 0, count: 0 };
      m[r.danisman].toplam += r.toplam;
      m[r.danisman].count++;
    });
    return Object.entries(m).map(([name, v]) => ({ name, ...v }));
  }, [revenue]);

  // Per-city
  const sehirStats = useMemo(() => {
    const m: Record<string, { toplam: number; count: number }> = {};
    revenue.forEach(r => {
      if (!m[r.sehir]) m[r.sehir] = { toplam: 0, count: 0 };
      m[r.sehir].toplam += r.toplam;
      m[r.sehir].count++;
    });
    return Object.entries(m).map(([name, v]) => ({ name, ...v }));
  }, [revenue]);

  // Payment method counts
  const odemeStats = useMemo(() => {
    const m: Record<string, number> = {};
    revenue.forEach(r => {
      const k = r.odemeYontemi || 'Bilinmiyor';
      m[k] = (m[k] ?? 0) + r.toplam;
    });
    return Object.entries(m).map(([name, value]) => ({ name, value }));
  }, [revenue]);

  // Filtered
  const filtered = useMemo(() => {
    let list = revenue;
    if (filterDanisman) list = list.filter(r => r.danisman === filterDanisman);
    if (filterSehir) list = list.filter(r => r.sehir === filterSehir);
    return [...list].sort((a, b) => {
      const av: string | number = a[sortCol];
      const bv: string | number = b[sortCol];
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av;
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv), 'tr')
        : String(bv).localeCompare(String(av), 'tr');
    });
  }, [revenue, filterDanisman, filterSehir, sortCol, sortDir]);

  function toggleSort(c: typeof sortCol) {
    if (sortCol === c) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(c); setSortDir('asc'); }
  }

  function TH({ col, label }: { col: typeof sortCol; label: string }) {
    return (
      <th
        onClick={() => toggleSort(col)}
        style={{
          padding: '10px 14px',
          textAlign: 'left',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '0.65rem',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.07em',
          color: sortCol === col ? GOLD : 'var(--muted)',
          cursor: 'pointer',
          userSelect: 'none' as const,
          whiteSpace: 'nowrap' as const,
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        {label} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : ''}
      </th>
    );
  }

  const handleSubmit = useCallback(() => {
    if (!form.ad.trim()) return;
    const onOdeme = parseFloat(form.onOdeme) || 0;
    const kalanOdeme = parseFloat(form.kalanOdeme) || 0;
    addRevenue({
      ad: form.ad.trim(),
      danisman: form.danisman || 'Belirsiz',
      sehir: form.sehir || 'Belirsiz',
      odemeYontemi: form.odemeYontemi,
      onOdemeTarihi: form.onOdemeTarihi,
      onOdeme,
      kalanTarih: form.kalanTarih || '-',
      kalanOdeme,
      toplam: onOdeme + kalanOdeme,
    });
    setForm(emptyForm);
    setShowAddModal(false);
  }, [form, addRevenue, emptyForm]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', background: 'var(--surface2)',
    border: '1px solid var(--border)', borderRadius: 10,
    color: 'var(--text)', fontSize: '0.85rem', fontFamily: "'IBM Plex Mono', monospace",
    outline: 'none', transition: 'border-color 0.2s',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: '0.68rem', fontFamily: "'IBM Plex Mono', monospace",
    color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em',
    marginBottom: 6, display: 'block',
  };

  return (
    <div style={{ padding: 24, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: GOLD }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: GOLD }}>Gelir Takibi</h2>
          <span style={{ fontSize: '0.68rem', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--muted)', marginLeft: 4 }}>Şubat 2026</span>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              marginLeft: 'auto', padding: '8px 18px',
              background: `linear-gradient(135deg, ${GOLD}, #e5b83a)`,
              border: 'none', borderRadius: 10, cursor: 'pointer',
              color: '#0f1117', fontWeight: 700, fontSize: '0.82rem',
              fontFamily: "'IBM Plex Mono', monospace",
              boxShadow: `0 4px 16px ${GOLD}33`,
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 24px ${GOLD}55`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 16px ${GOLD}33`; }}
          >
            ＋ Yeni Gelir
          </button>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginLeft: 20 }}>
          {revenue.length} işlem · Tüm şubeler
        </div>
      </div>

      {/* Add Revenue Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)', border: `1px solid ${GOLD}44`,
              borderRadius: 16, padding: '28px 32px',
              width: '100%', maxWidth: 520,
              boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${GOLD}11`,
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: GOLD, margin: 0 }}>Yeni Gelir Kaydı</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {/* Ad Soyad */}
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Müşteri Ad Soyad *</label>
              <input
                style={inputStyle}
                placeholder="Örn: Ahmet Yılmaz"
                value={form.ad}
                onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                onFocus={e => (e.target.style.borderColor = GOLD)}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                autoFocus
              />
            </div>

            {/* Danışman + Şehir */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Danışman</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.danisman}
                  onChange={e => setForm(f => ({ ...f, danisman: e.target.value }))}
                >
                  <option value="">Seçiniz</option>
                  {consultants.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Şehir</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.sehir}
                  onChange={e => setForm(f => ({ ...f, sehir: e.target.value }))}
                >
                  <option value="">Seçiniz</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Ödeme Yöntemi + Tarih */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Ödeme Yöntemi</label>
                <select
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  value={form.odemeYontemi}
                  onChange={e => setForm(f => ({ ...f, odemeYontemi: e.target.value }))}
                >
                  <option value="💵 Elden">💵 Elden</option>
                  <option value="🏦 İban">🏦 İban</option>
                  <option value="💳 Kredi Kartı">💳 Kredi Kartı</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Ön Ödeme Tarihi</label>
                <input
                  type="date"
                  style={inputStyle}
                  value={form.onOdemeTarihi}
                  onChange={e => setForm(f => ({ ...f, onOdemeTarihi: e.target.value }))}
                />
              </div>
            </div>

            {/* Ön Ödeme + Kalan */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Ön Ödeme Tutarı (₺)</label>
                <input
                  type="number"
                  style={inputStyle}
                  placeholder="0"
                  value={form.onOdeme}
                  onChange={e => setForm(f => ({ ...f, onOdeme: e.target.value }))}
                  onFocus={e => (e.target.style.borderColor = GOLD)}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
              <div>
                <label style={labelStyle}>Kalan Ödeme (₺)</label>
                <input
                  type="number"
                  style={inputStyle}
                  placeholder="0"
                  value={form.kalanOdeme}
                  onChange={e => setForm(f => ({ ...f, kalanOdeme: e.target.value }))}
                  onFocus={e => (e.target.style.borderColor = GOLD)}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>
            </div>

            {/* Kalan Tarih */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Kalan Ödeme Tarihi</label>
              <input
                type="date"
                style={inputStyle}
                value={form.kalanTarih}
                onChange={e => setForm(f => ({ ...f, kalanTarih: e.target.value }))}
              />
            </div>

            {/* Toplam Preview */}
            <div style={{
              background: `${GOLD}0a`, border: `1px solid ${GOLD}33`,
              borderRadius: 10, padding: '12px 16px', marginBottom: 20,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '0.75rem', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--muted)', textTransform: 'uppercase' }}>Toplam Tutar</span>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: GOLD }}>
                {fmt((parseFloat(form.onOdeme) || 0) + (parseFloat(form.kalanOdeme) || 0))}
              </span>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1, padding: '11px 0', background: 'var(--surface2)',
                  border: '1px solid var(--border)', borderRadius: 10,
                  color: 'var(--muted)', cursor: 'pointer', fontSize: '0.82rem',
                  fontFamily: "'IBM Plex Mono', monospace", transition: 'all 0.15s',
                }}
              >
                İptal
              </button>
              <button
                onClick={handleSubmit}
                disabled={!form.ad.trim()}
                style={{
                  flex: 2, padding: '11px 0',
                  background: form.ad.trim() ? `linear-gradient(135deg, ${GOLD}, #e5b83a)` : '#333',
                  border: 'none', borderRadius: 10,
                  color: form.ad.trim() ? '#0f1117' : '#666',
                  cursor: form.ad.trim() ? 'pointer' : 'not-allowed',
                  fontWeight: 700, fontSize: '0.85rem',
                  fontFamily: "'IBM Plex Mono', monospace",
                  boxShadow: form.ad.trim() ? `0 4px 16px ${GOLD}33` : 'none',
                  transition: 'all 0.2s',
                }}
              >
                ✓ Gelir Kaydı Ekle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 20 }}>
        <div style={{ background: 'var(--surface)', border: `1px solid ${GOLD}44`, borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.68rem', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Toplam Gelir</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: GOLD }}>{fmt(toplam)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>{revenue.length} müşteri</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.68rem', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Tahsil Edilen</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: '#38d9a9' }}>{fmt(onOdemeToplam)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>
            {toplam > 0 ? Math.round(onOdemeToplam / toplam * 100) : 0}% tahsil
          </div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.68rem', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Kalan Tahsilat</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, fontFamily: "'IBM Plex Mono', monospace", color: kalanToplam > 0 ? '#e05c5c' : '#38d9a9' }}>{fmt(kalanToplam)}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 4 }}>
            {kalanToplam === 0 ? '✓ Tüm ödemeler tamamlandı' : 'bekleyen ödeme'}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        {/* Consultant bar chart */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
            Danışman Bazlı Gelir
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={danismanStats} barSize={36}>
              <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 10, fontFamily: 'IBM Plex Mono, monospace' }} axisLine={false} tickLine={false} tickFormatter={(v) => (v / 1000).toFixed(0) + 'K'} />
              <Tooltip
                contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: '0.75rem', fontFamily: 'IBM Plex Mono, monospace' }}
                formatter={(v: number) => [fmt(v), 'Toplam']}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="toplam" radius={[4, 4, 0, 0]}>
                {danismanStats.map((_, i) => (
                  <Cell key={i} fill={[GOLD, '#4f8ef7', '#38d9a9', '#f7a14f'][i % 4]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* City breakdown */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
            Şehir Bazlı Gelir
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sehirStats.sort((a, b) => b.toplam - a.toplam).map(s => {
              const pct = toplam > 0 ? (s.toplam / toplam) * 100 : 0;
              const color = CITY_COLORS[s.name] ?? '#6c7a8a';
              return (
                <div key={s.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text)' }}>{s.name}</span>
                    <span style={{ fontSize: '0.72rem', fontFamily: "'IBM Plex Mono', monospace", color }}>
                      {fmt(s.toplam)} <span style={{ color: 'var(--muted)' }}>({s.count} işlem)</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Payment methods */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.68rem', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Ödeme Yöntemi
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {odemeStats.map(o => (
                <div key={o.name} style={{
                  padding: '5px 12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 20,
                  fontSize: '0.72rem',
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: 'var(--text)',
                }}>
                  {o.name} — <span style={{ color: GOLD }}>{fmt(o.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace" }}>Filtrele:</span>
        {consultants.map(d => (
          <button
            key={d}
            onClick={() => setFilterDanisman(filterDanisman === d ? '' : d)}
            style={{
              padding: '5px 12px',
              background: filterDanisman === d ? `${GOLD}22` : 'var(--surface)',
              border: filterDanisman === d ? `1px solid ${GOLD}` : '1px solid var(--border)',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontFamily: "'IBM Plex Mono', monospace",
              color: filterDanisman === d ? GOLD : 'var(--muted)',
              transition: 'all 0.15s',
            }}
          >
            👤 {d}
          </button>
        ))}
        {cities.map(c => (
          <button
            key={c}
            onClick={() => setFilterSehir(filterSehir === c ? '' : c)}
            style={{
              padding: '5px 12px',
              background: filterSehir === c ? `${CITY_COLORS[c] ?? '#6c7a8a'}22` : 'var(--surface)',
              border: filterSehir === c ? `1px solid ${CITY_COLORS[c] ?? '#6c7a8a'}` : '1px solid var(--border)',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontFamily: "'IBM Plex Mono', monospace",
              color: filterSehir === c ? (CITY_COLORS[c] ?? '#6c7a8a') : 'var(--muted)',
              transition: 'all 0.15s',
            }}
          >
            🏙️ {c}
          </button>
        ))}
        {(filterDanisman || filterSehir) && (
          <button
            onClick={() => { setFilterDanisman(''); setFilterSehir(''); }}
            style={{ padding: '5px 10px', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem' }}
          >
            ✕ Temizle
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--muted)' }}>
          {filtered.length} kayıt · {fmt(filtered.reduce((a, r) => a + r.toplam, 0))} toplam
        </span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <TH col="ad" label="Müşteri" />
                <TH col="danisman" label="Danışman" />
                <TH col="sehir" label="Şehir" />
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>Ödeme Yöntemi</th>
                <TH col="onOdemeTarihi" label="Ön Ödeme Tarihi" />
                <th style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>Ön Ödeme</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>Kalan Tarih</th>
                <th style={{ padding: '10px 14px', textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>Kalan</th>
                <TH col="toplam" label="Toplam" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem' }}>Kayıt bulunamadı.</td>
                </tr>
              )}
              {filtered.map((r, i) => {
                const cityColor = CITY_COLORS[r.sehir] ?? '#6c7a8a';
                return (
                  <tr
                    key={r.id}
                    style={{
                      background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)',
                      borderBottom: '1px solid var(--border)',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(247,201,79,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)')}
                  >
                    <td style={{ padding: '10px 14px', fontSize: '0.83rem', fontWeight: 500 }}>{r.ad}</td>
                    <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace" }}>{r.danisman}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        background: `${cityColor}18`,
                        color: cityColor,
                        border: `1px solid ${cityColor}33`,
                        borderRadius: 8,
                        padding: '2px 8px',
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}>{r.sehir}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace" }}>{r.odemeYontemi}</td>
                    <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' }}>{r.onOdemeTarihi}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.8rem', fontFamily: "'IBM Plex Mono', monospace", color: '#38d9a9', fontWeight: 500 }}>
                      {r.onOdeme > 0 ? fmt(r.onOdeme) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' }}>
                      {r.kalanTarih && r.kalanTarih !== '-' ? r.kalanTarih : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.8rem', fontFamily: "'IBM Plex Mono', monospace", color: r.kalanOdeme > 0 ? '#e05c5c' : 'var(--muted)', fontWeight: r.kalanOdeme > 0 ? 600 : 400 }}>
                      {r.kalanOdeme > 0 ? fmt(r.kalanOdeme) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontSize: '0.85rem', fontFamily: "'IBM Plex Mono', monospace", color: GOLD, fontWeight: 700 }}>
                      {fmt(r.toplam)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Footer totals */}
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: `2px solid ${GOLD}44` }}>
                  <td colSpan={5} style={{ padding: '12px 14px', fontSize: '0.75rem', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--muted)' }}>
                    TOPLAM — {filtered.length} işlem
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.8rem', fontFamily: "'IBM Plex Mono', monospace", color: '#38d9a9', fontWeight: 700 }}>
                    {fmt(filtered.reduce((a, r) => a + r.onOdeme, 0))}
                  </td>
                  <td />
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.8rem', fontFamily: "'IBM Plex Mono', monospace", color: '#e05c5c', fontWeight: 700 }}>
                    {filtered.reduce((a, r) => a + r.kalanOdeme, 0) > 0
                      ? fmt(filtered.reduce((a, r) => a + r.kalanOdeme, 0))
                      : '—'}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontSize: '0.9rem', fontFamily: "'IBM Plex Mono', monospace", color: GOLD, fontWeight: 700 }}>
                    {fmt(filtered.reduce((a, r) => a + r.toplam, 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
