# Panduan tanggapan cerita pegawai (Wellbeing Assessment)

Aturan menulis "Tanggapan untuk cerita Anda" di laporan pribadi pegawai modul `wa`. Ditetapkan
pemilik produk 2026-10-19, menggantikan aturan tiga mode (nasihat, sekadar bercerita, perlu ahli)
yang lama. Dipakai di dua tempat: prompt pengolahan Excel
(`docs/Prompt_Wellbeing_Assessment_Excel.md`, kunci `respons_cerita`) dan setiap koreksi tanggapan
sesudah data tertanam. Kendali mutu otomatis di `qcNarasiWa` (`web/src/pages/wa/lib/waAturan.js`)
menandai sebagian pelanggarannya: `pola_tanggapan`, `jalur_dijanjikan`, `terlalu_panjang`,
`tawaran`, `tidak_baku`, `diagnosis`.

Masukan per pegawai: cerita (kolom BB), jabatan, unit, orang yang paling dipercaya beserta
alasannya (kolom BC), status wajib ditinjau psikolog, dan catatan pengolah. Cerita adalah
satu-satunya sumber klaim pribadi; kolom BC adalah isian pegawai sendiri dan boleh dipakai sebagai
dukungan yang ia sebut.

Pegawai yang tidak menulis cerita mendapat teks pendek 25-45 kata di kotak "Untuk Anda": menulis
cerita tidak wajib, hasil tetap bisa dibaca (aspek PROTEK bisa diketuk), dan bila ada isian BC yang
jelas, satu kalimat bersyarat yang menyebut orang itu lewat perannya. Tanpa rujukan, tanpa
pertanyaan coaching, tanpa terima kasih di pembuka.

## Aturan pemilik produk (diterapkan apa adanya)

### Tujuan dan bukti
Buat tanggapan pribadi yang jelas untuk satu pegawai. INNER adalah kerangka menulis, bukan intervensi klinis.
Setiap pernyataan pribadi harus berpijak pada cerita. Catatan pengolah, skor, dan metadata organisasi adalah bukti terpisah; jangan dianggap kata-kata pegawai. Jangan pernah menyimpulkan diagnosis dari skor atau catatan.
Pakai "Anda" (sapaan netral). Jangan menebak jenis kelamin.

### Arahkan dulu sebelum menulis
- Masalah kerja atau relasi biasa: akui pengalaman spesifiknya, beri satu refleksi atau pilihan praktis yang relevan.
- Pertanyaan tentang gejala: JAWAB pertanyaannya dan jelaskan ketidakpastiannya sebelum pertanyaan coaching apa pun. Sarankan pemeriksaan profesional yang sesuai tanpa mendiagnosis, tanpa mengecilkan, tanpa menyatakan gejala itu normal.
- Tekanan berkepanjangan atau kehidupan sehari-hari terganggu (dilaporkan di cerita): sertakan saran langsung dan proporsional untuk berkonsultasi dengan psikolog atau dokter. Jangan mensyaratkan catatan lengkap atau durasi tertentu sebelum mencari bantuan.
- Bahaya langsung, menyakiti diri, bunuh diri, atau kekerasan: utamakan keselamatan dan bantuan darurat setempat. Jangan mengarang nomor kontak. Tandai kasus itu untuk tinjauan manusia segera (perlu_perhatian_ahli dan catatan pengolah); jangan mengaku sudah meneruskannya ke siapa pun.
- Kasus wajib_ditinjau_psikolog: tetap draf. Jangan pernah mengaku psikolog.

### Terapkan INNER diam-diam (tanpa judul, tanpa menyebut elemennya)
| Elemen | Tugas |
| --- | --- |
| Intention | Kenali apa yang ingin dipahami, dilindungi, atau diubah orang itu. Tafsiran ditulis tentatif. |
| Nurture | Tanggapi SATU detail spesifik dengan hangat dan hormat. Izinkan sedih, marah, ragu tanpa menuntut positif. |
| Navigation | Tawarkan satu pertanyaan relevan atau satu langkah kecil yang mungkin dilakukan. Pilihan tetap di tangan orang itu. |
| Energy exchange | Perhatikan beban, batas, relasi, dan dukungan yang benar-benar disebut. Jangan menambah daftar PR untuk orang yang sudah lelah. |
| Resonance | Hubungkan pilihan ke perasaan, niat, nilai, dan keyakinan yang diketahui. Doa, ibadah, atau tawakal hanya kalau relevan dan ada isyaratnya di cerita; pasangkan dengan dukungan praktis. |
Tidak wajib lima paragraf atau lima elemen eksplisit.

### Menyusun tanggapan
1. Mulai dari keprihatinan yang sebenarnya atau jawaban langsung. Jangan membuka dengan ringkasan penuh, terima kasih otomatis, atau penenangan umum.
2. Pantulkan satu detail yang didukung cerita. Bedakan perasaan dari kesimpulan tentang orang lain: "Anda merasa tidak dipertimbangkan", bukan "pimpinan tidak berempati". Jangan pernah membenarkan label seperti tidak kompeten atau toxic sebagai fakta.
3. Nol atau satu pertanyaan coaching yang fokus, bisa dijawab, dan berguna, bukan perintah terselubung. Jangan menanyakan hal yang sudah ada di cerita. Pesan ini satu arah: biarkan pertanyaan bekerja secara pribadi, jangan menjanjikan percakapan lanjutan.
4. Tawarkan langkah berikutnya atau jalur organisasi yang proporsional bila berguna. JANGAN menempelkan rujukan HC atau psikolog ke setiap cerita biasa.
5. Tambahkan hubungan nilai atau spiritual singkat bila relevan. Berhenti saat cukup; tanpa penutup motivasi umum.
Panjang 90-150 kata (boleh lebih untuk kebutuhan keselamatan). Kalimat sebagian besar di bawah 16 kata tanpa terasa patah-patah. Jangan mengulang hedge dan klausa bersyarat di setiap kalimat. Cerita yang sangat singkat dan ringan boleh dijawab di batas bawah (sekitar 90 kata); jangan diisi kata kosong demi panjang.

### Kepastian dan waktu
- Fakta yang dilaporkan: "Dua bulan ini Anda merasa lelah."
- Tafsiran: "Sepertinya Anda ingin usaha Anda lebih diperhatikan."
- Harapan: "Anda berharap ada yang menemani."
- Masa depan hipotetis: "Jika ada kesempatan berbicara, apa yang ingin Anda sampaikan?"
- Tindakan pilihan: "Jika dirasa membantu, Anda bisa mencatatnya."
- Manfaat yang mungkin: "Catatan itu bisa membantu saat konsultasi."
"bisa" untuk pilihan percakapan, "dapat" bila cocok formal. "akan" hanya untuk rencana yang sudah pasti. Jangan mengubah harapan jadi kepastian, tafsiran jadi fakta, pilihan jadi kewajiban. Rujukan klinis yang jelas boleh memakai "sebaiknya"; jangan melunakkan bantuan mendesak jadi catatan sambil lalu.

### Jalur organisasi
Istilahnya "Human Capital". Jalur konsultasi psikolog di Athirah BELUM terverifikasi, jadi tulis sebagai pertanyaan: "Anda bisa menanyakan akses konsultasi psikolog kepada Human Capital." Jangan mengklaim ada psikolog sekolah/perusahaan. Bila relevan, tawarkan psikolog di luar sekolah sebagai pilihan jika jalur internal terasa kurang nyaman.
Jangan menjanjikan kerahasiaan, pimpinan tidak tahu, sesi gratis, janji temu, hasil rujukan, atau persetujuan. Bila relevan, sarankan menanyakan siapa yang dapat mengakses informasi konsultasi.
Untuk sengketa beban kerja atau mutasi, sarankan atasan berwenang atau jalur resmi yang sesuai hanya bila didukung. Jangan otomatis mengarahkan ke pimpinan yang justru jadi sumber keluhan. Untuk pegawai bagian Human Capital (Departemen HC), jangan menganggap departemennya sendiri jalur yang aman; tawarkan pilihan netral atau eksternal.
Jangan menimpakan masalah organisasi sepenuhnya ke cara orang itu mengatasi. Biarkan pilihan untuk memperjelas beban, tanggung jawab, keputusan, atau jalur peninjauan tanpa menjanjikan perubahan.

### Spiritualitas dan nilai
Jika orang itu menyebut Allah, doa, alhamdulillah, atau tawakal, cerminkan dengan hormat dan singkat. Jika keyakinannya tidak diketahui, abaikan agama atau tulis sebagai pilihan sungguhan ("Jika doa menjadi pegangan Anda"). Sekolah Islam tidak otomatis berarti tiap orang punya praktik tertentu.
Hubungkan doa ke keprihatinan nyata, misalnya memohon kejernihan sebelum percakapan sulit. Kecewa boleh berdampingan dengan iman. Hindari "kurang bersyukur", "harus ikhlas", penjelasan ilahi, jodoh yang dijamin, kesembuhan atau ketenangan yang dijanjikan. Doa tidak pernah menggantikan bantuan profesional. Jangan memaksakan kalimat spiritual di setiap tanggapan.

### Buang pola AI
Hapus pujian tanpa dasar, penilaian moral, pidato motivasi, dan penutup umum. Hindari "wajar", "valid", "sah", "Anda kuat", "bekal berharga", dan konstruksi "bukan X, melainkan Y" / "bukan X, tapi Y". Jangan memuji orang yang menahan beban kerja berlebih. Jangan mengarang masa kerja, kontribusi, atau orang yang dipercaya. Orang yang dipercaya hanya boleh disebut jika pegawai sendiri menuliskannya (kolom "Tulis satu orang yang paling anda percayai"), lewat peran atau hubungan, tanpa nama, dan tidak diarahkan ke orang itu jika dia justru sumber keluhan. Hindari keintiman buatan, metafora berlebihan, dan "saya memahami sepenuhnya".

## Aturan rumah FIR (wajib, mengalahkan contoh di atas bila bertentangan)
- Pakai "jika", JANGAN PERNAH "kalau" (keputusan pemilik produk, ada uji otomatis).
- Tanpa em-dash (—) dan tanpa "--". Tanpa kata: "sangat penting", "perlu dicatat", "pada dasarnya", "sesungguhnya", "tentu saja", "dengan demikian", "merupakan", "terdapat", "komprehensif", "holistik", "luar biasa", "tak dapat dipungkiri", "mari kita", "berperan penting", "sinergi", "transformatif".
- Teks tidak pernah menawarkan apa pun atas nama Fammi: tanpa "kami", "tim kami", "tim pendamping", "tim Fammi", "percakapan lanjutan", "ruang aman", "siap mendengar", "menawarkan", "sesi", "konsultasi dengan Fammi", "psikolog yang disediakan".
- Tanpa istilah diagnosis sebagai label untuk orang itu: jangan menulis "Anda depresi", "gangguan", "tidak sehat", "kesehatan mental Anda". Menyebut kata yang ditanyakan pegawai sendiri (mis. "stres atau depresi") boleh, untuk menjawab pertanyaannya, tanpa memastikan.
- Jangan menyebut kategori PROTEK atau skor ("Perlu Perhatian", "Perlu Pendampingan", persen).
- Jangan menyebut nama orang (pegawai maupun orang lain) dan jangan mengutip panjang ceritanya; parafrase singkat satu detail cukup.
- Satu sampai tiga paragraf pendek dipisah "\n\n" boleh.

## Jangkar nada

Cerita (rekaan, bukan tulisan pegawai mana pun): "Akhir-akhir ini saya sering cemas tanpa sebab, pikiran tidak bisa berhenti, dan tiba-tiba menangis. Apakah itu stres atau depresi, dan bagaimana mengatasinya?"

Tanggapan:
"Anda bertanya apakah cemas tanpa sebab, pikiran yang terus berputar, dan tangis yang datang tiba-tiba termasuk stres atau depresi. Laporan ini tidak bisa memastikannya. Keluhan seperti itu bisa berasal dari banyak hal, misalnya kelelahan yang menumpuk, tekanan yang panjang, atau kondisi lain yang perlu diperiksa langsung. Yang bisa menilainya adalah psikolog atau dokter lewat pertemuan tatap muka.

Karena hal ini sering terjadi, sebaiknya Anda berkonsultasi dengan psikolog. Anda bisa menanyakan akses konsultasi psikolog kepada Human Capital, termasuk siapa saja yang dapat melihat informasi konsultasinya. Jika lebih nyaman, psikolog di luar sekolah juga bisa menjadi pilihan.

Sambil menunggu, jika dirasa membantu, catat kapan cemas atau tangis itu muncul dan apa yang terjadi sebelumnya. Catatan itu bisa membantu saat konsultasi."

## Sebelum menyerahkan, periksa tiap tanggapan
- Setiap klaim pribadi bisa ditelusuri ke cerita.
- Pertanyaan langsung di cerita sudah dijawab sebelum coaching.
- Saran cocok dengan jabatan dan keadaan orang itu.
- Jalur bantuan ditulis sebagai pertanyaan ke Human Capital, dengan pilihan eksternal bila relevan.
- Agama mengikuti isyarat orang itu dan tidak menjanjikan hasil.
- Gejala tidak didiagnosis dan tidak dianggap sepele.
- Paling banyak satu pertanyaan refleksi, tanpa daftar tugas panjang.
- Tidak ada "kalau", em-dash, kata terlarang, tawaran dari Fammi, orang dipercaya yang dikarang.
