import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { StatusType, VISA_TYPES, STATUS_TYPES } from '../types';
import { exportToCSV, getVizeClass, getStatusClass } from '../utils/helpers';

type SortKey = 'ad' | 'durum' | 'vize' | 'danisman' | 'statu' | 'createdAt';

export default function Customers() {
  const { customers, openModal, deleteCustomer } = useApp();
  const [search, setSearch] = useState('');
  const [filterDurum, setFilterDurum] = useState('');
  const [filterVize, setFilterVize] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let data = customers.filter(c => {
      const q = search.toLowerCase();
      const matchSearch = !q
        || c.firstName + ' ' + c.lastName.toLowerCase().includes(q)
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
      if (sortKey === 'ad') { va = a.firstName + ' ' + a.lastName; vb = b.firstName + ' ' + b.lastName; }
      else if (sortKey === 'durum') { va = a.durum; vb = b.durum; }
      else if (sortKey === 'vize') { va = a.vize; vb = b.vize; }
      else if (sortKey === 'danisman') { va = a.danisman ?? ''; vb = b.danisman ?? ''; }
      else if (sortKey === 'statu') { va = a.statu ?? ''; vb = b.statu ?? ''; }
      else if (sortKey === 'createdAt') { va = a.createdAt; vb = b.createdAt; }
      return sortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    });

    return data;
  }, [customers, search, filterDurum, filterVize, sortKey, sortAsc]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(p => !p);
    else { setSortKey(key); setSortAsc(true); }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ color: 'var(--border-subtle)', marginLeft: 4 }}>⇅</span>;
    return <span style={{ color: 'var(--accent-primary)', marginLeft: 4 }}>{sortAsc ? '↑' : '↓'}</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-void)' }}>
      {/* Header & Toolbar */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: 4 }}>Müşteriler</h1>
            <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>
              Toplam {customers.length} müşteri kaydı var. Şuan {filtered.length} listeleniyor.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary" onClick={() => exportToCSV(filtered)}>
              ⬇ CSV İndir
            </button>
            <button className="btn-primary" onClick={() => openModal()}>
              + Yeni Müşteri
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: 280 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
            <input
              type="text"
              placeholder="Ad, telefon, not ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input"
              style={{ paddingLeft: 40, height: 42 }}
            />
          </div>
          <select
            value={filterDurum}
            onChange={e => setFilterDurum(e.target.value)}
            className="form-input"
            style={{ width: 180, height: 42, cursor: 'pointer' }}
          >
            <option value="">Tüm Durumlar</option>
            {STATUS_TYPES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select
            value={filterVize}
            onChange={e => setFilterVize(e.target.value)}
            className="form-input"
            style={{ width: 180, height: 42, cursor: 'pointer' }}
          >
            <option value="">Tüm Vize Türleri</option>
            {VISA_TYPES.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Table Area */}
      <div style={{ flex: 1, padding: '0 32px 32px', overflowY: 'auto' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('ad')} style={{ cursor: 'pointer' }}>Müşteri <SortIcon col="ad" /></th>
                <th>İletişim</th>
                <th onClick={() => handleSort('vize')} style={{ cursor: 'pointer' }}>Vize Türü <SortIcon col="vize" /></th>
                <th onClick={() => handleSort('danisman')} style={{ cursor: 'pointer' }}>Danışman <SortIcon col="danisman" /></th>
                <th onClick={() => handleSort('durum')} style={{ cursor: 'pointer' }}>Durum <SortIcon col="durum" /></th>
                <th onClick={() => handleSort('statu')} style={{ cursor: 'pointer' }}>Statü <SortIcon col="statu" /></th>
                <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>Kayıt <SortIcon col="createdAt" /></th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} onClick={() => openModal(c.id)} style={{ cursor: 'pointer' }}>
                    <td className="td-name">
                      <span style={{ color: c.doNotContact ? 'var(--text-muted)' : 'inherit', textDecoration: c.doNotContact ? 'line-through' : 'none' }}>
                        {c.firstName + ' ' + c.lastName}
                      </span>
                      {c.doNotContact && <span style={{ marginLeft: 6, fontSize: '14px', cursor: 'help' }} title={`İletişime Geçmeyin: ${c.doNotContactReason}`}>🚫</span>}
                      {c.sehir && <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontWeight: 500 }}>{c.sehir}</span>}
                    </td>
                    <td>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, color: 'var(--text-secondary)' }}>{c.telefon || '—'}</div>
                    </td>
                    <td>
                      {c.vize ? (
                        <span className={`vize-badge ${getVizeClass(c.vize)}`}>{c.vize}</span>
                      ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td><span style={{ color: 'var(--text-secondary)' }}>{c.danisman || '—'}</span></td>
                    <td>
                      <div className={`status-indicator ${getStatusClass(c.durum)}`}>
                        <span className="status-dot"></span>
                        {c.durum}
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{c.statu || '—'}</td>
                    <td style={{ fontFamily: "'Syne', sans-serif", fontSize: 13 }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('tr-TR') : '—'}
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          onClick={() => openModal(c.id)}
                        >
                          Düzenle
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 12, color: 'var(--accent-rose)', borderColor: 'rgba(244,63,94,0.3)' }}
                          onClick={() => {
                            if (window.confirm(`${c.firstName + ' ' + c.lastName} kaydını silmek istediğinize emin misiniz?`)) deleteCustomer(c.id);
                          }}
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
