-- Section "01-E" redesign dashboard Budaya Kerja: "Cerita dari Para Pegawai" -- dua daftar
-- kalimat hasil SINTESIS Gemini (BUKAN kutipan verbatim) dari jawaban esai Q2
-- (survey_q2_kejadian_kesaharian, "gambaran tempat kerja saat ini") dan Q3
-- (survey_q3_yang_ingin_diubah, "yang ingin diubah"), supaya kalimat unik seorang staf tidak
-- bisa dilacak balik ke orangnya oleh siapa pun yang kenal sekolahnya -- pola sama dengan
-- tema_esai (migration 20260724120000), kolom terpisah karena sumber pertanyaannya beda (Q2/Q3
-- murni, bukan gabungan Q3+Q5+Q6) dan bentuk keluarannya beda (dua daftar kalimat lepas, bukan
-- tema+ringkasan+jumlah_mention).

alter table public.briefing add column if not exists cerita_pegawai jsonb;
