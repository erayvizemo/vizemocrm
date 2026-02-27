// ── Pipeline aşamaları (Görev 7) ──
// LeoDessa aşamaları (1-6) + Vizemo aşamaları (7-11) + Legacy (geriye uyum)
export type StatusType =
  // LeoDessa Aşamaları
  | 'Yeni Lead'
  | 'Ulaşıldı'
  | 'Ulaşılamadı'
  | 'Unqualify Lead'
  | 'Müşteriden Geri Dönüş Bekleniyor'
  | 'Vizemo Ekibine Devredildi'
  // Vizemo Aşamaları
  | 'Belgeler İstendi'
  | 'Başvurular Yapıldı'
  | 'Randevu Alındı'
  | 'Ödeme Alındı'
  | 'Vize Alındı ✓'
  // Legacy (geriye dönük uyumluluk için)
  | 'Beklemede'
  | 'Tamamlandı'
  | 'Olumsuz';

export const LEODESSA_STAGES: StatusType[] = [
  'Yeni Lead', 'Ulaşıldı', 'Ulaşılamadı', 'Unqualify Lead',
  'Müşteriden Geri Dönüş Bekleniyor', 'Vizemo Ekibine Devredildi',
];
export const VIZEMO_STAGES: StatusType[] = [
  'Belgeler İstendi', 'Başvurular Yapıldı', 'Randevu Alındı', 'Ödeme Alındı', 'Vize Alındı ✓',
];
export const LEGACY_STAGES: StatusType[] = ['Beklemede', 'Tamamlandı', 'Olumsuz'];

export type ViewType = 'dashboard' | 'customers' | 'pipeline' | 'calendar' | 'reports' | 'eskisehir' | 'gaziantep' | 'istanbul' | 'gelir' | 'leodessaTracking' | 'leodessaLeads' | 'sdrDashboard' | 'leodessaUpload';

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
  salesConsultant?: string;   // Satış danışmanı adı soyadı (manuel giriş)
  kaynak?: string;            // Lead kaynağı (Meta Ads, Google Ads, vb.)
  sehir?: string;             // Müşteri şehri
}

export interface LogEntry {
  timestamp: string;
  text: string;
}

// Görev 4: Arama sonuç tipleri (genişletildi)
export type CallOutcome =
  | 'Ulaşıldı - İlgilendi'
  | 'Ulaşıldı - İlgilenmedi'
  | 'Ulaşılamadı - Kapalı'
  | 'Ulaşılamadı - Meşgul'
  | 'Numara Yanlış'
  | 'Daha Sonra Ara'
  | 'İleri Tarihte Arayın'
  // Legacy (geriye uyumluluk)
  | 'Ulaşıldı' | 'Cevap Vermedi' | 'Meşgul' | 'Numara Kullanılmıyor' | 'Yanlış Numara' | 'Kapandı';

export const CALL_OUTCOMES: CallOutcome[] = [
  'Ulaşıldı - İlgilendi',
  'Ulaşıldı - İlgilenmedi',
  'Ulaşılamadı - Kapalı',
  'Ulaşılamadı - Meşgul',
  'Numara Yanlış',
  'Daha Sonra Ara',
  'İleri Tarihte Arayın',
];

export interface CallLog {
  id: string;
  timestamp: string;
  outcome: CallOutcome;
  note: string;
  nextFollowupDate?: string;
  callerId?: string; // SDR ID referansı
}

// Görev 7c: Aşama geçiş tarihi
export interface StageHistoryEntry {
  id: string;
  fromStage: string;
  toStage: StatusType;
  changedBy: string; // user ID
  changedAt: string; // ISO timestamp
}

export interface User {
  id: string;
  name: string;
  role: 'leodessa_admin' | 'sdr' | 'vizemo_admin' | 'vizemo_sales';
}

// Task 6: Task Yönetimi
export type TaskStatus = 'open' | 'in_progress' | 'done';

export interface LeadTask {
  id: string;
  leadId: string;
  createdBy: string;
  assignedTo: string;
  title: string;
  description: string;
  dueDate: string;
  completedAt?: string;
  status: TaskStatus;
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

  // Task 4: Call Logs
  callLogs?: CallLog[];
  nextFollowupDate?: string;

  // Task 5: Last Activity
  lastActivityDate?: string;

  // Task 1 Fields: Lead Source & SDR Assignment
  leadSource?: LeadSourceType | string;
  adName?: string;
  assignedSdrId?: string;

  // Task 3 Fields: Do Not Contact
  doNotContact?: boolean;
  doNotContactReason?: string;

  // Task 6 Fields: Tasks
  tasks?: LeadTask[];

  // Task 7c: Stage history
  stageHistory?: StageHistoryEntry[];

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

export const STATUS_TYPES: StatusType[] = [
  ...LEODESSA_STAGES, ...VIZEMO_STAGES, ...LEGACY_STAGES
];

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

export interface BulkRow {
  id: string; // uuid
  firstName: string;
  lastName: string;
  telefon: string;
  email: string;
  sehir: string;
  kaynak: string;
  isValid: boolean;
}

export interface ColMap {
  adSoyad: number | null;
  ad: number | null;
  soyad: number | null;
  telefon: number | null;
  email: number | null;
  sehir: number | null;
  kaynak: number | null;
}

export interface UploadBatch {
  id: string; // uuid
  fileName: string;
  uploadDate: string; // ISO string
  headers: string[];
  colMap: ColMap;
  rows: BulkRow[];
}
