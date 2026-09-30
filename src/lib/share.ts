import { euro } from './format'
import { winkelNaam } from './prices'
import type { Inkooplijst } from './shopping'
import type { Project } from './types'

/** Platte-tekstversie van de inkooplijst om te kopiëren of te delen. */
export function inkoopTekst(p: Project, lijst: Inkooplijst): string {
  const regels: string[] = [`Inkooplijst – ${p.naam}${p.klant ? ` (${p.klant})` : ''}`, '']
  for (const g of lijst.groepen) {
    regels.push(g.naam.toUpperCase())
    for (const r of g.regels) {
      const vink = p.afgevinkt[r.sleutel] ? '[x]' : '[ ]'
      const prijs = r.goedkoopste ? ` – ${euro(r.goedkoopste.totaal)} (${winkelNaam(r.goedkoopste.winkel)})` : ''
      const g = r.goedkoopste
      regels.push(`${vink} ${g?.aantal ?? r.aantal}× ${r.naam}${r.spec ? ` ${r.spec}` : ''} – ${g?.verpakking ?? r.verpakking}${prijs}`)
    }
    regels.push('')
  }
  regels.push(`Totaal (goedkoopste per artikel): ${euro(lijst.goedkoopsteMix)}`)
  const st = lijst.prijsStatus
  if (st.eigen === 0) regels.push('Let op: richtprijzen zijn voorbeeldprijzen, geen actuele winkelprijzen.')
  else if (st.voorbeeld > 0) regels.push(`Let op: ${st.voorbeeld} van ${st.eigen + st.voorbeeld} prijzen zijn nog voorbeeldprijzen.`)
  else regels.push('Prijzen: eigen prijzen.')
  return regels.join('\n')
}

export async function deelOfKopieer(titel: string, tekst: string): Promise<'gedeeld' | 'gekopieerd' | 'mislukt'> {
  if (navigator.share) {
    try {
      await navigator.share({ title: titel, text: tekst })
      return 'gedeeld'
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return 'mislukt'
    }
  }
  return kopieer(tekst)
}

export async function kopieer(tekst: string): Promise<'gekopieerd' | 'mislukt'> {
  try {
    await navigator.clipboard.writeText(tekst)
    return 'gekopieerd'
  } catch {
    const ta = document.createElement('textarea')
    ta.value = tekst
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok ? 'gekopieerd' : 'mislukt'
  }
}
