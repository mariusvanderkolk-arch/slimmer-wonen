import { useId } from 'react'
import type { Afmetingen, Scope, TileSpec } from '../lib/types'
import { getal } from '../lib/format'

/** Schematische plattegrond die meeschaalt met de ingevoerde maten. */
export function Plattegrond({
  afmetingen,
  scope,
  vloertegel,
  className = '',
  bg = '#FFFDF9',
}: {
  afmetingen: Afmetingen
  scope: Pick<Scope, 'inloopdouche' | 'toilet' | 'wastafelmeubel'>
  vloertegel?: TileSpec
  className?: string
  bg?: string
}) {
  const arc = `arcering-${useId().replace(/:/g, '')}`
  const L = Math.max(0.5, afmetingen.lengte || 0.5)
  const B = Math.max(0.5, afmetingen.breedte || 0.5)
  const max = 260
  const s = max / Math.max(L, B)
  const W = L * s
  const H = B * s
  const pad = 46
  const vbW = W + pad * 2
  const vbH = H + pad * 2
  const x0 = pad
  const y0 = pad

  const deur = afmetingen.openingen.find((o) => o.type === 'deur')
  const raam = afmetingen.openingen.find((o) => o.type === 'raam')
  const deurW = deur ? Math.min(deur.breedte, L * 0.6) * s : 0
  const deurX = x0 + Math.min(0.25 * s, W * 0.15)
  const raamW = raam ? Math.min(raam.breedte, L * 0.5) * s : 0
  const raamX = x0 + W * 0.35

  const dW = Math.min(afmetingen.douche.breedte, L) * s
  const dD = Math.min(afmetingen.douche.diepte, B) * s

  // tegelraster
  const tx = vloertegel ? (vloertegel.lengte / 100) * s : 0.6 * s
  const ty = vloertegel ? (vloertegel.breedte / 100) * s : 0.6 * s
  const lijnen: string[] = []
  if (tx > 6) for (let x = x0 + tx; x < x0 + W - 1; x += tx) lijnen.push(`M${x} ${y0}V${y0 + H}`)
  if (ty > 6) for (let y = y0 + ty; y < y0 + H - 1; y += ty) lijnen.push(`M${x0} ${y}H${x0 + W}`)

  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} className={className} role="img" aria-label={`Plattegrond ${getal(L)} bij ${getal(B)} meter`}>
      <defs>
        <pattern id={arc} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="#C8A96A" strokeOpacity=".45" strokeWidth="1.4" />
        </pattern>
      </defs>
      <rect x={x0} y={y0} width={W} height={H} fill="#FFFDF9" />
      <path d={lijnen.join('')} stroke="#E2D5BF" strokeWidth="1" />
      {scope.inloopdouche && (
        <g>
          <rect x={x0 + W - dW} y={y0} width={dW} height={dD} fill="#F4EAD6" />
          <rect x={x0 + W - dW} y={y0} width={dW} height={dD} fill={`url(#${arc})`} />
          <line x1={x0 + W - dW} y1={y0 + dD} x2={x0 + W - dW * 0.15} y2={y0 + dD} stroke="#9C7B43" strokeWidth="3" strokeLinecap="round" />
          <line x1={x0 + W - dW + 10} y1={y0 + 14} x2={x0 + W - 10} y2={y0 + 14} stroke="#B8955A" strokeWidth="3" strokeLinecap="round" />
          <text x={x0 + W - dW / 2} y={y0 + dD / 2 + 4} textAnchor="middle" className="fill-gold-700" fontSize="11" fontWeight="600" letterSpacing="1.2">
            DOUCHE
          </text>
        </g>
      )}
      {scope.toilet && (
        <g transform={`translate(${x0 + 8} ${y0 + H * 0.34})`}>
          <rect x="0" y="0" width="12" height="30" rx="3" fill="#EDE3D3" stroke="#85796A" strokeWidth="1.2" />
          <ellipse cx="27" cy="15" rx="15" ry="11" fill="#FFFDF9" stroke="#85796A" strokeWidth="1.2" />
        </g>
      )}
      {scope.wastafelmeubel && (
        <g transform={`translate(${x0 + W - Math.min(0.8 * s, W * 0.4) - 8} ${y0 + H - 34})`}>
          <rect x="0" y="0" width={Math.min(0.8 * s, W * 0.4)} height="26" rx="4" fill="#EDE3D3" stroke="#85796A" strokeWidth="1.2" />
          <ellipse cx={Math.min(0.8 * s, W * 0.4) / 2} cy="14" rx={Math.min(0.8 * s, W * 0.4) / 4} ry="7" fill="#FFFDF9" stroke="#85796A" strokeWidth="1" />
        </g>
      )}
      {/* muren */}
      <path
        d={`M${deurX} ${y0 + H}H${x0}V${y0}H${x0 + W}V${y0 + H}H${deurX + deurW}`}
        fill="none"
        stroke="#2B2620"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {raam && (
        <g>
          <rect x={raamX} y={y0 - 4} width={raamW} height="8" fill="#FFFDF9" />
          <line x1={raamX} y1={y0 - 3} x2={raamX + raamW} y2={y0 - 3} stroke="#2B2620" strokeWidth="1.3" />
          <line x1={raamX} y1={y0 + 3} x2={raamX + raamW} y2={y0 + 3} stroke="#2B2620" strokeWidth="1.3" />
        </g>
      )}
      {deur && (
        <g>
          <line x1={deurX} y1={y0 + H} x2={deurX} y2={y0 + H - deurW} stroke="#2B2620" strokeWidth="2" />
          <path d={`M${deurX} ${y0 + H - deurW}A${deurW} ${deurW} 0 0 1 ${deurX + deurW} ${y0 + H}`} fill="none" stroke="#85796A" strokeWidth="1.2" strokeDasharray="4 4" />
        </g>
      )}
      {/* maatlijnen */}
      <g stroke="#B8955A" strokeWidth="1.2">
        <line x1={x0} y1={y0 - 24} x2={x0 + W} y2={y0 - 24} />
        <line x1={x0} y1={y0 - 30} x2={x0} y2={y0 - 18} />
        <line x1={x0 + W} y1={y0 - 30} x2={x0 + W} y2={y0 - 18} />
        <line x1={x0 - 24} y1={y0} x2={x0 - 24} y2={y0 + H} />
        <line x1={x0 - 30} y1={y0} x2={x0 - 18} y2={y0} />
        <line x1={x0 - 30} y1={y0 + H} x2={x0 - 18} y2={y0 + H} />
      </g>
      <g className="fill-gold-700" fontSize="12.5" fontWeight="600">
        <rect x={x0 + W / 2 - 30} y={y0 - 33} width="60" height="18" fill={bg} />
        <text x={x0 + W / 2} y={y0 - 20} textAnchor="middle">{getal(L)} m</text>
        <g transform={`translate(${x0 - 24} ${y0 + H / 2}) rotate(-90)`}>
          <rect x="-30" y="-9" width="60" height="18" fill={bg} />
          <text x="0" y="4.5" textAnchor="middle">{getal(B)} m</text>
        </g>
      </g>
    </svg>
  )
}
