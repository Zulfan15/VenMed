'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    Users, ArrowLeft, Shield, User, Stethoscope,
    Settings, Trash2, Edit2, Loader2, X, Save
} from 'lucide-react'
import {
    getAllUsers,
    updateUserRole,
    deleteUser,
    Doctor,
    UserRole
} from '@/lib/supabase'

export default function UsersPage() {
    const router = useRouter()
    const [currentUser, setCurrentUser] = useState<Doctor | null>(null)
    const [users, setUsers] = useState<Doctor[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingUser, setEditingUser] = useState<Doctor | null>(null)
    const [selectedRole, setSelectedRole] = useState<UserRole>('doctor')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        const storedDoctor = localStorage.getItem('doctor')
        if (storedDoctor) {
            try {
                const doctorData = JSON.parse(storedDoctor)
                if (doctorData.role !== 'admin') {
                    alert('Hanya admin yang dapat mengakses halaman ini')
                    router.push('/admin')
                    return
                }
                setCurrentUser(doctorData)
                fetchUsers()
            } catch {
                router.push('/login')
            }
        } else {
            router.push('/login')
        }
    }, [router])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const data = await getAllUsers()
            setUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    const openEditModal = (user: Doctor) => {
        setEditingUser(user)
        setSelectedRole(user.role || 'doctor')
        setShowModal(true)
    }

    const handleUpdateRole = async () => {
        if (!editingUser) return
        setSaving(true)

        try {
            const success = await updateUserRole(editingUser.id, selectedRole)
            if (success) {
                await fetchUsers()
                setShowModal(false)

                // Update localStorage if editing self
                if (currentUser && editingUser.id === currentUser.id) {
                    const updatedDoctor = { ...currentUser, role: selectedRole }
                    localStorage.setItem('doctor', JSON.stringify(updatedDoctor))
                    setCurrentUser(updatedDoctor)
                }
            } else {
                alert('Gagal memperbarui role')
            }
        } catch (error) {
            console.error('Error updating role:', error)
            alert('Terjadi kesalahan')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteUser = async (user: Doctor) => {
        if (user.id === currentUser?.id) {
            alert('Tidak dapat menghapus akun sendiri')
            return
        }

        if (!confirm(`Yakin ingin menghapus user "${user.name}"?`)) return

        try {
            const success = await deleteUser(user.id)
            if (success) {
                await fetchUsers()
            } else {
                alert('Gagal menghapus user')
            }
        } catch (error) {
            console.error('Error deleting user:', error)
        }
    }

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case 'admin': return <Shield className="w-4 h-4 text-purple-600" />
            case 'doctor': return <Stethoscope className="w-4 h-4 text-blue-600" />
            case 'operator': return <Settings className="w-4 h-4 text-emerald-600" />
            default: return <User className="w-4 h-4 text-slate-600" />
        }
    }

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'doctor': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'operator': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
            default: return 'bg-slate-100 text-slate-800 border-slate-200'
        }
    }

    const getRoleLabel = (role: UserRole) => {
        switch (role) {
            case 'admin': return 'Administrator'
            case 'doctor': return 'Dokter'
            case 'operator': return 'Operator Vending'
            default: return role
        }
    }

    if (!currentUser || loading) {
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
                <div className="mb-6 flex items-center gap-4">
                    <Link href="/admin">
                        <button className="p-2 hover:bg-slate-200 rounded-lg text-slate-600">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                            <Users className="w-8 h-8 text-purple-600" />
                            Kelola User
                        </h1>
                        <p className="text-slate-500">
                            Atur role dan akses pengguna sistem
                        </p>
                    </div>
                </div>

                {/* Role Legend */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
                    <h3 className="text-sm font-medium text-slate-600 mb-3">Penjelasan Role:</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Shield className="w-4 h-4 text-purple-600" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-800">Administrator</p>
                                <p className="text-xs text-slate-500">Kelola user, obat, dan semua fitur</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Stethoscope className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-800">Dokter</p>
                                <p className="text-xs text-slate-500">Buat resep dan lihat riwayat</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                <Settings className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-800">Operator</p>
                                <p className="text-xs text-slate-500">Kelola stok obat dan vending</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">User</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Email</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">No. SIP</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Role</th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                                {getRoleIcon(user.role || 'doctor')}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800">{user.name}</div>
                                                {user.id === currentUser.id && (
                                                    <span className="text-xs text-purple-600">(Anda)</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                    <td className="px-6 py-4 text-slate-600">{user.license_number}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role || 'doctor')}`}>
                                            {getRoleIcon(user.role || 'doctor')}
                                            {getRoleLabel(user.role || 'doctor')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="p-2 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                title="Edit Role"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            {user.id !== currentUser.id && (
                                                <button
                                                    onClick={() => handleDeleteUser(user)}
                                                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Hapus"
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

                    {users.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Tidak ada user ditemukan</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Edit Role */}
            {showModal && editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-slate-800">
                                Edit Role User
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6">
                                <p className="text-sm text-slate-500 mb-1">Mengubah role untuk:</p>
                                <p className="font-semibold text-slate-800">{editingUser.name}</p>
                                <p className="text-sm text-slate-500">{editingUser.email}</p>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Pilih Role Baru
                                </label>

                                <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${selectedRole === 'admin' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="admin"
                                        checked={selectedRole === 'admin'}
                                        onChange={() => setSelectedRole('admin')}
                                        className="w-4 h-4 text-purple-600"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-5 h-5 text-purple-600" />
                                        <div>
                                            <p className="font-medium text-slate-800">Administrator</p>
                                            <p className="text-xs text-slate-500">Akses penuh ke semua fitur</p>
                                        </div>
                                    </div>
                                </label>

                                <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${selectedRole === 'doctor' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="doctor"
                                        checked={selectedRole === 'doctor'}
                                        onChange={() => setSelectedRole('doctor')}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Stethoscope className="w-5 h-5 text-blue-600" />
                                        <div>
                                            <p className="font-medium text-slate-800">Dokter</p>
                                            <p className="text-xs text-slate-500">Buat resep dan lihat riwayat</p>
                                        </div>
                                    </div>
                                </label>

                                <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${selectedRole === 'operator' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="operator"
                                        checked={selectedRole === 'operator'}
                                        onChange={() => setSelectedRole('operator')}
                                        className="w-4 h-4 text-emerald-600"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Settings className="w-5 h-5 text-emerald-600" />
                                        <div>
                                            <p className="font-medium text-slate-800">Operator</p>
                                            <p className="text-xs text-slate-500">Kelola stok obat</p>
                                        </div>
                                    </div>
                                </label>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleUpdateRole}
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
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
