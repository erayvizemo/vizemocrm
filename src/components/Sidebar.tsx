import { useApp } from '../context/AppContext';
import { ViewType, StatusType } from '../types';

const LEODESSA_COLOR = '#a855f7';
import { getStatusColor } from '../utils/helpers';

const mainNav: { view: ViewType; icon: string; label: string }[] = [
  { view: 'dashboard', icon: '⬛', label: 'Dashboard' },
  { view: 'customers', icon: '👥', label: 'Tüm Müşteriler' },
  { view: 'pipeline', icon: '📊', label: 'Pipeline' },
  { view: 'calendar', icon: '📅', label: 'Takvim' },
  { view: 'reports', icon: '📈', label: 'Raporlar' },
];

const cityNav: { view: ViewType; icon: string; label: string; color: string }[] = [
  { view: 'eskisehir', icon: '🏙️', label: 'Eskişehir', color: '#4f8ef7' },
  { view: 'gaziantep', icon: '🌆', label: 'Gaziantep', color: '#f7a14f' },
  { view: 'istanbul', icon: '🌉', label: 'İstanbul', color: '#38d9a9' },
];

const statusDots: { status: StatusType; label: string }[] = [
  { status: 'Yeni Lead', label: 'Yeni Lead' },
  { status: 'Beklemede', label: 'Beklemede' },
  { status: 'Tamamlandı', label: 'Tamamlandı' },
  { status: 'Olumsuz', label: 'Olumsuz' },
];

export default function Sidebar() {
  const { view, setView, customers, openModal, leodessaLeads } = useApp();

  const counts: Record<StatusType, number> = {
    'Yeni Lead': 0, 'Beklemede': 0, 'Tamamlandı': 0, 'Olumsuz': 0,
  };
  customers.forEach(c => { if (counts[c.durum] !== undefined) counts[c.durum]++; });

  const cityCounts: Record<string, number> = { Eskişehir: 0, Gaziantep: 0, İstanbul: 0 };
  customers.forEach(c => {
    if (c.sehir && cityCounts[c.sehir] !== undefined) cityCounts[c.sehir]++;
  });

  function NavBtn({ item, color }: { item: { view: ViewType; icon: string; label: string }; color?: string }) {
    const active = view === item.view;
    return (
      <button
        onClick={() => setView(item.view)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '8px 12px',
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          fontSize: '0.83rem',
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontWeight: active ? 500 : 400,
          marginBottom: 2,
          background: active ? (color ? `${color}22` : 'rgba(79,142,247,0.15)') : 'transparent',
          color: active ? (color ?? 'var(--accent)') : 'var(--muted)',
          textAlign: 'left',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => {
          if (!active) {
            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
          }
        }}
        onMouseLeave={e => {
          if (!active) {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)';
          }
        }}
      >
        <span style={{ fontSize: '0.88rem', lineHeight: 1 }}>{item.icon}</span>
        <span style={{ flex: 1 }}>{item.label}</span>
        {active && (
          <span style={{
            width: 4, height: 4, borderRadius: '50%',
            background: color ?? 'var(--accent)',
            flexShrink: 0,
          }} />
        )}
      </button>
    );
  }

  return (
    <aside style={{
      width: 220,
      minWidth: 220,
      height: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px 20px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          fontSize: '1.15rem',
          letterSpacing: '0.04em',
          color: 'var(--text)',
          lineHeight: 1.3,
        }}>
          <span style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>VİZEMO</span>
        </div>
        <div style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '0.72rem',
          fontWeight: 400,
          color: 'var(--muted)',
          marginTop: 4,
          letterSpacing: '0.06em',
        }}>
          Müşteri Takip Sistemi
        </div>
        <div style={{
          width: 36,
          height: 2,
          borderRadius: 2,
          background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
          marginTop: 10,
          opacity: 0.7,
        }} />
      </div>

      {/* Scrollable nav */}
      <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
        {/* Main nav */}
        {mainNav.map(item => <NavBtn key={item.view} item={item} />)}

        {/* Divider + Cities */}
        <div style={{ height: 1, background: 'var(--border)', margin: '10px 4px 8px' }} />
        <div style={{ fontSize: '0.62rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 6, paddingLeft: 4 }}>
          Şehirler
        </div>
        {cityNav.map(item => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.83rem',
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontWeight: view === item.view ? 500 : 400,
              marginBottom: 2,
              background: view === item.view ? `${item.color}22` : 'transparent',
              color: view === item.view ? item.color : 'var(--muted)',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              if (view !== item.view) {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
              }
            }}
            onMouseLeave={e => {
              if (view !== item.view) {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)';
              }
            }}
          >
            <span style={{ fontSize: '0.88rem', lineHeight: 1 }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            <span style={{
              fontSize: '0.68rem',
              fontFamily: "'IBM Plex Mono', monospace",
              color: view === item.view ? item.color : 'var(--muted)',
              fontWeight: 600,
            }}>
              {cityCounts[item.label === 'İstanbul' ? 'İstanbul' : item.label] ?? 0}
            </span>
          </button>
        ))}

        {/* Gelir */}
        <div style={{ height: 1, background: 'var(--border)', margin: '10px 4px 8px' }} />
        <NavBtn item={{ view: 'gelir', icon: '💰', label: 'Gelir Takibi' }} color="#f7c94f" />

        {/* Leodessa */}
        <div style={{ height: 1, background: 'var(--border)', margin: '10px 4px 8px' }} />
        <div style={{ fontSize: '0.62rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', color: LEODESSA_COLOR, marginBottom: 6, paddingLeft: 4, fontWeight: 700 }}>
          ✈ Leodessa
        </div>
        <NavBtn item={{ view: 'leodessaTracking', icon: '🎯', label: 'Lead Tracking' }} color={LEODESSA_COLOR} />
        <button
          onClick={() => setView('leodessaLeads')}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontSize: '0.83rem', fontFamily: "'IBM Plex Sans', sans-serif",
            fontWeight: view === 'leodessaLeads' ? 500 : 400, marginBottom: 2,
            background: view === 'leodessaLeads' ? `${LEODESSA_COLOR}22` : 'transparent',
            color: view === 'leodessaLeads' ? LEODESSA_COLOR : 'var(--muted)',
            textAlign: 'left', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (view !== 'leodessaLeads') { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; } }}
          onMouseLeave={e => { if (view !== 'leodessaLeads') { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; } }}
        >
          <span style={{ fontSize: '0.88rem', lineHeight: 1 }}>⭐</span>
          <span style={{ flex: 1 }}>New Leads</span>
          {leodessaLeads.length > 0 && (
            <span style={{
              fontSize: '0.65rem', fontFamily: "'IBM Plex Mono', monospace",
              background: `${LEODESSA_COLOR}22`, color: LEODESSA_COLOR,
              borderRadius: 4, padding: '1px 5px', fontWeight: 700,
            }}>
              {leodessaLeads.length}
            </span>
          )}
        </button>

        {/* Divider + Status summary */}
        <div style={{ height: 1, background: 'var(--border)', margin: '10px 4px 8px' }} />
        <div style={{ padding: '0 4px' }}>
          <div style={{ fontSize: '0.62rem', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: 8 }}>
            Durum Özeti
          </div>
          {statusDots.map(s => (
            <div key={s.status} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 8px',
              borderRadius: 6,
              marginBottom: 3,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: getStatusColor(s.status), flexShrink: 0 }} />
              <span style={{ fontSize: '0.76rem', color: 'var(--muted)', flex: 1 }}>{s.label}</span>
              <span style={{
                fontSize: '0.72rem',
                fontFamily: "'IBM Plex Mono', monospace",
                color: getStatusColor(s.status),
                fontWeight: 600,
              }}>{counts[s.status]}</span>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button
          onClick={() => openModal()}
          style={{
            width: '100%',
            padding: '9px 14px',
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 500,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#3a7be0')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
        >
          + Yeni Müşteri
        </button>
        <div style={{ fontSize: '0.62rem', color: 'var(--muted)', fontFamily: "'IBM Plex Mono', monospace", textAlign: 'center', marginTop: 8 }}>
          {customers.length} müşteri kayıtlı
        </div>
      </div>
    </aside>
  );
}
