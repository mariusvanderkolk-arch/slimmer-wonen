/**
 * Rekenmodule van Slimmer Wonen.
 *
 * Alle formules zijn bewust eenvoudige, gangbare vuistregels uit de praktijk
 * (verbruiksopgaven van fabrikanten van tegellijm, voegmiddel, kit en
 * egaliseermiddel). Ze zijn bedoeld voor een eerste, onderbouwde raming — niet
 * als vervanging van de technische fiche van het gekozen product.
 *
 * Alle functies zijn puur (geen side effects) zodat ze eenvoudig te testen zijn.
 */
import type { Afmetingen, Opening, Project, Scope, TileSpec } from './types'

/** Vuistregels en verpakkingsgroottes. Eén plek, zodat ze makkelijk bij te stellen zijn. */
export const REGELS = {
  /** Tegellijm in kg/m², afhankelijk van de langste tegelzijde (grotere tegel = grotere lijmkam). */
  lijmKgPerM2(langsteZijdeCm: number): number {
    if (langsteZijdeCm <= 30) return 3.5 // lijmkam 6–8 mm
    if (langsteZijdeCm <= 60) return 4.5 // lijmkam 10 mm
    return 5.5 // groot formaat: lijmkam 12 mm + buttering
  },
  lijmZakKg: 25,

  /** Voegmiddel: kg/m² = (A + B) / (A × B) × voegbreedte × tegeldikte × dichtheid (A, B in mm). */
  voegDichtheid: 1.6,
  voegReserve: 0.1,
  voegZakKg: 5,

  /** Voorstrijkmiddel (primer) in liter per m². */
  primerLPerM2: 0.15,
  primerBusL: 5,

  /** Vloeibare waterdichting, 2 lagen samen, in kg/m². */
  waterdichtKgPerM2: 1.4,
  waterdichtEmmerKg: 7,
  /** Tot welke hoogte de douchewanden waterdicht worden gemaakt (m). */
  waterdichtHoogte: 2.1,
  afdichtbandRolM: 10,
  afdichtbandOverlap: 0.1,

  /** Egaliseermiddel in kg per m² per mm laagdikte. */
  egaliseerKgPerM2PerMm: 1.6,
  egaliseerZakKg: 25,

  /** Sanitairkit: voeg ca. 6×6 mm ≈ 36 ml/m → een koker van 310 ml ≈ 8 m (met verlies). */
  kitMeterPerKoker: 8,
  kitToiletM: 1.2,
  kitWastafelM: 1.5,
  kitGlaswandM: 4.0,

  /** Tegelprofielen worden verkocht per 2,5 m. */
  profielLengteM: 2.5,

  /** Tegelkruisjes / levelclips: één zak per 15 m² tegelwerk. */
  kruisjesM2PerZak: 15,

  /** Elektrische vloerverwarming bedekt ca. 70% van de vloer (niet onder douche/toilet/meubel). */
  vloerverwarmingDekking: 0.7,
  isolatieplaatM2: 0.72,

  /** Vochtbestendige pleister: 1,2 kg/m² per mm, gemiddeld 2 mm. */
  pleisterKgPerM2: 2.4,
  pleisterZakKg: 20,
  /** Badkamerverf: 0,1 L/m² per laag, 2 lagen. */
  verfLPerM2: 0.2,
  verfBusL: 2.5,

  /** Sloopafval: ca. 2,5 cm wandtegel + lijm en 8 cm vloer/dekvloer, × 1,5 volume-toename. */
  sloopWandM: 0.025,
  sloopVloerM: 0.08,
  sloopOpbulk: 1.5,
  bigBagM3: 1,
} as const

/** Indicatieve arbeidsnormen (uren) voor de offerte-raming. */
export const ARBEID = {
  sloopwerkPerM2: 0.4,
  waterdichtPerM2: 0.3,
  egaliserenPerM2: 0.25,
  egaliserenVast: 1,
  vloerverwarmingPerM2: 0.5,
  vloerverwarmingVast: 2,
  wandtegelsPerM2: 1.1,
  vloertegelsPerM2: 1.0,
  inloopdouche: 6,
  toilet: 5,
  wastafelmeubel: 3,
  kitwerkPerM: 0.15,
  stucwerkPerM2: 0.6,
} as const

const EPS = 1e-9
/** Naar boven afronden, zonder dat 3,0000000001 als 4 telt. */
export const omhoog = (n: number) => (n <= EPS ? 0 : Math.ceil(n - EPS))
export const rond = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d
const som = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const klem = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

/** Onder- en bovenkant van een opening, gemeten vanaf de vloer. */
function bereik(o: Opening): [number, number] {
  const onder = o.type === 'deur' ? 0 : Math.max(0, o.vanafVloer)
  return [onder, onder + Math.max(0, o.hoogte)]
}

/** Overlap van [a1, a2] met [b1, b2]. */
const overlap = (a1: number, a2: number, b1: number, b2: number) => Math.max(0, Math.min(a2, b2) - Math.max(a1, b1))

/** Deel van een opening (m²) dat binnen de betegelde zone (0 → tegelhoogte) valt. */
export function openingInTegelzone(o: Opening, tegelhoogte: number): number {
  const [onder, boven] = bereik(o)
  return Math.max(0, o.breedte) * overlap(onder, boven, 0, tegelhoogte)
}

export interface Oppervlakken {
  /** omtrek van de vloer (m) */
  omtrek: number
  /** wandoppervlak tot tegelhoogte, zonder aftrek (m²) */
  wandBruto: number
  /** af te trekken openingen binnen de tegelzone (m²) */
  openingenAftrek: number
  /** te betegelen wandoppervlak (m²) */
  wandNetto: number
  /** vloeroppervlak (m²) */
  vloer: number
  /** plafond (m²) */
  plafond: number
  /** wand boven de tegels, minus openingen (m²) */
  wandBovenTegels: number
  /** totale breedte van deuren (m) — daar komt geen plint/kit/profiel */
  deurBreedte: number
  /** waterdicht te maken wand in de douchezone (m²) */
  douchezoneWand: number
  /** waterdicht te maken oppervlak: hele vloer + douchewanden (m²) */
  waterdichtOppervlak: number
  /** tegelhoogte, begrensd op de ruimtehoogte (m) */
  tegelhoogte: number
}

export function berekenOppervlakken(a: Afmetingen, scope: Pick<Scope, 'inloopdouche'>): Oppervlakken {
  const L = Math.max(0, a.lengte)
  const B = Math.max(0, a.breedte)
  const H = Math.max(0, a.hoogte)
  const th = klem(a.tegelhoogte, 0, H)
  const omtrek = 2 * (L + B)
  const wandBruto = omtrek * th
  const openingenAftrek = som(a.openingen.map((o) => openingInTegelzone(o, th)))
  const wandNetto = Math.max(0, wandBruto - openingenAftrek)
  const vloer = L * B
  const deurBreedte = som(a.openingen.filter((o) => o.type === 'deur').map((o) => Math.max(0, o.breedte)))
  const bovenAftrek = som(
    a.openingen.map((o) => {
      const [onder, boven] = bereik(o)
      return Math.max(0, o.breedte) * overlap(onder, boven, th, H)
    }),
  )
  const wandBovenTegels = Math.max(0, omtrek * (H - th) - bovenAftrek)
  const wdHoogte = Math.min(REGELS.waterdichtHoogte, H)
  const douchezoneWand = scope.inloopdouche
    ? (Math.max(0, a.douche.breedte) + Math.max(0, a.douche.diepte)) * wdHoogte
    : 0
  return {
    omtrek,
    wandBruto,
    openingenAftrek,
    wandNetto,
    vloer,
    plafond: vloer,
    wandBovenTegels,
    deurBreedte,
    douchezoneWand,
    waterdichtOppervlak: vloer + douchezoneWand,
    tegelhoogte: th,
  }
}

/** Tegels inclusief snijverlies, afgerond op hele dozen. */
export function tegelBehoefte(m2: number, tegel: TileSpec, snijverliesPct: number) {
  const m2Incl = m2 * (1 + Math.max(0, snijverliesPct) / 100)
  const dozen = tegel.m2PerDoos > 0 ? omhoog(m2Incl / tegel.m2PerDoos) : 0
  const tegelM2 = (tegel.lengte / 100) * (tegel.breedte / 100)
  const stuks = tegelM2 > 0 ? omhoog(m2Incl / tegelM2) : 0
  return { m2Incl, dozen, stuks, m2Gekocht: dozen * tegel.m2PerDoos }
}

/** Voegmiddelverbruik in kg/m² volgens de gangbare fabrikantformule. */
export function voegKgPerM2(tegel: TileSpec): number {
  const A = tegel.lengte * 10 // cm → mm
  const B = tegel.breedte * 10
  if (A <= 0 || B <= 0) return 0
  return ((A + B) / (A * B)) * tegel.voeg * tegel.dikte * REGELS.voegDichtheid
}

export const langsteZijde = (t: TileSpec) => Math.max(t.lengte, t.breedte)

/** Strekkende meters kitvoeg. */
export function kitLengte(p: Pick<Project, 'scope' | 'afmetingen'>, o: Oppervlakken): number {
  const s = p.scope
  let m = 0
  if (s.wandtegels || s.vloertegels) m += Math.max(0, o.omtrek - o.deurBreedte) // naad vloer-wand
  if (s.wandtegels) m += 4 * o.tegelhoogte // verticale binnenhoeken
  if (s.inloopdouche) m += REGELS.kitGlaswandM + Math.max(0, p.afmetingen.douche.breedte)
  if (s.toilet) m += REGELS.kitToiletM
  if (s.wastafelmeubel) m += REGELS.kitWastafelM
  return m
}

/** Strekkende meters tegelprofiel (bovenrand tegelwerk + dagkanten van ramen in de tegelzone). */
export function profielLengte(p: Pick<Project, 'scope' | 'afmetingen'>, o: Oppervlakken): number {
  if (!p.scope.wandtegels) return 0
  let m = 0
  if (o.tegelhoogte < p.afmetingen.hoogte - 0.01) m += Math.max(0, o.omtrek - o.deurBreedte)
  for (const op of p.afmetingen.openingen) {
    if (op.type !== 'raam') continue
    const [onder, boven] = bereik(op)
    const h = overlap(onder, boven, 0, o.tegelhoogte)
    if (h <= 0) continue
    const onderIn = onder < o.tegelhoogte
    const bovenIn = boven <= o.tegelhoogte
    m += 2 * h + (onderIn ? op.breedte : 0) + (bovenIn ? op.breedte : 0)
  }
  return m
}

export type Groep =
  | 'sloop'
  | 'voorbereiding'
  | 'waterdicht'
  | 'vloerverwarming'
  | 'tegels'
  | 'lijm-voeg'
  | 'afwerking'
  | 'sanitair'

export const GROEPEN: { id: Groep; naam: string }[] = [
  { id: 'sloop', naam: 'Sloop & afvoer' },
  { id: 'voorbereiding', naam: 'Voorbereiding ondergrond' },
  { id: 'waterdicht', naam: 'Waterdicht maken' },
  { id: 'vloerverwarming', naam: 'Vloerverwarming' },
  { id: 'tegels', naam: 'Tegels' },
  { id: 'lijm-voeg', naam: 'Lijm, voeg & toebehoren' },
  { id: 'afwerking', naam: 'Kit, profielen & afwerking' },
  { id: 'sanitair', naam: 'Sanitair' },
]

export type ProductId =
  | 'wandtegel'
  | 'vloertegel'
  | 'tegellijm'
  | 'voegmiddel'
  | 'tegelkruisjes'
  | 'primer'
  | 'egaliseer'
  | 'waterdicht'
  | 'afdichtband'
  | 'afdichtmanchet'
  | 'vv-mat'
  | 'vv-thermostaat'
  | 'isolatieplaat'
  | 'kit'
  | 'profiel'
  | 'pleister'
  | 'verf'
  | 'glaswand'
  | 'douchegoot'
  | 'regendouche'
  | 'inbouwreservoir'
  | 'hangtoilet'
  | 'bedieningsplaat'
  | 'wastafelmeubel'
  | 'wastafelkraan'
  | 'spiegel'
  | 'sifon'
  | 'bigbag'
  | 'afdekset'

export interface MateriaalRegel {
  id: ProductId
  groep: Groep
  naam: string
  /** specificatie, bijv. "30 × 60 cm" */
  spec?: string
  /** berekende benodigde hoeveelheid (basiseenheid) */
  nodig: number
  nodigEenheid: string
  /** aantal te kopen verpakkingen/stuks */
  aantal: number
  /** omschrijving verpakking, bijv. "doos à 1,44 m²" */
  verpakking: string
  /** aantal prijseenheden (m² bij tegels, anders = aantal) */
  prijsAantal: number
  /** korte onderbouwing van de berekening */
  toelichting: string
}

const nl = (n: number, d = 2) =>
  new Intl.NumberFormat('nl-NL', { maximumFractionDigits: d, minimumFractionDigits: 0 }).format(rond(n, d))
const fmtTegel = (t: TileSpec) => `${nl(t.lengte, 1)} × ${nl(t.breedte, 1)} cm`

/** Berekent alle materialen voor een project. */
export function berekenMaterialen(p: Project): MateriaalRegel[] {
  const s = p.scope
  const o = berekenOppervlakken(p.afmetingen, s)
  const sv = p.snijverlies
  const regels: MateriaalRegel[] = []
  const add = (r: MateriaalRegel) => {
    if (r.aantal > 0) regels.push(r)
  }

  // — Sloop & afvoer
  if (s.sloopwerk) {
    const m3 = (o.wandNetto * REGELS.sloopWandM + o.vloer * REGELS.sloopVloerM) * REGELS.sloopOpbulk
    add({
      id: 'bigbag', groep: 'sloop', naam: 'Big bag voor puin', spec: 'inhoud 1 m³',
      nodig: m3, nodigEenheid: 'm³', aantal: Math.max(1, omhoog(m3 / REGELS.bigBagM3)), verpakking: 'stuk',
      prijsAantal: Math.max(1, omhoog(m3 / REGELS.bigBagM3)),
      toelichting: `(${nl(o.wandNetto)} m² wand × 2,5 cm + ${nl(o.vloer)} m² vloer × 8 cm) × 1,5 opbulk ≈ ${nl(m3)} m³`,
    })
    add({
      id: 'afdekset', groep: 'sloop', naam: 'Afdekfolie, stucloper & stofmaskers',
      nodig: 1, nodigEenheid: 'set', aantal: 1, verpakking: 'set', prijsAantal: 1,
      toelichting: 'Vaste post per project',
    })
  }

  // — Voorbereiding
  const tegelVloer = s.vloertegels || s.egaliseren
  const primerM2 = (s.wandtegels ? o.wandNetto : 0) + (tegelVloer ? o.vloer : 0) + (s.stucwerk ? o.plafond + o.wandBovenTegels : 0)
  if (primerM2 > 0) {
    const liter = primerM2 * REGELS.primerLPerM2
    const bussen = omhoog(liter / REGELS.primerBusL)
    add({
      id: 'primer', groep: 'voorbereiding', naam: 'Voorstrijkmiddel (primer)',
      nodig: liter, nodigEenheid: 'L', aantal: bussen, verpakking: `bus à ${REGELS.primerBusL} L`, prijsAantal: bussen,
      toelichting: `${nl(primerM2)} m² × ${nl(REGELS.primerLPerM2)} L/m² = ${nl(liter)} L`,
    })
  }
  if (s.egaliseren) {
    const kg = o.vloer * p.afmetingen.egaliseerDikte * REGELS.egaliseerKgPerM2PerMm
    const zakken = omhoog(kg / REGELS.egaliseerZakKg)
    add({
      id: 'egaliseer', groep: 'voorbereiding', naam: 'Egaliseermiddel',
      nodig: kg, nodigEenheid: 'kg', aantal: zakken, verpakking: `zak à ${REGELS.egaliseerZakKg} kg`, prijsAantal: zakken,
      toelichting: `${nl(o.vloer)} m² × ${nl(p.afmetingen.egaliseerDikte, 1)} mm × ${nl(REGELS.egaliseerKgPerM2PerMm)} kg/m²/mm = ${nl(kg, 1)} kg`,
    })
  }

  // — Waterdicht
  if (s.waterdicht) {
    const kg = o.waterdichtOppervlak * REGELS.waterdichtKgPerM2
    const emmers = omhoog(kg / REGELS.waterdichtEmmerKg)
    add({
      id: 'waterdicht', groep: 'waterdicht', naam: 'Vloeibare waterdichting (2 lagen)',
      nodig: kg, nodigEenheid: 'kg', aantal: emmers, verpakking: `emmer à ${REGELS.waterdichtEmmerKg} kg`, prijsAantal: emmers,
      toelichting: `(${nl(o.vloer)} m² vloer + ${nl(o.douchezoneWand)} m² douchewand) × ${nl(REGELS.waterdichtKgPerM2)} kg/m² = ${nl(kg, 1)} kg`,
    })
    const hoek = s.inloopdouche ? Math.min(REGELS.waterdichtHoogte, p.afmetingen.hoogte) * 2 : 0
    const band = (Math.max(0, o.omtrek - o.deurBreedte) + hoek) * (1 + REGELS.afdichtbandOverlap)
    const rollen = omhoog(band / REGELS.afdichtbandRolM)
    add({
      id: 'afdichtband', groep: 'waterdicht', naam: 'Afdichtband',
      nodig: band, nodigEenheid: 'm', aantal: rollen, verpakking: `rol à ${REGELS.afdichtbandRolM} m`, prijsAantal: rollen,
      toelichting: `Naad vloer-wand${s.inloopdouche ? ' + 2 hoeknaden douche' : ''} + 10% overlap = ${nl(band, 1)} m`,
    })
    add({
      id: 'afdichtmanchet', groep: 'waterdicht', naam: 'Afdichtmanchetten (afvoer & leidingen)',
      nodig: 1, nodigEenheid: 'set', aantal: 1, verpakking: 'set', prijsAantal: 1,
      toelichting: 'Eén set voor afvoer en leidingdoorvoeren',
    })
  }

  // — Vloerverwarming
  if (s.vloerverwarming) {
    const mat = Math.max(1, Math.floor(o.vloer * REGELS.vloerverwarmingDekking * 2) / 2)
    add({
      id: 'vv-mat', groep: 'vloerverwarming', naam: 'Elektrische vloerverwarmingsmat', spec: '150 W/m²',
      nodig: mat, nodigEenheid: 'm²', aantal: mat, verpakking: 'm²', prijsAantal: mat,
      toelichting: `${nl(o.vloer)} m² × 70% vrije vloer, afgerond op 0,5 m² = ${nl(mat, 1)} m²`,
    })
    add({
      id: 'vv-thermostaat', groep: 'vloerverwarming', naam: 'Klokthermostaat met vloersensor', spec: 'inbouw',
      nodig: 1, nodigEenheid: 'stuk', aantal: 1, verpakking: 'stuk', prijsAantal: 1,
      toelichting: 'Eén thermostaat per ruimte',
    })
    const platen = omhoog(o.vloer / REGELS.isolatieplaatM2)
    add({
      id: 'isolatieplaat', groep: 'vloerverwarming', naam: 'Isolatieplaat XPS', spec: '6 mm · 120 × 60 cm',
      nodig: o.vloer, nodigEenheid: 'm²', aantal: platen, verpakking: `plaat à ${nl(REGELS.isolatieplaatM2)} m²`, prijsAantal: platen,
      toelichting: `${nl(o.vloer)} m² ÷ ${nl(REGELS.isolatieplaatM2)} m² per plaat`,
    })
  }

  // — Tegels, lijm en voeg
  let tegelM2Totaal = 0
  let lijmKg = 0
  let voegKg = 0
  const lijmUitleg: string[] = []
  const voegUitleg: string[] = []
  const tegelTypes: [ProductId, string, number, TileSpec, boolean][] = [
    ['wandtegel', 'Wandtegels', o.wandNetto, p.wandtegel, s.wandtegels],
    ['vloertegel', 'Vloertegels', o.vloer, p.vloertegel, s.vloertegels],
  ]
  for (const [id, naam, m2, tegel, actief] of tegelTypes) {
    if (!actief || m2 <= 0) continue
    const t = tegelBehoefte(m2, tegel, sv)
    tegelM2Totaal += m2
    add({
      id, groep: 'tegels', naam, spec: fmtTegel(tegel),
      nodig: t.m2Incl, nodigEenheid: 'm²', aantal: t.dozen, verpakking: `doos à ${nl(tegel.m2PerDoos)} m²`,
      prijsAantal: t.m2Gekocht,
      toelichting: `${nl(m2)} m² + ${nl(sv, 1)}% snijverlies = ${nl(t.m2Incl)} m² (≈ ${t.stuks} tegels)`,
    })
    const kgm2 = REGELS.lijmKgPerM2(langsteZijde(tegel))
    lijmKg += m2 * kgm2
    lijmUitleg.push(`${nl(m2)} m² × ${nl(kgm2, 1)} kg/m²`)
    const v = voegKgPerM2(tegel)
    voegKg += m2 * v
    voegUitleg.push(`${nl(m2)} m² × ${nl(v)} kg/m²`)
  }
  if (lijmKg > 0) {
    const zakken = omhoog(lijmKg / REGELS.lijmZakKg)
    add({
      id: 'tegellijm', groep: 'lijm-voeg', naam: 'Flexibele tegellijm (C2TE S1)',
      nodig: lijmKg, nodigEenheid: 'kg', aantal: zakken, verpakking: `zak à ${REGELS.lijmZakKg} kg`, prijsAantal: zakken,
      toelichting: `${lijmUitleg.join(' + ')} = ${nl(lijmKg, 1)} kg`,
    })
  }
  if (voegKg > 0) {
    const kg = voegKg * (1 + REGELS.voegReserve)
    const zakken = omhoog(kg / REGELS.voegZakKg)
    add({
      id: 'voegmiddel', groep: 'lijm-voeg', naam: 'Flexibel voegmiddel',
      nodig: kg, nodigEenheid: 'kg', aantal: zakken, verpakking: `zak à ${REGELS.voegZakKg} kg`, prijsAantal: zakken,
      toelichting: `${voegUitleg.join(' + ')} + 10% reserve = ${nl(kg, 1)} kg`,
    })
  }
  if (tegelM2Totaal > 0) {
    const zakken = omhoog(tegelM2Totaal / REGELS.kruisjesM2PerZak)
    add({
      id: 'tegelkruisjes', groep: 'lijm-voeg', naam: 'Tegelkruisjes / levelclips',
      nodig: tegelM2Totaal, nodigEenheid: 'm²', aantal: zakken, verpakking: 'zak', prijsAantal: zakken,
      toelichting: `1 zak per ${REGELS.kruisjesM2PerZak} m² tegelwerk`,
    })
  }

  // — Afwerking
  if (s.kitwerk) {
    const m = kitLengte(p, o)
    const kokers = omhoog(m / REGELS.kitMeterPerKoker)
    add({
      id: 'kit', groep: 'afwerking', naam: 'Sanitairkit (schimmelwerend)',
      nodig: m, nodigEenheid: 'm', aantal: kokers, verpakking: 'koker à 310 ml', prijsAantal: kokers,
      toelichting: `${nl(m, 1)} m kitvoeg ÷ ${REGELS.kitMeterPerKoker} m per koker`,
    })
  }
  const prof = profielLengte(p, o)
  if (prof > 0) {
    const stuks = omhoog(prof / REGELS.profielLengteM)
    add({
      id: 'profiel', groep: 'afwerking', naam: 'Tegelprofiel aluminium', spec: `voor ${nl(p.wandtegel.dikte, 1)} mm tegel`,
      nodig: prof, nodigEenheid: 'm', aantal: stuks, verpakking: `lengte à ${nl(REGELS.profielLengteM, 1)} m`, prijsAantal: stuks,
      toelichting: `Bovenrand tegelwerk en dagkanten ramen = ${nl(prof, 1)} m`,
    })
  }
  if (s.stucwerk) {
    const m2 = o.plafond + o.wandBovenTegels
    const kg = m2 * REGELS.pleisterKgPerM2
    const zakken = omhoog(kg / REGELS.pleisterZakKg)
    add({
      id: 'pleister', groep: 'afwerking', naam: 'Vochtbestendige pleister',
      nodig: kg, nodigEenheid: 'kg', aantal: zakken, verpakking: `zak à ${REGELS.pleisterZakKg} kg`, prijsAantal: zakken,
      toelichting: `(${nl(o.plafond)} m² plafond + ${nl(o.wandBovenTegels)} m² wand) × ${nl(REGELS.pleisterKgPerM2, 1)} kg/m² = ${nl(kg, 1)} kg`,
    })
    const liter = m2 * REGELS.verfLPerM2
    const bussen = omhoog(liter / REGELS.verfBusL)
    add({
      id: 'verf', groep: 'afwerking', naam: 'Badkamerverf (anti-schimmel)',
      nodig: liter, nodigEenheid: 'L', aantal: bussen, verpakking: `bus à ${nl(REGELS.verfBusL, 1)} L`, prijsAantal: bussen,
      toelichting: `${nl(m2)} m² × 2 lagen × 0,1 L/m² = ${nl(liter, 1)} L`,
    })
  }

  // — Sanitair (vaste aantallen)
  const stuk = (id: ProductId, naam: string, spec: string, toelichting: string) =>
    add({ id, groep: 'sanitair', naam, spec, nodig: 1, nodigEenheid: 'stuk', aantal: 1, verpakking: 'stuk', prijsAantal: 1, toelichting })
  if (s.inloopdouche) {
    const goot = Math.max(0.3, Math.round((p.afmetingen.douche.breedte - 0.1) * 10) / 10)
    stuk('glaswand', 'Inloopdouche glaswand', '8 mm helder glas · 200 cm hoog', 'Eén wand voor de douchezone')
    stuk('douchegoot', 'Douchegoot RVS', `${nl(goot * 100, 0)} cm`, `Doucheruimte ${nl(p.afmetingen.douche.breedte * 100, 0)} cm − 10 cm`)
    stuk('regendouche', 'Thermostatische regendoucheset', 'opbouw', 'Eén set per douche')
  }
  if (s.toilet) {
    stuk('inbouwreservoir', 'Inbouwreservoir', 'voor hangtoilet', 'Vast per toilet')
    stuk('hangtoilet', 'Hangtoilet randloos', 'incl. softclose zitting', 'Vast per toilet')
    stuk('bedieningsplaat', 'Bedieningsplaat', 'dual flush', 'Vast per toilet')
  }
  if (s.wastafelmeubel) {
    stuk('wastafelmeubel', 'Wastafelmeubel met wastafel', '80 cm', 'Vast per badkamer')
    stuk('wastafelkraan', 'Wastafelkraan', 'eengreeps', 'Vast per wastafel')
    stuk('spiegel', 'Spiegel met verlichting', '80 cm', 'Vast per wastafel')
    stuk('sifon', 'Sifon & afvoerset', 'design', 'Vast per wastafel')
  }

  return regels
}

export interface ArbeidRegel {
  scope: keyof typeof ARBEID | string
  omschrijving: string
  uren: number
}

/** Indicatieve arbeidsuren per onderdeel. */
export function berekenArbeid(p: Project): ArbeidRegel[] {
  const s = p.scope
  const o = berekenOppervlakken(p.afmetingen, s)
  const r: ArbeidRegel[] = []
  const add = (scope: string, omschrijving: string, uren: number) => {
    if (uren > 0) r.push({ scope, omschrijving, uren: rond(uren, 1) })
  }
  if (s.sloopwerk) add('sloopwerk', 'Sloopwerk en afvoer', (o.wandNetto + o.vloer) * ARBEID.sloopwerkPerM2)
  if (s.egaliseren) add('egaliseren', 'Vloer egaliseren', o.vloer * ARBEID.egaliserenPerM2 + ARBEID.egaliserenVast)
  if (s.waterdicht) add('waterdicht', 'Waterdicht maken', o.waterdichtOppervlak * ARBEID.waterdichtPerM2)
  if (s.vloerverwarming) add('vloerverwarming', 'Vloerverwarming leggen', o.vloer * ARBEID.vloerverwarmingPerM2 + ARBEID.vloerverwarmingVast)
  if (s.wandtegels) add('wandtegels', 'Wandtegels zetten', o.wandNetto * ARBEID.wandtegelsPerM2)
  if (s.vloertegels) add('vloertegels', 'Vloertegels leggen', o.vloer * ARBEID.vloertegelsPerM2)
  if (s.inloopdouche) add('inloopdouche', 'Inloopdouche plaatsen', ARBEID.inloopdouche)
  if (s.toilet) add('toilet', 'Hangtoilet plaatsen', ARBEID.toilet)
  if (s.wastafelmeubel) add('wastafelmeubel', 'Wastafelmeubel plaatsen', ARBEID.wastafelmeubel)
  if (s.kitwerk) add('kitwerk', 'Kitwerk', kitLengte(p, o) * ARBEID.kitwerkPerM)
  if (s.stucwerk) add('stucwerk', 'Stucwerk en schilderen', (o.plafond + o.wandBovenTegels) * ARBEID.stucwerkPerM2)
  return r
}
