/**
 * AR-meten (beta) met WebXR hit-test. Tik op twee punten op een oppervlak; de afstand
 * verschijnt live. Daarna kies je in welk veld de maat komt. Wordt lazy geladen.
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Loader2, RotateCcw, ScanLine, Smartphone, X } from 'lucide-react'
import { Button, Dialog } from './ui'
import { afstand, AR_UITLEG, arOndersteuning, cirkelPunten, maatTekst, opCm, positieUitMatrix, type ArSteun, type Vec3 } from '../lib/arMeten'

export type ArVeld = 'lengte' | 'breedte' | 'hoogte'
const VELDEN: { k: ArVeld; label: string }[] = [
  { k: 'lengte', label: 'Lengte' },
  { k: 'breedte', label: 'Breedte' },
  { k: 'hoogte', label: 'Hoogte' },
]

const VS = 'attribute vec3 p;uniform mat4 pr,vw;void main(){gl_Position=pr*vw*vec4(p,1.0);gl_PointSize=14.0;}'
const FS = 'precision mediump float;uniform vec4 c;void main(){gl_FragColor=c;}'

function maakTekenaar(gl: WebGLRenderingContext) {
  const sh = (t: number, s: string) => {
    const x = gl.createShader(t)!
    gl.shaderSource(x, s)
    gl.compileShader(x)
    return x
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS))
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS))
  gl.linkProgram(prog)
  const buf = gl.createBuffer()
  const loc = { p: gl.getAttribLocation(prog, 'p'), pr: gl.getUniformLocation(prog, 'pr'), vw: gl.getUniformLocation(prog, 'vw'), c: gl.getUniformLocation(prog, 'c') }
  return (proj: Float32Array, view: Float32Array, punten: number[], modus: number, kleur: [number, number, number, number]) => {
    if (!punten.length) return
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(punten), gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(loc.p)
    gl.vertexAttribPointer(loc.p, 3, gl.FLOAT, false, 0, 0)
    gl.uniformMatrix4fv(loc.pr, false, proj)
    gl.uniformMatrix4fv(loc.vw, false, view)
    gl.uniform4fv(loc.c, kleur)
    gl.drawArrays(modus, 0, punten.length / 3)
  }
}

export default function ArMeten({ open, onClose, onGebruik }: { open: boolean; onClose: () => void; onGebruik: (veld: ArVeld, waarde: number) => void }) {
  const [steun, setSteun] = useState<ArSteun | 'controleren'>('controleren')
  const [actief, setActief] = useState(false)
  const [fout, setFout] = useState<string>()
  const [live, setLive] = useState<{ vizier: boolean; punten: number; maat: number | null }>({ vizier: false, punten: 0, maat: null })
  const [resultaat, setResultaat] = useState<number | null>(null)
  const overlay = useRef<HTMLDivElement>(null)
  const sessie = useRef<XRSession | null>(null)
  const punten = useRef<Vec3[]>([])
  const metingKlaar = useRef<number | null>(null)

  useEffect(() => {
    if (!open) return
    setResultaat(null)
    arOndersteuning().then(setSteun)
  }, [open])
  // tikken op knoppen in de AR-weergave mag geen meetpunt zetten
  useEffect(() => {
    const el = overlay.current
    if (!el) return
    const f = (e: Event) => {
      if ((e.target as Element | null)?.closest?.('.ar-ui')) e.preventDefault()
    }
    el.addEventListener('beforexrselect', f)
    return () => el.removeEventListener('beforexrselect', f)
  }, [])
  useEffect(() => () => void sessie.current?.end().catch(() => {}), [])

  async function startAr() {
    setFout(undefined)
    setResultaat(null)
    punten.current = []
    metingKlaar.current = null
    try {
      const xr = navigator.xr!
      const s = await xr.requestSession('immersive-ar', {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: overlay.current ? { root: overlay.current } : undefined,
      })
      sessie.current = s
      setActief(true)
      const metOverlay = !!s.domOverlayState
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl', { xrCompatible: true, alpha: true, antialias: true }) as WebGLRenderingContext
      await gl.makeXRCompatible()
      s.updateRenderState({ baseLayer: new XRWebGLLayer(s, gl) })
      const ruimte = await s.requestReferenceSpace('local')
      const kijker = await s.requestReferenceSpace('viewer')
      const bron = await s.requestHitTestSource!({ space: kijker })
      const teken = maakTekenaar(gl)
      let vizier: Float32Array | null = null
      let laatst = ''

      s.addEventListener('select', () => {
        if (!vizier) return
        if (punten.current.length >= 2) punten.current = []
        punten.current.push(positieUitMatrix(vizier))
        if (punten.current.length === 2) {
          metingKlaar.current = afstand(punten.current[0], punten.current[1])
          if (!metOverlay) s.end() // zonder overlay: direct terug naar het scherm om te kiezen
        }
      })
      s.addEventListener('end', () => {
        bron?.cancel()
        sessie.current = null
        setActief(false)
        if (metingKlaar.current != null) setResultaat(opCm(metingKlaar.current))
      })

      const frame: XRFrameRequestCallback = (_t, f) => {
        s.requestAnimationFrame(frame)
        const pose = f.getViewerPose(ruimte)
        const laag = s.renderState.baseLayer!
        gl.bindFramebuffer(gl.FRAMEBUFFER, laag.framebuffer)
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        if (!pose) return
        const hits = bron ? f.getHitTestResults(bron) : []
        vizier = hits.length ? (hits[0].getPose(ruimte)?.transform.matrix ?? null) : null
        const p = punten.current
        const eind = p.length === 1 && vizier ? positieUitMatrix(vizier) : p[1]
        for (const view of pose.views) {
          const vp = laag.getViewport(view)!
          gl.viewport(vp.x, vp.y, vp.width, vp.height)
          const pr = view.projectionMatrix
          const vw = view.transform.inverse.matrix
          if (vizier) teken(pr, vw, cirkelPunten(vizier, 0.05, 40), gl.LINE_LOOP, [1, 1, 1, 0.95])
          if (p[0] && eind) teken(pr, vw, [...p[0], ...eind], gl.LINES, [0.85, 0.7, 0.4, 1])
          teken(pr, vw, p.flat(), gl.POINTS, [0.85, 0.7, 0.4, 1])
        }
        const maat = p[0] && eind ? afstand(p[0], eind) : null
        const sleutel = `${!!vizier}|${p.length}|${maat == null ? '' : Math.round(maat * 100)}`
        if (sleutel !== laatst) {
          laatst = sleutel
          setLive({ vizier: !!vizier, punten: p.length, maat })
        }
      }
      s.requestAnimationFrame(frame)
    } catch (e) {
      sessie.current?.end().catch(() => {})
      setActief(false)
      const naam = (e as Error)?.name
      setFout(
        naam === 'NotSupportedError'
          ? 'AR-sessie kon niet starten: dit toestel ondersteunt de benodigde functies (hit-test) niet.'
          : naam === 'SecurityError' || naam === 'NotAllowedError'
            ? 'Geen toestemming voor de camera of AR. Sta cameratoegang toe en probeer opnieuw.'
            : 'AR-sessie kon niet starten. Probeer het opnieuw of vul de maten handmatig in.',
      )
    }
  }

  const stopAr = () => sessie.current?.end().catch(() => {})
  const opnieuw = () => {
    punten.current = []
    metingKlaar.current = null
    setLive((l) => ({ ...l, punten: 0, maat: null }))
  }

  const instructie = !live.vizier
    ? 'Beweeg je telefoon langzaam over de vloer of wand tot het witte vizier verschijnt.'
    : live.punten === 0
      ? 'Richt op het beginpunt en tik op het scherm.'
      : live.punten === 1
        ? 'Richt op het eindpunt en tik nogmaals.'
        : 'Klaar? Tik op “Gebruiken”, of tik opnieuw voor een nieuwe meting.'

  return (
    <>
      {createPortal(
        <div ref={overlay} className={actief ? 'fixed inset-0 z-[60] flex flex-col justify-between p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-white' : 'hidden'}>
          <div className="flex items-start justify-between gap-3" onPointerDown={(e) => e.stopPropagation()}>
            <p className="rounded-2xl bg-black/55 px-4 py-3 text-[0.95rem] leading-snug backdrop-blur" aria-live="polite">
              {instructie}
            </p>
            <button type="button" aria-label="AR stoppen" onClick={stopAr} className="ar-ui grid h-11 w-11 shrink-0 place-items-center rounded-full bg-black/55 backdrop-blur">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex flex-col items-center gap-3">
            {live.maat != null && <p className="tabnum rounded-2xl bg-black/60 px-5 py-2 text-3xl font-semibold backdrop-blur">{maatTekst(live.maat)}</p>}
            {live.punten > 0 && (
              <div className="flex gap-2">
                <button type="button" onClick={opnieuw} className="ar-ui inline-flex h-12 items-center gap-2 rounded-xl bg-black/55 px-5 font-medium backdrop-blur">
                  <RotateCcw className="h-4 w-4" /> Opnieuw
                </button>
                {live.punten === 2 && (
                  <button type="button" onClick={stopAr} className="ar-ui inline-flex h-12 items-center gap-2 rounded-xl bg-[#d9b36b] px-5 font-semibold text-[#2b2620]">
                    <Check className="h-4 w-4" /> Gebruiken
                  </button>
                )}
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
      <Dialog open={open && !actief} onClose={onClose} title="Meten met AR" sub="Beta · werkt alleen op toestellen met AR-ondersteuning">
        {resultaat != null ? (
          <div>
            <p className="text-[0.85rem] text-ink-muted">Gemeten afstand</p>
            <p className="tabnum font-display text-5xl font-semibold text-ink">{maatTekst(resultaat)}</p>
            <p className="mt-4 text-[0.85rem] font-medium text-ink-soft">Invullen als:</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {VELDEN.map((v) => (
                <Button key={v.k} variant="secondary" onClick={() => onGebruik(v.k, resultaat)}>
                  {v.label}
                </Button>
              ))}
            </div>
            <Button variant="ghost" className="mt-3" icon={<RotateCcw className="h-4 w-4" />} onClick={startAr}>
              Opnieuw meten
            </Button>
            <p className="mt-3 text-[0.75rem] text-ink-muted">AR-metingen wijken vaak een paar centimeter af. Controleer belangrijke maten met een meetlint.</p>
          </div>
        ) : steun === 'controleren' ? (
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" /> Controleren of dit toestel AR ondersteunt…
          </p>
        ) : steun !== 'ja' ? (
          <div>
            <div className="flex gap-3 rounded-xl bg-sand-50 p-4 ring-1 ring-sand-200">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
              <div className="text-[0.85rem] leading-relaxed text-ink-soft">
                <p className="font-semibold text-ink">Niet ondersteund op dit toestel</p>
                <p className="mt-0.5">{AR_UITLEG[steun]}</p>
              </div>
            </div>
            <p className="mt-4 text-[0.85rem] text-ink-soft">Geen probleem: vul de maten handmatig in met een meetlint of laserafstandsmeter.</p>
          </div>
        ) : (
          <div className="text-[0.86rem] leading-relaxed text-ink-soft">
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>Zorg voor goed licht en beweeg je telefoon rustig rond tot het vizier verschijnt.</li>
              <li>Tik op het beginpunt (bijv. de hoek van een wand bij de vloer).</li>
              <li>Tik op het eindpunt. De afstand staat direct in beeld.</li>
              <li>Kies daarna of het de lengte, breedte of hoogte is.</li>
            </ol>
            <p className="mt-3 text-[0.78rem] text-ink-muted">De camera wordt alleen lokaal gebruikt; er worden geen beelden opgeslagen of verstuurd.</p>
            {fout && (
              <p className="mt-3 text-sm text-rust" role="alert">
                {fout}
              </p>
            )}
          </div>
        )}
        {steun === 'ja' && resultaat == null && (
          <Button variant="gold" className="mt-5 w-full" icon={<ScanLine className="h-4 w-4" />} onClick={startAr}>
            Start AR-meting
          </Button>
        )}
      </Dialog>
    </>
  )
}
