import { PROTEK_URUTAN, PROTEK_INFO, katDimensi, labelPeriode } from "./lwMeta";

/**
 * rakitLaporanLw -- padanan rakitLaporanPa/useScAgregat: mengubah baris mentah Supabase
 * (lw_lembaga, lw_personal, tindak_lanjut, briefing) menjadi bentuk laporan siap-pakai
 * komponen tampilan.
 *
 * FIR tidak menghitung skor atau kategori baru. Yang dilakukan di sini hanya merangkai ulang:
 * memilih baris periode, memetakan label, dan men-tally kategori yang SUDAH final per guru
 * untuk kebutuhan peta jenjang x dimensi. Tally kategori final adalah preseden yang sudah
 * dipakai useScData.js untuk sebaran School Culture.
 */
export function rakitLaporanLw({ sekolahNama, lembagaRows, personalRows, tlRows, briefingRows }) {
  const lembaga = lembagaRows || [];
  const personal = personalRows || [];
  if (lembaga.length === 0 || personal.length === 0) return null;

  const periodeList = Array.from(new Set(lembaga.map((r) => r.periode_id))).sort();
  const periodeTerakhir = periodeList[periodeList.length - 1];
  const unitList = Array.from(new Set(personal.map((r) => r.unit)));

  const yayasanRow = (per) => lembaga.find((r) => r.periode_id === per && !r.unit) || null;
  const unitRow = (per, unit) => lembaga.find((r) => r.periode_id === per && r.unit === unit) || null;

  /** Data satu periode, dipakai ulang oleh seluruh layar. */
  function periode(per) {
    const y = yayasanRow(per);
    if (!y) return null;
    const guru = personal.filter((r) => r.periode_id === per);

    // Dimensi tingkat yayasan: angka final dari lw_lembaga, bukan dihitung ulang di sini.
    const dimensi = PROTEK_URUTAN.map((kode) => {
      const row = (y.protek_dimensi || []).find((d) => d.kode === kode) || {};
      const info = PROTEK_INFO[kode];
      return {
        kode,
        label: info.label,
        pendek: info.pendek,
        ringkas: info.ringkas,
        deskripsi: info.deskripsi,
        arti: info.arti,
        nilai: Number(row.nilai ?? 0),
        baik: { jumlah: row.baik_jumlah ?? 0, persen: row.baik_persen ?? 0 },
        perluPerhatian: { jumlah: row.perlu_perhatian_jumlah ?? 0, persen: row.perlu_perhatian_persen ?? 0 },
        waspada: { jumlah: row.waspada_jumlah ?? 0, persen: row.waspada_persen ?? 0 },
      };
    });

    // Peta jenjang x dimensi: tally nilai final tiap guru per unit.
    const perUnit = unitList.map((unit) => {
      const list = guru.filter((g) => g.unit === unit);
      const row = unitRow(per, unit);
      return {
        unit,
        jumlahGuru: list.length,
        indeks: Number(row?.indeks ?? 0),
        dimensi: PROTEK_URUTAN.map((kode) => {
          const nilaiList = list.map((g) => (g.protek_dimensi || []).find((d) => d.kode === kode)?.nilai ?? 0);
          const rerata = nilaiList.length ? nilaiList.reduce((a, b) => a + b, 0) / nilaiList.length : 0;
          const hitung = (kat) => nilaiList.filter((v) => katDimensi(v) === kat).length;
          const n = nilaiList.length || 1;
          const b = hitung("Baik"), p = hitung("Perlu Perhatian"), w = hitung("Waspada");
          return {
            kode,
            label: PROTEK_INFO[kode].label,
            nilai: Math.round(rerata * 100) / 100,
            baik: { jumlah: b, persen: Math.round((b / n) * 100) },
            perluPerhatian: { jumlah: p, persen: Math.round((p / n) * 100) },
            waspada: { jumlah: w, persen: Math.round((w / n) * 100) },
          };
        }),
      };
    });

    return {
      periodeId: per,
      label: labelPeriode(per),
      labelPendek: labelPeriode(per, true),
      indeks: Number(y.indeks ?? 0),
      jumlahGuru: y.jumlah_guru ?? guru.length,
      distribusi: y.protek_distribusi || [],
      dimensi,
      perUnit,
      temuanSpesifik: y.protek_temuan_spesifik || [],
      narasi: y.narasi || [],
      guru,
    };
  }

  const perPeriode = periodeList.map(periode).filter(Boolean);
  const kini = perPeriode[perPeriode.length - 1];
  const awal = perPeriode[0];

  // Tren indeks: satu deret untuk yayasan, satu per jenjang.
  const trenYayasan = perPeriode.map((p) => ({ periodeId: p.periodeId, label: p.labelPendek, nilai: p.indeks }));
  const trenUnit = unitList.map((unit) => ({
    unit,
    titik: perPeriode.map((p) => ({
      periodeId: p.periodeId,
      label: p.labelPendek,
      nilai: p.perUnit.find((u) => u.unit === unit)?.indeks ?? 0,
    })),
  }));

  // Riwayat skor total tiap guru, dipakai sparkline di daftar prioritas dan grafik individu.
  const trenGuru = {};
  for (const g of personal) {
    if (!trenGuru[g.nama]) trenGuru[g.nama] = [];
    trenGuru[g.nama].push({ periodeId: g.periode_id, label: labelPeriode(g.periode_id, true), total: g.skor_total });
  }
  for (const nama of Object.keys(trenGuru)) {
    trenGuru[nama].sort((a, b) => (a.periodeId < b.periodeId ? -1 : 1));
  }

  // Profil guru pada periode terakhir, lengkap dengan riwayat dan catatan pendampingan.
  const guruDetail = kini.guru
    .map((g) => {
      const dim = PROTEK_URUTAN.map((kode) => {
        const row = (g.protek_dimensi || []).find((d) => d.kode === kode) || {};
        const nilai = row.nilai ?? 0;
        return {
          kode,
          label: PROTEK_INFO[kode].label,
          pendek: PROTEK_INFO[kode].pendek,
          nilai,
          kategori: row.kategori || katDimensi(nilai),
        };
      });
      const lemah = dim.filter((d) => d.kategori !== "Baik").sort((a, b) => a.nilai - b.nilai);
      const tren = trenGuru[g.nama] || [];
      const selisih = tren.length > 1 ? tren[tren.length - 1].total - tren[0].total : 0;
      // Tiga tingkat prioritas. Skor total di bawah Baik atau ada dimensi Waspada berarti
      // ditangani lebih dulu; dimensi tertinggal tanpa itu cukup lewat program kelompok.
      const tingkat = g.kategori_total !== "Baik" || lemah.some((d) => d.kategori === "Waspada")
        ? "segera"
        : lemah.length > 0 ? "pendampingan" : "stabil";
      return {
        id: g.id || `${g.nama}-${g.periode_id}`,
        nama: g.nama,
        unit: g.unit,
        isKepsek: !!g.is_kepsek_saat_ini,
        total: g.skor_total,
        kategoriTotal: g.kategori_total,
        dimensi: dim,
        lemah,
        tingkat,
        tren,
        selisih,
        catatan: g.catatan || null,
        langkah: g.langkah || [],
        refleksi: g.refleksi || [],
      };
    })
    .sort((a, b) => a.total - b.total);

  const guruById = {};
  for (const g of guruDetail) guruById[g.id] = g;

  const tindakLanjut = (tlRows || [])
    .filter((t) => t.periode_id === periodeTerakhir)
    .map((t) => ({
      id: t.id,
      dimensi: t.dimensi,
      judul: t.title,
      teaser: t.teaser,
      mengapa: t.mengapa_data,
      waktu: t.manfaat?.waktu || null,
      sasaran: t.manfaat?.sasaran || null,
      ukuran: t.manfaat?.learning_outcome || null,
      catatan: (t.hal_diwaspadai || [])[0] || null,
      tipe: t.type,
    }));

  const briefing = (briefingRows || []).find((b) => b.periode_id === periodeTerakhir) || null;

  return {
    meta: {
      organisasiNama: sekolahNama,
      periodeTerakhir,
      labelPeriodeTerakhir: labelPeriode(periodeTerakhir),
      jumlahGuru: kini.jumlahGuru,
      jumlahJenjang: unitList.length,
      periodeList,
    },
    briefing,
    perPeriode,
    kini,
    awal,
    trenYayasan,
    trenUnit,
    guru: guruDetail,
    guruById,
    tindakLanjut,
  };
}
