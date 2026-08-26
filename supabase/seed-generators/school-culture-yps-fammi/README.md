# Generator seed School Culture: Yayasan Pendidikan Sekolah Fammi

Membangkitkan lima berkas migration `20260826160*_sc_yps_fammi_seed_*.sql` plus
`docs/seed-school-culture-yps-fammi.md`. Data 150 staf dummy di enam unit, periode 2026-07.

Jalankan dari folder ini:

```bash
node gen-sc-seed.mjs ../../migrations ../../../docs
```

Deterministik: PRNG-nya diberi seed tetap (20260826), jadi menjalankan ulang tanpa mengubah
apa pun menghasilkan berkas yang identik, termasuk UUID tiap responden. Begitu ada satu angka
target yang digeser, SELURUH nama dan UUID ikut berubah karena urutan pengambilan acaknya
bergeser, jadi generate ulang berarti jalankan ulang kelima migration dari bagian 1 (yang
sekaligus membersihkan data lama).

## Isi berkas

| Berkas | Isi |
| --- | --- |
| `gen-sc-seed.mjs` | Alur utama: bangun 150 responden, jawaban Likert, skor, esai, laporan individu, agregat |
| `gen-sc-seed-lib.mjs` | PRNG, kamus nama, konfigurasi enam unit, daftar butir instrumen, ambang kategori |
| `gen-sc-seed-text.mjs` | Kamus teks: jawaban esai, rencana aksi pribadi, Lingkar Kontribusi |
| `gen-sc-seed-tl.mjs` | Sembilan tindak lanjut lembaga dan briefing, dirakit dari angka agregat |
| `emitter.mjs` | Penulis SQL dan dokumentasi akun |

## Yang menentukan "cerita" datanya

Semua di `gen-sc-seed-lib.mjs`:

- `TARGET_G` / `TARGET_H`: rata-rata jawaban seluruh lembaga per tipe budaya, skala 1-5.
  Selisih keduanya yang jadi gap di dashboard.
- `UNITS[].biasG` / `biasH` / `biasB`: pergeseran per unit, yang membuat SMP condong Aturan dan
  SMA condong Orientasi.
- `DIMENSI[].offset`: tinggi rendahnya tiap dimensi profil organisasi.
- `B_ITEMS[].base`: tinggi rendahnya tiap butir kesejahteraan.

Angka agregat `sc_lembaga` TIDAK ditulis manual, selalu dihitung ulang dari 150 jawaban yang
dibangkitkan, jadi dashboard dan laporan individu tidak akan pernah saling bertentangan.
