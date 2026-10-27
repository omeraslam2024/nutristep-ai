import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// High-fidelity SVG of the NutriStep Healthy Progress Logo
// Exact colors: Dark spruce green #0c4e34, Apple gradient #5db329 to #1c7c3d, Bright green #69bc26
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <!-- Apple Body Gradient -->
    <linearGradient id="appleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#76c928" />
      <stop offset="45%" stop-color="#58b024" />
      <stop offset="100%" stop-color="#1b7a3d" />
    </linearGradient>

    <!-- Leaf Gradients -->
    <linearGradient id="leafLeft" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#145a32" />
      <stop offset="100%" stop-color="#229954" />
    </linearGradient>

    <linearGradient id="leafRight" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#48a623" />
      <stop offset="100%" stop-color="#7cd62e" />
    </linearGradient>

    <!-- Shadow filter for clean depth -->
    <filter id="subtleDrop" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#0c4e34" flood-opacity="0.18" />
    </filter>
  </defs>

  <g transform="translate(0, -10)">
    <!-- Top Left Leaf (Darker green) -->
    <path
      d="M245 130 C225 70, 160 55, 140 60 C150 100, 190 135, 245 130 Z"
      fill="url(#leafLeft)"
    />
    <!-- Center Leaf Ridge -->
    <path
      d="M150 72 C190 95, 220 115, 240 128"
      stroke="#145a32"
      stroke-width="3"
      stroke-linecap="round"
      fill="none"
      opacity="0.4"
    />

    <!-- Top Right Leaf (Lighter lime green) -->
    <path
      d="M245 125 C255 75, 305 60, 335 70 C330 105, 295 135, 245 125 Z"
      fill="url(#leafRight)"
    />

    <!-- Main Apple Body -->
    <!-- Curving around the left and base, framing the climbing athlete -->
    <path
      d="M235 135
         C200 130, 130 160, 115 220
         C95 300, 125 390, 180 425
         C220 450, 260 440, 275 425
         C285 415, 290 405, 280 400
         C230 400, 190 350, 190 280
         C190 220, 230 160, 295 140
         C270 132, 250 132, 235 135 Z"
      fill="url(#appleGrad)"
      filter="url(#subtleDrop)"
    />

    <!-- Additional Apple Volume / Shoulder -->
    <path
      d="M115 220
         C100 280, 120 360, 165 410
         C140 370, 130 300, 145 240
         C155 200, 185 165, 225 145
         C170 155, 130 180, 115 220 Z"
      fill="#145a32"
      opacity="0.15"
    />

    <!-- 3 Rising Progress Chart Step Bars -->
    <!-- Bar 1 (Lowest) -->
    <rect x="295" y="360" width="28" height="65" rx="10" fill="#58b024" />
    <!-- Bar 2 (Medium) -->
    <rect x="333" y="320" width="28" height="105" rx="10" fill="#58b024" />
    <!-- Bar 3 (Highest) -->
    <rect x="371" y="275" width="28" height="150" rx="10" fill="#58b024" />

    <!-- White Negative-Space Outline around Athlete for Separation -->
    <!-- Runner / Climber Silhouette -->
    <g fill="#0c4e34">
      <!-- Head -->
      <circle cx="330" cy="170" r="24" />

      <!-- Dynamic Stepping / Running Body -->
      <!-- Torso & Arms -->
      <path
        d="M322 198
           C300 205, 265 225, 250 250
           C240 265, 245 275, 260 270
           C275 265, 295 245, 315 235
           L300 285
           L330 310
           L355 270
           L340 230
           C355 235, 375 250, 390 240
           C398 235, 390 220, 375 215
           C355 210, 335 200, 322 198 Z"
      />

      <!-- Forward Bent Stepping Leg (Climbing onto bar) -->
      <path
        d="M330 305
           L355 330
           L345 380
           L325 380
           L335 340
           L315 320 Z"
        stroke-linejoin="round"
      />

      <!-- Rear Trailing Leg (Extended back from stride) -->
      <path
        d="M305 285
           C285 315, 255 370, 220 400
           C212 407, 205 398, 215 390
           C245 360, 275 310, 295 275 Z"
      />
    </g>
  </g>
</svg>`;

// Complete Logo with Brand Wordmark (for Headers, Hero & Splash)
const fullLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 700" width="100%" height="100%">
  <defs>
    <linearGradient id="appleGradFull" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#76c928" />
      <stop offset="45%" stop-color="#58b024" />
      <stop offset="100%" stop-color="#1b7a3d" />
    </linearGradient>

    <linearGradient id="leafLeftFull" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#145a32" />
      <stop offset="100%" stop-color="#229954" />
    </linearGradient>

    <linearGradient id="leafRightFull" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#48a623" />
      <stop offset="100%" stop-color="#7cd62e" />
    </linearGradient>
  </defs>

  <!-- Top Apple + Climber Icon -->
  <g transform="translate(44, 20)">
    <!-- Leaves -->
    <path d="M245 130 C225 70, 160 55, 140 60 C150 100, 190 135, 245 130 Z" fill="url(#leafLeftFull)" />
    <path d="M245 125 C255 75, 305 60, 335 70 C330 105, 295 135, 245 125 Z" fill="url(#leafRightFull)" />

    <!-- Apple Body -->
    <path
      d="M235 135
         C200 130, 130 160, 115 220
         C95 300, 125 390, 180 425
         C220 450, 260 440, 275 425
         C285 415, 290 405, 280 400
         C230 400, 190 350, 190 280
         C190 220, 230 160, 295 140
         C270 132, 250 132, 235 135 Z"
      fill="url(#appleGradFull)"
    />

    <!-- 3 Step Progress Bars -->
    <rect x="295" y="360" width="28" height="65" rx="10" fill="#58b024" />
    <rect x="333" y="320" width="28" height="105" rx="10" fill="#58b024" />
    <rect x="371" y="275" width="28" height="150" rx="10" fill="#58b024" />

    <!-- Runner / Climber Silhouette -->
    <g fill="#0c4e34">
      <circle cx="330" cy="170" r="24" />
      <path
        d="M322 198
           C300 205, 265 225, 250 250
           C240 265, 245 275, 260 270
           C275 265, 295 245, 315 235
           L300 285
           L330 310
           L355 270
           L340 230
           C355 235, 375 250, 390 240
           C398 235, 390 220, 375 215
           C355 210, 335 200, 322 198 Z"
      />
      <path
        d="M330 305 L355 330 L345 380 L325 380 L335 340 L315 320 Z"
      />
      <path
        d="M305 285 C285 315, 255 370, 220 400 C212 407, 205 398, 215 390 C245 360, 275 310, 295 275 Z"
      />
    </g>
  </g>

  <!-- NutriStep Wordmark (Matching exact typography) -->
  <g transform="translate(300, 560)" text-anchor="middle">
    <text font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="82" letter-spacing="-1">
      <tspan fill="#0c4e34">Nutri</tspan><tspan fill="#58b024">Step</tspan>
    </text>
  </g>
</svg>`;

async function generateAllAssets() {
  console.log('Generating NutriStep Healthy Progress Logo assets...');

  // Save SVGs
  fs.writeFileSync('public/icon.svg', logoSvg);
  fs.writeFileSync('public/nutristep-logo.svg', fullLogoSvg);

  const logoBuffer = Buffer.from(logoSvg);
  const fullLogoBuffer = Buffer.from(fullLogoSvg);

  // App icon sizes
  const sizes = [
    { file: 'public/pwa-192x192.png', size: 192, bg: false },
    { file: 'public/pwa-512x512.png', size: 512, bg: false },
    { file: 'public/pwa-maskable-512x512.png', size: 512, bg: '#ffffff' },
    { file: 'public/apple-touch-icon.png', size: 180, bg: '#ffffff' },
    { file: 'public/nutristep-logo.png', size: 512, buffer: fullLogoBuffer },
  ];

  for (const s of sizes) {
    const input = s.buffer || logoBuffer;
    if (s.bg) {
      await sharp(input)
        .resize(s.size - 40, s.size - 40)
        .extend({
          top: 20,
          bottom: 20,
          left: 20,
          right: 20,
          background: s.bg,
        })
        .png()
        .toFile(s.file);
    } else {
      await sharp(input)
        .resize(s.size, s.size)
        .png()
        .toFile(s.file);
    }
    console.log(`Generated: ${s.file}`);
  }

  // Generate Android native mipmap icons
  const androidMipmaps = [
    { dir: 'android/app/src/main/res/mipmap-mdpi', size: 48 },
    { dir: 'android/app/src/main/res/mipmap-hdpi', size: 72 },
    { dir: 'android/app/src/main/res/mipmap-xhdpi', size: 96 },
    { dir: 'android/app/src/main/res/mipmap-xxhdpi', size: 144 },
    { dir: 'android/app/src/main/res/mipmap-xxxhdpi', size: 192 },
  ];

  for (const m of androidMipmaps) {
    if (fs.existsSync(m.dir)) {
      // standard launcher icon
      await sharp(logoBuffer)
        .resize(m.size - 8, m.size - 8)
        .extend({
          top: 4,
          bottom: 4,
          left: 4,
          right: 4,
          background: '#ffffff',
        })
        .png()
        .toFile(path.join(m.dir, 'ic_launcher.png'));

      // round launcher icon
      await sharp(logoBuffer)
        .resize(m.size - 8, m.size - 8)
        .extend({
          top: 4,
          bottom: 4,
          left: 4,
          right: 4,
          background: '#ffffff',
        })
        .png()
        .toFile(path.join(m.dir, 'ic_launcher_round.png'));

      // foreground icon
      await sharp(logoBuffer)
        .resize(m.size, m.size)
        .png()
        .toFile(path.join(m.dir, 'ic_launcher_foreground.png'));

      console.log(`Updated Android icons in: ${m.dir}`);
    }
  }

  console.log('All NutriStep Healthy Progress Logo assets generated successfully!');
}

generateAllAssets().catch((err) => {
  console.error('Error generating logo assets:', err);
  process.exit(1);
});
