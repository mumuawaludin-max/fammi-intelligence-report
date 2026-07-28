import type { IndividualReport } from "../types/individual";

export const sampleIndividualReport: IndividualReport = {
  reportId: "IND-2026-NF-128",
  personName: "Syarif",
  salutation: "Pak",
  role: "Pimpinan Unit",
  unit: "NON-UNIT NFIS",
  schoolName: "Manajemen Yayasan Pendidikan Nurul Fikri",
  period: "Semester Genap 2025/2026",
  aspiration:
    "Imbangi aktivitas kerja yang serius dengan kegiatan yang lebih santai dan kebersamaan, agar suasana gembira tetap terjaga.",
  signals: [
    {
      key: "strength",
      eyebrow: "Kekuatan yang dijaga",
      value: "Kenyamanan bekerja",
      detail: "Anda merasakan lingkungan kerja yang aman dan mendukung."
    },
    {
      key: "focus",
      eyebrow: "Fokus 30 hari",
      value: "Pengembangan diri",
      detail: "Satu kebiasaan kecil dapat memperkuat cara Anda mengelola prioritas."
    },
    {
      key: "support",
      eyebrow: "Dukungan yang dibutuhkan",
      value: "Kejelasan prioritas",
      detail: "Arah yang lebih jelas membantu energi tetap selaras dengan tujuan."
    }
  ],
  cultureDimensions: [
    {
      key: "family",
      label: "Kekeluargaan",
      current: 72,
      target: 86,
      gap: 14,
      interpretation:
        "Anda mengharapkan kebersamaan yang lebih konsisten hadir dalam ritme kerja."
    },
    {
      key: "innovation",
      label: "Inovasi",
      current: 74,
      target: 84,
      gap: 10,
      interpretation:
        "Ruang mencoba hal baru sudah terasa, tetapi dukungan praktiknya belum merata."
    },
    {
      key: "orientation",
      label: "Orientasi",
      current: 79,
      target: 87,
      gap: 8,
      interpretation:
        "Arah hasil relatif jelas dan menjadi dimensi paling dekat dengan harapan."
    },
    {
      key: "rules",
      label: "Aturan",
      current: 65,
      target: 83,
      gap: 18,
      interpretation:
        "Kejelasan proses menjadi jarak terbesar, tetapi tidak seluruhnya berada dalam kendali Anda."
    }
  ],
  wellbeingDimensions: [
    {
      key: "leadership",
      label: "Kepuasan kepemimpinan",
      score: 73,
      organizationScore: 85,
      descriptor: "Kepercayaan dan keterbukaan dari pimpinan.",
      signal: "steady",
      distribution: { positive: 63, neutral: 24, negative: 13 }
    },
    {
      key: "comfort",
      label: "Kenyamanan bekerja",
      score: 92,
      organizationScore: 93,
      descriptor: "Rasa aman dan nyaman dalam pekerjaan sehari-hari.",
      signal: "strength",
      distribution: { positive: 88, neutral: 8, negative: 4 }
    },
    {
      key: "growth",
      label: "Pengembangan diri",
      score: 67,
      organizationScore: 87,
      descriptor: "Kesempatan belajar dan berkembang melalui pekerjaan.",
      signal: "attention",
      distribution: { positive: 52, neutral: 29, negative: 19 }
    },
    {
      key: "expectation",
      label: "Pemenuhan ekspektasi",
      score: 87,
      organizationScore: 88,
      descriptor: "Kejelasan peran dan rasa bangga terhadap kontribusi.",
      signal: "steady",
      distribution: { positive: 81, neutral: 13, negative: 6 }
    },
    {
      key: "balance",
      label: "Keseimbangan kehidupan–bekerja",
      score: 80,
      organizationScore: 86,
      descriptor: "Kemampuan menjaga energi di dalam dan di luar pekerjaan.",
      signal: "steady",
      distribution: { positive: 72, neutral: 18, negative: 10 }
    }
  ],
  contributionInsight:
    "Peran Anda paling berdampak ketika prioritas unit diterjemahkan menjadi keputusan kerja yang jelas.",
  roleContribution: [
    {
      key: "strategy",
      title: "Fokus strategi",
      detail: "Arah utama sekolah yang menjadi panduan bersama."
    },
    {
      key: "priority",
      title: "Prioritas unit",
      detail: "Pilihan unit yang paling mendukung strategi sekolah."
    },
    {
      key: "habit",
      title: "Kebiasaan kerja",
      detail: "Keputusan harian yang menghasilkan dampak nyata."
    }
  ],
  reflections: [
    {
      key: "energy",
      label: "Sumber energi",
      summary: "Kesempatan bertumbuh, kepercayaan, dan memberi inspirasi.",
      originalAnswer:
        "Ruang untuk bertumbuh dan banyaknya kesempatan serta kepercayaan yang diberikan membuat saya berkembang."
    },
    {
      key: "drain",
      label: "Penguras energi",
      summary: "Persoalan di luar kewenangan yang tetap terasa sebagai tanggung jawab.",
      originalAnswer:
        "Kondisi di luar kewenangan sering membuat saya ikut memikirkan solusi dan turun tangan."
    },
    {
      key: "change",
      label: "Perubahan yang diharapkan",
      summary: "Ritme kerja serius yang tetap memberi ruang kebersamaan.",
      originalAnswer:
        "Saya berharap aktivitas kerja serius diimbangi kegiatan yang lebih santai dan kebersamaan."
    }
  ],
  agencyTerritories: [
    {
      key: "control",
      title: "Dalam kendali saya",
      description: "Mulai dari sini untuk membangun momentum.",
      items: [
        "Menentukan tiga prioritas mingguan",
        "Mencatat pola yang menguras energi",
        "Memilih satu kemampuan untuk dilatih"
      ]
    },
    {
      key: "influence",
      title: "Bisa saya pengaruhi",
      description: "Lakukan melalui percakapan dan kolaborasi.",
      items: [
        "Mengajak rekan melakukan check-in",
        "Menyampaikan kebutuhan dukungan",
        "Mengusulkan pembagian kerja lebih jelas"
      ]
    },
    {
      key: "system",
      title: "Membutuhkan dukungan sistem",
      description: "Bawa ke ruang keputusan yang tepat.",
      items: [
        "Beban kerja lintas unit",
        "Kejelasan kebijakan",
        "Akses pendampingan"
      ]
    }
  ],
  focusArea: "Pengembangan diri",
  focusReason:
    "Skor Anda berada 20 poin di bawah gambaran lembaga. Ini bukan vonis kinerja, melainkan sinyal bahwa kesempatan belajar dan pengelolaan prioritas perlu dibicarakan.",
  actions: [
    {
      id: "weekly-priorities",
      title: "Tentukan tiga prioritas setiap Senin",
      effort: "10 menit",
      locus: "control",
      recommended: true,
      rationale: "Membantu memisahkan tanggung jawab utama dari persoalan tambahan.",
      defaults: {
        firstStep:
          "Tuliskan tiga pekerjaan terpenting sebelum memulai aktivitas hari Senin.",
        frequency: "Setiap Senin",
        evidence: "Tiga prioritas tercatat dan direview pada akhir pekan.",
        support: "Konfirmasi prioritas bersama pimpinan unit."
      }
    },
    {
      id: "energy-pattern",
      title: "Catat satu pola penguras energi",
      effort: "5 menit",
      locus: "control",
      rationale: "Membantu membedakan masalah sesaat dari pola kerja yang perlu diperbaiki.",
      defaults: {
        firstStep: "Catat situasi, pemicu, dan dukungan yang dibutuhkan.",
        frequency: "Dua kali seminggu",
        evidence: "Tiga pola utama teridentifikasi setelah dua minggu.",
        support: "Ruang refleksi tanpa penilaian dari atasan."
      }
    },
    {
      id: "priority-confirmation",
      title: "Minta konfirmasi prioritas kepada pimpinan",
      effort: "15 menit",
      locus: "influence",
      rationale: "Menyelaraskan energi kerja dengan ekspektasi yang paling penting.",
      defaults: {
        firstStep: "Bawa daftar prioritas ke percakapan satu-lawan-satu berikutnya.",
        frequency: "Setiap dua minggu",
        evidence: "Ada kesepakatan tertulis mengenai prioritas dan hal yang ditunda.",
        support: "Waktu check-in singkat dengan pimpinan."
      }
    }
  ],
  checkIns: [
    {
      id: "checkin-1",
      sequence: 1,
      date: "31 Juli 2026",
      title: "Refleksi dan penyesuaian awal"
    },
    {
      id: "checkin-2",
      sequence: 2,
      date: "14 Agustus 2026",
      title: "Evaluasi pertengahan"
    },
    {
      id: "checkin-3",
      sequence: 3,
      date: "31 Agustus 2026",
      title: "Refleksi akhir dan langkah berikutnya"
    }
  ]
};
