'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    AlertTriangle, ArrowLeft, Package, Clock,
    AlertCircle, RefreshCw, Edit2, CheckCircle
} from 'lucide-react'
import {
    getAlertMedicines,
    updateMedicineStock,
    MedicineStatus,
    Doctor
} from '@/lib/supabase'

export default function AlertsPage() {
    const router = useRouter()
    const [doctor, setDoctor] = useState<Doctor | null>(null)
    const [alerts, setAlerts] = useState<MedicineStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [updatingStock, setUpdatingStock] = useState<string | null>(null)

    useEffect(() => {
        const storedDoctor = localStorage.getItem('doctor')
        if (storedDoctor) {
            try {
                const doctorData = JSON.parse(storedDoctor)
                if (!doctorData.role || (doctorData.role !== 'admin' && doctorData.role !== 'operator')) {
                    router.push('/dashboard')
                    return
                }
                setDoctor(doctorData)
                fetchAlerts()
            } catch {
                router.push('/login')
            }
        } else {
            router.push('/login')
        }
    }, [router])

    const fetchAlerts = async () => {
        setLoading(true)
        try {
            const data = await getAlertMedicines()
            setAlerts(data)
        } catch (error) {
            console.error('Error fetching alerts:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleQuickRestock = async (medicine: MedicineStatus, addQuantity: number) => {
        setUpdatingStock(medicine.id)
        try {
            const newQuantity = medicine.stock_quantity + addQuantity
            const success = await updateMedicineStock(medicine.id, newQuantity)
            if (success) {
                await fetchAlerts()
            } else {
                alert('Gagal memperbarui stok')
            }
        } catch (error) {
            console.error('Error updating stock:', error)
        } finally {
            setUpdatingStock(null)
        }
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'expired': return <AlertCircle className="w-5 h-5 text-red-600" />
            case 'expiring_soon': return <Clock className="w-5 h-5 text-amber-600" />
            case 'low_stock': return <Package className="w-5 h-5 text-orange-600" />
            default: return <CheckCircle className="w-5 h-5 text-green-600" />
        }
    }

    const expiredMeds = alerts.filter(m => m.status === 'expired')
    const expiringSoonMeds = alerts.filter(m => m.status === 'expiring_soon')
    const lowStockMeds = alerts.filter(m => m.status === 'low_stock')

    if (!doctor || loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-purple-100 border-t-purple-800 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-purple-800">Memuat...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8">
            <div className="container mx-auto px-4 max-w-5xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin">
                            <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600">
                                <ArrowLeft className="w-6 h-6" />
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                                <AlertTriangle className="w-8 h-8 text-amber-600" />
                                Peringatan Obat
                            </h1>
                            <p className="text-slate-500">
                                Obat yang perlu perhatian segera
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={fetchAlerts}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid md:grid-cols-3 gap-4 mb-8">
                    <div className={`rounded-xl p-5 border ${expiredMeds.length ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                            <AlertCircle className={`w-6 h-6 ${expiredMeds.length ? 'text-red-600' : 'text-slate-400'}`} />
                            <div>
                                <p className={`text-2xl font-bold ${expiredMeds.length ? 'text-red-800' : 'text-slate-400'}`}>
                                    {expiredMeds.length}
                                </p>
                                <p className="text-sm text-slate-600">Obat Kadaluarsa</p>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-xl p-5 border ${expiringSoonMeds.length ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                            <Clock className={`w-6 h-6 ${expiringSoonMeds.length ? 'text-amber-600' : 'text-slate-400'}`} />
                            <div>
                                <p className={`text-2xl font-bold ${expiringSoonMeds.length ? 'text-amber-800' : 'text-slate-400'}`}>
                                    {expiringSoonMeds.length}
                                </p>
                                <p className="text-sm text-slate-600">Segera Kadaluarsa</p>
                            </div>
                        </div>
                    </div>

                    <div className={`rounded-xl p-5 border ${lowStockMeds.length ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                            <Package className={`w-6 h-6 ${lowStockMeds.length ? 'text-orange-600' : 'text-slate-400'}`} />
                            <div>
                                <p className={`text-2xl font-bold ${lowStockMeds.length ? 'text-orange-800' : 'text-slate-400'}`}>
                                    {lowStockMeds.length}
                                </p>
                                <p className="text-sm text-slate-600">Stok Rendah</p>
                            </div>
                        </div>
                    </div>
                </div>

                {alerts.length === 0 ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-12 text-center">
                        <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-emerald-800 mb-2">Semua Obat Aman!</h3>
                        <p className="text-emerald-600">Tidak ada obat yang perlu perhatian saat ini.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Expired Medicines */}
                        {expiredMeds.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-red-800 uppercase mb-3 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Obat Kadaluarsa ({expiredMeds.length})
                                </h2>
                                <div className="bg-white rounded-xl border border-red-200 overflow-hidden">
                                    {expiredMeds.map((med) => (
                                        <div key={med.id} className="p-4 border-b border-red-100 last:border-b-0 flex items-center justify-between bg-red-50/50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{med.name} {med.strength}</p>
                                                    <p className="text-sm text-red-600">
                                                        Kadaluarsa: {med.expired_at ? new Date(med.expired_at).toLocaleDateString('id-ID') : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-slate-500">Stok: {med.stock_quantity}</span>
                                                <Link href="/admin/medicines">
                                                    <button className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
                                                        Tindakan
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Expiring Soon */}
                        {expiringSoonMeds.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-amber-800 uppercase mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Segera Kadaluarsa - 30 Hari ({expiringSoonMeds.length})
                                </h2>
                                <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                                    {expiringSoonMeds.map((med) => (
                                        <div key={med.id} className="p-4 border-b border-amber-100 last:border-b-0 flex items-center justify-between bg-amber-50/50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                                                    <Clock className="w-5 h-5 text-amber-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{med.name} {med.strength}</p>
                                                    <p className="text-sm text-amber-600">
                                                        Kadaluarsa: {med.expired_at ? new Date(med.expired_at).toLocaleDateString('id-ID') : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-slate-500">Stok: {med.stock_quantity}</span>
                                                <Link href="/admin/medicines">
                                                    <button className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">
                                                        Detail
                                                    </button>
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Low Stock */}
                        {lowStockMeds.length > 0 && (
                            <div>
                                <h2 className="text-sm font-semibold text-orange-800 uppercase mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Stok Rendah ({lowStockMeds.length})
                                </h2>
                                <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
                                    {lowStockMeds.map((med) => (
                                        <div key={med.id} className="p-4 border-b border-orange-100 last:border-b-0 flex items-center justify-between bg-orange-50/50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-orange-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-800">{med.name} {med.strength}</p>
                                                    <p className="text-sm text-orange-600">
                                                        Stok: {med.stock_quantity} (Min: {med.min_stock_level})
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {/* Quick Restock Buttons */}
                                                <button
                                                    onClick={() => handleQuickRestock(med, 50)}
                                                    disabled={updatingStock === med.id}
                                                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 disabled:opacity-50"
                                                >
                                                    +50
                                                </button>
                                                <button
                                                    onClick={() => handleQuickRestock(med, 100)}
                                                    disabled={updatingStock === med.id}
                                                    className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 disabled:opacity-50"
                                                >
                                                    +100
                                                </button>
                                                <button
                                                    onClick={() => handleQuickRestock(med, 500)}
                                                    disabled={updatingStock === med.id}
                                                    className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
                                                >
                                                    {updatingStock === med.id ? '...' : '+500'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
