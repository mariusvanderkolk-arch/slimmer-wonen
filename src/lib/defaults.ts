import type { Afmetingen, Project, Scope, ScopeKey, TileSpec } from './types'

export const uid = () =>
  (globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`)

export interface ScopeItem {
  key: ScopeKey
  label: string
  omschrijving: string
  optioneel?: boolean
}

export const SCOPE_ITEMS: ScopeItem[] = [
  { key: 'sloopwerk', label: 'Sloopwerk & afvoer', omschrijving: 'Oude tegels en sanitair verwijderen' },
  { key: 'egaliseren', label: 'Vloer egaliseren', omschrijving: 'Vlakke ondergrond voor de vloertegels' },
  { key: 'waterdicht', label: 'Waterdicht maken', omschrijving: 'Vloer en douchewanden afdichten' },
  { key: 'vloerverwarming', label: 'Vloerverwarming', omschrijving: 'Elektrische mat met thermostaat', optioneel: true },
  { key: 'wandtegels', label: 'Wandtegels', omschrijving: 'Inclusief lijm, voeg en profielen' },
  { key: 'vloertegels', label: 'Vloertegels', omschrijving: 'Inclusief lijm en voeg' },
  { key: 'inloopdouche', label: 'Inloopdouche', omschrijving: 'Glaswand, douchegoot en regendouche' },
  { key: 'toilet', label: 'Hangtoilet', omschrijving: 'Inbouwreservoir en bedieningsplaat' },
  { key: 'wastafelmeubel', label: 'Wastafelmeubel', omschrijving: 'Meubel, kraan, spiegel en sifon' },
  { key: 'kitwerk', label: 'Kitten & afwerken', omschrijving: 'Sanitairkit langs naden en hoeken' },
  { key: 'stucwerk', label: 'Stucwerk & schilderen', omschrijving: 'Plafond en wand boven de tegels' },
]

export const standaardScope = (): Scope => ({
  sloopwerk: true,
  egaliseren: true,
  waterdicht: true,
  vloerverwarming: false,
  wandtegels: true,
  vloertegels: true,
  inloopdouche: true,
  toilet: true,
  wastafelmeubel: true,
  kitwerk: true,
  stucwerk: false,
})

export const standaardAfmetingen = (): Afmetingen => ({
  lengte: 2.5,
  breedte: 2.0,
  hoogte: 2.6,
  tegelhoogte: 2.6,
  openingen: [{ id: uid(), type: 'deur', breedte: 0.83, hoogte: 2.11, vanafVloer: 0 }],
  douche: { breedte: 0.9, diepte: 1.2 },
  egaliseerDikte: 3,
})

export const standaardWandtegel = (): TileSpec => ({ lengte: 60, breedte: 30, m2PerDoos: 1.44, dikte: 9, voeg: 2 })
export const standaardVloertegel = (): TileSpec => ({ lengte: 60, breedte: 60, m2PerDoos: 1.44, dikte: 10, voeg: 3 })

export function nieuwProject(velden: Partial<Project> = {}): Project {
  const nu = Date.now()
  return {
    id: uid(),
    naam: '',
    klant: '',
    adres: '',
    type: 'badkamer',
    createdAt: nu,
    updatedAt: nu,
    scope: standaardScope(),
    afmetingen: standaardAfmetingen(),
    wandtegel: standaardWandtegel(),
    vloertegel: standaardVloertegel(),
    snijverlies: 10,
    uurtarief: 60,
    fotos: [],
    afgevinkt: {},
    notities: '',
    ...velden,
  }
}

/** Twee voorbeeldprojecten, zodat de demo meteen iets laat zien. */
export function voorbeeldProjecten(): Project[] {
  const dag = 86_400_000
  const nu = Date.now()
  return [
    nieuwProject({
      naam: 'Badkamer Jansen',
      klant: 'Fam. Jansen',
      adres: 'Lindenlaan 12, Amersfoort',
      createdAt: nu - 6 * dag,
      updatedAt: nu - 1 * dag,
      voorbeeld: true,
      scope: { ...standaardScope(), vloerverwarming: true },
      afmetingen: {
        lengte: 2.8,
        breedte: 2.2,
        hoogte: 2.6,
        tegelhoogte: 2.6,
        openingen: [
          { id: uid(), type: 'deur', breedte: 0.83, hoogte: 2.11, vanafVloer: 0 },
          { id: uid(), type: 'raam', breedte: 0.6, hoogte: 0.8, vanafVloer: 1.4 },
        ],
        douche: { breedte: 1.0, diepte: 1.2 },
        egaliseerDikte: 3,
      },
      wandtegel: { lengte: 60, breedte: 30, m2PerDoos: 1.44, dikte: 9, voeg: 2 },
      vloertegel: { lengte: 60, breedte: 60, m2PerDoos: 1.44, dikte: 10, voeg: 3 },
      afgevinkt: { tegellijm: true, primer: true },
      notities: 'Klant wil matte, lichte tegels. Afvoer toilet verplaatsen richting raamzijde.',
    }),
    nieuwProject({
      naam: 'Toilet & douche De Vries',
      klant: 'M. de Vries',
      adres: 'Havenstraat 4, Zwolle',
      createdAt: nu - 12 * dag,
      updatedAt: nu - 4 * dag,
      voorbeeld: true,
      scope: {
        sloopwerk: true,
        egaliseren: false,
        waterdicht: true,
        vloerverwarming: false,
        wandtegels: true,
        vloertegels: true,
        inloopdouche: true,
        toilet: false,
        wastafelmeubel: true,
        kitwerk: true,
        stucwerk: true,
      },
      afmetingen: {
        lengte: 2.0,
        breedte: 1.7,
        hoogte: 2.5,
        tegelhoogte: 1.2,
        openingen: [{ id: uid(), type: 'deur', breedte: 0.78, hoogte: 2.01, vanafVloer: 0 }],
        douche: { breedte: 0.9, diepte: 0.9 },
        egaliseerDikte: 3,
      },
      wandtegel: { lengte: 20, breedte: 20, m2PerDoos: 1.0, dikte: 8, voeg: 2 },
      vloertegel: { lengte: 30, breedte: 30, m2PerDoos: 1.08, dikte: 9, voeg: 3 },
      snijverlies: 12,
      notities: 'Halfhoog betegelen, daarboven stucwerk en vochtbestendige verf.',
    }),
  ]
}
