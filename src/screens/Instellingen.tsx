import { useEffect, useRef, type ReactNode } from 'react'
import { Building2, FileText, ImagePlus, Trash2 } from 'lucide-react'
import { Button, Card, CardHeader, NumberField, PageTitle, TextField } from '../components/ui'
import { toast } from '../components/Toast'
import { bedrijfStore, btwGeldig, emailGeldig, ibanGeldig, kvkGeldig, useBedrijf, verkleinLogo, type Bedrijf } from '../lib/bedrijf'

const SECTIES = [
  { id: 'bedrijf', label: 'Bedrijf' },
  { id: 'offerte', label: 'Offerte' },
]

export function Instellingen({ sectie }: { sectie?: string }) {
  useEffect(() => {
    if (sectie) document.getElementById(`sectie-${sectie}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [sectie])
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-16 sm:px-6 sm:pt-10">
      <PageTitle eyebrow="Instellingen" title="Jouw gegevens" sub="Alles wordt alleen op dit apparaat bewaard. Gebruik een back-up om het mee te nemen naar een ander apparaat." />
      <nav aria-label="Secties" className="sticky top-16 z-20 -mx-4 mt-6 flex gap-2 overflow-x-auto bg-sand-100/90 px-4 py-2.5 backdrop-blur-md sm:top-[4.5rem] sm:mx-0 sm:rounded-2xl sm:px-2">
        {SECTIES.map((s) => (
          <a
            key={s.id}
            href={`#/instellingen/${s.id}`}
            onClick={(e) => {
              e.preventDefault()
              document.getElementById(`sectie-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            className="h-9 shrink-0 rounded-full bg-white/70 px-4 text-[0.84rem] leading-9 font-medium text-ink-soft ring-1 ring-sand-300 ring-inset hover:ring-gold-400"
          >
            {s.label}
          </a>
        ))}
      </nav>
      <div className="mt-4 space-y-5">
        <BedrijfSectie />
        <OfferteSectie />
      </div>
    </div>
  )
}

export function Sectie({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section id={`sectie-${id}`} className="scroll-mt-36">
      {children}
    </section>
  )
}

function BedrijfSectie() {
  const b = useBedrijf()
  const zet = (patch: Partial<Bedrijf>) => {
    if (!bedrijfStore.set({ ...bedrijfStore.get(), ...patch })) toast(bedrijfStore.fout() ?? 'Opslaan mislukt', 'fout')
  }
  const logoInput = useRef<HTMLInputElement>(null)
  const veld = (k: keyof Bedrijf, label: string, extra: Partial<Parameters<typeof TextField>[0]> = {}) => (
    <TextField label={label} value={String(b[k] ?? '')} onChange={(v) => zet({ [k]: v })} {...extra} />
  )
  return (
    <Sectie id="bedrijf">
      <Card>
        <CardHeader icon={<Building2 className="h-5 w-5" />} title="Bedrijfsgegevens" sub="Komen bovenaan en onderaan je offertes, en in het akkoordbericht van de klant." />
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-sand-50 p-4 ring-1 ring-sand-200">
            <div className="grid h-16 w-28 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-sand-300">
              {b.logo ? <img src={b.logo} alt="Je logo" className="max-h-14 max-w-24 object-contain" /> : <span className="text-[0.72rem] text-ink-muted">Geen logo</span>}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">Logo</p>
              <p className="text-[0.78rem] text-ink-muted">PNG of JPG; wordt verkleind en lokaal bewaard. Staat op de afgedrukte offerte (niet in de klantlink).</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" icon={<ImagePlus className="h-4 w-4" />} onClick={() => logoInput.current?.click()}>
                {b.logo ? 'Wijzigen' : 'Uploaden'}
              </Button>
              {b.logo && (
                <Button size="sm" variant="danger" aria-label="Logo verwijderen" icon={<Trash2 className="h-4 w-4" />} onClick={() => zet({ logo: undefined })} />
              )}
            </div>
            <input
              ref={logoInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              data-testid="logo-upload"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                try {
                  zet({ logo: await verkleinLogo(f) })
                  toast('Logo opgeslagen')
                } catch {
                  toast('Dit bestand kon niet als logo worden gelezen', 'fout')
                }
              }}
            />
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">{veld('naam', 'Bedrijfsnaam', { placeholder: 'Bijv. Van der Kolk Renovatie', autoComplete: 'organization' })}</div>
            {veld('contactpersoon', 'Contactpersoon', { autoComplete: 'name' })}
            {veld('telefoon', 'Telefoon', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', hint: 'Wordt gebruikt voor het WhatsApp-akkoord.' })}
            {veld('email', 'E-mail', { type: 'email', inputMode: 'email', autoComplete: 'email', fout: emailGeldig(b.email) ? null : 'Dit lijkt geen geldig e-mailadres.' })}
            {veld('website', 'Website', { type: 'url', inputMode: 'url', placeholder: 'www.…' })}
            <div className="sm:col-span-2">{veld('adres', 'Adres', { placeholder: 'Straat, postcode en plaats', autoComplete: 'street-address' })}</div>
            {veld('kvk', 'KvK-nummer', { inputMode: 'numeric', fout: kvkGeldig(b.kvk) ? null : 'Een KvK-nummer heeft 8 cijfers.' })}
            {veld('btw', 'Btw-nummer', { placeholder: 'NL123456789B01', fout: btwGeldig(b.btw) ? null : 'Verwacht formaat: NL123456789B01.' })}
            <div className="sm:col-span-2">{veld('iban', 'IBAN', { placeholder: 'NL00 BANK 0123 4567 89', fout: ibanGeldig(b.iban) ? null : 'Dit IBAN klopt niet (controlegetal of lengte).' })}</div>
          </div>
        </div>
      </Card>
    </Sectie>
  )
}

function OfferteSectie() {
  const b = useBedrijf()
  const zet = (patch: Partial<Bedrijf>) => bedrijfStore.set({ ...bedrijfStore.get(), ...patch })
  const jaar = new Date().getFullYear()
  return (
    <Sectie id="offerte">
      <Card>
        <CardHeader icon={<FileText className="h-5 w-5" />} title="Offertes" sub="Nummering, geldigheid en betaaltermijn voor nieuwe offertes." />
        <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          <TextField label="Voorvoegsel nummer" value={b.nummerPrefix} onChange={(v) => zet({ nummerPrefix: v.slice(0, 12) })} />
          <NumberField label="Volgend volgnummer" decimals={0} value={b.volgnummer} onChange={(v) => zet({ volgnummer: Math.max(1, Math.round(v)) })} min={1} />
          <NumberField label="Geldig (dagen)" decimals={0} unit="dagen" value={b.geldigheidDagen} onChange={(v) => zet({ geldigheidDagen: Math.min(365, Math.max(1, Math.round(v))) })} min={1} />
          <p className="-mt-1 text-[0.78rem] text-ink-muted sm:col-span-3">
            Volgende offerte krijgt nummer{' '}
            <span className="tabnum font-semibold text-ink">
              {b.nummerPrefix}
              {jaar}-{String(b.volgnummer).padStart(3, '0')}
            </span>
            . Bestaande offertes houden hun nummer.
          </p>
          <div className="sm:col-span-3">
            <TextField label="Betaaltermijn / voorwaarden" value={b.betaaltermijn} onChange={(v) => zet({ betaaltermijn: v })} placeholder="Bijv. 30% bij opdracht, rest binnen 14 dagen na oplevering." />
          </div>
        </div>
      </Card>
    </Sectie>
  )
}
