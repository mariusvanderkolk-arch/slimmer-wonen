import { useEffect, useState } from 'react'
import { CircleCheck } from 'lucide-react'

let zet: ((t: string) => void) | null = null
export const toast = (t: string) => zet?.(t)

export function Toaster() {
  const [tekst, setTekst] = useState<string | null>(null)
  useEffect(() => {
    let timer: number
    zet = (t) => {
      setTekst(t)
      clearTimeout(timer)
      timer = window.setTimeout(() => setTekst(null), 2400)
    }
    return () => {
      zet = null
    }
  }, [])
  return (
    <div aria-live="polite" className="no-print pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      {tekst && (
        <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-sand-50 shadow-lift">
          <CircleCheck className="h-4 w-4 text-gold-300" /> {tekst}
        </div>
      )}
    </div>
  )
}
