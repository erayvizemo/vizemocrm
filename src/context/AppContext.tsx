import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Customer, ModalState, ViewType } from '../types';
import { allImportedCustomers, revenueData as importedRevenue, RevenueEntry } from '../data/importedData';
import { generateId } from '../utils/helpers';

// Bump this version whenever the imported dataset changes.
// On version mismatch the stored data is replaced with fresh Excel data.
const DATA_VERSION = '2';

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
  addRevenue: (data: Omit<RevenueEntry, 'id'>) => void;
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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

  useEffect(() => {
    localStorage.setItem('vizemo_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('vizemo_revenue', JSON.stringify(revenue));
  }, [revenue]);

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
    const customer: Customer = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    setCustomers(prev => [customer, ...prev]);
    showToast(`${data.ad} başarıyla eklendi.`);
  }, [showToast]);

  const updateCustomer = useCallback((id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>) => {
    const now = new Date().toISOString().substring(0, 10);
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data, updatedAt: now } : c));
    showToast('Müşteri bilgileri güncellendi.');
  }, [showToast]);

  const deleteCustomer = useCallback((id: string) => {
    setCustomers(prev => {
      const c = prev.find(x => x.id === id);
      const name = c?.ad ?? 'Müşteri';
      showToast(`${name} silindi.`, 'info');
      return prev.filter(x => x.id !== id);
    });
  }, [showToast]);

  const addRevenue = useCallback((data: Omit<RevenueEntry, 'id'>) => {
    const entry: RevenueEntry = { ...data, id: generateId() };
    setRevenue(prev => [entry, ...prev]);
    showToast(`${data.ad} için gelir kaydı eklendi.`);
  }, [showToast]);

  return (
    <AppContext.Provider value={{
      customers, revenue, view, setView,
      modal, openModal, closeModal,
      addCustomer, updateCustomer, deleteCustomer,
      addRevenue,
      toasts, showToast,
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
