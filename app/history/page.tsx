'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, FuelToken } from '@/lib/supabase'
import { formatCurrency, formatQuantity, formatDateTime } from '@/lib/utils'
import { ArrowLeft, Fuel, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function HistoryPage() {
  const [tokens, setTokens] = useState<FuelToken[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const user = localStorage.getItem('operator_user')
    if (!user) { router.push('/login'); return }
    fetchHistory()
  }, [])

  async function fetchHistory() {
    const { data } = await supabase
      .from('fuel_tokens')
      .select('*, fuel_types (*), token_orders (*)')
      .eq('status', 'used')
      .order('used_at', { ascending: false })
      .limit(50)
    
    if (data) setTokens(data)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white shadow-sm">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/scan" className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="font-bold text-gray-800">Scan History</h1>
        </div>
      </header>

      <main className="p-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-12"><div className="spinner"></div></div>
        ) : tokens.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-gray-500">No scanned tokens yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tokens.map((token) => (
              <div key={token.id} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      token.fuel_types?.code === 'PET' ? 'bg-orange-100' : 'bg-green-100'
                    }`}>
                      <Fuel className={`w-5 h-5 ${
                        token.fuel_types?.code === 'PET' ? 'text-orange-500' : 'text-green-500'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{token.token_orders?.customer_name}</p>
                      <p className="text-sm text-gray-500">
                        {formatQuantity(token.quantity)} • {formatCurrency(token.amount)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      <CheckCircle className="w-3 h-3" /> Done
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {token.used_at ? formatDateTime(token.used_at) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
