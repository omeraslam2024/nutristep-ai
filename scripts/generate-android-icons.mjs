/**
 * Builds every launcher, splash and web icon from the vector logo (public/icon.svg, the "Leaf Step"
 * mark chosen from Claude Design on 28 Oct 2026).
 * Run: node scripts/generate-android-icons.mjs
 *
 * - Adaptive icon (API 26+): cream background + mark inside the 66 dp safe zone of the 108 dp canvas,
 *   so round, squircle and teardrop launcher masks never crop the toes or the stem.
 * - Monochrome layer (Android 13 themed icons): the mark's silhouette.
 * - Legacy icons (API 24-25): rounded-square and round PNGs.
 * - Splash (Android 12 SplashScreen API, also used by core-splashscreen below 12).
 * - Web: favicon, apple-touch icon, PWA icons (incl. maskable), nutristep-logo.png/svg lockup.
 * Everything is rasterised from the SVG, so it stays sharp at every size.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const RES = path.join(ROOT, 'android/app/src/main/res');
const PUBLIC = path.join(ROOT, 'public');
const VECTOR = path.join(PUBLIC, 'icon.svg');

const CREAM = { r: 0xff, g: 0xf8, b: 0xf1, alpha: 1 };
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };
const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

const svg = fs.readFileSync(VECTOR, 'utf8');

/** The mark rendered so it fits a box×box square. */
function mark(box, recolor) {
  const src = recolor ? svg.replace(/#FF7E5F|#2FAE78/gi, recolor) : svg;
  return sharp(Buffer.from(src), { density: 72 * Math.max(1, box / 100) * 2 })
    .resize(box, box, { fit: 'inside' })
    .png()
    .toBuffer();
}

async function centered(box, canvas, background, recolor) {
  return sharp({ create: { width: canvas, height: canvas, channels: 4, background } })
    .composite([{ input: await mark(box, recolor), gravity: 'center' }])
    .png();
}

function shape(size, kind, fill = '#FFF8F1') {
  const body =
    kind === 'circle'
      ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${fill}"/>`
      : `<rect width="${size}" height="${size}" rx="${Math.round(size * 0.24)}" fill="${fill}"/>`;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">${body}</svg>`);
}

async function main() {
  for (const [name, scale] of Object.entries(DENSITIES)) {
    const dir = path.join(RES, `mipmap-${name}`);
    fs.mkdirSync(dir, { recursive: true });

    // Adaptive layers: 108 dp canvas, mark within 58 dp (safe zone is a 66 dp circle).
    const canvas = Math.round(108 * scale);
    const box = Math.round(58 * scale);
    await (await centered(box, canvas, CLEAR)).toFile(path.join(dir, 'ic_launcher_foreground.png'));
    await (await centered(box, canvas, CLEAR, '#000000')).toFile(path.join(dir, 'ic_launcher_monochrome.png'));

    // Legacy 48 dp icons.
    const legacy = Math.round(48 * scale);
    const inner = Math.round(32 * scale);
    await sharp(shape(legacy, 'squircle'))
      .composite([{ input: await mark(inner), gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));
    await sharp(shape(legacy, 'circle'))
      .composite([{ input: await mark(Math.round(inner * 0.9)), gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // Splash icon: 288 dp canvas, content within the 192 dp circle.
    const splashDir = path.join(RES, `drawable-${name}`);
    fs.mkdirSync(splashDir, { recursive: true });
    await (await centered(Math.round(140 * scale), Math.round(288 * scale), CLEAR)).toFile(path.join(splashDir, 'splash_icon.png'));
  }

  // Web icons
  await (await centered(132, 180, CREAM)).toFile(path.join(PUBLIC, 'apple-touch-icon.png'));
  await (await centered(140, 192, CREAM)).toFile(path.join(PUBLIC, 'pwa-192x192.png'));
  await (await centered(372, 512, CREAM)).toFile(path.join(PUBLIC, 'pwa-512x512.png'));
  await (await centered(300, 512, CREAM)).toFile(path.join(PUBLIC, 'pwa-maskable-512x512.png'));
  await (await centered(28, 32, CLEAR)).toFile(path.join(PUBLIC, 'favicon-32.png'));
  await (await centered(330, 512, CREAM)).toFile(path.join(ROOT, 'docs/play-store-icon-512.png'));

  // Logo lockup (mark + wordmark) for docs and stores; text drawn as Fredoka-like rounded type.
  const lockup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 160" width="520" height="160">
  <rect width="520" height="160" rx="40" fill="#FFF8F1"/>
  <g transform="translate(36 22) scale(0.53)">${svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</g>
  <text x="140" y="104" font-family="Fredoka, 'Fredoka Variable', Nunito, 'Arial Rounded MT Bold', sans-serif" font-size="62" font-weight="600" fill="#2B2236">NutriStep</text>
</svg>`;
  fs.writeFileSync(path.join(PUBLIC, 'nutristep-logo.svg'), lockup);
  await sharp(Buffer.from(lockup), { density: 288 }).resize(1040).png().toFile(path.join(PUBLIC, 'nutristep-logo.png'));

  console.log('Android, splash and web icons generated from public/icon.svg.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
