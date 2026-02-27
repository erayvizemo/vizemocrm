import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Customer, ModalState, ViewType, LeodessaLead, User, LeadTask } from '../types';
import { allImportedCustomers, revenueData as importedRevenue, RevenueEntry } from '../data/importedData';
import { generateId } from '../utils/helpers';
import { sendToGoogleSheets } from '../services/googleSheets';

// Bump this version whenever the imported dataset changes.
const DATA_VERSION = '4';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  customers: Customer[];
  revenue: RevenueEntry[];
  view: ViewType;
  setView: (v: ViewType) => void;
  modal: ModalState;
  openModal: (customerId?: string) => void;
  closeModal: () => void;
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCustomer: (id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>) => void;
  deleteCustomer: (id: string) => void;
  bulkDeleteCustomers: (ids: string[]) => void;
  addRevenue: (data: Omit<RevenueEntry, 'id'>) => void;
  updateRevenue: (id: string, data: Partial<Omit<RevenueEntry, 'id'>>) => void;
  deleteRevenue: (id: string) => void;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  leodessaLeads: LeodessaLead[];
  addLeodessaLead: (data: Omit<LeodessaLead, 'id' | 'createdAt'>) => void;
  updateLeodessaLead: (id: string, data: Partial<LeodessaLead>) => void;
  deleteLeodessaLead: (id: string) => void;
  users: User[];
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  assignSdrToCustomer: (customerId: string, sdrId: string) => void;
  addTask: (customerId: string, task: LeadTask) => void;
  updateTask: (customerId: string, taskId: string, data: Partial<LeadTask>) => void;
  deleteTask: (customerId: string, taskId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const FAKE_USERS: User[] = [
  { id: 'u1', name: 'Dilara', role: 'leodessa_admin' },
  { id: 'u2', name: 'Eray', role: 'sdr' },
  { id: 'u3', name: 'Elanur', role: 'sdr' },
  { id: 'u4', name: 'Ayşe', role: 'leodessa_admin' }
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      // If data version doesn't match, wipe old cache and load fresh Excel data
      const storedVersion = localStorage.getItem('vizemo_data_version');
      if (storedVersion !== DATA_VERSION) {
        localStorage.removeItem('vizemo_customers');
        localStorage.setItem('vizemo_data_version', DATA_VERSION);
        return allImportedCustomers;
      }

      const saved = localStorage.getItem('vizemo_customers');
      if (saved) {
        const parsed = JSON.parse(saved) as Customer[];
        // Extra safety: if none have a sehir field it's legacy data → replace
        if (parsed.length > 0 && parsed.some(c => c.sehir)) return parsed;
      }
    } catch { /* ignore */ }

    localStorage.setItem('vizemo_data_version', DATA_VERSION);
    return allImportedCustomers;
  });

  const [revenue, setRevenue] = useState<RevenueEntry[]>(() => {
    try {
      const saved = localStorage.getItem('vizemo_revenue');
      if (saved) {
        const parsed = JSON.parse(saved) as RevenueEntry[];
        if (parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return importedRevenue;
  });
  const [view, setView] = useState<ViewType>('dashboard');
  const [modal, setModal] = useState<ModalState>({ isOpen: false, customerId: null });
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [users] = useState<User[]>(FAKE_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(FAKE_USERS[1]); // Default to 'Eray' (sdr)

  const [leodessaLeads, setLeodessaLeads] = useState<LeodessaLead[]>(() => {
    try {
      const saved = localStorage.getItem('vizemo_leodessa_leads');
      if (saved) return JSON.parse(saved) as LeodessaLead[];
    } catch { /* ignore */ }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('vizemo_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('vizemo_revenue', JSON.stringify(revenue));
  }, [revenue]);

  useEffect(() => {
    localStorage.setItem('vizemo_leodessa_leads', JSON.stringify(leodessaLeads));
  }, [leodessaLeads]);

  const openModal = useCallback((customerId?: string) => {
    setModal({ isOpen: true, customerId: customerId ?? null });
  }, []);

  const closeModal = useCallback(() => {
    setModal({ isOpen: false, customerId: null });
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = generateId();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const addCustomer = useCallback((data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString().substring(0, 10);
    const customer: Customer = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      lastActivityDate: new Date().toISOString()
    };
    setCustomers(prev => [customer, ...prev]);
    showToast(`${data.firstName + ' ' + data.lastName} başarıyla eklendi.`);

    // Google Sheets'e otomatik gönder
    sendToGoogleSheets({
      id: customer.id,
      ad: customer.firstName + ' ' + customer.lastName,
      telefon: customer.telefon,
      email: customer.email,
      vize: customer.vize,
      danisman: customer.danisman ?? '',
      sehir: customer.sehir ?? '',
      ulke: customer.ulke ?? '',
      durum: customer.durum,
      statu: customer.statu ?? '',
      kaynak: customer.kaynak ?? '',
      surec: customer.surec,
      karar: customer.karar,
      evrakPct: customer.evrakPct ?? '',
      gorusme: customer.gorusme,
      takip: customer.takip,
      not: customer.not,
      createdAt: now,
    });
  }, [showToast]);

  const updateCustomer = useCallback((id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>) => {
    const now = new Date().toISOString().substring(0, 10);
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data, updatedAt: now } : c));
    showToast('Müşteri bilgileri güncellendi.');
  }, [showToast]);

  const assignSdrToCustomer = useCallback((customerId: string, sdrId: string) => {
    updateCustomer(customerId, { assignedSdrId: sdrId });
    showToast(`Lead temsilciye atandı.`, 'success');
  }, [updateCustomer, showToast]);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => {
      const c = prev.find(x => x.id === id);
      const name = c ? `${c.firstName} ${c.lastName}` : 'Müşteri';
      showToast(`${name} silindi.`, 'info');
      return prev.filter(x => x.id !== id);
    });
  }, [showToast]);

  const bulkDeleteCustomers = useCallback((ids: string[]) => {
    setCustomers(prev => {
      showToast(`${ids.length} müşteri silindi.`, 'info');
      return prev.filter(x => !ids.includes(x.id));
    });
  }, [showToast]);

  const addRevenue = useCallback((data: Omit<RevenueEntry, 'id'>) => {
    const entry: RevenueEntry = { ...data, id: generateId() };
    setRevenue(prev => [entry, ...prev]);
    showToast(`${data.firstName + ' ' + data.lastName} için gelir kaydı eklendi.`);
  }, [showToast]);

  const updateRevenue = useCallback((id: string, data: Partial<Omit<RevenueEntry, 'id'>>) => {
    setRevenue(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    showToast('Gelir kaydı güncellendi.');
  }, [showToast]);

  const deleteRevenue = useCallback((id: string) => {
    setRevenue(prev => {
      const entry = prev.find(r => r.id === id);
      showToast(`${entry ? entry.firstName + ' ' + entry.lastName : 'Gelir kaydı'} silindi.`, 'info');
      return prev.filter(r => r.id !== id);
    });
  }, [showToast]);

  const addLeodessaLead = useCallback((data: Omit<LeodessaLead, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString().substring(0, 10);
    const lead: LeodessaLead = { ...data, id: generateId(), createdAt: now };
    setLeodessaLeads(prev => [lead, ...prev]);
    showToast(`${data.firstName + ' ' + data.lastName} Leodessa lead olarak kaydedildi.`);
  }, [showToast]);

  const updateLeodessaLead = useCallback((id: string, data: Partial<LeodessaLead>) => {
    setLeodessaLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  }, []);

  const deleteLeodessaLead = useCallback((id: string) => {
    setLeodessaLeads(prev => {
      const lead = prev.find(l => l.id === id);
      showToast(`${lead ? `${lead.firstName} ${lead.lastName}` : 'Lead'} silindi.`, 'info');
      return prev.filter(l => l.id !== id);
    });
  }, [showToast]);

  const addTask = useCallback((customerId: string, task: LeadTask) => {
    const now = new Date().toISOString().substring(0, 10);
    setCustomers(prev => prev.map(c => c.id === customerId ? {
      ...c,
      tasks: [...(c.tasks || []), task],
      updatedAt: now,
    } : c));
    showToast('Task eklendi.', 'success');
  }, [showToast]);

  const updateTask = useCallback((customerId: string, taskId: string, data: Partial<LeadTask>) => {
    const now = new Date().toISOString().substring(0, 10);
    setCustomers(prev => prev.map(c => c.id === customerId ? {
      ...c,
      tasks: (c.tasks || []).map(t => t.id === taskId ? { ...t, ...data } : t),
      updatedAt: now,
    } : c));
  }, []);

  const deleteTask = useCallback((customerId: string, taskId: string) => {
    const now = new Date().toISOString().substring(0, 10);
    setCustomers(prev => prev.map(c => c.id === customerId ? {
      ...c,
      tasks: (c.tasks || []).filter(t => t.id !== taskId),
      updatedAt: now,
    } : c));
    showToast('Task silindi.', 'info');
  }, [showToast]);

  return (
    <AppContext.Provider value={{
      customers, revenue, view, setView,
      modal, openModal, closeModal,
      addCustomer, updateCustomer, deleteCustomer, bulkDeleteCustomers,
      addRevenue, updateRevenue, deleteRevenue,
      toasts, showToast,
      leodessaLeads, addLeodessaLead, updateLeodessaLead, deleteLeodessaLead,
      users, currentUser, setCurrentUser, assignSdrToCustomer,
      addTask, updateTask, deleteTask,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
