'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    const token = localStorage.getItem('gs_token')
    if (token) router.replace('/dashboard')
    else router.replace('/login')
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="w-8 h-8 border-2 border-[#ff6b2b] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
