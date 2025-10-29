AI Agent Role

Bertindak sebagai full-stack product designer (UI/UX + Frontend + Supabase Developer).
Tugas Anda adalah merancang, membangun, dan mengintegrasikan dua aplikasi web dalam sistem Smart Medical Vending Machine, yaitu:

Web Dokter – untuk membuat resep digital dan menghasilkan QR Code resep.

Web Scanner (Vending) – untuk membaca QR Code resep dan menampilkan daftar obat yang akan dikeluarkan mesin.

Kedua aplikasi harus menggunakan Supabase (database + edge functions) sebagai backend utama dan menekankan keamanan data medis, kemudahan penggunaan, serta tampilan profesional.

🎯 Target Users & Needs
Target Pengguna

Dokter / Klinik / Rumah Sakit – menulis resep digital.

Pasien – menerima QR resep untuk menebus obat otomatis.

Petugas Apotek / Vending Machine Operator – mengelola stok obat.

Kebutuhan

Dokter dapat menulis resep dengan tampilan mirip kertas resep asli.

Sistem dapat menghasilkan QR Code unik untuk setiap resep.

QR Code dapat dipindai di vending machine untuk menebus obat.

Database tersentralisasi dan aman (Supabase dengan RLS).

Proses mudah, cepat, dan dapat dioperasikan offline sementara.

Masalah yang Diselesaikan

Resep manual rawan hilang atau salah baca.

Antrean di apotek/klinik terlalu panjang.

Data resep tidak tersinkronisasi antar sistem.

Pasien kesulitan membeli obat yang diresepkan tanpa antre.

🎯 Project Objective

Membangun dua website fungsional berbasis Next.js 15 + Supabase,
dengan fokus pada:

Digitalisasi resep dokter (input → generate QR Code).

Pemindaian resep via QR untuk menebus obat secara otomatis.

Keamanan dan integritas data resep (token QR sekali pakai, validasi tanggal).

UI/UX intuitif dan desain profesional dengan tema terang/gelap.

🎨 Core Aesthetics & Branding
Elemen	Deskripsi
Tema	Light mode (utama) dan Dark mode (opsional).
Warna utama	Biru medis (#007AFF), putih, abu lembut.
Tipografi	“Inter” atau “Nunito Sans” — modern dan mudah dibaca.
Aksen visual	Ikon minimalis (Lucide / Heroicons), elemen seperti struk & kartu pasien.
Gaya UI	Clean, klinis, mudah dioperasikan di layar sentuh.
Tone desain	Profesional, aman, terpercaya, human-centered.
⚙️ Functional Requirements
1. Web Dokter

Autentikasi Dokter (opsional: Supabase Auth / login sederhana).

Form “Lembar Resep” Digital:

Nama pasien (opsional, boleh anonim).

Nama obat (autocomplete dari tabel medicines).

Dosis per minum (mg), frekuensi per hari, durasi (hari).

Instruksi (sebelum/sesudah makan).

Validasi otomatis:

Hitung total qty obat.

Hanya obat berbentuk tablet yang bisa dipilih.

Generate Resep + QR Code:

Mengirim data ke Edge Function create_prescription.

Menampilkan & mencetak QR Code struk (58mm format).

Riwayat Resep Dokter (opsional).

2. Web Scanner (Vending)

Akses kamera device (getUserMedia API).

Scan QR Code resep → kirim ke Edge Function verify_qr_and_lock.

Validasi QR Token:

Belum kadaluarsa.

Belum digunakan (once-only).

Status resep “issued”.

Tampilkan Ringkasan Obat:

Nama, dosis, jumlah, instruksi.

Tombol “Proses / Bayar” (opsional):

Menandai QR token sebagai “used”.

(Tahap lanjut → integrasi pembayaran & motor dispenser).

🧩 System Integration (Supabase)

Database:
Menggunakan schema final schema_final.sql:

Tabel utama: medicines, doctors, prescriptions, prescription_items, qr_tokens.

Hanya obat tablet yang valid.

RLS aktif untuk keamanan data medis.

Edge Functions:

create_prescription → buat resep & QR token.

verify_qr_and_lock → verifikasi & tandai token sekali pakai.

Autentikasi:

Supabase Auth (dokter login) atau mode dummy untuk prototipe.

🧭 User Flow & Experience
Web Dokter

Dokter login → halaman resep digital.

Isi form obat (nama, dosis, durasi).

Klik “Generate QR Code” → resep tersimpan & QR ditampilkan.

Klik “Print Struk” → cetak di printer thermal 58mm.

Pasien menerima struk QR.

Web Scanner

Pasien buka web scanner → kamera aktif otomatis.

Arahkan QR Code ke kamera → sistem membaca & verifikasi token.

Tampilkan daftar obat dari resep.

Jika valid → tampilkan status “Resep Siap Diambil”.

Token otomatis invalid (sekali pakai).

🧱 Deliverables
Komponen	Deskripsi
Database (Supabase)	Struktur schema_final.sql (tablet-only).
Edge Functions	create_prescription, verify_qr_and_lock.
Frontend Web Dokter	Next.js 15 + Tailwind: form resep + generator QR + print.
Frontend Web Scanner	React/Vite PWA: kamera + QR verification.
UI Assets	Wireframe ringan + gaya klinis (white-blue).
Dokumentasi	Petunjuk koneksi Supabase, env vars, dan deployment.
🧠 Constraints

Stack wajib:
Next.js 15 / React, TypeScript, Tailwind CSS, Supabase.

Mode utama: Mobile-friendly & touchscreen-compatible.

Database: hanya menerima data obat berbentuk tablet.

Keamanan:

Token QR satu kali pakai (used_at & is_valid).

Data pasien minimal / anonim (untuk riset non-komersial).

Deployment:

Dapat dijalankan di Vercel (frontend) + Supabase (backend).

Offline Mode (opsional): cache hasil scan sementara.

🔧 Ekstra (Opsional untuk Versi Lanjut)

Modul stok vending & sinkronisasi kuantitas.

Integrasi pembayaran QRIS (sandbox).

Sistem notifikasi web untuk status pengambilan obat.

Dashboard monitoring resep & vending status.

Setiap perubahan untuk data base pada supabase tolong catat dalam file DB.md