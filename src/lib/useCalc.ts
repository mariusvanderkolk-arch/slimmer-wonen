import { useMemo } from 'react'
import { berekenArbeid, berekenMaterialen, berekenOppervlakken } from './calc'
import type { PrijsBron } from './prices'
import { usePrijsBron } from './prijsStore'
import { maakInkooplijst } from './shopping'
import type { Project } from './types'

export function berekenAlles(p: Project, bron: PrijsBron) {
  const oppervlakken = berekenOppervlakken(p.afmetingen, p.scope)
  const materialen = berekenMaterialen(p)
  const inkoop = maakInkooplijst(materialen, bron)
  const arbeid = berekenArbeid(p)
  const uren = arbeid.reduce((s, r) => s + r.uren, 0)
  return { oppervlakken, materialen, inkoop, arbeid, uren, arbeidKosten: uren * p.uurtarief }
}

/** Berekening voor een project met de actieve prijsbron (eigen prijzen gaan voor voorbeeldprijzen). */
export function useBerekening(p: Project) {
  const bron = usePrijsBron()
  return useMemo(() => berekenAlles(p, bron), [p, bron])
}
