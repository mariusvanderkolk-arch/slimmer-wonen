import { useMemo } from 'react'
import { berekenArbeid, berekenMaterialen, berekenOppervlakken } from './calc'
import { voorbeeldPrijsBron } from './prices'
import { maakInkooplijst } from './shopping'
import type { Project } from './types'

/** Actieve prijsbron. Vervang door een echte bron om live prijzen te tonen. */
export const actievePrijsBron = voorbeeldPrijsBron

export function berekenAlles(p: Project) {
  const oppervlakken = berekenOppervlakken(p.afmetingen, p.scope)
  const materialen = berekenMaterialen(p)
  const inkoop = maakInkooplijst(materialen, actievePrijsBron)
  const arbeid = berekenArbeid(p)
  const uren = arbeid.reduce((s, r) => s + r.uren, 0)
  return { oppervlakken, materialen, inkoop, arbeid, uren, arbeidKosten: uren * p.uurtarief }
}

export const useBerekening = (p: Project) => useMemo(() => berekenAlles(p), [p])
