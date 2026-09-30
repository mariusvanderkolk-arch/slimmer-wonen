const nf = (d: number) => new Intl.NumberFormat('nl-NL', { maximumFractionDigits: d, minimumFractionDigits: 0 })
const eur = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' })

export const getal = (n: number, d = 2) => nf(d).format(Math.round(n * 10 ** d) / 10 ** d)
export const m2 = (n: number) => `${getal(n)} m²`
export const euro = (n: number) => eur.format(n)
export const datum = (t: number) =>
  new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(t))
export const kortDatum = (t: number) => new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short' }).format(new Date(t))

/** Leest een getal in dat met komma of punt is ingevoerd. */
export const leesGetal = (s: string): number => {
  const n = parseFloat(s.replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}
