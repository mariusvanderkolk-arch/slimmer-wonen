/** Projectopslag in localStorage met een klein, reactief store-patroon. */
import { useSyncExternalStore } from 'react'
import { voorbeeldProjecten } from './defaults'
import type { Project } from './types'

const SLEUTEL = 'slimmer-wonen:projecten:v1'

let projecten: Project[] = laad()
const luisteraars = new Set<() => void>()

function laad(): Project[] {
  try {
    const ruw = localStorage.getItem(SLEUTEL)
    if (ruw == null) {
      const vb = voorbeeldProjecten()
      localStorage.setItem(SLEUTEL, JSON.stringify(vb))
      return vb
    }
    const data = JSON.parse(ruw)
    return Array.isArray(data) ? data : []
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
