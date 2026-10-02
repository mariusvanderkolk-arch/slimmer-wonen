/** React.lazy met één automatische herlaadpoging als een onderdeel na een update niet meer bestaat. */
import { lazy, type ComponentType } from 'react'
import { sleutel } from './modus'

const SLEUTEL = sleutel('herladen')

export function laadLater<P extends object>(laad: () => Promise<ComponentType<P>>) {
  return lazy(async () => {
    try {
      const c = await laad()
      sessionStorage.removeItem(SLEUTEL)
      return { default: c }
    } catch (e) {
      // na een nieuwe versie zijn oude bestanden weg: één keer verversen lost dat op
      if (!sessionStorage.getItem(SLEUTEL)) {
        sessionStorage.setItem(SLEUTEL, '1')
        location.reload()
        return new Promise<never>(() => {})
      }
      throw e
    }
  })
}
