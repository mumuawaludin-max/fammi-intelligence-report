/**
 * MasterMI.js
 * Lookup konten psikologi per kecerdasan x level.
 * Dipakai oleh Pipeline.js untuk mengisi narasi per-kolom Output_MI.
 */

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
