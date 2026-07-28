import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarBlank,
  ChatCircleText,
  ChatsCircle,
  CheckCircle,
  ClipboardText,
  DeviceMobile,
  Fire,
  GenderFemale,
  GenderMale,
  HandHeart,
  HandsClapping,
  Heart,
  Lightbulb,
  Lightning,
  ListChecks,
  MagnifyingGlass,
  NotePencil,
  PlusCircle,
  Quotes,
  ShieldWarning,
  Sparkle,
  SquaresFour,
  Student,
  UsersFour,
  UsersThree,
  Warning,
  X,
} from "@phosphor-icons/react";
import tokens from "./paTokens.module.css";

/**
 * paIconBadge -- padanan sc/scIconBadge.jsx untuk modul Perilaku Anak. Sama seperti SC, modul
 * ini memakai @phosphor-icons/react (bukan emoji seperti modul Karakter/MI) karena pemilik
 * produk meminta bahasa visualnya benchmark ke School Culture.
 *
 * `icon` menerima key PERSIS dari data (kode section, kode dimensi HEART, kode kategori
 * survei), bukan kunci Inggris generik, supaya tidak ada lapisan terjemahan yang bisa mismatch.
 */
const ICON_MAP = {
  // Section selector (01-04)
  statistik: UsersThree,
  asesmen: PlusCircle,
  perhatian: UsersFour,
  survey: SquaresFour,
  // Lima dimensi HEART
  hiperaktivitas: Lightning,
  emosional: Heart,
  agresi: Fire,
  relasi: HandsClapping,
  prososial: HandHeart,
  // Pertanyaan survei tertutup (kode kolom asli, lihat PA_SURVEI_JUDUL di paAssembler.js)
  kebiasaan_belajar: BookOpen,
  penyelesaian_tugas: ListChecks,
  penggunaan_gadget: DeviceMobile,
  tempat_bercerita: ChatsCircle,
  permintaan_bantuan: HandHeart,
  respon_di_situasi_baru: Lightbulb,
  tempat_yang_nyaman: ChatCircleText,
  respon_saat_gagal: ShieldWarning,
  respon_saat_marah: Fire,
  sikap_saat_beda_pandapat: ChatsCircle,
  orang_yang_nyaman_diajak_ngobrol: ChatCircleText,
  dibully_dalam__3_6_bulan_terakhir: Warning,
  orang_yang_paling_dipercaya: HandHeart,
  orang_yang_dipercaya_untuk_cerita: ChatsCircle,
  saat_teman_sedih: Heart,
  saat_teman_kesulitan: HandsClapping,
  saat_punya_bekal: HandHeart,
  saat_ada_teman_baru: UsersThree,
  saat_adik_kelas_kesulitan: HandsClapping,
  saat_orangtua_atau_guru_minta_bantuan: HandHeart,
  // Generik
  siswa: Student,
  laki: GenderMale,
  perempuan: GenderFemale,
  esai: NotePencil,
  cari: MagnifyingGlass,
  pesan: ChatCircleText,
  panduan: BookOpen,
  kutipan: Quotes,
  peringatan: Warning,
  shieldWarning: ShieldWarning,
  lightbulb: Lightbulb,
  checklist: ListChecks,
  checkCircle: CheckCircle,
  calendar: CalendarBlank,
  clipboard: ClipboardText,
  sparkle: Sparkle,
  prev: ArrowLeft,
  next: ArrowRight,
  close: X,
};

const TONE_COLOR = {
  purple: { color: "var(--pa-primary)", background: "var(--pa-soft)" },
  gold: { color: "var(--pa-gold)", background: "var(--pa-gold-soft)" },
  aman: { color: "var(--pa-aman)", background: "var(--pa-aman-bg)" },
  waspada: { color: "var(--pa-waspada)", background: "var(--pa-waspada-bg)" },
  perhatian: { color: "var(--pa-perhatian)", background: "var(--pa-perhatian-bg)" },
  laki: { color: "#ffffff", background: "var(--pa-laki)" },
  perempuan: { color: "#ffffff", background: "var(--pa-perempuan)" },
  dark: { color: "#ffffff", background: "#191527" },
  plain: { color: "currentColor", background: "transparent" },
};

export function PaIconBadge({ icon, size = "md", tone = "purple", className = "" }) {
  const Icon = ICON_MAP[icon] || Sparkle;
  const sizePx = size === "xs" ? 34 : size === "sm" ? 44 : size === "lg" ? 72 : 58;
  const radius = size === "xs" ? 10 : size === "sm" ? 12 : size === "lg" ? 18 : 14;
  const { color, background } = TONE_COLOR[tone] || TONE_COLOR.purple;

  return (
    <span
      className={`${tokens.scope} ${className}`}
      aria-hidden="true"
      style={{
        display: "inline-grid",
        flex: "0 0 auto",
        placeItems: "center",
        width: sizePx,
        height: sizePx,
        borderRadius: radius,
        color,
        background,
      }}
    >
      <Icon weight="duotone" style={{ width: "52%", height: "52%" }} />
    </span>
  );
}
