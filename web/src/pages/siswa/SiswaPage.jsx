import { useState, useRef, useEffect } from "react";
import SampleTag from "../../components/SampleTag";
import { useGasRead } from "../../lib/useGasRead";
import { transformMIData } from "./miTransform";
import styles from "./SiswaPage.module.css";

// ════════════════════════════════════════════════════════════════════════════
//  TOKEN WARNA (nilai dari tokens.css, handoff Fammi DS)
//  Di-resolve ke hex agar aman dipakai sebagai atribut SVG.
// ════════════════════════════════════════════════════════════════════════════
const T = {
  bg:        "#F6F2EB",
  surface:   "#FFFFFF",
  brand:     "#6323DA",
  violet50:  "#F6F3FF",
  violet100: "#EDE8FF",
  violet700: "#4A12B0",
  sun:       "#FDBD59", sunSoft: "#FFEBCB", sunInk: "#8A4E00",
  sky:       "#A8CAFF", skySoft: "#E1ECFF", skyInk: "#1F4FA8",
  mint:      "#B4EDBF", mintSoft: "#DFF7E4", mintInk: "#1E7A3A",
  blossom:   "#FC9DFE", blossomSoft: "#FDE2FE", blossomInk: "#9E22A0",
  lilac:     "#B4A1FD", lilacSoft: "#EDE8FF", lilacInk: "#4A12B0",
  info:      "#1F4FA8", infoSoft: "#E1ECFF",
  ink900:    "#14141A",
  ink800:    "#0E1116",
  textStrong:"#14141A",
  textBody:  "#2C2C36",
  textMuted: "#6B6B78",
  textFaint: "#9A9AA6",
  ink100:    "#F0F0F4",
  ink200:    "#E4E4EA",
  divider:   "#F0F0F4",
  shadowPop: "0 10px 28px rgba(99,35,218,0.22)",
  shadowMd:  "0 8px 20px rgba(20,20,26,0.07)",
  shadowSm:  "0 2px 8px rgba(20,20,26,0.06)",
};
const FONT_BODY = "'Plus Jakarta Sans', sans-serif";
const FONT_DISP = "'Space Grotesk', sans-serif";
// Laporan Bakat memakai Montserrat agar persis dengan design file.
const MONT = "'Montserrat', sans-serif";

// Warna spoke peta kecerdasan, urut per tingkat lalu indeks.
const DV_LEVEL_COLORS = {
  Kuat:       ["#6323DA", "#0891B2", "#7C3AED"],
  Sedang:     ["#D97706", "#DC2626", "#059669"],
  Berkembang: ["#94A3B8", "#78716C"],
};
const LEVEL_STYLE = {
  Kuat:       { bg: T.mintSoft, ink: T.mintInk },
  Sedang:     { bg: T.sunSoft,  ink: T.sunInk  },
  Berkembang: { bg: T.ink100,   ink: T.textMuted },
};

// ── Sample data (referensi desain dark theme: Beranda/Karakter/Perasaan) ───────
const SAMPLE_STUDENT = {
  name: "Aisyah Putri Faisal",
  panggilan: "Aisyah",
  kelas: "X-A",
  sekolah: "SMA Al Fath Cireundeu",
  karakter: 86,
  karakterTrend: "naik",
};

const SAMPLE_INTEL = [
  { code: "Ie", name: "Interpersonal",    score: 23, level: "Kuat",       desc: "Kamu mudah memahami perasaan orang lain dan nyaman menjalin pertemanan. Teman-teman sering menjadikanmu tempat bercerita." },
  { code: "Sp", name: "Spasial",          score: 22, level: "Kuat",       desc: "Kamu punya daya imajinasi visual yang kuat dan senang berkarya. Kamu menangkap bentuk, warna, dan ruang dengan baik." },
  { code: "Ia", name: "Intrapersonal",    score: 19, level: "Sedang",     desc: "Kamu cukup mengenali perasaan dan tujuanmu sendiri. Terus diperkuat lewat kebiasaan refleksi." },
  { code: "Ve", name: "Linguistik",       score: 18, level: "Sedang",     desc: "Kamu berkomunikasi dengan baik dalam keseharian. Latihan menulis dan berbicara akan menajamkan potensi ini." },
  { code: "Na", name: "Naturalis",        score: 16, level: "Sedang",     desc: "Kamu menikmati kegiatan di alam dan peka terhadap lingkungan sekitar." },
  { code: "Mu", name: "Musikal",          score: 15, level: "Sedang",     desc: "Kamu menikmati musik dan mampu mengikuti irama dengan baik." },
  { code: "Lo", name: "Logika-Matematika",score: 13, level: "Berkembang", desc: "Kemampuan penalaran logismu sedang berkembang dan akan tumbuh dengan latihan bertahap." },
  { code: "Ki", name: "Kinestetik",       score: 12, level: "Berkembang", desc: "Koordinasi gerakmu sedang berkembang. Aktivitas fisik yang menyenangkan akan membantu." },
];

const SAMPLE_DUKUNGAN = "Aku ingin difasilitasi untuk melukis, dan tidak terlalu banyak dikomentari soal apa yang sedang kukerjakan.";

const SAMPLE_KARAKTER = [
  { name: "Mandiri",              level: "Konsisten",    val: 92, trend: "naik",   note: "Kamu mengerjakan tugas dan keperluanmu tanpa banyak diingatkan." },
  { name: "7 Kebiasaan Anak Hebat", level: "Konsisten", val: 88, trend: "naik",   note: "Kebiasaan baik harian seperti beribadah dan merapikan diri sudah melekat." },
  { name: "Aktif",                level: "Sering Muncul",val: 85, trend: "naik",   note: "Kamu aktif bertanya dan ikut serta dalam kegiatan kelas." },
  { name: "Terampil",             level: "Sering Muncul",val: 84, trend: "stabil", note: "Terampil berkarya, terutama dalam kegiatan seni dan kerajinan." },
  { name: "Religius",             level: "Sering Muncul",val: 82, trend: "stabil", note: "Menjalankan ibadah dengan kesadaran sendiri." },
  { name: "Santun",               level: "Kadang Muncul",val: 74, trend: "naik",   note: "Kesantunan dalam tutur kata sedang dibiasakan dan menunjukkan kemajuan." },
];

const SAMPLE_ASPEK = [
  { name: "Tolong Menolong",  status: "aman",      teks: "Kamu mudah membantu teman dan peka pada keadaan sekitar." },
  { name: "Relasi Pertemanan",status: "aman",      teks: "Kamu punya pertemanan yang sehat dan saling mendukung." },
  { name: "Hiperaktivitas",   status: "aman",      teks: "Kamu mampu menjaga fokus dan tenang saat belajar." },
  { name: "Emosional",        status: "perhatian", teks: "Kadang kamu memendam perasaan saat banyak pikiran. Tidak apa-apa, cerita ke orang yang kamu percaya bisa membantu." },
  { name: "Agresi",           status: "aman",      teks: "Kamu jarang bereaksi kasar dan bisa menahan diri dengan baik." },
];

// ── Per-intelligence color + emoji (dark theme) ────────────────────────────────
const INTEL_META = {
  Ie: { color: "#818CF8", bg: "rgba(129,140,248,0.16)", bd: "rgba(129,140,248,0.28)", emoji: "🤝", tagline: "Membaca & menjalin hubungan" },
  Ia: { color: "#60A5FA", bg: "rgba(96,165,250,0.16)",  bd: "rgba(96,165,250,0.28)",  emoji: "🪞", tagline: "Mengenal dan memahami diri" },
  Ki: { color: "#4ADE80", bg: "rgba(74,222,128,0.16)",  bd: "rgba(74,222,128,0.28)",  emoji: "⚡", tagline: "Belajar lewat gerak dan tubuh" },
  Ve: { color: "#C084FC", bg: "rgba(192,132,252,0.16)", bd: "rgba(192,132,252,0.28)", emoji: "📖", tagline: "Kata, cerita, dan bahasa" },
  Lo: { color: "#22D3EE", bg: "rgba(34,211,238,0.16)",  bd: "rgba(34,211,238,0.28)",  emoji: "🔢", tagline: "Pola, logika, dan angka" },
  Mu: { color: "#FB7185", bg: "rgba(251,113,133,0.16)", bd: "rgba(251,113,133,0.28)", emoji: "🎵", tagline: "Irama, nada, dan melodi" },
  Na: { color: "#34D399", bg: "rgba(52,211,153,0.16)",  bd: "rgba(52,211,153,0.28)",  emoji: "🌿", tagline: "Alam, pola, dan makhluk hidup" },
  Sp: { color: "#A78BFA", bg: "rgba(167,139,250,0.16)", bd: "rgba(167,139,250,0.28)", emoji: "🎨", tagline: "Visual, ruang, dan gambar" },
};

const KAR_COLOR = {
  "Konsisten":    "#B68CFF",
  "Sering Muncul":"#9D6BFF",
  "Kadang Muncul":"#FBBF24",
  "Belum Muncul": "rgba(245,242,252,0.34)",
};
const INTEL_LEVEL_COLOR = {
  "Kuat":       "#B68CFF",
  "Sedang":     "#8B5CF6",
  "Berkembang": "rgba(245,242,252,0.34)",
};

function calcWellbeing(aspek) {
  const W = { aman: 100, perhatian: 64, waspada: 28 };
  return Math.round(aspek.reduce((s, a) => s + (W[a.status] || 70), 0) / aspek.length);
}

// ════════════════════════════════════════════════════════════════════════════
//  KONTEN DEFAULT LAPORAN BAKAT (handoff: Laporan Bakat Siswa.dc.html)
//  Dipakai sebagai contoh/fallback saat kolom baru OUTPUT_MI belum terisi.
// ════════════════════════════════════════════════════════════════════════════

// Emoji + label pendek + narasi per kecerdasan (untuk dialog detail)
const INTEL_DEFAULTS = {
  Ve: { name: "Linguistik", short: "Linguistik", emoji: "🗣️",
    arti: "Kata adalah alat berpikir utamamu. Kamu menyusun gagasan lewat bahasa secara alami, peka pada pilihan kata, dan bisa menyesuaikan gaya bicara dengan siapapun yang kamu ajak berbicara.",
    terlihat: ["Mudah menemukan kata yang tepat saat berbicara atau menulis", "Senang berdiskusi dan beradu argumen dengan damai", "Sering menjadi orang yang menjelaskan hal rumit ke orang lain", "Peka pada nada dan makna di balik ucapan orang lain"],
    lakukan: ["Tulis ringkasan materi dengan kata-katamu sendiri, bukan salin ulang", "Ikut lomba debat, esai, ceramah, atau kegiatan bicara publik", "Buat jurnal harian untuk melatih gaya menulis yang khas", "Ajari teman materi sulit lewat penjelasan lisan"] },
  Ie: { name: "Interpersonal", short: "Interper|sonal", emoji: "🤝",
    arti: "Kamu bisa membaca orang. Kamu mengerti apa yang dirasakan orang lain, apa yang mereka butuhkan, dan bagaimana cara terbaik untuk mendekati mereka. Di kelompok manapun kamu masuk, kamu cepat menemukan cara untuk terhubung.",
    terlihat: ["Teman-teman datang kepadanya saat ada masalah", "Bisa menyesuaikan cara bicara ke orang yang berbeda", "Mudah membuat orang nyaman di sekitarnya", "Sering jadi jembatan ketika ada konflik di kelompok"],
    lakukan: ["Aktif di kegiatan organisasi atau kepanitiaan acara", "Coba jadi mediator saat ada konflik di sekitarmu", "Pelajari komunikasi nonverbal dan bahasa tubuh", "Biasakan bertanya \"bagaimana perasaanmu?\" bukan hanya \"apa yang terjadi?\""] },
  Ia: { name: "Intrapersonal", short: "Intrapers|onal", emoji: "🪞",
    arti: "Kamu punya kemampuan memahami diri sendiri yang tidak banyak orang miliki di usiamu. Kamu tahu kelebihan, kekurangan, motivasi, dan apa yang benar-benar penting bagimu. Ini yang membuat pendapatmu terasa matang.",
    terlihat: ["Sering merenung dan menghasilkan pendapat yang matang", "Tidak mudah terpengaruh tekanan teman sebaya", "Tahu apa yang dia mau dan apa yang tidak", "Bisa mengungkapkan perasaannya dengan artikulasi yang baik"],
    lakukan: ["Tulis jurnal refleksi singkat tiap malam, minimal 3 kalimat", "Diskusikan pilihan-pilihan hidup dengan orang yang kamu percaya", "Baca biografi tokoh yang kamu kagumi untuk perspektif baru", "Tetapkan satu tujuan kecil tiap pekan dan evaluasi sendiri"] },
  Mu: { name: "Musikal", short: "Musikal", emoji: "🎵",
    arti: "Kamu menikmati musik dan punya kepekaan pada ritme, tapi belum kamu jadikan alat berpikir utama. Dalam situasi tertentu musik bisa membantu fokusmu, tapi ini belum kamu manfaatkan secara sadar.",
    terlihat: ["Mudah terbawa suasana lagu yang sedang diputar", "Kadang menghafal lebih cepat lewat materi yang dinyanyikan", "Punya selera musik yang cukup luas", "Menikmati bernyanyi meski tidak selalu percaya diri tampil"],
    lakukan: ["Coba teknik mnemonik berbasis melodi untuk materi sulit", "Buat playlist per mata pelajaran dan amati efeknya pada fokus", "Ikut kegiatan seni suara di sekolah atau komunitas", "Rekam suaramu menjelaskan materi, lalu dengarkan ulang"] },
  Sp: { name: "Spasial", short: "Spasial", emoji: "🎨",
    arti: "Kamu bisa memahami visual dengan baik ketika tersedia, tapi belum selalu jadi alat pertama untuk berpikir. Ketika ada diagram kamu terbantu, namun membuat visual sendiri masih butuh usaha ekstra.",
    terlihat: ["Terbantu jelas saat materi disajikan lewat gambar atau diagram", "Kadang menggambar untuk membantu memahami soal", "Cukup baik membaca peta dengan sedikit latihan", "Lebih suka konten visual dibanding teks panjang"],
    lakukan: ["Biasakan merangkum satu bab menjadi satu halaman mind map", "Gunakan warna berbeda untuk setiap kategori dalam catatan", "Gambar ulang konsep abstrak menjadi visual buatanmu sendiri", "Coba aplikasi mind map digital untuk tugas sekolah"] },
  Na: { name: "Naturalis", short: "Naturalis", emoji: "🌿",
    arti: "Kamu punya kepekaan mengamati dan mengklasifikasi, suka melihat pola di lingkungan sekitar. Ini juga berarti kamu peka terhadap konteks dan situasi, bukan sekadar konten yang tersaji.",
    terlihat: ["Senang mengamati dan mengkategorikan hal-hal di sekitar", "Tertarik pada isu lingkungan atau kehidupan di alam", "Merasa lebih tenang dan fokus di ruang terbuka", "Punya memori kuat untuk hal-hal yang diamati langsung"],
    lakukan: ["Luangkan waktu di ruang terbuka sebagai tempat berpikir", "Hubungkan materi pelajaran dengan contoh nyata di alam sekitar", "Amati pola sosial di lingkunganmu dan catat temuannya", "Mulai koleksi fakta menarik dari bidang yang kamu minati"] },
  Lo: { name: "Logika-Matematika", short: "Logika", emoji: "🔢",
    arti: "Berpikir lewat angka dan logika bertahap belum jadi jalur utamamu. Kamu lebih cepat menyerap lewat cerita, gambar, atau interaksi langsung. Keterampilan ini bisa dilatih mulai dari pola-pola sederhana.",
    terlihat: ["Bisa mengikuti argumen yang runtut bila ada contoh konkret", "Lebih nyaman dengan tugas non-angka", "Kadang suka permainan strategi atau teka-teki ringan", "Mengandalkan intuisi lebih dari langkah sistematis"],
    lakukan: ["Mulai dengan permainan logika ringan seperti sudoku atau teka-teki", "Pecah satu masalah harian menjadi langkah-langkah berurutan", "Cari tahu mengapa rumus bekerja, bukan hanya hafal rumusnya", "Catat pengeluaranmu dan cari polanya tiap akhir pekan"] },
  Ki: { name: "Kinestetik", short: "Kinestetik", emoji: "⚡",
    arti: "Belajar lewat praktik langsung dan gerak tubuh belum jadi kekuatan utamamu. Ini berarti kamu lebih efisien lewat jalur lain yaitu kata-kata dan hubungan sosial, yang justru kamu kuasai dengan baik.",
    terlihat: ["Lebih mudah paham kalau langsung dipraktikkan sendiri", "Ingatan kuat untuk hal-hal yang pernah dilakukan sendiri", "Bisa duduk lama kalau materinya benar-benar menarik", "Lebih nyaman belajar dengan diskusi daripada gerak fisik"],
    lakukan: ["Ubah review pelajaran menjadi roleplay atau simulasi bersama teman", "Saat menghafal, coba sambil berjalan perlahan di ruangan", "Praktikkan langsung apa yang baru dipelajari, jangan hanya dicatat", "Coba satu kegiatan fisik baru sebagai penyeimbang energi belajar"] },
};

// Headline cover + judul keunikan + tagline pendek per kecerdasan dominan
const COVER_HEADLINE = {
  Ve: "Kamu bicara, orang-orang mendengarkan. Itu bukan kebetulan.",
  Ie: "Kamu paham orang lain. Itu kekuatan yang langka.",
  Ia: "Kamu mengenal dirimu sendiri. Itu fondasi yang kuat.",
  Lo: "Kamu berpikir runtut dan tajam. Itu bukan kebetulan.",
  Sp: "Kamu melihat yang orang lain lewatkan. Itu bukan kebetulan.",
  Mu: "Kamu mendengar yang orang lain abaikan. Itu bukan kebetulan.",
  Na: "Kamu terhubung dengan alam dan pola. Itu bukan kebetulan.",
  Ki: "Tubuhmu tahu caranya. Itu bukan kebetulan.",
};
const KEUNIKAN_TITLE = {
  Ve: "Kamu menggerakkan orang lewat kata-kata.",
  Ie: "Kamu menghubungkan orang dengan mudah.",
  Ia: "Kamu menavigasi hidup dari dalam.",
  Lo: "Kamu memecahkan masalah secara sistematis.",
  Sp: "Kamu berpikir lewat gambar dan ruang.",
  Mu: "Kamu menata dunia lewat irama.",
  Na: "Kamu membaca pola di alam dan sekitarmu.",
  Ki: "Kamu belajar paling dalam lewat gerak.",
};
const SHORT_TAGLINE = {
  Ve: "Bicara & kata", Ie: "Paham orang", Ia: "Paham diri", Lo: "Logika & angka",
  Sp: "Visual & ruang", Mu: "Irama & nada", Na: "Alam & pola", Ki: "Gerak & praktik",
};

const PROFESI_DB = {
  "Public Speaker": { desc: "Berbicara di hadapan publik untuk menginspirasi, mendidik, atau menghibur. Bisa lewat seminar, TEDx, podcast, atau corporate training.", skills: ["Kemampuan menyederhanakan ide kompleks", "Kepercayaan diri di hadapan audiens", "Kemampuan membaca dan merespons suasana ruangan"], jalur: "Mulai dari komunitas kecil atau acara sekolah. Rekam setiap penampilan. Bangun portofolio video secara bertahap.", figur: ["Najwa Shihab, jurnalis dan moderator nasional", "Gita Wirjawan, pengusaha dan podcaster", "Merry Riana, motivator dan penulis"] },
  "MC / Presenter": { desc: "Memandu acara, siaran TV, atau podcast. Profesi ini butuh improvisasi cepat, diksi yang baik, dan kepekaan terhadap suasana.", skills: ["Diksi dan intonasi yang jelas dan menarik", "Improvisasi dan adaptasi situasi secara cepat", "Riset mendalam sebelum setiap acara"], jalur: "Mulai dengan menjadi MC acara sekolah atau komunitas. Ikut kursus broadcast atau casting untuk media lokal.", figur: ["Desy Ratnasari", "Boy William", "Andini Effendi"] },
  "Jurnalis / Reporter": { desc: "Mencari, memverifikasi, dan menyampaikan informasi kepada publik. Bisa di media cetak, online, radio, atau televisi.", skills: ["Kemampuan menulis yang jelas dan akurat", "Rasa ingin tahu yang tinggi dan kritis", "Jaringan sumber informasi yang luas"], jalur: "Mulai dari pers kampus atau media pelajar. Magang di media lokal sejak kuliah. Bangun portofolio tulisan dari sekarang.", figur: ["Najwa Shihab", "Andy F. Noya", "Rosiana Silalahi"] },
  "Penulis & Editor": { desc: "Menciptakan atau menyempurnakan karya tulis, bisa berupa buku, artikel, naskah film, atau konten digital.", skills: ["Kepekaan bahasa dan gaya penulisan", "Kedisiplinan menulis secara rutin", "Kemampuan merevisi tanpa membiarkan ego menghalangi"], jalur: "Mulai dengan menulis blog atau cerita pendek. Kirim naskah ke penerbit atau media. Bergabung dengan komunitas penulis.", figur: ["Dee Lestari, penulis Supernova", "Andrea Hirata, penulis Laskar Pelangi", "Puthut EA, cerpenis dan editor"] },
  "Content Creator": { desc: "Membuat konten digital berupa video, podcast, tulisan, atau kombinasinya yang bernilai bagi audiens tertentu di internet.", skills: ["Kreativitas dalam menyajikan informasi", "Konsistensi dan disiplin produksi", "Pemahaman mendalam tentang audiens dan platform"], jalur: "Pilih satu platform dan satu topik yang kamu benar-benar minati. Konsisten minimal 6 bulan sebelum menilai hasilnya.", figur: ["Raditya Dika", "Ria Ricis", "Deddy Corbuzier, yang berevolusi sebagai podcaster"] },
  "Pengacara / Advokat": { desc: "Memberikan bantuan hukum dan mewakili klien di pengadilan. Bisa bergabung di firma hukum, NGO, atau membuka praktik sendiri.", skills: ["Analisis hukum yang tajam dan teliti", "Argumentasi lisan dan tulisan yang kuat", "Etika dan integritas profesional yang tidak bisa ditawar"], jalur: "S1 Hukum, lulus PKPA, ikuti ujian profesi advokat. Magang di kantor hukum atau LBH sejak semester awal kuliah.", figur: ["Todung Mulya Lubis, pengacara HAM senior", "Otto Hasibuan", "Vera Novia"] },
  "Diplomat / Duta Besar": { desc: "Mewakili negara di forum internasional, membangun hubungan antarnegara, dan melindungi kepentingan nasional di luar negeri.", skills: ["Kemampuan negosiasi lintas budaya", "Fasih minimal dua bahasa asing", "Pengetahuan mendalam tentang politik dan ekonomi internasional"], jalur: "S1 Hubungan Internasional atau Hukum. Lulus seleksi Kemenlu. Jalur panjang tapi sangat berharga dan kompetitif.", figur: ["Retno Marsudi, Menteri Luar Negeri Indonesia", "Dino Patti Djalal", "Marty Natalegawa"] },
  "Aktivis & LSM": { desc: "Memperjuangkan isu-isu sosial, lingkungan, atau hak asasi manusia melalui advokasi, kampanye, dan pendampingan komunitas.", skills: ["Komitmen kuat pada nilai-nilai keadilan", "Kemampuan membangun jaringan dan koalisi", "Komunikasi publik yang persuasif"], jalur: "Mulai dari volunteer di LSM lokal. Perkuat dengan pendidikan di bidang hukum, sosial, atau kebijakan publik.", figur: ["Nong Darol Mahmada, aktivis perempuan", "Yuyun Ismawati, aktivis lingkungan"] },
  "Da'i / Penceramah": { desc: "Menyebarkan nilai-nilai kebaikan dan ilmu agama kepada masyarakat lewat ceramah, kajian, tulisan, atau media digital.", skills: ["Pemahaman agama yang mendalam dan akurat", "Komunikasi yang hangat dan relevan dengan konteks pendengar", "Kepekaan terhadap kondisi dan kebutuhan jamaah"], jalur: "Mulai dari kajian kecil di lingkungan sekitar. Perkuat dengan pendidikan agama formal. Bangun kepercayaan lewat konsistensi.", figur: ["Buya Hamka, ulama dan sastrawan", "Quraish Shihab, ahli tafsir", "Habib Ali Zaenal Abidin"] },
  "Dosen / Akademisi": { desc: "Mengajar di perguruan tinggi, melakukan penelitian, dan berkontribusi pada pengembangan ilmu pengetahuan secara sistematis.", skills: ["Penguasaan bidang ilmu yang dalam dan terus diperbarui", "Kemampuan mengajar dan membimbing mahasiswa", "Menulis karya ilmiah yang bisa dipublikasikan"], jalur: "S1, lanjut S2, dan idealnya S3 di bidang yang diminati. Aktif riset sejak kuliah. Daftar beasiswa untuk jalur akademisi.", figur: ["Rhenald Kasali, guru besar manajemen", "Yenny Wahid", "Butet Manurung, pendidik komunitas adat"] },
  "Konselor Islami": { desc: "Memberikan pendampingan psikologis berbasis nilai-nilai Islam kepada individu, keluarga, atau komunitas yang membutuhkan.", skills: ["Empati yang dalam dan kemampuan mendengarkan aktif", "Pemahaman psikologi dan konseling yang kuat", "Landasan nilai-nilai Islam yang kokoh"], jalur: "S1 Psikologi atau Bimbingan Konseling, dilengkapi dengan pendidikan agama yang kuat. Lanjut S2 untuk spesialisasi.", figur: ["Fuad Nashori, psikolog Islam", "Elly Risman, konselor keluarga"] },
  "Anggota DPR / Hakim": { desc: "Merumuskan kebijakan publik sebagai legislator, atau menegakkan hukum dan keadilan sebagai hakim di pengadilan.", skills: ["Pemahaman hukum dan kebijakan publik yang mendalam", "Kemampuan negosiasi dan lobi yang strategis", "Integritas dan akuntabilitas yang tidak bisa dikompromikan"], jalur: "S1 Hukum atau Ilmu Politik. Untuk DPR, aktif di partai atau organisasi sejak dini. Untuk hakim, lewat rekrutmen MA yang ketat.", figur: ["Mahfud MD, mantan Ketua MK", "Susi Pudjiastuti (jalur alternatif kepemimpinan publik)"] },
};

const STUDI_KASUS = [
  { name: "Farah R.", initials: "FR", color: "#0891B2", lightBg: "#E0F7FA", profile: "Linguistik 91, Interpersonal 86", tagline: "Dari debater ke jurnalis nasional", short: "Reporter di Kompas TV, usia 26 tahun", story: "Di SMA, Farah sering dianggap terlalu banyak bicara. Tapi seorang guru melihat sesuatu yang berbeda: dia selalu bisa membuat siapapun nyaman bercerita. Farah masuk Jurnalistik Unpad, aktif di Pers Mahasiswa, dan mulai magang di media lokal semester 5. Tiga tahun setelah lulus, dia meliput isu lingkungan untuk siaran nasional.", kunci: ["Konsisten menulis blog sejak kelas X, bahkan ketika tidak ada yang membaca", "Bergabung dengan debate club walau awalnya merasa tidak siap", "Berani magang jauh dari kota asal untuk memperluas jaringan"], catatan: "Farah tidak pernah merasa berbakat. Yang dia lakukan hanyalah terus menulis dan terus berbicara sampai akhirnya dunia mendengar." },
  { name: "Rizky P.", initials: "RP", color: "#059669", lightBg: "#D1FAE5", profile: "Linguistik 89, Interpersonal 84", tagline: "Content creator dengan 800K subscribers", short: "YouTube dan podcast, tanpa jalur kuliah formal", story: "Rizky berhenti kuliah di semester 2 karena merasa tidak cocok dengan sistemnya. Dia mulai membuat video yang menjelaskan sejarah rumit dengan bahasa sederhana. Setahun pertama hampir tidak ada yang menonton. Tahun ketiga, satu videonya viral karena menjelaskan isu sosial dengan sangat jernih. Sekarang Rizky menjadi referensi edukasi bagi ratusan ribu pelajar.", kunci: ["Konsisten upload konten walau views sangat rendah di awal", "Fokus pada satu topik yang dia benar-benar peduli dan kuasai", "Berkolaborasi dengan kreator lain untuk terus belajar dan tumbuh"], catatan: "Butuh dua tahun sebelum hasilnya terlihat. Tapi dia tidak berhenti karena prosesnya sendiri sudah terasa benar." },
  { name: "Amira S.", initials: "AS", color: "#7C3AED", lightBg: "#EDE9FE", profile: "Linguistik 90, Intrapersonal 82", tagline: "Pengacara HAM dan penulis muda", short: "Advokat di LBH, buku pertamanya terbit sebelum wisuda", story: "Amira tahu sejak SMA bahwa dia ingin membela orang-orang yang tidak punya suara. Dia masuk Fakultas Hukum, aktif di himpunan mahasiswa, dan magang di LBH semester 6. Sambil kuliah, dia menulis esai-esai tentang keadilan yang dibaca ribuan orang. Bukunya tentang hak anak terbit sebelum dia wisuda, dan menjadi referensi di beberapa seminar nasional.", kunci: ["Menulis jurnal refleksi setiap malam sejak kelas XI, tanpa jeda", "Bergabung dengan organisasi yang sejalan dengan nilai-nilainya", "Membangun kebiasaan membaca lintas bidang, dari filsafat hingga ekonomi"], catatan: "Amira memilih jalur yang lebih sepi dari segi popularitas, tapi jauh lebih bermakna baginya. Dan itu keputusan yang dia buat sendiri, dengan sadar." },
];

const PATHS = [
  { emoji: "🎤", label: "Komunikator", tagline: "Suara yang menggerakkan", description: "Jalur untuk yang ingin idenya tersampaikan ke banyak orang, lewat panggung, kamera, atau podium.", color: "#6323DA", bgColor: T.violet100, inkColor: T.violet700, kegiatan: ["Muhadharah dan Khitobah", "MC acara", "Debat antar kelas", "Ketua OSIS atau BEM"], jurusan: ["Ilmu Komunikasi", "KPI (Komunikasi Penyiaran)", "Hubungan Internasional", "Sosiologi"], profesi: ["Public Speaker", "MC / Presenter"], parentTip: "Ajak dia tampil berbicara di acara keluarga besar. Rekam dan putar ulang bersama. Banggakan prosesnya, bukan hanya hasilnya." },
  { emoji: "📰", label: "Media dan Pena", tagline: "Kata-kata yang meninggalkan jejak", description: "Jalur untuk yang lebih suka mempengaruhi lewat tulisan, narasi, dan konten, tidak selalu harus di panggung.", color: "#0891B2", bgColor: "#E0F7FA", inkColor: "#006780", kegiatan: ["Jurnalistik dan mading", "Tulis opini atau cerita", "Podcast sekolah", "Lomba cipta puisi"], jurusan: ["Jurnalistik", "Sastra Indonesia atau Arab", "Komunikasi Digital", "Bahasa dan Sastra Inggris"], profesi: ["Jurnalis / Reporter", "Penulis & Editor", "Content Creator"], parentTip: "Belikan jurnal dan biarkan dia mengisinya bebas. Bacakan tulisannya tanpa mengoreksi. Eksplorasi bahasa perlu ruang dulu sebelum disempurnakan." },
  { emoji: "⚖️", label: "Hukum dan Diplomasi", tagline: "Argumen yang mengubah keputusan", description: "Jalur untuk yang suka berargumen dengan runtut, negosiasi strategis, dan membela hal yang benar secara sistematis.", color: "#059669", bgColor: "#D1FAE5", inkColor: "#064E3B", kegiatan: ["Debat dan lomba karya tulis", "MUN (Model United Nations)", "Pengurus OSIS atau BEM", "Advokasi isu sosial"], jurusan: ["Ilmu Hukum", "Hubungan Internasional", "Ilmu Politik", "Hukum Tata Negara"], profesi: ["Pengacara / Advokat", "Diplomat / Duta Besar", "Aktivis & LSM", "Anggota DPR / Hakim"], parentTip: "Latih dia membela pendapat dengan sopan di rumah. Kalau dia berdebat denganmu, ajarkan cara berargumen yang baik, bukan langsung menutup pembicaraan." },
  { emoji: "🎓", label: "Pendidik dan Da'i", tagline: "Dampak yang terasa dalam jiwa", description: "Jalur untuk yang ingin pesan dan ilmunya tidak hanya dipahami, tapi dirasakan, diingat, dan diamalkan oleh orang lain.", color: "#7C3AED", bgColor: "#EDE9FE", inkColor: "#4C1D95", kegiatan: ["Kajian kitab dan halaqah", "Mengajar adik kelas", "Syarhil Quran", "Komunitas belajar"], jurusan: ["Pendidikan Islam (PAI)", "KPI atau Dakwah", "Bimbingan Konseling", "Psikologi"], profesi: ["Da'i / Penceramah", "Dosen / Akademisi", "Konselor Islami"], parentTip: "Ajak diskusi isu yang relevan. Dengarkan pendapatnya sampai selesai sebelum menambahkan perspektif. Hadiahkan buku biografi tokoh yang menginspirasi." },
];

const DEFAULT_CARA_BELAJAR = [
  { no: "01", title: "Jelaskan ke orang lain", body: "Bukan baca ulang, tapi ceritakan ulang ke teman atau adik kelas. Cara ini paling efektif karena melibatkan kata dan interaksi sekaligus." },
  { no: "02", title: "Minta contoh nyata", body: "Matematika pun lebih masuk kalau ada ceritanya. Tanya ke guru: \"Ini dipakai untuk apa di kehidupan nyata?\"" },
  { no: "03", title: "Tulis dengan kata-katamu sendiri", body: "Bukan menyalin rangkuman, tapi ceritakan ulang dengan bahasamu. Kalau bisa menjelaskan, berarti benar-benar paham." },
  { no: "04", title: "Kelompok belajar kecil 2 sampai 3 orang", body: "Diskusi membantu berpikir lebih dalam. Kelompok besar bisa jadi gangguan. Pilih teman yang bisa diajak serius." },
  { no: "05", title: "Baca keras-keras", body: "Suaramu adalah alatmu. Membaca nyaring mengaktifkan kecerdasan linguistik dan membantu memori bekerja jauh lebih kuat." },
];
const DEFAULT_CARA_BELAJAR_SUMMARY = "Kamu belajar paling efektif lewat kata-kata dan interaksi, bukan hafalan dan pengulangan. Tidak semua guru tahu ini.";

const DEFAULT_GAYA_POSITIF = [
  "Ajukan pertanyaan terbuka. \"Menurutmu bagaimana?\" lebih efektif dari \"Kamu harus...\"",
  "Beri ruang untuk bercerita. Dengarkan sampai selesai sebelum merespons.",
  "Gunakan pujian yang spesifik. \"Penjelasanmu tadi jelas sekali\" jauh lebih bermakna dari \"Pinter kamu.\"",
  "Jelaskan alasan di balik setiap aturan atau keputusan, bukan hanya instruksinya.",
];
const DEFAULT_GAYA_HINDARI = [
  "Memotong di tengah cerita. Ini mematikan dorongan berbicaranya secara perlahan.",
  "Instruksi tanpa penjelasan alasan. Anak merespons lebih baik ketika memahami mengapa.",
  "Membandingkan dengan orang lain, bahkan dengan niat memotivasi sekalipun.",
];
const DEFAULT_GAYA_SISWA = [
  { situasi: "Saat butuh didengar tanpa solusi", script: "\"Aku perlu cerita dulu. Belum butuh solusi sekarang. Bisa dengerin?\"" },
  { situasi: "Saat merasa dipotong atau tidak didengar", script: "\"Boleh aku selesaikan pikiranku dulu?\"" },
  { situasi: "Saat ingin pendapat tapi takut dihakimi", script: "\"Aku sudah memikirkan ini. Pengen dengar perspektifmu juga, tanpa langsung disalahkan.\"" },
];

const DEFAULT_SMART_GOALS = [
  { letter: "S", label: "Spesifik", content: "Tampil berbicara di depan audiens minimal 2 kali sebulan, baik di kelas, komunitas, atau kegiatan sekolah yang ada." },
  { letter: "M", label: "Terukur", content: "Target 8 penampilan dalam 4 bulan ke depan. Rekam setiap sesi dan simpan sebagai bukti perkembangan diri." },
  { letter: "A", label: "Achievable", content: "Mulai dari audiens 5 sampai 10 orang, kemudian naikkan secara bertahap. Tidak perlu langsung tampil di panggung besar." },
  { letter: "R", label: "Relevan", content: "Sesuai dengan kecerdasan utamamu. Jalur ini memperkuat apa yang sudah ada secara alami." },
  { letter: "T", label: "Time-bound", content: "Evaluasi setiap bulan bersama orang yang dipercaya. Review menyeluruh di akhir semester untuk melihat perkembangan nyata." },
];

const DEFAULT_DAYS = [
  { label: "Hari ini", task: "Tulis 3 hal yang kamu kagumi dari cara seseorang berbicara. Apa yang membuat mereka menarik dan mudah dipercaya?" },
  { label: "Besok", task: "Jelaskan satu pelajaran hari ini ke seseorang yang kamu percaya. Perhatikan cara mereka merespons." },
  { label: "Hari ke-3", task: "Catat satu kata baru yang kamu temui. Cari artinya, lalu gunakan dalam satu kalimat hari ini." },
  { label: "Hari ke-4", task: "Di kelas, sampaikan minimal satu pertanyaan atau pendapat. Bukan untuk terlihat pintar, tapi untuk melatih keberanian." },
  { label: "Hari ke-5", task: "Tulis cerita singkat 5 kalimat tentang harimu, tapi dari sudut pandang teman yang mengamatimu." },
  { label: "Hari ke-6", task: "Rekam suaramu membaca satu paragraf selama 2 menit. Dengarkan ulang dan perhatikan kecepatan serta kejelasanmu." },
  { label: "Hari ke-7", task: "Buat satu rencana konkret: apa satu kegiatan yang akan kamu coba bulan depan berdasarkan keunikanmu?" },
];

const DEFAULT_SINYAL = [
  { icon: "💬", title: "Ketika dia menjelaskan sesuatu dengan semangat", body: "Itu bukan cerewet. Itu kecerdasannya bekerja. Dukung dengan mendengarkan, bukan memotong." },
  { icon: "🤝", title: "Kalau dia jadi mediator di tengah konflik teman", body: "Perhatikan itu. Kemampuan ini jarang dan berharga, dan mungkin sudah terjadi berulang kali tanpa dia sadari." },
  { icon: "📚", title: "Lebih hidup di mapel bahasa dan sosial daripada hitungan", body: "Itu preferensi kecerdasan, bukan kemalasan. Bantu temukan cara belajar matematika lewat cerita dan konteks nyata." },
  { icon: "✨", title: "Pujian paling bermakna baginya", body: "Bukan \"kamu pintar\", tapi \"penjelasanmu tadi membuat aku mengerti\". Apresiasi yang spesifik jauh lebih kuat dan tahan lama." },
  { icon: "👂", title: "Dia butuh pendengar yang baik di rumah", body: "\"Lalu apa?\" lebih powerful dari \"sudah belajar?\". Jadilah pendengar aktif. Itulah cara terbaik mendukung kecerdasannya." },
];

const DEFAULT_CIRI_KHAS = [
  { text: "Suka bercerita dan berdiskusi", tone: "sky" },
  { text: "Cepat akrab dengan orang baru", tone: "blossom" },
  { text: "Pandai memilih kata yang tepat", tone: "sun" },
  { text: "Berani tampil di depan umum", tone: "mint" },
];

const DEFAULT_REFLEKSI = [
  "Kapan terakhir kali kamu merasa paling hidup saat berbicara atau berkomunikasi dengan seseorang?",
  "Ada satu orang yang kamu kagumi cara berbicaranya. Apa tepatnya yang membuat mereka berkesan bagimu?",
  "Kalau kamu punya audiens satu juta orang besok pagi, kamu ingin bercerita tentang apa?",
  "Apa yang paling sering orang minta bantuannya kepadamu? Apakah kamu pernah sadar itu adalah kekuatanmu?",
];
const DEFAULT_DISKUSI = [
  "Saat cerita soal apa kamu paling semangat sampai susah berhenti bicara?",
  "Kamu lebih suka tampil di depan atau menyiapkan semuanya di belakang layar?",
  "Pelajaran atau kegiatan mana yang bikin kamu lupa waktu?",
  "Kamu ingin jadi orang yang seperti apa lima tahun lagi?",
];
const DEFAULT_MAPEL_KUASAI = ["Bahasa Indonesia", "Bahasa Inggris", "Bahasa Arab", "PPKn", "Sejarah", "Sosiologi"];
const DEFAULT_MAPEL_TANTANG = ["Matematika", "Fisika", "Kimia"];

const DEFAULT_KOMBINASI = "Bukan hanya pandai bicara. Kamu tahu cara membaca ruangan, memilih kata yang tepat untuk orang yang tepat, dan tahu kapan waktunya diam. Kombinasi ini tidak umum.";
const DEFAULT_KOMBINASI_BOX = "Ini bahan dasar seorang pemimpin, negosiator, jurnalis, atau siapapun yang ingin membuat orang sungguh-sungguh bergerak, bukan sekadar mendengarkan.";

// Contoh laporan bakat (dipakai saat data OUTPUT_MI belum tersedia). Persis design file.
const SAMPLE_BAKAT = {
  student: { name: "Aisyah Putri Faisal", panggilan: "Aisyah", kelas: "Kelas X", sekolah: "MTs Al-Hikmah" },
  intel: [
    { code: "Ve", name: "Linguistik",        score: 92, level: "Kuat" },
    { code: "Ie", name: "Interpersonal",     score: 88, level: "Kuat" },
    { code: "Ia", name: "Intrapersonal",     score: 76, level: "Kuat" },
    { code: "Mu", name: "Musikal",           score: 68, level: "Sedang" },
    { code: "Sp", name: "Spasial",           score: 63, level: "Sedang" },
    { code: "Na", name: "Naturalis",         score: 57, level: "Sedang" },
    { code: "Lo", name: "Logika-Matematika", score: 48, level: "Berkembang" },
    { code: "Ki", name: "Kinestetik",        score: 43, level: "Berkembang" },
  ],
  topDetails: [
    { code: "Ve", name: "Linguistik",    score: 92, level: "Kuat" },
    { code: "Ie", name: "Interpersonal", score: 88, level: "Kuat" },
    { code: "Ia", name: "Intrapersonal", score: 76, level: "Kuat" },
  ],
};

// ════════════════════════════════════════════════════════════════════════════
//  SVG CHARTS (dark theme: Beranda/Karakter/Perasaan)
// ════════════════════════════════════════════════════════════════════════════

function RingGauge({ value = 0, size = 104, stroke = 11, gradient, color = "#9D6BFF", track = "rgba(255,255,255,0.10)", label = "", suffix = "" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(value / 100, 1) * circ;
  const uid = `rg-${size}-${value}`;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {gradient && (
          <defs>
            <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={gradient[0]} />
              <stop offset="100%" stopColor={gradient[1]} />
            </linearGradient>
          </defs>
        )}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={gradient ? `url(#${uid})` : color}
          strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1 }}>
        <span style={{ fontSize: size < 80 ? 14 : size < 100 ? 18 : 22, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-.02em", fontFamily: FONT_DISP }}>
          {value}{suffix}
        </span>
        {label && <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(245,242,252,0.5)", textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>}
      </div>
    </div>
  );
}

function DonutChart({ segments = [], size = 132, stroke = 20, center, centerSub }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  let offset = 0;
  const slices = segments.map((seg) => {
    const dash = (seg.value / total) * circ;
    const s = { ...seg, dash, offset: circ - offset };
    offset += dash;
    return s;
  });
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {slices.map((s, i) => (
          <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={s.color} strokeWidth={stroke}
            strokeDasharray={`${Math.max(s.dash - 3, 0)} ${circ - Math.max(s.dash - 3, 0)}`}
            strokeDashoffset={s.offset}
          />
        ))}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 800, color: "#fff", lineHeight: 1, fontFamily: FONT_DISP }}>{center}</span>
        {centerSub && <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(245,242,252,0.5)", marginTop: 2 }}>{centerSub}</span>}
      </div>
    </div>
  );
}

function SemiGauge({ value = 0, size = 260, label = "", sub = "" }) {
  const cx = size / 2;
  const R = (size - 40) / 2;
  const stroke = 18;
  const cy = R + stroke / 2 + 8;
  const trackD = `M ${cx - R} ${cy} A ${R} ${R} 0 1 0 ${cx + R} ${cy}`;
  const angle = Math.PI * (1 - value / 100);
  const fillX = cx + R * Math.cos(angle);
  const fillY = cy - R * Math.sin(angle);
  const largeArc = value > 50 ? 1 : 0;
  const fillD = value > 0 ? `M ${cx - R} ${cy} A ${R} ${R} 0 ${largeArc} 0 ${fillX} ${fillY}` : null;
  const svgH = cy + stroke / 2 + 12;
  const uid = `sg-${size}`;
  return (
    <div style={{ textAlign: "center" }}>
      <svg width={size} height={svgH} viewBox={`0 0 ${size} ${svgH}`} style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id={uid} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6D28D9" />
            <stop offset="100%" stopColor="#B68CFF" />
          </linearGradient>
        </defs>
        <path d={trackD} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={stroke} strokeLinecap="round" />
        {fillD && <path d={fillD} fill="none" stroke={`url(#${uid})`} strokeWidth={stroke} strokeLinecap="round" />}
        <text x={cx} y={cy - R * 0.32} textAnchor="middle" fill="#F5F2FC"
          fontSize={Math.round(size * 0.136)} fontWeight="800" letterSpacing="-1"
          fontFamily={FONT_DISP}>{value}</text>
        {label && <text x={cx} y={cy - R * 0.06} textAnchor="middle" fill="rgba(245,242,252,0.52)" fontSize={11} fontWeight="700">{label}</text>}
      </svg>
      {sub && <p style={{ margin: "-4px 0 0", fontSize: 12.5, color: "rgba(245,242,252,0.52)", textAlign: "center" }}>{sub}</p>}
    </div>
  );
}

// ── Shared UI dark ─────────────────────────────────────────────────────────────
function SCard({ children, style, glow }) {
  return (
    <div className={styles.sCard} style={{
      boxShadow: glow
        ? "0 18px 54px rgba(124,58,237,0.28), inset 0 1px 0 rgba(255,255,255,0.07)"
        : "0 12px 36px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.05)",
      ...style,
    }}>{children}</div>
  );
}

function SChip({ children, tone = "ungu", style: sx }) {
  const map = {
    ungu:     { fg: "#B68CFF", bg: "rgba(157,107,255,0.20)", bd: "rgba(157,107,255,0.34)" },
    aman:     { fg: "#34D399", bg: "rgba(52,211,153,0.15)",  bd: "rgba(52,211,153,0.34)" },
    perhatian:{ fg: "#FBBF24", bg: "rgba(251,191,36,0.15)",  bd: "rgba(251,191,36,0.34)" },
  };
  const c = map[tone] || map.ungu;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5, fontWeight: 700,
      color: c.fg, background: c.bg, border: `1px solid ${c.bd}`, padding: "5px 11px",
      borderRadius: 99, whiteSpace: "nowrap", ...sx }}>{children}</span>
  );
}

function SHeading({ kicker, title, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {kicker && <div style={{ fontSize: 11, fontWeight: 700, color: "#B68CFF", textTransform: "uppercase", letterSpacing: ".14em", marginBottom: 7, fontFamily: FONT_DISP }}>{kicker}</div>}
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", color: "#F5F2FC", lineHeight: 1.15 }}>{title}</h2>
      {sub && <p style={{ margin: "6px 0 0", fontSize: 13.5, color: "rgba(245,242,252,0.52)", lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );
}

function SHomeTip({ children }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "16px 17px", background: "rgba(157,107,255,0.12)", borderRadius: 18, border: "1px solid rgba(157,107,255,0.28)" }}>
      <span style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(255,255,255,0.08)", color: "#B68CFF", display: "grid", placeItems: "center", flexShrink: 0 }}>
        <IcSparkle size={17} />
      </span>
      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#B68CFF", marginBottom: 4 }}>Yang bisa kamu coba</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: "rgba(245,242,252,0.76)" }}>{children}</p>
      </div>
    </div>
  );
}

function STrend({ t, size = 13 }) {
  if (t === "naik")  return <IcArrowUp size={size} style={{ color: "#34D399" }} />;
  if (t === "turun") return <IcArrowDown size={size} style={{ color: "#FB7185" }} />;
  return <IcMinus size={size} style={{ color: "rgba(245,242,252,0.34)" }} />;
}

// ── Inline icons ──────────────────────────────────────────────────────────────
const S = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };

function IcHeart({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>; }
function IcShield({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IcSparkle({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74z"/></svg>; }
function IcArrowRight({ size = 18 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><polyline points="9 18 15 12 9 6"/></svg>; }
function IcArrowUp({ size = 14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><polyline points="18 15 12 9 6 15"/></svg>; }
function IcArrowDown({ size = 14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><polyline points="6 9 12 15 18 9"/></svg>; }
function IcMinus({ size = 14 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><line x1="5" y1="12" x2="19" y2="12"/></svg>; }
function IcCheckCircle({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>; }
function IcUsers({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>; }
function IcLogout({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function IcChat({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>; }
function IcHome({ size = 20 }) { return <svg width={size} height={size} viewBox="0 0 24 24" {...S}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }

function IntelBadge({ code, size = 44 }) {
  const m = INTEL_META[code] || {};
  return (
    <span style={{ width: size, height: size, borderRadius: Math.round(size * 0.28), background: m.bg || "rgba(157,107,255,0.18)", border: `1.5px solid ${m.bd || "rgba(157,107,255,0.28)"}`, display: "grid", placeItems: "center", flexShrink: 0, fontSize: Math.round(size * 0.5), lineHeight: 1 }}>
      {m.emoji || code.slice(0, 2)}
    </span>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  VIEW: BERANDA (dark)
// ════════════════════════════════════════════════════════════════════════════
function BerandaView({ student, intel, karakter, aspek, dukungan, setView }) {
  const dom = intel.filter((i) => i.level === "Kuat");
  const perhatian = aspek.filter((a) => a.status === "perhatian");
  const well = aspek.length ? calcWellbeing(aspek) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <SCard glow style={{ padding: "22px 20px", background: "linear-gradient(150deg, rgba(157,107,255,0.28), rgba(109,40,217,0.10) 60%, rgba(255,255,255,0.02))" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <SChip><IcSparkle size={12} /> Semester ini</SChip>
            <h2 style={{ margin: "12px 0 0", fontSize: 23, fontWeight: 800, letterSpacing: "-.02em", lineHeight: 1.15, color: "#fff" }}>
              Halo, {student.panggilan}!
            </h2>
            <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "rgba(245,242,252,0.76)" }}>
              Kamu berkembang pesat semester ini. Karaktermu makin kuat, bakatmu mulai bersinar, dan perasaanmu lagi cukup cerah.
            </p>
          </div>
          {student.karakter ? <RingGauge value={student.karakter} size={104} stroke={11} gradient={["#C9B0FF", "#7C3AED"]} label="Karakter" /> : null}
        </div>
      </SCard>

      {dom.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#B68CFF", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 11, fontFamily: FONT_DISP }}>Kekuatan supermu</div>
          <div style={{ display: "flex", gap: 11 }}>
            {dom.map((it) => (
              <SCard key={it.code} style={{ flex: 1, padding: "16px 15px", textAlign: "center" }}>
                <IntelBadge code={it.code} size={44} />
                <div style={{ marginTop: 11, fontSize: 14.5, fontWeight: 800, color: "rgba(245,242,252,1)", letterSpacing: "-.01em" }}>{it.name}</div>
                <div style={{ marginTop: 3, fontSize: 11.5, fontWeight: 700, color: "#B68CFF" }}>{it.score}/100 · {it.level}</div>
              </SCard>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        <SJumpLink Icon={IcSparkle} title="Bakatmu" note={dom.length ? "Menonjol: " + dom.map((d) => d.name).join(" & ") : "Lihat peta kecerdasanmu"} onOpen={() => setView("bakat")} />
      </div>
    </div>
  );
}

function SJumpLink({ Icon, title, note, tone, onOpen }) {
  const col = tone === "perhatian" ? "#FBBF24" : "#B68CFF";
  return (
    <button onClick={onOpen} className={styles.sjump}>
      <span style={{ width: 42, height: 42, borderRadius: 13, background: "rgba(157,107,255,0.20)", color: col, display: "grid", placeItems: "center", flexShrink: 0 }}>
        <Icon size={21} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: "rgba(245,242,252,1)" }}>{title}</div>
        <div style={{ fontSize: 12, color: "rgba(245,242,252,0.52)", marginTop: 2 }}>{note}</div>
      </div>
      <IcArrowRight size={18} style={{ color: "rgba(245,242,252,0.34)", flexShrink: 0 }} />
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  KOMPONEN LIGHT (Laporan Bakat)
// ════════════════════════════════════════════════════════════════════════════

function LCard({ children, style }) {
  return (
    <div style={{ background: T.surface, borderRadius: 28, padding: 18, border: `1px solid ${T.divider}`, boxShadow: T.shadowSm, ...style }}>
      {children}
    </div>
  );
}

function LSectionHeader({ eyebrow, title }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: T.brand, marginBottom: 5 }}>{eyebrow}</div>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: "-.01em", color: T.textStrong, lineHeight: 1.2, fontFamily: MONT }}>{title}</h2>
    </div>
  );
}

function Chevron({ dir = "right", size = 14, color = "currentColor", w = 2.5 }) {
  const pts = dir === "down" ? "6 9 12 15 18 9" : dir === "right" ? "9 18 15 12 9 6" : "15 18 9 12 15 6";
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><polyline points={pts} /></svg>;
}

function CollapseHeader({ eyebrow, eyebrowColor, title, open, onToggle }) {
  return (
    <div onClick={onToggle} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", padding: "2px 0" }}>
      <div>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: eyebrowColor || T.brand, marginBottom: 3 }}>{eyebrow}</div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: "-.01em", color: T.textStrong, fontFamily: MONT }}>{title}</h2>
      </div>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.ink100, display: "grid", placeItems: "center", flexShrink: 0, color: T.textBody }}>
        <Chevron dir={open ? "down" : "right"} />
      </div>
    </div>
  );
}

// ── Peta kecerdasan (sunburst/petal) ───────────────────────────────────────────
function PetalChart({ items }) {
  const cx = 160, cy = 148, maxR = 96, labelR = 116;
  const R = (n) => Math.round(n * 10) / 10;
  const petals = items.map((m, i) => {
    const ang = (-90 + i * 45) * Math.PI / 180;
    const cos = Math.cos(ang), sin = Math.sin(ang);
    const r = maxR * Math.max(0.06, m.frac);
    const anchor = cos > 0.35 ? "start" : cos < -0.35 ? "end" : "middle";
    const ldy = sin < -0.5 ? -6 : sin > 0.5 ? 13 : 4;
    const ly = R(cy + sin * labelR + ldy);
    const parts = m.short.split('|');
    return { ...m, x2: R(cx + cos * r), y2: R(cy + sin * r), tx: R(cx + cos * maxR), ty: R(cy + sin * maxR), lx: R(cx + cos * labelR), ly, sy: R(ly + (parts.length > 1 ? 23 : 12)), anchor, parts };
  });
  return (
    <svg viewBox="0 0 320 300" style={{ width: "100%", height: "auto", display: "block" }}>
      <circle cx={cx} cy={cy} r={96} fill="rgba(187,247,208,0.16)" />
      <circle cx={cx} cy={cy} r={72} fill="rgba(254,243,199,0.30)" />
      <circle cx={cx} cy={cy} r={48} fill="rgba(241,245,249,0.52)" />
      <circle cx={cx} cy={cy} r={96} fill="none" stroke="rgba(34,197,94,0.22)" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={72} fill="none" stroke="rgba(217,119,6,0.32)" strokeWidth={1.5} strokeDasharray="4,3" />
      <circle cx={cx} cy={cy} r={48} fill="none" stroke="rgba(148,163,184,0.32)" strokeWidth={1.5} strokeDasharray="4,3" />
      {petals.map((p, i) => <line key={`g${i}`} x1={cx} y1={cy} x2={p.tx} y2={p.ty} stroke={T.ink100} strokeWidth={2} strokeLinecap="round" />)}
      {petals.map((p, i) => <line key={`s${i}`} x1={cx} y1={cy} x2={p.x2} y2={p.y2} stroke={p.color} strokeWidth={13} strokeLinecap="round" />)}
      {petals.map((p, i) => <circle key={`d${i}`} cx={p.x2} cy={p.y2} r={4.5} fill="#fff" stroke={p.color} strokeWidth={3} />)}
      <circle cx={cx} cy={cy} r={19} fill={T.violet50} />
      <path d="M160 139l2.1 6.3 6.4 0.2-5.1 3.8 1.9 6.1-5.2-3.6-5.2 3.6 1.9-6.1-5.1-3.8 6.4-0.2z" fill={T.brand} />
      {petals.map((p, i) => (
        <text key={`t${i}`} x={p.lx} y={p.ly} textAnchor={p.anchor} style={{ fontFamily: MONT, fontWeight: 800, fontSize: 9.5, fill: T.textStrong }}>
          {p.parts.length === 1
            ? p.parts[0]
            : p.parts.map((part, j) => <tspan key={j} x={p.lx} dy={j === 0 ? "0" : "11"}>{part}</tspan>)}
        </text>
      ))}
      {petals.map((p, i) => <text key={`v${i}`} x={p.lx} y={p.sy} textAnchor={p.anchor} fill={p.color} style={{ fontFamily: MONT, fontWeight: 800, fontSize: 10 }}>{p.score}</text>)}
    </svg>
  );
}

// ── Dialog bottom sheet ────────────────────────────────────────────────────────
function DialogOverlay({ dialog, onClose }) {
  if (!dialog) return null;
  const stop = (e) => e.stopPropagation();
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.54)", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px" }}>
      <div onClick={stop} style={{ background: "#fff", borderRadius: 28, padding: "20px 22px 36px", width: "100%", maxWidth: 420, maxHeight: "84vh", overflowY: "auto", animation: "fammiUp .26s ease both" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <button onClick={onClose} style={{ border: "none", background: T.ink100, borderRadius: "50%", width: 32, height: 32, fontSize: 19, cursor: "pointer", display: "grid", placeItems: "center", color: T.textMuted }}>×</button>
        </div>
        {dialog.type === "kecerdasan" && <DlgKecerdasan d={dialog.data} />}
        {dialog.type === "profesi" && <DlgProfesi name={dialog.data.name} p={dialog.data.p} />}
        {dialog.type === "studi" && <DlgStudi s={dialog.data} />}
      </div>
    </div>
  );
}

function DlgKecerdasan({ d }) {
  const ls = LEVEL_STYLE[d.level] || LEVEL_STYLE.Sedang;
  return (
    <div>
      <span style={{ fontSize: 34, lineHeight: 1, display: "block", marginBottom: 7 }}>{d.emoji}</span>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: T.brand }}>Kecerdasan</div>
      <h2 style={{ margin: "3px 0 12px", fontSize: 21, fontWeight: 900, letterSpacing: "-.02em", color: T.textStrong, fontFamily: MONT }}>{d.name}</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 15 }}>
        <span style={{ fontSize: 28, fontWeight: 900, color: d.color, fontFamily: MONT }}>{d.score}</span>
        <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 11px", borderRadius: 999, background: ls.bg, color: d.color }}>{d.level}</span>
      </div>
      {d.arti && (
        <div style={{ background: "#F8F7FF", borderRadius: 14, padding: "13px 14px", marginBottom: 13 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: T.textMuted, marginBottom: 6 }}>Artinya:</div>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: T.textBody }}>{d.arti}</p>
        </div>
      )}
      {d.terlihat.length > 0 && (
        <div style={{ marginBottom: 13 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: T.textMuted, marginBottom: 9 }}>Terlihat dari:</div>
          {d.terlihat.map((sign, i) => (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ width: 19, height: 19, borderRadius: 5, background: ls.bg, color: d.color, display: "grid", placeItems: "center", flexShrink: 0, fontSize: 10, fontWeight: 800 }}>✓</span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: T.textBody }}>{sign}</span>
            </div>
          ))}
        </div>
      )}
      {d.lakukan.length > 0 && (
        <div style={{ background: T.violet100, borderRadius: 14, padding: "13px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: T.violet700, marginBottom: 9 }}>Cara mengasahnya:</div>
          {d.lakukan.map((act, i) => (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 7 }}>
              <span style={{ color: T.brand, fontSize: 14, lineHeight: 1.4, flexShrink: 0 }}>›</span>
              <span style={{ fontSize: 12.5, lineHeight: 1.5, color: T.violet700 }}>{act}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DlgProfesi({ name, p }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: T.brand }}>Profesi</div>
      <h2 style={{ margin: "3px 0 12px", fontSize: 21, fontWeight: 900, letterSpacing: "-.02em", color: T.textStrong, fontFamily: MONT }}>{name}</h2>
      {!p && (
        <div style={{ background: T.violet100, borderRadius: 14, padding: "14px 16px" }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: T.violet700 }}>Detail profesi <strong>{name}</strong> belum ada di database. Profesi ini relevan dengan kecerdasanmu, tetapi konten detailnya perlu ditambahkan terlebih dahulu.</p>
        </div>
      )}
      {p && <>
        <div style={{ background: "#F8F7FF", borderRadius: 14, padding: "13px 14px", marginBottom: 13 }}>
          <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: T.textBody }}>{p.desc}</p>
        </div>
        <div style={{ marginBottom: 13 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: T.textMuted, marginBottom: 9 }}>Skill utama yang dibutuhkan:</div>
          {p.skills.map((sk, i) => (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 8 }}>
              <span style={{ width: 19, height: 19, borderRadius: 5, background: T.mintSoft, color: T.mintInk, display: "grid", placeItems: "center", flexShrink: 0, fontSize: 10, fontWeight: 800 }}>✓</span>
              <span style={{ fontSize: 13, lineHeight: 1.5, color: T.textBody }}>{sk}</span>
            </div>
          ))}
        </div>
        <div style={{ background: T.skySoft, borderRadius: 14, padding: "13px 14px", marginBottom: 13 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: T.skyInk, marginBottom: 6 }}>Cara masuk ke jalur ini:</div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: T.skyInk }}>{p.jalur}</p>
        </div>
        {p.figur && p.figur.length > 0 && (
          <div style={{ background: T.violet100, borderRadius: 14, padding: "13px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: T.violet700, marginBottom: 9 }}>Figur yang bisa jadi inspirasi:</div>
            {p.figur.map((f, i) => (
              <div key={i} style={{ display: "flex", gap: 9, alignItems: "center", marginBottom: 7 }}>
                <span style={{ color: T.brand, fontSize: 14, flexShrink: 0 }}>›</span>
                <span style={{ fontSize: 12.5, color: T.violet700, fontWeight: 600 }}>{f}</span>
              </div>
            ))}
          </div>
        )}
      </>}
    </div>
  );
}

function DlgStudi({ s }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <span style={{ width: 44, height: 44, borderRadius: "50%", background: s.color, color: "#fff", display: "grid", placeItems: "center", fontWeight: 800, fontSize: 15, flexShrink: 0 }}>{s.initials}</span>
        <div><div style={{ fontSize: 16, fontWeight: 800, color: T.textStrong }}>{s.name}</div><div style={{ fontSize: 11.5, color: T.textMuted }}>{s.profile}</div></div>
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, color: s.color, marginBottom: 12 }}>{s.tagline}</div>
      <div style={{ background: "#F8F7FF", borderRadius: 14, padding: 14, marginBottom: 13 }}>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.7, color: T.textBody }}>{s.story}</p>
      </div>
      <div style={{ marginBottom: 13 }}>
        <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: T.textMuted, marginBottom: 9 }}>Kunci perjalanannya:</div>
        {s.kunci.map((k, i) => (
          <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 8 }}>
            <span style={{ width: 19, height: 19, borderRadius: 5, background: s.lightBg, color: s.color, display: "grid", placeItems: "center", flexShrink: 0, fontSize: 10, fontWeight: 800 }}>✓</span>
            <span style={{ fontSize: 13, lineHeight: 1.5, color: T.textBody }}>{k}</span>
          </div>
        ))}
      </div>
      <div style={{ background: T.violet100, borderRadius: 14, padding: "13px 14px" }}>
        <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".08em", color: T.violet700, marginBottom: 6 }}>Catatan penting:</div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: T.violet700, fontStyle: "italic" }}>{s.catatan}</p>
      </div>
    </div>
  );
}

const CIRI_TONE = {
  sky:     { soft: T.skySoft, ink: T.skyInk, solid: T.sky },
  blossom: { soft: T.blossomSoft, ink: T.blossomInk, solid: T.blossom },
  sun:     { soft: T.sunSoft, ink: T.sunInk, solid: T.sun },
  mint:    { soft: T.mintSoft, ink: T.mintInk, solid: T.mint },
};

// ════════════════════════════════════════════════════════════════════════════
//  VIEW: BAKAT (light, Laporan Bakat Siswa)
// ════════════════════════════════════════════════════════════════════════════
// Modul yang tersedia untuk peran Siswa. Floating menu dibangun dari sini.
// Saat ini baru "mi" (Laporan Bakat) yang dibangun; karakter dan screening menyusul.
const SISWA_MODULE_DEFS = [
  { key: "mi",        label: "Laporan Bakat",  emoji: "🧭" },
  { key: "karakter",  label: "Rapor Karakter", emoji: "🌱" },
  { key: "screening", label: "Screening",      emoji: "🧩" },
];

// Pilih modul yang dilanggan user. Idealnya session.modules diisi gerbang GAS
// dari entitlement sekolah. Sebelum itu siap, fallback ke hanya "mi".
function buildSiswaModules(session) {
  const langganan = (session && Array.isArray(session.modules) && session.modules.length)
    ? session.modules
    : ["mi"];
  return SISWA_MODULE_DEFS
    .filter((m) => langganan.indexOf(m.key) !== -1)
    .map((m) => ({ ...m, current: m.key === "mi" }));
}

function BakatView({ student, intel, topDetails, mi, isSample, onLogout, modules }) {
  const [dialog, setDialog] = useState(null);
  const [activePath, setActivePath] = useState(0);
  const [openCara, setOpenCara] = useState(false);
  const [openSmart, setOpenSmart] = useState(false);
  const [openSinyal, setOpenSinyal] = useState(false);
  const [checkedDays, setCheckedDays] = useState({});
  const [showFab, setShowFab] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => setShowFab(!entry.isIntersecting), { threshold: 0 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function scrollToTop() {
    if (sentinelRef.current) sentinelRef.current.scrollIntoView({ behavior: "smooth" });
  }

  if (!intel || intel.length === 0) {
    return (
      <div style={{ background: T.bg, minHeight: "100%", padding: "60px 24px", textAlign: "center", fontFamily: MONT }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>✨</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.textStrong, marginBottom: 8 }}>Hasil asesmen sedang disiapkan</div>
        <div style={{ fontSize: 13, color: T.textMuted, lineHeight: 1.6 }}>Begitu siap, peta kecerdasanmu akan muncul di sini.</div>
      </div>
    );
  }

  const panggilan = student.panggilan || "kamu";
  const P = (s) => (s || "").replace(/Aisyah/g, panggilan);

  // Urutkan desc + hitung skala, warna spoke, dan tingkat-indeks
  const sorted = [...intel].sort((a, b) => b.score - a.score);
  const scaleMax = Math.max(...sorted.map((x) => x.score), 1) > 30 ? 100 : 25;
  const levelIdx = { Kuat: 0, Sedang: 0, Berkembang: 0 };
  const chart = sorted.map((it) => {
    const def = INTEL_DEFAULTS[it.code] || {};
    const idx = levelIdx[it.level] !== undefined ? levelIdx[it.level]++ : 0;
    const pal = DV_LEVEL_COLORS[it.level] || DV_LEVEL_COLORS.Berkembang;
    return { ...it, short: def.short || it.code, frac: it.score / scaleMax, color: pal[idx] || "#94A3B8" };
  });
  const colorByCode = Object.fromEntries(chart.map((c) => [c.code, c.color]));

  const top = topDetails && topDetails.length ? topDetails : sorted.slice(0, 3).map((x) => ({ code: x.code, name: x.name, score: x.score, level: x.level }));
  const top1 = top[0] || {};
  const top2 = top[1] || {};
  const top3 = top[2] || {};
  const topCode = top1.code;

  // Buka dialog kecerdasan: gabungkan data real + default
  function openKecerdasan(code) {
    const real = intel.find((x) => x.code === code) || {};
    const def = INTEL_DEFAULTS[code] || {};
    setDialog({ type: "kecerdasan", data: {
      name: real.name || def.name || code,
      emoji: def.emoji || "✨",
      score: real.score ?? "",
      level: real.level || "Sedang",
      color: colorByCode[code] || T.brand,
      arti: (real.desc || "").trim() || def.arti || "",
      terlihat: (real.terlihat && real.terlihat.length) ? real.terlihat : (def.terlihat || []),
      lakukan: (real.lakukan && real.lakukan.length) ? real.lakukan : (def.lakukan || []),
    } });
  }
  const openProfesi = (name) => {
    const curPath = paths[Math.min(activePath, paths.length - 1)] || paths[0];
    const key = (name || "").toLowerCase().trim();
    const fromDetail = curPath?.profesiDetail?.[key] || null;
    const fromSorot = (curPath?.profesiSorot?.nama?.toLowerCase().trim() === key) ? curPath.profesiSorot : null;
    const p = PROFESI_DB[name] || fromDetail || fromSorot || null;
    setDialog({ type: "profesi", data: { name, p } });
  };
  const openStudi = (i) => setDialog({ type: "studi", data: STUDI_KASUS[i] });

  // Sumber data: kolom sheet bila ada, jika kosong pakai default
  const coverHead = mi?.narasiCover || COVER_HEADLINE[topCode] || COVER_HEADLINE.Ve;
  const keunikanTitle = KEUNIKAN_TITLE[topCode] || KEUNIKAN_TITLE.Ve;
  const caraSummary = mi?.caraBelajarSummary || DEFAULT_CARA_BELAJAR_SUMMARY;
  const caraItems = (mi?.caraBelajarItems && mi.caraBelajarItems.length) ? mi.caraBelajarItems : DEFAULT_CARA_BELAJAR;
  const gPositif = (mi?.gayaKomPositif && mi.gayaKomPositif.length) ? mi.gayaKomPositif : DEFAULT_GAYA_POSITIF;
  const gHindari = (mi?.gayaKomHindari && mi.gayaKomHindari.length) ? mi.gayaKomHindari : DEFAULT_GAYA_HINDARI;
  const gSiswa = (mi?.gayaKomSiswa && mi.gayaKomSiswa.length) ? mi.gayaKomSiswa : DEFAULT_GAYA_SISWA;
  const smartGoals = (mi?.smartGoalsSheet && mi.smartGoalsSheet.s)
    ? [["S", "Spesifik", mi.smartGoalsSheet.s], ["M", "Terukur", mi.smartGoalsSheet.m], ["A", "Achievable", mi.smartGoalsSheet.a], ["R", "Relevan", mi.smartGoalsSheet.r], ["T", "Time-bound", mi.smartGoalsSheet.t]].map(([letter, label, content]) => ({ letter, label, content }))
    : DEFAULT_SMART_GOALS;
  const days = (mi?.hari7 && mi.hari7.length) ? mi.hari7.map((task, i) => ({ label: DEFAULT_DAYS[i]?.label || `Hari ke-${i + 1}`, task })) : DEFAULT_DAYS;
  const sinyal = (mi?.sinyalOrtu && mi.sinyalOrtu.length) ? mi.sinyalOrtu : DEFAULT_SINYAL;
  const ciri = (mi?.ciriKhas && mi.ciriKhas.length) ? mi.ciriKhas.map((text, i) => ({ text, tone: DEFAULT_CIRI_KHAS[i % 4].tone })) : DEFAULT_CIRI_KHAS;
  const refleksi = (mi?.refleksiQuestions && mi.refleksiQuestions.length) ? mi.refleksiQuestions : DEFAULT_REFLEKSI;
  const diskusi = (mi?.diskusiQuestions && mi.diskusiQuestions.length) ? mi.diskusiQuestions : DEFAULT_DISKUSI;
  const mapelKuasai = (mi?.mapelKuasai && mi.mapelKuasai.length) ? mi.mapelKuasai : DEFAULT_MAPEL_KUASAI;
  const mapelTantang = (mi?.mapelSulit && mi.mapelSulit.length) ? mi.mapelSulit.map((m) => m.nama) : DEFAULT_MAPEL_TANTANG;
  const essayCara     = mi?.essayCara     || "";
  const essayBerhasil = mi?.essayBerhasil || "";
  const essayKelebihan= mi?.essayKelebihan|| "";
  const essayCita     = mi?.essayCita     || "";
  const essayAlasan   = mi?.essayAlasan   || "";

  const daysCompleted = Object.values(checkedDays).filter(Boolean).length;
  const daysPercent = Math.round(daysCompleted / days.length * 100);
  const paths = (topDetails && topDetails.length > 0)
    ? topDetails.map((t, i) => {
        const PATH_CLRS = [
          { color: T.brand,   bgColor: T.violet100, inkColor: T.violet700 },
          { color: "#0891B2", bgColor: "#E0F7FA",   inkColor: "#006780"   },
          { color: "#7C3AED", bgColor: "#EDE9FE",   inkColor: "#4C1D95"   },
        ];
        const clr  = PATH_CLRS[i] || PATH_CLRS[0];
        const def  = INTEL_DEFAULTS[t.code] || {};
        const meta = INTEL_META[t.code]     || {};
        return {
          emoji:       meta.emoji || "✨",
          label:       t.name,
          tagline:     meta.tagline || "",
          description: t.arti || def.arti || "",
          color:       clr.color,
          bgColor:     clr.bgColor,
          inkColor:    clr.inkColor,
          kegiatan:    (t.lakukan  && t.lakukan.length)  ? t.lakukan.slice(0, 5)  : (def.lakukan || []).slice(0, 5),
          jurusan:      t.jurusan && t.jurusan.length ? t.jurusan : [],
          profesi:      (t.profesi  && t.profesi.length)  ? t.profesi  : [],
          parentTip:    t.parentTip || "",
          profesiSorot: t.profesiSorot || null,
          profesiDetail: t.profesiDetail || {},
        };
      })
    : PATHS;
  const activeP = paths[Math.min(activePath, paths.length - 1)] || paths[0];

  const sectionMt = { marginTop: 34 };
  const initials = (student.name || "S").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div style={{ background: T.bg, minHeight: "100%", fontFamily: MONT, color: T.textStrong }}>
      <div ref={sentinelRef} style={{ height: 0, pointerEvents: "none" }} />
      <header style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderBottom: `1px solid ${T.divider}`, padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src="/logo-purple.png" alt="Fammi" style={{ height: 22, width: "auto", objectFit: "contain" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {(student.kelas || student.sekolah) && <span style={{ fontSize: 11, fontWeight: 600, color: T.textMuted }}>{[student.kelas, student.sekolah].filter(Boolean).join(" · ")}</span>}
          {onLogout && (
            <button onClick={onLogout} style={{ width: 32, height: 32, borderRadius: 10, background: T.ink100, border: `1px solid ${T.divider}`, color: T.textMuted, display: "grid", placeItems: "center", cursor: "pointer" }}>
              <IcLogout size={14} />
            </button>
          )}
        </div>
      </header>

      <div style={{ padding: "18px 18px 28px" }}>

      {/* ═══ COVER ═══ */}
      <div style={{ position: "relative", overflow: "hidden", borderRadius: 36, padding: "24px 22px 22px", background: "radial-gradient(120% 120% at 85% 0%,#7B3BF0 0%,#6323DA 45%,#4A12B0 100%)", color: "#fff", boxShadow: T.shadowPop }}>
        <div style={{ position: "absolute", right: -36, top: -36, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.09)" }} />
        <div style={{ position: "absolute", left: -30, bottom: -50, width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "relative" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.22)", padding: "6px 13px", borderRadius: 999, fontSize: 11.5, fontWeight: 700 }}>
            <IcSparkle size={12} /> Tes Multiple Intelligence
          </span>
          <h1 style={{ margin: "14px 0 0", fontSize: 22, fontWeight: 600, letterSpacing: "-.02em", lineHeight: 1.25, color: "#fff", fontFamily: MONT }}>{P(coverHead)}</h1>
          <p style={{ margin: "10px 0 0", fontSize: 12.5, lineHeight: 1.55, color: "rgba(255,255,255,0.72)", maxWidth: 300 }}>Laporan ini memetakan pola belajarmu, bukan sekadar skor.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
            {chart.map((c, i) => <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c.color, boxShadow: "0 0 0 2.5px rgba(255,255,255,0.18)", display: "block" }} />)}
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 18, background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.18)", padding: 8, borderRadius: 999 }}>
            <span style={{ width: 34, height: 34, borderRadius: 999, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.9)", color: T.brand, fontWeight: 800, fontSize: 13, flexShrink: 0 }}>{initials}</span>
            <div style={{ paddingRight: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{student.name}</div>
              {(student.kelas || student.sekolah) && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>{[student.kelas, student.sekolah].filter(Boolean).join(" · ")}</div>}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ KEUNIKAN UTAMA ═══ */}
      <div style={{ marginTop: 20 }}>
        <LCard style={{ borderRadius: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: T.brand }}>Tiga kecerdasan teratas</div>
          <h2 style={{ margin: "6px 0 0", fontSize: 18, fontWeight: 800, letterSpacing: "-.01em", lineHeight: 1.3, color: T.textStrong }}>{keunikanTitle}</h2>
          <div style={{ display: "flex", gap: 10, marginTop: 13 }}>
            <div style={{ flex: 1, borderRadius: 14, padding: 12, background: T.infoSoft }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: T.info }}>Top 1 · {top1.score}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.textStrong, marginTop: 4 }}>{top1.name}</div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{SHORT_TAGLINE[top1.code] || ""}</div>
            </div>
            {top2.name && (
              <div style={{ flex: 1, borderRadius: 14, padding: 12, background: "#DFF1F3" }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#1E94A6" }}>Top 2 · {top2.score}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.textStrong, marginTop: 4 }}>{top2.name}</div>
                <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{SHORT_TAGLINE[top2.code] || ""}</div>
              </div>
            )}
          </div>
        </LCard>
      </div>

      {/* ═══ PETA KECERDASAN ═══ */}
      <div style={sectionMt}>
        <LSectionHeader eyebrow="Hasil screening" title="Peta kecerdasan" />
        <LCard>
          <PetalChart items={chart} />
          <div style={{ display: "flex", justifyContent: "center", gap: 14, padding: "6px 0 13px", flexWrap: "wrap" }}>
            <Legend color="#16A34A" label="Kuat" range="75-100" />
            <Legend color="#D97706" label="Sedang" range="50-74" />
            <Legend color="#94A3B8" label="Berkembang" range="<50" />
          </div>
          <div style={{ height: 1, background: T.divider }} />
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: T.textFaint, marginBottom: 7 }}>Tap untuk detail tiap kecerdasan</div>
            {chart.map((c) => {
              const ls = LEVEL_STYLE[c.level] || LEVEL_STYLE.Sedang;
              return (
                <div key={c.code} onClick={() => openKecerdasan(c.code)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 8px", borderRadius: 11, cursor: "pointer", marginBottom: 2 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 2, background: c.color, flexShrink: 0, display: "block" }} />
                  <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: T.textBody, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 999, background: ls.bg, color: ls.ink, whiteSpace: "nowrap", flexShrink: 0 }}>{c.level}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: T.textStrong, width: 24, textAlign: "right", flexShrink: 0, fontFamily: MONT }}>{c.score}</span>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textFaint} strokeWidth="2" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                </div>
              );
            })}
          </div>
        </LCard>
      </div>

      {/* ═══ CIRI KHAS ═══ */}
      <div style={sectionMt}>
        <LSectionHeader eyebrow="Terlihat dari keseharianmu" title="Ciri khasmu" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11 }}>
          {ciri.map((c, i) => {
            const tone = CIRI_TONE[c.tone] || CIRI_TONE.sky;
            return (
              <div key={i} style={{ background: tone.soft, borderRadius: 22, padding: 15 }}>
                <span style={{ width: 36, height: 36, borderRadius: 11, background: tone.solid, color: tone.ink, display: "grid", placeItems: "center" }}>
                  <IcSparkle size={17} />
                </span>
                <div style={{ fontSize: 13, fontWeight: 700, color: tone.ink, lineHeight: 1.35, marginTop: 10 }}>{P(c.text)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ CARA BELAJAR ═══ */}
      <div style={sectionMt}>
        <CollapseHeader eyebrow={`Cara belajar ${panggilan}`} title="Yang paling cocok buatmu" open={openCara} onToggle={() => setOpenCara((o) => !o)} />
        <div style={{ marginTop: 11, background: T.skySoft, borderRadius: 13, padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: T.skyInk }}>{P(caraSummary)}</p>
        </div>
        {(essayCara || essayBerhasil) && (
          <div style={{ marginTop: 9, background: "#fff", borderRadius: 14, padding: "12px 14px", border: `1px solid ${T.divider}`, display: "flex", flexDirection: "column", gap: 10 }}>
            {essayCara && (
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: T.textMuted, marginBottom: 4 }}>Cara belajar sehari-harinya, kata {panggilan}</div>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: T.textBody, fontStyle: "italic" }}>"{essayCara}"</p>
              </div>
            )}
            {essayBerhasil && essayBerhasil !== essayCara && (
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: T.textMuted, marginBottom: 4 }}>Yang paling berhasil menurutnya</div>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: T.textBody, fontStyle: "italic" }}>"{essayBerhasil}"</p>
              </div>
            )}
          </div>
        )}
        {openCara && (
          <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 8 }}>
            {caraItems.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fff", borderRadius: 15, padding: 13, border: `1px solid ${T.divider}` }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: T.brand, flexShrink: 0, minWidth: 20, fontFamily: MONT }}>{item.no || String(i + 1).padStart(2, "0")}</span>
                <div><div style={{ fontSize: 13, fontWeight: 800, color: T.textStrong, marginBottom: 3 }}>{P(item.title)}</div><div style={{ fontSize: 12.5, lineHeight: 1.55, color: T.textBody }}>{P(item.body)}</div></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ SMART GOALS ═══ */}
      <div style={sectionMt}>
        <CollapseHeader eyebrow="Target yang terukur" title={`SMART Goals ${panggilan}`} open={openSmart} onToggle={() => setOpenSmart((o) => !o)} />
        <div style={{ marginTop: 11, background: T.violet100, borderRadius: 13, padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: T.violet700 }}>Tujuan konkret berbasis kekuatanmu, disusun agar bisa dievaluasi, bukan sekadar impian.</p>
        </div>
        {openSmart && (
          <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 8 }}>
            {smartGoals.map((g, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 15, padding: 14, border: `1px solid ${T.divider}` }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ width: 30, height: 30, borderRadius: 8, background: T.brand, color: "#fff", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 900, flexShrink: 0, fontFamily: MONT }}>{g.letter}</span>
                  <div><div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: T.brand, marginBottom: 3 }}>{g.label}</div><div style={{ fontSize: 13, lineHeight: 1.55, color: T.textBody }}>{P(g.content)}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ PETA JALAN ═══ */}
      <div style={sectionMt}>
        <LSectionHeader eyebrow="Dari sekolah ke karier" title="Jalur yang sesuai kecerdasanmu" />
        {(essayCita || essayAlasan) && (
          <div style={{ marginTop: 11, background: "#fff", borderRadius: 14, padding: "12px 14px", border: `1px solid ${T.divider}`, marginBottom: 4, display: "flex", flexDirection: "column", gap: 10 }}>
            {essayCita && (
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: T.textMuted, marginBottom: 4 }}>Cita-cita profesinya, kata {panggilan}</div>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: T.textBody, fontStyle: "italic" }}>"{essayCita}"</p>
              </div>
            )}
            {essayAlasan && (
              <div>
                <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: T.textMuted, marginBottom: 4 }}>Alasannya memilih profesi itu</div>
                <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: T.textBody, fontStyle: "italic" }}>"{essayAlasan}"</p>
              </div>
            )}
          </div>
        )}
        <p style={{ margin: "9px 2px 0", fontSize: 13, lineHeight: 1.55, color: T.textBody }}>Pilih jalur yang paling menarik. Profesi bisa diklik untuk detail lebih lanjut.</p>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "13px 0 3px", scrollbarWidth: "none" }}>
          {paths.map((p, i) => (
            <button key={i} onClick={() => setActivePath(i)} style={{ border: "none", cursor: "pointer", whiteSpace: "nowrap", padding: "10px 15px", borderRadius: 999, fontFamily: MONT, fontSize: 12.5, fontWeight: 700, background: activePath === i ? p.color : T.ink100, color: activePath === i ? "#fff" : T.textBody, flexShrink: 0 }}>{p.emoji} {p.label}</button>
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          <div style={{ background: activeP.bgColor, borderRadius: 28, padding: "18px 18px 20px", border: `1.5px solid ${activeP.color}30` }}>
            <div style={{ fontSize: 24, lineHeight: 1, marginBottom: 7 }}>{activeP.emoji}</div>
            <h3 style={{ margin: "0 0 3px", fontSize: 19, fontWeight: 900, letterSpacing: "-.02em", color: activeP.color, fontFamily: MONT }}>{activeP.label}</h3>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: activeP.inkColor, marginBottom: 9, fontStyle: "italic" }}>{activeP.tagline}</div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: activeP.inkColor }}>{activeP.description}</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 9 }}>
            <PathBlock n="1" eyebrow="Sekarang" title="Kegiatan yang perlu dicoba" color={activeP.color} bg={activeP.bgColor} ink={activeP.inkColor} items={activeP.kegiatan} />
            {activeP.jurusan && activeP.jurusan.length > 0 && (
              <PathBlock n="2" eyebrow="Nanti · MA & Kuliah" title="Jurusan yang relevan" color={activeP.color} bg={activeP.bgColor} ink={activeP.inkColor} items={activeP.jurusan} />
            )}
            <div style={{ background: "#fff", borderRadius: 22, padding: "14px 15px", border: `1px solid ${T.divider}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, background: activeP.color, color: "#fff", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, flexShrink: 0, fontFamily: MONT }}>3</span>
                <div><div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: T.textMuted }}>Masa Depan · Profesi</div><div style={{ fontSize: 13, fontWeight: 800, color: T.textStrong }}>Tap profesi untuk detail</div></div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                {activeP.profesi.map((prof, i) => (
                  <span key={i} onClick={() => openProfesi(prof)} style={{ padding: "5px 11px", borderRadius: 999, background: activeP.bgColor, color: activeP.inkColor, fontSize: 12, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}>{prof}<Chevron size={9} w={2.5} /></span>
                ))}
              </div>
            </div>
          </div>
          {activeP.profesiSorot && (
            <div style={{ background: "#fff", borderRadius: 22, padding: "14px 15px", border: `1.5px solid ${activeP.color}40`, cursor: "pointer" }}
                 onClick={() => setDialog({ type: "profesi", data: { name: activeP.profesiSorot.nama, p: activeP.profesiSorot } })}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: activeP.inkColor }}>Profesi Unggulan</div>
                <Chevron size={11} w={2.5} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: activeP.color }}>{activeP.profesiSorot.nama}</div>
              <p style={{ margin: "4px 0 0", fontSize: 12, lineHeight: 1.5, color: T.textBody }}>{activeP.profesiSorot.desc}</p>
            </div>
          )}
          {activeP.parentTip && (
            <div style={{ marginTop: 9, display: "flex", gap: 10, alignItems: "flex-start", background: T.violet100, borderRadius: 22, padding: "12px 14px" }}>
              <span style={{ flexShrink: 0, marginTop: 2 }}><IcSparkle size={13} /></span>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: T.violet700 }}><strong>Tips ortu:</strong> {activeP.parentTip}</p>
            </div>
          )}
          <p style={{ margin: "11px 4px 0", fontSize: 11.5, color: T.textMuted, textAlign: "center" }}>Jalur-jalur ini bisa dikombinasi. Kamu tidak harus memilih hanya satu.</p>
        </div>
      </div>

      {/* ═══ GAYA KOMUNIKASI KELUARGA ═══ */}
      <div style={sectionMt}>
        <LSectionHeader eyebrow="Untuk keluarga" title="Cara bicara yang menjangkaunya" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: "#fff", borderRadius: 22, padding: 16, border: `1px solid ${T.divider}` }}>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: T.textStrong, marginBottom: 11 }}>Yang membuat {panggilan} merespons lebih baik</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {gPositif.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ width: 20, height: 20, borderRadius: 6, background: T.mintSoft, color: T.mintInk, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.5, color: T.textBody }}>{P(item)}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: T.divider, margin: "13px 0" }} />
            <div style={{ fontSize: 12.5, fontWeight: 800, color: T.textStrong, marginBottom: 11 }}>Yang sebaiknya dikurangi</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {gHindari.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ width: 20, height: 20, borderRadius: 6, background: T.sunSoft, color: T.sunInk, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>!</span>
                  <span style={{ fontSize: 12.5, lineHeight: 1.5, color: T.textBody }}>{P(item)}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: T.mintSoft, borderRadius: 22, padding: 16 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".09em", textTransform: "uppercase", color: T.mintInk, marginBottom: 10 }}>Untuk {panggilan} sendiri</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.mintInk, marginBottom: 10 }}>Cara menyampaikan kebutuhanmu ke keluarga</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {gSiswa.map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.6)", borderRadius: 11, padding: "11px 12px" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: T.mintInk, marginBottom: 4 }}>{P(item.situasi)}</div>
                  <div style={{ fontSize: 12.5, fontStyle: "italic", color: T.mintInk }}>{P(item.script)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 7 HARI PERTAMA ═══ */}
      <div style={sectionMt}>
        <LSectionHeader eyebrow="Coba hari ini" title="7 Hari Pertama" />
        <p style={{ margin: "9px 2px 0", fontSize: 13, lineHeight: 1.55, color: T.textBody }}>Tujuh langkah kecil yang bisa dilakukan sekarang. Centang setiap hari yang sudah selesai.</p>
        <div style={{ marginTop: 14, background: "#fff", borderRadius: 28, padding: 16, border: `1px solid ${T.divider}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.textStrong }}>{daysCompleted} / {days.length} selesai</span>
            <span style={{ fontSize: 11.5, color: T.brand, fontWeight: 700 }}>{daysPercent}%</span>
          </div>
          <div style={{ height: 7, borderRadius: 999, background: T.ink100, overflow: "hidden", marginBottom: 14 }}>
            <div style={{ height: "100%", borderRadius: 999, background: T.brand, width: `${daysPercent}%`, transition: "width .4s ease" }} />
          </div>
          {days.map((d, i) => {
            const checked = !!checkedDays[i];
            return (
              <div key={i} onClick={() => setCheckedDays((p) => ({ ...p, [i]: !p[i] }))} style={{ display: "flex", gap: 13, alignItems: "flex-start", padding: "11px 4px", borderBottom: `1px solid ${T.divider}`, cursor: "pointer" }}>
                <div style={{ width: 26, height: 26, borderRadius: 8, background: checked ? T.brand : T.ink100, display: "grid", placeItems: "center", flexShrink: 0, marginTop: 1 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={checked ? "#fff" : T.textFaint} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: checked ? T.textMuted : T.brand, marginBottom: 2 }}>{d.label}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: checked ? T.textMuted : T.textBody, textDecoration: checked ? "line-through" : "none" }}>{P(d.task)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ PETA MATA PELAJARAN ═══ */}
      <div style={sectionMt}>
        <LSectionHeader eyebrow="Di kelas" title="Peta mata pelajaran" />
        <LCard>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ width: 30, height: 30, borderRadius: 9, background: T.mintSoft, color: T.mintInk, display: "grid", placeItems: "center" }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg></span><div style={{ fontSize: 14, fontWeight: 800, color: T.textStrong }}>Paling nyambung</div></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 11 }}>
            {mapelKuasai.map((m, i) => <Badge key={i} bg={T.mintSoft} fg={T.mintInk}>{m}</Badge>)}
          </div>
          <div style={{ height: 1, background: T.divider, margin: "16px 0" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ width: 30, height: 30, borderRadius: 9, background: T.sunSoft, color: T.sunInk, display: "grid", placeItems: "center" }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9z" /></svg></span><div style={{ fontSize: 14, fontWeight: 800, color: T.textStrong }}>Lebih menantang</div></div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 11 }}>
            {mapelTantang.map((m, i) => <Badge key={i} bg={T.sunSoft} fg={T.sunInk}>{m}</Badge>)}
          </div>
          <div style={{ marginTop: 12, background: T.sunSoft, borderRadius: 12, padding: "12px 13px", display: "flex", gap: 9 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.sunInk} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" /></svg>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: T.sunInk }}>Ini bukan kelemahan. Coba pelajari lewat <strong>cerita, diskusi, dan contoh nyata</strong>, cara belajar yang paling cocok dengan keunikanmu.</p>
          </div>
        </LCard>
      </div>

      {/* ═══ SINYAL ORANG TUA ═══ */}
      <div style={sectionMt}>
        <CollapseHeader eyebrow="Untuk orang tua" eyebrowColor={T.blossomInk} title="Tanda yang mungkin sudah lama hadir" open={openSinyal} onToggle={() => setOpenSinyal((o) => !o)} />
        <div style={{ marginTop: 11, background: T.blossomSoft, borderRadius: 13, padding: "12px 14px" }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: T.blossomInk }}>Lima tanda di keseharian {panggilan} yang mungkin sudah terlihat, tapi belum terbaca maknanya.</p>
        </div>
        {openSinyal && (
          <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 8 }}>
            {sinyal.map((item, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 15, padding: 13, border: `1px solid ${T.divider}` }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.2, width: 28, textAlign: "center" }}>{[...(item.icon||"")].length <= 3 ? item.icon : "✨"}</span>
                  <div style={{ minWidth: 0, flex: 1 }}><div style={{ fontSize: 13, fontWeight: 800, color: T.textStrong, marginBottom: 4, lineHeight: 1.3 }}>{P(item.title)}</div><div style={{ fontSize: 12.5, lineHeight: 1.55, color: T.textBody }}>{P(item.body)}</div></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══ RUANG REFLEKSI ═══ */}
      <div style={sectionMt}>
        <LSectionHeader eyebrow="Untuk kamu" title="Ruang refleksi" />
        <div style={{ background: T.lilacSoft, borderRadius: 28, padding: 18 }}>
          <p style={{ margin: "0 0 13px", fontSize: 12.5, lineHeight: 1.5, color: T.violet700, fontWeight: 700 }}>Tuliskan jawabanmu di buku catatan atau aplikasi jurnal. Tidak ada jawaban yang salah.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {refleksi.map((q, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,255,255,0.58)", borderRadius: 12, padding: "11px 12px" }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: T.brand, color: "#fff", fontSize: 11, fontWeight: 800, display: "grid", placeItems: "center", flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.45, color: T.violet700, fontWeight: 600 }}>{P(q)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ BAHAN DISKUSI ═══ */}
      <div style={sectionMt}>
        <LSectionHeader eyebrow="Untuk dibaca bersama" title="Bahan diskusi keluarga" />
        <div style={{ background: T.skySoft, borderRadius: 28, padding: 18 }}>
          <p style={{ margin: "0 0 12px", fontSize: 12.5, lineHeight: 1.5, color: T.skyInk, fontWeight: 700 }}>Bacakan pelan-pelan, lalu dengarkan. Tidak ada jawaban yang salah.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {diskusi.map((q, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "rgba(255,255,255,0.60)", borderRadius: 11, padding: "11px 12px" }}>
                <span style={{ width: 22, height: 22, borderRadius: "50%", background: T.skyInk, color: "#fff", fontSize: 11, fontWeight: 800, display: "grid", placeItems: "center", flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: 12.5, lineHeight: 1.45, color: T.skyInk, fontWeight: 600 }}>{P(q)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CATATAN PENTING ═══ */}
      <div style={{ marginTop: 20, background: T.sunSoft, borderRadius: 28, padding: 18 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <span style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.55)", color: T.sunInk, display: "grid", placeItems: "center", flexShrink: 0 }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1h6c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z" /></svg></span>
          <div><div style={{ fontSize: 14, fontWeight: 800, color: T.sunInk }}>Peta ini pintu, bukan pagar</div><p style={{ margin: "5px 0 0", fontSize: 12, lineHeight: 1.55, color: T.sunInk }}>Hasil ini bahan diskusi, bukan vonis. Keunikan bisa tumbuh dan berubah. Kalau kenyataannya berbeda, ikuti yang membuat anak hidup, termasuk nilai akademiknya.</p></div>
        </div>
      </div>

      {/* ═══ FOOTER CONTOH (hanya untuk laporan contoh, jangan muncul di data asli) ═══ */}
      {isSample && (
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, textAlign: "center" }}>
          <Badge bg={T.sunSoft} fg={T.sunInk} sm>Contoh</Badge>
          <span style={{ fontSize: 11, color: T.textFaint, lineHeight: 1.4 }}>Angka dan rekomendasi pada laporan asli mengikuti hasil asesmen ananda.</span>
        </div>
      )}

      </div>

      <DialogOverlay dialog={dialog} onClose={() => setDialog(null)} />

      <FloatingFab modules={modules} showTop={showFab} onTop={scrollToTop} />
    </div>
  );
}

// Floating menu modular. Isi: tombol "ke atas" (saat ter-scroll), daftar modul
// yang dilanggan, dan tautan ke website Fammi. Tambah modul lewat SISWA_MODULE_DEFS.
function FloatingFab({ modules, showTop, onTop }) {
  const [open, setOpen] = useState(false);

  const items = [];
  if (showTop) {
    items.push({ key: "top", label: "Ke atas", node: <IcArrowUp size={16} />, onClick: () => { onTop(); setOpen(false); } });
  }
  (modules || []).forEach((m) => {
    items.push({
      key: m.key,
      label: m.label,
      emoji: m.emoji,
      active: m.current,
      onClick: () => { if (m.current) onTop(); setOpen(false); },
    });
  });
  items.push({ key: "fammi", label: "Kunjungi Fammi", img: "/favicon-512.png", href: "https://fammi.ly/", onClick: () => setOpen(false) });

  const pill = (active) => ({
    display: "flex", alignItems: "center", gap: 10, padding: "8px 8px 8px 14px",
    borderRadius: 999, border: `1px solid ${active ? T.brand : T.divider}`,
    background: active ? T.violet100 : "#fff", color: active ? T.violet700 : T.textStrong,
    boxShadow: T.shadowPop, cursor: "pointer", textDecoration: "none",
    fontSize: 13, fontWeight: 700, fontFamily: MONT, whiteSpace: "nowrap",
  });
  const iconWrap = (active) => ({
    width: 28, height: 28, borderRadius: "50%", display: "grid", placeItems: "center",
    background: active ? T.brand : T.bg, color: active ? "#fff" : T.brand, fontSize: 15, flexShrink: 0,
  });

  return (
    <>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(12,8,23,0.04)" }} />
      )}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 120, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: 440, height: 0 }}>
          <div style={{ position: "absolute", bottom: 24, right: 18, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, pointerEvents: "auto" }}>
            {open && items.map((it, i) => {
              const inner = (
                <>
                  <span>{it.label}</span>
                  <span style={iconWrap(it.active)}>
                    {it.node || (it.img ? <img src={it.img} alt="" style={{ width: 17, height: 17, objectFit: "contain" }} /> : it.emoji)}
                  </span>
                </>
              );
              const st = { ...pill(it.active), animationDelay: `${i * 0.03}s` };
              return it.href ? (
                <a key={it.key} className={styles.fabItem} href={it.href} target="_blank" rel="noopener noreferrer" onClick={it.onClick} style={st}>{inner}</a>
              ) : (
                <button key={it.key} className={styles.fabItem} onClick={it.onClick} style={st}>{inner}</button>
              );
            })}
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={open ? "Tutup menu" : "Buka menu"}
              style={{ width: 52, height: 52, borderRadius: "50%", background: T.brand, color: "#fff", boxShadow: T.shadowPop, border: "none", cursor: "pointer", display: "grid", placeItems: "center" }}
            >
              {open ? <IcClose size={20} /> : <IcGrid size={20} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function IcClose({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}
function IcGrid({ size = 18 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
}

function Legend({ color, label, range }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 9, height: 9, borderRadius: 2, background: color, opacity: 0.75, display: "block" }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: T.textStrong }}>{label}</span>
      <span style={{ fontSize: 10, color: T.textMuted }}>{range}</span>
    </div>
  );
}

function Badge({ children, bg, fg, sm }) {
  return <span style={{ display: "inline-flex", alignItems: "center", padding: sm ? "3px 9px" : "5px 11px", borderRadius: 999, background: bg, color: fg, fontSize: sm ? 10.5 : 12, fontWeight: 700, whiteSpace: "nowrap" }}>{children}</span>;
}

function PathBlock({ n, eyebrow, title, color, bg, ink, items }) {
  return (
    <div style={{ background: "#fff", borderRadius: 22, padding: "14px 15px", border: `1px solid ${T.divider}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 7, background: color, color: "#fff", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 800, flexShrink: 0, fontFamily: MONT }}>{n}</span>
        <div><div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: T.textMuted }}>{eyebrow}</div><div style={{ fontSize: 13, fontWeight: 800, color: T.textStrong }}>{title}</div></div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {items.map((it, i) => <span key={i} style={{ padding: "5px 11px", borderRadius: 999, background: bg, color: ink, fontSize: 12, fontWeight: 700 }}>{it}</span>)}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  VIEW: KARAKTER (dark)
// ════════════════════════════════════════════════════════════════════════════
function KarakterView({ karakter }) {
  const levels = ["Konsisten", "Sering Muncul", "Kadang Muncul", "Belum Muncul"];
  const counts = levels.map((lv) => ({ lv, n: karakter.filter((k) => k.level === lv).length }));
  const segments = counts.filter((x) => x.n > 0).map((x) => ({ value: x.n, color: KAR_COLOR[x.lv] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <SHeading kicker="Lencana Karakter" title="Karaktermu" sub="Enam kebiasaan baik yang kamu tumbuhkan di sekolah dan di rumah. Kumpulkan terus lencananya!" />
      <SCard style={{ padding: "20px 18px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <DonutChart segments={segments} size={132} stroke={20} center={karakter.length} centerSub="Karakter" />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 9 }}>
            {counts.filter((x) => x.n > 0).map((x) => (
              <div key={x.lv} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: KAR_COLOR[x.lv], flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: "rgba(245,242,252,0.76)", fontWeight: 600, flex: 1 }}>{x.lv}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "rgba(245,242,252,1)" }}>{x.n}</span>
              </div>
            ))}
          </div>
        </div>
      </SCard>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {karakter.map((k) => <BadgeCard key={k.name} k={k} />)}
      </div>
    </div>
  );
}

function BadgeCard({ k }) {
  const col = KAR_COLOR[k.level];
  const earned = k.level === "Konsisten";
  return (
    <SCard style={{ padding: "15px 16px", display: "flex", alignItems: "center", gap: 15 }}>
      <div style={{ position: "relative", flexShrink: 0 }}>
        <RingGauge value={k.val} size={68} stroke={7} color={col} track="rgba(255,255,255,0.10)" suffix="%" />
        {earned && (
          <span style={{ position: "absolute", right: -2, bottom: -2, width: 22, height: 22, borderRadius: 99, background: "#9D6BFF", color: "#fff", display: "grid", placeItems: "center", border: "2px solid #0C0817", boxShadow: "0 0 12px rgba(157,107,255,0.7)" }}>
            <IcCheckCircle size={13} />
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "rgba(245,242,252,1)" }}>{k.name}</h3>
          <SChip tone={k.level === "Kadang Muncul" ? "perhatian" : "ungu"} style={{ padding: "3px 9px", fontSize: 10.5 }}>
            {k.level} <STrend t={k.trend} size={11} />
          </SChip>
        </div>
        <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.5, color: "rgba(245,242,252,0.52)" }}>{k.note}</p>
      </div>
    </SCard>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  VIEW: PERASAAN (dark)
// ════════════════════════════════════════════════════════════════════════════
function PerasaanView({ aspek }) {
  const perhatian = aspek.filter((a) => a.status === "perhatian");
  const aman = aspek.filter((a) => a.status === "aman");
  const well = calcWellbeing(aspek);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <SHeading kicker="Cuaca Perasaan" title="Perasaanmu" sub="Gambaran lembut tentang perasaan dan pertemananmu. Ini bukan penilaian, cuma cara mengenali diri sendiri." />
      <SCard style={{ padding: "20px 18px 16px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <SemiGauge value={well} size={260} label="Kesejahteraan" sub="Perasaanmu secara umum lagi cerah" />
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.11)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#34D399", letterSpacing: "-.02em", lineHeight: 1, fontFamily: FONT_DISP }}>{aman.length}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(245,242,252,0.76)", lineHeight: 1.25 }}>Terasa baik</span>
          </div>
          <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.11)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: "#FBBF24", letterSpacing: "-.02em", lineHeight: 1, fontFamily: FONT_DISP }}>{perhatian.length}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(245,242,252,0.76)", lineHeight: 1.25 }}>Bisa dirawat</span>
          </div>
        </div>
      </SCard>
      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
        {aspek.map((a) => <AspekCard key={a.name} a={a} />)}
      </div>
    </div>
  );
}

function AspekCard({ a }) {
  const ok = a.status === "aman";
  const col = ok ? "#34D399" : "#FBBF24";
  const bg  = ok ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)";
  return (
    <SCard style={{ padding: "15px 17px", display: "flex", alignItems: "flex-start", gap: 13 }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, background: bg, color: col, display: "grid", placeItems: "center", flexShrink: 0 }}>
        {ok ? <IcCheckCircle size={20} /> : <IcHeart size={20} />}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14.5, fontWeight: 700, color: "rgba(245,242,252,1)" }}>{a.name}</span>
          <SChip tone={ok ? "aman" : "perhatian"} style={{ padding: "4px 9px", fontSize: 10.5 }}>{ok ? "Baik" : "Dirawat"}</SChip>
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "rgba(245,242,252,0.76)" }}>{a.teks}</p>
      </div>
    </SCard>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  NAV + HEADER (dark shell)
// ════════════════════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  { id: "bakat", label: "Bakat", Icon: IcSparkle },
];

function SiswaHeader({ student, onLogout }) {
  return (
    <header className={styles.sHeader}>
      <div className={styles.sHeaderTop}>
        <img src="/logo.png" alt="FammiR" style={{ height: 28, width: "auto", objectFit: "contain" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <SChip><IcSparkle size={12} /> Mode Siswa</SChip>
          <button className={styles.sLogoutBtn} onClick={onLogout} title="Keluar">
            <IcLogout size={15} />
          </button>
        </div>
      </div>
      <div className={styles.sHeaderProfile}>
        <span className={styles.sAvatar}>{(student.panggilan || "S")[0]}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#B68CFF", textTransform: "uppercase", letterSpacing: ".12em", fontFamily: FONT_DISP }}>Peta Diriku</div>
          <h1 className={styles.sHeaderName}>{student.name}</h1>
          {(student.kelas || student.sekolah) && (
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "rgba(245,242,252,0.52)" }}>
              {[student.kelas, student.sekolah].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}

function SiswaBottomNav({ activeView, setView }) {
  return (
    <nav className={styles.sBottomNav}>
      {NAV_ITEMS.map((n) => {
        const active = n.id === activeView;
        const Icon = n.Icon;
        return (
          <button key={n.id} className={`${styles.sNavBtn} ${active ? styles.sNavActive : ""}`} onClick={() => setView(n.id)}>
            <span className={`${styles.sNavPill} ${active ? styles.sNavPillActive : ""}`}>
              <Icon size={20} />
            </span>
            <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 600, letterSpacing: ".01em" }}>{n.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════════════════════════════════════════
export default function SiswaPage({ session, onLogout }) {
  const [activeView, setActiveView] = useState("bakat");
  const mainRef = useRef(null);

  const { loading, data } = useGasRead("mi", null, session);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, [activeView]);

  let student, intel, karakter, aspek, dukungan, topDetails, mi;
  let isSample = false;

  if (data && data.output_mi && data.output_mi.length > 0) {
    const transformed = transformMIData(data, session?.nama);
    if (transformed) {
      mi = transformed;
      student = transformed.student;
      intel = transformed.intel;
      karakter = transformed.karakter;
      aspek = transformed.aspek;
      dukungan = transformed.dukungan;
      topDetails = transformed.topDetails;
      isSample = false;
    }
  }

  // Belum ada data real: tampilkan contoh laporan (ditandai "Contoh" di footer)
  if (!student) {
    student = SAMPLE_BAKAT.student;
    intel = SAMPLE_BAKAT.intel;
    topDetails = SAMPLE_BAKAT.topDetails;
    karakter = SAMPLE_KARAKTER;
    aspek = SAMPLE_ASPEK;
    dukungan = SAMPLE_DUKUNGAN;
    mi = null;
    isSample = true;
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 440, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <main ref={mainRef} className={styles.sMain}>
          {loading && (
            <div style={{ textAlign: "center", padding: "80px 24px", fontFamily: MONT, color: T.textMuted }}>
              <p style={{ fontSize: 14, fontWeight: 600 }}>Memuat laporan bakat...</p>
            </div>
          )}
          {!loading && (
            <BakatView student={student} intel={intel} topDetails={topDetails} mi={mi} isSample={isSample} onLogout={onLogout} modules={buildSiswaModules(session)} />
          )}
        </main>
      </div>
    </div>
  );
}
