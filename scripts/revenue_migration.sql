-- Mevcut revenue tablosunu doğru şemaya göre güncelle
-- Supabase SQL Editor'da çalıştırın

ALTER TABLE revenue
  ADD COLUMN IF NOT EXISTS "danisman" text,
  ADD COLUMN IF NOT EXISTS "sehir" text,
  ADD COLUMN IF NOT EXISTS "odemeYontemi" text DEFAULT '💵 Elden',
  ADD COLUMN IF NOT EXISTS "onOdemeTarihi" text,
  ADD COLUMN IF NOT EXISTS "onOdeme" numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "kalanTarih" text DEFAULT '-',
  ADD COLUMN IF NOT EXISTS "kalanOdeme" numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "toplam" numeric DEFAULT 0;

-- Eski sütunlar kalsın zararsız olarak

SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'revenue' ORDER BY ordinal_position;
