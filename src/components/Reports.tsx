import { useApp } from '../context/AppContext';
import { StatusType } from '../types';
import { getStatusColor, getMonthlyData } from '../utils/helpers';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

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
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || 'var(--text-primary)', marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
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

export default function Reports() {
  const { customers } = useApp();

  // Status counts (show all stages that have any customers)
  const statusCounts: Partial<Record<StatusType, number>> = {};
  customers.forEach(c => { statusCounts[c.durum] = (statusCounts[c.durum] ?? 0) + 1; });
  const STATUS_TYPES = Object.keys(statusCounts) as StatusType[];

  // Visa counts
  const vizeCounts: Record<string, number> = {};
  customers.forEach(c => { if (c.vize) vizeCounts[c.vize] = (vizeCounts[c.vize] || 0) + 1; });
  const vizeColors = ['var(--accent-primary)', 'var(--accent-emerald)', 'var(--accent-cyan)', 'var(--accent-amber)', 'var(--accent-secondary)'];

  // Process status counts
  const surecCounts: Record<string, number> = {};
  customers.forEach(c => { if (c.surec) surecCounts[c.surec] = (surecCounts[c.surec] || 0) + 1; });

  // Decision counts
  const kararCounts: Record<string, number> = {};
  customers.forEach(c => { if (c.karar) kararCounts[c.karar] = (kararCounts[c.karar] || 0) + 1; });

  const monthly = getMonthlyData(customers);
  const total = customers.length;
  const convRate = total > 0 ? (((statusCounts['Tamamlandı'] ?? 0) / total) * 100).toFixed(1) : '0.0';
  const lostRate = total > 0 ? (((statusCounts['Olumsuz'] ?? 0) / total) * 100).toFixed(1) : '0.0';
  const activeCount = (statusCounts['Beklemede'] ?? 0) + (statusCounts['Yeni Lead'] ?? 0);

  // Funnel data
  const funnelData: { name: string; value: number; fill: string }[] = [
    { name: 'Toplam Lead', value: total, fill: 'var(--accent-primary)' },
    { name: 'Aktif Müşteri', value: activeCount, fill: 'var(--accent-amber)' },
    { name: 'Tamamlandı', value: statusCounts['Tamamlandı'] ?? 0, fill: 'var(--accent-emerald)' },
  ];

  const statusPie = STATUS_TYPES
    .map(s => ({ name: s, value: statusCounts[s] ?? 0, color: getStatusColor(s) }))
    .filter(d => d.value > 0);

  const vizePie = Object.entries(vizeCounts).map(([name, value], i) => ({
    name, value, color: vizeColors[i % vizeColors.length],
  }));

  const surecBar = Object.entries(surecCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  return (
    <div style={{ padding: '64px 32px 32px', minHeight: '100vh', background: 'var(--bg-void)' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '28px', color: 'var(--text-primary)', marginBottom: 4 }}>Raporlar & Analiz</h1>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: "'DM Sans', sans-serif" }}>
          Tüm zamanların veri akışı ve müşteri özetleri
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Toplam Müşteri', value: total, color: 'var(--text-primary)', desc: 'Tüm kayıtlar' },
          { label: 'Aktif Süreç', value: activeCount, color: 'var(--accent-cyan)', desc: 'Yeni + Beklemede' },
          { label: 'Dönüşüm', value: `${convRate}%`, color: 'var(--accent-emerald)', desc: 'Tamamlanma oranı' },
          { label: 'Kayıp Oranı', value: `${lostRate}%`, color: 'var(--accent-rose)', desc: 'Olumsuz kapanış' },
        ].map(kpi => (
          <div key={kpi.label} className="chart-card" style={{ padding: '20px' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: "'Syne', sans-serif", textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, fontWeight: 700 }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: '36px', fontWeight: 800, color: kpi.color, fontFamily: "'Syne', sans-serif", lineHeight: 1, marginBottom: 8 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{kpi.desc}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Monthly bar */}
        <div className="chart-card">
          <div className="chart-title">Aylık Müşteri Akışı</div>
          <div className="chart-subtitle">Son 6 ay</div>

          <div style={{ height: 240, marginTop: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99, 102, 241, 0.1)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} axisLine={{ stroke: 'var(--border-subtle)' }} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11, fontFamily: "'DM Sans', sans-serif" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                <Bar dataKey="yeni" name="Yeni Müşteri" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="kapandi" name="Kapandı" fill="var(--accent-emerald)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status pie */}
        <div className="chart-card">
          <div className="chart-title">Durum Dağılımı</div>
          <div className="chart-subtitle">Tüm kayıtlı müşteriler</div>

          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPie}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="value"
                  labelLine={false}
                  label={renderLabel}
                  stroke="var(--bg-card)"
                  strokeWidth={2}
                >
                  {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Legend
                  formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>{v}</span>}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Process status bar */}
          <div className="chart-card">
            <div className="chart-title">Süreç Durumu Dağılımı</div>
            <div className="chart-subtitle">Konsolosluk veya başvuru süreci durumu</div>

            {surecBar.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                {surecBar.map(item => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', minWidth: 150, textAlign: 'right' }}>
                      {item.name}
                    </div>
                    <div style={{ flex: 1, height: 8, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(item.value / total) * 100}%`,
                        background: 'var(--accent-primary)',
                        borderRadius: 4,
                        transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)', fontFamily: "'Syne', sans-serif", fontWeight: 700, minWidth: 24, textAlign: 'right' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Veri yok.</div>
            )}
          </div>

          {/* Karar distribution */}
          <div className="chart-card">
            <div className="chart-title">Müşteri Kararı / Niyeti</div>
            <div className="chart-subtitle">Görüşme sırasındaki tahmin/karar durumu</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
              {kararCounts && Object.entries(kararCounts).length > 0 ? (
                Object.entries(kararCounts).sort((a, b) => b[1] - a[1]).map(([karar, count]) => (
                  <div key={karar} style={{
                    padding: '8px 14px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{karar}</span>
                    <span style={{
                      fontSize: '12px',
                      fontFamily: "'Syne', sans-serif",
                      color: 'var(--accent-cyan)',
                      fontWeight: 700,
                      background: 'rgba(6,182,212,0.1)',
                      padding: '2px 8px',
                      borderRadius: 10,
                    }}>{count}</span>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Veri yok.</div>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Visa type pie */}
          <div className="chart-card">
            <div className="chart-title">Vize Türü Dağılımı</div>
            <div className="chart-subtitle">Tüm kayıtlı müşteriler</div>

            {vizePie.length > 0 ? (
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vizePie}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      labelLine={false}
                      label={renderLabel}
                      stroke="var(--bg-card)"
                      strokeWidth={2}
                    >
                      {vizePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Legend
                      formatter={(v) => <span style={{ color: 'var(--text-secondary)', fontSize: '12px', fontFamily: "'DM Sans', sans-serif" }}>{v}</span>}
                      iconSize={8}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '20px 0' }}>Veri yok.</div>
            )}
          </div>

          {/* Conversion funnel */}
          <div className="chart-card">
            <div className="chart-title">Dönüşüm Hunisi</div>
            <div className="chart-subtitle">Leads → Tamamlanan İşlemler</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
              {funnelData.map((step, i) => (
                <div key={step.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: `${100 - i * 15}%`,
                    height: 50,
                    background: step.fill,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontFamily: "'Syne', sans-serif",
                    fontSize: '18px',
                    fontWeight: 700,
                  }}>
                    {step.value}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: `${100 - i * 15}%`, marginTop: 6 }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {step.name}
                    </div>
                    {i > 0 && funnelData[0].value > 0 && (
                      <div style={{ fontSize: '12px', color: step.fill, fontWeight: 600 }}>
                        {((step.value / funnelData[0].value) * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
