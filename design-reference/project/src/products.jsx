// ============================================================
// PRODUCTS — Fammi sells three modules. A school may subscribe
// to all of them or just one. This registry + preset list lets
// the family report (Orang Tua & Siswa) reflow around whichever
// products are active, and gives each product its own standalone
// identity (name, tagline, accent) when it stands alone.
// ============================================================

// accent.main / soft / on  → light theme (Orang Tua)
// accent.dMain / dSoft      → dark theme (Siswa)
const PRODUCTS = {
  karakter: {
    id: "karakter",
    name: "Rapor Karakter",
    full: "Rapor Karakter",
    short: "Karakter",
    kicker: "Produk · Rapor Karakter",
    tagline: "Enam kebiasaan baik yang ditumbuhkan bersama di sekolah dan di rumah.",
    blurb: "Memotret bagaimana karakter anak bertumbuh — dari yang baru muncul hingga yang sudah jadi kebiasaan.",
    Icon: window.IconHeart,
    ortuView: "karakter",
    siswaView: "karakter",
    inst: "karakter",
    accent: { main: "#6323DA", soft: "#F4EFFD", on: "#fff", grad: ["#7C3AED", "#5316C0"], dMain: "#B68CFF", dSoft: "rgba(157,107,255,0.16)", dGrad: ["#C9B0FF", "#7C3AED"] },
  },
  screening: {
    id: "screening",
    name: "Screening Perasaan",
    full: "Screening Sosial-Emosional",
    short: "Perasaan",
    kicker: "Produk · Screening HEART",
    tagline: "Gambaran lembut tentang kondisi sosial dan emosi anak — bukan diagnosis.",
    blurb: "Membaca lima aspek perasaan & pertemanan, lalu menunjukkan mana yang berkembang baik dan mana yang perlu didampingi.",
    Icon: window.IconShield,
    ortuView: "emosi",
    siswaView: "perasaan",
    inst: "screening",
    accent: { main: "#0E8C7F", soft: "#E4F4F1", on: "#fff", grad: ["#15A594", "#0B6E63"], dMain: "#2DD4BF", dSoft: "rgba(45,212,191,0.16)", dGrad: ["#5EEAD4", "#14B8A6"] },
  },
  bakat: {
    id: "bakat",
    name: "Bakat & Kecerdasan",
    full: "Pemetaan Bakat & 8 Kecerdasan",
    short: "Bakat",
    kicker: "Produk · Bakat & Kecerdasan",
    tagline: "Peta delapan kecerdasan anak sebagai arah memilih kegiatan dan jurusan.",
    blurb: "Memetakan kecerdasan yang menonjol, lalu menerjemahkannya jadi rekomendasi jurusan, profesi, dan kegiatan.",
    Icon: window.IconBrain,
    ortuView: "bakat",
    siswaView: "bakat",
    inst: "mi",
    accent: { main: "#3754C9", soft: "#EAEDFB", on: "#fff", grad: ["#4F6BE0", "#2E40A8"], dMain: "#8AA4FF", dSoft: "rgba(138,164,255,0.16)", dGrad: ["#B0C2FF", "#5B79F0"] },
  },
};

const PRODUCT_ORDER = ["karakter", "screening", "bakat"];

// presets surfaced in the Tweaks panel
const PRODUCT_PRESETS = {
  lengkap:   { label: "Lengkap · 3 produk",          ids: ["karakter", "screening", "bakat"] },
  karakter:  { label: "Hanya Rapor Karakter",        ids: ["karakter"] },
  screening: { label: "Hanya Screening Perasaan",    ids: ["screening"] },
  bakat:     { label: "Hanya Bakat & Kecerdasan",    ids: ["bakat"] },
  kar_scr:   { label: "Karakter + Screening",        ids: ["karakter", "screening"] },
  kar_bak:   { label: "Karakter + Bakat",            ids: ["karakter", "bakat"] },
  scr_bak:   { label: "Screening + Bakat",           ids: ["screening", "bakat"] },
};
const PRESET_KEYS = ["lengkap", "karakter", "screening", "bakat", "kar_scr", "kar_bak", "scr_bak"];

function activeProducts(presetKey) {
  const p = PRODUCT_PRESETS[presetKey] || PRODUCT_PRESETS.lengkap;
  // keep canonical order regardless of preset author order
  return PRODUCT_ORDER.filter((id) => p.ids.includes(id)).map((id) => PRODUCTS[id]);
}

// institutional module ids (karakter / screening / mi) for an active preset
function activeInstModules(presetKey) {
  return activeProducts(presetKey).map((p) => p.inst);
}

Object.assign(window, { PRODUCTS, PRODUCT_ORDER, PRODUCT_PRESETS, PRESET_KEYS, activeProducts, activeInstModules });
