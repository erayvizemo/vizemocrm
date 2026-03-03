import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Customer, ModalState, ViewType, LeodessaLead, User, LeadTask, UploadBatch, CustomerDocument, EvrakOperatorNotu } from '../types';
import { generateId } from '../utils/helpers';
import { sendToGoogleSheets } from '../services/googleSheets';
import { supabase } from '../lib/supabaseClient';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  customers: Customer[];
  revenue: any[]; // Using any for revenue to avoid importing RevenueEntry strictly for now, or match existing
  view: ViewType;
  setView: (v: ViewType) => void;
  modal: ModalState;
  openModal: (customerId?: string) => void;
  closeModal: () => void;
  trackingTransfer: any;
  setTrackingTransfer: (data: any) => void;
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCustomer: (id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>) => void;
  deleteCustomer: (id: string) => void;
  bulkDeleteCustomers: (ids: string[]) => void;
  addRevenue: (data: any) => void;
  updateRevenue: (id: string, data: any) => void;
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
  uploadBatches: UploadBatch[];
  addUploadBatch: (batch: UploadBatch) => void;
  deleteUploadBatch: (batchId: string) => void;
  removeRowFromBatch: (batchId: string, rowId: string) => void;
  loading: boolean;
  // Evrak Takip
  evrakCustomerId: string | null;
  setEvrakCustomerId: (id: string | null) => void;
  uploadCustomerDoc: (customerId: string, file: File, uploaderName: string) => Promise<void>;
  deleteCustomerDoc: (customerId: string, docId: string, fileName: string) => Promise<void>;
  updateEvrakKarar: (customerId: string, karar: 'approved' | 'feedback' | 'rejected', not: string) => Promise<void>;
  addEvrakNot: (customerId: string, text: string, author: string) => Promise<void>;
  saveEvrakFields: (customerId: string, fields: Partial<Customer>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const FAKE_USERS: User[] = [
  { id: 'u1', name: 'Dilara', role: 'leodessa_admin' },
  { id: 'u2', name: 'Eray', role: 'sdr' },
  { id: 'u3', name: 'Elanur', role: 'sdr' },
  { id: 'u4', name: 'Ayşe', role: 'leodessa_admin' }
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [leodessaLeads, setLeodessaLeads] = useState<LeodessaLead[]>([]);
  const [uploadBatches, setUploadBatches] = useState<UploadBatch[]>([]);
  const [evrakCustomerId, setEvrakCustomerId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<ViewType>('dashboard');
  const [modal, setModal] = useState<ModalState>({ isOpen: false, customerId: null });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [trackingTransfer, setTrackingTransfer] = useState<any>(null);

  const [users] = useState<User[]>(FAKE_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(FAKE_USERS[1]); // Default to 'Eray' (sdr)

  // ── Dedicated safe fetch for upload_batches ──
  // Used both on initial load and by realtime handler.
  // Keeps rows / headers / colMap safe against null values from DB.
  const fetchUploadBatches = useCallback(async () => {
    const { data, error } = await supabase
      .from('upload_batches')
      .select('*')
      .order('uploadDate', { ascending: false });
    if (error) {
      console.error('Error fetching upload_batches:', error);
      return;
    }
    const safe = (data || []).map((b: any) => ({
      ...b,
      rows: Array.isArray(b.rows) ? b.rows : [],
      headers: Array.isArray(b.headers) ? b.headers : [],
      colMap: b.colMap ?? { adSoyad: null, ad: null, soyad: null, telefon: null, email: null, sehir: null, kaynak: null },
    }));
    setUploadBatches(safe);
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      const [
        { data: customersData },
        { data: revenueData },
        { data: leodessaData },
      ] = await Promise.all([
        supabase.from('customers').select('*').order('createdAt', { ascending: false }),
        supabase.from('revenue').select('*'),
        supabase.from('leodessa_leads').select('*').order('createdAt', { ascending: false }),
      ]);

      const safeCustomers = (customersData || []).map((c: any) => ({
        ...c,
        log: c.log || [],
        tasks: c.tasks || [],
        stageHistory: c.stageHistory || [],
        callLogs: c.callLogs || []
      }));
      setCustomers(safeCustomers);
      setRevenue(revenueData || []);

      const safeLeodessa = (leodessaData || []).map((l: any) => ({
        ...l,
        answers: l.answers || [],
        notes: l.notes || [],
        textAnswers: l.textAnswers || []
      }));
      setLeodessaLeads(safeLeodessa);

      // Fetch upload batches via dedicated function (safe mapping)
      await fetchUploadBatches();

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [fetchUploadBatches]);

  // Initial Data Fetch
  useEffect(() => {
    setLoading(true);
    fetchAllData();
  }, [fetchAllData]);

  // Realtime Subscriptions
  useEffect(() => {
    const channel = supabase.channel('realtime_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'revenue' }, fetchAllData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leodessa_leads' }, fetchAllData)
      // upload_batches uses its own targeted handler to avoid race conditions.
      // This ensures ALL users see newly uploaded files in real-time
      // without triggering a full data re-fetch that could create race conditions.
      .on('postgres_changes', { event: '*', schema: 'public', table: 'upload_batches' }, fetchUploadBatches)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllData, fetchUploadBatches]);

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

  const addCustomer = useCallback(async (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const customer: Customer = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      lastActivityDate: now
    };

    // Optimistic UI Update
    setCustomers(prev => [customer, ...prev]);
    showToast(`${customer.firstName} ${customer.lastName} başarıyla eklendi.`);

    // DB Insert
    const { error } = await supabase.from('customers').insert(customer);
    if (error) {
      console.error("Error adding customer:", error);
      showToast("Müşteri eklenirken hata oluştu!", "error");
    }

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

  const updateCustomer = useCallback(async (id: string, data: Partial<Omit<Customer, 'id' | 'createdAt'>>) => {
    const now = new Date().toISOString();
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...data, updatedAt: now } : c));
    showToast('Müşteri bilgileri güncellendi.');

    const { error } = await supabase.from('customers').update({ ...data, updatedAt: now }).eq('id', id);
    if (error) console.error("Error updating customer:", error);
  }, [showToast]);

  const assignSdrToCustomer = useCallback((customerId: string, sdrId: string) => {
    updateCustomer(customerId, { assignedSdrId: sdrId });
    showToast(`Lead temsilciye atandı.`, 'success');
  }, [updateCustomer, showToast]);

  const deleteCustomer = useCallback(async (id: string) => {
    setCustomers(prev => {
      const c = prev.find(x => x.id === id);
      const name = c ? `${c.firstName} ${c.lastName}` : 'Müşteri';
      showToast(`${name} silindi.`, 'info');
      return prev.filter(x => x.id !== id);
    });

    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) console.error("Error deleting customer:", error);
  }, [showToast]);

  const bulkDeleteCustomers = useCallback(async (ids: string[]) => {
    setCustomers(prev => {
      showToast(`${ids.length} müşteri silindi.`, 'info');
      return prev.filter(x => !ids.includes(x.id));
    });

    const { error } = await supabase.from('customers').delete().in('id', ids);
    if (error) console.error("Error bulk deleting customers:", error);
  }, [showToast]);

  const addRevenue = useCallback(async (data: any) => {
    const entry = { ...data, id: generateId() };
    setRevenue(prev => [entry, ...prev]);
    showToast(`${data.firstName} ${data.lastName} için gelir kaydı eklendi.`);

    const { error } = await supabase.from('revenue').insert(entry);
    if (error) console.error("Error adding revenue:", error);
  }, [showToast]);

  const updateRevenue = useCallback(async (id: string, data: any) => {
    setRevenue(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    showToast('Gelir kaydı güncellendi.');

    const { error } = await supabase.from('revenue').update(data).eq('id', id);
    if (error) console.error("Error updating revenue:", error);
  }, [showToast]);

  const deleteRevenue = useCallback(async (id: string) => {
    setRevenue(prev => {
      const entry = prev.find(r => r.id === id);
      showToast(`${entry ? entry.firstName + ' ' + entry.lastName : 'Gelir kaydı'} silindi.`, 'info');
      return prev.filter(r => r.id !== id);
    });

    const { error } = await supabase.from('revenue').delete().eq('id', id);
    if (error) console.error("Error deleting revenue:", error);
  }, [showToast]);

  const addLeodessaLead = useCallback(async (data: Omit<LeodessaLead, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const lead: LeodessaLead = { ...data, id: generateId(), createdAt: now };
    setLeodessaLeads(prev => [lead, ...prev]);
    showToast(`${data.firstName} ${data.lastName} Leodessa lead olarak kaydedildi.`);

    const { error } = await supabase.from('leodessa_leads').insert(lead);
    if (error) console.error("Error adding leodessa lead:", error);
  }, [showToast]);

  const updateLeodessaLead = useCallback(async (id: string, data: Partial<LeodessaLead>) => {
    setLeodessaLeads(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
    const { error } = await supabase.from('leodessa_leads').update(data).eq('id', id);
    if (error) console.error("Error updating leodessa lead:", error);
  }, []);

  const deleteLeodessaLead = useCallback(async (id: string) => {
    setLeodessaLeads(prev => {
      const lead = prev.find(l => l.id === id);
      showToast(`${lead ? `${lead.firstName} ${lead.lastName}` : 'Lead'} silindi.`, 'info');
      return prev.filter(l => l.id !== id);
    });
    const { error } = await supabase.from('leodessa_leads').delete().eq('id', id);
    if (error) console.error("Error deleting leodessa lead:", error);
  }, [showToast]);

  const addTask = useCallback(async (customerId: string, task: LeadTask) => {
    const now = new Date().toISOString();
    let updatedTasks: LeadTask[] = [];

    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        updatedTasks = [...(c.tasks || []), task];
        return { ...c, tasks: updatedTasks, updatedAt: now };
      }
      return c;
    }));
    showToast('Task eklendi.', 'success');

    await supabase.from('customers').update({ tasks: updatedTasks, updatedAt: now }).eq('id', customerId);
  }, [showToast]);

  const updateTask = useCallback(async (customerId: string, taskId: string, data: Partial<LeadTask>) => {
    const now = new Date().toISOString();
    let updatedTasks: LeadTask[] = [];

    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        updatedTasks = (c.tasks || []).map(t => t.id === taskId ? { ...t, ...data } : t);
        return { ...c, tasks: updatedTasks, updatedAt: now };
      }
      return c;
    }));

    await supabase.from('customers').update({ tasks: updatedTasks, updatedAt: now }).eq('id', customerId);
  }, []);

  const deleteTask = useCallback(async (customerId: string, taskId: string) => {
    const now = new Date().toISOString();
    let updatedTasks: LeadTask[] = [];

    setCustomers(prev => prev.map(c => {
      if (c.id === customerId) {
        updatedTasks = (c.tasks || []).filter(t => t.id !== taskId);
        return { ...c, tasks: updatedTasks, updatedAt: now };
      }
      return c;
    }));
    showToast('Task silindi.', 'info');

    await supabase.from('customers').update({ tasks: updatedTasks, updatedAt: now }).eq('id', customerId);
  }, [showToast]);

  const addUploadBatch = useCallback(async (batch: UploadBatch) => {
    // 1. Write to DB first
    const { error } = await supabase.from('upload_batches').insert(batch);
    if (error) {
      console.error('Error adding upload batch:', error);
      showToast('Dosya kaydedilirken hata olustu!', 'error');
      return;
    }
    // 2. Only update local state after DB confirmed
    setUploadBatches(prev => [batch, ...prev]);
    showToast(`${batch.fileName} yuklendi.`);
  }, [showToast]);

  const deleteUploadBatch = useCallback(async (batchId: string) => {
    setUploadBatches(prev => prev.filter(b => b.id !== batchId));
    showToast('Yükleme silindi.', 'info');

    const { error } = await supabase.from('upload_batches').delete().eq('id', batchId);
    if (error) console.error("Error deleting upload batch:", error);
  }, [showToast]);

  const removeRowFromBatch = useCallback(async (batchId: string, rowId: string) => {
    let newRows: any[] = [];
    // optimistic update
    setUploadBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        newRows = b.rows.filter(r => r.id !== rowId);
        return { ...b, rows: newRows };
      }
      return b;
    }));

    // then persist
    // We need the full updated rows from the latest state
    // newRows is captured above from the optimistic update
    const { error } = await supabase.from('upload_batches').update({ rows: newRows }).eq('id', batchId);
    if (error) {
      console.error('Error updating batch rows:', error);
      // Re-fetch to restore correct state
      fetchAllData();
    }
  }, [fetchAllData]);

  // ── Evrak Takip Functions ──

  const uploadCustomerDoc = useCallback(async (customerId: string, file: File, uploaderName: string) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('Dosya boyutu 10MB limitini aşıyor!');
      return;
    }
    const docId = crypto.randomUUID();
    const path = `${customerId}/${docId}_${file.name}`;

    const { error: uploadErr } = await supabase.storage.from('customer-docs').upload(path, file);
    if (uploadErr) {
      console.error('Storage upload error:', uploadErr);
      showToast('Dosya yüklenemedi: ' + uploadErr.message, 'error');
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('customer-docs').getPublicUrl(path);

    const doc: CustomerDocument = {
      id: docId,
      name: file.name,
      url: publicUrl,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploaderName,
    };

    const customer = customers.find(c => c.id === customerId);
    const updatedDocs = [...(customer?.evraklar ?? []), doc];
    await updateCustomer(customerId, { evraklar: updatedDocs });
    showToast(`${file.name} yüklendi.`);
  }, [customers, updateCustomer, showToast]);

  const deleteCustomerDoc = useCallback(async (customerId: string, docId: string, fileName: string) => {
    const path = `${customerId}/${docId}_${fileName}`;
    const { error } = await supabase.storage.from('customer-docs').remove([path]);
    if (error) console.error('Storage delete error:', error);

    const customer = customers.find(c => c.id === customerId);
    const updatedDocs = (customer?.evraklar ?? []).filter(d => d.id !== docId);
    await updateCustomer(customerId, { evraklar: updatedDocs });
    showToast('Dosya silindi.', 'info');
  }, [customers, updateCustomer, showToast]);

  const updateEvrakKarar = useCallback(async (
    customerId: string,
    karar: 'approved' | 'feedback' | 'rejected',
    not: string
  ) => {
    await updateCustomer(customerId, {
      evrakKarar: karar,
      evrakKararNotu: not,
      evrakKararTarihi: new Date().toISOString(),
    });
    showToast('Karar kaydedildi.');
  }, [updateCustomer, showToast]);

  const addEvrakNot = useCallback(async (customerId: string, text: string, author: string) => {
    const customer = customers.find(c => c.id === customerId);
    const yeniNot: EvrakOperatorNotu = { text, author, timestamp: new Date().toISOString() };
    await updateCustomer(customerId, {
      evrakOperatorNotlari: [...(customer?.evrakOperatorNotlari ?? []), yeniNot],
    });
    showToast('Not kaydedildi.');
  }, [customers, updateCustomer, showToast]);

  const saveEvrakFields = useCallback(async (customerId: string, fields: Partial<Customer>) => {
    await updateCustomer(customerId, fields);
    showToast('Kaydedildi.');
  }, [updateCustomer, showToast]);

  return (
    <AppContext.Provider value={{
      customers, revenue, view, setView,
      modal, openModal, closeModal,
      trackingTransfer, setTrackingTransfer,
      addCustomer, updateCustomer, deleteCustomer, bulkDeleteCustomers,
      addRevenue, updateRevenue, deleteRevenue,
      toasts, showToast,
      leodessaLeads, addLeodessaLead, updateLeodessaLead, deleteLeodessaLead,
      users, currentUser, setCurrentUser, assignSdrToCustomer,
      addTask, updateTask, deleteTask,
      uploadBatches, addUploadBatch, deleteUploadBatch, removeRowFromBatch,
      loading,
      evrakCustomerId, setEvrakCustomerId,
      uploadCustomerDoc, deleteCustomerDoc,
      updateEvrakKarar, addEvrakNot, saveEvrakFields,
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

