import React from 'react';
import { motion } from 'motion/react';
import { Droplet, Flame, Footprints } from 'lucide-react';

/**
 * Lassi welcome art: a thali plate of pastel bowls on a peach halo, with floating "+273 kcal" and
 * "6,240 steps" chips — food and steps in one picture. Pure SVG/CSS, so it ships in the APK and
 * works offline. Decorative; the headline next to it carries the meaning.
 */
export const ThaliIllustration: React.FC<{ size?: number }> = ({ size = 280 }) => {
  const float = (delay: number) => ({
    animate: { y: [0, -6, 0] },
    transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' as const, delay },
  });

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} aria-hidden="true">
      <motion.svg
        viewBox="0 0 280 280"
        width={size}
        height={size}
        initial={{ scale: 0.85, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
      >
        <circle cx="140" cy="140" r="132" fill="var(--peach)" opacity="0.55" />
        <circle cx="140" cy="140" r="108" fill="var(--peach)" />
        <circle cx="140" cy="140" r="80" fill="var(--color-slate-900)" />
        <circle cx="140" cy="140" r="70" fill="none" stroke="var(--color-slate-700)" strokeWidth="2" strokeDasharray="4 6" />
        <circle cx="140" cy="98" r="17" fill="#c9efdb" />
        <circle cx="103" cy="134" r="17" fill="#e2d8ff" />
        <circle cx="177" cy="134" r="17" fill="#ffeaae" />
        <circle cx="140" cy="176" r="17" fill="#d2e9ff" />
        <circle cx="140" cy="138" r="24" fill="#f5a04a" />
        <circle cx="134" cy="131" r="6" fill="#ffffff" opacity="0.35" />
      </motion.svg>

      <motion.div
        {...float(0)}
        className="absolute left-0 top-[18%] flex items-center gap-1.5 rounded-full surface px-3 py-1.5 text-sm font-semibold text-ink"
      >
        <span className="w-6 h-6 rounded-full bg-mint text-leaf-ink flex items-center justify-center">
          <Footprints className="w-3.5 h-3.5" />
        </span>
        <span className="num">+273 kcal</span>
      </motion.div>

      <motion.div
        {...float(0.8)}
        className="absolute right-0 bottom-[16%] flex items-center gap-1.5 rounded-full surface px-3 py-1.5 text-sm font-semibold text-ink"
      >
        <span className="w-6 h-6 rounded-full bg-lilac text-lilac-ink flex items-center justify-center">
          <Footprints className="w-3.5 h-3.5" />
        </span>
        <span className="num">6,240 steps</span>
      </motion.div>

      <motion.span
        {...float(0.4)}
        className="absolute right-[8%] top-[8%] w-10 h-10 rounded-full bg-cloud text-cloud-ink flex items-center justify-center"
      >
        <Droplet className="w-5 h-5 fill-current" />
      </motion.span>
      <motion.span
        {...float(1.2)}
        className="absolute left-[8%] bottom-[10%] w-9 h-9 rounded-full bg-butter text-butter-ink flex items-center justify-center"
      >
        <Flame className="w-4 h-4 fill-current" />
      </motion.span>
    </div>
  );
};
