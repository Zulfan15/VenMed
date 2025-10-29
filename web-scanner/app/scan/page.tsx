'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Html5Qrcode } from 'html5-qrcode'
import type { PrescriptionVerification } from '@/lib/supabase'
import { Camera, AlertCircle, Loader2, Home } from 'lucide-react'

export default function ScanPage() {
  const router = useRouter()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)

  // Start scanner on mount and stop on unmount; intentionally ignore hook dependency warnings
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    startScanner()
    return () => {
      stopScanner()
    }
  }, [])

  const startScanner = async () => {
    try {
      setError(null)
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: 250,
          aspectRatio: 1.0
        },
        handleScan,
        () => {} // Ignore scan errors
      )

      setScanning(true)
    } catch (err: unknown) {
      console.error('Scanner start error:', err)
      setError('Gagal memulai kamera. Pastikan Anda telah memberikan izin akses kamera.')
    }
  }

  const stopScanner = () => {
    if (scannerRef.current && scanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear()
        setScanning(false)
      }).catch((err) => {
        console.error('Scanner stop error:', err)
      })
    }
  }

  const handleScan = async (decodedText: string) => {
    if (verifying) return

    try {
      setVerifying(true)
      stopScanner()

      // Call Supabase edge function to verify QR
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify_qr_and_lock`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            token: decodedText,
            action: 'verify' // Just verify first
          })
        }
      )

      const result: PrescriptionVerification = await response.json()

      if (response.ok && result.valid) {
        // Store result and token, then redirect to result page
        sessionStorage.setItem('prescription', JSON.stringify(result))
        sessionStorage.setItem('qr_token', decodedText) // Store the actual QR token
        router.push('/result')
      } else {
        setError(result.error || 'QR Code tidak valid atau sudah digunakan')
        setVerifying(false)
        // Restart scanner after error
        setTimeout(() => {
          setError(null)
          startScanner()
        }, 3000)
      }
    } catch (err: unknown) {
      console.error('Verification error:', err)
      setError('Gagal memverifikasi resep. Silakan coba lagi.')
      setVerifying(false)
      setTimeout(() => {
        setError(null)
        startScanner()
      }, 3000)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          #qr-reader video {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover;
          }
          #qr-reader__dashboard_section_csr {
            display: none !important;
          }
          #qr-reader > div:last-child {
            display: none !important;
          }
        `
      }} />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/">
            <button 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              aria-label="Kembali ke beranda"
            >
              <Home className="w-6 h-6" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Scan QR Code
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Arahkan kamera ke QR Code resep
            </p>
          </div>
        </div>

        {/* Scanner Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 bg-blue-600 text-white">
            <div className="flex items-center justify-center gap-2">
              <Camera className="w-6 h-6" />
              <h2 className="text-xl font-bold">
                {verifying ? 'Memverifikasi...' : 'Scan QR Code Resep'}
              </h2>
            </div>
          </div>

          {/* Camera View */}
          <div className="relative bg-black aspect-square max-w-md mx-auto overflow-hidden">
            <div id="qr-reader" className="w-full h-full [&>div:last-child]:hidden"></div>
            
            {verifying && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Memverifikasi resep...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="m-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="p-6 bg-gray-50 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              Petunjuk Scanning:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Posisikan QR Code di tengah frame kamera</li>
              <li>• Pastikan pencahayaan cukup</li>
              <li>• Jaga kamera tetap stabil</li>
              <li>• QR Code akan terdeteksi secara otomatis</li>
            </ul>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6 text-center">
          <Link href="/">
            <button className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors">
              Kembali ke Beranda
            </button>
          </Link>
        </div>
      </div>
      </div>
    </>
  )
}
