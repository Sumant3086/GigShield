'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import api from '@/lib/api'
import { FadeUp, Stagger, StaggerItem, Badge, ProgressBar, LiveDot, Spinner, Label } from '@/components/ui'
import Dropdown from '@/components/Dropdown'
import { useConfig } from '@/lib/useConfig'

const STATUS_MAP: Record<string, { color: string; bg: string }> = {
  paid:          { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  approved:      { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  auto_approved: { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  soft_hold:     { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  human_review:  { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
  pending:       { color: '#4a5080', bg: 'rgba(74,80,128,0.1)' },
  rejected:      { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-strong rounded-xl p-3 text-xs">
      <div className="text-[#4a5080] mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const { config } = useConfig()
  const [stats, setStats] = useState<any>(null)
  const [claims, setClaims] = useState<any[]>([])
  const [bcs, setBcs] = useState<any>(null)
  const [forecasts, setForecasts] = useState<any[]>([])
  const [fraudReports, setFraudReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [simForm, setSimForm] = useState({ type: 'heavy_rainfall', severity: 'red', zone: 'HSR Layout', city: 'Bengaluru' })
  const [simResult, setSimResult] = useState('')
  const [activeTab, setActiveTab] = useState<'claims' | 'reports' | 'forecasts'>('claims')

  function adminApi() {
    const token = localStorage.getItem('gs_admin_token')
    return { headers: { Authorization: `Bearer ${token}` } }
  }

  useEffect(() => {
    const token = localStorage.getItem('gs_admin_token')
    if (!token) { router.replace('/admin/login'); return }
    Promise.all([
      api.get('/admin/stats', adminApi()),
      api.get('/claims/admin/all', adminApi()),
      api.get('/admin/bcs-distribution', adminApi()),
      api.get('/forecasts/all', adminApi()).catch(() => ({ data: [] })),
      api.get('/reports/admin/all', adminApi()).catch(() => ({ data: [] })),
    ]).then(([s, c, b, f, rp]) => {
      setStats(s.data); setClaims(c.data); setBcs(b.data)
      setForecasts(f.data || []); setFraudReports(rp.data || [])
    }).catch(() => router.replace('/admin/login'))
      .finally(() => setLoading(false))
  }, [router])

  async function simulate() {
    setSimulating(true); setSimResult('')
    try {
      const { data } = await api.post('/triggers/simulate', {
        ...simForm,
        description: `Simulated ${simForm.type.replace(/_/g, ' ')} in ${simForm.zone}`,
      }, adminApi())
      setSimResult(`âœ“ Event created â€” ${data.claimsCreated} claim(s) auto-initiated`)
    } catch (e: any) { setSimResult(e.response?.data?.error || 'Failed') }
    finally { setSimulating(false) }
  }

  async function approveClaim(id: string) {
    try {
      await api.put(`/claims/admin/${id}/approve`, { note: 'Approved by admin' }, adminApi())
      setClaims(prev => prev.map(c => c._id === id ? { ...c, status: 'paid' } : c))
    } catch (e: any) { alert(e.response?.data?.error) }
  }

  async function rejectClaim(id: string) {
    try {
      await api.put(`/claims/admin/${id}/reject`, { note: 'Rejected' }, adminApi())
      setClaims(prev => prev.map(c => c._id === id ? { ...c, status: 'rejected' } : c))
    } catch (e: any) { alert(e.response?.data?.error) }
  }

  if (loading) return <Spinner />

  const cityData = stats?.cityBreakdown?.map((c: any) => ({ name: c._id, policies: c.count })) || []
  const bcsData = bcs ? [
    { name: 'Auto', value: bcs['60-100'], color: '#10b981' },
    { name: 'Hold', value: bcs['35-59'],  color: '#f59e0b' },
    { name: 'Review', value: bcs['0-34'], color: '#f43f5e' },
  ] : []

  const STAT_CARDS = [
    { label: 'Workers',          value: stats?.workers || 0,                                  color: '#00e5ff', icon: 'ðŸ‘¥' },
    { label: 'Active Policies',  value: stats?.activePolicies || 0,                           color: '#10b981', icon: 'ðŸ›¡ï¸' },
    { label: 'Total Claims',     value: stats?.totalClaims || 0,                              color: '#7c3aed', icon: 'ðŸ“‹' },
    { label: 'Loss Ratio',       value: `${stats?.lossRatio || 0}%`,                          color: stats?.lossRatio > 80 ? '#f43f5e' : '#10b981', icon: 'ðŸ“Š' },
    { label: 'Premium Collected',value: `â‚¹${(stats?.totalPremiumCollected || 0).toLocaleString()}`, color: '#f59e0b', icon: 'ðŸ’°' },
    { label: 'Payouts Issued',   value: `â‚¹${(stats?.totalPayoutIssued || 0).toLocaleString()}`,     color: '#f43f5e', icon: 'ðŸ’¸' },
    { label: 'Active Triggers',  value: stats?.activeTriggers || 0,                           color: '#f43f5e', icon: 'âš¡' },
    { label: 'Human Review',     value: stats?.claimsByStatus?.human_review || 0,             color: '#f59e0b', icon: 'ðŸ”' },
  ]

  return (
    <div className="min-h-screen bg-[#04050f] relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-1" style={{ background: 'linear-gradient(90deg, #7c3aed, #00e5ff, #7c3aed)' }} />
        <motion.div animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <motion.header initial={{ y: -60 }} animate={{ y: 0 }} transition={{ duration: 0.5 }}
        className="sticky top-0 z-20 border-b border-white/5 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(4,5,15,0.9)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #00e5ff)' }}>âš™ï¸</div>
          <span className="text-lg font-bold">Gig<span className="grad-cyan">Shield</span></span>
          <Badge color="violet">Admin</Badge>
        </div>
        <div className="flex items-center gap-3">
          <LiveDot color="emerald" />
          <span className="text-xs text-[#4a5080]">Live</span>
          <button onClick={() => { localStorage.removeItem('gs_admin_token'); router.replace('/admin/login') }}
            className="text-xs text-[#4a5080] hover:text-white transition-colors ml-2">Sign out</button>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 relative z-10">

        {/* Stats Grid */}
        <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STAT_CARDS.map((s, i) => (
            <StaggerItem key={s.label}>
              <motion.div whileHover={{ y: -4, scale: 1.02 }} className="glass rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full pointer-events-none"
                  style={{ background: `radial-gradient(circle, ${s.color}12 0%, transparent 70%)`, transform: 'translate(40%, -40%)' }} />
                <div className="text-xl mb-2">{s.icon}</div>
                <Label>{s.label}</Label>
                <div className="text-2xl font-bold stat-num" style={{ color: s.color }}>{s.value}</div>
              </motion.div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cityData.length > 0 && (
            <FadeUp>
              <div className="glass rounded-2xl p-5">
                <Label>Policies by City</Label>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={cityData} barSize={28}>
                    <XAxis dataKey="name" tick={{ fill: '#4a5080', fontSize: 11, fontFamily: 'Space Grotesk' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#4a5080', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,229,255,0.05)' }} />
                    <Bar dataKey="policies" radius={[6, 6, 0, 0]}
                      fill="url(#barGrad)" />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00e5ff" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </FadeUp>
          )}

          {bcsData.some(d => d.value > 0) && (
            <FadeUp delay={0.1}>
              <div className="glass rounded-2xl p-5">
                <Label>BCS Distribution</Label>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={bcsData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {bcsData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {bcsData.map(d => (
                    <div key={d.name} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-[#4a5080]">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          )}
        </div>

        {/* Simulate Disruption */}
        <FadeUp delay={0.2}>
          <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(0,229,255,0.15)' }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[#00e5ff]">âš¡</span>
              <span className="font-semibold text-[#00e5ff]">Simulate Disruption Event</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                <Dropdown key="type" value={simForm.type} onChange={v => setSimForm({ ...simForm, type: v })}
                  options={(config?.triggerTypes || []).map(t => ({ value: t.key, label: t.label, icon: t.icon }))} />,
                <Dropdown key="sev" value={simForm.severity} onChange={v => setSimForm({ ...simForm, severity: v })}
                  options={[
                    { value: 'orange',  label: 'Orange Alert', sub: '0.5Ã— payout' },
                    { value: 'red',     label: 'Red Alert',    sub: '1.0Ã— payout' },
                    { value: 'disaster',label: 'Disaster',     sub: '3.0Ã— payout' },
                  ]} />,
                <Dropdown key="city" value={simForm.city} onChange={v => setSimForm({ ...simForm, city: v })}
                  options={(config?.cities || []).map(c => ({ value: c.name, label: c.name }))} />,
                <input key="zone" value={simForm.zone} onChange={e => setSimForm({ ...simForm, zone: e.target.value })}
                  placeholder="Zone name" className="input-base text-sm" />,
              ].map((el, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  {el}
                </motion.div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={simulate} disabled={simulating} className="btn-primary px-8 py-3">
                {simulating ? 'Firing...' : 'Fire Disruption Event'}
              </motion.button>
              {simResult && (
                <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                  className="text-sm text-[#10b981]">{simResult}</motion.span>
              )}
            </div>
          </div>
        </FadeUp>

        {/* Tabs */}
        <FadeUp delay={0.3}>
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex border-b border-white/5">
              {(['claims', 'reports', 'forecasts'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 text-sm font-semibold capitalize transition-all relative ${activeTab === tab ? 'text-[#00e5ff]' : 'text-[#4a5080] hover:text-white'}`}>
                  {tab === 'claims' ? `Claims (${claims.length})` : tab === 'reports' ? `Fraud Reports (${fraudReports.length})` : `Forecasts (${forecasts.length})`}
                  {activeTab === tab && (
                    <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5"
                      style={{ background: 'linear-gradient(90deg, #00e5ff, #7c3aed)' }} />
                  )}
                </button>
              ))}
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">
                {activeTab === 'claims' && (
                  <motion.div key="claims" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-[10px] text-[#4a5080] tracking-wider uppercase border-b border-white/5">
                            {['Worker', 'Trigger', 'Zone', 'BCS', 'Payout', 'Status', 'Actions'].map(h => (
                              <th key={h} className="text-left pb-3 font-semibold pr-4">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {!claims.length ? (
                            <tr><td colSpan={7} className="text-center py-10 text-[#4a5080]">No claims yet. Simulate a disruption to generate claims.</td></tr>
                          ) : claims.map((c: any, i: number) => {
                            const s = STATUS_MAP[c.status] || STATUS_MAP.pending
                            return (
                              <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                                <td className="py-3 pr-4">
                                  <div className="font-medium">{c.worker?.name || 'â€”'}</div>
                                  <div className="text-xs text-[#4a5080]">{c.worker?.phone}</div>
                                </td>
                                <td className="py-3 pr-4 text-xs capitalize">{c.triggerType?.replace(/_/g, ' ')}</td>
                                <td className="py-3 pr-4 text-xs text-[#4a5080]">{c.zone}</td>
                                <td className="py-3 pr-4">
                                  <span className="font-bold stat-num text-sm" style={{ color: c.bcsScore >= (config?.bcsThresholds?.autoApprove || 60) ? '#10b981' : c.bcsScore >= (config?.bcsThresholds?.softHold || 35) ? '#f59e0b' : '#f43f5e' }}>
                                    {c.bcsScore}
                                  </span>
                                </td>
                                <td className="py-3 pr-4 font-bold stat-num text-[#00e5ff]">â‚¹{c.payoutAmount}</td>
                                <td className="py-3 pr-4">
                                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ color: s.color, background: s.bg }}>
                                    {c.status?.replace(/_/g, ' ')}
                                  </span>
                                </td>
                                <td className="py-3">
                                  {['pending', 'soft_hold', 'human_review'].includes(c.status) && (
                                    <div className="flex gap-2">
                                      <button onClick={() => approveClaim(c._id)} className="text-xs text-[#10b981] hover:underline">Approve</button>
                                      <button onClick={() => rejectClaim(c._id)} className="text-xs text-[#f43f5e] hover:underline">Reject</button>
                                    </div>
                                  )}
                                </td>
                              </motion.tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'reports' && (
                  <motion.div key="reports" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    {!fraudReports.length ? (
                      <div className="text-center py-10 text-[#4a5080]">No fraud reports yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {fraudReports.map((r: any, i: number) => (
                          <motion.div key={r._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <div>
                              <div className="text-sm font-medium capitalize">{r.reason?.replace(/_/g, ' ')}</div>
                              <div className="text-xs text-[#4a5080]">by {r.reportedBy?.name} Â· Trust: {r.reportedBy?.communityTrustScore}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs px-2 py-1 rounded-full" style={{
                                color: r.status === 'verified' ? '#10b981' : r.status === 'dismissed' ? '#4a5080' : '#f59e0b',
                                background: r.status === 'verified' ? 'rgba(16,185,129,0.1)' : r.status === 'dismissed' ? 'rgba(74,80,128,0.1)' : 'rgba(245,158,11,0.1)',
                              }}>{r.status}</span>
                              {r.status === 'pending' && (
                                <div className="flex gap-2">
                                  <button onClick={async () => {
                                    await api.put(`/reports/admin/${r._id}/verify`, {}, adminApi())
                                    setFraudReports(prev => prev.map(x => x._id === r._id ? { ...x, status: 'verified' } : x))
                                  }} className="text-xs text-[#10b981] hover:underline">Verify +â‚¹15</button>
                                  <button onClick={async () => {
                                    await api.put(`/reports/admin/${r._id}/dismiss`, {}, adminApi())
                                    setFraudReports(prev => prev.map(x => x._id === r._id ? { ...x, status: 'dismissed' } : x))
                                  }} className="text-xs text-[#f43f5e] hover:underline">Dismiss</button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'forecasts' && (
                  <motion.div key="forecasts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <div className="flex justify-end mb-4">
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={async () => { await api.post('/forecasts/run', {}, adminApi()); window.location.reload() }}
                        className="text-xs px-4 py-2 rounded-xl font-semibold"
                        style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                        Run Prediction Engine
                      </motion.button>
                    </div>
                    {!forecasts.length ? (
                      <div className="text-center py-10 text-[#4a5080]">No active forecasts. Run the prediction engine.</div>
                    ) : (
                      <div className="space-y-3">
                        {forecasts.map((f: any, i: number) => (
                          <motion.div key={f._id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            className="flex items-center justify-between p-4 rounded-xl"
                            style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.1)' }}>
                            <div>
                              <div className="text-sm font-medium capitalize">{f.type?.replace(/_/g, ' ')} â€” {f.zone}, {f.city}</div>
                              <div className="text-xs text-[#4a5080] mt-0.5">{f.recommendation?.slice(0, 100)}</div>
                            </div>
                            <div className="text-right ml-4 flex-shrink-0">
                              <div className="font-bold stat-num" style={{ color: f.confidence > 70 ? '#f43f5e' : f.confidence > 45 ? '#f59e0b' : '#4a5080' }}>
                                {f.confidence}%
                              </div>
                              <div className="text-xs text-[#4a5080]">{new Date(f.forecastedFor).toLocaleDateString('en-IN')}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </FadeUp>
      </div>
    </div>
  )
}

