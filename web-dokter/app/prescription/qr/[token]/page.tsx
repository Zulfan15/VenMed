'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import { ArrowLeft, Printer, Download, CheckCircle2, Share2 } from 'lucide-react'

interface PrescriptionData {
  id: string
  patient_name: string
  diagnosis?: string
  status: string
}

export default function QRPage() {
  const params = useParams()
  const token = params.token as string
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null)

  useEffect(() => {
    // In real app, fetch prescription details from Supabase
    // For now, just display the QR code
  }, [token])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    const svg = document.getElementById('qr-code')
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        const pngFile = canvas.toDataURL('image/png')
        
        const downloadLink = document.createElement('a')
        downloadLink.download = `resep-${token.substring(0, 8)}.png`
        downloadLink.href = pngFile
        downloadLink.click()
      }
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    }
  }

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `🏥 *Resep Digital VenMed*\n\n` +
      `Halo, berikut adalah resep digital Anda.\n\n` +
      `📋 *Token Resep:*\n${token}\n\n` +
      `📱 *Cara Pengambilan Obat:*\n` +
      `1. Kunjungi vending machine VenMed\n` +
      `2. Buka link scanner atau scan QR di mesin\n` +
      `3. Masukkan token atau scan QR Code\n` +
      `4. Lakukan pembayaran\n` +
      `5. Ambil obat Anda\n\n` +
      `⚠️ QR Code hanya berlaku 1x penggunaan dan 30 hari.\n\n` +
      `🔗 Link Scanner: ${window.location.origin.replace('3000', '3002')}/scan`
    )
    
    window.open(`https://wa.me/?text=${message}`, '_blank')
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header - Hidden when printing */}
        <div className="mb-6 flex items-center gap-4 print:hidden">
          <Link href="/dashboard" aria-label="Kembali">
            <button title="Kembali" aria-label="Kembali" className="p-2 hover:bg-slate-200 rounded-lg text-slate-600">
              <ArrowLeft className="w-6 h-6" />
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Resep Berhasil Dibuat
            </h1>
            <p className="text-slate-600">
              QR Code siap untuk dicetak atau diunduh
            </p>
          </div>
        </div>

        {/* Success Message */}
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 print:hidden">
          <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900">
              Resep berhasil dibuat!
            </h3>
            <p className="text-sm text-green-700">
              QR Code telah digenerate. Berikan kepada pasien untuk scan di vending machine.
            </p>
          </div>
        </div>

        {/* QR Code Card - Print Area */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 print:shadow-none print:p-4">
          {/* Clinic Header */}
          <div className="text-center mb-6 border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-bold text-slate-800">
              SMART MEDICAL VENDING
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Resep Digital Elektronik
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100">
              <QRCode
                id="qr-code"
                value={token}
                size={256}
                level="H"
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm font-mono bg-slate-100 px-4 py-2 rounded-lg text-slate-700 break-all">
                {token}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Token Resep
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              Instruksi untuk Pasien:
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Bawa QR Code ini ke lokasi vending machine</li>
              <li>Buka web scanner atau scan langsung di mesin</li>
              <li>Arahkan QR Code ke kamera scanner</li>
              <li>Tunggu validasi dan proses pembayaran</li>
              <li>Ambil obat yang keluar dari mesin</li>
            </ol>
          </div>

          {/* Important Notes */}
          <div className="mt-4 text-xs text-slate-500 space-y-1">
            <p>⚠️ QR Code ini hanya dapat digunakan satu kali</p>
            <p>⚠️ Berlaku selama 30 hari sejak tanggal terbit</p>
            <p>⚠️ Jangan berikan QR Code ini kepada orang lain</p>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-500">
            <p>Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
            <p className="mt-1">Dokumen resmi Smart Medical Vending Machine</p>
          </div>
        </div>

        {/* Action Buttons - Hidden when printing */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
          >
            <Printer className="w-5 h-5" />
            Print
          </button>
          
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Download
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            WhatsApp
          </button>

          <Link href="/prescription/new" className="w-full">
            <button className="w-full px-4 py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors">
              Resep Baru
            </button>
          </Link>
        </div>

        {/* Back to Home */}
        <div className="mt-4 text-center print:hidden">
          <Link href="/dashboard" className="text-blue-900 hover:underline">
            Kembali ke Dashboard
          </Link>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:p-4 {
            padding: 1rem !important;
          }
        }
      `}</style>
    </div>
  )
}
