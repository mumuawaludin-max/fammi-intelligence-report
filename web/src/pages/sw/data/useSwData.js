// Jalur baca modul Screening Awal Wellbeing dari Supabase. RLS yang menentukan baris mana yang
// kembali: Human Capital menerima semua individu sekolahnya, pegawai hanya dirinya, yayasan dan
// kepala unit tidak menerima individu sama sekali, dan baris unit di bawah ambang pengisi hanya
// kembali untuk Human Capital. React tetap menyaring ulang lewat siapkanDataUntukPeran.

import { useEffect, useState } from "react";
import { fetchAllRows, supabase } from "../../../lib/supabase";

function sekolahSw(session) {
  if (session?.modulesBySchool) {
    return Object.keys(session.modulesBySchool).find((id) => session.modulesBySchool[id].includes("sw")) || session.school_id;
  }
  return session?.school_id || null;
}

export function useSwData(session, { muatUlang = 0 } = {}) {
  const [state, setState] = useState({ loading: true, error: null, dataset: null });
  const sekolahId = sekolahSw(session);
  const peran = session?.peran;

  useEffect(() => {
    let alive = true;
    async function muat() {
      setState({ loading: true, error: null, dataset: null });
      if (!sekolahId) {
        setState({ loading: false, error: null, dataset: null });
        return;
      }
      const { data: ds, error: e1 } = await supabase
        .from("sw_dataset")
        .select("id, meta, asumsi, lembaga, tema, ringkasan_pimpinan")
        .eq("sekolah_id", sekolahId)
        .eq("aktif", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!alive) return;
      if (e1) { setState({ loading: false, error: e1.message, dataset: null }); return; }
      if (!ds) { setState({ loading: false, error: null, dataset: null }); return; }

      const [unitRes, individuRes, qcRes] = await Promise.all([
        fetchAllRows((from, to) => supabase.from("sw_unit").select("data").eq("dataset_id", ds.id).order("unit_id").range(from, to)),
        fetchAllRows((from, to) => supabase.from("sw_individu").select("data").eq("dataset_id", ds.id).order("individu_id").range(from, to)),
        peran === "HumanCapital"
          ? fetchAllRows((from, to) => supabase.from("sw_pimpinan_qc").select("unit_id, data").eq("dataset_id", ds.id).range(from, to))
          : Promise.resolve({ data: [], error: null }),
      ]);
      if (!alive) return;
      const galat = unitRes.error || individuRes.error || qcRes.error;
      if (galat) { setState({ loading: false, error: galat.message, dataset: null }); return; }

      const qcPerUnit = {};
      for (const r of qcRes.data || []) (qcPerUnit[r.unit_id] ||= []).push(r.data);
      const unit = (unitRes.data || []).map((r) => {
        const u = r.data;
        return u.pengamatan && qcPerUnit[u.id] ? { ...u, pengamatan: { ...u.pengamatan, qc: qcPerUnit[u.id] } } : u;
      });

      setState({
        loading: false,
        error: null,
        dataset: {
          versi: 1,
          datasetId: ds.id,
          meta: ds.meta,
          asumsi: ds.asumsi,
          lembaga: ds.lembaga,
          tema: ds.tema,
          ringkasanPimpinan: ds.ringkasan_pimpinan || [],
          unit,
          individu: (individuRes.data || []).map((r) => r.data),
        },
      });
    }
    muat().catch((err) => alive && setState({ loading: false, error: err.message || String(err), dataset: null }));
    return () => { alive = false; };
  }, [sekolahId, peran, muatUlang]);

  return state;
}
