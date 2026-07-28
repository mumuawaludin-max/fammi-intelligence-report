# Fammi School Culture Report

Prototype dashboard hasil School Culture and Engagement Screening untuk pimpinan
sekolah atau yayasan. Desain mempertahankan isi wireframe awal, lalu mengubahnya
menjadi alur keputusan yang lebih ringkas:

1. memahami kondisi budaya secara cepat;
2. membandingkan kondisi saat ini dengan harapan;
3. memilih prioritas;
4. menjalankan rencana intervensi 30, 60, dan 90 hari.

## Menjalankan proyek

```bash
npm install
npm run dev
```

Build produksi dan pemeriksaan kode:

```bash
npm run lint
npm run build
npm run preview
```

## Titik masuk utama

- `src/App.tsx`: komposisi halaman dan state dimensi yang sedang dipilih.
- `src/types/report.ts`: kontrak data `SchoolCultureReport`.
- `src/data/sampleReport.ts`: seluruh angka dan narasi contoh.
- `src/styles.css`: design tokens, layout responsif, print style, dan motion.
- `src/components/`: komponen laporan yang dapat dipindahkan ke sistem Fammi.
- `design-references/`: wireframe asli serta tiga visual reference hasil eksplorasi.

`App` menerima properti `report`. Tanpa properti tersebut, aplikasi memakai data
contoh sehingga desain dapat dijalankan secara mandiri.

```tsx
import App from "./App";
import type { SchoolCultureReport } from "./types/report";

const report: SchoolCultureReport = await getReport();

root.render(<App report={report} />);
```

Panduan integrasi lebih lengkap tersedia di `CLAUDE_CODE_HANDOFF.md`.

