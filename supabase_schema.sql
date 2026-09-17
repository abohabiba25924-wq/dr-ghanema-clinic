-- =====================================================================
-- نظام عيادة د. محمود غنيمة للروماتيزم والمناعة
-- كود إنشاء جداول المزامنة السحابية الفورية (Supabase SQL Schema)
-- ضع هذا الكود في: Supabase Dashboard -> SQL Editor -> New Query -> RUN
-- =====================================================================

-- 1. جدول المرضى
create table if not exists public.clinic_patients (
  id text primary key,
  code text not null,
  name text not null,
  age text,
  phone text,
  sex text default 'female',
  address text,
  diagnosis text,
  obs_gyn text,
  history_complaint text,
  family_history text,
  surgical_history text,
  current_meds text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. جدول الزيارات والكشوفات والشيتات
create table if not exists public.clinic_visits (
  id text primary key,
  patient_id text references public.clinic_patients(id) on delete cascade,
  date text not null,
  vitals jsonb default '{}'::jsonb,
  history text,
  exam text,
  diagnosis text,
  ttt text,
  plan text,
  joints jsonb default '{"tender":[],"swollen":[],"both":[]}'::jsonb,
  labs jsonb default '{}'::jsonb,
  sheet_images jsonb default '[]'::jsonb,
  ai_processed boolean default false,
  raw_ai_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. جدول الإعدادات ومفتاح الذكاء الاصطناعي
create table if not exists public.clinic_settings (
  key text primary key,
  value jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. إتاحة الصلاحيات للربط المباشر (Row Level Security / Full Access)
alter table public.clinic_patients enable row level security;
alter table public.clinic_visits enable row level security;
alter table public.clinic_settings enable row level security;

create policy "Public Access clinic_patients" on public.clinic_patients for all using (true) with check (true);
create policy "Public Access clinic_visits" on public.clinic_visits for all using (true) with check (true);
create policy "Public Access clinic_settings" on public.clinic_settings for all using (true) with check (true);

-- 5. تفعيل المزامنة اللحظية الحية (Realtime Replication)
alter publication supabase_realtime add table public.clinic_patients;
alter publication supabase_realtime add table public.clinic_visits;
alter publication supabase_realtime add table public.clinic_settings;
