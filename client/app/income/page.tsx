'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import Link from 'next/link'
import { FadeUp, Stagger, StaggerItem, Badge, Spinner } from '@/components/ui'
import { useConfig } from '@/lib/useConfig'

export default function IncomePage() {
  const router = useRouter()
  const { config } = useConfig()
  const platforms = config?.platforms || []
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('gs_token')
    if (!token) { router.replace('/login'); return }
    api.get('/income/profile').then(r => setProfile(r.data)).finally(() => setLoading(false))
  }, [router])

  async function linkPlatform(platform: string) {
    setLinking(platform)
    try {
      const { data } = await api.post('/income/link', { platform })
      setProfile((prev: any) => ({ ...prev, linkedPlatforms: data.platforms, aggregatedWeeklyEarnings: data.aggregatedWeeklyEarnings }))
    } catch (e: any) { alert(e.response?.data?.error) }
    finally { setLinking(null) }
  }

  async function unlinkPlatform(platform: string) {
    try {
      const { data } = await api.delete(`/income/link/${platform}`)
      setProfile((prev: any) => ({ ...prev, linkedPlatforms: data.platforms, aggregatedWeeklyEarnings: data.aggregatedWeeklyEarnings }))
    } catch (e: any) { alert(e.response?.data?.error) }
  }

  async function verifyAll() {
    setVerifying(true)
    try {
      const { data } = await api.post('/income/verify')
      setProfile((prev: any) => ({ ...prev, ...data, linkedPlatforms: data.platforms }))
    } catch (e: any) { alert(e.response?.data?.error) }
    finally { setVerifying(false) }
  }

  if (loading) return <Spinner />

  const linkedSet = new Set((profile?.linkedPlatforms || []).map((p: any) => p.platform))
  const available = platforms.filter(p => p.value !== profile?.platform && !linkedSet.has(p.value))

  return (
    <div className="min-h-screen bg-[#04050f] relative">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 50% 50% at 30% 70%, rgba(0,229,255,0.05) 0%, transparent 70%)' }} />

      <motion.header initial={{ y: -60 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
        className="sticky top-0 z-20 border-b border-white/5 px-6 py-4 flex items-center gap-4"
        style={{ background: 'rgba(4,5,15,0.85)', backdropFilter: 'blur(20px)' }}>
        <Link href="/dashboard" className="text-[#4a5080] hover:text-white transition-colors text-sm">
          &larr; Dashboard
        </Link>
        <span className="text-lg font-bold">Multi-Platform Income</span>
        <Badge color="cyan">AI Verified</Badge>
      </motion.header>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6 relative z-10">

        {/* Why link */}
        <FadeUp>
          <div className="glass rounded-2xl p-5 relative overflow-hidden"
            style={{ border: '1px solid rgba(0,229,255,0.15)' }}>
            <div className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,255,0.4), transparent)' }} />
            <div className="flex items-start gap-3">
              <span className="text-2xl flex-shrink-0">💡</span>
              <div>
                <div className="font-semibold mb-1">Why link multiple platforms?</div>
                <p className="text-sm leading-relaxed" style={{ color: '#4a5080' }}>
                  Most delivery workers run 2-3 apps simultaneously. A worker earning Rs.2,500/week on Swiggy
                  + Rs.2,000/week on Zomato has a true income of Rs.4,500 — but single-platform verification
                  would <span style={{ color: '#f43f5e' }}>underpay their claim by 44%</span>. Link all platforms for accurate payouts.
                </p>
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Income Summary */}
        <FadeUp delay={0.1}>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold">Income Summary</span>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={verifyAll} disabled={verifying} className="btn-primary px-4 py-2 text-xs rounded-xl">
                {verifying ? 'Verifying...' : 'Re-verify All'}
              </motion.button>
            </div>

            {/* Primary platform */}
            <div className="flex items-center justify-between py-3"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: 'rgba(0,229,255,0.1)' }}>
                  {platforms.find(p => p.value === profile?.platform)?.icon || '📱'}
                </div>
                <div>
                  <div className="text-sm font-medium capitalize">{profile?.platform?.replace(/_/g, ' ')}</div>
                  <div className="text-xs" style={{ color: '#4a5080' }}>Primary platform</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold" style={{ fontFamily: 'Space Mono, monospace' }}>
                  Rs.{profile?.weeklyEarnings?.toLocaleString()}/wk
                </div>
                <div className="text-xs" style={{ color: '#10b981' }}>Verified</div>
              </div>
            </div>

            {/* Linked platforms */}
            <AnimatePresence>
              {(profile?.linkedPlatforms || []).map((p: any, i: number) => (
                <motion.div key={p.platform}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: 'rgba(124,58,237,0.1)' }}>
                      {platforms.find(pl => pl.value === p.platform)?.icon || '📱'}
                    </div>
                    <div>
                      <div className="text-sm font-medium">{p.label || p.platform?.replace(/_/g, ' ')}</div>
                      <div className="text-xs" style={{ color: '#4a5080' }}>Linked platform</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold" style={{ fontFamily: 'Space Mono, monospace' }}>
                        Rs.{p.weeklyEarnings?.toLocaleString()}/wk
                      </div>
                      <div className="text-xs" style={{ color: '#10b981' }}>Verified</div>
                    </div>
                    <button onClick={() => unlinkPlatform(p.platform)}
                      className="text-xs hover:underline" style={{ color: '#f43f5e' }}>
                      Unlink
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Aggregated total */}
            {profile?.aggregatedWeeklyEarnings > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="mt-4 pt-4 flex items-center justify-between"
                style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <div className="font-semibold">Aggregated Weekly Income</div>
                  <div className="text-xs" style={{ color: '#4a5080' }}>Used for premium pricing and payout calculation</div>
                </div>
                <div className="text-3xl font-bold" style={{ fontFamily: 'Space Mono, monospace', color: '#00e5ff' }}>
                  Rs.{profile.aggregatedWeeklyEarnings?.toLocaleString()}
                </div>
              </motion.div>
            )}
          </div>
        </FadeUp>

        {/* Link new platforms */}
        {available.length > 0 && (
          <FadeUp delay={0.2}>
            <div className="glass rounded-2xl p-5">
              <div className="font-semibold mb-4">Link Another Platform</div>
              <Stagger className="space-y-0">
                {available.map(p => (
                  <StaggerItem key={p.value}>
                    <div className="flex items-center justify-between py-3"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                          style={{ background: 'rgba(255,255,255,0.05)' }}>
                          {p.icon}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{p.label}</div>
                          <div className="text-xs" style={{ color: '#4a5080' }}>Tap to link and verify earnings</div>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => linkPlatform(p.value)}
                        disabled={linking === p.value}
                        className="px-4 py-2 rounded-xl text-xs font-semibold flex-shrink-0"
                        style={{
                          background: 'rgba(0,229,255,0.1)',
                          border: '1px solid rgba(0,229,255,0.3)',
                          color: '#00e5ff',
                          opacity: linking === p.value ? 0.5 : 1,
                        }}>
                        {linking === p.value ? 'Linking...' : 'Link'}
                      </motion.button>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
          </FadeUp>
        )}

        <FadeUp delay={0.3}>
          <p className="text-xs text-center leading-relaxed" style={{ color: '#4a5080' }}>
            Income verification uses simulated platform API data. In production, this connects via OAuth. Your data is never shared.
          </p>
        </FadeUp>
      </div>
    </div>
  )
}
