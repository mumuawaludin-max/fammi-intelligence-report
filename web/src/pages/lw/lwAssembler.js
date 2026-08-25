import { LEAD_ASPEK_INFO, LEAD_ASPEK_URUTAN, PROTEK_DIMENSI_INFO, PROTEK_DIMENSI_URUTAN, leadKategoriTone, protekKategoriTone } from "./lwMeta";

/**
 * rakitLaporanLw -- padanan rakitLaporanPa/useScAgregat: mengubah baris Supabase mentah (sudah
 * final dari sumbernya) menjadi bentuk `laporan` siap-pakai LwLaporanPage/LwLaporanIndividuPage.
 * TIDAK menghitung skor atau kategori baru -- hanya merangkai ulang (mapping label, penggabungan
 * daftar) dari angka yang sudah final di lw_lembaga/lw_personal/tindak_lanjut/briefing.
 */
export function rakitLaporanLw({ sekolahNama, lembagaRow, personalRows, tlRows, briefingRow }) {
  if (!lembagaRow) return null;

  const meta = {
    organisasiNama: sekolahNama,
    periodeId: lembagaRow.periode_id,
    jumlahKandidat: personalRows.length,
  };

  const kesiapan = {
    distribusi: (lembagaRow.lead_distribusi || []).map((d) => ({ ...d, toneVar: leadKategoriTone(d.kategori) })),
    aspek: LEAD_ASPEK_URUTAN.map((kode) => {
      const row = (lembagaRow.lead_aspek || []).find((a) => a.kode === kode);
      return { kode, label: LEAD_ASPEK_INFO[kode].label, nilai: row?.nilai ?? 0 };
    }),
    topSkill: lembagaRow.lead_top_skill || [],
    skillGap: lembagaRow.lead_skill_gap || [],
    kandidat: personalRows.map((p) => ({
      id: p.id,
      nama: p.nama,
      unit: p.unit,
      isKepsek: p.is_kepsek_saat_ini,
      kesiapanSkor: p.kesiapan_memimpin_skor,
      kesiapanKategori: p.kesiapan_memimpin_kategori,
      kondisiSkor: p.kondisi_psikologis_skor,
      kondisiKategori: p.kondisi_psikologis_kategori,
    })),
  };

  const perbandingan = PROTEK_DIMENSI_URUTAN.map((kode) => {
    const row = (lembagaRow.protek_dimensi || []).find((d) => d.kode === kode);
    return {
      key: kode,
      label: PROTEK_DIMENSI_INFO[kode].label,
      baikPersen: row?.baik_persen ?? 0,
      baikJumlah: row?.baik_jumlah ?? 0,
      perluPerhatianPersen: row?.perlu_perhatian_persen ?? 0,
      perluPerhatianJumlah: row?.perlu_perhatian_jumlah ?? 0,
      waspadaPersen: row?.waspada_persen ?? 0,
      waspadaJumlah: row?.waspada_jumlah ?? 0,
    };
  });

  const temuanPerDimensi = new Map();
  for (const t of lembagaRow.protek_temuan_spesifik || []) {
    if (!temuanPerDimensi.has(t.dimensi)) temuanPerDimensi.set(t.dimensi, []);
    temuanPerDimensi.get(t.dimensi).push({ pernyataan: t.pernyataan, persen: t.persen, jumlah: t.jumlah });
  }

  // Ringkasan per dimensi untuk kartu HEART-style: DIAMBIL dari lembagaRow.protek_dimensi
  // (angka final dokumen sumber, mis. E=13% bukan 12.5%), BUKAN di-tally ulang dari personal.
  const ringkasanKesehatan = PROTEK_DIMENSI_URUTAN.map((kode) => {
    const info = PROTEK_DIMENSI_INFO[kode];
    const row = (lembagaRow.protek_dimensi || []).find((d) => d.kode === kode);
    return {
      kode,
      huruf: info.icon,
      label: info.label,
      deskripsi: info.deskripsi,
      baik: { persen: row?.baik_persen ?? 0, jumlah: row?.baik_jumlah ?? 0 },
      perluPerhatian: { persen: row?.perlu_perhatian_persen ?? 0, jumlah: row?.perlu_perhatian_jumlah ?? 0 },
      waspada: { persen: row?.waspada_persen ?? 0, jumlah: row?.waspada_jumlah ?? 0 },
    };
  });

  // Tally kategori final per unit dari baris personal -- BUKAN menghitung skor/status baru,
  // cuma menghitung berapa orang per kategori yang sudah final (preseden tally sebaran di
  // useScData.js). Persen di sini murni tally tampilan; angka organisasi tetap dari lembagaRow.
  const unitUrutan = [];
  for (const p of personalRows) {
    if (!unitUrutan.includes(p.unit)) unitUrutan.push(p.unit);
  }
  const perUnitKesehatan = unitUrutan.map((unit) => {
    const guruUnit = personalRows.filter((p) => p.unit === unit);
    return {
      unit,
      jumlahGuru: guruUnit.length,
      dimensi: PROTEK_DIMENSI_URUTAN.map((kode) => {
        const info = PROTEK_DIMENSI_INFO[kode];
        let baik = 0, perluPerhatian = 0, waspada = 0;
        for (const p of guruUnit) {
          const kategori = (p.protek_dimensi || []).find((d) => d.kode === kode)?.kategori;
          if (kategori === "Perlu Perhatian") perluPerhatian += 1;
          else if (kategori === "Waspada" || kategori === "Perlu Konsultasi") waspada += 1;
          else baik += 1;
        }
        const persen = (n) => (guruUnit.length ? Math.round((n / guruUnit.length) * 100) : 0);
        return {
          kode,
          huruf: info.icon,
          label: info.label,
          baik: { persen: persen(baik), jumlah: baik },
          perluPerhatian: { persen: persen(perluPerhatian), jumlah: perluPerhatian },
          waspada: { persen: persen(waspada), jumlah: waspada },
        };
      }),
    };
  });

  // Daftar guru non-Baik per dimensi untuk dialog "Lihat Daftar Nama" -- murni filter kategori
  // final di lw_personal.protek_dimensi, terurut skor terendah dulu (paling perlu perhatian).
  const daftarPerhatian = {};
  for (const kode of PROTEK_DIMENSI_URUTAN) {
    daftarPerhatian[kode] = personalRows
      .map((p) => {
        const d = (p.protek_dimensi || []).find((x) => x.kode === kode);
        return d && d.kategori && d.kategori !== "Baik"
          ? { id: p.id, nama: p.nama, unit: p.unit, nilai: d.nilai, kategori: d.kategori }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => (a.nilai ?? 0) - (b.nilai ?? 0));
  }

  const kesehatan = {
    ringkasan: ringkasanKesehatan,
    perUnit: perUnitKesehatan,
    daftarPerhatian,
    distribusi: (lembagaRow.protek_distribusi || []).map((d) => ({ ...d, toneVar: protekKategoriTone(d.kategori) })),
    dimensi: PROTEK_DIMENSI_URUTAN.map((kode) => {
      // Nilai rata-rata dimensi (skala 0-42) dirakit dari rata-rata skor final tiap kandidat --
      // bukan dihitung dari rumus baru, murni rata-rata angka yang sudah final per orang.
      const nilaiRows = personalRows
        .map((p) => (p.protek_dimensi || []).find((d) => d.kode === kode)?.nilai)
        .filter((v) => v != null);
      const nilai = nilaiRows.length ? nilaiRows.reduce((a, b) => a + b, 0) / nilaiRows.length : 0;
      return { kode, label: PROTEK_DIMENSI_INFO[kode].label, nilai: Math.round(nilai * 10) / 10 };
    }),
    perbandingan,
    temuanSpesifik: PROTEK_DIMENSI_URUTAN.map((kode) => ({
      dimensi: PROTEK_DIMENSI_INFO[kode].label,
      temuan: temuanPerDimensi.get(PROTEK_DIMENSI_INFO[kode].label) || [],
    })),
  };

  const pengembangan = {
    pelatihan: (tlRows || []).map((t) => ({
      key: t.id,
      judul: t.title,
      dimensi: t.dimensi,
      teaser: t.teaser,
      mengapaData: t.mengapa_data,
      learningOutcome: t.manfaat?.learning_outcome,
      catatan: (t.hal_diwaspadai || [])[0],
    })),
    cerita: personalRows.flatMap((p) =>
      (p.cerita_terbaik || []).map((c, i) => ({
        key: `${p.id}-${i}`, tema: c.judul, isi: c.isi, bulletPoin: c.bullet_poin, nama: p.nama, unit: p.unit,
      }))
    ),
  };

  const personalById = {};
  for (const p of personalRows) {
    personalById[p.id] = {
      nama: p.nama,
      unit: p.unit,
      isKepsek: p.is_kepsek_saat_ini,
      kesiapanSkor: p.kesiapan_memimpin_skor,
      kesiapanKategori: p.kesiapan_memimpin_kategori,
      kondisiSkor: p.kondisi_psikologis_skor,
      kondisiKategori: p.kondisi_psikologis_kategori,
      kondisiLabel: p.kondisi_psikologis_label,
      leadAspek: LEAD_ASPEK_URUTAN.map((kode) => ({
        kode, label: LEAD_ASPEK_INFO[kode].label,
        nilai: (p.lead_aspek || []).find((a) => a.kode === kode)?.nilai ?? 0,
      })),
      protekDimensi: PROTEK_DIMENSI_URUTAN.map((kode) => {
        const row = (p.protek_dimensi || []).find((d) => d.kode === kode);
        return { kode, label: PROTEK_DIMENSI_INFO[kode].label, nilai: row?.nilai ?? 0, kategori: row?.kategori || "Baik" };
      }),
      narasi: p.narasi_pengalaman || [],
      ceritaTerbaik: (p.cerita_terbaik || []).map((c) => ({ judul: c.judul, isi: c.isi, bulletPoin: c.bullet_poin })),
    };
  }

  return {
    meta,
    briefing: briefingRow ? { teks: briefingRow.teks } : null,
    kesiapan,
    kesehatan,
    pengembangan,
    personalById,
  };
}
