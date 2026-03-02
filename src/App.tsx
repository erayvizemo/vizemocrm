import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import CustomerModal from './components/CustomerModal';
import VizemoPipeline from './components/VizemoPipeline';
import LeodessaPipeline from './components/LeodessaPipeline';
import FollowUpCalendar from './components/FollowUpCalendar';
import Reports from './components/Reports';
import CityView from './components/CityView';
import Revenue from './components/Revenue';
import LeodessaTracking from './components/LeodessaTracking';
import LeodessaLeads from './components/LeodessaLeads';
import LeodessaUpload from './components/LeodessaUpload';
import SDRDashboard from './components/SDRDashboard';
import OperationPanel from './components/OperationPanel';

function AppShell() {
  const { view, toasts } = useApp();

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg-void)' }}>
      <Sidebar />
      <main className="main-content dashboard-bg" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <div style={{ paddingLeft: 240, width: '100%', height: '100%' }}>
          {view === 'dashboard' && <Dashboard />}
          {view === 'customers' && <Customers />}
          {view === 'vizemoPipeline' && <VizemoPipeline />}
          {view === 'leodessaPipeline' && <LeodessaPipeline />}
          {view === 'calendar' && <FollowUpCalendar />}
          {view === 'reports' && <Reports />}
          {view === 'eskisehir' && <CityView city="Eskişehir" />}
          {view === 'gaziantep' && <CityView city="Gaziantep" />}
          {view === 'istanbul' && <CityView city="İstanbul" />}
          {view === 'konya' && <CityView city="Konya" />}
          {view === 'gelir' && <Revenue />}
          {view === 'leodessaUpload' && <LeodessaUpload />}
          {view === 'leodessaTracking' && <LeodessaTracking />}
          {view === 'leodessaLeads' && <LeodessaLeads />}
          {view === 'sdrDashboard' && <SDRDashboard />}
          {view === 'operationPanel' && <OperationPanel />}
        </div>
      </main>
      <CustomerModal />
      {/* Toast notifications */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, display: 'flex',
        flexDirection: 'column', gap: 10, zIndex: 9999,
      }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
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
