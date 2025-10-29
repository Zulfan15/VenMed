import Link from 'next/link'
import { Scan, QrCode } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-full mb-4">
            <Scan className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Smart Medical Vending
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Scanner Resep Digital
          </p>
        </header>

        {/* Main Action */}
        <div className="max-w-md mx-auto">
          <Link href="/scan">
            <button className="w-full bg-blue-600 text-white px-8 py-6 rounded-2xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg flex items-center justify-center gap-3 mb-8">
              <QrCode className="w-8 h-8" />
              Mulai Scan QR Code
            </button>
          </Link>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              📱 Cara Penggunaan:
            </h3>
            <ol className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
              <li>1. Pastikan QR Code resep sudah siap</li>
              <li>2. Klik tombol &quot;Mulai Scan QR Code&quot;</li>
              <li>3. Izinkan akses kamera jika diminta</li>
              <li>4. Arahkan kamera ke QR Code resep</li>
              <li>5. Sistem akan memvalidasi resep secara otomatis</li>
              <li>6. Ikuti instruksi untuk mengambil obat</li>
            </ol>
          </div>

          {/* Info */}
          <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            <p>⚠️ Pastikan koneksi internet stabil</p>
            <p>🔒 QR Code hanya dapat digunakan sekali</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 text-gray-500 dark:text-gray-400">
          <p>© 2025 Smart Medical Vending Machine</p>
          <p className="text-sm mt-1">Powered by Supabase & Next.js</p>
        </footer>
      </div>
    </div>
  )
}
