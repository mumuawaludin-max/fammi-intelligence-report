-- Seed dummy modul Perilaku Anak (pa) untuk jenjang TK, atas permintaan pemilik produk (2026-08-07).
--
-- BEDA PENTING dari data Athirah (SD/SMP/SMA) yang sudah ada: instrumen SDQ di jenjang TK adalah
-- versi informant-report (usia 2-4), diisi GURU KELAS dan ORANG TUA yang mengamati anak, BUKAN
-- anak yang melakukan refleksi sendiri. Seluruh narasi esai di bagian 9 ditulis dalam suara
-- pengamat pihak ketiga ("Menurut catatan guru...", "Orang tua melaporkan...") -- lihat catatan
-- yang sama di kepala web/src/pages/pa/pa.mock.js (diperbarui bersamaan dengan migration ini).
--
-- Entitas baru: TK Fammi, dua kelompok (Kelompok A usia 4-5 tahun, Kelompok B usia 5-6
-- tahun), periode "2026-01" (Semester Genap TK 2025/2026). Seluruh angka DUMMY untuk keperluan
-- pengujian tampilan dan akun, bukan data sekolah sungguhan.

-- ── 1. RLS: tambahkan WaliKelas sebagai peran yang boleh membaca modul PA ──────────────────────
-- Kebijakan sebelumnya (20260801130000_pa_tables_and_import.sql) hanya mengizinkan peran pimpinan
-- (KepalaSekolah/WakilKepalaSekolah/Manajemen/Yayasan). Modul ini sekarang butuh akun Guru/Wali
-- Kelas TK yang mengisi asesmen kelasnya sendiri -- pa_lembaga (angka agregat lembaga, tidak
-- sensitif per anak) tetap dibuka untuk seluruh peran itu; pa_siswa/pa_esai (baris per anak)
-- DIKUNCI lebih ketat untuk WaliKelas: hanya baris kelas yang ada di cakupannya (my_cakupan()),
-- pola sama dengan RLS mi_hasil/mi_input di 20260711100000_rls_scope_hardening.sql.
drop policy if exists pa_lembaga_baca on public.pa_lembaga;
create policy pa_lembaga_baca on public.pa_lembaga
for select to authenticated
using (
  sekolah_id = my_school_id()
  and my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Yayasan', 'WaliKelas')
);

drop policy if exists pa_siswa_baca on public.pa_siswa;
create policy pa_siswa_baca on public.pa_siswa
for select to authenticated
using (
  sekolah_id = my_school_id()
  and (
    my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Yayasan')
    or (my_peran() = 'WaliKelas' and kelas = any (my_cakupan()))
  )
);

drop policy if exists pa_esai_baca on public.pa_esai;
create policy pa_esai_baca on public.pa_esai
for select to authenticated
using (
  sekolah_id = my_school_id()
  and (
    my_peran() in ('KepalaSekolah', 'WakilKepalaSekolah', 'Manajemen', 'Yayasan')
    or (my_peran() = 'WaliKelas' and kelas = any (my_cakupan()))
  )
);

-- ── 2. Sekolah + entitlement ────────────────────────────────────────────────────────────────
insert into public.schools (id, nama, jenjang)
values ('TK-FAMMI', 'TK Fammi', 'TK')
on conflict (id) do nothing;

insert into public.school_modules (school_id, modul, aktif)
values ('TK-FAMMI', 'pa', true)
on conflict (school_id, modul) do update set aktif = true;

-- ── 3. pa_lembaga (agregat + 2 kelompok, periode 2026-01) ──────────────────────────────────────
insert into public.pa_lembaga (
  sekolah_id, periode_id, unit, jumlah_siswa, statistik, emosi, heart, indikator, survey, narasi
) values
-- Baris agregat (unit = null)
(
  'TK-FAMMI', '2026-01', null, 46,
  '{
    "laki": {"jumlah": 23, "persen": 50},
    "perempuan": {"jumlah": 23, "persen": 50},
    "sebaran": [
      {"unit": "Kelompok A", "jumlah": 24, "persen": 52},
      {"unit": "Kelompok B", "jumlah": 22, "persen": 48}
    ]
  }'::jsonb,
  '[
    {"unit": "Kelompok A", "segmen": [{"kode":"sangat_positif","persen":19},{"kode":"positif","persen":28},{"kode":"netral","persen":30},{"kode":"negatif","persen":15},{"kode":"sangat_negatif","persen":6},{"kode":"kosong","persen":2}]},
    {"unit": "Kelompok B", "segmen": [{"kode":"sangat_positif","persen":25},{"kode":"positif","persen":32},{"kode":"netral","persen":26},{"kode":"negatif","persen":11},{"kode":"sangat_negatif","persen":4},{"kode":"kosong","persen":2}]}
  ]'::jsonb,
  '{
    "hiperaktivitas": {"aman":{"jumlah":38,"persen":82.6}, "perhatian":{"jumlah":6,"persen":13.0}, "diwaspadai":{"jumlah":2,"persen":4.3}},
    "emosional": {"aman":{"jumlah":39,"persen":84.8}, "perhatian":{"jumlah":5,"persen":10.9}, "diwaspadai":{"jumlah":2,"persen":4.3}},
    "agresi": {"aman":{"jumlah":41,"persen":89.1}, "perhatian":{"jumlah":4,"persen":8.7}, "diwaspadai":{"jumlah":1,"persen":2.2}},
    "relasi": {"aman":{"jumlah":38,"persen":82.6}, "perhatian":{"jumlah":6,"persen":13.0}, "diwaspadai":{"jumlah":2,"persen":4.3}},
    "tolong_menolong": {"aman":{"jumlah":36,"persen":78.3}, "perhatian":{"jumlah":7,"persen":15.2}, "diwaspadai":{"jumlah":3,"persen":6.5}}
  }'::jsonb,
  '{
    "hiperaktivitas": [
      {"indikator":"Sulit duduk tenang saat mendengarkan cerita/instruksi","nilai":1.2,"siswa":6,"persentase":13.0},
      {"indikator":"Sering berpindah tempat/kegiatan sebelum selesai","nilai":1.0,"siswa":5,"persentase":10.9},
      {"indikator":"Bertindak dulu, baru berpikir belakangan","nilai":0.9,"siswa":4,"persentase":8.7}
    ],
    "emosional": [
      {"indikator":"Mudah menangis saat menghadapi tugas yang dirasa sulit","nilai":1.1,"siswa":5,"persentase":10.9},
      {"indikator":"Tampak cemas saat berpisah dengan orang tua","nilai":0.9,"siswa":4,"persentase":8.7},
      {"indikator":"Kesulitan menenangkan diri setelah kecewa","nilai":0.8,"siswa":3,"persentase":6.5}
    ],
    "agresi": [
      {"indikator":"Merebut mainan dari teman tanpa meminta","nilai":0.9,"siswa":4,"persentase":8.7},
      {"indikator":"Bereaksi keras (memukul/berteriak) saat kecewa","nilai":0.8,"siswa":3,"persentase":6.5},
      {"indikator":"Sulit menerima giliran atau antrean","nilai":0.7,"siswa":3,"persentase":6.5}
    ],
    "relasi": [
      {"indikator":"Bermain sendiri, jarang bergabung kelompok","nilai":1.1,"siswa":6,"persentase":13.0},
      {"indikator":"Terlihat sedih/menangis saat ditolak bermain","nilai":0.9,"siswa":4,"persentase":8.7},
      {"indikator":"Belum mendekati orang dewasa saat kesulitan","nilai":0.8,"siswa":4,"persentase":8.7}
    ],
    "tolong_menolong": [
      {"indikator":"Belum menawarkan bantuan tanpa diminta","nilai":0.7,"siswa":7,"persentase":15.2},
      {"indikator":"Menunggu diarahkan guru sebelum membantu teman","nilai":0.6,"siswa":6,"persentase":13.0},
      {"indikator":"Enggan berbagi mainan/bekal saat punya lebih","nilai":0.5,"siswa":4,"persentase":8.7}
    ]
  }'::jsonb,
  '[
    {"pertanyaan_kode":"kebiasaan_belajar","opsi":[{"label":"Bisa duduk mengerjakan kegiatan sendiri di ruangan tenang","persen":46},{"label":"Perlu diiringi musik atau sambil bergerak","persen":31},{"label":"Perlu ditemani orang dewasa terus-menerus","persen":23}]},
    {"pertanyaan_kode":"penyelesaian_tugas","opsi":[{"label":"Butuh banyak pengingat dari guru/orang tua untuk selesai","persen":42},{"label":"Butuh waktu lebih lama tapi selesai sendiri","persen":35},{"label":"Sering berpindah kegiatan sebelum selesai","persen":23}]},
    {"pertanyaan_kode":"penggunaan_gadget","opsi":[{"label":"2-4 jam per hari","persen":44},{"label":"1-2 jam per hari","persen":33},{"label":"Tidak menentu, tergantung hari","persen":23}]},
    {"pertanyaan_kode":"orang_yang_dipercaya_untuk_cerita","opsi":[{"label":"Mendekati orang tua/pengasuh di rumah","persen":48},{"label":"Mendekati guru atau teman di kelas","persen":35},{"label":"Belum terlihat mendekati siapa pun, cenderung dipendam","persen":17}]},
    {"pertanyaan_kode":"saat_teman_kesulitan","opsi":[{"label":"Langsung membantu dengan senang hati","persen":52},{"label":"Membantu tapi perlu diminta berulang","persen":34},{"label":"Menolak atau mengabaikan permintaan","persen":14}]}
  ]'::jsonb,
  null
),
-- Kelompok A
(
  'TK-FAMMI', '2026-01', 'Kelompok A', 24,
  null,
  '[{"unit": "Kelompok A", "segmen": [{"kode":"sangat_positif","persen":19},{"kode":"positif","persen":28},{"kode":"netral","persen":30},{"kode":"negatif","persen":15},{"kode":"sangat_negatif","persen":6},{"kode":"kosong","persen":2}]}]'::jsonb,
  '{
    "hiperaktivitas": {"aman":{"jumlah":19,"persen":79.2}, "perhatian":{"jumlah":4,"persen":16.7}, "diwaspadai":{"jumlah":1,"persen":4.2}},
    "emosional": {"aman":{"jumlah":20,"persen":83.3}, "perhatian":{"jumlah":3,"persen":12.5}, "diwaspadai":{"jumlah":1,"persen":4.2}},
    "agresi": {"aman":{"jumlah":21,"persen":87.5}, "perhatian":{"jumlah":2,"persen":8.3}, "diwaspadai":{"jumlah":1,"persen":4.2}},
    "relasi": {"aman":{"jumlah":19,"persen":79.2}, "perhatian":{"jumlah":4,"persen":16.7}, "diwaspadai":{"jumlah":1,"persen":4.2}},
    "tolong_menolong": {"aman":{"jumlah":18,"persen":75.0}, "perhatian":{"jumlah":4,"persen":16.7}, "diwaspadai":{"jumlah":2,"persen":8.3}}
  }'::jsonb,
  null, null, null
),
-- Kelompok B
(
  'TK-FAMMI', '2026-01', 'Kelompok B', 22,
  null,
  '[{"unit": "Kelompok B", "segmen": [{"kode":"sangat_positif","persen":25},{"kode":"positif","persen":32},{"kode":"netral","persen":26},{"kode":"negatif","persen":11},{"kode":"sangat_negatif","persen":4},{"kode":"kosong","persen":2}]}]'::jsonb,
  '{
    "hiperaktivitas": {"aman":{"jumlah":19,"persen":86.4}, "perhatian":{"jumlah":2,"persen":9.1}, "diwaspadai":{"jumlah":1,"persen":4.5}},
    "emosional": {"aman":{"jumlah":19,"persen":86.4}, "perhatian":{"jumlah":2,"persen":9.1}, "diwaspadai":{"jumlah":1,"persen":4.5}},
    "agresi": {"aman":{"jumlah":20,"persen":90.9}, "perhatian":{"jumlah":2,"persen":9.1}, "diwaspadai":{"jumlah":0,"persen":0}},
    "relasi": {"aman":{"jumlah":19,"persen":86.4}, "perhatian":{"jumlah":2,"persen":9.1}, "diwaspadai":{"jumlah":1,"persen":4.5}},
    "tolong_menolong": {"aman":{"jumlah":18,"persen":81.8}, "perhatian":{"jumlah":3,"persen":13.6}, "diwaspadai":{"jumlah":1,"persen":4.5}}
  }'::jsonb,
  null, null, null
);

-- ── 4. pa_siswa (baris kasus per anak x domain) ────────────────────────────────────────────────
-- Jumlah baris per (unit, domain, status) di bawah SENGAJA dibuat cocok dengan jumlah "perhatian"
-- + "diwaspadai" di heart pa_lembaga di atas -- lihat catatan penting di kepala paAssembler.js
-- kenapa dua sumber ini wajib konsisten (kartu bagian 03 dihitung dari baris pa_siswa, bukan dari
-- heart pa_lembaga).
insert into public.pa_siswa (sekolah_id, periode_id, nama, kelas, unit, domain, status, skor) values
-- Kelompok A -- hiperaktivitas (4 PP + 1 PD)
('TK-FAMMI','2026-01','Ahmad Zaki','Kelompok A','Kelompok A','hiperaktivitas','Perlu Perhatian',7),
('TK-FAMMI','2026-01','Aisyah Putri','Kelompok A','Kelompok A','hiperaktivitas','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Rayhan Saputra','Kelompok A','Kelompok A','hiperaktivitas','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Naura Salsabila','Kelompok A','Kelompok A','hiperaktivitas','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Bilal Ramadhan','Kelompok A','Kelompok A','hiperaktivitas','Perlu Diwaspadai',9),
-- Kelompok A -- emosional (3 PP + 1 PD)
('TK-FAMMI','2026-01','Cinta Amelia','Kelompok A','Kelompok A','emosional','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Fathiya Zahra','Kelompok A','Kelompok A','emosional','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Kenzo Arya','Kelompok A','Kelompok A','emosional','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Dzaki Pratama','Kelompok A','Kelompok A','emosional','Perlu Diwaspadai',9),
-- Kelompok A -- agresi (2 PP + 1 PD)
('TK-FAMMI','2026-01','Gibran Al Fatih','Kelompok A','Kelompok A','agresi','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Hana Salsabila','Kelompok A','Kelompok A','agresi','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Irfan Maulana','Kelompok A','Kelompok A','agresi','Perlu Diwaspadai',9),
-- Kelompok A -- relasi (4 PP + 1 PD)
('TK-FAMMI','2026-01','Jasmine Aulia','Kelompok A','Kelompok A','relasi','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Laila Nur','Kelompok A','Kelompok A','relasi','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Malik Ibrahim','Kelompok A','Kelompok A','relasi','Perlu Perhatian',7),
('TK-FAMMI','2026-01','Nadia Ramadhani','Kelompok A','Kelompok A','relasi','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Oka Pradana','Kelompok A','Kelompok A','relasi','Perlu Diwaspadai',9),
-- Kelompok A -- tolong_menolong (4 PP + 2 PD)
('TK-FAMMI','2026-01','Putri Ayu','Kelompok A','Kelompok A','tolong_menolong','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Qusay Ramadhan','Kelompok A','Kelompok A','tolong_menolong','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Rania Sari','Kelompok A','Kelompok A','tolong_menolong','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Satria Yuda','Kelompok A','Kelompok A','tolong_menolong','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Talita Zahra','Kelompok A','Kelompok A','tolong_menolong','Perlu Diwaspadai',9),
('TK-FAMMI','2026-01','Umar Faiz','Kelompok A','Kelompok A','tolong_menolong','Perlu Diwaspadai',9),
-- Kelompok B -- hiperaktivitas (2 PP + 1 PD)
('TK-FAMMI','2026-01','Vino Alfarizi','Kelompok B','Kelompok B','hiperaktivitas','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Wulan Ayu','Kelompok B','Kelompok B','hiperaktivitas','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Xaviera Putri','Kelompok B','Kelompok B','hiperaktivitas','Perlu Diwaspadai',9),
-- Kelompok B -- emosional (2 PP + 1 PD)
('TK-FAMMI','2026-01','Yusuf Hakim','Kelompok B','Kelompok B','emosional','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Zahra Amelia','Kelompok B','Kelompok B','emosional','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Akmal Fauzan','Kelompok B','Kelompok B','emosional','Perlu Diwaspadai',9),
-- Kelompok B -- agresi (2 PP)
('TK-FAMMI','2026-01','Bunga Citra','Kelompok B','Kelompok B','agresi','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Chandra Wijaya','Kelompok B','Kelompok B','agresi','Perlu Perhatian',6),
-- Kelompok B -- relasi (2 PP + 1 PD)
('TK-FAMMI','2026-01','Devina Larasati','Kelompok B','Kelompok B','relasi','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Elang Pratama','Kelompok B','Kelompok B','relasi','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Farah Nabila','Kelompok B','Kelompok B','relasi','Perlu Diwaspadai',9),
-- Kelompok B -- tolong_menolong (3 PP + 1 PD)
('TK-FAMMI','2026-01','Gading Saputra','Kelompok B','Kelompok B','tolong_menolong','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Hafiz Ramadhan','Kelompok B','Kelompok B','tolong_menolong','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Indira Maharani','Kelompok B','Kelompok B','tolong_menolong','Perlu Perhatian',6),
('TK-FAMMI','2026-01','Joko Prasetyo','Kelompok B','Kelompok B','tolong_menolong','Perlu Diwaspadai',9);

-- ── 5. pa_esai (jawaban terbuka guru/orang tua) ─────────────────────────────────────────────────
-- Dua pertanyaan_kode di sini ("observasi_perilaku_menonjol"/"cara_anak_menunjukkan_kepedulian")
-- ditambahkan ke PA_ESAI_PERTANYAAN di web/src/pages/pa/paAssembler.js bersamaan dengan migration
-- ini -- keduanya khusus jenjang TK (informant-report), beda dari dua kode lama yang dipakai
-- jenjang SD/SMP/SMA (anak menjawab sendiri).
insert into public.pa_esai (sekolah_id, periode_id, kode_anonim, nama, kelas, unit, domain, pertanyaan_kode, jawaban_teks, anotasi) values
(
  'TK-FAMMI','2026-01','TKC-A-001','Malik Ibrahim','Kelompok A','Kelompok A','relasi','observasi_perilaku_menonjol',
  'Menurut catatan guru kelas, ananda cenderung bermain sendiri di sudut kelas dan belum aktif mengajak teman bermain bersama. Saat ditawari bergabung ke kelompok, ananda kadang mau tapi lebih sering diam mengamati dari jarak dekat. Di rumah, orang tua melaporkan ananda lebih terbuka bercerita dan cukup ekspresif, jadi pola menyendiri ini tampaknya lebih terjadi di lingkungan sekolah.',
  '{"tema":["menyendiri di kelas","beda pola rumah dan sekolah","butuh pendampingan sosial"],"sinyal":"Perlu dipantau. Pola menyendiri konsisten teramati guru di kelas, meski di rumah anak tampak lebih terbuka.","saran":"Guru kelas dapat mengajak ananda bergabung ke kelompok bermain kecil terlebih dahulu (2-3 anak) sebelum kelompok besar, dan berbagi observasi ini ke orang tua saat penjemputan.","prioritas":"Pantau"}'::jsonb
),
(
  'TK-FAMMI','2026-01','TKC-A-002','Ahmad Zaki','Kelompok A','Kelompok A','hiperaktivitas','observasi_perilaku_menonjol',
  'Guru kelas mencatat ananda kesulitan duduk tenang saat mendengarkan cerita atau instruksi lebih dari lima menit, sering berpindah tempat duduk sendiri. Orang tua di rumah juga menyebut ananda sulit diajak duduk makan sampai selesai. Namun ananda sangat antusias dan fokus saat kegiatan yang melibatkan gerak, seperti menari atau permainan fisik.',
  '{"tema":["sulit duduk tenang","fokus tinggi saat kegiatan gerak","konsisten rumah-sekolah"],"sinyal":"Sinyal ringan. Pola sulit diam konsisten di rumah dan sekolah, tapi fokus justru tinggi pada aktivitas berbasis gerak.","saran":"Sisipkan jeda gerak singkat sebelum kegiatan yang butuh duduk lama, dan manfaatkan minat pada aktivitas fisik sebagai jembatan ke kegiatan yang lebih tenang.","prioritas":"Pencegahan"}'::jsonb
),
(
  'TK-FAMMI','2026-01','TKC-B-003','Farah Nabila','Kelompok B','Kelompok B','relasi','observasi_perilaku_menonjol',
  'Guru kelas melaporkan ananda beberapa kali menangis saat jam istirahat karena merasa tidak diajak bermain oleh teman-teman tertentu. Guru sudah beberapa kali mendampingi dan memfasilitasi ananda bergabung, tapi pola berulang tiap minggu. Orang tua belum banyak tahu soal ini karena ananda jarang bercerita di rumah tentang kejadian di sekolah.',
  '{"tema":["ditolak teman sebaya","berulang","orang tua belum tahu"],"sinyal":"Prioritas. Kejadian berulang tiap minggu dan orang tua belum mendapat informasi -- perlu komunikasi terbuka sebelum polanya makin mengakar.","saran":"Jadwalkan komunikasi singkat dengan orang tua saat penjemputan, dan atur rotasi kelompok bermain kecil supaya ananda punya lebih banyak kesempatan diterima.","prioritas":"Prioritas"}'::jsonb
),
(
  'TK-FAMMI','2026-01','TKC-A-004','Putri Ayu','Kelompok A','Kelompok A','tolong_menolong','cara_anak_menunjukkan_kepedulian',
  'Orang tua menceritakan ananda pernah melihat temannya menangis di taman bermain dan langsung memberikan mainannya tanpa diminta, tapi di sekolah guru belum banyak melihat perilaku serupa -- ananda cenderung menunggu diarahkan guru dulu sebelum menawarkan bantuan ke teman sekelas.',
  '{"tema":["kepedulian muncul di rumah","belum terbiasa berinisiatif di kelas","butuh dorongan"],"sinyal":"Perlu dipantau. Niat menolongnya sudah ada (teramati orang tua), yang masih perlu dilatih adalah keberanian berinisiatif di lingkungan kelas.","saran":"Guru dapat memberi peran kecil bergilir (mis. \"pembantu guru hari ini\") supaya ananda terbiasa menawarkan bantuan tanpa diminta di kelas.","prioritas":"Pantau"}'::jsonb
),
(
  'TK-FAMMI','2026-01','TKC-B-005','Yusuf Hakim','Kelompok B','Kelompok B','emosional','observasi_perilaku_menonjol',
  'Guru kelas mencatat ananda mudah menangis saat menghadapi tugas yang dirasa sulit, misalnya menggunting mengikuti pola, dan cenderung langsung menyerah dibanding mencoba ulang. Orang tua menyebut pola serupa terjadi saat ananda diminta memakai sepatu sendiri di rumah -- cepat frustrasi lalu minta dibantu penuh.',
  '{"tema":["mudah frustrasi","cepat menyerah","konsisten rumah-sekolah"],"sinyal":"Prioritas. Pola frustrasi cepat konsisten di dua lingkungan dan berdampak ke kemauan mencoba tugas baru.","saran":"Latih tugas dengan langkah kecil bertahap disertai pujian di tiap langkah selesai, selaraskan pendekatan yang sama antara guru dan orang tua.","prioritas":"Prioritas"}'::jsonb
),
(
  'TK-FAMMI','2026-01','TKC-A-006','Naura Salsabila','Kelompok A','Kelompok A','emosional','observasi_perilaku_menonjol',
  'Orang tua melaporkan ananda sempat rewel dan menolak berangkat sekolah selama dua hari di awal semester, tapi sudah membaik setelah minggu ketiga. Guru kelas juga mencatat ananda kini sudah terlihat nyaman saat diantar dan tidak lagi menangis di gerbang.',
  '{"tema":["adaptasi awal semester","sudah membaik"],"sinyal":null,"saran":null,"prioritas":null}'::jsonb
);

-- ── 6. Akun uji Kepala Sekolah dan Guru/Wali Kelas ──────────────────────────────────────────────
-- HARUS dijalankan lewat Supabase SQL Editor (service_role), bukan dari browser/anon key. GANTI
-- kedua password di bawah ('gantiSandiIni2026') sebelum dipakai sungguhan. Pola provisioning sama
-- seperti akun uji Yayasan sebelumnya (lihat memori sesi: provision_yayasan_mumu.sql) -- insert
-- langsung ke auth.users + auth.identities + public.profiles.
--
-- Akun Kepala Sekolah: cakupan seluruh sekolah (kedua kelompok), sesuai peran KepalaSekolah.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'kepsektkfammi@fammi.internal', extensions.crypt('gantiSandiIni2026', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
);

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, jsonb_build_object('sub', id::text, 'email', email), 'email', id::text, now(), now(), now()
from auth.users where email = 'kepsektkfammi@fammi.internal';

insert into public.profiles (id, username, nama, peran, school_id)
select id, 'kepsektkfammi', 'Kepala Sekolah TK Fammi', 'KepalaSekolah', 'TK-FAMMI'
from auth.users where email = 'kepsektkfammi@fammi.internal';

-- Akun Guru/Wali Kelas: cakupan HANYA Kelompok A (dikunci lewat RLS pa_siswa_baca/pa_esai_baca
-- di bagian 1 di atas, kolom `cakupan` di profiles harus berisi nilai `kelas` PERSIS "Kelompok A"
-- supaya kelas = any(my_cakupan()) cocok).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values (
  '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
  'gurukelompoka@fammi.internal', extensions.crypt('gantiSandiIni2026', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(), '', '', '', ''
);

insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, jsonb_build_object('sub', id::text, 'email', email), 'email', id::text, now(), now(), now()
from auth.users where email = 'gurukelompoka@fammi.internal';

insert into public.profiles (id, username, nama, peran, school_id, cakupan)
select id, 'gurukelompoka', 'Guru Kelompok A TK Fammi', 'WaliKelas', 'TK-FAMMI', array['Kelompok A']
from auth.users where email = 'gurukelompoka@fammi.internal';

-- Login:
--   Kepala Sekolah -- username "kepsektkfammi", kode "gantiSandiIni2026" (ganti sebelum dipakai)
--   Guru Kelompok A -- username "gurukelompoka", kode "gantiSandiIni2026" (ganti sebelum dipakai)
