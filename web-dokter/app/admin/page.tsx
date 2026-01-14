'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Shield, Users, Package, AlertTriangle, Activity,
    LogOut, Plus, History, TrendingUp, Clock,
    AlertCircle, CheckCircle, User, Pill, Home, ArrowLeft
} from 'lucide-react'
import {
    getAdminStats,
    getAlertMedicines,
    MedicineStatus,
    Doctor,
    UserRole
} from '@/lib/supabase'

interface AdminStats {
    totalMedicines: number
    activeMedicines: number
    lowStockCount: number
    expiringSoonCount: number
    expiredCount: number
    totalUsers: number
    adminCount: number
    doctorCount: number
    operatorCount: number
    totalPrescriptions: number
}

export default function AdminDashboard() {
    const router = useRouter()
    const [doctor, setDoctor] = useState<Doctor | null>(null)
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [alerts, setAlerts] = useState<MedicineStatus[]>([])
    const [loading, setLoading] = useState(true)
    const initialized = useRef(false)

    useEffect(() => {
        if (initialized.current) return
        initialized.current = true

        const storedDoctor = localStorage.getItem('doctor')
        if (storedDoctor) {
            try {
                const doctorData = JSON.parse(storedDoctor)

                // Check if user has admin or operator role
                if (!doctorData.role || (doctorData.role !== 'admin' && doctorData.role !== 'operator')) {
                    alert('Anda tidak memiliki akses ke halaman admin')
                    router.push('/dashboard')
                    return
                }

                setDoctor(doctorData)
                fetchData()
            } catch {
                router.push('/login')
            }
        } else {
            router.push('/login')
        }
    }, [router])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [statsData, alertsData] = await Promise.all([
                getAdminStats(),
                getAlertMedicines()
            ])
            setStats(statsData)
            setAlerts(alertsData)
        } catch (error) {
            console.error('Error fetching admin data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('doctor')
        router.push('/login')
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'expired': return 'bg-red-100 text-red-800 border-red-200'
            case 'expiring_soon': return 'bg-amber-100 text-amber-800 border-amber-200'
            case 'low_stock': return 'bg-orange-100 text-orange-800 border-orange-200'
            default: return 'bg-green-100 text-green-800 border-green-200'
        }
    }

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'expired': return 'Kadaluarsa'
            case 'expiring_soon': return 'Segera Kadaluarsa'
            case 'low_stock': return 'Stok Rendah'
            default: return 'OK'
        }
    }

    if (!doctor || loading) {
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
            <aside className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-purple-900 to-indigo-900 p-5 flex flex-col">
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-purple-900" />
                    </div>
                    <span className="text-lg font-semibold text-white">Admin Panel</span>
                </div>

                {/* Admin Info */}
                <div className="px-2 mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-800 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-purple-200" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{doctor.name}</p>
                            <p className="text-xs text-purple-300 capitalize">{doctor.role}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1">
                    <Link href="/admin" className="flex items-center gap-3 px-3 py-2.5 bg-purple-800 text-white rounded-lg text-sm font-medium">
                        <Activity className="w-4 h-4" />
                        Dashboard
                    </Link>
                    <Link href="/admin/medicines" className="flex items-center gap-3 px-3 py-2.5 text-purple-200 hover:text-white hover:bg-purple-800/50 rounded-lg text-sm transition-colors">
                        <Package className="w-4 h-4" />
                        Kelola Obat
                    </Link>
                    {doctor.role === 'admin' && (
                        <Link href="/admin/users" className="flex items-center gap-3 px-3 py-2.5 text-purple-200 hover:text-white hover:bg-purple-800/50 rounded-lg text-sm transition-colors">
                            <Users className="w-4 h-4" />
                            Kelola User
                        </Link>
                    )}
                    <Link href="/admin/alerts" className="flex items-center gap-3 px-3 py-2.5 text-purple-200 hover:text-white hover:bg-purple-800/50 rounded-lg text-sm transition-colors">
                        <AlertTriangle className="w-4 h-4" />
                        Peringatan
                        {alerts.length > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                {alerts.length}
                            </span>
                        )}
                    </Link>
                    <hr className="border-purple-700 my-4" />
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors">
                        <Home className="w-4 h-4" />
                        Dashboard Dokter
                    </Link>
                    <Link href="/prescription/new" className="flex items-center gap-3 px-3 py-2.5 text-purple-200 hover:text-white hover:bg-purple-800/50 rounded-lg text-sm transition-colors">
                        <Plus className="w-4 h-4" />
                        Buat Resep
                    </Link>
                    <Link href="/prescription/history" className="flex items-center gap-3 px-3 py-2.5 text-purple-200 hover:text-white hover:bg-purple-800/50 rounded-lg text-sm transition-colors">
                        <History className="w-4 h-4" />
                        Riwayat Resep
                    </Link>
                </nav>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 text-purple-300 hover:text-red-300 rounded-lg text-sm transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Keluar
                </button>
            </aside>

            {/* Main Content */}
            <main className="ml-64 p-8">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-2xl font-semibold text-slate-800">
                        Admin Dashboard
                    </h1>
                    <p className="text-slate-500">
                        Kelola obat, pengguna, dan pantau stok
                    </p>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {/* Total Medicines */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <Pill className="w-5 h-5 text-purple-600" />
                            <span className="text-xs text-slate-500">Total</span>
                        </div>
                        <p className="text-3xl font-semibold text-slate-800">
                            {stats?.totalMedicines || 0}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">Jenis Obat</p>
                    </div>

                    {/* Total Users */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <Users className="w-5 h-5 text-blue-600" />
                            <span className="text-xs text-slate-500">Pengguna</span>
                        </div>
                        <p className="text-3xl font-semibold text-slate-800">
                            {stats?.totalUsers || 0}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                            {stats?.doctorCount} Dokter, {stats?.operatorCount} Operator
                        </p>
                    </div>

                    {/* Alerts */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            <span className="text-xs text-amber-600">Perhatian</span>
                        </div>
                        <p className="text-3xl font-semibold text-slate-800">
                            {alerts.length}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">Obat Perlu Perhatian</p>
                    </div>

                    {/* Prescriptions */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            <span className="text-xs text-slate-500">Total</span>
                        </div>
                        <p className="text-3xl font-semibold text-slate-800">
                            {stats?.totalPrescriptions || 0}
                        </p>
                        <p className="text-sm text-slate-500 mt-1">Resep Dibuat</p>
                    </div>
                </div>

                {/* Alert Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className={`rounded-xl p-5 border ${stats?.expiredCount ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats?.expiredCount ? 'bg-red-100' : 'bg-slate-200'}`}>
                                <AlertCircle className={`w-5 h-5 ${stats?.expiredCount ? 'text-red-600' : 'text-slate-400'}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-semibold ${stats?.expiredCount ? 'text-red-800' : 'text-slate-400'}`}>
                                    {stats?.expiredCount || 0}
                                </p>
                                <p className={`text-sm ${stats?.expiredCount ? 'text-red-600' : 'text-slate-500'}`}>
                                    Obat Kadaluarsa
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-xl p-5 border ${stats?.expiringSoonCount ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats?.expiringSoonCount ? 'bg-amber-100' : 'bg-slate-200'}`}>
                                <Clock className={`w-5 h-5 ${stats?.expiringSoonCount ? 'text-amber-600' : 'text-slate-400'}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-semibold ${stats?.expiringSoonCount ? 'text-amber-800' : 'text-slate-400'}`}>
                                    {stats?.expiringSoonCount || 0}
                                </p>
                                <p className={`text-sm ${stats?.expiringSoonCount ? 'text-amber-600' : 'text-slate-500'}`}>
                                    Segera Kadaluarsa (30 hari)
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-xl p-5 border ${stats?.lowStockCount ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stats?.lowStockCount ? 'bg-orange-100' : 'bg-slate-200'}`}>
                                <Package className={`w-5 h-5 ${stats?.lowStockCount ? 'text-orange-600' : 'text-slate-400'}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-semibold ${stats?.lowStockCount ? 'text-orange-800' : 'text-slate-400'}`}>
                                    {stats?.lowStockCount || 0}
                                </p>
                                <p className={`text-sm ${stats?.lowStockCount ? 'text-orange-600' : 'text-slate-500'}`}>
                                    Stok Rendah
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <h2 className="text-sm font-medium text-slate-600 mb-4">Menu Cepat</h2>
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <Link href="/admin/medicines" className="group">
                        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-xl p-6 hover:from-purple-800 hover:to-indigo-800 transition-all">
                            <Package className="w-8 h-8 text-white mb-3" />
                            <h3 className="text-lg font-semibold text-white">Kelola Obat</h3>
                            <p className="text-purple-200 text-sm">
                                Tambah, edit, update stok obat
                            </p>
                        </div>
                    </Link>

                    {doctor.role === 'admin' && (
                        <Link href="/admin/users" className="group">
                            <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-purple-300 transition-colors">
                                <Users className="w-8 h-8 text-purple-800 mb-3" />
                                <h3 className="text-lg font-semibold text-slate-800">Kelola User</h3>
                                <p className="text-slate-500 text-sm">
                                    Atur role pengguna sistem
                                </p>
                            </div>
                        </Link>
                    )}

                    <Link href="/admin/alerts" className="group">
                        <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-amber-300 transition-colors">
                            <AlertTriangle className="w-8 h-8 text-amber-600 mb-3" />
                            <h3 className="text-lg font-semibold text-slate-800">Peringatan Stok</h3>
                            <p className="text-slate-500 text-sm">
                                Lihat obat perlu perhatian
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Recent Alerts */}
                {alerts.length > 0 && (
                    <>
                        <h2 className="text-sm font-medium text-slate-600 mb-4">Peringatan Terbaru</h2>
                        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Obat</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Stok</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Kadaluarsa</th>
                                        <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {alerts.slice(0, 5).map((med) => (
                                        <tr key={med.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-800">{med.name}</div>
                                                <div className="text-sm text-slate-500">{med.strength}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={med.stock_quantity <= med.min_stock_level ? 'text-orange-600 font-semibold' : 'text-slate-800'}>
                                                    {med.stock_quantity}
                                                </span>
                                                <span className="text-slate-400"> / min {med.min_stock_level}</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {med.expired_at ? new Date(med.expired_at).toLocaleDateString('id-ID') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(med.status)}`}>
                                                    {getStatusLabel(med.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {alerts.length > 5 && (
                                <div className="px-6 py-3 bg-slate-50 border-t border-slate-200">
                                    <Link href="/admin/alerts" className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                                        Lihat semua {alerts.length} peringatan →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {alerts.length === 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 text-center">
                        <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-emerald-800">Semua Aman!</h3>
                        <p className="text-emerald-600">Tidak ada obat yang perlu perhatian saat ini.</p>
                    </div>
                )}
            </main>
        </div>
    )
}
