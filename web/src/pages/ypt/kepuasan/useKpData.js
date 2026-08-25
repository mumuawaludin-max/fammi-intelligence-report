import { useEffect, useMemo, useState } from "react";
import { supabase, fetchAllRows } from "../../../lib/supabase";
import { KP_METRIK, KP_PERAN } from "../yptMeta";

/**
 * Data menu Survey Kepuasan.
 *
 * Sumbernya kp_responden, yang diisi Edge Function sync-ypt-sheets dari spreadsheet respons form
 * yang terus bertambah. Volumenya kecil (ratusan baris per periode), jadi seluruh baris periode
 * ini ditarik lalu diringkas di klien -- tidak perlu view agregat seperti Rapor Karakter.
 *
 * Semua rata-rata di sini SEDERHANA (bukan tertimbang): satu responden satu suara, apa pun
 * sekolahnya. Ini beda disengaja dengan Rapor Karakter yang tertimbang jumlah siswa; di sana yang
 * dirata-rata adalah pencapaian siswa, di sini pendapat orang.
 */
export function useKpData(session, periode) {
  const [state, setState] = useState({ loading: true, error: null, rows: [] });
  const sekolahList = useMemo(() => session?.schools || [], [session]);
  const key = sekolahList.map((s) => s.id).join(",");

  useEffect(() => {
    let alive = true;
    const ids = sekolahList.map((s) => s.id);
    if (ids.length === 0 || !periode) {
      setState({ loading: false, error: null, rows: [] });
      return;
    }

    async function run() {
      setState((s) => ({ ...s, loading: true, error: null }));

      const res = await fetchAllRows((from, to) => supabase.from("kp_responden")
        .select("id, sekolah_id, peran_responden, status_baca, tindak_lanjut, metrik, skor_total, esai_disukai, esai_saran")
        .in("sekolah_id", ids).eq("periode_id", periode).range(from, to));

      if (!alive) return;
      if (res.error) { setState({ loading: false, error: res.error.message, rows: [] }); return; }
      setState({ loading: false, error: null, rows: res.data || [] });
    }

    run();
    return () => { alive = false; };
  }, [key, periode]);

  const data = useMemo(() => {
    const rows = state.rows;
    const metaBySekolah = {};
    sekolahList.forEach((s) => { metaBySekolah[s.id] = s; });

    function rata(list, ambil) {
      const nilai = list.map(ambil).filter((n) => n != null && !Number.isNaN(n));
      if (nilai.length === 0) return null;
      return nilai.reduce((a, b) => a + b, 0) / nilai.length;
    }

    /** Ringkasan satu kelompok responden: jumlah orang, skor /10, dan rata tiap metrik /5. */
    function ringkas(list) {
      return {
        jumlah: list.length,
        skorTotal: rata(list, (r) => (r.skor_total == null ? null : Number(r.skor_total))),
        metrik: KP_METRIK.map((m) => ({
          ...m,
          nilai: rata(list, (r) => {
            const v = r.metrik?.[m.id];
            return v == null ? null : Number(v);
          }),
        })),
      };
    }

    const perPeran = KP_PERAN.map((p) => ({
      ...p,
      ...ringkas(rows.filter((r) => r.peran_responden === p.id)),
    }));

    // Sekolah + skor per peran, dipakai daftar "Pilih Sekolah" di tab Kualitatif.
    function sekolahUntukPeran(peranId) {
      const byId = {};
      rows.filter((r) => r.peran_responden === peranId).forEach((r) => {
        (byId[r.sekolah_id] ||= []).push(r);
      });
      return Object.entries(byId).map(([id, list]) => ({
        sekolah_id: id,
        nama: metaBySekolah[id]?.nama || id,
        ...ringkas(list),
        // Esai digabung dari seluruh responden peran itu di sekolah ini. Jawaban kosong atau
        // berisi strip ("-", "_") disaring: itu cara responden melewati pertanyaan, bukan jawaban.
        esaiDisukai: list.map((r) => r.esai_disukai).filter(layak),
        esaiSaran: list.map((r) => r.esai_saran).filter(layak),
        statusBaca: hitungDistribusi(list, (r) => r.status_baca),
        tindakLanjut: hitungDistribusiArray(list, (r) => r.tindak_lanjut),
      })).sort((a, b) => (b.skorTotal ?? -1) - (a.skorTotal ?? -1));
    }

    return {
      totalResponden: rows.length,
      perPeran,
      sekolahUntukPeran,
      keseluruhan: ringkas(rows),
    };
  }, [state.rows, sekolahList]);

  return { loading: state.loading, error: state.error, data };
}

function layak(teks) {
  const t = (teks || "").trim();
  return t.length > 3 && !/^[-_.\s]+$/.test(t);
}

function hitungDistribusi(list, ambil) {
  const map = {};
  list.forEach((r) => {
    const v = (ambil(r) || "").trim();
    if (v) map[v] = (map[v] || 0) + 1;
  });
  return Object.entries(map).map(([nama, jumlah]) => ({ nama, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah);
}

function hitungDistribusiArray(list, ambil) {
  const map = {};
  list.forEach((r) => {
    (ambil(r) || []).forEach((v) => {
      const t = (v || "").trim();
      if (t) map[t] = (map[t] || 0) + 1;
    });
  });
  return Object.entries(map).map(([nama, jumlah]) => ({ nama, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah);
}
