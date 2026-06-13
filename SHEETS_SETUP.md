# Setup Google Sheets untuk FIR MVP (Siswa + MI)

Panduan setup Sheets untuk end-to-end testing dengan role Siswa dan modul MI.

## 1. Buat Control Workbook (terpusat)

**Nama:** `FIR_Control_v1`

Buat 8 sheet berikut dengan struktur tepat:

### Sheet: Pengguna

| pengguna_id | username | kredensial_hash | nama | peran | aktif |
|---|---|---|---|---|---|
| P001 | siswa_test | [SHA256 dari PIN] | Aisyah Putri Faisal | Siswa | TRUE |

**Catatan:** 
- `kredensial_hash` = SHA-256 hex dari PIN. Contoh PIN "123456" → hash dengan online tool atau:
  - Gunakan browser console: `crypto.subtle.digest('SHA-256', new TextEncoder().encode('123456')).then(h => console.log(Array.from(new Uint8Array(h)).map(x => x.toString(16).padStart(2, '0')).join('')))`
  - Atau gunakan tool online: https://www.sha256online.com/
  - Untuk test, pakai PIN sederhana seperti "123456"

### Sheet: Sesi
(Akan auto-populate saat login, header saja dulu)

| token | pengguna_id | dibuat | kedaluwarsa |
|---|---|---|---|

### Sheet: Akses_Kapabilitas

| peran | modul | boleh_lihat_kualitatif |
|---|---|---|
| Siswa | mi | FALSE |
| Siswa | karakter | FALSE |
| Siswa | screening | FALSE |

### Sheet: Akses_Cakupan

| pengguna_id | tipe_cakupan | cakupan_value |
|---|---|---|
| P001 | murid | M001 |

(P001 = siswa_test, M001 = siswa di kelas X-A)

### Sheet: Langganan

| sekolah_id | modul | aktif |
|---|---|---|
| S001 | mi | TRUE |
| S001 | karakter | FALSE |
| S001 | screening | FALSE |

### Sheet: Registry

| sekolah_id | workbook_id | aktif |
|---|---|---|
| S001 | [WORKBOOK_DATA_ID] | TRUE |

(Isi workbook_id nanti setelah buat per-school workbook)

### Sheet: Modul_Config

| modul | nama_display | urutan | aktif |
|---|---|---|---|
| mi | Multiple Intelligence | 1 | TRUE |
| karakter | Rapor Karakter | 2 | FALSE |
| screening | Screening | 3 | FALSE |

### Sheet: Yayasan (optional untuk MVP)

| yayasan_id | nama_yayasan | aktif |
|---|---|---|
| Y001 | Yayasan Test | TRUE |

---

## 2. Buat Per-School Data Workbook

**Nama:** `FIR_Data_S001_v1` (untuk sekolah S001)

Buat 4 sheet:

### Sheet: Sekolah

| sekolah_id | yayasan_id | nama_sekolah | jenjang | aktif |
|---|---|---|---|---|
| S001 | Y001 | SMA Al Fath Cireundeu | SMA | TRUE |

### Sheet: Kelas

| kelas_id | sekolah_id | nama_kelas | tahun_ajaran | aktif |
|---|---|---|---|---|
| K001 | S001 | X-A | 2025/2026 | TRUE |

### Sheet: Murid

| murid_id | sekolah_id | kelas_id | nama_murid | gender | aktif |
|---|---|---|---|---|---|
| M001 | S001 | K001 | Aisyah Putri Faisal | P | TRUE |

### Sheet: Fakta_Aspek

Format: satu baris per siswa per aspek (dimensi MI)

| murid_id | kelas_id | sekolah_id | modul | aspek_kode | skor | dominan_flag | periode_id |
|---|---|---|---|---|---|---|---|
| M001 | K001 | S001 | mi | Ie | 23 | TRUE | P001 |
| M001 | K001 | S001 | mi | Sp | 22 | FALSE | P001 |
| M001 | K001 | S001 | mi | Ve | 18 | FALSE | P001 |
| M001 | K001 | S001 | mi | Na | 16 | FALSE | P001 |
| M001 | K001 | S001 | mi | Mu | 15 | FALSE | P001 |
| M001 | K001 | S001 | mi | Lo | 13 | FALSE | P001 |
| M001 | K001 | S001 | mi | Ki | 12 | FALSE | P001 |
| M001 | K001 | S001 | mi | Ia | 19 | FALSE | P001 |

**Kode MI:**
- Ie = Interpersonal
- Sp = Spasial
- Ve = Verbal/Linguistik
- Na = Naturalis
- Mu = Musikal
- Lo = Logika-Matematika
- Ki = Kinestetik
- Ia = Intrapersonal

---

## 3. Update Gas/.clasp.json

Setelah membuat control workbook, catat **Workbook ID** dari URL:
```
https://docs.google.com/spreadsheets/d/{WORKBOOK_ID}/edit
```

Lalu isi di `gas/.clasp.json`:

```json
{
  "scriptId": "{SCRIPT_ID}",
  "rootDir": "."
}
```

(Script ID akan didapat setelah `clasp create`)

Dan di **Project Settings** (panel kanan Google Apps Script):
- Tambah Property: `CONTROL_WORKBOOK_ID` = workbook_id control
- Tambah Property: `SESSION_SECRET` = random string panjang (untuk signing session)

---

## 4. Update Registry Sheet

Kembali ke Control Workbook, sheet Registry:
- Isi `workbook_id` dengan ID dari `FIR_Data_S001_v1`

---

## Checklist Before Deploy

- [ ] Control Workbook created dengan 8 sheets
- [ ] Per-school workbook created dengan 4 sheets
- [ ] Pengguna sheet punya 1 test user (siswa_test)
- [ ] Fakta_Aspek punya 8 baris (MI scores untuk 1 siswa)
- [ ] Clasp .clasp.json sudah ada dengan scriptId
- [ ] GAS Project Settings punya CONTROL_WORKBOOK_ID dan SESSION_SECRET
- [ ] Registry sheet punya mapping sekolah → workbook_id

---

## Next Steps

Setelah setup selesai, lanjut ke **Task 3: Deploy GAS dengan Clasp**
