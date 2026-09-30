/** Overzicht van alle artikelen waarvoor een prijs kan worden ingesteld (zelfde groepen als de berekening). */
import { REGELS, type Groep, type ProductId } from './calc'

export interface CatalogusItem {
  id: ProductId
  naam: string
  groep: Groep
  /** waarvoor de prijs geldt, bijv. "per m²" of "per stuk" (bij `inhoud` wordt het label afgeleid) */
  eenheid?: string
  /** artikel met een verpakkingsgrootte die per winkel kan verschillen */
  inhoud?: { standaard: number; eenheid: string; soort: string }
  toelichting?: string
}

const nl = (n: number) => new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 }).format(n)

export const CATALOGUS: CatalogusItem[] = [
  { id: 'bigbag', groep: 'sloop', naam: 'Big bag voor puin', eenheid: 'per stuk (1 m³)' },
  { id: 'afdekset', groep: 'sloop', naam: 'Afdekfolie, stucloper & stofmaskers', eenheid: 'per set' },
  { id: 'primer', groep: 'voorbereiding', naam: 'Voorstrijkmiddel (primer)', inhoud: { standaard: REGELS.primerBusL, eenheid: 'L', soort: 'bus' } },
  { id: 'egaliseer', groep: 'voorbereiding', naam: 'Egaliseermiddel', inhoud: { standaard: REGELS.egaliseerZakKg, eenheid: 'kg', soort: 'zak' } },
  { id: 'waterdicht', groep: 'waterdicht', naam: 'Vloeibare waterdichting', inhoud: { standaard: REGELS.waterdichtEmmerKg, eenheid: 'kg', soort: 'emmer' } },
  { id: 'afdichtband', groep: 'waterdicht', naam: 'Afdichtband', inhoud: { standaard: REGELS.afdichtbandRolM, eenheid: 'm', soort: 'rol' } },
  { id: 'afdichtmanchet', groep: 'waterdicht', naam: 'Afdichtmanchetten (afvoer & leidingen)', eenheid: 'per set' },
  { id: 'vv-mat', groep: 'vloerverwarming', naam: 'Elektrische vloerverwarmingsmat', eenheid: 'per m²' },
  { id: 'vv-thermostaat', groep: 'vloerverwarming', naam: 'Klokthermostaat met vloersensor', eenheid: 'per stuk' },
  { id: 'isolatieplaat', groep: 'vloerverwarming', naam: 'Isolatieplaat XPS 6 mm', inhoud: { standaard: REGELS.isolatieplaatM2, eenheid: 'm²', soort: 'plaat' } },
  { id: 'wandtegel', groep: 'tegels', naam: 'Wandtegels', eenheid: 'per m²', toelichting: 'm² per doos stel je per project in' },
  { id: 'vloertegel', groep: 'tegels', naam: 'Vloertegels', eenheid: 'per m²', toelichting: 'm² per doos stel je per project in' },
  { id: 'tegellijm', groep: 'lijm-voeg', naam: 'Flexibele tegellijm (C2TE S1)', inhoud: { standaard: REGELS.lijmZakKg, eenheid: 'kg', soort: 'zak' } },
  { id: 'voegmiddel', groep: 'lijm-voeg', naam: 'Flexibel voegmiddel', inhoud: { standaard: REGELS.voegZakKg, eenheid: 'kg', soort: 'zak' } },
  { id: 'tegelkruisjes', groep: 'lijm-voeg', naam: 'Tegelkruisjes / levelclips', eenheid: 'per zak' },
  { id: 'kit', groep: 'afwerking', naam: 'Sanitairkit (schimmelwerend)', inhoud: { standaard: REGELS.kitKokerMl, eenheid: 'ml', soort: 'koker' } },
  { id: 'profiel', groep: 'afwerking', naam: 'Tegelprofiel aluminium', inhoud: { standaard: REGELS.profielLengteM, eenheid: 'm', soort: 'lengte' } },
  { id: 'pleister', groep: 'afwerking', naam: 'Vochtbestendige pleister', inhoud: { standaard: REGELS.pleisterZakKg, eenheid: 'kg', soort: 'zak' } },
  { id: 'verf', groep: 'afwerking', naam: 'Badkamerverf (anti-schimmel)', inhoud: { standaard: REGELS.verfBusL, eenheid: 'L', soort: 'bus' } },
  { id: 'glaswand', groep: 'sanitair', naam: 'Inloopdouche glaswand', eenheid: 'per stuk' },
  { id: 'douchegoot', groep: 'sanitair', naam: 'Douchegoot RVS', eenheid: 'per stuk' },
  { id: 'regendouche', groep: 'sanitair', naam: 'Thermostatische regendoucheset', eenheid: 'per stuk' },
  { id: 'inbouwreservoir', groep: 'sanitair', naam: 'Inbouwreservoir', eenheid: 'per stuk' },
  { id: 'hangtoilet', groep: 'sanitair', naam: 'Hangtoilet randloos', eenheid: 'per stuk' },
  { id: 'bedieningsplaat', groep: 'sanitair', naam: 'Bedieningsplaat', eenheid: 'per stuk' },
  { id: 'wastafelmeubel', groep: 'sanitair', naam: 'Wastafelmeubel met wastafel', eenheid: 'per stuk' },
  { id: 'wastafelkraan', groep: 'sanitair', naam: 'Wastafelkraan', eenheid: 'per stuk' },
  { id: 'spiegel', groep: 'sanitair', naam: 'Spiegel met verlichting', eenheid: 'per stuk' },
  { id: 'sifon', groep: 'sanitair', naam: 'Sifon & afvoerset', eenheid: 'per stuk' },
]

export const catalogusItem = (id: ProductId) => CATALOGUS.find((c) => c.id === id)

/** "per zak à 25 kg", "per m²", ... — optioneel met een afwijkende inhoud. */
export function eenheidLabel(item: CatalogusItem, inhoud?: number | null): string {
  if (item.inhoud) return `per ${item.inhoud.soort} à ${nl(inhoud ?? item.inhoud.standaard)} ${item.inhoud.eenheid}`
  return item.eenheid ?? 'per stuk'
}
