# LAPORAN LENGKAP SISTEM
# VenMed — Smart Medical Vending Machine

**Versi:** 2.0  
**Tanggal:** Januari 2026  
**Pengembang:** Tim VenMed

---

## DAFTAR ISI

1. [Pendahuluan](#1-pendahuluan)
2. [Tujuan dan Ruang Lingkup](#2-tujuan-dan-ruang-lingkup)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Teknologi yang Digunakan](#4-teknologi-yang-digunakan)
5. [Struktur Database](#5-struktur-database)
6. [Modul Aplikasi](#6-modul-aplikasi)
7. [Alur Kerja Sistem](#7-alur-kerja-sistem)
8. [Keamanan Sistem](#8-keamanan-sistem)
9. [Panduan Instalasi](#9-panduan-instalasi)
10. [Panduan Penggunaan](#10-panduan-penggunaan)
11. [Pengujian Sistem](#11-pengujian-sistem)
12. [Kesimpulan dan Pengembangan Lanjutan](#12-kesimpulan-dan-pengembangan-lanjutan)

---

## 1. PENDAHULUAN

### 1.1 Latar Belakang

Sistem resep manual di klinik dan rumah sakit memiliki beberapa permasalahan:
- **Resep manual rawan hilang** atau salah baca karena tulisan tangan
- **Antrean di apotek terlalu panjang**, menyebabkan ketidaknyamanan pasien
- **Data resep tidak tersinkronisasi** antar sistem dalam satu fasilitas kesehatan
- **Pasien kesulitan** membeli obat yang diresepkan tanpa harus mengantre

### 1.2 Solusi yang Ditawarkan

VenMed (Smart Medical Vending Machine) hadir sebagai solusi digitalisasi resep medis yang terintegrasi dengan vending machine untuk pengeluaran obat secara otomatis.

### 1.3 Gambaran Umum Sistem

| Aspek | Keterangan |
|-------|------------|
| **Nama Proyek** | VenMed — Smart Medical Vending Machine |
| **Tujuan** | Sistem resep digital terintegrasi dengan vending machine untuk dispensing obat otomatis |
| **Target Pengguna** | Dokter, Pasien, Admin, Operator Vending |
| **Jenis Obat** | Hanya obat bentuk **tablet** yang didukung |
| **Platform** | Web-based (responsive mobile & desktop) |

---

## 2. TUJUAN DAN RUANG LINGKUP

### 2.1 Tujuan Utama

1. **Digitalisasi resep dokter** — Mengubah resep manual menjadi resep digital dengan QR Code
2. **Pemindaian resep otomatis** — Pasien dapat mengambil obat via scan QR tanpa antre
3. **Keamanan data medis** — Token QR sekali pakai, validasi tanggal kadaluarsa
4. **Manajemen stok obat** — Admin panel untuk kelola stok dan alert expiry
5. **Role management** — Pembagian akses berdasarkan peran pengguna

### 2.2 Ruang Lingkup Sistem

**Dalam Ruang Lingkup:**
- Pembuatan resep digital oleh dokter
- Generate dan validasi QR Code resep
- Pengambilan obat via vending machine
- Dashboard admin untuk manajemen obat dan pengguna
- Alert sistem untuk stok rendah dan obat kadaluarsa

**Di Luar Ruang Lingkup:**
- Integrasi pembayaran (QRIS) — direncanakan fase selanjutnya
- Integrasi hardware vending machine aktual
- Notifikasi SMS/Email

---

## 3. ARSITEKTUR SISTEM

### 3.1 Diagram Arsitektur

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           ARSITEKTUR SISTEM VENMED                            │
└──────────────────────────────────────────────────────────────────────────────┘

                           ┌──────────────────────┐
                           │    SUPABASE CLOUD    │
                           │  ┌────────────────┐  │
                           │  │  PostgreSQL    │  │
                           │  │  Database      │  │
                           │  └────────────────┘  │
                           │  ┌────────────────┐  │
                           │  │ Edge Functions │  │
                           │  │ (Deno Runtime) │  │
                           │  └────────────────┘  │
                           │  ┌────────────────┐  │
                           │  │ Authentication │  │
                           │  │ (Supabase Auth)│  │
                           │  └────────────────┘  │
                           └──────────┬───────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │              REST API              │
         ┌──────────┴──────────┐             ┌──────────┴──────────┐
         │                     │             │                     │
┌────────▼────────┐    ┌───────▼───────┐    ┌▼───────────────────┐
│   WEB-DOKTER    │    │ ADMIN PANEL   │    │    WEB-SCANNER     │
│   (Next.js)     │    │ (Next.js)     │    │    (Next.js)       │
│   Port: 3000    │    │ Port: 3000    │    │    Port: 3002      │
├─────────────────┤    ├───────────────┤    ├────────────────────┤
│ • Login/Register│    │ • Dashboard   │    │ • QR Scanner       │
│ • Dashboard     │    │ • Kelola Obat │    │ • Verify Token     │
│ • Buat Resep    │    │ • Kelola User │    │ • Dispense Obat    │
│ • Riwayat       │    │ • Alerts      │    │ • Receipt/Struk    │
│ • QR Code       │    └───────────────┘    └────────────────────┘
└─────────────────┘

         ▲                                           ▲
         │                                           │
    ┌────┴────┐                                ┌─────┴─────┐
    │  DOKTER │                                │  PASIEN   │
    │  ADMIN  │                                │           │
    │ OPERATOR│                                └───────────┘
    └─────────┘
```

### 3.2 Komponen Sistem

| Komponen | Teknologi | Fungsi |
|----------|-----------|--------|
| **Web Dokter** | Next.js 15 + React 19 | Portal dokter untuk buat resep dan kelola riwayat |
| **Web Scanner** | Next.js + html5-qrcode | Interface vending machine untuk scan QR dan dispense obat |
| **Admin Panel** | Next.js (dalam web-dokter) | Dashboard admin untuk kelola obat, user, dan alerts |
| **Backend API** | Supabase Edge Functions | Serverless API untuk create prescription dan verify QR |
| **Database** | PostgreSQL (Supabase) | Penyimpanan data dengan Row Level Security |
| **Authentication** | Supabase Auth | Autentikasi user dengan email/password |

### 3.3 Alur Data

```
DOKTER                    SUPABASE                     PASIEN
  │                          │                            │
  │ 1. Login                 │                            │
  ├─────────────────────────►│                            │
  │                          │                            │
  │ 2. Buat Resep            │                            │
  ├─────────────────────────►│                            │
  │                          │                            │
  │ 3. Generate QR Token     │                            │
  │◄─────────────────────────┤                            │
  │                          │                            │
  │ 4. Kirim QR ke Pasien    │                            │
  ├──────────────────────────┼───────────────────────────►│
  │                          │                            │
  │                          │  5. Scan QR di Vending     │
  │                          │◄───────────────────────────┤
  │                          │                            │
  │                          │  6. Verify & Dispense      │
  │                          ├───────────────────────────►│
  │                          │                            │
  │                          │  7. Update Stock & Status  │
  │                          │────────────────────────────│
```

---

## 4. TEKNOLOGI YANG DIGUNAKAN

### 4.1 Frontend Stack

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| **Next.js** | 15.0+ | React framework dengan App Router |
| **React** | 19.x | Library UI |
| **TypeScript** | 5.x | Type safety untuk JavaScript |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Lucide React** | 0.548+ | Icon library modern |
| **react-qr-code** | 2.0.18 | Generate QR Code di client |
| **html5-qrcode** | 2.3.8 | QR Code scanner via kamera |

### 4.2 Backend Stack

| Teknologi | Versi | Keterangan |
|-----------|-------|------------|
| **Supabase** | - | Backend as a Service |
| **PostgreSQL** | 15.x | Database relasional |
| **Deno** | std@0.168.0 | Runtime untuk Edge Functions |
| **Row Level Security** | - | Keamanan data berbasis policy |

### 4.3 Development Tools

| Tool | Keterangan |
|------|------------|
| **Node.js** | 20.19+ atau 22.12+ |
| **npm** | Package manager |
| **ESLint** | Linting JavaScript/TypeScript |
| **Git** | Version control |

---

## 5. STRUKTUR DATABASE

### 5.1 Entity Relationship Diagram (ERD)

```
┌─────────────────┐       ┌─────────────────────┐       ┌─────────────────┐
│     doctors     │       │    prescriptions    │       │    medicines    │
├─────────────────┤       ├─────────────────────┤       ├─────────────────┤
│ id (UUID) PK    │──────►│ id (UUID) PK        │       │ id (UUID) PK    │
│ name            │       │ doctor_id (FK)      │       │ name            │
│ license_number  │       │ patient_name        │       │ generic_name    │
│ email           │       │ patient_age         │       │ form (='tablet')│
│ phone           │       │ patient_gender      │       │ strength        │
│ role ★          │       │ diagnosis           │       │ manufacturer    │
│ user_id         │       │ notes               │       │ stock_quantity  │
│ created_at      │       │ status              │       │ min_stock_level │
│ updated_at      │       │ issued_at           │       │ price_per_unit  │
└─────────────────┘       │ expires_at          │       │ expired_at ★    │
                          │ dispensed_at        │       │ is_active       │
★ = Kolom baru            │ created_at          │       │ created_at      │
                          │ updated_at          │       │ updated_at      │
                          └─────────┬───────────┘       └────────┬────────┘
                                    │                            │
                                    ▼                            │
                          ┌─────────────────────┐                │
                          │ prescription_items  │◄───────────────┘
                          ├─────────────────────┤
                          │ id (UUID) PK        │
                          │ prescription_id(FK) │
                          │ medicine_id (FK)    │
                          │ dosage              │
                          │ frequency           │
                          │ duration_days       │
                          │ total_quantity      │
                          │ instructions        │
                          │ created_at          │
                          └─────────────────────┘

┌─────────────────┐       ┌─────────────────────┐
│   qr_tokens     │       │vending_transactions │
├─────────────────┤       ├─────────────────────┤
│ id (UUID) PK    │       │ id (UUID) PK        │
│ prescription_id │       │ prescription_id(FK) │
│ token (UNIQUE)  │       │ qr_token_id (FK)    │
│ is_valid        │       │ status              │
│ used_at         │       │ error_message       │
│ expires_at      │       │ dispensed_at        │
│ created_at      │       │ created_at          │
└─────────────────┘       └─────────────────────┘
```

### 5.2 Detail Tabel

#### 5.2.1 Tabel: `doctors`
Menyimpan data pengguna sistem (dokter, admin, operator).

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | ID unik pengguna |
| `name` | VARCHAR(255) | NOT NULL | Nama lengkap |
| `license_number` | VARCHAR(100) | UNIQUE, NOT NULL | Nomor SIP |
| `email` | VARCHAR(255) | UNIQUE | Email |
| `phone` | VARCHAR(20) | - | Nomor telepon |
| `role` | VARCHAR(20) | CHECK IN ('admin','doctor','operator') | **Role pengguna** |
| `user_id` | UUID | - | Link ke Supabase Auth |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu pembuatan |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update |

#### 5.2.2 Tabel: `medicines`
Katalog obat yang tersedia di vending machine.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | ID unik obat |
| `name` | VARCHAR(255) | NOT NULL | Nama obat |
| `generic_name` | VARCHAR(255) | - | Nama generik |
| `form` | VARCHAR(50) | CHECK (form='tablet') | Bentuk obat (hanya tablet) |
| `strength` | VARCHAR(50) | NOT NULL | Kekuatan (e.g., "500mg") |
| `manufacturer` | VARCHAR(255) | - | Produsen |
| `stock_quantity` | INTEGER | NOT NULL, >= 0 | Jumlah stok |
| `min_stock_level` | INTEGER | DEFAULT 10 | Level stok minimum (untuk alert) |
| `price_per_unit` | DECIMAL(10,2) | - | Harga per tablet |
| `description` | TEXT | - | Deskripsi obat |
| `expired_at` | DATE | - | **Tanggal kadaluarsa** |
| `is_active` | BOOLEAN | DEFAULT TRUE | Status aktif |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu pembuatan |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update |

#### 5.2.3 Tabel: `prescriptions`
Menyimpan data resep digital.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | ID unik resep |
| `doctor_id` | UUID | FK → doctors.id | Dokter pembuat |
| `patient_name` | VARCHAR(255) | - | Nama pasien |
| `patient_age` | INTEGER | - | Usia pasien |
| `patient_gender` | VARCHAR(10) | - | Jenis kelamin |
| `diagnosis` | TEXT | - | Diagnosis |
| `notes` | TEXT | - | Catatan tambahan |
| `status` | VARCHAR(20) | CHECK IN (...) | Status resep |
| `issued_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu terbit |
| `expires_at` | TIMESTAMPTZ | +30 days | Waktu kadaluarsa |
| `dispensed_at` | TIMESTAMPTZ | - | Waktu pengambilan |

**Status Resep:**
- `issued` — Resep terbit, belum diambil
- `dispensed` — Obat sudah diambil
- `expired` — Resep kadaluarsa (>30 hari)
- `cancelled` — Resep dibatalkan

#### 5.2.4 Tabel: `prescription_items`
Item obat dalam setiap resep.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID | ID unik item |
| `prescription_id` | UUID | FK → prescriptions.id |
| `medicine_id` | UUID | FK → medicines.id |
| `dosage` | VARCHAR(100) | Dosis (e.g., "1 tablet") |
| `frequency` | VARCHAR(100) | Frekuensi per hari |
| `duration_days` | INTEGER | Durasi pengobatan |
| `total_quantity` | INTEGER | Total tablet (auto-calculated) |
| `instructions` | TEXT | Aturan pakai |

#### 5.2.5 Tabel: `qr_tokens`
Token QR Code untuk setiap resep (sekali pakai).

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | UUID | ID unik token |
| `prescription_id` | UUID | FK → prescriptions.id |
| `token` | VARCHAR(255) | Nilai QR Code (format: RX-xxx-xxx) |
| `is_valid` | BOOLEAN | Status validitas |
| `used_at` | TIMESTAMPTZ | Waktu penggunaan |
| `expires_at` | TIMESTAMPTZ | Waktu kadaluarsa |

### 5.3 Database Views

#### View: `low_stock_medicines`
Menampilkan obat yang perlu perhatian (stok rendah atau kadaluarsa).

```sql
CREATE VIEW low_stock_medicines AS
SELECT 
    id, name, generic_name, strength,
    stock_quantity, min_stock_level, expired_at,
    CASE 
        WHEN expired_at <= CURRENT_DATE THEN 'expired'
        WHEN expired_at <= CURRENT_DATE + 30 days THEN 'expiring_soon'
        WHEN stock_quantity <= min_stock_level THEN 'low_stock'
        ELSE 'ok'
    END as status
FROM medicines
WHERE is_active = TRUE;
```

### 5.4 Database Functions

| Function | Keterangan |
|----------|------------|
| `update_updated_at_column()` | Auto-update kolom updated_at |
| `calculate_total_quantity()` | Auto-hitung total tablet |
| `check_medicine_validity()` | Validasi obat sebelum dispense |

---

## 6. MODUL APLIKASI

### 6.1 Web Dokter — Portal Dokter

#### 6.1.1 Autentikasi
- **Login** (`/login`) — Login dengan email & password
- **Register** (`/register`) — Registrasi dokter baru
- **Logout** — Hapus session dan redirect ke login

#### 6.1.2 Dashboard (`/dashboard`)
- Greeting berdasarkan waktu (Pagi/Siang/Sore/Malam)
- Statistik resep (hari ini, minggu ini, total, dll)
- Quick actions ke fitur utama
- Link ke Admin Panel (jika role admin/operator)

#### 6.1.3 Buat Resep (`/prescription/new`)
**Fitur:**
- Input data pasien dengan autocomplete dari riwayat
- 7 Template resep cepat (Demam, Flu, Sakit Kepala, dll)
- Pencarian obat dengan autocomplete
- Multi-item resep dengan validasi stok
- Generate QR Code otomatis

**Template Resep Tersedia:**
| Template | Obat Default |
|----------|--------------|
| Demam | Paracetamol 500mg |
| Flu/ISPA | Paracetamol + CTM |
| Sakit Kepala | Paracetamol 500mg |
| Nyeri/Radang | Ibuprofen 400mg |
| Nyeri Haid | Mefenamic Acid |
| Alergi | CTM |
| Maag | Antasida |

#### 6.1.4 Riwayat Resep (`/prescription/history`)
- Search berdasarkan nama pasien/diagnosis
- Filter status: Semua, Aktif, Sudah Diambil, Kadaluarsa, Dibatalkan
- Filter tanggal
- Aksi: Lihat Detail, Lihat QR, Batalkan

#### 6.1.5 QR Code (`/prescription/qr/[token]`)
- Display QR Code
- Token text untuk input manual
- Aksi: Print, Download PNG, Share WhatsApp

### 6.2 Admin Panel — Dashboard Administrator

#### 6.2.1 Dashboard Admin (`/admin`)
- Statistik total obat, user, dan resep
- Alert summary (expired, expiring soon, low stock)
- Quick actions ke fitur admin

#### 6.2.2 Kelola Obat (`/admin/medicines`)
- CRUD obat (Create, Read, Update, Delete)
- Update stok obat
- Set tanggal kadaluarsa
- Filter status (ok, low stock, expiring soon, expired)
- Pencarian obat

#### 6.2.3 Kelola User (`/admin/users`) — Admin Only
- Lihat semua user
- Ubah role user (admin, doctor, operator)
- Hapus user

#### 6.2.4 Peringatan Stok (`/admin/alerts`)
- List obat kadaluarsa
- List obat segera kadaluarsa (30 hari)
- List obat stok rendah
- Quick restock buttons (+50, +100, +500)

### 6.3 Web Scanner — Vending Machine Interface

#### 6.3.1 Home (`/`)
- Branding & welcome message
- Tombol "Mulai Scan QR Code"
- Instruksi penggunaan

#### 6.3.2 Scan (`/scan`)
- Kamera scanner menggunakan html5-qrcode
- Loading state saat verifikasi
- Error handling dengan retry otomatis

#### 6.3.3 Result (`/result`)
- Detail resep (dokter, pasien, obat)
- Tombol "Keluarkan Obat"
- Warning: QR hanya sekali pakai

#### 6.3.4 Receipt (`/receipt`)
- Struk profesional dengan semua detail
- Aksi: Print, Download, Scan Baru

---

## 7. ALUR KERJA SISTEM

### 7.1 Alur Pembuatan Resep

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   DOKTER    │     │   SISTEM    │     │  DATABASE   │
│   LOGIN     │────►│  VALIDASI   │────►│   AUTH      │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    ISI      │     │  GENERATE   │     │   SIMPAN    │
│   RESEP     │────►│  QR TOKEN   │────►│   RESEP     │
└─────────────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  TAMPILKAN  │────►│   PRINT/    │
│  QR CODE    │     │  DOWNLOAD   │
└─────────────┘     └─────────────┘
```

### 7.2 Alur Pengambilan Obat

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   PASIEN    │     │   SCANNER   │     │   VERIFY    │
│   SCAN QR   │────►│   BACA QR   │────►│   TOKEN     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │                                       ▼
       │                               ┌─────────────┐
       │                               │  VALIDASI:  │
       │                               │ • Token valid│
       │                               │ • Belum used │
       │                               │ • Stok cukup │
       │                               │ • Tidak exp  │
       │                               └──────┬──────┘
       │                                      │
       ▼                                      ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   AMBIL     │◄────│  DISPENSE   │◄────│   UPDATE:   │
│   OBAT      │     │   OBAT      │     │ • Stok -    │
└─────────────┘     └─────────────┘     │ • Status    │
       │                                │ • Token     │
       ▼                                └─────────────┘
┌─────────────┐
│   CETAK     │
│   STRUK     │
└─────────────┘
```

### 7.3 Alur Admin Management

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ADMIN     │     │   CHECK     │     │  DASHBOARD  │
│   LOGIN     │────►│   ROLE      │────►│   ADMIN     │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
              ┌────────────────────────────────┼────────────────┐
              │                                │                │
              ▼                                ▼                ▼
       ┌─────────────┐              ┌─────────────┐     ┌─────────────┐
       │   KELOLA    │              │   KELOLA    │     │   LIHAT     │
       │   OBAT      │              │   USER      │     │   ALERTS    │
       │ • Add/Edit  │              │ • Edit Role │     │ • Low Stock │
       │ • Stock     │              │ • Delete    │     │ • Expired   │
       │ • Expired   │              └─────────────┘     │ • Restock   │
       └─────────────┘                                  └─────────────┘
```

---

## 8. KEAMANAN SISTEM

### 8.1 Autentikasi & Otorisasi

| Mekanisme | Keterangan |
|-----------|------------|
| **Supabase Auth** | Autentikasi email/password |
| **JWT Token** | Session management |
| **Role-based Access** | admin, doctor, operator |
| **localStorage** | Penyimpanan session di client |

### 8.2 Role & Permission

| Role | Akses |
|------|-------|
| **admin** | Semua fitur termasuk kelola user |
| **doctor** | Buat resep, riwayat, dashboard |
| **operator** | Admin panel (kelola obat), tidak bisa kelola user |

### 8.3 Row Level Security (RLS)

| Tabel | Policy |
|-------|--------|
| `doctors` | User bisa baca semua (untuk login) |
| `medicines` | Public read, admin/operator modify |
| `prescriptions` | Dokter akses resep sendiri |
| `qr_tokens` | Service role only |
| `vending_transactions` | Service role only |

### 8.4 Keamanan Token QR

- **Format:** `RX-{prescription_id}-{timestamp}-{random_string}`
- **One-time use:** Token invalid setelah digunakan
- **Expiry:** 30 hari dari tanggal terbit
- **Validasi expired medicines:** Obat kadaluarsa tidak dapat di-dispense

### 8.5 Rekomendasi Keamanan Produksi

1. **HTTPS wajib** untuk akses kamera dan keamanan data
2. **Environment variables** tidak di-commit ke repository
3. **Service Role Key** hanya untuk Edge Functions
4. **Regular backup** database
5. **Monitoring** Edge Functions logs

---

## 9. PANDUAN INSTALASI

### 9.1 Prerequisites

- Node.js v20.19+ atau v22.12+
- npm atau pnpm
- Akun Supabase dengan project aktif
- Git

### 9.2 Clone Repository

```bash
git clone <repository-url>
cd KP
```

### 9.3 Setup Database (Supabase)

1. Buka Supabase Dashboard → SQL Editor
2. Jalankan `supabase/schema_final.sql`
3. Jalankan `supabase/migrations/003_add_roles_and_expired.sql`
4. Verifikasi semua tabel terbuat

### 9.4 Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login ke Supabase
supabase login

# Link project
supabase link --project-ref <your-project-ref>

# Deploy functions
supabase functions deploy create_prescription
supabase functions deploy verify_qr_and_lock
supabase functions deploy doctor_login
supabase functions deploy get_doctors
```

### 9.5 Setup Web Dokter

```bash
cd web-dokter
npm install

# Buat file environment
cp .env.example .env.local

# Edit .env.local dengan credentials Supabase:
# NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Jalankan development server
npm run dev
# Buka http://localhost:3000
```

### 9.6 Setup Web Scanner

```bash
cd web-scanner
npm install

# Buat file environment
cp .env.example .env.local
# Isi dengan credentials yang sama

# Jalankan development server
npm run dev
# Buka http://localhost:3002
```

### 9.7 Setup User Admin Pertama

```sql
-- Di Supabase SQL Editor:
-- Setelah registrasi user, set sebagai admin:
UPDATE doctors SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## 10. PANDUAN PENGGUNAAN

### 10.1 Untuk Dokter

#### Registrasi Akun Baru
1. Buka http://localhost:3000/register
2. Isi form: Nama, Nomor SIP, Email, Password
3. Klik "Daftar"
4. Login dengan email dan password

#### Membuat Resep Baru
1. Login ke Web Dokter
2. Klik "Buat Resep Baru"
3. Isi data pasien (opsional)
4. Pilih template ATAU cari obat manual
5. Atur dosis, frekuensi, durasi untuk setiap obat
6. Klik "Generate QR Code"
7. Print atau share QR ke pasien

#### Melihat Riwayat Resep
1. Klik "Riwayat" di sidebar
2. Gunakan filter dan search jika perlu
3. Klik "Detail" untuk melihat detail resep
4. Klik "QR Code" untuk melihat/print ulang

### 10.2 Untuk Pasien

#### Mengambil Obat di Vending Machine
1. Bawa QR Code dari dokter
2. Buka web scanner di vending machine
3. Klik "Mulai Scan QR Code"
4. Izinkan akses kamera
5. Arahkan QR Code ke kamera
6. Verifikasi detail resep yang muncul
7. Klik "Keluarkan Obat"
8. Ambil obat yang keluar
9. Simpan/print struk sebagai bukti

### 10.3 Untuk Admin/Operator

#### Mengakses Admin Panel
1. Login dengan akun yang memiliki role admin/operator
2. Klik tombol "Admin Panel" (warna kuning) di sidebar

#### Mengelola Stok Obat
1. Buka menu "Kelola Obat"
2. Untuk update stok: Edit obat → ubah jumlah stok
3. Untuk tambah obat baru: Klik "Tambah Obat"
4. Isi form lengkap termasuk tanggal kadaluarsa

#### Menangani Alert Obat
1. Buka menu "Peringatan"
2. Obat kadaluarsa: Segera ganti/buang
3. Obat segera kadaluarsa: Prioritaskan penjualan
4. Stok rendah: Gunakan quick restock atau edit manual

#### Mengelola User (Admin Only)
1. Buka menu "Kelola User"
2. Klik edit pada user yang ingin diubah
3. Pilih role baru (admin/doctor/operator)
4. Klik "Simpan"

---

## 11. PENGUJIAN SISTEM

### 11.1 Test Cases — Alur Normal

| No | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| 1 | Registrasi dokter baru | Akun terbuat, redirect ke login | ✓ |
| 2 | Login dengan credentials valid | Masuk ke dashboard | ✓ |
| 3 | Buat resep dengan template | Resep tersimpan, QR tergenerate | ✓ |
| 4 | Scan QR valid | Tampil detail resep | ✓ |
| 5 | Dispense obat | Stok berkurang, status berubah | ✓ |
| 6 | Akses admin panel (role admin) | Dashboard admin tampil | ✓ |
| 7 | Update stok obat | Stok ter-update | ✓ |
| 8 | Ubah role user | Role berubah | ✓ |

### 11.2 Test Cases — Error Handling

| No | Test Case | Expected Result | Status |
|----|-----------|-----------------|--------|
| 1 | Login dengan password salah | Error "Invalid credentials" | ✓ |
| 2 | Scan QR yang sudah digunakan | Error "already used" | ✓ |
| 3 | Scan QR kadaluarsa | Error "expired" | ✓ |
| 4 | Dispense obat dengan stok kosong | Error "insufficient stock" | ✓ |
| 5 | Dispense obat yang sudah expired | Error "expired medicine" | ✓ |
| 6 | Akses admin tanpa role | Redirect ke dashboard | ✓ |

### 11.3 Test Cases — Edge Cases

| No | Test Case | Expected Result |
|----|-----------|-----------------|
| 1 | Resep tanpa nama pasien | Tersimpan dengan "Anonymous" |
| 2 | Multi-item resep (5+ obat) | Semua tersimpan dengan benar |
| 3 | Refresh halaman QR | QR tetap tampil |
| 4 | Kamera tidak tersedia | Error message jelas |
| 5 | Koneksi internet terputus | Handling error graceful |

---

## 12. KESIMPULAN DAN PENGEMBANGAN LANJUTAN

### 12.1 Kesimpulan

Sistem VenMed (Smart Medical Vending Machine) telah berhasil dikembangkan dengan fitur-fitur utama:

1. **Digitalisasi Resep** — Dokter dapat membuat resep digital dengan mudah
2. **QR Code Token** — Setiap resep memiliki QR Code unik yang sekali pakai
3. **Vending Interface** — Pasien dapat mengambil obat via scan QR
4. **Admin Panel** — Fitur lengkap untuk kelola obat, user, dan alert
5. **Keamanan** — RLS, role-based access, expired validation

### 12.2 Fitur yang Sudah Diimplementasi

- ✅ Autentikasi dokter (Login/Register)
- ✅ Dashboard statistik resep
- ✅ Pembuatan resep dengan template
- ✅ Autocomplete obat dan pasien
- ✅ Generate & print QR Code
- ✅ Scanner QR dengan kamera
- ✅ Verifikasi dan dispense obat
- ✅ Receipt/struk yang dapat dicetak
- ✅ Role management (admin, doctor, operator)
- ✅ Kelola stok obat
- ✅ Kelola user (admin only)
- ✅ Alert sistem (low stock, expired)
- ✅ Validasi obat expired saat dispense

### 12.3 Pengembangan Lanjutan (Roadmap)

#### Phase 2 — Near Term
- [ ] Integrasi pembayaran QRIS
- [ ] Notifikasi SMS/Email
- [ ] Dashboard analytics lebih detail
- [ ] Export laporan ke PDF/Excel

#### Phase 3 — Long Term
- [ ] Integrasi hardware vending machine aktual
- [ ] Offline mode support
- [ ] Multi-location/branch support
- [ ] Integrasi asuransi kesehatan
- [ ] Mobile app native (iOS/Android)

### 12.4 Catatan Teknis

**Keterbatasan Saat Ini:**
- Hanya mendukung obat bentuk tablet
- Belum ada fitur notifikasi real-time
- Belum ada audit trail lengkap
- Demo mode (belum terintegrasi hardware)

**Rekomendasi Deployment:**
- Gunakan Vercel untuk frontend (gratis untuk hobby)
- Gunakan Supabase free tier untuk development
- Upgrade ke Supabase Pro untuk production
- Pastikan HTTPS untuk keamanan data medis

---

## LAMPIRAN

### A. Struktur File Project

```
KP/
├── supabase/
│   ├── schema_final.sql              # Database schema
│   ├── migrations/
│   │   └── 003_add_roles_and_expired.sql
│   └── functions/
│       ├── create_prescription/       
│       ├── verify_qr_and_lock/        
│       ├── doctor_login/
│       └── get_doctors/
│
├── web-dokter/                        # Next.js - Portal Dokter
│   ├── app/
│   │   ├── page.tsx                   # Home (redirect)
│   │   ├── login/                     # Login page
│   │   ├── register/                  # Register page
│   │   ├── dashboard/                 # Dashboard dokter
│   │   ├── prescription/
│   │   │   ├── new/                   # Buat resep
│   │   │   ├── history/               # Riwayat resep
│   │   │   ├── [id]/                  # Detail resep
│   │   │   └── qr/[token]/            # QR Code page
│   │   └── admin/                     # Admin Panel
│   │       ├── page.tsx               # Dashboard admin
│   │       ├── medicines/             # Kelola obat
│   │       ├── users/                 # Kelola user
│   │       └── alerts/                # Peringatan stok
│   └── lib/
│       ├── supabase.ts                # Supabase client + API
│       └── medicines.ts               # Medicine API
│
├── web-scanner/                       # Next.js - Vending Scanner
│   ├── app/
│   │   ├── page.tsx                   # Home
│   │   ├── scan/                      # QR Scanner
│   │   ├── result/                    # Hasil verifikasi
│   │   └── receipt/                   # Struk
│   └── lib/
│       └── supabase.ts
│
├── README.md                          # Dokumentasi utama
├── DEPLOYMENT.md                      # Panduan deployment
├── DB.md                              # Database changelog
├── ADMIN_PANEL.md                     # Panduan admin panel
└── Laporan lengkap.md                 # File ini
```

### B. Daftar Obat Default

| Nama | Generik | Kekuatan | Stok Awal |
|------|---------|----------|-----------|
| Paracetamol | Acetaminophen | 500mg | 1000 |
| Amoxicillin | Amoxicillin | 500mg | 500 |
| Ibuprofen | Ibuprofen | 400mg | 800 |
| Cetirizine | Cetirizine HCl | 10mg | 600 |
| Omeprazole | Omeprazole | 20mg | 400 |
| Metformin | Metformin HCl | 500mg | 750 |
| Vitamin C | Ascorbic Acid | 1000mg | 1200 |

### C. Environment Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...

# Optional (untuk admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### D. Referensi Warna UI

| Elemen | Warna | Tailwind Class |
|--------|-------|----------------|
| Primary | Navy Blue | `bg-blue-900` |
| Admin Primary | Purple | `bg-purple-900` |
| Success | Emerald | `bg-emerald-600` |
| Warning | Amber | `bg-amber-500` |
| Error | Red | `bg-red-600` |
| Background | Slate 50 | `bg-slate-50` |
| Card | White | `bg-white` |
| Text Primary | Slate 800 | `text-slate-800` |

---

**Dokumen ini dibuat sebagai referensi lengkap untuk pengembangan dan pemeliharaan sistem VenMed.**

*Terakhir diperbarui: Januari 2026*
