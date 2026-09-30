import { useState } from 'react'
import { Copy, RotateCcw, Share2, Store } from 'lucide-react'
import { Badge, Button, Card, Checkbox, Notice } from '../components/ui'
import { GROEP_ICONS } from '../components/groepIcons'
import { toast } from '../components/Toast'
import { datum, euro } from '../lib/format'
import { WINKELS, prijsEenheid, winkelNaam, type WinkelId } from '../lib/prices'
import { deelOfKopieer, inkoopTekst, kopieer } from '../lib/share'
import { projectStore } from '../lib/store'
import { useBerekening } from '../lib/useCalc'
import type { InkoopRegel } from '../lib/shopping'
import type { Project } from '../lib/types'

type Weergave = 'goedkoopst' | WinkelId

export function Shopping({ p }: { p: Project }) {
  const { inkoop } = useBerekening(p)
  const [weergave, setWeergave] = useState<Weergave>('goedkoopst')
  const afgevinkt = inkoop.regels.filter((r) => p.afgevinkt[r.sleutel]).length
  const goedkoopsteWinkel = [...inkoop.perWinkel].sort((a, b) => a.ontbrekend - b.ontbrekend || a.totaal - b.totaal)[0]

  const wissel = (sleutel: string) =>
    projectStore.werkBij(p.id, (x) => ({ ...x, afgevinkt: { ...x.afgevinkt, [sleutel]: !x.afgevinkt[sleutel] } }))

  const prijsVoor = (r: InkoopRegel) =>
    weergave === 'goedkoopst' ? r.goedkoopste : r.aanbiedingen.find((a) => a.winkel === weergave)
  const totaalWeergave =
    weergave === 'goedkoopst' ? inkoop.goedkoopsteMix : inkoop.perWinkel.find((w) => w.winkel === weergave)!.totaal

  return (
    <div className="space-y-5">
      <Notice title="Richtprijzen (voorbeeld) — geen actuele winkelprijzen">
        De prijzen hieronder komen uit een voorbeeldtabel (peildatum {datum(Date.parse(inkoop.bron.peildatum))}) en zijn alleen
        bedoeld om de werking te tonen. Controleer altijd de actuele prijs en voorraad bij de winkel.
      </Notice>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="order-2 space-y-5 lg:order-1">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-[0.98rem] font-semibold">Inkooplijst</p>
                <p className="text-[0.82rem] text-ink-muted">
                  {afgevinkt} van {inkoop.regels.length} artikelen afgevinkt
                </p>
              </div>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Copy className="h-3.5 w-3.5" />}
                  onClick={async () => toast((await kopieer(inkoopTekst(p, inkoop))) === 'gekopieerd' ? 'Lijst gekopieerd' : 'Kopiëren mislukt')}
                >
                  Kopieer
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Share2 className="h-3.5 w-3.5" />}
                  onClick={async () => {
                    const r = await deelOfKopieer(`Inkooplijst ${p.naam}`, inkoopTekst(p, inkoop))
                    if (r === 'gekopieerd') toast('Lijst gekopieerd')
                  }}
                >
                  Delen
                </Button>
              </div>
            </div>
            <div className="h-1 bg-sand-200">
              <div className="h-full bg-gradient-to-r from-gold-300 to-gold-500 transition-all" style={{ width: `${inkoop.regels.length ? (afgevinkt / inkoop.regels.length) * 100 : 0}%` }} />
            </div>
            <div className="-mb-px overflow-x-auto border-b border-sand-200 px-5 py-3 sm:px-6">
              <div className="flex min-w-max items-center gap-1.5">
                <span className="mr-1 text-xs font-medium text-ink-muted">Prijzen:</span>
                {(['goedkoopst', ...WINKELS.map((w) => w.id)] as Weergave[]).map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWeergave(w)}
                    className={`h-8 rounded-full px-3 text-[0.8rem] font-medium ring-1 ring-inset transition ${
                      weergave === w ? 'bg-ink text-sand-50 ring-ink' : 'bg-white/70 text-ink-soft ring-sand-300 hover:ring-gold-400'
                    }`}
                  >
                    {w === 'goedkoopst' ? 'Goedkoopst per artikel' : winkelNaam(w)}
                  </button>
                ))}
              </div>
            </div>

            {inkoop.regels.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-ink-muted">De inkooplijst is leeg. Kies werkzaamheden en vul de maten in.</p>
            ) : (
              <div className="divide-y divide-sand-200">
                {inkoop.groepen.map((g) => {
                  const Icon = GROEP_ICONS[g.id]
                  return (
                    <section key={g.id} className="py-2">
                      <h4 className="flex items-center gap-2 px-5 pt-3 pb-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold-700 sm:px-6">
                        <Icon className="h-3.5 w-3.5" /> {g.naam}
                      </h4>
                      <ul>
                        {g.regels.map((r) => {
                          const aan = !!p.afgevinkt[r.sleutel]
                          const a = prijsVoor(r)
                          return (
                            <li key={r.sleutel}>
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={aan}
                                onClick={() => wissel(r.sleutel)}
                                className="flex w-full items-start gap-3.5 px-5 py-3 text-left transition hover:bg-sand-50 sm:px-6"
                              >
                                <Checkbox checked={aan} className="mt-0.5" />
                                <span className={`min-w-0 flex-1 ${aan ? 'opacity-50' : ''}`}>
                                  <span className={`block text-[0.92rem] font-medium text-ink ${aan ? 'line-through decoration-gold-500/70' : ''}`}>
                                    <span className="tabnum mr-1.5 font-semibold text-gold-700">{r.aantal}×</span>
                                    {r.naam}
                                  </span>
                                  <span className="mt-0.5 block text-[0.78rem] text-ink-muted">
                                    {[r.spec, r.verpakking === 'stuk' || r.verpakking === 'set' ? '' : r.verpakking].filter(Boolean).join(' · ') || r.verpakking}
                                  </span>
                                </span>
                                <span className={`shrink-0 text-right ${aan ? 'opacity-50' : ''}`}>
                                  {a ? (
                                    <>
                                      <span className="tabnum block text-[0.92rem] font-semibold text-ink">{euro(a.totaal)}</span>
                                      <span className="mt-1 inline-flex">
                                        {weergave === 'goedkoopst' ? (
                                          <Badge tone="gold">{winkelNaam(a.winkel)}</Badge>
                                        ) : (
                                          <span className="text-[0.72rem] text-ink-muted">
                                            {euro(a.prijs)}/{prijsEenheid(r.id)}
                                          </span>
                                        )}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-[0.75rem] text-ink-muted">Niet in assortiment</span>
                                  )}
                                </span>
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    </section>
                  )
                })}
              </div>
            )}
            <div className="flex items-center justify-between gap-3 border-t border-sand-200 bg-sand-50 px-5 py-4 sm:px-6">
              <Button size="sm" variant="ghost" icon={<RotateCcw className="h-3.5 w-3.5" />} disabled={!afgevinkt} onClick={() => projectStore.werkBij(p.id, (x) => ({ ...x, afgevinkt: {} }))}>
                Vinkjes wissen
              </Button>
              <p className="text-right">
                <span className="block text-[0.7rem] font-semibold uppercase tracking-wider text-ink-muted">
                  {weergave === 'goedkoopst' ? 'Totaal goedkoopst' : `Totaal ${winkelNaam(weergave)}`}
                </span>
                <span className="tabnum font-display text-[1.6rem] leading-tight font-semibold">{euro(totaalWeergave)}</span>
              </p>
            </div>
          </Card>
        </div>

        <aside className="order-1 space-y-5 lg:sticky lg:top-24 lg:order-2">
          <Card className="overflow-hidden">
            <div className="bg-ink px-5 py-5 text-sand-50 sm:px-6">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-gold-300">Richtprijs materiaal</p>
              <p className="tabnum mt-1.5 font-display text-[2.4rem] leading-none font-semibold">{euro(inkoop.goedkoopsteMix)}</p>
              <p className="mt-2 text-xs text-sand-300">Goedkoopste winkel per artikel · incl. btw · voorbeeld</p>
            </div>
            <div className="px-5 py-4 sm:px-6">
              <p className="mb-2 flex items-center gap-2 text-[0.82rem] font-semibold text-ink">
                <Store className="h-4 w-4 text-gold-600" /> Alles bij één winkel
              </p>
              <ul className="divide-y divide-sand-200">
                {[...inkoop.perWinkel]
                  .sort((a, b) => a.ontbrekend - b.ontbrekend || a.totaal - b.totaal)
                  .map((w) => (
                    <li key={w.winkel}>
                      <button
                        type="button"
                        onClick={() => setWeergave(w.winkel)}
                        className={`-mx-2 flex w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-sand-50 ${weergave === w.winkel ? 'bg-sand-50' : ''}`}
                      >
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 text-[0.9rem] font-medium text-ink">
                            {winkelNaam(w.winkel)}
                            {w.winkel === goedkoopsteWinkel?.winkel && <Badge tone="sage">{w.ontbrekend ? 'Goedkoopst' : 'Beste keus'}</Badge>}
                          </span>
                          <span className="block text-[0.72rem] text-ink-muted">
                            {w.ontbrekend ? `${w.ontbrekend} artikel${w.ontbrekend > 1 ? 'en' : ''} niet in assortiment` : 'Alle artikelen beschikbaar'}
                          </span>
                        </span>
                        <span className="tabnum shrink-0 text-[0.95rem] font-semibold">{euro(w.totaal)}</span>
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
