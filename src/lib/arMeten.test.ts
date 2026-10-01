import { describe, expect, it, vi } from 'vitest'
import { afstand, arOndersteuning, cirkelPunten, maatTekst, positieUitMatrix, transformeer } from './arMeten'

const I = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
const verschoven = (x: number, y: number, z: number) => [...I.slice(0, 12), x, y, z, 1]

describe('AR-rekenwerk', () => {
  it('afstand tussen twee punten in meters', () => {
    expect(afstand([0, 0, 0], [3, 0, 4])).toBe(5)
    expect(afstand(positieUitMatrix(verschoven(1, 0, -1)), positieUitMatrix(verschoven(1, 0, -3.47)))).toBeCloseTo(2.47, 6)
  })
  it('transformeert punten met een kolom-georiënteerde matrix', () => {
    expect(transformeer(verschoven(1, 2, 3), [1, 1, 1])).toEqual([2, 3, 4])
    // 90° om de y-as
    const rotY = [0, 0, -1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1]
    const p = transformeer(rotY, [1, 0, 0])
    expect(p[0]).toBeCloseTo(0)
    expect(p[2]).toBeCloseTo(-1)
  })
  it('vizier ligt in het vlak van het oppervlak', () => {
    const pts = cirkelPunten(verschoven(0, 1.2, 0), 0.05, 8)
    expect(pts).toHaveLength(24)
    for (let i = 1; i < pts.length; i += 3) expect(pts[i]).toBeCloseTo(1.2)
    expect(Math.hypot(pts[0], pts[2])).toBeCloseTo(0.05)
  })
  it('maattekst', () => {
    expect(maatTekst(2.4689)).toBe('2,47 m')
    expect(maatTekst(0.862)).toBe('86 cm')
  })
})

describe('arOndersteuning', () => {
  const nav = (xr?: unknown) => ({ xr }) as unknown as Navigator
  it('vereist https', async () => {
    expect(await arOndersteuning(nav({ isSessionSupported: vi.fn() }), false)).toBe('geen-https')
  })
  it('geen WebXR (bijv. Safari op iPhone)', async () => {
    expect(await arOndersteuning(nav(undefined), true)).toBe('geen-webxr')
  })
  it('WebXR zonder AR (bijv. desktop)', async () => {
    expect(await arOndersteuning(nav({ isSessionSupported: vi.fn().mockResolvedValue(false) }), true)).toBe('geen-ar')
    expect(await arOndersteuning(nav({ isSessionSupported: vi.fn().mockRejectedValue(new Error('x')) }), true)).toBe('geen-ar')
  })
  it('Android Chrome met ARCore', async () => {
    const f = vi.fn().mockResolvedValue(true)
    expect(await arOndersteuning(nav({ isSessionSupported: f }), true)).toBe('ja')
    expect(f).toHaveBeenCalledWith('immersive-ar')
  })
})
