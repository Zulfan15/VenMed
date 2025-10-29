# Database Change Log - Smart Medical Vending Machine

## 🗓️ Date: October 25, 2025

### ✅ Initial Database Schema Created

**File:** `supabase/schema_final.sql`

#### Tables Created:

1. **doctors**
   - Fields: id (UUID), name, license_number (unique), email, phone, timestamps
   - Purpose: Store doctor information
   - RLS: Enabled - doctors can only see their own data

2. **medicines** (TABLET ONLY)
   - Fields: id (UUID), name, generic_name, form (CHECK: must be 'tablet'), strength, manufacturer, stock_quantity, price_per_unit, description, is_active
   - Purpose: Store medicine catalog (only tablets allowed)
   - Constraint: `form = 'tablet'` - ensures only tablets can be stored
   - RLS: Enabled - public read for active medicines, service role can modify

3. **prescriptions**
   - Fields: id (UUID), doctor_id (FK), patient_name (optional), patient_age, patient_gender, diagnosis, notes, status, issued_at, expires_at, dispensed_at
   - Status values: 'issued', 'dispensed', 'expired', 'cancelled'
   - Default expiry: 30 days from issued date
   - RLS: Enabled - doctors can only see their own prescriptions

4. **prescription_items**
   - Fields: id (UUID), prescription_id (FK), medicine_id (FK), dosage, frequency, duration_days, total_quantity (auto-calculated), instructions
   - Purpose: Store individual medicines in a prescription
   - Trigger: `calculate_total_quantity()` - auto-calculates total quantity based on frequency × duration

5. **qr_tokens**
   - Fields: id (UUID), prescription_id (FK), token (unique), is_valid, used_at, expires_at
   - Purpose: One-time use QR codes for prescriptions
   - Security: Token becomes invalid after first use
   - RLS: Enabled - service role only (high security)

6. **vending_transactions**
   - Fields: id (UUID), prescription_id (FK), qr_token_id (FK), status, error_message, dispensed_at
   - Purpose: Track vending machine dispensing transactions
   - Status values: 'pending', 'completed', 'failed'
   - RLS: Enabled - service role only

#### Triggers Created:

- `update_updated_at_column()`: Auto-update `updated_at` timestamp on doctors, medicines, prescriptions
- `calculate_total_quantity()`: Auto-calculate total medicine quantity in prescription_items

#### Views Created:

- `prescription_details`: Combined view of prescriptions with doctor info and item count
- `prescription_items_detailed`: Prescription items with full medicine details

#### Sample Data:

- 2 doctors inserted (Dr. Ahmad Santoso, Dr. Siti Nurhaliza)
- 7 tablet medicines inserted:
  - Paracetamol 500mg
  - Amoxicillin 500mg
  - Ibuprofen 400mg
  - Cetirizine 10mg
  - Omeprazole 20mg
  - Metformin 500mg
  - Vitamin C 1000mg

#### Security Features:

- Row Level Security (RLS) enabled on all tables
- Tablet-only constraint on medicines table
- Service role access for critical operations
- One-time use QR token system

---

## 📡 Edge Functions Deployed

### Function 1: create_prescription
**File:** `supabase/functions/create_prescription/index.ts`

**Purpose:** Create new prescription and generate unique QR token

**Features:**
- Validates doctor existence
- Verifies all medicines are tablets and active
- Creates prescription record
- Inserts prescription items with auto-calculated quantities
- Generates unique QR token format: `RX-{prescription_id}-{timestamp}-{random}`
- Returns prescription details and QR token

**Security:**
- Uses service role key for database operations
- CORS enabled for frontend access
- Foreign key validation

**Request Format:**
```json
{
  "doctor_id": "uuid",
  "patient_name": "string (optional)",
  "patient_age": "number (optional)",
  "patient_gender": "string (optional)",
  "diagnosis": "string (optional)",
  "notes": "string (optional)",
  "items": [
    {
      "medicine_id": "uuid",
      "dosage": "string",
      "frequency": "string",
      "duration_days": "number",
      "instructions": "string (optional)"
    }
  ]
}
```

---

### Function 2: verify_qr_and_lock
**File:** `supabase/functions/verify_qr_and_lock/index.ts`

**Purpose:** Verify QR token and optionally mark as used (dispense)

**Features:**
- Two action modes:
  - `verify`: Only check validity without marking as used
  - `dispense`: Validate, mark as used, reduce stock, create transaction
- Validates token existence and validity
- Checks token expiration
- Verifies prescription status
- Checks medicine stock availability
- Returns full prescription details with medicine list

**Security:**
- One-time use validation (is_valid flag)
- Expiration date enforcement
- Stock validation before dispensing
- Transaction logging

**Request Format:**
```json
{
  "token": "RX-...",
  "action": "verify" | "dispense"
}
```

**Response Format:**
```json
{
  "valid": true,
  "action": "verify|dispense",
  "prescription": {
    "id": "uuid",
    "patient_name": "string",
    "patient_age": "number",
    "diagnosis": "string",
    "doctor": {
      "name": "string",
      "license_number": "string"
    },
    "issued_at": "timestamp",
    "status": "issued|dispensed"
  },
  "items": [
    {
      "medicine": {
        "name": "string",
        "generic_name": "string",
        "strength": "string",
        "form": "tablet"
      },
      "dosage": "string",
      "frequency": "string",
      "duration_days": "number",
      "total_quantity": "number",
      "instructions": "string"
    }
  ],
  "token_info": {
    "expires_at": "timestamp",
    "used_at": "timestamp|null"
  }
}
```

---

## 🎨 Frontend Applications

### Web Dokter (Next.js 15)
**Location:** `web-dokter/`

**Pages Created:**
1. `/` - Homepage with menu
2. `/prescription/new` - Form untuk buat resep baru
3. `/prescription/qr/[token]` - Display QR Code dengan print support
4. `/prescription/history` - Riwayat resep dokter

**Key Features:**
- Form resep digital dengan autocomplete obat
- Real-time medicine search dari database
- Auto-calculate total quantity obat
- Generate QR Code dengan library `react-qr-code`
- Print-friendly QR struk (58mm format support)
- Dark mode support
- Responsive mobile design

**Tech Stack:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Supabase Client
- Lucide Icons
- QR Code React

---

### Web Scanner (React + Vite)
**Location:** `web-scanner/`

**Components Created:**
1. `App.tsx` - Main app with view routing
2. `QRScanner.tsx` - Camera scanner component
3. `PrescriptionDisplay.tsx` - Show prescription details

**Key Features:**
- Camera access untuk scan QR Code
- Real-time QR detection dengan `html5-qrcode`
- Verifikasi token secara otomatis
- Display full prescription details
- Medicine list dengan dosage info
- Dispense action (mark as used)
- Success/error handling
- Mobile-first responsive design

**Tech Stack:**
- React 19
- TypeScript
- Vite
- HTML5 QRCode
- Supabase Client
- Lucide Icons

---

## 🔐 Security Implementation

### Database Level:
- ✅ Row Level Security (RLS) on all tables
- ✅ Foreign key constraints
- ✅ CHECK constraints (tablet-only)
- ✅ Unique constraints on critical fields
- ✅ Index optimization for performance

### Application Level:
- ✅ One-time use QR tokens
- ✅ Token expiration validation (30 days)
- ✅ Stock validation before dispensing
- ✅ Status tracking (issued → dispensed)
- ✅ Transaction logging

### API Level:
- ✅ CORS configuration
- ✅ Bearer token authentication
- ✅ Service role for privileged operations
- ✅ Input validation and sanitization
- ✅ Error handling and logging

---

## 📊 Data Flow Summary

### Prescription Creation Flow:
```
Doctor Form Input
    ↓
Validate Data (Frontend)
    ↓
Call create_prescription Edge Function
    ↓
Validate Doctor & Medicines (Backend)
    ↓
Create Prescription Record
    ↓
Insert Prescription Items (with auto-calc quantity)
    ↓
Generate Unique QR Token
    ↓
Return QR Token + Prescription Details
    ↓
Display QR Code (Frontend)
```

### Prescription Verification Flow:
```
Scan QR Code
    ↓
Extract Token
    ↓
Call verify_qr_and_lock Edge Function (action: verify)
    ↓
Validate Token (exists, not used, not expired)
    ↓
Check Prescription Status
    ↓
Verify Stock Availability
    ↓
Return Prescription Details
    ↓
Display Medicine List (Frontend)
    ↓
User Confirms "Dispense"
    ↓
Call verify_qr_and_lock (action: dispense)
    ↓
Mark Token as Used
    ↓
Update Prescription Status → 'dispensed'
    ↓
Reduce Medicine Stock
    ↓
Create Transaction Record
    ↓
Display Success Message
```

---

## 📝 Notes & Considerations

### Implemented:
- ✅ Complete database schema with RLS
- ✅ Two functional edge functions
- ✅ Web Dokter with full prescription workflow
- ✅ Web Scanner with QR scanning capability
- ✅ One-time use QR security
- ✅ Tablet-only medicine constraint
- ✅ Stock tracking and validation
- ✅ Transaction logging

### Not Yet Implemented (Future):
- ⏳ Doctor authentication system
- ⏳ Payment gateway integration
- ⏳ Hardware vending machine connection
- ⏳ SMS/Email notifications
- ⏳ Admin dashboard
- ⏳ Advanced stock management
- ⏳ Offline mode support
- ⏳ Analytics and reporting

### Known Limitations:
- Dummy doctor ID used in frontend (no real auth yet)
- No payment processing
- No actual vending machine hardware control
- Basic error handling (can be improved)
- No rate limiting on edge functions
- No comprehensive logging system

---

## 🔄 Changelog

### Version 1.0.0 - October 25, 2025
- Initial release
- Complete CRUD operations for prescriptions
- QR-based prescription system
- Frontend applications (Web Dokter & Scanner)
- Basic security implementation
- Documentation (README, DEPLOYMENT, DB)

---

**Database Status:** ✅ Production Ready
**Edge Functions Status:** ✅ Deployed
**Frontend Status:** ✅ Functional
**Overall Status:** ✅ MVP Complete

---

*Last Updated: October 25, 2025*
*Maintained by: Smart Medical Vending Team*
