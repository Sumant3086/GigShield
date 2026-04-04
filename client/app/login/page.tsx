'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import Dropdown from '@/components/Dropdown'
import { useConfig, getZonesForCity } from '@/lib/useConfig'

const FEATURES = [
  { icon: '⚡', title: 'Auto-detected claims', desc: 'No forms. Disruptions trigger payouts automatically.' },
  { icon: '🤝', title: 'Cooperative pools', desc: 'Workers in your zone share risk. Healthy pool = lower rates.' },
  { icon: '🔮', title: '48-hr forecasts', desc: 'Know before it hits. Shift zones, plan ahead.' },
  { icon: '💸', title: 'UPI in 2 hours', desc: 'Verified disruption — money in your account, fast.' },
]

type Step = 'phone' | 'otp' | 'register'

export default function LoginPage() {
  const router = useRouter()
  const { config } = useConfig()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', platform: 'amazon_flex', city: 'Bengaluru',
    zone: 'HSR Layout', upiId: '', weeklyEarnings: 4200,
  })

  const steps: Step[] = ['phone', 'otp', 'register']
  const stepIdx = steps.indexOf(step)
  const cityOptions = (config?.cities || []).map(c => ({ value: c.name, label: c.name }))
  const zoneOptions = getZonesForCity(config, form.city).map(z => ({ value: z, label: z }))

  async function sendOtp() {
    if (!phone || phone.length < 10) return setError('Enter a valid 10-digit number')
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/send-otp', { phone: `+91${phone}` })
      setDevOtp(data.devOtp || '')
      setStep('otp')
    } catch (e: any) { setError(e.response?.data?.error || 'Failed to send OTP') }
    finally { setLoading(false) }
  }

  async function verifyOtp() {
    if (otp.length !== 6) return setError('Enter 6-digit OTP')
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/verify-otp', { phone: `+91${phone}`, otp })
      if (data.needsRegistration) { setStep('register'); setLoading(false); return }
      localStorage.setItem('gs_token', data.token)
      localStorage.setItem('gs_worker', JSON.stringify(data.worker))
      router.replace('/dashboard')
    } catch (e: any) { setError(e.response?.data?.error || 'Invalid OTP') }
    finally { setLoading(false) }
  }

  async function register() {
    if (!form.name.trim()) return setError('Enter your full name')
    if (!form.upiId.trim()) return setError('Enter your UPI ID')
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/verify-otp', { phone: `+91${phone}`, otp, ...form })
      localStorage.setItem('gs_token', data.token)
      localStorage.setItem('gs_worker', JSON.stringify(data.worker))
      router.replace('/onboard')
    } catch (e: any) { setError(e.response?.data?.error || 'Registration failed') }
    finally { setLoading(false) }
  }

  const ErrorBox = ({ msg }: { msg: string }) => (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2 p-3 rounded-xl text-xs mb-3"
      style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e' }}>
      <span>!</span> {msg}
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-[#04050f] flex overflow-hidden">

      {/* LEFT PANEL — desktop only */}
      <motion.div
        initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="hidden lg:flex flex-col justify-between w-[52%] relative overflow-hidden p-14"
        style={{ background: 'linear-gradient(135deg, #06071a 0%, #0a0b20 100%)' }}>

        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 10, repeat: Infinity }}
            className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(0,229,255,0.12) 0%, transparent 70%)' }} />
          <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 14, repeat: Infinity }}
            className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(rgba(0,229,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,1) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <h1 className="text-3xl font-bold">
            <span style={{ color: '#e8eaf6' }}>Gig</span>
            <span style={{ background: 'linear-gradient(135deg,#00e5ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Shield</span>
          </h1>
          <p className="text-xs mt-1" style={{ color: '#4a5080' }}>Guidewire DEVTrails 2026 · Team JOD</p>
        </div>

        {/* Hero */}
        <div className="relative z-10 my-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}>
            <div className="text-xs font-semibold tracking-[0.25em] uppercase mb-4" style={{ color: '#00e5ff' }}>
              AI-Powered Parametric Insurance
            </div>
            <h2 className="text-5xl font-bold leading-tight mb-6" style={{ color: '#e8eaf6' }}>
              Your income,<br />
              <span style={{ background: 'linear-gradient(135deg,#00e5ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                protected.
              </span>
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: '#4a5080', maxWidth: 380 }}>
              When floods, curfews, or platform shutdowns stop you from earning — GigShield detects it and pays you automatically. No forms. No calls.
            </p>
          </motion.div>

          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                className="flex items-start gap-4 p-4 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: 'rgba(0,229,255,0.1)' }}>{f.icon}</div>
                <div>
                  <div className="text-sm font-semibold mb-0.5" style={{ color: '#e8eaf6' }}>{f.title}</div>
                  <div className="text-xs" style={{ color: '#4a5080' }}>{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="relative z-10 flex gap-8">
          {[
            [config?.stats?.gigWorkersIndia || '12M+', 'Gig workers'],
            [config?.stats?.minWeeklyPremium || 'Rs.29', 'Starts at/week'],
            [config?.stats?.avgPayoutTime || 'Under 2hrs', 'Payout time'],
          ].map(([v, l]) => (
            <div key={l}>
              <div className="text-2xl font-bold" style={{ fontFamily: 'Space Mono,monospace', color: '#00e5ff' }}>{v}</div>
              <div className="text-xs" style={{ color: '#4a5080' }}>{l}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* RIGHT PANEL — auth form */}
      <motion.div
        initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 relative overflow-y-auto"
        style={{ background: '#04050f' }}>

        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <h1 className="text-2xl font-bold">
            <span style={{ color: '#e8eaf6' }}>Gig</span>
            <span style={{ background: 'linear-gradient(135deg,#00e5ff,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Shield</span>
          </h1>
        </div>

        <div className="w-full max-w-sm mx-auto">
          {/* Step progress */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <motion.div animate={{ width: step === s ? 28 : 8 }} transition={{ duration: 0.3 }}
                  className="h-2 rounded-full"
                  style={{ background: stepIdx >= i ? 'linear-gradient(90deg,#00e5ff,#7c3aed)' : 'rgba(255,255,255,0.1)' }} />
                {i < steps.length - 1 && (
                  <div className="h-px w-8 transition-all duration-500"
                    style={{ background: stepIdx > i ? 'rgba(0,229,255,0.4)' : 'rgba(255,255,255,0.08)' }} />
                )}
              </div>
            ))}
            <span className="ml-auto text-xs" style={{ color: '#4a5080' }}>{stepIdx + 1} / {steps.length}</span>
          </div>

          <AnimatePresence mode="wait">

            {/* PHONE */}
            {step === 'phone' && (
              <motion.div key="phone"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <h2 className="text-3xl font-bold mb-1" style={{ color: '#e8eaf6' }}>Welcome back</h2>
                <p className="text-sm mb-8" style={{ color: '#4a5080' }}>Sign in with your registered mobile number</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#4a5080' }}>Mobile Number</label>
                    <div className="flex gap-2">
                      <div className="flex items-center justify-center px-4 rounded-2xl font-mono font-bold text-sm flex-shrink-0"
                        style={{ background: 'rgba(0,229,255,0.08)', border: '1px solid rgba(0,229,255,0.2)', color: '#00e5ff', height: 52 }}>
                        +91
                      </div>
                      <input type="tel" maxLength={10} value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={e => e.key === 'Enter' && sendOtp()}
                        placeholder="9876543210"
                        className="input-base font-mono text-lg tracking-widest" style={{ height: 52 }} />
                    </div>
                  </div>
                  {error && <ErrorBox msg={error} />}
                  <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                    onClick={sendOtp} disabled={loading}
                    className="btn-primary w-full text-base" style={{ height: 52, borderRadius: 16 }}>
                    {loading ? 'Sending...' : 'Send OTP'}
                  </motion.button>
                </div>
                <div className="mt-8 pt-6 text-center" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <button onClick={() => router.push('/admin/login')}
                    className="text-xs transition-colors" style={{ color: '#4a5080' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#00e5ff')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4a5080')}>
                    Sumant — Admin Access
                  </button>
                </div>
              </motion.div>
            )}

            {/* OTP */}
            {step === 'otp' && (
              <motion.div key="otp"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <h2 className="text-3xl font-bold mb-1" style={{ color: '#e8eaf6' }}>Enter OTP</h2>
                <p className="text-sm mb-8" style={{ color: '#4a5080' }}>
                  Sent to <span style={{ color: '#e8eaf6' }}>+91 {phone}</span>
                </p>
                {devOtp && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center justify-between p-4 rounded-2xl mb-6"
                    style={{ background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)' }}>
                    <div>
                      <div className="text-xs font-semibold mb-1" style={{ color: '#4a5080' }}>Development OTP</div>
                      <div className="text-2xl font-bold tracking-[0.3em]"
                        style={{ fontFamily: 'Space Mono,monospace', color: '#00e5ff' }}>{devOtp}</div>
                    </div>
                    <button onClick={() => setOtp(devOtp)}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold"
                      style={{ background: 'rgba(0,229,255,0.15)', color: '#00e5ff' }}>
                      Auto-fill
                    </button>
                  </motion.div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#4a5080' }}>6-Digit Code</label>
                    <input type="text" maxLength={6} value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                      placeholder="- - - - - -"
                      className="input-base text-center text-3xl tracking-[0.6em] font-mono" style={{ height: 64 }} />
                  </div>
                  {error && <ErrorBox msg={error} />}
                  <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                    onClick={verifyOtp} disabled={loading}
                    className="btn-primary w-full text-base" style={{ height: 52, borderRadius: 16 }}>
                    {loading ? 'Verifying...' : 'Verify and Continue'}
                  </motion.button>
                  <button onClick={() => { setStep('phone'); setOtp(''); setError('') }}
                    className="w-full text-sm py-2 transition-colors" style={{ color: '#4a5080' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#e8eaf6')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4a5080')}>
                    Change number
                  </button>
                </div>
              </motion.div>
            )}

            {/* REGISTER */}
            {step === 'register' && (
              <motion.div key="register"
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <h2 className="text-3xl font-bold mb-1" style={{ color: '#e8eaf6' }}>Set up profile</h2>
                <p className="text-sm mb-6" style={{ color: '#4a5080' }}>One-time setup, takes 30 seconds</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#4a5080' }}>Full Name</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="Raju Kumar" className="input-base" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#4a5080' }}>Delivery Platform</label>
                    <Dropdown value={form.platform} onChange={v => setForm({ ...form, platform: v })}
                      options={(config?.platforms || []).map(p => ({ value: p.value, label: p.label, icon: p.icon }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#4a5080' }}>City</label>
                      <Dropdown value={form.city}
                        onChange={v => setForm({ ...form, city: v, zone: config?.cities?.find(c => c.name === v)?.zones?.[0] || '' })}
                        options={cityOptions} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#4a5080' }}>Zone</label>
                      <Dropdown value={form.zone} onChange={v => setForm({ ...form, zone: v })} options={zoneOptions} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#4a5080' }}>UPI ID</label>
                    <input value={form.upiId} onChange={e => setForm({ ...form, upiId: e.target.value })}
                      placeholder="name@upi" className="input-base" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color: '#4a5080' }}>Weekly Earnings (Rs.)</label>
                    <input type="number" value={form.weeklyEarnings}
                      onChange={e => setForm({ ...form, weeklyEarnings: +e.target.value })}
                      className="input-base" />
                  </div>
                </div>
                {error && <div className="mt-3"><ErrorBox msg={error} /></div>}
                <motion.button whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                  onClick={register} disabled={loading}
                  className="btn-primary w-full text-base mt-4" style={{ height: 52, borderRadius: 16 }}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </motion.button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
