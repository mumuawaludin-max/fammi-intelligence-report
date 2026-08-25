import { leadKategoriTone, protekKategoriTone } from "./lwMeta";

/**
 * lw.mock.js -- data CONTOH untuk pratinjau lepas-login (LwPreview.jsx), sama persis dengan
 * angka final Leadership & Wellbeing Assessment TK Negeri Pembina Kota Bandung (Dinas Pendidikan
 * Kota Bandung, periode Juli 2025) yang juga dipakai di migration seed Supabase -- lihat
 * supabase/migrations/20260803100000_lw_tables_and_seed.sql. Bukan data karangan.
 */
export const LW_LAPORAN_CONTOH = {
  meta: { organisasiNama: "TK Negeri Pembina Kota Bandung", periodeId: "2025-07", jumlahKandidat: 8 },
  briefing: {
    teks: "Dari 8 calon pemimpin yang dinilai di empat unit TK Negeri Pembina Kota Bandung, seluruhnya berada di kategori kesiapan memimpin Istimewa atau Sangat Baik, dengan kondisi psikologis aman di semua unit. Kekuatan utama ada pada orientasi terhadap siswa dan orang tua serta pengelolaan keuangan, sementara problem solving dan kepemimpinan digital masih perlu penguatan lebih lanjut. Empat program pengembangan prioritas sudah dirancang untuk menjawab celah tersebut.",
  },
  kesiapan: {
    distribusi: [
      { kategori: "Istimewa", persen: 50, jumlah: 4, toneVar: leadKategoriTone("Istimewa") },
      { kategori: "Sangat Baik", persen: 50, jumlah: 4, toneVar: leadKategoriTone("Sangat Baik") },
      { kategori: "Baik", persen: 0, jumlah: 0, toneVar: leadKategoriTone("Baik") },
      { kategori: "Cukup Baik", persen: 0, jumlah: 0, toneVar: leadKategoriTone("Cukup Baik") },
      { kategori: "Perlu Penguatan", persen: 0, jumlah: 0, toneVar: leadKategoriTone("Perlu Penguatan") },
    ],
    aspek: [
      { kode: "L", label: "Leadership & Innovation", nilai: 76.9 },
      { kode: "E", label: "External Collaboration", nilai: 78.3 },
      { kode: "A", label: "Administrative Excellence", nilai: 84.0 },
      { kode: "D", label: "Dedication to Growth", nilai: 80.5 },
    ],
    topSkill: [
      { indikator: "Berorientasi pada Siswa dan Orangtua", nilai: 92.6 },
      { indikator: "Manajemen Keuangan", nilai: 92.6 },
      { indikator: "Empati", nilai: 90.0 },
      { indikator: "Adaptif", nilai: 87.6 },
      { indikator: "Kolaboratif (Internal)", nilai: 87.6 },
    ],
    skillGap: [
      { indikator: "Problem Solving", nilai: 47.6 },
      { indikator: "Inovatif", nilai: 75.0 },
      { indikator: "Kepemimpinan Digital", nilai: 77.6 },
    ],
    kandidat: [
      { id: "nenden-teja", nama: "Nenden Teja", unit: "TKN Pembina Citarip", isKepsek: false, kesiapanSkor: 90, kesiapanKategori: "Istimewa", kondisiSkor: 247, kondisiKategori: "Baik" },
      { id: "ani-yuliani", nama: "Ani Yuliani", unit: "TKN Pembina Sadang Serang", isKepsek: false, kesiapanSkor: 84, kesiapanKategori: "Istimewa", kondisiSkor: 188, kondisiKategori: "Baik" },
      { id: "dewi-rosmawati", nama: "Dewi Rosmawati, S.Pd.AUD", unit: "TKN Centeh", isKepsek: true, kesiapanSkor: 83, kesiapanKategori: "Istimewa", kondisiSkor: 204, kondisiKategori: "Baik" },
      { id: "nenden-susilowati", nama: "Nenden Susilowati, M.Pd", unit: "TKN 04 Batununggal", isKepsek: true, kesiapanSkor: 83, kesiapanKategori: "Istimewa", kondisiSkor: 237, kondisiKategori: "Baik" },
      { id: "siti-sutini", nama: "Siti Sutini, S.Pd. AUD, M.Pd", unit: "TKN 04 Batununggal", isKepsek: false, kesiapanSkor: 80, kesiapanKategori: "Sangat Baik", kondisiSkor: 223, kondisiKategori: "Baik" },
      { id: "siti-romadoh", nama: "Siti Romadoh", unit: "TKN Pembina Citarip", isKepsek: true, kesiapanSkor: 76, kesiapanKategori: "Sangat Baik", kondisiSkor: 239, kondisiKategori: "Baik" },
      { id: "tita-ariyanti", nama: "Tita Ariyanti", unit: "TKN Pembina Sadang Serang", isKepsek: true, kesiapanSkor: 73, kesiapanKategori: "Sangat Baik", kondisiSkor: 185, kondisiKategori: "Baik" },
      { id: "siti-maesaroh", nama: "Siti Maesaroh, S.Pd", unit: "TKN Centeh", isKepsek: false, kesiapanSkor: 70, kesiapanKategori: "Sangat Baik", kondisiSkor: 205, kondisiKategori: "Baik" },
    ],
  },
  kesehatan: {
    distribusi: [
      { kategori: "Baik", persen: 100, jumlah: 8, toneVar: protekKategoriTone("Baik") },
      { kategori: "Perlu Perhatian", persen: 0, jumlah: 0, toneVar: protekKategoriTone("Perlu Perhatian") },
      { kategori: "Waspada", persen: 0, jumlah: 0, toneVar: protekKategoriTone("Waspada") },
      { kategori: "Perlu Konsultasi", persen: 0, jumlah: 0, toneVar: protekKategoriTone("Perlu Konsultasi") },
    ],
    dimensi: [
      { kode: "P", label: "Penerimaan Diri", nilai: 35.3 },
      { kode: "R", label: "Relasi Positif dengan Orang Lain", nilai: 38.1 },
      { kode: "O", label: "Optimalisasi Potensi Diri", nilai: 37.9 },
      { kode: "T", label: "Tujuan Hidup", nilai: 35.8 },
      { kode: "E", label: "Eksplorasi Lingkungan", nilai: 36.5 },
      { kode: "K", label: "Kemandirian", nilai: 32.5 },
    ],
    perbandingan: [
      { key: "P", label: "Penerimaan Diri", baikPersen: 75, baikJumlah: 6, perluPerhatianPersen: 25, perluPerhatianJumlah: 2, waspadaPersen: 0, waspadaJumlah: 0 },
      { key: "R", label: "Relasi Positif dengan Orang Lain", baikPersen: 100, baikJumlah: 8, perluPerhatianPersen: 0, perluPerhatianJumlah: 0, waspadaPersen: 0, waspadaJumlah: 0 },
      { key: "O", label: "Optimalisasi Potensi Diri", baikPersen: 100, baikJumlah: 8, perluPerhatianPersen: 0, perluPerhatianJumlah: 0, waspadaPersen: 0, waspadaJumlah: 0 },
      { key: "T", label: "Tujuan Hidup", baikPersen: 100, baikJumlah: 8, perluPerhatianPersen: 0, perluPerhatianJumlah: 0, waspadaPersen: 0, waspadaJumlah: 0 },
      { key: "E", label: "Eksplorasi Lingkungan", baikPersen: 87, baikJumlah: 7, perluPerhatianPersen: 13, perluPerhatianJumlah: 1, waspadaPersen: 0, waspadaJumlah: 0 },
      { key: "K", label: "Kemandirian", baikPersen: 75, baikJumlah: 6, perluPerhatianPersen: 25, perluPerhatianJumlah: 2, waspadaPersen: 0, waspadaJumlah: 0 },
    ],
    temuanSpesifik: [
      { dimensi: "Penerimaan Diri", temuan: [
        { pernyataan: "Sikap terhadap diri sendiri cenderung lebih negatif dari kebanyakan orang.", persen: 25, jumlah: 2 },
        { pernyataan: "Tidak menyukai sebagian besar kepribadian diri sendiri.", persen: 13, jumlah: 1 },
        { pernyataan: "Tidak nyaman dengan diri sendiri saat dibandingkan dengan orang lain.", persen: 13, jumlah: 1 },
      ] },
      { dimensi: "Relasi Positif dengan Orang Lain", temuan: [] },
      { dimensi: "Optimalisasi Potensi Diri", temuan: [] },
      { dimensi: "Tujuan Hidup", temuan: [
        { pernyataan: "Sering merasa tidak ada lagi yang perlu dilakukan dalam hidup.", persen: 63, jumlah: 5 },
      ] },
      { dimensi: "Eksplorasi Lingkungan", temuan: [
        { pernyataan: "Kesulitan mengatur hidup agar memuaskan diri sendiri.", persen: 13, jumlah: 1 },
        { pernyataan: "Sering merasa terbebani oleh tanggung jawab yang dimiliki.", persen: 13, jumlah: 1 },
      ] },
      { dimensi: "Kemandirian", temuan: [
        { pernyataan: "Keputusan sering kali dipengaruhi oleh tindakan orang lain.", persen: 25, jumlah: 2 },
        { pernyataan: "Sering terpengaruh oleh orang-orang yang memiliki pendapat kuat.", persen: 13, jumlah: 1 },
        { pernyataan: "Menilai diri sendiri berdasarkan standar orang lain, bukan nilai pribadi.", persen: 13, jumlah: 1 },
      ] },
    ],
  },
  pengembangan: {
    pelatihan: [
      {
        key: "pelatihan-problem-solving", judul: "Pelatihan Creative Problem Solving & Decision Making", dimensi: "Problem Solving",
        teaser: "Teknik berpikir analitis & kreatif untuk menyelesaikan masalah, root cause analysis untuk kasus di sekolah, dan studi kasus keseharian guru TK.",
        mengapaData: "Menjawab gap terbesar organisasi: indikator Problem Solving rata-rata 47,60 dari 100, skor terendah di antara seluruh indikator LEAD.",
        learningOutcome: "Peserta mampu mengidentifikasi masalah, mencari akar penyebab, dan memilih solusi praktis yang bisa langsung diterapkan di kelas atau manajemen sekolah.",
      },
      {
        key: "pelatihan-design-thinking", judul: "Workshop Design Thinking for Educators", dimensi: "Inovatif",
        teaser: "Tahap empathize-define-ideate-prototype-test, mengembangkan ide kegiatan belajar yang seru dan bermakna, hingga menyusun kolaborasi antar guru untuk menciptakan inovasi.",
        mengapaData: "Menjawab gap indikator Inovatif, rata-rata organisasi 75,00 dari 100 -- salah satu dari tiga indikator yang paling perlu penguatan.",
        learningOutcome: "Peserta menghasilkan minimal 1 prototipe inovasi pembelajaran kegiatan sekolah yang siap diuji di semester berjalan.",
      },
      {
        key: "pelatihan-manajemen-risiko", judul: "Pelatihan Manajemen Risiko & Krisis Program Sekolah", dimensi: null,
        teaser: null,
        mengapaData: "Bagian dari salah satu indikator inti Leadership & Innovation (Manajemen Krisis dan Risiko).",
        learningOutcome: null,
        catatan: "Fokus materi dan learning outcome untuk program ini tidak terbaca bersih dari dokumen sumber (tata letak dua kolom PDF) -- perlu diverifikasi ulang ke berkas asli sebelum ditampilkan sebagai final.",
      },
      {
        key: "pelatihan-kepemimpinan-digital", judul: "Pelatihan Kepemimpinan Digital untuk Sekolah", dimensi: "Kepemimpinan Digital",
        teaser: null,
        mengapaData: "Menjawab gap indikator Kepemimpinan Digital, rata-rata organisasi 77,60 dari 100.",
        learningOutcome: "Peningkatan keterampilan kepala sekolah dan guru dalam menggunakan platform digital (WhatsApp Broadcast, Google Workspace, aplikasi penilaian, media sosial) untuk mendukung manajemen dan pembelajaran.",
        catatan: "Judul program ini tidak tertulis eksplisit di dokumen sumber (hilang akibat tata letak dua kolom); dirumuskan dari isi learning outcome-nya yang cocok dengan gap \"Kepemimpinan Digital\".",
      },
    ],
    cerita: [
      { key: "c1", tema: "Memimpin Tim Menghadapi Perubahan Besar", nama: "Nenden Susilowati, M.Pd", unit: "TKN 04 Batununggal",
        isi: "Dalam menghadapi perubahan besar di sekolah, kami selalu melakukan komunikasi dengan seluruh warga sekolah, dimulai dengan alasan dan tujuan perubahan itu sendiri, lalu membentuk tim perubahan bersama guru dan pendukung lainnya.",
        bulletPoin: ["Melakukan komunikasi dengan seluruh warga sekolah", "Membentuk tim perubahan bersama guru dan pendukung lainnya", "Memfasilitasi/mengikuti informasi dan pelatihan terkait perubahan", "Memonitor dan mengevaluasi perubahan yang terjadi", "Berkolaborasi agar perubahan sesuai yang diharapkan"] },
      { key: "c2", tema: "Melibatkan Siswa dan Orang Tua dalam Program Sekolah", nama: "Nenden Susilowati, M.Pd", unit: "TKN 04 Batununggal",
        isi: "Sekolah melibatkan siswa dan orang tua lewat forum komunikasi via WhatsApp dan parenting, kolaborasi kegiatan orang tua-anak seperti market day dan gebyar prasiaga, serta pelibatan orang tua sebagai guru inspiratif di kelas.", bulletPoin: [] },
      { key: "c3", tema: "Menciptakan Solusi Inovatif di Sekolah", nama: "Siti Sutini, S.Pd. AUD, M.Pd", unit: "TKN 04 Batununggal",
        isi: "Halaman samping sekolah yang tidak tertata diubah menjadi taman yang indah dan rapi atas ide yang disampaikan kepada Kepala Sekolah dan disetujui.", bulletPoin: [] },
      { key: "c4", tema: "Menciptakan Solusi Inovatif di Sekolah", nama: "Dewi Rosmawati, S.Pd.AUD", unit: "TKN Centeh",
        isi: "Saat pertama masuk sekolah baru, ditemukan pengaturan penganggaran yang belum transparan, sehingga dilakukan perubahan membuat laporan keuangan lebih transparan dengan strategi yang sudah terbukti di sekolah sebelumnya.", bulletPoin: [] },
      { key: "c5", tema: "Menciptakan Jalur Pertumbuhan SDM Jangka Panjang", nama: "Siti Romadoh", unit: "TKN Pembina Citarip",
        isi: "Saat jumlah guru berkurang karena P3K dan pensiun, seluruh guru berembuk mengikuti acara gugus 4 TK Negeri, saling melatih dan membagi tugas sehingga seluruh permasalahan tetap terselesaikan.", bulletPoin: [] },
      { key: "c6", tema: "Menciptakan Solusi Inovatif Lainnya di Sekolah", nama: "Siti Maesaroh, S.Pd", unit: "TKN Centeh",
        isi: "Sebagai guru inti, ilmu yang didapat diimplementasikan lewat RPP baru dan pembelajaran berdiferensiasi bersama seluruh guru, termasuk pengimbasan ke PAUD terdekat.", bulletPoin: [] },
      { key: "c7", tema: "Melibatkan Siswa dan Orang Tua dalam Program Sekolah", nama: "Tita Ariyanti", unit: "TKN Pembina Sadang Serang",
        isi: "Inisiatif program beasiswa dan pendidikan gratis mengurangi beban finansial orang tua sehingga anak lebih berfokus pada pembelajaran, sekaligus mendorong pemerataan pendidikan.", bulletPoin: [] },
      { key: "c8", tema: "Menghadapi Perubahan Besar di Sekolah", nama: "Dewi Rosmawati, S.Pd.AUD", unit: "TKN Centeh",
        isi: "Perencanaan perubahan dilakukan bersama seluruh PTK lewat komunikasi dan kolaborasi terbuka, keputusan diambil dari hasil kesepakatan, dengan pendekatan percakapan coaching yang terbukti berhasil.", bulletPoin: [] },
      { key: "c9", tema: "Mengambil Keputusan Sulit demi Integritas", nama: "Siti Romadoh", unit: "TKN Pembina Citarip",
        isi: "Saat pandemi Covid-19, pembelajaran dialihkan ke daring lewat Zoom, dengan sebagian kecil tatap muka terbatas dua kali seminggu agar tidak terjadi kerumunan.", bulletPoin: [] },
    ],
  },
  personalById: {
    "nenden-teja": {
      nama: "Nenden Teja", unit: "TKN Pembina Citarip", isKepsek: false,
      kesiapanSkor: 90, kesiapanKategori: "Istimewa", kondisiSkor: 247, kondisiKategori: "Baik", kondisiLabel: "Aman",
      leadAspek: [{ kode: "L", label: "Leadership & Innovation", nilai: 88 }, { kode: "E", label: "External Collaboration", nilai: 92 }, { kode: "A", label: "Administrative Excellence", nilai: 93 }, { kode: "D", label: "Dedication to Growth", nilai: 88 }],
      protekDimensi: [{ kode: "P", label: "Penerimaan Diri", nilai: 42, kategori: "Baik" }, { kode: "R", label: "Relasi Positif dengan Orang Lain", nilai: 42, kategori: "Baik" }, { kode: "O", label: "Optimalisasi Potensi Diri", nilai: 41, kategori: "Baik" }, { kode: "T", label: "Tujuan Hidup", nilai: 42, kategori: "Baik" }, { kode: "E", label: "Eksplorasi Lingkungan", nilai: 41, kategori: "Baik" }, { kode: "K", label: "Kemandirian", nilai: 39, kategori: "Baik" }],
      narasi: [
        { tema: "Kolaborasi dengan Siswa dan Orangtua", isi: "Selalu melibatkan anak dan orang tua dalam membuat kebijakan dan terbuka dalam menerima saran dan kritikan, serta senantiasa memotivasi orang tua untuk mau belajar dan berubah demi kepentingan perkembangan anak." },
        { tema: "Kemitraan Strategis Sekolah", isi: "Mengundang dan meminta mitra dari berbagai unsur untuk duduk bersama dan membuat MoU kerja sama untuk mendukung dan mewujudkan pendidikan yang baik dan memfasilitasi anak untuk tumbuh kembang dengan optimal." },
        { tema: "Pengalaman Mengelola Tim", isi: "Membuat RKAS sesuai kebutuhan dan menentukan skala prioritas untuk menentukan anggaran yang akan terserap, serta membuat jaringan partisipasi masyarakat agar ikut membantu dalam pemenuhan kebutuhan sekolah." },
        { tema: "Kepemimpinan di Masa Perubahan", isi: "Mengorganisir tim, mempelajari dan memahami akar permasalahan, membuka ruang diskusi untuk menemukan masalah dan menyelesaikan masalah berdasarkan argumen dan hipotesis di lapangan, lalu menentukan solusi." },
      ],
      ceritaTerbaik: [],
    },
    "ani-yuliani": {
      nama: "Ani Yuliani", unit: "TKN Pembina Sadang Serang", isKepsek: false,
      kesiapanSkor: 84, kesiapanKategori: "Istimewa", kondisiSkor: 188, kondisiKategori: "Baik", kondisiLabel: "Aman",
      leadAspek: [{ kode: "L", label: "Leadership & Innovation", nilai: 74 }, { kode: "E", label: "External Collaboration", nilai: 82 }, { kode: "A", label: "Administrative Excellence", nilai: 92 }, { kode: "D", label: "Dedication to Growth", nilai: 89 }],
      protekDimensi: [{ kode: "P", label: "Penerimaan Diri", nilai: 28, kategori: "Perlu Perhatian" }, { kode: "R", label: "Relasi Positif dengan Orang Lain", nilai: 33, kategori: "Baik" }, { kode: "O", label: "Optimalisasi Potensi Diri", nilai: 34, kategori: "Baik" }, { kode: "T", label: "Tujuan Hidup", nilai: 35, kategori: "Baik" }, { kode: "E", label: "Eksplorasi Lingkungan", nilai: 28, kategori: "Perlu Perhatian" }, { kode: "K", label: "Kemandirian", nilai: 30, kategori: "Baik" }],
      narasi: [
        { tema: "Pengalaman Mengelola Tim", isi: "Dapat dilakukan beberapa upaya seperti pelatihan dan pengembangan yang berkelanjutan, pemberian tugas sesuai keahlian, menciptakan lingkungan kerja yang positif, memberikan kesempatan untuk brainstorming, dan menerapkan sistem reward dan punishment yang adil." },
        { tema: "Menyelesaikan Masalah yang Pelik", isi: "Ketika ada permasalahan, kami diskusikan dulu dengan tim, keputusan diambil berdasarkan kesepakatan dan relevan." },
        { tema: "Inovasi yang Membawa Dampak Nyata", isi: "Membuat ide-ide dalam pembelajaran seperti media pembelajaran, biasanya juga berkolaborasi dengan guru/teman sejawat lainnya." },
        { tema: "Kepemimpinan di Masa Perubahan", isi: "Ketika dihadapkan pada perubahan, biasanya membutuhkan kombinasi strategi seperti komunikasi yang jelas dengan tim, pembentukan budaya positif, pendelegasian tugas yang tepat, serta pengembangan anggota tim, karena pemimpin yang baik harus mampu memotivasi dan menangani konflik secara efektif." },
      ],
      ceritaTerbaik: [],
    },
    "dewi-rosmawati": {
      nama: "Dewi Rosmawati, S.Pd.AUD", unit: "TKN Centeh", isKepsek: true,
      kesiapanSkor: 83, kesiapanKategori: "Istimewa", kondisiSkor: 204, kondisiKategori: "Baik", kondisiLabel: "Aman",
      leadAspek: [{ kode: "L", label: "Leadership & Innovation", nilai: 85 }, { kode: "E", label: "External Collaboration", nilai: 81 }, { kode: "A", label: "Administrative Excellence", nilai: 81 }, { kode: "D", label: "Dedication to Growth", nilai: 84 }],
      protekDimensi: [{ kode: "P", label: "Penerimaan Diri", nilai: 32, kategori: "Baik" }, { kode: "R", label: "Relasi Positif dengan Orang Lain", nilai: 35, kategori: "Baik" }, { kode: "O", label: "Optimalisasi Potensi Diri", nilai: 35, kategori: "Baik" }, { kode: "T", label: "Tujuan Hidup", nilai: 33, kategori: "Baik" }, { kode: "E", label: "Eksplorasi Lingkungan", nilai: 37, kategori: "Baik" }, { kode: "K", label: "Kemandirian", nilai: 32, kategori: "Baik" }],
      narasi: [
        { tema: "Kepemimpinan di Masa Perubahan", isi: "Melakukan perencanaan yang sesuai dengan perubahan di sekolah, dilakukan bersama-sama dengan seluruh PTK, berkomunikasi yang baik, berkolaborasi memberikan kesempatan kepada seluruh PTK untuk menyampaikan pendapatnya, lalu membuat keputusan dari hasil kesepakatan." },
        { tema: "Efisiensi Tanpa Mengorbankan Mutu", isi: "Melakukan identifikasi kebutuhan sekolah, membuat Rencana Anggaran Sekolah, dan melakukan penganggaran/pembelian sesuai rencana bersama guru, TU, dan operator." },
        { tema: "Kolaborasi dengan Siswa dan Orangtua", isi: "Mensosialisasikan program sekolah dan melibatkan orang tua dalam penutupan MPLS, peringatan HUT RI, dan kegiatan lain -- orang tua merasa dihargai dan pembentukan karakter anak dapat berlanjut di rumah." },
      ],
      ceritaTerbaik: [
        { judul: "Menciptakan Solusi Inovatif di Sekolah", isi: "Ketika pertama masuk sekolah baru, ditemukan pengaturan penganggaran yang belum tersusun transparan, sehingga dilakukan perubahan membuat laporan keuangan lebih transparan dengan strategi yang sudah terbukti di sekolah sebelumnya.", bulletPoin: [] },
        { judul: "Menghadapi Perubahan Besar di Sekolah", isi: "Perencanaan perubahan dilakukan bersama seluruh PTK lewat komunikasi dan kolaborasi terbuka, keputusan diambil dari hasil kesepakatan, dengan pendekatan percakapan coaching yang terbukti berhasil.", bulletPoin: [] },
      ],
    },
    "nenden-susilowati": {
      nama: "Nenden Susilowati, M.Pd", unit: "TKN 04 Batununggal", isKepsek: true,
      kesiapanSkor: 83, kesiapanKategori: "Istimewa", kondisiSkor: 237, kondisiKategori: "Baik", kondisiLabel: "Aman",
      leadAspek: [{ kode: "L", label: "Leadership & Innovation", nilai: 89 }, { kode: "E", label: "External Collaboration", nilai: 76 }, { kode: "A", label: "Administrative Excellence", nilai: 87 }, { kode: "D", label: "Dedication to Growth", nilai: 81 }],
      protekDimensi: [{ kode: "P", label: "Penerimaan Diri", nilai: 41, kategori: "Baik" }, { kode: "R", label: "Relasi Positif dengan Orang Lain", nilai: 35, kategori: "Baik" }, { kode: "O", label: "Optimalisasi Potensi Diri", nilai: 42, kategori: "Baik" }, { kode: "T", label: "Tujuan Hidup", nilai: 36, kategori: "Baik" }, { kode: "E", label: "Eksplorasi Lingkungan", nilai: 40, kategori: "Baik" }, { kode: "K", label: "Kemandirian", nilai: 38, kategori: "Baik" }],
      narasi: [
        { tema: "Kepemimpinan di Masa Perubahan", isi: "Selalu melakukan komunikasi dengan seluruh warga sekolah, dimulai dari alasan dan tujuan perubahan, membentuk tim perubahan bersama guru dan pendukung lainnya, dilakukan secara bertahap agar guru lebih memahami, serta terus memonitor dan merefleksikan perubahan yang terjadi." },
        { tema: "Keputusan Sulit demi Integritas", isi: "Keputusan sulit diambil ketika orang tua protes anaknya tidak dilibatkan dalam satu kegiatan prasiaga -- diberikan pengertian bahwa pelibatan dilakukan pembina dari luar, dan pihak sekolah tetap terbuka menerima kembali jika ingin bersekolah." },
        { tema: "Kolaborasi dengan Siswa dan Orangtua", isi: "Sekolah melibatkan siswa dan orang tua lewat forum komunikasi via WhatsApp dan parenting, kolaborasi kegiatan orang tua-anak seperti market day dan gebyar prasiaga, serta pelibatan orang tua sebagai guru inspiratif di kelas." },
      ],
      ceritaTerbaik: [
        { judul: "Memimpin Tim Menghadapi Perubahan Besar", isi: "Dalam menghadapi perubahan besar di sekolah, kami selalu melakukan komunikasi dengan seluruh warga sekolah, dimulai dengan alasan dan tujuan perubahan itu sendiri, lalu membentuk tim perubahan bersama guru dan pendukung lainnya.", bulletPoin: ["Melakukan komunikasi dengan seluruh warga sekolah", "Membentuk tim perubahan bersama guru dan pendukung lainnya", "Memfasilitasi/mengikuti informasi dan pelatihan terkait perubahan", "Memonitor dan mengevaluasi perubahan yang terjadi", "Berkolaborasi agar perubahan sesuai yang diharapkan"] },
        { judul: "Melibatkan Siswa dan Orang Tua dalam Program Sekolah", isi: "Sekolah melibatkan siswa dan orang tua lewat forum komunikasi via WhatsApp dan parenting, kolaborasi kegiatan orang tua-anak seperti market day dan gebyar prasiaga, serta pelibatan orang tua sebagai guru inspiratif di kelas.", bulletPoin: [] },
      ],
    },
    "siti-sutini": {
      nama: "Siti Sutini, S.Pd. AUD, M.Pd", unit: "TKN 04 Batununggal", isKepsek: false,
      kesiapanSkor: 80, kesiapanKategori: "Sangat Baik", kondisiSkor: 223, kondisiKategori: "Baik", kondisiLabel: "Aman",
      leadAspek: [{ kode: "L", label: "Leadership & Innovation", nilai: 71 }, { kode: "E", label: "External Collaboration", nilai: 71 }, { kode: "A", label: "Administrative Excellence", nilai: 91 }, { kode: "D", label: "Dedication to Growth", nilai: 87 }],
      protekDimensi: [{ kode: "P", label: "Penerimaan Diri", nilai: 39, kategori: "Baik" }, { kode: "R", label: "Relasi Positif dengan Orang Lain", nilai: 42, kategori: "Baik" }, { kode: "O", label: "Optimalisasi Potensi Diri", nilai: 39, kategori: "Baik" }, { kode: "T", label: "Tujuan Hidup", nilai: 35, kategori: "Baik" }, { kode: "E", label: "Eksplorasi Lingkungan", nilai: 35, kategori: "Baik" }, { kode: "K", label: "Kemandirian", nilai: 33, kategori: "Baik" }],
      narasi: [
        { tema: "Inovasi yang Membawa Dampak Nyata", isi: "Halaman samping sekolah yang tidak tertata diubah menjadi taman yang indah dan rapi atas ide yang disampaikan kepada Kepala Sekolah dan disetujui." },
        { tema: "Efisiensi Tanpa Mengorbankan Mutu", isi: "Membuat rencana anggaran sekolah berupa pendapatan dan pengeluaran, dengan prioritas pengeluaran dibagi ke beberapa unsur seperti kurikulum, APE, dan pemeliharaan sarana prasarana." },
        { tema: "Kolaborasi dengan Siswa dan Orangtua", isi: "Salah satu kegiatan P5 di bulan Ramadan yaitu berbagi sembako kepada anak yatim dan duafa, melibatkan siswa dan orang tua, menanamkan nilai moral agama." },
        { tema: "Keputusan Sulit demi Integritas", isi: "Keputusan sulit diambil saat mengingatkan guru yang sering datang terlambat, karena kedisiplinan guru berdampak terhadap siswa dan sekolah." },
      ],
      ceritaTerbaik: [
        { judul: "Menciptakan Solusi Inovatif di Sekolah", isi: "Halaman samping sekolah yang tidak tertata diubah menjadi taman yang indah dan rapi atas ide yang disampaikan kepada Kepala Sekolah dan disetujui.", bulletPoin: [] },
      ],
    },
    "siti-romadoh": {
      nama: "Siti Romadoh", unit: "TKN Pembina Citarip", isKepsek: true,
      kesiapanSkor: 76, kesiapanKategori: "Sangat Baik", kondisiSkor: 239, kondisiKategori: "Baik", kondisiLabel: "Aman",
      leadAspek: [{ kode: "L", label: "Leadership & Innovation", nilai: 74 }, { kode: "E", label: "External Collaboration", nilai: 79 }, { kode: "A", label: "Administrative Excellence", nilai: 80 }, { kode: "D", label: "Dedication to Growth", nilai: 70 }],
      protekDimensi: [{ kode: "P", label: "Penerimaan Diri", nilai: 41, kategori: "Baik" }, { kode: "R", label: "Relasi Positif dengan Orang Lain", nilai: 40, kategori: "Baik" }, { kode: "O", label: "Optimalisasi Potensi Diri", nilai: 41, kategori: "Baik" }, { kode: "T", label: "Tujuan Hidup", nilai: 41, kategori: "Baik" }, { kode: "E", label: "Eksplorasi Lingkungan", nilai: 41, kategori: "Baik" }, { kode: "K", label: "Kemandirian", nilai: 35, kategori: "Baik" }],
      narasi: [
        { tema: "Pengalaman Mengelola Tim", isi: "Melihat kemampuan guru masing-masing yang perlu ditingkatkan, memanggil narasumber untuk memberikan pembelajaran tambahan, dan melakukan kombel pada bagian yang dirasa masih kurang." },
        { tema: "Inovasi yang Membawa Dampak Nyata", isi: "Saat jumlah guru berkurang karena P3K dan pensiun, seluruh guru berembuk mengikuti acara gugus 4 TK Negeri, saling melatih dan membagi tugas sehingga seluruh permasalahan tetap terselesaikan." },
        { tema: "Efisiensi Tanpa Mengorbankan Mutu", isi: "Saat menerima anak yang tidak mampu, dilaksanakan subsidi silang agar kebutuhan anak tetap terserap sesuai kebutuhan tanpa menurunkan kualitas pembelajaran." },
        { tema: "Kepemimpinan di Masa Perubahan", isi: "Saat pandemi Covid-19, pembelajaran dialihkan ke daring lewat Zoom, dengan sebagian kecil tatap muka terbatas dua kali seminggu agar tidak terjadi kerumunan." },
      ],
      ceritaTerbaik: [
        { judul: "Menciptakan Jalur Pertumbuhan SDM Jangka Panjang", isi: "Saat jumlah guru berkurang karena P3K dan pensiun, seluruh guru berembuk mengikuti acara gugus 4 TK Negeri, saling melatih dan membagi tugas sehingga seluruh permasalahan tetap terselesaikan.", bulletPoin: [] },
        { judul: "Mengambil Keputusan Sulit demi Integritas", isi: "Saat pandemi Covid-19, pembelajaran dialihkan ke daring lewat Zoom, dengan sebagian kecil tatap muka terbatas dua kali seminggu agar tidak terjadi kerumunan.", bulletPoin: [] },
      ],
    },
    "tita-ariyanti": {
      nama: "Tita Ariyanti", unit: "TKN Pembina Sadang Serang", isKepsek: true,
      kesiapanSkor: 73, kesiapanKategori: "Sangat Baik", kondisiSkor: 185, kondisiKategori: "Baik", kondisiLabel: "Aman",
      leadAspek: [{ kode: "L", label: "Leadership & Innovation", nilai: 70 }, { kode: "E", label: "External Collaboration", nilai: 74 }, { kode: "A", label: "Administrative Excellence", nilai: 74 }, { kode: "D", label: "Dedication to Growth", nilai: 73 }],
      protekDimensi: [{ kode: "P", label: "Penerimaan Diri", nilai: 28, kategori: "Perlu Perhatian" }, { kode: "R", label: "Relasi Positif dengan Orang Lain", nilai: 36, kategori: "Baik" }, { kode: "O", label: "Optimalisasi Potensi Diri", nilai: 33, kategori: "Baik" }, { kode: "T", label: "Tujuan Hidup", nilai: 29, kategori: "Baik" }, { kode: "E", label: "Eksplorasi Lingkungan", nilai: 34, kategori: "Baik" }, { kode: "K", label: "Kemandirian", nilai: 25, kategori: "Perlu Perhatian" }],
      narasi: [
        { tema: "Inovasi yang Membawa Dampak Nyata", isi: "Menciptakan solusi inovatif lewat pendekatan yang lebih manusiawi dengan membuat analisa SWOT sehingga permasalahan yang harus diangkat menjadi lebih fokus dan terarah." },
        { tema: "Kemitraan Strategis Sekolah", isi: "Kemitraan parenting kesehatan gigi membuka wawasan anak sekaligus mendorong orang tua berkolaborasi lewat pemeriksaan gigi bersama." },
        { tema: "Kepemimpinan di Masa Perubahan", isi: "Memimpin tim sekolah menghadapi perubahan dimulai dari komunikasi yang jelas, membangun empati, menyusun strategi yang terencana dan terbuka, menyampaikan visi-misi yang jelas, menerima masukan tim, dan selalu melibatkan tim dalam setiap proses perubahan." },
        { tema: "Kolaborasi dengan Siswa dan Orangtua", isi: "Inisiatif program beasiswa dan pendidikan gratis mengurangi beban finansial orang tua sehingga anak lebih berfokus pada pembelajaran, sekaligus mendorong pemerataan pendidikan." },
      ],
      ceritaTerbaik: [
        { judul: "Melibatkan Siswa dan Orang Tua dalam Program Sekolah", isi: "Inisiatif program beasiswa dan pendidikan gratis mengurangi beban finansial orang tua sehingga anak lebih berfokus pada pembelajaran, sekaligus mendorong pemerataan pendidikan.", bulletPoin: [] },
      ],
    },
    "siti-maesaroh": {
      nama: "Siti Maesaroh, S.Pd", unit: "TKN Centeh", isKepsek: false,
      kesiapanSkor: 70, kesiapanKategori: "Sangat Baik", kondisiSkor: 205, kondisiKategori: "Baik", kondisiLabel: "Aman",
      leadAspek: [{ kode: "L", label: "Leadership & Innovation", nilai: 64 }, { kode: "E", label: "External Collaboration", nilai: 71 }, { kode: "A", label: "Administrative Excellence", nilai: 74 }, { kode: "D", label: "Dedication to Growth", nilai: 72 }],
      protekDimensi: [{ kode: "P", label: "Penerimaan Diri", nilai: 31, kategori: "Baik" }, { kode: "R", label: "Relasi Positif dengan Orang Lain", nilai: 37, kategori: "Baik" }, { kode: "O", label: "Optimalisasi Potensi Diri", nilai: 38, kategori: "Baik" }, { kode: "T", label: "Tujuan Hidup", nilai: 35, kategori: "Baik" }, { kode: "E", label: "Eksplorasi Lingkungan", nilai: 36, kategori: "Baik" }, { kode: "K", label: "Kemandirian", nilai: 28, kategori: "Perlu Perhatian" }],
      narasi: [
        { tema: "Kemitraan Strategis Sekolah", isi: "Kemitraan dengan Museum Geologi, pasar tradisional dan modern, serta stasiun kereta api dan pemadam kebakaran memperluas pengenalan anak terhadap lingkungan sekitar." },
        { tema: "Kolaborasi dengan Siswa dan Orangtua", isi: "Bekerja sama dengan orang tua dalam proses pembelajaran, misalnya tugas membawa benda sesuai huruf awalan supaya anak mengenal huruf tanpa drilling." },
        { tema: "Kepemimpinan di Masa Perubahan", isi: "Perubahan dari Kurikulum 13 ke Kurikulum Merdeka berhasil diimplementasikan dan dibagikan sebagai praktik baik ke PAUD terdekat dan IGTKI kecamatan." },
      ],
      ceritaTerbaik: [
        { judul: "Menciptakan Solusi Inovatif Lainnya di Sekolah", isi: "Sebagai guru inti, ilmu yang didapat diimplementasikan lewat RPP baru dan pembelajaran berdiferensiasi bersama seluruh guru, termasuk pengimbasan ke PAUD terdekat.", bulletPoin: [] },
      ],
    },
  },
};
