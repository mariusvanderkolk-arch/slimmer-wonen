import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Building2, Check, ExternalLink, Eye, EyeOff, FileText, ImagePlus, KeyRound, Loader2, ShieldAlert, Sparkles, Trash2 } from 'lucide-react'
import { Button, Card, CardHeader, NumberField, PageTitle, TextField } from '../components/ui'
import { toast } from '../components/Toast'
import { actieveAi, AiFout, PROVIDERS, providerInfo, testVerbinding, type AiProvider } from '../lib/ai'
import { aiStore, useAi } from '../lib/aiStore'
import { bedrijfStore, btwGeldig, emailGeldig, ibanGeldig, kvkGeldig, useBedrijf, verkleinLogo, type Bedrijf } from '../lib/bedrijf'

const SECTIES = [
  { id: 'bedrijf', label: 'Bedrijf' },
  { id: 'offerte', label: 'Offerte' },
  { id: 'ai', label: 'AI' },
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
        <AiSectie />
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

function AiSectie() {
  const inst = useAi()
  const p = providerInfo(inst.provider)
  const sleutel = inst.sleutels[p.id] ?? ''
  const [toon, setToon] = useState(false)
  const [test, setTest] = useState<{ bezig?: boolean; ok?: boolean; fout?: string }>({})
  const zet = (f: (i: typeof inst) => typeof inst) => {
    setTest({})
    if (!aiStore.update(f)) toast(aiStore.fout() ?? 'Opslaan mislukt', 'fout')
  }
  const kies = (id: AiProvider) => zet((i) => ({ ...i, provider: id }))
  const ai = actieveAi(inst)
  const aantalSleutels = Object.values(inst.sleutels).filter(Boolean).length

  async function doeTest() {
    if (!ai) return
    setTest({ bezig: true })
    try {
      await testVerbinding(ai)
      setTest({ ok: true })
    } catch (e) {
      setTest({ fout: e instanceof AiFout ? e.message : 'Test mislukt.' })
    }
  }

  return (
    <Sectie id="ai">
      <Card>
        <CardHeader
          icon={<Sparkles className="h-5 w-5" />}
          title="AI-fotoanalyse"
          sub="Optioneel. Met een eigen API-sleutel kan de app foto's laten beoordelen: sanitair en tegels herkennen, werkzaamheden voorstellen en maten schatten."
        />
        <div className="p-5 sm:p-6">
          <fieldset>
            <legend className="mb-2 text-[0.8rem] font-medium text-ink-soft">Kies een AI-dienst</legend>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {PROVIDERS.map((x) => {
                const actief = x.id === inst.provider
                return (
                  <label
                    key={x.id}
                    className={`relative flex cursor-pointer flex-col gap-1 rounded-xl p-4 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-gold-300 ${actief ? 'bg-gold-100/50 ring-2 ring-gold-500' : 'bg-white/70 ring-1 ring-sand-300 hover:ring-gold-400'}`}
                  >
                    <input type="radio" name="ai-provider" value={x.id} checked={actief} onChange={() => kies(x.id)} className="sr-only" />
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[0.92rem] font-semibold text-ink">{x.naam}</span>
                      {actief && (
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-gold-500 text-white">
                          <Check className="h-3.5 w-3.5" strokeWidth={3} />
                        </span>
                      )}
                    </span>
                    <span className={`text-[0.72rem] font-semibold ${x.id === 'gemini' ? 'text-[#4c6547]' : 'text-gold-700'}`}>{x.label}</span>
                    <span className="text-[0.78rem] leading-snug text-ink-muted">{x.notitie}</span>
                    {inst.sleutels[x.id] && <span className="text-[0.72rem] font-medium text-ink-soft">✓ Sleutel ingesteld</span>}
                  </label>
                )
              })}
            </div>
          </fieldset>

          {p.id === 'gemini' && (
            <div className="mt-5 rounded-xl bg-sand-50 p-4 ring-1 ring-sand-200">
              <p className="text-sm font-semibold text-ink">Gratis Gemini-sleutel aanmaken (2 minuten)</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-[0.84rem] leading-relaxed text-ink-soft">
                <li>
                  Ga naar{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-ink underline underline-offset-2">
                    aistudio.google.com/apikey <ExternalLink className="h-3.5 w-3.5" />
                  </a>{' '}
                  en log in met je Google-account.
                </li>
                <li>Accepteer de voorwaarden en klik op <strong>Create API key</strong> (API-sleutel maken).</li>
                <li>Kopieer de sleutel (begint meestal met <code className="rounded bg-white px-1 text-[0.78rem]">AIza</code>) en plak hem hieronder.</li>
                <li>Klik op <strong>Verbinding testen</strong>. Voor gratis gebruik zijn geen betaalgegevens nodig.</li>
              </ol>
            </div>
          )}
          {p.id !== 'gemini' && p.sleutelUrl && (
            <p className="mt-4 text-[0.82rem] text-ink-soft">
              Sleutel aanmaken:{' '}
              <a href={p.sleutelUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-ink underline underline-offset-2">
                {p.sleutelUrl.replace('https://', '')} <ExternalLink className="h-3.5 w-3.5" />
              </a>
              . Stel daar bij voorkeur een bestedingslimiet in.
            </p>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <div className="flex items-end gap-2">
                <div className="min-w-0 flex-1">
                  <TextField
                    label={`API-sleutel ${p.naam}`}
                    type={toon ? 'text' : 'password'}
                    autoComplete="off"
                    value={sleutel}
                    placeholder="Plak hier je sleutel"
                    onChange={(v) => zet((i) => ({ ...i, sleutels: { ...i.sleutels, [p.id]: v.trim() } }))}
                  />
                </div>
                <Button
                  variant="secondary"
                  className="!h-12 !px-3.5"
                  aria-label={toon ? 'Sleutel verbergen' : 'Sleutel tonen'}
                  aria-pressed={toon}
                  icon={toon ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  onClick={() => setToon((t) => !t)}
                />
              </div>
            </div>
            <TextField
              label="Model"
              value={inst.modellen[p.id] ?? ''}
              placeholder={p.model || 'bijv. llava'}
              hint={p.model ? `Leeg = ${p.model}` : 'Een model dat foto’s kan lezen'}
              onChange={(v) => zet((i) => ({ ...i, modellen: { ...i.modellen, [p.id]: v.trim() } }))}
            />
            {p.id === 'eigen' && (
              <TextField
                label="Basis-URL"
                type="url"
                inputMode="url"
                value={inst.baseUrl}
                placeholder="https://…/v1"
                hint="Zonder /chat/completions; de dienst moet verzoeken vanuit de browser (CORS) toestaan."
                onChange={(v) => zet((i) => ({ ...i, baseUrl: v.trim() }))}
              />
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3" aria-live="polite">
            <Button variant="primary" disabled={!ai || test.bezig} onClick={doeTest} icon={test.bezig ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}>
              Verbinding testen
            </Button>
            {test.ok && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4c6547]">
                <Check className="h-4 w-4" /> Werkt! Je kunt foto’s laten analyseren bij Opmeten.
              </span>
            )}
            {test.fout && <span className="text-sm text-rust" role="alert">{test.fout}</span>}
          </div>

          <div className="mt-6 flex gap-3 rounded-xl border border-gold-200 bg-gold-100/50 px-4 py-3.5 text-[0.82rem] leading-relaxed text-ink-soft">
            <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-gold-700" />
            <div>
              <p className="font-semibold text-ink">Over je sleutel en privacy</p>
              <p>
                De sleutel wordt alleen in deze browser op dit apparaat bewaard en rechtstreeks naar de gekozen dienst gestuurd, nooit naar ons. Iedereen met toegang tot deze
                browser kan hem uitlezen: verwijder hem op gedeelde apparaten. De sleutel gaat niet mee in back-ups. Foto’s worden alleen verstuurd als jij op “Analyseer” drukt.
              </p>
              {aantalSleutels > 0 && (
                <Button
                  size="sm"
                  variant="danger"
                  className="mt-2 -ml-3"
                  icon={<Trash2 className="h-4 w-4" />}
                  onClick={() => {
                    zet((i) => ({ ...i, sleutels: {} }))
                    toast('Alle API-sleutels verwijderd')
                  }}
                >
                  {aantalSleutels === 1 ? 'Sleutel verwijderen' : `Alle ${aantalSleutels} sleutels verwijderen`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Sectie>
  )
}
