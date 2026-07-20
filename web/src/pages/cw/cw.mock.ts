/**
 * Data dummy modul Corporate Culture & Wellbeing (CW). Konteksnya KORPORAT: satu perusahaan
 * dengan beberapa unit/divisi, respondennya karyawan -- bukan sekolah/guru/murid seperti tiga
 * modul FIR lainnya. Nama organisasi "PT Pertamina Hulu Energi" dipakai atas permintaan
 * eksplisit pemilik produk sebagai contoh yang lebih relevan (perusahaan energi/hulu migas)
 * daripada nama fiktif generik -- SEMUA ANGKA, NARASI, DAN STRUKTUR UNIT DI BAWAH TETAP REKAAN,
 * bukan data PHE sungguhan. SampleTag/badge "Contoh" wajib tetap tampil di UI selama data ini
 * yang dipakai.
 *
 * Nama subdimensi kesejahteraan dan istilah lain yang tidak disebut eksplisit pemilik produk
 * juga rekaan -- lihat catatan ASUMSI di cw.types.ts.
 */
import type { LaporanAgregatCW, LaporanIndividuCW } from "./cw.types";

const ORGANISASI_ID = "org-phe";
const ORGANISASI_NAMA = "PT Pertamina Hulu Energi (contoh)";
const PERIODE = "2026-07";

const DISCLAIMER_INDIVIDU =
  "Laporan ini adalah hasil pengolahan jawaban asesmen Anda dan bersifat rahasia. Gunakan sebagai bahan refleksi pribadi, bukan alat penilaian kinerja formal.";

/** Responden 1: profil budaya seimbang, kesejahteraan baik. Unit Eksplorasi & Produksi. */
const RESPONDEN_1: LaporanIndividuCW = {
  meta: {
    responden_id: "cw-kry-001",
    nama_responden: "Arum Kusuma",
    jabatan: "Reservoir Engineer",
    unit: "Eksplorasi & Produksi",
    organisasi_id: ORGANISASI_ID,
    periode_id: PERIODE,
  },
  header: {
    hook: "Anda melihat perusahaan ini sebagai tempat yang hangat dan terus bertumbuh.",
    sub_hook: "Profil budaya Anda condong ke arah kolaboratif dengan dorongan inovasi yang sehat.",
  },
  bagian_budaya: {
    narasi:
      "Persepsi Anda terhadap budaya perusahaan saat ini paling kuat di sisi Klan, menandakan Anda merasakan kedekatan dan rasa saling percaya di antara rekan satu tim lapangan. Harapan Anda ke depan tidak jauh berbeda, hanya ingin porsi Adhokrasi (ruang bereksperimen dengan pendekatan teknis baru) sedikit lebih besar.",
    chart_data: [
      { tipe: "Klan", saat_ini: 68, harapan: 72 },
      { tipe: "Adhokrasi", saat_ini: 54, harapan: 66 },
      { tipe: "Pasar", saat_ini: 41, harapan: 40 },
      { tipe: "Hierarki", saat_ini: 47, harapan: 42 },
    ],
    tabel_gap: [
      { label: "Klan", arah: "naik", nilai_gap: 4 },
      { label: "Adhokrasi", arah: "naik", nilai_gap: 12 },
      { label: "Pasar", arah: "tetap", nilai_gap: -1 },
      { label: "Hierarki", arah: "turun", nilai_gap: -5 },
    ],
  },
  bagian_kesejahteraan: {
    narasi:
      "Secara umum kondisi kesejahteraan Anda berada di kategori Tinggi. Dukungan rekan kerja jadi titik terkuat, sementara beban kerja masih dalam batas wajar meski sedikit lebih tinggi dari subdimensi lain -- wajar untuk pekerjaan lapangan yang padat jadwal.",
    indeks: 78,
    kategori: "Tinggi",
    chart_data: [
      { kode: "beban_kerja", label: "Beban Kerja", nilai: 66, kategori: "Sedang" },
      { kode: "dukungan_sosial", label: "Dukungan Rekan Kerja", nilai: 88, kategori: "Sangat Tinggi" },
      { kode: "keseimbangan_hidup", label: "Keseimbangan Hidup-Kerja", nilai: 74, kategori: "Tinggi" },
      { kode: "pengembangan_diri", label: "Pengembangan Karier", nilai: 82, kategori: "Sangat Tinggi" },
      { kode: "kepuasan_kerja", label: "Kepuasan Kerja", nilai: 80, kategori: "Tinggi" },
    ],
  },
  bagian_cermin:
    "Rekan-rekan melihat Anda sebagai sosok yang mudah diajak berdiskusi dan konsisten hadir saat tim butuh bantuan teknis. Kehangatan ini jadi salah satu perekat suasana kerja di unit Anda.",
  bagian_refleksi:
    "Apa satu hal kecil yang bisa Anda lakukan bulan ini supaya ruang mencoba pendekatan teknis baru terasa lebih terbuka di tim Anda?",
  rencana_aksi: [
    {
      id: "a1-adhokrasi",
      judul: "Ajukan satu ide teknis untuk diuji coba di forum tim.",
      alasan: "Harapan Anda pada ruang eksperimen 12 poin lebih tinggi dari kondisi sekarang. Memulai dari satu ide konkret lebih efektif daripada menunggu ruangnya dibuka lebih dulu.",
      terkait: "Adhokrasi",
      jangka: "Bulan ini",
      ikon: "💡",
    },
    {
      id: "a1-beban",
      judul: "Petakan ulang jadwal minggu tersibuk Anda.",
      alasan: "Beban kerja jadi subdimensi terendah Anda (66%) meski masih kategori Sedang. Memetakan lebih awal menjaga ini tidak turun saat jadwal lapangan menumpuk.",
      terkait: "Beban Kerja",
      jangka: "Minggu ini",
      ikon: "🗓️",
    },
    {
      id: "a1-mentor",
      judul: "Bagikan cara kerja Anda ke rekan yang lebih junior.",
      alasan: "Dukungan rekan kerja Anda sangat tinggi (88%). Kekuatan ini paling bernilai kalau ditularkan, bukan disimpan sendiri.",
      terkait: "Dukungan Rekan Kerja",
      jangka: "3 bulan",
      ikon: "🤝",
    },
  ],
  footer: { disclaimer: DISCLAIMER_INDIVIDU },
};

/** Responden 2: gap besar Hierarki tinggi vs harapan lebih kolaboratif, kesejahteraan sedang. Unit Keuangan & SDM Korporat. */
const RESPONDEN_2: LaporanIndividuCW = {
  meta: {
    responden_id: "cw-kry-002",
    nama_responden: "Bimo Prasetyo",
    jabatan: "Staf Keuangan Korporat",
    unit: "Keuangan & SDM Korporat",
    organisasi_id: ORGANISASI_ID,
    periode_id: PERIODE,
  },
  header: {
    hook: "Anda merasakan perusahaan ini masih banyak diatur oleh prosedur dan persetujuan berlapis.",
    sub_hook: "Harapan Anda condong pada suasana kerja yang lebih dekat dan saling mendukung.",
  },
  bagian_budaya: {
    narasi:
      "Persepsi Anda menunjukkan budaya saat ini didominasi Hierarki, banyak proses berjalan sesuai prosedur formal khas fungsi keuangan korporat. Namun harapan Anda bergeser cukup jauh ke arah Klan, menandakan keinginan akan suasana kerja yang lebih personal dan fleksibel.",
    chart_data: [
      { tipe: "Klan", saat_ini: 32, harapan: 60 },
      { tipe: "Adhokrasi", saat_ini: 28, harapan: 35 },
      { tipe: "Pasar", saat_ini: 38, harapan: 32 },
      { tipe: "Hierarki", saat_ini: 71, harapan: 48 },
    ],
    tabel_gap: [
      { label: "Klan", arah: "naik", nilai_gap: 28 },
      { label: "Adhokrasi", arah: "naik", nilai_gap: 7 },
      { label: "Pasar", arah: "turun", nilai_gap: -6 },
      { label: "Hierarki", arah: "turun", nilai_gap: -23 },
    ],
  },
  bagian_kesejahteraan: {
    narasi:
      "Kondisi kesejahteraan Anda berada di kategori Sedang. Beban kerja jadi subdimensi yang paling perlu diperhatikan, sementara kepuasan kerja masih relatif terjaga.",
    indeks: 58,
    kategori: "Sedang",
    chart_data: [
      { kode: "beban_kerja", label: "Beban Kerja", nilai: 39, kategori: "Rendah" },
      { kode: "dukungan_sosial", label: "Dukungan Rekan Kerja", nilai: 61, kategori: "Sedang" },
      { kode: "keseimbangan_hidup", label: "Keseimbangan Hidup-Kerja", nilai: 52, kategori: "Sedang" },
      { kode: "pengembangan_diri", label: "Pengembangan Karier", nilai: 55, kategori: "Sedang" },
      { kode: "kepuasan_kerja", label: "Kepuasan Kerja", nilai: 68, kategori: "Sedang" },
    ],
  },
  bagian_cermin:
    "Rekan kerja menilai Anda sebagai orang yang teliti dan bisa diandalkan untuk urusan administratif dan pelaporan, meski beberapa menyebut Anda jarang berbagi cerita di luar urusan pekerjaan.",
  bagian_refleksi:
    "Prosedur mana yang menurut Anda sudah tidak perlu terlalu berlapis, dan siapa satu rekan kerja yang bisa Anda ajak bicara lebih terbuka minggu ini?",
  rencana_aksi: [
    {
      id: "a2-klan",
      judul: "Jadwalkan satu obrolan santai dengan rekan di luar urusan pekerjaan.",
      alasan: "Selisih terbesar Anda ada di sisi kekeluargaan (28 poin). Kedekatan biasanya tumbuh dari percakapan kecil yang berulang, bukan dari acara besar sekali setahun.",
      terkait: "Klan",
      jangka: "Minggu ini",
      ikon: "☕",
    },
    {
      id: "a2-beban",
      judul: "Catat tiga tugas yang paling menyita waktu, lalu bicarakan dengan atasan.",
      alasan: "Beban kerja jadi subdimensi terendah Anda (39%, kategori Rendah). Data tertulis membuat pembicaraan soal beban lebih mudah ditindaklanjuti.",
      terkait: "Beban Kerja",
      jangka: "2 minggu",
      ikon: "📋",
    },
    {
      id: "a2-prosedur",
      judul: "Usulkan satu langkah persetujuan yang bisa disederhanakan.",
      alasan: "Anda merasakan prosedur berlapis paling kuat di antara semua tipe budaya (71%). Usulan spesifik dari orang yang menjalankannya biasanya paling didengar.",
      terkait: "Hierarki",
      jangka: "1 bulan",
      ikon: "✂️",
    },
  ],
  footer: { disclaimer: DISCLAIMER_INDIVIDU },
};

/** Responden 3: budaya Pasar/target produksi dominan, kesejahteraan paling perlu perhatian. Unit Teknik & Rekayasa. */
const RESPONDEN_3: LaporanIndividuCW = {
  meta: {
    responden_id: "cw-kry-003",
    nama_responden: "Citra Wulandari",
    jabatan: "Engineer Proyek Produksi",
    unit: "Teknik & Rekayasa",
    organisasi_id: ORGANISASI_ID,
    periode_id: PERIODE,
  },
  header: {
    hook: "Anda merasakan tekanan pencapaian target produksi menjadi warna utama keseharian kerja.",
    sub_hook: "Anda berharap ada ruang lebih besar untuk saling mendukung, bukan sekadar mengejar angka.",
  },
  bagian_budaya: {
    narasi:
      "Budaya yang Anda rasakan saat ini paling menonjol di sisi Pasar, dengan penekanan pada pencapaian target produksi dan hasil terukur. Harapan Anda relatif merata di semua tipe, dengan kenaikan paling terasa pada Klan.",
    chart_data: [
      { tipe: "Klan", saat_ini: 30, harapan: 52 },
      { tipe: "Adhokrasi", saat_ini: 40, harapan: 48 },
      { tipe: "Pasar", saat_ini: 74, harapan: 58 },
      { tipe: "Hierarki", saat_ini: 45, harapan: 40 },
    ],
    tabel_gap: [
      { label: "Klan", arah: "naik", nilai_gap: 22 },
      { label: "Adhokrasi", arah: "naik", nilai_gap: 8 },
      { label: "Pasar", arah: "turun", nilai_gap: -16 },
      { label: "Hierarki", arah: "turun", nilai_gap: -5 },
    ],
  },
  bagian_kesejahteraan: {
    narasi:
      "Indeks kesejahteraan Anda berada di kategori Rendah, terutama ditekan beban kerja dan keseimbangan hidup-kerja yang jadi dua subdimensi terlemah. Ini pola yang perlu jadi perhatian bersama, bukan cuma catatan pribadi.",
    indeks: 44,
    kategori: "Rendah",
    chart_data: [
      { kode: "beban_kerja", label: "Beban Kerja", nilai: 28, kategori: "Sangat Rendah" },
      { kode: "dukungan_sosial", label: "Dukungan Rekan Kerja", nilai: 50, kategori: "Sedang" },
      { kode: "keseimbangan_hidup", label: "Keseimbangan Hidup-Kerja", nilai: 33, kategori: "Rendah" },
      { kode: "pengembangan_diri", label: "Pengembangan Karier", nilai: 58, kategori: "Sedang" },
      { kode: "kepuasan_kerja", label: "Kepuasan Kerja", nilai: 51, kategori: "Sedang" },
    ],
  },
  bagian_cermin:
    "Rekan kerja mengagumi dedikasi Anda mengejar target proyek tim, namun beberapa juga khawatir Anda jarang terlihat benar-benar berhenti sejenak di sela jam kerja.",
  bagian_refleksi:
    "Kalau boleh menunda satu target minggu ini demi waktu istirahat yang cukup, target mana yang akan Anda pilih?",
  rencana_aksi: [
    {
      id: "a3-bicara",
      judul: "Bicarakan beban kerja Anda dengan atasan langsung minggu ini.",
      alasan: "Beban kerja Anda di 28% (Sangat Rendah) dan keseimbangan hidup-kerja 33%. Dua angka ini bersamaan adalah sinyal kelelahan kerja yang sebaiknya tidak ditunda.",
      terkait: "Beban Kerja",
      jangka: "Minggu ini",
      ikon: "🗣️",
    },
    {
      id: "a3-batas",
      judul: "Tetapkan satu batas waktu berhenti kerja, lalu patuhi selama dua minggu.",
      alasan: "Keseimbangan hidup-kerja Anda 33% (Rendah). Batas yang jelas dan konsisten lebih membantu daripada niat mengurangi jam kerja secara umum.",
      terkait: "Keseimbangan Hidup-Kerja",
      jangka: "2 minggu",
      ikon: "⏰",
    },
    {
      id: "a3-dukungan",
      judul: "Minta bantuan konkret ke satu rekan untuk tugas yang menumpuk.",
      alasan: "Dukungan rekan kerja Anda di 50% (Sedang), masih ada ruang untuk dimanfaatkan. Permintaan yang spesifik lebih mudah dipenuhi daripada keluhan umum.",
      terkait: "Dukungan Rekan Kerja",
      jangka: "Minggu ini",
      ikon: "🤝",
    },
    {
      id: "a3-jeda",
      judul: "Sisipkan jeda 15 menit tanpa layar di tengah hari kerja.",
      alasan: "Rekan kerja menyebut Anda jarang terlihat benar-benar berhenti. Jeda pendek yang rutin memulihkan fokus lebih baik daripada istirahat panjang sesekali.",
      terkait: "Kepuasan Kerja",
      jangka: "Mulai hari ini",
      ikon: "🌿",
    },
  ],
  footer: { disclaimer: DISCLAIMER_INDIVIDU },
};

export const MOCK_LAPORAN_INDIVIDU_CW: LaporanIndividuCW[] = [RESPONDEN_1, RESPONDEN_2, RESPONDEN_3];

/**
 * Data dummy laporan agregat/pimpinan, satu organisasi satu periode. Angka dibuat masuk akal
 * berdampingan dengan 3 responden di atas (indeks agregat 60, di antara 78/58/44), TAPI tidak
 * dihitung otomatis dari mereka -- ini dummy independen, bukan agregasi nyata.
 *
 * chart_data dan tabel_gap sengaja dijaga konsisten: selisih harapan - saat_ini tiap tipe sama
 * persis dengan nilai_gap, dan Klan dibuat tertinggi supaya cocok dengan narasi maupun stat tile
 * "Budaya Dominan" yang menghitung argmax saat_ini. Empat unit dipilih merepresentasikan
 * struktur umum perusahaan hulu migas: Eksplorasi & Produksi (operasi inti lapangan), Teknik &
 * Rekayasa (proyek/konstruksi), HSSE (Health, Safety, Security & Environment -- fungsi wajib di
 * industri migas), dan Keuangan & SDM Korporat.
 */
export const MOCK_LAPORAN_AGREGAT_CW: LaporanAgregatCW = {
  meta: {
    organisasi_id: ORGANISASI_ID,
    organisasi_nama: ORGANISASI_NAMA,
    periode_id: PERIODE,
    jumlah_responden: 142,
  },
  header: {
    hook: "Budaya kerja perusahaan Anda condong kolaboratif, tapi kesejahteraan tim Teknik & Rekayasa perlu perhatian.",
    sub_hook: "Ringkasan dari 142 karyawan lintas empat unit pada periode ini.",
  },
  bagian_budaya: {
    narasi:
      "Secara umum karyawan merasakan budaya Klan paling kuat, dengan harapan yang juga bergerak ke arah sana -- artinya arah yang diinginkan karyawan sudah sejalan dengan kondisi saat ini. Gap terbesar ada pada Adhokrasi: karyawan berharap ruang bereksperimen dan mencoba pendekatan teknis baru lebih terbuka dari kondisi sekarang.",
    chart_data: [
      { tipe: "Klan", saat_ini: 58, harapan: 67 },
      { tipe: "Adhokrasi", saat_ini: 41, harapan: 55 },
      { tipe: "Pasar", saat_ini: 46, harapan: 42 },
      { tipe: "Hierarki", saat_ini: 55, harapan: 47 },
    ],
    tabel_gap: [
      { label: "Klan", arah: "naik", nilai_gap: 9 },
      { label: "Adhokrasi", arah: "naik", nilai_gap: 14 },
      { label: "Pasar", arah: "turun", nilai_gap: -4 },
      { label: "Hierarki", arah: "turun", nilai_gap: -8 },
    ],
  },
  bagian_kesejahteraan: {
    narasi:
      "Indeks kesejahteraan gabungan berada di kategori Sedang. Dukungan antar rekan kerja jadi subdimensi terkuat, sementara beban kerja jadi titik yang paling perlu diperhatikan perusahaan secara keseluruhan.",
    indeks: 60,
    kategori: "Sedang",
    chart_data: [
      { kode: "beban_kerja", label: "Beban Kerja", nilai: 44, kategori: "Rendah" },
      { kode: "dukungan_sosial", label: "Dukungan Rekan Kerja", nilai: 72, kategori: "Tinggi" },
      { kode: "keseimbangan_hidup", label: "Keseimbangan Hidup-Kerja", nilai: 53, kategori: "Sedang" },
      { kode: "pengembangan_diri", label: "Pengembangan Karier", nilai: 65, kategori: "Sedang" },
      { kode: "kepuasan_kerja", label: "Kepuasan Kerja", nilai: 66, kategori: "Sedang" },
    ],
  },
  perbandingan_antarunit: {
    narasi:
      "Kesejahteraan paling tinggi dirasakan unit Eksplorasi & Produksi, menurun bertahap ke Teknik & Rekayasa. Budaya Klan mendominasi persepsi di Eksplorasi & Produksi dan Keuangan & SDM Korporat, HSSE condong ke budaya Hierarki yang wajar mengingat fungsinya seputar kepatuhan prosedur keselamatan, sementara Teknik & Rekayasa condong ke budaya Pasar yang berorientasi pencapaian target proyek.",
    rows: [
      { unit: "Eksplorasi & Produksi", jumlah_responden: 52, budaya_dominan: "Klan", indeks_kesejahteraan: 74, kategori_kesejahteraan: "Tinggi" },
      { unit: "Keuangan & SDM Korporat", jumlah_responden: 28, budaya_dominan: "Klan", indeks_kesejahteraan: 66, kategori_kesejahteraan: "Sedang" },
      { unit: "HSSE", jumlah_responden: 28, budaya_dominan: "Hierarki", indeks_kesejahteraan: 58, kategori_kesejahteraan: "Sedang" },
      { unit: "Teknik & Rekayasa", jumlah_responden: 34, budaya_dominan: "Pasar", indeks_kesejahteraan: 46, kategori_kesejahteraan: "Rendah" },
    ],
  },
  prioritas_perbaikan: [
    {
      peringkat: 1,
      action: "Tinjau ulang beban kerja dan target proyek tim Teknik & Rekayasa.",
      trigger_desc: "Indeks kesejahteraan unit ini paling rendah (46, kategori Rendah), ditekan subdimensi Beban Kerja.",
      area: "Beban Kerja · Teknik & Rekayasa",
      langkah: [
        "Audit beban kerja aktual vs kapasitas tim dalam 2 minggu ke depan.",
        "Evaluasi ulang linimasa proyek yang paling menekan, mana yang bisa direalokasi.",
        "Buka sesi dengar pendapat langsung dengan tim sebelum menetapkan solusi.",
      ],
      dampak: "Menurunkan risiko kelelahan kerja dan menjaga kualitas keselamatan proyek jangka panjang.",
    },
    {
      peringkat: 2,
      action: "Buka ruang eksperimen dan uji coba pendekatan teknis baru secara terjadwal, bukan insidental.",
      trigger_desc: "Gap Adhokrasi paling besar dari semua tipe budaya (+14 poin antara saat ini dan harapan).",
      area: "Adhokrasi · Seluruh unit",
      langkah: [
        "Alokasikan waktu rutin (mis. 1 hari per bulan) khusus untuk uji coba ide/metode baru.",
        "Buat jalur sederhana untuk karyawan mengajukan ide tanpa birokrasi panjang.",
        "Apresiasi terbuka untuk ide yang dicoba, bukan cuma yang berhasil.",
      ],
      dampak: "Budaya inovasi yang lebih hidup dan daya adaptasi terhadap tantangan teknis baru.",
    },
    {
      peringkat: 3,
      action: "Sederhanakan alur persetujuan berlapis di unit HSSE tanpa mengorbankan standar keselamatan.",
      trigger_desc: "HSSE satu-satunya unit dengan budaya dominan Hierarki, sementara harapan perusahaan bergerak turun 8 poin di tipe ini.",
      area: "Hierarki · HSSE",
      langkah: [
        "Petakan alur persetujuan yang ada, tandai langkah yang bisa digabung atau didelegasikan.",
        "Uji coba alur yang disederhanakan di satu jenis izin kerja dulu sebelum diperluas.",
      ],
      dampak: "Proses kerja lebih gesit tanpa menurunkan standar keselamatan yang memang wajib ketat.",
    },
  ],
  footer: {
    disclaimer:
      "Laporan ini adalah hasil pengolahan jawaban asesmen seluruh karyawan yang mengisi pada periode berjalan dan bersifat rahasia. Gunakan sebagai bahan pengambilan keputusan organisasi, bukan alat evaluasi individu karyawan tertentu.",
  },
};
