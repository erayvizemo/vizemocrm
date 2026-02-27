import { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const GOLD = 'var(--accent-amber)';
const CITY_COLORS: Record<string, string> = {
  'Eskişehir': 'var(--accent-primary)',
  'Gaziantep': 'var(--accent-amber)',
  'İstanbul': 'var(--accent-emerald)',
};

const DANISMAN_OPTIONS = ['Eray', 'Dilara', 'Elanur', 'Selin', 'Merve'];

function fmt(n: number) {
  return n.toLocaleString('tr-TR') + ' ₺';
}

export default function Revenue() {
  const { revenue, addRevenue, updateRevenue, deleteRevenue } = useApp();
  const [filterDanisman, setFilterDanisman] = useState('');
  const [filterSehir, setFilterSehir] = useState('');
  const [sortCol, setSortCol] = useState<'firstName' | 'danisman' | 'sehir' | 'toplam' | 'onOdemeTarihi'>('onOdemeTarihi');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntryId, setEditEntryId] = useState<string | null>(null);

  // Form state
  const emptyForm = {
    firstName: '', lastName: '', danisman: '', sehir: '', odemeYontemi: '💵 Elden',
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
          padding: '12px 16px',
          textAlign: 'left',
          fontFamily: "'Syne', sans-serif",
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: sortCol === col ? GOLD : 'var(--text-muted)',
          cursor: 'pointer',
          userSelect: 'none',
          whiteSpace: 'nowrap',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          transition: 'color 0.2s',
        }}
      >
        {label} <span style={{ color: sortCol === col ? GOLD : 'transparent' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
      </th>
    );
  }

  const handleSubmit = useCallback(() => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    const onOdeme = parseFloat(form.onOdeme) || 0;
    const kalanOdeme = parseFloat(form.kalanOdeme) || 0;
    const data = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      danisman: form.danisman || 'Belirsiz',
      sehir: form.sehir || 'Belirsiz',
      odemeYontemi: form.odemeYontemi,
      onOdemeTarihi: form.onOdemeTarihi,
      onOdeme,
      kalanTarih: form.kalanTarih || '-',
      kalanOdeme,
      toplam: onOdeme + kalanOdeme,
    };

    if (editEntryId) {
      updateRevenue(editEntryId, data);
    } else {
      addRevenue(data);
    }

    setForm(emptyForm);
    setShowAddModal(false);
    setEditEntryId(null);
  }, [form, addRevenue, updateRevenue, editEntryId, emptyForm]);

  const handleEdit = (entry: any) => {
    setEditEntryId(entry.id);
    setForm({
      firstName: entry.firstName,
      lastName: entry.lastName,
      danisman: entry.danisman,
      sehir: entry.sehir,
      odemeYontemi: entry.odemeYontemi || '💵 Elden',
      onOdemeTarihi: entry.onOdemeTarihi,
      onOdeme: entry.onOdeme.toString(),
      kalanTarih: entry.kalanTarih === '-' ? '' : entry.kalanTarih,
      kalanOdeme: entry.kalanOdeme.toString(),
    });
    setShowAddModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bu gelir kaydını silmek istediğinize emin misiniz?')) {
      deleteRevenue(id);
    }
  };

  return (
    <div style={{ padding: '64px 32px 32px', minHeight: '100vh', background: 'var(--bg-void)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '28px', color: GOLD, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 12, height: 12, borderRadius: '50%', background: GOLD, boxShadow: `0 0 12px ${GOLD}` }} />
            Gelir Takibi
          </h1>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
            Mali veriler ve tahsilat durumları
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={() => {
            setEditEntryId(null);
            setForm(emptyForm);
            setShowAddModal(true);
          }}
          style={{ background: `linear-gradient(135deg, ${GOLD}, #d97706)`, boxShadow: `0 4px 16px rgba(245, 158, 11, 0.25)` }}
        >
          ＋ Yeni Gelir
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="chart-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ fontSize: '11px', fontFamily: "'Syne', sans-serif", color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, fontWeight: 700 }}>Toplam Gelir</div>
          <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: "'Syne', sans-serif", color: GOLD, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{fmt(toplam)}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 8 }}>{revenue.length} müşteri kaydı</div>
        </div>
        <div className="chart-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ fontSize: '11px', fontFamily: "'Syne', sans-serif", color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, fontWeight: 700 }}>Tahsil Edilen</div>
          <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--accent-emerald)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{fmt(onOdemeToplam)}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 8 }}>
            {toplam > 0 ? Math.round(onOdemeToplam / toplam * 100) : 0}% tahsil edildi
          </div>
        </div>
        <div className="chart-card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, background: 'radial-gradient(circle, rgba(244, 63, 94, 0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ fontSize: '11px', fontFamily: "'Syne', sans-serif", color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, fontWeight: 700 }}>Kalan Tahsilat</div>
          <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: "'Syne', sans-serif", color: kalanToplam > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{fmt(kalanToplam)}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 8 }}>
            {kalanToplam === 0 ? '✓ Tüm ödemeler tahsil edildi' : 'Bekleyen ödemeler var'}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Consultant bar chart */}
        <div className="chart-card">
          <div className="chart-title">Danışman Bazlı Gelir</div>
          <div className="chart-subtitle">Danışmanların toplam getirdikleri gelir</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={danismanStats} barSize={40} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} axisLine={{ stroke: 'var(--border-subtle)' }} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} tickFormatter={(v) => (v / 1000).toFixed(0) + 'K'} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}
                  formatter={(v: number) => [fmt(v), 'Toplam']}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="toplam" radius={[6, 6, 0, 0]}>
                  {danismanStats.map((_, i) => (
                    <Cell key={i} fill={['var(--accent-primary)', 'var(--accent-emerald)', 'var(--accent-amber)', 'var(--accent-cyan)', 'var(--accent-secondary)'][i % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* City breakdown */}
        <div className="chart-card">
          <div className="chart-title">Şehir ve Ödeme Analizi</div>
          <div className="chart-subtitle">Lokasyon ve ödeme yöntemi dağılımı</div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sehirStats.sort((a, b) => b.toplam - a.toplam).map(s => {
              const pct = toplam > 0 ? (s.toplam / toplam) * 100 : 0;
              const color = CITY_COLORS[s.name] ?? 'var(--accent-primary)';
              return (
                <div key={s.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>{s.name}</span>
                    <span style={{ fontSize: '13px', fontFamily: "'Syne', sans-serif", fontWeight: 700, color }}>
                      {fmt(s.toplam)} <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginLeft: 4 }}>({s.count} kayıt)</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Payment methods */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '11px', fontFamily: "'Syne', sans-serif", color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, fontWeight: 700 }}>
              Ödeme Yöntemleri Dağılımı
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {odemeStats.map(o => (
                <div key={o.name} style={{
                  padding: '6px 14px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 20,
                  fontSize: '12px',
                  fontFamily: "'DM Sans', sans-serif",
                  color: 'var(--text-secondary)',
                  fontWeight: 500
                }}>
                  {o.name} — <span style={{ color: GOLD, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>{fmt(o.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filtrele:</span>
        {consultants.map(d => (
          <button
            key={d}
            onClick={() => setFilterDanisman(filterDanisman === d ? '' : d)}
            style={{
              padding: '6px 14px',
              background: filterDanisman === d ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-elevated)',
              border: filterDanisman === d ? `1px solid ${GOLD}` : '1px solid var(--border-subtle)',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              color: filterDanisman === d ? GOLD : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (filterDanisman !== d) { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
            onMouseLeave={e => { if (filterDanisman !== d) { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
          >
            👤 {d}
          </button>
        ))}
        {cities.map(c => (
          <button
            key={c}
            onClick={() => setFilterSehir(filterSehir === c ? '' : c)}
            style={{
              padding: '6px 14px',
              background: filterSehir === c ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-elevated)',
              border: filterSehir === c ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              color: filterSehir === c ? 'var(--accent-primary)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { if (filterSehir !== c) { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
            onMouseLeave={e => { if (filterSehir !== c) { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
          >
            🏙️ {c}
          </button>
        ))}
        {(filterDanisman || filterSehir) && (
          <button
            onClick={() => { setFilterDanisman(''); setFilterSehir(''); }}
            style={{ padding: '6px 12px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-rose)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            ✕ Temizle
          </button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            <strong>{filtered.length}</strong> kayıt bulundur
          </span>
          <span style={{ height: 16, width: 1, background: 'var(--border-subtle)' }} />
          <span style={{ fontSize: '14px', fontFamily: "'Syne', sans-serif", fontWeight: 700, color: GOLD }}>
            {fmt(filtered.reduce((a, r) => a + r.toplam, 0))}
          </span>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <TH col="firstName" label="Müşteri İsim / Ad" />
                <TH col="danisman" label="Danışman" />
                <TH col="sehir" label="Şehir" />
                <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'Syne', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>Ödeme Yöntemi</th>
                <TH col="onOdemeTarihi" label="Ön Ödeme Tarihi" />
                <th style={{ padding: '12px 16px', textAlign: 'right', fontFamily: "'Syne', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>Ön Ödeme</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: "'Syne', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>Kalan Tarih</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontFamily: "'Syne', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>Kalan</th>
                <TH col="toplam" label="Toplam" />
                <th style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'Syne', sans-serif", fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>Filtrelere uygun gelir kaydı bulunamadı.</td>
                </tr>
              )}
              {filtered.map(r => {
                const cityColor = CITY_COLORS[r.sehir] ?? 'var(--accent-primary)';
                return (
                  <tr key={r.id}>
                    <td className="td-name">{r.firstName + ' ' + r.lastName}</td>
                    <td>{r.danisman}</td>
                    <td>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        background: 'rgba(255,255,255,0.03)',
                        color: cityColor,
                        border: `1px solid ${cityColor}44`,
                        borderRadius: 6,
                        padding: '3px 8px',
                      }}>
                        {r.sehir}
                      </span>
                    </td>
                    <td>{r.odemeYontemi}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{r.onOdemeTarihi.split('-').reverse().join('.')}</td>
                    <td style={{ textAlign: 'right', fontFamily: "'Syne', sans-serif", color: 'var(--accent-emerald)', fontWeight: 600 }}>
                      {r.onOdeme > 0 ? fmt(r.onOdeme) : '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {r.kalanTarih && r.kalanTarih !== '-' ? r.kalanTarih.split('-').reverse().join('.') : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'Syne', sans-serif", color: r.kalanOdeme > 0 ? 'var(--accent-rose)' : 'var(--text-muted)', fontWeight: r.kalanOdeme > 0 ? 700 : 400 }}>
                      {r.kalanOdeme > 0 ? fmt(r.kalanOdeme) : '—'}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: "'Syne', sans-serif", color: GOLD, fontWeight: 700 }}>
                      {fmt(r.toplam)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEdit(r)}
                          style={{
                            background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)',
                            borderRadius: 6, color: 'var(--accent-primary)', cursor: 'pointer', padding: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'; e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.3)'; }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          style={{
                            background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)',
                            borderRadius: 6, color: 'var(--accent-rose)', cursor: 'pointer', padding: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'; e.currentTarget.style.borderColor = 'var(--accent-rose)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'; e.currentTarget.style.borderColor = 'rgba(244, 63, 94, 0.3)'; }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Footer totals */}
            {filtered.length > 0 && (
              <tfoot>
                <tr style={{ borderTop: `1px solid var(--border-glow)`, background: 'rgba(245, 158, 11, 0.05)' }}>
                  <td colSpan={5} style={{ padding: '16px', fontSize: '13px', fontFamily: "'Syne', sans-serif", color: 'var(--text-primary)', fontWeight: 700 }}>
                    KARŞILAŞTIRILAN TOPLAM YEKÜN ({filtered.length} işlem)
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontFamily: "'Syne', sans-serif", color: 'var(--accent-emerald)', fontWeight: 800 }}>
                    {fmt(filtered.reduce((a, r) => a + r.onOdeme, 0))}
                  </td>
                  <td />
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontFamily: "'Syne', sans-serif", color: 'var(--accent-rose)', fontWeight: 800 }}>
                    {filtered.reduce((a, r) => a + r.kalanOdeme, 0) > 0
                      ? fmt(filtered.reduce((a, r) => a + r.kalanOdeme, 0))
                      : '—'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '16px', fontFamily: "'Syne', sans-serif", color: GOLD, fontWeight: 800 }}>
                    {fmt(filtered.reduce((a, r) => a + r.toplam, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => { setShowAddModal(false); setEditEntryId(null); }}>
          <div className="modal-content" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16 }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: GOLD, boxShadow: `0 0 12px ${GOLD}` }} />
              <h3 style={{ fontSize: '20px', fontFamily: "'Syne', sans-serif", fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {editEntryId ? 'Gelir Kaydını Düzenle' : 'Yeni Gelir Kaydı Ekle'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Ad Soyad */}
              <div>
                <label className="form-label">Müşteri Ad Soyad *</label>
                <input
                  className="form-input"
                  placeholder="Örn: Ahmet Yılmaz"
                  value={form.firstName + ' ' + form.lastName}
                  onChange={e => setForm(f => ({ ...f, ad: e.target.value }))}
                  autoFocus
                />
              </div>

              {/* Danışman + Şehir */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label">Danışman</label>
                  <select
                    className="form-input"
                    value={form.danisman}
                    onChange={e => setForm(f => ({ ...f, danisman: e.target.value }))}
                  >
                    <option value="">Seçiniz</option>
                    {consultants.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Şehir</label>
                  <select
                    className="form-input"
                    value={form.sehir}
                    onChange={e => setForm(f => ({ ...f, sehir: e.target.value }))}
                  >
                    <option value="">Seçiniz</option>
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Ödeme Yöntemi + Tarih */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label">Ödeme Yöntemi</label>
                  <select
                    className="form-input"
                    value={form.odemeYontemi}
                    onChange={e => setForm(f => ({ ...f, odemeYontemi: e.target.value }))}
                  >
                    <option value="💵 Elden">💵 Elden</option>
                    <option value="🏦 İban">🏦 İban</option>
                    <option value="💳 Kredi Kartı">💳 Kredi Kartı</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Ön Ödeme Tarihi</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.onOdemeTarihi}
                    onChange={e => setForm(f => ({ ...f, onOdemeTarihi: e.target.value }))}
                  />
                </div>
              </div>

              {/* Ön Ödeme + Kalan */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="form-label">Ön Ödeme Tutarı (₺)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={form.onOdeme}
                    onChange={e => setForm(f => ({ ...f, onOdeme: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label">Kalan Ödeme (₺)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={form.kalanOdeme}
                    onChange={e => setForm(f => ({ ...f, kalanOdeme: e.target.value }))}
                  />
                </div>
              </div>

              {/* Kalan Tarih */}
              <div>
                <label className="form-label">Kalan Ödeme Tarihi</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.kalanTarih}
                  onChange={e => setForm(f => ({ ...f, kalanTarih: e.target.value }))}
                />
              </div>
            </div>

            {/* Toplam Preview */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.05)', border: `1px solid rgba(245, 158, 11, 0.2)`,
              borderRadius: 12, padding: '16px 20px', marginTop: 24, marginBottom: 32,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '12px', fontFamily: "'Syne', sans-serif", color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Hesaplanan Toplam Tutar</span>
              <span style={{ fontSize: '24px', fontWeight: 800, fontFamily: "'Syne', sans-serif", color: GOLD }}>
                {fmt((parseFloat(form.onOdeme) || 0) + (parseFloat(form.kalanOdeme) || 0))}
              </span>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: 24 }}>
              <button
                className="btn-secondary"
                onClick={() => { setShowAddModal(false); setEditEntryId(null); }}
              >
                İptal
              </button>
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={!form.firstName.trim() || !form.lastName.trim()}
                style={{
                  background: form.firstName + ' ' + form.lastName.trim() ? `linear-gradient(135deg, ${GOLD}, #d97706)` : '#333',
                  boxShadow: form.firstName + ' ' + form.lastName.trim() ? `0 4px 16px rgba(245, 158, 11, 0.3)` : 'none',
                  color: form.firstName.trim() && form.lastName.trim() ? '#111' : '#666'
                }}
              >
                {editEntryId ? 'Değişiklikleri Kaydet' : 'Gelir Kaydı Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
