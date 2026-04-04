'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import Link from 'next/link'
import { FadeUp, Stagger, StaggerItem, Badge, ProgressBar, Spinner } from '@/components/ui'

const STATUS_MAP: Record<string, { color: 'emerald' | 'amber' | 'rose' | 'muted' | 'cyan' }> = {
  pending:      { color: 'amber' },
  under_review: { color: 'cyan' },
  verified:     { color: 'emerald' },
  dismissed:    { color: 'muted' },
}

export default function ReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<any[]>([])
  const [worker, setWorker] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('gs_token')
    if (!token) { router.replace('/login'); return }
    Promise.all([api.get('/reports/my'), api.get('/workers/me')])
      .then(([r, w]) => { setReports(r.data); setWorker(w.data) })
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return <Spinner />

  return (
    <div className="min-h-screen bg-[#04050f] relative">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 50% at 70% 30%, rgba(16,185,129,0.05) 0%, transparent 70%)' }} />

      <motion.header initial={{ y: -60 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
        className="sticky top-0 z-20 border-b border-white/5 px-6 py-4 flex items-center gap-4"
        style={{ background: 'rgba(4,5,15,0.85)', backdropFilter: 'blur(20px)' }}>
        <Link href="/claims" className="text-[#4a5080] hover:text-white transition-colors text-sm">← Claims</Link>
        <span className="text-lg font-bold">Fraud Reports</span>
      </motion.header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 relative z-10">
        {/* Stats */}
        <Stagger className="grid grid-cols-3 gap-4">
          {[
            { label: 'Submitted', value: worker?.reportsSubmitted || 0, color: '#00e5ff' },
            { label: 'Verified',  value: worker?.reportsVerified || 0,  color: '#10b981' },
            { label: 'Credits',   value: `₹${worker?.communityCredits || 0}`, color: '#f59e0b' },
          ].map(s => (
            <StaggerItem key={s.label}>
              <motion.div whileHover={{ y: -4 }} className="glass rounded-2xl p-5 text-center relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 50% 0%, ${s.color}10 0%, transparent 70%)` }} />
                <div className="text-2xl font-bold stat-num" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-[#4a5080] mt-1">{s.label}</div>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Trust Score */}
        <FadeUp delay={0.1}>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold">Community Trust Score</span>
              <span className="text-2xl font-bold stat-num" style={{ color: '#00e5ff' }}>{worker?.communityTrustScore || 50}/100</span>
            </div>
            <ProgressBar value={worker?.communityTrustScore || 50} color="cyan" />
            <p className="text-xs text-[#4a5080] mt-2">Higher trust = your reports carry more weight in fraud detection.</p>
          </div>
        </FadeUp>

        {/* How it works */}
        <FadeUp delay={0.15}>
          <div className="glass rounded-2xl p-5">
            <div className="font-semibold mb-3">How it works</div>
            <div className="space-y-2">
              {[
                ['🚩', 'Flag a suspicious claim in your zone'],
                ['🔍', 'Our team reviews within 24 hours'],
                ['✓', 'Verified reports earn ₹15 premium credit'],
                ['🛡️', 'Flagged claim goes to human review'],
                ['📈', 'Your community trust score increases'],
              ].map(([icon, text], i) => (
                <motion.div key={text} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex items-center gap-3 text-sm text-[#4a5080]">
                  <span className="text-base">{icon}</span><span>{text}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </FadeUp>

        {/* Reports list */}
        {!reports.length ? (
          <FadeUp delay={0.2} className="text-center py-12 text-[#4a5080]">
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity }} className="text-4xl mb-3">🛡️</motion.div>
            <div className="font-semibold mb-1">No reports yet</div>
            <div className="text-xs">Go to Claims to report suspicious activity.</div>
          </FadeUp>
        ) : (
          <Stagger className="space-y-3">
            {reports.map((r: any) => {
              const s = STATUS_MAP[r.status] || STATUS_MAP.pending
              return (
                <StaggerItem key={r._id}>
                  <motion.div whileHover={{ y: -2 }} className="glass rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm font-medium capitalize">{r.reason?.replace(/_/g, ' ')}</div>
                        <div className="text-xs text-[#4a5080]">{new Date(r.createdAt).toLocaleDateString('en-IN')}</div>
                      </div>
                      <Badge color={s.color}>{r.status}</Badge>
                    </div>
                    {r.description && <p className="text-xs text-[#4a5080] mb-2">{r.description}</p>}
                    {r.status === 'verified' && (
                      <div className="text-xs text-[#10b981]">✓ Verified · ₹{r.creditsAwarded} credited</div>
                    )}
                  </motion.div>
                </StaggerItem>
              )
            })}
          </Stagger>
        )}
      </div>
    </div>
  )
}
