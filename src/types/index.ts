export type StatusType = 'Yeni Lead' | 'Beklemede' | 'Tamamlandı' | 'Olumsuz';
export type ViewType = 'dashboard' | 'customers' | 'pipeline' | 'calendar' | 'reports' | 'eskisehir' | 'gaziantep' | 'istanbul' | 'gelir' | 'leodessaTracking' | 'leodessaLeads';

export type LeodessaStatus = 'new' | 'contacted' | 'transferred' | 'cancelled';

export interface LeodessaLead {
  id: string;
  firstName: string;
  lastName: string;
  telefon: string;
  email: string;
  service: string;
  serviceName: string;
  serviceIcon: string;
  score: number;
  temperature: string;
  isDisqualified: boolean;
  answers: Record<string, string>;
  notes: Record<string, string>;
  textAnswers: Record<string, string>;
  summaryText: string;
  createdAt: string;
  status: LeodessaStatus;
  crmTransferred: boolean;
  crmCustomerId?: string;
}

export interface LogEntry {
  timestamp: string;
  text: string;
}

export interface User {
  id: string;
  name: string;
  role: 'leodessa_admin' | 'sdr' | 'vizemo_admin' | 'vizemo_sales';
}

export type LeadSourceType = 'Meta Ads' | 'Google Ads' | 'Instagram' | 'Referans' | 'Web Site' | 'Yüz Yüze' | 'WhatsApp' | 'Reklam' | 'Diğer';

export const LEAD_SOURCES: LeadSourceType[] = [
  'Meta Ads', 'Google Ads', 'Instagram', 'Referans', 'Web Site', 'Yüz Yüze', 'WhatsApp', 'Reklam', 'Diğer'
];

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  telefon: string;
  email: string;
  vize: string;
  durum: StatusType;
  gorusme: string;
  takip: string;
  surec: string;
  karar: string;
  not: string;
  log: LogEntry[];
  createdAt: string;
  updatedAt: string;

  // Task 1 Fields: Lead Source & SDR Assignment
  leadSource?: LeadSourceType | string;
  adName?: string;
  assignedSdrId?: string;

  // Task 3 Fields: Do Not Contact
  doNotContact?: boolean;
  doNotContactReason?: string;

  // Optional fields from Excel import
  sehir?: string;
  danisman?: string;
  kaynak?: string; // Legacy
  statu?: string;
  evrakPct?: string;
  ulke?: string;
  durum_raw?: string;
}

export const VISA_TYPES = ['Schengen', 'İspanya Oturum', 'Amerika', 'İngiltere', 'Diğer'] as const;

export const STATUS_TYPES: StatusType[] = ['Yeni Lead', 'Beklemede', 'Tamamlandı', 'Olumsuz'];

export const PROCESS_TYPES = [
  'İlk Görüşme Yapıldı',
  'Evrak Teslim Alındı',
  'Evrak Eksik',
  'Başvuru Yapıldı',
  'Randevu Alındı',
  'Vize Onaylandı',
  'Vize Reddedildi',
  'İptal Edildi',
] as const;

export const DECISION_TYPES = [
  'Devam Edecek',
  'Bekliyor',
  'İptal Etti',
  'Bilgi Alıyor',
  'Fiyat Bekliyor',
] as const;

export const QUICK_CHIPS: { label: string; text: string }[] = [
  { label: '📞 Cevap yok', text: 'Müşteri arandı, cevap yok.' },
  { label: '🔄 Geri arayacak', text: 'Müşteri geri arayacak.' },
  { label: '💬 WA bilgi verildi', text: "WhatsApp'tan bilgi verildi." },
  { label: '📄 Evrak istendi', text: 'Evrak istendi.' },
  { label: '⏳ Evrak eksik', text: 'Evrak eksik, bekleniyor.' },
  { label: '✅ Başvuru yapıldı', text: 'Başvuru yapıldı.' },
  { label: '💰 Fiyat verildi', text: 'Fiyat bilgisi verildi.' },
  { label: '🛂 Pasaport alındı', text: 'Pasaport alındı.' },
  { label: '🖥️ Online görüşme', text: 'Online görüşme yapıldı.' },
  { label: '👤 Referans', text: 'Referans üzerinden geldi.' },
];

export interface ModalState {
  isOpen: boolean;
  customerId: string | null; // null = new customer
}
