# Laporan Sistem — VenMed (Smart Medical Vending)

Dokumen ini merangkum **keseluruhan aplikasi VenMed** yang ada di workspace, termasuk arsitektur, fitur, skema database, fungsi Supabase, alur kerja sistem, instruksi pengembangan, deployment, dan rekomendasi lanjutan.

---

## 1. Ringkasan Proyek

| Item | Keterangan |
|------|------------|
| **Nama Proyek** | VenMed — Smart Medical Vending |
| **Tujuan** | Menyediakan sistem resep digital terintegrasi dengan vending machine untuk pengeluaran obat terverifikasi secara otomatis |
| **Target Pengguna** | Dokter (pembuat resep) dan Pasien (pengambil obat via vending machine) |
| **Jenis Obat** | Hanya obat bentuk **tablet** yang didukung |

### Aplikasi yang Dikembangkan

1. **`web-dokter`** — Antarmuka untuk dokter
   - Login/Register dokter
   - Dashboard statistik resep
   - Pembuatan resep baru dengan template & autocomplete
   - Riwayat resep dengan filter & pencarian
   - Detail resep & QR Code generation
   - Pembatalan resep

2. **`web-scanner`** — Antarmuka untuk vending machine
   - Halaman utama dengan instruksi
   - Scanner QR Code (menggunakan kamera)
   - Verifikasi resep real-time
   - Proses pengeluaran obat (dispense)
   - Struk/receipt yang dapat dicetak

3. **Backend: Supabase**
   - Database PostgreSQL
   - Edge Functions (serverless)
   - Row Level Security (RLS)

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ARSITEKTUR VENMED                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   WEB-DOKTER     │         │    SUPABASE      │         │   WEB-SCANNER    │
│   (Next.js)      │         │    (Backend)     │         │   (Next.js)      │
│   Port: 3000     │         │                  │         │   Port: 3002     │
├──────────────────┤         ├──────────────────┤         ├──────────────────┤
│ • Login/Register │◄───────►│ • PostgreSQL DB  │◄───────►│ • QR Scanner     │
│ • Dashboard      │   API   │ • Edge Functions │   API   │ • Verify Token   │
│ • Buat Resep     │         │ • RLS Policies   │         │ • Dispense       │
│ • Riwayat Resep  │         │ • Storage        │         │ • Receipt        │
│ • QR Code Gen    │         │                  │         │                  │
└──────────────────┘         └──────────────────┘         └──────────────────┘
```

### Alur Kerja Sistem

1. Dokter login ke web-dokter
2. Dokter membuat resep → sistem generate QR Token
3. QR Code diberikan ke pasien (print/download/WhatsApp)
4. Pasien scan QR di web-scanner (vending machine)
5. Sistem verifikasi token via Edge Function
6. Jika valid → dispense obat, update status, kurangi stok
7. Pasien dapat struk/receipt

---

## 3. Teknologi & Dependensi

### 3.1 Web-Dokter (`web-dokter/package.json`)

| Package | Versi | Keterangan |
|---------|-------|------------|
| `next` | 16.0.0 | Framework React dengan App Router |
| `react` | 19.2.0 | Library UI |
| `react-dom` | 19.2.0 | React DOM renderer |
| `@supabase/supabase-js` | ^2.76.1 | Supabase client SDK |
| `lucide-react` | ^0.548.0 | Icon library |
| `react-qr-code` | ^2.0.18 | Generate QR Code di client |
| `qrcode` | ^1.5.4 | QR Code utilities |
| `tailwindcss` | ^4 | CSS framework |
| `typescript` | ^5 | Type safety |

**Scripts:**
```bash
npm run dev      # Development server (port 3000)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

### 3.2 Web-Scanner (`web-scanner/package.json`)

| Package | Versi | Keterangan |
|---------|-------|------------|
| `next` | 16.0.0 | Framework React dengan App Router |
| `react` | 19.2.0 | Library UI |
| `react-dom` | 19.2.0 | React DOM renderer |
| `@supabase/supabase-js` | ^2.76.1 | Supabase client SDK |
| `lucide-react` | ^0.548.0 | Icon library |
| `html5-qrcode` | ^2.3.8 | QR Code scanner via kamera |
| `tailwindcss` | ^4 | CSS framework |
| `typescript` | ^5 | Type safety |

**Scripts:**
```bash
npm run dev      # Development server (port 3002)
npm run build    # Production build
npm run start    # Production server (port 3002)
npm run lint     # ESLint
```

### 3.3 Supabase Edge Functions

| Runtime | Versi |
|---------|-------|
| Deno | std@0.168.0 |
| Supabase JS | @supabase/supabase-js@2 (ESM) |

---

## 4. Struktur Database (PostgreSQL)

### 4.1 Entity Relationship Diagram (ERD)

```
┌─────────────────┐       ┌─────────────────────┐       ┌─────────────────┐
│     doctors     │       │    prescriptions    │       │    medicines    │
├─────────────────┤       ├─────────────────────┤       ├─────────────────┤
│ id (UUID) PK    │──────►│ id (UUID) PK        │       │ id (UUID) PK    │
│ name            │       │ doctor_id (FK)      │       │ name            │
│ license_number  │       │ patient_name        │       │ generic_name    │
│ email           │       │ patient_age         │       │ form (='tablet')│
│ phone           │       │ patient_gender      │       │ strength        │
│ created_at      │       │ diagnosis           │       │ manufacturer    │
│ updated_at      │       │ notes               │       │ stock_quantity  │
└─────────────────┘       │ status              │       │ min_stock_level │
                          │ issued_at           │       │ price_per_unit  │
                          │ expires_at          │       │ description     │
                          │ dispensed_at        │       │ is_active       │
                          │ created_at          │       │ created_at      │
                          │ updated_at          │       │ updated_at      │
                          └─────────────────────┘       └─────────────────┘
                                    │                           │
                                    │                           │
                                    ▼                           │
                          ┌─────────────────────┐               │
                          │ prescription_items  │               │
                          ├─────────────────────┤               │
                          │ id (UUID) PK        │               │
                          │ prescription_id(FK) │◄──────────────┤
                          │ medicine_id (FK)    │───────────────┘
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

### 4.2 Detail Tabel

#### Tabel: `doctors`
Menyimpan data dokter yang dapat membuat resep.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | ID unik dokter |
| `name` | VARCHAR(255) | NOT NULL | Nama lengkap dokter |
| `license_number` | VARCHAR(100) | UNIQUE, NOT NULL | Nomor SIP (Surat Izin Praktik) |
| `email` | VARCHAR(255) | UNIQUE | Email dokter |
| `phone` | VARCHAR(20) | - | Nomor telepon |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu pembuatan |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update terakhir |

#### Tabel: `medicines`
Katalog obat yang tersedia di vending machine (hanya tablet).

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | ID unik obat |
| `name` | VARCHAR(255) | NOT NULL | Nama obat |
| `generic_name` | VARCHAR(255) | - | Nama generik |
| `form` | VARCHAR(50) | CHECK (form='tablet') | Bentuk obat (hanya tablet) |
| `strength` | VARCHAR(50) | NOT NULL | Kekuatan dosis (e.g., "500mg") |
| `manufacturer` | VARCHAR(255) | - | Produsen |
| `stock_quantity` | INTEGER | NOT NULL, CHECK >= 0 | Jumlah stok |
| `min_stock_level` | INTEGER | DEFAULT 10 | Level stok minimum |
| `price_per_unit` | DECIMAL(10,2) | - | Harga per tablet |
| `description` | TEXT | - | Deskripsi obat |
| `is_active` | BOOLEAN | DEFAULT TRUE | Status aktif |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu pembuatan |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update |

#### Tabel: `prescriptions`
Menyimpan data resep yang dibuat dokter.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | ID unik resep |
| `doctor_id` | UUID | FK → doctors.id, ON DELETE CASCADE | Dokter pembuat |
| `patient_name` | VARCHAR(255) | - | Nama pasien (opsional) |
| `patient_age` | INTEGER | - | Usia pasien |
| `patient_gender` | VARCHAR(10) | - | Jenis kelamin |
| `diagnosis` | TEXT | - | Diagnosis |
| `notes` | TEXT | - | Catatan tambahan |
| `status` | VARCHAR(20) | CHECK IN ('issued','dispensed','expired','cancelled') | Status resep |
| `issued_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu terbit |
| `expires_at` | TIMESTAMPTZ | DEFAULT NOW()+30 days | Waktu kadaluarsa |
| `dispensed_at` | TIMESTAMPTZ | - | Waktu pengambilan obat |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu pembuatan |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu update |

**Status Resep:**
- `issued` — Resep terbit, belum diambil
- `dispensed` — Obat sudah diambil
- `expired` — Resep kadaluarsa (>30 hari)
- `cancelled` — Resep dibatalkan oleh dokter

#### Tabel: `prescription_items`
Item obat dalam setiap resep.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | ID unik item |
| `prescription_id` | UUID | FK → prescriptions.id | Resep terkait |
| `medicine_id` | UUID | FK → medicines.id | Obat yang diresepkan |
| `dosage` | VARCHAR(100) | NOT NULL | Dosis (e.g., "1 tablet") |
| `frequency` | VARCHAR(100) | NOT NULL | Frekuensi (e.g., "3 kali sehari") |
| `duration_days` | INTEGER | NOT NULL, CHECK > 0 | Durasi pengobatan (hari) |
| `total_quantity` | INTEGER | NOT NULL, CHECK > 0 | Total tablet yang dikeluarkan |
| `instructions` | TEXT | - | Aturan pakai (e.g., "Setelah makan") |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu pembuatan |

#### Tabel: `qr_tokens`
Token QR Code untuk setiap resep (satu kali pakai).

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | ID unik token |
| `prescription_id` | UUID | FK → prescriptions.id | Resep terkait |
| `token` | VARCHAR(255) | UNIQUE, NOT NULL | Nilai QR Code |
| `is_valid` | BOOLEAN | DEFAULT TRUE | Status validitas |
| `used_at` | TIMESTAMPTZ | - | Waktu penggunaan |
| `expires_at` | TIMESTAMPTZ | NOT NULL | Waktu kadaluarsa |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu pembuatan |

**Format Token:** `RX-{prescription_id}-{timestamp}-{random_string}`

#### Tabel: `vending_transactions`
Log transaksi vending machine.

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | ID unik transaksi |
| `prescription_id` | UUID | FK → prescriptions.id | Resep terkait |
| `qr_token_id` | UUID | FK → qr_tokens.id | Token yang digunakan |
| `status` | VARCHAR(20) | CHECK IN ('pending','completed','failed') | Status transaksi |
| `error_message` | TEXT | - | Pesan error (jika gagal) |
| `dispensed_at` | TIMESTAMPTZ | - | Waktu dispense |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Waktu pembuatan |

### 4.3 Database Views

#### View: `prescription_details`
Menggabungkan resep dengan info dokter.

```sql
SELECT 
    p.id, p.patient_name, p.patient_age, p.diagnosis, p.status,
    p.issued_at, p.expires_at,
    d.name AS doctor_name, d.license_number AS doctor_license,
    COUNT(pi.id) AS total_items
FROM prescriptions p
JOIN doctors d ON p.doctor_id = d.id
LEFT JOIN prescription_items pi ON p.id = pi.prescription_id
GROUP BY p.id, d.name, d.license_number;
```

#### View: `prescription_items_detailed`
Menggabungkan item resep dengan detail obat.

```sql
SELECT 
    pi.id, pi.prescription_id,
    m.name AS medicine_name, m.generic_name, m.strength,
    pi.dosage, pi.frequency, pi.duration_days, pi.total_quantity, pi.instructions
FROM prescription_items pi
JOIN medicines m ON pi.medicine_id = m.id;
```

### 4.4 Database Functions & Triggers

| Function | Trigger | Keterangan |
|----------|---------|------------|
| `update_updated_at_column()` | `update_doctors_updated_at`, `update_medicines_updated_at`, `update_prescriptions_updated_at` | Auto-update kolom `updated_at` |
| `calculate_total_quantity()` | `calculate_prescription_item_quantity` | Auto-hitung total tablet berdasarkan frekuensi × durasi |

### 4.5 Row Level Security (RLS)

| Tabel | Policy | Akses |
|-------|--------|-------|
| `doctors` | `doctors_select_own`, `doctors_insert_own`, `doctors_update_own` | Dokter hanya akses data sendiri |
| `medicines` | `medicines_select_active`, `medicines_modify_service` | Public read (aktif), service role modify |
| `prescriptions` | `prescriptions_select_own`, `prescriptions_insert_own`, `prescriptions_update_own` | Dokter hanya akses resep sendiri |
| `prescription_items` | `prescription_items_access` | Akses melalui prescription owner |
| `qr_tokens` | `qr_tokens_service_only` | Hanya service role |
| `vending_transactions` | `vending_transactions_service_only` | Hanya service role |

---

## 5. Supabase Edge Functions

### 5.1 `create_prescription`

**Endpoint:** `POST /functions/v1/create_prescription`

**Tujuan:** Membuat resep baru dan generate QR token.

**Request Body:**
```typescript
{
  doctor_id: string;          // UUID dokter
  patient_name?: string;      // Nama pasien (opsional)
  patient_age?: number;       // Usia
  patient_gender?: string;    // Jenis kelamin
  diagnosis?: string;         // Diagnosis
  notes?: string;             // Catatan
  items: [{
    medicine_id: string;      // UUID obat
    dosage: string;           // "1 tablet"
    frequency: string;        // "3 kali sehari"
    duration_days: number;    // 5
    instructions?: string;    // "Setelah makan"
  }]
}
```

**Response Success (201):**
```typescript
{
  success: true,
  prescription: {
    id: string,
    status: "issued",
    issued_at: string,
    expires_at: string
  },
  qr_token: {
    token: string,           // "RX-xxx-xxx-xxx"
    id: string
  },
  items: [...]
}
```

**Validasi yang Dilakukan:**
1. Dokter harus ada di database
2. Semua obat harus ada, aktif, dan berbentuk tablet
3. Stok obat harus mencukupi
4. Rollback jika gagal insert items

### 5.2 `verify_qr_and_lock`

**Endpoint:** `POST /functions/v1/verify_qr_and_lock`

**Tujuan:** Verifikasi QR token dan proses dispense obat.

**Request Body:**
```typescript
{
  token: string;                    // Token dari QR Code
  action?: "verify" | "dispense";   // Default: "verify"
}
```

**Response Success (200):**
```typescript
{
  valid: true,
  action: "verify" | "dispense",
  prescription: {
    id: string,
    patient_name: string,
    patient_age: number,
    diagnosis: string,
    doctor: { name: string, license_number: string },
    issued_at: string,
    status: string
  },
  items: [{
    medicine: { name, generic_name, strength, form },
    dosage: string,
    frequency: string,
    duration_days: number,
    total_quantity: number,
    instructions: string
  }],
  token_info: {
    expires_at: string,
    used_at: string | null
  }
}
```

**Validasi yang Dilakukan:**
1. Token harus ada di database
2. Token belum pernah digunakan (`is_valid = true`)
3. Token belum kadaluarsa
4. Status resep harus `issued`
5. Stok semua obat mencukupi

**Proses Dispense (action = "dispense"):**
1. Mark token sebagai `is_valid = false`
2. Update prescription status ke `dispensed`
3. Kurangi stok obat
4. Catat transaksi di `vending_transactions`

### 5.3 `doctor_login` & `get_doctors`

Function helper untuk autentikasi dan data dokter.

---

## 6. Fitur Aplikasi (Detail)

### 6.1 Web-Dokter — Fitur Lengkap

#### 6.1.1 Autentikasi Dokter
- **Login** (`/login`) — Login dengan email & SIP
- **Register** (`/register`) — Registrasi dokter baru
- **Session** — Data dokter disimpan di `localStorage`
- **Logout** — Hapus session dan redirect ke login

#### 6.1.2 Dashboard (`/dashboard`)
- Greeting berdasarkan waktu (Pagi/Siang/Sore/Malam)
- Statistik resep:
  - Resep hari ini
  - Resep minggu ini
  - Resep bulan ini
  - Total resep
  - Resep sudah diambil (dispensed)
  - Resep aktif (pending)
- Quick actions: Buat Resep, Lihat Riwayat

#### 6.1.3 Buat Resep (`/prescription/new`)

**Fitur Input Pasien:**
- Nama pasien dengan **autocomplete** dari riwayat
- Usia (tahun)
- Jenis kelamin (Laki-laki/Perempuan)
- Diagnosis
- Catatan tambahan

**Fitur Template Resep (7 Template):**
| Template | Obat yang Otomatis Ditambahkan |
|----------|--------------------------------|
| Demam | Paracetamol 500mg |
| Flu/ISPA | Paracetamol 500mg + CTM 4mg |
| Sakit Kepala | Paracetamol 500mg |
| Nyeri/Radang | Ibuprofen 400mg |
| Nyeri Haid | Mefenamic Acid 500mg |
| Alergi | CTM 4mg |
| Maag/Asam Lambung | Antasida |

**Fitur Pencarian Obat:**
- Search obat dengan autocomplete
- Menampilkan nama, generik, kekuatan, stok
- Validasi stok real-time

**Fitur Item Resep:**
- Tambah multiple obat
- Atur dosis, frekuensi, durasi, instruksi
- Hapus item
- Validasi sebelum submit

#### 6.1.4 Riwayat Resep (`/prescription/history`)

**Filter & Pencarian:**
- Search: nama pasien atau diagnosis
- Filter status: Semua, Aktif, Sudah Diambil, Kadaluarsa, Dibatalkan
- Filter tanggal: Dari - Sampai
- Reset filter

**Statistik:**
- Jumlah per status
- Total resep

**Aksi per Resep:**
- Lihat Detail
- Lihat QR Code (jika aktif)
- Batalkan Resep (jika aktif)

#### 6.1.5 Detail Resep (`/prescription/[id]`)
- Info pasien lengkap
- Info dokter (nama, SIP)
- Daftar obat dengan detail
- Timeline (terbit, kadaluarsa, diambil)
- Status badge
- Link ke QR Code

#### 6.1.6 QR Code (`/prescription/qr/[token]`)
- QR Code yang dapat di-scan
- Token text untuk input manual
- Instruksi pengambilan obat
- **Aksi:**
  - Print
  - Download PNG
  - Share via WhatsApp
  - Buat Resep Baru

### 6.2 Web-Scanner — Fitur Lengkap

#### 6.2.1 Home (`/`)
- Branding & welcome message
- Tombol "Mulai Scan QR Code"
- Instruksi penggunaan
- Info penting (koneksi, one-time use)

#### 6.2.2 Scan (`/scan`)
- Kamera scanner (html5-qrcode)
- Overlay & guide frame
- Loading state saat verifikasi
- Error handling dengan retry otomatis
- Instruksi scanning

#### 6.2.3 Result (`/result`)
- Success indicator
- Detail resep:
  - Nama dokter & SIP
  - Tanggal resep
  - Daftar obat lengkap
- Tombol "Keluarkan Obat"
- Tombol "Batal"
- Warning: QR hanya sekali pakai

#### 6.2.4 Receipt (`/receipt`)
- Header struk profesional
- Info transaksi:
  - Nomor resep
  - Tanggal & waktu
  - Data pasien
  - Data dokter
- Daftar obat dengan detail
- Total tablet
- Catatan penting penggunaan obat
- **Aksi:**
  - Print
  - Download/Simpan
  - Scan Baru

---

## 7. UI/UX Design System

### 7.1 Tema Warna (Navy Blue Theme)

| Elemen | Warna | Tailwind Class |
|--------|-------|----------------|
| **Primary** | Navy Blue | `bg-blue-900`, `text-blue-900` |
| **Primary Hover** | Blue 800 | `hover:bg-blue-800` |
| **Background** | Slate 50 | `bg-slate-50` |
| **Card** | White | `bg-white` |
| **Border** | Slate 200 | `border-slate-200` |
| **Text Primary** | Slate 800 | `text-slate-800` |
| **Text Secondary** | Slate 600 | `text-slate-600` |
| **Text Muted** | Slate 500 | `text-slate-500` |
| **Placeholder** | Slate 400 | `placeholder:text-slate-400` |

### 7.2 Status Colors

| Status | Background | Text |
|--------|------------|------|
| Issued/Active | `bg-blue-100` | `text-blue-900` |
| Dispensed | `bg-green-100` | `text-green-800` |
| Expired | `bg-slate-100` | `text-slate-600` |
| Cancelled | `bg-red-100` | `text-red-700` |

### 7.3 Component Patterns

**Card Container:**
```
bg-white rounded-xl shadow-sm border border-slate-200
```

**Header (Card/Page):**
```
bg-blue-900 text-white
```

**Buttons:**
- Primary: `bg-blue-900 hover:bg-blue-800 text-white`
- Secondary: `bg-slate-600 hover:bg-slate-700 text-white`
- Success: `bg-green-600 hover:bg-green-700 text-white`
- Danger: `bg-red-600 hover:bg-red-700 text-white`

**Input Field:**
```
bg-white border-slate-300 text-slate-800 focus:ring-blue-900 placeholder:text-slate-400
```

---

## 8. Environment & Configuration

### 8.1 Environment Variables

**File: `.env.local`** (jangan commit ke repo!)

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Optional: Service Role (untuk admin operations)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 8.2 Supabase Edge Functions Environment

Environment variables di-set otomatis oleh Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 9. Cara Menjalankan

### 9.1 Prerequisites
- Node.js v18+ 
- npm atau pnpm
- Akun Supabase dengan project

### 9.2 Setup Database
1. Buka Supabase Dashboard → SQL Editor
2. Jalankan isi file `supabase/schema_final.sql`
3. Pastikan semua tabel, view, dan RLS terbuat

### 9.3 Deploy Edge Functions
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy create_prescription
supabase functions deploy verify_qr_and_lock
supabase functions deploy doctor_login
supabase functions deploy get_doctors
```

### 9.4 Jalankan Web-Dokter
```bash
cd web-dokter
npm install
cp .env.example .env.local   # Isi dengan credentials
npm run dev
# Buka http://localhost:3000
```

### 9.5 Jalankan Web-Scanner
```bash
cd web-scanner
npm install
cp .env.example .env.local   # Isi dengan credentials
npm run dev
# Buka http://localhost:3002
```

---

## 10. Deployment Production

### 10.1 Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy web-dokter
cd web-dokter
vercel

# Deploy web-scanner
cd web-scanner
vercel
```

Set environment variables di Vercel Dashboard.

### 10.2 Supabase Production
1. Pastikan RLS aktif dan policy benar
2. Set up database backups
3. Monitor Edge Functions logs
4. Atur rate limiting jika perlu

---

## 11. Testing & QA

### 11.1 Manual Testing Flow

```
1. REGISTER DOKTER
   └─ Isi form register → Login

2. BUAT RESEP
   ├─ Isi data pasien
   ├─ Pilih template ATAU cari obat manual
   ├─ Submit → Redirect ke QR page
   └─ Print/Download QR

3. SCAN QR (di web-scanner)
   ├─ Buka /scan
   ├─ Izinkan kamera
   ├─ Scan QR → Verify sukses
   └─ Klik "Keluarkan Obat"

4. CEK RECEIPT
   ├─ Struk muncul
   ├─ Print/Download
   └─ Kembali ke beranda

5. VERIFIKASI DI WEB-DOKTER
   ├─ Cek riwayat resep
   └─ Status berubah ke "Sudah Diambil"
```

### 11.2 Edge Cases Testing
- [ ] QR Code sudah digunakan → Error "already used"
- [ ] QR Code kadaluarsa → Error "expired"
- [ ] Stok obat habis → Error "insufficient stock"
- [ ] Resep dibatalkan → Error "cancelled"
- [ ] Token tidak valid → Error "not found"

---

## 12. Known Issues & Troubleshooting

### 12.1 Issues

| Issue | Solusi |
|-------|--------|
| Placeholder tidak terlihat | Cek `globals.css`, pastikan force light mode |
| Gradient tidak muncul | Ganti `bg-gradient-to-*` → `bg-linear-to-*` (Tailwind v4) |
| Kamera tidak bisa akses | Pastikan HTTPS atau localhost |
| Edge Function timeout | Tambah error handling, cek Supabase logs |

### 12.2 Debugging

```bash
# Cek Supabase Edge Function logs
supabase functions logs verify_qr_and_lock

# Cek browser console untuk API errors
# Network tab untuk response details
```

---

## 13. Security Considerations

1. **Jangan commit `.env.local`** ke repository
2. **Service Role Key** hanya untuk Edge Functions, tidak di client
3. **RLS aktif** pada semua tabel
4. **Token satu kali pakai** untuk mencegah duplikasi
5. **Validasi stok** sebelum dispense
6. **HTTPS wajib** untuk production (camera access)

---

## 14. Daftar Obat Sample (Database Seed)

Obat yang tersedia di database awal:

| Nama | Generik | Kekuatan | Stok |
|------|---------|----------|------|
| Paracetamol | Acetaminophen | 500mg | 1000 |
| Amoxicillin | Amoxicillin | 500mg | 500 |
| Ibuprofen | Ibuprofen | 400mg | 750 |
| Cetirizine | Cetirizine HCl | 10mg | 600 |
| Omeprazole | Omeprazole | 20mg | 400 |
| Metformin | Metformin HCl | 500mg | 800 |
| Amlodipine | Amlodipine Besylate | 5mg | 450 |

---

## 15. Changelog

### Versi Terkini (Desember 2025)
- ✅ Tema Navy Blue diterapkan ke semua halaman
- ✅ Dark mode dinonaktifkan untuk konsistensi
- ✅ Placeholder input diperbaiki
- ✅ Template resep ditambahkan (7 template)
- ✅ Autocomplete pasien dari riwayat
- ✅ Fitur batalkan resep
- ✅ Dashboard statistik lengkap
- ✅ Share QR via WhatsApp
- ✅ Receipt/struk printable
- ✅ Filter riwayat resep (status, tanggal, pencarian)

---

## 17. Kontak & Repository

- **Repository:** https://github.com/Zulfan15/VenMed
- **Branch:** main
- **Owner:** Zulfan15

---

*Dokumen ini di-generate pada: 2 Desember 2025*
