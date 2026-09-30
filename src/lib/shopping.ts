/** Maakt van de berekende materialen een inkooplijst met (voorbeeld)prijzen per winkel. */
import { GROEPEN, type Groep, type MateriaalRegel } from './calc'
import { WINKELS, type PrijsBron, type WinkelId } from './prices'

export interface RegelAanbod {
  winkel: WinkelId
  prijs: number
  totaal: number
}

export interface InkoopRegel extends MateriaalRegel {
  sleutel: string
  aanbiedingen: RegelAanbod[]
  goedkoopste?: RegelAanbod
}

export interface WinkelTotaal {
  winkel: WinkelId
  totaal: number
  /** aantal regels dat deze winkel (in de prijstabel) niet heeft */
  ontbrekend: number
}

export interface Inkooplijst {
  regels: InkoopRegel[]
  groepen: { id: Groep; naam: string; regels: InkoopRegel[] }[]
  perWinkel: WinkelTotaal[]
  /** som van de goedkoopste prijs per regel (winkels combineren) */
  goedkoopsteMix: number
  /** goedkoopste winkel als je alles bij één winkel koopt (alleen winkels met alle artikelen) */
  besteEnkeleWinkel?: WinkelTotaal
  bron: PrijsBron
}

const cent = (n: number) => Math.round(n * 100) / 100

export function maakInkooplijst(materialen: MateriaalRegel[], bron: PrijsBron): Inkooplijst {
  const regels: InkoopRegel[] = materialen.map((m) => {
    const aanbiedingen = bron
      .aanbiedingen(m.id)
      .map((a) => ({ winkel: a.winkel, prijs: a.prijs, totaal: cent(a.prijs * m.prijsAantal) }))
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
  return { regels, groepen, perWinkel, goedkoopsteMix, besteEnkeleWinkel: volledig[0], bron }
}
