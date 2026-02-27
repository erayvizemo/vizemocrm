import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getDaysUntil, getStatusColor, getStatusBg, getStatusClass } from '../utils/helpers';

const DAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function FollowUpCalendar() {
  const { customers, openModal } = useApp();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>('');

  // Build follow-up map: date -> customers[]
  const followUpMap = useMemo(() => {
    const map: Record<string, typeof customers> = {};
    customers.forEach(c => {
      if (!c.takip) return;
      const key = c.takip.substring(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(c);
    });
    return map;
  }, [customers]);

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  let startDow = firstDay.getDay(); // 0=Sun
  startDow = startDow === 0 ? 6 : startDow - 1; // Convert to Mon=0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const totalCells = Math.ceil((startDow + daysInMonth) / 7) * 7;

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const selectedCustomers = selectedDate ? (followUpMap[selectedDate] || []) : [];

  // Upcoming in next 14 days
  const upcoming = customers
    .filter(c => { if (!c.takip) return false; const d = getDaysUntil(c.takip); return d >= 0 && d <= 14; })
    .sort((a, b) => a.takip.localeCompare(b.takip));

  return (
    <div style={{ padding: '64px 32px 32px', minHeight: '100vh', background: 'var(--bg-void)' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: 4 }}>Takvim</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>Takip tarihleri olan müşteriler takvimde gösterilir.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, alignItems: 'start' }}>

        {/* Calendar Left Panel */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 16, overflow: 'hidden' }}>
          {/* Month nav */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <button
              onClick={prevMonth}
              className="btn-secondary"
              style={{ padding: '6px 12px' }}
            >‹ Önceki</button>
            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '18px', color: 'var(--text-primary)' }}>
              {MONTHS[viewMonth]} {viewYear}
            </div>
            <button
              onClick={nextMonth}
              className="btn-secondary"
              style={{ padding: '6px 12px' }}
            >Sonraki ›</button>
          </div>

          <div style={{ padding: 24 }}>
            <div className="calendar-grid">
              {/* Day headers */}
              {DAYS.map(d => (
                <div key={d} className="calendar-day-header">{d}</div>
              ))}

              {/* Grid cells */}
              {Array.from({ length: totalCells }).map((_, idx) => {
                const dayNum = idx - startDow + 1;
                const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
                if (!isCurrentMonth) {
                  return <div key={idx} style={{ background: 'var(--bg-elevated)', opacity: 0.3 }} />;
                }
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const dt = new Date(viewYear, viewMonth, dayNum);
                const isToday = dt.getTime() === today.getTime();
                const isSelected = dateStr === selectedDate;
                const dayCustomers = followUpMap[dateStr] || [];
                const hasMeetings = dayCustomers.length > 0;

                return (
                  <div
                    key={idx}
                    className={`calendar-day ${isToday ? 'today' : ''}`}
                    onClick={() => setSelectedDate(isSelected ? '' : dateStr)}
                    style={{
                      cursor: hasMeetings ? 'pointer' : 'default',
                      background: isSelected ? 'rgba(99, 102, 241, 0.1)' : undefined,
                      boxShadow: isSelected ? 'inset 0 0 0 1px var(--accent-primary)' : undefined,
                    }}
                  >
                    <span className="calendar-day-num">{dayNum}</span>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {dayCustomers.slice(0, 3).map((c, i) => (
                        <div key={i} className={`calendar-event ${getStatusClass(c.durum) === 'beklemede' ? 'beklemede' : 'takip'}`} style={{ color: getStatusColor(c.durum), background: getStatusBg(c.durum) }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                            background: getStatusColor(c.durum)
                          }}></span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {c.firstName + ' ' + c.lastName.split(' ')[0]}
                          </span>
                        </div>
                      ))}
                      {dayCustomers.length > 3 && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600, paddingLeft: 4 }}>
                          +{dayCustomers.length - 3} kayıt
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Selected date detail */}
          {selectedDate && (
            <div className="chart-card" style={{ padding: 20 }}>
              <div style={{ fontSize: '11px', fontFamily: "'Syne', sans-serif", color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16, fontWeight: 700 }}>
                {selectedDate.split('-').reverse().join('.')} — {selectedCustomers.length} Takip
              </div>

              {selectedCustomers.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Seçili tarihte takip yok.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedCustomers.map(c => (
                    <div
                      key={c.id}
                      onClick={() => openModal(c.id)}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-subtle)',
                        borderLeft: `3px solid ${getStatusColor(c.durum)}`,
                        borderRadius: 10,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                        e.currentTarget.style.borderColor = 'var(--border-glow)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--bg-elevated)';
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)', marginBottom: 4 }}>{c.firstName + ' ' + c.lastName}</div>
                      {c.telefon && <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>{c.telefon}</div>}

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <div className={`status-indicator ${getStatusClass(c.durum)}`} style={{ transform: 'scale(0.85)', transformOrigin: 'left' }}>
                          <span className="status-dot"></span>
                          {c.durum}
                        </div>
                      </div>

                      {c.not && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{c.not}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming 14 days */}
          <div className="chart-card" style={{ padding: 20, flex: 1, maxHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '11px', fontFamily: "'Syne', sans-serif", color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16, fontWeight: 700 }}>
              Yaklaşan 14 Gün
            </div>

            {upcoming.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Yaklaşan takip yok.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
                {upcoming.map(c => {
                  const days = getDaysUntil(c.takip);
                  const dateLabel = days === 0 ? 'BUGÜN' : days === 1 ? 'YARIN' : c.takip.split('-').reverse().join('.');

                  return (
                    <div
                      key={c.id}
                      onClick={() => openModal(c.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        padding: '10px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: 'var(--bg-elevated)',
                        border: '1px solid transparent',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                        e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'var(--bg-elevated)';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <div style={{
                        fontSize: '11px',
                        fontFamily: "'Syne', sans-serif",
                        color: days === 0 ? 'var(--accent-rose)' : days === 1 ? 'var(--accent-amber)' : 'var(--text-secondary)',
                        fontWeight: 700,
                        minWidth: 50,
                      }}>{dateLabel}</div>

                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.firstName + ' ' + c.lastName}
                      </div>

                      <div className={`status-indicator ${getStatusClass(c.durum).replace('-', '_')}`} style={{ margin: 0 }}>
                        <span className="status-dot"></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
