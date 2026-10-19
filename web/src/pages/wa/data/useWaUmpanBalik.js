// Umpan balik pegawai tentang pengalaman mengikuti Wellbeing Assessment (migration 20261021100000).
//
// usePegawaiUmpanBalik  dipakai laporan pegawai: membaca isian miliknya (RLS: hanya baris miliknya)
//                       lalu mengirim atau mengubah jawaban.
// useRingkasanUmpanBalik dipakai tab "Dampak Asesmen" Human Capital: rekap dari fungsi Postgres
//                       wa_umpan_balik_ringkasan (tanpa identitas, terbuka setelah tiga isian),
//                       dimuat ulang tiap 20 detik selama halaman terlihat, jadi isian baru
//                       muncul hampir langsung.
//
// Kedua hook mengembalikan bentuk yang sama dengan versi pratinjau di WaPreview.jsx, sehingga
// komponen tidak tahu datanya dari mana.

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

const JEDA_MUAT_ULANG = 20_000;

export function usePegawaiUmpanBalik({ datasetId, individuId, sekolahId }) {
  const [state, setState] = useState({ memuat: true, galat: null, jawaban: null, dikirimPada: null, diperbaruiPada: null });
  const siap = Boolean(datasetId && individuId && sekolahId);

  useEffect(() => {
    let hidup = true;
    if (!siap) {
      Promise.resolve().then(() => hidup && setState((s) => ({ ...s, memuat: false })));
      return () => { hidup = false; };
    }
    supabase
      .from("wa_umpan_balik")
      .select("jawaban, dikirim_pada, diperbarui_pada")
      .eq("dataset_id", datasetId)
      .eq("individu_id", individuId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!hidup) return;
        setState({
          memuat: false,
          galat: error ? error.message : null,
          jawaban: data?.jawaban || null,
          dikirimPada: data?.dikirim_pada || null,
          diperbaruiPada: data?.diperbarui_pada || null,
        });
      });
    return () => { hidup = false; };
  }, [siap, datasetId, individuId]);

  // Isian pertama lewat insert, perubahan lewat update kolom jawaban saja: hak ubah di database
  // sengaja hanya untuk kolom itu, jadi upsert (yang ikut menulis kolom kunci) akan ditolak.
  const kirim = useCallback(async (jawaban) => {
    if (!siap) throw new Error("Akun ini belum tertaut ke isian asesmen.");
    const sudahAda = Boolean(state.dikirimPada);
    const permintaan = sudahAda
      ? supabase.from("wa_umpan_balik").update({ jawaban }).eq("dataset_id", datasetId).eq("individu_id", individuId)
      : supabase.from("wa_umpan_balik").insert({ dataset_id: datasetId, individu_id: individuId, sekolah_id: sekolahId, jawaban });
    const { data, error } = await permintaan.select("jawaban, dikirim_pada, diperbarui_pada").single();
    if (error) throw new Error(error.message);
    setState({ memuat: false, galat: null, jawaban: data.jawaban, dikirimPada: data.dikirim_pada, diperbaruiPada: data.diperbarui_pada });
    return data;
  }, [siap, datasetId, individuId, sekolahId, state.dikirimPada]);

  return { tersedia: siap, ...state, kirim };
}

export function useRingkasanUmpanBalik(datasetId) {
  const [state, setState] = useState({ memuat: true, galat: null, data: null, dimuatPada: null });
  const hidupRef = useRef(true);

  const muat = useCallback(async () => {
    if (!datasetId) return;
    const { data, error } = await supabase.rpc("wa_umpan_balik_ringkasan", { p_dataset_id: datasetId });
    if (!hidupRef.current) return;
    setState((s) => ({
      memuat: false,
      galat: error ? error.message : null,
      data: error ? s.data : data,
      dimuatPada: new Date().toISOString(),
    }));
  }, [datasetId]);

  useEffect(() => {
    hidupRef.current = true;
    Promise.resolve().then(muat);
    const timer = setInterval(() => { if (document.visibilityState === "visible") muat(); }, JEDA_MUAT_ULANG);
    const saatTerlihat = () => { if (document.visibilityState === "visible") muat(); };
    document.addEventListener("visibilitychange", saatTerlihat);
    return () => {
      hidupRef.current = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, [muat]);

  return { ...state, muatUlang: muat };
}
