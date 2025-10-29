# Smart Medical Vending Machine - Deployment Guide

## 📋 Prerequisites

- Node.js 20.19+ or 22.12+
- npm atau yarn
- Supabase account
- Supabase CLI (optional, untuk deploy edge functions)

---

## 🗄️ Database Setup

### 1. Buat Supabase Project

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Klik "New Project"
3. Isi nama project, password database, dan region
4. Tunggu project selesai dibuat

### 2. Deploy Database Schema

1. Buka **SQL Editor** di Supabase Dashboard
2. Copy isi file `supabase/schema_final.sql`
3. Paste ke SQL Editor
4. Klik **Run** untuk execute

**Verifikasi:**
- Buka **Table Editor** untuk melihat tabel yang sudah dibuat
- Cek bahwa ada 6 tabel utama: doctors, medicines, prescriptions, prescription_items, qr_tokens, vending_transactions

### 3. Deploy Edge Functions

**Opsi A: Via Dashboard (Recommended untuk pemula)**

1. Buka **Edge Functions** di Supabase Dashboard
2. Klik **Deploy a new function**
3. Buat function bernama `create_prescription`
4. Copy paste isi file `supabase/functions/create_prescription/index.ts`
5. Klik **Deploy function**
6. Ulangi untuk `verify_qr_and_lock`

**Opsi B: Via Supabase CLI**

```bash
# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy functions
cd supabase
supabase functions deploy create_prescription
supabase functions deploy verify_qr_and_lock
```

### 4. Get API Keys

1. Buka **Settings** > **API**
2. Copy:
   - `Project URL` (SUPABASE_URL)
   - `anon public` key (SUPABASE_ANON_KEY)

---

## 🏥 Web Dokter Setup

### 1. Install Dependencies

```bash
cd web-dokter
npm install
```

### 2. Configure Environment

Buat file `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Development

```bash
npm run dev
```

Buka http://localhost:3000

### 4. Build & Deploy

**Deploy ke Vercel:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Atau:
1. Push ke GitHub
2. Import project di [Vercel Dashboard](https://vercel.com/new)
3. Set environment variables di Project Settings
4. Deploy otomatis

---

## 📱 Web Scanner Setup

### 1. Install Dependencies

```bash
cd web-scanner
npm install
```

### 2. Configure Environment

Buat file `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Development

```bash
npm run dev
```

Buka http://localhost:5173

**⚠️ Important:** Untuk testing kamera, gunakan HTTPS atau localhost

### 4. Build & Deploy

```bash
npm run build
```

**Deploy ke Vercel:**

```bash
vercel
```

**Deploy ke Netlify:**

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

---

## 🧪 Testing

### 1. Test Database

```sql
-- Check medicines (tablets only)
SELECT * FROM medicines WHERE is_active = true;

-- Check doctors
SELECT * FROM doctors;
```

### 2. Test Edge Functions

**Test create_prescription:**

```bash
curl -X POST https://your-project.supabase.co/functions/v1/create_prescription \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": "your-doctor-uuid",
    "patient_name": "Test Patient",
    "items": [
      {
        "medicine_id": "medicine-uuid",
        "dosage": "1 tablet",
        "frequency": "3 kali sehari",
        "duration_days": 7,
        "instructions": "Setelah makan"
      }
    ]
  }'
```

**Test verify_qr_and_lock:**

```bash
curl -X POST https://your-project.supabase.co/functions/v1/verify_qr_and_lock \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "RX-...",
    "action": "verify"
  }'
```

### 3. End-to-End Test Flow

1. **Web Dokter:**
   - Buka `/prescription/new`
   - Isi data pasien (opsional)
   - Cari dan tambahkan obat (hanya tablet)
   - Klik "Generate QR Code"
   - Verifikasi QR muncul di `/prescription/qr/[token]`
   - Test print dan download

2. **Web Scanner:**
   - Buka homepage
   - Klik "Mulai Scan QR Code"
   - Izinkan akses kamera
   - Scan QR Code dari Web Dokter
   - Verifikasi data resep muncul dengan benar
   - Klik "Proses & Ambil Obat"
   - Verifikasi status berubah menjadi "dispensed"
   - Coba scan QR yang sama lagi → harus ditolak (sudah digunakan)

---

## 🔒 Security Checklist

- [ ] RLS enabled pada semua tabel
- [ ] Edge functions menggunakan service role key
- [ ] Environment variables tidak di-commit ke git
- [ ] CORS dikonfigurasi dengan benar untuk production
- [ ] QR token one-time use berfungsi
- [ ] Token expiration divalidasi

---

## 🐛 Troubleshooting

### Database Issues

**Problem:** Medicines tidak muncul
- **Solution:** Cek `is_active = true` dan `form = 'tablet'`

**Problem:** RLS policy error
- **Solution:** Pastikan menggunakan service role key di edge functions

### Edge Functions Issues

**Problem:** Function tidak bisa diakses
- **Solution:** Cek CORS headers dan authorization header

**Problem:** Token creation failed
- **Solution:** Cek foreign key constraints (doctor_id, medicine_id)

### Frontend Issues

**Problem:** Kamera tidak bisa diakses di Web Scanner
- **Solution:** 
  - Gunakan HTTPS atau localhost
  - Cek browser permissions
  - Test di mobile device

**Problem:** QR Code tidak bisa di-scan
- **Solution:**
  - Pastikan QR cukup besar (min 200x200px)
  - Cek pencahayaan
  - Pastikan token format benar

---

## 📦 Production Checklist

### Database
- [ ] Schema deployed
- [ ] Sample data added (medicines, doctors)
- [ ] RLS policies active
- [ ] Backup configured

### Edge Functions
- [ ] Both functions deployed
- [ ] Environment variables set
- [ ] Testing passed

### Web Dokter
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Deployed to hosting
- [ ] SSL certificate active
- [ ] Custom domain configured (optional)

### Web Scanner
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Deployed to hosting
- [ ] HTTPS enabled (required for camera)
- [ ] Mobile responsive tested

---

## 📞 Support

Jika mengalami masalah:
1. Cek file `DB.md` untuk tracking perubahan database
2. Review edge function logs di Supabase Dashboard
3. Cek browser console untuk error frontend
4. Test dengan data sample terlebih dahulu

---

## 🚀 Next Steps (Optional)

- [ ] Implement authentication untuk dokter
- [ ] Add payment gateway integration
- [ ] Connect to actual vending machine hardware
- [ ] Add SMS/email notifications
- [ ] Create admin dashboard
- [ ] Add medicine stock management
- [ ] Implement offline mode
- [ ] Add analytics & reporting

---

**Last Updated:** October 25, 2025
