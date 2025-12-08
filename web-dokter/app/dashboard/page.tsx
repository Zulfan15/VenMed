'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, FileText, LogOut, Plus, History, TrendingUp, CheckCircle, Clock, Activity, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Doctor {
  id: string
  name: string
  license_number: string
  email: string
  phone?: string
}

interface Stats {
  today: number
  thisWeek: number
  thisMonth: number
  total: number
  dispensed: number
  pending: number
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

export default function DashboardPage() {
  const router = useRouter()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [stats, setStats] = useState<Stats>({ today: 0, thisWeek: 0, thisMonth: 0, total: 0, dispensed: 0, pending: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    
    const storedDoctor = localStorage.getItem('doctor')
    if (storedDoctor) {
      try {
        const doctorData = JSON.parse(storedDoctor)
        setDoctor(doctorData)
        fetchStats(doctorData.id)
      } catch {
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  const fetchStats = async (doctorId: string) => {
    try {
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const { data: prescriptions, error } = await supabase
        .from('prescriptions')
        .select('id, issued_at, status')
        .eq('doctor_id', doctorId)

      if (error) throw error

      const today = prescriptions?.filter(p => p.issued_at >= startOfDay).length || 0
      const thisWeek = prescriptions?.filter(p => p.issued_at >= startOfWeek).length || 0
      const thisMonth = prescriptions?.filter(p => p.issued_at >= startOfMonth).length || 0
      const total = prescriptions?.length || 0
      const dispensed = prescriptions?.filter(p => p.status === 'dispensed').length || 0
      const pending = prescriptions?.filter(p => p.status === 'issued').length || 0

      setStats({ today, thisWeek, thisMonth, total, dispensed, pending })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('doctor')
    router.push('/login')
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-blue-100 border-t-blue-800 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-800">Memuat...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-blue-900 p-5 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-blue-900" />
          </div>
          <span className="text-lg font-semibold text-white">VenMed</span>
        </div>

        {/* Doctor Info */}
        <div className="px-2 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-800 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-200" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{doctor.name}</p>
              <p className="text-xs text-blue-300">{doctor.license_number}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 bg-blue-800 text-white rounded-lg text-sm font-medium">
            <Activity className="w-4 h-4" />
            Dashboard
          </Link>
          <Link href="/prescription/new" className="flex items-center gap-3 px-3 py-2.5 text-blue-200 hover:text-white hover:bg-blue-800/50 rounded-lg text-sm transition-colors">
            <Plus className="w-4 h-4" />
            Buat Resep
          </Link>
          <Link href="/prescription/history" className="flex items-center gap-3 px-3 py-2.5 text-blue-200 hover:text-white hover:bg-blue-800/50 rounded-lg text-sm transition-colors">
            <History className="w-4 h-4" />
            Riwayat
          </Link>
        </nav>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 text-blue-300 hover:text-red-300 rounded-lg text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {/* Header */}
        <header className="mb-8">
          <p className="text-slate-500 text-sm mb-1">
            {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-2xl font-semibold text-slate-800">
            {getGreeting()}, {doctor.name.split(' ').slice(0, 2).join(' ')}
          </h1>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-5 h-5 text-blue-800" />
              <span className="text-xs text-slate-500">Hari ini</span>
            </div>
            <p className="text-3xl font-semibold text-slate-800">
              {loadingStats ? '-' : stats.today}
            </p>
            <p className="text-sm text-slate-500 mt-1">Resep dibuat</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <FileText className="w-5 h-5 text-blue-800" />
              <span className="text-xs text-slate-500">Minggu ini</span>
            </div>
            <p className="text-3xl font-semibold text-slate-800">
              {loadingStats ? '-' : stats.thisWeek}
            </p>
            <p className="text-sm text-slate-500 mt-1">Total resep</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <span className="text-xs text-emerald-600">Selesai</span>
            </div>
            <p className="text-3xl font-semibold text-slate-800">
              {loadingStats ? '-' : stats.dispensed}
            </p>
            <p className="text-sm text-slate-500 mt-1">Obat diambil</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <Clock className="w-5 h-5 text-amber-500" />
              <span className="text-xs text-amber-600">Pending</span>
            </div>
            <p className="text-3xl font-semibold text-slate-800">
              {loadingStats ? '-' : stats.pending}
            </p>
            <p className="text-sm text-slate-500 mt-1">Menunggu</p>
          </div>
        </div>

        {/* Quick Actions */}
        <h2 className="text-sm font-medium text-slate-600 mb-4">Menu Cepat</h2>
        <div className="grid grid-cols-2 gap-4">
          {/* Create Prescription */}
          <Link href="/prescription/new" className="group">
            <div className="bg-blue-900 rounded-xl p-6 hover:bg-blue-800 transition-colors">
              <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center mb-4">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">Buat Resep Baru</h3>
              <p className="text-blue-200 text-sm mb-4">
                Buat resep digital dan generate QR Code
              </p>
              <div className="flex items-center gap-2 text-white text-sm font-medium">
                Mulai
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* View History */}
          <Link href="/prescription/history" className="group">
            <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                <History className="w-5 h-5 text-blue-800" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-1">Riwayat Resep</h3>
              <p className="text-slate-500 text-sm mb-4">
                Lihat dan kelola semua resep
              </p>
              <div className="flex items-center gap-2 text-blue-800 text-sm font-medium">
                Lihat semua
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
}
