import { useState, useEffect, useRef } from "react";
import { gasClient, GasError } from "./gasClient";

/**
 * Hook untuk membaca data dari GAS.
 *
 * modul    — "mi" | "karakter" | "screening" | "tindak_lanjut"
 * periodeId — string id periode atau null (ambil semua)
 * session  — { token, peran, ... } dari sessionStorage
 *
 * Kembalikan { loading, data, error, refetch }
 */
export function useGasRead(modul, periodeId, session) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const lastKey = useRef(null);

  function load() {
    if (!session?.token || !modul) {
      setState({ loading: false, data: null, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));

    gasClient
      .post("read", {
        token: session.token,
        modul,
        periode_id: periodeId || null,
      })
      .then((res) => {
        setState({ loading: false, data: res.data, error: null });
      })
      .catch((err) => {
        const msg = err instanceof GasError ? err.message : "Tidak dapat terhubung ke server.";
        setState({ loading: false, data: null, error: msg });
      });
  }

  useEffect(() => {
    const key = `${session?.token}|${modul}|${periodeId}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    load();
  }, [session?.token, modul, periodeId]);

  return { ...state, refetch: load };
}
