-- Laporan individu School Culture per staf (mirrors mi_hasil): hasil generate Gemini satu
-- responden (sc_personal_id) per baris, menunggu persetujuan sebelum tayang ke staf itu
-- sendiri (peran Karyawan). Lihat supabase/functions/generate-sc-individu/index.ts.

create table if not exists public.sc_hasil (
  id uuid primary key default gen_random_uuid(),
  sekolah_id text not null references public.schools(id),
  sc_personal_id uuid not null references public.sc_personal(id),
  periode_id text not null,
  -- Struktur penuh LaporanIndividuSC (header/bagian_budaya/bagian_kesejahteraan/
  -- bagian_profil_organisasi/bagian_refleksi/rencana_aksi/footer) -- lihat sc.types.ts.
  detail jsonb not null,
  status text not null default 'menunggu_persetujuan'
    check (status in ('menunggu_persetujuan', 'disetujui', 'ditolak')),
  generated_at timestamptz not null default now()
);

create index if not exists sc_hasil_sekolah_periode_idx on public.sc_hasil (sekolah_id, periode_id);
-- Idempotensi generate ulang: cari draf 'menunggu_persetujuan' untuk (personal, periode) yang
-- sama secara cepat -- pola sama dengan pencarian mi_hasil di generate-mi/index.ts.
create index if not exists sc_hasil_personal_status_idx on public.sc_hasil (sc_personal_id, periode_id, status);

alter table public.sc_hasil enable row level security;

-- profiles.sc_responden_id: padanan murid_id, menautkan akun Karyawan (dibuat otomatis saat
-- admin approve, lihat ensureKaryawanScAccount di admin-actions/index.ts) ke baris sc_personal
-- miliknya sendiri.
alter table public.profiles add column if not exists sc_responden_id uuid references public.sc_personal(id);

create or replace function public.my_sc_responden_id()
returns uuid
language sql
stable
security definer
as $$
  select sc_responden_id from public.profiles where id = auth.uid()
$$;

-- Baca: pimpinan sekolah boleh lihat SEMUA baris disetujui sekolahnya (drill-down per staf,
-- padanan tab Laporan Individu CW); staf sendiri (Karyawan) HANYA baris miliknya sendiri.
-- status='disetujui' ditegakkan di RLS langsung (bukan cuma di query React) -- lapis
-- pertahanan kedua di luar CMS Admin (yang membaca 'menunggu_persetujuan' lewat service_role,
-- melewati RLS ini sepenuhnya).
drop policy if exists sc_hasil_baca on public.sc_hasil;
create policy sc_hasil_baca on public.sc_hasil
for select to authenticated
using (
  status = 'disetujui'
  and sekolah_id = my_school_id()
  and (
    my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Yayasan')
    or (my_peran() = 'Karyawan' and sc_personal_id = my_sc_responden_id())
  )
);
