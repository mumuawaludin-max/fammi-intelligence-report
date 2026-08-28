import { useEffect, useState } from "react";
import { supabase, fetchAllRows } from "../../lib/supabase";

/**
 * Daftar periode yang benar-benar punya data untuk sekolah-sekolah satu yayasan, terurut terbaru
 * lebih dulu. Dipakai pemilih periode di topbar YptApp.
 *
 * Digabung dari tiga sumber karena tiap menu punya siklus datanya sendiri: Rapor Karakter dan
 * Citra Sekolah ikut periode impor Karakter, Survey Kepuasan dan Testimoni ikut bulan respons
 * form masuk. Kalau cuma memakai salah satu, bulan yang datanya ada di menu lain akan hilang dari
 * pilihan dan seolah-olah tidak pernah ada.
 *
 * DAFTAR PER SUMBER JUGA DIKEMBALIKAN, bukan cuma gabungannya. Alasannya nyata: respons Survey
 * Kepuasan seluruhnya jatuh di satu bulan, sementara Rapor Karakter terus bertambah tiap bulan.
 * Pemilih periode selalu membuka di bulan TERBARU dari gabungan, jadi begitu Karakter melewati
 * bulan survei, menu Survey Kepuasan terbuka di bulan yang memang tidak punya respons dan tampil
 * kosong -- dan tidak ada apa pun di layar yang memberi tahu bahwa datanya ada di bulan lain.
 * Dengan daftar per sumber, tiap menu bisa menunjukkan bulan mana yang benar-benar berisi.
 */
const KOSONG = { semua: [], karakter: [], kepuasan: [], testimoni: [] };

export function useYptPeriodes(session) {
  const [periodes, setPeriodes] = useState(KOSONG);
  const sekolahIds = (session?.schools || []).map((s) => s.id);
  const key = sekolahIds.join(",");

  useEffect(() => {
    let alive = true;
    if (sekolahIds.length === 0) { setPeriodes(KOSONG); return; }

    async function run() {
      // fetchAllRows dipakai lewat KETIGANYA, bukan cuma tabel yang kelihatan besar. Query
      // sebelumnya tanpa .range() tampak aman untuk ypt_k_sekolah/kp_responden yang baris per
      // sekolahnya sedikit, tapi cs_testimoni sendirian sudah 14 ribuan baris satu yayasan --
      // PostgREST memotong balasannya diam-diam di 1000 baris tanpa galat, jadi periode yang
      // testimoninya baru masuk belakangan bisa hilang dari pemilih tanpa jejak. fetchAllRows
      // sekarang juga menembak halaman lanjutannya berkelompok paralel, bukan satu-satu, jadi
      // perbaikan ini tidak menambah waktu tunggu dibanding query lama untuk kasus yang muat
      // satu halaman.
      const [karakterRes, kpRes, testiRes] = await Promise.all([
        fetchAllRows((from, to) => supabase.from("ypt_k_sekolah")
          .select("periode_id").in("sekolah_id", sekolahIds).range(from, to)),
        fetchAllRows((from, to) => supabase.from("kp_responden")
          .select("periode_id").in("sekolah_id", sekolahIds).range(from, to)),
        fetchAllRows((from, to) => supabase.from("cs_testimoni")
          .select("periode_id").in("sekolah_id", sekolahIds).range(from, to)),
      ]);

      if (!alive) return;

      // Galat per sumber sengaja diabaikan (bukan dilempar): tabel kp/testimoni bisa saja belum
      // terisi di sekolah ini, dan itu bukan alasan untuk mengosongkan pemilih periode yang sudah
      // benar dari data Karakter.
      const urut = (rows) => Array.from(
        new Set((rows || []).map((r) => r.periode_id).filter(Boolean)),
      ).sort((a, b) => (a > b ? -1 : 1));

      const karakter = urut(karakterRes.data);
      const kepuasan = urut(kpRes.data);
      const testimoni = urut(testiRes.data);

      setPeriodes({
        semua: urut([...karakter, ...kepuasan, ...testimoni].map((p) => ({ periode_id: p }))),
        karakter,
        kepuasan,
        testimoni,
      });
    }

    run();
    return () => { alive = false; };
  }, [key]);

  return periodes;
}
