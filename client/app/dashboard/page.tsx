'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import Link from 'next/link'
import { FadeUp, Stagger, StaggerItem, Badge, ProgressBar, LiveDot, Spinner, Label } from '@/components/ui'
import { useConfig, getTriggerIcon } from '@/lib/useConfig'

const STATUS_MAP: Record<string, { label: string; color: 'emerald'|'amber'|'rose'|'muted'|'cyan' }> = {
  paid:          { label: 'Paid',          color: 'emerald' },
  approved:      { label: 'Approved',      color: 'emerald' },
  auto_approved: { label: 'Auto Approved', color: 'emerald' },
  soft_hold:     { label: 'Soft Hold',     color: 'amber' },
  human_review:  { label: 'Under Review',  color: 'rose' },
  pending:       { label: 'Pending',       color: 'muted' },
  rejected:      { label: 'Rejected',      color: 'rose' },
}
const NAV = [
  { href: '/dashboard', icon: '🏠', label: 'Home' },
  { href: '/claims',    icon: '📋', label: 'Claims' },
  { href: '/income',    icon: '📱', label: 'Income' },
  { href: '/reports',   icon: '🛡️', label: 'Reports' },
]

export default function Dashboard() {
  const router = useRouter()
  const { config } = useConfig()
  const [data, setData] = useState<any>(null)
  const [triggers, setTriggers] = useState<any[]>([])
  const [forecasts, setForecasts] = useState<any[]>([])
  const [pool, setPool] = useState<any>(null)
  const [income, setIncome] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [joiningPool, setJoiningPool] = useState(false)
  const [simOpen, setSimOpen] = useState(false)
  const [simType, setSimType] = useState('heavy_rainfall')
  const [simLoading, setSimLoading] = useState(false)
  const [simResult, setSimResult] = useState('')
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    const token = localStorage.getItem('gs_token')
    if (!token) { router.replace('/login'); return }
    Promise.all([
      api.get('/workers/dashboard'),
      api.get('/triggers/active').catch(() => ({ data: [] })),
      api.get('/forecasts/my').catch(() => ({ data: [] })),
      api.get('/pools/my').catch(() => ({ data: null })),
      api.get('/income/profile').catch(() => ({ data: null })),
    ]).then(([d, t, f, p, inc]) => {
      setData(d.data); setTriggers(t.data || [])
      setForecasts(f.data || []); setPool(p.data); setIncome(inc.data)
    }).catch(() => router.replace('/login'))
      .finally(() => setLoading(false))
  }, [router])

  async function joinPool() {
    setJoiningPool(true)
    try { const { data: r } = await api.post('/pools/join'); setPool({ inPool: true, pool: r.pool }) }
    catch (e: any) { alert(e.response?.data?.error) }
    finally { setJoiningPool(false) }
  }

  async function simulate() {
    setSimLoading(true); setSimResult('')
    try {
      const adminToken = localStorage.getItem('gs_admin_token')
      const headers = adminToken ? { Authorization: `Bearer ${adminToken}` } : {}
      const { data: r } = await api.post('/triggers/simulate', {
        type: simType, severity: 'red',
        zone: data?.worker?.zone, city: data?.worker?.city,
        description: `Simulated ${simType.replace(/_/g, ' ')} in ${data?.worker?.zone}`,
      }, { headers })
      setSimResult(`✓ ${r.claimsCreated} claim(s) initiated`)
    } catch { setSimResult('Need admin token — login as admin first') }
    finally { setSimLoading(false) }
  }

  function logout() { localStorage.removeItem('gs_token'); router.replace('/login') }

  if (loading) return <Spinner />
  const { worker, policy, claims, totalProtected } = data || {}

  return (
    <div className="min-h-screen bg-[#04050f] flex">
      {/* Fixed background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div animate={{ x:[0,30,0], y:[0,-20,0] }} transition={{ duration:20, repeat:Infinity }}
          className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background:'radial-gradient(circle,rgba(124,58,237,0.08) 0%,transparent 70%)' }} />
        <motion.div animate={{ x:[0,-20,0], y:[0,30,0] }} transition={{ duration:25, repeat:Infinity }}
          className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full"
          style={{ background:'radial-gradient(circle,rgba(0,229,255,0.06) 0%,transparent 70%)' }} />
      </div>

      {/* SIDEBAR */}
      <motion.aside initial={{ x:-80, opacity:0 }} animate={{ x:0, opacity:1 }}
        transition={{ duration:0.5, ease:[0.22,1,0.36,1] }}
        className="hidden lg:flex flex-col w-64 fixed top-0 left-0 bottom-0 z-20 p-6"
        style={{ background:'rgba(4,5,15,0.95)', backdropFilter:'blur(20px)', borderRight:'1px solid rgba(255,255,255,0.06)' }}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            style={{ background:'linear-gradient(135deg,#00e5ff,#7c3aed)' }}>🛡️</div>
          <span className="text-xl font-bold">
            <span style={{ color:'#e8eaf6' }}>Gig</span>
            <span style={{ background:'linear-gradient(135deg,#00e5ff,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Shield</span>
          </span>
        </div>

        {/* Worker info */}
        <div className="p-4 rounded-2xl mb-6" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
            style={{ background:'linear-gradient(135deg,rgba(0,229,255,0.2),rgba(124,58,237,0.2))' }}>
            {worker?.name?.[0] || '?'}
          </div>
          <div className="text-sm font-semibold" style={{ color:'#e8eaf6' }}>{worker?.name}</div>
          <div className="text-xs mt-0.5 capitalize" style={{ color:'#4a5080' }}>{worker?.platform?.replace(/_/g,' ')} · {worker?.zone}</div>
          {worker?.communityCredits > 0 && (
            <div className="mt-2 text-xs font-semibold" style={{ color:'#10b981' }}>₹{worker.communityCredits} credits</div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}>
              <motion.div whileHover={{ x:4 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: item.href === '/dashboard' ? 'rgba(0,229,255,0.08)' : 'transparent',
                  color: item.href === '/dashboard' ? '#00e5ff' : '#4a5080',
                  border: item.href === '/dashboard' ? '1px solid rgba(0,229,255,0.2)' : '1px solid transparent',
                }}>
                <span className="text-base">{item.icon}</span>
                {item.label}
              </motion.div>
            </Link>
          ))}
        </nav>

        {/* Policy status in sidebar */}
        {policy && (
          <div className="p-4 rounded-2xl mb-4" style={{ background:'rgba(0,229,255,0.06)', border:'1px solid rgba(0,229,255,0.15)' }}>
            <div className="flex items-center gap-2 mb-1">
              <LiveDot color="emerald" />
              <span className="text-xs font-semibold" style={{ color:'#00e5ff' }}>Coverage Active</span>
            </div>
            <div className="text-xs capitalize" style={{ color:'#4a5080' }}>{policy.tier} Shield · ₹{policy.weeklyPremium}/wk</div>
          </div>
        )}

        <button onClick={logout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors"
          style={{ color:'#4a5080' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
          onMouseLeave={e => (e.currentTarget.style.color = '#4a5080')}>
          <span>↩</span> Sign out
        </button>
      </motion.aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 lg:ml-64 relative z-10">
        {/* Top bar */}
        <motion.header initial={{ y:-60, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.5 }}
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 lg:hidden"
          style={{ background:'rgba(4,5,15,0.9)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{ background:'linear-gradient(135deg,#00e5ff,#7c3aed)' }}>🛡️</div>
            <span className="font-bold">Gig<span style={{ background:'linear-gradient(135deg,#00e5ff,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Shield</span></span>
          </div>
          <button onClick={logout} className="text-xs" style={{ color:'#4a5080' }}>Sign out</button>
        </motion.header>

        <div className="p-6 lg:p-8 space-y-6 pb-24 lg:pb-8">
          {/* Page title */}
          <FadeUp>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold" style={{ color:'#e8eaf6' }}>Dashboard</h1>
                <p className="text-sm mt-0.5" style={{ color:'#4a5080' }}>
                  {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' })}
                </p>
              </div>
              {!policy && (
                <Link href="/onboard">
                  <motion.div whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                    className="btn-primary px-5 py-2.5 text-sm rounded-xl">Get Covered</motion.div>
                </Link>
              )}
            </div>
          </FadeUp>

          {/* Alert banners */}
          <AnimatePresence>
            {triggers.length > 0 && (
              <motion.div initial={{ opacity:0, y:-10, scale:0.98 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0 }}
                className="rounded-2xl p-4 relative overflow-hidden"
                style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.3)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <LiveDot color="rose" />
                  <span className="text-sm font-bold" style={{ color:'#f43f5e' }}>Active Disruption — Claims Processing</span>
                </div>
                {triggers.map((t:any) => (
                  <div key={t._id} className="text-sm" style={{ color:'rgba(232,234,246,0.7)' }}>{getTriggerIcon(config, t.type)} {t.description}</div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {forecasts.length > 0 && (
            <motion.div initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
              className="rounded-2xl p-4" style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)' }}>
              <div className="flex items-center gap-2 mb-3">
                <span>🔮</span>
                <span className="text-sm font-bold" style={{ color:'#f59e0b' }}>48-Hour Forecast</span>
                <span className="ml-auto text-xs" style={{ color:'#4a5080' }}>IMD + Pattern Model</span>
              </div>
              <div className="space-y-2">
                {forecasts.slice(0,2).map((f:any) => (
                  <motion.div key={f._id} whileHover={{ x:4 }}
                    className="flex items-center justify-between p-3 rounded-xl text-xs"
                    style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.12)' }}>
                    <div>
                      <span className="font-semibold capitalize">{getTriggerIcon(config, f.type)} {f.type?.replace(/_/g,' ')}</span>
                      <span className="ml-2" style={{ color:'#4a5080' }}>{f.zone}</span>
                      <div className="mt-0.5" style={{ color:'#4a5080' }}>{f.recommendation?.slice(0,70)}...</div>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="font-bold" style={{ fontFamily:'Space Mono,monospace', color:'#f59e0b' }}>{f.confidence}%</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TWO-COLUMN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT — main column */}
            <div className="lg:col-span-2 space-y-5">

              {/* Policy card */}
              <FadeUp>
                <div className="rounded-2xl p-6 relative overflow-hidden"
                  style={policy
                    ? { background:'linear-gradient(135deg,rgba(0,229,255,0.06) 0%,rgba(124,58,237,0.06) 100%)', border:'1px solid rgba(0,229,255,0.2)' }
                    : { background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  {policy && <div className="absolute inset-0 pointer-events-none"
                    style={{ background:'radial-gradient(ellipse at top left,rgba(0,229,255,0.05) 0%,transparent 60%)' }} />}
                  <div className="relative z-10">
                    <Label>Coverage Status</Label>
                    {policy ? (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <LiveDot color="emerald" />
                          <span className="text-xl font-bold capitalize" style={{ color:'#e8eaf6' }}>{policy.tier} Shield — Active</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm" style={{ color:'#4a5080' }}>
                          <span>₹{policy.weeklyPremium}/week</span>
                          <span>Up to <span style={{ color:'#00e5ff', fontWeight:600 }}>₹{policy.maxWeeklyPayout?.toLocaleString()}</span> payout</span>
                          <span>{new Date(policy.endDate).toLocaleDateString('en-IN')} expiry</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-xl font-bold" style={{ color:'#4a5080' }}>No active coverage</div>
                    )}
                  </div>
                </div>
              </FadeUp>

              {/* Stats row */}
              <Stagger className="grid grid-cols-3 gap-4">
                {[
                  { label:'Total Protected', value:`₹${(totalProtected||0).toLocaleString()}`, icon:'💰', color:'#00e5ff' },
                  { label:'Claims Filed',    value:claims?.length||0,                          icon:'📋', color:'#7c3aed' },
                  { label:'Credits Earned',  value:`₹${worker?.communityCredits||0}`,          icon:'🛡️', color:'#10b981' },
                ].map(s => (
                  <StaggerItem key={s.label}>
                    <motion.div whileHover={{ y:-4 }} className="rounded-2xl p-5 relative overflow-hidden"
                      style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                      <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none"
                        style={{ background:`radial-gradient(circle,${s.color}15 0%,transparent 70%)`, transform:'translate(40%,-40%)' }} />
                      <div className="text-xl mb-2">{s.icon}</div>
                      <Label>{s.label}</Label>
                      <div className="text-2xl font-bold" style={{ fontFamily:'Space Mono,monospace', color:s.color }}>{s.value}</div>
                    </motion.div>
                  </StaggerItem>
                ))}
              </Stagger>

              {/* Claims list */}
              <FadeUp delay={0.15}>
                <div className="rounded-2xl overflow-hidden" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                    <span className="font-semibold" style={{ color:'#e8eaf6' }}>Recent Claims</span>
                    <Link href="/claims" className="text-xs font-medium" style={{ color:'#00e5ff' }}>View all →</Link>
                  </div>
                  {!claims?.length ? (
                    <div className="text-center py-10 text-sm" style={{ color:'#4a5080' }}>
                      <motion.div animate={{ y:[0,-6,0] }} transition={{ duration:3, repeat:Infinity }} className="text-3xl mb-2">✨</motion.div>
                      No claims yet — you are all clear
                    </div>
                  ) : (
                    <div>
                      {claims.slice(0,5).map((c:any, i:number) => {
                        const s = STATUS_MAP[c.status] || STATUS_MAP.pending
                        return (
                          <motion.div key={c._id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.06 }}
                            whileHover={{ backgroundColor:'rgba(255,255,255,0.02)' }}
                            className="flex items-center justify-between px-5 py-4 transition-colors"
                            style={{ borderBottom: i < Math.min(claims.length,5)-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                                style={{ background:'rgba(255,255,255,0.05)' }}>{getTriggerIcon(config, c.triggerType)||'⚡'}</div>
                              <div>
                                <div className="text-sm font-medium capitalize" style={{ color:'#e8eaf6' }}>{c.triggerType?.replace(/_/g,' ')}</div>
                                <div className="text-xs" style={{ color:'#4a5080' }}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-sm" style={{ fontFamily:'Space Mono,monospace', color:'#00e5ff' }}>₹{c.payoutAmount}</div>
                              <Badge color={s.color}>{s.label}</Badge>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </FadeUp>
            </div>

            {/* RIGHT — sidebar widgets */}
            <div className="space-y-5">

              {/* Pool widget */}
              <FadeUp delay={0.1}>
                <div className="rounded-2xl p-5" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span>🤝</span>
                    <span className="text-sm font-semibold" style={{ color:'#e8eaf6' }}>Risk Pool</span>
                  </div>
                  {pool?.inPool ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label:'Health', value:`${pool.pool?.healthScore||0}`, color:'#10b981' },
                          { label:'Discount', value:`${pool.pool?.discountPercent||0}%`, color:'#00e5ff' },
                        ].map(s => (
                          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background:'rgba(255,255,255,0.04)' }}>
                            <div className="text-lg font-bold" style={{ fontFamily:'Space Mono,monospace', color:s.color }}>{s.value}</div>
                            <div className="text-xs" style={{ color:'#4a5080' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <ProgressBar value={pool.pool?.healthScore||0} color="emerald" />
                      <div className="text-xs" style={{ color:'#4a5080' }}>{pool.memberCount||0} members · {pool.lossRatio}% loss ratio</div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs mb-3" style={{ color:'#4a5080' }}>Join workers in {worker?.zone} — unlock up to <span style={{ color:'#00e5ff' }}>15% discount</span></p>
                      <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                        onClick={joinPool} disabled={joiningPool}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold"
                        style={{ background:'rgba(0,229,255,0.1)', border:'1px solid rgba(0,229,255,0.3)', color:'#00e5ff' }}>
                        {joiningPool ? 'Joining...' : 'Join Pool'}
                      </motion.button>
                    </div>
                  )}
                </div>
              </FadeUp>

              {/* Income widget */}
              <FadeUp delay={0.15}>
                <div className="rounded-2xl p-5" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span>📱</span>
                      <span className="text-sm font-semibold" style={{ color:'#e8eaf6' }}>Income</span>
                    </div>
                    <Link href="/income" className="text-xs" style={{ color:'#00e5ff' }}>Manage →</Link>
                  </div>
                  {income?.aggregatedWeeklyEarnings > 0 ? (
                    <div>
                      <div className="text-2xl font-bold mb-1" style={{ fontFamily:'Space Mono,monospace', color:'#00e5ff' }}>
                        ₹{income.aggregatedWeeklyEarnings?.toLocaleString()}
                      </div>
                      <div className="text-xs" style={{ color:'#4a5080' }}>Aggregated weekly · {income.linkedPlatforms?.length||1} platform(s)</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xl font-bold mb-1" style={{ fontFamily:'Space Mono,monospace', color:'#e8eaf6' }}>
                        ₹{worker?.weeklyEarnings?.toLocaleString()}
                      </div>
                      <div className="text-xs mb-3" style={{ color:'#4a5080' }}>Single platform · Link more for higher payouts</div>
                      <Link href="/income" className="text-xs font-semibold" style={{ color:'#00e5ff' }}>+ Link platforms →</Link>
                    </div>
                  )}
                </div>
              </FadeUp>

              {/* Fingerprint widget */}
              {worker?.earningsFingerprint?.lastUpdated && (
                <FadeUp delay={0.2}>
                  <div className="rounded-2xl p-5" style={{ background:'rgba(124,58,237,0.06)', border:'1px solid rgba(124,58,237,0.2)' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <span>🔍</span>
                      <span className="text-sm font-semibold" style={{ color:'#e8eaf6' }}>Fingerprint</span>
                      <Badge color="violet">AI</Badge>
                    </div>
                    <div className="space-y-2 text-xs">
                      {[
                        { label:'Peak hours', value: worker.earningsFingerprint.peakHours?.slice(0,3).map((h:number)=>`${h}:00`).join(', ') },
                        { label:'Active days', value:`${worker.earningsFingerprint.activeDays?.length||0}/week` },
                        { label:'Top zone', value: worker.earningsFingerprint.preferredZones?.[0]||worker?.zone },
                      ].map(s => (
                        <div key={s.label} className="flex justify-between">
                          <span style={{ color:'#4a5080' }}>{s.label}</span>
                          <span style={{ color:'#e8eaf6', fontWeight:500 }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeUp>
              )}

              {/* Simulate */}
              <FadeUp delay={0.25}>
                <div className="rounded-2xl p-5" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
                  <button onClick={() => setSimOpen(!simOpen)}
                    className="flex items-center gap-2 text-sm w-full transition-colors"
                    style={{ color:'#4a5080' }}
                    onMouseEnter={e => (e.currentTarget.style.color='#e8eaf6')}
                    onMouseLeave={e => (e.currentTarget.style.color='#4a5080')}>
                    <motion.span animate={{ rotate:simOpen?90:0 }} style={{ color:'#00e5ff' }}>⚡</motion.span>
                    Simulate Event
                    <motion.span animate={{ rotate:simOpen?180:0 }} className="ml-auto text-xs">▼</motion.span>
                  </button>
                  <AnimatePresence>
                    {simOpen && (
                      <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
                        transition={{ duration:0.3 }} className="overflow-hidden">
                        <div className="pt-4 space-y-3">
                          <select value={simType} onChange={e => setSimType(e.target.value)} className="input-base text-sm">
                            <option value="heavy_rainfall">🌧️ Heavy Rainfall</option>
                            <option value="extreme_heat">🌡️ Extreme Heat</option>
                            <option value="flood_warning">🌊 Flood Warning</option>
                            <option value="civic_curfew">🚧 Civic Curfew</option>
                            <option value="platform_halt">📦 Platform Halt</option>
                          </select>
                          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                            onClick={simulate} disabled={simLoading}
                            className="w-full py-2.5 rounded-xl text-xs font-semibold"
                            style={{ background:'rgba(0,229,255,0.1)', border:'1px solid rgba(0,229,255,0.3)', color:'#00e5ff' }}>
                            {simLoading ? 'Simulating...' : `Fire in ${data?.worker?.zone}`}
                          </motion.button>
                          {simResult && <p className="text-xs" style={{ color:'#10b981' }}>{simResult}</p>}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeUp>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <motion.nav initial={{ y:80 }} animate={{ y:0 }} transition={{ delay:0.5, duration:0.4, ease:[0.22,1,0.36,1] }}
        className="fixed bottom-0 left-0 right-0 z-20 lg:hidden"
        style={{ background:'rgba(4,5,15,0.95)', backdropFilter:'blur(20px)', borderTop:'1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center justify-around px-4 py-3">
          {NAV.map(item => (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all"
              style={{ color: item.href==='/dashboard' ? '#00e5ff' : '#4a5080' }}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </motion.nav>
    </div>
  )
}


