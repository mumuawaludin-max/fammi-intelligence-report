-- Umpan balik pegawai tentang pengalaman mengikuti Wellbeing Assessment (modul wa).
--
-- Pegawai mengisi survei singkat di laporan pribadinya: skala bintang 1-10, pilihan ganda, dan
-- paling banyak dua esai. Hasilnya tampil di dashboard Human Capital (tab "Dampak Asesmen")
-- dan diperbarui begitu ada isian baru. Permintaan pemilik produk 2026-10-19.
--
-- Bentuk jawaban (jsonb), ditentukan PERTANYAAN_UMPAN_BALIK di web/src/pages/wa/lib/waMeta.js:
--   { "nilai":   { "<kode>": 1..10, ... },
--     "pilihan": { "<kode>": "opsi" | ["opsi", ...], ... },
--     "esai":    { "<kode>": "teks", ... },
--     "lainnya": { "<kode>": "teks opsi Lainnya", ... } }
--
-- Aturan akses:
--   - Pegawai menulis, membaca, dan mengubah HANYA baris miliknya (wa_individu_id akunnya).
--   - Human Capital TIDAK membaca baris per orang. Ia membaca rekap lewat fungsi
--     wa_umpan_balik_ringkasan(), tanpa identitas, dan rekap baru terbuka setelah minimal tiga
--     pegawai mengisi supaya isian tidak bisa ditebak pemiliknya.
--   - Admin Fammi membaca semua baris.
-- Rekap dihitung di Postgres, bukan di React (FIR tidak menghitung di sisi tampilan).
--
-- Aman dijalankan ulang.

create table if not exists public.wa_umpan_balik (
  dataset_id text not null references public.wa_dataset(id) on delete cascade,
  individu_id text not null,
  sekolah_id text not null,
  jawaban jsonb not null check (jsonb_typeof(jawaban) = 'object' and pg_column_size(jawaban) < 16000),
  dikirim_pada timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now(),
  primary key (dataset_id, individu_id)
);
create index if not exists wa_umpan_balik_dataset_idx on public.wa_umpan_balik (dataset_id, diperbarui_pada desc);

-- Waktu kirim pertama tidak berubah saat pegawai mengubah jawabannya; waktu ubah selalu dari server.
create or replace function public.wa_umpan_balik_waktu()
returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    new.dikirim_pada := old.dikirim_pada;
  else
    new.dikirim_pada := now();
  end if;
  new.diperbarui_pada := now();
  return new;
end $$;

drop trigger if exists wa_umpan_balik_waktu on public.wa_umpan_balik;
create trigger wa_umpan_balik_waktu before insert or update on public.wa_umpan_balik
for each row execute function public.wa_umpan_balik_waktu();

alter table public.wa_umpan_balik enable row level security;

-- Baris milik akun Pegawai ini, di dataset sekolahnya yang memang memuat isiannya.
drop policy if exists wa_umpan_balik_baca on public.wa_umpan_balik;
create policy wa_umpan_balik_baca on public.wa_umpan_balik
for select to authenticated
using (
  (select public.my_peran()) = 'Pegawai'
  and individu_id = (select public.my_wa_individu_id())
  and sekolah_id = (select public.my_school_id())
);

drop policy if exists wa_umpan_balik_isi on public.wa_umpan_balik;
create policy wa_umpan_balik_isi on public.wa_umpan_balik
for insert to authenticated
with check (
  (select public.my_peran()) = 'Pegawai'
  and individu_id = (select public.my_wa_individu_id())
  and sekolah_id = (select public.my_school_id())
  and exists (
    select 1 from public.wa_individu i
    where i.dataset_id = wa_umpan_balik.dataset_id and i.individu_id = wa_umpan_balik.individu_id
      and i.sekolah_id = wa_umpan_balik.sekolah_id
  )
);

drop policy if exists wa_umpan_balik_ubah on public.wa_umpan_balik;
create policy wa_umpan_balik_ubah on public.wa_umpan_balik
for update to authenticated
using (
  (select public.my_peran()) = 'Pegawai'
  and individu_id = (select public.my_wa_individu_id())
  and sekolah_id = (select public.my_school_id())
)
with check (
  (select public.my_peran()) = 'Pegawai'
  and individu_id = (select public.my_wa_individu_id())
  and sekolah_id = (select public.my_school_id())
);

drop policy if exists wa_umpan_balik_admin_baca on public.wa_umpan_balik;
create policy wa_umpan_balik_admin_baca on public.wa_umpan_balik
for select to authenticated using (public.is_admin_fammi());

revoke all on public.wa_umpan_balik from anon, authenticated;
grant select on public.wa_umpan_balik to authenticated;
grant insert (dataset_id, individu_id, sekolah_id, jawaban) on public.wa_umpan_balik to authenticated;
grant update (jawaban) on public.wa_umpan_balik to authenticated;

-- ── Rekap untuk Human Capital ─────────────────────────────────────────────────────────────
-- Keluaran: { n, peserta, terakhir, ambang, terbuka,
--             nilai:   { kode: { rata, n, sebaran: [jumlah nilai 1..10] } },
--             pilihan: { kode: { n, opsi: { "teks opsi": jumlah } } },
--             esai:    { kode: [ { teks, pada } ] },
--             lainnya: { kode: [ { teks, pada } ] } }   (tanpa identitas, terbaru di atas)
create or replace function public.wa_umpan_balik_ringkasan(p_dataset_id text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_sekolah text;
  v_n int;
  v_ambang constant int := 3;
  v_hasil jsonb;
begin
  select sekolah_id into v_sekolah from wa_dataset where id = p_dataset_id;
  if v_sekolah is null then
    return null;
  end if;
  if not (is_admin_fammi() or (my_peran() = 'HumanCapital' and my_school_id() = v_sekolah)) then
    raise exception 'Tidak berhak membaca rekap umpan balik.' using errcode = '42501';
  end if;

  select count(*) into v_n from wa_umpan_balik where dataset_id = p_dataset_id;
  v_hasil := jsonb_build_object(
    'n', v_n,
    'peserta', (select count(*) from wa_individu where dataset_id = p_dataset_id),
    'terakhir', (select max(diperbarui_pada) from wa_umpan_balik where dataset_id = p_dataset_id),
    'ambang', v_ambang,
    'terbuka', v_n >= v_ambang
  );
  if v_n < v_ambang then
    return v_hasil;
  end if;

  return v_hasil || jsonb_build_object(
    'nilai', coalesce((
      with r as (
        select k.key as kode, (k.value #>> '{}')::numeric as v
        from wa_umpan_balik u, jsonb_each(coalesce(u.jawaban -> 'nilai', '{}'::jsonb)) k
        where u.dataset_id = p_dataset_id and jsonb_typeof(k.value) = 'number'
          and (k.value #>> '{}')::numeric between 1 and 10
      )
      select jsonb_object_agg(kode, isi) from (
        select r1.kode, jsonb_build_object(
          'rata', round(avg(r1.v), 2),
          'n', count(*),
          'sebaran', (
            select jsonb_agg((select count(*) from r r2 where r2.kode = r1.kode and round(r2.v) = g) order by g)
            from generate_series(1, 10) g
          )
        ) as isi
        from r r1 group by r1.kode
      ) s
    ), '{}'::jsonb),
    'pilihan', coalesce((
      with p as (
        select k.key as kode, u.individu_id, o.opsi
        from wa_umpan_balik u,
          jsonb_each(coalesce(u.jawaban -> 'pilihan', '{}'::jsonb)) k,
          jsonb_array_elements_text(case when jsonb_typeof(k.value) = 'array' then k.value else jsonb_build_array(k.value) end) o(opsi)
        where u.dataset_id = p_dataset_id and length(trim(o.opsi)) > 0
      ),
      per_opsi as (select kode, opsi, count(*) as jumlah from p group by kode, opsi),
      per_kode as (
        select o.kode, jsonb_build_object(
          'n', (select count(distinct p.individu_id) from p where p.kode = o.kode),
          'opsi', jsonb_object_agg(o.opsi, o.jumlah)
        ) as isi
        from per_opsi o group by o.kode
      )
      select jsonb_object_agg(kode, isi) from per_kode
    ), '{}'::jsonb),
    'esai', coalesce((
      select jsonb_object_agg(kode, daftar) from (
        select k.key as kode,
          jsonb_agg(jsonb_build_object('teks', left(trim(k.value #>> '{}'), 1500), 'pada', u.diperbarui_pada) order by u.diperbarui_pada desc) as daftar
        from wa_umpan_balik u, jsonb_each(coalesce(u.jawaban -> 'esai', '{}'::jsonb)) k
        where u.dataset_id = p_dataset_id and jsonb_typeof(k.value) = 'string' and length(trim(k.value #>> '{}')) > 0
        group by k.key
      ) e
    ), '{}'::jsonb),
    -- Isian bebas opsi "Lainnya" di pertanyaan pilihan, tanpa identitas, terbaru di atas.
    'lainnya', coalesce((
      select jsonb_object_agg(kode, daftar) from (
        select k.key as kode,
          jsonb_agg(jsonb_build_object('teks', left(trim(k.value #>> '{}'), 300), 'pada', u.diperbarui_pada) order by u.diperbarui_pada desc) as daftar
        from wa_umpan_balik u, jsonb_each(coalesce(u.jawaban -> 'lainnya', '{}'::jsonb)) k
        where u.dataset_id = p_dataset_id and jsonb_typeof(k.value) = 'string' and length(trim(k.value #>> '{}')) > 0
        group by k.key
      ) l
    ), '{}'::jsonb)
  );
end $$;

revoke all on function public.wa_umpan_balik_ringkasan(text) from public, anon;
grant execute on function public.wa_umpan_balik_ringkasan(text) to authenticated;
