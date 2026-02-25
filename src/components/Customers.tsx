import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatusType, VISA_TYPES, STATUS_TYPES } from '../types';
import { getStatusColor, getStatusBg, getStatusBorder, getStatusRowClass, formatDateTime, getDaysUntil, exportToCSV } from '../utils/helpers';

type SortKey = 'ad' | 'durum' | 'vize' | 'takip' | 'gorusme' | 'surec' | 'danisman' | 'sehir' | 'statu';

function Badge({ color, bg, border, children }: { color: string; bg: string; border: string; children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: '0.68rem',
      fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 500,
      whiteSpace: 'nowrap',
      color,
      background: bg,
      border: `1px solid ${border}`,
    }}>{children}</span>
  );
}

export default function Customers() {
  const { customers, openModal, deleteCustomer } = useApp();
  const [search, setSearch] = useState('');
  const [filterDurum, setFilterDurum] = useState('');
  const [filterVize, setFilterVize] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('ad');
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    let data = customers.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || c.ad.toLowerCase().includes(q)
        || c.telefon.includes(q)
        || c.email.toLowerCase().includes(q)
        || c.not.toLowerCase().includes(q)
        || (c.danisman ?? '').toLowerCase().includes(q)
        || (c.sehir ?? '').toLowerCase().includes(q);
      const matchDurum = !filterDurum || c.durum === filterDurum;
      const matchVize = !filterVize || c.vize === filterVize;
      return matchSearch && matchDurum && matchVize;
    });

    data = [...data].sort((a, b) => {
      let va = '', vb = '';
      if (sortKey === 'ad') { va = a.ad; vb = b.ad; }
      else if (sortKey === 'durum') { va = a.durum; vb = b.durum; }
      else if (sortKey === 'vize') { va = a.vize; vb = b.vize; }
      else if (sortKey === 'takip') { va = a.takip; vb = b.takip; }
      else if (sortKey === 'gorusme') { va = a.gorusme; vb = b.gorusme; }
      else if (sortKey === 'surec') { va = a.surec; vb = b.surec; }
      else if (sortKey === 'danisman') { va = a.danisman ?? ''; vb = b.danisman ?? ''; }
      else if (sortKey === 'sehir') { va = a.sehir ?? ''; vb = b.sehir ?? ''; }
      else if (sortKey === 'statu') { va = a.statu ?? ''; vb = b.statu ?? ''; }
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    return data;
  }, [customers, search, filterDurum, filterVize, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(p => !p);
    else { setSortKey(key); setSortAsc(true); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ color: 'var(--border)', marginLeft: 4 }}>⇅</span>;
    return <span style={{ color: 'var(--accent)', marginLeft: 4 }}>{sortAsc ? '↑' : '↓'}</span>;
  }

  const thStyle = (col: SortKey): React.CSSProperties => ({
    textAlign: 'left',
    padding: '10px 10px',
    color: sortKey === col ? 'var(--accent)' : 'var(--muted)',
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '0.68rem',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    borderBottom: '1px solid var(--border)',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    userSelect: 'none',
    background: 'var(--surface)',
    position: 'sticky' as 'sticky',
    top: 0,
    zIndex: 1,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Toolbar */}
      <div style={{
        padding: '16px 24px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginRight: 8, whiteSpace: 'nowrap' }}>Müşteriler</h2>
        <input
          type="text"
          placeholder="🔍  Ad, telefon, not ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '7px 12px',
            color: 'var(--text)',
            fontSize: '0.82rem',
            fontFamily: "'IBM Plex Sans', sans-serif",
            width: 220,
            outline: 'none',
          }}
        />
        <select
          value={filterDurum}
          onChange={e => setFilterDurum(e.target.value)}
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '7px 12px',
            color: 'var(--text)',
            fontSize: '0.78rem',
            fontFamily: "'IBM Plex Sans', sans-serif",
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">Tüm Durumlar</option>
          {STATUS_TYPES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select
          value={filterVize}
          onChange={e => setFilterVize(e.target.value)}
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '7px 12px',
            color: 'var(--text)',
            fontSize: '0.78rem',
            fontFamily: "'IBM Plex Sans', sans-serif",
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="">Tüm Vize Türleri</option>
          {VISA_TYPES.map(v => <option key={v}>{v}</option>)}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
            {filtered.length}/{customers.length} kayıt
          </span>
          <button
            onClick={() => exportToCSV(filtered)}
            style={{
              padding: '7px 14px',
              background: 'transparent',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
            onMouseEnter={e => { (e.currentTarget.style.color = 'var(--accent2)'); (e.currentTarget.style.borderColor = 'var(--accent2)'); }}
            onMouseLeave={e => { (e.currentTarget.style.color = 'var(--muted)'); (e.currentTarget.style.borderColor = 'var(--border)'); }}
          >
            ⬇ CSV
          </button>
          <button
            onClick={() => openModal()}
            style={{
              padding: '7px 16px',
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
            + Yeni Müşteri
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', background: 'var(--bg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: 1200 }}>
          <thead>
            <tr>
              <th style={thStyle('ad')} onClick={() => handleSort('ad')}>Ad Soyad<SortIcon col="ad" /></th>
              <th style={{ ...thStyle('ad'), cursor: 'default' }}>Telefon</th>
              <th style={thStyle('vize')} onClick={() => handleSort('vize')}>Vize<SortIcon col="vize" /></th>
              <th style={thStyle('danisman')} onClick={() => handleSort('danisman')}>Danışman<SortIcon col="danisman" /></th>
              <th style={thStyle('durum')} onClick={() => handleSort('durum')}>Durum<SortIcon col="durum" /></th>
              <th style={thStyle('statu')} onClick={() => handleSort('statu')}>Statü<SortIcon col="statu" /></th>
              <th style={{ ...thStyle('ad'), cursor: 'default' }}>Not</th>
              <th style={{ ...thStyle('ad'), cursor: 'default', textAlign: 'right' }}>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : (
              filtered.map(c => {
                return (
                  <tr
                    key={c.id}
                    className={getStatusRowClass(c.durum)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    onClick={() => openModal(c.id)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(79,142,247,0.07)')}
                    onMouseLeave={e => (e.currentTarget.className = getStatusRowClass(c.durum))}
                  >
                    <td style={{ padding: '9px 10px', fontWeight: 500, whiteSpace: 'nowrap', color: 'var(--text)' }}>{c.ad}</td>
                    <td style={{ padding: '9px 10px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      {c.telefon || '—'}
                    </td>
                    <td style={{ padding: '9px 10px' }}>
                      {c.vize
                        ? <Badge color="var(--accent)" bg="rgba(79,142,247,0.15)" border="rgba(79,142,247,0.3)">{c.vize}</Badge>
                        : <span style={{ color: 'var(--muted)' }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '9px 10px', fontSize: '0.75rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {c.danisman || '—'}
                    </td>
                    <td style={{ padding: '9px 10px' }}>
                      <Badge color={getStatusColor(c.durum)} bg={getStatusBg(c.durum)} border={getStatusBorder(c.durum)}>
                        {c.durum}
                      </Badge>
                    </td>
                    <td style={{ padding: '9px 10px', fontSize: '0.72rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {c.statu || '—'}
                    </td>
                    <td style={{ padding: '9px 10px', maxWidth: 220 }}>
                      <div style={{
                        color: 'var(--muted)',
                        fontSize: '0.72rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 220,
                      }}>{c.not || ''}</div>
                    </td>
                    <td style={{ padding: '9px 10px', textAlign: 'right', whiteSpace: 'nowrap' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openModal(c.id)}
                        style={{
                          padding: '4px 10px',
                          background: 'transparent',
                          color: 'var(--accent)',
                          border: '1px solid rgba(79,142,247,0.3)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          fontFamily: "'IBM Plex Mono', monospace",
                          marginRight: 4,
                        }}
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`${c.ad} silinsin mi?`)) deleteCustomer(c.id);
                        }}
                        style={{
                          padding: '4px 10px',
                          background: 'transparent',
                          color: 'var(--danger)',
                          border: '1px solid rgba(224,92,92,0.3)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
