/**
 * Draws the 1080×1350 "today" card people post to stories/WhatsApp: logo, steps ring, calories,
 * streak. Drawn on a canvas so it needs no network and looks the same on every phone.
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
const FONT = "'Plus Jakarta Sans Variable', system-ui, sans-serif";

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

  // Background: deep forest with a lime glow
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0a4a32');
  bg.addColorStop(1, '#06261a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.8, H * 0.15, 0, W * 0.8, H * 0.15, 700);
  glow.addColorStop(0, 'rgba(91,179,36,0.45)');
  glow.addColorStop(1, 'rgba(91,179,36,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Header: logo + wordmark
  const logo = await loadImage('/icon.svg');
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 80, 80, 120, 120, 32);
  ctx.fill();
  if (logo) ctx.drawImage(logo, 92, 92, 96, 96);
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 56px ${FONT}`;
  ctx.fillText('NutriStep', 228, 152);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = `500 34px ${FONT}`;
  ctx.fillText(d.dateLabel, 228, 196);

  // Steps ring
  const cx = W / 2;
  const cy = 600;
  const r = 250;
  const pct = Math.min(1, d.steps / Math.max(1, d.stepGoal));
  ctx.lineCap = 'round';
  ctx.lineWidth = 44;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  const ring = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  ring.addColorStop(0, '#b5e36b');
  ring.addColorStop(1, '#5bb324');
  ctx.strokeStyle = ring;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.001, pct));
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 128px ${FONT}`;
  ctx.fillText(d.steps.toLocaleString(), cx, cy + 30);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = `600 40px ${FONT}`;
  ctx.fillText(pct >= 1 ? 'steps · goal reached!' : `of ${d.stepGoal.toLocaleString()} steps`, cx, cy + 96);

  // Stat tiles
  const tiles: [string, string][] = [
    [`${d.distanceKm}`, 'km walked'],
    [`${d.burned}`, 'kcal burned'],
    [`${d.eaten}`, 'kcal eaten'],
  ];
  const tw = 280;
  const gap = 40;
  const tx0 = (W - (tw * 3 + gap * 2)) / 2;
  tiles.forEach(([v, l], i) => {
    const x = tx0 + i * (tw + gap);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    roundRect(ctx, x, 940, tw, 170, 36);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 64px ${FONT}`;
    ctx.fillText(v, x + tw / 2, 1030);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `500 32px ${FONT}`;
    ctx.fillText(l, x + tw / 2, 1078);
  });

  // Streak + footer
  ctx.fillStyle = '#ffd27a';
  ctx.font = `700 44px ${FONT}`;
  ctx.fillText(d.streak > 0 ? `🔥 ${d.streak}-day streak` : `${d.mealsLogged} meals logged today`, cx, 1190);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `500 30px ${FONT}`;
  ctx.fillText('Snap your plate. Walk it off. — NutriStep', cx, 1270);

  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not draw the share card'))), 'image/jpeg', 0.92)
  );
}
