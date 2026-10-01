/** Projectopslag in localStorage met een klein, reactief store-patroon. */
import { useSyncExternalStore } from 'react'
import { normaliseerProject, voorbeeldProjecten } from './defaults'
import type { Project } from './types'

const SLEUTEL = 'slimmer-wonen:projecten:v1'
/** Versie van de voorbeeldset; bij een hogere versie worden nieuwe voorbeelden één keer toegevoegd. */
const VOORBEELD_SLEUTEL = 'slimmer-wonen:voorbeelden'
const VOORBEELD_VERSIE = 2

let projecten: Project[] = laad()
const luisteraars = new Set<() => void>()

function laad(): Project[] {
  try {
    const ruw = localStorage.getItem(SLEUTEL)
    if (ruw == null) {
      const vb = voorbeeldProjecten()
      localStorage.setItem(SLEUTEL, JSON.stringify(vb))
      localStorage.setItem(VOORBEELD_SLEUTEL, String(VOORBEELD_VERSIE))
      return vb
    }
    const data = JSON.parse(ruw)
    let lijst: Project[] = Array.isArray(data) ? data.filter((p) => p && typeof p.id === 'string').map(normaliseerProject) : []
    if (Number(localStorage.getItem(VOORBEELD_SLEUTEL) ?? 1) < VOORBEELD_VERSIE) {
      // Nieuwe voorbeelden (keuken, woonkamer) één keer toevoegen voor bestaande gebruikers.
      const nieuw = voorbeeldProjecten().filter((v) => ['keuken-bakker', 'woonkamer-visser'].includes(v.voorbeeldId ?? ''))
      lijst = [...lijst, ...nieuw.filter((v) => !lijst.some((p) => p.voorbeeldId === v.voorbeeldId))]
      localStorage.setItem(SLEUTEL, JSON.stringify(lijst))
      localStorage.setItem(VOORBEELD_SLEUTEL, String(VOORBEELD_VERSIE))
    }
    return lijst
  } catch {
    return []
  }
}

export let opslagFout: string | null = null

function bewaar(nieuw: Project[]) {
  projecten = nieuw
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(nieuw))
    opslagFout = null
  } catch {
    opslagFout = 'Opslaan is niet gelukt: de opslag van je browser is vol.'
  }
  luisteraars.forEach((f) => f())
}

const abonneer = (f: () => void) => {
  luisteraars.add(f)
  return () => luisteraars.delete(f)
}

export const useProjecten = () => useSyncExternalStore(abonneer, () => projecten)
export const useProject = (id: string | undefined) =>
  useSyncExternalStore(abonneer, () => projecten.find((p) => p.id === id))

export const projectStore = {
  alle: () => projecten,
  /** Vervangt alle projecten (bijv. bij het terugzetten van een back-up). */
  vervangAlles(nieuw: Project[]) {
    bewaar(nieuw.map(normaliseerProject))
  },
  voegToe(p: Project) {
    bewaar([p, ...projecten])
  },
  werkBij(id: string, wijzig: (p: Project) => Project) {
    bewaar(projecten.map((p) => (p.id === id ? { ...wijzig(p), updatedAt: Date.now() } : p)))
  },
  verwijder(id: string) {
    bewaar(projecten.filter((p) => p.id !== id))
  },
  herstelVoorbeelden() {
    const eigen = projecten.filter((p) => !p.voorbeeld)
    bewaar([...eigen, ...voorbeeldProjecten()])
  },
}
