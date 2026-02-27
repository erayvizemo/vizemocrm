import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatusType } from '../types';
import { getStatusColor, getVizeClass, getStatusClass } from '../utils/helpers';

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
  const [sortCol, setSortCol] = useState<'firstName' | 'durum' | 'vize' | 'danisman'>('firstName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const cityColor = cityColors[city] ?? '#4f8ef7';
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

  const consultants = useMemo(() => {
    const set = new Set<string>();
    cityCustomers.forEach(c => { if (c.danisman) set.add(c.danisman); });
    return Array.from(set).sort();
  }, [cityCustomers]);

  const statusCounts = useMemo(() => {
    const m: Record<StatusType, number> = { 'Yeni Lead': 0, 'Beklemede': 0, 'Tamamlandı': 0, 'Olumsuz': 0 };
    cityCustomers.forEach(c => { if (m[c.durum] !== undefined) m[c.durum]++; });
    return m;
  }, [cityCustomers]);

  const danismanCounts = useMemo(() => {
    const m: Record<string, number> = {};
    cityCustomers.forEach(c => {
      if (c.danisman) m[c.danisman] = (m[c.danisman] ?? 0) + 1;
    });
    return m;
  }, [cityCustomers]);

  const filtered = useMemo(() => {
    let list = cityCustomers;
    if (filterDurum) list = list.filter(c => c.durum === filterDurum);
    if (filterDanisman) list = list.filter(c => c.danisman === filterDanisman);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.firstName + ' ' + c.lastName.toLowerCase().includes(q) ||
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
        cursor: 'pointer',
        color: sortCol === c ? cityColor : undefined
      }}
    >
      {label} {sortCol === c ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-void)' }}>
      {/* Header */}
      <div style={{
        padding: '32px 32px 24px',
        background: 'var(--bg-void)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: cityColor, boxShadow: `0 0 8px ${cityColor}` }} />
            <h1 style={{ fontSize: '28px', color: cityColor }}>{city} Ofisi</h1>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
            Şuan bu ofise ait {cityCustomers.length} müşteri var. Temsilciler: {consultants.join(' & ') || 'Yok'}
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {STATUS_OPTS.map(s => {
            const classMapping: Record<string, string> = {
              'Yeni Lead': 'lead',
              'Beklemede': 'beklemede',
              'Tamamlandı': 'tamamlandi',
              'Olumsuz': 'olumsuz'
            };
            const cName = classMapping[s] || 'lead';

            return (
              <div
                key={s}
                className={`kpi-card ${cName}`}
                onClick={() => setFilterDurum(filterDurum === s ? '' : s)}
                style={{
                  cursor: 'pointer',
                  opacity: filterDurum && filterDurum !== s ? 0.4 : 1,
                  padding: '16px 20px',
                  border: filterDurum === s ? `1px solid ${getStatusColor(s)}` : undefined,
                }}
              >
                <div className="kpi-number" style={{ color: getStatusColor(s) }}>
                  {statusCounts[s]}
                </div>
                <div className="kpi-label">{s}</div>
              </div>
            );
          })}
        </div>

        {/* Consultant breakdown */}
        {consultants.length > 0 && (
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {consultants.map(d => (
              <button
                key={d}
                onClick={() => setFilterDanisman(filterDanisman === d ? '' : d)}
                style={{
                  padding: '6px 14px',
                  background: filterDanisman === d ? `${cityColor}22` : 'var(--bg-elevated)',
                  border: filterDanisman === d ? `1px solid ${cityColor}88` : '1px solid var(--border-subtle)',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: filterDanisman === d ? cityColor : 'var(--text-secondary)',
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 600,
                  transition: 'all 0.15s',
                }}
              >
                👤 {d} — {danismanCounts[d]}
              </button>
            ))}
            {filterDanisman && (
              <button
                onClick={() => setFilterDanisman('')}
                style={{ padding: '6px 12px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: "'Syne', sans-serif" }}
              >
                ✕ Filtreyi Temizle
              </button>
            )}
          </div>
        )}

        {/* Search */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 280, maxWidth: 400 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="İsim, telefon, vize türü ara…"
              className="form-input"
              style={{ paddingLeft: 40, height: 42 }}
            />
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', alignSelf: 'center', fontFamily: "'DM Sans', sans-serif" }}>
            {filtered.length} sonuç
          </span>
        </div>
      </div>

      {/* Table Area */}
      <div style={{ flex: 1, padding: '0 32px 32px', overflowY: 'auto' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                {col('firstName', 'Müşteri')}
                <th>İletişim</th>
                {col('vize', 'Vize Türü')}
                {col('danisman', 'Danışman')}
                {col('durum', 'Durum')}
                <th>Statü</th>
                <th>Not</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Sonuç bulunamadı.
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => openModal(c.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="td-name">{c.firstName + ' ' + c.lastName}</td>
                  <td style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, color: 'var(--text-secondary)' }}>
                    {c.telefon || '—'}
                  </td>
                  <td>
                    {c.vize ? (
                      <span className={`vize-badge ${getVizeClass(c.vize)}`}>{c.vize}</span>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-secondary)' }}>{c.danisman || '—'}</span>
                  </td>
                  <td>
                    <div className={`status-indicator ${getStatusClass(c.durum)}`}>
                      <span className="status-dot"></span>
                      {c.durum}
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.statu || '—'}</td>
                  <td style={{
                    maxWidth: 220,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--text-muted)',
                    fontSize: 12
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
