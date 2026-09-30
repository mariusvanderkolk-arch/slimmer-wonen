/** Kern-datatypes van Slimmer Wonen. Alle maten in meters, tenzij anders vermeld. */

export type ScopeKey =
  | 'sloopwerk'
  | 'waterdicht'
  | 'egaliseren'
  | 'vloerverwarming'
  | 'wandtegels'
  | 'vloertegels'
  | 'inloopdouche'
  | 'toilet'
  | 'wastafelmeubel'
  | 'kitwerk'
  | 'stucwerk'

export type Scope = Record<ScopeKey, boolean>

export type ProjectType = 'badkamer'

export interface Opening {
  id: string
  type: 'deur' | 'raam'
  /** breedte in m */
  breedte: number
  /** hoogte in m */
  hoogte: number
  /** onderkant opening boven de vloer in m (deur = 0) */
  vanafVloer: number
}

export interface TileSpec {
  /** lengte tegel in cm */
  lengte: number
  /** breedte tegel in cm */
  breedte: number
  /** m² per doos */
  m2PerDoos: number
  /** tegeldikte in mm */
  dikte: number
  /** voegbreedte in mm */
  voeg: number
}

export interface Afmetingen {
  lengte: number
  breedte: number
  hoogte: number
  /** tot welke hoogte de wanden betegeld worden (m) */
  tegelhoogte: number
  openingen: Opening[]
  /** douchezone (inloopdouche) in m */
  douche: { breedte: number; diepte: number }
  /** laagdikte egaliseren in mm */
  egaliseerDikte: number
}

export interface PhotoRef {
  id: string
  naam: string
  createdAt: number
}

export interface Project {
  id: string
  naam: string
  klant: string
  adres: string
  type: ProjectType
  createdAt: number
  updatedAt: number
  scope: Scope
  afmetingen: Afmetingen
  wandtegel: TileSpec
  vloertegel: TileSpec
  /** snijverlies in procenten */
  snijverlies: number
  /** uurtarief in euro incl. btw, voor de indicatieve arbeidsraming */
  uurtarief: number
  fotos: PhotoRef[]
  /** afgevinkte regels op de inkooplijst */
  afgevinkt: Record<string, boolean>
  notities: string
  voorbeeld?: boolean
}
