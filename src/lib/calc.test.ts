import { describe, expect, it } from 'vitest'
import {
  REGELS,
  berekenArbeid,
  berekenMaterialen,
  berekenOppervlakken,
  kitLengte,
  omhoog,
  openingInTegelzone,
  profielLengte,
  tegelBehoefte,
  voegKgPerM2,
} from './calc'
import { nieuwProject, voorbeeldProjecten } from './defaults'
import type { Project } from './types'

const basis = (): Project =>
  nieuwProject({
    afmetingen: {
      lengte: 2.5,
      breedte: 2,
      hoogte: 2.6,
      tegelhoogte: 2.6,
      openingen: [
        { id: 'd', type: 'deur', breedte: 0.8, hoogte: 2.1, vanafVloer: 0 },
        { id: 'r', type: 'raam', breedte: 0.6, hoogte: 0.6, vanafVloer: 1.4 },
      ],
      douche: { breedte: 0.9, diepte: 1.2 },
      egaliseerDikte: 3,
    },
    wandtegel: { lengte: 60, breedte: 30, m2PerDoos: 1.44, dikte: 9, voeg: 3 },
    vloertegel: { lengte: 60, breedte: 60, m2PerDoos: 1.44, dikte: 10, voeg: 3 },
    snijverlies: 10,
  })

const regel = (p: Project, id: string) => berekenMaterialen(p).find((r) => r.id === id)

describe('omhoog', () => {
  it('rondt naar boven af zonder floating-point fouten', () => {
    expect(omhoog(3)).toBe(3)
    expect(omhoog(0.1 * 3 * 10)).toBe(3)
    expect(omhoog(3.01)).toBe(4)
    expect(omhoog(0)).toBe(0)
    expect(omhoog(-2)).toBe(0)
  })
})

describe('oppervlakken', () => {
  it('berekent omtrek, wand bruto/netto en vloer', () => {
    const p = basis()
    const o = berekenOppervlakken(p.afmetingen, p.scope)
    expect(o.omtrek).toBeCloseTo(9)
    expect(o.wandBruto).toBeCloseTo(23.4)
    expect(o.openingenAftrek).toBeCloseTo(0.8 * 2.1 + 0.6 * 0.6)
    expect(o.wandNetto).toBeCloseTo(23.4 - 2.04)
    expect(o.vloer).toBeCloseTo(5)
    expect(o.wandBovenTegels).toBeCloseTo(0)
  })

  it('trekt bij halfhoog tegelwerk alleen het deel van de opening in de tegelzone af', () => {
    const p = basis()
    p.afmetingen.tegelhoogte = 1.2
    const o = berekenOppervlakken(p.afmetingen, p.scope)
    // deur: 0,8 × 1,2 ; raam begint op 1,4 → valt er volledig boven
    expect(o.openingenAftrek).toBeCloseTo(0.96)
    expect(o.wandNetto).toBeCloseTo(9 * 1.2 - 0.96)
    // boven de tegels: 9 × 1,4 − deur 0,8 × 0,9 − raam 0,36
    expect(o.wandBovenTegels).toBeCloseTo(12.6 - 0.72 - 0.36)
  })

  it('begrenst tegelhoogte op de ruimtehoogte', () => {
    const p = basis()
    p.afmetingen.tegelhoogte = 3.5
    expect(berekenOppervlakken(p.afmetingen, p.scope).tegelhoogte).toBe(2.6)
  })

  it('telt douchewanden mee voor waterdicht bij een inloopdouche', () => {
    const p = basis()
    const o = berekenOppervlakken(p.afmetingen, { inloopdouche: true })
    expect(o.douchezoneWand).toBeCloseTo((0.9 + 1.2) * 2.1)
    expect(o.waterdichtOppervlak).toBeCloseTo(5 + 4.41)
    expect(berekenOppervlakken(p.afmetingen, { inloopdouche: false }).douchezoneWand).toBe(0)
  })

  it('opening in tegelzone: raam gedeeltelijk boven de tegels', () => {
    expect(openingInTegelzone({ id: 'x', type: 'raam', breedte: 1, hoogte: 1, vanafVloer: 1 }, 1.5)).toBeCloseTo(0.5)
  })
})

describe('tegels', () => {
  it('rekent snijverlies en hele dozen', () => {
    const t = tegelBehoefte(21.36, { lengte: 60, breedte: 30, m2PerDoos: 1.44, dikte: 9, voeg: 3 }, 10)
    expect(t.m2Incl).toBeCloseTo(23.496)
    expect(t.dozen).toBe(17) // 23,496 / 1,44 = 16,3
    expect(t.stuks).toBe(131) // 23,496 / 0,18 = 130,5
    expect(t.m2Gekocht).toBeCloseTo(24.48)
  })

  it('snijverlies is instelbaar', () => {
    const p = basis()
    p.snijverlies = 15
    expect(regel(p, 'vloertegel')!.nodig).toBeCloseTo(5 * 1.15)
  })
})

describe('lijm en voeg', () => {
  it('lijmverbruik hangt af van tegelformaat', () => {
    expect(REGELS.lijmKgPerM2(20)).toBe(3.5)
    expect(REGELS.lijmKgPerM2(60)).toBe(4.5)
    expect(REGELS.lijmKgPerM2(120)).toBe(5.5)
  })

  it('tegellijm voor wand + vloer in zakken van 25 kg', () => {
    const r = regel(basis(), 'tegellijm')!
    expect(r.nodig).toBeCloseTo(21.36 * 4.5 + 5 * 4.5)
    expect(r.aantal).toBe(5) // 118,6 kg
  })

  it('voegmiddel volgens fabrikantformule', () => {
    expect(voegKgPerM2({ lengte: 60, breedte: 30, m2PerDoos: 1, dikte: 9, voeg: 3 })).toBeCloseTo(0.216)
    expect(voegKgPerM2({ lengte: 0, breedte: 30, m2PerDoos: 1, dikte: 9, voeg: 3 })).toBe(0)
  })
})

describe('waterdicht, kit en profielen', () => {
  it('waterdichting in emmers van 7 kg', () => {
    const r = regel(basis(), 'waterdicht')!
    expect(r.nodig).toBeCloseTo((5 + 4.41) * 1.4)
    expect(r.aantal).toBe(2)
  })

  it('kitlengte telt naden, hoeken en sanitair', () => {
    const p = basis()
    const o = berekenOppervlakken(p.afmetingen, p.scope)
    // (9 − 0,8) + 4 × 2,6 + (4 + 0,9) + 1,2 + 1,5
    expect(kitLengte(p, o)).toBeCloseTo(8.2 + 10.4 + 4.9 + 1.2 + 1.5)
    expect(regel(p, 'kit')!.aantal).toBe(4) // 26,2 m / 8
  })

  it('profielen: geen bovenrand bij tegelen tot plafond, wel raamdagkanten', () => {
    const p = basis()
    const o = berekenOppervlakken(p.afmetingen, p.scope)
    expect(profielLengte(p, o)).toBeCloseTo(2 * 0.6 + 2 * 0.6)
    p.afmetingen.tegelhoogte = 1.2
    const o2 = berekenOppervlakken(p.afmetingen, p.scope)
    expect(profielLengte(p, o2)).toBeCloseTo(8.2) // raam valt buiten tegelzone
  })
})

describe('scope', () => {
  it('geen tegels geselecteerd → geen tegels, lijm of voeg', () => {
    const p = basis()
    p.scope.wandtegels = false
    p.scope.vloertegels = false
    const ids = berekenMaterialen(p).map((r) => r.id)
    expect(ids).not.toContain('wandtegel')
    expect(ids).not.toContain('tegellijm')
    expect(ids).not.toContain('voegmiddel')
  })

  it('vloerverwarming voegt mat, thermostaat en isolatie toe', () => {
    const p = basis()
    p.scope.vloerverwarming = true
    expect(regel(p, 'vv-mat')!.nodig).toBe(3.5) // 5 × 0,7
    expect(regel(p, 'vv-thermostaat')!.aantal).toBe(1)
    expect(regel(p, 'isolatieplaat')!.aantal).toBe(7)
  })

  it('egaliseermiddel op basis van laagdikte', () => {
    const r = regel(basis(), 'egaliseer')!
    expect(r.nodig).toBeCloseTo(5 * 3 * 1.6)
    expect(r.aantal).toBe(1)
  })

  it('stucwerk rekent plafond en wand boven de tegels', () => {
    const p = basis()
    p.scope.stucwerk = true
    p.afmetingen.tegelhoogte = 1.2
    const r = regel(p, 'pleister')!
    expect(r.nodig).toBeCloseTo((5 + 11.52) * 2.4)
  })

  it('alle regels hebben positieve aantallen en een toelichting', () => {
    for (const p of voorbeeldProjecten()) {
      for (const r of berekenMaterialen(p)) {
        expect(r.aantal).toBeGreaterThan(0)
        expect(r.toelichting.length).toBeGreaterThan(3)
        expect(Number.isFinite(r.prijsAantal)).toBe(true)
      }
    }
  })

  it('lege maten geven geen fouten', () => {
    const p = basis()
    p.afmetingen = { ...p.afmetingen, lengte: 0, breedte: 0, hoogte: 0, tegelhoogte: 0, openingen: [] }
    expect(() => berekenMaterialen(p)).not.toThrow()
    expect(berekenMaterialen(p).find((r) => r.id === 'wandtegel')).toBeUndefined()
  })
})

describe('arbeid', () => {
  it('geeft uren per geselecteerd onderdeel', () => {
    const p = basis()
    const a = berekenArbeid(p)
    expect(a.find((r) => r.scope === 'wandtegels')!.uren).toBeCloseTo(23.5, 1)
    expect(a.find((r) => r.scope === 'toilet')!.uren).toBe(5)
    expect(a.find((r) => r.scope === 'stucwerk')).toBeUndefined()
  })
})
