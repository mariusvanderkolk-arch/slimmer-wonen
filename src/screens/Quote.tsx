import { useState } from 'react'
import { Copy, Printer } from 'lucide-react'
import { LogoMark } from '../components/Logo'
import { Button, Card, NumberField } from '../components/ui'
import { toast } from '../components/Toast'
import { SCOPE_ITEMS } from '../lib/defaults'
import { datum, euro, getal } from '../lib/format'
import { winkelNaam } from '../lib/prices'
import { inkoopTekst, kopieer } from '../lib/share'
import { projectStore } from '../lib/store'
import { useBerekening } from '../lib/useCalc'
import type { Project } from '../lib/types'

export function Quote({ p }: { p: Project }) {
  const { oppervlakken: o, inkoop, arbeid, uren, arbeidKosten } = useBerekening(p)
  const [metArbeid, setMetArbeid] = useState(true)
  const nummer = `SW-${new Date(p.createdAt).getFullYear()}-${p.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`
  const totaal = inkoop.goedkoopsteMix + (metArbeid ? arbeidKosten : 0)
  const werk = SCOPE_ITEMS.filter((i) => p.scope[i.key])
  const st = inkoop.prijsStatus
  const gemengd = st.eigen > 0 && st.voorbeeld > 0
  const prijsTekst =
    st.eigen === 0
      ? 'Materiaalprijzen zijn richtprijzen (voorbeeld) en geen actuele winkelprijzen.'
      : st.voorbeeld === 0
        ? `Materiaalprijzen zijn eigen prijzen, bijgewerkt op ${st.laatstBijgewerkt ? datum(Date.parse(st.laatstBijgewerkt)) : '—'}.`
        : `Materiaalprijzen zijn deels eigen prijzen; bedragen met * zijn voorbeeldprijzen (${st.voorbeeld} van ${st.eigen + st.voorbeeld} prijzen).`

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
      <article className="card print-plain order-2 overflow-hidden lg:order-1">
        <div className="px-6 pt-8 pb-6 sm:px-10 sm:pt-10">
          <header className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-center gap-3">
              <LogoMark className="h-12 w-12" />
              <div className="leading-none">
                <p className="font-display text-[1.7rem] font-semibold">
                  Slimmer <span className="text-gold-600">Wonen</span>
                </p>
                <p className="mt-1 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-ink-muted">Renovatie · Calculatie</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="font-display text-[2rem] leading-none font-semibold">Offerte</p>
              <p className="mt-1.5 text-xs text-ink-muted">indicatieve raming</p>
              <dl className="mt-3 grid grid-cols-[auto_auto] gap-x-4 gap-y-0.5 text-[0.8rem] sm:justify-end">
                <dt className="text-ink-muted">Nummer</dt>
                <dd className="tabnum font-medium">{nummer}</dd>
                <dt className="text-ink-muted">Datum</dt>
                <dd className="font-medium">{datum(Date.now())}</dd>
              </dl>
            </div>
          </header>

          <div className="gold-rule my-7" />

          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-700">Opdrachtgever</p>
              <p className="mt-1.5 font-semibold">{p.klant || '—'}</p>
              {p.adres && <p className="text-sm text-ink-soft">{p.adres}</p>}
            </div>
            <div>
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-700">Project</p>
              <p className="mt-1.5 font-semibold">{p.naam}</p>
              <p className="text-sm text-ink-soft">
                Badkamer · {getal(p.afmetingen.lengte)} × {getal(p.afmetingen.breedte)} × {getal(p.afmetingen.hoogte)} m
              </p>
            </div>
          </div>

          <section className="avoid-break mt-8">
            <h3 className="font-display text-[1.35rem] font-semibold">Werkzaamheden</h3>
            <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-sm text-ink-soft sm:grid-cols-2">
              {werk.map((w) => (
                <li key={w.key} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-400" />
                  <span>
                    <span className="font-medium text-ink">{w.label}</span> — {w.omschrijving.toLowerCase()}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="avoid-break mt-8">
            <h3 className="font-display text-[1.35rem] font-semibold">Oppervlakken</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['Wandtegels', o.wandNetto],
                ['Vloer', o.vloer],
                ['Waterdicht', p.scope.waterdicht ? o.waterdichtOppervlak : 0],
                ['Stucwerk', p.scope.stucwerk ? o.plafond + o.wandBovenTegels : 0],
              ].map(([k, v]) => (
                <div key={k as string} className="rounded-xl bg-sand-50 px-3.5 py-3 ring-1 ring-sand-200">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-ink-muted">{k}</p>
                  <p className="tabnum mt-0.5 font-semibold">{getal(v as number)} m²</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h3 className="font-display text-[1.35rem] font-semibold">Materialen</h3>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[480px] text-sm">
                <thead>
                  <tr className="border-b border-sand-300 text-left text-[0.68rem] font-semibold uppercase tracking-wider text-ink-muted">
                    <th className="py-2 pr-3 font-semibold">Omschrijving</th>
                    <th className="py-2 pr-3 text-right font-semibold">Aantal</th>
                    <th className="py-2 pr-3 font-semibold">Winkel</th>
                    <th className="py-2 text-right font-semibold">Bedrag</th>
                  </tr>
                </thead>
                <tbody>
                  {inkoop.regels.map((r) => (
                    <tr key={r.sleutel} className="avoid-break border-b border-sand-200">
                      <td className="py-2 pr-3">
                        <span className="font-medium text-ink">{r.naam}</span>
                        {r.spec && <span className="text-ink-muted"> · {r.spec}</span>}
                      </td>
                      <td className="tabnum py-2 pr-3 text-right whitespace-nowrap">
                        {r.goedkoopste?.aantal ?? r.aantal}{' '}
                        <span className="text-ink-muted">× {(r.goedkoopste?.verpakking ?? r.verpakking).replace(/^(doos|zak|bus|emmer|rol|koker|lengte|plaat) à /, '$1 ')}</span>
                      </td>
                      <td className="py-2 pr-3 text-ink-soft">{r.goedkoopste ? winkelNaam(r.goedkoopste.winkel) : '—'}</td>
                      <td className="tabnum py-2 text-right whitespace-nowrap">
                        {r.goedkoopste ? euro(r.goedkoopste.totaal) : '—'}
                        {gemengd && r.goedkoopste?.bron === 'voorbeeld' && <span className="text-gold-600">*</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="pt-3 pr-3 text-right font-medium text-ink-soft">Subtotaal materialen</td>
                    <td className="tabnum pt-3 text-right font-semibold">{euro(inkoop.goedkoopsteMix)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {metArbeid && arbeid.length > 0 && (
            <section className="avoid-break mt-8">
              <h3 className="font-display text-[1.35rem] font-semibold">Arbeid</h3>
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {arbeid.map((a) => (
                    <tr key={a.scope} className="border-b border-sand-200">
                      <td className="py-2 pr-3 text-ink">{a.omschrijving}</td>
                      <td className="tabnum py-2 text-right whitespace-nowrap text-ink-soft">{getal(a.uren, 1)} uur</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="pt-3 pr-3 text-right font-medium text-ink-soft">
                      {getal(uren, 1)} uur × {euro(p.uurtarief)}
                    </td>
                    <td className="tabnum pt-3 text-right font-semibold">{euro(arbeidKosten)}</td>
                  </tr>
                </tfoot>
              </table>
            </section>
          )}

          <section className="avoid-break mt-8 rounded-2xl bg-ink px-6 py-5 text-sand-50">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-300">Totaal indicatief</p>
                <p className="mt-1 text-xs text-sand-300">
                  Materialen{metArbeid ? ' + arbeid' : ''} · incl. 21% btw
                </p>
              </div>
              <p className="tabnum font-display text-[2.3rem] leading-none font-semibold">{euro(totaal)}</p>
            </div>
          </section>

          <p className="mt-6 text-[0.72rem] leading-relaxed text-ink-muted">
            Deze raming is indicatief en gebaseerd op opgegeven maten en vuistregels. {prijsTekst} Arbeidsuren zijn een
            schatting. Aan deze raming kunnen geen rechten worden ontleend; een definitieve offerte volgt na inspectie ter plaatse.
          </p>
          {p.notities && (
            <div className="avoid-break mt-5 rounded-xl border border-sand-200 px-4 py-3 text-sm">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-700">Notities</p>
              <p className="mt-1 text-ink-soft">{p.notities}</p>
            </div>
          )}
        </div>
      </article>

      <aside className="no-print order-1 space-y-4 lg:sticky lg:top-24 lg:order-2">
        <Card className="p-5">
          <p className="text-[0.98rem] font-semibold">Offerte instellingen</p>
          <p className="mt-0.5 text-[0.82rem] text-ink-muted">Druk af of bewaar als PDF via je browser.</p>
          <label className="mt-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl bg-sand-50 px-3.5 py-3 ring-1 ring-sand-200">
            <span className="text-sm font-medium">Arbeid meenemen</span>
            <input type="checkbox" checked={metArbeid} onChange={(e) => setMetArbeid(e.target.checked)} className="peer sr-only" />
            <span className="relative h-6 w-11 rounded-full bg-sand-300 transition peer-checked:bg-gold-500 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
          </label>
          {metArbeid && (
            <div className="mt-3">
              <NumberField label="Uurtarief (incl. btw)" unit="€" value={p.uurtarief} onChange={(v) => projectStore.werkBij(p.id, (x) => ({ ...x, uurtarief: v }))} />
            </div>
          )}
          <label className="mt-4 block">
            <span className="mb-1.5 block text-[0.8rem] font-medium text-ink-soft">Notities op offerte</span>
            <textarea
              rows={3}
              value={p.notities}
              onChange={(e) => projectStore.werkBij(p.id, (x) => ({ ...x, notities: e.target.value }))}
              className="w-full resize-none rounded-xl border border-sand-300 bg-white/80 px-3.5 py-2.5 text-sm focus:border-gold-400 focus:ring-4 focus:ring-gold-200/50 focus:outline-none"
              placeholder="Bijv. afspraken of uitgangspunten"
            />
          </label>
          <div className="mt-4 grid gap-2">
            <Button icon={<Printer className="h-4 w-4" />} onClick={() => window.print()}>
              Afdrukken / PDF
            </Button>
            <Button
              variant="secondary"
              icon={<Copy className="h-4 w-4" />}
              onClick={async () => toast((await kopieer(inkoopTekst(p, inkoop))) === 'gekopieerd' ? 'Materiaallijst gekopieerd' : 'Kopiëren mislukt')}
            >
              Kopieer materiaallijst
            </Button>
          </div>
        </Card>
      </aside>
    </div>
  )
}
