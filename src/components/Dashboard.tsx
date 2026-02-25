import { useApp } from '../context/AppContext';
import { StatusType } from '../types';
import { getTodayFollowUps, getUpcomingFollowUps, getStatusColor, getStatusBg, getMonthlyData, formatDateTime } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const STATUS_TYPES: StatusType[] = ['Yeni Lead', 'Beklemede', 'Tamamlandı', 'Olumsuz'];

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontFamily="IBM Plex Mono">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '10px 14px',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '0.72rem',
    }}>
      <div style={{ color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { customers, openModal } = useApp();

  const counts: Record<StatusType, number> = { 'Yeni Lead': 0, 'Beklemede': 0, 'Tamamlandı': 0, 'Olumsuz': 0 };
  customers.forEach(c => { if (counts[c.durum] !== undefined) counts[c.durum]++; });

  const todayFollowUps = getTodayFollowUps(customers);
  const upcoming = getUpcomingFollowUps(customers, 7);
  const monthlyData = getMonthlyData(customers);

  // Pie chart data for status
  const pieData = STATUS_TYPES
    .map(s => ({ name: s, value: counts[s], color: getStatusColor(s) }))
    .filter(d => d.value > 0);

  // Visa type distribution
  const vizeCounts: Record<string, number> = {};
  customers.forEach(c => {
    if (c.vize) vizeCounts[c.vize] = (vizeCounts[c.vize] || 0) + 1;
  });
  const vizeColors = ['#4f8ef7', '#38d9a9', '#f5a623', '#e05c5c', '#a78bfa'];
  const vizePieData = Object.entries(vizeCounts).map(([name, value], i) => ({
    name, value, color: vizeColors[i % vizeColors.length],
  }));

  // Conversion rate
  const conversionRate = customers.length > 0
    ? ((counts['Tamamlandı'] / customers.length) * 100).toFixed(1)
    : '0.0';

  // Recent activity
  const recentActivity: { time: string; text: string; customer: string; id: string }[] = [];
  customers.forEach(c => {
    c.log.forEach(entry => {
      recentActivity.push({ time: entry.timestamp, text: entry.text, customer: c.ad, id: c.id });
    });
  });
  recentActivity.sort((a, b) => b.time.localeCompare(a.time));
  const latestActivity = recentActivity.slice(0, 8);

  const statCards = [
    { label: 'Yeni Lead', value: counts['Yeni Lead'], color: 'var(--accent)', bg: 'rgba(79,142,247,0.1)', border: 'rgba(79,142,247,0.2)', icon: '🔵' },
    { label: 'Beklemede', value: counts['Beklemede'], color: 'var(--warn)', bg: 'rgba(245,166,35,0.1)', border: 'rgba(245,166,35,0.2)', icon: '🟡' },
    { label: 'Tamamlandı', value: counts['Tamamlandı'], color: 'var(--accent2)', bg: 'rgba(56,217,169,0.1)', border: 'rgba(56,217,169,0.2)', icon: '🟢' },
    { label: 'Olumsuz', value: counts['Olumsuz'], color: 'var(--danger)', bg: 'rgba(224,92,92,0.1)', border: 'rgba(224,92,92,0.2)', icon: '🔴' },
  ];

  return (
    <div style={{ padding: 28, minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text)' }}>Dashboard</h1>
        <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 4, fontFamily: "'IBM Plex Mono', monospace" }}>
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Today's reminders */}
      {todayFollowUps.length > 0 && (
        <div style={{
          background: 'rgba(245,166,35,0.1)',
          border: '1px solid rgba(245,166,35,0.25)',
          borderLeft: '3px solid var(--warn)',
          borderRadius: 10,
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '1.1rem' }}>🔔</span>
          <div>
            <span style={{ color: 'var(--warn)', fontWeight: 600, fontSize: '0.85rem' }}>
              Bugün {todayFollowUps.length} müşteri takip edilmeli:
            </span>
            <span style={{ color: 'var(--text)', fontSize: '0.82rem', marginLeft: 8 }}>
              {todayFollowUps.map(m => m.ad).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {statCards.map(card => (
          <div key={card.label} style={{
            background: card.bg,
            border: `1px solid ${card.border}`,
            borderRadius: 12,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.72rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              {card.label}
            </div>
            <div style={{ fontSize: '2.2rem', fontWeight: 600, color: card.color, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1 }}>
              {card.value}
            </div>
            <div style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: '1.8rem', opacity: 0.3 }}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.68rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Toplam Kayıt</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--text)', fontFamily: "'IBM Plex Mono', monospace" }}>{customers.length}</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.68rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Dönüşüm Oranı</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--accent2)', fontFamily: "'IBM Plex Mono', monospace" }}>{conversionRate}%</div>
        </div>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.68rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Bu Hafta Takip</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 600, color: 'var(--warn)', fontFamily: "'IBM Plex Mono', monospace" }}>{upcoming.length}</div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Monthly bar chart */}
        <div style={{ gridColumn: '1 / 3', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 16 }}>
            Aylık Müşteri Aktivitesi
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(37,42,58,0.8)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="yeni" name="Yeni Müşteri" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="kapandi" name="Kapandı" fill="var(--accent2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 16 }}>
            Durum Dağılımı
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                labelLine={false}
                label={renderCustomLabel}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                formatter={(value) => <span style={{ color: 'var(--muted)', fontSize: '0.68rem', fontFamily: 'IBM Plex Mono' }}>{value}</span>}
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Upcoming follow-ups */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 14 }}>
            Yaklaşan Takipler (7 Gün)
          </div>
          {upcoming.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: '0.82rem', padding: '8px 0' }}>Bu hafta takip yok.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcoming.slice(0, 6).map(c => {
                const parts = c.takip.split('-');
                const dateStr = parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : c.takip;
                const days = Math.round((new Date(c.takip).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
                return (
                  <div
                    key={c.id}
                    onClick={() => openModal(c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 10px',
                      borderRadius: 7,
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border)',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(79,142,247,0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  >
                    <span style={{
                      fontSize: '0.68rem',
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: days === 0 ? 'var(--danger)' : days === 1 ? 'var(--warn)' : 'var(--accent2)',
                      minWidth: 56,
                      fontWeight: 600,
                    }}>
                      {days === 0 ? 'BUGÜN' : days === 1 ? 'YARIN' : dateStr}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text)', flex: 1 }}>{c.ad}</span>
                    <span style={{
                      fontSize: '0.65rem',
                      fontFamily: "'IBM Plex Mono', monospace",
                      color: getStatusColor(c.durum),
                      background: getStatusBg(c.durum),
                      padding: '2px 6px',
                      borderRadius: 8,
                    }}>{c.durum}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.72rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 14 }}>
            Son Aktiviteler
          </div>
          {latestActivity.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Henüz aktivite yok.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {latestActivity.map((a, i) => (
                <div
                  key={i}
                  onClick={() => openModal(a.id)}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '7px 0',
                    borderBottom: i < latestActivity.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{
                    fontSize: '0.68rem',
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: 'var(--muted)',
                    minWidth: 80,
                    whiteSpace: 'nowrap',
                  }}>{a.time.substring(0, 10)}</div>
                  <div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent)', marginRight: 5 }}>{a.customer}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text)' }}>{a.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visa type chart */}
      {vizePieData.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', marginTop: 16 }}>
          <div style={{ fontSize: '0.72rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 14 }}>
            Vize Türü Dağılımı
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            {vizePieData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text)' }}>{d.name}</span>
                <span style={{ fontSize: '0.78rem', fontFamily: "'IBM Plex Mono', monospace", color: d.color, fontWeight: 600 }}>
                  {d.value}
                </span>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', height: 8, flex: 1, maxWidth: 300, borderRadius: 4, overflow: 'hidden', display: 'flex' }}>
              {vizePieData.map(d => (
                <div key={d.name} style={{
                  height: '100%',
                  width: `${(d.value / customers.length) * 100}%`,
                  background: d.color,
                }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
