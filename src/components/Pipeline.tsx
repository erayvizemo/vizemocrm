import { useApp } from '../context/AppContext';
import { StatusType } from '../types';
import { getDaysUntil, getVizeClass, getStatusClass } from '../utils/helpers';

const COLUMNS: { status: StatusType; icon: string; desc: string; colClass: string }[] = [
  { status: 'Yeni Lead', icon: '🔵', desc: 'Yeni gelen müşteriler', colClass: 'lead' },
  { status: 'Beklemede', icon: '🟡', desc: 'Devam eden süreçler', colClass: 'beklemede' },
  { status: 'Tamamlandı', icon: '🟢', desc: 'Başarılı kapanışlar', colClass: 'tamamlandi' },
  { status: 'Olumsuz', icon: '🔴', desc: 'İptal / Red', colClass: 'olumsuz' },
];

export default function Pipeline() {
  const { customers, openModal, updateCustomer } = useApp();

  function moveCustomer(id: string, newStatus: StatusType, e: any) {
    e.stopPropagation();
    const c = customers.find(x => x.id === id);
    if (!c) return;
    const now = new Date().toLocaleString('tr-TR');
    updateCustomer(id, {
      durum: newStatus,
      log: [...c.log, { timestamp: now, text: `Durum değişti: ${c.durum} → ${newStatus}` }],
    });
  }

  return (
    <div style={{ padding: '64px 32px 32px', minHeight: '100vh', background: 'var(--bg-void)' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: 4 }}>Pipeline</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
          Müşterileri sürükleyerek veya hızlı butonlarla kolona taşıyın.
        </div>
      </div>

      <div className="kanban-board">
        {COLUMNS.map(col => {
          const colCustomers = customers.filter(c => c.durum === col.status);

          return (
            <div key={col.status} className={`kanban-column col-${col.colClass}`}>
              {/* Column header */}
              <div className="kanban-col-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`kanban-col-title ${col.colClass}`}>
                    {col.status}
                  </span>
                </div>
                <span className="kanban-count">{colCustomers.length}</span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', minHeight: 120 }}>
                {colCustomers.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '12px',
                    padding: '24px 10px',
                    opacity: 0.6,
                    fontFamily: "'DM Sans', sans-serif"
                  }}>Süreç boş</div>
                )}

                {colCustomers.map(c => {
                  const days = c.takip ? getDaysUntil(c.takip) : null;
                  const hasFollowUp = days !== null && days <= 1;

                  return (
                    <div
                      key={c.id}
                      className={`kanban-card ${hasFollowUp ? 'has-follow-up' : ''}`}
                      onClick={() => openModal(c.id)}
                    >
                      {/* Name + visa */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span className="kanban-card-name">{c.firstName + ' ' + c.lastName}</span>
                        {c.vize && (
                          <span className={`vize-badge ${getVizeClass(c.vize)}`} style={{ transform: 'scale(0.85)', transformOrigin: 'top right' }}>
                            {c.vize}
                          </span>
                        )}
                      </div>

                      <div className="kanban-card-meta">
                        <span>{c.danisman || 'Atanmadı'}</span>
                        <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '12px' }}>{c.telefon || '—'}</span>
                      </div>

                      {/* Follow-up date */}
                      {c.takip && (
                        <div className="kanban-follow-up-date" style={{ color: days === 0 ? 'var(--accent-rose)' : days === 1 ? 'var(--accent-amber)' : 'var(--accent-cyan)' }}>
                          📅 {days === 0 ? 'BUGÜN TAKİP!' : days === 1 ? 'YARIN TAKİP' : c.takip.split('-').reverse().join('.')}
                        </div>
                      )}

                      {/* Move buttons */}
                      <div style={{
                        display: 'flex',
                        gap: 6,
                        flexWrap: 'wrap',
                        marginTop: 12,
                        paddingTop: 10,
                        borderTop: '1px solid var(--border-subtle)',
                      }}>
                        {COLUMNS.filter(col2 => col2.status !== col.status).map(col2 => (
                          <button
                            key={col2.status}
                            className="btn-secondary"
                            onClick={(e) => moveCustomer(c.id, col2.status, e)}
                            style={{
                              padding: '2px 6px',
                              fontSize: '10px',
                              fontFamily: "'Syne', sans-serif",
                              fontWeight: 600,
                            }}
                          >
                            → {col2.status}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
