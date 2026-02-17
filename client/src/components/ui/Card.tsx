import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  noise?: boolean;
}

export function Card({ children, className, hover = false, glass = false, noise = false }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -4, transition: { stiffness: 280, damping: 22 } } : undefined}
      className={cn(
        'rounded-2xl',
        glass 
          ? 'bg-white/70 dark:bg-surface-dark/70 backdrop-blur-xl border border-border-light dark:border-border-dark'
          : 'bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark',
        noise && 'dark:noise-overlay',
        hover && 'shadow-card hover:shadow-glow-primary cursor-pointer',
        !hover && 'shadow-card',
        className
      )}
    >
      {children}
    </motion.div>
  );
}

interface GlassCardProps extends CardProps {
  glowColor?: 'primary' | 'success' | 'warning' | 'danger';
}

export function GlassCard({ children, className, glowColor, ...props }: GlassCardProps) {
  return (
    <Card glass className={cn(glowColor && `shadow-glow-${glowColor}`)} {...props}>
      {children}
    </Card>
  );
}
