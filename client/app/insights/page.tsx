'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import Link from 'next/link'
import { FadeUp, Stagger, StaggerItem, Badge, Spinner } from '@/components/ui'

const PRIORITY_COLORS = {
  urgent: { bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.3)', text: '#f43f5e' },
  high: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
  medium: { bg: 'rgba(0,229,255,0.06)', border: 'rgba(0,229,255,0.2)', text: '#00e5ff' },
  low: { bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)', text: '#4a5080' },
}

export default function InsightsPage() {
  const router = useRouter()
  const [insights, setInsights] = useState<any>(null)
  const [riskScore, setRiskScore] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('gs_token')
    if (!token) { router.replace('/login'); return }
    
    Promise.all([
      api.get('/insights/my'),
      api.get('/insights/risk-score'),
    ]).then(([ins, risk]) => {
      setInsights(ins.data)
      setRiskScore(risk.data)
    }).finally(() => setLoading(false))
  }, [router])

  if (loading) return <Spinner />

  const riskColor = riskScore?.level === 'low' ? '#10b981' : riskScore?.level === 'medium' ? '#f59e0b' : '#f43f5e'

  return (
    <div className="min-h-screen bg-[#04050f] relative">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 50% at 50% 30%, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />

      <motion.header initial={{ y: -60 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
        className="sticky top-0 z-20 border-b border-white/5 px-6 py-4 flex items-center gap-4"
        style={{ background: 'rgba(4,5,15,0.85)', backdropFilter: 'blur(20px)' }}>
        <Link href="/dashboard" className="text-[#4a5080] hover:text-white transition-colors text-sm">
          ← Dashboard
        </Link>
        <span className="text-lg font-bold">AI Insights</span>
        <Badge color="violet">Powered by ML</Badge>
      </motion.header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 relative z-10">

        {/* Risk Score Card */}
        <FadeUp>
          <div className="glass rounded-2xl p-6 relative overflow-hidden"
            style={{ border: `1px solid ${riskColor}40` }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: `linear-gradient(90deg, transparent, ${riskColor}80, transparent)` }} />
            
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#4a5080' }}>
                  Your Risk Score
                </div>
                <div className="text-5xl font-bold stat-num" style={{ color: riskColor }}>
                  {riskScore?.score}/100
                </div>
              </div>
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl"
                style={{ background: `${riskColor}15` }}>
                {riskScore?.level === 'low' ? '✅' : riskScore?.level === 'medium' ? '⚠️' : '🚨'}
              </div>
            </div>

            <div className="text-sm capitalize font-semibold mb-4" style={{ color: riskColor }}>
              {riskScore?.level} Risk Level
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Recent Claims', value: riskScore?.factors?.recentClaims || 0 },
                { label: 'Zone Risk', value: riskScore?.factors?.zoneRisk || 0 },
                { label: 'Platforms', value: riskScore?.factors?.multiPlatform || 1 },
                { label: 'In Pool', value: riskScore?.factors?.inPool ? 'Yes' : 'No' },
              ].map(f => (
                <div key={f.label} className="flex justify-between p-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <span style={{ color: '#4a5080' }}>{f.label}</span>
                  <span style={{ color: '#e8eaf6', fontWeight: 600 }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* Insights List */}
        <FadeUp delay={0.1}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold">Personalized Recommendations</span>
            <span className="text-xs px-2 py-1 rounded-full"
              style={{ background: 'rgba(124,58,237,0.1)', color: '#a78bfa' }}>
              {insights?.totalInsights || 0} insights
            </span>
          </div>
        </FadeUp>

        {!insights?.insights?.length ? (
          <FadeUp delay={0.15} className="text-center py-12 text-[#4a5080]">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }}
              className="text-4xl mb-3">🎯</motion.div>
            <div className="font-semibold mb-1">All good!</div>
            <div className="text-xs">No urgent recommendations right now.</div>
          </FadeUp>
        ) : (
          <Stagger className="space-y-4">
            {insights.insights.map((insight: any, i: number) => {
              const colors = PRIORITY_COLORS[insight.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.low
              return (
                <StaggerItem key={i}>
                  <motion.div whileHover={{ y: -2, scale: 1.01 }}
                    className="rounded-2xl p-5 relative overflow-hidden"
                    style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                    
                    {/* Priority indicator */}
                    <div className="absolute top-0 left-0 right-0 h-1"
                      style={{ background: `linear-gradient(90deg, ${colors.text}, transparent)` }} />

                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: `${colors.text}15` }}>
                        {insight.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold" style={{ color: '#e8eaf6' }}>
                            {insight.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase"
                            style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
                            {insight.priority}
                          </span>
                        </div>

                        <p className="text-sm leading-relaxed mb-3" style={{ color: '#4a5080' }}>
                          {insight.message}
                        </p>

                        {insight.action && (
                          <Link href={insight.actionUrl || '/dashboard'}>
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              className="text-xs font-semibold px-4 py-2 rounded-xl"
                              style={{ background: colors.text, color: '#04050f' }}>
                              {insight.action} →
                            </motion.button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
              )
            })}
          </Stagger>
        )}

        {/* How it works */}
        <FadeUp delay={0.2}>
          <div className="glass rounded-2xl p-5">
            <div className="font-semibold mb-3">How AI Insights Work</div>
            <div className="space-y-2 text-sm" style={{ color: '#4a5080' }}>
              <p>• Analyzes your earnings fingerprint, zone history, and claim patterns</p>
              <p>• Compares with 10,000+ workers in your city to find optimization opportunities</p>
              <p>• Updates daily with new forecasts and market conditions</p>
              <p>• Personalized to your work style, platform, and risk tolerance</p>
            </div>
          </div>
        </FadeUp>
      </div>
    </div>
  )
}
