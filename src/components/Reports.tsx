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
      background: 'var(--surface2)',
      border: '1px solid var(--border)',
      borderRadius: 8,
      padding: '10px 14px',
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: '0.72rem',
    }}>
      <div style={{ color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || 'var(--text)', marginBottom: 2 }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.06) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontFamily="IBM Plex Mono" fontWeight="600">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function Reports() {
  const { customers } = useApp();

  // Status counts
  const STATUS_TYPES: StatusType[] = ['Yeni Lead', 'Beklemede', 'Tamamlandı', 'Olumsuz'];
  const statusCounts: Record<StatusType, number> = { 'Yeni Lead': 0, 'Beklemede': 0, 'Tamamlandı': 0, 'Olumsuz': 0 };
  customers.forEach(c => { if (statusCounts[c.durum] !== undefined) statusCounts[c.durum]++; });

  // Visa counts
  const vizeCounts: Record<string, number> = {};
  customers.forEach(c => { if (c.vize) vizeCounts[c.vize] = (vizeCounts[c.vize] || 0) + 1; });
  const vizeColors = ['#4f8ef7', '#38d9a9', '#f5a623', '#e05c5c', '#a78bfa'];

  // Process status counts
  const surecCounts: Record<string, number> = {};
  customers.forEach(c => { if (c.surec) surecCounts[c.surec] = (surecCounts[c.surec] || 0) + 1; });

  // Decision counts
  const kararCounts: Record<string, number> = {};
  customers.forEach(c => { if (c.karar) kararCounts[c.karar] = (kararCounts[c.karar] || 0) + 1; });

  const monthly = getMonthlyData(customers);
  const total = customers.length;
  const convRate = total > 0 ? ((statusCounts['Tamamlandı'] / total) * 100).toFixed(1) : '0.0';
  const lostRate = total > 0 ? ((statusCounts['Olumsuz'] / total) * 100).toFixed(1) : '0.0';
  const activeCount = statusCounts['Beklemede'] + statusCounts['Yeni Lead'];

  // Funnel data
  const funnelData = [
    { name: 'Toplam Lead', value: total, fill: 'var(--accent)' },
    { name: 'Aktif Müşteri', value: activeCount, fill: 'var(--warn)' },
    { name: 'Tamamlandı', value: statusCounts['Tamamlandı'], fill: 'var(--accent2)' },
  ];

  const statusPie = STATUS_TYPES
    .map(s => ({ name: s, value: statusCounts[s], color: getStatusColor(s) }))
    .filter(d => d.value > 0);

  const vizePie = Object.entries(vizeCounts).map(([name, value], i) => ({
    name, value, color: vizeColors[i % vizeColors.length],
  }));

  const surecBar = Object.entries(surecCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  return (
    <div style={{ padding: 24, minHeight: '100vh' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Raporlar & Analiz</h2>
        <div style={{ color: 'var(--muted)', fontSize: '0.78rem', marginTop: 4 }}>
          {new Date().toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} verilerine dayalı özet
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        {[
          { label: 'Toplam Müşteri', value: total, color: 'var(--text)', desc: 'Tüm kayıtlar' },
          { label: 'Aktif Süreç', value: activeCount, color: 'var(--accent)', desc: 'Yeni + Beklemede' },
          { label: 'Dönüşüm', value: `${convRate}%`, color: 'var(--accent2)', desc: 'Tamamlanma oranı' },
          { label: 'Kayıp Oranı', value: `${lostRate}%`, color: 'var(--danger)', desc: 'Olumsuz kapanış' },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '18px 20px',
          }}>
            <div style={{ color: 'var(--muted)', fontSize: '0.68rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: kpi.color, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1, marginBottom: 6 }}>
              {kpi.value}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{kpi.desc}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Monthly bar */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 14 }}>
            Son 6 Aylık Müşteri Akışı
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(37,42,58,0.9)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'IBM Plex Mono' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="yeni" name="Yeni Müşteri" fill="#4f8ef7" radius={[4, 4, 0, 0]} />
              <Bar dataKey="kapandi" name="Kapandı" fill="#38d9a9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#4f8ef7', display: 'inline-block' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace" }}>Yeni Müşteri</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#38d9a9', display: 'inline-block' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace" }}>Kapandı</span>
            </div>
          </div>
        </div>

        {/* Status pie */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 14 }}>
            Durum Dağılımı
          </div>
          <ResponsiveContainer width="100%" height={200}>
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
              >
                {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Legend
                formatter={(v) => <span style={{ color: 'var(--muted)', fontSize: '0.68rem', fontFamily: 'IBM Plex Mono' }}>{v}</span>}
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Visa type pie */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 14 }}>
            Vize Türü Dağılımı
          </div>
          {vizePie.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={vizePie}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  labelLine={false}
                  label={renderLabel}
                >
                  {vizePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Legend
                  formatter={(v) => <span style={{ color: 'var(--muted)', fontSize: '0.68rem', fontFamily: 'IBM Plex Mono' }}>{v}</span>}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: '0.82rem', padding: '20px 0' }}>Veri yok.</div>
          )}
        </div>

        {/* Process status bar */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontSize: '0.7rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 14 }}>
            Süreç Durumu Dağılımı
          </div>
          {surecBar.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {surecBar.map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--muted)', minWidth: 140, textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {item.name}
                  </div>
                  <div style={{ flex: 1, height: 18, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${(item.value / total) * 100}%`,
                      background: 'var(--accent)',
                      borderRadius: 4,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--accent)', fontFamily: "'IBM Plex Mono', monospace", minWidth: 20, textAlign: 'right' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Veri yok.</div>
          )}
        </div>
      </div>

      {/* Conversion funnel */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ fontSize: '0.7rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 14 }}>
          Dönüşüm Hunisi
        </div>
        <div style={{ display: 'flex', gap: 0 }}>
          {funnelData.map((step, i) => (
            <div key={step.name} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: `${100 - i * 15}%`,
                height: 60,
                background: step.fill,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '1.1rem',
                fontWeight: 700,
                opacity: 0.9,
              }}>
                {step.value}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace", marginTop: 6, textAlign: 'center' }}>
                {step.name}
              </div>
              {i > 0 && funnelData[i - 1].value > 0 && (
                <div style={{ fontSize: '0.65rem', color: step.fill, fontFamily: "'IBM Plex Mono', monospace" }}>
                  {((step.value / funnelData[0].value) * 100).toFixed(0)}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Karar distribution table */}
      {Object.keys(kararCounts).length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', marginTop: 16 }}>
          <div style={{ fontSize: '0.7rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', marginBottom: 14 }}>
            Müşteri Kararı Dağılımı
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.entries(kararCounts).sort((a, b) => b[1] - a[1]).map(([karar, count]) => (
              <div key={karar} style={{
                padding: '8px 14px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text)' }}>{karar}</span>
                <span style={{
                  fontSize: '0.72rem',
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: 'var(--accent)',
                  fontWeight: 600,
                  background: 'rgba(79,142,247,0.12)',
                  padding: '1px 7px',
                  borderRadius: 10,
                }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
