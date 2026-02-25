import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getStatusColor, getStatusBg, getDaysUntil } from '../utils/helpers';

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
    <div style={{ padding: 24, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Takip Takvimi</h2>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 4 }}>Takip tarihleri olan müşteriler takvimde gösterilir.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18 }}>
        {/* Calendar */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {/* Month nav */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
          }}>
            <button
              onClick={prevMonth}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', padding: '2px 8px', borderRadius: 6 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >‹</button>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: '0.9rem' }}>
              {MONTHS[viewMonth]} {viewYear}
            </div>
            <button
              onClick={nextMonth}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', padding: '2px 8px', borderRadius: 6 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >›</button>
          </div>

          {/* Day headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--border)' }}>
            {DAYS.map(d => (
              <div key={d} style={{
                textAlign: 'center',
                padding: '8px 4px',
                fontSize: '0.65rem',
                fontFamily: "'IBM Plex Mono', monospace",
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}>{d}</div>
            ))}
          </div>

          {/* Grid cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {Array.from({ length: totalCells }).map((_, idx) => {
              const dayNum = idx - startDow + 1;
              const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth;
              if (!isCurrentMonth) {
                return <div key={idx} style={{ minHeight: 70, borderBottom: '1px solid var(--border)', borderRight: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)' }} />;
              }
              const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dt = new Date(viewYear, viewMonth, dayNum);
              const isToday = dt.getTime() === today.getTime();
              const isSelected = dateStr === selectedDate;
              const dayCustomers = followUpMap[dateStr] || [];
              const hasMeetings = dayCustomers.length > 0;
              const isPast = dt.getTime() < today.getTime();

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(isSelected ? '' : dateStr)}
                  style={{
                    minHeight: 70,
                    padding: '6px 8px',
                    borderBottom: '1px solid var(--border)',
                    borderRight: '1px solid var(--border)',
                    cursor: hasMeetings ? 'pointer' : 'default',
                    background: isSelected
                      ? 'rgba(79,142,247,0.12)'
                      : isToday
                      ? 'rgba(79,142,247,0.06)'
                      : isPast ? 'rgba(0,0,0,0.08)' : 'transparent',
                    transition: 'background 0.12s',
                    position: 'relative',
                  }}
                  onMouseEnter={e => { if (hasMeetings && !isSelected) e.currentTarget.style.background = 'rgba(79,142,247,0.06)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(79,142,247,0.06)' : isPast ? 'rgba(0,0,0,0.08)' : 'transparent'; }}
                >
                  {/* Day number */}
                  <div style={{
                    fontSize: '0.8rem',
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: isToday ? 700 : 400,
                    color: isToday ? '#fff' : isPast ? 'var(--muted)' : 'var(--text)',
                    width: 24, height: 24,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%',
                    background: isToday ? 'var(--accent)' : 'transparent',
                    marginBottom: 4,
                  }}>{dayNum}</div>

                  {/* Customer dots */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {dayCustomers.slice(0, 3).map((c, i) => (
                      <div key={i} style={{
                        width: 7, height: 7,
                        borderRadius: '50%',
                        background: getStatusColor(c.durum),
                        flexShrink: 0,
                      }} title={c.ad} />
                    ))}
                    {dayCustomers.length > 3 && (
                      <div style={{ fontSize: '0.55rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace", lineHeight: '7px' }}>
                        +{dayCustomers.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Names (if few) */}
                  {dayCustomers.slice(0, 2).map((c, i) => (
                    <div key={i} style={{
                      fontSize: '0.58rem',
                      color: getStatusColor(c.durum),
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: 2,
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}>{c.ad.split(' ')[0]}</div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Side panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Selected date detail */}
          {selectedDate && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px' }}>
              <div style={{ fontSize: '0.72rem', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
                {selectedDate.split('-').reverse().join('.')} — {selectedCustomers.length} Takip
              </div>
              {selectedCustomers.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>Bu gün takip yok.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedCustomers.map(c => (
                    <div
                      key={c.id}
                      onClick={() => openModal(c.id)}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--surface2)',
                        border: `1px solid ${getStatusColor(c.durum)}33`,
                        borderLeft: `3px solid ${getStatusColor(c.durum)}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(79,142,247,0.07)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface2)')}
                    >
                      <div style={{ fontWeight: 500, fontSize: '0.82rem', marginBottom: 3 }}>{c.ad}</div>
                      {c.telefon && <div style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace", marginBottom: 3 }}>{c.telefon}</div>}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {c.vize && <span style={{ fontSize: '0.62rem', color: 'var(--accent)', fontFamily: "'IBM Plex Mono', monospace" }}>{c.vize}</span>}
                        <span style={{ fontSize: '0.62rem', color: getStatusColor(c.durum), background: getStatusBg(c.durum), padding: '1px 5px', borderRadius: 6, fontFamily: "'IBM Plex Mono', monospace" }}>{c.durum}</span>
                      </div>
                      {c.not && <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.not}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming 14 days */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px', flex: 1 }}>
            <div style={{ fontSize: '0.72rem', fontFamily: "'IBM Plex Mono', monospace", color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Yaklaşan 14 Gün
            </div>
            {upcoming.length === 0 ? (
              <div style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>Yaklaşan takip yok.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 480, overflowY: 'auto' }}>
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
                        gap: 8,
                        padding: '7px 10px',
                        borderRadius: 7,
                        cursor: 'pointer',
                        background: 'var(--surface2)',
                        border: '1px solid var(--border)',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(79,142,247,0.07)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface2)')}
                    >
                      <span style={{
                        fontSize: '0.65rem',
                        fontFamily: "'IBM Plex Mono', monospace",
                        color: days === 0 ? 'var(--danger)' : days === 1 ? 'var(--warn)' : 'var(--accent2)',
                        fontWeight: days <= 1 ? 700 : 400,
                        minWidth: 50,
                      }}>{dateLabel}</span>
                      <span style={{ fontSize: '0.78rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.ad}</span>
                      <span style={{
                        width: 7, height: 7,
                        borderRadius: '50%',
                        background: getStatusColor(c.durum),
                        flexShrink: 0,
                      }} />
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
