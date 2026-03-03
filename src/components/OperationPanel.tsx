// @ts-nocheck
// OperationPanel.jsx — Vizemo CRM Operasyon Paneli v2
// ✅ Günlük Otomatik Klasör Sistemi (ensureDailyFolder + snapshot)
// ✅ Tam Schengen ülke listesi (27 üye + de-facto + Non-Schengen)
// ✅ Mock data yok — sistem boş, kullanıma hazır
//
// localStorage anahtarları:
//   vizemo_appointment_data          → AppointmentStatus[]
//   vizemo_daily_reports             → DailyReport[]
//   vizemo_activity_feed             → son 50 aktivite
//   vizemo_current_operator          → seçili operatör
//   vizemo_last_update               → son güncelleme meta
//   vizemo_daily_folder_{YYYY-MM-DD} → günlük snapshot klasörü
//   vizemo_daily_folder_index        → tarih listesi

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useApp } from "../context/AppContext";

// ─────────────────────────────────────────────────────────────────────────────
// ÜLKE & BÖLGE REHBERİ
// ─────────────────────────────────────────────────────────────────────────────
const SCHENGEN_MEMBERS = [
  // ── 27 Schengen üye devleti ──────────────────────────────────────────────
  { country: "Almanya", zone: "Schengen", capital: "Berlin", embassy: "Almanya Büyükelçiliği Ankara" },
  { country: "Avusturya", zone: "Schengen", capital: "Viyana", embassy: "Avusturya Büyükelçiliği Ankara" },
  { country: "Belçika", zone: "Schengen", capital: "Brüksel", embassy: "Belçika Büyükelçiliği Ankara" },
  { country: "Çekya", zone: "Schengen", capital: "Prag", embassy: "Çekya Büyükelçiliği Ankara" },
  { country: "Danimarka", zone: "Schengen", capital: "Kopenhag", embassy: "Danimarka Büyükelçiliği Ankara" },
  { country: "Estonya", zone: "Schengen", capital: "Tallinn", embassy: "Estonya Büyükelçiliği Ankara" },
  { country: "Finlandiya", zone: "Schengen", capital: "Helsinki", embassy: "Finlandiya Büyükelçiliği Ankara" },
  { country: "Fransa", zone: "Schengen", capital: "Paris", embassy: "Fransa Büyükelçiliği Ankara" },
  { country: "Hollanda", zone: "Schengen", capital: "Amsterdam", embassy: "VFS Global İstanbul (Hollanda)" },
  { country: "İspanya", zone: "Schengen", capital: "Madrid", embassy: "İspanya Konsolosluğu İstanbul" },
  { country: "İsveç", zone: "Schengen", capital: "Stockholm", embassy: "VFS Global İstanbul (İsveç)" },
  { country: "İsviçre", zone: "Schengen", capital: "Bern", embassy: "İsviçre Büyükelçiliği Ankara" },
  { country: "İtalya", zone: "Schengen", capital: "Roma", embassy: "İtalya Konsolosluğu İstanbul" },
  { country: "İzlanda", zone: "Schengen", capital: "Reykjavik", embassy: "İzlanda — VFS Global Ankara" },
  { country: "Latviya", zone: "Schengen", capital: "Riga", embassy: "Latviya Büyükelçiliği Ankara" },
  { country: "Liechtenstein", zone: "Schengen", capital: "Vaduz", embassy: "Liechtenstein — İsviçre aracılığıyla" },
  { country: "Litvanya", zone: "Schengen", capital: "Vilnius", embassy: "Litvanya Büyükelçiliği Ankara" },
  { country: "Lüksemburg", zone: "Schengen", capital: "Lüksemburg", embassy: "Lüksemburg — Belçika aracılığıyla" },
  { country: "Macaristan", zone: "Schengen", capital: "Budapeşte", embassy: "Macaristan Büyükelçiliği Ankara" },
  { country: "Malta", zone: "Schengen", capital: "Valletta", embassy: "VFS Global İstanbul (Malta)" },
  { country: "Norveç", zone: "Schengen", capital: "Oslo", embassy: "Norveç Büyükelçiliği Ankara" },
  { country: "Polonya", zone: "Schengen", capital: "Varşova", embassy: "Polonya Büyükelçiliği Ankara" },
  { country: "Portekiz", zone: "Schengen", capital: "Lizbon", embassy: "Portekiz Büyükelçiliği Ankara" },
  { country: "Romanya", zone: "Schengen", capital: "Bükreş", embassy: "Romanya Büyükelçiliği Ankara" },
  { country: "Slovakya", zone: "Schengen", capital: "Bratislava", embassy: "Slovakya Büyükelçiliği Ankara" },
  { country: "Slovenya", zone: "Schengen", capital: "Ljubljana", embassy: "Slovenya Büyükelçiliği Ankara" },
  { country: "Yunanistan", zone: "Schengen", capital: "Atina", embassy: "Yunanistan Konsolosluğu İstanbul" },
  // ── De-facto Schengen ────────────────────────────────────────────────────
  { country: "Monako", zone: "Schengen (de-facto)", capital: "Monako", embassy: "Fransa aracılığıyla" },
  { country: "San Marino", zone: "Schengen (de-facto)", capital: "San Marino", embassy: "İtalya aracılığıyla" },
  { country: "Vatikan", zone: "Schengen (de-facto)", capital: "Vatikan", embassy: "İtalya aracılığıyla" },
  // ── Sık başvurulan Non-Schengen ──────────────────────────────────────────
  { country: "ABD", zone: "Non-Schengen", capital: "Washington", embassy: "ABD Büyükelçiliği Ankara" },
  { country: "Arnavutluk", zone: "Non-Schengen", capital: "Tiran", embassy: "Arnavutluk Büyükelçiliği Ankara" },
  { country: "Avustralya", zone: "Non-Schengen", capital: "Canberra", embassy: "Avustralya Büyükelçiliği Ankara" },
  { country: "Birleşik Arap Emirlikleri", zone: "Non-Schengen", capital: "Abu Dabi", embassy: "BAE Büyükelçiliği Ankara" },
  { country: "Bosna Hersek", zone: "Non-Schengen", capital: "Saraybosna", embassy: "Bosna Hersek Büyükelçiliği Ankara" },
  { country: "Bulgaristan", zone: "Non-Schengen", capital: "Sofya", embassy: "Bulgaristan Büyükelçiliği Ankara" },
  { country: "Hırvatistan", zone: "Non-Schengen", capital: "Zagreb", embassy: "Hırvatistan Büyükelçiliği Ankara" },
  { country: "Japonya", zone: "Non-Schengen", capital: "Tokyo", embassy: "Japonya Büyükelçiliği Ankara" },
  { country: "Kanada", zone: "Non-Schengen", capital: "Ottawa", embassy: "Kanada Büyükelçiliği Ankara" },
  { country: "Karadağ", zone: "Non-Schengen", capital: "Podgorica", embassy: "Karadağ Büyükelçiliği Ankara" },
  { country: "Kıbrıs", zone: "Non-Schengen", capital: "Lefkoşa", embassy: "Kıbrıs Büyükelçiliği Ankara" },
  { country: "Kuzey Makedonya", zone: "Non-Schengen", capital: "Üsküp", embassy: "K. Makedonya Büyükelçiliği Ankara" },
  { country: "Sırbistan", zone: "Non-Schengen", capital: "Belgrad", embassy: "Sırbistan Büyükelçiliği Ankara" },
  { country: "İngiltere", zone: "Non-Schengen", capital: "Londra", embassy: "VFS Global İstanbul (İngiltere)" },
  { country: "Yeni Zelanda", zone: "Non-Schengen", capital: "Wellington", embassy: "Yeni Zelanda — Avustralya aracılığıyla" },
];

const ALL_COUNTRIES = SCHENGEN_MEMBERS.map(m => m.country);

const VISA_TYPES = [
  "Schengen Turist (C)",
  "Uzun Dönem / Oturum (D)",
  "Çalışma Vizesi",
  "Öğrenci Vizesi",
  "Aile Birleşimi",
  "Pasaport Yenileme",
  "Transit Vizesi",
  "İş / Ticaret",
  "Diğer",
];

const STATUSES = ["AÇIK", "KAPALI", "KISITLI", "BEKLENİYOR", "ASKIDA"];
const ALERT_LEVELS = ["NORMAL", "DİKKAT", "KRİTİK"];

// ─────────────────────────────────────────────────────────────────────────────
// YARDIMCI
// ─────────────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const todayStr = () => new Date().toISOString().slice(0, 10);

const fmtDT = iso => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};
const fmtDate = iso => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};

const loadLS = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } };
const saveLS = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { } };

// ─────────────────────────────────────────────────────────────────────────────
// GÜNLÜK KLASÖR SİSTEMİ
// vizemo_daily_folder_{YYYY-MM-DD}  — her aktif gün için otomatik oluşturulur
// ─────────────────────────────────────────────────────────────────────────────

/** Bugün için klasör yoksa oluşturur, varsa mevcut olanı döner. */
function ensureDailyFolder(date = todayStr()) {
  const key = `vizemo_daily_folder_${date}`;
  const existing = loadLS(key, null);
  if (existing) return existing;

  const folder = {
    date,
    createdAt: now(),
    snapshots: [],   // { id, takenAt, takenBy, snapshotNote, appointmentCount, open, closed, critical, data }
    updatedCount: 0,
    reports: [],   // rapor id'leri
    notes: "",
  };
  saveLS(key, folder);

  // Tarih index'ini güncelle
  const idx = loadLS("vizemo_daily_folder_index", []);
  const newIdx = [...new Set([date, ...idx])].sort((a, b) => b.localeCompare(a)).slice(0, 365);
  saveLS("vizemo_daily_folder_index", newIdx);

  return folder;
}

/** Günlük klasöre yeni bir snapshot ekler. */
function addSnapshotToFolder(date, takenBy, appointments, snapshotNote = "") {
  const key = `vizemo_daily_folder_${date}`;
  const folder = loadLS(key, null) || ensureDailyFolder(date);

  const snapshot = {
    id: uid(),
    takenAt: now(),
    takenBy,
    snapshotNote,
    appointmentCount: appointments.length,
    open: appointments.filter(a => a.currentStatus === "AÇIK").length,
    closed: appointments.filter(a => a.currentStatus === "KAPALI").length,
    critical: appointments.filter(a => a.alertLevel === "KRİTİK").length,
    data: appointments,
  };

  const updated = {
    ...folder,
    updatedCount: folder.updatedCount + 1,
    snapshots: [snapshot, ...folder.snapshots].slice(0, 48),
  };
  saveLS(key, updated);
  return updated;
}

/** Günlük klasöre rapor id'si bağlar. */
function addReportToFolder(date, reportId) {
  const key = `vizemo_daily_folder_${date}`;
  const folder = loadLS(key, null) || ensureDailyFolder(date);
  saveLS(key, { ...folder, reports: [...new Set([reportId, ...folder.reports])] });
}

const getDailyFolderIndex = () => loadLS("vizemo_daily_folder_index", []);
const getDailyFolder = date => loadLS(`vizemo_daily_folder_${date}`, null);

// ─────────────────────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'IBM Plex Sans',sans-serif;background:#0F172A;color:#E2E8F0;min-height:100vh;}
:root{
  --navy:#0F172A;--navy2:#1E293B;--navy3:#273549;--navy4:#334155;
  --white:#F8FAFC;--gray:#94A3B8;--gray2:#CBD5E1;
  --green:#22C55E;--green-bg:rgba(34,197,94,.12);
  --red:#EF4444;--red-bg:rgba(239,68,68,.12);
  --yellow:#F59E0B;--yellow-bg:rgba(245,158,11,.12);
  --blue:#3B82F6;--blue-bg:rgba(59,130,246,.12);
  --orange:#F97316;--orange-bg:rgba(249,115,22,.12);
  --teal:#14B8A6;--teal-bg:rgba(20,184,166,.12);
}
.op-wrap{display:flex;min-height:100vh;background:var(--navy);}
.op-main{flex:1;overflow:auto;padding:24px;min-width:0;}
.op-sidebar{width:288px;min-width:288px;background:var(--navy2);border-left:1px solid var(--navy4);overflow-y:auto;padding:20px;display:flex;flex-direction:column;}

/* Header */
.op-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:14px;}
.op-header-left h1{font-size:20px;font-weight:700;color:var(--white);letter-spacing:-.3px;}
.op-header-left .subtitle{font-size:11px;color:var(--gray);margin-top:4px;line-height:1.5;}
.op-today{font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:500;color:#7DD3FC;background:var(--navy3);padding:7px 13px;border-radius:8px;border:1px solid var(--navy4);white-space:nowrap;}
.op-last-update{font-size:10px;color:var(--gray);margin-top:5px;text-align:right;}
.op-select{background:var(--navy3);border:1px solid var(--navy4);color:var(--white);padding:7px 11px;border-radius:8px;font-size:13px;font-family:inherit;cursor:pointer;outline:none;}
.op-select:focus{border-color:var(--blue);}

/* Summary Cards */
.summary-cards{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:18px;}
@media(max-width:1100px){.summary-cards{grid-template-columns:repeat(3,1fr);}}
.s-card{background:var(--navy2);border:1px solid var(--navy4);border-radius:12px;padding:15px;cursor:pointer;transition:all .18s;position:relative;overflow:hidden;}
.s-card:hover{border-color:var(--blue);transform:translateY(-1px);box-shadow:0 6px 18px rgba(0,0,0,.3);}
.s-card.active{border-color:var(--blue);background:var(--navy3);}
.s-card-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--gray);margin-bottom:8px;}
.s-card-value{font-size:28px;font-weight:700;line-height:1;}
.s-card-sub{font-size:10px;color:var(--gray);margin-top:4px;}
.accent-bar{position:absolute;bottom:0;left:0;right:0;height:3px;border-radius:0 0 12px 12px;}

/* Toolbar */
.op-toolbar{display:flex;align-items:center;gap:8px;margin-bottom:13px;flex-wrap:wrap;}
.op-search{background:var(--navy2);border:1px solid var(--navy4);color:var(--white);padding:8px 12px;border-radius:8px;font-size:13px;font-family:inherit;width:200px;outline:none;}
.op-search:focus{border-color:var(--blue);}
.op-search::placeholder{color:var(--gray);}
.op-filter-select{background:var(--navy2);border:1px solid var(--navy4);color:var(--white);padding:8px 10px;border-radius:8px;font-size:12px;font-family:inherit;outline:none;cursor:pointer;}
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 13px;border-radius:8px;font-size:12px;font-weight:600;font-family:inherit;cursor:pointer;border:none;transition:all .13s;white-space:nowrap;}
.btn-primary{background:var(--blue);color:#fff;}
.btn-primary:hover{background:#2563EB;}
.btn-ghost{background:transparent;color:var(--gray);border:1px solid var(--navy4);}
.btn-ghost:hover{background:var(--navy3);color:var(--white);}
.btn-teal{background:var(--teal-bg);color:var(--teal);border:1px solid rgba(20,184,166,.25);}
.btn-teal:hover{background:rgba(20,184,166,.22);}
.btn-green{background:var(--green-bg);color:var(--green);border:1px solid rgba(34,197,94,.2);}
.btn-green:hover{background:rgba(34,197,94,.2);}
.btn-sm{padding:5px 9px;font-size:11px;border-radius:6px;}
.ml-auto{margin-left:auto;}

/* Welcome / Empty State */
.empty-state{padding:48px 24px;text-align:center;color:var(--gray);}
.empty-state h3{font-size:17px;color:var(--gray2);margin-bottom:10px;}
.empty-state p{font-size:12px;line-height:1.75;max-width:480px;margin:0 auto 16px;}
.welcome-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(165px,1fr));gap:8px;max-width:780px;margin:16px auto 0;text-align:left;}
.welcome-card{background:var(--navy3);border:1px solid var(--navy4);border-radius:9px;padding:11px 13px;cursor:pointer;transition:border-color .14s;}
.welcome-card:hover{border-color:var(--blue);}
.welcome-card strong{display:block;color:var(--white);font-size:13px;margin-bottom:2px;}
.welcome-card span{font-size:10px;color:var(--gray);}
.zone-chip{font-size:9px;padding:1px 5px;border-radius:3px;font-weight:700;margin-top:4px;display:inline-block;}
.chip-s{background:rgba(59,130,246,.12);color:#93C5FD;}
.chip-n{background:rgba(148,163,184,.1);color:var(--gray);}

/* Table */
.op-table-wrap{background:var(--navy2);border:1px solid var(--navy4);border-radius:14px;overflow:hidden;margin-bottom:18px;}
.op-table{width:100%;border-collapse:collapse;font-size:12px;}
.op-table th{background:var(--navy3);padding:10px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--gray);cursor:pointer;user-select:none;white-space:nowrap;border-bottom:1px solid var(--navy4);}
.op-table th:hover{color:var(--white);}
.op-table td{padding:10px 12px;border-bottom:1px solid rgba(51,65,85,.4);vertical-align:middle;}
.op-table tr:last-child td{border-bottom:none;}
.op-table tr:nth-child(even){background:rgba(30,41,59,.35);}
.op-table tr:hover{background:var(--navy3);}
.op-table tr.critical-row{background:rgba(239,68,68,.055)!important;}
.op-table tr.critical-row:hover{background:rgba(239,68,68,.09)!important;}
.op-table tr.updated-today td:first-child{border-left:3px solid var(--green);}
.zone-tag{font-size:9px;padding:1px 5px;border-radius:3px;font-weight:700;margin-top:3px;display:inline-block;}
.zone-s{background:rgba(59,130,246,.12);color:#93C5FD;}
.zone-n{background:rgba(148,163,184,.1);color:var(--gray);}

/* Badges */
.badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:5px;font-size:10px;font-weight:700;letter-spacing:.3px;white-space:nowrap;}
.badge-AÇIK      {background:var(--green-bg);color:var(--green);border:1px solid rgba(34,197,94,.25);}
.badge-KAPALI    {background:var(--red-bg);color:var(--red);border:1px solid rgba(239,68,68,.25);}
.badge-KISITLI   {background:var(--yellow-bg);color:var(--yellow);border:1px solid rgba(245,158,11,.25);}
.badge-BEKLENİYOR{background:var(--blue-bg);color:var(--blue);border:1px solid rgba(59,130,246,.25);}
.badge-ASKIDA    {background:rgba(148,163,184,.1);color:var(--gray2);border:1px solid rgba(148,163,184,.2);}
.pulse-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--red);animation:pulse-anim 1.4s infinite;flex-shrink:0;}
@keyframes pulse-anim{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(1.45);}}

/* Avatar */
.avatar{width:27px;height:27px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;}
.avatar-O{background:rgba(59,130,246,.18);color:var(--blue);border:1px solid rgba(59,130,246,.3);}
.avatar-R{background:rgba(249,115,22,.18);color:var(--orange);border:1px solid rgba(249,115,22,.3);}

/* Modal */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.72);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;}
.modal-box{background:var(--navy2);border:1px solid var(--navy4);border-radius:16px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;padding:24px;}
.modal-title{font-size:16px;font-weight:700;color:var(--white);margin-bottom:2px;}
.modal-sub{font-size:11px;color:var(--gray);margin-bottom:20px;}
.modal-close{float:right;background:none;border:none;color:var(--gray);font-size:20px;cursor:pointer;line-height:1;}
.modal-close:hover{color:var(--white);}

/* Form */
.form-group{margin-bottom:13px;}
.form-label{display:block;font-size:10px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px;}
.form-input,.form-textarea,.form-select2{width:100%;background:var(--navy3);border:1px solid var(--navy4);color:var(--white);padding:9px 12px;border-radius:8px;font-size:13px;font-family:inherit;outline:none;}
.form-input:focus,.form-textarea:focus,.form-select2:focus{border-color:var(--blue);}
.form-input::placeholder,.form-textarea::placeholder{color:var(--gray);}
.form-textarea{resize:vertical;min-height:68px;}
.char-count{font-size:10px;color:var(--gray);text-align:right;margin-top:2px;}
.status-group{display:flex;gap:7px;flex-wrap:wrap;}
.status-btn{padding:7px 11px;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;border:2px solid transparent;transition:all .13s;font-family:inherit;}
.status-btn:not(.active){background:var(--navy3);color:var(--gray);border-color:var(--navy4);}
.status-btn.active.s-AÇIK      {background:var(--green-bg);color:var(--green);border-color:var(--green);}
.status-btn.active.s-KAPALI    {background:var(--red-bg);color:var(--red);border-color:var(--red);}
.status-btn.active.s-KISITLI   {background:var(--yellow-bg);color:var(--yellow);border-color:var(--yellow);}
.status-btn.active.s-BEKLENİYOR{background:var(--blue-bg);color:var(--blue);border-color:var(--blue);}
.status-btn.active.s-ASKIDA    {background:rgba(148,163,184,.13);color:var(--gray2);border-color:var(--gray);}

/* Timeline */
.timeline{border-left:2px solid var(--navy4);margin-top:12px;padding-left:12px;}
.tl-item{position:relative;margin-bottom:10px;}
.tl-item::before{content:'';position:absolute;left:-16px;top:3px;width:7px;height:7px;border-radius:50%;background:var(--navy4);border:2px solid var(--navy3);}
.tl-meta{font-size:10px;color:var(--gray);}
.tl-note{font-size:11px;color:var(--gray2);margin-top:2px;}

/* Drawer */
.drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99;}
.drawer{position:fixed;right:0;top:0;bottom:0;width:420px;background:var(--navy2);border-left:1px solid var(--navy4);z-index:100;overflow-y:auto;padding:24px;}

/* Folder Panel */
.folder-panel{background:var(--navy2);border:1px solid var(--navy4);border-radius:14px;padding:18px 20px;margin-bottom:18px;}
.fp-title{font-size:13px;font-weight:700;color:var(--white);display:flex;align-items:center;gap:8px;margin-bottom:12px;}
.fp-today{background:var(--navy3);border:1px solid var(--navy4);border-radius:10px;padding:11px 13px;margin-bottom:10px;}
.fp-today-title{font-size:11px;font-weight:700;color:var(--teal);}
.fp-today-meta{font-size:10px;color:var(--gray);margin-top:2px;}
.fp-stats{display:flex;gap:8px;margin-top:7px;flex-wrap:wrap;}
.fp-stat{font-size:10px;padding:2px 7px;border-radius:4px;font-weight:700;}
.fp-open  {background:var(--green-bg);color:var(--green);}
.fp-closed{background:var(--red-bg);color:var(--red);}
.fp-crit  {background:var(--orange-bg);color:var(--orange);}
.snap-list{display:flex;flex-direction:column;gap:5px;margin-top:10px;max-height:200px;overflow-y:auto;}
.snap-item{background:var(--navy2);border:1px solid var(--navy4);border-radius:7px;padding:8px 10px;font-size:10px;color:var(--gray2);}
.snap-time{font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--gray);}
.folder-list{display:flex;flex-direction:column;gap:7px;max-height:320px;overflow-y:auto;margin-top:8px;}
.folder-item{background:var(--navy3);border:1px solid var(--navy4);border-radius:9px;padding:10px 13px;cursor:pointer;transition:border-color .14s;}
.folder-item:hover,.folder-item.selected{border-color:var(--teal);}

/* Report Panel */
.report-panel{background:var(--navy2);border:1px solid var(--navy4);border-radius:14px;padding:18px 20px;margin-bottom:18px;}
.rp-title{font-size:13px;font-weight:700;color:var(--white);margin-bottom:12px;}
.report-textarea{width:100%;background:var(--navy3);border:1px solid var(--navy4);color:var(--white);padding:12px;border-radius:9px;font-family:'IBM Plex Mono',monospace;font-size:11px;line-height:1.75;min-height:220px;outline:none;resize:vertical;}
.report-textarea:focus{border-color:var(--blue);}
.report-actions{display:flex;gap:7px;margin-top:9px;flex-wrap:wrap;}
.acc-header{display:flex;align-items:center;justify-content:space-between;cursor:pointer;padding:9px 0;border-bottom:1px solid var(--navy4);user-select:none;}
.acc-label{font-size:12px;font-weight:600;color:var(--gray2);}
.acc-body{padding-top:9px;}
.rh-item{background:var(--navy3);border:1px solid var(--navy4);border-radius:7px;padding:9px;margin-bottom:6px;}
.rh-meta{font-size:10px;color:var(--gray);margin-bottom:4px;}
.rh-text{font-family:'IBM Plex Mono',monospace;font-size:10px;color:var(--gray2);white-space:pre-wrap;max-height:90px;overflow-y:auto;}

/* Sidebar */
.sb-title{font-size:11px;font-weight:700;color:var(--gray);text-transform:uppercase;letter-spacing:.7px;margin-bottom:11px;}
.feed-item{display:flex;gap:8px;margin-bottom:12px;align-items:flex-start;}
.feed-body{flex:1;min-width:0;}
.feed-name{font-size:11px;font-weight:700;color:var(--gray2);}
.feed-detail{font-size:10px;color:var(--gray);margin-top:2px;line-height:1.4;}
.feed-time{font-size:9px;color:var(--navy4);margin-top:2px;font-family:'IBM Plex Mono',monospace;}

/* Toast */
.toast-container{position:fixed;bottom:20px;right:20px;z-index:200;display:flex;flex-direction:column;gap:6px;}
.toast{background:var(--navy3);border:1px solid var(--navy4);border-radius:9px;padding:9px 15px;font-size:12px;color:var(--white);box-shadow:0 6px 24px rgba(0,0,0,.45);animation:toast-in .2s ease;display:flex;align-items:center;gap:7px;min-width:210px;}
.toast-success{border-left:3px solid var(--green);}
.toast-error  {border-left:3px solid var(--red);}
.toast-info   {border-left:3px solid var(--blue);}
@keyframes toast-in{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}

/* Misc */
.divider{height:1px;background:var(--navy4);margin:12px 0;}
.sec-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--gray);margin-bottom:7px;}
.op-badge{background:var(--navy3);border:1px solid var(--navy4);border-radius:4px;padding:1px 6px;font-size:10px;font-weight:700;}
.op-badge-Oğuz {color:var(--blue);}
.op-badge-Rıfat{color:var(--orange);}
`;

// ─────────────────────────────────────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────────────────────────────────────
function Toast({ toasts }: { toasts: any[] }) {
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>{t.msg}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function OperationPanel() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useApp();
  const crmAppointments = customers.filter((c: any) => c.durum === 'Randevu Alındı');

  // Operation Panel stores "takip kayıtları" (appointments).
  // Now we read tracking from Supabase customers instead of local state.
  const appointments = useMemo(() => {
    return crmAppointments.map(c => {
      // Decode the JSONB or text string back into Operation Panel object parts if we need to.
      // But for now, just map CRM entity -> OP entity
      return {
        id: c.id,
        country: c.ulke || "Bilinmiyor",
        visaType: c.vize || "Belirtilmemiş",
        embassy: c.sehir || 'Bilinmiyor',
        currentStatus: c.surec || "BAŞVURU YENİ",
        alertLevel: "NORMAL",
        waitingDays: 0,
        earliestDate: c.gorusme,
        quota: "",
        note: c.not,
        history: c.log?.map(l => ({ updatedAt: l.timestamp, note: l.text })) || [],
        lastUpdatedAt: c.updatedAt,
        lastUpdatedBy: c.assignedSdrId || "Sistem"
      };
    });
  }, [crmAppointments]);

  const [reports, setReports] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [autoTransferData, setAutoTransferData] = useState<any>(null);

  const [operator, setOperator] = useState("Oğuz");
  const [toasts, setToasts] = useState<any[]>([]);
  const [filter, setFilter] = useState({ search: "", status: "", alert: "", zone: "" });
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [sortCol, setSortCol] = useState("country");
  const [sortDir, setSortDir] = useState("asc");
  const [editItem, setEditItem] = useState<any>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [reportText, setReportText] = useState("");
  const [repAcc, setRepAcc] = useState(false);
  const [folderAcc, setFolderAcc] = useState(false);
  const [selFolder, setSelFolder] = useState<any>(null);
  const [folderIndex, setFolderIndex] = useState<any[]>([]);
  const [ctxMenu, setCtxMenu] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<any>(null);
  const ctxRef = useRef<any>(null);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setReports(loadLS("vizemo_daily_reports", []));
    setActivity(loadLS("vizemo_activity_feed", []));
    setOperator(loadLS("vizemo_current_operator", "Oğuz"));
    setLastUpdate(loadLS("vizemo_last_update", null));
    ensureDailyFolder();                         // ← bugünün klasörü
    setFolderIndex(getDailyFolderIndex());
  }, []);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const toast = useCallback((msg, type = "success") => {
    const id = uid();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3100);
  }, []);

  const handleOpChange = op => { setOperator(op); saveLS("vizemo_current_operator", op); };

  // ── Stats ─────────────────────────────────────────────────────────────────
  const today = todayStr();
  const stats = {
    open: appointments.filter(a => a.currentStatus === "AÇIK").length,
    closed: appointments.filter(a => a.currentStatus === "KAPALI").length,
    critical: appointments.filter(a => a.alertLevel === "KRİTİK").length,
    todayUp: appointments.filter(a => a.lastUpdatedAt?.slice(0, 10) === today).length,
    total: appointments.length,
  };

  // ── Filter + Sort ─────────────────────────────────────────────────────────
  const filtered = appointments.filter(a => {
    const q = filter.search.toLowerCase();
    if (q && !`${a.country} ${a.visaType} ${a.embassy}`.toLowerCase().includes(q)) return false;
    if (filter.status && a.currentStatus !== filter.status) return false;
    if (filter.alert && a.alertLevel !== filter.alert) return false;
    if (filter.zone) {
      const m = SCHENGEN_MEMBERS.find(x => x.country === a.country);
      if (filter.zone === "Schengen" && !m?.zone.startsWith("Schengen")) return false;
      if (filter.zone === "Non-Schengen" && m?.zone.startsWith("Schengen")) return false;
    }
    if (activeCard === "open" && a.currentStatus !== "AÇIK") return false;
    if (activeCard === "closed" && a.currentStatus !== "KAPALI") return false;
    if (activeCard === "critical" && a.alertLevel !== "KRİTİK") return false;
    if (activeCard === "today" && a.lastUpdatedAt?.slice(0, 10) !== today) return false;
    return true;
  }).sort((a, b) => {
    const cmp = String(a[sortCol] ?? "").localeCompare(String(b[sortCol] ?? ""), "tr");
    return sortDir === "asc" ? cmp : -cmp;
  });

  const handleSort = col => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  // ── Persist & Side-effects helper ─────────────────────────────────────────
  const persistUpdate = (newList: any[], label: string) => {
    addSnapshotToFolder(today, operator, newList, label);
    setFolderIndex(getDailyFolderIndex());
    const lu = { at: now(), by: operator };
    setLastUpdate(lu);
    saveLS("vizemo_last_update", lu);
  };

  // ── Save Update ───────────────────────────────────────────────────────────
  const saveUpdate = (updated: any) => {
    const histEntry = { updatedBy: operator, updatedAt: now(), status: updated.currentStatus, note: updated.note };

    // Update Supabase instead of local list array
    const customerId = updated.id;
    const c = crmAppointments.find((x: any) => x.id === customerId);
    if (c) {
      updateCustomer(customerId, {
        ulke: updated.country,
        vize: updated.visaType,
        surec: updated.currentStatus, // currentStatus -> surec
        not: updated.note,
        gorusme: updated.earliestDate,
        log: [...c.log, { timestamp: now(), text: `[OP] ${updated.note}` }]
      });
    }

    persistUpdate(appointments, `${updated.country} güncellendi`);
    const act = {
      id: uid(), at: now(), by: operator, country: updated.country,
      visaType: updated.visaType, newStatus: updated.currentStatus, note: updated.note
    };
    const newAct = [act, ...activity].slice(0, 50);
    setActivity(newAct);
    saveLS("vizemo_activity_feed", newAct);
    setEditItem(null);
    toast("Güncelleme kaydedildi ✓", "success");
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteItem = (id: string) => {
    if (!window.confirm("Bu kayıt tamamen silinecek. Onaylıyor musunuz?")) return;

    // Actually delete from CRM
    deleteCustomer(id);

    persistUpdate(appointments, `Kayıt silindi`);
    const act = {
      id: uid(), at: now(), by: operator, country: "Bilinmiyor",
      visaType: "Bilinmiyor", newStatus: "SİLİNDİ", note: "Kayıt manuel silindi"
    };
    const newAct = [act, ...activity].slice(0, 50);
    setActivity(newAct);
    saveLS("vizemo_activity_feed", newAct);
    toast("Kayıt başarıyla silindi 🗑️", "info");
  };

  // ── Add New ───────────────────────────────────────────────────────────────
  const addNew = (data: any) => {
    addCustomer({
      firstName: "Yeni",
      lastName: "Müşteri (Operasyon)",
      telefon: "",
      email: "",
      durum: "Randevu Alındı", // Force CRM into OP Pipeline
      surec: data.currentStatus,
      vize: data.visaType,
      ulke: data.country,
      sehir: data.embassy,
      not: data.note,
      karar: "",
      gorusme: data.earliestDate,
      takip: "",
      log: [{ timestamp: now(), text: "[OP] Kayıt eklendi" }]
    });

    persistUpdate(appointments, `${data.country} eklendi`);

    const act = {
      id: uid(), at: now(), by: operator, country: data.country,
      visaType: data.visaType, newStatus: data.currentStatus, note: data.note
    };
    const newAct = [act, ...activity].slice(0, 50);
    setActivity(newAct);
    saveLS("vizemo_activity_feed", newAct);
    setShowDrawer(false);
    toast(`${data.country} — ${data.visaType} eklendi`, "success");
  };

  // ── Manual Snapshot ───────────────────────────────────────────────────────
  const takeSnapshot = () => {
    addSnapshotToFolder(today, operator, appointments, "Manuel snapshot");
    setFolderIndex(getDailyFolderIndex());
    toast("Snapshot alındı 📸", "info");
  };

  // ── Quick status from welcome card ────────────────────────────────────────
  const openDrawerWith = (country) => {
    setAutoTransferData({ country });
    setShowDrawer(true);
  };

  // ── Transfer CRM Appointment ──────────────────────────────────────────────
  const transferFromCrm = (crm) => {
    setAutoTransferData({
      country: crm.gidilecekUlke || "",
      visaType: crm.hizmetTuru || "Schengen Turist (C)",
      note: `CRM'den aktarıldı: Müşteri ${crm.firstName} ${crm.lastName}`
    });
    setShowDrawer(true);
  };

  // ── Report ────────────────────────────────────────────────────────────────
  const generateReport = () => {
    const all = appointments;
    const open = all.filter(a => a.currentStatus === "AÇIK");
    const closed = all.filter(a => a.currentStatus === "KAPALI");
    const limited = all.filter(a => a.currentStatus === "KISITLI");
    const waiting = all.filter(a => a.currentStatus === "BEKLENİYOR");
    const critical = all.filter(a => a.alertLevel === "KRİTİK");
    let txt = `📋 GÜNLÜK RANDEVU RAPORU — ${fmtDate(now())}\nHazırlayan: ${operator}\n\n`;
    if (open.length) { txt += `🟢 AÇIK (${open.length}):\n`; open.forEach(a => { txt += `• ${a.country} — ${a.visaType}${a.waitingDays ? `: ~${a.waitingDays} gün` : ""}${a.earliestDate ? `, en erken ${fmtDate(a.earliestDate)}` : ""}\n`; }); txt += "\n"; }
    if (closed.length) { txt += `🔴 KAPALI (${closed.length}):\n`; closed.forEach(a => { txt += `• ${a.country} — ${a.visaType}${a.note ? ` — ${a.note}` : ""}\n`; }); txt += "\n"; }
    if (limited.length) { txt += `🟡 KISITLI (${limited.length}):\n`; limited.forEach(a => { txt += `• ${a.country} — ${a.visaType}${a.waitingDays ? `: ~${a.waitingDays} gün` : ""}${a.note ? ` — ${a.note}` : ""}\n`; }); txt += "\n"; }
    if (waiting.length) { txt += `🔵 BEKLENİYOR (${waiting.length}):\n`; waiting.forEach(a => { txt += `• ${a.country} — ${a.visaType}${a.waitingDays ? `: ~${a.waitingDays} gün` : ""}\n`; }); txt += "\n"; }
    if (critical.length) { txt += `⚠️ KRİTİK:\n`; critical.forEach(a => { txt += `• ${a.country} — ${a.visaType}: ${a.currentStatus}${a.note ? ` — ${a.note}` : ""}\n`; }); txt += "\n"; }
    txt += `📝 GENEL NOT: `;
    setReportText(txt);
    toast("Rapor taslağı hazırlandı", "info");
  };

  const copyReport = async () => {
    try { await navigator.clipboard.writeText(reportText); toast("Panoya kopyalandı ✓"); }
    catch { toast("Kopyalama başarısız", "error"); }
  };

  const saveReport = () => {
    if (!reportText.trim()) { toast("Rapor boş olamaz", "error"); return; }
    const rep = { id: uid(), date: today, preparedBy: operator, reportText, sentAt: null };
    const newReports = [rep, ...reports];
    setReports(newReports);
    saveLS("vizemo_daily_reports", newReports);
    addReportToFolder(today, rep.id);
    toast("Rapor kaydedildi ✓");
  };

  // ── Ctx menu ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = e => { if (ctxMenu && ctxRef.current && !ctxRef.current.contains(e.target)) setCtxMenu(null); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ctxMenu]);

  const todayLabel = (() => {
    const d = new Date(), days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"],
      months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  })();

  const currentFolder = getDailyFolder(today);
  const schengenCount = SCHENGEN_MEMBERS.filter(m => m.zone === "Schengen").length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="op-wrap">

        {/* ═══ MAIN ══════════════════════════════════════════════════════════ */}
        <div className="op-main">

          {/* Header */}
          <div className="op-header">
            <div className="op-header-left">
              <h1>⚙️ Operasyon Paneli — Randevu Takip</h1>
              <div className="subtitle">
                {schengenCount} Schengen üyesi · {SCHENGEN_MEMBERS.filter(m => !m.zone.startsWith("Schengen")).length} Non-Schengen ülke tanımlı
                · Günlük otomatik klasör sistemi aktif
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="op-today">{todayLabel}</div>
              {lastUpdate && (
                <div className="op-last-update">
                  Son güncelleme: {fmtDT(lastUpdate.at)} — <span className={`op-badge op-badge-${lastUpdate.by}`}>{lastUpdate.by}</span>
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label style={{ fontSize: 11, color: "var(--gray)" }}>Operatör:</label>
              <select className="op-select" value={operator} onChange={e => handleOpChange(e.target.value)}>
                <option>Oğuz</option>
                <option>Rıfat</option>
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="summary-cards">
            {[
              { key: "open", label: "Açık", value: stats.open, color: "var(--green)", sub: "randevu mevcut" },
              { key: "closed", label: "Kapalı", value: stats.closed, color: "var(--red)", sub: "başvuru yok" },
              { key: "critical", label: "Kritik Uyarı", value: stats.critical, color: "var(--orange)", sub: "acil takip" },
              { key: "today", label: "Bugün Güncellendi", value: stats.todayUp, color: "var(--blue)", sub: "kayıt" },
              { key: "total", label: "Toplam Takip", value: stats.total, color: "var(--gray)", sub: "ülke / vize" },
            ].map(c => (
              <div key={c.key} className={`s-card${activeCard === c.key ? " active" : ""}`}
                onClick={() => setActiveCard(activeCard === c.key ? null : c.key)}>
                <div className="s-card-label">{c.label}</div>
                <div className="s-card-value" style={{ color: c.color }}>
                  {c.value}{c.key === "critical" && c.value > 0 && <span className="pulse-dot" style={{ marginLeft: 7 }} />}
                </div>
                <div className="s-card-sub">{c.sub}</div>
                <div className="accent-bar" style={{ background: c.color }} />
              </div>
            ))}
          </div>

          {/* Toolbar */}
          <div className="op-toolbar">
            <input className="op-search" placeholder="🔍  Ülke, vize türü, konsolosluk…"
              value={filter.search} onChange={e => setFilter(f => ({ ...f, search: e.target.value }))} />
            <select className="op-filter-select" value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
              <option value="">Tüm Durumlar</option>{STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="op-filter-select" value={filter.alert} onChange={e => setFilter(f => ({ ...f, alert: e.target.value }))}>
              <option value="">Tüm Uyarı</option>{ALERT_LEVELS.map(a => <option key={a}>{a}</option>)}
            </select>
            <select className="op-filter-select" value={filter.zone} onChange={e => setFilter(f => ({ ...f, zone: e.target.value }))}>
              <option value="">Tüm Bölgeler</option>
              <option value="Schengen">Schengen</option>
              <option value="Non-Schengen">Non-Schengen</option>
            </select>
            {(activeCard || filter.search || filter.status || filter.alert || filter.zone) && (
              <button className="btn btn-ghost btn-sm" onClick={() => { setActiveCard(null); setFilter({ search: "", status: "", alert: "", zone: "" }); }}>✕ Temizle</button>
            )}
            <button className="btn btn-teal btn-sm" onClick={takeSnapshot}>📸 Snapshot Al</button>
            <button className="btn btn-primary ml-auto" onClick={() => setShowDrawer(true)}>+ Yeni Takip Ekle</button>
          </div>

          {/* CRM'den Randevu Alınanlar Tablosu */}
          {crmAppointments.length > 0 && (
            <div className="op-table-wrap" style={{ marginBottom: 24 }}>
              <div style={{ padding: "12px 18px", borderBottom: "1px solid var(--navy4)", background: "var(--navy3)", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--teal)" }}>📅 CRM'den Bekleyen Randevular ({crmAppointments.length})</span>
                <span style={{ fontSize: 10, color: "var(--gray)", fontWeight: 400 }}>Müşteri Takip Sistemi'nde "Randevu Alındı" olan müşteriler otomatik listelenir.</span>
              </div>
              <table className="op-table">
                <thead>
                  <tr>
                    <th>Müşteri</th>
                    <th>Telefon</th>
                    <th>Gidilecek Ülke</th>
                    <th>Hizmet Türü</th>
                    <th>Ekleyen Danışman</th>
                    <th>İşlem Tarihi</th>
                    <th>Aksiyon</th>
                  </tr>
                </thead>
                <tbody>
                  {crmAppointments.map((c: any) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: "var(--white)" }}>{c.firstName} {c.lastName}</td>
                      <td style={{ fontFamily: "'IBM Plex Mono'", color: "var(--gray2)" }}>{c.telefon || "—"}</td>
                      <td>{c.gidilecekUlke || "—"}</td>
                      <td style={{ color: "var(--gray2)" }}>{c.hizmetTuru || "—"}</td>
                      <td><span className="op-badge">{c.danisman || "—"}</span></td>
                      <td style={{ fontFamily: "'IBM Plex Mono'", color: "var(--gray2)", fontSize: 11 }}>{fmtDate(c.createdAt)}</td>
                      <td>
                        <button className="btn btn-teal btn-sm" onClick={() => transferFromCrm(c)}>Takibe Al ⚡</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TABLE or EMPTY */}
          {appointments.length === 0 ? (
            <div className="op-table-wrap">
              <div className="empty-state">
                <h3>🗂️ Sistem hazır — henüz takip kaydı yok</h3>
                <p>
                  <strong>+ Yeni Takip Ekle</strong> butonuna tıklayın ya da aşağıdan bir ülkeye tıklayarak hızlıca başlayın.
                  <br />Büyükelçilik bilgisi otomatik doldurulur.
                </p>
                <div className="welcome-grid">
                  {SCHENGEN_MEMBERS.filter(m => m.zone === "Schengen").map(m => (
                    <div key={m.country} className="welcome-card" onClick={() => openDrawerWith(m.country)}>
                      <strong>{m.country}</strong>
                      <span>{m.embassy}</span>
                      <div><span className="chip-s zone-chip">Schengen</span></div>
                    </div>
                  ))}
                  {SCHENGEN_MEMBERS.filter(m => !m.zone.startsWith("Schengen")).map(m => (
                    <div key={m.country} className="welcome-card" onClick={() => openDrawerWith(m.country)}>
                      <strong>{m.country}</strong>
                      <span>{m.embassy}</span>
                      <div><span className="chip-n zone-chip">Non-Schengen</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="op-table-wrap">
              <table className="op-table">
                <thead>
                  <tr>
                    {[["country", "Ülke"], ["visaType", "Vize Türü"], ["embassy", "Büyükelçilik"],
                    ["currentStatus", "Durum"], ["earliestDate", "En Erken"],
                    ["waitingDays", "Bekleme"], ["quota", "Kontenjan"],
                    ["note", "Not"], ["lastUpdatedAt", "Güncelleme"]
                    ].map(([c, l]) => (<th key={c} onClick={() => handleSort(c)}>{l}{sortCol === c ? (sortDir === "asc" ? " ↑" : " ↓") : ""}</th>))}
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && <tr><td colSpan={10} className="empty-state" style={{ padding: 28 }}>Filtreye uyan kayıt yok</td></tr>}
                  {filtered.map(a => {
                    const isCrit = a.alertLevel === "KRİTİK";
                    const isToday = a.lastUpdatedAt?.slice(0, 10) === today;
                    const meta = SCHENGEN_MEMBERS.find(m => m.country === a.country);
                    const isS = meta?.zone?.startsWith("Schengen");
                    return (
                      <tr key={a.id}
                        className={[isCrit ? "critical-row" : "", isToday ? "updated-today" : ""].filter(Boolean).join(" ")}
                        onContextMenu={e => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, item: a }); }}>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--white)" }}>{a.country}</div>
                          <span className={`zone-tag ${isS ? "zone-s" : "zone-n"}`}>{isS ? "Schengen" : "Non-Schengen"}</span>
                        </td>
                        <td style={{ color: "var(--gray2)" }}>{a.visaType}</td>
                        <td style={{ color: "var(--gray)", fontSize: 11, maxWidth: 155, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.embassy}</td>
                        <td><span className={`badge badge-${a.currentStatus}`}>{isCrit && <span className="pulse-dot" />}{a.currentStatus}</span></td>
                        <td style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, color: "var(--gray2)" }}>{a.earliestDate ? fmtDate(a.earliestDate) : "—"}</td>
                        <td style={{ textAlign: "center", fontFamily: "'IBM Plex Mono'", fontSize: 11, color: a.waitingDays ? "var(--gray2)" : "var(--gray)" }}>{a.waitingDays ? `${a.waitingDays} g` : "—"}</td>
                        <td style={{ color: "var(--gray)", fontSize: 11, maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.quota || "—"}</td>
                        <td style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--gray2)", fontSize: 11 }} title={a.note}>{a.note || "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setEditItem({ ...a })}>✏️</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => deleteItem(a.id)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Günlük Klasörler Paneli ────────────────────────────────────── */}
          <div className="folder-panel">
            <div className="fp-title">
              📁 Günlük Klasörler
              <span style={{ fontSize: 10, color: "var(--gray)", fontWeight: 400 }}>Her gün otomatik oluşturulur</span>
              <button className="btn btn-ghost btn-sm ml-auto" onClick={() => setFolderAcc(v => !v)}>
                {folderAcc ? "▲ Gizle" : "▼ Geçmiş"} ({folderIndex.filter(d => d !== today).length})
              </button>
            </div>

            {/* Bugünün özeti */}
            {currentFolder && (
              <div className="fp-today">
                <div className="fp-today-title">📂 Bugün — {fmtDate(today)}</div>
                <div className="fp-today-meta">
                  Oluşturuldu: {fmtDT(currentFolder.createdAt)} &nbsp;·&nbsp;
                  {currentFolder.updatedCount} güncelleme &nbsp;·&nbsp;
                  {currentFolder.snapshots.length} snapshot
                </div>
                <div className="fp-stats">
                  <span className="fp-stat fp-open">✓ {stats.open} Açık</span>
                  <span className="fp-stat fp-closed">✕ {stats.closed} Kapalı</span>
                  <span className="fp-stat fp-crit">⚠ {stats.critical} Kritik</span>
                </div>
                {currentFolder.snapshots.length > 0 && (
                  <div className="snap-list">
                    {currentFolder.snapshots.slice(0, 4).map(s => (
                      <div key={s.id} className="snap-item">
                        <div className="snap-time">{fmtDT(s.takenAt)} — <span className={`op-badge op-badge-${s.takenBy}`}>{s.takenBy}</span></div>
                        <div style={{ marginTop: 2 }}>{s.snapshotNote} &nbsp;·&nbsp; {s.appointmentCount} kayıt &nbsp; 🟢{s.open} 🔴{s.closed} ⚠️{s.critical}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Geçmiş */}
            {folderAcc && (
              <div className="folder-list">
                {folderIndex.filter(d => d !== today).length === 0 && (
                  <div style={{ color: "var(--gray)", fontSize: 11, padding: "8px 0" }}>Daha önceki gün kaydı yok. Her aktif günün klasörü burada görünür.</div>
                )}
                {folderIndex.filter(d => d !== today).map(date => {
                  const f = getDailyFolder(date); if (!f) return null;
                  return (
                    <div key={date} className={`folder-item${selFolder === date ? " selected" : ""}`}
                      onClick={() => setSelFolder(selFolder === date ? null : date)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "'IBM Plex Mono'", fontSize: 11, fontWeight: 600, color: "var(--teal)" }}>📁 {fmtDate(date)}</span>
                        <span style={{ fontSize: 10, color: "var(--gray)" }}>{f.updatedCount} güncelleme · {f.snapshots.length} snap</span>
                      </div>
                      {f.snapshots[0] && (
                        <div className="fp-stats" style={{ marginTop: 5 }}>
                          <span className="fp-stat fp-open">{f.snapshots[0].open} Açık</span>
                          <span className="fp-stat fp-closed">{f.snapshots[0].closed} Kapalı</span>
                          <span className="fp-stat fp-crit">{f.snapshots[0].critical} Kritik</span>
                        </div>
                      )}
                      {selFolder === date && f.snapshots.length > 0 && (
                        <div className="snap-list">
                          {f.snapshots.slice(0, 6).map(s => (
                            <div key={s.id} className="snap-item">
                              <div className="snap-time">{fmtDT(s.takenAt)} — {s.takenBy}</div>
                              <div style={{ marginTop: 2 }}>{s.snapshotNote} · 🟢{s.open} 🔴{s.closed}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Günlük Rapor Paneli ───────────────────────────────────────── */}
          <div className="report-panel">
            <div className="rp-title">📋 Günlük Rapor</div>
            <div className="report-actions" style={{ marginBottom: 9 }}>
              <button className="btn btn-primary" onClick={generateReport}>🤖 Otomatik Özet Oluştur</button>
            </div>
            <textarea className="report-textarea" value={reportText} onChange={e => setReportText(e.target.value)}
              placeholder={`📋 GÜNLÜK RANDEVU RAPORU — ${fmtDate(now())}\n\n"Otomatik Özet Oluştur" ile taslak oluştur veya buraya yaz…`} />
            <div className="report-actions">
              <button className="btn btn-ghost" onClick={copyReport}>📋 Kopyala</button>
              <button className="btn btn-green" onClick={saveReport}>💾 Kaydet</button>
            </div>
            <div className="divider" />
            <div className="acc-header" onClick={() => setRepAcc(v => !v)}>
              <span className="acc-label">📁 Geçmiş Raporlar ({reports.length})</span>
              <span style={{ color: "var(--gray)" }}>{repAcc ? "▲" : "▼"}</span>
            </div>
            {repAcc && (
              <div className="acc-body">
                {reports.length === 0 && <div style={{ color: "var(--gray)", fontSize: 11 }}>Henüz kaydedilmiş rapor yok.</div>}
                {reports.slice(0, 30).map(r => (
                  <div key={r.id} className="rh-item">
                    <div className="rh-meta">{fmtDate(r.date)} · <span className={`op-badge op-badge-${r.preparedBy}`}>{r.preparedBy}</span></div>
                    <div className="rh-text">{r.reportText}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ SIDEBAR ═══════════════════════════════════════════════════════ */}
        <div className="op-sidebar">
          <div className="sb-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>🕒 Son Aktiviteler</span>
            <button className="btn btn-ghost btn-sm" style={{ padding: "2px 6px", fontSize: 9 }} onClick={() => {
              if (window.confirm("Tüm aktiviteleri temizlemek istediğinize emin misiniz?")) {
                setActivity([]);
                saveLS("vizemo_activity_feed", []);
              }
            }}>Temizle</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", marginRight: -12, paddingRight: 12 }}>
            {activity.slice(0, 20).map(a => (
              <div key={a.id} className="feed-item">
                <div className={`avatar avatar-${a.by[0]}`}>{a.by[0]}</div>
                <div className="feed-body">
                  <div className="feed-name">{a.by}</div>
                  <div className="feed-detail">
                    <b style={{ color: "var(--white)" }}>{a.country}</b> — {a.visaType}
                    <br /><span className={`badge badge-${a.newStatus}`} style={{ fontSize: 9, padding: "1px 5px" }}>{a.newStatus}</span>
                    {a.note && <span style={{ marginLeft: 4, color: "var(--gray)" }}>{a.note.slice(0, 32)}</span>}
                  </div>
                  <div className="feed-time">{fmtDT(a.at)}</div>
                </div>
              </div>
            ))}
            {activity.length === 0 && <div style={{ color: "var(--gray)", fontSize: 11 }}>Henüz aktivite yok.</div>}
          </div>

          <div style={{ marginTop: "16px" }}>
            <div className="divider" />
            <div className="sb-title">📊 Bugün</div>
            {currentFolder ? (
              <div style={{ fontSize: 11, color: "var(--gray)", lineHeight: 1.85 }}>
                <div>Güncelleme: <b style={{ color: "var(--white)" }}>{currentFolder.updatedCount}</b></div>
                <div>Snapshot: <b style={{ color: "var(--white)" }}>{currentFolder.snapshots.length}</b></div>
                <div>Klasör tarihi: <b style={{ color: "var(--teal)" }}>{today}</b></div>
                <div>Toplam kayıt: <b style={{ color: "var(--white)" }}>{stats.total}</b></div>
              </div>
            ) : <div style={{ fontSize: 11, color: "var(--gray)" }}>—</div>}
          </div>
        </div>
      </div>

      {/* Ctx Menu */}
      {ctxMenu && (
        <div ref={ctxRef} style={{
          position: "fixed", left: ctxMenu.x, top: ctxMenu.y, zIndex: 150,
          background: "var(--navy2)", border: "1px solid var(--navy4)", borderRadius: 10,
          minWidth: 170, boxShadow: "0 8px 28px rgba(0,0,0,.5)", overflow: "hidden"
        }}>
          {[
            { icon: "✏️", label: "Düzenle", action: () => { setEditItem({ ...ctxMenu.item }); setCtxMenu(null); } },
            { icon: "🗑️", label: "Sil", action: () => { deleteItem(ctxMenu.item.id); setCtxMenu(null); } },
            { icon: "📜", label: "Geçmişi Gör", action: () => { setEditItem({ ...ctxMenu.item, viewHistory: true }); setCtxMenu(null); } },
            ...STATUSES.map(s => ({ icon: "⚡", label: `→ ${s}`, action: () => { saveUpdate({ ...ctxMenu.item, currentStatus: s }); setCtxMenu(null); } }))
          ].map((item, i) => (
            <div key={i} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 12, borderBottom: "1px solid var(--navy4)", color: "var(--gray2)", display: "flex", gap: 8, alignItems: "center" }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--navy3)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              onClick={item.action}>{item.icon} {item.label}</div>
          ))}
        </div>
      )}

      {editItem && <UpdateModal item={editItem} operator={operator} onSave={saveUpdate} onClose={() => setEditItem(null)} />}
      {showDrawer && (<><div className="drawer-overlay" onClick={() => { setShowDrawer(false); setAutoTransferData(null); }} /><AddCountryDrawer operator={operator} onAdd={addNew} defaultData={autoTransferData} onClose={() => { setShowDrawer(false); setAutoTransferData(null); }} /></>)}
      <Toast toasts={toasts} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function UpdateModal({ item, operator, onSave, onClose }: any) {
  const [form, setForm] = useState({
    currentStatus: item.currentStatus,
    earliestDate: item.earliestDate || "",
    waitingDays: item.waitingDays ?? "",
    quota: item.quota || "",
    note: item.note || "",
    alertLevel: item.alertLevel || "NORMAL",
  });

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>×</button>
        <div className="modal-title">{item.country} — {item.visaType}</div>
        <div className="modal-sub">🏛 {item.embassy}</div>

        {!item.viewHistory && (
          <>
            <div className="form-group">
              <label className="form-label">Randevu Durumu</label>
              <div className="status-group">
                {STATUSES.map(s => (
                  <button key={s} className={`status-btn s-${s}${form.currentStatus === s ? " active" : ""}`}
                    onClick={() => setForm(f => ({ ...f, currentStatus: s }))}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="form-group">
                <label className="form-label">En Erken Tarih</label>
                <input type="date" className="form-input" value={form.earliestDate}
                  onChange={e => setForm(f => ({ ...f, earliestDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Bekleme Süresi</label>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <input type="number" min={0} className="form-input" style={{ flex: 1 }} value={form.waitingDays}
                    onChange={e => setForm(f => ({ ...f, waitingDays: e.target.value }))} />
                  <span style={{ color: "var(--gray)", fontSize: 12, whiteSpace: "nowrap" }}>gün</span>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Kontenjan</label>
              <input type="text" className="form-input" placeholder="ör: Günlük 20 kişi" value={form.quota}
                onChange={e => setForm(f => ({ ...f, quota: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Not <span style={{ fontWeight: 400, color: "var(--gray)" }}>(maks. 300)</span></label>
              <textarea className="form-textarea" maxLength={300} value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              <div className="char-count">{form.note.length}/300</div>
            </div>
            <div className="form-group">
              <label className="form-label">Uyarı Seviyesi</label>
              <div style={{ display: "flex", gap: 8 }}>
                {ALERT_LEVELS.map(al => {
                  const clr = al === "NORMAL" ? "var(--green)" : al === "DİKKAT" ? "var(--yellow)" : "var(--red)";
                  const bg = al === "NORMAL" ? "var(--green-bg)" : al === "DİKKAT" ? "var(--yellow-bg)" : "var(--red-bg)";
                  const act = form.alertLevel === al;
                  return <button key={al} style={{
                    padding: "6px 12px", borderRadius: 7, cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: 700,
                    border: `2px solid ${act ? clr : "var(--navy4)"}`, background: act ? bg : "var(--navy3)", color: act ? clr : "var(--gray)"
                  }}
                    onClick={() => setForm(f => ({ ...f, alertLevel: al }))}>{al}</button>;
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: "var(--gray)" }}>Güncelleyen:</span>
              <span className={`op-badge op-badge-${operator}`}>{operator}</span>
            </div>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 11 }}
              onClick={() => onSave({ ...item, ...form, waitingDays: form.waitingDays === "" ? null : Number(form.waitingDays) })}>
              💾 Kaydet
            </button>
          </>
        )}

        <div className="divider" />
        <div className="sec-label">📜 Güncelleme Geçmişi</div>
        {(!item.history || item.history.length === 0)
          ? <div style={{ color: "var(--gray)", fontSize: 11 }}>Geçmiş kaydı yok.</div>
          : <div className="timeline">
            {item.history.map((h, i) => (
              <div key={i} className="tl-item">
                <div className="tl-meta">
                  <span className={`op-badge op-badge-${h.updatedBy}`} style={{ fontWeight: 700 }}>{h.updatedBy}</span>
                  &nbsp;·&nbsp;{fmtDT(h.updatedAt)}&nbsp;·&nbsp;
                  <span className={`badge badge-${h.status}`} style={{ fontSize: 9, padding: "1px 5px" }}>{h.status}</span>
                </div>
                {h.note && <div className="tl-note">{h.note}</div>}
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADD COUNTRY DRAWER
// ─────────────────────────────────────────────────────────────────────────────
function AddCountryDrawer({ operator, onAdd, defaultData, onClose }: any) {
  const [form, setForm] = useState({
    country: defaultData?.country || "",
    visaType: defaultData?.visaType || "Schengen Turist (C)",
    embassy: "",
    currentStatus: "AÇIK", alertLevel: "NORMAL",
    waitingDays: "", earliestDate: "", quota: "",
    note: defaultData?.note || ""
  });

  // Re-run embassy deduction if defaultData provided a country
  useEffect(() => {
    if (defaultData?.country) {
      const meta = SCHENGEN_MEMBERS.find(m => m.country === defaultData.country);
      if (meta && meta.embassy) setForm(p => ({ ...p, embassy: meta.embassy }));
    }
  }, [defaultData]);

  const handleCountry = val => {
    const meta = SCHENGEN_MEMBERS.find(m => m.country === val);
    setForm(f => ({ ...f, country: val, embassy: meta ? meta.embassy : f.embassy }));
  };
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const meta = SCHENGEN_MEMBERS.find(m => m.country === form.country);

  return (
    <div className="drawer">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--white)" }}>+ Yeni Takip Kaydı</div>
        <button className="modal-close" onClick={onClose}>×</button>
      </div>

      <div className="form-group">
        <label className="form-label">Ülke <span style={{ color: "var(--teal)", fontWeight: 400 }}>({SCHENGEN_MEMBERS.length} ülke tanımlı)</span></label>
        <input list="add-country-list" className="form-input" placeholder="Ülke adı yazın veya seçin…"
          value={form.country} onChange={e => handleCountry(e.target.value)} />
        <datalist id="add-country-list">
          {SCHENGEN_MEMBERS.map(m => <option key={m.country} value={m.country} />)}
        </datalist>
        {meta && (
          <div style={{ fontSize: 10, marginTop: 4, color: "var(--teal)" }}>
            <span className={`zone-chip ${meta.zone.startsWith("Schengen") ? "chip-s" : "chip-n"}`}>{meta.zone}</span>
            &nbsp; Başkent: {meta.capital}
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">Vize Türü</label>
        <select className="form-select2" value={form.visaType} onChange={e => s("visaType", e.target.value)}>
          {VISA_TYPES.map(v => <option key={v}>{v}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Büyükelçilik / Konsolosluk</label>
        <input type="text" className="form-input" placeholder="ör: VFS Global İstanbul"
          value={form.embassy} onChange={e => s("embassy", e.target.value)} />
        {meta && !form.embassy && <div style={{ fontSize: 10, color: "var(--gray)", marginTop: 3 }}>Öneri: {meta.embassy}</div>}
      </div>

      <div className="form-group">
        <label className="form-label">Başlangıç Durumu</label>
        <div className="status-group">
          {STATUSES.map(st => (
            <button key={st} className={`status-btn s-${st}${form.currentStatus === st ? " active" : ""}`}
              onClick={() => s("currentStatus", st)}>{st}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="form-group">
          <label className="form-label">Bekleme (gün)</label>
          <input type="number" className="form-input" value={form.waitingDays} onChange={e => s("waitingDays", e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">En Erken Tarih</label>
          <input type="date" className="form-input" value={form.earliestDate} onChange={e => s("earliestDate", e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Kontenjan</label>
        <input type="text" className="form-input" placeholder="ör: Günlük 20 kişi" value={form.quota} onChange={e => s("quota", e.target.value)} />
      </div>

      <div className="form-group">
        <label className="form-label">Uyarı Seviyesi</label>
        <select className="form-select2" value={form.alertLevel} onChange={e => s("alertLevel", e.target.value)}>
          {ALERT_LEVELS.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Not</label>
        <textarea className="form-textarea" value={form.note} maxLength={300} onChange={e => s("note", e.target.value)} />
      </div>

      <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: 11 }}
        onClick={() => {
          if (!form.country.trim()) { alert("Ülke adı zorunludur."); return; }
          const resolvedEmbassy = form.embassy || meta?.embassy || "";
          if (!resolvedEmbassy) { alert("Büyükelçilik bilgisi zorunludur."); return; }
          onAdd({
            ...form, embassy: resolvedEmbassy,
            waitingDays: form.waitingDays === "" ? null : Number(form.waitingDays),
            earliestDate: form.earliestDate || null
          });
        }}>
        ✅ Kaydet
      </button>
    </div>
  );
}
