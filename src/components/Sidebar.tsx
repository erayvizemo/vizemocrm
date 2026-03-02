import { useApp } from '../context/AppContext';
import { ViewType, StatusType, LEODESSA_STAGES, VIZEMO_STAGES } from '../types';
import { getStatusColor } from '../utils/helpers';

const LEODESSA_COLOR = 'var(--accent-secondary)';

const mainNav: { view: ViewType; icon: string; label: string }[] = [
  { view: 'dashboard', icon: '⬛', label: 'Dashboard' },
  { view: 'customers', icon: '👥', label: 'Tüm Müşteriler' },
  { view: 'pipeline', icon: '📊', label: 'Pipeline' },
  { view: 'calendar', icon: '📅', label: 'Takvim' },
  { view: 'reports', icon: '📈', label: 'Raporlar' },
];

const cityNav: { view: ViewType; icon: string; label: string; color: string }[] = [
  { view: 'eskisehir', icon: '🏙️', label: 'Eskişehir', color: 'var(--accent-primary)' },
  { view: 'gaziantep', icon: '🌆', label: 'Gaziantep', color: 'var(--accent-amber)' },
  { view: 'istanbul', icon: '🌉', label: 'İstanbul', color: 'var(--accent-emerald)' },
  { view: 'konya', icon: '⛰️', label: 'Konya', color: 'var(--accent-info)' },
];

// Show key stages in the sidebar summary
const statusDots: { status: StatusType; label: string }[] = [
  { status: 'Yeni Lead', label: 'Yeni Lead' },
  { status: 'Ulaşıldı', label: 'Ulaşıldı' },
  { status: 'Müşteriden Geri Dönüş Bekleniyor', label: 'Geri Dönüş Bekleniyor' },
  { status: 'Vizemo Ekibine Devredildi', label: 'Vizemo\'ya Devredildi' },
  { status: 'Vize Alındı ✓', label: 'Vize Alındı ✓' },
  { status: 'Olumsuz', label: 'Olumsuz' },
];

export default function Sidebar() {
  const { view, setView, customers, openModal, leodessaLeads } = useApp();

  // Count across all stages
  const counts: Partial<Record<StatusType, number>> = {};
  [...LEODESSA_STAGES, ...VIZEMO_STAGES].forEach(s => { counts[s] = 0; });
  counts['Beklemede'] = 0; counts['Tamamlandı'] = 0; counts['Olumsuz'] = 0;
  customers.forEach(c => { if (counts[c.durum] !== undefined) counts[c.durum] = (counts[c.durum] ?? 0) + 1; });

  const cityCounts: Record<string, number> = { Eskişehir: 0, Gaziantep: 0, İstanbul: 0, Konya: 0 };
  customers.forEach(c => {
    if (c.sehir && cityCounts[c.sehir] !== undefined) cityCounts[c.sehir]++;
  });

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ flexShrink: 0, marginBottom: 32, padding: '0 12px' }}>
        <div className="sidebar-logo" style={{ marginBottom: 4, padding: 0 }}>
          VİZEMO
        </div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase'
        }}>
          Müşteri Takip Sistemi
        </div>
      </div>

      {/* Scrollable nav */}
      <nav style={{ flex: 1, overflowY: 'auto' }}>
        {/* Main nav */}
        {mainNav.map(item => (
          <button
            key={item.view}
            className={`nav-item ${view === item.view ? 'active' : ''}`}
            onClick={() => setView(item.view)}
            style={{ width: '100%', textAlign: 'left', background: 'transparent' }}
          >
            <span style={{ fontSize: '15px' }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
          </button>
        ))}

        {/* Divider + Cities */}
        <div className="sidebar-section-title">Şehirler</div>
        {cityNav.map(item => (
          <button
            key={item.view}
            className={`sidebar-city-item ${view === item.view ? 'active' : ''}`}
            onClick={() => setView(item.view)}
            style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '14px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
            <span className="sidebar-city-count" style={{ color: item.color, borderColor: `${item.color}40`, background: `${item.color}10` }}>
              {cityCounts[item.label === 'İstanbul' ? 'İstanbul' : item.label] ?? 0}
            </span>
          </button>
        ))}

        {/* Gelir */}
        <div className="sidebar-section-title" style={{ color: 'var(--accent-amber)' }}>Finans</div>
        <button
          className={`nav-item ${view === 'gelir' ? 'active' : ''}`}
          onClick={() => setView('gelir')}
          style={{ width: '100%', textAlign: 'left', background: 'transparent' }}
        >
          <span style={{ fontSize: '15px' }}>💰</span>
          <span style={{ flex: 1 }}>Gelir Takibi</span>
        </button>

        {/* Leodessa */}
        <div className="sidebar-section-title" style={{ color: LEODESSA_COLOR }}>✈ Leodessa</div>
        <button
          className={`nav-item ${view === 'leodessaUpload' ? 'active' : ''}`}
          onClick={() => setView('leodessaUpload')}
          style={{ width: '100%', textAlign: 'left', background: 'transparent' }}
        >
          <span style={{ fontSize: '15px' }}>📥</span>
          <span style={{ flex: 1 }}>Manuel Lead Girişi</span>
        </button>
        <button
          className={`nav-item ${view === 'leodessaTracking' ? 'active' : ''}`}
          onClick={() => setView('leodessaTracking')}
          style={{ width: '100%', textAlign: 'left', background: 'transparent' }}
        >
          <span style={{ fontSize: '15px' }}>🎯</span>
          <span style={{ flex: 1 }}>Lead Kalifikasyon</span>
        </button>
        <button
          className={`nav-item ${view === 'leodessaLeads' ? 'active' : ''}`}
          onClick={() => setView('leodessaLeads')}
          style={{ width: '100%', textAlign: 'left', background: 'transparent' }}
        >
          <span style={{ fontSize: '15px' }}>⭐</span>
          <span style={{ flex: 1 }}>Akıllı Lead Havuzu</span>
          {leodessaLeads.length > 0 && (
            <span style={{
              fontSize: '10px', fontFamily: "'DM Sans', sans-serif",
              background: `var(--bg-elevated)`, color: LEODESSA_COLOR, border: `1px solid ${LEODESSA_COLOR}40`,
              borderRadius: 6, padding: '2px 8px', fontWeight: 700,
            }}>
              {leodessaLeads.length}
            </span>
          )}
        </button>
        <button
          className={`nav-item ${view === 'sdrDashboard' ? 'active' : ''}`}
          onClick={() => setView('sdrDashboard')}
          style={{ width: '100%', textAlign: 'left', background: 'transparent' }}
        >
          <span style={{ fontSize: '15px' }}>📊</span>
          <span style={{ flex: 1 }}>SDR Dashboard</span>
        </button>

        {/* Durum Özeti */}
        <div className="sidebar-section-title">Durum Özeti</div>
        <div style={{ padding: '0 12px' }}>
          {statusDots.map(s => (
            <div key={s.status} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 10,
            }}>
              <span className={`status-dot`} style={{
                background: getStatusColor(s.status),
                boxShadow: `0 0 8px ${getStatusColor(s.status)}40`
              }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 1, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{s.label}</span>
              <span style={{
                fontSize: '13px', fontFamily: "'DM Sans', sans-serif",
                color: getStatusColor(s.status), fontWeight: 700,
              }}>{counts[s.status] ?? 0}</span>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
        <button className="btn-primary" onClick={() => openModal()} style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ fontSize: '16px', fontWeight: 300 }}>＋</span> Yeni Müşteri
        </button>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', marginTop: 16, fontWeight: 500 }}>
          {customers.length} müşteri kayıtlı
        </div>
      </div>
    </aside>
  );
}
