// ============================================================
// INTELI-GEN · INSIGHTS v2 — narasi psikologis mendalam
// SETIAP kecerdasan punya konten berbeda per 5 peran:
//   siswa | ortu | wali | sekolah | yayasan
// ============================================================
const { useState: useStateIns, useEffect: useEffectIns } = React;

// roleCtx helper → "siswa" | "ortu" | "wali" | "sekolah" | "yayasan"
// scope dari CohortView: "wali" | "sekolah" | "yayasan"
// voice dari IndividualView: "siswa" | "ortu"

const MI_DEEP = {
  Ie: {
    judul: "Kecerdasan Interpersonal",
    sub: "Belajar & berkembang melalui relasi dengan orang lain",
    warna: "#1E94A6",

    desc: {
      siswa: "Kamu paling cepat paham lewat orang lain — saat berdiskusi, menjelaskan ke teman, atau mengamati cara orang berinteraksi. Ini bukan sekadar 'mudah bergaul'; otakmu secara kognitif memproses informasi paling dalam ketika ada koneksi manusiawi.",
      ortu: "Ananda memproses dan menyimpan informasi paling baik melalui hubungan sosial. Kemampuannya membaca suasana hati dan memahami orang lain bukan hanya soal kepribadian — itu adalah kecerdasan kognitif nyata yang akan jadi asetnya sepanjang hidup.",
      wali: "Siswa ini belajar paling efektif dalam konteks sosial. Ia cenderung menjadi penghubung alami dan mampu membaca dinamika kelompok. Manfaatkan ini dengan memberinya peran peer tutor atau fasilitator diskusi — hasilnya akan melampaui yang Anda bayangkan.",
      sekolah: "Dominannya kecerdasan Interpersonal di sekolah menandakan bahwa metode cooperative learning dan proyek berbasis tim akan menghasilkan capaian lebih tinggi dari instruksi searah. Ini juga modal kuat untuk program kepemimpinan dan organisasi siswa.",
      yayasan: "Tingginya kecerdasan Interpersonal lintas sekolah adalah aset strategis. Yayasan dapat merancang program peer mentoring antar jenjang, kegiatan sosial lintassekolah, dan inisiatif kepemimpinan siswa yang memanfaatkan kekuatan ini secara sistemik.",
    },

    dalamKelas: [
      "Cepat mengambil peran pemimpin informal dalam kelompok",
      "Sering menjadi mediator saat ada konflik antar teman",
      "Belajar paling efektif saat menjelaskan materi ke orang lain",
      "Lebih cepat paham materi dari diskusi daripada membaca sendirian",
    ],

    aksi: {
      siswa: ["Jadikan dirimu tutor bagi teman — ini memperkuat pemahamanmu sendiri", "Gunakan teknik 'ceritakan ulang': setelah belajar, jelaskan ke seseorang meski hanya boneka atau cermin", "Bergabung dengan klub debat, OSIS, atau komunitas belajar", "Saat harus belajar sendirian, bayangkan kamu sedang presentasi ke audiens"],
      ortu: ["Beri ruang untuk belajar bersama teman di rumah atau perpustakaan", "Tanyakan 'tadi belajar apa?' setiap hari — percakapan singkat membantu ia memproses materi", "Dukung kegiatan ekstrakurikuler yang melibatkan kerja tim", "Hindari memaksanya belajar dalam isolasi total — ia butuh interaksi untuk berkembang"],
      wali: ["Terapkan Think-Pair-Share dan diskusi kelompok sebagai rutinitas kelas", "Beri giliran peran peer tutor kepada siswa ini", "Gunakan presentasi kelompok sebagai moda penilaian alternatif", "Minta ia memimpin sesi refleksi bersama setelah proyek selesai"],
      sekolah: ["Integrasikan metode cooperative learning dalam perencanaan pembelajaran lintas mata pelajaran", "Kembangkan program peer mentoring antar kelas", "Latih guru dalam fasilitasi diskusi terstruktur", "Rancang ruang kelas yang memungkinkan konfigurasi kelompok fleksibel"],
      yayasan: ["Rancang program lintassekolah berbasis proyek sosial dan kepemimpinan", "Fasilitasi pertukaran peer mentor antar sekolah dalam yayasan", "Masukkan kecerdasan Interpersonal sebagai kompetensi terukur dalam rapor karakter", "Investasikan dalam pelatihan cooperative learning untuk guru di semua jenjang"],
    },

    perhatian: {
      siswa: "Kamu kadang mengorbankan pencapaian pribadi demi menjaga keharmonisan kelompok. Belajar menetapkan batas — kamu bisa tetap peduli tanpa harus selalu mengalah.",
      ortu: "Anak dengan kecerdasan Interpersonal tinggi rentan terhadap tekanan sosial dan mudah terpengaruh pergaulan. Bantu ia mengembangkan kemampuan berkata tidak dan membuat keputusan secara mandiri.",
      institusi: "Siswa dengan kecerdasan ini mudah terpengaruh dinamika kelompok negatif. Pastikan lingkungan sosial sehat — program anti-perundungan dan pembinaan karakter adalah investasi langsung bagi kelompok ini.",
    },
    karir: ["Psikolog & Konselor", "Guru & Fasilitator", "Diplomat & Negosiator", "Manajer & HR", "UX Researcher"],
  },

  Sp: {
    judul: "Kecerdasan Spasial-Visual",
    sub: "Berpikir dalam gambar, ruang, dan dimensi",
    warna: "#6E3AD1",

    desc: {
      siswa: "Otakmu bekerja dalam tiga dimensi. Kamu 'melihat' konsep sebelum bisa menjelaskannya dengan kata — itulah mengapa diagram selalu lebih cepat dari teks panjang. Ini bukan cara belajar yang lebih rendah; ini cara berpikir yang sama canggihnya dengan cara lain.",
      ortu: "Ananda berpikir dalam gambar, ruang, dan bentuk. Ia mungkin tampak 'melamun' di kelas berbasis ceramah, padahal otaknya aktif membuat representasi visual dari materi yang diajarkan. Ini adalah tanda kecerdasan, bukan ketidakpedulian.",
      wali: "Siswa ini memahami konsep lewat representasi visual. Catatan berteksnya mungkin sepi, tapi penuh gambar dan simbol. Sediakan diagram, peta konsep, dan video sebagai jembatan — hasilnya akan berbeda jauh dari sesi ceramah saja.",
      sekolah: "Kecerdasan Spasial yang tinggi di sekolah mengindikasikan perlunya variasi media pembelajaran: infografis, video, peta konsep, dan proyek visual. Sekolah juga bisa mempertimbangkan mata pelajaran desain atau arsitektur sebagai jalur pengembangan.",
      yayasan: "Tingginya kecerdasan Spasial adalah potensi besar untuk program berbasis teknologi kreatif, seni dan desain, serta STEM visual. Yayasan dapat mengembangkan kurikulum yang memadukan pemikiran visual dengan tuntutan akademik standar.",
    },

    dalamKelas: [
      "Sering mencoret-coret atau membuat sketsa sambil menyimak",
      "Sangat cepat memahami grafik, peta, dan video",
      "Catatan penuh warna, panah, dan simbol visual",
      "Perlu waktu lebih saat teks panjang tanpa gambar pendukung",
    ],

    aksi: {
      siswa: ["Ubah catatan teks menjadi peta pikiran atau diagram sebelum belajar", "Tonton video atau animasi untuk memahami konsep baru", "Gunakan warna berbeda untuk tiap bab atau tema di catatan", "Sebelum menulis esai, buat sketsa alur argumenmu dulu"],
      ortu: ["Sediakan alat gambar, spidol warna, dan kertas lebar untuk belajar", "Perbolehkan catatan visual — ini bukan coret-coret; ini cara berpikirnya", "Dukung hobi visual: fotografi, menggambar, desain digital", "Tonton bersama video atau dokumenter tentang materi yang sedang dipelajari"],
      wali: ["Selalu sertakan diagram, peta, atau infografis dalam penjelasan", "Beri tugas yang membolehkan representasi visual sebagai pengganti teks", "Gunakan mind mapping sebagai alat review sebelum ujian", "Manfaatkan siswa ini untuk membuat ringkasan visual kelas"],
      sekolah: ["Tingkatkan penggunaan media visual di semua mata pelajaran", "Kembangkan program desain, fotografi, atau animasi sebagai ekskul unggulan", "Dorong guru menggunakan infografis dan visualisasi data dalam pengajaran", "Pertimbangkan asesmen berbasis proyek visual sebagai alternatif tes tulis"],
      yayasan: ["Kembangkan kurikulum STEAM yang memadukan seni visual dengan sains", "Investasikan dalam perangkat desain digital di laboratorium komputer", "Rancang program portfolio visual sebagai jalur prestasi non-akademik", "Fasilitasi pameran karya visual antar sekolah dalam yayasan"],
    },

    perhatian: {
      siswa: "Kamu kadang sulit mengartikulasikan ide secara verbal karena gambar sudah jelas di kepala. Melatih kemampuan menjelaskan secara lisan atau tertulis akan sangat memperkuat profilmu secara keseluruhan.",
      ortu: "Anak dengan kecerdasan Spasial tinggi sering dianggap kurang fokus di kelas konvensional. Pastikan guru mengetahui cara belajarnya — advokasi yang tepat bisa mengubah pengalaman belajarnya secara dramatis.",
      institusi: "Jangan salah tafsirkan coret-coretan dan gambar di buku catatan sebagai perilaku tidak tertib — itu adalah tanda proses berpikir yang aktif. Hukuman atas perilaku ini justru mematikan potensi.",
    },
    karir: ["UI/UX Designer", "Arsitek & Perencana", "Animator & Ilustrator", "Dokter Bedah", "Pilot & Insinyur"],
  },

  Ve: {
    judul: "Kecerdasan Verbal-Linguistik",
    sub: "Kata-kata sebagai alat berpikir dan memahami dunia",
    warna: "#2F6BD4",

    desc: {
      siswa: "Kata-kata adalah alat berpikirmu, bukan sekadar alat komunikasi. Kamu memahami konsep dengan memformulasinya dalam kalimat — membaca, menulis, dan berdiskusi bukan hanya output, tapi proses berpikirmu itu sendiri.",
      ortu: "Ananda memproses dunia melalui bahasa. Membaca, menulis, bercerita, dan berdebat adalah cara otaknya bekerja — bukan sekadar hobi. Kemampuan ini adalah fondasi kuat untuk hampir semua jalur karier akademik.",
      wali: "Siswa ini akan merespons lebih baik terhadap instruksi yang jelas secara verbal, penjelasan yang naratif, dan kesempatan untuk mengungkapkan pemikiran secara lisan atau tulisan. Beri ia ruang bicara — itu cara berpikirnya.",
      sekolah: "Kecerdasan Verbal-Linguistik yang kuat di sekolah mendukung program literasi, jurnalisme sekolah, dan ekstrakurikuler berbasis bahasa. Siswa-siswa ini juga potensial sebagai duta sekolah dan pemimpin opini.",
      yayasan: "Tingginya kecerdasan Verbal-Linguistik lintas sekolah membuka peluang program majalah dinding, podcast sekolah, kompetisi debat lintas yayasan, dan pengembangan literasi yang sistemik.",
    },

    dalamKelas: [
      "Aktif mencatat dan menyukai sumber bacaan primer",
      "Sering menjadi suara paling aktif dalam diskusi kelas",
      "Lebih mudah menghafal materi yang diceritakan atau dibaca dengan narasi",
      "Frustasi di pelajaran yang hanya berisi simbol tanpa penjelasan verbal",
    ],

    aksi: {
      siswa: ["Rangkum tiap bab dengan kata-katamu sendiri setelah membaca", "Jelaskan konsep ke teman atau anggota keluarga untuk memperkuat pemahaman", "Tulis jurnal belajar singkat setiap hari — apa yang dipahami, apa yang belum", "Manfaatkan podcast, audiobook, atau ceramah online sebagai sumber belajar"],
      ortu: ["Sediakan waktu untuk berbincang tentang apa yang dipelajarinya hari ini", "Dukung kebiasaan membaca — apa pun jenisnya, fiksi atau nonfiksi", "Bantu ia menemukan kata yang tepat saat ia kesulitan mengekspresikan diri", "Tonton film atau dokumenter berbasis cerita dan diskusikan bersama"],
      wali: ["Beri kesempatan presentasi lisan sebagai alternatif ujian tertulis", "Gunakan metode storytelling untuk mengantar konsep baru", "Minta ia membuat rangkuman atau ringkasan untuk seluruh kelas", "Manfaatkan kemampuannya untuk menulis buletin kelas atau notulen diskusi"],
      sekolah: ["Kembangkan program literasi dan jurnalisme siswa", "Buat kompetisi debat, pidato, atau penulisan kreatif sebagai kegiatan rutin", "Dorong penggunaan metode narasi dan storytelling dalam pengajaran", "Latih guru untuk memberi ruang ekspresi verbal yang terstruktur di kelas"],
      yayasan: ["Rancang program majalah atau podcast lintassekolah yang dikelola siswa", "Fasilitasi kompetisi menulis dan debat antar sekolah yayasan", "Kembangkan kurikulum literasi kritis yang terintegrasi di semua jenjang", "Bangun perpustakaan digital bersama yang diakses semua sekolah"],
    },

    perhatian: {
      siswa: "Kamu mungkin terlalu bergantung pada kata-kata dan merasa kesulitan berpikir secara visual atau kinestetik. Melatih cara berpikir lain — diagram, gerakan — akan memperluas kemampuanmu.",
      ortu: "Anak yang verbal sangat kuat kadang mendominasi diskusi dan kurang mendengarkan. Bantu ia mengembangkan kemampuan menyimak aktif — itu justru memperkuat kecerdasan interpersonalnya.",
      institusi: "Siswa dengan kecerdasan Verbal tinggi sering kali tampak 'pintar' secara konvensional namun mungkin kesulitan di bidang yang sangat visual atau kinestetik. Pastikan penilaian tidak hanya mengukur kemampuan verbal.",
    },
    karir: ["Penulis & Jurnalis", "Pengacara & Diplomat", "Content Creator", "Konsultan & Pembicara", "Pendidik"],
  },

  Ia: {
    judul: "Kecerdasan Intrapersonal",
    sub: "Mengenal dan mengarahkan diri sendiri dengan sangat baik",
    warna: "#8A4FB8",

    desc: {
      siswa: "Kamu adalah pengamat tajam terhadap dirimu sendiri. Sebelum bertindak, kamu merefleksikan motivasi dan konsekuensinya — ini kemampuan metakognitif yang langka: kemampuan berpikir tentang cara kamu berpikir sendiri.",
      ortu: "Ananda memiliki kesadaran diri yang luar biasa untuk seusianya. Ia tahu apa yang ia mau, mengapa, dan bagaimana ia merespons situasi tertentu. Kecerdasan ini adalah fondasi kesehatan mental dan keberhasilan jangka panjang.",
      wali: "Siswa ini tampak pendiam dan perlu waktu sebelum merespons — bukan karena tidak tahu, tapi karena ia sedang memverifikasi jawabannya secara internal. Jangan terburu-buru mengisi keheningannya; beri waktu, dan kualitas responsnya akan jauh lebih baik.",
      sekolah: "Kecerdasan Intrapersonal yang kuat di sekolah adalah modal untuk program pengembangan karakter, mentoring, dan bimbingan karier. Siswa-siswa ini cenderung punya tujuan yang jelas dan motivasi internal yang stabil jika didukung dengan baik.",
      yayasan: "Tingginya kecerdasan Intrapersonal adalah indikator kesehatan psikologis dan kesiapan belajar mandiri yang baik. Yayasan dapat membangun program pengembangan diri berbasis refleksi yang menjadi nilai pembeda dibanding sekolah lain.",
    },

    dalamKelas: [
      "Perlu jeda sebelum menjawab — sedang memverifikasi secara internal",
      "Tampak pendiam tapi pikirannya sangat aktif",
      "Lebih produktif dalam tugas mandiri yang bermakna",
      "Sangat sadar akan kondisi emosional dan motivasinya sendiri",
    ],

    aksi: {
      siswa: ["Tulis jurnal belajar singkat tiap hari: apa yang paham, apa yang belum, bagaimana perasaanmu tentang pelajaran itu", "Tetapkan tujuan belajar pribadi sebelum memulai sesi belajar", "Hubungkan setiap materi dengan tujuan hidupmu yang lebih besar", "Refleksikan setiap pencapaian — bukan hanya untuk merayakan, tapi untuk memahami apa yang berhasil"],
      ortu: ["Beri ruang privasi dan waktu tenang untuk berpikir — ia membutuhkannya lebih dari anak lain", "Ajak berbicara tentang cita-cita dan nilai hidupnya, bukan hanya nilai akademik", "Jangan memaksa ia langsung menjawab — beri waktu, lalu tanyakan kembali", "Dukung proyek mandiri yang ia pilih sendiri, bahkan jika tampak tidak konvensional"],
      wali: ["Beri tugas mandiri yang bermakna dan ada kebebasan memilih cara pengerjaannya", "Gunakan jurnal refleksi sebagai bagian dari penilaian", "Jangan paksa ia sering berbicara di depan kelas jika tidak siap — beri pilihan mode ekspresi", "Bimbing ia menemukan koneksi antara materi dan tujuan hidupnya"],
      sekolah: ["Integrasikan program bimbingan karier dan pengembangan diri dari kelas awal", "Rancang tugas yang membolehkan eksplorasi personal dan pilihan mandiri", "Latih guru untuk menghargai ritme berpikir yang lambat tapi dalam", "Kembangkan program mentoring individual bagi siswa dengan profil ini"],
      yayasan: ["Bangun program pengembangan diri berbasis refleksi sebagai nilai pembeda yayasan", "Kembangkan asesmen portofolio yang menangkap pertumbuhan personal, bukan hanya capaian akademik", "Fasilitasi program bimbingan karier yang terhubung dengan profil kecerdasan siswa", "Rancang ruang retreat atau refleksi berkala bagi siswa di semua jenjang"],
    },

    perhatian: {
      siswa: "Kamu cenderung sangat kritis pada dirimu sendiri dan menetapkan standar yang sulit dicapai. Belajar merayakan kemajuan kecil — kesempurnaan bukan prasyarat untuk melangkah maju.",
      ortu: "Anak dengan kecerdasan Intrapersonal tinggi rentan terhadap ruminasi dan overthinking. Jika terlihat murung dalam waktu lama, perlu diperhatikan — ini bukan sifat yang harus diabaikan.",
      institusi: "Siswa yang sangat intrapersonal kadang tidak menunjukkan kemajuan di indikator yang tampak dari luar. Pastikan sistem asesmen juga menangkap pertumbuhan internal dan proses berpikir, bukan hanya hasil akhir.",
    },
    karir: ["Peneliti & Akademisi", "Wirausaha berbasis nilai", "Penulis & Filsuf", "Psikolog & Konselor", "Pemimpin berbasis visi"],
  },

  Na: {
    judul: "Kecerdasan Naturalis",
    sub: "Menemukan makna lewat pola, keanekaragaman, dan dunia nyata",
    warna: "#3E9B6B",

    desc: {
      siswa: "Otakmu terlatih mengklasifikasikan dan menemukan pola dalam keanekaragaman. Ini bukan hanya tentang alam — kamu aktif setiap kali mengkategorikan, membandingkan, atau menemukan pengecualian dalam sistem apa pun, termasuk pelajaran sekolah.",
      ortu: "Ananda belajar paling baik dari dunia nyata dan contoh konkret. Ia bukan tipe anak yang puas dengan definisi di buku; ia perlu melihat, menyentuh, dan mengamati langsung. Ini adalah cara berpikir ilmuwan dan peneliti.",
      wali: "Siswa ini akan sangat terbantu jika materi selalu dikaitkan dengan contoh nyata dan dunia di sekitarnya. Ia mudah kehilangan motivasi jika konten terlalu abstrak tanpa jangkar pada realitas.",
      sekolah: "Kecerdasan Naturalis yang tinggi mendukung pendekatan sains berbasis inkuiri, belajar di luar kelas, dan kurikulum berbasis lingkungan. Sekolah yang memberi ruang ini cenderung memiliki siswa yang lebih termotivasi secara intrinsik.",
      yayasan: "Potensi kecerdasan Naturalis lintas sekolah adalah peluang untuk program lingkungan, sains terapan, dan pembelajaran berbasis alam yang menjadi keunggulan kurikulum yayasan.",
    },

    dalamKelas: [
      "Senang mengkategorikan dan menemukan pola di antara konsep",
      "Cepat menemukan pengecualian atau anomali dari aturan",
      "Belajar sangat baik dengan benda nyata, lapangan, atau praktikum",
      "Mudah kehilangan fokus saat materi terlalu abstrak dan teoritis",
    ],

    aksi: {
      siswa: ["Hubungkan setiap konsep abstrak dengan contoh nyata di kehidupanmu", "Gunakan metode klasifikasi — kelompokkan materi sebelum menghafalnya", "Belajar di luar ruangan sesekali untuk menyegarkan perspektif", "Kunjungi museum, kebun binatang, atau instalasi riset yang relevan dengan pelajaran"],
      ortu: ["Ajak ke tempat-tempat yang berkaitan dengan pelajaran: kebun raya, laboratorium terbuka, museum sains", "Dukung kegiatan berkebun, merawat hewan, atau berkemah", "Hubungkan PR akademik dengan pengalaman nyata di rumah", "Tunjukkan aplikasi nyata dari rumus atau konsep yang sedang dipelajari"],
      wali: ["Selalu mulai penjelasan dengan contoh nyata sebelum teori", "Rancang kegiatan pengamatan atau klasifikasi sederhana di kelas", "Beri tugas yang melibatkan pengumpulan data atau observasi lapangan", "Gunakan analogi alam untuk menjelaskan konsep sosial atau matematis"],
      sekolah: ["Kembangkan program pembelajaran berbasis lingkungan dan sains terapan", "Rancang kegiatan field trip yang terintegrasi dengan kurikulum", "Latih guru untuk menggunakan pendekatan inkuiri dan berbasis proyek", "Bangun kebun sekolah atau ruang observasi alam sebagai fasilitas pembelajaran"],
      yayasan: ["Kembangkan program environmental science lintas sekolah sebagai keunggulan kurikulum", "Rancang kompetisi sains berbasis alam dan lingkungan hidup", "Fasilitasi kunjungan riset ke lembaga sains atau lingkungan", "Jadikan kecerdasan Naturalis sebagai kompetensi yang dikembangkan secara terstruktur"],
    },

    perhatian: {
      siswa: "Kamu mungkin terlalu asyik mengamati detail dan akhirnya kehilangan gambaran besar. Melatih kemampuan sintesis — menarik kesimpulan dari banyak detail — akan sangat meningkatkan nilai akademismu.",
      ortu: "Anak naturalis kadang frustasi dengan pelajaran yang sangat abstrak. Pastikan ia punya ruang untuk belajar dengan cara yang cocok, dan bicarakan ini dengan gurunya jika perlu.",
      institusi: "Kecerdasan Naturalis sering tidak terukur dalam tes standar. Pertimbangkan penilaian berbasis proyek dan observasi untuk menangkap kecerdasan ini secara adil.",
    },
    karir: ["Biolog & Ilmuwan Lingkungan", "Dokter & Apoteker", "Chef & Ahli Gizi", "Data Scientist", "Guru Sains"],
  },

  Mu: {
    judul: "Kecerdasan Musikal",
    sub: "Belajar melalui ritme, pola bunyi, dan melodi",
    warna: "#B5485F",

    desc: {
      siswa: "Kamu memproses informasi melalui pola bunyi: ritme, melodi, dan repetisi. Materi yang dinyanyikan atau diiramakan jauh lebih lama melekat di memorimu. Ini bukan hobi — ini cara kerja otakmu yang sesungguhnya.",
      ortu: "Ananda menyimpan informasi lewat pola bunyi dan ritme. Ia mungkin sering bergumam saat berpikir atau mengetuk-ngetuk meja — bukan karena tidak fokus, melainkan karena otaknya aktif memproses lewat irama internal.",
      wali: "Siswa ini sensitif terhadap lingkungan bunyi. Gangguan suara dapat memecah konsentrasinya lebih dari siswa lain. Sebaliknya, ia akan sangat terbantu oleh ritme dan pola dalam penyampaian materi.",
      sekolah: "Kecerdasan Musikal mendukung program seni pertunjukan, choir, dan band sekolah. Di luar seni, kecerdasan ini juga mendukung kemampuan belajar bahasa asing dan kemampuan presentasi yang ritmis dan menarik.",
      yayasan: "Program seni dan musik berkualitas di sekolah bukan sekadar ekstrakurikuler — ini adalah jalur pengembangan kecerdasan yang nyata. Yayasan dapat menjadikan ini keunggulan pendidikan yang terukur.",
    },

    dalamKelas: [
      "Sering bergumam, mengetuk, atau berayun saat berkonsentrasi",
      "Sangat sensitif terhadap gangguan suara di sekitar",
      "Menghafal lebih efektif lewat jingle, rima, atau lagu",
      "Bisa terlihat tidak fokus padahal sedang memproses lewat irama internal",
    ],

    aksi: {
      siswa: ["Buat jingle atau rap untuk rumus dan konsep penting", "Belajar dengan musik instrumental tanpa lirik sebagai latar belakang", "Ubah poin-poin penting menjadi pola ritmis saat menghafal", "Manfaatkan ritme napas saat ujian untuk mengelola kecemasan"],
      ortu: ["Izinkan belajar dengan musik latar — ini tidak mengganggu, justru membantu", "Dukung les musik atau kegiatan paduan suara", "Hindari menegur saat ia bergumam saat belajar — itu tanda konsentrasinya aktif", "Ciptakan ruang belajar yang punya kontrol atas kebisingan lingkungan"],
      wali: ["Gunakan pola ritmis dalam menyampaikan daftar atau urutan langkah", "Coba teknik hafalan berbasis lagu atau jingle di kelas", "Beri toleransi pada perilaku bergumam atau mengetuk selama tidak mengganggu kelas", "Sediakan headphone/earphone untuk sesi kerja mandiri jika memungkinkan"],
      sekolah: ["Kembangkan program musik yang terintegrasi dengan kurikulum, bukan hanya ekskul", "Eksplorasi musik sebagai alat bantu belajar lintas mata pelajaran", "Rancang lingkungan akustik kelas yang dapat dikontrol", "Ukur perkembangan kecerdasan musikal sebagai bagian dari penilaian holistik"],
      yayasan: ["Investasikan dalam infrastruktur musik: instrumen, ruang akustik, guru musik bersertifikat", "Kembangkan festival seni dan musik lintassekolah sebagai ajang pengembangan", "Rancang kurikulum seni terpadu yang mengakui musik sebagai kecerdasan akademis", "Dokumentasikan dampak program musik terhadap capaian akademik sebagai data kebijakan"],
    },

    perhatian: {
      siswa: "Kamu mungkin lebih menikmati proses kreatif dan kurang sabar dengan aspek teknis. Melatih disiplin dan kemampuan analitis akan melengkapi kekuatan artistikmu.",
      ortu: "Jangan abaikan kecerdasan musikal hanya karena tampak kurang 'akademis'. Penelitian menunjukkan korelasi kuat antara pelatihan musik dan kemampuan matematis serta bahasa.",
      institusi: "Jangan jadikan musik hanya sebagai kegiatan pengisi waktu. Perlakuan serius terhadap program musik akan menghasilkan dampak positif pada disiplin, konsentrasi, dan kemampuan belajar siswa secara umum.",
    },
    karir: ["Musisi & Komposer", "Sound Designer", "Guru Musik & Terapis", "Brand & Marketing", "Podcaster & Presenter"],
  },

  Lo: {
    judul: "Kecerdasan Logis-Matematis",
    sub: "Pola, sebab-akibat, dan pembuktian yang terukur",
    warna: "#3B4DA8",

    desc: {
      siswa: "Pikiranmu bekerja dengan pola sebab-akibat yang ketat. Kamu tidak puas dengan 'karena memang begitu' — kamu butuh alasan yang logis, dapat dibuktikan, dan terstruktur. Ini bukan hanya soal matematika; ini cara berpikir sistematis yang berlaku di bidang apa pun.",
      ortu: "Ananda memiliki kemampuan berpikir logis dan sistematis yang kuat. Ia akan terus bertanya 'mengapa' dan 'bagaimana bisa' — ini bukan sikap sulit, melainkan tanda kecerdasan yang autentik dan perlu dipupuk.",
      wali: "Siswa ini berpikir dengan struktur dan logika. Ia akan sangat terbantu oleh penjelasan yang urut, sistematis, dan dapat dibuktikan. Pertanyaannya yang kritis bukan gangguan — itu adalah tanda keterlibatan intelektual yang dalam.",
      sekolah: "Kecerdasan Logis-Matematis yang kuat adalah modal untuk program sains, teknologi, dan pemrograman. Sekolah yang menantang kecerdasan ini dengan soal berbasis pemecahan masalah — bukan sekadar hafalan — akan mendapatkan respons terbaik.",
      yayasan: "Tingginya kecerdasan Logis-Matematis di yayasan adalah modal besar untuk program STEM, robotika, dan olimpiade sains. Ini juga berkorelasi dengan kemampuan analitis yang dibutuhkan di era data.",
    },

    dalamKelas: [
      "Bertanya 'mengapa' dan 'bagaimana bisa' lebih sering dari teman",
      "Sangat menikmati tantangan berpikir dan soal tidak standar",
      "Frustrasi dengan penjelasan yang tidak sistematis atau melompat",
      "Sangat teliti memverifikasi jawaban sebelum menyerahkan",
    ],

    aksi: {
      siswa: ["Buat kerangka logis atau alur langkah sebelum mengerjakan soal baru", "Cari pola dan hubungan sebab-akibat dalam setiap materi yang dipelajari", "Tantang dirimu dengan soal olimpiade atau teka-teki logika di luar kurikulum", "Gunakan pemrograman atau spreadsheet untuk mengeksplorasi konsep matematis"],
      ortu: ["Sediakan teka-teki, catur, atau permainan strategi di rumah", "Hargai pertanyaan kritisnya — jangan menganggap ini sikap sulit", "Dukung eksperimen sederhana di rumah untuk memuaskan rasa ingin tahunya", "Bantu ia menemukan koneksi antara logika matematika dan bidang lain yang disukainya"],
      wali: ["Gunakan pendekatan pemecahan masalah berbasis kasus nyata", "Beri soal tantangan di luar kurikulum standar untuk menjaga motivasinya", "Jelaskan konsep secara urut dan berikan bukti — ia tidak mudah menerima klaim tanpa dasar", "Libatkan ia dalam merancang aturan kelas atau prosedur kelompok"],
      sekolah: ["Kembangkan kompetisi matematika dan sains secara berkala", "Rancang program pemrograman dan robotika sebagai kegiatan inti", "Latih guru untuk memberi ruang diskusi pembuktian dan eksplorasi logis", "Gunakan pendekatan problem-based learning di pelajaran eksak"],
      yayasan: ["Investasikan dalam program STEM dan robotika yang terstruktur", "Fasilitasi partisipasi olimpiade sains dan matematika tingkat nasional", "Kembangkan kurikulum berpikir komputasional dari jenjang dasar", "Bangun kemitraan dengan lembaga riset atau universitas untuk program enrichment"],
    },

    perhatian: {
      siswa: "Kamu kadang terlalu fokus pada kebenaran teknis dan kurang memperhatikan dimensi emosional. Kecerdasan interpersonal dan empati adalah skill yang perlu kamu latih secara sadar.",
      ortu: "Anak logis-matematis sering merasa frustrasi dengan ketidakkonsistenan aturan di rumah. Pastikan aturan keluarga jelas, konsisten, dan ada alasannya — ini sangat penting untuk kepercayaannya.",
      institusi: "Hati-hati dengan pendekatan yang hanya menghargai jawaban benar tanpa menghargai proses berpikir. Bagi siswa dengan kecerdasan ini, cara mereka sampai pada jawaban sama pentingnya dengan jawaban itu sendiri.",
    },
    karir: ["Data Analyst & Scientist", "Insinyur & Programmer", "Aktuaris & Analis Keuangan", "Dokter (diagnostik)", "Ilmuwan & Peneliti"],
  },

  Ki: {
    judul: "Kecerdasan Kinestetik",
    sub: "Tubuh sebagai instrumen belajar yang paling kuat",
    warna: "#C57A2C",

    desc: {
      siswa: "Tubuhmu adalah instrumen belajarmu. Gerakan dan sentuhan bukan gangguan — itu justru cara kamu menyimpan informasi paling dalam. Memori ototmu bekerja sangat efisien, dan pengalaman fisik meninggalkan jejak paling tahan lama.",
      ortu: "Ananda belajar melalui gerakan dan pengalaman langsung. Ia bukan anak yang bisa duduk diam berjam-jam tanpa kehilangan efektivitas — dan itu bukan masalah disiplin, melainkan cara kerja otaknya yang optimal lewat aktivitas fisik.",
      wali: "Siswa ini perlu bergerak untuk berpikir. Ia bukan 'nakal' saat gelisah di kursi; otaknya butuh input kinestetik untuk memproses informasi. Beri ia peran aktif di kelas dan jeda gerak — efektivitas belajarnya akan meningkat signifikan.",
      sekolah: "Kecerdasan Kinestetik yang dominan di sekolah menuntut variasi dalam metode pengajaran: lab praktik, simulasi, role play, dan proyek berbasis pembuatan. Ini juga mendukung program olahraga dan seni pertunjukan sebagai jalur prestasi yang setara.",
      yayasan: "Tingginya kecerdasan Kinestetik adalah argumen kuat untuk menambah porsi pembelajaran berbasis praktik, ekskul vokasional, dan pendidikan jasmani yang terstruktur dalam kurikulum yayasan.",
    },

    dalamKelas: [
      "Sulit duduk diam terlalu lama tanpa kehilangan konsentrasi",
      "Sangat produktif saat ada aktivitas fisik atau penggunaan tangan",
      "Memori sangat kuat untuk hal-hal yang pernah dipraktikkan langsung",
      "Perlu jeda bergerak untuk mempertahankan kualitas perhatian",
    ],

    aksi: {
      siswa: ["Belajar sambil berjalan di tempat atau membuat gestur yang mewakili konsep", "Buat model fisik, diagram tiga dimensi, atau prototipe dari materi yang dipelajari", "Ambil jeda aktif 5–10 menit setelah setiap 45 menit belajar", "Terapkan ilmu di kehidupan nyata — proyek, magang, atau simulasi"],
      ortu: ["Izinkan belajar sambil bergerak: berjalan sambil membaca, mengetuk-ngetuk saat menghafal", "Dukung kegiatan olahraga, seni bela diri, tari, atau kerajinan tangan", "Sediakan meja berdiri atau ruang gerak saat belajar di rumah jika memungkinkan", "Buat belajar menjadi pengalaman: kunjungi tempat yang relevan, lakukan praktik langsung"],
      wali: ["Rancang jeda gerak (brain break) setelah sesi belajar panjang", "Gunakan role play, simulasi, dan demonstrasi sebagai metode pengajaran", "Beri siswa ini peran aktif: memimpin percobaan, memperagakan konsep", "Gunakan manipulatif (benda fisik) dalam pelajaran matematika dan sains"],
      sekolah: ["Perbanyak porsi praktikum, lab, dan proyek berbasis pembuatan", "Kembangkan program magang atau learning by doing dari kelas awal", "Rancang kurikulum olahraga yang terstruktur dan bernilai akademis", "Latih guru untuk mengintegrasikan aktivitas fisik dalam sesi belajar"],
      yayasan: ["Kembangkan program vokasional dan keterampilan tangan sebagai jalur prestasi resmi", "Investasikan dalam fasilitas lab, workshop, dan ruang praktik yang memadai", "Fasilitasi kompetisi keterampilan (skills competition) lintassekolah", "Rancang kurikulum yang mengakui kecerdasan kinestetik setara dengan kecerdasan akademis lain"],
    },

    perhatian: {
      siswa: "Kamu mungkin kurang sabar dengan teori panjang sebelum praktik. Namun fondasi konseptual yang kuat akan meningkatkan kualitas praktikmu secara eksponensial — investasikan waktu untuk memahaminya.",
      ortu: "Jangan buru-buru memberi label 'hiperaktif' atau 'sulit diatur'. Konsultasikan dengan guru dan pastikan metode belajarnya sesuai sebelum mempertimbangkan intervensi lain.",
      institusi: "Siswa kinestetik sering dihukum karena perilaku yang merupakan kebutuhan belajar mereka. Evaluasi apakah aturan kelas yang sangat kaku tentang posisi duduk dan ketenangan justru menjadi penghalang bagi kecerdasan ini untuk berkembang.",
    },
    karir: ["Atlet & Pelatih", "Dokter Bedah & Fisioterapis", "Chef & Pengrajin", "Teknisi & Mekanik", "Aktor & Penari"],
  },
};

// ---- kombinasi dua kecerdasan teratas ----
const COMBO_INSIGHTS = [
  { codes: ["Ie", "Sp"], judul: "Desainer Empatik", desc: "Kombinasi Interpersonal dan Spasial menghasilkan kemampuan langka: memahami kebutuhan orang lain secara mendalam, lalu menterjemahkannya menjadi solusi visual yang tepat sasaran. Profil ini adalah fondasi natural UI/UX designer, arsitek sosial, atau pemimpin berbasis empati." },
  { codes: ["Sp", "Ve"], judul: "Kreator Naratif Visual", desc: "Berpikir dalam gambar tapi bisa mengartikulasikannya dengan kata. Kombinasi langka ini menghasilkan kreator yang bisa memikirkan ide visual sekaligus menjualnya dengan narasi yang kuat." },
  { codes: ["Ie", "Ve"], judul: "Pemimpin Opini", desc: "Memahami orang DAN bisa menggerakkan mereka dengan kata. Kombinasi klasik pemimpin yang efektif — tahu apa yang dibutuhkan orang dan tahu cara menyampaikannya agar benar-benar didengar." },
  { codes: ["Lo", "Sp"], judul: "Pemikir Sistemik Visual", desc: "Pola abstrak bertemu representasi tiga dimensi. Bisa membayangkan bagaimana sistem bekerja dan merepresentasikannya secara visual — profil ilmuwan yang bisa membuat teori menjadi prototipe." },
  { codes: ["Ia", "Ve"], judul: "Penulis Reflektif", desc: "Pemahaman diri yang dalam bertemu kemampuan mengekspresikannya lewat kata. Menghasilkan karya yang sangat otentik dan personal karena berakar dari refleksi yang jujur." },
  { codes: ["Na", "Lo"], judul: "Ilmuwan Pola", desc: "Mengklasifikasikan keanekaragaman bertemu mencari sebab-akibat. Fondasi researcher atau data scientist yang bisa menjelaskan mengapa suatu pola terjadi, bukan sekadar mencatatnya." },
  { codes: ["Ki", "Mu"], judul: "Seniman Pertunjukan", desc: "Tubuh dan suara bekerja sebagai satu instrumen. Ritme, gerakan, dan ekspresi fisik menjadi bahasa alami — profil musisi berbasis gerakan, penari, atau aktor yang punya kepekaan musikal kuat." },
  { codes: ["Ie", "Ia"], judul: "Konselor Terlatih", desc: "Memahami orang lain sekaligus memahami diri sendiri dengan baik. Menghasilkan konselor, psikolog, atau pemimpin yang benar-benar hadir untuk orang lain tanpa kehilangan dirinya sendiri." },
];

function comboFor(codes) {
  if (!codes || codes.length < 2) return null;
  const [a, b] = codes;
  return COMBO_INSIGHTS.find((c) =>
    (c.codes[0] === a && c.codes[1] === b) || (c.codes[0] === b && c.codes[1] === a)
  ) || { judul: `${window.MI_BY[a]?.name} + ${window.MI_BY[b]?.name}`, desc: `Kombinasi dua kecerdasan terkuatmu menciptakan pola belajar yang unik. Kamu paling efektif saat keduanya diaktifkan bersama.` };
}

// ---- generic modal overlay ----
function IGModal({ onClose, title, children, width = 680 }) {
  useEffectIns(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, []);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(28,20,46,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "40px 20px", overflowY: "auto", animation: "igFadeModal .2s ease" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", borderRadius: "var(--radius-xl)", boxShadow: "var(--shadow-pop)", width: "100%", maxWidth: width, overflow: "hidden", marginBottom: 40, animation: "igSlideUp .25s cubic-bezier(.2,.8,.2,1)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "20px 26px", borderBottom: "1px solid var(--line)" }}>
          <span style={{ fontSize: 15.5, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{title}</span>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface-soft)", color: "var(--ink-2)", display: "grid", placeItems: "center", cursor: "pointer", fontSize: 18, lineHeight: 1, transition: "all .15s ease" }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--surface-soft)"}>×</button>
        </div>
        <div style={{ padding: "24px 26px 28px" }}>{children}</div>
      </div>
    </div>
  );
}

// ---- kecerdasan deep-dive panel — roleCtx: "siswa"|"ortu"|"wali"|"sekolah"|"yayasan" ----
function IGIntelPanel({ code, index, roleCtx }) {
  const d = MI_DEEP[code];
  const m = window.MI_BY[code];
  if (!d || !m) return null;

  const isIndividu = roleCtx === "siswa" || roleCtx === "ortu";
  const deskripsi = d.desc[roleCtx] || d.desc.wali;
  const aksi = d.aksi[roleCtx] || d.aksi.wali;
  const perhatian = isIndividu ? d.perhatian[roleCtx] : d.perhatian.institusi;

  // Label sections per role
  const labelAksi = roleCtx === "siswa" ? "Apa yang bisa kamu lakukan"
    : roleCtx === "ortu" ? "Cara orang tua mendukung"
    : roleCtx === "wali" ? "Strategi di kelas"
    : roleCtx === "sekolah" ? "Program di level sekolah"
    : "Inisiatif di level yayasan";

  const labelPerhatian = roleCtx === "siswa" ? "Yang perlu kamu jaga"
    : roleCtx === "ortu" ? "Yang perlu diperhatikan orang tua"
    : "Catatan untuk institusi";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* hero */}
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "16px 18px", background: `color-mix(in srgb, ${m.color} 10%, transparent)`, borderRadius: 14, border: `1px solid color-mix(in srgb, ${m.color} 22%, transparent)` }}>
        <span style={{ width: 50, height: 50, borderRadius: 14, background: m.color, color: "#fff", display: "grid", placeItems: "center", flex: "none" }}>
          {(() => { const Ic = window.INTEL_ICON[code]; return <Ic size={26} />; })()}
        </span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: "var(--ink)", letterSpacing: "-.01em" }}>{d.judul}</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 3 }}>{d.sub}</div>
          {index != null && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
              <div style={{ height: 7, width: 160, background: "var(--bg-2)", borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: `${index}%`, height: "100%", background: m.color, borderRadius: 99 }} />
              </div>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: m.color }}>{index}</span>
              <window.LevelBadge index={index} />
            </div>
          )}
        </div>
      </div>

      {/* deskripsi per role */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--ink-4)", marginBottom: 8 }}>Apa artinya ini?</div>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: "var(--ink-2)", textWrap: "pretty" }}>{deskripsi}</p>
      </div>

      {/* dalam kelas — terlihat seperti apa */}
      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--ink-4)", marginBottom: 10 }}>
          {isIndividu ? "Bagaimana ini terlihat sehari-hari" : "Tanda-tanda di kelas"}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {d.dalamKelas.map((b, i) => (
            <div key={i} style={{ display: "flex", gap: 10, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.5 }}>
              <span style={{ width: 22, height: 22, borderRadius: 7, background: `color-mix(in srgb, ${m.color} 14%, transparent)`, color: m.color, display: "grid", placeItems: "center", flex: "none", marginTop: 1 }}>
                <window.IconCheckCircle size={14} />
              </span>
              {b}
            </div>
          ))}
        </div>
      </div>

      {/* aksi per role */}
      <div style={{ background: "var(--bg-2)", borderRadius: 14, padding: "16px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--ink-4)", marginBottom: 10 }}>{labelAksi}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {aksi.map((p, i) => (
            <div key={i} style={{ display: "flex", gap: 9, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.45 }}>
              <span style={{ color: m.color, flex: "none", marginTop: 1, fontWeight: 800 }}>→</span> {p}
            </div>
          ))}
        </div>
      </div>

      {/* perhatian per role */}
      <div style={{ display: "flex", gap: 11, background: "var(--perhatian-bg)", borderRadius: 13, padding: "14px 16px" }}>
        <window.IconFlag size={16} style={{ color: "var(--perhatian)", flex: "none", marginTop: 2 }} />
        <div>
          <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--perhatian)", marginBottom: 5 }}>{labelPerhatian}</div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)", textWrap: "pretty" }}>{perhatian}</p>
        </div>
      </div>

      {/* karir — hanya untuk individual view */}
      {isIndividu && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--ink-4)", marginBottom: 10 }}>Arah profesi yang relevan</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {d.karir.map((k, i) => (
              <span key={i} style={{ fontSize: 12.5, fontWeight: 600, color: m.color, background: `color-mix(in srgb, ${m.color} 11%, transparent)`, padding: "6px 13px", borderRadius: 99 }}>{k}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- profil holistic panel ----
function IGProfilePanel({ voice }) {
  const S = window.STUDENT;
  const miList = window.studentMIList();
  const top2 = miList.slice(0, 2);
  const combo = comboFor(top2.map((m) => m.code));
  const low = miList[miList.length - 1];
  const isS = voice === "siswa";
  const J = S.journey;
  const saLast = J.sa[J.sa.length - 1];
  const lbLast = J.lb[J.lb.length - 1];
  const cfLast = J.cf[J.cf.length - 1];

  const saNote = saLast >= 70 ? (isS ? "Kesadaran dirimu sudah kuat — kamu tahu cara belajarmu sendiri." : `Kesadaran diri ${S.panggilan} sudah kuat — ia tahu cara belajarnya sendiri.`)
    : saLast >= 50 ? (isS ? "Mulai mengenal pola belajarmu — terus eksplorasi." : `${S.panggilan} mulai mengenal pola belajarnya dan masih perlu eksplorasi.`)
    : (isS ? "Refleksi rutin tiap minggu akan mempercepat pemahamanmu tentang dirimu sendiri." : `Refleksi rutin akan membantu ${S.panggilan} mengenali dirinya lebih dalam.`);

  const lbNote = lbLast >= 65 ? (isS ? "Kebiasaan belajarmu sudah cukup baik — rutin dan tidak menumpuk di ujian." : `Kebiasaan belajar ${S.panggilan} sudah terbentuk dengan baik.`)
    : lbLast >= 48 ? (isS ? "Sebagian kebiasaan sudah terbentuk. Perhatikan hari-hari di mana motivasimu menurun." : `Kebiasaan belajar ${S.panggilan} konsisten sebagian — perlu perhatian pada momen motivasi turun.`)
    : (isS ? "Jadwal harian kecil yang konsisten jauh lebih efektif dari satu sesi marathon." : `Perlu struktur belajar yang lebih konsisten — jadwal kecil harian lebih baik dari marathon.`);

  const cfNote = cfLast >= 65 ? (isS ? "Kamu sudah punya gambaran cita-cita yang cukup jelas dan aktif mencarinya." : `${S.panggilan} sudah punya gambaran cita-cita yang jelas dan aktif mencari informasi.`)
    : (isS ? "Eksplorasi lebih banyak profesi, terutama yang berkaitan dengan kekuatan utamamu." : `Gambaran cita-cita masih perlu diperjelas — eksplorasi profesi yang sesuai kecerdasan utamanya.`);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div style={{ background: "linear-gradient(135deg, #6B2BE0 0%, #4F14B8 100%)", borderRadius: 16, padding: "20px 22px", color: "#fff" }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "#E9DDFF", marginBottom: 7 }}>Profil kombinasi teratas</div>
        <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-.02em", marginBottom: 10 }}>{combo.judul}</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: "#E9DDFF", textWrap: "pretty" }}>{combo.desc}</p>
      </div>

      <div>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".07em", textTransform: "uppercase", color: "var(--ink-4)", marginBottom: 10 }}>Kondisi saat ini (bulan terakhir)</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[{ label: "Kesadaran Diri", value: saLast, color: "var(--ungu)", note: saNote },
            { label: "Kebiasaan Belajar", value: lbLast, color: "#2F6BD4", note: lbNote },
            { label: "Arah Karier", value: cfLast, color: "#C57A2C", note: cfNote },
          ].map((it, i) => (
            <div key={i} style={{ background: "var(--surface-soft)", border: "1px solid var(--line)", borderRadius: 12, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{it.label}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: it.color }}>{it.value}</span>
              </div>
              <div style={{ height: 6, background: "var(--bg-2)", borderRadius: 99, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ width: `${it.value}%`, height: "100%", background: it.color, borderRadius: 99 }} />
              </div>
              <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5 }}>{it.note}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--perhatian-bg)", borderRadius: 13, padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
          <window.IconFlag size={15} style={{ color: "var(--perhatian)", flex: "none", marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink)", marginBottom: 5 }}>Area yang paling perlu dikembangkan</div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>
              <b>{low.name}</b> (index {low.index}) adalah kecerdasan yang paling jarang dipakai. Ini bukan kelemahan — hanya gaya yang belum terlatih. Langkah pertama: {MI_DEEP[low.code]?.aksi[voice]?.[0]?.toLowerCase() || MI_DEEP[low.code]?.aksi.siswa?.[0]?.toLowerCase()}.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, alignItems: "center", background: "var(--aman-bg)", borderRadius: 13, padding: "14px 16px" }}>
        <window.IconCheckCircle size={20} style={{ color: "var(--aman)", flex: "none" }} />
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)", textWrap: "pretty" }}>
          Cita-cita <b>{S.cita.profesi}</b> {isS ? "sangat selaras" : `sangat selaras`} dengan kekuatan utama: <b>{top2[0].name}</b> dan <b>{top2[1].name}</b>. {isS ? "Arahkan pengembangan dirimu ke aktivitas yang mengaktifkan keduanya sekaligus." : `Dorong aktivitas yang mengaktifkan keduanya secara bersamaan.`}
        </p>
      </div>
    </div>
  );
}

Object.assign(window, { MI_DEEP, COMBO_INSIGHTS, comboFor, IGModal, IGIntelPanel, IGProfilePanel });
