import { useEffect, useState } from 'react'
import { CircleAlert, CloudCheck, HardDrive } from 'lucide-react'
import { useOpslagStatus } from '../lib/store'
import { bedrijfStore } from '../lib/bedrijf'
import { opslagSchatting } from '../lib/backupActies'
import { ga } from '../lib/router'

const tijd = (t: number) => new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit' }).format(new Date(t))

/** Kleine indicator: alles is automatisch opgeslagen (of niet). */
export function OpslagIndicator({ sinds }: { sinds?: number }) {
  const s = useOpslagStatus()
  const [flits, setFlits] = useState(false)
  useEffect(() => {
    if (!s.opgeslagen) return
    setFlits(true)
    const t = setTimeout(() => setFlits(false), 1600)
    return () => clearTimeout(t)
  }, [s.opgeslagen])
  if (s.fout)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-rust/10 px-2.5 py-1 text-[0.75rem] font-semibold whitespace-nowrap text-rust" role="status">
        <CircleAlert className="h-3.5 w-3.5" /> Niet opgeslagen
      </span>
    )
  const t = s.opgeslagen ?? sinds
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.75rem] whitespace-nowrap text-ink-muted" role="status" aria-live="polite" title="Wijzigingen worden automatisch op dit apparaat bewaard">
      <CloudCheck className={`h-3.5 w-3.5 transition ${flits ? 'scale-110 text-sage' : ''}`} />
      {flits || !t ? 'Opgeslagen' : (
        <>
          Opgeslagen<span className="hidden sm:inline"> om {tijd(t)}</span>
        </>
      )}
    </span>
  )
}

/** Banner bovenaan als opslaan mislukt of de opslag bijna vol is. */
export function OpslagWaarschuwing() {
  const s = useOpslagStatus()
  bedrijfStore.use()
  const [bijnaVol, setBijnaVol] = useState(false)
  useEffect(() => {
    opslagSchatting().then((e) => setBijnaVol(!!e && e.gebruikt / e.beschikbaar > 0.9))
  }, [s.opgeslagen])
  const fout = s.fout ?? bedrijfStore.fout()
  if (!fout && !bijnaVol) return null
  return (
    <div className="no-print border-b border-rust/25 bg-[#f8e9e4]" role="alert">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 text-[0.84rem] text-ink sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-start gap-2">
          {fout ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rust" /> : <HardDrive className="mt-0.5 h-4 w-4 shrink-0 text-rust" />}
          <span>
            {fout ? <strong>Opslaan mislukt. </strong> : <strong>Opslag bijna vol. </strong>}
            {fout
              ? 'De opslag van je browser is vol; je laatste wijziging staat nog niet veilig. Maak nu een back-up en verwijder oude foto’s of projecten.'
              : 'Maak een back-up en verwijder oude foto’s of projecten om ruimte te maken.'}
          </span>
        </p>
        <button type="button" onClick={() => ga('/instellingen/backup')} className="shrink-0 self-start rounded-lg bg-ink px-3.5 py-2 text-[0.82rem] font-medium text-sand-50 sm:self-auto">
          Back-up maken
        </button>
      </div>
    </div>
  )
}
