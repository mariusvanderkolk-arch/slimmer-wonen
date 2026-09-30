import { useEffect, useState } from 'react'
import { CircleAlert, CircleCheck } from 'lucide-react'

type Soort = 'ok' | 'fout'
let zet: ((t: string, s: Soort) => void) | null = null
export const toast = (t: string, soort: Soort = 'ok') => zet?.(t, soort)

export function Toaster() {
  const [tekst, setTekst] = useState<string | null>(null)
  const [soort, setSoort] = useState<Soort>('ok')
  useEffect(() => {
    let timer: number
    zet = (t, s) => {
      setTekst(t)
      setSoort(s)
      clearTimeout(timer)
      timer = window.setTimeout(() => setTekst(null), s === 'fout' ? 4500 : 2400)
    }
    return () => {
      zet = null
    }
  }, [])
  return (
    <div aria-live="polite" className="no-print pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4">
      {tekst && (
        <div className={`flex max-w-md items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium text-sand-50 shadow-lift ${soort === 'fout' ? 'bg-rust' : 'bg-ink'}`}>
          {soort === 'fout' ? <CircleAlert className="h-4 w-4 shrink-0" /> : <CircleCheck className="h-4 w-4 shrink-0 text-gold-300" />} {tekst}
        </div>
      )}
    </div>
  )
}
