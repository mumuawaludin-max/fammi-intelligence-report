-- sc_komitmen: persistence untuk "Komitmen 30 hari" di Laporan Individu School Culture
-- (redesign mobile-only, lihat CLAUDE_CODE_HANDOFF_INDIVIDUAL.md). Sebelum tabel ini, TIDAK ADA
-- satu pun jalur tulis Supabase dari peran non-admin di seluruh FIR -- fitur ini genuinely baru,
-- bukan perluasan pola yang sudah ada. Satu baris aktif per (sc_personal_id, periode_id): staf
-- memilih satu rencana_aksi, menyesuaikan komposer, lalu menyimpan draft atau mengunci komitmen.
--
-- Judul aksi didenormalisasi (aksi_judul) supaya kalau laporan digenerate ulang dan urutan/isi
-- rencana_aksi berubah, komitmen yang sudah tersimpan tetap menampilkan teks aksi yang dipilih
-- staf saat itu, bukan berubah diam-diam mengikuti draf baru.

create table if not exists public.sc_komitmen (
  id uuid primary key default gen_random_uuid(),
  sc_personal_id uuid not null references public.sc_personal(id) on delete cascade,
  periode_id text not null,
  aksi_id text not null,
  aksi_judul text not null,
  langkah_pertama text not null default '',
  frekuensi text not null default '',
  bukti_kemajuan text not null default '',
  dukungan text not null default '',
  status text not null default 'draft' check (status in ('draft', 'committed')),
  committed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sc_personal_id, periode_id)
);

create index if not exists sc_komitmen_personal_periode_idx on public.sc_komitmen (sc_personal_id, periode_id);

alter table public.sc_komitmen enable row level security;

-- Pemilik saja: baca dan tulis dibatasi ke baris milik akun Karyawan yang sedang login sendiri
-- (my_sc_responden_id(), fungsi sudah ada sejak migration sc_hasil_and_karyawan_account). Pimpinan
-- TIDAK diberi akses lewat RLS ini sama sekali -- drill-down pimpinan ke laporan staf (
-- ScRespondenListPage.jsx) merender komponen yang sama tapi komposer komitmen disembunyikan di
-- level UI (prop viewerIsOwner) sebagai lapis kedua, RLS ini lapis pertama yang sebenarnya.
drop policy if exists sc_komitmen_rw on public.sc_komitmen;
create policy sc_komitmen_rw on public.sc_komitmen
for all to authenticated
using (sc_personal_id = my_sc_responden_id())
with check (sc_personal_id = my_sc_responden_id());
