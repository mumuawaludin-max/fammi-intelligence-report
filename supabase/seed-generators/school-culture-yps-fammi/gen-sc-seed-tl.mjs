// Bagian 3 generator seed School Culture: sembilan tindak lanjut lembaga (4 tipe budaya +
// 5 subdimensi kesejahteraan) plus briefing. Teks dibangun dari angka agregat yang sudah
// dihitung generator, jadi kalimat "mengapa_data" selalu cocok dengan yang tampil di dashboard.

const n1 = (x) => (Math.round(x * 10) / 10).toString().replace(".", ",");
const plus = (x) => (x > 0 ? `+${n1(x)}` : n1(x));

/** Sembilan rekomendasi untuk satu target_role. Sama isinya untuk tiap role yang diseed,
 * yang membedakan cuma kolom target_role -- pipeline Gemini sungguhan merumuskan ulang per
 * role, seed demo ini sengaja tidak berpura-pura melakukan hal yang sama. */
export function buildTindakLanjut(agg) {
  const b = Object.fromEntries(agg.budaya.map((x) => [x.tipe, x]));
  const k = Object.fromEntries(agg.kesejahteraan.map((x) => [x.kode, x]));

  return [
    {
      fokus: "budaya", dimensi: "Inovasi", type: "perlu_perhatian", term: "long", icon: "💡",
      title: "Buka ruang uji coba metode mengajar yang terjadwal, bukan insidental",
      teaser: `Inovasi jadi jarak terbesar antara kondisi sekarang dan harapan Tim, ${plus(b.Inovasi.gap)} poin.`,
      mengapa_data: `Inovasi dirasakan ${n1(b.Inovasi.mean_gambaran)} dari 100 sementara harapannya ${n1(b.Inovasi.mean_harapan)}, selisih ${plus(b.Inovasi.gap)} poin dan yang terbesar di antara empat tipe budaya. Pola yang sama muncul di jawaban esai: ide baru disebut sering berhenti di forum karena tidak jelas siapa yang memutuskan.`,
      mengapa_perspektif: "Guru jarang kekurangan ide. Yang biasanya kurang adalah waktu yang benar-benar dialokasikan untuk mencoba, dan kepastian bahwa percobaan yang gagal tidak akan dihitung sebagai kesalahan.",
      dasar_teori: "Psychological safety (Edmondson): tim berani mencoba hal baru saat risiko sosial dari kegagalan kecil dilihat rendah, bukan saat diminta lebih kreatif.",
      manfaat: {
        tim: "Guru punya tempat yang jelas untuk mencoba tanpa merasa mencuri waktu dari kewajiban lain.",
        pimpinan: "Ide yang selama ini berhenti di forum jadi terlihat, lengkap dengan hasilnya.",
        sekolah: "Praktik mengajar yang terbukti bisa disebarkan antarjenjang, bukan berhenti di satu kelas.",
      },
      konkret: [
        { aksi: "Tetapkan satu hari per bulan sebagai waktu uji coba metode ajar, masuk kalender akademik.", waktu: "Bulan ini", kenapa: "Tanpa slot di kalender, uji coba selalu kalah dari kegiatan yang sudah terjadwal." },
        { aksi: "Buat satu formulir usulan setengah halaman: ide, kelas sasaran, cara menilai hasilnya.", waktu: "Bulan ini", kenapa: "Jalur yang sederhana menutup alasan paling sering muncul, yaitu tidak tahu harus mengajukan ke siapa." },
        { aksi: "Tunjuk satu penanggung jawab per jenjang yang berwenang menyetujui uji coba skala kelas.", waktu: "Bulan ini", kenapa: "Ide berhenti bukan karena ditolak, tapi karena tidak ada yang merasa berwenang memutuskan." },
        { aksi: "Bahas hasil uji coba di forum jenjang tiap akhir bulan, termasuk yang tidak berhasil.", waktu: "3 bulan", kenapa: "Membahas yang gagal secara terbuka adalah cara tercepat menurunkan rasa takut mencoba." },
      ],
      indikator_keberhasilan: [
        { title: "Jumlah uji coba tercatat", detail: "Berapa uji coba metode ajar yang benar-benar dijalankan dan dilaporkan tiap bulan per jenjang." },
        { title: "Sebaran pengusul", detail: "Berapa guru berbeda yang mengajukan, bukan orang yang sama berulang kali." },
        { title: "Praktik yang diadopsi ulang", detail: "Berapa metode hasil uji coba yang dipakai guru lain di semester berikutnya." },
      ],
      hal_diwaspadai: [
        "Kalau waktu uji coba diumumkan tapi tidak mengurangi beban lain, guru akan membacanya sebagai tugas tambahan, bukan ruang.",
        "Kalau cuma percobaan yang berhasil yang diapresiasi, guru akan berhenti melaporkan yang gagal dan datanya jadi tidak berguna.",
      ],
    },
    {
      fokus: "budaya", dimensi: "Aturan", type: "perlu_perhatian", term: "short", icon: "📋",
      title: "Pangkas prosedur yang tidak lagi menambah nilai",
      teaser: `Aturan dirasakan ${n1(b.Aturan.mean_gambaran)} poin, lebih tinggi dari yang diharapkan Tim (${n1(b.Aturan.mean_harapan)}).`,
      mengapa_data: `Aturan satu-satunya tipe budaya yang harapannya LEBIH RENDAH dari kondisi sekarang, selisih ${plus(b.Aturan.gap)} poin. Artinya bukan ketertiban yang kurang, tapi porsinya sudah melewati yang dibutuhkan Tim untuk bekerja.`,
      mengapa_perspektif: "Prosedur biasanya bertambah karena ada masalah yang perlu ditutup, dan hampir tidak pernah dikurangi saat masalahnya sudah lewat. Yang menumpuk kemudian dibaca staf sebagai ketidakpercayaan.",
      dasar_teori: "Job Demands-Resources: tuntutan administratif yang tidak berujung pada hasil kerja terbaca sebagai beban murni, bukan sumber daya, dan berkorelasi langsung dengan kelelahan kerja.",
      manfaat: {
        tim: "Waktu yang selama ini habis di formulir kembali ke persiapan mengajar.",
        pimpinan: "Prosedur yang tersisa lebih mungkin benar-benar dijalankan, bukan dilewati diam-diam.",
        sekolah: "Kecepatan mengambil keputusan naik tanpa harus menambah orang.",
      },
      konkret: [
        { aksi: "Daftar semua laporan rutin yang wajib diisi guru satu semester terakhir, lengkap dengan siapa yang membacanya.", waktu: "Minggu ini", kenapa: "Laporan yang tidak punya pembaca adalah kandidat pertama untuk dihapus." },
        { aksi: "Hapus atau gabungkan minimal tiga laporan yang datanya sudah ada di tempat lain.", waktu: "Bulan ini", kenapa: "Target angka yang jelas mencegah audit prosedur berhenti jadi wacana." },
        { aksi: "Tetapkan aturan main baru: setiap prosedur baru wajib menyebut prosedur mana yang digantikannya.", waktu: "3 bulan", kenapa: "Tanpa aturan pengganti, jumlah prosedur cuma akan bertambah lagi setelah audit ini." },
      ],
      indikator_keberhasilan: [
        { title: "Jumlah laporan rutin", detail: "Berapa laporan wajib guru sebelum dan sesudah audit, dihitung per semester." },
        { title: "Jam administrasi per guru", detail: "Perkiraan jam per bulan yang dipakai untuk administrasi, ditanyakan langsung ke guru." },
      ],
      hal_diwaspadai: [
        "Kalau prosedur dipangkas tanpa memperjelas siapa yang bertanggung jawab, yang muncul bukan kelegaan tapi kebingungan baru.",
      ],
    },
    {
      fokus: "budaya", dimensi: "Kekeluargaan", type: "pertahankan", term: "long", icon: "🤝",
      title: "Jaga kekuatan kekeluargaan supaya tidak habis untuk menambal jadwal",
      teaser: `Kekeluargaan jadi budaya paling terasa (${n1(b.Kekeluargaan.mean_gambaran)} poin) dan harapannya cuma ${plus(b.Kekeluargaan.gap)} poin di atasnya.`,
      mengapa_data: `Kekeluargaan tertinggi di antara empat tipe (${n1(b.Kekeluargaan.mean_gambaran)} poin) dengan selisih harapan cuma ${plus(b.Kekeluargaan.gap)} poin, jadi ini modal yang sudah jalan. Jawaban esai menguatkannya: saling menutup jam mengajar rekan yang berhalangan disebut berulang sebagai kebiasaan sehari-hari.`,
      mengapa_perspektif: "Kebiasaan saling menutup adalah kekuatan sekaligus risiko. Kalau dipakai terus untuk menambal jadwal yang berubah mendadak, yang tersisa adalah kelelahan yang tidak pernah tercatat sebagai masalah organisasi.",
      dasar_teori: "Modal sosial organisasi (Nahapiet & Ghoshal): kepercayaan antaranggota mempercepat kerja, tapi terkuras kalau terus dipakai menutup kegagalan sistem.",
      manfaat: {
        tim: "Bantuan antarrekan tetap terasa sukarela, bukan kewajiban tak tertulis.",
        pimpinan: "Kelelahan yang selama ini tertutup gotong royong jadi terlihat lebih awal.",
        sekolah: "Kekuatan budaya ini bertahan lintas pergantian orang, bukan bergantung pada beberapa guru senior.",
      },
      konkret: [
        { aksi: "Catat setiap penggantian jam mengajar dadakan selama satu bulan, siapa yang menutup dan berapa kali.", waktu: "Bulan ini", kenapa: "Beban yang jatuh berulang ke orang yang sama biasanya baru terlihat setelah dihitung." },
        { aksi: "Batasi jumlah penggantian dadakan per guru per bulan, sisanya jadi tanggung jawab jadwal.", waktu: "3 bulan", kenapa: "Batas yang jelas memindahkan masalah ke tempat yang benar, yaitu perencanaan jadwal." },
        { aksi: "Sebut nama guru yang membantu di forum unit, bukan cuma di grup pesan.", waktu: "Minggu ini", kenapa: "Pengakuan yang terlihat menjaga kebiasaan ini tetap hidup tanpa perlu insentif baru." },
      ],
      indikator_keberhasilan: [
        { title: "Sebaran penggantian jam", detail: "Berapa guru berbeda yang menutup jam kosong, dibanding jumlah penggantian total." },
        { title: "Penggantian dadakan per bulan", detail: "Tren jumlah penggantian dadakan setelah jadwal dipetakan lebih awal." },
      ],
      hal_diwaspadai: [
        "Kalau penggantian dadakan dibatasi tanpa memperbaiki perencanaan jadwal, kelas yang kosong justru bertambah.",
      ],
    },
    {
      fokus: "budaya", dimensi: "Orientasi", type: "pertahankan", term: "short", icon: "🎯",
      title: "Pertahankan arah capaian yang sudah selaras dengan harapan Tim",
      teaser: `Orientasi capaian dirasakan ${n1(b.Orientasi.mean_gambaran)} poin, praktis sama dengan harapan Tim (${n1(b.Orientasi.mean_harapan)}).`,
      mengapa_data: `Selisih Orientasi cuma ${plus(b.Orientasi.gap)} poin, paling kecil di antara empat tipe. Tim tidak meminta target dikurangi maupun ditambah, jadi tugas periode ini menjaga, bukan mengubah.`,
      mengapa_perspektif: "Dimensi yang sudah selaras paling sering luput dari perhatian karena tidak menimbulkan keluhan. Padahal keselarasan itu yang membuat perbaikan di dimensi lain punya pijakan.",
      dasar_teori: "Goal-setting theory (Locke & Latham): target yang disepakati dan terukur menaikkan kinerja, sepanjang orang yang menjalankan ikut menentukannya.",
      manfaat: {
        tim: "Ukuran keberhasilan tetap jelas dan tidak berubah di tengah semester.",
        pimpinan: "Ada satu dimensi stabil yang bisa dipakai sebagai pembanding saat menilai perubahan di dimensi lain.",
        sekolah: "Fokus akademik terjaga sementara perbaikan budaya berjalan.",
      },
      konkret: [
        { aksi: "Umumkan ulang ukuran keberhasilan tiap unit di awal semester, tanpa menambah indikator baru.", waktu: "Bulan ini", kenapa: "Keselarasan bertahan kalau ukurannya diingatkan, bukan diasumsikan sudah dipahami." },
        { aksi: "Tinjau capaian tiap unit satu kali di tengah semester, bukan cuma di akhir.", waktu: "3 bulan", kenapa: "Tinjauan di tengah masih menyisakan waktu untuk memperbaiki, tinjauan akhir cuma mencatat." },
        { aksi: "Sertakan alasan di balik setiap target yang diumumkan.", waktu: "Bulan ini", kenapa: "Target yang jelas alasannya lebih mungkin dijalankan tanpa pengawasan tambahan." },
      ],
      indikator_keberhasilan: [
        { title: "Kesamaan pemahaman target", detail: "Berapa persen staf yang bisa menyebut ukuran keberhasilan unitnya saat ditanya di tengah semester." },
      ],
      hal_diwaspadai: [
        "Kalau target ditambah dengan alasan hasil survei sudah baik, keselarasan yang sekarang ada bisa hilang dalam satu periode.",
      ],
    },
    {
      fokus: "kesejahteraan", dimensi: "work_life_balance", type: "perlu_perhatian", term: "short", icon: "⚖️",
      title: "Kembalikan batas jam kerja yang sekarang terbawa sampai rumah",
      teaser: `Work-Life Balance jadi subdimensi kesejahteraan terendah, ${n1(k.work_life_balance.nilai)} poin.`,
      mengapa_data: `Work-Life Balance ${n1(k.work_life_balance.nilai)} poin, terendah dari lima subdimensi dan jauh di bawah Kenyamanan Bekerja (${n1(k.kenyamanan_bekerja.nilai)}). Butir yang paling menekan adalah waktu istirahat yang habis dikejar pekerjaan, dan jawaban esai menyebut koreksi serta laporan yang dibawa pulang hampir tiap malam.`,
      mengapa_perspektif: "Staf yang merasa nyaman dengan rekan kerjanya sering bertahan jauh lebih lama sebelum mengeluh soal beban. Angka kenyamanan yang tinggi bersamaan dengan keseimbangan yang rendah biasanya menandakan kelelahan yang ditanggung diam-diam.",
      dasar_teori: "Effort-Recovery Model (Meijman & Mulder): pemulihan hanya terjadi kalau tuntutan kerja benar-benar berhenti untuk periode tertentu, bukan sekadar berkurang.",
      manfaat: {
        tim: "Ada jam yang bisa benar-benar dipakai untuk berhenti, tanpa rasa bersalah.",
        pimpinan: "Risiko kelelahan kerja terbaca sebelum berubah jadi pengunduran diri.",
        sekolah: "Kualitas mengajar terjaga karena pemulihan guru tidak lagi bergantung pada libur panjang.",
      },
      konkret: [
        { aksi: "Sepakati jam malam tanpa pesan pekerjaan di semua grup unit, dimulai dari pimpinan.", waktu: "Minggu ini", kenapa: "Batas yang dilanggar pimpinan tidak akan pernah dianggap berlaku oleh staf." },
        { aksi: "Sediakan dua slot koreksi di jam sekolah per pekan untuk guru kelas.", waktu: "Bulan ini", kenapa: "Koreksi terbawa pulang karena tidak punya tempat di jadwal, bukan karena jumlahnya mustahil." },
        { aksi: "Hitung ulang beban tugas tambahan per guru, ratakan yang menumpuk di orang yang sama.", waktu: "3 bulan", kenapa: "Jawaban esai berulang kali menyebut tugas tambahan jatuh ke orang yang itu-itu saja." },
      ],
      indikator_keberhasilan: [
        { title: "Pesan kerja di luar jam", detail: "Jumlah pesan pekerjaan yang dikirim setelah jam yang disepakati, dipantau per unit." },
        { title: "Skor Work-Life Balance", detail: "Nilai subdimensi ini di periode asesmen berikutnya, dibanding angka sekarang." },
        { title: "Sebaran tugas tambahan", detail: "Berapa guru memegang lebih dari dua tugas tambahan sekaligus." },
      ],
      hal_diwaspadai: [
        "Kalau jam malam disepakati tapi tenggat tetap tidak berubah, staf cuma memindahkan pekerjaannya ke subuh.",
        "Kalau slot koreksi diambil dari jam istirahat, angka keseimbangan tidak akan bergerak sama sekali.",
      ],
    },
    {
      fokus: "kesejahteraan", dimensi: "pengembangan_diri", type: "perlu_perhatian", term: "long", icon: "📚",
      title: "Ratakan kesempatan belajar dan perjelas jenjangnya",
      teaser: `Pengembangan Diri ${n1(k.pengembangan_diri.nilai)} poin, dengan butir jalur karier sebagai yang terendah.`,
      mengapa_data: `Pengembangan Diri berada di ${n1(k.pengembangan_diri.nilai)} poin, dan butir tentang kejelasan jalur karier jadi yang paling rendah di dalamnya. Permintaan agar pelatihan tidak bergilir ke orang yang sama muncul berulang di jawaban esai.`,
      mengapa_perspektif: "Guru jarang meminta pelatihan mahal. Yang lebih sering diminta adalah kepastian bahwa kesempatan itu ada gilirannya, dan bahwa usaha berkembang punya arah yang jelas.",
      dasar_teori: "Self-Determination Theory: kebutuhan akan kompetensi dan pertumbuhan adalah pendorong motivasi bertahan yang bekerja terpisah dari kompensasi.",
      manfaat: {
        tim: "Kesempatan belajar terasa bisa diakses, bukan bergantung kedekatan dengan pimpinan.",
        pimpinan: "Rencana pengembangan staf punya dasar, bukan menjawab permintaan satu per satu.",
        sekolah: "Kaderisasi berjalan tanpa perlu rekrutmen mendadak saat ada yang keluar.",
      },
      konkret: [
        { aksi: "Buat daftar terbuka siapa yang sudah dan belum ikut pelatihan dua tahun terakhir.", waktu: "Bulan ini", kenapa: "Ketimpangan giliran biasanya tidak disengaja dan baru terlihat setelah didaftar." },
        { aksi: "Tetapkan kuota minimal satu kesempatan belajar per guru per tahun, termasuk pelatihan internal.", waktu: "3 bulan", kenapa: "Kuota membuat pemerataan jadi kewajiban perencanaan, bukan kebaikan hati." },
        { aksi: "Tuliskan tahapan peran yang mungkin ditempuh guru dan tenaga kependidikan di lembaga ini.", waktu: "3 bulan", kenapa: "Jenjang karier yang tidak pernah ditulis akan selalu terbaca sebagai tidak ada." },
      ],
      indikator_keberhasilan: [
        { title: "Cakupan pelatihan", detail: "Persentase staf yang mengikuti minimal satu kegiatan pengembangan dalam setahun." },
        { title: "Kejelasan jenjang", detail: "Berapa staf yang bisa menyebutkan tahapan peran berikutnya saat ditanya." },
      ],
      hal_diwaspadai: [
        "Kalau jenjang karier ditulis tapi tidak pernah dipakai saat mengisi posisi kosong, kepercayaan yang hilang lebih besar daripada sebelum ditulis.",
      ],
    },
    {
      fokus: "kesejahteraan", dimensi: "kepuasan_kepemimpinan", type: "perlu_perhatian", term: "short", icon: "🗣️",
      title: "Jelaskan alasan di balik keputusan, bukan cuma hasilnya",
      teaser: `Kepuasan pada Kepemimpinan ${n1(k.kepuasan_kepemimpinan.nilai)} poin, ditekan butir keterbukaan informasi.`,
      mengapa_data: `Kepuasan pada Kepemimpinan berada di ${n1(k.kepuasan_kepemimpinan.nilai)} poin, dengan butir keterbukaan informasi sebagai yang terendah dari tiga butirnya. Jawaban esai menyebut pengumuman kegiatan yang datang mendadak dan keputusan yang tidak jelas dasarnya.`,
      mengapa_perspektif: "Staf yang tidak tahu alasan sebuah keputusan akan mengisi kekosongan itu dengan dugaan sendiri. Menjelaskan alasan biasanya lebih murah daripada memperbaiki dugaan yang sudah menyebar.",
      dasar_teori: "Keadilan prosedural (Colquitt): persepsi keadilan lebih ditentukan oleh transparansi proses pengambilan keputusan daripada oleh hasil keputusannya sendiri.",
      manfaat: {
        tim: "Keputusan lebih mudah diterima meski tidak semuanya menyenangkan.",
        pimpinan: "Waktu yang habis menjawab pertanyaan susulan berkurang.",
        sekolah: "Perubahan kebijakan berjalan lebih cepat karena tidak tertahan resistensi diam.",
      },
      konkret: [
        { aksi: "Sertakan tiga kalimat alasan pada setiap pengumuman kebijakan baru.", waktu: "Minggu ini", kenapa: "Alasan yang menempel di pengumuman menutup jarak sebelum dugaan sempat terbentuk." },
        { aksi: "Umumkan kalender kegiatan minimal satu bulan sebelumnya, dengan batas waktu penambahan.", waktu: "Bulan ini", kenapa: "Keluhan mendadak paling sering soal jadwal, bukan soal isi kebijakannya." },
        { aksi: "Sediakan forum singkat per unit tiap bulan yang agendanya dibuka dari staf.", waktu: "3 bulan", kenapa: "Forum yang agendanya ditentukan pimpinan tidak akan pernah memunculkan keluhan yang sebenarnya." },
      ],
      indikator_keberhasilan: [
        { title: "Jarak pengumuman", detail: "Rata-rata berapa hari sebelum pelaksanaan sebuah kegiatan diumumkan." },
        { title: "Partisipasi forum unit", detail: "Berapa staf berbeda yang menyampaikan hal di forum bulanan." },
      ],
      hal_diwaspadai: [
        "Kalau forum dibuka tapi masukan yang masuk tidak pernah ditindaklanjuti, kepuasan bisa turun lebih jauh daripada sebelum ada forum.",
      ],
    },
    {
      fokus: "kesejahteraan", dimensi: "ekspektasi", type: "pertahankan", term: "long", icon: "🌤️",
      title: "Jaga kesesuaian antara yang dijanjikan dan yang dijalani",
      teaser: `Ekspektasi Terpenuhi ${n1(k.ekspektasi.nilai)} poin, ditopang butir harapan awal yang terpenuhi.`,
      mengapa_data: `Ekspektasi Terpenuhi berada di ${n1(k.ekspektasi.nilai)} poin. Butir harapan awal bekerja jadi yang tertinggi, sementara butir penghargaan yang sepadan tertinggal di bawahnya.`,
      mengapa_perspektif: "Kesesuaian antara janji saat rekrutmen dan kenyataan kerja adalah salah satu penentu terkuat orang bertahan. Yang menggerusnya biasanya bukan satu peristiwa besar, tapi penambahan tugas yang tidak pernah dibicarakan ulang.",
      dasar_teori: "Psychological contract (Rousseau): pelanggaran kesepakatan tak tertulis antara staf dan lembaga menurunkan komitmen lebih cepat daripada ketidakpuasan pada gaji.",
      manfaat: {
        tim: "Perubahan peran dibicarakan, bukan diberitahukan setelah berjalan.",
        pimpinan: "Alasan sebenarnya orang bertahan atau keluar jadi terbaca lebih awal.",
        sekolah: "Perputaran staf tetap rendah tanpa perlu menaikkan biaya.",
      },
      konkret: [
        { aksi: "Tinjau ulang uraian tugas yang sudah berubah di lapangan tapi belum diperbarui di dokumen.", waktu: "Bulan ini", kenapa: "Jarak antara dokumen dan kenyataan adalah tempat kekecewaan tumbuh diam-diam." },
        { aksi: "Bicarakan penambahan tugas tambahan sebelum ditetapkan, bukan lewat pengumuman.", waktu: "Bulan ini", kenapa: "Tugas yang disepakati ditanggung berbeda dengan tugas yang diterima." },
        { aksi: "Adakan percakapan singkat setahun sekali soal harapan staf pada perannya.", waktu: "3 bulan", kenapa: "Harapan yang tidak pernah ditanyakan cuma terdengar saat orangnya sudah memutuskan pergi." },
      ],
      indikator_keberhasilan: [
        { title: "Kesesuaian uraian tugas", detail: "Berapa uraian tugas yang diperbarui agar cocok dengan pekerjaan sebenarnya." },
        { title: "Perputaran staf", detail: "Jumlah staf yang keluar per tahun dibanding periode sebelumnya." },
      ],
      hal_diwaspadai: [
        "Kalau percakapan harapan dilakukan tapi tidak ada satu pun yang ditindaklanjuti, staf akan berhenti menjawab jujur di periode berikutnya.",
      ],
    },
    {
      fokus: "kesejahteraan", dimensi: "kenyamanan_bekerja", type: "pertahankan", term: "long", icon: "🫱",
      title: "Rawat kenyamanan kerja sebagai modal paling kuat lembaga ini",
      teaser: `Kenyamanan Bekerja ${n1(k.kenyamanan_bekerja.nilai)} poin, tertinggi dari lima subdimensi.`,
      mengapa_data: `Kenyamanan Bekerja ${n1(k.kenyamanan_bekerja.nilai)} poin, tertinggi dari lima subdimensi dan terpaut jauh dari Work-Life Balance (${n1(k.work_life_balance.nilai)}). Alasan bertahan yang paling sering disebut di esai adalah rekan kerja yang mudah diajak berdiskusi dan saling menutup saat berhalangan.`,
      mengapa_perspektif: "Kenyamanan yang tinggi bisa menutupi masalah lain cukup lama. Merawatnya berarti memastikan ia tidak jadi satu-satunya alasan orang bertahan.",
      dasar_teori: "Job Embeddedness (Mitchell): keterikatan pada rekan kerja adalah penahan terkuat keputusan pindah kerja, sering melampaui faktor kompensasi.",
      manfaat: {
        tim: "Suasana yang sekarang jadi alasan bertahan tidak terkikis oleh pergantian orang.",
        pimpinan: "Staf baru lebih cepat menyatu, bukan bertahan sendirian di bulan pertama.",
        sekolah: "Reputasi sebagai tempat kerja yang baik jadi aset rekrutmen.",
      },
      konkret: [
        { aksi: "Tetapkan pendamping resmi untuk setiap staf baru selama tiga bulan pertama.", waktu: "Bulan ini", kenapa: "Kebiasaan menemani guru baru sudah ada, tinggal dipastikan tidak bergantung inisiatif orang per orang." },
        { aksi: "Jadwalkan satu pertemuan lintas unit per semester dengan agenda berbagi praktik.", waktu: "3 bulan", kenapa: "Kenyamanan sekarang kuat di dalam unit, tapi belum menyeberang antarjenjang." },
        { aksi: "Tanyakan pengalaman tiga bulan pertama ke setiap staf baru dan catat hasilnya.", waktu: "3 bulan", kenapa: "Titik lemah penyambutan paling jelas terlihat dari orang yang baru saja melewatinya." },
      ],
      indikator_keberhasilan: [
        { title: "Pendampingan staf baru", detail: "Persentase staf baru yang punya pendamping resmi dan bertemu rutin." },
        { title: "Interaksi lintas unit", detail: "Berapa kegiatan yang melibatkan lebih dari satu unit per semester." },
      ],
      hal_diwaspadai: [
        "Kalau pendampingan dijadikan tugas tambahan tanpa pengurangan beban lain, guru senior yang selama ini sukarela justru berhenti melakukannya.",
      ],
    },
  ];
}

/** Briefing agregat: satu paragraf gambaran + catatan internal untuk reviewer. */
export function buildBriefing(agg) {
  const b = Object.fromEntries(agg.budaya.map((x) => [x.tipe, x]));
  const k = Object.fromEntries(agg.kesejahteraan.map((x) => [x.kode, x]));
  return {
    gambaran: `Budaya kerja Yayasan Pendidikan Sekolah Fammi periode ini paling terasa di sisi Kekeluargaan (${n1(b.Kekeluargaan.mean_gambaran)} poin), dan Tim tidak meminta itu berubah banyak. Yang paling jauh dari harapan adalah ruang mencoba hal baru: Inovasi dirasakan ${n1(b.Inovasi.mean_gambaran)} poin sementara harapannya ${n1(b.Inovasi.mean_harapan)} poin, selisih ${plus(b.Inovasi.gap)} poin dan yang terbesar dari empat tipe. Di sisi lain Aturan justru dirasa berlebih, harapannya ${n1(Math.abs(b.Aturan.gap))} poin di bawah kondisi sekarang. Dari sisi kesejahteraan, Kenyamanan Bekerja jadi modal terkuat (${n1(k.kenyamanan_bekerja.nilai)} poin) sementara Work-Life Balance paling tertekan (${n1(k.work_life_balance.nilai)} poin), sejalan dengan jawaban esai yang berulang menyebut koreksi dan laporan yang terbawa sampai rumah.`,
    catatan_internal: `Data demo ${agg.jumlah} responden dari enam unit. Perbedaan antarunit cukup tajam: TK dan SD condong Kekeluargaan dengan kesejahteraan di atas rata-rata, SMP dan SMA condong Aturan/Orientasi dengan Work-Life Balance paling rendah. Kalau dipakai untuk demo, mulai dari section 01 (Budaya Kerja) lalu 02 (Kesejahteraan Tim) supaya alur ceritanya nyambung.`,
  };
}
