-- Akses demo di halaman masuk Fammi Intelligence Report (2026-11-11).
--
-- Pengunjung tanpa akun bisa menjelajahi contoh laporan lima Intelligence System di panel kiri
-- halaman masuk setelah memasukkan kode demo resmi dari tim Fammi. Permintaan pemilik produk.
--
-- Yang dijaga di sini, bukan di React:
--   - Kode diperiksa di server. React tidak pernah memegang daftar kode, dan kode mentah tidak
--     disimpan di mana pun: tabel hanya menyimpan HMAC-SHA256 dari kode yang sudah dinormalkan.
--     Kode mentah tampil SEKALI, di keluaran demo_code_create.
--   - Kode demo bukan akun. Ia tidak membuat sesi Supabase Auth, dan fungsi di bawah hanya
--     menyentuh tabel demo_*. Tidak ada satu baris pun data sekolah atau siswa yang terjangkau.
--   - Sesi demo berumur terbatas dan diperiksa ulang di server setiap kali dipakai. Kode yang
--     dicabut atau kedaluwarsa ikut mematikan sesi yang sedang berjalan.
--   - Percobaan gagal dibatasi per alamat IP (disimpan sebagai HMAC, bukan IP mentah) dan secara
--     global, supaya kode tidak bisa ditebak beruntun.
--
-- Tabel:
--   demo_secret           satu baris kunci acak untuk HMAC, tidak terbaca dari API
--   demo_access_codes     kode demo
--   demo_access_sessions  sesi demo, hanya hash token yang disimpan
--   demo_verify_attempts  catatan percobaan untuk pembatasan laju, disimpan dua hari
--   demo_reports          laporan HTML contoh yang disimpan di server, opsional, satu per sistem
--
-- Fungsi untuk browser (anon): demo_verify, demo_session, demo_logout, demo_report_html.
-- Fungsi pengelola (Admin Fammi lewat API, atau SQL Editor): demo_code_create, demo_code_revoke,
-- demo_code_list, demo_report_upsert. Cara pakai di docs/demo-access.md.
--
-- Aman dijalankan ulang. Uji lokal: supabase/tests/demo_access_verify.sql.

create extension if not exists pgcrypto with schema extensions;

-- ── Daftar sistem ─────────────────────────────────────────────────────────────────────────────
-- Sama persis dengan DEMO_SYSTEMS di web/src/pages/demo/demoSystems.js. Ubah keduanya bersama.
create or replace function public.demo_semua_sistem()
returns text[] language sql immutable set search_path = '' as $$
  select array['education-character', 'safety-crisis', 'talent-life-design', 'teacher-growth', 'finance-planning']::text[]
$$;

-- ── Kunci rahasia HMAC ────────────────────────────────────────────────────────────────────────
-- Dibuat sekali. Kalau baris ini diganti, seluruh kode dan sesi demo yang ada ikut tidak berlaku.
create table if not exists public.demo_secret (
  id boolean primary key default true check (id),
  pepper bytea not null check (octet_length(pepper) >= 32)
);
insert into public.demo_secret (id, pepper)
select true, extensions.gen_random_bytes(32)
where not exists (select 1 from public.demo_secret);

-- ── Tabel ─────────────────────────────────────────────────────────────────────────────────────
create table if not exists public.demo_access_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  code_label text not null check (length(trim(code_label)) between 1 and 120),
  description text check (description is null or length(description) <= 500),
  -- 'revoked' ditulis pengelola. 'expired' dan 'exhausted' hanya cermin untuk dibaca manusia;
  -- keadaan sebenarnya selalu dihitung ulang dari expires_at, max_uses, dan usage_count.
  status text not null default 'active' check (status in ('active', 'expired', 'revoked', 'exhausted')),
  available_systems text[] not null default public.demo_semua_sistem()
    check (cardinality(available_systems) > 0 and available_systems <@ public.demo_semua_sistem()),
  session_minutes int not null default 180 check (session_minutes between 5 and 1440),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  max_uses int check (max_uses is null or max_uses > 0),
  usage_count int not null default 0 check (usage_count >= 0),
  last_used_at timestamptz,
  created_by uuid
);

create table if not exists public.demo_access_sessions (
  id uuid primary key default gen_random_uuid(),
  demo_access_code_id uuid not null references public.demo_access_codes(id) on delete cascade,
  session_token_hash text not null unique check (session_token_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'active' check (status in ('active', 'ended', 'revoked', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_accessed_at timestamptz not null default now(),
  ended_at timestamptz,
  client_key text
);
create index if not exists demo_access_sessions_kode_idx on public.demo_access_sessions (demo_access_code_id, status);

create table if not exists public.demo_verify_attempts (
  id bigint generated always as identity primary key,
  client_key text not null,
  success boolean not null,
  outcome text not null,
  attempted_at timestamptz not null default now()
);
create index if not exists demo_verify_attempts_klien_idx on public.demo_verify_attempts (client_key, attempted_at desc);
create index if not exists demo_verify_attempts_waktu_idx on public.demo_verify_attempts (attempted_at);

create table if not exists public.demo_reports (
  system_id text primary key check (system_id = any (public.demo_semua_sistem())),
  title text not null check (length(trim(title)) between 1 and 160),
  html text not null check (length(html) between 1 and 8000000),
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

-- ── Akses tabel ───────────────────────────────────────────────────────────────────────────────
-- Tidak ada baca atau tulis langsung dari API. Semua lewat fungsi di bawah. Admin Fammi hanya
-- boleh MEMBACA kolom yang tidak rahasia (tanpa code_hash, session_token_hash, html, pepper).
alter table public.demo_secret enable row level security;
alter table public.demo_access_codes enable row level security;
alter table public.demo_access_sessions enable row level security;
alter table public.demo_verify_attempts enable row level security;
alter table public.demo_reports enable row level security;

revoke all on public.demo_secret, public.demo_access_codes, public.demo_access_sessions,
  public.demo_verify_attempts, public.demo_reports from anon, authenticated;

drop policy if exists demo_access_codes_admin_baca on public.demo_access_codes;
create policy demo_access_codes_admin_baca on public.demo_access_codes
for select to authenticated using ((select public.is_admin_fammi()));
grant select (id, code_label, description, status, available_systems, session_minutes, created_at,
  expires_at, revoked_at, max_uses, usage_count, last_used_at, created_by)
  on public.demo_access_codes to authenticated;

drop policy if exists demo_access_sessions_admin_baca on public.demo_access_sessions;
create policy demo_access_sessions_admin_baca on public.demo_access_sessions
for select to authenticated using ((select public.is_admin_fammi()));
grant select (id, demo_access_code_id, status, created_at, expires_at, last_accessed_at, ended_at)
  on public.demo_access_sessions to authenticated;

drop policy if exists demo_reports_admin_baca on public.demo_reports;
create policy demo_reports_admin_baca on public.demo_reports
for select to authenticated using ((select public.is_admin_fammi()));
grant select (system_id, title, enabled, updated_at, updated_by) on public.demo_reports to authenticated;

-- ── Pembantu internal ─────────────────────────────────────────────────────────────────────────

-- "abcd efgh-jkmn" dan "ABCDEFGHJKMN" adalah kode yang sama. Hanya huruf dan angka yang dihitung.
create or replace function public.demo_normalisasi_kode(p_kode text)
returns text language sql immutable set search_path = '' as $$
  select regexp_replace(upper(coalesce(p_kode, '')), '[^A-Z0-9]', '', 'g')
$$;

create or replace function public.demo_hmac(p_nilai text)
returns text language sql stable security definer set search_path = '' as $$
  select encode(extensions.hmac(convert_to(p_nilai, 'UTF8'), s.pepper, 'sha256'), 'hex')
  from public.demo_secret s
$$;

-- Kunci pembatas laju per pengunjung. Header cf-connecting-ip ditulis ulang Cloudflare dan tidak
-- bisa dipalsukan browser, jadi didahulukan. Batas global di demo_verify tetap menahan penebak
-- yang memalsukan x-forwarded-for.
create or replace function public.demo_client_key()
returns text language plpgsql stable security definer set search_path = '' as $$
declare
  v_header jsonb;
  v_ip text;
begin
  begin
    v_header := nullif(current_setting('request.headers', true), '')::jsonb;
  exception when others then
    v_header := null;
  end;
  v_ip := coalesce(
    nullif(trim(v_header ->> 'cf-connecting-ip'), ''),
    nullif(trim(v_header ->> 'x-real-ip'), ''),
    nullif(trim(split_part(coalesce(v_header ->> 'x-forwarded-for', ''), ',', 1)), ''),
    'tanpa-ip'
  );
  return public.demo_hmac('ip:' || v_ip);
end $$;

-- Keadaan kode yang sebenarnya, dihitung dari isinya, bukan dari kolom status saja.
create or replace function public.demo_status_kode(p_kode public.demo_access_codes)
returns text language sql stable set search_path = '' as $$
  select case
    when p_kode.status = 'revoked' or p_kode.revoked_at is not null then 'revoked'
    when p_kode.expires_at is not null and p_kode.expires_at <= now() then 'expired'
    when p_kode.max_uses is not null and p_kode.usage_count >= p_kode.max_uses then 'exhausted'
    else 'active'
  end
$$;

-- Sistem yang punya laporan HTML aktif di server, dibatasi ke sistem yang dibuka kode ini.
create or replace function public.demo_html_tersedia(p_sistem text[])
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(r.system_id order by r.system_id), '[]'::jsonb)
  from public.demo_reports r
  where r.enabled and r.system_id = any (p_sistem)
$$;

-- 12 simbol dari 31 huruf dan angka yang tidak mirip satu sama lain (tanpa 0/O dan 1/I/L),
-- sekitar 59 bit. Byte acak di atas 247 dibuang supaya tiap simbol berpeluang sama.
create or replace function public.demo_buat_kode()
returns text language plpgsql volatile set search_path = '' as $$
declare
  v_abjad constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_hasil text := '';
  v_acak bytea;
  v_byte int;
begin
  while length(v_hasil) < 12 loop
    v_acak := extensions.gen_random_bytes(32);
    for i in 0..31 loop
      v_byte := get_byte(v_acak, i);
      if v_byte < 248 then
        v_hasil := v_hasil || substr(v_abjad, (v_byte % 31) + 1, 1);
        exit when length(v_hasil) = 12;
      end if;
    end loop;
  end loop;
  return substr(v_hasil, 1, 4) || '-' || substr(v_hasil, 5, 4) || '-' || substr(v_hasil, 9, 4);
end $$;

-- Pengelola kode: koneksi langsung ke database (SQL Editor) dipegang pemilik database. Lewat
-- API, hanya service_role dan Admin Fammi.
create or replace function public.demo_boleh_kelola()
returns boolean language plpgsql stable security definer set search_path = '' as $$
begin
  if session_user::text <> 'authenticator' then
    return true;
  end if;
  return coalesce(auth.role(), '') = 'service_role' or coalesce(public.is_admin_fammi(), false);
end $$;

create or replace function public.demo_pesan(p_status text)
returns text language sql immutable set search_path = '' as $$
  select case p_status
    when 'valid' then 'Demo access granted'
    when 'invalid' then 'Kode demo tidak valid. Periksa kembali kode yang Anda masukkan.'
    when 'expired' then 'Masa berlaku kode demo telah berakhir.'
    when 'revoked' then 'Kode demo ini sudah tidak dapat digunakan.'
    when 'exhausted' then 'Kode demo ini sudah mencapai batas penggunaan.'
    when 'rate_limited' then 'Terlalu banyak percobaan. Silakan coba lagi dalam beberapa menit.'
    else 'Terjadi kendala saat memverifikasi kode. Silakan coba kembali.'
  end
$$;

-- ── Fungsi untuk browser ──────────────────────────────────────────────────────────────────────

-- Periksa kode, buat sesi. Keluaran:
--   berhasil: { success: true, status: 'valid', message, session: { token, expiresAt },
--               availableSystems: [...], htmlReports: [...] }
--   gagal:    { success: false, status: invalid|expired|revoked|exhausted|rate_limited, message }
-- Token mentah hanya ada di keluaran ini; tabel menyimpan HMAC-nya.
create or replace function public.demo_verify(p_code text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_klien text := public.demo_client_key();
  v_kode text;
  v_baris public.demo_access_codes%rowtype;
  v_status text;
  v_token text;
  v_akhir timestamptz;
  v_batas_klien constant int := 10;   -- gagal per pengunjung per 15 menit
  v_batas_global constant int := 300; -- gagal seluruh pengunjung per 10 menit
begin
  delete from public.demo_verify_attempts where attempted_at < now() - interval '2 days';

  if (select count(*) from public.demo_verify_attempts
      where client_key = v_klien and not success and attempted_at > now() - interval '15 minutes') >= v_batas_klien
     or (select count(*) from public.demo_verify_attempts
      where not success and attempted_at > now() - interval '10 minutes') >= v_batas_global then
    return jsonb_build_object('success', false, 'status', 'rate_limited', 'message', public.demo_pesan('rate_limited'));
  end if;

  v_kode := case when length(coalesce(p_code, '')) <= 200 then public.demo_normalisasi_kode(p_code) else '' end;
  if length(v_kode) not between 8 and 32 then
    insert into public.demo_verify_attempts (client_key, success, outcome) values (v_klien, false, 'invalid');
    return jsonb_build_object('success', false, 'status', 'invalid', 'message', public.demo_pesan('invalid'));
  end if;

  select * into v_baris from public.demo_access_codes
  where code_hash = public.demo_hmac('kode:' || v_kode)
  for update;

  if not found then
    insert into public.demo_verify_attempts (client_key, success, outcome) values (v_klien, false, 'invalid');
    return jsonb_build_object('success', false, 'status', 'invalid', 'message', public.demo_pesan('invalid'));
  end if;

  v_status := public.demo_status_kode(v_baris);
  if v_status <> 'active' then
    if v_baris.status <> v_status and v_baris.status <> 'revoked' then
      update public.demo_access_codes set status = v_status where id = v_baris.id;
    end if;
    insert into public.demo_verify_attempts (client_key, success, outcome) values (v_klien, false, v_status);
    return jsonb_build_object('success', false, 'status', v_status, 'message', public.demo_pesan(v_status));
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');
  v_akhir := least(now() + make_interval(mins => v_baris.session_minutes),
                   coalesce(v_baris.expires_at, 'infinity'::timestamptz));

  insert into public.demo_access_sessions (demo_access_code_id, session_token_hash, expires_at, client_key)
  values (v_baris.id, public.demo_hmac('sesi:' || v_token), v_akhir, v_klien);

  update public.demo_access_codes
  set usage_count = usage_count + 1,
      last_used_at = now(),
      status = case when max_uses is not null and usage_count + 1 >= max_uses then 'exhausted' else 'active' end
  where id = v_baris.id;

  insert into public.demo_verify_attempts (client_key, success, outcome) values (v_klien, true, 'valid');

  return jsonb_build_object(
    'success', true,
    'status', 'valid',
    'message', public.demo_pesan('valid'),
    'session', jsonb_build_object('token', v_token, 'expiresAt', v_akhir),
    'availableSystems', to_jsonb(v_baris.available_systems),
    'htmlReports', public.demo_html_tersedia(v_baris.available_systems)
  );
end $$;

-- Periksa sesi. Keluaran:
--   { valid: true, status: 'active', expiresAt, availableSystems, htmlReports }
--   { valid: false, status: invalid|expired|revoked|ended }
-- Sesi mati kalau umurnya habis, kode induknya dicabut, atau kode induknya kedaluwarsa. Kode yang
-- habis jatah pakainya TIDAK mematikan sesi yang sudah berjalan; jatah itu untuk sesi baru.
create or replace function public.demo_session(p_token text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_sesi public.demo_access_sessions%rowtype;
  v_kode public.demo_access_codes%rowtype;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    return jsonb_build_object('valid', false, 'status', 'invalid');
  end if;

  select * into v_sesi from public.demo_access_sessions
  where session_token_hash = public.demo_hmac('sesi:' || p_token);
  if not found then
    return jsonb_build_object('valid', false, 'status', 'invalid');
  end if;

  if v_sesi.status <> 'active' then
    return jsonb_build_object('valid', false, 'status', v_sesi.status);
  end if;

  select * into v_kode from public.demo_access_codes where id = v_sesi.demo_access_code_id;

  if public.demo_status_kode(v_kode) = 'revoked' then
    update public.demo_access_sessions set status = 'revoked', ended_at = now() where id = v_sesi.id;
    return jsonb_build_object('valid', false, 'status', 'revoked');
  end if;

  if v_sesi.expires_at <= now() or (v_kode.expires_at is not null and v_kode.expires_at <= now()) then
    update public.demo_access_sessions set status = 'expired', ended_at = now() where id = v_sesi.id;
    return jsonb_build_object('valid', false, 'status', 'expired');
  end if;

  update public.demo_access_sessions set last_accessed_at = now() where id = v_sesi.id;

  return jsonb_build_object(
    'valid', true,
    'status', 'active',
    'expiresAt', v_sesi.expires_at,
    'availableSystems', to_jsonb(v_kode.available_systems),
    'htmlReports', public.demo_html_tersedia(v_kode.available_systems)
  );
end $$;

-- Akhiri sesi. Selalu membalas sukses supaya tidak bisa dipakai menebak token.
create or replace function public.demo_logout(p_token text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
  if p_token ~ '^[0-9a-f]{64}$' then
    update public.demo_access_sessions
    set status = 'ended', ended_at = now()
    where session_token_hash = public.demo_hmac('sesi:' || p_token) and status = 'active';
  end if;
  return jsonb_build_object('success', true);
end $$;

-- Laporan HTML contoh untuk satu sistem. Hanya dari tabel demo_reports, tidak pernah dari path
-- berkas, jadi tidak ada jalan untuk meminta berkas lain. Keluaran:
--   { ok: true, title, html }
--   { ok: false, status: invalid|expired|revoked|ended|not_allowed|not_found }
create or replace function public.demo_report_html(p_token text, p_system text)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_sesi jsonb;
  v_laporan public.demo_reports%rowtype;
begin
  v_sesi := public.demo_session(p_token);
  if not coalesce((v_sesi ->> 'valid')::boolean, false) then
    return jsonb_build_object('ok', false, 'status', v_sesi ->> 'status');
  end if;
  if p_system is null or not ((v_sesi -> 'availableSystems') ? p_system) then
    return jsonb_build_object('ok', false, 'status', 'not_allowed');
  end if;

  select * into v_laporan from public.demo_reports where system_id = p_system and enabled;
  if not found then
    return jsonb_build_object('ok', false, 'status', 'not_found');
  end if;

  return jsonb_build_object('ok', true, 'title', v_laporan.title, 'html', v_laporan.html);
end $$;

-- ── Fungsi pengelola ──────────────────────────────────────────────────────────────────────────

-- Contoh di SQL Editor:
--   select public.demo_code_create('Presentasi Yayasan X', 'Rapat 14 November', now() + interval '7 days', 25);
-- Kode mentah ada di field "code" keluaran dan TIDAK bisa dilihat lagi sesudahnya.
create or replace function public.demo_code_create(
  p_label text,
  p_description text default null,
  p_expires_at timestamptz default null,
  p_max_uses int default null,
  p_available_systems text[] default null,
  p_session_minutes int default 180
)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_kode text;
  v_id uuid;
  v_sistem text[];
  v_ulang int := 0;
begin
  if not public.demo_boleh_kelola() then
    raise exception 'Hanya Admin Fammi yang boleh membuat kode demo.' using errcode = '42501';
  end if;
  if p_label is null or length(trim(p_label)) = 0 then
    raise exception 'Label kode demo wajib diisi.' using errcode = '22023';
  end if;
  if p_expires_at is not null and p_expires_at <= now() then
    raise exception 'Waktu kedaluwarsa harus di masa depan.' using errcode = '22023';
  end if;

  v_sistem := coalesce(p_available_systems, public.demo_semua_sistem());
  if cardinality(v_sistem) = 0 or not (v_sistem <@ public.demo_semua_sistem()) then
    raise exception 'Sistem tidak dikenal. Pilihan: %', array_to_string(public.demo_semua_sistem(), ', ')
      using errcode = '22023';
  end if;
  -- Urutan mengikuti daftar resmi, tanpa duplikat.
  select array_agg(u.s order by u.i) into v_sistem
  from unnest(public.demo_semua_sistem()) with ordinality as u(s, i)
  where u.s = any (v_sistem);

  loop
    v_kode := public.demo_buat_kode();
    begin
      insert into public.demo_access_codes
        (code_hash, code_label, description, expires_at, max_uses, available_systems, session_minutes, created_by)
      values
        (public.demo_hmac('kode:' || public.demo_normalisasi_kode(v_kode)), trim(p_label),
         nullif(trim(coalesce(p_description, '')), ''), p_expires_at, p_max_uses, v_sistem,
         coalesce(p_session_minutes, 180), auth.uid())
      returning id into v_id;
      exit;
    exception when unique_violation then
      v_ulang := v_ulang + 1;
      if v_ulang > 5 then
        raise;
      end if;
    end;
  end loop;

  return jsonb_build_object(
    'id', v_id,
    'code', v_kode,
    'label', trim(p_label),
    'expires_at', p_expires_at,
    'max_uses', p_max_uses,
    'available_systems', to_jsonb(v_sistem),
    'session_minutes', coalesce(p_session_minutes, 180),
    'catatan', 'Simpan kode ini sekarang. Kode tidak bisa ditampilkan lagi.'
  );
end $$;

-- Cabut kode. Sesi yang sedang berjalan dari kode ini ikut berhenti.
create or replace function public.demo_code_revoke(p_id uuid)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
declare
  v_sesi int;
begin
  if not public.demo_boleh_kelola() then
    raise exception 'Hanya Admin Fammi yang boleh mencabut kode demo.' using errcode = '42501';
  end if;

  update public.demo_access_codes
  set status = 'revoked', revoked_at = coalesce(revoked_at, now())
  where id = p_id;
  if not found then
    raise exception 'Kode demo tidak ditemukan.' using errcode = 'P0002';
  end if;

  update public.demo_access_sessions
  set status = 'revoked', ended_at = now()
  where demo_access_code_id = p_id and status = 'active';
  get diagnostics v_sesi = row_count;

  return jsonb_build_object('id', p_id, 'status', 'revoked', 'sesi_dihentikan', v_sesi);
end $$;

-- Daftar kode beserta keadaan sebenarnya dan jumlah sesi yang masih berjalan.
create or replace function public.demo_code_list()
returns table (
  id uuid, code_label text, description text, status text, available_systems text[],
  session_minutes int, created_at timestamptz, expires_at timestamptz, revoked_at timestamptz,
  max_uses int, usage_count int, last_used_at timestamptz, sesi_aktif bigint
)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if not public.demo_boleh_kelola() then
    raise exception 'Hanya Admin Fammi yang boleh melihat kode demo.' using errcode = '42501';
  end if;
  return query
    select c.id, c.code_label, c.description, public.demo_status_kode(c), c.available_systems,
      c.session_minutes, c.created_at, c.expires_at, c.revoked_at, c.max_uses, c.usage_count,
      c.last_used_at,
      (select count(*) from public.demo_access_sessions s
        where s.demo_access_code_id = c.id and s.status = 'active' and s.expires_at > now())
    from public.demo_access_codes c
    order by c.created_at desc;
end $$;

-- Simpan atau ganti laporan HTML contoh satu sistem. Laporan HTML hanya dipakai untuk sistem yang
-- belum punya tampilan contoh di aplikasi (lihat DEMO_SYSTEMS di web/src/pages/demo/demoSystems.js).
create or replace function public.demo_report_upsert(p_system text, p_title text, p_html text, p_enabled boolean default true)
returns jsonb language plpgsql volatile security definer set search_path = '' as $$
begin
  if not public.demo_boleh_kelola() then
    raise exception 'Hanya Admin Fammi yang boleh mengubah laporan demo.' using errcode = '42501';
  end if;
  if p_system is null or not (p_system = any (public.demo_semua_sistem())) then
    raise exception 'Sistem tidak dikenal. Pilihan: %', array_to_string(public.demo_semua_sistem(), ', ')
      using errcode = '22023';
  end if;
  if p_html is null or length(p_html) = 0 then
    raise exception 'Isi HTML wajib diisi.' using errcode = '22023';
  end if;

  insert into public.demo_reports (system_id, title, html, enabled, updated_at, updated_by)
  values (p_system, coalesce(nullif(trim(coalesce(p_title, '')), ''), p_system), p_html,
          coalesce(p_enabled, true), now(), auth.uid())
  on conflict (system_id) do update
  set title = excluded.title, html = excluded.html, enabled = excluded.enabled,
      updated_at = now(), updated_by = excluded.updated_by;

  return jsonb_build_object('system_id', p_system, 'bytes', octet_length(p_html), 'enabled', coalesce(p_enabled, true));
end $$;

-- Email akun Auth yang sudah ada untuk satu akun demo, persis seperti tersimpan, atau null.
-- Dipakai Edge Function demo-masuk (service_role) SEBELUM membuat tautan masuk sekali pakai:
-- auth.admin.generateLink tipe magiclink membuat akun baru kalau emailnya belum terdaftar, dan
-- pemeriksaan ini memastikan tautan hanya pernah dibuat untuk akun yang sudah ada. Pencocokan tanpa
-- membedakan huruf besar, sama seperti Supabase Auth saat masuk. Bukan untuk browser.
create or replace function public.demo_akun_email(p_email text)
returns text language sql stable security definer set search_path = '' as $$
  select u.email::text
  from auth.users u
  where p_email is not null
    and lower(u.email) = lower(btrim(p_email))
    and u.deleted_at is null
  order by u.created_at
  limit 1
$$;

-- ── Hak jalankan fungsi ───────────────────────────────────────────────────────────────────────
-- Supabase memberi EXECUTE ke anon dan authenticated untuk setiap fungsi baru lewat default
-- privileges, jadi pencabutan dari PUBLIC saja tidak cukup.

-- Pembantu internal, hanya dipanggil dari dalam fungsi SECURITY DEFINER di atas.
revoke all on function public.demo_hmac(text) from public, anon, authenticated;
revoke all on function public.demo_client_key() from public, anon, authenticated;
revoke all on function public.demo_status_kode(public.demo_access_codes) from public, anon, authenticated;
revoke all on function public.demo_html_tersedia(text[]) from public, anon, authenticated;
revoke all on function public.demo_buat_kode() from public, anon, authenticated;
revoke all on function public.demo_boleh_kelola() from public, anon, authenticated;

-- Untuk browser, termasuk pengunjung yang belum masuk.
revoke all on function public.demo_verify(text) from public;
revoke all on function public.demo_session(text) from public;
revoke all on function public.demo_logout(text) from public;
revoke all on function public.demo_report_html(text, text) from public;
grant execute on function public.demo_verify(text) to anon, authenticated;
grant execute on function public.demo_session(text) to anon, authenticated;
grant execute on function public.demo_logout(text) to anon, authenticated;
grant execute on function public.demo_report_html(text, text) to anon, authenticated;

-- Pengelola. Pemeriksaan Admin Fammi ada di dalam fungsi (demo_boleh_kelola).
revoke all on function public.demo_code_create(text, text, timestamptz, int, text[], int) from public, anon;
revoke all on function public.demo_code_revoke(uuid) from public, anon;
revoke all on function public.demo_code_list() from public, anon;
revoke all on function public.demo_report_upsert(text, text, text, boolean) from public, anon;
grant execute on function public.demo_code_create(text, text, timestamptz, int, text[], int) to authenticated;
grant execute on function public.demo_code_revoke(uuid) to authenticated;
grant execute on function public.demo_code_list() to authenticated;
grant execute on function public.demo_report_upsert(text, text, text, boolean) to authenticated;

-- Hanya Edge Function demo-masuk (service_role). Browser, termasuk akun Admin Fammi, tidak pernah.
revoke all on function public.demo_akun_email(text) from public, anon, authenticated;
grant execute on function public.demo_akun_email(text) to service_role;
