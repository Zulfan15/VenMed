# Troubleshooting: Failed to fetch

## Error yang Muncul
```
TypeError: Failed to fetch
```

## Kemungkinan Penyebab & Solusi

### 1. Edge Function Belum Di-deploy
**Cek:**
```bash
cd ../supabase
supabase functions list
```

**Deploy edge function:**
```bash
supabase functions deploy verify_qr_and_lock
```

### 2. CORS Configuration
Edge function mungkin perlu CORS headers. Pastikan di `verify_qr_and_lock/index.ts` ada:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Tambahkan di response
return new Response(
  JSON.stringify(result),
  { 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200 
  }
)
```

### 3. Environment Variables
**Cek apakah env vars terdefinisi:**
- Buka browser console
- Jalankan scanner
- Lihat console log untuk:
  ```
  Calling: https://hrypuojesxtauasqgbbe.supabase.co/functions/v1/verify_qr_and_lock
  ```

**Jika undefined, cek `.env.local`:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://hrypuojesxtauasqgbbe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

**Restart dev server setelah update .env:**
```bash
npm run dev
```

### 4. Network/Internet Connection
- Pastikan internet stabil
- Cek firewall tidak blocking request ke supabase.co
- Test dengan curl:
```bash
curl -X POST \
  https://hrypuojesxtauasqgbbe.supabase.co/functions/v1/verify_qr_and_lock \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"token":"test","action":"verify"}'
```

### 5. Browser Console Debugging
1. Buka Developer Tools (F12)
2. Buka tab **Console**
3. Scan QR Code
4. Lihat output:
   - `Verifying QR token: ...` ✅
   - `Calling: https://...` ✅
   - `HTTP Error: ...` ❌ (jika ada error)

### 6. Network Tab Debugging
1. Buka Developer Tools (F12)
2. Buka tab **Network**
3. Filter: `verify_qr_and_lock`
4. Scan QR Code
5. Lihat request:
   - Status: 200 ✅
   - Status: 404 ❌ (Edge function tidak ada)
   - Status: 500 ❌ (Error di edge function)
   - Failed/CORS ❌ (Network/CORS issue)

## Quick Fix Checklist
- [ ] Edge function sudah di-deploy?
- [ ] File `.env.local` ada dan valid?
- [ ] Dev server sudah restart setelah update .env?
- [ ] Internet connection stabil?
- [ ] Browser console menampilkan URL yang benar?
- [ ] CORS headers sudah ditambahkan di edge function?

## Kontak
Jika masih error, capture:
1. Screenshot browser console
2. Screenshot Network tab
3. Output dari `supabase functions list`
