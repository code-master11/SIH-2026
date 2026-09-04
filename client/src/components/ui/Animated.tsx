import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// ─── Page Transition Wrapper ───────────────────────────────────────────────────
export const PageMotion: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
  >
    {children}
  </motion.div>
);

// ─── Animated Counter ──────────────────────────────────────────────────────────
interface CounterProps { to: number; duration?: number; prefix?: string; suffix?: string }
export const AnimatedCounter: React.FC<CounterProps> = ({ to, duration = 1200, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(0);
  const startTime = useRef<number | null>(null);
  const raf = useRef<number>(0);

  useEffect(() => {
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const elapsed = ts - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out-expo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(eased * to));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  }, [to, duration]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

// ─── Skeleton Loader ───────────────────────────────────────────────────────────
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
);

export const SkeletonCard = () => (
  <div className="rounded-xl border border-slate-100 bg-white p-5 space-y-3">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-8 w-16" />
    <Skeleton className="h-3 w-32" />
  </div>
);

export const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-3 px-4 border-b border-slate-50">
    <Skeleton className="h-9 w-9 rounded-full flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-48" />
      <Skeleton className="h-3 w-32" />
    </div>
    <Skeleton className="h-6 w-16 rounded-full" />
  </div>
);

// ─── Stagger Container ─────────────────────────────────────────────────────────
export const StaggerContainer: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="visible"
    variants={{
      hidden: {},
      visible: { transition: { staggerChildren: 0.07 } },
    }}
  >
    {children}
  </motion.div>
);

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 16 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    }}
  >
    {children}
  </motion.div>
);

// ─── Fade In ───────────────────────────────────────────────────────────────────
export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

// ─── Scale In ──────────────────────────────────────────────────────────────────
export const ScaleIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = '',
}) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, scale: 0.88 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, delay, type: 'spring', stiffness: 260, damping: 20 }}
  >
    {children}
  </motion.div>
);

// ─── Hover Card ────────────────────────────────────────────────────────────────
export const HoverCard: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void }> = ({
  children, className = '', onClick,
}) => (
  <motion.div
    className={className}
    whileHover={{ y: -3, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
  >
    {children}
  </motion.div>
);

// ─── Blockchain Block Visualizer ───────────────────────────────────────────────
export const BlockchainBlock: React.FC<{ index: number; valid: boolean; delay?: number }> = ({
  index, valid, delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, type: 'spring', stiffness: 300, damping: 20 }}
    className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white shadow-md ${
      valid ? 'bg-emerald-500' : 'bg-red-500'
    }`}
  >
    {index}
    {valid && (
      <motion.div
        className="absolute inset-0 rounded-lg bg-emerald-400"
        animate={{ opacity: [0.4, 0, 0.4] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    )}
  </motion.div>
);
