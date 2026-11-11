import { useCallback, useEffect, useRef, useState } from "react";
import { klienDemo } from "./demoAccess";
import { PESAN_AKTIF, PESAN_SESI, sesiMati } from "./demoAturan";

const JEDA_PERIKSA_MS = 60_000;
const BATAS_TIMER_MS = 2_000_000_000;

function pesanSesi(status) {
  if (status === "ended") return { nada: "info", teks: PESAN_SESI.ended };
  return { nada: "peringatan", teks: PESAN_SESI[status] || PESAN_SESI.invalid };
}

/**
 * Keadaan akses demo di halaman masuk.
 *
 *   fase "memeriksa" -> ada token tersimpan, sedang ditanyakan ke server
 *   fase "terkunci"  -> belum ada akses demo
 *   fase "aktif"     -> server menyatakan sesi sah; sesi = { expiresAt, availableSystems, htmlReports }
 *
 * Selama aktif, sesi diperiksa ulang ke server tiap menit, saat tab kembali terlihat, dan tepat saat
 * waktunya habis. Begitu server bilang sesi mati (kedaluwarsa, dicabut), halaman kembali terkunci.
 * Gangguan jaringan tidak mengunci sesi yang belum habis waktunya.
 */
export function useDemoSession(statusAwal = null) {
  // statusAwal: alasan pengunjung baru saja dikeluarkan dari tampilan akun demo (lihat App.jsx).
  const [keadaan, setKeadaan] = useState(() => ({
    fase: klienDemo.punyaSesi() ? "memeriksa" : "terkunci",
    sesi: null,
    pesan: statusAwal && sesiMati(statusAwal) ? pesanSesi(statusAwal) : null,
  }));

  const keadaanRef = useRef(keadaan);
  // Naik setiap kali keadaan diubah tindakan pengguna, supaya balasan pemeriksaan yang berangkat
  // lebih dulu tidak menimpa keputusan yang lebih baru (mis. sesi baru saja diakhiri).
  const generasiRef = useRef(0);

  useEffect(() => {
    keadaanRef.current = keadaan;
  }, [keadaan]);

  const periksa = useCallback(async () => {
    const generasi = generasiRef.current;
    const hasil = await klienDemo.periksaSesi();
    if (generasi !== generasiRef.current) return hasil;
    const lama = keadaanRef.current;

    if (hasil.status === "aktif") {
      setKeadaan({ fase: "aktif", sesi: hasil.sesi, pesan: lama.fase === "aktif" ? lama.pesan : null });
    } else if (hasil.status === "galat") {
      if (lama.fase === "aktif" && Date.parse(lama.sesi?.expiresAt) <= Date.now()) {
        klienDemo.lupakanSesi();
        setKeadaan({ fase: "terkunci", sesi: null, pesan: pesanSesi("expired") });
      } else if (lama.fase === "memeriksa") {
        setKeadaan({ fase: "terkunci", sesi: null, pesan: { nada: "peringatan", teks: PESAN_SESI.galat } });
      }
    } else if (hasil.status === "kosong") {
      if (lama.fase !== "terkunci") setKeadaan({ fase: "terkunci", sesi: null, pesan: null });
    } else {
      setKeadaan({ fase: "terkunci", sesi: null, pesan: pesanSesi(hasil.status) });
    }
    return hasil;
  }, []);

  // Halaman dibuka dengan token tersimpan: tanyakan ke server sebelum membuka apa pun.
  useEffect(() => {
    if (keadaanRef.current.fase === "memeriksa") periksa();
  }, [periksa]);

  const aktif = keadaan.fase === "aktif";
  const berakhir = keadaan.sesi?.expiresAt ?? null;

  useEffect(() => {
    if (!aktif) return undefined;
    const interval = window.setInterval(periksa, JEDA_PERIKSA_MS);
    const sisa = berakhir ? Date.parse(berakhir) - Date.now() + 1000 : JEDA_PERIKSA_MS;
    const timer = window.setTimeout(periksa, Math.min(Math.max(sisa, 1000), BATAS_TIMER_MS));
    function saatTerlihat() {
      if (document.visibilityState === "visible") periksa();
    }
    document.addEventListener("visibilitychange", saatTerlihat);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", saatTerlihat);
    };
  }, [aktif, berakhir, periksa]);

  /** Dipanggil dialog kode demo sesudah server menerima kode. */
  const aktifkan = useCallback((sesi) => {
    generasiRef.current += 1;
    setKeadaan({ fase: "aktif", sesi, pesan: { nada: "sukses", teks: PESAN_AKTIF } });
  }, []);

  const akhiri = useCallback(() => {
    generasiRef.current += 1;
    const proses = klienDemo.akhiriSesi();
    setKeadaan({ fase: "terkunci", sesi: null, pesan: pesanSesi("ended") });
    return proses;
  }, []);

  /** Dipanggil penampil laporan saat server menolak sesi di tengah jalan. */
  const kunciKarena = useCallback((status) => {
    generasiRef.current += 1;
    klienDemo.lupakanSesi();
    setKeadaan({ fase: "terkunci", sesi: null, pesan: pesanSesi(sesiMati(status) ? status : "invalid") });
  }, []);

  const hapusPesan = useCallback(() => {
    setKeadaan((k) => (k.pesan ? { ...k, pesan: null } : k));
  }, []);

  return {
    fase: keadaan.fase,
    sesi: keadaan.sesi,
    pesan: keadaan.pesan,
    verifikasi: klienDemo.verifikasi,
    ambilLaporanHtml: klienDemo.ambilLaporanHtml,
    masukTampilan: klienDemo.masukTampilan,
    aktifkan,
    akhiri,
    kunciKarena,
    hapusPesan,
  };
}
