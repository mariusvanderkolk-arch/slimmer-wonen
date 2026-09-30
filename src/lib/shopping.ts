/** Maakt van de berekende materialen een inkooplijst met prijzen per winkel. */
import { GROEPEN, omhoog, type Groep, type MateriaalRegel } from './calc'
import { WINKELS, type PrijsBron, type WinkelId } from './prices'

export interface RegelAanbod {
  winkel: WinkelId
  /** prijs per prijseenheid (m² of verpakking/stuk) */
  prijs: number
  /** totaal voor deze regel bij deze winkel */
  totaal: number
  /** aantal te kopen verpakkingen bij deze winkel (kan afwijken bij een andere verpakkingsgrootte) */
  aantal: number
  verpakking: string
  bron: 'eigen' | 'voorbeeld'
  productNaam?: string
  link?: string
  bijgewerkt?: string
}

export interface InkoopRegel extends MateriaalRegel {
  sleutel: string
  aanbiedingen: RegelAanbod[]
  goedkoopste?: RegelAanbod
}

export interface WinkelTotaal {
  winkel: WinkelId
  totaal: number
  /** aantal regels dat deze winkel niet heeft */
  ontbrekend: number
}

export interface PrijsStatus {
  /** aantal gebruikte prijzen (regels × winkels) dat een eigen prijs is */
  eigen: number
  /** aantal gebruikte prijzen dat nog een voorbeeldprijs is */
  voorbeeld: number
  /** meest recente wijziging van de gebruikte eigen prijzen (ISO) */
  laatstBijgewerkt?: string
}

export interface Inkooplijst {
  regels: InkoopRegel[]
  groepen: { id: Groep; naam: string; regels: InkoopRegel[] }[]
  perWinkel: WinkelTotaal[]
  /** som van de goedkoopste prijs per regel (winkels combineren) */
  goedkoopsteMix: number
  /** goedkoopste winkel als je alles bij één winkel koopt (alleen winkels met alle artikelen) */
  besteEnkeleWinkel?: WinkelTotaal
  prijsStatus: PrijsStatus
  bron: PrijsBron
}

const cent = (n: number) => Math.round(n * 100) / 100
const nl = (n: number) => new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 }).format(n)

export function maakInkooplijst(materialen: MateriaalRegel[], bron: PrijsBron): Inkooplijst {
  const status: PrijsStatus = { eigen: 0, voorbeeld: 0 }
  const regels: InkoopRegel[] = materialen.map((m) => {
    const aanbiedingen = bron
      .aanbiedingen(m.id)
      .map((a): RegelAanbod => {
        const herkomst = a.bron ?? (bron.isVoorbeeld ? 'voorbeeld' : 'eigen')
        // Andere verpakkingsgrootte bij deze winkel → aantal opnieuw berekenen.
        const anders = a.inhoud != null && a.inhoud > 0 && m.inhoud != null && Math.abs(a.inhoud - m.inhoud) > 1e-9
        const aantal = anders ? Math.max(1, omhoog(m.nodig / a.inhoud!)) : m.aantal
        const prijsAantal = anders ? aantal : m.prijsAantal
        const verpakking = anders ? `${m.verpakkingSoort ?? 'verpakking'} à ${nl(a.inhoud!)} ${m.nodigEenheid}` : m.verpakking
        if (herkomst === 'eigen') {
          status.eigen++
          if (a.bijgewerkt && (!status.laatstBijgewerkt || a.bijgewerkt > status.laatstBijgewerkt)) status.laatstBijgewerkt = a.bijgewerkt
        } else status.voorbeeld++
        return {
          winkel: a.winkel,
          prijs: a.prijs,
          totaal: cent(a.prijs * prijsAantal),
          aantal,
          verpakking,
          bron: herkomst,
          productNaam: a.productNaam,
          link: a.link,
          bijgewerkt: a.bijgewerkt,
        }
      })
      .sort((a, b) => a.totaal - b.totaal)
    return { ...m, sleutel: m.id, aanbiedingen, goedkoopste: aanbiedingen[0] }
  })
  const perWinkel: WinkelTotaal[] = WINKELS.map((w) => {
    let totaal = 0
    let ontbrekend = 0
    for (const r of regels) {
      const a = r.aanbiedingen.find((x) => x.winkel === w.id)
      if (a) totaal += a.totaal
      else ontbrekend++
    }
    return { winkel: w.id, totaal: cent(totaal), ontbrekend }
  })
  const goedkoopsteMix = cent(regels.reduce((s, r) => s + (r.goedkoopste?.totaal ?? 0), 0))
  const volledig = perWinkel.filter((w) => w.ontbrekend === 0).sort((a, b) => a.totaal - b.totaal)
  const groepen = GROEPEN.map((g) => ({ ...g, regels: regels.filter((r) => r.groep === g.id) })).filter((g) => g.regels.length)
  return { regels, groepen, perWinkel, goedkoopsteMix, besteEnkeleWinkel: volledig[0], prijsStatus: status, bron }
}
