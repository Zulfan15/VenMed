# Panduan Admin Panel - VenMed

## Fitur Baru yang Ditambahkan

### 1. Role Management
Sistem sekarang mendukung 3 role pengguna:

| Role | Deskripsi | Akses |
|------|-----------|-------|
| **admin** | Administrator sistem | Semua fitur termasuk kelola user |
| **doctor** | Dokter penulis resep | Buat resep, riwayat |
| **operator** | Operator vending machine | Kelola stok obat |

### 2. Admin Dashboard
Tersedia di `/admin` dengan fitur:
- **Dashboard Overview**: Statistik total obat, user, dan resep
- **Alert System**: Notifikasi obat low stock, expiring soon, dan expired
- **Kelola Obat** (`/admin/medicines`): CRUD obat dengan filter & search
- **Kelola User** (`/admin/users`): Ubah role pengguna (admin only)
- **Peringatan** (`/admin/alerts`): List obat yang perlu perhatian + quick restock

### 3. Expired Medicines Validation
- Field `expired_at` ditambahkan ke tabel medicines
- Obat yang expired tidak bisa di-dispense
- Warning 30 hari sebelum kadaluarsa

---

## Cara Deploy

### 1. Jalankan Migration SQL
Copy dan jalankan file berikut di Supabase SQL Editor:
```
supabase/migrations/003_add_roles_and_expired.sql
```

### 2. Set User Pertama sebagai Admin
Setelah migration, update salah satu user menjadi admin:
```sql
UPDATE doctors SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 3. Deploy Edge Functions (jika ada perubahan)
```bash
supabase functions deploy verify_qr_and_lock
```

---

## Cara Menggunakan Admin Panel

### Akses Admin Panel
1. Login dengan akun yang memiliki role `admin` atau `operator`
2. Di sidebar, akan muncul tombol **"Admin Panel"** berwarna kuning
3. Klik untuk masuk ke dashboard admin

### Mengelola Obat
1. Buka menu **Kelola Obat**
2. Klik **Tambah Obat** untuk menambah obat baru
3. Isi form dengan lengkap termasuk:
   - Nama obat
   - Kekuatan (contoh: 500mg)
   - Jumlah stok
   - Minimum stok (untuk alert)
   - Tanggal kadaluarsa
4. Klik **Simpan**

### Mengatur Role User (Admin Only)
1. Buka menu **Kelola User**
2. Klik icon edit pada user yang ingin diubah
3. Pilih role baru
4. Klik **Simpan**

### Menangani Alert Obat
1. Buka menu **Peringatan**
2. Lihat daftar obat bermasalah:
   - 🔴 **Kadaluarsa**: Obat harus dibuang/diganti
   - 🟡 **Segera Kadaluarsa**: Prioritaskan penjualan
   - 🟠 **Stok Rendah**: Perlu restok
3. Untuk quick restock, klik tombol +50, +100, atau +500

---

## File yang Ditambahkan/Diubah

### File Baru:
- `supabase/migrations/003_add_roles_and_expired.sql` - Migration SQL
- `web-dokter/app/admin/page.tsx` - Admin dashboard
- `web-dokter/app/admin/layout.tsx` - Admin layout
- `web-dokter/app/admin/medicines/page.tsx` - Kelola obat
- `web-dokter/app/admin/users/page.tsx` - Kelola user
- `web-dokter/app/admin/alerts/page.tsx` - Peringatan stok

### File yang Dimodifikasi:
- `web-dokter/lib/supabase.ts` - Tambah admin API functions
- `web-dokter/app/dashboard/page.tsx` - Tambah link ke admin panel
- `supabase/functions/verify_qr_and_lock/index.ts` - Validasi expired medicines

---

## Database Changes

### Kolom Baru di tabel `doctors`:
- `role` VARCHAR(20) - 'admin' | 'doctor' | 'operator'

### Kolom Baru di tabel `medicines`:
- `expired_at` DATE - Tanggal kadaluarsa

### View Baru:
- `low_stock_medicines` - View untuk obat yang perlu perhatian

### Function Baru:
- `check_medicine_validity(medicine_uuid)` - Validasi obat sebelum dispense
