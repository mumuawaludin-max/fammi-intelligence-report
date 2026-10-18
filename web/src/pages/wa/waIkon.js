// Pemetaan ikon Phosphor untuk modul Wellbeing Assessment, dipisah dari waMeta.js supaya waMeta
// tetap tanpa impor (dipakai pembaca di Node).

import {
  ArrowsClockwise, Briefcase, ChartBar, ChatCenteredText, ChatTeardropText, CheckSquare, ClipboardText, HandHeart, Heart,
  Lightbulb, ListChecks, ThumbsDown, ThumbsUp, UserSound, Users, XCircle,
} from "@phosphor-icons/react";

export const IKON_TAB = {
  ringkasan: ChartBar,
  wellbeing: Heart,
  kepuasan: ThumbsUp,
  survey: ListChecks,
  testimoni: ChatCenteredText,
  temuan: Lightbulb,
};

export const IKON_DIMENSI = {
  peran_pekerjaan: ListChecks,
  kepemimpinan_keputusan: UserSound,
  relasi_budaya: Users,
  organisasi_komunikasi: ChatTeardropText,
  pengembangan_karir: Briefcase,
  keseimbangan_apresiasi: HandHeart,
};

export const IKON_PILIHAN = {
  disukai: ThumbsUp,
  tidak_disukai: ThumbsDown,
  mudah: CheckSquare,
  sulit: XCircle,
  keputusan_disukai: HandHeart,
  keputusan_tidak_disukai: HandHeart,
};

export const IKON_TERBUKA = {
  tempat_kerja_lebih_baik: ThumbsUp,
  kebijakan_diubah: ArrowsClockwise,
  pimpinan_efektif: HandHeart,
  pelatihan_dibutuhkan: ClipboardText,
};
