-- 1. Upload Batches (Toplu Yükleme Klasörleri) Tablosu
CREATE TABLE IF NOT EXISTS upload_batches (
  id TEXT PRIMARY KEY,
  "fileName" TEXT NOT NULL,
  "uploadDate" TIMESTAMPTZ NOT NULL,
  headers JSONB NOT NULL,
  "colMap" JSONB NOT NULL,
  rows JSONB NOT NULL
);

-- 2. Customers (Müşteriler / Leadler) Tablosu
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  "firstName" TEXT,
  "lastName" TEXT,
  telefon TEXT,
  email TEXT,
  vize TEXT,
  durum TEXT,
  gorusme TEXT,
  takip TEXT,
  surec TEXT,
  karar TEXT,
  "not" TEXT,
  log JSONB,
  "createdAt" TIMESTAMPTZ,
  "updatedAt" TIMESTAMPTZ,
  "lastActivityDate" TIMESTAMPTZ,
  "assignedSdrId" TEXT,
  tasks JSONB,
  "stageHistory" JSONB,
  sehir TEXT,
  danisman TEXT,
  kaynak TEXT,
  statu TEXT,
  "evrakPct" TEXT,
  ulke TEXT,
  "durum_raw" TEXT,
  "pipelineType" TEXT,
  "callLogs" JSONB,
  "nextFollowupDate" TEXT
);

-- 3. Leodessa Leads Tablosu
CREATE TABLE IF NOT EXISTS leodessa_leads (
  id TEXT PRIMARY KEY,
  "firstName" TEXT,
  "lastName" TEXT,
  telefon TEXT,
  email TEXT,
  service TEXT,
  "serviceName" TEXT,
  "serviceIcon" TEXT,
  score NUMERIC,
  temperature TEXT,
  "isDisqualified" BOOLEAN,
  answers JSONB,
  notes JSONB,
  "textAnswers" JSONB,
  "summaryText" TEXT,
  "createdAt" TIMESTAMPTZ,
  status TEXT,
  "crmTransferred" BOOLEAN,
  "crmCustomerId" TEXT,
  "salesConsultant" TEXT,
  kaynak TEXT,
  sehir TEXT,
  "arayanDanisman" TEXT,
  "arananTarih" TEXT
);

-- 4. Revenue (Gelir) Tablosu
CREATE TABLE IF NOT EXISTS revenue (
  id TEXT PRIMARY KEY,
  "firstName" TEXT,
  "lastName" TEXT,
  service TEXT,
  amount NUMERIC,
  currency TEXT,
  date TEXT,
  consultant TEXT,
  source TEXT
);

-- İzinleri (RLS - Row Level Security) açıyoruz ki React uygulamamızdan direkt veri yazıp okuyabilelim.
ALTER TABLE upload_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE leodessa_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable full access for upload_batches" ON upload_batches FOR ALL USING (true);
CREATE POLICY "Enable full access for customers" ON customers FOR ALL USING (true);
CREATE POLICY "Enable full access for leodessa_leads" ON leodessa_leads FOR ALL USING (true);
CREATE POLICY "Enable full access for revenue" ON revenue FOR ALL USING (true);
