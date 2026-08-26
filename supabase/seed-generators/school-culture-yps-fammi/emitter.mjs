// Bagian 4 generator: menulis lima berkas migration berurutan + satu berkas dokumentasi akun.
// Dipecah lima (bukan satu berkas 2 MB) supaya tiap bagian masih bisa ditempel ke SQL Editor
// Supabase, bukan cuma lewat `supabase db push`.

export function emit({
  fs, path, orang, aggSekolah, aggUnit, briefing, temaEsai, ceritaPegawai, tindakLanjut,
  UNITS, kategoriDariNilai, mean,
  SEKOLAH_ID, SEKOLAH_NAMA, PERIODE, KODE_STAF, KODE_YAYASAN, dirMigrations, dirDocs,
}) {
  const q = (s) => (s == null ? "null" : `'${String(s).replace(/'/g, "''")}'`);
  const j = (o) => (o == null ? "null" : `'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`);

  const HEADER_BERSAMA = [
    `-- Seed data DUMMY modul School Culture untuk ${SEKOLAH_NAMA} (${SEKOLAH_ID}):`,
    `-- 150 staf di enam unit, periode ${PERIODE}, lengkap dengan laporan individu tiap staf,`,
    `-- agregat lembaga per unit, briefing, sembilan tindak lanjut, plus akun login kelompok dan`,
    `-- akun perorangan.`,
    `--`,
    `-- SEMUA ANGKA, NAMA, DAN JAWABAN ESAI DI BAWAH REKAAN. Tidak ada satu pun baris yang berasal`,
    `-- dari sekolah sungguhan. Berkas ini dibangkitkan generator deterministik (seed 20260826),`,
    `-- bukan diketik tangan, supaya angka agregat sc_lembaga benar-benar turunan dari jawaban 150`,
    `-- baris sc_personal, bukan angka yang ditulis terpisah:`,
    `--   budaya lembaga    = rata-rata mean jawaban per tipe, skala 1-5 dikonversi persen (x/5*100)`,
    `--   profil organisasi = rata-rata 4 tipe per dimensi, rumus persen yang sama`,
    `--   kesejahteraan     = rata-rata butir b1-b13 per subdimensi, rumus persen yang sama`,
    `--   t_gambaran/t_harapan level personal = T-score (mean 50, sd 10) terhadap sebaran 150 orang;`,
    `--     harapan memakai mean/sd milik gambaran supaya gap punya arti, bukan dua skala terpisah.`,
    `--`,
    `-- LIMA BAGIAN, JALANKAN BERURUTAN (nomor timestamp sudah mengurutkannya sendiri):`,
    `--   1 personal  -- sekolah, entitlement, 150 baris sc_personal (bagian ini juga yang bersih-bersih)`,
    `--   2 lembaga   -- sc_lembaga (agregat + 6 unit), briefing, 9 tindak lanjut`,
    `--   3 individu  -- sc_hasil responden 1-75`,
    `--   4 individu  -- sc_hasil responden 76-150`,
    `--   5 akun      -- akun Yayasan + 150 akun Karyawan`,
    `-- Dipecah lima karena satu berkas gabungan berukuran 2 MB, terlalu besar untuk ditempel ke`,
    `-- SQL Editor Supabase. Idempoten: bagian 1 membuang seluruh jejak ${SEKOLAH_ID} lebih dulu,`,
    `-- jadi menjalankan ulang kelimanya dari awal selalu aman.`,
    `--`,
    `-- Status: briefing, tindak_lanjut, dan sc_hasil langsung 'disetujui'. Ini seed demo yang`,
    `-- disetujui pemilik produk saat dibuat, bukan jalur yang melewati gerbang persetujuan`,
    `-- (CLAUDE.md butir 6). Jalur generate Gemini/Excel tetap masuk 'menunggu_persetujuan' seperti`,
    `-- biasa dan tidak disentuh migration ini.`,
    ``,
  ];

  const berkas = [];
  function tulis(nama, judul, isi) {
    const teks = [...HEADER_BERSAMA, `-- ═══ BAGIAN ${judul} ═══`, ``, ...isi, ``].join("\n");
    const target = path.join(dirMigrations, nama);
    fs.writeFileSync(target, teks, "utf8");
    berkas.push({ nama, kb: Math.round(teks.length / 1024) });
  }

  // ── Bagian 1: bersih-bersih + sekolah + sc_personal ───────────────────────────────────────
  const p1 = [];
  p1.push(`-- ── 1.1 Bersih-bersih (urutan mengikuti arah foreign key) ─────────────────────────────`);
  p1.push(`-- profiles dihapus sebelum sc_personal karena profiles.sc_responden_id menunjuk ke sana,`);
  p1.push(`-- dan auth.users dihapus sesudah profiles karena profiles.id menunjuk ke auth.users.`);
  p1.push(`delete from public.sc_komitmen where sc_personal_id in (select id from public.sc_personal where sekolah_id = '${SEKOLAH_ID}');`);
  p1.push(`delete from public.sc_feedback where sekolah_id = '${SEKOLAH_ID}';`);
  p1.push(`delete from public.sc_hasil where sekolah_id = '${SEKOLAH_ID}';`);
  p1.push(`delete from public.profiles where school_id = '${SEKOLAH_ID}';`);
  p1.push(`delete from auth.users where email like 'ypsstaf%@fammi.internal' or email = 'ypsfammi@fammi.internal';`);
  p1.push(`delete from public.sc_personal where sekolah_id = '${SEKOLAH_ID}';`);
  p1.push(`delete from public.sc_lembaga where sekolah_id = '${SEKOLAH_ID}';`);
  p1.push(`delete from public.tindak_lanjut where sekolah_id = '${SEKOLAH_ID}' and modul = 'sc';`);
  p1.push(`delete from public.briefing where sekolah_id = '${SEKOLAH_ID}' and modul = 'sc';`);
  p1.push(``);
  p1.push(`-- ── 1.2 Sekolah + entitlement ─────────────────────────────────────────────────────────`);
  p1.push(`-- Satu baris schools mewakili seluruh yayasan, enam unit dibedakan lewat kolom \`unit\` di`);
  p1.push(`-- sc_lembaga/sc_personal. Pola yang sama dipakai Yayasan Pendidikan Fammi (modul LW) dan`);
  p1.push(`-- Sekolah Islam Athirah (modul PA): satu login, banyak unit. Ini entitas BERBEDA dari`);
  p1.push(`-- YP-FAMMI yang sudah ada; id, nama, dan modulnya sendiri.`);
  p1.push(`insert into public.schools (id, nama, jenjang)`);
  p1.push(`values ('${SEKOLAH_ID}', ${q(SEKOLAH_NAMA)}, 'Semua Jenjang')`);
  p1.push(`on conflict (id) do update set nama = excluded.nama, jenjang = excluded.jenjang;`);
  p1.push(``);
  p1.push(`insert into public.school_modules (school_id, modul, aktif)`);
  p1.push(`values ('${SEKOLAH_ID}', 'sc', true)`);
  p1.push(`on conflict (school_id, modul) do update set aktif = true;`);
  p1.push(``);
  p1.push(`-- ── 1.3 sc_personal: 150 staf ─────────────────────────────────────────────────────────`);
  p1.push(`-- id ditulis eksplisit (bukan gen_random_uuid()) supaya sc_hasil di bagian 3-4 dan`);
  p1.push(`-- profiles.sc_responden_id di bagian 5 bisa menautnya tanpa query balik.`);
  const KOL_PERSONAL = "id, sekolah_id, periode_id, nama_responden, no_whatsapp, email, usia, jenis_kelamin, unit, jenjang, peran_kerja, lama_kerja, bersedia, jawaban_mentah, budaya, profil_organisasi, kesejahteraan, essay";
  for (let i = 0; i < orang.length; i += 10) {
    const batch = orang.slice(i, i + 10);
    p1.push(`insert into public.sc_personal (${KOL_PERSONAL}) values`);
    p1.push(batch.map((p) => `('${p.id}', '${SEKOLAH_ID}', '${PERIODE}', ${q(p.nama)}, ${q(p.no_whatsapp)}, ${q(p.email)}, ${p.usia}, ${q(p.gender)}, ${q(p.unit)}, ${q(p.jenjang)}, ${q(p.peran_kerja)}, ${q(p.lama_kerja)}, ${p.bersedia}, ${j(p.jawaban_mentah)}, ${j(p.budaya)}, ${j(p.profil)}, ${j(p.kesejahteraan)}, ${j(p.essayJson)})`).join(",\n"));
    p1.push(";");
  }
  tulis("20260826160000_sc_yps_fammi_seed_1_personal.sql", "1 dari 5: sekolah + 150 baris sc_personal", p1);

  // ── Bagian 2: sc_lembaga + briefing + tindak lanjut ───────────────────────────────────────
  const p2 = [];
  p2.push(`-- ── 2.1 sc_lembaga: 1 baris agregat sekolah + 6 baris per unit ────────────────────────`);
  p2.push(`-- Baris per unit yang mengisi tabel Perbandingan Antarunit. Enam unit semuanya di atas`);
  p2.push(`-- ambang privasi n>=3 (unit terkecil 10 orang), jadi tidak ada yang digabung jadi`);
  p2.push(`-- "Unit lain" oleh terapkanPrivasiUnit() di useScData.js.`);
  p2.push(`insert into public.sc_lembaga (sekolah_id, periode_id, unit, jumlah_responden, budaya, profil_organisasi, kesejahteraan) values`);
  p2.push([
    `('${SEKOLAH_ID}', '${PERIODE}', null, ${aggSekolah.jumlah}, ${j(aggSekolah.budaya)}, ${j(aggSekolah.profil)}, ${j(aggSekolah.kesejahteraan)})`,
    ...aggUnit.map((u) => `('${SEKOLAH_ID}', '${PERIODE}', ${q(u.unit)}, ${u.jumlah}, ${j(u.budaya)}, ${j(u.profil)}, ${j(u.kesejahteraan)})`),
  ].join(",\n"));
  p2.push(";");
  p2.push(``);
  p2.push(`-- ── 2.2 Briefing lembaga (hero + Cerita dari Tim + Suara Tim) ─────────────────────────`);
  p2.push(`-- tema_esai dan cerita_pegawai dihitung dari jawaban esai 150 baris di bagian 1:`);
  p2.push(`-- jumlah_mention adalah jumlah responden yang benar-benar memilih frasa/tema itu.`);
  p2.push(`insert into public.briefing (sekolah_id, periode_id, modul, scope, scope_id, status, teks, sumber, catatan_internal, tema_esai, cerita_pegawai, draf_asal)`);
  p2.push(`values ('${SEKOLAH_ID}', '${PERIODE}', 'sc', 'sekolah', '${SEKOLAH_ID}', 'disetujui', ${q(briefing.gambaran)}, array['School Culture'], ${q(briefing.catatan_internal)}, ${j(temaEsai)}, ${j(ceritaPegawai)}, 'excel');`);
  p2.push(``);
  p2.push(`-- ── 2.3 Tindak lanjut lembaga (9 dimensi, target_role yayasan) ────────────────────────`);
  p2.push(`-- Sembilan baris menutup keempat tipe budaya dan kelima subdimensi kesejahteraan, jadi`);
  p2.push(`-- tiap kartu dimensi di section 01-C dan 02-C punya isi, bukan empty-state. Kolom dimensi`);
  p2.push(`-- diisi kode PERSIS yang dicocokkan cocokkanTlKeLabel() di useScData.js.`);
  p2.push(`-- Cuma role 'yayasan' yang diseed karena cuma akun Yayasan yang dibuat di bagian 5. Kalau`);
  p2.push(`-- nanti ditambah akun Kepala Sekolah atau Manajemen untuk lembaga ini, generate tindak`);
  p2.push(`-- lanjutnya lewat CMS seperti biasa, jangan menyalin baris ini dengan target_role berbeda.`);
  const KOL_TL = "sekolah_id, modul, scope, scope_id, periode_id, target_role, term, type, fokus, dimensi, icon, title, teaser, mengapa_data, mengapa_perspektif, dasar_teori, manfaat, konkret, indikator_keberhasilan, hal_diwaspadai, action, trigger_desc, priority, draf_asal, status";
  p2.push(`insert into public.tindak_lanjut (${KOL_TL}) values`);
  p2.push(tindakLanjut.map((t) => `('${SEKOLAH_ID}', 'sc', 'sekolah', '${SEKOLAH_ID}', '${PERIODE}', 'yayasan', ${q(t.term)}, ${q(t.type)}, ${q(t.fokus)}, ${q(t.dimensi)}, ${q(t.icon)}, ${q(t.title)}, ${q(t.teaser)}, ${q(t.mengapa_data)}, ${q(t.mengapa_perspektif)}, ${q(t.dasar_teori)}, ${j(t.manfaat)}, ${j(t.konkret)}, ${j(t.indikator_keberhasilan)}, ${j(t.hal_diwaspadai)}, ${q(t.title)}, ${q(t.teaser)}, ${q(t.type === "perlu_perhatian" ? "tinggi" : "sedang")}, 'excel', 'disetujui')`).join(",\n"));
  p2.push(";");
  tulis("20260826160100_sc_yps_fammi_seed_2_lembaga.sql", "2 dari 5: sc_lembaga + briefing + tindak lanjut", p2);

  // ── Bagian 3 & 4: sc_hasil ────────────────────────────────────────────────────────────────
  function bagianHasil(rows, mulai, selesai) {
    const isi = [];
    isi.push(`-- sc_hasil responden ${mulai}-${selesai}: laporan individu, langsung disetujui.`);
    isi.push(`-- Bentuk \`detail\` persis LaporanIndividuSC (sc.types.ts), disusun sama seperti`);
    isi.push(`-- generate-sc-individu: angka diambil dari baris sc_personal orang itu, narasi dari`);
    isi.push(`-- template yang diisi angka miliknya sendiri (bukan satu narasi yang sama untuk semua).`);
    isi.push(`-- WAJIB dijalankan sesudah bagian 1: sc_personal_id di bawah menunjuk baris di sana.`);
    for (let i = 0; i < rows.length; i += 5) {
      const batch = rows.slice(i, i + 5);
      isi.push(`insert into public.sc_hasil (sekolah_id, sc_personal_id, periode_id, detail, status, approved_at) values`);
      isi.push(batch.map((p) => `('${SEKOLAH_ID}', '${p.id}', '${PERIODE}', ${j(p.detail)}, 'disetujui', now())`).join(",\n"));
      isi.push(";");
    }
    return isi;
  }
  tulis("20260826160200_sc_yps_fammi_seed_3_individu_a.sql", "3 dari 5: laporan individu responden 1-75", bagianHasil(orang.slice(0, 75), 1, 75));
  tulis("20260826160300_sc_yps_fammi_seed_4_individu_b.sql", "4 dari 5: laporan individu responden 76-150", bagianHasil(orang.slice(75), 76, 150));

  // ── Bagian 5: akun ────────────────────────────────────────────────────────────────────────
  const daftarStaf = orang.map((p) => `(${q(p.username)}, ${q(p.nama)}, '${p.id}'::uuid)`).join(",\n  ");
  const p5 = [];
  p5.push(`-- ── 5.1 Akun kelompok: Yayasan ────────────────────────────────────────────────────────`);
  p5.push(`-- cakupan sengaja dibiarkan null: akun Yayasan yang cakupan[0]-nya berawalan "YAY-"`);
  p5.push(`-- dianggap yayasan MULTI-SEKOLAH oleh fetchProfileSession (web/src/lib/auth.js) dan modulnya`);
  p5.push(`-- diresolusi dari tabel schools yang bernaung di bawahnya. Lembaga ini satu baris schools`);
  p5.push(`-- dengan enam unit, jadi jalur biasa (modul dari school_id sendiri) yang benar.`);
  p5.push(`--`);
  p5.push(`-- crypt/gen_salt WAJIB berprefiks "extensions." di context migration: search_path role`);
  p5.push(`-- migrasi tidak memuat skema extensions seperti SQL Editor interaktif.`);
  p5.push(`insert into auth.users (`);
  p5.push(`  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,`);
  p5.push(`  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,`);
  p5.push(`  confirmation_token, recovery_token, email_change, email_change_token_new`);
  p5.push(`)`);
  p5.push(`select`);
  p5.push(`  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',`);
  p5.push(`  'ypsfammi@fammi.internal', extensions.crypt(${q(KODE_YAYASAN)}, extensions.gen_salt('bf')), now(),`);
  p5.push(`  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''`);
  p5.push(`where not exists (select 1 from auth.users where email = 'ypsfammi@fammi.internal');`);
  p5.push(``);
  p5.push(`insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)`);
  p5.push(`select gen_random_uuid(), u.id, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', u.id::text, now(), now(), now()`);
  p5.push(`from auth.users u`);
  p5.push(`where u.email = 'ypsfammi@fammi.internal'`);
  p5.push(`  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');`);
  p5.push(``);
  p5.push(`insert into public.profiles (id, username, nama, peran, school_id)`);
  p5.push(`select u.id, 'ypsfammi', ${q(SEKOLAH_NAMA)}, 'Yayasan', '${SEKOLAH_ID}'`);
  p5.push(`from auth.users u`);
  p5.push(`where u.email = 'ypsfammi@fammi.internal'`);
  p5.push(`  and not exists (select 1 from public.profiles p where p.id = u.id);`);
  p5.push(``);
  p5.push(`-- ── 5.2 Akun perorangan: 150 staf (peran Karyawan) ────────────────────────────────────`);
  p5.push(`-- Di produksi akun Karyawan dibuat otomatis saat admin approve laporan`);
  p5.push(`-- (ensureKaryawanScAccount di admin-actions), username panggilan + 3 digit acak dan kode`);
  p5.push(`-- acak per orang. Untuk data demo username dan kode sengaja berpola supaya bisa dibagikan`);
  p5.push(`-- tanpa daftar acak: ypsstaf001..ypsstaf150, kode sama untuk semuanya. GANTI kode ini`);
  p5.push(`-- kalau akunnya dipakai di luar demo internal.`);
  p5.push(`--`);
  p5.push(`-- Daftar 150 staf ditulis ulang di ketiga statement (bukan lewat temp table) supaya tiap`);
  p5.push(`-- statement berdiri sendiri: aman dijalankan satu per satu di SQL Editor, tidak bergantung`);
  p5.push(`-- pada satu transaksi yang sama. Ketiganya juga dijaga "where not exists", jadi menjalankan`);
  p5.push(`-- ulang bagian 5 saja (tanpa bagian 1) tidak menabrak unique email, cuma tidak menambah apa-apa.`);
  p5.push(``);
  p5.push(`insert into auth.users (`);
  p5.push(`  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,`);
  p5.push(`  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,`);
  p5.push(`  confirmation_token, recovery_token, email_change, email_change_token_new`);
  p5.push(`)`);
  p5.push(`select`);
  p5.push(`  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',`);
  p5.push(`  s.username || '@fammi.internal', extensions.crypt(${q(KODE_STAF)}, extensions.gen_salt('bf')), now(),`);
  p5.push(`  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''`);
  p5.push(`from (values`);
  p5.push(`  ${daftarStaf}`);
  p5.push(`) as s(username, nama, personal_id)`);
  p5.push(`where not exists (select 1 from auth.users u where u.email = s.username || '@fammi.internal');`);
  p5.push(``);
  p5.push(`insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)`);
  p5.push(`select gen_random_uuid(), u.id, jsonb_build_object('sub', u.id::text, 'email', u.email), 'email', u.id::text, now(), now(), now()`);
  p5.push(`from auth.users u`);
  p5.push(`join (values`);
  p5.push(`  ${daftarStaf}`);
  p5.push(`) as s(username, nama, personal_id) on u.email = s.username || '@fammi.internal'`);
  p5.push(`where not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');`);
  p5.push(``);
  p5.push(`insert into public.profiles (id, username, nama, peran, school_id, cakupan, sc_responden_id)`);
  p5.push(`select u.id, s.username, s.nama, 'Karyawan', '${SEKOLAH_ID}', null, s.personal_id`);
  p5.push(`from auth.users u`);
  p5.push(`join (values`);
  p5.push(`  ${daftarStaf}`);
  p5.push(`) as s(username, nama, personal_id) on u.email = s.username || '@fammi.internal'`);
  p5.push(`where not exists (select 1 from public.profiles p where p.id = u.id);`);
  p5.push(``);
  p5.push(`-- Login demo (ganti kode sebelum dipakai di luar keperluan demo):`);
  p5.push(`--   Yayasan  -- username "ypsfammi", kode "${KODE_YAYASAN}"`);
  p5.push(`--   150 staf -- username "ypsstaf001" sampai "ypsstaf150", kode "${KODE_STAF}"`);
  p5.push(`--   Daftar nama per username ada di docs/seed-school-culture-yps-fammi.md`);
  tulis("20260826160400_sc_yps_fammi_seed_5_akun.sql", "5 dari 5: akun Yayasan + 150 akun Karyawan", p5);

  // ── Dokumentasi akun ──────────────────────────────────────────────────────────────────────
  const doc = [];
  doc.push(`# Data demo School Culture: ${SEKOLAH_NAMA}`);
  doc.push("");
  doc.push(`Dibangkitkan lima migration berurutan:`);
  doc.push("");
  berkas.forEach((b) => doc.push(`- \`supabase/migrations/${b.nama}\` (${b.kb} KB)`));
  doc.push("");
  doc.push(`Seluruh angka, nama, dan jawaban esai di dalamnya rekaan, bukan data sekolah sungguhan. Bagian 1 membersihkan seluruh jejak \`${SEKOLAH_ID}\` lebih dulu, jadi menjalankan ulang kelimanya dari awal selalu aman.`);
  doc.push("");
  doc.push("## Ringkas");
  doc.push("");
  doc.push(`| Hal | Nilai |`);
  doc.push(`| --- | --- |`);
  doc.push(`| id sekolah | \`${SEKOLAH_ID}\` |`);
  doc.push(`| Periode | ${PERIODE} |`);
  doc.push(`| Jumlah responden | ${aggSekolah.jumlah} |`);
  doc.push(`| Modul aktif | \`sc\` |`);
  doc.push(`| Unit | ${UNITS.map((u) => `${u.unit} (${u.jumlah})`).join(", ")} |`);
  doc.push("");
  doc.push("## Akun");
  doc.push("");
  doc.push(`Akun kelompok. Masuk ke dashboard Laporan Lembaga (tiga section 01/02/03) dan bisa membuka drill-down laporan tiap staf yang bersedia:`);
  doc.push("");
  doc.push(`| Peran | Username | Kode |`);
  doc.push(`| --- | --- | --- |`);
  doc.push(`| Yayasan | \`ypsfammi\` | \`${KODE_YAYASAN}\` |`);
  doc.push("");
  doc.push(`Akun perorangan (peran Karyawan, laporan pribadi tampilan mobile). Kode sama untuk semuanya: \`${KODE_STAF}\`. Kolom terakhir menandai staf yang menjawab bersedia laporannya dibuka pimpinan; yang menjawab tidak tetap ikut agregat, tapi tidak muncul di tab Laporan Individu.`);
  doc.push("");
  doc.push(`| Username | Nama | Unit | Peran kerja | Bersedia tampil ke pimpinan |`);
  doc.push(`| --- | --- | --- | --- | --- |`);
  orang.forEach((p) => doc.push(`| \`${p.username}\` | ${p.nama} | ${p.unit} | ${p.peran_kerja} | ${p.bersedia ? "Ya" : "Tidak"} |`));
  doc.push("");
  doc.push("## Angka agregat lembaga");
  doc.push("");
  doc.push(`Skala 0-100. Gap = harapan dikurangi kondisi saat ini; ambang tampilan dashboard: |gap| di atas 5 "Perlu perhatian", 1 sampai 5 "Ringan", di bawah 1 "Selaras".`);
  doc.push("");
  doc.push(`| Tipe budaya | Saat ini | Harapan | Gap |`);
  doc.push(`| --- | --- | --- | --- |`);
  aggSekolah.budaya.forEach((b) => doc.push(`| ${b.tipe} | ${b.mean_gambaran} | ${b.mean_harapan} | ${b.gap > 0 ? "+" : ""}${b.gap} |`));
  doc.push("");
  doc.push(`| Subdimensi kesejahteraan | Nilai | Kategori |`);
  doc.push(`| --- | --- | --- |`);
  aggSekolah.kesejahteraan.forEach((k) => doc.push(`| ${k.label} | ${k.nilai} | ${k.kategori} |`));
  doc.push("");
  doc.push(`Indeks kesejahteraan gabungan: **${Math.round(mean(aggSekolah.kesejahteraan.map((k) => k.nilai)))}** (${kategoriDariNilai(Math.round(mean(aggSekolah.kesejahteraan.map((k) => k.nilai))))}).`);
  doc.push("");
  doc.push(`| Dimensi profil organisasi | Nilai | Harapan | Gap |`);
  doc.push(`| --- | --- | --- | --- |`);
  aggSekolah.profil.forEach((d) => doc.push(`| ${d.label} | ${d.nilai} | ${d.harapan} | ${d.gap > 0 ? "+" : ""}${d.gap} |`));
  doc.push("");
  doc.push(`| Unit | n | Budaya dominan | Indeks kesejahteraan |`);
  doc.push(`| --- | --- | --- | --- |`);
  aggUnit.forEach((u) => {
    const dom = [...u.budaya].sort((a, b) => b.mean_gambaran - a.mean_gambaran)[0];
    const idx = Math.round(mean(u.kesejahteraan.map((k) => k.nilai)));
    doc.push(`| ${u.unit} | ${u.jumlah} | ${dom.tipe} | ${idx} (${kategoriDariNilai(idx)}) |`);
  });
  doc.push("");
  doc.push("## Cerita yang dibawa data ini");
  doc.push("");
  doc.push("- Budaya Kekeluargaan paling terasa dan hampir selaras dengan harapan, jadi ini modal, bukan masalah.");
  doc.push("- Inovasi jadi gap terbesar: ruang mencoba metode mengajar baru dirasa jauh di bawah yang diharapkan.");
  doc.push("- Aturan satu-satunya tipe yang harapannya lebih rendah dari kondisi sekarang, prosedur dirasa berlebih.");
  doc.push("- Work-Life Balance jadi subdimensi kesejahteraan terendah, Kenyamanan Bekerja tertinggi.");
  doc.push("- Sinergi Tim jadi dimensi profil organisasi terendah, sejalan dengan keluhan unit yang jalan sendiri-sendiri.");
  doc.push("- Perbedaan antarunit tajam: TK dan SD hangat dengan kesejahteraan di atas rata-rata, SMP dan SMA lebih menekankan Aturan/Orientasi dengan kesejahteraan lebih rendah.");
  doc.push("");

  fs.writeFileSync(path.join(dirDocs, "seed-school-culture-yps-fammi.md"), doc.join("\n"), "utf8");
  return berkas;
}
