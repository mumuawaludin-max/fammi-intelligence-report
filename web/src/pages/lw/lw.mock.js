import { rakitLaporanLw } from "./lwAssembler";

/**
 * lw.mock.js -- data CONTOH (dummy) modul Wellbeing Guru untuk pratinjau lepas-login
 * (LwPreview.jsx, dibuka lewat ?preview=lw). Yayasan Pendidikan Fammi, 20 guru di empat
 * jenjang, tiga periode asesmen 2025. Angkanya sama persis dengan seed di
 * supabase/migrations/20260803100000_lw_tables_and_seed.sql -- keduanya lahir dari satu
 * generator, jadi pratinjau tidak pernah bisa berbeda dari produksi.
 *
 * Baris di bawah SENGAJA berbentuk baris mentah seperti hasil query Supabase, lalu dirakit
 * lewat rakitLaporanLw yang sama dengan jalur produksi. Ini bukan hasil asesmen sungguhan.
 */

const LEMBAGA_ROWS = [
  {"periode_id":"2025-01","unit":null,"jumlah_guru":20,"indeks":78.6,"protek_distribusi":[{"kategori":"Baik","jumlah":20,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}],"protek_dimensi":[{"kode":"P","nilai":31.85,"baik_jumlah":17,"baik_persen":85,"perlu_perhatian_jumlah":3,"perlu_perhatian_persen":15,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":34.75,"baik_jumlah":20,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":33.05,"baik_jumlah":19,"baik_persen":95,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":5,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":32,"baik_jumlah":18,"baik_persen":90,"perlu_perhatian_jumlah":2,"perlu_perhatian_persen":10,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":32.4,"baik_jumlah":17,"baik_persen":85,"perlu_perhatian_jumlah":3,"perlu_perhatian_persen":15,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":34,"baik_jumlah":19,"baik_persen":95,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":5,"waspada_jumlah":0,"waspada_persen":0}],"protek_temuan_spesifik":null,"narasi":null},
  {"periode_id":"2025-01","unit":"TK Fammi","jumlah_guru":5,"indeks":84.2,"protek_distribusi":[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}],"protek_dimensi":[{"kode":"P","nilai":34.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":36.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":35,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":34.2,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":35,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":37,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0}],"protek_temuan_spesifik":null,"narasi":null},
  {"periode_id":"2025-01","unit":"SD Fammi","jumlah_guru":5,"indeks":79.6,"protek_distribusi":[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}],"protek_dimensi":[{"kode":"P","nilai":32.2,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":35.2,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":33.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":33,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":32.6,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":34,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0}],"protek_temuan_spesifik":null,"narasi":null},
  {"periode_id":"2025-01","unit":"SMP Fammi","jumlah_guru":5,"indeks":73.6,"protek_distribusi":[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}],"protek_dimensi":[{"kode":"P","nilai":29.2,"baik_jumlah":3,"baik_persen":60,"perlu_perhatian_jumlah":2,"perlu_perhatian_persen":40,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":33.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":31,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":29.2,"baik_jumlah":3,"baik_persen":60,"perlu_perhatian_jumlah":2,"perlu_perhatian_persen":40,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":31,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":31.6,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0}],"protek_temuan_spesifik":null,"narasi":null},
  {"periode_id":"2025-01","unit":"SMA Fammi","jumlah_guru":5,"indeks":77,"protek_distribusi":[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}],"protek_dimensi":[{"kode":"P","nilai":31.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":33.8,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":32.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":31.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":31,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":33.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0}],"protek_temuan_spesifik":null,"narasi":null},
  {"periode_id":"2025-04","unit":null,"jumlah_guru":20,"indeks":79.8,"protek_distribusi":[{"kategori":"Baik","jumlah":20,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}],"protek_dimensi":[{"kode":"P","nilai":33.05,"baik_jumlah":17,"baik_persen":85,"perlu_perhatian_jumlah":3,"perlu_perhatian_persen":15,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":35.55,"baik_jumlah":20,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":34,"baik_jumlah":19,"baik_persen":95,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":5,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":33.4,"baik_jumlah":19,"baik_persen":95,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":5,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":32.35,"baik_jumlah":17,"baik_persen":85,"perlu_perhatian_jumlah":3,"perlu_perhatian_persen":15,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":32.7,"baik_jumlah":18,"baik_persen":90,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":5,"waspada_jumlah":1,"waspada_persen":5}],"protek_temuan_spesifik":null,"narasi":null},
  {"periode_id":"2025-04","unit":"TK Fammi","jumlah_guru":5,"indeks":85.2,"protek_distribusi":[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}],"protek_dimensi":[{"kode":"P","nilai":35.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":37.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":36,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":35.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":35,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":35.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0}],"protek_temuan_spesifik":null,"narasi":null},
  {"periode_id":"2025-04","unit":"SD Fammi","jumlah_guru":5,"indeks":80.6,"protek_distribusi":[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}],"protek_dimensi":[{"kode":"P","nilai":33.6,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":35.8,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":34.2,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":34.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":32.2,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":32.8,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0}],"protek_temuan_spesifik":null,"narasi":null},
  {"periode_id":"2025-04","unit":"SMP Fammi","jumlah_guru":5,"indeks":73.8,"protek_distribusi":[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}],"protek_dimensi":[{"kode":"P","nilai":30,"baik_jumlah":3,"baik_persen":60,"perlu_perhatian_jumlah":2,"perlu_perhatian_persen":40,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":33.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":31.6,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":30.4,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":30.6,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":29.8,"baik_jumlah":3,"baik_persen":60,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":1,"waspada_persen":20}],"protek_temuan_spesifik":null,"narasi":null},
  {"periode_id":"2025-04","unit":"SMA Fammi","jumlah_guru":5,"indeks":79.4,"protek_distribusi":[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}],"protek_dimensi":[{"kode":"P","nilai":33.2,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":35.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":34.2,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":33.2,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":31.6,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":32.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0}],"protek_temuan_spesifik":null,"narasi":null},
  {"periode_id":"2025-07","unit":null,"jumlah_guru":20,"indeks":80.7,"protek_distribusi":[{"kategori":"Baik","jumlah":19,"persen":95},{"kategori":"Perlu Perhatian","jumlah":1,"persen":5},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}],"protek_dimensi":[{"kode":"P","nilai":33.9,"baik_jumlah":17,"baik_persen":85,"perlu_perhatian_jumlah":2,"perlu_perhatian_persen":10,"waspada_jumlah":1,"waspada_persen":5},{"kode":"R","nilai":36.95,"baik_jumlah":20,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":35.2,"baik_jumlah":19,"baik_persen":95,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":5,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":33.3,"baik_jumlah":18,"baik_persen":90,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":5,"waspada_jumlah":1,"waspada_persen":5},{"kode":"E","nilai":33.4,"baik_jumlah":17,"baik_persen":85,"perlu_perhatian_jumlah":3,"perlu_perhatian_persen":15,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":30.55,"baik_jumlah":14,"baik_persen":70,"perlu_perhatian_jumlah":5,"perlu_perhatian_persen":25,"waspada_jumlah":1,"waspada_persen":5}],"protek_temuan_spesifik":[{"dimensi":"Kemandirian","pernyataan":"Keputusan sering menunggu arahan pimpinan sebelum berani diambil.","persen":30,"jumlah":6},{"dimensi":"Kemandirian","pernyataan":"Khawatir terhadap penilaian rekan kerja saat menyampaikan pendapat berbeda.","persen":25,"jumlah":5},{"dimensi":"Eksplorasi Lingkungan","pernyataan":"Sering merasa terbebani tanggung jawab administrasi di luar mengajar.","persen":25,"jumlah":5},{"dimensi":"Eksplorasi Lingkungan","pernyataan":"Kesulitan mengatur hidup agar memuaskan diri sendiri.","persen":10,"jumlah":2},{"dimensi":"Penerimaan Diri","pernyataan":"Merasa kurang puas dengan pencapaian diri selama menjadi pendidik.","persen":20,"jumlah":4},{"dimensi":"Penerimaan Diri","pernyataan":"Tidak nyaman saat membandingkan diri dengan rekan sejawat.","persen":15,"jumlah":3},{"dimensi":"Tujuan Hidup","pernyataan":"Merasa rutinitas mengajar berjalan tanpa arah pengembangan yang jelas.","persen":15,"jumlah":3},{"dimensi":"Optimalisasi Potensi","pernyataan":"Merasa tidak berkembang meski sudah lama mengajar.","persen":10,"jumlah":2}],"narasi":[{"judul":"Kemandirian bergerak berlawanan arah","isi":"Lima dimensi naik, satu turun, dan turunnya terjadi di kedua jeda antarperiode. Jumlah guru dengan Kemandirian di bawah Baik bertambah dari 1 orang di Januari menjadi 6 orang sekarang. Pola jawabannya seragam: keputusan ditahan sampai ada arahan pimpinan."},{"judul":"Tekanan menumpuk di satu jenjang","isi":"SMP menyumbang separuh kasus di bawah Baik meski jumlah gurunya sama dengan jenjang lain. Beban administrasi di luar mengajar disebut paling sering di sana."},{"judul":"SMA membuktikan intervensi berhasil","isi":"Naik 4,7 poin sejak Januari, kenaikan tertinggi di antara empat jenjang. Pendampingan mentor guru baru yang dijalankan di sana layak ditiru jenjang lain."}]},
  {"periode_id":"2025-07","unit":"TK Fammi","jumlah_guru":5,"indeks":86.1,"protek_distribusi":[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}],"protek_dimensi":[{"kode":"P","nilai":36.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":38.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":37,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":35.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":36,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":33.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0}],"protek_temuan_spesifik":null,"narasi":null},
  {"periode_id":"2025-07","unit":"SD Fammi","jumlah_guru":5,"indeks":81.5,"protek_distribusi":[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}],"protek_dimensi":[{"kode":"P","nilai":34.2,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":37.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":35.6,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":34.4,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":33.4,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":30.4,"baik_jumlah":3,"baik_persen":60,"perlu_perhatian_jumlah":2,"perlu_perhatian_persen":40,"waspada_jumlah":0,"waspada_persen":0}],"protek_temuan_spesifik":null,"narasi":null},
  {"periode_id":"2025-07","unit":"SMP Fammi","jumlah_guru":5,"indeks":73.4,"protek_distribusi":[{"kategori":"Baik","jumlah":4,"persen":80},{"kategori":"Perlu Perhatian","jumlah":1,"persen":20},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}],"protek_dimensi":[{"kode":"P","nilai":30.2,"baik_jumlah":3,"baik_persen":60,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":1,"waspada_persen":20},{"kode":"R","nilai":34.8,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":32.4,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":29.6,"baik_jumlah":3,"baik_persen":60,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":1,"waspada_persen":20},{"kode":"E","nilai":31,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":27,"baik_jumlah":2,"baik_persen":40,"perlu_perhatian_jumlah":2,"perlu_perhatian_persen":40,"waspada_jumlah":1,"waspada_persen":20}],"protek_temuan_spesifik":null,"narasi":null},
  {"periode_id":"2025-07","unit":"SMA Fammi","jumlah_guru":5,"indeks":81.7,"protek_distribusi":[{"kategori":"Baik","jumlah":5,"persen":100},{"kategori":"Perlu Perhatian","jumlah":0,"persen":0},{"kategori":"Waspada","jumlah":0,"persen":0},{"kategori":"Perlu Konsultasi","jumlah":0,"persen":0}],"protek_dimensi":[{"kode":"P","nilai":34.8,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"R","nilai":37,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"O","nilai":35.8,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"T","nilai":33.8,"baik_jumlah":5,"baik_persen":100,"perlu_perhatian_jumlah":0,"perlu_perhatian_persen":0,"waspada_jumlah":0,"waspada_persen":0},{"kode":"E","nilai":33.2,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0},{"kode":"K","nilai":31.2,"baik_jumlah":4,"baik_persen":80,"perlu_perhatian_jumlah":1,"perlu_perhatian_persen":20,"waspada_jumlah":0,"waspada_persen":0}],"protek_temuan_spesifik":null,"narasi":null},
];

const PERSONAL_ROWS = [
  {"periode_id":"2025-01","unit":"TK Fammi","nama":"Rina Kartika, S.Pd","is_kepsek_saat_ini":true,"skor_total":228,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":37,"kategori":"Baik"},{"kode":"R","nilai":39,"kategori":"Baik"},{"kode":"O","nilai":38,"kategori":"Baik"},{"kode":"T","nilai":37,"kategori":"Baik"},{"kode":"E","nilai":38,"kategori":"Baik"},{"kode":"K","nilai":39,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"TK Fammi","nama":"Rina Kartika, S.Pd","is_kepsek_saat_ini":true,"skor_total":231,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":38,"kategori":"Baik"},{"kode":"R","nilai":40,"kategori":"Baik"},{"kode":"O","nilai":39,"kategori":"Baik"},{"kode":"T","nilai":38,"kategori":"Baik"},{"kode":"E","nilai":38,"kategori":"Baik"},{"kode":"K","nilai":38,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"TK Fammi","nama":"Rina Kartika, S.Pd","is_kepsek_saat_ini":true,"skor_total":233,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":39,"kategori":"Baik"},{"kode":"R","nilai":41,"kategori":"Baik"},{"kode":"O","nilai":40,"kategori":"Baik"},{"kode":"T","nilai":38,"kategori":"Baik"},{"kode":"E","nilai":39,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]},
  {"periode_id":"2025-01","unit":"TK Fammi","nama":"Lina Marlina, S.Pd.AUD","is_kepsek_saat_ini":false,"skor_total":215,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":36,"kategori":"Baik"},{"kode":"K","nilai":37,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"TK Fammi","nama":"Lina Marlina, S.Pd.AUD","is_kepsek_saat_ini":false,"skor_total":218,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":36,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":37,"kategori":"Baik"},{"kode":"T","nilai":36,"kategori":"Baik"},{"kode":"E","nilai":36,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"TK Fammi","nama":"Lina Marlina, S.Pd.AUD","is_kepsek_saat_ini":false,"skor_total":221,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":37,"kategori":"Baik"},{"kode":"R","nilai":39,"kategori":"Baik"},{"kode":"O","nilai":38,"kategori":"Baik"},{"kode":"T","nilai":36,"kategori":"Baik"},{"kode":"E","nilai":37,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]},
  {"periode_id":"2025-01","unit":"TK Fammi","nama":"Dewi Lestari, S.Pd","is_kepsek_saat_ini":false,"skor_total":212,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":38,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"TK Fammi","nama":"Dewi Lestari, S.Pd","is_kepsek_saat_ini":false,"skor_total":214,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"TK Fammi","nama":"Dewi Lestari, S.Pd","is_kepsek_saat_ini":false,"skor_total":216,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":36,"kategori":"Baik"},{"kode":"R","nilai":38,"kategori":"Baik"},{"kode":"O","nilai":37,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":36,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]},
  {"periode_id":"2025-01","unit":"TK Fammi","nama":"Yuni Astuti, S.Pd.AUD","is_kepsek_saat_ini":false,"skor_total":206,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"TK Fammi","nama":"Yuni Astuti, S.Pd.AUD","is_kepsek_saat_ini":false,"skor_total":209,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"TK Fammi","nama":"Yuni Astuti, S.Pd.AUD","is_kepsek_saat_ini":false,"skor_total":211,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":38,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]},
  {"periode_id":"2025-01","unit":"TK Fammi","nama":"Ratna Sari, S.Pd","is_kepsek_saat_ini":false,"skor_total":200,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"TK Fammi","nama":"Ratna Sari, S.Pd","is_kepsek_saat_ini":false,"skor_total":202,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"TK Fammi","nama":"Ratna Sari, S.Pd","is_kepsek_saat_ini":false,"skor_total":204,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":31,"kategori":"Baik"}]},
  {"periode_id":"2025-01","unit":"SD Fammi","nama":"Ahmad Fauzi, M.Pd","is_kepsek_saat_ini":true,"skor_total":218,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":37,"kategori":"Baik"},{"kode":"K","nilai":38,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"SD Fammi","nama":"Ahmad Fauzi, M.Pd","is_kepsek_saat_ini":true,"skor_total":223,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":37,"kategori":"Baik"},{"kode":"R","nilai":38,"kategori":"Baik"},{"kode":"O","nilai":37,"kategori":"Baik"},{"kode":"T","nilai":37,"kategori":"Baik"},{"kode":"E","nilai":37,"kategori":"Baik"},{"kode":"K","nilai":37,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"SD Fammi","nama":"Ahmad Fauzi, M.Pd","is_kepsek_saat_ini":true,"skor_total":227,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":38,"kategori":"Baik"},{"kode":"R","nilai":40,"kategori":"Baik"},{"kode":"O","nilai":39,"kategori":"Baik"},{"kode":"T","nilai":37,"kategori":"Baik"},{"kode":"E","nilai":38,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]},
  {"periode_id":"2025-01","unit":"SD Fammi","nama":"Siti Nurhaliza, S.Pd","is_kepsek_saat_ini":false,"skor_total":206,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"SD Fammi","nama":"Siti Nurhaliza, S.Pd","is_kepsek_saat_ini":false,"skor_total":211,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":36,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"SD Fammi","nama":"Siti Nurhaliza, S.Pd","is_kepsek_saat_ini":false,"skor_total":216,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":36,"kategori":"Baik"},{"kode":"R","nilai":39,"kategori":"Baik"},{"kode":"O","nilai":37,"kategori":"Baik"},{"kode":"T","nilai":36,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]},
  {"periode_id":"2025-01","unit":"SD Fammi","nama":"Rahmat Hidayat, S.Pd","is_kepsek_saat_ini":false,"skor_total":200,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"SD Fammi","nama":"Rahmat Hidayat, S.Pd","is_kepsek_saat_ini":false,"skor_total":205,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"SD Fammi","nama":"Rahmat Hidayat, S.Pd","is_kepsek_saat_ini":false,"skor_total":210,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":38,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":32,"kategori":"Baik"}]},
  {"periode_id":"2025-01","unit":"SD Fammi","nama":"Budi Santoso, S.Pd","is_kepsek_saat_ini":false,"skor_total":196,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":30,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"SD Fammi","nama":"Budi Santoso, S.Pd","is_kepsek_saat_ini":false,"skor_total":197,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":29,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"SD Fammi","nama":"Budi Santoso, S.Pd","is_kepsek_saat_ini":false,"skor_total":197,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":26,"kategori":"Perlu Perhatian"}]},
  {"periode_id":"2025-01","unit":"SD Fammi","nama":"Dewi Anggraini, S.Pd","is_kepsek_saat_ini":false,"skor_total":183,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":30,"kategori":"Baik"},{"kode":"E","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":31,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"SD Fammi","nama":"Dewi Anggraini, S.Pd","is_kepsek_saat_ini":false,"skor_total":180,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":33,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":31,"kategori":"Baik"},{"kode":"E","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":29,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"SD Fammi","nama":"Dewi Anggraini, S.Pd","is_kepsek_saat_ini":false,"skor_total":177,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":30,"kategori":"Baik"},{"kode":"E","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":26,"kategori":"Perlu Perhatian"}]},
  {"periode_id":"2025-01","unit":"SMP Fammi","nama":"Hendra Gunawan, M.Pd","is_kepsek_saat_ini":true,"skor_total":208,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"SMP Fammi","nama":"Hendra Gunawan, M.Pd","is_kepsek_saat_ini":true,"skor_total":212,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"SMP Fammi","nama":"Hendra Gunawan, M.Pd","is_kepsek_saat_ini":true,"skor_total":216,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":36,"kategori":"Baik"},{"kode":"R","nilai":39,"kategori":"Baik"},{"kode":"O","nilai":37,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":36,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]},
  {"periode_id":"2025-01","unit":"SMP Fammi","nama":"Maya Puspita, M.Pd","is_kepsek_saat_ini":false,"skor_total":196,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":31,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"SMP Fammi","nama":"Maya Puspita, M.Pd","is_kepsek_saat_ini":false,"skor_total":200,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"SMP Fammi","nama":"Maya Puspita, M.Pd","is_kepsek_saat_ini":false,"skor_total":204,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":31,"kategori":"Baik"}]},
  {"periode_id":"2025-01","unit":"SMP Fammi","nama":"Citra Ayu, S.Pd","is_kepsek_saat_ini":false,"skor_total":190,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":31,"kategori":"Baik"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"SMP Fammi","nama":"Citra Ayu, S.Pd","is_kepsek_saat_ini":false,"skor_total":191,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":29,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":31,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"SMP Fammi","nama":"Citra Ayu, S.Pd","is_kepsek_saat_ini":false,"skor_total":188,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":28,"kategori":"Perlu Perhatian"}]},
  {"periode_id":"2025-01","unit":"SMP Fammi","nama":"Andi Prasetyo, S.Pd","is_kepsek_saat_ini":false,"skor_total":181,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":26,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":33,"kategori":"Baik"},{"kode":"O","nilai":31,"kategori":"Baik"},{"kode":"T","nilai":31,"kategori":"Baik"},{"kode":"E","nilai":30,"kategori":"Baik"},{"kode":"K","nilai":30,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"SMP Fammi","nama":"Andi Prasetyo, S.Pd","is_kepsek_saat_ini":false,"skor_total":182,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":33,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":32,"kategori":"Baik"},{"kode":"E","nilai":30,"kategori":"Baik"},{"kode":"K","nilai":28,"kategori":"Perlu Perhatian"}]},
  {"periode_id":"2025-07","unit":"SMP Fammi","nama":"Andi Prasetyo, S.Pd","is_kepsek_saat_ini":false,"skor_total":179,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":31,"kategori":"Baik"},{"kode":"E","nilai":30,"kategori":"Baik"},{"kode":"K","nilai":25,"kategori":"Perlu Perhatian"}]},
  {"periode_id":"2025-01","unit":"SMP Fammi","nama":"Sari Wulandari, S.Pd","is_kepsek_saat_ini":false,"skor_total":152,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":23,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":30,"kategori":"Baik"},{"kode":"O","nilai":26,"kategori":"Perlu Perhatian"},{"kode":"T","nilai":23,"kategori":"Perlu Perhatian"},{"kode":"E","nilai":25,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":25,"kategori":"Perlu Perhatian"}]},
  {"periode_id":"2025-04","unit":"SMP Fammi","nama":"Sari Wulandari, S.Pd","is_kepsek_saat_ini":false,"skor_total":145,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":23,"kategori":"Perlu Perhatian"},{"kode":"R","nilai":29,"kategori":"Baik"},{"kode":"O","nilai":25,"kategori":"Perlu Perhatian"},{"kode":"T","nilai":23,"kategori":"Perlu Perhatian"},{"kode":"E","nilai":23,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":22,"kategori":"Waspada"}]},
  {"periode_id":"2025-07","unit":"SMP Fammi","nama":"Sari Wulandari, S.Pd","is_kepsek_saat_ini":false,"skor_total":138,"kategori_total":"Perlu Perhatian","protek_dimensi":[{"kode":"P","nilai":22,"kategori":"Waspada"},{"kode":"R","nilai":29,"kategori":"Baik"},{"kode":"O","nilai":25,"kategori":"Perlu Perhatian"},{"kode":"T","nilai":21,"kategori":"Waspada"},{"kode":"E","nilai":23,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":18,"kategori":"Waspada"}]},
  {"periode_id":"2025-01","unit":"SMA Fammi","nama":"Bambang Wijaya, M.Pd","is_kepsek_saat_ini":true,"skor_total":205,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":36,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"SMA Fammi","nama":"Bambang Wijaya, M.Pd","is_kepsek_saat_ini":true,"skor_total":213,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":35,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"SMA Fammi","nama":"Bambang Wijaya, M.Pd","is_kepsek_saat_ini":true,"skor_total":221,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":37,"kategori":"Baik"},{"kode":"R","nilai":39,"kategori":"Baik"},{"kode":"O","nilai":38,"kategori":"Baik"},{"kode":"T","nilai":36,"kategori":"Baik"},{"kode":"E","nilai":37,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]},
  {"periode_id":"2025-01","unit":"SMA Fammi","nama":"Indah Permatasari, S.Pd","is_kepsek_saat_ini":false,"skor_total":197,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":32,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"SMA Fammi","nama":"Indah Permatasari, S.Pd","is_kepsek_saat_ini":false,"skor_total":206,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":34,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"SMA Fammi","nama":"Indah Permatasari, S.Pd","is_kepsek_saat_ini":false,"skor_total":214,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":36,"kategori":"Baik"},{"kode":"R","nilai":38,"kategori":"Baik"},{"kode":"O","nilai":37,"kategori":"Baik"},{"kode":"T","nilai":35,"kategori":"Baik"},{"kode":"E","nilai":35,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]},
  {"periode_id":"2025-01","unit":"SMA Fammi","nama":"Agus Setiawan, M.Pd","is_kepsek_saat_ini":false,"skor_total":191,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":31,"kategori":"Baik"},{"kode":"R","nilai":33,"kategori":"Baik"},{"kode":"O","nilai":32,"kategori":"Baik"},{"kode":"T","nilai":31,"kategori":"Baik"},{"kode":"E","nilai":31,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"SMA Fammi","nama":"Agus Setiawan, M.Pd","is_kepsek_saat_ini":false,"skor_total":200,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":33,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":34,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":32,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"SMA Fammi","nama":"Agus Setiawan, M.Pd","is_kepsek_saat_ini":false,"skor_total":208,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":35,"kategori":"Baik"},{"kode":"R","nilai":37,"kategori":"Baik"},{"kode":"O","nilai":36,"kategori":"Baik"},{"kode":"T","nilai":34,"kategori":"Baik"},{"kode":"E","nilai":34,"kategori":"Baik"},{"kode":"K","nilai":32,"kategori":"Baik"}]},
  {"periode_id":"2025-01","unit":"SMA Fammi","nama":"Nur Aini, S.Pd","is_kepsek_saat_ini":false,"skor_total":186,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":30,"kategori":"Baik"},{"kode":"R","nilai":32,"kategori":"Baik"},{"kode":"O","nilai":31,"kategori":"Baik"},{"kode":"T","nilai":30,"kategori":"Baik"},{"kode":"E","nilai":30,"kategori":"Baik"},{"kode":"K","nilai":33,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"SMA Fammi","nama":"Nur Aini, S.Pd","is_kepsek_saat_ini":false,"skor_total":194,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":34,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":32,"kategori":"Baik"},{"kode":"E","nilai":31,"kategori":"Baik"},{"kode":"K","nilai":32,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"SMA Fammi","nama":"Nur Aini, S.Pd","is_kepsek_saat_ini":false,"skor_total":202,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":34,"kategori":"Baik"},{"kode":"R","nilai":36,"kategori":"Baik"},{"kode":"O","nilai":35,"kategori":"Baik"},{"kode":"T","nilai":33,"kategori":"Baik"},{"kode":"E","nilai":33,"kategori":"Baik"},{"kode":"K","nilai":31,"kategori":"Baik"}]},
  {"periode_id":"2025-01","unit":"SMA Fammi","nama":"Fajar Ramadhan, S.Pd","is_kepsek_saat_ini":false,"skor_total":191,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":32,"kategori":"Baik"},{"kode":"E","nilai":28,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":31,"kategori":"Baik"}]},
  {"periode_id":"2025-04","unit":"SMA Fammi","nama":"Fajar Ramadhan, S.Pd","is_kepsek_saat_ini":false,"skor_total":188,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":32,"kategori":"Baik"},{"kode":"E","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":29,"kategori":"Baik"}]},
  {"periode_id":"2025-07","unit":"SMA Fammi","nama":"Fajar Ramadhan, S.Pd","is_kepsek_saat_ini":false,"skor_total":184,"kategori_total":"Baik","protek_dimensi":[{"kode":"P","nilai":32,"kategori":"Baik"},{"kode":"R","nilai":35,"kategori":"Baik"},{"kode":"O","nilai":33,"kategori":"Baik"},{"kode":"T","nilai":31,"kategori":"Baik"},{"kode":"E","nilai":27,"kategori":"Perlu Perhatian"},{"kode":"K","nilai":26,"kategori":"Perlu Perhatian"}]},
];

/** Catatan pendampingan, langkah, dan refleksi untuk periode terakhir. */
const DETAIL = {
  "Sari Wulandari, S.Pd": {
    "catatan": "Satu-satunya guru dengan skor total di bawah ambang Baik, dan turun di setiap periode. Lima dari enam dimensi berada di bawah Baik, tiga di antaranya masuk Waspada: Penerimaan Diri, Tujuan Hidup, dan Kemandirian. Beban rangkap mengajar dan administrasi kurikulum muncul konsisten di jawaban terbukanya. Ini kasus yang perlu percakapan pribadi dalam dua pekan ini, bukan program kelompok.",
    "langkah": [
      "Kepala sekolah menjadwalkan percakapan pribadi dalam dua pekan ini, fokus mendengarkan beban kerja, bukan mengevaluasi kinerja.",
      "Tinjau ulang rangkap tugas administrasi kurikulum: pilih minimal satu tanggung jawab untuk dialihkan atau digilir.",
      "Tawarkan sesi konsultasi dengan psikolog Fammi, dengan penekanan bahwa ini hak dukungan, bukan sanksi."
    ],
    "refleksi": [
      {
        "tema": "Mengelola beban",
        "isi": "Mengajar sambil merangkap tugas administrasi kurikulum. Saya sedang belajar memilah mana yang sebenarnya bisa didelegasikan, tapi belum menemukan waktu untuk membicarakannya."
      },
      {
        "tema": "Harapan pada sekolah",
        "isi": "Ingin ada kejelasan pembagian tugas di awal semester supaya tidak menumpuk di tengah jalan."
      }
    ]
  },
  "Dewi Anggraini, S.Pd": {
    "catatan": "Skor total masih Baik, tetapi turun perlahan tiga periode berturut-turut. Tiga dimensi berada di bawah Baik: Penerimaan Diri, Eksplorasi Lingkungan, dan Kemandirian. Polanya mirip rekan-rekan di SD, jadi bisa ditangani lewat program kelompok sambil tetap dipantau perorangan.",
    "langkah": [
      "Ikutkan pada program pendampingan kemandirian yang sedang disiapkan yayasan.",
      "Wali kelas paralel diminta berbagi cara menangani kelas besar, agar beban terasa lebih ringan.",
      "Pantau ulang pada asesmen berikutnya; bila masih turun, naikkan ke kelompok dukungan segera."
    ],
    "refleksi": [
      {
        "tema": "Mengelola kelas",
        "isi": "Menangani kelas besar dengan rotasi kelompok belajar supaya tiap anak tetap mendapat perhatian, walaupun persiapannya memakan waktu di luar jam sekolah."
      },
      {
        "tema": "Harapan pada sekolah",
        "isi": "Semoga ada tambahan pendamping untuk kelas dengan jumlah murid paling banyak."
      }
    ]
  },
  "Fajar Ramadhan, S.Pd": {
    "catatan": "Satu-satunya guru SMA yang skornya menurun, sementara jenjangnya justru naik paling tinggi. Dua dimensi di bawah Baik, keduanya berkaitan dengan penataan beban: Eksplorasi Lingkungan dan Kemandirian. Rangkap peran wali kelas dan pembina ekskul patut ditinjau.",
    "langkah": [
      "Tinjau rangkap peran wali kelas dan pembina ekskul untuk semester berikutnya.",
      "Libatkan dalam observasi kelas dua arah yang sudah berjalan di SMA sebagai penerima pendampingan.",
      "Beri satu keputusan pembinaan ekskul yang sepenuhnya jadi wewenangnya, untuk melatih kemandirian."
    ],
    "refleksi": [
      {
        "tema": "Menyeimbangkan peran",
        "isi": "Menyeimbangkan tugas wali kelas dan pembina ekskul. Sedang menata ulang prioritas supaya keduanya tidak saling mengorbankan."
      },
      {
        "tema": "Harapan pada sekolah",
        "isi": "Butuh kejelasan sampai mana keputusan ekskul boleh saya ambil sendiri."
      }
    ]
  },
  "Citra Ayu, S.Pd": {
    "catatan": "Kondisi keseluruhan Baik dan relatif datar. Dua dimensi tepat di bawah ambang Baik: Tujuan Hidup dan Kemandirian, keduanya di angka 28. Karena selisihnya tipis, percakapan pengembangan karier biasanya cukup untuk mengangkatnya kembali.",
    "langkah": [
      "Jadwalkan percakapan pengembangan karier: ke mana arah lima tahun ke depan di yayasan.",
      "Beri peran memimpin satu kegiatan lintas kelas untuk menumbuhkan rasa kepemilikan.",
      "Pantau pada asesmen berikutnya tanpa intervensi khusus lain."
    ],
    "refleksi": [
      {
        "tema": "Kolaborasi dengan orang tua",
        "isi": "Membuat grup diskusi orang tua per angkatan untuk menyalurkan aspirasi sebelum berubah jadi keluhan."
      },
      {
        "tema": "Harapan pada sekolah",
        "isi": "Ingin tahu jalur pengembangan karier guru di yayasan ini seperti apa."
      }
    ]
  },
  "Andi Prasetyo, S.Pd": {
    "catatan": "Skor total Baik dan stabil. Dua dimensi di bawah Baik: Penerimaan Diri dan Kemandirian, dengan Kemandirian yang paling rendah. Sama seperti mayoritas kasus Kemandirian di yayasan, akarnya ada pada kebiasaan menunggu arahan, bukan pada kemampuan.",
    "langkah": [
      "Sertakan pada program pendampingan kemandirian bersama lima rekan lain.",
      "Beri kewenangan penuh atas satu proyek pembelajaran berbasis lingkungan sekolah yang sudah ia rintis.",
      "Kepala sekolah memberi umpan balik positif secara spesifik, bukan umum, untuk menguatkan penerimaan diri."
    ],
    "refleksi": [
      {
        "tema": "Inovasi pembelajaran",
        "isi": "Memakai proyek sederhana berbasis lingkungan sekolah supaya siswa belajar IPA dari hal nyata."
      },
      {
        "tema": "Harapan pada sekolah",
        "isi": "Ingin lebih yakin bahwa keputusan yang saya ambil di kelas tidak akan dipertanyakan belakangan."
      }
    ]
  },
  "Budi Santoso, S.Pd": {
    "catatan": "Skor total Baik dan hampir tidak bergerak tiga periode. Satu dimensi di bawah Baik, yaitu Kemandirian. Karena hanya satu dimensi dan selisihnya tidak jauh, program kelompok sudah memadai.",
    "langkah": [
      "Sertakan pada program pendampingan kemandirian bersama rekan lain.",
      "Beri tanggung jawab penuh atas bank soal digital yang sudah ia rintis, termasuk keputusan teknisnya."
    ],
    "refleksi": [
      {
        "tema": "Inovasi pembelajaran",
        "isi": "Membuat bank soal digital sederhana yang bisa dipakai bergantian oleh semua guru kelas atas."
      }
    ]
  },
  "Rina Kartika, S.Pd": {
    "catatan": "Skor tertinggi di yayasan dan naik konsisten tiga periode. Seluruh dimensi berada di kategori Baik, dengan Relasi Positif hampir menyentuh nilai penuh. Unit yang dipimpinnya juga jenjang paling sehat, jadi cara kerjanya layak dijadikan rujukan bagi jenjang lain.",
    "langkah": [
      "Minta membagikan praktik penyambutan pagi dan forum orang tua ke jenjang lain.",
      "Jadikan mentor bagi kepala sekolah jenjang yang indeksnya belum bergerak.",
      "Jaga bebannya agar peran mentor tidak justru menurunkan kondisinya sendiri."
    ],
    "refleksi": [
      {
        "tema": "Memimpin perubahan",
        "isi": "Perubahan kurikulum dijalankan bertahap: sosialisasi ke guru dulu, lalu pendampingan mingguan, supaya tidak ada yang merasa ditinggal."
      },
      {
        "tema": "Kolaborasi dengan orang tua",
        "isi": "Forum orang tua bulanan dan kegiatan market day membuat orang tua terlibat langsung dalam pembelajaran anak."
      }
    ]
  },
  "Ahmad Fauzi, M.Pd": {
    "catatan": "Seluruh dimensi Baik dan naik konsisten. Sebagai kepala sekolah SD, komunitas belajar internal yang ia jalankan sejalan dengan kenaikan indeks jenjangnya.",
    "langkah": [
      "Lanjutkan komunitas belajar mingguan dan dokumentasikan agar bisa ditiru jenjang lain."
    ],
    "refleksi": [
      {
        "tema": "Memimpin perubahan",
        "isi": "Transisi ke Kurikulum Merdeka dikawal lewat komunitas belajar internal; guru saling berbagi praktik tiap Jumat."
      }
    ]
  },
  "Hendra Gunawan, M.Pd": {
    "catatan": "Seluruh dimensi Baik. Sebagai kepala sekolah SMP, ia memimpin jenjang dengan indeks terendah di yayasan, jadi dukungan untuk timnya perlu jadi perhatian bersama pengurus yayasan.",
    "langkah": [
      "Duduk bersama pengurus yayasan membahas beban administrasi di SMP sebelum menambah program baru.",
      "Terapkan satu keputusan operasional per pekan yang sepenuhnya diputuskan guru."
    ],
    "refleksi": [
      {
        "tema": "Memimpin perubahan",
        "isi": "Digitalisasi administrasi dimulai dari hal kecil: presensi dan jurnal kelas daring, sebelum masuk ke rapor digital."
      }
    ]
  },
  "Bambang Wijaya, M.Pd": {
    "catatan": "Seluruh dimensi Baik. Jenjang yang dipimpinnya naik 4,7 poin sejak Januari, kenaikan tertinggi di yayasan, bersamaan dengan berjalannya observasi kelas dua arah antarguru.",
    "langkah": [
      "Bagikan mekanisme observasi kelas dua arah ke SD dan SMP.",
      "Pastikan Fajar Ramadhan, satu-satunya guru SMA yang menurun, ikut mendapat pendampingan."
    ],
    "refleksi": [
      {
        "tema": "Kemitraan sekolah",
        "isi": "Menjalin kerja sama magang dengan dunia usaha lokal untuk memperluas ruang belajar siswa."
      }
    ]
  }
};

const REFLEKSI_SAJA = {
  "Lina Marlina, S.Pd.AUD": [
    {
      "tema": "Inovasi pembelajaran",
      "isi": "Membuat media belajar dari barang bekas bersama anak-anak, sekaligus mengenalkan konsep daur ulang sejak dini."
    }
  ],
  "Dewi Lestari, S.Pd": [
    {
      "tema": "Mengelola tim",
      "isi": "Berbagi tugas dengan rekan sejawat saat kegiatan besar sekolah supaya beban tidak menumpuk di satu orang."
    }
  ],
  "Yuni Astuti, S.Pd.AUD": [
    {
      "tema": "Kolaborasi dengan orang tua",
      "isi": "Melibatkan orang tua sebagai narasumber kelas sesuai profesi masing-masing."
    }
  ],
  "Ratna Sari, S.Pd": [
    {
      "tema": "Inovasi pembelajaran",
      "isi": "Mengubah sudut baca kelas menjadi area bermain literasi yang membuat anak lebih betah membaca."
    }
  ],
  "Siti Nurhaliza, S.Pd": [
    {
      "tema": "Mengelola tim",
      "isi": "Menjadi koordinator lomba antarkelas dan membagi peran panitia ke guru muda supaya regenerasi berjalan."
    }
  ],
  "Rahmat Hidayat, S.Pd": [
    {
      "tema": "Kolaborasi dengan orang tua",
      "isi": "Program sarapan literasi tiap pagi melibatkan orang tua sebagai pembaca tamu."
    }
  ],
  "Maya Puspita, M.Pd": [
    {
      "tema": "Mengelola tim",
      "isi": "Memimpin tim penyusun modul ajar lintas mapel dan menjaga tenggat lewat papan kerja bersama."
    }
  ],
  "Indah Permatasari, S.Pd": [
    {
      "tema": "Inovasi pembelajaran",
      "isi": "Kelas menulis opini yang hasilnya dimuat di media sekolah menumbuhkan kepercayaan diri siswa."
    }
  ],
  "Agus Setiawan, M.Pd": [
    {
      "tema": "Mengelola tim",
      "isi": "Menjadi mentor guru baru lewat observasi kelas dua arah, saling memberi umpan balik."
    }
  ],
  "Nur Aini, S.Pd": [
    {
      "tema": "Kolaborasi dengan orang tua",
      "isi": "Konsultasi rutin perencanaan studi lanjut bersama siswa dan orang tua kelas XII."
    }
  ]
};

const TINDAK_LANJUT = [
  {
    "id": "tl-kemandirian",
    "periode_id": "2025-07",
    "type": "perlu_perhatian",
    "dimensi": "Kemandirian",
    "title": "Ubah pola pengambilan keputusan di rapat sekolah",
    "teaser": "Beri satu keputusan operasional per pekan yang sepenuhnya diputuskan guru, lalu bahas hasilnya di rapat berikutnya tanpa dikoreksi pimpinan.",
    "mengapa_data": "Enam guru menahan keputusan sampai ada arahan pimpinan. Akarnya bukan pada guru, melainkan pada kebiasaan rapat yang selalu menunggu keputusan kepala sekolah.",
    "manfaat": {
      "waktu": "Mulai bulan ini",
      "sasaran": "6 guru",
      "learning_outcome": "Jumlah guru dengan Kemandirian di bawah Baik turun dari 6 menjadi maksimal 3 pada asesmen berikutnya."
    },
    "hal_diwaspadai": null
  },
  {
    "id": "tl-eksplorasi",
    "periode_id": "2025-07",
    "type": "perlu_perhatian",
    "dimensi": "Eksplorasi Lingkungan",
    "title": "Pangkas beban administrasi di luar mengajar",
    "teaser": "Petakan tugas administrasi yang bisa disatukan, digilir, atau dihapus sebelum menambah program pengembangan baru.",
    "mengapa_data": "Lima guru menyebut beban administrasi sebagai sumber tekanan utama, dan paling terasa di SMP yang indeksnya satu-satunya tidak membaik.",
    "manfaat": {
      "waktu": "Kuartal ini",
      "sasaran": "SMP lebih dulu",
      "learning_outcome": "Indeks jenjang SMP naik minimal 2 poin dan keluhan beban administrasi turun di bawah 15 persen responden."
    },
    "hal_diwaspadai": null
  },
  {
    "id": "tl-mentor",
    "periode_id": "2025-07",
    "type": "pertahankan",
    "dimensi": "Penguatan",
    "title": "Perluas pendampingan mentor ala SMA ke jenjang lain",
    "teaser": "Observasi kelas dua arah antarguru, dijalankan satu siklus penuh sebelum asesmen berikutnya.",
    "mengapa_data": "SMA naik 4,7 poin sejak Januari, tertinggi di antara semua jenjang, bersamaan dengan berjalannya observasi kelas dua arah. Pola yang sudah terbukti ini layak ditiru.",
    "manfaat": {
      "waktu": "Berkelanjutan",
      "sasaran": "SD dan SMP",
      "learning_outcome": "Dua jenjang menjalankan observasi kelas dua arah minimal satu siklus sebelum asesmen berikutnya."
    },
    "hal_diwaspadai": null
  }
];

const BRIEFING_ROWS = [{ periode_id: "2025-07", teks: "Wellbeing guru Yayasan Pendidikan Fammi naik 2,1 poin sejak Januari, dan 19 dari 20 guru berada pada kategori Baik. Yang perlu dibaca serius, Kemandirian bergerak ke arah sebaliknya: turun di kedua jeda antarperiode, dengan jumlah guru di bawah Baik bertambah dari 1 orang menjadi 6 orang. SMP juga satu-satunya jenjang yang belum ikut membaik, sementara SMA naik paling tinggi setelah menjalankan observasi kelas dua arah antarguru." }];

const personalLengkap = PERSONAL_ROWS.map((r, i) => {
  const detail = r.periode_id === "2025-07" ? DETAIL[r.nama] : null;
  return {
    id: `mock-${i}`,
    ...r,
    catatan: detail?.catatan || null,
    langkah: detail?.langkah || [],
    refleksi: detail?.refleksi || (r.periode_id === "2025-07" ? REFLEKSI_SAJA[r.nama] || [] : []),
  };
});

export const LW_LAPORAN_CONTOH = rakitLaporanLw({
  sekolahNama: "Yayasan Pendidikan Fammi",
  lembagaRows: LEMBAGA_ROWS,
  personalRows: personalLengkap,
  tlRows: TINDAK_LANJUT,
  briefingRows: BRIEFING_ROWS,
});
