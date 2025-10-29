# Smart Medical Vending Machine

> **Sistem resep digital terintegrasi dengan vending machine untuk dispensing obat otomatis**

![Status](https://img.shields.io/badge/status-ready-green)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![Supabase](https://img.shields.io/badge/Supabase-Backend-green)

---

## 📋 Overview

Smart Medical Vending Machine adalah sistem digitalisasi resep medis yang memungkinkan:
- **Dokter** menulis resep digital dan generate QR Code
- **Pasien** scan QR Code di vending machine untuk ambil obat otomatis
- **Sistem** memvalidasi resep, track penggunaan, dan manage stok obat

### ✨ Key Features

#### Web Dokter
- 📝 Form resep digital dengan autocomplete obat
- 💊 Database obat tablet only (compliance dengan vending machine)
- 🔢 Auto-calculate total quantity obat
- 📱 Generate QR Code resep
- 🖨️ Print struk format 58mm (thermal printer compatible)
- 📊 Riwayat resep dokter

#### Web Scanner (Vending Machine)
- 📷 QR Code scanner via kamera device
- ✅ Real-time validation resep
- 🔒 One-time use QR token (keamanan)
- 📦 Display daftar obat yang akan dikeluarkan
- 💳 Payment integration ready
- 🤖 Vending machine trigger ready

#### Backend (Supabase)
- 🗄️ PostgreSQL database dengan RLS
- ⚡ Edge Functions untuk API
- 🔐 Token-based security
- 📊 Transaction tracking
- 💉 Tablet-only medicine validation

---

## 🏗️ Architecture

```
┌─────────────────┐
│   Web Dokter    │ (Next.js 15)
│  Doctor Portal  │
└────────┬────────┘
         │
         │ Create Prescription
         ▼
┌─────────────────────────────┐
│   Supabase Backend          │
│  ├─ PostgreSQL Database     │
│  ├─ Edge Functions          │
│  │   ├─ create_prescription │
│  │   └─ verify_qr_and_lock  │
│  └─ Row Level Security      │
└────────┬────────────────────┘
         │
         │ Verify & Dispense
         ▼
┌─────────────────┐
│  Web Scanner    │ (React + Vite)
│  Vending UI     │
└─────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20.19+ or 22.12+
- Supabase account
- npm or yarn

### 1. Clone & Setup

```bash
# Clone repository
git clone <repo-url>
cd KP

# Setup database
# Copy supabase/schema_final.sql to Supabase SQL Editor and run
```

### 2. Web Dokter Setup

```bash
cd web-dokter
npm install

# Create .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your-url" > .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key" >> .env.local

# Run dev server
npm run dev
# Open http://localhost:3000
```

### 3. Web Scanner Setup

```bash
cd web-scanner
npm install

# Create .env
echo "VITE_SUPABASE_URL=your-url" > .env
echo "VITE_SUPABASE_ANON_KEY=your-key" >> .env

# Run dev server
npm run dev
# Open http://localhost:5173
```

### 4. Deploy Edge Functions

```bash
# Via Supabase Dashboard or CLI
supabase functions deploy create_prescription
supabase functions deploy verify_qr_and_lock
```

📚 **Detailed setup guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 📁 Project Structure

```
KP/
├── supabase/
│   ├── schema_final.sql              # Database schema
│   └── functions/
│       ├── create_prescription/       # API untuk buat resep
│       └── verify_qr_and_lock/        # API untuk verifikasi QR
│
├── web-dokter/                        # Next.js App - Doctor Portal
│   ├── app/
│   │   ├── page.tsx                   # Homepage
│   │   └── prescription/
│   │       ├── new/                   # Form resep baru
│   │       ├── qr/[token]/            # Display QR Code
│   │       └── history/               # Riwayat resep
│   └── lib/
│       ├── supabase.ts                # Supabase client
│       └── medicines.ts               # Medicine API calls
│
├── web-scanner/                       # React App - Vending Scanner
│   ├── src/
│   │   ├── App.tsx                    # Main app
│   │   ├── components/
│   │   │   ├── QRScanner.tsx          # QR scanner component
│   │   │   └── PrescriptionDisplay.tsx # Show prescription
│   │   └── lib/
│   │       └── supabase.ts            # Supabase client
│   └── package.json
│
├── DB.md                              # Database change log
├── KP.md                              # Project requirements (original)
├── DEPLOYMENT.md                      # Deployment guide
└── README.md                          # This file
```

---

## 🗄️ Database Schema

### Core Tables

- **`doctors`** - Data dokter penulis resep
- **`medicines`** - Katalog obat (tablet only)
- **`prescriptions`** - Resep digital
- **`prescription_items`** - Detail obat per resep
- **`qr_tokens`** - QR code tokens (one-time use)
- **`vending_transactions`** - Log transaksi vending

### Security Features

- ✅ Row Level Security (RLS) enabled
- ✅ Tablet-only constraint on medicines
- ✅ One-time use QR tokens
- ✅ Auto-expire after 30 days
- ✅ Service role access for critical ops

---

## 🎯 User Flow

### Doctor Flow
1. Login ke Web Dokter
2. Klik "Buat Resep Baru"
3. Isi data pasien (optional)
4. Cari & pilih obat (autocomplete, tablet only)
5. Isi dosis, frekuensi, durasi
6. Klik "Generate QR Code"
7. QR Code muncul di layar
8. Print atau kirim ke pasien

### Patient Flow
1. Terima QR Code dari dokter
2. Datang ke vending machine
3. Buka web scanner atau scan langsung
4. QR Code divalidasi
5. Lihat daftar obat
6. Lakukan pembayaran (optional)
7. Ambil obat yang keluar dari mesin

---

## 🔧 API Endpoints

### Create Prescription
```http
POST /functions/v1/create_prescription
Content-Type: application/json
Authorization: Bearer {ANON_KEY}

{
  "doctor_id": "uuid",
  "patient_name": "John Doe",
  "items": [{
    "medicine_id": "uuid",
    "dosage": "1 tablet",
    "frequency": "3 kali sehari",
    "duration_days": 7,
    "instructions": "Setelah makan"
  }]
}
```

### Verify QR
```http
POST /functions/v1/verify_qr_and_lock
Content-Type: application/json
Authorization: Bearer {ANON_KEY}

{
  "token": "RX-...",
  "action": "verify" | "dispense"
}
```

---

## 🎨 Design System

### Colors
- **Primary:** Blue Medical `#007AFF`
- **Success:** Green `#10B981`
- **Warning:** Yellow `#F59E0B`
- **Error:** Red `#EF4444`

### Typography
- **Font:** Inter / Nunito Sans
- **Sizes:** 
  - Heading: 24px - 36px
  - Body: 14px - 16px
  - Small: 12px - 14px

### Components
- Card-based UI
- Rounded corners (8px - 16px)
- Soft shadows
- Touch-friendly buttons (min 44px height)
- Dark mode support

---

## 🧪 Testing

### Unit Tests
```bash
# Web Dokter
cd web-dokter
npm test

# Web Scanner
cd web-scanner
npm test
```

### E2E Testing Flow
1. Create prescription via Web Dokter
2. Get QR token from response
3. Verify QR via Web Scanner
4. Check prescription status = 'dispensed'
5. Try scan same QR again → should fail

---

## 🚀 Deployment

### Production URLs
- **Web Dokter:** https://your-dokter.vercel.app
- **Web Scanner:** https://your-scanner.vercel.app
- **Supabase:** https://your-project.supabase.co

### Environment Variables

**Web Dokter:**
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**Web Scanner:**
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## 📊 Features Roadmap

### Phase 1 (Current) ✅
- [x] Database schema dengan RLS
- [x] Edge functions (create & verify)
- [x] Web Dokter UI
- [x] Web Scanner UI
- [x] QR Code generation
- [x] Basic validation

### Phase 2 (Next)
- [ ] Doctor authentication
- [ ] Payment integration (QRIS)
- [ ] Medicine stock management
- [ ] Admin dashboard
- [ ] Notifications (SMS/Email)

### Phase 3 (Future)
- [ ] Hardware integration (actual vending machine)
- [ ] Offline mode support
- [ ] Advanced analytics
- [ ] Multi-location support
- [ ] Insurance integration

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

## 📝 License

MIT License - feel free to use for personal or commercial projects

---

## 📞 Support

- **Documentation:** See `DEPLOYMENT.md` and `DB.md`
- **Issues:** Open GitHub issue
- **Email:** [your-email]

---

## 👥 Team

- **Full Stack Developer:** [Your Name]
- **Database Design:** [Your Name]
- **UI/UX Design:** [Your Name]

---

## 🙏 Acknowledgments

- Next.js Team
- Supabase Team
- React Community
- Vite Team

---

**Built with ❤️ using Next.js, React, and Supabase**

Last Updated: October 25, 2025
