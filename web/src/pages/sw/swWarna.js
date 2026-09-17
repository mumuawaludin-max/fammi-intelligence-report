// Ikon dan warna penanda modul Screening Awal Wellbeing, dipisah dari SwUi.jsx supaya berkas
// komponen hanya mengekspor komponen (syarat fast refresh). Satu ikon dan satu warna per
// makna, dipakai sama di semua tab supaya pembaca cepat mengenali.

import {
  Anchor, ArrowsHorizontal, BatteryCharging, BatteryLow, Binoculars, CalendarCheck, ChatsCircle,
  EyeSlash, Footprints, HandWaving, Handshake, Question, Scales, Smiley, SmileyMeh, SmileyNervous,
  SmileySad, SmileyWink, Sparkle, Sun, UsersThree, Wrench, Eye,
} from "@phosphor-icons/react";

export const IKON_ALASAN = {
  minta: HandWaving,
  atasan: ChatsCircle,
  fungsi: Footprints,
  ragu: Question,
  datar: ArrowsHorizontal,
  tekanan: EyeSlash,
  wakil: UsersThree,
};

export const WARNA_ALASAN = {
  minta: "var(--fm-ungu)",
  atasan: "var(--fm-ungu-tua)",
  fungsi: "var(--fm-jingga)",
  ragu: "var(--fm-ungu-sedang)",
  datar: "var(--fm-emas)",
  tekanan: "var(--fm-jingga-muda)",
  wakil: "var(--fm-hijau)",
};

export const WARNA_JALUR = {
  penanda: "var(--fm-ungu)",
  kuota: "var(--fm-emas)",
  sisa: "var(--fm-hijau)",
};

/** Warna tulisan yang jelas di atas tiap warna alasan dan jalur. */
export const TEKS_DI_ATAS = {
  minta: "#FFFFFF", atasan: "#FFFFFF", ragu: "#FFFFFF", wakil: "#FFFFFF", fungsi: "#FFFFFF", tekanan: "#FFFFFF",
  datar: "var(--fm-teks)",
  penanda: "#FFFFFF", kuota: "var(--fm-teks)", sisa: "#FFFFFF",
};

/** Lima aspek Form A. */
export const IKON_ASPEK = {
  energi: BatteryCharging,
  fungsi: CalendarCheck,
  beban: Scales,
  dukungan: Handshake,
  makna: Sparkle,
};

/** Angka kondisi 1 sampai 5 ("rasanya bekerja 4 pekan terakhir"). */
export const IKON_KONDISI = { 1: SmileySad, 2: SmileyNervous, 3: SmileyMeh, 4: Smiley, 5: SmileyWink };
export const WARNA_KONDISI = { 1: "var(--fm-jingga)", 2: "var(--fm-jingga-muda)", 3: "var(--fm-emas)", 4: "var(--fm-ungu-sedang)", 5: "var(--fm-ungu)" };
export const TEKS_KONDISI = { 1: "#FFFFFF", 2: "#FFFFFF", 3: "var(--fm-teks)", 4: "#FFFFFF", 5: "#FFFFFF" };

/** Empat kelompok pandangan pegawai dan atasan. */
export const IKON_KUADRAN = { keduanya: Eye, tersembunyi: EyeSlash, teramati: Binoculars, menopang: Sun };
export const WARNA_KUADRAN = {
  keduanya: { latar: "var(--fm-emas)", teks: "var(--fm-teks)" },
  tersembunyi: { latar: "var(--fm-jingga)", teks: "#FFFFFF" },
  teramati: { latar: "var(--fm-ungu-sedang)", teks: "#FFFFFF" },
  menopang: { latar: "var(--fm-hijau)", teks: "#FFFFFF" },
};

/** Tiga pertanyaan terbuka yang dikelompokkan jadi tema. */
export const IKON_TEMA = { bertahan: Anchor, menguras: BatteryLow, diperbaiki: Wrench };
export const WARNA_TEMA = { bertahan: "var(--fm-hijau)", menguras: "var(--fm-jingga)", diperbaiki: "var(--fm-ungu)" };
