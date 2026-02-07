'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Fuel, User, Lock, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [employeeId, setEmployeeId] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId || !pin) {
      setError('Please enter Employee ID and PIN')
      return
    }
    
    setLoading(true)
    // For demo - simple validation
    setTimeout(() => {
      localStorage.setItem('operator_user', JSON.stringify({
        id: employeeId,
        name: `Operator ${employeeId}`,
        role: 'operator'
      }))
      router.push('/scan')
    }, 500)
  }

  function handleDemoLogin() {
    localStorage.setItem('operator_user', JSON.stringify({
      id: 'OP001',
      name: 'Demo Operator',
      role: 'operator'
    }))
    router.push('/scan')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Fuel className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Operator Login</h1>
          <p className="text-gray-500">FuelFlow Scanner App</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                  placeholder="OP001"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PIN</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:outline-none"
                  placeholder="••••"
                  maxLength={4}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-center text-sm text-gray-500 mb-3">Demo Mode</p>
            <button
              onClick={handleDemoLogin}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
            >
              Quick Demo Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
