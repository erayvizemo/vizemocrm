import { useApp } from '../context/AppContext';
import { StatusType } from '../types';
import { getStatusColor, getStatusBg, getStatusBorder, getDaysUntil } from '../utils/helpers';

const COLUMNS: { status: StatusType; icon: string; desc: string }[] = [
  { status: 'Yeni Lead', icon: '🔵', desc: 'Yeni gelen müşteriler' },
  { status: 'Beklemede', icon: '🟡', desc: 'Devam eden süreçler' },
  { status: 'Tamamlandı', icon: '🟢', desc: 'Başarılı kapanışlar' },
  { status: 'Olumsuz', icon: '🔴', desc: 'İptal / Red' },
];

export default function Pipeline() {
  const { customers, openModal, updateCustomer } = useApp();

  function moveCustomer(id: string, newStatus: StatusType) {
    const c = customers.find(x => x.id === id);
    if (!c) return;
    const now = new Date().toLocaleString('tr-TR');
    updateCustomer(id, {
      durum: newStatus,
      log: [...c.log, { timestamp: now, text: `Durum değişti: ${c.durum} → ${newStatus}` }],
    });
  }

  return (
    <div style={{ padding: 24, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Pipeline Görünümü</h2>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 4 }}>
          Müşterileri sürükleyerek veya hızlı butonlarla kolona taşıyın.
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignItems: 'start' }}>
        {COLUMNS.map(col => {
          const colCustomers = customers.filter(c => c.durum === col.status);
          return (
            <div key={col.status} style={{
              background: 'var(--surface)',
              border: `1px solid ${getStatusBorder(col.status)}`,
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              {/* Column header */}
              <div style={{
                padding: '12px 14px',
                borderBottom: `1px solid ${getStatusBorder(col.status)}`,
                background: getStatusBg(col.status),
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span>{col.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: getStatusColor(col.status) }}>
                    {col.status}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {col.desc}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.8rem',
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: getStatusColor(col.status),
                  fontWeight: 600,
                  background: getStatusBg(col.status),
                  padding: '2px 8px',
                  borderRadius: 10,
                  border: `1px solid ${getStatusBorder(col.status)}`,
                }}>{colCustomers.length}</span>
              </div>

              {/* Cards */}
              <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, minHeight: 120 }}>
                {colCustomers.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--muted)',
                    fontSize: '0.72rem',
                    fontFamily: "'IBM Plex Mono', monospace",
                    padding: '24px 10px',
                    opacity: 0.6,
                  }}>Kayıt yok</div>
                )}
                {colCustomers.map(c => {
                  const days = c.takip ? getDaysUntil(c.takip) : null;
                  const showAlert = days !== null && days <= 1;
                  return (
                    <div
                      key={c.id}
                      style={{
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        borderRadius: 9,
                        padding: '11px 12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        borderLeft: showAlert ? `3px solid ${days === 0 ? 'var(--danger)' : 'var(--warn)'}` : '3px solid transparent',
                      }}
                      onClick={() => openModal(c.id)}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(79,142,247,0.07)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface2)')}
                    >
                      {/* Name + visa */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.82rem', color: 'var(--text)' }}>{c.ad}</div>
                        {c.vize && (
                          <span style={{
                            fontSize: '0.62rem',
                            fontFamily: "'IBM Plex Mono', monospace",
                            color: 'var(--accent)',
                            background: 'rgba(79,142,247,0.12)',
                            padding: '1px 6px',
                            borderRadius: 8,
                            border: '1px solid rgba(79,142,247,0.25)',
                            flexShrink: 0,
                            marginLeft: 6,
                          }}>{c.vize}</span>
                        )}
                      </div>

                      {/* Phone */}
                      {c.telefon && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 4 }}>
                          {c.telefon}
                        </div>
                      )}

                      {/* Process */}
                      {c.surec && (
                        <div style={{
                          fontSize: '0.65rem',
                          color: 'var(--muted)',
                          background: 'rgba(100,116,139,0.12)',
                          padding: '2px 7px',
                          borderRadius: 6,
                          display: 'inline-block',
                          marginBottom: 6,
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}>{c.surec}</div>
                      )}

                      {/* Follow-up date */}
                      {c.takip && (
                        <div style={{
                          fontSize: '0.68rem',
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: days === 0 ? 'var(--danger)' : days === 1 ? 'var(--warn)' : 'var(--accent2)',
                          marginBottom: 6,
                        }}>
                          📅 {days === 0 ? 'BUGÜN TAKİP!' : days === 1 ? 'YARIN TAKİP' : c.takip.split('-').reverse().join('.')}
                        </div>
                      )}

                      {/* Note preview */}
                      {c.not && (
                        <div style={{
                          fontSize: '0.68rem',
                          color: 'var(--muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginBottom: 8,
                        }}>{c.not}</div>
                      )}

                      {/* Move buttons */}
                      <div style={{
                        display: 'flex',
                        gap: 4,
                        flexWrap: 'wrap',
                        marginTop: 4,
                        paddingTop: 8,
                        borderTop: '1px solid var(--border)',
                      }} onClick={e => e.stopPropagation()}>
                        {COLUMNS.filter(col2 => col2.status !== col.status).map(col2 => (
                          <button
                            key={col2.status}
                            onClick={() => moveCustomer(c.id, col2.status)}
                            style={{
                              padding: '2px 7px',
                              background: getStatusBg(col2.status),
                              color: getStatusColor(col2.status),
                              border: `1px solid ${getStatusBorder(col2.status)}`,
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontSize: '0.6rem',
                              fontFamily: "'IBM Plex Mono', monospace",
                              transition: 'all 0.12s',
                            }}
                          >
                            {col2.icon} {col2.status}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add button */}
              <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => {/* openModal with preset status - open modal then set durum */}}
                  style={{
                    width: '100%',
                    padding: '6px',
                    background: 'transparent',
                    color: 'var(--muted)',
                    border: '1px dashed var(--border)',
                    borderRadius: 7,
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    fontFamily: "'IBM Plex Mono', monospace",
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget.style.color = getStatusColor(col.status)); (e.currentTarget.style.borderColor = getStatusColor(col.status)); }}
                  onMouseLeave={e => { (e.currentTarget.style.color = 'var(--muted)'); (e.currentTarget.style.borderColor = 'var(--border)'); }}
                >
                  + Yeni Ekle
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
