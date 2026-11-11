import { ChartPieSlice, GraduationCap, HandHeart, ShieldCheck, UsersThree } from "@phosphor-icons/react";

// Kunci `ikon` di DEMO_SYSTEMS ke ikon Phosphor, padanan ikon di deck Fammi: perisai bercentang,
// toga, tangan yang menopang, kelompok guru, dan grafik keuangan. Phosphor dipakai di halaman masuk
// dan demo sebagai bagian dari pengecualian desain (6), lihat CLAUDE.md.
const IKON = {
  edukasi: GraduationCap,
  aman: ShieldCheck,
  bakat: HandHeart,
  guru: UsersThree,
  keuangan: ChartPieSlice,
};

export default function IkonSistem({ nama, size = 26, weight = "fill" }) {
  const Ikon = Object.hasOwn(IKON, nama) ? IKON[nama] : GraduationCap;
  return <Ikon size={size} weight={weight} aria-hidden="true" focusable="false" />;
}
