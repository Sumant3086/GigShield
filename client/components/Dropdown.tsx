'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Option {
  value: string
  label: string
  icon?: string
  sub?: string
}

interface DropdownProps {
  value: string
  onChange: (v: string) => void
  options: Option[]
  placeholder?: string
  className?: string
}

export default function Dropdown({ value, onChange, options, placeholder = 'Select...', className = '' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`} style={{ zIndex: open ? 50 : 'auto' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-medium transition-all"
        style={{
          background: open ? 'rgba(0,229,255,0.06)' : 'rgba(255,255,255,0.05)',
          border: open ? '1px solid rgba(0,229,255,0.45)' : '1px solid rgba(255,255,255,0.1)',
          color: '#e8eaf6',
          boxShadow: open ? '0 0 0 3px rgba(0,229,255,0.08)' : 'none',
          outline: 'none',
        }}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {selected?.icon && <span className="text-base flex-shrink-0">{selected.icon}</span>}
          <span className="truncate">{selected?.label || placeholder}</span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0 ml-2"
          style={{ color: '#4a5080' }}
        >
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 right-0 top-full mt-2 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(8,10,24,0.98)',
              border: '1px solid rgba(0,229,255,0.18)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,229,255,0.08)',
              backdropFilter: 'blur(24px)',
              zIndex: 9999,
              position: 'absolute',
            }}
          >
            <div className="py-1 max-h-56 overflow-y-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(0,229,255,0.2) transparent' }}>
              {options.map((opt, i) => {
                const isSelected = opt.value === value
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors"
                    style={{
                      background: isSelected ? 'rgba(0,229,255,0.1)' : 'transparent',
                      color: isSelected ? '#00e5ff' : '#e8eaf6',
                      borderBottom: i < options.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'
                    }}
                  >
                    {opt.icon && <span className="text-base flex-shrink-0">{opt.icon}</span>}
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{opt.label}</div>
                      {opt.sub && <div className="text-xs mt-0.5 truncate" style={{ color: '#4a5080' }}>{opt.sub}</div>}
                    </div>
                    {isSelected && (
                      <span className="flex-shrink-0 text-xs font-bold" style={{ color: '#00e5ff' }}>✓</span>
                    )}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
