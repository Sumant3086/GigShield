'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import Link from 'next/link'
import { FadeUp, Stagger, StaggerItem, Badge, Spinner } from '@/components/ui'
import { useConfig, getTriggerIcon } from '@/lib/useConfig'

const STATUS_MAP: Record<string, { label:string; color:'emerald'|'amber'|'rose'|'muted'|'cyan'; bg:string; border:string }> = {
  paid:          { label:'Paid',          color:'emerald', bg:'rgba(16,185,129,0.08)',  border:'rgba(16,185,129,0.25)' },
  approved:      { label:'Approved',      color:'emerald', bg:'rgba(16,185,129,0.08)',  border:'rgba(16,185,129,0.25)' },
  auto_approved: { label:'Auto Approved', color:'emerald', bg:'rgba(16,185,129,0.08)',  border:'rgba(16,185,129,0.25)' },
  soft_hold:     { label:'Soft Hold',     color:'amber',   bg:'rgba(245,158,11,0.08)',  border:'rgba(245,158,11,0.25)' },
  human_review:  { label:'Under Review',  color:'rose',    bg:'rgba(244,63,94,0.08)',   border:'rgba(244,63,94,0.25)' },
  pending:       { label:'Pending',       color:'muted',   bg:'rgba(74,80,128,0.08)',   border:'rgba(74,80,128,0.2)' },
  rejected:      { label:'Rejected',      color:'rose',    bg:'rgba(244,63,94,0.08)',   border:'rgba(244,63,94,0.25)' },
}
const TRIGGER_ICONS: Record<string,string> = {
  heavy_rainfall:'🌧️', extreme_heat:'🌡️', flood_warning:'🌊', civic_curfew:'🚧', platform_halt:'📦',
}
const REPORT_REASONS = [
  { value:'worker_not_in_zone',    label:'Worker was not in the zone' },
  { value:'gps_spoofing_suspected',label:'GPS spoofing suspected' },
  { value:'known_fraudster',       label:'Known fraudster in community' },
  { value:'coordinated_group',     label:'Coordinated group fraud' },
  { value:'other',                 label:'Other reason' },
]

export default function ClaimsPage() {
  const router = useRouter()
  const { config } = useConfig()
  const reportReasons = config?.fraudReportReasons || REPORT_REASONS
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<string|null>(null)
  const [reportingClaim, setReportingClaim] = useState<string|null>(null)
  const [reportForm, setReportForm] = useState({ reason:'worker_not_in_zone', description:'' })
  const [submittingReport, setSubmittingReport] = useState(false)
  const [myReports, setMyReports] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const token = localStorage.getItem('gs_token')
    if (!token) { router.replace('/login'); return }
    Promise.all([api.get('/claims'), api.get('/reports/my').catch(() => ({ data:[] }))])
      .then(([c,r]) => { setClaims(c.data); setMyReports(r.data||[]) })
      .finally(() => setLoading(false))
  }, [router])

  async function confirmClaim(id:string) {
    setConfirming(id)
    try {
      await api.post(`/claims/confirm/${id}`)
      setClaims(prev => prev.map(c => c._id===id ? { ...c, status:'paid' } : c))
    } catch (e:any) { alert(e.response?.data?.error) }
    finally { setConfirming(null) }
  }

  async function submitReport(claimId:string) {
    setSubmittingReport(true)
    try {
      await api.post('/reports', { claimId, ...reportForm })
      setReportingClaim(null)
      setMyReports(prev => [...prev, { claim:{ _id:claimId }, status:'pending' }])
    } catch (e:any) { alert(e.response?.data?.error) }
    finally { setSubmittingReport(false) }
  }

  const reportedIds = new Set(myReports.map((r:any) => r.claim?._id||r.claim))
  const FILTERS = ['all','paid','soft_hold','human_review','rejected']
  const filtered = filter==='all' ? claims : claims.filter(c => c.status===filter)

  if (loading) return <Spinner />

  return (
    <div className="min-h-screen bg-[#04050f]">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background:'radial-gradient(ellipse 60% 40% at 80% 20%,rgba(124,58,237,0.06) 0%,transparent 70%)' }} />

      <motion.header initial={{ y:-60 }} animate={{ y:0 }} transition={{ duration:0.5 }}
        className="sticky top-0 z-20 border-b px-6 py-4 flex items-center justify-between"
        style={{ background:'rgba(4,5,15,0.9)', backdropFilter:'blur(20px)', borderColor:'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm transition-colors"
            style={{ color:'#4a5080' }}
            onMouseEnter={e=>(e.currentTarget.style.color='#e8eaf6')}
            onMouseLeave={e=>(e.currentTarget.style.color='#4a5080')}>
            ← Dashboard
          </Link>
          <span className="text-lg font-bold" style={{ color:'#e8eaf6' }}>Claims</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background:'rgba(0,229,255,0.1)', color:'#00e5ff' }}>{claims.length}</span>
        </div>
        <Link href="/reports" className="text-xs font-medium" style={{ color:'#00e5ff' }}>My Reports →</Link>
      </motion.header>

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Community watch */}
        <FadeUp className="mb-6">
          <div className="flex items-start gap-4 p-5 rounded-2xl"
            style={{ background:'rgba(0,229,255,0.04)', border:'1px solid rgba(0,229,255,0.15)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background:'rgba(0,229,255,0.1)' }}>🛡️</div>
            <div>
              <div className="font-semibold text-sm mb-1" style={{ color:'#e8eaf6' }}>Community Fraud Watch</div>
              <div className="text-xs" style={{ color:'#4a5080' }}>
                See suspicious activity in your zone? Report it and earn <span style={{ color:'#00e5ff', fontWeight:600 }}>₹15 premium credit</span> when verified.
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Filter tabs */}
        <FadeUp delay={0.05} className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-2 rounded-xl text-xs font-semibold flex-shrink-0 transition-all capitalize"
              style={{
                background: filter===f ? 'rgba(0,229,255,0.1)' : 'rgba(255,255,255,0.04)',
                border: filter===f ? '1px solid rgba(0,229,255,0.3)' : '1px solid rgba(255,255,255,0.07)',
                color: filter===f ? '#00e5ff' : '#4a5080',
              }}>
              {f==='all' ? `All (${claims.length})` : f.replace(/_/g,' ')}
            </button>
          ))}
        </FadeUp>

        {!filtered.length ? (
          <FadeUp className="text-center py-20">
            <div style={{ color:'#4a5080' }}>
            <motion.div animate={{ y:[0,-8,0] }} transition={{ duration:3, repeat:Infinity }} className="text-5xl mb-4">✨</motion.div>
            <div className="font-semibold text-lg mb-2" style={{ color:'#e8eaf6' }}>No claims yet</div>
            <div className="text-sm">When a disruption hits your zone, claims appear here automatically.</div>
          </div>
          </FadeUp>
        ) : (
          <Stagger className="space-y-4">
            {filtered.map((c:any) => {
              const s = STATUS_MAP[c.status] || STATUS_MAP.pending
              return (
                <StaggerItem key={c._id}>
                  <motion.div whileHover={{ y:-2 }} className="rounded-2xl overflow-hidden"
                    style={{ background:'rgba(255,255,255,0.03)', border:`1px solid ${s.border}` }}>
                    {/* Status bar top */}
                    <div className="h-1" style={{ background:`linear-gradient(90deg,${s.border},transparent)` }} />

                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                            style={{ background:s.bg }}>
                            {getTriggerIcon(config, c.triggerType)}
                          </div>
                          <div>
                            <div className="font-semibold capitalize" style={{ color:'#e8eaf6' }}>{c.triggerType?.replace(/_/g,' ')}</div>
                            <div className="text-xs mt-0.5" style={{ color:'#4a5080' }}>{c.zone}, {c.city} · {new Date(c.createdAt).toLocaleString('en-IN')}</div>
                          </div>
                        </div>
                        <Badge color={s.color}>{s.label}</Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label:'Payout', value:`₹${c.payoutAmount}`, color:'#00e5ff' },
                          { label:'BCS Score', value:`${c.bcsScore}/100`, color: c.bcsScore>=60?'#10b981':c.bcsScore>=35?'#f59e0b':'#f43f5e' },
                          { label:'Severity', value:c.triggerSeverity, color:'#e8eaf6' },
                        ].map(stat => (
                          <div key={stat.label} className="rounded-xl p-3 text-center"
                            style={{ background:'rgba(255,255,255,0.04)' }}>
                            <div className="text-xs mb-1" style={{ color:'#4a5080' }}>{stat.label}</div>
                            <div className="font-bold capitalize" style={{ fontFamily:'Space Mono,monospace', color:stat.color }}>{stat.value}</div>
                          </div>
                        ))}
                      </div>

                      {c.dataSources?.length>0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {c.dataSources.map((src:string) => (
                            <span key={src} className="text-[10px] px-2 py-0.5 rounded-full"
                              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', color:'#4a5080' }}>{src}</span>
                          ))}
                        </div>
                      )}

                      {c.status==='paid' && c.paymentRef && (
                        <div className="text-xs mb-3" style={{ color:'#10b981' }}>✓ Paid · Ref: <span style={{ fontFamily:'Space Mono,monospace' }}>{c.paymentRef}</span></div>
                      )}

                      {c.status==='soft_hold' && (
                        <motion.div initial={{ opacity:0, scale:0.98 }} animate={{ opacity:1, scale:1 }}
                          className="p-4 rounded-xl mb-3"
                          style={{ background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)' }}>
                          <p className="text-xs mb-3" style={{ color:'#f59e0b' }}>Your claim needs a quick confirmation. One tap — no documents.</p>
                          <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                            onClick={() => confirmClaim(c._id)} disabled={confirming===c._id}
                            className="px-5 py-2 rounded-xl text-sm font-bold"
                            style={{ background:'#f59e0b', color:'#04050f' }}>
                            {confirming===c._id ? 'Confirming...' : 'Confirm Claim ✓'}
                          </motion.button>
                        </motion.div>
                      )}

                      {!reportedIds.has(c._id) && ['paid','approved','auto_approved'].includes(c.status) && (
                        <div className="pt-3" style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                          <AnimatePresence>
                            {reportingClaim===c._id ? (
                              <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
                                className="space-y-2 overflow-hidden">
                                <select value={reportForm.reason} onChange={e => setReportForm({ ...reportForm, reason:e.target.value })} className="input-base text-xs py-2.5">
                                  {reportReasons.map((r: any) => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                                <input value={reportForm.description} onChange={e => setReportForm({ ...reportForm, description:e.target.value })}
                                  placeholder="Additional details (optional)" className="input-base text-xs py-2.5" />
                                <div className="flex gap-2">
                                  <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                                    onClick={() => submitReport(c._id)} disabled={submittingReport}
                                    className="btn-primary px-4 py-2 text-xs rounded-xl">
                                    {submittingReport ? 'Submitting...' : 'Submit Report'}
                                  </motion.button>
                                  <button onClick={() => setReportingClaim(null)} className="text-xs px-2 transition-colors"
                                    style={{ color:'#4a5080' }}>Cancel</button>
                                </div>
                              </motion.div>
                            ) : (
                              <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }}
                                onClick={() => setReportingClaim(c._id)}
                                className="text-xs transition-colors flex items-center gap-1.5"
                                style={{ color:'#4a5080' }}
                                onMouseEnter={e=>(e.currentTarget.style.color='#f43f5e')}
                                onMouseLeave={e=>(e.currentTarget.style.color='#4a5080')}>
                                🚩 Report suspicious activity · Earn ₹15 credit if verified
                              </motion.button>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                      {reportedIds.has(c._id) && (
                        <div className="pt-3 text-xs" style={{ borderTop:'1px solid rgba(255,255,255,0.05)', color:'#4a5080' }}>✓ Reported — under review</div>
                      )}
                    </div>
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
