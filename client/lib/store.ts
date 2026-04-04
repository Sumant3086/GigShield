import { create } from 'zustand'

interface Worker {
  _id: string
  name: string
  phone: string
  platform: string
  zone: string
  city: string
  upiId: string
  weeklyEarnings: number
  kycVerified: boolean
}

interface Policy {
  _id: string
  tier: string
  weeklyPremium: number
  maxWeeklyPayout: number
  status: string
  startDate: string
  endDate: string
  premiumBreakdown: Record<string, number>
}

interface AppState {
  worker: Worker | null
  policy: Policy | null
  token: string | null
  setWorker: (w: Worker | null) => void
  setPolicy: (p: Policy | null) => void
  setToken: (t: string | null) => void
  logout: () => void
}

export const useStore = create<AppState>((set) => ({
  worker: null,
  policy: null,
  token: null,
  setWorker: (worker) => set({ worker }),
  setPolicy: (policy) => set({ policy }),
  setToken: (token) => set({ token }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gs_token')
      localStorage.removeItem('gs_worker')
    }
    set({ worker: null, policy: null, token: null })
  },
}))
