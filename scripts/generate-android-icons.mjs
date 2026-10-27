/**
 * Builds every Android launcher/splash image from the official logo (public/nutristep-logo.png).
 * Run: node scripts/generate-android-icons.mjs
 *
 * - Adaptive icon (API 26+): white background + logo mark kept inside the 66 dp safe zone of the
 *   108 dp canvas, so round, squircle and teardrop launcher masks never crop the leaves or bars.
 * - Monochrome layer (Android 13 themed icons): the mark's silhouette.
 * - Legacy icons (API 24-25): rounded-square and round PNGs.
 * - Splash (Android 12 SplashScreen API, also used by core-splashscreen below 12): the mark,
 *   rendered from the vector icon so it stays sharp at large sizes.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const RES = path.join(ROOT, 'android/app/src/main/res');
const LOGO = path.join(ROOT, 'public/nutristep-logo.png');
const VECTOR = path.join(ROOT, 'public/icon.svg');

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };

/** The mark (apple + walker + bars) without the "NutriStep" wordmark, on transparent pixels. */
async function loadMark() {
  // Two passes: sharp applies trim before extract within one pipeline.
  const top = await sharp(LOGO).extract({ left: 0, top: 0, width: 512, height: 360 }).png().toBuffer();
  const { data, info } = await sharp(top)
    .trim({ threshold: 10 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // White background → transparent, so the mark sits on any layer colour.
  for (let i = 0; i < data.length; i += 4) {
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    if (min > 235) data[i + 3] = 0;
    else if (min > 200) data[i + 3] = Math.round(data[i + 3] * ((235 - min) / 35));
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

async function centered(mark, canvas, box, background = { r: 0, g: 0, b: 0, alpha: 0 }) {
  const resized = await sharp(mark).resize(box, box, { fit: 'inside' }).toBuffer();
  return sharp({ create: { width: canvas, height: canvas, channels: 4, background } })
    .composite([{ input: resized, gravity: 'center' }])
    .png();
}

async function silhouette(mark) {
  const { data, info } = await sharp(mark).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i + 1] = data[i + 2] = 0;
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

async function main() {
  const mark = await loadMark();
  const mono = await silhouette(mark);

  for (const [name, scale] of Object.entries(DENSITIES)) {
    const dir = path.join(RES, `mipmap-${name}`);
    fs.mkdirSync(dir, { recursive: true });

    // Adaptive layers: 108 dp canvas, mark within 60 dp (safe zone is a 66 dp circle).
    const canvas = Math.round(108 * scale);
    await (await centered(mark, canvas, Math.round(60 * scale))).toFile(path.join(dir, 'ic_launcher_foreground.png'));
    await (await centered(mono, canvas, Math.round(60 * scale))).toFile(path.join(dir, 'ic_launcher_monochrome.png'));

    // Legacy 48 dp icons.
    const legacy = Math.round(48 * scale);
    const inner = Math.round(34 * scale);
    const r = Math.round(legacy * 0.22);
    const squircle = Buffer.from(
      `<svg width="${legacy}" height="${legacy}"><rect width="${legacy}" height="${legacy}" rx="${r}" fill="#fff"/></svg>`
    );
    const circle = Buffer.from(
      `<svg width="${legacy}" height="${legacy}"><circle cx="${legacy / 2}" cy="${legacy / 2}" r="${legacy / 2}" fill="#fff"/></svg>`
    );
    const markSmall = await sharp(mark).resize(inner, inner, { fit: 'inside' }).toBuffer();
    await sharp(squircle).composite([{ input: markSmall, gravity: 'center' }]).png().toFile(path.join(dir, 'ic_launcher.png'));
    await sharp(circle)
      .composite([{ input: await sharp(mark).resize(Math.round(inner * 0.92), Math.round(inner * 0.92), { fit: 'inside' }).toBuffer(), gravity: 'center' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // Splash icon: 288 dp canvas, content within the 192 dp circle.
    const splashDir = path.join(RES, `drawable-${name}`);
    fs.mkdirSync(splashDir, { recursive: true });
    const splashCanvas = Math.round(288 * scale);
    const vectorMark = await sharp(VECTOR, { density: 72 * scale * 2 }).resize(Math.round(150 * scale), Math.round(150 * scale), { fit: 'inside' }).png().toBuffer();
    await sharp({ create: { width: splashCanvas, height: splashCanvas, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: vectorMark, gravity: 'center' }])
      .png()
      .toFile(path.join(splashDir, 'splash_icon.png'));
  }

  // Play Store listing icon (512×512, full-bleed; Play applies its own mask).
  await (await centered(mark, 512, 330, { r: 255, g: 255, b: 255, alpha: 1 })).toFile(path.join(ROOT, 'docs/play-store-icon-512.png'));
  console.log('Android icons and splash generated.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
