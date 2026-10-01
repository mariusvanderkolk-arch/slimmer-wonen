import { describe, expect, it } from 'vitest'
import { backupHerinnering, combineerBedrijf, combineerProjecten, leesBackup, maakBackup, samenvatting } from './backup'
import { nieuwProject } from './defaults'
import { standaardBedrijf } from './bedrijf'
import { standaardAiInstellingen } from './ai'

const a = nieuwProject({ id: 'a', naam: 'Badkamer A' })
const b = nieuwProject({ id: 'b', naam: 'Toilet B', type: 'toilet' })
const foto = { id: 'f1', dataUrl: 'data:image/jpeg;base64,QUJD' }

describe('back-up maken en lezen', () => {
  it('rondreis behoudt projecten, foto’s, prijzen en bedrijf, zonder API-sleutels', () => {
    const bk = maakBackup(
      {
        projecten: [a, b],
        fotos: [foto],
        prijzen: { tegellijm: { gamma: { prijs: 12.5, bijgewerkt: '2026-10-01T00:00:00.000Z' } } } as never,
        bedrijf: { ...standaardBedrijf(), naam: 'Van der Kolk' },
        ai: { ...standaardAiInstellingen(), sleutels: { gemini: 'GEHEIM' }, modellen: { gemini: 'gemini-2.5-flash' } },
      },
      new Date('2026-10-01T12:00:00Z'),
    )
    const tekst = JSON.stringify(bk)
    expect(tekst).not.toContain('GEHEIM')
    const terug = leesBackup(tekst)
    expect(terug.projecten.map((p) => p.naam)).toEqual(['Badkamer A', 'Toilet B'])
    expect(terug.projecten[1].type).toBe('toilet')
    expect(terug.fotos).toEqual([foto])
    expect(terug.bedrijf?.naam).toBe('Van der Kolk')
    expect(terug.ai?.modellen.gemini).toBe('gemini-2.5-flash')
    expect(samenvatting(terug)).toEqual({ projecten: 2, eigen: 2, fotos: 1, prijzen: 1, bedrijf: true })
  })
  it('weigert verkeerde bestanden met duidelijke melding', () => {
    expect(() => leesBackup('hallo')).toThrow(/geen JSON/)
    expect(() => leesBackup('{"app":"iets"}')).toThrow(/geen back-up van Slimmer Wonen/)
    expect(() => leesBackup('{"app":"slimmer-wonen","type":"prijzen","prijzen":{}}')).toThrow(/prijzenbestand/)
    expect(() => leesBackup('{"app":"slimmer-wonen","type":"backup","versie":99,"projecten":[]}')).toThrow(/nieuwere versie/)
  })
  it('slaat kapotte projecten en foto’s over en vult ontbrekende velden aan', () => {
    const t = JSON.stringify({
      app: 'slimmer-wonen',
      type: 'backup',
      versie: 2,
      projecten: [{ id: 'x', naam: 'Oud project' }, { naam: 'zonder id' }, 42],
      fotos: [foto, { id: 'f2', dataUrl: 'javascript:alert(1)' }, { id: 3 }],
      prijzen: [],
    })
    const r = leesBackup(t)
    expect(r.projecten).toHaveLength(1)
    expect(r.projecten[0].afmetingen.lengte).toBeGreaterThan(0)
    expect(r.projecten[0].scope).toBeTruthy()
    expect(r.fotos.map((f) => f.id)).toEqual(['f1'])
    expect(r.prijzen).toEqual({})
  })
})

describe('importeren', () => {
  it('samenvoegen: bestand wint bij gelijk id, rest blijft', () => {
    const nieuwA = { ...a, naam: 'Badkamer A (uit back-up)' }
    const c = nieuwProject({ id: 'c' })
    const r = combineerProjecten([a, b], [nieuwA, c], 'samenvoegen')
    expect(r.map((p) => p.id).sort()).toEqual(['a', 'b', 'c'])
    expect(r.find((p) => p.id === 'a')!.naam).toBe('Badkamer A (uit back-up)')
  })
  it('vervangen: alleen de back-up', () => {
    expect(combineerProjecten([a, b], [b], 'vervangen').map((p) => p.id)).toEqual(['b'])
  })
  it('offertenummer gaat nooit omlaag', () => {
    const huidig = { ...standaardBedrijf(), volgnummer: 9 }
    expect(combineerBedrijf(huidig, { ...standaardBedrijf(), naam: 'X', volgnummer: 3 })).toMatchObject({ naam: 'X', volgnummer: 9 })
    expect(combineerBedrijf(huidig, undefined)).toBe(huidig)
  })
})

describe('back-upherinnering', () => {
  const dag = 24 * 3600e3
  const nu = Date.parse('2026-10-01T12:00:00Z')
  const eigen = { ...a, createdAt: nu - 20 * dag, updatedAt: nu - dag }
  it('niet bij alleen voorbeeldprojecten', () => {
    expect(backupHerinnering({ projecten: [{ ...a, voorbeeld: true }], laatsteBackup: null, gesnoozed: null }, nu)).toBe(false)
  })
  it('wel als er nooit een back-up is gemaakt (na een dag)', () => {
    expect(backupHerinnering({ projecten: [eigen], laatsteBackup: null, gesnoozed: null }, nu)).toBe(true)
    expect(backupHerinnering({ projecten: [{ ...eigen, createdAt: nu - 3600e3 }], laatsteBackup: null, gesnoozed: null }, nu)).toBe(false)
  })
  it('na 14 dagen met wijzigingen sinds de laatste back-up', () => {
    expect(backupHerinnering({ projecten: [eigen], laatsteBackup: nu - 15 * dag, gesnoozed: null }, nu)).toBe(true)
    expect(backupHerinnering({ projecten: [eigen], laatsteBackup: nu - 5 * dag, gesnoozed: null }, nu)).toBe(false)
    expect(backupHerinnering({ projecten: [{ ...eigen, updatedAt: nu - 16 * dag }], laatsteBackup: nu - 15 * dag, gesnoozed: null }, nu)).toBe(false)
  })
  it('later herinneren', () => {
    expect(backupHerinnering({ projecten: [eigen], laatsteBackup: null, gesnoozed: nu + dag }, nu)).toBe(false)
  })
})
