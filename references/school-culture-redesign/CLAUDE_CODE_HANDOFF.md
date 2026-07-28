# Handoff untuk Claude Code

## Tujuan produk

Halaman ini adalah laporan eksekutif, bukan sekadar kumpulan skor. Urutan
informasinya sengaja mengikuti alur keputusan pimpinan:

1. Ringkasan budaya menjawab "apa yang sedang terjadi?"
2. Perbandingan gap menjawab "di mana jarak terbesar?"
3. Panel prioritas menjawab "apa implikasinya?"
4. Rencana 90 hari menjawab "apa yang harus dilakukan, siapa pemiliknya, dan
   bagaimana keberhasilannya dipantau?"

Pertahankan urutan tersebut ketika halaman digabungkan ke aplikasi utama Fammi.

## Kontrak data

Sumber kebenaran tipe ada di `src/types/report.ts`. UI menerima satu objek
`SchoolCultureReport`. Semua angka dan narasi contoh ada di
`src/data/sampleReport.ts`, sehingga tidak ada angka asesmen yang tertanam di
komponen presentasi.

Aturan pemetaan yang penting:

- `dominantDimension` harus cocok dengan salah satu `dimensions[].key`.
- Urutan `dimensions` menentukan urutan kartu, baris grafik, dan tab tindakan.
- `current`, `target`, serta `gap` memakai angka 0 sampai 100.
- `gap` disimpan eksplisit agar angka resmi dari mesin asesmen tidak berubah
  akibat pembulatan di frontend.
- Setiap dimensi membutuhkan tepat tiga `phases` agar timeline 30, 60, dan 90
  hari tetap utuh.
- `status` saat ini menerima `Perlu perhatian`, `Ringan`, atau `Selaras`.

Contoh adapter dari respons API:

```ts
import type { SchoolCultureReport } from "./types/report";

export function toSchoolCultureReport(
  api: AssessmentReportResponse
): SchoolCultureReport {
  return {
    reportId: api.id,
    schoolName: api.organization.name,
    period: api.period.label,
    respondentCount: api.respondent_count,
    generatedAt: api.generated_at_label,
    dominantDimension: api.dominant_dimension,
    executiveSummary: api.executive_summary,
    meaningSignals: api.meaning_signals,
    dimensions: api.dimensions.map((dimension) => ({
      key: dimension.key,
      label: dimension.label,
      shortLabel: dimension.short_label,
      icon: dimension.icon,
      current: dimension.current_score,
      target: dimension.expected_score,
      gap: dimension.official_gap,
      status: dimension.status,
      descriptor: dimension.descriptor,
      interpretation: dimension.interpretation,
      focus: dimension.focus,
      priorityActions: dimension.priority_actions,
      phases: dimension.intervention_phases,
      indicators: dimension.success_indicators,
      warnings: dimension.risks,
      targetImpact: dimension.target_impact
    })),
    actionOwner: api.action_owner,
    reviewCadence: api.review_cadence,
    targetDate: api.target_date_label,
    nextReview: api.next_review_label
  };
}
```

## Struktur komponen

| Komponen | Tanggung jawab |
| --- | --- |
| `ReportHeader` | Identitas produk, jenis laporan, lembaga aktif, dan ekspor |
| `ReportNavigation` | Navigasi cepat ke tiga bagian laporan |
| `ExecutiveSummary` | Kesimpulan, budaya dominan, metadata, dan empat skor |
| `ScoreRing` | Visual skor dominan yang dianimasikan |
| `GapComparison` | Satu skala bersama untuk kondisi saat ini dan harapan |
| `ActionPlan` | Tab dimensi, timeline 90 hari, owner, indikator, dan risiko |
| `Reveal` | Motion saat elemen memasuki viewport |
| `IconBadge` | Sistem ikon konsisten berbasis Phosphor |

State `selectedKey` berada di `App.tsx`, sehingga klik pada skor, baris gap, atau
tab tindakan selalu menunjuk pada dimensi yang sama.

## Design system

Token utama didefinisikan sebagai CSS custom properties di bagian awal
`src/styles.css`.

| Token | Nilai | Fungsi |
| --- | --- | --- |
| `--primary` | `#6C2BD9` | Aksi utama dan penekanan |
| `--heading` | `#3B1E77` | Judul dan teks berkontras tinggi |
| `--soft` | `#F1EAFF` | Surface ungu lembut |
| `--background` | `#FAFAF7` | Latar utama |
| `--border` | `#E6E2DA` | Garis pemisah dan outline |
| `--gold` | `#D9A406` | Target, milestone, dan aksen prioritas |

Tipografi memakai Plus Jakarta Sans variable yang dibundel lokal. Ikon memakai
`@phosphor-icons/react`; jangan menggantinya dengan emoji atau campuran beberapa
keluarga ikon.

Prinsip layout:

- `section-shell` membatasi lebar konten dan memberi gutter responsif.
- Perbandingan desktop memakai layout grafik plus sticky insight panel.
- Rencana aksi desktop memakai workspace plus sticky metadata panel.
- Pada mobile, kolom menjadi satu dan pemilih dimensi dapat digeser horizontal.
- Print style menyembunyikan kontrol aplikasi dan memecah konten secara aman.

## Motion

Motion dibuat dengan `motion/react` dan selalu menghormati
`prefers-reduced-motion`.

- Reveal section: opacity dan translasi vertikal ringan.
- Score ring: stroke tumbuh saat masuk viewport.
- Pergantian dimensi: cross-fade dengan pergeseran pendek.
- Timeline: garis berkembang lebih dahulu, lalu fase masuk bertahap.
- Hover: lift kecil hanya pada elemen yang benar-benar interaktif.

Durasi mayoritas berada di rentang 420 sampai 700 ms dengan easing
`[0.16, 1, 0.3, 1]`. Jangan menambahkan animasi dekoratif terus-menerus karena
halaman ini digunakan untuk membaca data dan mengambil keputusan.

## Integrasi ke Fammi

Urutan yang disarankan:

1. Salin `src/components`, `src/types/report.ts`, dan bagian token/layout dari
   `src/styles.css` ke modul laporan Fammi.
2. Buat adapter API yang menghasilkan `SchoolCultureReport`.
3. Render `<App report={mappedReport} />` atau pindahkan komposisi komponen ke
   route Fammi yang sudah ada.
4. Hubungkan pemilih lembaga dan jenis laporan ke router serta state global
   Fammi.
5. Ganti `window.print()` dengan layanan PDF atau export Fammi bila tersedia.
6. Hubungkan tombol "Tetapkan sebagai prioritas" ke penyimpanan action plan.
7. Tambahkan state loading, error, dan empty sesuai pola sistem utama.

Jangan mengubah komponen untuk memasukkan narasi langsung. Narasi hasil
asesmen sebaiknya tetap datang dari adapter atau service layer agar Claude Code
dapat mengganti isi tanpa mengubah kerangka visual.

## Checklist penerimaan

- Empat skor, target, dan gap sama persis dengan hasil asesmen.
- Dominant dimension selalu memiliki pasangan data lengkap.
- Pergantian dimensi memperbarui insight dan action plan secara bersamaan.
- Tidak ada horizontal overflow halaman pada lebar 390 px.
- Navigasi keyboard dan skip link tetap bekerja.
- `prefers-reduced-motion` dan print mode tetap didukung.
- `npm run lint` dan `npm run build` selesai tanpa error.

