/** AI-instellingen (alleen op dit apparaat) en het voorbereiden van foto's voor analyse. */
import { maakLokaleStore } from './lokaal'
import { standaardAiInstellingen, type AiInstellingen, type AiProvider, type Afbeelding } from './ai'
import { haalFoto } from './photos'
import { sleutel } from './modus'

const PROVIDER_IDS: AiProvider[] = ['gemini', 'openai', 'xai', 'eigen']

export const aiStore = maakLokaleStore<AiInstellingen>(sleutel('ai:v1'), standaardAiInstellingen, (ruw) => {
  const r = (ruw ?? {}) as Partial<AiInstellingen>
  const tekstMap = (x: unknown) =>
    Object.fromEntries(Object.entries(x && typeof x === 'object' ? x : {}).filter(([k, v]) => PROVIDER_IDS.includes(k as AiProvider) && typeof v === 'string'))
  return {
    provider: PROVIDER_IDS.includes(r.provider as AiProvider) ? (r.provider as AiProvider) : 'gemini',
    sleutels: tekstMap(r.sleutels),
    modellen: tekstMap(r.modellen),
    baseUrl: typeof r.baseUrl === 'string' ? r.baseUrl : '',
  }
})

export const useAi = () => aiStore.use()

/** Laadt een opgeslagen foto en verkleint hem (max. 1024 px, JPEG) voor verzending. */
export async function fotoVoorAi(id: string, max = 1024): Promise<Afbeelding | null> {
  const blob = await haalFoto(id)
  if (!blob) return null
  const bmp = await createImageBitmap(blob)
  const schaal = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * schaal)
  const h = Math.round(bmp.height * schaal)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  bmp.close()
  const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
  return { mime: 'image/jpeg', data: dataUrl.slice(dataUrl.indexOf(',') + 1) }
}
