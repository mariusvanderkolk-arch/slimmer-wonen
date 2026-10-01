import { CATALOGUS } from './catalogus'
import { describe, expect, it } from 'vitest'
import { berekenMaterialen } from './calc'
import { voorbeeldProjecten } from './defaults'
import {
  importeerPrijzen,
  laatstBijgewerkt,
  metEigenPrijzen,
  naarCsv,
  naarJson,
  parseCsv,
  telEigenPrijzen,
  vanCsv,
  vanJson,
  verwijderEigenPrijs,
  voegSamen,
  zetEigenPrijs,
  type EigenPrijzen,
} from './eigenPrijzen'
import { VOORBEELD_PRIJSTABEL, voorbeeldPrijsBron } from './prices'
import { maakInkooplijst } from './shopping'

const T1 = new Date('2026-09-20T10:00:00Z')
const T2 = new Date('2026-09-28T15:30:00Z')
const project = voorbeeldProjecten()[0]
const materialen = berekenMaterialen(project)

describe('eigen prijzen overschrijven voorbeeldprijzen', () => {
  it('zonder eigen prijzen is de bron gelijk aan het voorbeeld', () => {
    const bron = metEigenPrijzen(voorbeeldPrijsBron, {})
    expect(bron.isVoorbeeld).toBe(true)
    expect(bron.aanbiedingen('tegellijm')).toEqual(voorbeeldPrijsBron.aanbiedingen('tegellijm'))
  })

  it('eigen prijs gaat voor de voorbeeldprijs, andere winkels blijven voorbeeld', () => {
    const eigen = zetEigenPrijs({}, 'tegellijm', 'gamma', { prijs: 17.5 }, T1)
    const bron = metEigenPrijzen(voorbeeldPrijsBron, eigen)
    const a = bron.aanbiedingen('tegellijm')
    expect(a.find((x) => x.winkel === 'gamma')).toMatchObject({ prijs: 17.5, bron: 'eigen', bijgewerkt: T1.toISOString() })
    expect(a.find((x) => x.winkel === 'praxis')).toMatchObject({ prijs: VOORBEELD_PRIJSTABEL.tegellijm[1], bron: 'voorbeeld' })
    expect(bron.isVoorbeeld).toBe(false)
  })

  it('niet leverbaar haalt de winkel weg, ook als er een voorbeeldprijs is', () => {
    const eigen = zetEigenPrijs({}, 'kit', 'hornbach', { nietLeverbaar: true }, T1)
    const winkels = metEigenPrijzen(voorbeeldPrijsBron, eigen).aanbiedingen('kit').map((a) => a.winkel)
    expect(winkels).not.toContain('hornbach')
    expect(winkels).toHaveLength(3)
  })

  it('eigen prijs maakt een artikel leverbaar dat in het voorbeeld ontbrak', () => {
    expect(VOORBEELD_PRIJSTABEL.afdichtmanchet[3]).toBeNull()
    const eigen = zetEigenPrijs({}, 'afdichtmanchet', 'karwei', { prijs: 11 }, T1)
    expect(metEigenPrijzen(voorbeeldPrijsBron, eigen).aanbiedingen('afdichtmanchet').map((a) => a.winkel)).toContain('karwei')
  })

  it('productnaam en link zonder prijs houden de voorbeeldprijs', () => {
    const eigen = zetEigenPrijs({}, 'primer', 'gamma', { productNaam: 'Bostik Primer', link: 'https://example.com' }, T1)
    const a = metEigenPrijzen(voorbeeldPrijsBron, eigen).aanbiedingen('primer').find((x) => x.winkel === 'gamma')!
    expect(a).toMatchObject({ bron: 'voorbeeld', productNaam: 'Bostik Primer', link: 'https://example.com' })
    expect(telEigenPrijzen(eigen)).toBe(0)
  })

  it('lege invoer ruimt de regel op en herstel verwijdert de eigen prijs', () => {
    let eigen = zetEigenPrijs({}, 'verf', 'praxis', { prijs: 30 }, T1)
    eigen = zetEigenPrijs(eigen, 'verf', 'praxis', { prijs: null }, T2)
    expect(eigen).toEqual({})
    eigen = zetEigenPrijs(eigen, 'verf', 'praxis', { prijs: 30 }, T1)
    expect(verwijderEigenPrijs(eigen, 'verf', 'praxis')).toEqual({})
  })

  it('laatst bijgewerkt = meest recente wijziging', () => {
    let eigen = zetEigenPrijs({}, 'verf', 'praxis', { prijs: 30 }, T2)
    eigen = zetEigenPrijs(eigen, 'kit', 'gamma', { prijs: 7 }, T1)
    expect(laatstBijgewerkt(eigen)).toBe(T2.toISOString())
  })

  it('voegSamen: het nieuwe bestand wint per artikel/winkel', () => {
    const a = zetEigenPrijs(zetEigenPrijs({}, 'kit', 'gamma', { prijs: 7 }, T1), 'kit', 'praxis', { prijs: 8 }, T1)
    const b = zetEigenPrijs({}, 'kit', 'gamma', { prijs: 6 }, T2)
    const c = voegSamen(a, b)
    expect(c.kit?.gamma?.prijs).toBe(6)
    expect(c.kit?.praxis?.prijs).toBe(8)
  })
})

describe('inkooplijst met eigen prijzen', () => {
  it('totalen en goedkoopste winkel gebruiken direct de eigen prijs', () => {
    const voor = maakInkooplijst(materialen, metEigenPrijzen(voorbeeldPrijsBron, {}))
    const lijm = voor.regels.find((r) => r.id === 'tegellijm')!
    expect(lijm.goedkoopste?.winkel).toBe('hornbach')
    const eigen = zetEigenPrijs({}, 'tegellijm', 'karwei', { prijs: 10 }, T1)
    const na = maakInkooplijst(materialen, metEigenPrijzen(voorbeeldPrijsBron, eigen))
    const lijmNa = na.regels.find((r) => r.id === 'tegellijm')!
    expect(lijmNa.goedkoopste).toMatchObject({ winkel: 'karwei', bron: 'eigen', totaal: 10 * lijm.aantal })
    const karweiVoor = voor.perWinkel.find((w) => w.winkel === 'karwei')!.totaal
    const karweiNa = na.perWinkel.find((w) => w.winkel === 'karwei')!.totaal
    expect(karweiNa).toBeCloseTo(karweiVoor - (VOORBEELD_PRIJSTABEL.tegellijm[3]! - 10) * lijm.aantal, 2)
  })

  it('andere verpakkingsgrootte bij een winkel herberekent het aantal', () => {
    const lijm = materialen.find((m) => m.id === 'tegellijm')!
    const eigen = zetEigenPrijs({}, 'tegellijm', 'praxis', { prijs: 15, inhoud: 20 }, T1)
    const r = maakInkooplijst(materialen, metEigenPrijzen(voorbeeldPrijsBron, eigen)).regels.find((x) => x.id === 'tegellijm')!
    const praxis = r.aanbiedingen.find((a) => a.winkel === 'praxis')!
    expect(praxis.aantal).toBe(Math.ceil(lijm.nodig / 20))
    expect(praxis.totaal).toBeCloseTo(15 * Math.ceil(lijm.nodig / 20), 2)
    expect(praxis.verpakking).toBe('zak à 20 kg')
  })

  it('prijsstatus telt eigen en voorbeeldprijzen', () => {
    const alleenVoorbeeld = maakInkooplijst(materialen, metEigenPrijzen(voorbeeldPrijsBron, {})).prijsStatus
    expect(alleenVoorbeeld.eigen).toBe(0)
    expect(alleenVoorbeeld.voorbeeld).toBeGreaterThan(0)

    // alle gebruikte prijzen eigen maken
    let eigen: EigenPrijzen = {}
    for (const m of materialen)
      for (const w of ['gamma', 'praxis', 'hornbach', 'karwei'] as const) eigen = zetEigenPrijs(eigen, m.id, w, { prijs: 5 }, T1)
    eigen = zetEigenPrijs(eigen, 'kit', 'gamma', { prijs: 6 }, T2)
    const st = maakInkooplijst(materialen, metEigenPrijzen(voorbeeldPrijsBron, eigen)).prijsStatus
    expect(st.voorbeeld).toBe(0)
    expect(st.eigen).toBe(materialen.length * 4)
    expect(st.laatstBijgewerkt).toBe(T2.toISOString())
  })
})

describe('export en import', () => {
  const eigen = zetEigenPrijs(
    zetEigenPrijs({}, 'tegellijm', 'gamma', { prijs: 18.25, inhoud: 20, productNaam: 'Flexlijm; grijs "pro"', link: 'https://gamma.nl/x' }, T1),
    'kit',
    'hornbach',
    { nietLeverbaar: true },
    T2,
  )

  it('JSON heen en terug geeft dezelfde prijzen', () => {
    expect(vanJson(naarJson(eigen))).toEqual(eigen)
  })

  it('JSON met onzin geeft een duidelijke fout', () => {
    expect(() => vanJson('geen json')).toThrow(/geen geldig JSON/)
    expect(() => vanJson('{"prijzen":{"onbekend":{"gamma":{"prijs":1}}}}')).toThrow(/Geen geldige prijzen/)
  })

  it('CSV bevat alle artikelen × 4 winkels en komt ongewijzigd terug', () => {
    const csv = naarCsv(eigen, voorbeeldPrijsBron)
    expect(parseCsv(csv)).toHaveLength(1 + CATALOGUS.length * 4)
    expect(csv).toContain('18,25')
    expect(vanCsv(csv, voorbeeldPrijsBron)).toEqual(eigen)
  })

  it('in Excel aangepaste voorbeeldprijs wordt een eigen prijs', () => {
    const csv = naarCsv({}, voorbeeldPrijsBron).replace(/(primer;[^;]*;Praxis;)18,49/, '$116,99')
    const uit = vanCsv(csv, voorbeeldPrijsBron, T2)
    expect(uit).toEqual({ primer: { praxis: expect.objectContaining({ prijs: 16.99 }) } })
  })

  it('CSV met komma als scheidingsteken en winkelnaam in hoofdletters', () => {
    const csv = 'product_id,winkel,prijs_incl_btw\nvoegmiddel,GAMMA,"9,95"\nonbekend,Gamma,1\n'
    expect(vanCsv(csv, voorbeeldPrijsBron, T1)).toEqual({
      voegmiddel: { gamma: { prijs: 9.95, bijgewerkt: T1.toISOString() } },
    })
  })

  it('importeerPrijzen herkent JSON en CSV', () => {
    expect(importeerPrijzen(naarJson(eigen), voorbeeldPrijsBron)).toEqual(eigen)
    expect(importeerPrijzen(naarCsv(eigen, voorbeeldPrijsBron), voorbeeldPrijsBron)).toEqual(eigen)
  })

  it('CSV zonder verplichte kolommen geeft een fout', () => {
    expect(() => vanCsv('a;b\n1;2', voorbeeldPrijsBron)).toThrow(/Onbekend CSV-formaat/)
  })
})
