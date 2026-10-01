import { Component, type ReactNode } from 'react'
import { Download, RotateCcw, TriangleAlert } from 'lucide-react'
import { Button } from './ui'

interface Staat {
  fout: Error | null
}

/** Vangt onverwachte fouten af zodat de gebruiker nooit een wit scherm krijgt en altijd een back-up kan maken. */
export class Foutgrens extends Component<{ children: ReactNode; sleutel?: string }, Staat> {
  state: Staat = { fout: null }
  static getDerivedStateFromError(fout: Error): Staat {
    return { fout }
  }
  componentDidUpdate(vorige: { sleutel?: string }) {
    // bij navigeren naar een ander scherm opnieuw proberen
    if (vorige.sleutel !== this.props.sleutel && this.state.fout) this.setState({ fout: null })
  }
  componentDidCatch(fout: Error) {
    console.error(fout)
  }
  render() {
    if (!this.state.fout) return this.props.children
    const laden = /dynamically imported module|Loading chunk|Importing a module script failed/i.test(this.state.fout.message)
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center" role="alert">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rust/10 text-rust">
          <TriangleAlert className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-3xl font-semibold text-ink">{laden ? 'Dit onderdeel kon niet laden' : 'Er ging iets mis'}</h1>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">
          {laden
            ? 'Misschien ben je offline of is er net een nieuwe versie verschenen. Ververs de pagina.'
            : 'Je gegevens zijn veilig: alles staat nog op dit apparaat. Ververs de pagina; lukt het daarna nog niet, maak dan een back-up.'}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
          <Button icon={<RotateCcw className="h-4 w-4" />} onClick={() => location.reload()}>
            Pagina verversen
          </Button>
          <Button
            variant="secondary"
            icon={<Download className="h-4 w-4" />}
            onClick={async () => {
              const { exporteerAlles } = await import('../lib/backupActies')
              exporteerAlles().catch(() => {})
            }}
          >
            Back-up downloaden
          </Button>
        </div>
      </div>
    )
  }
}
