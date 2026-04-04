'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { FadeUp, Stagger, StaggerItem, Badge } from '@/components/ui'
import { useConfig } from '@/lib/useConfig'

// Visual config per tier key — only styling, no pricing
const TIER_VISUAL: Record<string, { icon: string; color: string; accentColor: string; borderColor: string }> = {
  basic:    { icon: '🌱', color: '#4a5080', accentColor: 'rgba(74,80,128,0.15)',   borderColor: 'rgba(74,80,128,0.3)' },
  standard: { icon: '⚡', color: '#00e5ff', accentColor: 'rgba(0,229,255,0.08)',   borderColor: 'rgba(0,229,255,0.35)' },
  pro:      { icon: '🚀', color: '#7c3aed', accentColor: 'rgba(124,58,237,0.1)',   borderColor: 'rgba(124,58,237,0.35)' },
}

export default function OnboardPage() {
  const router = useRouter()
  const { config } = useConfig()
  const [quotes, setQuotes] = useState<any>(null)
  const [selected, setSelected] = useState('standard')
  const [activating, setActivating] = useState(false)

  useEffect(() => {
    api.get('/ml/premium-quote').then(r => setQuotes(r.data)).catch(() => {})
  }, [])

  async function activate() {
    setActivating(true)
    try {
      await api.post('/policies', { tier: selected })
      router.replace('/dashboard')
    } catch (e: any) {
      alert(e.response?.data?.error || 'Failed to activate')
    } finally {
      setActivating(false)
    }
  }

  // Tiers come from config, visual styling from TIER_VISUAL
  const tiers = (config?.tiers || []).map(t => ({
    ...t,
    ...(TIER_VISUAL[t.key] || TIER_VISUAL.basic),
  }))

  const selectedTierConfig = tiers.find(t => t.key === selected) || tiers[0]

  return (
    <div className="min-h-screen bg-[#04050f] relative overflow-hidden">
      {/* Background */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 12, repeat: Infinity }}
        className="fixed top-[-30%] right-[-20%] w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.07) 0%, transparent 70%)' }}
      />
      <motion.div
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 15, repeat: Infinity }}
        className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <FadeUp className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-5"
            style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)' }}>
            <span className="text-[#00e5ff] text-xs font-semibold tracking-widest uppercase">Choose Coverage</span>
          </div>
          <h1 className="text-4xl font-bold mb-3" style={{ color: '#e8eaf6' }}>
            Select your weekly plan
          </h1>
          <p style={{ color: '#4a5080' }} className="text-sm">
            Activates Monday · Renews automatically · Cancel anytime
          </p>
        </FadeUp>

        {/* Tier Cards */}
        <Stagger className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {tiers.map((tier) => {
            const quote = quotes?.[tier.key]
            const price = quote?.finalPremium || tier.weeklyPremium
            const bd = quote?.breakdown
            const isSelected = selected === tier.key

            return (
              <StaggerItem key={tier.key}>
                <motion.div
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(tier.key)}
                  className="relative rounded-2xl p-6 cursor-pointer overflow-hidden h-full"
                  style={{
                    background: isSelected ? tier.accentColor : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isSelected ? tier.borderColor : 'rgba(255,255,255,0.07)'}`,
                    boxShadow: isSelected ? `0 0 40px ${tier.color}20, inset 0 0 40px ${tier.color}05` : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {/* Glow top line */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-px"
                      style={{ background: `linear-gradient(90deg, transparent, ${tier.color}80, transparent)` }} />
                  )}

                  {/* Popular badge */}
                  {tier.popular && (
                    <div className="absolute -top-px left-1/2 -translate-x-1/2">
                      <div className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase"
                        style={{
                          background: 'linear-gradient(135deg, #00e5ff, #7c3aed)',
                          color: '#04050f',
                          borderRadius: '0 0 10px 10px',
                        }}>
                        POPULAR
                      </div>
                    </div>
                  )}

                  {/* Check mark */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.color}aa)` }}
                      >
                        <span style={{ color: '#04050f', fontSize: 11, fontWeight: 700 }}>✓</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="text-3xl mb-4">{tier.icon}</div>

                  <div className="text-xs font-semibold tracking-widest uppercase mb-2"
                    style={{ color: isSelected ? tier.color : '#4a5080' }}>
                    {tier.name}
                  </div>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-4xl font-bold" style={{ color: isSelected ? tier.color : '#e8eaf6', fontFamily: 'Space Mono, monospace' }}>
                      ₹{price}
                    </span>
                    <span style={{ color: '#4a5080' }} className="text-sm">/wk</span>
                  </div>

                  <div className="text-xs mb-4" style={{ color: '#4a5080' }}>
                    Up to <span style={{ color: isSelected ? tier.color : '#e8eaf6' }} className="font-semibold">
                      ₹{tier.maxWeeklyPayout.toLocaleString()}
                    </span> payout
                  </div>

                  <div className="text-xs mb-5" style={{ color: '#4a5080' }}>{tier.description}</div>

                  {/* Premium breakdown */}
                  {bd && (
                    <div className="pt-4 space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      {[
                        { label: 'Base', value: bd.base, sign: '' },
                        { label: 'Zone risk', value: bd.zoneRisk, sign: '+' },
                        { label: 'Seasonal', value: bd.seasonalRisk, sign: '+' },
                        bd.loyaltyDiscount < 0 ? { label: 'Loyalty', value: bd.loyaltyDiscount, sign: '' } : null,
                        bd.poolDiscount < 0 ? { label: 'Pool', value: bd.poolDiscount, sign: '' } : null,
                      ].filter(Boolean).map((item: any) => (
                        <div key={item.label} className="flex justify-between text-xs">
                          <span style={{ color: '#4a5080' }}>{item.label}</span>
                          <span style={{ color: item.value < 0 ? '#10b981' : 'rgba(232,234,246,0.6)' }}>
                            {item.sign}₹{Math.abs(item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </StaggerItem>
            )
          })}
        </Stagger>

        {/* Coverage details */}
        <FadeUp delay={0.3}>
          <div className="rounded-2xl p-6 mb-6"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="text-xs font-semibold tracking-widest uppercase mb-4" style={{ color: '#4a5080' }}>
            What's covered
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(config?.coverageItems || []).map(item => (
              <div key={item.text} className="flex items-center gap-2.5 text-sm" style={{ color: 'rgba(232,234,246,0.7)' }}>
                <span className="text-base">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#4a5080' }}>
            <span style={{ color: '#f43f5e' }}>✗</span>{' '}
            {(config?.exclusions || ['Health, accident, vehicle, life']).join(' · ')} — not covered
          </div>
          </div>
        </FadeUp>

        {/* CTA */}
        <FadeUp delay={0.4}>
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={activate}
            disabled={activating}
            className="w-full py-5 rounded-2xl text-lg font-bold relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #00e5ff, #7c3aed)',
              color: '#04050f',
              border: 'none',
              cursor: activating ? 'not-allowed' : 'pointer',
              opacity: activating ? 0.7 : 1,
            }}
          >
            <motion.div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15), transparent)' }}
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
            />
            <span className="relative z-10">
              {activating ? (
                <span className="flex items-center justify-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block w-5 h-5 rounded-full"
                    style={{ border: '2px solid rgba(4,5,15,0.3)', borderTopColor: '#04050f' }}
                  />
                  Activating...
                </span>
              ) : (
                `Activate ${selectedTierConfig?.name || 'Shield'} →`
              )}
            </span>
          </motion.button>
          <p className="text-center text-xs mt-3" style={{ color: '#4a5080' }}>
            No commitment · Pause before Monday renewal
          </p>
        </FadeUp>
      </div>
    </div>
  )
}
