// @ts-nocheck
// Mesin pipeline MI, hasil port dari gas/Pipeline.js + gas/MasterMI.js (era GAS, masih di
// repo sebagai referensi). Menghasilkan seluruh isi Output_MI (skor -> level -> lookup
// MASTER_MI + 5 panggilan Gemini) untuk satu siswa. Dipakai Edge Function generate-mi.
//
// @ts-nocheck dipasang sengaja: ini port ~1500 baris dari JS lama yang param-nya tak
// bertipe. Perilakunya harus IDENTIK dengan pipeline lama yang membuat data mi_hasil yang
// sudah tayang, jadi diubah seminimal mungkin (var/function tetap, cuma API GAS diganti
// padanan Deno: UrlFetchApp->fetch, Utilities.sleep->sleep, Logger->console; fungsi yang
// memanggil Gemini dijadikan async).

const PIPELINE_CONFIG = { geminiModel: "gemini-3.5-flash" };

/** Model Gemini bisa dioverride Edge Function (mis. dari env GEMINI_MODEL). */
export function setMiModel(model) {
  if (model) PIPELINE_CONFIG.geminiModel = model;
}

const MI_CODES = ["Mu", "Sp", "Ve", "Lo", "Ki", "Ie", "Ia", "Na"];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/** Panggil Gemini (Deno fetch), retry pada 429/503, kupas thinking + code fence. */
async function callGemini_(prompt, apiKey) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" +
              PIPELINE_CONFIG.geminiModel + ":generateContent?key=" + apiKey;
  const payload = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } },
  });
  let data;
  const delays = [3000, 8000, 20000];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    const resp = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
    data = await resp.json();
    if (!data.error) break;
    const isRetryable = data.error.code === 429 || data.error.code === 503 ||
      (data.error.message && data.error.message.indexOf("high demand") !== -1);
    if (!isRetryable || attempt === delays.length) throw new Error("Gemini error: " + data.error.message);
    console.log("Gemini overload, retry " + (attempt + 1) + " dalam " + delays[attempt] + "ms...");
    await sleep(delays[attempt]);
  }
  if (data.error) throw new Error("Gemini error: " + data.error.message);
  const parts = data.candidates[0].content.parts;
  let text = "";
  for (let i = 0; i < parts.length; i++) { if (!parts[i].thought) text += parts[i].text || ""; }
  text = text.replace(/^```[a-z]*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  const firstLabel = text.search(/(?:^|\n)[A-Z][A-Z_0-9]{2,}:/);
  if (firstLabel > 0) text = text.substring(firstLabel).trim();
  return text;
}

var MASTER_MI = {
  Musikal: {
    Kuat: {
      desc: "Belajar melalui ritme, pola bunyi, dan melodi",
      arti: "Kamu menangkap dunia lewat bunyi, ritme, dan pola nada. Saat belajar, otakmu otomatis mencari irama dan pengulangan, sehingga informasi yang punya \"lagu\" jauh lebih lekat dibanding teks datar. Kamu juga peka pada nuansa kecil, perubahan tempo, intonasi guru, bahkan suasana hati orang lewat suaranya.",
      jaga: "Lingkungan yang bising bisa cepat memecah fokusmu karena telingamu menangkap semua detail suara sekaligus. Cari ruang belajar yang akustiknya kamu kendalikan, atau pakai musik instrumental sebagai penyaring.",
      lakukan: [
        "Ubah materi hafalan jadi lirik atau jingle sederhana",
        "Ikut band, paduan suara, atau ansambel sekolah secara rutin",
        "Pelajari satu alat musik baru sampai bisa membaca notasinya",
        "Bedah struktur lagu favoritmu, bagian verse, chorus, dan bridge",
        "Rekam suaramu menjelaskan materi pelajaran, lalu dengarkan ulang",
      ],
      profesi: [
        "Musisi atau komposer",
        "Produser musik dan sound engineer",
        "Guru atau dosen seni musik",
        "Music therapist",
        "Penyanyi atau vokalis profesional",
        "Penata suara film dan podcast",
        "Music director acara",
      ],
      terlihat: [
        "Mengetuk jari atau kaki mengikuti irama saat berpikir",
        "Cepat hafal lagu setelah mendengar beberapa kali",
        "Peka saat ada nada sumbang atau alat musik fals",
        "Sering bersenandung tanpa sadar",
        "Mengenali lagu hanya dari beberapa nada pembuka",
      ],
    },
    Sedang: {
      desc: "Belajar melalui ritme, pola bunyi, dan melodi",
      arti: "Kamu menikmati musik dan punya kepekaan pada ritme, tapi belum kamu jadikan alat berpikir utama. Dalam situasi tertentu, misalnya saat lagu pas dengan suasana, fokusmu bisa lebih baik, namun ini belum kamu manfaatkan secara sadar untuk belajar.",
      jaga: "Potensi musikalmu mudah berhenti di tahap \"penikmat\" kalau tidak dilatih aktif. Tanpa praktik rutin, kepekaan ini cenderung diam dan tidak tumbuh jadi keterampilan.",
      lakukan: [
        "Coba satu teknik mnemonik berbasis melodi untuk materi sulit",
        "Buat playlist khusus per mata pelajaran dan amati efeknya pada fokus",
        "Belajar dasar satu alat musik lewat tutorial daring",
        "Ikut kegiatan musik sekolah meski bukan sebagai pemain utama",
      ],
      profesi: [
        "Content creator dengan elemen audio",
        "Guru kelas yang memakai lagu sebagai media ajar",
        "Penyiar radio atau podcaster",
        "Event organizer bidang seni",
        "Editor video dengan kepekaan scoring",
        "Marketing kreatif industri hiburan",
      ],
      terlihat: [
        "Mudah terbawa suasana lagu yang sedang diputar",
        "Kadang menghafal lebih cepat lewat materi yang dinyanyikan",
        "Punya selera musik cukup luas dan bisa membedakan genre",
        "Menikmati menyanyi meski tidak selalu percaya diri tampil",
      ],
    },
    Berkembang: {
      desc: "Belajar melalui ritme, pola bunyi, dan melodi",
      arti: "Bunyi dan ritme belum jadi cara utamamu menyerap informasi, dan kamu mungkin tidak otomatis mengaitkan belajar dengan musik. Ini bukan kekurangan, hanya jalur yang belum kamu buka. Lewat latihan bertahap, kepekaan musikal bisa tumbuh dan menambah satu cara baru untuk berpikir.",
      jaga: "Hindari menyimpulkan \"aku tidak berbakat musik\" lalu menutup pintunya sepenuhnya. Kepekaan ritme bisa dilatih, dan menutupnya berarti melewatkan satu alat bantu ingatan yang berguna.",
      lakukan: [
        "Mulai dengan mendengarkan musik sambil mengetuk ritme dasarnya",
        "Coba aplikasi belajar ketukan atau ritme sederhana",
        "Hafalkan satu materi pelajaran lewat lagu yang sudah kamu kenal",
        "Nyanyikan ulang jingle iklan dan perhatikan polanya",
      ],
      profesi: [
        "Peran pendukung di tim produksi acara",
        "Teknisi audio dasar dengan pelatihan",
        "Pengelola konten media sosial",
        "Profesi yang bertumpu pada kecerdasan lain, dengan musik sebagai hobi penyeimbang",
      ],
      terlihat: [
        "Jarang memakai lagu untuk membantu mengingat",
        "Lebih nyaman belajar dalam keheningan total",
        "Kurang terganggu oleh nada sumbang yang halus",
        "Mengikuti irama dengan usaha sadar, bukan otomatis",
      ],
    },
  },

  Spasial: {
    Kuat: {
      arti: "Kamu berpikir lewat gambar, bentuk, dan hubungan ruang. Saat membayangkan sesuatu, kamu bisa memutar objek dalam kepala, melihatnya dari sudut berbeda, dan menyusun letaknya tanpa perlu menggambar dulu. Diagram, peta, dan visual sering lebih cepat kamu pahami dibanding paragraf panjang.",
      jaga: "Karena kamu berpikir lewat gambar, instruksi verbal panjang tanpa pendamping visual sering terasa kabur. Biasakan menerjemahkan penjelasan jadi sketsa atau mind map sendiri sebelum kebingungan menumpuk.",
      lakukan: [
        "Ubah catatan pelajaran jadi mind map atau diagram alur",
        "Pelajari dasar desain grafis atau pemodelan 3D",
        "Latih membaca peta dan denah tanpa bantuan GPS",
        "Gambar ulang konsep abstrak jadi visual buatanmu sendiri",
        "Ikut ekstrakurikuler fotografi, melukis, atau arsitektur dasar",
      ],
      profesi: [
        "Arsitek",
        "Desainer grafis atau UI/UX",
        "Insinyur sipil",
        "Animator dan ilustrator",
        "Fotografer atau videografer",
        "Perencana tata kota",
        "Desainer interior",
      ],
      terlihat: [
        "Mudah membayangkan tata letak ruang sebelum melihat aslinya",
        "Suka mencoret-coret diagram saat menjelaskan ide",
        "Cepat hafal jalan setelah sekali lewat",
        "Peka pada komposisi, warna, dan keseimbangan visual",
        "Lebih paham lewat gambar dibanding deskripsi teks",
      ],
    },
    Sedang: {
      arti: "Kamu bisa memahami visual dengan baik saat tersedia, tapi belum selalu kamu jadikan alat pertama untuk berpikir. Ketika ada diagram, kamu terbantu, namun saat harus membuat sendiri visualnya, kamu masih butuh usaha ekstra.",
      jaga: "Kemampuan ini gampang berhenti di tahap mengandalkan visual buatan orang lain. Tanpa berlatih membuat visual sendiri, daya bayang ruangmu tumbuh lambat.",
      lakukan: [
        "Biasakan merangkum satu bab jadi satu halaman diagram",
        "Coba aplikasi pembuat mind map untuk tugas sekolah",
        "Latih menggambar ulang grafik dari buku tanpa melihat",
        "Amati denah bangunan lalu bayangkan bentuk aslinya",
      ],
      profesi: [
        "Drafter atau juru gambar teknik",
        "Content creator visual",
        "Asisten desain produk",
        "Guru yang banyak memakai media visual",
        "Surveyor pemetaan",
        "Editor foto dan video",
      ],
      terlihat: [
        "Terbantu jelas saat materi disajikan lewat gambar",
        "Kadang menggambar untuk membantu memahami soal",
        "Cukup baik membaca peta dengan sedikit latihan",
        "Menyukai konten visual dibanding teks panjang",
      ],
    },
    Berkembang: {
      arti: "Membayangkan bentuk dan ruang dalam kepala belum jadi kekuatanmu, dan kamu mungkin lebih nyaman dengan kata atau angka. Ini jalur yang masih bisa kamu bangun. Mulai dari visual sederhana, kemampuan ini bisa tumbuh dan membantumu memahami hal yang sulit dijelaskan lewat kata.",
      jaga: "Hindari langsung menyerah saat menghadapi diagram rumit atau soal geometri. Kemampuan spasial naik lewat latihan bertahap, bukan bakat yang sudah tetap.",
      lakukan: [
        "Mulai dengan menggambar peta sederhana rute harianmu",
        "Susun puzzle atau mainan konstruksi sebagai latihan ringan",
        "Salin ulang satu diagram pelajaran sambil memahami tiap bagian",
        "Pakai warna dan simbol saat membuat catatan",
      ],
      profesi: [
        "Peran administratif dengan dukungan alat visual",
        "Operator yang dilatih membaca panduan bergambar",
        "Profesi berbasis kata atau angka, dengan keterampilan visual sebagai pelengkap",
        "Asisten lapangan dengan panduan denah",
      ],
      terlihat: [
        "Lebih memilih penjelasan kata dibanding diagram",
        "Butuh waktu lebih saat membaca peta atau denah",
        "Catatan cenderung berupa teks tanpa visual",
        "Kadang kesulitan membayangkan objek dari sudut berbeda",
      ],
    },
  },

  Linguistik: {
    Kuat: {
      arti: "Kata adalah alat berpikir utamamu. Kamu menyusun gagasan dengan rapi lewat bahasa, peka pada pilihan kata, dan menikmati membaca serta menulis. Saat menjelaskan sesuatu, kamu mudah menemukan kalimat yang pas dan bisa menyesuaikan gaya bicara dengan lawan bicara.",
      jaga: "Kelancaran berbahasa kadang membuatmu merasa sudah paham padahal baru pandai merumuskannya. Sesekali uji pemahamanmu lewat praktik nyata, bukan hanya lewat seberapa lancar kamu menjelaskannya.",
      lakukan: [
        "Tulis ringkasan materi pelajaran dengan kata-katamu sendiri",
        "Ikut lomba debat, esai, atau menulis kreatif",
        "Pelajari satu bahasa asing sampai bisa membaca artikel",
        "Buat blog atau jurnal harian untuk melatih gaya menulis",
        "Ajari teman materi sulit lewat penjelasan lisan",
      ],
      profesi: [
        "Jurnalis atau editor",
        "Penulis dan content writer",
        "Pengacara",
        "Dosen atau guru bahasa",
        "Penerjemah",
        "Public relations",
        "Penyiar atau presenter",
      ],
      terlihat: [
        "Mudah menemukan kata yang tepat saat berbicara",
        "Suka membaca beragam jenis bacaan",
        "Senang berdiskusi dan beradu argumen",
        "Peka pada kesalahan tata bahasa dan ejaan",
        "Mampu menyederhanakan ide rumit jadi mudah dimengerti",
      ],
    },
    Sedang: {
      arti: "Kamu nyaman memakai bahasa dan bisa menulis atau berbicara cukup baik, tapi belum selalu jadi cara pertamamu mengolah ide. Dalam topik yang kamu kuasai bahasamu mengalir, namun di topik asing kamu masih mencari-cari kata.",
      jaga: "Kemampuan berbahasa bisa stagnan kalau jarang dilatih lewat menulis atau berbicara di depan orang. Konsumsi pasif saja, seperti hanya membaca, belum cukup menumbuhkannya.",
      lakukan: [
        "Biasakan menulis ringkasan singkat setiap selesai membaca",
        "Ikut kegiatan presentasi atau diskusi kelas secara aktif",
        "Tambah kosakata lewat membaca lintas topik",
        "Latih berbicara terstruktur lewat rekaman suara sendiri",
      ],
      profesi: [
        "Staf administrasi dan korespondensi",
        "Customer relations",
        "Guru mata pelajaran umum",
        "Marketing komunikasi",
        "Asisten redaksi",
        "Content creator berbasis teks",
      ],
      terlihat: [
        "Cukup lancar menjelaskan hal yang sudah dikuasai",
        "Menikmati membaca topik tertentu yang diminati",
        "Bisa menulis tugas dengan struktur memadai",
        "Kadang ragu memilih kata di situasi baru",
      ],
    },
    Berkembang: {
      arti: "Mengolah gagasan lewat kata belum jadi kekuatanmu, dan kamu mungkin lebih cepat menangkap lewat gambar, angka, atau praktik langsung. Keterampilan bahasa bisa kamu bangun bertahap. Semakin sering kamu menulis dan berbicara, semakin luwes kemampuanmu.",
      jaga: "Hindari menghindari tugas menulis atau berbicara karena merasa tidak bisa. Keterampilan bahasa justru tumbuh lewat latihan yang awalnya terasa canggung.",
      lakukan: [
        "Mulai menulis tiga kalimat ringkasan tiap hari",
        "Baca satu artikel pendek lalu ceritakan ulang ke teman",
        "Catat kata baru yang kamu temui beserta artinya",
        "Latih berbicara di depan cermin sebelum presentasi",
      ],
      profesi: [
        "Profesi berbasis keterampilan teknis atau visual",
        "Peran lapangan yang sedikit menuntut tulisan panjang",
        "Bidang angka, desain, atau praktik dengan bahasa sebagai pelengkap",
        "Pekerjaan tim dengan rekan yang menangani komunikasi tertulis",
      ],
      terlihat: [
        "Lebih memilih menjelaskan lewat contoh daripada kata",
        "Catatan cenderung singkat atau berupa poin",
        "Kadang sulit menemukan kata saat harus menjelaskan",
        "Lebih nyaman mendengar daripada berbicara panjang",
      ],
    },
  },

  "Logika-Matematika": {
    Kuat: {
      arti: "Kamu berpikir lewat pola, sebab-akibat, dan logika bertahap. Saat menghadapi masalah, kamu otomatis memecahnya jadi langkah-langkah, mencari aturan di baliknya, dan menguji apakah kesimpulanmu konsisten. Angka dan sistem terasa seperti bahasa yang kamu pahami secara alami.",
      jaga: "Kecenderungan mencari jawaban pasti kadang membuatmu tidak nyaman pada hal yang ambigu atau emosional. Latih menerima bahwa sebagian masalah, terutama soal manusia, tidak punya rumus tunggal.",
      lakukan: [
        "Kerjakan soal logika atau teka-teki di luar pelajaran",
        "Pelajari dasar pemrograman atau analisis data",
        "Bedah kasus nyata dengan kerangka sebab-akibat",
        "Ikut olimpiade matematika atau sains",
        "Buat eksperimen kecil untuk menguji hipotesismu sendiri",
      ],
      profesi: [
        "Data scientist atau analis data",
        "Programmer dan software engineer",
        "Insinyur berbagai bidang",
        "Akuntan atau aktuaris",
        "Peneliti sains",
        "Ekonom",
        "Ahli statistik",
      ],
      terlihat: [
        "Cepat melihat pola dalam deretan angka atau data",
        "Suka bertanya \"kenapa\" dan \"bagaimana caranya\"",
        "Nyaman bekerja dengan langkah sistematis",
        "Mudah mendeteksi kesalahan logika dalam argumen",
        "Menikmati teka-teki dan tantangan analitis",
      ],
    },
    Sedang: {
      arti: "Kamu bisa berpikir logis dan menyelesaikan soal berstruktur, tapi butuh usaha lebih saat masalahnya abstrak atau berlapis. Dalam materi yang sudah kamu kuasai langkahmu rapi, namun pada konsep baru kamu masih butuh contoh sebelum paham.",
      jaga: "Kemampuan analitis mudah melemah kalau kamu hanya menghafal rumus tanpa memahami logikanya. Pastikan kamu mengerti alasannya, bukan sekadar urutan caranya.",
      lakukan: [
        "Latih satu jenis soal analitis secara rutin tiap minggu",
        "Pelajari logika lewat permainan strategi atau coding dasar",
        "Pecah soal rumit jadi langkah kecil sebelum mengerjakan",
        "Cari pola dalam data sederhana, misalnya catatan keuanganmu",
      ],
      profesi: [
        "Teknisi atau operator sistem",
        "Staf keuangan dan administrasi data",
        "Quality control",
        "Asisten riset",
        "Guru matematika tingkat dasar",
        "Wirausaha dengan pengelolaan angka",
      ],
      terlihat: [
        "Bisa mengikuti langkah logis bila ada contoh",
        "Cukup teliti dalam pekerjaan yang berpola",
        "Kadang butuh waktu memahami konsep abstrak baru",
        "Menyukai kejelasan aturan dalam mengerjakan tugas",
      ],
    },
    Berkembang: {
      arti: "Berpikir lewat angka dan logika bertahap belum jadi jalur utamamu, dan kamu mungkin lebih cepat menyerap lewat cerita, gambar, atau pengalaman langsung. Keterampilan ini bisa dilatih. Mulai dari pola sederhana, cara berpikir sistematismu akan menguat.",
      jaga: "Hindari label \"aku memang tidak bisa matematika\" karena itu menutup latihan sebelum dimulai. Kemampuan logika naik lewat pengulangan, bukan bakat sejak lahir.",
      lakukan: [
        "Mulai dengan permainan logika ringan seperti sudoku",
        "Pecah satu masalah harian jadi langkah berurutan",
        "Pelajari satu konsep matematika lewat video bertahap",
        "Catat pengeluaranmu lalu cari polanya tiap akhir pekan",
      ],
      profesi: [
        "Profesi berbasis kreativitas, bahasa, atau interaksi sosial",
        "Peran yang memakai alat hitung otomatis dengan panduan",
        "Bidang seni, komunikasi, atau pelayanan dengan logika sebagai pendukung",
        "Pekerjaan tim dengan rekan yang menangani analisis angka",
      ],
      terlihat: [
        "Lebih nyaman dengan tugas non-angka",
        "Cenderung menghindari soal hitung yang berlapis",
        "Butuh contoh konkret untuk memahami konsep abstrak",
        "Mengandalkan intuisi lebih dari langkah sistematis",
      ],
    },
  },

  Kinestetik: {
    Kuat: {
      arti: "Tubuhmu adalah alat belajar utamamu. Kamu paham sesuatu lebih cepat saat mempraktikkannya langsung dibanding membacanya, dan kamu punya kendali gerak serta koordinasi yang baik. Duduk diam terlalu lama justru menurunkan fokusmu.",
      jaga: "Sistem belajar di sekolah yang banyak duduk dan mencatat bisa terasa menyiksa untukmu. Cari cara menyisipkan gerak, misalnya berjalan saat menghafal, agar energimu tersalur, bukan menumpuk jadi gelisah.",
      lakukan: [
        "Belajar sambil bergerak, misalnya berjalan saat menghafal",
        "Ikut cabang olahraga atau seni gerak secara serius",
        "Ubah konsep abstrak jadi peragaan atau simulasi fisik",
        "Pakai alat peraga atau model saat memahami materi",
        "Praktikkan langsung teori di laboratorium atau bengkel",
      ],
      profesi: [
        "Atlet atau pelatih olahraga",
        "Fisioterapis",
        "Chef atau ahli kuliner",
        "Teknisi dan mekanik",
        "Penari atau koreografer",
        "Dokter bedah",
        "Instruktur kebugaran",
      ],
      terlihat: [
        "Sulit duduk diam lama, sering menggerakkan tubuh",
        "Cepat menguasai keterampilan lewat praktik langsung",
        "Punya koordinasi dan kendali gerak yang baik",
        "Suka menyentuh dan mencoba objek untuk memahaminya",
        "Lebih ingat hal yang pernah dilakukan daripada dibaca",
      ],
    },
    Sedang: {
      arti: "Kamu terbantu saat belajar lewat praktik, tapi masih bisa mengikuti cara belajar duduk dengan usaha. Pada keterampilan fisik tertentu kamu cepat menangkap, namun belum kamu jadikan strategi belajar yang sadar dan rutin.",
      jaga: "Potensi ini bisa diam kalau kamu memaksa diri belajar dengan cara yang tidak cocok terus-menerus. Kenali kapan tubuhmu butuh bergerak agar belajar tidak terasa berat.",
      lakukan: [
        "Sisipkan jeda gerak singkat tiap 30 menit belajar",
        "Coba metode belajar dengan alat peraga buatan sendiri",
        "Ikut satu kegiatan fisik rutin di luar jam sekolah",
        "Praktikkan langsung materi yang bisa disimulasikan",
      ],
      profesi: [
        "Teknisi terlatih",
        "Staf operasional lapangan",
        "Perawat atau tenaga kesehatan pendukung",
        "Wirausaha kuliner",
        "Guru olahraga atau keterampilan",
        "Operator mesin dengan pelatihan",
      ],
      terlihat: [
        "Lebih bersemangat saat ada kegiatan praktik",
        "Cukup terampil dalam tugas yang melibatkan tangan",
        "Mulai gelisah bila terlalu lama diam",
        "Mengingat lebih baik hal yang pernah dicoba langsung",
      ],
    },
    Berkembang: {
      arti: "Belajar lewat gerak dan praktik fisik belum jadi kekuatanmu, dan kamu mungkin lebih nyaman lewat membaca, mendengar, atau berpikir. Keterampilan tubuh bisa dilatih bertahap, dan ini menambah cara baru menyerap pelajaran yang sulit dipahami hanya lewat teori.",
      jaga: "Hindari menjauhi kegiatan praktik atau olahraga karena merasa kaku. Koordinasi tubuh berkembang lewat latihan berulang, bukan bakat yang sudah tetap.",
      lakukan: [
        "Mulai dengan satu kegiatan fisik ringan yang kamu nikmati",
        "Coba praktikkan satu konsep pelajaran lewat peragaan sederhana",
        "Latih koordinasi lewat permainan gerak atau olahraga santai",
        "Belajar satu keterampilan tangan, misalnya merakit sesuatu",
      ],
      profesi: [
        "Profesi berbasis analisis, bahasa, atau interaksi sosial",
        "Peran yang dominan duduk dengan aktivitas fisik sebagai penyeimbang",
        "Bidang akademik atau administratif dengan keterampilan praktis pendukung",
        "Pekerjaan dengan rekan tim untuk tugas yang menuntut fisik",
      ],
      terlihat: [
        "Lebih memilih belajar lewat teori dibanding praktik",
        "Kadang ragu pada kegiatan yang menuntut koordinasi",
        "Nyaman duduk lama tanpa merasa gelisah",
        "Butuh latihan ekstra untuk keterampilan gerak baru",
      ],
    },
  },

  Interpersonal: {
    Kuat: {
      arti: "Kamu membaca orang lain dengan cepat dan peka pada suasana hati, niat, serta dinamika dalam kelompok. Kamu nyaman memimpin, menengahi, atau sekadar membuat orang merasa didengar. Energimu sering bertambah saat berada di antara orang.",
      jaga: "Kepekaanmu pada perasaan orang lain kadang membuatmu mengabaikan kebutuhanmu sendiri demi menjaga keharmonisan. Latih mengenali batas, dan ingat bahwa menolak permintaan bukan berarti mengecewakan.",
      lakukan: [
        "Ambil peran koordinator dalam kerja kelompok atau organisasi",
        "Latih mendengar aktif tanpa langsung menasihati",
        "Ikut kegiatan sosial atau kerelawanan",
        "Pelajari dasar mediasi dan resolusi konflik",
        "Jadi mentor untuk adik kelas atau teman yang kesulitan",
      ],
      profesi: [
        "Psikolog atau konselor",
        "Guru atau pendidik",
        "Manajer SDM",
        "Diplomat atau negosiator",
        "Tenaga pemasaran dan humas",
        "Perawat",
        "Pekerja sosial",
      ],
      terlihat: [
        "Mudah memulai dan menjaga percakapan dengan siapa saja",
        "Peka saat ada teman yang sedang tidak baik-baik saja",
        "Sering jadi tempat curhat atau penengah konflik",
        "Nyaman bekerja dan memimpin dalam kelompok",
        "Cepat menangkap suasana sebuah ruangan",
      ],
    },
    Sedang: {
      arti: "Kamu bisa berbaur dan bekerja sama dengan baik, tapi belum selalu kamu jadikan kekuatan utama. Dengan orang yang sudah dekat kamu hangat dan luwes, namun di lingkungan baru kamu butuh waktu untuk menyesuaikan diri.",
      jaga: "Kemampuan sosial bisa berhenti berkembang kalau kamu hanya nyaman di lingkaran yang itu-itu saja. Sesekali keluar dari zona nyaman sosial agar keterampilanmu meluas.",
      lakukan: [
        "Ambil satu peran kecil dalam kegiatan kelompok baru",
        "Latih memulai percakapan dengan orang yang belum dikenal",
        "Ikut diskusi kelompok dan biasakan menyampaikan pendapat",
        "Perhatikan bahasa tubuh lawan bicara saat mengobrol",
      ],
      profesi: [
        "Staf pelayanan pelanggan",
        "Anggota tim penjualan",
        "Asisten guru atau tutor",
        "Koordinator acara skala kecil",
        "Staf komunitas",
        "Resepsionis atau front office",
      ],
      terlihat: [
        "Hangat dengan orang yang sudah dikenal",
        "Bisa bekerja sama bila perannya sudah jelas",
        "Butuh waktu beradaptasi di lingkungan baru",
        "Cukup peka pada perasaan teman dekat",
      ],
    },
    Berkembang: {
      arti: "Membaca dan menghadapi orang lain belum jadi zona nyamanmu, dan kamu mungkin lebih bertenaga saat sendiri atau dalam kelompok kecil. Keterampilan sosial bisa dilatih bertahap. Mulai dari interaksi kecil, rasa nyaman bersama orang akan tumbuh.",
      jaga: "Hindari menarik diri sepenuhnya karena merasa canggung. Keterampilan sosial tumbuh lewat latihan, dan menghindarinya justru membuat rasa canggung makin menetap.",
      lakukan: [
        "Mulai dengan menyapa satu orang baru tiap hari",
        "Latih bertanya kabar dan benar-benar mendengar jawabannya",
        "Ikut kegiatan kelompok kecil dengan topik yang kamu sukai",
        "Amati cara teman yang luwes membuka percakapan",
      ],
      profesi: [
        "Profesi berbasis riset, teknis, atau kreatif individual",
        "Peran kerja mandiri dengan interaksi sosial terbatas",
        "Bidang analisis, seni, atau teknologi dengan kerja tim seperlunya",
        "Pekerjaan dengan struktur sosial yang jelas dan terprediksi",
      ],
      terlihat: [
        "Lebih nyaman bekerja sendiri dibanding berkelompok",
        "Butuh usaha untuk memulai percakapan baru",
        "Cenderung diam di kelompok besar",
        "Lebih cepat lelah setelah banyak interaksi sosial",
      ],
    },
  },

  Intrapersonal: {
    Kuat: {
      arti: "Kamu mengenal dirimu sendiri dengan jernih, tahu apa yang kamu rasakan, kenapa kamu bertindak, dan apa yang benar-benar kamu inginkan. Kamu nyaman merenung, mengambil keputusan berdasarkan nilai pribadi, dan tidak mudah terbawa arus.",
      jaga: "Kebiasaan merenung mendalam kadang berubah jadi terlalu banyak berpikir atau terlalu keras menilai diri. Latih membedakan refleksi yang menumbuhkan dari kritik diri yang melelahkan.",
      lakukan: [
        "Tulis jurnal refleksi tentang keputusan dan perasaanmu",
        "Tetapkan tujuan pribadi dan evaluasi secara berkala",
        "Pelajari satu hal mendalam atas dorongan minatmu sendiri",
        "Latih mindfulness atau meditasi singkat",
        "Catat nilai yang kamu pegang sebagai panduan memilih",
      ],
      profesi: [
        "Penulis atau peneliti mandiri",
        "Psikolog atau terapis",
        "Wirausaha visioner",
        "Filsuf atau akademisi",
        "Konselor spiritual",
        "Pengembang diri dan coach",
        "Seniman dengan kedalaman personal",
      ],
      terlihat: [
        "Tahu jelas alasan di balik pilihannya",
        "Nyaman menghabiskan waktu sendiri secara produktif",
        "Punya pendirian yang tidak mudah goyah",
        "Mampu mengenali dan menamai emosinya sendiri",
        "Memilih jalan berdasarkan nilai, bukan sekadar ikut tren",
      ],
    },
    Sedang: {
      arti: "Kamu cukup mengenal dirimu dan bisa merenung saat dibutuhkan, tapi belum menjadikannya kebiasaan rutin. Di momen tenang kamu bisa jujur pada diri sendiri, namun saat sibuk kamu jarang berhenti untuk mengevaluasi arah.",
      jaga: "Pemahaman diri bisa kabur kalau jarang kamu rawat lewat refleksi. Tanpa jeda untuk berpikir, kamu berisiko bergerak hanya mengikuti keadaan tanpa arah jelas.",
      lakukan: [
        "Sisihkan lima menit tiap malam untuk mengevaluasi harimu",
        "Tulis satu tujuan jangka pendek dan pantau kemajuannya",
        "Kenali pemicu emosimu lewat catatan sederhana",
        "Tanyakan pada diri \"apa yang aku mau\" sebelum ikut keputusan orang",
      ],
      profesi: [
        "Profesi mandiri dengan target pribadi",
        "Wirausaha skala kecil",
        "Peneliti atau analis",
        "Pekerja kreatif individual",
        "Perencana atau penasihat",
        "Bidang yang menuntut kedisiplinan diri",
      ],
      terlihat: [
        "Bisa jujur pada diri saat suasana tenang",
        "Punya gambaran tujuan meski belum rinci",
        "Kadang ikut arus saat sedang sibuk",
        "Cukup sadar pada perasaan sendiri di momen tertentu",
      ],
    },
    Berkembang: {
      arti: "Mengenali dan memahami dirimu sendiri belum jadi kebiasaan, dan kamu mungkin lebih fokus pada hal di luar dirimu. Kesadaran diri bisa dilatih bertahap. Lewat refleksi kecil yang rutin, kamu akan makin paham apa yang kamu rasakan dan inginkan.",
      jaga: "Hindari terus bergerak tanpa pernah berhenti bertanya \"kenapa aku melakukan ini\". Tanpa jeda refleksi, mudah terbawa keputusan orang lain tanpa sadar.",
      lakukan: [
        "Mulai dengan menulis satu kalimat perasaan tiap hari",
        "Tanyakan alasan di balik satu keputusanmu hari ini",
        "Luangkan waktu sendiri tanpa gawai selama beberapa menit",
        "Catat hal yang membuatmu senang dan yang menguras energi",
      ],
      profesi: [
        "Profesi dengan struktur dan arahan eksternal yang jelas",
        "Peran tim dengan tujuan yang sudah ditetapkan",
        "Bidang teknis atau praktis yang fokus pada tugas konkret",
        "Pekerjaan dengan bimbingan mentor untuk arah pribadi",
      ],
      terlihat: [
        "Jarang berhenti untuk merenungkan perasaan sendiri",
        "Kadang bingung saat ditanya \"apa maumu\"",
        "Lebih mudah ikut keputusan kelompok",
        "Butuh dorongan luar untuk menetapkan tujuan",
      ],
    },
  },

  Naturalis: {
    Kuat: {
      arti: "Kamu peka pada alam, makhluk hidup, dan pola di lingkungan sekitar. Kamu mudah mengenali serta mengelompokkan jenis tanaman, hewan, atau fenomena alam, dan kamu merasa terhubung saat berada di luar ruangan. Detail kecil di alam yang luput dari orang lain sering kamu tangkap.",
      jaga: "Kepekaan pada alam bisa membuatmu cepat jenuh di lingkungan yang serba buatan dan tertutup. Cari cara menyisipkan unsur alam dalam keseharianmu agar energimu tetap terjaga.",
      lakukan: [
        "Buat koleksi observasi tanaman atau hewan di sekitarmu",
        "Ikut kegiatan pecinta alam atau konservasi",
        "Pelajari klasifikasi makhluk hidup lebih dalam",
        "Rawat tanaman atau hewan dan catat perkembangannya",
        "Lakukan pengamatan lapangan dan dokumentasikan temuanmu",
      ],
      profesi: [
        "Ahli biologi atau ekolog",
        "Dokter hewan",
        "Ahli pertanian atau agronomi",
        "Konservasionis lingkungan",
        "Ahli kelautan",
        "Peneliti satwa liar",
        "Ahli kehutanan",
      ],
      terlihat: [
        "Cepat mengenali jenis tanaman atau hewan",
        "Peka pada perubahan cuaca dan musim",
        "Senang menghabiskan waktu di alam terbuka",
        "Suka mengamati dan mengelompokkan benda alam",
        "Peduli pada isu lingkungan dan keberlanjutan",
      ],
    },
    Sedang: {
      arti: "Kamu menikmati alam dan punya kepekaan pada lingkungan, tapi belum kamu dalami secara serius. Saat berada di alam kamu merasa segar, namun pengetahuan klasifikasi atau pengamatanmu masih di permukaan.",
      jaga: "Minat pada alam bisa berhenti di tahap menikmati saja kalau tidak kamu lanjutkan dengan pengamatan dan belajar yang lebih dalam. Rasa suka perlu dirawat jadi pengetahuan nyata.",
      lakukan: [
        "Mulai mencatat jenis tanaman atau hewan yang kamu temui",
        "Ikut satu kegiatan luar ruang yang berfokus pada alam",
        "Rawat satu tanaman dan amati siklus hidupnya",
        "Pelajari isu lingkungan di sekitarmu lewat sumber tepercaya",
      ],
      profesi: [
        "Petugas taman atau konservasi pendukung",
        "Staf pertanian atau perkebunan",
        "Pemandu wisata alam",
        "Wirausaha tanaman atau hewan",
        "Penyuluh lingkungan",
        "Content creator bertema alam",
      ],
      terlihat: [
        "Menikmati waktu di alam meski tidak sering",
        "Cukup peka pada perubahan lingkungan sekitar",
        "Tertarik pada tema alam saat dibahas",
        "Mengenali beberapa jenis makhluk hidup umum",
      ],
    },
    Berkembang: {
      arti: "Memperhatikan alam dan mengenali pola lingkungan belum jadi kebiasaanmu, dan kamu mungkin lebih tertarik pada dunia buatan manusia. Kepekaan ini bisa ditumbuhkan bertahap. Lewat pengamatan kecil di sekitarmu, hubunganmu dengan alam akan menguat.",
      jaga: "Hindari menganggap alam sebagai hal yang tidak relevan dengan minatmu. Kepekaan lingkungan berguna lintas bidang, dan menutupnya membuatmu melewatkan satu cara memahami dunia.",
      lakukan: [
        "Mulai dengan mengamati satu tanaman di rumah tiap hari",
        "Kenali nama lima jenis tumbuhan atau hewan di sekitarmu",
        "Luangkan waktu di ruang terbuka hijau secara rutin",
        "Tonton dokumenter alam dan catat satu hal baru",
      ],
      profesi: [
        "Profesi berbasis teknologi, kota, atau interaksi manusia",
        "Peran di lingkungan dalam ruangan dengan minat alam sebagai hobi",
        "Bidang sosial, teknis, atau kreatif dengan kepedulian lingkungan sebagai pelengkap",
        "Pekerjaan tim dengan rekan yang menangani aspek lingkungan",
      ],
      terlihat: [
        "Jarang memperhatikan detail alam di sekitar",
        "Lebih tertarik pada lingkungan buatan dan teknologi",
        "Kurang mengenali jenis tanaman atau hewan",
        "Butuh dorongan untuk menghabiskan waktu di alam",
      ],
    },
  },
};

// Mapping kode kecerdasan → nama di MASTER_MI
var MI_CODE_TO_NAME = {
  Mu: "Musikal",
  Sp: "Spasial",
  Ve: "Linguistik",
  Lo: "Logika-Matematika",
  Ki: "Kinestetik",
  Ie: "Interpersonal",
  Ia: "Intrapersonal",
  Na: "Naturalis",
};

// Deskripsi gaya belajar per kecerdasan — dipakai di prompt Gemini agar tidak salah inferensi
var INTEL_GAYA_BELAJAR = {
  Na: "belajar lewat observasi langsung di alam, mencari pola, mengklasifikasi makhluk hidup dan fenomena, eksplorasi mandiri di luar ruangan, proyek penelitian kecil berbasis pengamatan",
  Ia: "belajar mandiri, refleksi lewat jurnal, penetapan target sendiri, butuh waktu hening untuk memproses, koneksi ke nilai dan pengalaman pribadi, lebih suka belajar tanpa tekanan sosial",
  Ve: "belajar lewat membaca, menulis, mendengar penjelasan verbal, bercerita, diskusi, debat, catatan tertulis, bermain kata dan bahasa",
  Lo: "belajar lewat penalaran sebab-akibat, pola angka dan logika, eksperimen sistematis, pemecahan masalah terstruktur langkah demi langkah, suka data dan bukti",
  Ki: "belajar lewat gerakan, praktik langsung, mencoba-coba secara fisik, proyek berwujud, belajar sambil bergerak atau menggunakan tangan",
  Sp: "belajar lewat gambar, diagram, peta pikiran, visualisasi, warna, tata letak visual, sketsa dan ilustrasi, imajinasi ruang",
  Mu: "belajar lewat ritme, melodi, pola suara, nyanyian, latar musik saat belajar, mengingat dengan irama dan nada",
  Ie: "belajar lewat diskusi kelompok, mengajar teman, kolaborasi, mendengar cerita orang lain, debat dan tukar pendapat, peka terhadap dinamika sosial",
};

// Mapping nama kecerdasan → prefix kolom Output_MI
var MI_CODE_TO_PREFIX = {
  Mu: "musikal",
  Sp: "spasial",
  Ve: "linguis",
  Lo: "logmat",
  Ki: "kinest",
  Ie: "inter",
  Ia: "intra",
  Na: "natural",
};

// Mapping kode → score key di Output_MI
var MI_CODE_TO_SCORE_KEY = {
  Mu: "r_musikal",
  Sp: "r_spasial",
  Ve: "r_linguistik",
  Lo: "r_logmat",
  Ki: "r_kines",
  Ie: "r_inter",
  Ia: "r_intra",
  Na: "r_naturalis",
};

function masterLookup_(code, level) {
  var name = MI_CODE_TO_NAME[code];
  if (!name || !MASTER_MI[name]) return null;
  return MASTER_MI[name][level] || null;
}

function computeLevel_(score) {
  var s = parseFloat(score) || 0;
  if (s >= 75) return "Kuat";
  if (s >= 50) return "Sedang";
  return "Berkembang";
}

function computeAhaPersen_(levels, top) {
  var kuatCount = 0;
  for (var i = 0; i < top.length; i++) {
    if (levels[top[i]] === "Kuat") kuatCount++;
  }
  if (kuatCount >= 3) return "8%";
  if (kuatCount >= 2) return "15%";
  return "25%";
}

/**
 * Bagian 1: narasi cover, cara belajar, aha moment, ciri khas, gaya komunikasi, mapel kuasai.
 * Satu Gemini call, output pipe-delimited per seksi.
 */

function parseNarasiOutput_(raw, mapel1, mapel2) {
  function extract_(label) {
    var re = new RegExp(label + ":\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:|$)", "i");
    var m  = raw.match(re);
    if (!m) return "";
    return m[1].trim().replace(/^KOSONG$/i, "");
  }

  var mapelBlok  = extract_("MAPEL_STRATEGI");
  var mapel1Desc = "";
  var mapel2Desc = "";
  var mapelNarasi = "";

  if (mapelBlok && mapel1 && mapel2) {
    // Dua mapel: pisah per baris, baris pertama = mapel1, kedua = mapel2
    var lines = mapelBlok.split(/\n/).filter(function(l) { return l.trim(); });
    if (lines.length >= 2) {
      mapel1Desc  = lines[0].trim();
      mapel2Desc  = lines[1].trim();
      // Sisa baris (jika ada) jadi narasi penutup
      if (lines.length > 2) mapelNarasi = lines.slice(2).join(" ").trim();
    } else {
      mapel1Desc  = mapelBlok;
    }
  } else if (mapelBlok && mapel1) {
    // Satu mapel: desc = baris pertama, narasi = baris kedua dst
    var lines1 = mapelBlok.split(/\n/).filter(function(l) { return l.trim(); });
    mapel1Desc  = lines1[0] || mapelBlok;
    if (lines1.length > 1) mapelNarasi = lines1.slice(1).join(" ").trim();
  }

  return {
    hero:       extract_("NARASI_HERO"),
    kombinasi:  extract_("NARASI_KOMBINASI"),
    profil:     extract_("NARASI_PROFIL"),
    mapel1Desc: mapel1Desc,
    mapel2Desc: mapel2Desc,
    mapelNarasi: mapelNarasi,
  };
}


// ── Laporan BakatView: fungsi pembantu ────────────────────────────────────────

/**
 * Hitung aha_persen berdasarkan berapa kecerdasan di top 3 yang level-nya Kuat.
 * Nilai adalah estimasi konservatif untuk narasi statistik di cover laporan.
 */

function parseLaporanBagian1_(raw) {
  function extractBlock_(label) {
    var re = new RegExp(label + ":\\s*([\\s\\S]*?)(?=\\n[A-Z][A-Z_0-9]{2,}:|$)", "i");
    var m  = raw.match(re);
    return m ? m[1].trim() : "";
  }

  function parsePipeLines_(block) {
    return block.split("\n")
      .map(function(l) { return l.trim(); })
      .filter(function(l) { return l.length > 0 && l.indexOf("|") !== -1; });
  }

  function col_(line, idx) {
    var parts = line.split("|");
    return idx < parts.length ? parts[idx].trim() : "";
  }

  var result = {
    narasi_cover:         extractBlock_("NARASI_COVER"),
    cara_belajar_summary: extractBlock_("CARA_BELAJAR_SUMMARY"),
    aha_desc:             extractBlock_("AHA_DESC"),
    mapel_kuasai:         extractBlock_("MAPEL_KUASAI"),
  };

  var cb, ck, gp, gh, gs, n;
  var caraBelajarLines = parsePipeLines_(extractBlock_("CARA_BELAJAR"));
  for (cb = 0; cb < caraBelajarLines.length && cb < 5; cb++) {
    n = cb + 1;
    result["cara_belajar_" + n + "_title"] = col_(caraBelajarLines[cb], 1);
    result["cara_belajar_" + n + "_body"]  = col_(caraBelajarLines[cb], 2);
  }

  var ciriLines = parsePipeLines_(extractBlock_("CIRI_KHAS"));
  for (ck = 0; ck < ciriLines.length && ck < 4; ck++) {
    result["ciri_khas_" + (ck + 1)] = col_(ciriLines[ck], 1);
  }

  var positifLines = parsePipeLines_(extractBlock_("GAYA_KOM_POSITIF"));
  for (gp = 0; gp < positifLines.length && gp < 4; gp++) {
    result["gaya_kom_positif_" + (gp + 1)] = col_(positifLines[gp], 1);
  }

  var hindariLines = parsePipeLines_(extractBlock_("GAYA_KOM_HINDARI"));
  for (gh = 0; gh < hindariLines.length && gh < 3; gh++) {
    result["gaya_kom_hindari_" + (gh + 1)] = col_(hindariLines[gh], 1);
  }

  var siswaLines = parsePipeLines_(extractBlock_("GAYA_KOM_SISWA"));
  for (gs = 0; gs < siswaLines.length && gs < 3; gs++) {
    n = gs + 1;
    result["gaya_kom_siswa_" + n + "_situasi"] = col_(siswaLines[gs], 1);
    result["gaya_kom_siswa_" + n + "_script"]  = col_(siswaLines[gs], 2);
  }

  return result;
}

/**
 * Bagian 2: SMART goals, 7 hari pertama, sinyal orang tua, refleksi, diskusi.
 */

function parseLaporanBagian2_(raw) {
  function extractBlock_(label) {
    var re = new RegExp(label + ":\\s*([\\s\\S]*?)(?=\\n[A-Z][A-Z_0-9]{2,}:|$)", "i");
    var m  = raw.match(re);
    return m ? m[1].trim() : "";
  }

  function parsePipeLines_(block) {
    return block.split("\n")
      .map(function(l) { return l.trim(); })
      .filter(function(l) { return l.length > 0 && l.indexOf("|") !== -1; });
  }

  function col_(line, idx) {
    var parts = line.split("|");
    return idx < parts.length ? parts[idx].trim() : "";
  }

  var result = {};
  var i, n, line;

  // SMART goals: keyed by letter (first column)
  var smartMap = { S: "", M: "", A: "", R: "", T: "" };
  var smartLines = parsePipeLines_(extractBlock_("SMART_GOALS"));
  for (i = 0; i < smartLines.length; i++) {
    var letter = col_(smartLines[i], 0).toUpperCase();
    if (Object.prototype.hasOwnProperty.call(smartMap, letter)) {
      smartMap[letter] = col_(smartLines[i], 1);
    }
  }
  result.smart_s = smartMap.S;
  result.smart_m = smartMap.M;
  result.smart_a = smartMap.A;
  result.smart_r = smartMap.R;
  result.smart_t = smartMap.T;

  // 7 hari
  var hari7Lines = parsePipeLines_(extractBlock_("HARI_7"));
  for (i = 0; i < hari7Lines.length; i++) {
    n = parseInt(col_(hari7Lines[i], 0), 10);
    if (n >= 1 && n <= 7) {
      result["hari_" + n] = col_(hari7Lines[i], 1);
    }
  }

  // Sinyal ortu: format no|emoji|judul|body
  var sinyalLines = parsePipeLines_(extractBlock_("SINYAL_ORTU"));
  for (i = 0; i < sinyalLines.length; i++) {
    line = sinyalLines[i];
    n    = parseInt(col_(line, 0), 10);
    if (n >= 1 && n <= 5) {
      result["sinyal_" + n + "_icon"]  = col_(line, 1);
      result["sinyal_" + n + "_title"] = col_(line, 2);
      result["sinyal_" + n + "_body"]  = col_(line, 3);
    }
  }

  // Refleksi dan diskusi
  var refleksiLines = parsePipeLines_(extractBlock_("REFLEKSI"));
  for (i = 0; i < refleksiLines.length; i++) {
    n = parseInt(col_(refleksiLines[i], 0), 10);
    if (n >= 1 && n <= 4) result["refleksi_" + n] = col_(refleksiLines[i], 1);
  }

  var diskusiLines = parsePipeLines_(extractBlock_("DISKUSI"));
  for (i = 0; i < diskusiLines.length; i++) {
    n = parseInt(col_(diskusiLines[i], 0), 10);
    if (n >= 1 && n <= 4) result["diskusi_" + n] = col_(diskusiLines[i], 1);
  }

  return result;
}

/**
 * Bagian 3: Jurusan kuliah, tips orang tua, dan profesi sorot per top 3 kecerdasan.
 */

function parseLaporanBagian3_(raw) {
  function extractBlock_(label) {
    var re = new RegExp(label + ":\\s*([\\s\\S]*?)(?=\\n[A-Z][A-Z_0-9]{2,}:|$)", "i");
    var m  = raw.match(re);
    return m ? m[1].trim() : "";
  }

  function parsePipeLines_(block) {
    return block.split("\n")
      .map(function(l) { return l.trim(); })
      .filter(function(l) { return l.length > 0 && l.indexOf("|") !== -1; });
  }

  function col_(line, idx) {
    var parts = line.split("|");
    return idx < parts.length ? parts[idx].trim() : "";
  }

  var result = {};
  var n, i, skillLines;

  for (n = 1; n <= 3; n++) {
    result["top_" + n + "_jurusan"]             = extractBlock_("TOP_" + n + "_JURUSAN");
    result["top_" + n + "_parenttip"]           = extractBlock_("TOP_" + n + "_PARENTTIP");
    result["top_" + n + "_profesi_sorot"]       = extractBlock_("TOP_" + n + "_PROFESI_SOROT");
    result["top_" + n + "_profesi_sorot_desc"]  = extractBlock_("TOP_" + n + "_PROFESI_SOROT_DESC");
    result["top_" + n + "_profesi_sorot_jalur"] = extractBlock_("TOP_" + n + "_PROFESI_SOROT_JALUR");
    result["top_" + n + "_profesi_sorot_figur"] = extractBlock_("TOP_" + n + "_PROFESI_SOROT_FIGUR");

    skillLines = parsePipeLines_(extractBlock_("TOP_" + n + "_PROFESI_SOROT_SKILL"));
    for (i = 0; i < skillLines.length && i < 3; i++) {
      result["top_" + n + "_profesi_sorot_skill_" + (i + 1)] = col_(skillLines[i], 1);
    }
  }

  return result;
}

/**
 * Bagian 4: detail semua profesi untuk tiap top intel.
 * Output: 3 kolom profesi_detail, tiap kolom = satu baris per profesi, pipe-delimited:
 *   nama|deskripsi 2 kalimat|skill1|skill2|skill3|jalur pendidikan
 */

function parseLaporanBagian4_(raw, topCount) {
  function extractBlock_(label) {
    var re = new RegExp(label + ":\\s*([\\s\\S]*?)(?=\\n[A-Z][A-Z_0-9]{2,}:|$)", "i");
    var m  = raw.match(re);
    return m ? m[1].trim() : "";
  }

  var result = {};
  var count  = topCount || 3;
  for (var n = 1; n <= count; n++) {
    var block = extractBlock_("TOP_" + n + "_PROFESI_DETAIL");
    var lines = block.split("\n")
      .map(function(l) { return l.trim(); })
      .filter(function(l) {
        // baris valid: punya minimal 3 pipe (nama|desc|skill1|...)
        return l.split("|").length >= 4;
      });
    result["top_" + n + "_profesi_detail"] = lines.join("\n");
  }
  return result;
}


// ── Output_MI upsert ───────────────────────────────────────────────────────────


function stripEmDash_(text) {
  return text
    .replace(/—/g, ", ")   // em-dash → koma spasi
    .replace(/–/g, ", ")   // en-dash → koma spasi
    .replace(/--/g, ", ")       // double hyphen → koma spasi
    .replace(/,\s*,/g, ",");    // bersihkan koma ganda kalau muncul
}


function arrayToLines_(arr) {
  if (!arr || !arr.length) return "";
  return arr.map(function(s) { return "- " + s; }).join("\n");
}

/**
 * Batch generator: jalankan sampai max 30 murid per trigger (timeout-safe).
 * Panggil berkali-kali untuk batch berikutnya:
 *   debugBatch_(1, 30)   → murid baris 1-30
 *   debugBatch_(31, 60)  → murid baris 31-60
 *   debugBatch_(61, 90)  → dst
 */

async function generateNarasi_(inp, scores, levels, top, masterData, geminiKey) {
  var nama   = String(inp.nama_siswa || "Siswa").trim();
  var kelas  = String(inp.kelas_id   || "").trim();
  var mapel1 = String(inp.mapel_sulit_1 || "").trim();
  var mapel2 = String(inp.mapel_sulit_2 || "").trim();

  // Susun profil lengkap untuk prompt
  var skorList = MI_CODES.map(function(code) {
    return "- " + MI_CODE_TO_NAME[code] + ": " + scores[code] + " (" + levels[code] + ")";
  }).join("\n");

  var top3Detail = top.map(function(code, i) {
    var md = masterData[code];
    return "[TOP " + (i+1) + " - " + MI_CODE_TO_NAME[code] + "]\n" +
           "Arti: " + (md.arti || "") + "\n" +
           "Terlihat: " + arrayToLines_(md.terlihat) + "\n" +
           "Jaga: " + (md.jaga || "");
  }).join("\n\n");

  var mapelBlok = "";
  if (mapel1 || mapel2) {
    mapelBlok = "\nMapel yang dirasakan sulit:\n" +
      (mapel1 ? "- " + mapel1 + "\n" : "") +
      (mapel2 ? "- " + mapel2 + "\n" : "");
  }

  var prompt = [
    "Kamu adalah psikolog pendidikan yang menulis narasi personal untuk siswa SMA.",
    "Data siswa:",
    "Nama: " + nama + ", Kelas: " + kelas,
    "",
    "Skor kecerdasan majemuk (Howard Gardner):",
    skorList,
    "",
    "Tiga kecerdasan tertinggi:",
    top3Detail,
    mapelBlok,
    "",
    "Tugas kamu: tulis EMPAT blok narasi berikut.",
    "",
    "1. narasi_hero (2-3 kalimat)",
    "Pembuka personal langsung ke " + nama + " (pakai \"kamu\").",
    "Fokus pada cara belajar dominannya, bukan sekadar menyebut nama kecerdasan.",
    "Tidak ada kalimat klise seperti \"setiap orang unik\" atau \"kamu luar biasa\".",
    "",
    "2. narasi_kombinasi (2-3 kalimat)",
    "Jelaskan bagaimana dua atau tiga kecerdasan tertinggi saling bekerja pada " + nama + ".",
    "Konkret, pakai contoh situasi nyata (belajar, diskusi, mengerjakan tugas).",
    "",
    "3. narasi_profil_final (4-6 kalimat)",
    "Gambaran utuh profil belajar " + nama + " berdasarkan seluruh delapan kecerdasan.",
    "Sebut kekuatan yang sudah jelas, potensi yang masih bisa dikembangkan,",
    "dan satu saran konkret untuk cara belajar yang sesuai.",
    "",
    "4. mapel_strategi",
    mapel1 && mapel2
      ? "Tulis DUA baris terpisah: baris 1 untuk " + mapel1 + ", baris 2 untuk " + mapel2 + "."
      : mapel1
        ? "Tulis satu strategi konkret untuk " + mapel1 + " berdasarkan profil kecerdasan " + nama + "."
        : "Tulis KOSONG.",
    "Hubungkan ke kecerdasan dominan. Bukan motivasi umum, tapi langkah nyata.",
    "",
    "ATURAN WAJIB:",
    "- Bahasa Indonesia",
    "- DILARANG KERAS menggunakan em-dash ( — ) atau tanda hubung ganda (--) dalam bentuk apapun.",
    "  Ganti selalu dengan koma, titik koma, atau pecah jadi dua kalimat.",
    "- Tidak ada kata: sangat penting, perlu dicatat, pada dasarnya, sesungguhnya,",
    "  tentu saja, dengan demikian, merupakan, terdapat, komprehensif, holistik.",
    "- Tidak ada kalimat pembuka seperti \"Berikut adalah\" atau \"Tentu saja\".",
    "- Nada hangat tapi lugas.",
    "",
    "FORMAT OUTPUT (jangan tambah apapun di luar format ini):",
    "NARASI_HERO:",
    "[isi]",
    "",
    "NARASI_KOMBINASI:",
    "[isi]",
    "",
    "NARASI_PROFIL:",
    "[isi]",
    "",
    "MAPEL_STRATEGI:",
    "[isi, atau tulis KOSONG jika tidak ada mapel sulit]",
  ].join("\n");

  var raw = await callGemini_(prompt, geminiKey);
  raw = stripEmDash_(raw);
  return parseNarasiOutput_(raw, mapel1, mapel2);
}


async function generateLaporanBagian1_(inp, scores, levels, top, masterData, geminiKey) {
  var nama      = String(inp.nama_siswa || "Siswa").trim();
  var panggilan = nama.split(/\s+/)[0];
  var top1Name  = MI_CODE_TO_NAME[top[0]];
  var top2Name  = MI_CODE_TO_NAME[top[1]];
  var top3Name  = top[2] ? MI_CODE_TO_NAME[top[2]] : "";
  var top1Arti    = (masterData[top[0]] || {}).arti || "";
  var top2Arti    = (masterData[top[1]] || {}).arti || "";
  var top3Arti    = top[2] ? ((masterData[top[2]] || {}).arti  || "") : "";
  var top1Belajar = INTEL_GAYA_BELAJAR[top[0]] || "";
  var top2Belajar = INTEL_GAYA_BELAJAR[top[1]] || "";
  var top3Belajar = top[2] ? (INTEL_GAYA_BELAJAR[top[2]] || "") : "";
  var skorSingkat = MI_CODES.map(function(code) {
    return MI_CODE_TO_NAME[code] + " " + scores[code] + " (" + levels[code] + ")";
  }).join(", ");

  var essayContext = [];
  if (inp.essay_kelebihan_cara_berpikir)      essayContext.push("Kelebihan cara berpikir: " + inp.essay_kelebihan_cara_berpikir);
  if (inp.essay_cara_belajar)                 essayContext.push("Cara belajar yang dirasakan: " + inp.essay_cara_belajar);
  if (inp.essay_cara_belajar_paling_berhasil) essayContext.push("Cara belajar paling berhasil: " + inp.essay_cara_belajar_paling_berhasil);
  if (inp.essay_citacita_profesi)             essayContext.push("Cita-cita profesi: " + inp.essay_citacita_profesi);
  if (inp.essay_alasan_pilih_profesi)         essayContext.push("Alasan pilih profesi: " + inp.essay_alasan_pilih_profesi);
  if (inp.essay_penggunaan_ai)                essayContext.push("Cara menggunakan AI: " + inp.essay_penggunaan_ai);

  var gayaBelajarLines = [
    "",
    "Gaya belajar per kecerdasan dominan (wajib jadi acuan, jangan diubah):",
    "- " + top1Name + " (Top 1): " + top1Belajar,
    "- " + top2Name + " (Top 2): " + top2Belajar,
  ];
  if (top3Name && top3Belajar) gayaBelajarLines.push("- " + top3Name + " (Top 3): " + top3Belajar);

  var promptLines = [
    "Kamu adalah psikolog pendidikan yang menulis laporan bakat personal untuk siswa.",
    "Nama: " + nama + " | Panggil: " + panggilan,
    "Top 3 kecerdasan: " + top1Name + " " + scores[top[0]] + ", "
      + top2Name + " " + scores[top[1]]
      + (top3Name ? ", " + top3Name + " " + scores[top[2]] : ""),
    "Semua skor: " + skorSingkat,
    "Narasi top 1 (" + top1Name + "): " + top1Arti,
    "Narasi top 2 (" + top2Name + "): " + top2Arti,
  ];
  if (top3Name && top3Arti) promptLines.push("Narasi top 3 (" + top3Name + "): " + top3Arti);
  promptLines = promptLines.concat(gayaBelajarLines);
  if (essayContext.length) {
    promptLines.push("", "Kata langsung dari " + panggilan + ":");
    promptLines = promptLines.concat(essayContext);
  }
  promptLines = promptLines.concat([
    "",
    "Tulis konten dalam format PERSIS berikut. Tidak ada teks di luar format ini.",
    "Gunakan nama panggilan '" + panggilan + "' di mana relevan.",
    "",
    "NARASI_COVER:",
    "1 kalimat saja, maksimal 12 kata. Hook tentang cara " + panggilan + " berpikir dan belajar berdasarkan kecerdasan " + top1Name + " dan " + top2Name + ". Jangan mulai dengan 'Kamu' atau 'Dia'. Jangan gunakan kata visual, gambar, atau diagram kecuali Spasial masuk top 3. Langsung ke inti, spesifik dan mengejutkan.",
    "",
    "CARA_BELAJAR_SUMMARY:",
    "1-2 kalimat ringkas cara belajar paling efektif untuk " + panggilan + " berdasarkan kecerdasan " + top1Name + " dan " + top2Name + ".",
    "",
    "CARA_BELAJAR:",
    "5 cara belajar sesuai gaya belajar kecerdasan " + top1Name + " dan " + top2Name + ". Format tiap baris: nomor|judul 3-5 kata|penjelasan 1-2 kalimat konkret",
    "01|Judul|Penjelasan",
    "02|Judul|Penjelasan",
    "03|Judul|Penjelasan",
    "04|Judul|Penjelasan",
    "05|Judul|Penjelasan",
    "",
    "AHA_DESC:",
    "Judul 4-7 kata yang menggambarkan kombinasi unik kecerdasan " + panggilan + ".",
    "",
    "CIRI_KHAS:",
    "4 ciri khas. Format: nomor|frasa pendek 3-5 kata",
    "01|Frasa",
    "02|Frasa",
    "03|Frasa",
    "04|Frasa",
    "",
    "GAYA_KOM_POSITIF:",
    "4 panduan komunikasi untuk orang tua atau guru. Format: nomor|kalimat panduan",
    "01|Panduan",
    "02|Panduan",
    "03|Panduan",
    "04|Panduan",
    "",
    "GAYA_KOM_HINDARI:",
    "3 hal yang harus dihindari saat berkomunikasi dengan " + panggilan + ". Format: nomor|kalimat",
    "01|Hindari",
    "02|Hindari",
    "03|Hindari",
    "",
    "GAYA_KOM_SISWA:",
    "3 script kalimat yang bisa dipakai " + panggilan + ". Format: nomor|situasi singkat|kalimat script",
    "01|Situasi|Script",
    "02|Situasi|Script",
    "03|Situasi|Script",
    "",
    "MAPEL_KUASAI:",
    "5-6 mata pelajaran yang cocok dengan kecerdasan " + panggilan + ", dipisah koma.",
    "",
    "ATURAN WAJIB:",
    "- Bahasa Indonesia.",
    "- DILARANG KERAS em-dash ( — ) dan double dash (--). Ganti dengan koma atau pecah kalimat.",
    "- Tidak ada kata: sangat penting, pada dasarnya, sesungguhnya, merupakan, terdapat, komprehensif.",
    "- Pisah kolom dengan | (pipe). Jangan ada | di dalam teks konten.",
    "- Langsung ke format, tidak ada intro atau penutup.",
  ]);
  var prompt = promptLines.join("\n");

  var raw = await callGemini_(prompt, geminiKey);
  raw = stripEmDash_(raw);
  return parseLaporanBagian1_(raw);
}


async function generateLaporanBagian2_(inp, scores, levels, top, masterData, geminiKey) {
  var nama      = String(inp.nama_siswa || "Siswa").trim();
  var panggilan = nama.split(/\s+/)[0];
  var top1Name  = MI_CODE_TO_NAME[top[0]];
  var top2Name  = MI_CODE_TO_NAME[top[1]];
  var top3Name  = top[2] ? MI_CODE_TO_NAME[top[2]] : "";

  var prompt = [
    "Kamu adalah psikolog pendidikan yang menulis rencana aksi dan pertanyaan refleksi untuk siswa SMA.",
    "Nama: " + nama + " | Panggil: " + panggilan,
    "Top 3 kecerdasan: " + top1Name + " " + scores[top[0]] + ", "
      + top2Name + " " + scores[top[1]]
      + (top3Name ? ", " + top3Name + " " + scores[top[2]] : ""),
    "",
    "Tulis konten dalam format PERSIS berikut. Tidak ada teks di luar format ini.",
    "",
    "SMART_GOALS:",
    "Format: huruf|isi satu paragraf pendek",
    "S|Spesifik: satu aktivitas konkret yang bisa dilakukan " + panggilan + " sekarang",
    "M|Terukur: bagaimana " + panggilan + " tahu sudah maju",
    "A|Achievable: kenapa ini realistis untuk " + panggilan + " di usianya sekarang",
    "R|Relevan: kaitannya dengan kecerdasan utama " + panggilan,
    "T|Time-bound: kapan dan bagaimana " + panggilan + " evaluasi kemajuannya",
    "",
    "HARI_7:",
    "7 tugas harian. Mulai ringan di hari 1, makin menantang di hari 6-7. Format: nomor|tugas konkret",
    "1|Tugas hari 1",
    "2|Tugas hari 2",
    "3|Tugas hari 3",
    "4|Tugas hari 4",
    "5|Tugas hari 5",
    "6|Tugas hari 6",
    "7|Tugas hari 7",
    "",
    "SINYAL_ORTU:",
    "5 sinyal yang bisa diperhatikan orang tua. Format: nomor|satu emoji|judul situasi singkat|penjelasan 1-2 kalimat untuk orang tua",
    "1|emoji|Judul|Penjelasan",
    "2|emoji|Judul|Penjelasan",
    "3|emoji|Judul|Penjelasan",
    "4|emoji|Judul|Penjelasan",
    "5|emoji|Judul|Penjelasan",
    "",
    "REFLEKSI:",
    "4 pertanyaan introspektif untuk " + panggilan + " sendiri. Format: nomor|pertanyaan",
    "1|Pertanyaan",
    "2|Pertanyaan",
    "3|Pertanyaan",
    "4|Pertanyaan",
    "",
    "DISKUSI:",
    "4 pertanyaan yang bagus dibahas bersama orang tua. Format: nomor|pertanyaan",
    "1|Pertanyaan",
    "2|Pertanyaan",
    "3|Pertanyaan",
    "4|Pertanyaan",
    "",
    "ATURAN WAJIB:",
    "- Bahasa Indonesia.",
    "- DILARANG KERAS em-dash ( — ) dan double dash (--). Ganti dengan koma atau pecah kalimat.",
    "- Tidak ada kata: sangat penting, pada dasarnya, sesungguhnya, merupakan, terdapat.",
    "- Pisah kolom dengan | (pipe). Jangan ada | di dalam teks konten.",
    "- Langsung ke format, tidak ada intro atau penutup.",
  ].join("\n");

  var raw = await callGemini_(prompt, geminiKey);
  raw = stripEmDash_(raw);
  return parseLaporanBagian2_(raw);
}


async function generateLaporanBagian3_(inp, scores, levels, top, masterData, geminiKey) {
  var nama      = String(inp.nama_siswa || "Siswa").trim();
  var panggilan = nama.split(/\s+/)[0];
  var topNames  = [
    MI_CODE_TO_NAME[top[0]] || "",
    top[1] ? (MI_CODE_TO_NAME[top[1]] || "") : "",
    top[2] ? (MI_CODE_TO_NAME[top[2]] || "") : "",
  ];

  var scoreStr = topNames[0] + " " + scores[top[0]]
    + (topNames[1] ? ", " + topNames[1] + " " + scores[top[1]] : "")
    + (topNames[2] ? ", " + topNames[2] + " " + scores[top[2]] : "");

  var lines = [
    "Kamu adalah konselor karier yang menulis konten jalur karier personal untuk siswa SMA.",
    "Nama: " + nama + " | Panggil: " + panggilan,
    "Top 3 kecerdasan: " + scoreStr,
    "",
    "Tulis konten dalam format PERSIS berikut. Tidak ada teks di luar format ini.",
  ];

  var i;
  for (i = 0; i < 3; i++) {
    var n = i + 1;
    var topName = topNames[i];
    if (!topName) continue;
    lines = lines.concat([
      "",
      "TOP_" + n + "_JURUSAN:",
      "3-5 jurusan kuliah yang relevan dengan kecerdasan " + topName + ", dipisah koma.",
      "",
      "TOP_" + n + "_PARENTTIP:",
      "1-2 kalimat tips konkret untuk orang tua mendukung kecerdasan " + topName + " " + panggilan + " di rumah.",
      "",
      "TOP_" + n + "_PROFESI_SOROT:",
      "Satu nama profesi unggulan paling cocok dengan kecerdasan " + topName + ".",
      "",
      "TOP_" + n + "_PROFESI_SOROT_DESC:",
      "2-3 kalimat: apa yang dikerjakan, di mana bekerja, mengapa cocok untuk " + panggilan + ".",
      "",
      "TOP_" + n + "_PROFESI_SOROT_SKILL:",
      "3 skill utama. Format: nomor|deskripsi skill",
      "01|Skill",
      "02|Skill",
      "03|Skill",
      "",
      "TOP_" + n + "_PROFESI_SOROT_JALUR:",
      "1-2 kalimat jalur pendidikan dan karier untuk masuk ke profesi ini.",
      "",
      "TOP_" + n + "_PROFESI_SOROT_FIGUR:",
      "1-3 nama tokoh inspiratif di profesi ini, dipisah koma.",
    ]);
  }

  lines = lines.concat([
    "",
    "ATURAN WAJIB:",
    "- Bahasa Indonesia.",
    "- DILARANG KERAS em-dash ( — ) dan double dash (--). Ganti dengan koma atau pecah kalimat.",
    "- Tidak ada kata: sangat penting, pada dasarnya, sesungguhnya, merupakan, terdapat.",
    "- Pisah kolom skill dengan | (pipe). Jangan ada | di dalam teks lain.",
    "- Langsung ke format, tidak ada intro atau penutup.",
  ]);

  var prompt = lines.join("\n");
  var raw = await callGemini_(prompt, geminiKey);
  raw = stripEmDash_(raw);
  return parseLaporanBagian3_(raw);
}


async function generateLaporanBagian4_(inp, scores, levels, top, masterData, geminiKey) {
  var top1Name = MI_CODE_TO_NAME[top[0]];
  var top2Name = MI_CODE_TO_NAME[top[1]];
  var top3Name = top[2] ? MI_CODE_TO_NAME[top[2]] : "";

  var sections = [];
  for (var i = 0; i < top.length; i++) {
    var n        = i + 1;
    var intelName = MI_CODE_TO_NAME[top[i]];
    var profesiList = (masterData[top[i]] || {}).profesi || [];
    var listStr  = Array.isArray(profesiList) ? profesiList.join(", ") : String(profesiList);

    sections.push(
      "TOP_" + n + "_PROFESI_DETAIL:",
      "Untuk setiap profesi berikut yang cocok dengan kecerdasan " + intelName + ":",
      listStr,
      "Tulis satu baris per profesi. Format PERSIS: nama profesi|deskripsi apa yang dikerjakan dan di mana (2 kalimat)|skill utama 1|skill utama 2|skill utama 3|jalur pendidikan (1 kalimat)",
      "Contoh format:",
      "Ahli Ekologi|Meneliti ekosistem dan rantai makanan di lapangan serta laboratorium. Bekerja untuk lembaga konservasi, pemerintah, atau universitas.|Observasi lapangan|Analisis data ekologi|Identifikasi spesies|Kuliah Biologi atau Ilmu Lingkungan S1 lalu lanjut S2",
      ""
    );
  }

  var prompt = [
    "Kamu adalah konselor karier yang menulis panduan profesi personal untuk siswa SMA.",
    "Nama siswa: " + String(inp.nama_siswa || "Siswa").trim(),
    "Top 3 kecerdasan: " + top1Name + " " + scores[top[0]]
      + ", " + top2Name + " " + scores[top[1]]
      + (top3Name ? ", " + top3Name + " " + scores[top[2]] : ""),
    "",
    "Tulis konten dalam format PERSIS berikut. Tidak ada teks di luar format ini.",
    "",
  ].concat(sections).concat([
    "ATURAN WAJIB:",
    "- Bahasa Indonesia.",
    "- DILARANG KERAS em-dash ( — ) dan double dash (--). Ganti dengan koma.",
    "- Tidak ada | di dalam teks konten (pipe hanya sebagai pemisah kolom).",
    "- Setiap profesi = satu baris, tepat 6 bagian dipisah pipe.",
    "- Tidak ada intro atau penutup.",
  ]).join("\n");

  var raw = await callGemini_(prompt, geminiKey);
  raw = stripEmDash_(raw);
  return parseLaporanBagian4_(raw, top.length);
}


async function buildOutputRow_(inp, geminiKey) {
  // 1. Skor dan level per kecerdasan
  var scores = {};
  var levels = {};
  MI_CODES.forEach(function(code) {
    var key   = MI_CODE_TO_SCORE_KEY[code];
    var score = parseFloat(inp[key]) || 0;
    scores[code] = score;
    levels[code] = computeLevel_(score);
  });

  // 2. Ranking → top 1/2/3
  var ranked = MI_CODES.slice().sort(function(a, b) {
    return scores[b] - scores[a];
  });
  var top = [ranked[0], ranked[1], ranked[2]];

  // 3. Lookup MASTER_MI per kecerdasan
  var masterData = {};
  MI_CODES.forEach(function(code) {
    masterData[code] = masterLookup_(code, levels[code]) || {};
  });

  // 4. Rakit kolom per-kecerdasan (prefix_arti, prefix_jaga, dll.)
  var perKolom = {};
  MI_CODES.forEach(function(code) {
    var prefix = MI_CODE_TO_PREFIX[code];
    var md     = masterData[code];
    perKolom[prefix + "_arti"]    = md.arti    || "";
    perKolom[prefix + "_jaga"]    = md.jaga    || "";
    perKolom[prefix + "_lakukan"] = arrayToLines_(md.lakukan);
    perKolom[prefix + "_profesi"] = arrayToLines_(md.profesi);
    perKolom[prefix + "_terlihat"]= arrayToLines_(md.terlihat);
    if (md.desc) perKolom[prefix + "_desc"] = md.desc;
  });

  // kolom pred_*
  var predKolom = {};
  predKolom["pred_inter"]    = levels["Ie"];
  predKolom["pred_intra"]    = levels["Ia"];
  predKolom["pred_kines"]    = levels["Ki"];
  predKolom["pred_linguis"]  = levels["Ve"];
  predKolom["pred_logmat"]   = levels["Lo"];
  predKolom["pred_musikal"]  = levels["Mu"];
  predKolom["pred_naturalis"]= levels["Na"];
  predKolom["pred_spasial"]  = levels["Sp"];

  // 5. Kolom TOP 1/2/3 dari master
  var topKolom = {};
  top.forEach(function(code, i) {
    var n   = i + 1;
    var nm  = MI_CODE_TO_NAME[code];
    var md  = masterData[code];
    topKolom["top_" + n]          = nm;
    topKolom["top_" + n + "_arti"]    = md.arti    || "";
    topKolom["top_" + n + "_jaga"]    = md.jaga    || "";
    topKolom["top_" + n + "_lakukan"] = arrayToLines_(md.lakukan);
    topKolom["top_" + n + "_profesi"] = arrayToLines_(md.profesi);
    topKolom["top_" + n + "_terlihat"]= arrayToLines_(md.terlihat);
  });

  // 6. Panggil Gemini untuk narasi sintetis
  var narasi = await generateNarasi_(inp, scores, levels, top, masterData, geminiKey);

  await sleep(800);
  // 7. Konten BakatView bagian 1: narasi cover, cara belajar, gaya komunikasi, ciri khas
  var laporan1 = await generateLaporanBagian1_(inp, scores, levels, top, masterData, geminiKey);

  await sleep(800);
  // 8. Konten BakatView bagian 2: SMART goals, 7 hari, sinyal ortu, refleksi, diskusi
  var laporan2 = await generateLaporanBagian2_(inp, scores, levels, top, masterData, geminiKey);

  await sleep(800);
  // 9. Konten BakatView bagian 3: jurusan, parenttip, profesi sorot per top intel
  var laporan3 = await generateLaporanBagian3_(inp, scores, levels, top, masterData, geminiKey);

  await sleep(800);
  // 10. Konten BakatView bagian 4: detail semua profesi per top intel (pipe-delimited)
  var laporan4 = await generateLaporanBagian4_(inp, scores, levels, top, masterData, geminiKey);

  // 11. aha_persen deterministik berdasarkan jumlah kecerdasan Kuat di top 3
  var ahaPersen = computeAhaPersen_(levels, top);

  // 11. Rakit baris final
  var row = {};
  row.murid_id   = String(inp.murid_id  || "").trim();
  row.nama_siswa = String(inp.nama_siswa|| "").trim();
  row.kelas_id   = String(inp.kelas_id  || "").trim();
  row.sekolah_id = String(inp.sekolah_id|| "").trim();
  row.periode_id = String(inp.periode_id|| "").trim();

  // skor
  row.r_inter     = scores["Ie"];
  row.r_intra     = scores["Ia"];
  row.r_kines     = scores["Ki"];
  row.r_linguistik= scores["Ve"];
  row.r_logmat    = scores["Lo"];
  row.r_musikal   = scores["Mu"];
  row.r_naturalis = scores["Na"];
  row.r_spasial   = scores["Sp"];

  // pred
  Object.assign(row, predKolom);

  // per-kecerdasan narasi
  Object.assign(row, perKolom);

  // top
  Object.assign(row, topKolom);

  // narasi sintetis dari Gemini
  row.narasi_hero          = narasi.hero;
  row.narasi_kombinasi     = narasi.kombinasi;
  row.narasi_profil_final  = narasi.profil;

  // mapel sulit
  row.mapel_sulit_1       = String(inp.mapel_sulit_1 || "").trim();
  row.mapel_sulit_2       = String(inp.mapel_sulit_2 || "").trim();
  row.mapel_sulit_1_desc  = narasi.mapel1Desc;
  row.mapel_sulit_2_desc  = narasi.mapel2Desc;
  row.mapel_sulit_narasi_final = narasi.mapelNarasi;

  // essays — passthrough dari Input_MI ke Output_MI
  row.essay_kelebihan_cara_berpikir     = String(inp.essay_kelebihan_cara_berpikir     || "").trim();
  row.essay_cara_belajar                = String(inp.essay_cara_belajar                || "").trim();
  row.essay_penggunaan_ai               = String(inp.essay_penggunaan_ai               || "").trim();
  row.essay_citacita_profesi            = String(inp.essay_citacita_profesi            || "").trim();
  row.essay_alasan_pilih_profesi        = String(inp.essay_alasan_pilih_profesi        || "").trim();
  row.essay_cara_belajar_paling_berhasil= String(inp.essay_cara_belajar_paling_berhasil|| "").trim();

  // ── Kolom BakatView bagian 1 ──────────────────────────────────────────────
  row.narasi_cover         = laporan1.narasi_cover         || "";
  row.cara_belajar_summary = laporan1.cara_belajar_summary || "";
  var cb;
  for (cb = 1; cb <= 5; cb++) {
    row["cara_belajar_" + cb + "_title"] = laporan1["cara_belajar_" + cb + "_title"] || "";
    row["cara_belajar_" + cb + "_body"]  = laporan1["cara_belajar_" + cb + "_body"]  || "";
  }
  row.mapel_kuasai = laporan1.mapel_kuasai || "";
  row.aha_desc     = laporan1.aha_desc     || "";
  row.aha_persen   = ahaPersen;
  var ck;
  for (ck = 1; ck <= 4; ck++) {
    row["ciri_khas_" + ck] = laporan1["ciri_khas_" + ck] || "";
  }
  var gp;
  for (gp = 1; gp <= 4; gp++) {
    row["gaya_kom_positif_" + gp] = laporan1["gaya_kom_positif_" + gp] || "";
  }
  var gh;
  for (gh = 1; gh <= 3; gh++) {
    row["gaya_kom_hindari_" + gh] = laporan1["gaya_kom_hindari_" + gh] || "";
  }
  var gs;
  for (gs = 1; gs <= 3; gs++) {
    row["gaya_kom_siswa_" + gs + "_situasi"] = laporan1["gaya_kom_siswa_" + gs + "_situasi"] || "";
    row["gaya_kom_siswa_" + gs + "_script"]  = laporan1["gaya_kom_siswa_" + gs + "_script"]  || "";
  }

  // ── Kolom BakatView bagian 2 ──────────────────────────────────────────────
  row.smart_s = laporan2.smart_s || "";
  row.smart_m = laporan2.smart_m || "";
  row.smart_a = laporan2.smart_a || "";
  row.smart_r = laporan2.smart_r || "";
  row.smart_t = laporan2.smart_t || "";
  var h;
  for (h = 1; h <= 7; h++) {
    row["hari_" + h] = laporan2["hari_" + h] || "";
  }
  var so;
  for (so = 1; so <= 5; so++) {
    row["sinyal_" + so + "_icon"]  = laporan2["sinyal_" + so + "_icon"]  || "";
    row["sinyal_" + so + "_title"] = laporan2["sinyal_" + so + "_title"] || "";
    row["sinyal_" + so + "_body"]  = laporan2["sinyal_" + so + "_body"]  || "";
  }
  var rfl;
  for (rfl = 1; rfl <= 4; rfl++) {
    row["refleksi_" + rfl] = laporan2["refleksi_" + rfl] || "";
    row["diskusi_"  + rfl] = laporan2["diskusi_"  + rfl] || "";
  }

  // ── Kolom BakatView bagian 3 ──────────────────────────────────────────────
  var tn;
  for (tn = 1; tn <= 3; tn++) {
    row["top_" + tn + "_jurusan"]               = laporan3["top_" + tn + "_jurusan"]               || "";
    row["top_" + tn + "_parenttip"]             = laporan3["top_" + tn + "_parenttip"]             || "";
    row["top_" + tn + "_profesi_sorot"]         = laporan3["top_" + tn + "_profesi_sorot"]         || "";
    row["top_" + tn + "_profesi_sorot_desc"]    = laporan3["top_" + tn + "_profesi_sorot_desc"]    || "";
    row["top_" + tn + "_profesi_sorot_skill_1"] = laporan3["top_" + tn + "_profesi_sorot_skill_1"] || "";
    row["top_" + tn + "_profesi_sorot_skill_2"] = laporan3["top_" + tn + "_profesi_sorot_skill_2"] || "";
    row["top_" + tn + "_profesi_sorot_skill_3"] = laporan3["top_" + tn + "_profesi_sorot_skill_3"] || "";
    row["top_" + tn + "_profesi_sorot_jalur"]   = laporan3["top_" + tn + "_profesi_sorot_jalur"]   || "";
    row["top_" + tn + "_profesi_sorot_figur"]   = laporan3["top_" + tn + "_profesi_sorot_figur"]   || "";
  }

  // ── Kolom BakatView bagian 4 ──────────────────────────────────────────────
  row["top_1_profesi_detail"] = laporan4["top_1_profesi_detail"] || "";
  row["top_2_profesi_detail"] = laporan4["top_2_profesi_detail"] || "";
  row["top_3_profesi_detail"] = laporan4["top_3_profesi_detail"] || "";

  return row;
}


// ── Gemini ─────────────────────────────────────────────────────────────────────



export { buildOutputRow_ };
