// Pembuat aset turunan dari logo Fammi.
// Sumber: public/logo.png (logo putih, transparan).
// Hasil:
//   - public/logo-purple.png  logo versi ungu brand, untuk latar terang (header, FAB)
//   - public/og-image.png     kartu 1200x630 untuk preview share (WhatsApp, dll)
// Jalankan: npm run gen:assets
import sharp from "sharp";

const BRAND = { r: 99, g: 35, b: 218, alpha: 1 }; // #6323DA
const SRC = "public/logo.png";

async function main() {
  const meta = await sharp(SRC).metadata();
  console.log(`Sumber logo: ${meta.width}x${meta.height}`);

  // 1. Logo ungu: pakai alpha logo putih sebagai mask di atas kanvas ungu.
  await sharp({
    create: { width: meta.width, height: meta.height, channels: 4, background: BRAND },
  })
    .composite([{ input: SRC, blend: "dest-in" }])
    .png()
    .toFile("public/logo-purple.png");
  console.log("OK public/logo-purple.png");

  // 2. Kartu OG: logo putih di tengah kanvas ungu 1200x630.
  const W = 1200, H = 630;
  const logoBuf = await sharp(SRC).resize({ width: 640, withoutEnlargement: false }).toBuffer();
  await sharp({
    create: { width: W, height: H, channels: 4, background: BRAND },
  })
    .composite([{ input: logoBuf, gravity: "center" }])
    .png()
    .toFile("public/og-image.png");
  console.log("OK public/og-image.png (1200x630)");

  // 3. Favicon: ambil squircle "fa" di kiri logo, jadikan ungu di atas tile putih membulat.
  const cropW = Math.min(360, meta.width);
  const cropBuf = await sharp(SRC).extract({ left: 0, top: 0, width: cropW, height: meta.height }).png().toBuffer();
  const sq = await sharp(cropBuf).trim().toBuffer();
  const sqMeta = await sharp(sq).metadata();
  const sqPurple = await sharp({
    create: { width: sqMeta.width, height: sqMeta.height, channels: 4, background: BRAND },
  })
    .composite([{ input: sq, blend: "dest-in" }])
    .png()
    .toBuffer();

  const TILE = 512, pad = 70, inner = TILE - pad * 2, radius = 116;
  const sqResized = await sharp(sqPurple).resize({ width: inner, height: inner, fit: "inside" }).toBuffer();
  const roundMask = Buffer.from(
    `<svg width="${TILE}" height="${TILE}"><rect width="${TILE}" height="${TILE}" rx="${radius}" ry="${radius}"/></svg>`
  );
  await sharp({
    create: { width: TILE, height: TILE, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([{ input: sqResized, gravity: "center" }, { input: roundMask, blend: "dest-in" }])
    .png()
    .toFile("public/favicon-512.png");
  console.log("OK public/favicon-512.png (512x512)");
}

main().catch((e) => { console.error(e); process.exit(1); });
