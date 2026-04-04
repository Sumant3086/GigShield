'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import api from '@/lib/api'

export default function AdminLogin() {
  const router = useRouter()
  const [form, setForm] = useState({ username:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function login() {
    setLoading(true); setError('')
    try {
      const { data } = await api.post('/auth/admin-login', form)
      localStorage.setItem('gs_admin_token', data.token)
      router.replace('/admin/dashboard')
    } catch (e:any) { setError(e.response?.data?.error||'Login failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#04050f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage:'linear-gradient(rgba(0,229,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(0,229,255,1) 1px,transparent 1px)', backgroundSize:'60px 60px' }} />
      <motion.div animate={{ scale:[1,1.3,1], opacity:[0.2,0.4,0.2] }} transition={{ duration:10, repeat:Infinity }}
        className="absolute inset-0 pointer-events-none"
        style={{ background:'radial-gradient(ellipse 60% 60% at 50% 50%,rgba(124,58,237,0.12) 0%,transparent 70%)' }} />

      <div className="w-full max-w-sm relative z-10">
        <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background:'linear-gradient(135deg,#7c3aed,#00e5ff)' }}>⚙️</div>
            <h1 className="text-3xl font-bold">
              <span style={{ color:'#e8eaf6' }}>Gig</span>
              <span style={{ background:'linear-gradient(135deg,#00e5ff,#7c3aed)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Shield</span>
            </h1>
          </div>
          <p className="text-sm" style={{ color:'#4a5080' }}>Admin Dashboard</p>
        </motion.div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{ background:'rgba(255,255,255,0.05)', backdropFilter:'blur(32px)', border:'1px solid rgba(255,255,255,0.1)' }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background:'linear-gradient(90deg,transparent,rgba(124,58,237,0.5),transparent)' }} />

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color:'#4a5080' }}>Username</label>
              <input value={form.username} onChange={e => setForm({ ...form, username:e.target.value })}
                placeholder="admin" className="input-base" />
            </div>
            <div>
              <label className="text-xs font-semibold tracking-wider uppercase mb-2 block" style={{ color:'#4a5080' }}>Password</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password:e.target.value })}
                placeholder="••••••••" onKeyDown={e => e.key==='Enter' && login()} className="input-base" />
            </div>

            {error && (
              <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
                className="flex items-center gap-2 p-3 rounded-xl text-xs"
                style={{ background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.2)', color:'#f43f5e' }}>
                <span>⚠</span> {error}
              </motion.div>
            )}

            <motion.button whileHover={{ scale:1.02, y:-1 }} whileTap={{ scale:0.98 }}
              onClick={login} disabled={loading} className="btn-primary w-full py-4">
              {loading ? 'Signing in...' : 'Sign In →'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
