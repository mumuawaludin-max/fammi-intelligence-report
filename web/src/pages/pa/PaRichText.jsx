/**
 * PaRichText -- render teks polos dengan penanda `**tebal**` (markdown ringan) jadi <strong>,
 * dipakai di seluruh teks glosarium/insight/analisis modul ini. Alasannya: beberapa kalimat
 * (mis. penjelasan Tolong Menolong, satu-satunya domain berarah kebalikan -- skor RENDAH yang
 * perlu diperhatikan, bukan skor tinggi) perlu menonjolkan satu kata, tapi CLAUDE.md melarang
 * CAPSLOCK ("RENDAH") sebagai cara penekanan. `<strong>` yang dipakai, bukan huruf besar semua.
 *
 * Konvensi `**kata**` ini juga dipakai narasi hasil pengisian manual (lihat PROMPT Pengisian
 * Narasi Perilaku Anak.md) supaya penulis narasi masa depan punya cara menonjolkan kata tanpa
 * kembali ke CAPSLOCK.
 */
export function PaRichText({ text }) {
  if (!text) return null;
  const parts = String(text).split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part));
}
