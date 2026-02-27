import { Customer, StatusType } from '../types';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function formatDate(dateStr: string): { html: string; raw: string } {
  if (!dateStr) return { html: '<span style="color:var(--muted)">—</span>', raw: '' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dt = new Date(dateStr);
  dt.setHours(0, 0, 0, 0);
  const diff = Math.round((dt.getTime() - today.getTime()) / 86400000);
  const parts = dateStr.substring(0, 10).split('-');
  const str = `${parts[2]}.${parts[1]}.${parts[0]}`;
  if (diff < 0) return { html: `<span style="color:var(--danger);font-family:'IBM Plex Mono',monospace;font-size:0.72rem">⚠ ${str}</span>`, raw: str };
  if (diff === 0) return { html: `<span style="color:var(--danger);font-family:'IBM Plex Mono',monospace;font-size:0.72rem;font-weight:600">🔴 BUGÜN</span>`, raw: 'BUGÜN' };
  if (diff === 1) return { html: `<span style="color:var(--warn);font-family:'IBM Plex Mono',monospace;font-size:0.72rem">🟡 YARIN</span>`, raw: 'YARIN' };
  return { html: `<span style="color:var(--accent2);font-family:'IBM Plex Mono',monospace;font-size:0.72rem">${str}</span>`, raw: str };
}

export function formatDateTime(dt: string): string {
  if (!dt) return '—';
  const d = new Date(dt);
  return d.toLocaleDateString('tr-TR') + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export function getDaysUntil(dateStr: string): number {
  if (!dateStr) return Infinity;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dt = new Date(dateStr);
  dt.setHours(0, 0, 0, 0);
  return Math.round((dt.getTime() - today.getTime()) / 86400000);
}

export function getTodayFollowUps(customers: Customer[]): Customer[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return customers.filter(c => {
    if (!c.takip) return false;
    const dt = new Date(c.takip);
    dt.setHours(0, 0, 0, 0);
    return dt.getTime() === today.getTime();
  });
}

export function getUpcomingFollowUps(customers: Customer[], days = 7): Customer[] {
  return customers
    .filter(c => {
      if (!c.takip) return false;
      const d = getDaysUntil(c.takip);
      return d >= 0 && d <= days;
    })
    .sort((a, b) => new Date(a.takip).getTime() - new Date(b.takip).getTime());
}

export function getStatusColor(status: StatusType | string): string {
  switch (status) {
    case 'Olumsuz': return 'var(--accent-rose)';
    case 'Beklemede': return 'var(--accent-amber)';
    case 'Tamamlandı': return 'var(--accent-emerald)';
    case 'Yeni Lead': return 'var(--accent-primary)';
    default: return 'var(--text-muted)';
  }
}

export function getStatusBg(status: StatusType | string): string {
  switch (status) {
    case 'Olumsuz': return 'rgba(244,63,94,0.12)';
    case 'Beklemede': return 'rgba(245,158,11,0.12)';
    case 'Tamamlandı': return 'rgba(16,185,129,0.12)';
    case 'Yeni Lead': return 'rgba(99,102,241,0.12)';
    default: return 'rgba(74,79,106,0.12)';
  }
}

export function getStatusBorder(status: StatusType | string): string {
  switch (status) {
    case 'Olumsuz': return 'rgba(244,63,94,0.25)';
    case 'Beklemede': return 'rgba(245,158,11,0.25)';
    case 'Tamamlandı': return 'rgba(16,185,129,0.25)';
    case 'Yeni Lead': return 'rgba(99,102,241,0.25)';
    default: return 'rgba(74,79,106,0.25)';
  }
}

export function getVizeClass(vize: string) {
  if (!vize) return 'diger';
  const v = vize.toLowerCase();
  if (v.includes('schengen')) return 'schengen';
  if (v.includes('ispanya')) return 'ispanya';
  if (v.includes('i̇ngiltere') || v.includes('ingiltere') || v.includes('uk')) return 'ingiltere';
  return 'diger';
}

export function getStatusClass(status: string) {
  if (!status) return '';
  const s = status.toLowerCase();
  if (s.includes('yeni lead')) return 'yeni-lead';
  if (s.includes('beklemede')) return 'beklemede';
  if (s.includes('tamamlandı') || s.includes('tamamlandi')) return 'tamamlandi';
  if (s.includes('olumsuz')) return 'olumsuz';
  return '';
}

export function exportToCSV(customers: Customer[]): void {
  const headers = ['Ad Soyad', 'Telefon', 'E-posta', 'Vize Türü', 'Durum', 'Görüşme Tarihi', 'Takip Tarihi', 'Süreç Durumu', 'Müşteri Kararı', 'Son Not', 'Kayıt Tarihi'];
  const rows = customers.map(c => [
    c.ad,
    c.telefon,
    c.email,
    c.vize,
    c.durum,
    c.gorusme,
    c.takip,
    c.surec,
    c.karar,
    c.not.replace(/,/g, ';'),
    c.createdAt,
  ]);
  const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vizemo-crm-${new Date().toISOString().substring(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function getMonthlyData(customers: Customer[]): { month: string; yeni: number; kapandi: number }[] {
  const months: Record<string, { yeni: number; kapandi: number }> = {};
  const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  // Start from February 2026, show 6 months forward
  const startYear = 2026;
  const startMonth = 1; // 0-indexed: 1 = February
  for (let i = 0; i < 6; i++) {
    const m = (startMonth + i) % 12;
    const y = startYear + Math.floor((startMonth + i) / 12);
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    months[key] = { yeni: 0, kapandi: 0 };
  }
  customers.forEach(c => {
    const key = c.createdAt.substring(0, 7);
    if (months[key]) months[key].yeni++;
    if ((c.durum === 'Tamamlandı' || c.durum === 'Olumsuz') && months[key]) {
      months[key].kapandi++;
    }
  });
  return Object.entries(months).map(([key, val]) => {
    const [year, month] = key.split('-');
    return { month: monthNames[parseInt(month) - 1] + " '" + year.slice(2), ...val };
  });
}
