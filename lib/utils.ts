export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(amount)
}

export function formatQuantity(liters: number): string {
  return `${liters.toFixed(2)} L`
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

export function isExpired(expiresAt: string | Date): boolean {
  return new Date(expiresAt) < new Date()
}

export function getTimeRemaining(expiresAt: string | Date): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes} min left`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m left`
}
