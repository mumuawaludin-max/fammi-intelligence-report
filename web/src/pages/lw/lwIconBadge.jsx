import {
  Brain, Buildings, ChartLineUp, Compass, GraduationCap, HandHeart,
  Handshake, Heart, Lightbulb, MegaphoneSimple, Quotes, Rocket,
  ShieldWarning, Sparkle, Target, TrendUp, UsersThree, WhatsappLogo,
} from "@phosphor-icons/react";
import tokens from "./lwTokens.module.css";

/**
 * lwIconBadge -- padanan scIconBadge/paIconBadge, benchmark ke School Culture atas instruksi
 * eksplisit pemilik produk. `icon` menerima key persis dari data (kode aspek LEAD, kode dimensi
 * PROTEK, atau key section), bukan kunci Inggris generik.
 */
const ICON_MAP = {
  // Section selector (01/02/03)
  kesiapan: Compass,
  kesehatan: Heart,
  pengembangan: Rocket,
  // Empat aspek LEAD
  L: Lightbulb,
  E: Handshake,
  A: ChartLineUp,
  D: Target,
  // Enam dimensi PROTEK
  P: HandHeart,
  R: UsersThree,
  O: TrendUp,
  T: Compass,
  Ek: Buildings,
  K: Brain,
  // Generik
  target: Target,
  institution: Buildings,
  collaboration: Handshake,
  quality: ChartLineUp,
  whatsapp: WhatsappLogo,
  quote: Quotes,
  sparkle: Sparkle,
  shieldWarning: ShieldWarning,
  lightbulb: Lightbulb,
  megaphone: MegaphoneSimple,
  graduation: GraduationCap,
};

const TONE_COLOR = {
  purple: { color: "var(--lw-primary)", background: "var(--lw-soft)" },
  gold: { color: "var(--lw-gold)", background: "var(--lw-gold-soft)" },
  positive: { color: "var(--lw-status-aligned-ink)", background: "var(--lw-status-aligned-bg)" },
  negative: { color: "var(--lw-status-attention-ink)", background: "var(--lw-status-attention-bg)" },
  plain: { color: "currentColor", background: "transparent" },
};

export function LwIconBadge({ icon, size = "md", tone = "purple", className = "" }) {
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
