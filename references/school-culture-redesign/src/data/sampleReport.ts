import type { SchoolCultureReport } from "../types/report";

export const sampleReport: SchoolCultureReport = {
  reportId: "SC-2026-NF-01",
  schoolName: "Manajemen Yayasan Pendidikan Nurul Fikri",
  period: "Semester Genap 2025/2026",
  respondentCount: 128,
  generatedAt: "24 Juli 2026",
  dominantDimension: "orientation",
  executiveSummary:
    "Budaya kerja menunjukkan orientasi pada hasil yang kuat. Tantangan utama terletak pada jarak antara kebersamaan yang dirasakan dan harapan tim.",
  actionOwner: "Wakil Kepala Sekolah Bidang SDM",
  reviewCadence: "Mingguan dan bulanan",
  targetDate: "22 Oktober 2026",
  nextReview: "31 Juli 2026",
  meaningSignals: [
    {
      icon: "quality",
      title: "Berorientasi pada mutu",
      detail: "Pencapaian, kualitas layanan, dan reputasi menjadi fokus utama."
    },
    {
      icon: "target",
      title: "Akuntabilitas jelas",
      detail: "Pimpinan menekankan target, tindak lanjut, dan kepemilikan hasil."
    },
    {
      icon: "award",
      title: "Daya saing menjadi pendorong",
      detail: "Perbandingan performa membantu lembaga menjaga standar."
    },
    {
      icon: "institution",
      title: "Capaian unggul diprioritaskan",
      detail: "Keunggulan relatif terhadap lembaga sejenis mendapat perhatian."
    },
    {
      icon: "collaboration",
      title: "Keberhasilan perlu diseimbangkan",
      detail: "Mutu hasil perlu ditopang relasi dan kolaborasi yang konsisten."
    }
  ],
  dimensions: [
    {
      key: "family",
      label: "Kekeluargaan",
      shortLabel: "Relasi dan kebersamaan",
      icon: "family",
      current: 75.38,
      target: 88.25,
      gap: 12.88,
      status: "Perlu perhatian",
      descriptor: "Kehangatan dan kebersamaan",
      interpretation:
        "Dukungan antaranggota sudah terasa, tetapi belum konsisten dalam ritme kerja sehari-hari. Gap terbesar menunjukkan kebutuhan intervensi paling kuat.",
      focus: "Bangun kolaborasi yang rutin, bukan hanya kebersamaan sesekali.",
      priorityActions: [
        "Buat check-in tim selama 15 menit setiap minggu.",
        "Bangun pola pendampingan antarrekan lintas unit.",
        "Adakan forum dengar staf dan tetapkan pemilik tindak lanjut."
      ],
      phases: [
        {
          day: 30,
          title: "Bangun ritme",
          summary: "Ciptakan kebiasaan kolaborasi lewat pertemuan singkat yang konsisten.",
          actions: [
            "Check-in 15 menit setiap minggu dengan agenda progres, kendala, dan dukungan.",
            "Rotasi fasilitator mingguan agar semua anggota terlibat.",
            "Dokumentasikan kesepakatan dan follow-up setiap pertemuan."
          ]
        },
        {
          day: 60,
          title: "Perkuat pendampingan",
          summary: "Ciptakan dukungan antarrekan dan kolaborasi nyata.",
          actions: [
            "Terapkan mentoring sebaya untuk kelompok kecil lintas tim.",
            "Tetapkan target kolaborasi kecil yang terukur per tim.",
            "Berikan umpan balik singkat dan apresiasi atas kemajuan."
          ]
        },
        {
          day: 90,
          title: "Dengar dan evaluasi",
          summary: "Pastikan suara semua terdengar dan tindak lanjut berjalan.",
          actions: [
            "Laksanakan forum dengar setiap bulan untuk semua staf.",
            "Tetapkan pemilik tindak lanjut dan batas waktu yang jelas.",
            "Evaluasi dan perbarui rencana berdasarkan umpan balik."
          ]
        }
      ],
      indicators: [
        {
          icon: "family",
          title: "Partisipasi aktif",
          detail: "Minimal 90% staf mengikuti check-in mingguan secara konsisten."
        },
        {
          icon: "collaboration",
          title: "Kolaborasi nyata",
          detail: "Minimal 80% tim memiliki aktivitas kolaborasi lintas peran."
        },
        {
          icon: "quality",
          title: "Skor meningkat",
          detail: "Skor Kekeluargaan meningkat minimal 10% dalam 90 hari."
        }
      ],
      warnings: [
        "Check-in tidak konsisten atau hanya menjadi formalitas.",
        "Tindak lanjut forum dengar tidak jelas pemiliknya.",
        "Beban kerja tinggi menghambat partisipasi staf."
      ],
      targetImpact: "Skor Kekeluargaan minimal 80%"
    },
    {
      key: "innovation",
      label: "Inovasi",
      shortLabel: "Kreativitas dan perbaikan",
      icon: "innovation",
      current: 76,
      target: 87,
      gap: 11,
      status: "Ringan",
      descriptor: "Kreativitas dan perbaikan",
      interpretation:
        "Ruang eksperimen sudah tersedia, tetapi ide belum selalu berubah menjadi praktik yang teruji dan terdokumentasi.",
      focus: "Ubah ide perbaikan menjadi eksperimen kecil yang aman dan terukur.",
      priorityActions: [
        "Pilih satu tantangan layanan untuk diuji setiap bulan.",
        "Tetapkan hipotesis, pemilik eksperimen, dan ukuran keberhasilan.",
        "Bagikan pembelajaran, termasuk eksperimen yang belum berhasil."
      ],
      phases: [
        {
          day: 30,
          title: "Pilih tantangan",
          summary: "Tentukan satu masalah nyata yang layak diuji.",
          actions: [
            "Kumpulkan ide dari staf dan prioritaskan berdasarkan dampak.",
            "Bentuk tim eksperimen kecil lintas peran.",
            "Tetapkan ukuran keberhasilan yang sederhana."
          ]
        },
        {
          day: 60,
          title: "Jalankan eksperimen",
          summary: "Uji ide dalam skala kecil tanpa mengganggu layanan utama.",
          actions: [
            "Jalankan eksperimen selama dua sampai empat minggu.",
            "Catat perubahan, kendala, dan respons pengguna.",
            "Lakukan review singkat setiap pekan."
          ]
        },
        {
          day: 90,
          title: "Skalakan pembelajaran",
          summary: "Pilih praktik yang layak diterapkan lebih luas.",
          actions: [
            "Bandingkan hasil dengan baseline.",
            "Dokumentasikan praktik yang terbukti efektif.",
            "Tentukan keputusan: lanjut, ubah, atau hentikan."
          ]
        }
      ],
      indicators: [
        {
          icon: "innovation",
          title: "Ide diuji",
          detail: "Minimal satu eksperimen per unit setiap bulan."
        },
        {
          icon: "target",
          title: "Ukuran jelas",
          detail: "Setiap eksperimen memiliki indikator hasil."
        },
        {
          icon: "quality",
          title: "Praktik diadopsi",
          detail: "Pembelajaran terbaik diterapkan lintas unit."
        }
      ],
      warnings: [
        "Eksperimen terlalu besar dan sulit dievaluasi.",
        "Kegagalan diperlakukan sebagai kesalahan personal.",
        "Pembelajaran tidak terdokumentasi."
      ],
      targetImpact: "Minimal 4 eksperimen terukur per kuartal"
    },
    {
      key: "orientation",
      label: "Orientasi",
      shortLabel: "Arah tujuan dan hasil",
      icon: "orientation",
      current: 76.31,
      target: 87,
      gap: 10.69,
      status: "Selaras",
      descriptor: "Arah tujuan dan hasil",
      interpretation:
        "Arah dan target lembaga sudah cukup jelas. Tantangan berikutnya adalah memastikan capaian tidak mengorbankan kualitas relasi dan keberlanjutan kerja.",
      focus: "Pertahankan kejelasan target sambil menyeimbangkan kualitas proses.",
      priorityActions: [
        "Turunkan target lembaga menjadi hasil yang dipahami setiap unit.",
        "Tambahkan indikator kualitas proses di samping hasil akhir.",
        "Lakukan review kapasitas sebelum menetapkan target baru."
      ],
      phases: [
        {
          day: 30,
          title: "Selaraskan target",
          summary: "Pastikan setiap unit memahami kontribusinya pada tujuan lembaga.",
          actions: [
            "Petakan target lembaga ke setiap unit.",
            "Konfirmasi pemahaman dan kapasitas tim.",
            "Tentukan indikator hasil dan kualitas proses."
          ]
        },
        {
          day: 60,
          title: "Pantau kualitas",
          summary: "Seimbangkan kecepatan pencapaian dengan mutu proses.",
          actions: [
            "Review capaian dan beban kerja secara bersamaan.",
            "Identifikasi hambatan lintas unit.",
            "Perbaiki target yang tidak lagi relevan."
          ]
        },
        {
          day: 90,
          title: "Konsolidasikan",
          summary: "Gunakan pembelajaran untuk siklus target berikutnya.",
          actions: [
            "Bandingkan hasil dengan kualitas proses.",
            "Apresiasi kontribusi tim secara proporsional.",
            "Tetapkan perbaikan untuk kuartal berikutnya."
          ]
        }
      ],
      indicators: [
        {
          icon: "target",
          title: "Target dipahami",
          detail: "Minimal 90% staf memahami target unit."
        },
        {
          icon: "quality",
          title: "Mutu terjaga",
          detail: "Kualitas layanan tidak menurun saat target meningkat."
        },
        {
          icon: "collaboration",
          title: "Beban seimbang",
          detail: "Tidak ada unit dengan beban tidak proporsional."
        }
      ],
      warnings: [
        "Target baru muncul tanpa penyesuaian kapasitas.",
        "Kecepatan lebih dihargai daripada kualitas.",
        "Kontribusi kolaboratif tidak terlihat."
      ],
      targetImpact: "Minimal 90% target unit dipahami staf"
    },
    {
      key: "rules",
      label: "Aturan",
      shortLabel: "Kepatuhan dan proses",
      icon: "rules",
      current: 72.5,
      target: 84.63,
      gap: 12.13,
      status: "Perlu perhatian",
      descriptor: "Kepatuhan dan kejelasan proses",
      interpretation:
        "Aturan tersedia, tetapi konsistensi penerapan dan kejelasan alasan di balik proses masih perlu diperkuat.",
      focus: "Sederhanakan aturan penting dan pastikan penerapannya konsisten.",
      priorityActions: [
        "Petakan aturan yang paling sering menimbulkan kebingungan.",
        "Sederhanakan panduan menjadi keputusan yang mudah dipakai.",
        "Buat kanal klarifikasi dengan waktu respons yang jelas."
      ],
      phases: [
        {
          day: 30,
          title: "Petakan friksi",
          summary: "Temukan aturan yang paling sering menghambat pekerjaan.",
          actions: [
            "Kumpulkan contoh kebingungan dari setiap unit.",
            "Kelompokkan isu berdasarkan frekuensi dan dampak.",
            "Pilih tiga proses utama untuk diperbaiki."
          ]
        },
        {
          day: 60,
          title: "Sederhanakan proses",
          summary: "Ubah aturan menjadi panduan keputusan yang jelas.",
          actions: [
            "Tulis ulang panduan dalam bahasa operasional.",
            "Uji panduan dengan pengguna lintas peran.",
            "Tetapkan jalur eskalasi untuk kasus khusus."
          ]
        },
        {
          day: 90,
          title: "Jaga konsistensi",
          summary: "Pastikan aturan diterapkan dengan cara yang sama.",
          actions: [
            "Lakukan audit penerapan pada sampel proses.",
            "Review pengecualian dan alasan keputusan.",
            "Perbarui panduan berdasarkan temuan."
          ]
        }
      ],
      indicators: [
        {
          icon: "rules",
          title: "Panduan dipahami",
          detail: "Minimal 90% staf memahami tiga proses utama."
        },
        {
          icon: "target",
          title: "Respons lebih cepat",
          detail: "Waktu klarifikasi turun dibanding baseline."
        },
        {
          icon: "quality",
          title: "Penerapan konsisten",
          detail: "Variasi keputusan antartim berkurang."
        }
      ],
      warnings: [
        "Aturan bertambah tanpa menghapus proses lama.",
        "Pengecualian tidak terdokumentasi.",
        "Staf menghindari proses karena terlalu rumit."
      ],
      targetImpact: "Tiga proses prioritas dipahami minimal 90% staf"
    }
  ]
};
