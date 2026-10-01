/**
 * AI-fotoanalyse (optioneel). Stuurt foto's rechtstreeks vanuit de browser naar een
 * vision-model van de gebruiker zelf (eigen API-sleutel, alleen lokaal bewaard).
 *
 * Providers:
 * - Gemini (Google AI Studio): native generateContent-API met inline afbeeldingen en JSON-uitvoer.
 * - OpenAI, xAI en "eigen" (OpenAI-compatibel): /chat/completions met image_url (data-URL).
 *
 * Het model moet strikte JSON teruggeven; `parseAnalyse` controleert en schoont die op.
 * Resultaten zijn altijd suggesties: de app neemt nooit automatisch iets over.
 */
import type { ProjectType, ScopeKey } from './types'
import { SCOPE_BASIS } from './ruimtes'

export type AiProvider = 'gemini' | 'openai' | 'xai' | 'eigen'

export interface ProviderInfo {
  id: AiProvider
  naam: string
  soort: 'gemini' | 'openai'
  baseUrl: string
  model: string
  sleutelUrl: string
  label: string
  notitie: string
}

export const PROVIDERS: ProviderInfo[] = [
  {
    id: 'gemini',
    naam: 'Google Gemini',
    soort: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-2.5-flash',
    sleutelUrl: 'https://aistudio.google.com/apikey',
    label: 'Aanbevolen · gratis te proberen',
    notitie:
      'Gratis te proberen, met limieten per minuut/dag; bij gratis gebruik mag Google gegevens gebruiken om modellen te verbeteren, dus minder geschikt voor klantfoto’s.',
  },
  {
    id: 'openai',
    naam: 'OpenAI',
    soort: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    sleutelUrl: 'https://platform.openai.com/api-keys',
    label: 'Betaald per gebruik',
    notitie: 'Betaald per gebruik, enkele centen per foto. Vereist een account met tegoed.',
  },
  {
    id: 'xai',
    naam: 'xAI Grok',
    soort: 'openai',
    baseUrl: 'https://api.x.ai/v1',
    model: 'grok-4.6',
    sleutelUrl: 'https://console.x.ai',
    label: 'Betaald per gebruik',
    notitie: 'Betaald per gebruik, enkele centen per foto. Vereist een account met tegoed.',
  },
  {
    id: 'eigen',
    naam: 'Eigen (OpenAI-compatibel)',
    soort: 'openai',
    baseUrl: '',
    model: '',
    sleutelUrl: '',
    label: 'Voor gevorderden',
    notitie: 'Elke dienst met een OpenAI-compatibele /chat/completions-API en beeldinvoer. Kosten volgens die dienst.',
  },
]

export const providerInfo = (id: AiProvider) => PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0]

export interface AiInstellingen {
  provider: AiProvider
  /** sleutel per provider, zodat wisselen niets wist */
  sleutels: Partial<Record<AiProvider, string>>
  modellen: Partial<Record<AiProvider, string>>
  /** basis-URL voor 'eigen' */
  baseUrl: string
}

export const standaardAiInstellingen = (): AiInstellingen => ({ provider: 'gemini', sleutels: {}, modellen: {}, baseUrl: '' })

export interface ActieveAi {
  provider: ProviderInfo
  sleutel: string
  model: string
  baseUrl: string
}

export function actieveAi(i: AiInstellingen): ActieveAi | null {
  const p = providerInfo(i.provider)
  const sleutel = (i.sleutels[p.id] ?? '').trim()
  const model = (i.modellen[p.id] ?? '').trim() || p.model
  const baseUrl = (p.id === 'eigen' ? i.baseUrl : p.baseUrl).trim().replace(/\/+$/, '')
  if (!sleutel || !model || !baseUrl) return null
  return { provider: p, sleutel, model, baseUrl }
}

// — Analyse-schema

export const ELEMENTEN = {
  bad: 'Bad',
  douche: 'Douche',
  toilet: 'Toilet',
  fontein: 'Fonteintje',
  wastafel: 'Wastafel',
  wandtegels: 'Wandtegels',
  vloertegels: 'Vloertegels',
  raam: 'Raam',
  deur: 'Deur',
  aanrecht: 'Aanrecht / keukenblok',
  laminaat: 'Laminaat / PVC',
  radiator: 'Radiator',
} as const
export type ElementType = keyof typeof ELEMENTEN

export type MaatVeld = 'lengte' | 'breedte' | 'hoogte' | 'tegelhoogte'
export const MAAT_LABELS: Record<MaatVeld, string> = { lengte: 'Lengte', breedte: 'Breedte', hoogte: 'Hoogte', tegelhoogte: 'Tegelhoogte wand' }
const MAAT_BEREIK: Record<MaatVeld, [number, number]> = { lengte: [0.5, 15], breedte: [0.5, 15], hoogte: [1.8, 4.5], tegelhoogte: [0.1, 4.5] }

export interface AiAnalyse {
  ruimte?: ProjectType
  elementen: { type: ElementType; aantal: number; toelichting: string; zekerheid: number }[]
  werkzaamheden: { key: ScopeKey; reden: string; zekerheid: number }[]
  afmetingen: Partial<Record<MaatVeld, { waarde: number; zekerheid: number; toelichting: string }>>
  opmerkingen: string[]
}

export class AiFout extends Error {
  soort: 'sleutel' | 'limiet' | 'model' | 'netwerk' | 'antwoord' | 'dienst' | 'geblokkeerd'
  constructor(soort: AiFout['soort'], bericht: string) {
    super(bericht)
    this.soort = soort
  }
}

export function bouwPrompt(type: ProjectType): { systeem: string; gebruiker: string } {
  const werk = Object.values(SCOPE_BASIS)
    .map((s) => `"${s.key}" (${s.label})`)
    .join(', ')
  const systeem = [
    'Je bent een ervaren Nederlandse renovatie-aannemer die foto’s van een ruimte beoordeelt voor een offerte.',
    'Antwoord UITSLUITEND met één JSON-object, zonder uitleg of markdown, volgens dit schema:',
    '{',
    '  "ruimte": "badkamer" | "toilet" | "keuken" | "vloer",',
    `  "elementen": [{ "type": ${Object.keys(ELEMENTEN).map((k) => `"${k}"`).join(' | ')}, "aantal": getal, "toelichting": korte tekst, "zekerheid": 0..1 }],`,
    `  "werkzaamheden": [{ "key": een van ${werk}, "reden": korte tekst, "zekerheid": 0..1 }],`,
    '  "afmetingen": { "lengte"|"breedte"|"hoogte"|"tegelhoogte": { "waarde": meters, "zekerheid": 0..1, "toelichting": korte tekst } },',
    '  "opmerkingen": [korte tekst]',
    '}',
    'Regels:',
    '- Noem alleen elementen die echt zichtbaar zijn.',
    '- Schat afmetingen alleen als er een referentie zichtbaar is (binnendeur ca. 2,10 m hoog en 0,83 m breed, tegelformaat, toiletpot ca. 0,40 m hoog). Laat een maat weg als je hem niet redelijk kunt schatten. Wees eerlijk over de zekerheid.',
    '- Werkzaamheden: wat nodig lijkt voor een volledige renovatie van deze ruimte, met een reden.',
    '- Opmerkingen: zaken die de aannemer moet controleren (vocht, leidingen, scheuren, ventilatie, scheve vloer).',
    '- Schrijf alle teksten in het Nederlands.',
  ].join('\n')
  const gebruiker = `Dit is volgens de gebruiker een ${type === 'vloer' ? 'woonkamer/vloer' : type}. Beoordeel de bijgevoegde foto’s.`
  return { systeem, gebruiker }
}

export interface Afbeelding {
  mime: string
  /** base64 zonder data:-prefix */
  data: string
}

export interface Verzoek {
  url: string
  init: { method: 'POST'; headers: Record<string, string>; body: string }
}

export function maakVerzoek(ai: ActieveAi, beelden: Afbeelding[], type: ProjectType): Verzoek {
  const { systeem, gebruiker } = bouwPrompt(type)
  if (ai.provider.soort === 'gemini') {
    const generationConfig: Record<string, unknown> = { responseMimeType: 'application/json', temperature: 0.2 }
    if (/^gemini-2\.5-flash/.test(ai.model)) generationConfig.thinkingConfig = { thinkingBudget: 0 }
    return {
      url: `${ai.baseUrl}/models/${encodeURIComponent(ai.model)}:generateContent`,
      init: {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': ai.sleutel },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systeem }] },
          contents: [{ role: 'user', parts: [{ text: gebruiker }, ...beelden.map((b) => ({ inline_data: { mime_type: b.mime, data: b.data } }))] }],
          generationConfig,
        }),
      },
    }
  }
  const body: Record<string, unknown> = {
    model: ai.model,
    messages: [
      { role: 'system', content: systeem },
      {
        role: 'user',
        content: [{ type: 'text', text: gebruiker }, ...beelden.map((b) => ({ type: 'image_url', image_url: { url: `data:${b.mime};base64,${b.data}` } }))],
      },
    ],
    response_format: { type: 'json_object' },
  }
  // redeneermodellen (o-serie, gpt-5) accepteren geen afwijkende temperature
  if (!/^(o\d|gpt-5)/.test(ai.model)) body.temperature = 0.2
  return {
    url: `${ai.baseUrl}/chat/completions`,
    init: { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${ai.sleutel}` }, body: JSON.stringify(body) },
  }
}

/** Haalt de modeltekst uit het API-antwoord. */
export function tekstUitAntwoord(soort: 'gemini' | 'openai', json: unknown): string {
  const j = json as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any
  if (soort === 'gemini') {
    if (j?.promptFeedback?.blockReason) throw new AiFout('geblokkeerd', 'De AI-dienst heeft deze foto’s geweigerd (inhoudsfilter). Probeer andere foto’s.')
    const parts = j?.candidates?.[0]?.content?.parts
    const tekst = Array.isArray(parts) ? parts.map((p: { text?: string }) => p?.text ?? '').join('') : ''
    if (!tekst) throw new AiFout('antwoord', 'De AI-dienst gaf een leeg antwoord. Probeer het nog eens.')
    return tekst
  }
  const tekst = j?.choices?.[0]?.message?.content
  if (typeof tekst === 'string' && tekst) return tekst
  if (Array.isArray(tekst)) return tekst.map((d: { text?: string }) => d?.text ?? '').join('')
  throw new AiFout('antwoord', 'De AI-dienst gaf een leeg antwoord. Probeer het nog eens.')
}

/** Nederlandse foutmelding bij een HTTP-fout van de AI-dienst. */
export function foutVoorStatus(status: number, body: string, provider: AiProvider): AiFout {
  const tekst = body.toLowerCase()
  if (status === 429 || tekst.includes('resource_exhausted') || tekst.includes('rate limit'))
    return new AiFout(
      'limiet',
      provider === 'gemini'
        ? 'Even rustig aan: de gratis limiet van Gemini is bereikt (per minuut of per dag). Wacht een minuut en probeer het opnieuw, of probeer het morgen nog eens.'
        : 'De limiet is bereikt: te veel verzoeken of je tegoed is op. Wacht even of controleer je tegoed bij de AI-dienst.',
    )
  if (status === 401 || status === 403 || tekst.includes('api key not valid') || tekst.includes('invalid api key') || tekst.includes('incorrect api key'))
    return new AiFout('sleutel', 'De API-sleutel wordt niet geaccepteerd. Controleer de sleutel bij Instellingen → AI.')
  if (status === 404 || tekst.includes('model') && tekst.includes('not found'))
    return new AiFout('model', 'Dit model is niet gevonden bij de AI-dienst. Controleer de modelnaam bij Instellingen → AI.')
  if (status === 400 && tekst.includes('location')) return new AiFout('dienst', 'De AI-dienst is niet beschikbaar in jouw regio.')
  if (status >= 500) return new AiFout('dienst', 'De AI-dienst is tijdelijk niet beschikbaar. Probeer het over een paar minuten opnieuw.')
  return new AiFout('dienst', `De AI-dienst gaf een fout (${status}). Probeer het opnieuw of kies een andere dienst.`)
}

// — Opschonen van het antwoord

const num = (x: unknown): number | undefined => {
  if (typeof x === 'number' && Number.isFinite(x)) return x
  if (typeof x === 'string') {
    const m = x.replace(',', '.').match(/-?\d+(\.\d+)?/)
    if (m) {
      let n = parseFloat(m[0])
      if (/cm\b/i.test(x)) n /= 100
      else if (/mm\b/i.test(x)) n /= 1000
      return n
    }
  }
  return undefined
}

function zekerheid(x: unknown): number {
  if (typeof x === 'string') {
    const t = x.toLowerCase()
    if (/hoog|high/.test(t)) return 0.8
    if (/midd|gemid|medium/.test(t)) return 0.5
    if (/laag|low/.test(t)) return 0.25
  }
  let n = num(x)
  if (n == null) return 0.5
  if (n > 1 && n <= 100) n /= 100
  return Math.min(1, Math.max(0, Math.round(n * 100) / 100))
}

const tekst = (x: unknown, max = 200) => (typeof x === 'string' ? x.trim().slice(0, max) : '')

/** Zoekt het JSON-object in de modeltekst (ook als het in ```json … ``` staat). */
export function vindJson(t: string): unknown {
  const zonderHekjes = t.replace(/```(?:json)?/gi, '').trim()
  try {
    return JSON.parse(zonderHekjes)
  } catch {
    const a = zonderHekjes.indexOf('{')
    const b = zonderHekjes.lastIndexOf('}')
    if (a >= 0 && b > a) {
      try {
        return JSON.parse(zonderHekjes.slice(a, b + 1))
      } catch {
        /* val door */
      }
    }
  }
  throw new AiFout('antwoord', 'Het antwoord van de AI was geen leesbare JSON. Probeer het nog eens.')
}

const RUIMTES: ProjectType[] = ['badkamer', 'toilet', 'keuken', 'vloer']
const SCOPE_KEYS = Object.keys(SCOPE_BASIS) as ScopeKey[]

/** Controleert en schoont een AI-antwoord op tot een veilige `AiAnalyse`. */
export function parseAnalyse(ruw: string | unknown): AiAnalyse {
  const j = (typeof ruw === 'string' ? vindJson(ruw) : ruw) as Record<string, unknown>
  if (!j || typeof j !== 'object' || Array.isArray(j)) throw new AiFout('antwoord', 'Het antwoord van de AI had niet de verwachte vorm.')

  const ruimteRuw = tekst(j.ruimte).toLowerCase()
  const ruimte = RUIMTES.find((r) => ruimteRuw.includes(r)) ?? (/woonkamer|kamer/.test(ruimteRuw) ? 'vloer' : undefined)

  const elementen: AiAnalyse['elementen'] = []
  for (const e of Array.isArray(j.elementen) ? j.elementen : []) {
    const o = e as Record<string, unknown>
    const type = tekst(o?.type).toLowerCase() as ElementType
    if (!(type in ELEMENTEN)) continue
    const bestaand = elementen.find((x) => x.type === type)
    const aantal = Math.min(20, Math.max(1, Math.round(num(o.aantal) ?? 1)))
    if (bestaand) bestaand.aantal = Math.max(bestaand.aantal, aantal)
    else elementen.push({ type, aantal, toelichting: tekst(o.toelichting), zekerheid: zekerheid(o.zekerheid) })
  }

  const werkzaamheden: AiAnalyse['werkzaamheden'] = []
  for (const w of Array.isArray(j.werkzaamheden) ? j.werkzaamheden : []) {
    const o = (typeof w === 'string' ? { key: w } : w) as Record<string, unknown>
    const k = tekst(o?.key ?? o?.werkzaamheid).toLowerCase()
    const key = SCOPE_KEYS.find((s) => s.toLowerCase() === k) ?? SCOPE_KEYS.find((s) => SCOPE_BASIS[s].label.toLowerCase() === k)
    if (!key || werkzaamheden.some((x) => x.key === key)) continue
    werkzaamheden.push({ key, reden: tekst(o.reden), zekerheid: zekerheid(o.zekerheid) })
  }

  const afmetingen: AiAnalyse['afmetingen'] = {}
  const a = (j.afmetingen && typeof j.afmetingen === 'object' ? j.afmetingen : {}) as Record<string, unknown>
  for (const veld of Object.keys(MAAT_BEREIK) as MaatVeld[]) {
    const v = a[veld]
    const o = (v && typeof v === 'object' ? v : { waarde: v }) as Record<string, unknown>
    const waarde = num(o.waarde ?? o.value)
    const [min, max] = MAAT_BEREIK[veld]
    if (waarde == null || waarde < min || waarde > max) continue
    afmetingen[veld] = { waarde: Math.round(waarde * 100) / 100, zekerheid: zekerheid(o.zekerheid), toelichting: tekst(o.toelichting) }
  }

  const opmerkingen = (Array.isArray(j.opmerkingen) ? j.opmerkingen : typeof j.opmerkingen === 'string' ? [j.opmerkingen] : [])
    .map((x) => tekst(x, 300))
    .filter(Boolean)
    .slice(0, 8)

  return { ruimte, elementen: elementen.slice(0, 20), werkzaamheden: werkzaamheden.slice(0, 16), afmetingen, opmerkingen }
}

export const zekerheidLabel = (z: number) => (z >= 0.7 ? 'hoog' : z >= 0.4 ? 'middel' : 'laag')

/** Voert de analyse uit. `doeFetch` is te vervangen in tests. */
export async function analyseer(
  ai: ActieveAi,
  beelden: Afbeelding[],
  type: ProjectType,
  doeFetch: typeof fetch = fetch,
  signal?: AbortSignal,
): Promise<AiAnalyse> {
  if (beelden.length === 0) throw new AiFout('antwoord', 'Kies minstens één foto.')
  const { url, init } = maakVerzoek(ai, beelden, type)
  let res: Response
  try {
    res = await doeFetch(url, { ...init, signal })
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') throw new AiFout('netwerk', 'De analyse is gestopt of duurde te lang.')
    throw new AiFout('netwerk', 'Kon de AI-dienst niet bereiken. Controleer je internetverbinding.')
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw foutVoorStatus(res.status, body, ai.provider.id)
  }
  const json = await res.json().catch(() => {
    throw new AiFout('antwoord', 'De AI-dienst gaf een onleesbaar antwoord.')
  })
  return parseAnalyse(tekstUitAntwoord(ai.provider.soort, json))
}

/** Korte test of sleutel en model werken (één klein tekstverzoek, zonder foto's). */
export async function testVerbinding(ai: ActieveAi, doeFetch: typeof fetch = fetch): Promise<void> {
  const { url, init } = maakVerzoek(ai, [], 'badkamer')
  let res: Response
  try {
    res = await doeFetch(url, init)
  } catch {
    throw new AiFout('netwerk', 'Kon de AI-dienst niet bereiken. Controleer je internetverbinding (en bij een eigen dienst de basis-URL).')
  }
  if (!res.ok) throw foutVoorStatus(res.status, await res.text().catch(() => ''), ai.provider.id)
  tekstUitAntwoord(ai.provider.soort, await res.json().catch(() => ({})))
}
