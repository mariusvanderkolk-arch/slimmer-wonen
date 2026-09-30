import { useState } from 'react'
import { ArrowLeft, ArrowRight, Bath, Check, CookingPot, Toilet, Trash2 } from 'lucide-react'
import { Badge, Button, Card, CardHeader, PageTitle, TextField } from '../components/ui'
import { SCOPE_ICONS } from '../components/scopeIcons'
import { SCOPE_ITEMS, nieuwProject } from '../lib/defaults'
import { ga } from '../lib/router'
import { projectStore, useProject } from '../lib/store'
import type { Scope, ScopeKey } from '../lib/types'

export function ProjectForm({ id }: { id?: string }) {
  const bestaand = useProject(id)
  const [concept] = useState(() => bestaand ?? nieuwProject())
  const [naam, setNaam] = useState(concept.naam)
  const [klant, setKlant] = useState(concept.klant)
  const [adres, setAdres] = useState(concept.adres)
  const [scope, setScope] = useState<Scope>(concept.scope)

  if (id && !bestaand) return <NietGevonden />

  const wissel = (k: ScopeKey) => setScope((s) => ({ ...s, [k]: !s[k] }))
  const aantal = Object.values(scope).filter(Boolean).length
  const alles = aantal === SCOPE_ITEMS.length

  const opslaan = () => {
    const velden = { naam: naam.trim() || 'Nieuwe badkamer', klant: klant.trim(), adres: adres.trim(), scope }
    if (bestaand) {
      projectStore.werkBij(bestaand.id, (p) => ({ ...p, ...velden }))
      ga(`/project/${bestaand.id}/opmeten`)
    } else {
      const p = { ...concept, ...velden, createdAt: Date.now(), updatedAt: Date.now() }
      projectStore.voegToe(p)
      ga(`/project/${p.id}/opmeten`)
    }
  }

  const verwijder = () => {
    if (bestaand && confirm(`Project “${bestaand.naam}” verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
      projectStore.verwijder(bestaand.id)
      ga('/')
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-32 sm:px-6 sm:pt-10">
      <button
        type="button"
        onClick={() => (bestaand ? ga(`/project/${bestaand.id}/opmeten`) : ga('/'))}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> {bestaand ? 'Terug naar project' : 'Projecten'}
      </button>
      <PageTitle
        eyebrow={bestaand ? 'Project bewerken' : 'Stap 1 · Nieuw project'}
        title={bestaand ? 'Project & werkzaamheden' : 'Wat gaan we verbouwen?'}
        sub="Leg de basisgegevens vast en kies welke werkzaamheden in de klus zitten. Dit bepaalt welke materialen worden berekend."
      />

      <div className="mt-8 space-y-5">
        <Card>
          <CardHeader title="Projectgegevens" sub="Wordt gebruikt op de inkooplijst en de offerte." />
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <div className="sm:col-span-2">
              <TextField label="Projectnaam" value={naam} onChange={setNaam} placeholder="Bijv. Badkamer Jansen" autoFocus={!bestaand} />
            </div>
            <TextField label="Klant" value={klant} onChange={setKlant} placeholder="Naam opdrachtgever" />
            <TextField label="Adres (optioneel)" value={adres} onChange={setAdres} placeholder="Straat en plaats" />
          </div>
        </Card>

        <Card>
          <CardHeader title="Type ruimte" sub="We beginnen met badkamers. Andere ruimtes volgen." />
          <div className="grid grid-cols-3 gap-2.5 p-5 sm:gap-3 sm:p-6">
            {[
              { l: 'Badkamer', i: Bath, actief: true },
              { l: 'Toilet', i: Toilet, actief: false },
              { l: 'Keuken', i: CookingPot, actief: false },
            ].map((t) => (
              <div
                key={t.l}
                aria-disabled={!t.actief}
                className={`relative flex flex-col items-center gap-2 rounded-xl px-2 py-4 text-center ring-1 ring-inset ${
                  t.actief ? 'bg-gold-100/70 ring-2 ring-gold-400' : 'bg-sand-50 text-ink-muted ring-sand-300'
                }`}
              >
                <t.i className={`h-6 w-6 ${t.actief ? 'text-gold-700' : 'text-ink-muted/70'}`} />
                <span className={`text-sm font-semibold ${t.actief ? 'text-ink' : ''}`}>{t.l}</span>
                {t.actief ? (
                  <span className="absolute top-2 right-2 grid h-5 w-5 place-items-center rounded-full bg-gold-500 text-white">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : (
                  <Badge className="!px-2 !text-[0.62rem]">Binnenkort</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Werkzaamheden"
            sub={`${aantal} van ${SCOPE_ITEMS.length} geselecteerd`}
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setScope(Object.fromEntries(SCOPE_ITEMS.map((i) => [i.key, !alles])) as Scope)}
              >
                {alles ? 'Niets' : 'Alles'}
              </Button>
            }
          />
          <div className="grid gap-2.5 p-4 sm:grid-cols-2 sm:p-6">
            {SCOPE_ITEMS.map((item) => {
              const aan = scope[item.key]
              const Icon = SCOPE_ICONS[item.key]
              return (
                <button
                  key={item.key}
                  type="button"
                  role="checkbox"
                  aria-checked={aan}
                  onClick={() => wissel(item.key)}
                  className={`flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-left ring-1 ring-inset transition ${
                    aan ? 'bg-gold-100/60 ring-gold-300' : 'bg-white/60 ring-sand-300 hover:ring-sand-400'
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg transition ${
                      aan ? 'bg-paper text-gold-700 ring-1 ring-gold-200' : 'bg-sand-100 text-ink-muted'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-[0.92rem] font-semibold text-ink">
                      {item.label}
                      {item.optioneel && <span className="text-[0.7rem] font-medium text-ink-muted">optioneel</span>}
                    </span>
                    <span className="block truncate text-xs text-ink-muted">{item.omschrijving}</span>
                  </span>
                  <span
                    className={`grid h-5.5 w-5.5 shrink-0 place-items-center rounded-md border transition ${
                      aan ? 'border-gold-500 bg-gold-500 text-white' : 'border-sand-400 bg-white'
                    }`}
                  >
                    {aan && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                </button>
              )
            })}
          </div>
        </Card>

        {bestaand && (
          <div className="flex justify-center pt-2">
            <Button variant="danger" size="sm" icon={<Trash2 className="h-4 w-4" />} onClick={verwijder}>
              Project verwijderen
            </Button>
          </div>
        )}
      </div>

      <div className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-sand-300/70 bg-sand-100/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          <p className="hidden text-sm text-ink-muted sm:block">
            {aantal} werkzaamheden · <span className="text-ink">{naam.trim() || 'Nog geen naam'}</span>
          </p>
          <Button size="lg" className="w-full sm:w-auto" onClick={opslaan} icon={bestaand ? <Check className="h-4.5 w-4.5" /> : undefined}>
            {bestaand ? 'Opslaan' : 'Project aanmaken'}
            {!bestaand && <ArrowRight className="h-4.5 w-4.5" />}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function NietGevonden() {
  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <h1 className="text-3xl font-semibold">Project niet gevonden</h1>
      <p className="mt-2 text-sm text-ink-muted">Dit project bestaat niet (meer) op dit apparaat.</p>
      <Button className="mt-6" onClick={() => ga('/')}>
        Naar projecten
      </Button>
    </div>
  )
}
