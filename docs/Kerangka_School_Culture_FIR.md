# Kerangka School Culture Berbasis Keilmuan FIR

Dokumen ini menjelaskan cara modul School Culture (SC) mengubah data budaya kerja dan kesejahteraan staf sekolah menjadi tindak lanjut yang berbobot secara keilmuan organisasi, sekaligus mengemas ulang istilah akademik OCAI supaya terasa manusiawi untuk pimpinan sekolah dan staf, bukan jargon riset. Ini padanan langsung `docs/Kerangka_Tindak_Lanjut_Keilmuan_FIR.md` (Karakter), untuk modul yang datanya tentang staf, bukan murid.

Catatan kejujuran di awal, sama seperti dokumen Karakter. Saya merujuk kerangka keilmuan yang sudah mapan dan saya sebutkan dengan nama aslinya. Saya tidak mengarang statistik, kutipan, atau temuan studi tertentu. Substansi intervensi yang nyata tetap harus divalidasi tim Fammi. Dokumen ini merancang logika dan istilahnya, bukan menggantikan penilaian ahli.

## 1. Kenapa istilah OCAI dikemas ulang

Data mentah School Culture memakai kerangka OCAI (Organizational Culture Assessment Instrument, Cameron & Quinn): empat tipe budaya Klan, Adhokrasi, Pasar, Hierarki, dinilai lewat "kondisi sekarang" versus "harapan", diringkas jadi T-score. Ini kerangka akademik yang sahih, tapi istilahnya asing bagi kepala sekolah atau guru yang tidak pernah belajar teori organisasi. Menampilkan "skor Adhokrasi Anda 42, T-score 55" ke seorang guru tidak menyampaikan apa-apa yang bisa langsung dipakai.

FIR sudah mengemas ulang keempat tipe itu dengan label yang diambil persis dari bahasa yang dipakai sekolah sendiri saat menyusun data (lihat `scMeta.js`), bukan istilah akademik:

| Istilah OCAI (akademik, backstage saja) | Istilah produk FIR (tampil ke pengguna) | Makna ringkas |
|---|---|---|
| Klan | **Kekeluargaan** | Hangat, kolaboratif, pimpinan sebagai pembimbing |
| Adhokrasi | **Inovasi** | Terbuka mencoba metode/ide baru, berani bereksperimen |
| Pasar | **Orientasi** | Berorientasi target dan hasil terukur |
| Hierarki | **Aturan** | Tertib, prosedural, taat proses |

Aturan mengikat: istilah "OCAI", "Klan", "Adhokrasi", "Pasar", "Hierarki", "T-score", dan "kerangka nilai bersaing" TIDAK PERNAH muncul di field mana pun yang dibaca staf atau pimpinan sekolah (title, teaser, narasi, manfaat, konkret, hook). Istilah akademik hanya boleh muncul di `dasar_teori`, field yang khusus untuk pertanggungjawaban keilmuan ke tim internal Fammi -- pola persis sama dengan bagaimana Karakter menyimpan "Erikson"/"Vygotsky"/"CASEL" di `dasar_teori` saja, bukan di kalimat yang dibaca guru dan orang tua.

## 2. Lima kerangka keilmuan yang mengikat tiap tindak lanjut

Beda dari Karakter (yang berpijak pada psikologi perkembangan anak), SC berpijak pada psikologi organisasi dan psikologi kerja, karena subjeknya adalah orang dewasa yang bekerja, bukan anak yang berkembang.

### Kerangka 1, Nilai Bersaing (Cameron & Quinn)

Dasar dari radar budaya Kekeluargaan/Inovasi/Orientasi/Aturan itu sendiri. Prinsip intinya, tidak ada satu budaya yang "paling benar" untuk semua organisasi -- yang berguna dibaca adalah selisih antara kondisi yang staf rasakan sekarang dan yang mereka harapkan, bukan tinggi-rendahnya satu sumbu berdiri sendiri. Implikasinya, tindak lanjut budaya tidak boleh berbunyi "budaya Aturan sekolah ini buruk", tapi "staf berharap prosedur lebih ringkas dari kondisi sekarang".

### Kerangka 2, Model Tuntutan-Sumber Daya Kerja (Bakker & Demerouti)

Dipakai untuk menafsirkan beban kerja dan keseimbangan kerja-hidup. Inti modelnya, kelelahan kerja muncul ketika tuntutan pekerjaan (beban, tekanan waktu, tanggung jawab) lebih besar dari sumber daya yang tersedia untuk menghadapinya (dukungan rekan, kendali atas pekerjaan, waktu istirahat yang cukup). Implikasinya, tindak lanjut untuk keseimbangan kerja-hidup yang rendah harus menyasar SALAH SATU dari dua sisi itu: mengurangi tuntutan, atau menambah sumber daya -- bukan sekadar "kurangi beban kerja" tanpa arah konkret.

### Kerangka 3, Teori Dua Faktor (Herzberg)

Dipakai untuk kepuasan pada kepemimpinan dan pengembangan diri. Inti teorinya, faktor kebersihan (gaji, kebijakan, kondisi kerja dasar) hanya mencegah ketidakpuasan kalau terpenuhi, tapi tidak menaikkan motivasi lebih jauh; yang benar-benar mendorong motivasi adalah faktor pendorong seperti pengakuan, kesempatan berkembang, dan tanggung jawab yang bermakna. Implikasinya, kalau skor pengembangan diri rendah, tindak lanjutnya bukan menaikkan fasilitas dasar, tapi membuka jalur pengakuan dan pengembangan yang nyata.

### Kerangka 4, Dimensi Kelelahan Kerja (Maslach)

Dipakai untuk menafsirkan indeks kesejahteraan secara keseluruhan. Tiga tanda kelelahan kerja yang saling memperkuat: kelelahan emosional, sinisme terhadap pekerjaan, dan menurunnya rasa mampu menyelesaikan tugas. Implikasinya, indeks kesejahteraan yang rendah dan konsisten di banyak subdimensi sekaligus adalah sinyal yang lebih serius daripada satu subdimensi rendah berdiri sendiri, dan layak jadi prioritas tinggi.

### Kerangka 5, Perubahan Bertahap (Kotter / Lewin)

Dipakai untuk merumuskan LANGKAH pada prioritas perbaikan. Perubahan budaya organisasi yang dipaksakan sekaligus biasanya gagal atau cuma bertahan sesaat. Pendekatan yang bertahan dimulai dari kemenangan kecil yang benar-benar terlihat, baru diperkuat jadi kebiasaan tetap sebelum melangkah ke perubahan yang lebih besar. Implikasinya, `konkret` di tiap tindak lanjut SC harus dimulai dari langkah kecil yang hasilnya kelihatan dalam hitungan minggu, sama semangatnya dengan "kemenangan cepat" di Karakter, cuma skalanya organisasi bukan satu anak.

## 3. Sudut pandang per peran

Karakter membedakan wali_kelas/kepala_sekolah/yayasan berdasar kewenangan atas satu kelas, satu sekolah, atau lintas sekolah. SC memakai pembagian serupa, tapi subjeknya kebijakan budaya kerja, bukan pengelolaan kelas:

**karyawan** (individu): staf sekolah sendiri, laporannya bersifat pribadi dan reflektif, bukan keputusan organisasi. Rencana aksi di laporan individu adalah langkah yang bisa dijalankan staf itu sendiri tanpa menunggu kebijakan pimpinan.

**manajemen** dan **kepala_sekolah**: kewenangan atas kebijakan operasional satu sekolah -- jadwal, briefing staf, komunikasi internal. Rekomendasi harus sesuatu yang bisa diputuskan dan dijalankan di level itu, bukan butuh anggaran besar atau persetujuan yayasan.

**yayasan**: kewenangan lintas sekolah -- kebijakan besar, alokasi anggaran, pelatihan staf lintas sekolah. Rekomendasi harus berbasis pola agregat (lebih dari satu sekolah, atau jelas berskala yayasan), bukan temuan satu sekolah saja.

## 4. Anatomi tindak lanjut, lima lapis (padanan Karakter)

Sama seperti Karakter, kecerdasan mesin ini bukan kemampuan mengarang saran, tapi lima lapis kerja yang aman:

1. **Deteksi pola** -- data budaya (gap 4 tipe), profil organisasi (6 dimensi), dan kesejahteraan (5 subdimensi) yang sudah final dari pipeline hulu, dibaca lewat aturan deterministik (mana yang paling lemah, paling kuat, gap terbesar).
2. **Interpretasi kontekstual** -- sinyal dimaknai lewat lima kerangka di Bagian 2, dengan istilah produk (Bagian 1), bukan istilah OCAI mentah.
3. **Prioritisasi berdasarkan urgensi** -- indeks kesejahteraan rendah yang konsisten di banyak subdimensi (Kerangka 4, Maslach) naik prioritas tinggi.
4. **Penerjemahan menjadi aksi** -- dirumuskan Gemini (`_shared/geminiPromptSc.ts`), berpijak pada Kerangka 5 (Kotter/Lewin) untuk urutan langkahnya.
5. **Gerbang etis** -- AdminFammi meninjau tiap draf sebelum tayang, persis pola Karakter/MI. Tidak ada baris `tindak_lanjut`/`briefing`/`sc_hasil` yang tayang tanpa lewat status `menunggu_persetujuan` lebih dulu.

## 5. Contoh dangkal versus berbobot

Versi dangkal (dihindari): "Budaya Adhokrasi sekolah ini rendah, tingkatkan inovasi."

Versi berbobot: "Staf sekolah berharap ruang mencoba metode mengajar baru lebih terbuka dari kondisi sekarang -- gap Inovasi jadi yang terbesar dari empat tipe budaya periode ini. Alokasikan satu hari per bulan khusus uji coba metode/media ajar baru, mulai dari satu jenjang dulu supaya beban tidak melebar sekaligus ke semua guru."

Versi berbobot tidak menyebut "Adhokrasi", menyebut asal datanya (gap terbesar periode ini), dan langkah pertamanya kecil dan bisa dimulai segera (Kerangka 5).

## 6. Tata kelola dan etika

Data ini tentang orang dewasa yang bekerja, bukan anak, tapi tetap sensitif: jawaban individu (termasuk esai bebas) tidak pernah dikirim ke Gemini dengan identitas yang bisa dilacak balik ke nama tertentu di luar konteks laporan pribadi orang itu sendiri, dan laporan agregat untuk pimpinan tidak pernah menyebut nama staf tertentu. Nomor WhatsApp dan email staf (`sc_personal.no_whatsapp`/`email`) tidak pernah dibaca lewat jalur yang dipakai Gemini maupun ditampilkan ke pimpinan sekolah lain.

Substansi rekomendasi dimiliki tim Fammi, bukan AI. Gerbang persetujuan manusia bersifat wajib untuk baris agregat (`tindak_lanjut`/`briefing`, modul `sc`) maupun individu (`sc_hasil`). Tidak ada angka yang dikarang untuk membuat tindak lanjut tampak lebih meyakinkan -- semua angka datang dari kolom yang sudah final di `sc_personal`/`sc_lembaga`.

## 7. Parameter terbuka, belum boleh dikunci

Tiga hal berikut butuh konfirmasi pemilik produk sebelum dianggap final, sesuai instruksi CLAUDE.md untuk menunggu konfirmasi cutoff/ambang sebelum dikunci:

1. **Kategori kualitatif di level individu.** Sheet `Personal` (data mentah per staf) tidak menyertakan kolom predikat/kategori untuk `nilai_karakter_lembaga` sampai `work_life_balance` -- beda dari sheet `Lembaga` (agregat sekolah) yang menyertakan predikat untuk semuanya. Sampai ambang persen-ke-kategori dikonfirmasi, kategori level individu untuk profil organisasi dan kesejahteraan dibiarkan `null` (lihat `scImporter.js`), bukan ditebak.
2. **Indeks kesejahteraan komposit level individu.** Data mentah tidak punya satu angka "indeks kesejahteraan" gabungan untuk staf perorangan (cuma 5 subdimensi terpisah). `generate-sc-individu` menghitungnya sebagai rata-rata sederhana dari kelima subdimensi (agregasi tampilan, bukan interpretasi baru), tapi kategorinya sengaja dibiarkan `null` dengan alasan yang sama seperti poin 1.
3. **Perbandingan antarunit di laporan agregat.** Sheet `Lembaga` contoh yang dipakai membangun modul ini cuma berisi satu baris (agregat seluruh sekolah), tidak ada baris per unit kerja. `sc_lembaga` sudah punya kolom `unit` (nullable) supaya pipeline hulu bisa mulai mengekspor satu baris per unit di masa depan, tapi sampai itu terjadi, FIR TIDAK menghitung sendiri rata-rata per unit dari baris `sc_personal` (itu akan melanggar prinsip "FIR tidak menghitung apa pun").

Selama tiga hal ini terbuka, mesin tindak lanjut SC boleh dirancang dan dijalankan, tapi bagian yang bersinggungan dengannya (kategori individu, indeks individu, perbandingan antarunit) belum boleh dianggap final.

## 8. Rujukan keilmuan

- Kerangka Nilai Bersaing (Competing Values Framework), Kim Cameron dan Robert Quinn, dasar instrumen OCAI.
- Model Tuntutan-Sumber Daya Kerja (Job Demands-Resources Model), Arnold Bakker dan Evangelia Demerouti.
- Teori Dua Faktor, Frederick Herzberg.
- Dimensi kelelahan kerja (burnout), Christina Maslach.
- Model perubahan organisasi delapan langkah, John Kotter; model tiga tahap (unfreeze-change-refreeze), Kurt Lewin.

Untuk publikasi resmi, tim Fammi sebaiknya menambahkan kutipan lengkap dan, bila perlu, sumber lokal Indonesia yang relevan dengan konteks sekolah sebagai tempat kerja.
