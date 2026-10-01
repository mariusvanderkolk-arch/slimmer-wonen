import { LogoMark } from './Logo'
import { euro } from '../lib/format'
import { datumNl } from '../lib/offerte'
import { btwOverzicht, effectieveStatus, STATUS_LABEL, type Factuur } from '../lib/factuur'

/** Printklare factuur in dezelfde stijl als de offerte. */
export function FactuurDocument({ f, logo, vandaag }: { f: Factuur; logo?: string; vandaag: string }) {
  const b = f.bedrijf
  const o = btwOverzicht(f.regels)
  const status = effectieveStatus(f, vandaag)
  const contact = [b.telefoon, b.email, b.website].filter(Boolean)
  const materiaal = f.regels.filter((r) => r.soort === 'materiaal')
  const arbeid = f.regels.filter((r) => r.soort === 'arbeid')
  const heeft9 = f.regels.some((r) => r.btw === 9)
  const Rijen = ({ titel, regels }: { titel: string; regels: Factuur['regels'] }) =>
    regels.length ? (
      <>
        <tr>
          <th colSpan={3} scope="colgroup" className="pt-5 pb-1 text-left text-[0.68rem] font-semibold tracking-wider text-gold-700 uppercase">
            {titel}
          </th>
        </tr>
        {regels.map((r) => (
          <tr key={r.id} className="avoid-break border-b border-sand-200 align-top">
            <td className="py-2 pr-3">
              <span className="font-medium text-ink">{r.omschrijving.split(' · ')[0]}</span>
              {r.omschrijving.includes(' · ') && <span className="text-ink-muted"> · {r.omschrijving.split(' · ').slice(1).join(' · ')}</span>}
              {r.detail && <span className="block text-[0.78rem] text-ink-muted">{r.detail}</span>}
            </td>
            <td className="tabnum py-2 pr-3 text-right whitespace-nowrap text-ink-soft">{r.btw}%</td>
            <td className="tabnum py-2 text-right whitespace-nowrap">{euro(r.excl)}</td>
          </tr>
        ))}
      </>
    ) : null

  return (
    <article className="card print-plain @container overflow-hidden">
      <div className="px-6 pt-8 pb-6 sm:px-10 sm:pt-10">
        <header className="flex flex-col gap-6 @2xl:flex-row @2xl:items-start @2xl:justify-between print:flex-row print:justify-between">
          <div className="flex min-w-0 items-center gap-3.5">
            {logo ? <img src={logo} alt={b.naam ? `Logo ${b.naam}` : 'Logo'} className="h-14 w-auto max-w-[9rem] object-contain" /> : !b.naam && <LogoMark className="h-12 w-12" />}
            <div className="min-w-0 leading-tight">
              <p className="font-display text-[1.6rem] leading-none font-semibold">{b.naam || 'Je bedrijfsnaam'}</p>
              {b.adres && <p className="mt-1.5 text-[0.78rem] text-ink-muted">{b.adres}</p>}
              {contact.length > 0 && <p className="text-[0.78rem] text-ink-muted">{contact.join(' · ')}</p>}
            </div>
          </div>
          <div className="text-left @2xl:text-right print:text-right">
            <p className="font-display text-[2rem] leading-none font-semibold">
              Factuur
              {status !== 'concept' && status !== 'verzonden' && (
                <span className={`no-print ml-3 inline-block translate-y-[-0.35rem] rounded-full px-2.5 py-0.5 align-middle font-sans text-[0.7rem] font-semibold ${status === 'betaald' ? 'bg-[#e8eee4] text-[#4c6547]' : 'bg-rust/10 text-rust'}`}>
                  {STATUS_LABEL[status]}
                </span>
              )}
            </p>
            <p className="tabnum mt-1.5 text-sm font-semibold text-ink">{f.nummer}</p>
          </div>
        </header>
        <div className="gold-rule mt-6" />

        <div className="mt-6 grid gap-6 text-sm @2xl:grid-cols-2 print:grid-cols-2">
          <div>
            <p className="text-[0.68rem] font-semibold tracking-wider text-ink-muted uppercase">Factuur aan</p>
            <p className="mt-1 font-semibold text-ink">{f.klant || '—'}</p>
            {f.adres && <p className="text-ink-soft">{f.adres}</p>}
            {f.project && <p className="mt-1 text-ink-muted">Project: {f.project}</p>}
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 @2xl:justify-self-end print:justify-self-end">
            <dt className="text-ink-muted">Factuurdatum</dt>
            <dd className="font-medium">{datumNl(f.datum)}</dd>
            <dt className="text-ink-muted">Vervaldatum</dt>
            <dd className="font-medium">{datumNl(f.vervaldatum)}</dd>
            {f.offerteNummer && f.offerteNummer !== '—' && (
              <>
                <dt className="text-ink-muted">Offerte</dt>
                <dd className="tabnum font-medium">{f.offerteNummer}</dd>
              </>
            )}
          </dl>
        </div>

        <section className="mt-6">
          <h2 className="sr-only">Factuurregels</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-300 text-left text-[0.68rem] font-semibold tracking-wider text-ink-muted uppercase">
                <th className="py-2 pr-3 font-semibold">Omschrijving</th>
                <th className="py-2 pr-3 text-right font-semibold">Btw</th>
                <th className="py-2 text-right font-semibold">Excl. btw</th>
              </tr>
            </thead>
            <tbody>
              <Rijen titel="Materialen" regels={materiaal} />
              <Rijen titel="Arbeid" regels={arbeid} />
            </tbody>
          </table>
        </section>

        <section className="avoid-break mt-6 flex justify-end">
          <h2 className="sr-only">Totaal en btw</h2>
          <dl className="tabnum grid w-full max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 text-sm">
            <dt className="text-ink-soft">Subtotaal excl. btw</dt>
            <dd className="text-right">{euro(o.totaalExcl)}</dd>
            {o.perTarief.map((t) => (
              <div key={t.tarief} className="contents">
                <dt className="text-ink-soft">
                  Btw {t.tarief}% <span className="text-ink-muted">over {euro(t.grondslag)}</span>
                </dt>
                <dd className="text-right">{euro(t.btw)}</dd>
              </div>
            ))}
            <dt className="mt-2 border-t border-sand-300 pt-2.5 font-semibold text-ink">Totaal te betalen</dt>
            <dd className="mt-2 border-t border-sand-300 pt-2.5 text-right font-display text-[1.5rem] leading-none font-semibold">{euro(o.totaalIncl)}</dd>
          </dl>
        </section>

        <section className="avoid-break mt-8 rounded-2xl bg-sand-50 px-5 py-4 text-sm ring-1 ring-sand-200 print:ring-sand-300">
          <h2 className="font-sans text-[0.9rem] font-semibold tracking-normal">Betaling</h2>
          <p className="mt-1 text-ink-soft">
            Graag {euro(o.totaalIncl)} overmaken vóór <strong className="text-ink">{datumNl(f.vervaldatum)}</strong>
            {b.iban ? (
              <>
                {' '}
                op <strong className="tabnum text-ink">{b.iban}</strong>
                {b.naam ? ` t.n.v. ${b.naam}` : ''}
              </>
            ) : null}
            , onder vermelding van <strong className="tabnum text-ink">{f.nummer}</strong>.
          </p>
          {heeft9 && <p className="mt-2 text-[0.78rem] text-ink-muted">9% btw op arbeid: renovatie en herstel van een woning die ouder is dan 2 jaar.</p>}
          {f.notitie && <p className="mt-2 whitespace-pre-line text-ink-soft">{f.notitie}</p>}
          {status === 'betaald' && f.betaaldOp && <p className="no-print mt-2 font-medium text-[#4c6547]">Betaald op {datumNl(f.betaaldOp)}. Dank je wel!</p>}
        </section>

        <footer className="mt-8 border-t border-sand-200 pt-4 text-center text-[0.72rem] leading-relaxed text-ink-muted">
          {[b.naam, b.kvk && `KvK ${b.kvk}`, b.btw && `btw-id ${b.btw}`, b.iban && `IBAN ${b.iban}`].filter(Boolean).join(' · ') || 'Vul je bedrijfsgegevens in bij Instellingen.'}
        </footer>
      </div>
    </article>
  )
}
