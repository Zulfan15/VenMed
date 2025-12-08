'use client'

import { useEffect, useState, useCallback, useSyncExternalStore } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, CheckCircle, X } from 'lucide-react'

interface Notification {
  id: string
  type: 'dispensed' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

interface PrescriptionPayload {
  new: {
    id: string
    patient_name: string
    status: string
    doctor_id: string
  }
  old: {
    id: string
    status: string
  }
}

// Custom hook to safely read from localStorage
function useLocalStorageDoctor() {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('storage', callback)
    return () => window.removeEventListener('storage', callback)
  }, [])

  const getSnapshot = useCallback(() => {
    const storedDoctor = localStorage.getItem('doctor')
    if (!storedDoctor) return null
    try {
      const doctor = JSON.parse(storedDoctor)
      return doctor.id as string
    } catch {
      return null
    }
  }, [])

  const getServerSnapshot = useCallback(() => null, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const doctorId = useLocalStorageDoctor()

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3
      
      oscillator.start()
      setTimeout(() => {
        oscillator.stop()
        audioContext.close()
      }, 200)
    } catch (error) {
      console.log('Could not play notification sound:', error)
    }
  }, [])

  // Add notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    }
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 10)) // Keep only last 10
    playNotificationSound()
    
    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      })
    }
  }, [playNotificationSound])

  // Subscribe to prescription changes
  useEffect(() => {
    if (!doctorId) return

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Subscribe to realtime changes
    const channel = supabase
      .channel('prescription-updates')
      .on<PrescriptionPayload['new']>(
        'postgres_changes' as const,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'prescriptions',
          filter: `doctor_id=eq.${doctorId}`
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          // Check if status changed to dispensed
          if (payload.new?.status === 'dispensed' && payload.old?.status !== 'dispensed') {
            addNotification({
              type: 'dispensed',
              title: '✅ Obat Sudah Diambil!',
              message: `Pasien ${payload.new.patient_name || 'Anonim'} telah mengambil obat dari vending machine.`
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [doctorId, addNotification])

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  // Clear all notifications
  const clearAll = () => {
    setNotifications([])
  }

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <>
      {children}
      
      {/* Notification Bell - Fixed Position */}
      {doctorId && (
        <div className="fixed bottom-6 right-6 z-50">
          {/* Notification Panel */}
          {showNotifications && (
            <div className="absolute bottom-16 right-0 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-2">
              <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notifikasi</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-xs text-gray-500 hover:text-red-500"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Belum ada notifikasi</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      onClick={() => markAsRead(notification.id)}
                      className={`p-4 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer transition-colors ${
                        notification.read 
                          ? 'bg-white dark:bg-gray-800' 
                          : 'bg-blue-50 dark:bg-blue-900/20'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          notification.type === 'dispensed' 
                            ? 'bg-green-100 dark:bg-green-900/30' 
                            : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          <CheckCircle className={`w-4 h-4 ${
                            notification.type === 'dispensed' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-blue-600 dark:text-blue-400'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {notification.timestamp.toLocaleTimeString('id-ID', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Notification Bell Button */}
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-4 rounded-full shadow-lg transition-all ${
              showNotifications 
                ? 'bg-blue-600 text-white' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {showNotifications ? (
              <X className="w-6 h-6" />
            ) : (
              <Bell className="w-6 h-6" />
            )}
            
            {/* Badge */}
            {unreadCount > 0 && !showNotifications && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}
    </>
  )
}
