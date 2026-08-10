# Rapor Karakter Multi-Sumber Refleksi, Plan Development Detail

> **Status eksekusi per 2026-08-10: SELESAI (kode), BELUM DEPLOY.**
> WS1 sampai WS7 sudah diimplementasikan dan diverifikasi. Build produksi bersih, ESLint
> identik dengan baseline HEAD (nol temuan baru), varian A terbukti tidak berubah lewat
> perbandingan DOM server-side dan perbandingan string karakter demi karakter.
> Yang BELUM: menjalankan dua migration ke Supabase, upload data SMK lewat CMS, dan QA
> end-to-end dengan login nyata per peran. Rinciannya di bagian 8 di bawah.

Turunan teknis dari `docs/karakter-multi-sumber-refleksi-plan.md`. Dokumen itu berisi konsep dan
keputusan produk; dokumen ini berisi rencana eksekusi per berkas, kontrak antarmuka, pembagian
kerja agen paralel beserta model yang dipakai, sampai QA dan deployment.

Sifat pekerjaan: **penambahan fitur, bukan penggantian**. Sekolah existing (refleksi orang tua
saja) harus berjalan tanpa perubahan tampilan maupun data. Semua mekanisme baru menyala hanya
kalau datanya ada.

## 1. Guardrail aditif

Aturan yang mengikat semua workstream:

1. Tidak ada rename tabel, kolom lama, komponen ekspor publik, atau nama sheet lama.
   `karakter_pernyataan_ortu`, kolom `emosi_anak`, sheet `detail_pernyataan_orangtua`,
   ekspor `ParentVoiceBento` semuanya tetap ada.
2. Kolom baru selalu punya default yang membuat baris lama valid (`sumber default 'orangtua'`).
3. Deteksi varian dari data, bukan konfigurasi. Kalau tidak ada baris `sumber='siswa'` dan tidak
   ada kunci `pencapaian_siswa` di ringkasan, seluruh jalur baru tidak tersentuh.
4. Semua string UI existing disalin karakter demi karakter ke meta; tidak ada perubahan redaksi
   untuk varian orang tua tanpa instruksi.
5. Importer tetap menerima file lama (tanpa sheet siswa) tanpa peringatan baru yang mengganggu.
6. Skema payload RPC hanya bertambah field; Edge Function `admin-actions` meneruskan payload apa
   adanya sehingga tidak perlu redeploy (diverifikasi di WS1, kalau ternyata Edge Function
   memvalidasi bentuk payload, revisinya masuk lingkup WS1).

## 2. Peta perubahan end-to-end

```
Excel SMK (7 sheet, blok orangtua + siswa)
   │
   ▼ WS2  karakterImporter.js: kenali sheet detail_pernyataan_siswa, tag sumber,
   │      preview per sumber di Upload.jsx
   ▼ WS1  RPC import_karakter_periode: terima kolom sumber,
   │      delete per (sekolah, periode, sumber); unique constraint baru
   ▼      karakter_pernyataan_ortu (+kolom sumber) · karakter_summary (jsonb, sudah jalan)
   │
   ▼ WS4  useKarakterData.js: turunkan sumberRefleksi, iris pernyataan per sumber
   ▼ WS3  karakterMeta.js: REFLEKSI_META, opsi kuesioner siswa, emosi Sangat Negatif, Keluhan
   ▼ WS5  KarakterShared.jsx: VoiceBento(sumber), SourceSwitch, ReflectionBlock multi-blok
   ▼ WS6  KepsekView / WaliKelasView / YayasanView: pasang saklar, judul dinamis, donut dinamis
   │
   ▼ WS8  QA: matriks 3 varian × peran × perangkat, regresi varian A, uji upload parsial
```

## 3. Kontrak antarmuka, dikunci sebelum coding

Kontrak ini yang membuat workstream bisa berjalan paralel tanpa saling menunggu. Perubahan
kontrak setelah batch 1 dimulai harus lewat orkestrator, bukan keputusan lokal agen.

### 3.1 Skema data

```sql
-- karakter_pernyataan_ortu, kolom baru
sumber text not null default 'orangtua'  -- check: in ('orangtua','siswa')
-- unique lama  : karakter_pernyataan_ortu_sekolah_murid_periode_key (sekolah_id, murid_id, periode_id)
-- unique baru  : karakter_pernyataan_sekolah_murid_periode_sumber_key (sekolah_id, murid_id, periode_id, sumber)
```

### 3.2 Payload RPC (dibangun WS2, dibaca WS1)

Item `pernyataan_rows` bertambah satu field:

```json
{ "kelas_id": "...", "murid_id": "...", "nama_murid": "...",
  "kategori_pernyataan": "...", "pernyataan": "...", "emosi_anak": "...",
  "alasan_emosi": "...", "dukungan_dibutuhkan": "...", "dukungan_lainnya": "...",
  "hal_disyukuri": "...", "sumber": "orangtua" }
```

`sumber` wajib terisi oleh importer (bukan mengandalkan default DB), supaya delete per sumber di
RPC bisa membaca nilai dari payload dengan pasti.

### 3.3 `REFLEKSI_META` (dibangun WS3, dibaca WS4/WS5/WS6)

```js
export const REFLEKSI_META = {
  orangtua: {
    key: "orangtua", label: "Orang Tua", satuan: "orang tua", icon: "👪",
    emosiLabel: "Perasaan anak menurut orang tua",
    sectionTitle: "Suara Orang Tua",
    kategoriOptions: KATEGORI_PERNYATAAN_OPTIONS,
    dukunganOptions: DUKUNGAN_OPTIONS,            // konstanta existing, tidak diganti nama
    disyukuriOptions: HAL_DISYUKURI_OPTIONS,      // idem
    emptyText: { blok: "...", murid: (nama) => `...` },  // string existing, disalin persis
    summaryKeys: {
      pencapaian: ["pencapaian_orangtua", "persentase_pencapaian_orangtua"],
      rataPencapaian: ["rata_pencapaian_orangtua", "rata_rata_pencapaian_orangtua"],
      rataAspekPrefix: "rata_input_orangtua_",
      inputAspekPrefix: "input_orangtua_",
    },
  },
  siswa: {
    key: "siswa", label: "Siswa", satuan: "siswa", icon: "🧑‍🎓",
    emosiLabel: "Perasaan yang dilaporkan siswa sendiri",
    sectionTitle: "Suara Siswa",
    kategoriOptions: KATEGORI_PERNYATAAN_OPTIONS, // sama, plus entri Keluhan (lihat WS3)
    dukunganOptions: DUKUNGAN_OPTIONS_SISWA,
    disyukuriOptions: HAL_DISYUKURI_OPTIONS_SISWA,
    emptyText: { ... },
    summaryKeys: {
      pencapaian: ["pencapaian_siswa", "persentase_pencapaian_siswa"],
      rataPencapaian: ["rata_pencapaian_siswa", "rata_rata_pencapaian_siswa"],
      rataAspekPrefix: "rata_input_siswa_",
      inputAspekPrefix: "input_siswa_",
    },
  },
};
export const REFLEKSI_SUMBER_URUTAN = ["orangtua", "siswa"];
export function judulSectionSuara(sumberList) { /* 1 sumber -> "Suara Orang Tua"/"Suara Siswa",
  2 sumber -> "Suara Orang Tua & Siswa"; judul mega-kategori sejalan */ }
```

`summaryKeys.*` berupa daftar kandidat karena nama kunci di jsonb beda antara scope kelas dan
jenjang/sekolah (warisan nama kolom Excel). Resolver mencoba berurutan, perilaku sama dengan
pembacaan manual yang sekarang tersebar di view.

### 3.4 Keluaran hook (dibangun WS4, dibaca WS6)

Tiap hook (`useKarakterWaliKelas`, `useKarakterKepsek`, `useKarakterYayasan`) menambah dua field
pada objek hasil iris per periode, tanpa mengubah field yang sudah ada:

```js
{
  ...,                                  // field existing, tidak berubah
  sumberRefleksi: ["orangtua","siswa"], // subset terurut REFLEKSI_SUMBER_URUTAN, bisa []
  pernyataanBySumber: { orangtua: [...], siswa: [...] },
  // pernyataan (field lama) tetap ada = pernyataanBySumber.orangtua, demi kompatibilitas
}
```

Aturan deteksi: sumber dianggap tersedia pada suatu periode kalau ada baris pernyataan dengan
`sumber` itu, ATAU salah satu `summaryKeys.pencapaian`/`rataPencapaian`-nya ada di ringkasan
periode itu dengan nilai bukan nol semua.

### 3.5 Komponen bersama (dibangun WS5, dipakai WS6)

```jsx
// KarakterShared.jsx
export function SourceSwitch({ sumberList, value, onChange })   // segmented, sembunyi kalau <2
export function VoiceBento({ sumber, rows, summary, ... })      // isi ParentVoiceBento lama,
                                                                // semua teks dari REFLEKSI_META[sumber]
export function ParentVoiceBento(props)                         // alias tipis: <VoiceBento sumber="orangtua" {...props}/>
// ReflectionBlock: prop baru opsional `blocks: [{sumber, row}]`; prop lama tetap jalan
```

## 4. Workstream detail

### WS1. Database dan RPC

Berkas baru: `supabase/migrations/2026xxxxxx_karakter_refleksi_multi_sumber.sql`.

Isi, berurutan dalam satu transaksi:

1. `alter table karakter_pernyataan_ortu add column if not exists sumber text not null default 'orangtua';`
2. Check constraint `sumber in ('orangtua','siswa')` (pakai `do $$` guard supaya idempoten,
   pola yang sama dengan migrasi constraint sebelumnya).
3. `alter table karakter_pernyataan_ortu drop constraint if exists karakter_pernyataan_ortu_sekolah_murid_periode_key;`
4. `add constraint karakter_pernyataan_sekolah_murid_periode_sumber_key unique (sekolah_id, murid_id, periode_id, sumber);`
5. `comment on table karakter_pernyataan_ortu` yang menjelaskan nama tabel peninggalan dan makna
   `emosi_anak` per sumber (orangtua = penilaian pihak ketiga, siswa = lapor diri).
6. `create or replace function import_karakter_periode(...)` menyalin definisi dari
   `20260712140000_fix_import_karakter_service_role_check.sql` dengan tiga perubahan:
   - Baris delete pernyataan (line 38 versi lama) jadi:
     ```sql
     delete from karakter_pernyataan_ortu
      where sekolah_id = v_sekolah_id and periode_id = v_periode_id
        and sumber in (
          select distinct coalesce(x->>'sumber', 'orangtua')
          from jsonb_array_elements(coalesce(payload->'pernyataan_rows', '[]'::jsonb)) x);
     ```
     Kalau `pernyataan_rows` kosong, tidak ada pernyataan yang dihapus; ini perubahan perilaku
     yang disengaja dan aman (file skor-saja tidak lagi mengosongkan refleksi).
   - `jsonb_to_recordset ... as x(...)` ditambah `sumber text`, insert ditambah kolom `sumber`
     dengan `coalesce(x.sumber, 'orangtua')`.
   - Hasil `jsonb_build_object` menambah hitungan per sumber untuk log admin.
7. Verifikasi Edge Function `admin-actions` (baca kodenya di repo/Edge Function yang terdeploy):
   pastikan action `import-karakter` meneruskan payload tanpa validasi bentuk item. Kalau ada
   validasi, tambah field `sumber` di sana dan tandai butuh redeploy.

RLS: tidak disentuh. Policy pernyataan menyaring `sekolah_id`/`murid_id`
(`20260711100000_rls_scope_hardening.sql:90-92`), netral terhadap sumber.

Kriteria selesai WS1: migration bisa dijalankan dua kali tanpa error (idempoten); baris lama
terbaca `sumber='orangtua'`; RPC menerima payload lama (tanpa field sumber) dengan hasil identik
perilaku lama minus penghapusan pernyataan saat `pernyataan_rows` kosong.

### WS2. Importer dan CMS Upload

Berkas: `web/src/pages/admin/importers/karakterImporter.js`, lalu
`web/src/pages/admin/screens/Upload.jsx`.

**WS2a, parsing (`parseKarakterWorkbook`):**

1. Deklarasi konfigurasi sheet refleksi, menggantikan blok tunggal
   `detail_pernyataan_orangtua` (line 315-352) dengan loop:
   ```js
   const REFLEKSI_SHEETS = [
     { sheet: 'detail_pernyataan_orangtua', sumber: 'orangtua',
       kolomPenanda: 'pernyataan_orangtua',
       kolom: { pernyataan: 'pernyataan_orangtua', emosi_anak: 'emosi_anak',
                alasan_emosi: 'alasan_emosi_anak',
                dukungan_dibutuhkan: 'dukungan_yang_dibutuhkan_orangtua',
                hal_disyukuri: 'hal_yang_disyukuri_orangtua' } },
     { sheet: 'detail_pernyataan_siswa', sumber: 'siswa',
       kolomPenanda: 'pernyataan_siswa',
       kolom: { pernyataan: 'pernyataan_siswa', emosi_anak: 'emosi_siswa',
                alasan_emosi: 'alasan_emosi_siswa',
                dukungan_dibutuhkan: 'dukungan_yang_dibutuhkan_siswa',
                hal_disyukuri: 'hal_yang_disyukuri_siswa' } },
   ];
   ```
   Kolom yang sama di kedua sheet (`kategori_pernyataan`, `dukungan_lainya`/`dukungan_lainnya`,
   `bulan`, `Kelas`, `Nama`) tetap lewat `getField` yang toleran.
2. Pre-flight per sheet: sheet yang hadir tapi `kolomPenanda`-nya tidak ketemu menggagalkan parse
   dengan pesan daftar header (perilaku existing dipertahankan per sheet). Sheet yang absen
   dilewati tanpa error. Dua-duanya absen juga sah (file skor-saja, perilaku existing).
3. Tiap baris hasil parse diberi `sumber` dari konfigurasi sheet-nya; `pernyataanRows` tetap satu
   array gabungan (bentuk `rows` tidak berubah, `importKarakterWorkbook` dan filter per periode
   di line 447-466 jalan tanpa modifikasi).
4. `preview` ditambah `refleksiPerSumber: { orangtua: n, siswa: m }` dan daftar
   `refleksiSheetAda: ['orangtua','siswa']`.

**WS2b, UI Upload (`Upload.jsx`):**

1. Di langkah pratinjau (dekat blok `parsed.preview.sheets`, line 543), tambah baris ringkas per
   sumber mengikuti pola blok info SC/PA yang sudah ada:
   "💬 Refleksi orang tua: N baris · Refleksi siswa: M baris". Sumber dengan 0 baris ditulis
   eksplisit "tidak ada di file" supaya admin sadar varian file yang di-upload.
2. Kalau file hanya memuat satu sumber padahal sekolah itu sebelumnya pernah punya sumber lain
   di periode yang sama, tidak perlu deteksi di klien (butuh query tambahan, rawan keliru);
   cukup teks statis di bawah ringkasan: "Sumber yang tidak ada di file tidak akan dihapus dari
   periode yang sama." Jujur, murah, dan sesuai perilaku RPC baru.
3. Teks bantuan format file (line 398) ditambah menyebut sheet `detail_pernyataan_siswa` opsional.
4. Daftar tabel tujuan (line 720) tidak berubah.

Kriteria selesai WS2: file SMK asli terparse dengan `refleksiPerSumber` benar (cek terhadap angka
ekstraksi: orangtua 2101 baris data, siswa 2101); file SDIP lama terparse identik dengan sebelum
perubahan (snapshot hasil parse dibandingkan); file tanpa sheet refleksi tetap sah.

### WS3. Meta layer

Berkas: `web/src/pages/karakter/karakterMeta.js`.

1. Konstanta baru `DUKUNGAN_OPTIONS_SISWA` (8 opsi) dan `HAL_DISYUKURI_OPTIONS_SISWA` (9 opsi),
   teks `match` persis dari data (daftar lengkap dengan frekuensi ada di dokumen konsep bagian
   2.1), masing-masing dengan `label` pendek dan `icon`. Konstanta lama tidak diganti nama.
2. `KATEGORI_PERNYATAAN_OPTIONS` ditambah `{ match: "Keluhan" }` sesuai keputusan fase 0
   (satu bucket dengan Kritik, label "Kritik & Keluhan", atau bucket sendiri).
3. `EMOSI_ORDER` ditambah `{ key: "Sangat Negatif", tone: "waspada", icon: "😞" }` di urutan
   terakhir. Ini memperbaiki jalur orang tua juga (data lama yang punya nilai ini akan mulai
   tampil; catat di changelog QA sebagai perubahan yang disengaja).
4. `countEmosi` diberi parameter field opsional `countEmosi(rows, field = "emosi_anak")`;
   pemanggil lama tidak berubah.
5. `REFLEKSI_META`, `REFLEKSI_SUMBER_URUTAN`, `judulSectionSuara`, dan resolver
   `resolveSummaryKey(ringkasan, kandidat[])` sesuai kontrak 3.3.
6. `SECTION_ICON.suaraOrtu` tetap; tambah `suara: "💬"` generik untuk judul dinamis.

Kriteria selesai WS3: unit sanity di dev, `countMultiValue` atas 20 baris contoh data siswa nyata
menghasilkan 0 `console.warn`; semua string `orangtua` di meta identik dengan string yang
digantikannya (diff per karakter).

### WS4. Assembler hooks

Berkas: `web/src/pages/karakter/useKarakterData.js`.

1. Query tidak berubah; kolom `sumber` otomatis ikut karena select existing.
2. Di tiga `useMemo` pengiris periode (line 128-179, 253-296, 413-476), tambahkan:
   - `pernyataanBySumber` lewat satu pass pengelompokan (`r.sumber || 'orangtua'`).
   - `sumberRefleksi` dari gabungan kunci `pernyataanBySumber` dan pemeriksaan
     `resolveSummaryKey` pada ringkasan scope teratas periode itu (kontrak 3.4).
   - Field lama `pernyataan` diarahkan ke `pernyataanBySumber.orangtua` supaya kode view yang
     belum tersentuh tetap benar selama masa transisi batch.
3. Tidak ada query baru; anggaran jaringan tidak berubah.

Kriteria selesai WS4: dengan data seed varian A, `sumberRefleksi === ['orangtua']` dan seluruh
field lama identik (dibandingkan lewat log JSON sebelum/sesudah di dev); dengan data SMK,
`sumberRefleksi === ['orangtua','siswa']` di periode berisi dan `[]` di periode kosong.

### WS5. Komponen bersama

Berkas: `web/src/pages/karakter/KarakterShared.jsx`. Ini refactor terbesar dan paling berisiko
regresi; dikerjakan satu agen dengan model terkuat, setelah WS3 merge.

1. `ParentVoiceBento` (line 777) dibongkar jadi `VoiceBento({ sumber = "orangtua", ... })`;
   seluruh string tertanam diganti pembacaan `REFLEKSI_META[sumber]`:
   fallback nama "Orang tua" (line 540, 598, 638, 707), teks WhatsApp (line 576), judul dialog
   teruskan (line 597), heading "Refleksi orang tua" (line 723), label "Pesan orang tua"
   (line 733), tiga empty state (line 757, 787, 908), satuan hitung (line 931, 977), label
   emosi (line 1178), tab `VOICE_TABS` (line 497-502). Ekspor `ParentVoiceBento` dipertahankan
   sebagai alias.
2. `ReflectionBlock` (line 1165): dukung `blocks` multi-sumber dengan badge; prop lama tetap.
3. Komponen baru kecil `SourceSwitch` (kontrak 3.5), gaya mengikuti PickerPanel/segmented yang
   sudah ada di design token (ungu-050 latar aktif, radius 12, target sentuh minimal 40px).
4. Tone `waspada` pada bar emosi mengikuti `EMOSI_ORDER` baru (tidak ada kode khusus).
5. Dialog `VoiceShareDialog`/`MuridResumeDialog` menerima `sumber` untuk teks yang tepat.

Kriteria selesai WS5: `<ParentVoiceBento {...propsLama}/>` menghasilkan DOM identik dengan
sebelum refactor (dibandingkan lewat render snapshot manual di dev, data seed varian A);
`<VoiceBento sumber="siswa"/>` dengan data SMK menampilkan opsi siswa tanpa `console.warn`.

### WS6. View per peran

Tiga berkas, tiga agen paralel, file saling lepas: `KepsekView.jsx`, `WaliKelasView.jsx`,
`YayasanView.jsx`. Semua bergantung pada WS4 + WS5 yang sudah merge.

Pola sama di ketiganya:

1. State lokal `sumberAktif` (default elemen pertama `sumberRefleksi`); `SourceSwitch` di kepala
   section Suara; `VoiceBento sumber={sumberAktif}` dengan baris `pernyataanBySumber[sumberAktif]`.
2. Judul mega-kategori dan judul/subtitle section dari `judulSectionSuara(sumberRefleksi)`
   (menggantikan string di KepsekView line 387-403, WaliKelasView line 320-336, YayasanView
   line 269-285). Untuk `sumberRefleksi = ['orangtua']` fungsinya wajib mengembalikan string
   lama persis.
3. Khusus KepsekView: dialog jenjang (line 444, dan donut line 44/55) dirender dari daftar
   sumber yang kuncinya ada di ringkasan, urutan guru, orang tua, siswa; label
   "🧑‍🎓 Penilaian Diri Siswa" untuk `rata_input_siswa_*`.
4. Khusus WaliKelasView: blok per murid (line 294-305) jadi `ReflectionBlock blocks=[...]`,
   satu blok per sumber tersedia, badge sumber, empty state per sumber.
5. Khusus YayasanView: donut "Rata-rata karakter (orang tua)" (line 227) jadi per sumber
   tersedia; kutipan bernama mengikuti keputusan fase 0 nomor 2 (kalau diputuskan agregat saja
   untuk siswa, sembunyikan tab kutipan siswa di view ini).
6. Cakupan input per sumber (SampleTag/teks kecil) di tiap blok refleksi, dari
   `summaryKeys.pencapaian`.

Kriteria selesai WS6 per view: varian A tampil identik (side by side dengan production build
lama); varian B saklar bekerja dan kedua sumber benar; varian C tanpa saklar tanpa jejak
orang tua; mobile WaliKelas dan Kepsek lolos (saklar tidak menyebabkan overflow horizontal).

### WS7. Seed config sekolah dan penyiapan data

1. Migration/SQL seed `2026xxxxxx_karakter_smk_telkom_purwokerto_seed.sql`: baris `schools`
   (+`jenjang`), `school_modules (modul='karakter', aktif)`, `karakter_aspek_config` 4 baris
   (karakter1 Empati, karakter2 Inisiatif, karakter3 Resilience, karakter4 7 Kebiasaan),
   `karakter_indikator_config` 16 baris dengan `indikator_kode` persis dari header file
   (mis. `indikator1_dengar_pendapat_sebelum_menanggapi`), label tampilan dari pemilik produk
   atau dirapikan dari kode kolom. Akun uji Kepsek/WaliKelas/Yayasan mengikuti pola seed
   sekolah sebelumnya.
2. Pembersihan file bersama tim data (bagian 2.2 dokumen konsep): header `100 %`,
   `summary_sekolah` 4 baris per bulan plus blok agregat kedua, baris `summary_jenjang`
   terpotong. Keluaran: satu file bersih siap upload lewat CMS. Kalau tim data tidak bisa cepat,
   buat salinan file yang dirapikan manual untuk QA, file produksi menyusul.

### WS8. QA menyeluruh, rincian di bagian 6.

## 5. Rencana eksekusi paralel dengan agen

Prasyarat: gate G0 selesai (lima keputusan produk di dokumen konsep fase 0 dikunci).
Orkestrasi oleh sesi utama (Fable) yang memegang kontrak bagian 3, melakukan merge berurutan,
dan menjalankan review antar batch. Tiap agen menerima: potongan dokumen ini untuk workstream-nya,
kontrak bagian 3 utuh, dan guardrail bagian 1 utuh.

| Batch | Agen | Lingkup | Berkas | Model | Alasan model |
|---|---|---|---|---|---|
| B1 (paralel 4) | A1 | WS1 migration + RPC | `supabase/migrations/*` baru | Opus | SQL delete-scope dan idempotensi, salah sedikit menghapus data |
| | A2 | WS2a parsing importer | `karakterImporter.js` | Opus | parser banyak kasus tepi, riwayat bug parsing nyata di repo |
| | A3 | WS3 meta | `karakterMeta.js` | Sonnet | terarah penuh oleh kontrak, teks sudah disediakan |
| | A4 | WS7 seed SQL | migration seed baru | Haiku | mekanis, semua nilai sudah terdaftar di dokumen |
| Review R1 | A5 | review adversarial B1 | diff B1 | Opus | fokus: skenario upload parsial, idempotensi, regresi parse file lama |
| B2 (paralel 3) | A6 | WS5 KarakterShared | `KarakterShared.jsx` | Opus | refactor 1400 baris, risiko regresi visual tertinggi |
| | A7 | WS4 hooks | `useKarakterData.js` | Sonnet | perubahan kecil terlokalisasi di tiga useMemo |
| | A8 | WS2b Upload UI | `Upload.jsx` | Sonnet | pola preview tinggal meniru blok SC/PA |
| Review R2 | A9 | review B2 | diff B2 | Opus | fokus: DOM identik varian A, kompatibilitas prop lama |
| B3 (paralel 3) | A10 | WS6 KepsekView | `KepsekView.jsx` | Sonnet | pola sama, kontrak jelas |
| | A11 | WS6 WaliKelasView | `WaliKelasView.jsx` | Sonnet | idem, plus mobile |
| | A12 | WS6 YayasanView | `YayasanView.jsx` | Sonnet | idem |
| B4 | A13 | sweep regresi label | grep semua string "orang tua" sisa di modul | Haiku | mekanis, keluaran daftar untuk ditinjau orkestrator |
| | A14 | QA verifikasi browser | dev server + preview | Opus | menilai visual dan interaksi, bukan mekanis |
| Review R3 | orkestrator | integrasi akhir + matriks QA bagian 6 | seluruh diff | Fable | keputusan lintas file dan penilaian akhir |

Aturan main paralel:

1. Dalam satu batch tidak ada dua agen menyentuh berkas yang sama; daftar berkas di tabel
   bersifat mengikat. Kebutuhan menyentuh berkas di luar jatah dilaporkan ke orkestrator, tidak
   dikerjakan sendiri.
2. B2 baru mulai setelah A3 (meta) merge, karena WS4/WS5 mengimpor simbol dari meta. B3 setelah
   B2 merge. B1 internal saling bebas.
3. WS1 dan WS2 boleh selesai beda waktu karena kontrak payload 3.2 sudah dikunci; integrasinya
   diuji di B4, bukan saat merge.
4. Agen tidak menjalankan migration ke Supabase; semua SQL hanya berupa berkas. Eksekusi ke
   database dilakukan manual (bagian 7).
5. Review R1/R2 memakai pola verifikasi adversarial: reviewer diminta membantah klaim "aman untuk
   varian A" dengan mencari counterexample, bukan sekadar membaca diff.

Estimasi wall-clock dengan paralelisasi: B1 setengah hari, R1 cepat, B2 satu hari, B3 setengah
sampai satu hari, B4 + QA satu hari. Total 3 sampai 4 hari kerja, di luar G0 dan pembersihan
file oleh tim data.

## 6. QA

### 6.1 Data uji

- **Set A**: dump data sekolah existing (SDIP atau KB TK Istiqamah) apa adanya.
- **Set B**: file SMK Telkom Purwokerto yang sudah dibersihkan, 3 periode.
- **Set C**: salinan file SMK yang sheet `detail_pernyataan_orangtua`-nya dihapus (simulasi
  varian siswa-saja).
- **Set B-parsial**: salinan file SMK berisi hanya sheet skor + `detail_pernyataan_siswa` untuk
  satu periode, dipakai menguji perilaku delete per sumber.

### 6.2 Matriks fungsional

| # | Skenario | Langkah | Lolos bila |
|---|---|---|---|
| 1 | Regresi varian A | login Kepsek/WaliKelas/Yayasan sekolah Set A | tampilan identik dengan produksi sekarang; tanpa saklar; judul lama persis |
| 2 | Varian B, saklar | login Kepsek sekolah SMK | saklar 2 pill; isi bento berganti benar; angka cocok dengan Excel (sampling 5 nilai per sumber) |
| 3 | Varian B, donut jenjang | buka dialog jenjang Kelas 10 | 3 donut guru/orang tua/siswa, nilai cocok `summary_jenjang` |
| 4 | Varian B, per murid | WaliKelas buka murid dengan 2 refleksi | 2 blok berbadge; murid dengan 1 refleksi tampil 1 blok + empty state satunya |
| 5 | Varian C | import Set C ke sekolah uji kosong | judul "Suara Siswa", tanpa saklar, tanpa satu pun teks "orang tua" di halaman |
| 6 | Emosi Sangat Negatif | periode dengan data 21 baris | tampil dengan tone waspada; total emosi = jumlah baris berisi |
| 7 | Kategori Keluhan | tab kategori varian B sumber siswa | 204 baris masuk bucket sesuai keputusan G0, tanpa console.warn |
| 8 | Upload parsial | import Set B utuh, lalu Set B-parsial periode sama | refleksi orang tua periode itu TIDAK terhapus; refleksi siswa tergantikan |
| 9 | Idempotensi | upload Set B dua kali | jumlah baris DB tidak berubah pada upload kedua |
| 10 | File lama | upload ulang file SDIP lewat CMS | preview identik perilaku lama; hasil DB identik; `sumber='orangtua'` semua |
| 11 | Preview CMS | langkah pratinjau Set B dan Set C | hitungan per sumber benar; sumber absen ditulis "tidak ada di file" |
| 12 | Cakupan input | kelas dengan 0 input siswa | blok siswa menampilkan empty state + cakupan 0, bukan angka kosong menyesatkan |

### 6.3 Matriks peran dan perangkat

- Peran: Kepsek, **WakilKepalaSekolah (wajib identik Kepsek, cek setiap `case`)**, WaliKelas,
  Yayasan, AdminFammi (lewat KepsekView), OrangTua/Siswa (tetap "belum tersedia", tidak berubah).
- Perangkat: desktop untuk semua; mobile 375px untuk WaliKelas dan Kepsek (saklar, bento, dialog
  jenjang tidak overflow); Yayasan desktop-only sesuai keputusan arsitektur.

### 6.4 Pemeriksaan teknis

1. Console dev bersih dari `[karakterMeta] Opsi ... tidak dikenali` di ketiga set data.
2. Query sanity di SQL editor pasca-import Set B:
   `select sumber, periode_id, count(*) from karakter_pernyataan_ortu where sekolah_id = :smk group by 1,2;`
   dibandingkan dengan hitungan parse di preview.
3. RLS spot check: akun WaliKelas SMK tidak bisa membaca pernyataan kelas lain (query manual
   dengan session itu), perilaku lama yang wajib tetap.
4. Grep akhir (A13): tidak ada string literal "orang tua"/"Orang Tua" tersisa di
   `web/src/pages/karakter/` di luar `karakterMeta.js` (kecuali komentar).
5. Build produksi `npm run build` bersih.

### 6.5 Kriteria rilis

Semua baris 6.2 lolos, 6.3 lolos, 6.4 bersih, dan pemilik produk menyetujui tangkapan layar
varian B dan C (saklar, donut tiga sumber, blok per murid).

## 7. Deployment, urutan eksekusi

Tanpa CLI Supabase (kondisi lingkungan sekarang); migration dijalankan lewat SQL editor Studio.

1. Jalankan migration WS1 di Studio (kolom + constraint + RPC). Aman dilakukan sebelum deploy
   frontend: kode lama tidak mengirim `sumber`, RPC memberi `coalesce 'orangtua'`, kolom baru
   tidak dibaca kode lama.
2. Jalankan seed WS7 (sekolah, modul, config aspek/indikator, akun uji).
3. Deploy frontend (Vercel) berisi WS2 sampai WS6.
4. Upload file SMK bersih lewat CMS, jalankan matriks QA 6.2 nomor 2, 3, 4, 8, 9, 11.
5. Pantau console produksi sekolah varian A satu hari; tidak ada laporan beda tampilan.

Urutan mundur kalau ada masalah: frontend bisa di-rollback bebas (DB kompatibel dua arah);
migration tidak perlu di-rollback karena aditif; kasus terburuk data SMK dihapus per
(sekolah, periode) lewat RPC/SQL tanpa menyentuh sekolah lain.

## 8. Catatan hasil eksekusi (2026-08-10)

### 8.1 Berkas yang berubah

Baru:
- `supabase/migrations/20260810100000_karakter_refleksi_multi_sumber.sql` (kolom `sumber`,
  unique baru, comment tabel/kolom, RPC `import_karakter_periode` versi delete-per-sumber)
- `supabase/migrations/20260810110000_karakter_smk_telkom_purwokerto_seed.sql` (sekolah,
  entitlement, 4 aspek, 16 indikator)

Diubah:
- `web/src/pages/admin/importers/karakterImporter.js` (REFLEKSI_SHEETS, pre-flight per sheet,
  tag `sumber` per baris, `refleksiPerSumber`/`refleksiBarisDilewati`/`refleksiSheetAda`)
- `web/src/pages/admin/screens/Upload.jsx` (blok pratinjau per sumber)
- `web/src/pages/karakter/karakterMeta.js` (opsi instrumen siswa, REFLEKSI_META, judul dinamis,
  emosi Sangat Negatif, bucket Kritik & Keluhan, penjagaan hitung ganda di `countMultiValue`)
- `web/src/pages/karakter/useKarakterData.js` (`sumberRefleksi`, `pernyataanBySumber`)
- `web/src/pages/karakter/KarakterShared.jsx` + `.module.css` (`VoiceBento`, `SourceSwitch`,
  `ReflectionBlock blocks`, peta match per sumber)
- `web/src/pages/karakter/KepsekView.jsx`, `WaliKelasView.jsx`, `YayasanView.jsx`

### 8.2 Penyimpangan dari rencana, semuanya disengaja

1. **Baris sampah spreadsheet dilewati, bukan digagalkan.** Sheet refleksi SMK punya baris yang
   semua kolomnya kosong kecuali `bulan`. Aturan "nama kosong" menggagalkan seluruh file karena
   itu. Ditambah `isBarisKosongSelainBulan` yang melewati baris seperti itu dan menghitungnya
   di `preview.refleksiBarisDilewati` supaya tetap terlihat admin, bukan hilang diam-diam.
2. **`ReflectionBlock` multi-sumber hanya dipakai saat benar-benar dua sumber.** DOM dan CSS
   `ReflectionBlock` berbeda dari rendering inline WaliKelasView. Memakainya tanpa syarat akan
   mengubah tampilan sekolah varian A, melanggar guardrail. Jalur satu sumber tetap inline.
3. **Teks narasi per view tetap di view, bukan di `karakterMeta.js`.** Kalimatnya menyebut
   konteks view ("kelas ini", "lintas sekolah yayasan"), jadi tidak bisa dibagi. Tiap view punya
   satu fungsi narasi lokal; kasus orangtua-saja mengembalikan string lama persis.
4. **Label tab emosi untuk siswa jadi "Emosi Siswa"**, bukan "Emosi Anak". Ditemukan saat
   verifikasi visual; "Emosi Anak" salah sudut pandang untuk lapor diri.
5. **`countMultiValue` diberi penjagaan hitung ganda.** Sejak dua opsi boleh berbagi label
   ("Kritik" dan "Keluhan"), satu baris yang mencentang keduanya akan terhitung dua kali di
   bucket yang sama. Sekarang satu baris menambah satu bucket paling banyak sekali.

### 8.3 Bug existing yang ikut tertutup

- Emosi "Sangat Negatif" sebelumnya dibuang diam-diam oleh `EMOSI_ORDER` (21 baris di data SMK).
- Kategori "Keluhan" tidak dikenali `KATEGORI_PERNYATAAN_OPTIONS` (204 baris di data SMK).
- RPC import lama menghapus SELURUH pernyataan satu periode walau payload tidak membawa
  pernyataan sama sekali; upload file skor-saja mengosongkan refleksi periode itu.
- Peta `KATEGORI_MATCH_BY_LABEL` bertipe label -> match tunggal. Setelah bucket gabungan, baris
  "Kritik" berhenti cocok. Ini regresi nyata untuk sekolah lama, sudah diverifikasi dan ditutup
  dengan peta label -> array match.

### 8.4 Kondisi berkas Excel SMK

File asli TIDAK bisa diimpor apa adanya. Salinan bersih dibuat untuk QA dengan dua pembuangan:
- `summary_jenjang`: blok agregat kedua di bawah pemisah kosong (header kedua + rata-rata lintas
  bulan tanpa kolom `bulan`) dibuang, tersisa 12 baris per (bulan, jenjang).
- `summary_sekolah`: blok per unit (4 baris per bulan) dibuang, tersisa 3 baris agregat per bulan.
  Tanpa pembuangan ini hasilnya kebetulan sama karena aturan "baris terakhir menang", tapi
  bergantung pada urutan baris di file.

Sisa masalah data yang perlu dikonfirmasi tim data: `summary_jenjang` masih memuat DUA baris per
(bulan, jenjang), nilainya berbeda, dan importer memakai yang terakhir. Perlu dipastikan baris
mana yang benar. Juga header kolom ke-7 `summary_kelas` berisi literal `100 %`, bukan nama kolom.

Hasil parse file bersih: `ok: true`, refleksi orang tua 1497 baris, siswa 1443 baris (1 baris
sampah dilewati), 3 periode (2026-03, 2026-04, 2026-05), 7884 baris skor, 31536 skor indikator,
78 baris summary.

### 8.5 Verifikasi yang sudah dijalankan

| Uji | Hasil |
|---|---|
| Build produksi `npm run build` | bersih |
| ESLint `src/pages/karakter` + `src/pages/admin` | 6 error + 11 warning, IDENTIK baseline HEAD |
| Parse file SMK bersih | ok, angka per sumber sesuai |
| Regresi parse file SDIP Al Madani | identik baseline (1508 refleksi, 8970 skor, 381 murid baru) |
| DOM `ParentVoiceBento` varian A sebelum vs sesudah | byte-identik |
| String judul/narasi varian A ketiga view | identik karakter demi karakter |
| Opsi instrumen siswa vs data nyata | 0 baris tak cocok, frekuensi persis |
| Jebakan `find` lintas sumber di WaliKelasView | tertutup, terbukti lewat skrip |
| Saklar sumber di browser | berfungsi, isi bento berganti benar |
| Label emosi per sumber di browser | "menurut orang tua" vs "dilaporkan siswa sendiri" |
| Mobile 375px | tanpa overflow horizontal, pill 40px |

### 8.6 Yang BELUM dikerjakan

1. Menjalankan dua migration di Supabase SQL Editor (tidak ada CLI di lingkungan ini).
2. Upload file SMK bersih lewat CMS dan verifikasi hasilnya di database.
3. QA end-to-end dengan login nyata: matriks bagian 6.2 nomor 2, 3, 4, 8, 9, 11, 12 dan matriks
   peran 6.3. Verifikasi browser yang sudah dilakukan memakai halaman pratinjau sementara dengan
   data contoh nyata, bukan aplikasi ber-login.
4. Emosi "Sangat Negatif" belum terlihat langsung di browser karena tidak ada di 60 baris contoh;
   jalur hitungnya sudah diverifikasi terpisah (21 baris di data penuh).
5. Lima keputusan Fase 0 belum dijawab pemilik produk. Default yang dipakai: sebutan "Siswa",
   kutipan siswa di Yayasan ditampilkan bernama sama seperti orang tua, "Keluhan" digabung jadi
   bucket "Kritik & Keluhan", file dirapikan di sisi file, "Sangat Negatif" bertone waspada.
