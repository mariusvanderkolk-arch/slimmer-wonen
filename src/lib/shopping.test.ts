import { describe, expect, it } from 'vitest'
import { berekenMaterialen } from './calc'
import { voorbeeldProjecten } from './defaults'
import { voorbeeldPrijsBron, type PrijsBron } from './prices'
import { maakInkooplijst } from './shopping'

describe('inkooplijst', () => {
  const p = voorbeeldProjecten()[0]
  const lijst = maakInkooplijst(berekenMaterialen(p), voorbeeldPrijsBron)

  it('markeert voorbeeldprijzen als voorbeeld', () => {
    expect(lijst.bron.isVoorbeeld).toBe(true)
  })

  it('kiest per regel de goedkoopste winkel', () => {
    for (const r of lijst.regels) {
      if (!r.goedkoopste) continue
      for (const a of r.aanbiedingen) expect(r.goedkoopste.totaal).toBeLessThanOrEqual(a.totaal)
    }
  })

  it('tegels worden per m² geprijsd (dozen × m² per doos)', () => {
    const r = lijst.regels.find((x) => x.id === 'wandtegel')!
    const gamma = r.aanbiedingen.find((a) => a.winkel === 'gamma')!
    expect(gamma.totaal).toBeCloseTo(24.95 * r.aantal * p.wandtegel.m2PerDoos, 2)
  })

  it('goedkoopste mix is nooit duurder dan de goedkoopste complete winkel', () => {
    if (lijst.besteEnkeleWinkel) expect(lijst.goedkoopsteMix).toBeLessThanOrEqual(lijst.besteEnkeleWinkel.totaal)
  })

  it('telt ontbrekende artikelen per winkel', () => {
    const karwei = lijst.perWinkel.find((w) => w.winkel === 'karwei')!
    expect(karwei.ontbrekend).toBeGreaterThan(0) // afdichtmanchet & bigbag niet in voorbeeldtabel
  })

  it('werkt met een eigen (echte) prijsbron', () => {
    const bron: PrijsBron = {
      id: 'test',
      naam: 'Test',
      isVoorbeeld: false,
      peildatum: '2026-01-01',
      aanbiedingen: () => [{ winkel: 'gamma', prijs: 1 }],
    }
    const l = maakInkooplijst(berekenMaterialen(p), bron)
    expect(l.perWinkel.find((w) => w.winkel === 'gamma')!.ontbrekend).toBe(0)
    expect(l.besteEnkeleWinkel?.winkel).toBe('gamma')
  })
})
