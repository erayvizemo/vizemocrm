import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatusType } from '../types';
import { getStatusColor, getStatusBg, getStatusBorder } from '../utils/helpers';

interface Props {
  city: string;
}

const STATUS_OPTS: StatusType[] = ['Yeni Lead', 'Beklemede', 'Tamamlandı', 'Olumsuz'];

const cityColors: Record<string, string> = {
  'Eskişehir': '#4f8ef7',
  'Gaziantep': '#f7a14f',
  'İstanbul': '#38d9a9',
};

export default function CityView({ city }: Props) {
  const { customers, openModal } = useApp();
  const [search, setSearch] = useState('');
  const [filterDurum, setFilterDurum] = useState<StatusType | ''>('');
  const [filterDanisman, setFilterDanisman] = useState('');
  const [sortCol, setSortCol] = useState<'ad' | 'durum' | 'vize' | 'danisman'>('ad');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const cityColor = cityColors[city] ?? '#4f8ef7';

  // Danışman Eray veya Dilara ise → Eskişehir datasına yönlendir
  // AMA Gaziantep müşterileri her zaman Gaziantep'te kalır
  const ESKISEHIR_DANISMANLAR = ['Eray', 'Dilara'];

  const cityCustomers = useMemo(
    () => customers.filter(c => {
      // Gaziantep müşterileri her zaman Gaziantep'te kalır
      if (c.sehir === 'Gaziantep') {
        return city === 'Gaziantep';
      }
      const danismanIsEsk = ESKISEHIR_DANISMANLAR.includes(c.danisman ?? '');
      if (city === 'Eskişehir') {
        // Eskişehir: sehir=Eskişehir VEYA danışman Eray/Dilara (Gaziantep hariç)
        return c.sehir === 'Eskişehir' || danismanIsEsk;
      } else {
        // Diğer şehirler: sehir eşleşmeli VE danışman Eray/Dilara olmamalı
        return c.sehir === city && !danismanIsEsk;
      }
    }),
    [customers, city]
  );

  // Unique consultants
  const consultants = useMemo(() => {
    const set = new Set<string>();
    cityCustomers.forEach(c => { if (c.danisman) set.add(c.danisman); });
    return Array.from(set).sort();
  }, [cityCustomers]);

  // Status counts
  const statusCounts = useMemo(() => {
    const m: Record<StatusType, number> = { 'Yeni Lead': 0, 'Beklemede': 0, 'Tamamlandı': 0, 'Olumsuz': 0 };
    cityCustomers.forEach(c => { if (m[c.durum] !== undefined) m[c.durum]++; });
    return m;
  }, [cityCustomers]);

  // Consultant counts
  const danismanCounts = useMemo(() => {
    const m: Record<string, number> = {};
    cityCustomers.forEach(c => {
      if (c.danisman) m[c.danisman] = (m[c.danisman] ?? 0) + 1;
    });
    return m;
  }, [cityCustomers]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = cityCustomers;
    if (filterDurum) list = list.filter(c => c.durum === filterDurum);
    if (filterDanisman) list = list.filter(c => c.danisman === filterDanisman);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.ad.toLowerCase().includes(q) ||
        c.telefon.toLowerCase().includes(q) ||
        c.vize.toLowerCase().includes(q) ||
        (c.not ?? '').toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      let av = a[sortCol] ?? '';
      let bv = b[sortCol] ?? '';
      if (typeof av !== 'string') av = String(av);
      if (typeof bv !== 'string') bv = String(bv);
      return sortDir === 'asc' ? av.localeCompare(bv, 'tr') : bv.localeCompare(av, 'tr');
    });
  }, [cityCustomers, filterDurum, filterDanisman, search, sortCol, sortDir]);

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  }

  const col = (c: typeof sortCol, label: string) => (
    <th
      onClick={() => toggleSort(c)}
      style={{
        padding: '10px 14px',
        textAlign: 'left',
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '0.65rem',
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color: sortCol === c ? cityColor : 'var(--muted)',
        cursor: 'pointer',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
      }}
    >
      {label} {sortCol === c ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div style={{ padding: 24, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: cityColor }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: cityColor }}>{city} Ofisi</h2>
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginLeft: 20 }}>
          {cityCustomers.length} müşteri · {consultants.join(' & ')}
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        {STATUS_OPTS.map(s => (
          <div
            key={s}
            onClick={() => setFilterDurum(filterDurum === s ? '' : s)}
            style={{
              background: 'var(--surface)',
              border: filterDurum === s ? `1px solid ${getStatusColor(s)}` : '1px solid var(--border)',
              borderRadius: 10,
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              opacity: filterDurum && filterDurum !== s ? 0.5 : 1,
            }}
          >
            <div style={{ fontSize: '1.4rem', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, color: getStatusColor(s) }}>
              {statusCounts[s]}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>{s}</div>
          </div>
        ))}
      </div>

      {/* Consultant breakdown */}
      {consultants.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          {consultants.map(d => (
            <button
              key={d}
              onClick={() => setFilterDanisman(filterDanisman === d ? '' : d)}
              style={{
                padding: '6px 14px',
                background: filterDanisman === d ? `${cityColor}22` : 'var(--surface)',
                border: filterDanisman === d ? `1px solid ${cityColor}` : '1px solid var(--border)',
                borderRadius: 20,
                cursor: 'pointer',
                fontSize: '0.78rem',
                color: filterDanisman === d ? cityColor : 'var(--muted)',
                fontFamily: "'IBM Plex Mono', monospace",
                transition: 'all 0.15s',
              }}
            >
              👤 {d} — {danismanCounts[d]}
            </button>
          ))}
          {filterDanisman && (
            <button
              onClick={() => setFilterDanisman('')}
              style={{ padding: '6px 12px', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem' }}
            >
              ✕ Tümü
            </button>
          )}
        </div>
      )}

      {/* Search + filters bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="İsim, telefon, vize türü ara…"
          style={{
            flex: 1,
            minWidth: 220,
            padding: '8px 12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: 'var(--text)',
            fontSize: '0.82rem',
            outline: 'none',
          }}
        />
        <select
          value={filterDurum}
          onChange={e => setFilterDurum(e.target.value as StatusType | '')}
          style={{
            padding: '8px 12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            color: filterDurum ? getStatusColor(filterDurum) : 'var(--muted)',
            fontSize: '0.82rem',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          <option value="">Tüm Durumlar</option>
          {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)', alignSelf: 'center', fontFamily: "'IBM Plex Mono', monospace" }}>
          {filtered.length} sonuç
        </span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {col('ad', 'Ad Soyad')}
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>Telefon</th>
                {col('vize', 'Vize')}
                {col('danisman', 'Danışman')}
                {col('durum', 'Durum')}
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>Statü</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', borderBottom: '1px solid var(--border)', background: 'var(--surface)', maxWidth: 200 }}>Not</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.82rem' }}>
                    Sonuç bulunamadı.
                  </td>
                </tr>
              )}
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  onClick={() => openModal(c.id)}
                  style={{
                    cursor: 'pointer',
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)',
                    transition: 'background 0.12s',
                    borderBottom: '1px solid var(--border)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(79,142,247,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.018)')}
                >
                  <td style={{ padding: '10px 14px', fontSize: '0.82rem', fontWeight: 500 }}>{c.ad}</td>
                  <td style={{ padding: '10px 14px', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' }}>{c.telefon}</td>
                  <td style={{ padding: '10px 14px' }}>
                    {c.vize && (
                      <span style={{
                        fontSize: '0.68rem',
                        background: 'rgba(79,142,247,0.1)',
                        color: cityColor,
                        border: `1px solid ${cityColor}33`,
                        borderRadius: 8,
                        padding: '2px 8px',
                        fontFamily: "'IBM Plex Mono', monospace",
                        whiteSpace: 'nowrap',
                      }}>{c.vize}</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '0.78rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {c.danisman ?? '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      padding: '3px 9px',
                      borderRadius: 8,
                      background: getStatusBg(c.durum),
                      color: getStatusColor(c.durum),
                      border: `1px solid ${getStatusBorder(c.durum)}`,
                      fontFamily: "'IBM Plex Mono', monospace",
                      whiteSpace: 'nowrap',
                    }}>{c.durum}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: '0.72rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {c.statu ?? '—'}
                  </td>
                  <td style={{
                    padding: '10px 14px',
                    fontSize: '0.72rem',
                    color: 'var(--muted)',
                    maxWidth: 220,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {c.not}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
