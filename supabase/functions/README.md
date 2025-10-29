# Supabase Edge Functions

## Functions Overview

### 1. create_prescription
**Endpoint:** `POST /create_prescription`

**Purpose:** Create a new prescription and generate a QR token for it.

**Request Body:**
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
      "dosage": "1 tablet",
      "frequency": "3 times a day",
      "duration_days": 7,
      "instructions": "After meals"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "prescription": {
    "id": "uuid",
    "status": "issued",
    "issued_at": "timestamp",
    "expires_at": "timestamp"
  },
  "qr_token": {
    "token": "RX-...",
    "id": "uuid"
  },
  "items": [...]
}
```

**Validations:**
- Verifies doctor exists
- Verifies all medicines exist and are tablets
- Auto-calculates total quantity
- Generates unique QR token

---

### 2. verify_qr_and_lock
**Endpoint:** `POST /verify_qr_and_lock`

**Purpose:** Verify QR token and optionally mark as used (one-time use).

**Request Body:**
```json
{
  "token": "RX-...",
  "action": "verify" | "dispense"
}
```

**Actions:**
- `verify`: Only checks if token is valid (doesn't mark as used)
- `dispense`: Validates and marks token as used, updates stock

**Response:**
```json
{
  "valid": true,
  "action": "verify|dispense",
  "prescription": {
    "id": "uuid",
    "patient_name": "string",
    "doctor": {...},
    "issued_at": "timestamp",
    "status": "issued|dispensed"
  },
  "items": [
    {
      "medicine": {
        "name": "string",
        "strength": "500mg",
        "form": "tablet"
      },
      "dosage": "1 tablet",
      "frequency": "3 times a day",
      "duration_days": 7,
      "total_quantity": 21,
      "instructions": "After meals"
    }
  ],
  "token_info": {
    "expires_at": "timestamp",
    "used_at": "timestamp|null"
  }
}
```

**Validations:**
- Token exists
- Token not already used
- Token not expired
- Prescription status is 'issued'
- Sufficient stock for all medicines

**Side Effects (when action = 'dispense'):**
- Marks token as `is_valid = false`
- Sets `used_at` timestamp
- Updates prescription status to 'dispensed'
- Reduces medicine stock quantities
- Creates vending transaction record

---

## Deployment

### Deploy to Supabase

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref your-project-ref
```

4. Deploy functions:
```bash
supabase functions deploy create_prescription
supabase functions deploy verify_qr_and_lock
```

### Environment Variables

Set these in Supabase Dashboard > Edge Functions:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (auto-injected)

---

## Testing

### Test create_prescription:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/create_prescription \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": "doctor-uuid",
    "patient_name": "John Doe",
    "items": [
      {
        "medicine_id": "medicine-uuid",
        "dosage": "1 tablet",
        "frequency": "3 times a day",
        "duration_days": 7,
        "instructions": "After meals"
      }
    ]
  }'
```

### Test verify_qr_and_lock:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/verify_qr_and_lock \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "RX-...",
    "action": "verify"
  }'
```

---

## Security Notes

- Both functions use service role key for database access
- CORS enabled for all origins (adjust in production)
- QR tokens are one-time use only
- Token expiration enforced
- RLS policies apply to all operations
