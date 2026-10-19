# Prompt: hitung ulang KELOMPOK setelah koreksi unit (Wellbeing Assessment Athirah, 2026-10-19)

Dipakai sekali setelah Human Capital mengonfirmasi unit 26 pegawai yang di olahan pertama masuk
"Tidak teridentifikasi". Unit dan jenjang mereka sudah dipasang di berkas
`Athirah - Master - Olahan (3) - unit dikoreksi.xlsx` (sheet INDIVIDU dan TESTIMONI). Prompt ini
hanya menghitung ulang angka kelompok dan menulis ulang narasi kelompok yang terdampak. Narasi
pribadi dan tanggapan cerita TIDAK disentuh: versi yang tayang sudah dikoreksi di Supabase dan
tidak boleh tertimpa.

## Cara pakai

1. Buka claude.ai, percakapan baru, model yang sama dengan pengolahan pertama.
2. Lampirkan `Athirah - Master - Olahan (3) - unit dikoreksi.xlsx`.
3. Tempel prompt di bawah.
4. Kirim berkas hasilnya (`Athirah - Master - Olahan (4).xlsx`) ke tim pengembang FIR. Hanya sheet
   KELOMPOK, PILIHAN, dan kolom tema di TESTIMONI yang dipakai dari berkas itu.

## Prompt

```text
Saya melampirkan berkas olahan Wellbeing Assessment "Athirah - Master - Olahan (3) - unit dikoreksi.xlsx" (tujuh sheet: INDIVIDU, KELOMPOK, PILIHAN, TESTIMONI, ITEM, PARAMETER, CATATAN_QC). Berkas ini hasil pengolahan sebelumnya. Satu hal berubah: 26 pegawai yang dulu ber-unit_normal dan jenjang "Tidak teridentifikasi" sekarang sudah punya unit dan jenjang hasil konfirmasi Human Capital (lihat CATATAN_QC jenis unit_tak_terpetakan dan baris PARAMETER "koreksi_unit"). Kolom unit_normal dan jenjang di INDIVIDU dan TESTIMONI sudah diperbarui. Sheet KELOMPOK dan PILIHAN masih versi lama.

TUGAS: hitung ulang KELOMPOK dan PILIHAN, lalu tulis ulang narasi kelompok yang terdampak. Simpan sebagai "Athirah - Master - Olahan (4).xlsx".

ATURAN KERAS:
1. SEMUA ANGKA dihitung dengan kode Python (pandas, openpyxl) dari baris INDIVIDU dipakai = Ya, dengan rumus dan ambang yang SAMA PERSIS dengan pengolahan sebelumnya (lihat PARAMETER). Tidak ada angka yang diketik tangan.
2. JANGAN mengubah sheet INDIVIDU (termasuk kolom laporan_json, cerita_perlu_ahli, dan semua narasi pribadi), ITEM, PARAMETER, dan CATATAN_QC. Di TESTIMONI hanya kolom tema yang boleh berubah, dan hanya kalau perlu.
3. Kolom KELOMPOK dan PILIHAN tetap sama (nama, urutan, format). Jangan menambah atau menghapus kolom.
4. Kolom BB (cerita) dan CB (nomor WhatsApp) tetap rahasia: jangan dikutip, diparafrasekan, atau disebut di KELOMPOK, PILIHAN, maupun di chat.

LANGKAH 1, ANGKA.
- Hapus baris "Tidak teridentifikasi" untuk cakupan "unit" dan "jenjang" di KELOMPOK dan PILIHAN (sekarang tidak ada lagi pegawai di sana). Baris kelompok_jabatan "Tidak teridentifikasi" TETAP ada, karena kelompok jabatan tidak dikoreksi.
- Hitung ulang SEMUA baris KELOMPOK dan PILIHAN untuk cakupan "unit" dan "jenjang". Baris "lembaga" dan "kelompok_jabatan" seharusnya tidak berubah angkanya (anggotanya sama); hitung juga dan pastikan sama. Kalau ada yang berbeda, laporkan dan berhenti.
- Yang diharapkan berubah (n_responden lama -> baru):
  unit: SMA Athirah Kajaolalido 6->10, SD Athirah Kajaolalido 15->19, SMP Athirah Baruga 11->14, Asrama Athirah Baruga 9->11, SMA Athirah Baruga 16->18, Boarding Bone 26->28, SMP Athirah Kajaolalido 8->10, QGDP SMP dan SMA 1->2, Departemen Procurement 1->2, Departemen HC 4->5, Departemen Sarling 9->10, SD Athirah Baruga 8->9, QGDP TK dan SD 1->2, TK Athirah Kajaolalido 2->3.
  jenjang: SMA 31->37, Kantor 34->39, SMP 24->29, SD 29->34, Asrama 35->39, TK 16->17.
  Kalau hasil kodemu berbeda dari daftar ini, laporkan dan berhenti.

LANGKAH 2, NARASI KELOMPOK (kolom laporan_json di KELOMPOK, skema dan aturan sama dengan Tahap B pengolahan sebelumnya).
- Tulis ULANG laporan_json untuk cakupan yang anggotanya berubah dan n_responden ≥ 5: 10 unit (SMA Athirah Kajaolalido, SD Athirah Kajaolalido, SMP Athirah Baruga, Asrama Athirah Baruga, SMA Athirah Baruga, Boarding Bone, SMP Athirah Kajaolalido, Departemen Sarling, SD Athirah Baruga, dan Departemen HC yang sekarang n = 5 dan BARU mendapat narasi) dan 6 jenjang (SMA, Kantor, SMP, SD, Asrama, TK). Pakai angka baru dari Langkah 1.
- Unit yang tetap di bawah 5 orang (QGDP SMP dan SMA, Departemen Procurement, QGDP TK dan SD, TK Athirah Kajaolalido) tetap TANPA narasi.
- Narasi "lembaga" dan "kelompok_jabatan": periksa setiap kalimat yang menyebut angka unit atau jenjang (misalnya rata-rata, persen tidak puas, jumlah orang per unit atau jenjang). Perbaiki HANYA kalimat yang angkanya berubah; kalimat lain biarkan sama persis kata demi kata. Kalau tidak ada yang berubah, jangan sentuh narasinya.
- Tema testimoni per cakupan (testimoni.tema) dihitung dari baris TESTIMONI layak_tampil = Ya dengan unit dan jenjang yang baru.

ATURAN BAHASA (sama dengan pengolahan sebelumnya, ditambah dua aturan baru):
- Bahasa Indonesia lugas untuk Human Capital, tanpa jargon. Dilarang em-dash dan "--". Dilarang: "sangat penting", "pada dasarnya", "perlu dicatat", "komprehensif", "holistik", "sesungguhnya", "tentu saja", "dengan demikian", "merupakan", "terdapat", "berperan penting", "tak dapat dipungkiri", "mari kita". Dilarang label kategori terbawah lama; pakai "Perlu Pendampingan". Dilarang istilah diagnosis.
- BARU: tindak lanjut tidak boleh berbunyi "tim pendamping menghubungi" atau menawarkan percakapan atau sesi dari Fammi. Yang menyapa pegawai dan menyiapkan rujukan ke psikolog adalah Human Capital atau pimpinan unit.
- BARU: angka rata-rata skor dan jumlah orang per kategori jangan dicampur dalam satu kalimat tanpa keterangan. Tulis "rata-rata skor 77%" atau "95% pegawai berkategori Baik", jelas mana yang dimaksud.
- Narasi tidak menyebut nama siapa pun.
- Pakai "jika", bukan "kalau".

SETELAH SELESAI, tampilkan di chat:
1. Tabel n_responden lama dan baru untuk semua cakupan unit dan jenjang.
2. Daftar cakupan yang laporan_json-nya ditulis ulang, dan daftar kalimat lembaga atau kelompok_jabatan yang diubah (lama -> baru).
3. Konfirmasi bahwa INDIVIDU, ITEM, PARAMETER, dan CATATAN_QC tidak berubah, dan baris lembaga serta kelompok_jabatan di KELOMPOK angkanya sama.
```
