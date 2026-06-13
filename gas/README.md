# FIR Gate — Google Apps Script

Gerbang baca FIR. Menerima permintaan dari React, memvalidasi sesi, menyaring data per peran, lalu mengembalikan potongan yang diizinkan. Browser tidak pernah menyentuh Sheets langsung.

## Prasyarat

- Node 18+ dan npm
- Clasp: `npm install -g @google/clasp`
- Akun Google yang punya akses ke Sheets FIR

## Setup awal

### 1. Login ke Google lewat Clasp

```bash
clasp login
```

Browser akan terbuka untuk otorisasi. Selesaikan di browser lalu kembali ke terminal.

### 2. Buat proyek Apps Script baru

Jalankan dari dalam folder `gas/`:

```bash
cd gas
clasp create --title "FIR Gate" --type webapp --rootDir .
```

Clasp akan membuat file `.clasp.json` berisi script ID. File ini tidak di-commit (sudah ada di `.gitignore`).

### 3. Dorong kode ke GAS

```bash
clasp push
```

Konfirmasi bila Clasp bertanya apakah akan menimpa file yang ada di editor daring.

### 4. Isi Script Properties

Buka proyek di browser:

```bash
clasp open
```

Di editor GAS: **Project Settings > Script Properties**, tambahkan:

| Key | Value |
|---|---|
| `CONTROL_WORKBOOK_ID` | ID Google Sheet workbook kontrol FIR |
| `SESSION_TTL_HOURS` | `8` (opsional, default sudah 8 di kode) |

ID workbook diambil dari URL: `https://docs.google.com/spreadsheets/d/**ID_DI_SINI**/edit`

### 5. Deploy sebagai web app

```bash
clasp deploy --description "FIR gate v1"
```

Catat URL yang muncul, format:
`https://script.google.com/macros/s/AKf.../exec`

URL ini masuk ke variabel lingkungan React:
- Lokal: `web/.env.local` sebagai `VITE_GAS_WEB_APP_URL`
- Produksi: Environment Variables di dashboard Vercel

### 6. Verifikasi health-check

```bash
curl https://script.google.com/macros/s/AKf.../exec
```

Harus kembali: `{"status":"FIR gate online"}`

## Siklus pengembangan

Edit kode lokal, lalu:

```bash
clasp push
clasp deploy --description "deskripsi perubahan"
```

Tiap deploy menghasilkan versi baru. URL `/exec` selalu mengarah ke versi terbaru kecuali Anda mengunci ke versi tertentu.

Bila ada perubahan di editor GAS daring, tarik dulu sebelum edit lokal:

```bash
clasp pull
```

## Format permintaan dari React

Semua permintaan adalah HTTP POST dengan body JSON.

### Login

```json
{
  "action": "login",
  "username": "budi.santoso",
  "kredensial_hash": "<SHA-256 hex dari PIN/password>"
}
```

Respons sukses:

```json
{
  "ok": true,
  "token": "uuid-token",
  "user_id": "USR001",
  "nama": "Budi Santoso",
  "peran": "Kepala Sekolah"
}
```

### Baca data

```json
{
  "action": "read",
  "token": "uuid-token",
  "modul": "karakter",
  "periode_id": "PER2026-03"
}
```

Respons sukses:

```json
{
  "ok": true,
  "data": {
    "modul_config": { ... },
    "fakta_aspek": [ ... ],
    "tindak_lanjut": [ ... ]
  }
}
```

Nilai `modul` yang valid: `karakter`, `screening`, `mi`, `tindak_lanjut`.

## Aturan yang tidak boleh dilanggar

- `CONTROL_WORKBOOK_ID` tidak boleh masuk kode atau repository. Selalu lewat Script Properties.
- Kunci Gemini API tidak ada di proyek ini sama sekali. Gemini hanya di pipeline hulu.
- Field `nama_murid` tidak pernah dikirim untuk modul `screening`. Read.js sudah menghapusnya sebelum return.
- Tindak lanjut yang dikembalikan hanya yang `status_persetujuan = "disetujui"`.
