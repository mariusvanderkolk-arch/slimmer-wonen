/** Eenvoudige hash-router (werkt zonder serverconfiguratie, ook op GitHub Pages). */
import { useEffect, useState } from 'react'

export type Stap = 'opmeten' | 'berekening' | 'inkoop' | 'offerte' | 'planning'

export type Route =
  | { naam: 'home' }
  | { naam: 'nieuw' }
  | { naam: 'over' }
  | { naam: 'prijzen'; terugNaar?: string }
  | { naam: 'bewerken'; id: string }
  | { naam: 'project'; id: string; stap: Stap }

const STAPPEN: Stap[] = ['opmeten', 'berekening', 'inkoop', 'offerte', 'planning']

export function parse(hash: string): Route {
  const delen = hash.replace(/^#\/?/, '').split('/').filter(Boolean)
  if (delen[0] === 'nieuw') return { naam: 'nieuw' }
  if (delen[0] === 'over') return { naam: 'over' }
  if (delen[0] === 'prijzen') return { naam: 'prijzen', terugNaar: delen[1] }
  if (delen[0] === 'project' && delen[1]) {
    if (delen[2] === 'bewerken') return { naam: 'bewerken', id: delen[1] }
    const stap = STAPPEN.includes(delen[2] as Stap) ? (delen[2] as Stap) : 'opmeten'
    return { naam: 'project', id: delen[1], stap }
  }
  return { naam: 'home' }
}

export const ga = (pad: string) => {
  location.hash = pad
}

export function useRoute(): Route {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const f = () => {
      setHash(location.hash)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  return parse(hash)
}
