import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import CustomerModal from './components/CustomerModal';
import Pipeline from './components/Pipeline';
import FollowUpCalendar from './components/FollowUpCalendar';
import Reports from './components/Reports';
import CityView from './components/CityView';
import Revenue from './components/Revenue';

function AppShell() {
  const { view, toasts } = useApp();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {view === 'dashboard' && <Dashboard />}
        {view === 'customers' && <Customers />}
        {view === 'pipeline' && <Pipeline />}
        {view === 'calendar' && <FollowUpCalendar />}
        {view === 'reports' && <Reports />}
        {view === 'eskisehir' && <CityView city="Eskişehir" />}
        {view === 'gaziantep' && <CityView city="Gaziantep" />}
        {view === 'istanbul' && <CityView city="İstanbul" />}
        {view === 'gelir' && <Revenue />}
      </main>
      <CustomerModal />
      {/* Toast notifications */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, display: 'flex',
        flexDirection: 'column', gap: 10, zIndex: 9999,
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 18px',
            borderRadius: 10,
            background: t.type === 'error' ? 'rgba(224,92,92,0.95)' : t.type === 'info' ? 'var(--surface2)' : 'rgba(56,217,169,0.9)',
            color: t.type === 'info' ? 'var(--muted)' : '#fff',
            fontSize: '0.82rem',
            fontFamily: "'IBM Plex Mono', monospace",
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            border: '1px solid',
            borderColor: t.type === 'error' ? 'rgba(224,92,92,0.5)' : t.type === 'info' ? 'var(--border)' : 'rgba(56,217,169,0.5)',
            animation: 'slide-up 0.2s ease',
            minWidth: 260,
          }}>
            {t.type === 'success' ? '✓ ' : t.type === 'error' ? '✕ ' : 'ℹ '}{t.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
