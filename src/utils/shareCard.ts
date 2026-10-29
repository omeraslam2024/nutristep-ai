/**
 * Draws the 1080×1350 "today" card people post to stories/WhatsApp in the Lassi style: cream
 * background, peach halo, green steps ring, pastel stat tiles, Leaf Step logo. Drawn on a canvas so
 * it needs no network and looks the same on every phone.
 */
export interface ShareCardData {
  name: string;
  dateLabel: string;
  steps: number;
  stepGoal: number;
  distanceKm: number;
  eaten: number;
  burned: number;
  streak: number;
  mealsLogged: number;
}

const W = 1080;
const H = 1350;
const DISPLAY = "'Fredoka Variable', 'Figtree Variable', system-ui, sans-serif";
const TEXT = "'Figtree Variable', system-ui, sans-serif";
const C = {
  cream: '#fff8f1',
  ink: '#2b2236',
  muted: '#6b5f70',
  coral: '#ff7e5f',
  peach: '#ffd6c2',
  mint: '#c9efdb',
  leaf: '#2fae78',
  butter: '#ffeaae',
  cloud: '#d2e9ff',
};

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function renderShareCard(d: ShareCardData): Promise<Blob> {
  await document.fonts?.ready;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = C.cream;
  ctx.fillRect(0, 0, W, H);

  // Header: coral logo tile + wordmark + date
  ctx.fillStyle = C.coral;
  roundRect(ctx, 80, 80, 112, 112, 30);
  ctx.fill();
  const logo = await loadImage('/icon-white.svg');
  if (logo) ctx.drawImage(logo, 108, 92, 56, 88);
  ctx.fillStyle = C.ink;
  ctx.font = `600 58px ${DISPLAY}`;
  ctx.fillText('NutriStep', 220, 145);
  ctx.fillStyle = C.muted;
  ctx.font = `500 32px ${TEXT}`;
  ctx.fillText(d.dateLabel, 222, 188);

  // Peach halo + steps ring
  const cx = W / 2;
  const cy = 590;
  ctx.fillStyle = C.peach;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 330, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 285, 0, Math.PI * 2);
  ctx.fill();

  const r = 235;
  const pct = Math.min(1, d.steps / Math.max(1, d.stepGoal));
  ctx.lineCap = 'round';
  ctx.lineWidth = 48;
  ctx.strokeStyle = C.mint;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = C.leaf;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.001, pct));
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = C.ink;
  ctx.font = `600 132px ${DISPLAY}`;
  ctx.fillText(d.steps.toLocaleString(), cx, cy + 30);
  ctx.fillStyle = C.muted;
  ctx.font = `600 38px ${TEXT}`;
  ctx.fillText(pct >= 1 ? 'steps · goal reached!' : `of ${d.stepGoal.toLocaleString()} steps`, cx, cy + 92);

  // Pastel stat tiles
  const tiles: [string, string, string][] = [
    [`${d.distanceKm}`, 'km walked', C.cloud],
    [`+${d.burned}`, 'kcal earned', C.mint],
    [`${d.eaten}`, 'kcal eaten', C.peach],
  ];
  const tw = 290;
  const gap = 30;
  const tx0 = (W - (tw * 3 + gap * 2)) / 2;
  tiles.forEach(([v, l, bg], i) => {
    const x = tx0 + i * (tw + gap);
    ctx.fillStyle = bg;
    roundRect(ctx, x, 975, tw, 180, 44);
    ctx.fill();
    ctx.fillStyle = C.ink;
    ctx.font = `600 68px ${DISPLAY}`;
    ctx.fillText(v, x + tw / 2, 1068);
    ctx.fillStyle = C.muted;
    ctx.font = `500 30px ${TEXT}`;
    ctx.fillText(l, x + tw / 2, 1116);
  });

  // Streak pill + tagline
  const label = d.streak > 0 ? `${d.streak}-day streak` : `${d.mealsLogged} meals logged`;
  ctx.font = `600 40px ${DISPLAY}`;
  const pw = ctx.measureText(label).width + 80;
  ctx.fillStyle = C.butter;
  roundRect(ctx, cx - pw / 2, 1188, pw, 70, 35);
  ctx.fill();
  ctx.fillStyle = C.ink;
  ctx.fillText(label, cx, 1236);
  ctx.fillStyle = C.muted;
  ctx.font = `500 28px ${TEXT}`;
  ctx.fillText('Every step earns you a little more to eat.', cx, 1308);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not draw the share card'))), 'image/jpeg', 0.92)
  );
}
