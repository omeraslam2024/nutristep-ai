import React, { useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'motion/react';

interface ProgressRingProps {
  /** 0..1; values above 1 draw a full ring. */
  value: number;
  size: number;
  stroke?: number;
  /** CSS colour or `url(#id)` of a gradient defined in `defs`. */
  color?: string;
  track?: string;
  defs?: React.ReactNode;
  label: string;
  children?: React.ReactNode;
}

/** Circular progress that fills smoothly whenever its value changes. */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size,
  stroke = 12,
  color = 'var(--color-emerald-500)',
  track = 'var(--color-slate-800)',
  defs,
  label,
  children,
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value || 0));

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        {defs && <defs>{defs}</defs>}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped) }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
};

/** Number that counts up/down to its new value. */
export const CountUp: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const mv = useMotionValue(value);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString());
  const [first, setFirst] = useState(true);

  useEffect(() => {
    if (first) {
      mv.set(0);
      setFirst(false);
    }
    const controls = animate(mv, value, { duration: 0.9, ease: [0.22, 1, 0.36, 1] });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <motion.span className={`tabular-nums ${className ?? ''}`}>{rounded}</motion.span>;
};
