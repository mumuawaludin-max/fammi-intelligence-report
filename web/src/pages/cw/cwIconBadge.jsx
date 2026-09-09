import {
  Buildings,
  CalendarBlank,
  ChartLineUp,
  CheckCircle,
  ClipboardText,
  Compass,
  GraduationCap,
  Handshake,
  Heart,
  Lightbulb,
  ListChecks,
  Medal,
  Quotes,
  Scales,
  ShieldWarning,
  Sparkle,
  Target,
  TrendDown,
  TrendUp,
  Users,
  UsersThree,
  WhatsappLogo,
  X,
} from "@phosphor-icons/react";
import tokens from "./cwBudayaTokens.module.css";

/**
 * cwIconBadge -- padanan scIconBadge.jsx di modul School Culture, dipakai di seluruh dashboard
 * "Laporan Organisasi" Corporate Culture & Wellbeing (ketiga bagian: Budaya Kerja, Kesejahteraan
 * Karyawan, Profil Organisasi). Bersama SC, ini satu-satunya tempat FIR memakai
 * @phosphor-icons/react -- lihat CLAUDE.md "Pengecualian yang disengaja (2)". Laporan individu
 * karyawan (CwLaporanIndividuPage/CwKaryawanPage) tetap pakai ikon emoji dari cwMeta.js, JANGAN
 * diseragamkan ke sini.
 *
 * `icon` menerima key PERSIS dari data CW (tipe budaya OCAI Klan/Adhokrasi/Pasar/Hierarki, kode
 * subdimensi kesejahteraan, kode dimensi profil organisasi, atau key section
 * "budaya"/"kesejahteraan"/"organisasi") -- BUKAN key generik yang perlu lapisan terjemahan.
 * Kunci CW beda dari SC karena istilahnya memang beda (korporat vs sekolah).
 */
const ICON_MAP = {
  // Section selector (01/02/03)
  budaya: UsersThree,
  kesejahteraan: Users,
  organisasi: Buildings,
  // Budaya Kerja (4 tipe, nama persis data)
  Kekeluargaan: UsersThree,
  Inovasi: Lightbulb,
  Orientasi: Target,
  Aturan: ClipboardText,
  // Kesejahteraan Karyawan (5 subdimensi, kode persis data)
  kepuasan_kepemimpinan: Medal,
  kenyamanan_bekerja: Handshake,
  pengembangan_diri: GraduationCap,
  ekspektasi: CheckCircle,
  work_life_balance: Scales,
  // Profil Organisasi (6 dimensi, kode persis data)
  karakter_lembaga: Buildings,
  kepemimpinan: Compass,
  management: ClipboardText,
  sinergi: Handshake,
  fokus: Target,
  performance: ChartLineUp,
  // Generik
  target: Target,
  award: Medal,
  institution: Buildings,
  collaboration: Handshake,
  quality: ChartLineUp,
  whatsapp: WhatsappLogo,
  close: X,
  heart: Heart,
  calendar: CalendarBlank,
  quote: Quotes,
  sparkle: Sparkle,
  shieldWarning: ShieldWarning,
  lightbulb: Lightbulb,
  checklist: ListChecks,
  trendUp: TrendUp,
  trendDown: TrendDown,
};

const TONE_COLOR = {
  purple: { color: "var(--cwd-primary)", background: "var(--cwd-soft)" },
  gold: { color: "var(--cwd-gold)", background: "var(--cwd-gold-soft)" },
  whatsapp: { color: "#25D366", background: "#E7F8EF" },
  positive: { color: "var(--cwd-status-aligned-ink)", background: "var(--cwd-status-aligned-bg)" },
  negative: { color: "var(--cwd-status-attention-ink)", background: "var(--cwd-status-attention-bg)" },
  plain: { color: "currentColor", background: "transparent" },
};

export function CwIconBadge({ icon, size = "md", tone = "purple", className = "" }) {
  const Icon = ICON_MAP[icon] || Target;
  const sizePx = size === "sm" ? 44 : size === "lg" ? 72 : 58;
  const radius = size === "sm" ? 12 : size === "lg" ? 18 : 14;
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
