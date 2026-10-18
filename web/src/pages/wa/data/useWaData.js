// Jalur baca modul Wellbeing Assessment dari Supabase. RLS yang menentukan baris mana yang
// kembali (migration 20261020100000):
//   - Human Capital: dataset, semua kelompok, semua individu sekolahnya, narasi KELOMPOK yang
//     sudah disetujui.
//   - Pegawai: dataset, baris individunya sendiri, narasi individu dan respons cerita miliknya
//     yang sudah disetujui.
// Kolom narasi disebut satu per satu karena kolom peninjau (perlu_ahli, alasan_perhatian) tidak
// diberikan ke peran authenticated; select * akan ditolak.
//
// Bentuk keluaran sama persis dengan keluaran pembaca berkas (waPembaca.js), jadi komponen yang
// sama dipakai untuk pratinjau dan produksi.

import { useEffect, useState } from "react";
import { fetchAllRows, supabase } from "../../../lib/supabase";
import { peranWa } from "../lib/waAturan";

function sekolahWa(session) {
  if (session?.modulesBySchool) {
    return Object.keys(session.modulesBySchool).find((id) => session.modulesBySchool[id].includes("wa")) || session.school_id;
  }
  return session?.school_id || null;
}

export function useWaData(session) {
  const [state, setState] = useState({ loading: true, error: null, dataset: null });
  const sekolahId = sekolahWa(session);
  const peran = peranWa(session);

  useEffect(() => {
    let alive = true;
    async function muat() {
      setState({ loading: true, error: null, dataset: null });
      if (!sekolahId || !peran) {
        setState({ loading: false, error: null, dataset: null });
        return;
      }
      const { data: ds, error: e1 } = await supabase
        .from("wa_dataset")
        .select("id, periode_id, meta, parameter, item")
        .eq("sekolah_id", sekolahId)
        .eq("aktif", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!alive) return;
      if (e1) { setState({ loading: false, error: e1.message, dataset: null }); return; }
      if (!ds) { setState({ loading: false, error: null, dataset: null }); return; }

      const [kelompokRes, individuRes, narasiRes] = await Promise.all([
        peran === "hc"
          ? fetchAllRows((from, to) => supabase.from("wa_kelompok").select("data").eq("dataset_id", ds.id).order("cakupan").order("kunci").range(from, to))
          : Promise.resolve({ data: [], error: null }),
        fetchAllRows((from, to) => supabase.from("wa_individu").select("data").eq("dataset_id", ds.id).order("individu_id").range(from, to)),
        fetchAllRows((from, to) => supabase.from("wa_narasi").select("cakupan, kunci, isi").eq("dataset_id", ds.id).order("cakupan").order("kunci").range(from, to)),
      ]);
      if (!alive) return;
      const galat = kelompokRes.error || individuRes.error || narasiRes.error;
      if (galat) { setState({ loading: false, error: galat.message, dataset: null }); return; }

      // Urutan kelompok mengikuti berkas: lembaga dulu, lalu jenjang, unit, kelompok jabatan.
      const urutan = { lembaga: 0, jenjang: 1, unit: 2, kelompok_jabatan: 3 };
      const kelompok = (kelompokRes.data || []).map((r) => r.data)
        .sort((a, b) => (urutan[a.cakupan] ?? 9) - (urutan[b.cakupan] ?? 9));

      setState({
        loading: false,
        error: null,
        dataset: {
          versi: 1,
          datasetId: ds.id,
          meta: { ...ds.meta, periodeId: ds.meta?.periodeId || ds.periode_id },
          parameter: ds.parameter || {},
          item: ds.item || [],
          kelompok,
          individu: (individuRes.data || []).map((r) => r.data),
          narasi: (narasiRes.data || []).map((r) => ({ cakupan: r.cakupan, kunci: r.kunci, isi: r.isi })),
        },
      });
    }
    muat().catch((err) => alive && setState({ loading: false, error: err.message || String(err), dataset: null }));
    return () => { alive = false; };
  }, [sekolahId, peran]);

  return { peran, ...state };
}
