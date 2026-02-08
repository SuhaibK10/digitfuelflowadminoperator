'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, FuelToken } from '@/lib/supabase'
import { formatCurrency, formatQuantity, getTimeRemaining, isExpired, formatDateTime } from '@/lib/utils'
import { QrCode, Camera, X, CheckCircle, XCircle, Fuel, User, Car, Clock, LogOut, History } from 'lucide-react'
import Link from 'next/link'

export default function ScanPage() {
  const [user, setUser] = useState<any>(null)
  const [scanning, setScanning] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [token, setToken] = useState<FuelToken | null>(null)
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [processing, setProcessing] = useState(false)
  const scannerRef = useRef<any>(null)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const userData = localStorage.getItem('operator_user')
    if (!userData) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(userData))
  }, [router])

  async function startScanner() {
    setScanning(true)
    setResult(null)
    setToken(null)

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode('qr-reader')
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => { handleScan(text); stopScanner() },
        () => {}
      )
    } catch (err) {
      setResult({ type: 'error', message: 'Camera not available' })
      setScanning(false)
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop() } catch {}
      scannerRef.current = null
    }
    setScanning(false)
  }

  async function handleScan(code: string) {
    setProcessing(true)
    setResult(null)

    const { data, error } = await supabase
      .from('fuel_tokens')
      .select('*, fuel_types (*), token_orders (*)')
      .eq('token_code', code.trim())
      .single()

    if (error || !data) {
      setResult({ type: 'error', message: '❌ Token not found' })
      setProcessing(false)
      return
    }

    setToken(data)

    if (data.status === 'used') {
      setResult({ type: 'error', message: `Already used at ${formatDateTime(data.used_at!)}` })
    } else if (data.status === 'expired' || isExpired(data.expires_at)) {
      setResult({ type: 'error', message: '⏰ Token has expired' })
    } else if (data.status === 'cancelled') {
      setResult({ type: 'error', message: '🚫 Token was cancelled' })
    } else {
      setResult({ type: 'success', message: '✅ Token verified!' })
    }
    setProcessing(false)
  }

  async function dispenseFuel() {
    if (!token) return
    setProcessing(true)

    const { error } = await supabase
      .from('fuel_tokens')
      .update({ status: 'used', used_at: new Date().toISOString(), used_by: user?.id })
      .eq('id', token.id)

    if (!error) {
      await supabase.from('scan_logs').insert({
        token_id: token.id, scanned_by: user?.id, scan_result: 'success'
      })
      setResult({ type: 'success', message: '🎉 Fuel dispensed successfully!' })
      setToken({ ...token, status: 'used', used_at: new Date().toISOString() })
    }
    setProcessing(false)
  }

  function reset() {
    setToken(null)
    setResult(null)
    setManualCode('')
  }

  function logout() {
    localStorage.removeItem('operator_user')
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Fuel className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800">AMU CAW Petrol Pump</p>
              <p className="text-xs text-gray-500">{user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/history" className="p-2 hover:bg-gray-100 rounded-lg">
              <History className="w-5 h-5 text-gray-600" />
            </Link>
            <button onClick={logout} className="p-2 hover:bg-gray-100 rounded-lg">
              <LogOut className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {/* Scanner Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
          <h2 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary-500" />
            Scan Token QR
          </h2>

          {scanning ? (
            <div className="relative">
              <div id="qr-reader" className="rounded-xl overflow-hidden"></div>
              <button onClick={stopScanner} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : token ? (
            <div className="space-y-4">
              {/* Result Banner */}
              <div className={`p-4 rounded-xl ${result?.type === 'success' && token.status === 'paid' ? 'bg-green-100' : 'bg-red-100'}`}>
                <p className={`font-bold ${result?.type === 'success' && token.status === 'paid' ? 'text-green-800' : 'text-red-800'}`}>
                  {result?.message}
                </p>
              </div>

              {/* Token Info */}
              <div className="border-2 border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Token</span>
                  <span className="font-mono font-bold">{token.token_code}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Fuel</span>
                  <span className="font-bold flex items-center gap-2">
                    <Fuel className={`w-4 h-4 ${token.fuel_types?.code === 'PET' ? 'text-orange-500' : 'text-green-500'}`} />
                    {token.fuel_types?.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quantity</span>
                  <span className="font-bold text-xl">{formatQuantity(token.quantity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold text-xl text-green-600">{formatCurrency(token.amount)}</span>
                </div>
                <hr />
                <div className="flex justify-between items-center">
                  <span className="text-gray-500"><User className="w-4 h-4 inline mr-1" />Customer</span>
                  <span className="font-semibold">{token.token_orders?.customer_name}</span>
                </div>
                {token.token_orders?.vehicle_number && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500"><Car className="w-4 h-4 inline mr-1" />Vehicle</span>
                    <span className="font-mono font-semibold">{token.token_orders.vehicle_number}</span>
                  </div>
                )}
                {token.status === 'paid' && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500"><Clock className="w-4 h-4 inline mr-1" />Expires</span>
                    <span className="text-orange-600 font-medium">{getTimeRemaining(token.expires_at)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={reset} className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold hover:bg-gray-50">
                  Scan Another
                </button>
                {token.status === 'paid' && (
                  <button
                    onClick={dispenseFuel}
                    disabled={processing}
                    className="flex-1 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    {processing ? <div className="spinner"></div> : <><CheckCircle className="w-5 h-5" />Dispense</>}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={startScanner}
                className="w-full py-16 border-2 border-dashed border-primary-300 rounded-xl hover:border-primary-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-3"
              >
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <Camera className="w-10 h-10 text-primary-500" />
                </div>
                <span className="font-bold text-gray-700">Tap to Scan QR Code</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t"></div></div>
                <div className="relative flex justify-center"><span className="px-3 bg-white text-gray-500 text-sm">or enter manually</span></div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="TKN-XXXXXXXX-XXXXX"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl font-mono focus:border-primary-500 focus:outline-none"
                />
                <button
                  onClick={() => { if (manualCode) handleScan(manualCode) }}
                  disabled={!manualCode || processing}
                  className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold rounded-xl"
                >
                  Verify
                </button>
              </div>

              {result?.type === 'error' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700">{result.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <p className="text-sm text-gray-500 mb-2">Today's Stats</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">--</p>
              <p className="text-sm text-gray-600">Tokens Scanned</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">--</p>
              <p className="text-sm text-gray-600">Fuel Dispensed</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
