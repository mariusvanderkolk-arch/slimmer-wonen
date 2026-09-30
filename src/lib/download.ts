/** Laat de browser een tekstbestand downloaden. */
export function downloadBestand(naam: string, inhoud: string, type: string) {
  const url = URL.createObjectURL(new Blob([inhoud], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = naam
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const vandaagIso = () => new Date().toISOString().slice(0, 10)
