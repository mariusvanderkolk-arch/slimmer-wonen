/**
 * AR-meten (beta) met WebXR: twee punten op een oppervlak tikken, afstand in meters.
 * Alleen de pure rekendelen en de detectie staan hier (testbaar); de sessie zit in ArMeten.tsx.
 */

export type Vec3 = [number, number, number]

/** Positie (translatie) uit een 4×4 kolom-georiënteerde matrix (WebXR-conventie). */
export const positieUitMatrix = (m: ArrayLike<number>): Vec3 => [m[12], m[13], m[14]]

export function afstand(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

/** Past een 4×4 kolom-georiënteerde matrix toe op een punt. */
export function transformeer(m: ArrayLike<number>, p: Vec3): Vec3 {
  const [x, y, z] = p
  return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]
}

/** Punten van een cirkel (vizier) in het vlak van een hit-test-pose (y-as = normaal van het oppervlak). */
export function cirkelPunten(m: ArrayLike<number>, straal = 0.05, n = 32): number[] {
  const uit: number[] = []
  for (let i = 0; i < n; i++) {
    const h = (i / n) * Math.PI * 2
    uit.push(...transformeer(m, [Math.cos(h) * straal, 0, Math.sin(h) * straal]))
  }
  return uit
}

/** Afronden op hele centimeters, zoals een meetlint. */
export const opCm = (m: number) => Math.round(m * 100) / 100

/** Maat zoals getoond in de AR-weergave, bijv. "2,47 m" of "86 cm". */
export function maatTekst(m: number): string {
  if (m < 1) return `${Math.round(m * 100)} cm`
  return `${opCm(m).toFixed(2).replace('.', ',')} m`
}

export type ArSteun = 'ja' | 'geen-https' | 'geen-webxr' | 'geen-ar'

/** Kan dit toestel/deze browser een WebXR AR-sessie starten? */
export async function arOndersteuning(nav: Navigator = navigator, veilig: boolean = globalThis.isSecureContext ?? false): Promise<ArSteun> {
  if (!veilig) return 'geen-https'
  const xr = (nav as Navigator & { xr?: XRSystem }).xr
  if (!xr || typeof xr.isSessionSupported !== 'function') return 'geen-webxr'
  try {
    return (await xr.isSessionSupported('immersive-ar')) ? 'ja' : 'geen-ar'
  } catch {
    return 'geen-ar'
  }
}

export const AR_UITLEG: Record<Exclude<ArSteun, 'ja'>, string> = {
  'geen-https': 'AR werkt alleen via een beveiligde verbinding (https).',
  'geen-webxr': 'Deze browser ondersteunt geen WebXR. AR-meten werkt met Chrome op een Android-telefoon met ARCore (Google Play-services voor AR). Safari op iPhone ondersteunt dit nog niet.',
  'geen-ar': 'Dit toestel ondersteunt geen AR in de browser. AR-meten werkt met Chrome op een Android-telefoon met ARCore (Google Play-services voor AR).',
}
