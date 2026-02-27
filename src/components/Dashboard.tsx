import { useApp } from '../context/AppContext';
import { StatusType } from '../types';
import { getTodayFollowUps, getUpcomingFollowUps, getStatusColor, getStatusBg, getMonthlyData } from '../utils/helpers';
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
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontFamily="'Syne', sans-serif" fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 8,
      padding: '10px 14px',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '12px',
    }}>
      <div style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: <strong style={{ color: 'var(--text-primary)' }}>{p.value}</strong>
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

  const vizeColors = ['var(--accent-primary)', 'var(--accent-cyan)', 'var(--accent-amber)', 'var(--accent-emerald)', 'var(--accent-secondary)'];
  const vizePieData = Object.entries(vizeCounts)
    .sort((a, b) => b[1] - a[1]) // Sort by count desc
    .map(([name, value], i) => ({
      name, value, color: vizeColors[i % vizeColors.length],
    }));

  // Conversion rate calculation
  const totalLeads = customers.length;
  const activeLeads = customers.filter(c => c.durum === 'Yeni Lead' || c.durum === 'Beklemede').length;
  const completedLeads = counts['Tamamlandı'];

  const conversionRate = totalLeads > 0
    ? ((completedLeads / totalLeads) * 100).toFixed(1)
    : '0.0';

  // Recent activity
  const recentActivity: { time: string; text: string; customer: string; id: string }[] = [];
  customers.forEach(c => {
    c.log.forEach(entry => {
      recentActivity.push({ time: entry.timestamp, text: entry.text, customer: c.firstName + ' ' + c.lastName, id: c.id });
    });
  });
  recentActivity.sort((a, b) => b.time.localeCompare(a.time));
  const latestActivity = recentActivity.slice(0, 8);

  const statCards = [
    { label: 'Yeni Lead', value: counts['Yeni Lead'], class: 'lead', icon: '📩' },
    { label: 'Beklemede', value: counts['Beklemede'], class: 'beklemede', icon: '⏳' },
    { label: 'Tamamlandı', value: counts['Tamamlandı'], class: 'tamamlandi', icon: '✓' },
    { label: 'Olumsuz', value: counts['Olumsuz'], class: 'olumsuz', icon: '✕' },
  ];

  return (
    <div style={{ padding: '64px 32px 40px 32px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '28px', color: 'var(--text-primary)' }}>Genel Bakış</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: 4 }}>
          {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Today's reminders */}
      {todayFollowUps.length > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderLeft: '4px solid var(--accent-amber)',
          borderRadius: 12,
          padding: '16px 20px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
          <span style={{ fontSize: '20px', filter: 'drop-shadow(0 0 8px rgba(245,158,11,0.6))' }}>🔔</span>
          <div>
            <span style={{ color: 'var(--accent-amber)', fontWeight: 600, fontSize: '14px' }}>
              SDR Takip Listesi (Bugün Aranacak & Gecikenler - {todayFollowUps.length}):
            </span>
            <span style={{ color: 'var(--text-primary)', fontSize: '14px', marginLeft: 8, fontFamily: "'DM Sans', sans-serif" }}>
              {todayFollowUps.map(m => m.firstName + ' ' + m.lastName).join(', ')}
            </span>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 32 }}>
        {statCards.map(card => (
          <div key={card.label} className={`kpi-card ${card.class}`}>
            <div className={`kpi-icon ${card.class}`}>
              {card.icon}
            </div>
            <div className="kpi-number">{card.value}</div>
            <div className="kpi-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Conversion Funnel & General Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24, marginBottom: 32 }}>
        <div className="chart-card" style={{ gridColumn: 'span 8' }}>
          <div className="chart-title">Dönüşüm Hunisi</div>
          <div className="chart-subtitle">Gelen taleplerden başarılı vize işlemlerine dönüşüm oranı</div>

          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Toplam Lead</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{totalLeads}</span>
            </div>
            <div className="funnel-bar total" style={{ width: '100%' }}>{totalLeads}</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, marginTop: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Aktif Görülen (Yeni + Beklemede)</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{activeLeads}</span>
            </div>
            <div className="funnel-bar active" style={{ width: `${totalLeads > 0 ? (activeLeads / totalLeads) * 100 : 0}%`, minWidth: 40 }}>{activeLeads}</div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, marginTop: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Dönüşen (Tamamlandı)</span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>{completedLeads}</span>
            </div>
            <div className="funnel-bar converted" style={{ width: `${totalLeads > 0 ? (completedLeads / totalLeads) * 100 : 0}%`, minWidth: 40 }}>{completedLeads}</div>
          </div>
        </div>

        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="chart-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="chart-title">Dönüşüm Oranı</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 16 }}>
              <span style={{ fontSize: 48, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: 'var(--accent-emerald)', lineHeight: 1 }}>
                %{conversionRate}
              </span>
            </div>
          </div>

          <div className="chart-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="chart-title">Bu Hafta Takip</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 16 }}>
              <span style={{ fontSize: 48, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: 'var(--accent-primary)', lineHeight: 1 }}>
                {upcoming.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24, marginBottom: 32 }}>
        {/* Monthly bar chart */}
        <div className="chart-card" style={{ gridColumn: 'span 8' }}>
          <div className="chart-title">Aylık Müşteri Aktivitesi</div>
          <div className="chart-subtitle">Yeni leads ve kapanan işlemler</div>
          <div style={{ height: 260, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} axisLine={{ stroke: 'var(--border-subtle)' }} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="yeni" name="Yeni Müşteri" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="kapandi" name="Kapandı" fill="var(--accent-emerald)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status pie */}
        <div className="chart-card" style={{ gridColumn: 'span 4' }}>
          <div className="chart-title">Durum Dağılımı</div>
          <div className="chart-subtitle">Tüm kayıtlı müşteriler</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  labelLine={false}
                  label={renderCustomLabel}
                  dataKey="value"
                  stroke="var(--bg-card)"
                  strokeWidth={2}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span style={{ color: 'var(--text-secondary)', fontSize: '13px', fontFamily: "'DM Sans', sans-serif" }}>{value}</span>}
                  iconSize={10}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: 20 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 24 }}>
        {/* Visa type chart */}
        <div className="chart-card" style={{ gridColumn: 'span 4' }}>
          <div className="chart-title">Vize Türü</div>
          <div className="chart-subtitle">Tercih edilen vize kategorileri</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
            {vizePieData.map(d => (
              <div key={d.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="legend-dot" style={{ background: d.color }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontFamily: "'Syne', sans-serif", fontWeight: 700, color: 'var(--text-primary)' }}>
                    {d.value}
                  </span>
                </div>
                <div style={{ width: '100%', height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(d.value / customers.length) * 100}%`, background: d.color, borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming follow-ups */}
        <div className="chart-card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column' }}>
          <div className="chart-title">Yaklaşan Takipler</div>
          <div className="chart-subtitle">Önümüzdeki 7 gün</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {upcoming.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '16px 0' }}>Takip bulunmuyor.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcoming.slice(0, 7).map(c => {
                  const parts = c.takip.split('-');
                  const dateStr = parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : c.takip;
                  const days = Math.round((new Date(c.takip).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86400000);

                  return (
                    <div
                      key={c.id}
                      onClick={() => openModal(c.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        background: 'var(--bg-elevated)',
                        border: '1px solid transparent',
                        transition: 'all 0.2s',
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
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{c.firstName + ' ' + c.lastName}</div>
                        <div style={{
                          fontSize: '11px',
                          fontFamily: "'Syne', sans-serif",
                          color: days === 0 ? 'var(--accent-rose)' : days === 1 ? 'var(--accent-amber)' : 'var(--accent-primary)',
                          fontWeight: 700,
                        }}>
                          {days === 0 ? 'BUGÜN' : days === 1 ? 'YARIN' : dateStr}
                        </div>
                      </div>
                      <div className={`status-indicator ${(c.durum || '').toLowerCase().replace(' ', '-')}`}>
                        <span className="status-dot" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent activity */}
        <div className="chart-card" style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column' }}>
          <div className="chart-title">Son Aktiviteler</div>
          <div className="chart-subtitle">Müşteri işlem geçmişi</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {latestActivity.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '16px 0' }}>Henüz aktivite yok.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {latestActivity.map((a, i) => (
                  <div
                    key={i}
                    onClick={() => openModal(a.id)}
                    style={{
                      display: 'flex',
                      gap: 12,
                      paddingBottom: 12,
                      borderBottom: i < latestActivity.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{
                      fontSize: '11px',
                      fontFamily: "'Syne', sans-serif",
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      paddingTop: 2,
                    }}>
                      {a.time.substring(5, 10).replace('-', '.')}
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: 2 }}>{a.customer}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{a.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
