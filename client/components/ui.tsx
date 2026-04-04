'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode } from 'react'

// ── Fade + slide up on mount
export const FadeUp = ({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
)

// ── Stagger children
export const Stagger = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
    className={className}
  >
    {children}
  </motion.div>
)

export const StaggerItem = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20, scale: 0.97 },
      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
    }}
    className={className}
  >
    {children}
  </motion.div>
)

// ── Glass card with hover lift
export const Card = ({ children, className = '', glow = false, onClick }: {
  children: ReactNode; className?: string; glow?: boolean; onClick?: () => void
}) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.005 }}
    transition={{ duration: 0.2 }}
    onClick={onClick}
    className={`glass rounded-2xl ${glow ? 'glow-cyan' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </motion.div>
)

// ── Animated number counter
export const CountUp = ({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) => (
  <motion.span
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="stat-num"
  >
    {prefix}{value.toLocaleString()}{suffix}
  </motion.span>
)

// ── Glowing badge
export const Badge = ({ children, color = 'cyan' }: { children: ReactNode; color?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose' | 'muted' }) => {
  const colors = {
    cyan:    'bg-[rgba(0,229,255,0.1)] border-[rgba(0,229,255,0.3)] text-[#00e5ff]',
    violet:  'bg-[rgba(124,58,237,0.15)] border-[rgba(124,58,237,0.4)] text-[#a78bfa]',
    emerald: 'bg-[rgba(16,185,129,0.1)] border-[rgba(16,185,129,0.3)] text-[#10b981]',
    amber:   'bg-[rgba(245,158,11,0.1)] border-[rgba(245,158,11,0.3)] text-[#f59e0b]',
    rose:    'bg-[rgba(244,63,94,0.1)] border-[rgba(244,63,94,0.3)] text-[#f43f5e]',
    muted:   'bg-white/5 border-white/10 text-[#4a5080]',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[color]}`}>
      {children}
    </span>
  )
}

// ── Progress bar
export const ProgressBar = ({ value, color = 'cyan', className = '' }: { value: number; color?: string; className?: string }) => (
  <div className={`h-1.5 bg-white/5 rounded-full overflow-hidden ${className}`}>
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${Math.min(100, value)}%` }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
      className={`h-full rounded-full ${color === 'cyan' ? 'bg-gradient-to-r from-[#00e5ff] to-[#7c3aed]' : color === 'emerald' ? 'bg-[#10b981]' : color === 'amber' ? 'bg-[#f59e0b]' : 'bg-[#f43f5e]'}`}
    />
  </div>
)

// ── Spinner
export const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#04050f]">
    <div className="relative">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 rounded-full border-2 border-transparent border-t-[#00e5ff]"
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-[#00e5ff]" />
      </div>
    </div>
  </div>
)

// ── Section label
export const Label = ({ children }: { children: ReactNode }) => (
  <div className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#4a5080] mb-2">{children}</div>
)

// ── Divider
export const Divider = () => <div className="h-px bg-white/5 my-4" />

// ── Animated dot indicator
export const LiveDot = ({ color = 'cyan' }: { color?: 'cyan' | 'emerald' | 'amber' | 'rose' }) => {
  const c = { cyan: '#00e5ff', emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e' }[color]
  return (
    <span className="relative inline-flex w-2 h-2">
      <motion.span
        animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 rounded-full"
        style={{ background: c }}
      />
      <span className="relative w-2 h-2 rounded-full" style={{ background: c }} />
    </span>
  )
}
