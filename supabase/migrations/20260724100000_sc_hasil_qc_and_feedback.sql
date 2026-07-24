-- Fase C School Culture (lihat plan polished-booping-willow.md): review queue individu butuh
-- (1) QC otomatis ringan pasca-generate supaya reviewer tahu draf mana yang perlu perhatian
-- ekstra, dan (2) catatan reviewer yang tersimpan permanen sebelum regenerate -- padanan
-- gemini_feedback yang sudah dipakai Karakter/SC agregat, tapi tabel sendiri karena
-- gemini_feedback ditulis lewat generate-tindak-lanjut (scope='sekolah', bukan scope per staf)
-- dan kolomnya (tindak_lanjut_id) tidak relevan untuk sc_hasil yang tidak lewat tabel itu.

alter table public.sc_hasil add column if not exists qc_flags jsonb;

create table if not exists public.sc_feedback (
  id uuid primary key default gen_random_uuid(),
  sekolah_id text not null references public.schools(id),
  sc_personal_id uuid not null references public.sc_personal(id),
  catatan text not null,
  created_at timestamptz not null default now()
);

create index if not exists sc_feedback_personal_idx on public.sc_feedback (sc_personal_id, created_at desc);

-- Ditulis/dibaca cuma lewat service_role (generate-sc-individu, admin-actions) -- pola sama
-- gemini_feedback, RLS aktif tanpa policy browser supaya anon/authenticated tidak bisa
-- membaca/menulis langsung.
alter table public.sc_feedback enable row level security;
