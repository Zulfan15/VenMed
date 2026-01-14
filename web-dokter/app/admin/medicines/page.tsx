'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Shield, Package, ArrowLeft, Plus, Search,
    Edit2, Trash2, AlertCircle, X, Save, Loader2
} from 'lucide-react'
import {
    getAllMedicines,
    addMedicine,
    updateMedicine,
    deleteMedicine,
    MedicineStatus,
    Medicine,
    Doctor
} from '@/lib/supabase'

interface MedicineForm {
    name: string
    generic_name: string
    strength: string
    manufacturer: string
    stock_quantity: number
    min_stock_level: number
    price_per_unit: number
    description: string
    expired_at: string
    is_active: boolean
}

const emptyForm: MedicineForm = {
    name: '',
    generic_name: '',
    strength: '',
    manufacturer: '',
    stock_quantity: 0,
    min_stock_level: 10,
    price_per_unit: 0,
    description: '',
    expired_at: '',
    is_active: true
}

export default function MedicinesPage() {
    const router = useRouter()
    const [doctor, setDoctor] = useState<Doctor | null>(null)
    const [medicines, setMedicines] = useState<MedicineStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingMedicine, setEditingMedicine] = useState<MedicineStatus | null>(null)
    const [form, setForm] = useState<MedicineForm>(emptyForm)
    const [saving, setSaving] = useState(false)
    const [filterStatus, setFilterStatus] = useState<string>('all')

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
                fetchMedicines()
            } catch {
                router.push('/login')
            }
        } else {
            router.push('/login')
        }
    }, [router])

    const fetchMedicines = async () => {
        setLoading(true)
        try {
            const data = await getAllMedicines()
            setMedicines(data)
        } catch (error) {
            console.error('Error fetching medicines:', error)
        } finally {
            setLoading(false)
        }
    }

    const openAddModal = () => {
        setEditingMedicine(null)
        setForm(emptyForm)
        setShowModal(true)
    }

    const openEditModal = (medicine: MedicineStatus) => {
        setEditingMedicine(medicine)
        setForm({
            name: medicine.name,
            generic_name: medicine.generic_name || '',
            strength: medicine.strength,
            manufacturer: medicine.manufacturer || '',
            stock_quantity: medicine.stock_quantity,
            min_stock_level: medicine.min_stock_level || 10,
            price_per_unit: medicine.price_per_unit || 0,
            description: medicine.description || '',
            expired_at: medicine.expired_at ? medicine.expired_at.split('T')[0] : '',
            is_active: medicine.is_active
        })
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            if (editingMedicine) {
                // Update existing medicine
                const success = await updateMedicine(editingMedicine.id, {
                    ...form,
                    expired_at: form.expired_at || null
                } as Partial<Medicine>)

                if (success) {
                    await fetchMedicines()
                    setShowModal(false)
                } else {
                    alert('Gagal memperbarui obat')
                }
            } else {
                // Add new medicine
                const result = await addMedicine({
                    ...form,
                    expired_at: form.expired_at || null
                } as Partial<Medicine>)

                if (result) {
                    await fetchMedicines()
                    setShowModal(false)
                } else {
                    alert('Gagal menambahkan obat')
                }
            }
        } catch (error) {
            console.error('Error saving medicine:', error)
            alert('Terjadi kesalahan')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (medicine: MedicineStatus) => {
        if (!confirm(`Yakin ingin menonaktifkan obat "${medicine.name}"?`)) return

        try {
            const success = await deleteMedicine(medicine.id)
            if (success) {
                await fetchMedicines()
            } else {
                alert('Gagal menonaktifkan obat')
            }
        } catch (error) {
            console.error('Error deleting medicine:', error)
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

    const filteredMedicines = medicines.filter(med => {
        const matchesSearch = med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            med.generic_name?.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = filterStatus === 'all' || med.status === filterStatus
        return matchesSearch && matchesStatus
    })

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
            <div className="container mx-auto px-4 max-w-6xl">
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
                                <Package className="w-8 h-8 text-purple-600" />
                                Kelola Obat
                            </h1>
                            <p className="text-slate-500">
                                Tambah, edit, dan kelola stok obat
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-900 text-white rounded-lg font-medium hover:bg-purple-800 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Tambah Obat
                    </button>
                </div>

                {/* Search & Filter */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                    <div className="flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari nama obat..."
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            title="Filter Status"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="all">Semua Status</option>
                            <option value="ok">OK</option>
                            <option value="low_stock">Stok Rendah</option>
                            <option value="expiring_soon">Segera Kadaluarsa</option>
                            <option value="expired">Kadaluarsa</option>
                        </select>
                    </div>
                </div>

                {/* Medicines Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Nama Obat</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Kekuatan</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Stok</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Kadaluarsa</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredMedicines.map((med) => (
                                <tr key={med.id} className={`hover:bg-slate-50 ${!med.is_active ? 'opacity-50' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-800">{med.name}</div>
                                        <div className="text-sm text-slate-500">{med.generic_name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{med.strength}</td>
                                    <td className="px-6 py-4">
                                        <span className={med.stock_quantity <= med.min_stock_level ? 'text-orange-600 font-semibold' : 'text-slate-800'}>
                                            {med.stock_quantity}
                                        </span>
                                        <span className="text-slate-400 text-sm"> (min: {med.min_stock_level})</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {med.expired_at ? new Date(med.expired_at).toLocaleDateString('id-ID') : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(med.status)}`}>
                                            {getStatusLabel(med.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEditModal(med)}
                                                className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            {med.is_active && (
                                                <button
                                                    onClick={() => handleDelete(med)}
                                                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Nonaktifkan"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredMedicines.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Tidak ada obat ditemukan</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Add/Edit */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-800">
                                {editingMedicine ? 'Edit Obat' : 'Tambah Obat Baru'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nama Obat *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Contoh: Paracetamol"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nama Generik
                                    </label>
                                    <input
                                        type="text"
                                        value={form.generic_name}
                                        onChange={(e) => setForm({ ...form, generic_name: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Contoh: Acetaminophen"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Kekuatan/Dosis *
                                    </label>
                                    <input
                                        type="text"
                                        value={form.strength}
                                        onChange={(e) => setForm({ ...form, strength: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Contoh: 500mg"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Produsen
                                    </label>
                                    <input
                                        type="text"
                                        value={form.manufacturer}
                                        onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Contoh: PT. Kimia Farma"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Jumlah Stok *
                                    </label>
                                    <input
                                        type="number"
                                        value={form.stock_quantity}
                                        onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
                                        required
                                        min="0"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Minimum Stok (untuk alert)
                                    </label>
                                    <input
                                        type="number"
                                        value={form.min_stock_level}
                                        onChange={(e) => setForm({ ...form, min_stock_level: parseInt(e.target.value) || 10 })}
                                        min="0"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Harga per Unit (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        value={form.price_per_unit}
                                        onChange={(e) => setForm({ ...form, price_per_unit: parseFloat(e.target.value) || 0 })}
                                        min="0"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Tanggal Kadaluarsa
                                    </label>
                                    <input
                                        type="date"
                                        value={form.expired_at}
                                        onChange={(e) => setForm({ ...form, expired_at: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Deskripsi
                                </label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="Deskripsi obat..."
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                />
                                <label htmlFor="is_active" className="text-sm text-slate-700">
                                    Obat Aktif (dapat diresepkan)
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 px-4 py-2 bg-purple-900 text-white rounded-lg font-medium hover:bg-purple-800 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Simpan
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
