'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, User, Calendar, Clock, Pill, Printer, Download, Home, FileText } from 'lucide-react'

interface ReceiptItem {
  medicine_name: string
  generic_name: string
  strength: string
  dosage: string
  frequency: string
  duration_days: number
  total_quantity: number
  instructions: string
}

interface ReceiptData {
  prescription_id: string
  patient_name: string
  doctor_name: string
  doctor_license: string
  issued_at: string
  dispensed_at: string
  items: ReceiptItem[]
  diagnosis?: string
}

export default function ReceiptPage() {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [receipt, setReceipt] = useState<ReceiptData | null>(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('receipt')
      return stored ? JSON.parse(stored) : null
    }
    return null
  })

  useEffect(() => {
    if (!receipt) {
      router.push('/')
    }
  }, [receipt, router])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    window.print()
  }

  const handleNewScan = () => {
    sessionStorage.removeItem('receipt')
    router.push('/scan')
  }

  if (!receipt) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              background: white !important;
            }
            .print-hidden {
              display: none !important;
            }
            .print-content {
              box-shadow: none !important;
              border-radius: 0 !important;
              margin: 0 !important;
              padding: 20px !important;
              max-width: 100% !important;
              background: white !important;
              color: black !important;
            }
            .print-page {
              background: white !important;
              padding: 0 !important;
              margin: 0 !important;
              min-height: auto !important;
            }
            .bg-blue-600 {
              background-color: #2563eb !important;
              color: white !important;
            }
            .bg-gray-50, .bg-gray-900 {
              background-color: #f9fafb !important;
              color: black !important;
            }
            .bg-amber-50 {
              background-color: #fffbeb !important;
            }
            .text-gray-900, .dark\\:text-white {
              color: black !important;
            }
            .text-gray-600, .dark\\:text-gray-400 {
              color: #4b5563 !important;
            }
          }
          @page {
            margin: 1cm;
            size: auto;
          }
        `
      }} />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 print-page">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Success Header - Hidden when printing */}
          <div className="mb-6 text-center print-hidden">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Obat Berhasil Dikeluarkan!
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Struk pembelian Anda
            </p>
          </div>

          {/* Receipt Card - Print Area */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6 print-content">
            {/* Header */}
            <div className="bg-blue-600 text-white p-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-3">
                <FileText className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold mb-1">STRUK PEMBELIAN OBAT</h2>
              <p className="text-blue-100">Smart Medical Vending Machine</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">No. Resep</p>
                  <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    #{receipt.prescription_id.substring(0, 8).toUpperCase()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tanggal & Waktu</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {new Date(receipt.dispensed_at).toLocaleString('id-ID', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Patient & Doctor Info */}
              <div className="grid md:grid-cols-2 gap-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                {/* Patient */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pasien</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {receipt.patient_name || 'Anonim'}
                  </p>
                  {receipt.diagnosis && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Diagnosis: {receipt.diagnosis}
                    </p>
                  )}
                </div>

                {/* Doctor */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Dokter</h3>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{receipt.doctor_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    SIP: {receipt.doctor_license}
                  </p>
                </div>
              </div>

              {/* Medicine Items */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Pill className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Daftar Obat</h3>
                </div>
                
                <div className="space-y-4">
                  {receipt.items.map((item, index) => (
                    <div 
                      key={index}
                      className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {index + 1}. {item.medicine_name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.generic_name} - {item.strength}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm font-semibold">
                            {item.total_quantity} tablet
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-1 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Dosis:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{item.dosage}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Frekuensi:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{item.frequency}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Durasi:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{item.duration_days} hari</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Aturan:</span>
                            <span className="ml-2 text-gray-900 dark:text-white">{item.instructions}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="pt-4 border-t-2 border-gray-300 dark:border-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    Total Obat
                  </span>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {receipt.items.reduce((sum, item) => sum + item.total_quantity, 0)} tablet
                  </span>
                </div>
              </div>

              {/* Important Notes */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  ⚠️ Perhatian Penting:
                </h4>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                  <li>• Konsumsi obat sesuai dosis dan aturan yang tertera</li>
                  <li>• Simpan obat di tempat kering dan sejuk</li>
                  <li>• Jauhkan dari jangkauan anak-anak</li>
                  <li>• Konsultasikan dengan dokter jika terjadi efek samping</li>
                  <li>• Simpan struk ini sebagai bukti pengambilan obat</li>
                </ul>
              </div>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Terima kasih telah menggunakan Smart Medical Vending Machine
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Struk ini dicetak pada: {new Date().toLocaleString('id-ID')}
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-400">
                    Resep dikeluarkan: {new Date(receipt.issued_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Hidden when printing */}
          <div className="grid grid-cols-3 gap-4 mb-6 print-hidden">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Print
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Simpan
            </button>

            <button
              onClick={handleNewScan}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              Scan Baru
            </button>
          </div>

          {/* Back to Home */}
          <div className="text-center print-hidden">
            <Link href="/" className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
              <Home className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
