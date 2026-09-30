import type { ReactNode } from 'react'
import { AppWindow, DoorOpen, LayoutGrid, Plus, Ruler, Settings2, ShowerHead, Trash2 } from 'lucide-react'
import { Fotos } from '../components/Fotos'
import { Plattegrond } from '../components/Plattegrond'
import { Button, Card, CardHeader, NumberField } from '../components/ui'
import { uid } from '../lib/defaults'
import { getal } from '../lib/format'
import { projectStore } from '../lib/store'
import { useBerekening } from '../lib/useCalc'
import type { Afmetingen, Opening, Project, TileSpec } from '../lib/types'

const WAND_PRESETS: (TileSpec & { label: string })[] = [
  { label: '20 × 20', lengte: 20, breedte: 20, m2PerDoos: 1.0, dikte: 8, voeg: 2 },
  { label: '30 × 60', lengte: 60, breedte: 30, m2PerDoos: 1.44, dikte: 9, voeg: 2 },
  { label: '7,5 × 30', lengte: 30, breedte: 7.5, m2PerDoos: 0.5, dikte: 8, voeg: 2 },
  { label: '60 × 120', lengte: 120, breedte: 60, m2PerDoos: 1.44, dikte: 9, voeg: 2 },
]
const VLOER_PRESETS: (TileSpec & { label: string })[] = [
  { label: '30 × 30', lengte: 30, breedte: 30, m2PerDoos: 1.08, dikte: 9, voeg: 3 },
  { label: '30 × 60', lengte: 60, breedte: 30, m2PerDoos: 1.44, dikte: 9, voeg: 3 },
  { label: '60 × 60', lengte: 60, breedte: 60, m2PerDoos: 1.44, dikte: 10, voeg: 3 },
  { label: '60 × 120', lengte: 120, breedte: 60, m2PerDoos: 1.44, dikte: 10, voeg: 3 },
]

function Chip({ actief, children, onClick }: { actief?: boolean; children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`tabnum h-8 rounded-full px-3 text-[0.8rem] font-medium ring-1 ring-inset transition ${
        actief ? 'bg-ink text-sand-50 ring-ink' : 'bg-white/70 text-ink-soft ring-sand-300 hover:ring-gold-400'
      }`}
    >
      {children}
    </button>
  )
}

export function Measure({ p }: { p: Project }) {
  const { oppervlakken: o } = useBerekening(p)
  const a = p.afmetingen
  const upd = (f: (x: Project) => Project) => projectStore.werkBij(p.id, f)
  const setA = (patch: Partial<Afmetingen>) => upd((x) => ({ ...x, afmetingen: { ...x.afmetingen, ...patch } }))
  const setOpening = (id: string, patch: Partial<Opening>) =>
    setA({ openingen: a.openingen.map((op) => (op.id === id ? { ...op, ...patch } : op)) })
  const nieuweOpening = (type: Opening['type']) =>
    setA({
      openingen: [
        ...a.openingen,
        type === 'deur'
          ? { id: uid(), type, breedte: 0.83, hoogte: 2.11, vanafVloer: 0 }
          : { id: uid(), type, breedte: 0.6, hoogte: 0.6, vanafVloer: 1.4 },
      ],
    })
  const setTegel = (k: 'wandtegel' | 'vloertegel', patch: Partial<TileSpec>) => upd((x) => ({ ...x, [k]: { ...x[k], ...patch } }))
  const tegelhoogteVol = Math.abs(a.tegelhoogte - a.hoogte) < 0.005

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="space-y-5">
        <Fotos p={p} />

        <Card>
          <CardHeader icon={<Ruler className="h-5 w-5" />} title="Afmetingen ruimte" sub="Binnenmaten in meters, gemeten van wand tot wand." />
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 sm:p-6">
            <NumberField label="Lengte" unit="m" value={a.lengte} onChange={(v) => setA({ lengte: v })} />
            <NumberField label="Breedte" unit="m" value={a.breedte} onChange={(v) => setA({ breedte: v })} />
            <NumberField label="Hoogte" unit="m" value={a.hoogte} onChange={(v) => setA({ hoogte: v, tegelhoogte: tegelhoogteVol ? v : Math.min(a.tegelhoogte, v) })} />
            <div className="col-span-2 sm:col-span-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <NumberField label="Tegelhoogte wand" unit="m" value={a.tegelhoogte} onChange={(v) => setA({ tegelhoogte: v })} />
                <div className="col-span-1 flex flex-wrap items-end gap-2 pb-2 sm:col-span-2">
                  <Chip actief={tegelhoogteVol} onClick={() => setA({ tegelhoogte: a.hoogte })}>
                    Tot plafond
                  </Chip>
                  <Chip actief={Math.abs(a.tegelhoogte - 2.1) < 0.005} onClick={() => setA({ tegelhoogte: Math.min(2.1, a.hoogte) })}>
                    2,10 m
                  </Chip>
                  <Chip actief={Math.abs(a.tegelhoogte - 1.2) < 0.005} onClick={() => setA({ tegelhoogte: 1.2 })}>
                    Halfhoog
                  </Chip>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader
            icon={<DoorOpen className="h-5 w-5" />}
            title="Deuren & ramen"
            sub="Openingen worden van het wandoppervlak afgetrokken, voor zover ze in de tegelzone vallen."
          />
          <div className="p-5 sm:p-6">
            {a.openingen.length === 0 && <p className="mb-4 text-sm text-ink-muted">Geen openingen. Voeg een deur of raam toe.</p>}
            <ul className="space-y-3">
              {a.openingen.map((op, i) => (
                <li key={op.id} className="rounded-xl bg-sand-50 p-3.5 ring-1 ring-sand-200 sm:p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      {op.type === 'deur' ? <DoorOpen className="h-4 w-4 text-gold-600" /> : <AppWindow className="h-4 w-4 text-gold-600" />}
                      {op.type === 'deur' ? 'Deur' : 'Raam'} {a.openingen.filter((x, j) => x.type === op.type && j <= i).length}
                    </p>
                    <button
                      type="button"
                      aria-label="Opening verwijderen"
                      onClick={() => setA({ openingen: a.openingen.filter((x) => x.id !== op.id) })}
                      className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-rust/10 hover:text-rust"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <NumberField compact label="Breedte" unit="m" value={op.breedte} onChange={(v) => setOpening(op.id, { breedte: v })} />
                    <NumberField compact label="Hoogte" unit="m" value={op.hoogte} onChange={(v) => setOpening(op.id, { hoogte: v })} />
                    {op.type === 'raam' ? (
                      <NumberField compact label="Vanaf vloer" unit="m" value={op.vanafVloer} onChange={(v) => setOpening(op.id, { vanafVloer: v })} />
                    ) : (
                      <div className="min-w-0">
                        <p className="mb-1.5 truncate text-[0.8rem] font-medium text-ink-soft">Aftrek</p>
                        <p className="tabnum flex h-11 items-center text-sm text-ink-muted">
                          {getal(op.breedte * Math.min(op.hoogte, o.tegelhoogte))} m²
                        </p>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => nieuweOpening('deur')}>
                Deur
              </Button>
              <Button variant="secondary" size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => nieuweOpening('raam')}>
                Raam
              </Button>
            </div>
          </div>
        </Card>

        {p.scope.inloopdouche && (
          <Card>
            <CardHeader icon={<ShowerHead className="h-5 w-5" />} title="Douchezone" sub="Bepaalt de waterdichting op de wand, de kitvoegen en de lengte van de douchegoot." />
            <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3 sm:p-6">
              <NumberField label="Breedte" unit="m" value={a.douche.breedte} onChange={(v) => setA({ douche: { ...a.douche, breedte: v } })} />
              <NumberField label="Diepte" unit="m" value={a.douche.diepte} onChange={(v) => setA({ douche: { ...a.douche, diepte: v } })} />
            </div>
          </Card>
        )}

        {(p.scope.wandtegels || p.scope.vloertegels) && (
          <Card>
            <CardHeader icon={<LayoutGrid className="h-5 w-5" />} title="Tegels" sub="Formaat en verpakking bepalen het aantal dozen, de lijm en de voeg." />
            <div className="divide-y divide-sand-200">
              {p.scope.wandtegels && (
                <TegelVelden titel="Wandtegel" tegel={p.wandtegel} presets={WAND_PRESETS} onChange={(t) => setTegel('wandtegel', t)} />
              )}
              {p.scope.vloertegels && (
                <TegelVelden titel="Vloertegel" tegel={p.vloertegel} presets={VLOER_PRESETS} onChange={(t) => setTegel('vloertegel', t)} />
              )}
            </div>
          </Card>
        )}

        <Card>
          <CardHeader icon={<Settings2 className="h-5 w-5" />} title="Uitgangspunten" sub="Pas aan op de klus en je eigen werkwijze." />
          <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <div>
              <NumberField label="Snijverlies tegels" unit="%" decimals={1} value={p.snijverlies} onChange={(v) => upd((x) => ({ ...x, snijverlies: Math.min(v, 50) }))} />
              <div className="mt-2.5 flex flex-wrap gap-2">
                {[5, 10, 15].map((n) => (
                  <Chip key={n} actief={p.snijverlies === n} onClick={() => upd((x) => ({ ...x, snijverlies: n }))}>
                    {n}%
                  </Chip>
                ))}
              </div>
              <p className="mt-2 text-xs leading-snug text-ink-muted">10% is gangbaar; 15% bij diagonaal leggen of veel hoeken.</p>
            </div>
            {p.scope.egaliseren && (
              <NumberField
                label="Laagdikte egaliseren"
                unit="mm"
                decimals={1}
                value={a.egaliseerDikte}
                onChange={(v) => setA({ egaliseerDikte: v })}
                hint="Gemiddelde laagdikte over de hele vloer."
              />
            )}
          </div>
        </Card>
      </div>

      <aside className="lg:sticky lg:top-24">
        <Card className="overflow-hidden">
          <div className="border-b border-sand-200 px-5 py-4">
            <p className="text-[0.98rem] font-semibold">Plattegrond</p>
            <p className="text-[0.82rem] text-ink-muted">Schematisch, schaalt mee met je maten</p>
          </div>
          <div className="bg-sand-50/70 px-4 py-4">
            <Plattegrond afmetingen={a} scope={p.scope} vloertegel={p.scope.vloertegels ? p.vloertegel : undefined} bg="#FAF7F1" className="mx-auto w-full max-w-[320px]" />
          </div>
          <dl className="grid grid-cols-2 gap-px border-t border-sand-200 bg-sand-200">
            {[
              ['Vloer', `${getal(o.vloer)} m²`],
              ['Wand (netto)', `${getal(o.wandNetto)} m²`],
              ['Omtrek', `${getal(o.omtrek)} m`],
              ['Openingen', `− ${getal(o.openingenAftrek)} m²`],
            ].map(([k, v]) => (
              <div key={k} className="bg-paper px-5 py-3.5">
                <dt className="text-[0.68rem] font-semibold uppercase tracking-wider text-ink-muted">{k}</dt>
                <dd className="tabnum mt-0.5 text-[1.05rem] font-semibold text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </aside>
    </div>
  )
}

function TegelVelden({
  titel,
  tegel,
  presets,
  onChange,
}: {
  titel: string
  tegel: TileSpec
  presets: (TileSpec & { label: string })[]
  onChange: (t: Partial<TileSpec>) => void
}) {
  return (
    <div className="p-5 sm:p-6">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{titel}</p>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((pr) => (
            <Chip
              key={pr.label}
              actief={pr.lengte === tegel.lengte && pr.breedte === tegel.breedte}
              onClick={() => onChange({ lengte: pr.lengte, breedte: pr.breedte, m2PerDoos: pr.m2PerDoos, dikte: pr.dikte })}
            >
              {pr.label}
            </Chip>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <NumberField compact label="Lengte" unit="cm" decimals={1} value={tegel.lengte} onChange={(v) => onChange({ lengte: v })} />
        <NumberField compact label="Breedte" unit="cm" decimals={1} value={tegel.breedte} onChange={(v) => onChange({ breedte: v })} />
        <NumberField compact label="Per doos" unit="m²" value={tegel.m2PerDoos} onChange={(v) => onChange({ m2PerDoos: v })} />
        <NumberField compact label="Dikte" unit="mm" decimals={1} value={tegel.dikte} onChange={(v) => onChange({ dikte: v })} />
        <NumberField compact label="Voeg" unit="mm" decimals={1} value={tegel.voeg} onChange={(v) => onChange({ voeg: v })} />
      </div>
    </div>
  )
}
