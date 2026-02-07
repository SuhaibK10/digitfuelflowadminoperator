import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type FuelToken = {
  id: number
  token_code: string
  fuel_type_id: number
  quantity: number
  amount: number
  status: 'paid' | 'used' | 'expired' | 'cancelled'
  expires_at: string
  used_at?: string
  used_by?: string
  fuel_types?: { id: number; code: string; name: string; price: number }
  token_orders?: { customer_name: string; customer_phone: string; vehicle_number?: string }
}
