import { useEffect, useId, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, CircleCheck, Info, X } from 'lucide-react'
import { getal, leesGetal } from '../lib/format'

type Variant = 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-ink text-sand-50 hover:bg-[#3a332b] shadow-[0_6px_18px_-10px_rgba(43,38,32,.7)]',
  gold: 'bg-gradient-to-b from-gold-300 to-gold-400 text-ink hover:from-gold-300 hover:to-gold-500 shadow-[0_6px_18px_-10px_rgba(156,123,67,.8)] ring-1 ring-inset ring-gold-500/30',
  secondary: 'bg-paper text-ink ring-1 ring-inset ring-sand-400/80 hover:bg-sand-50 hover:ring-gold-400',
  ghost: 'text-ink-soft hover:bg-sand-200/60 hover:text-ink',
  danger: 'text-rust hover:bg-rust/10',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  icon,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' | 'lg'; icon?: ReactNode }) {
  const s = size === 'sm' ? 'h-9 px-3.5 text-sm gap-1.5' : size === 'lg' ? 'h-13 px-6 text-[0.95rem] gap-2.5' : 'h-11 px-5 text-sm gap-2'
  return (
    <button
      type="button"
      className={`inline-flex shrink-0 items-center justify-center rounded-xl font-medium whitespace-nowrap transition-all duration-150 active:scale-[.98] disabled:pointer-events-none disabled:opacity-45 ${s} ${variants[variant]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}

export function CardHeader({
  title,
  sub,
  icon,
  action,
}: {
  title: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex items-start gap-3.5 border-b border-sand-200 px-5 py-4 sm:px-6">
      {icon && (
        <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700 ring-1 ring-inset ring-gold-200">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <h3 className="font-sans text-[0.98rem] font-semibold tracking-normal text-ink">{title}</h3>
        {sub && <p className="mt-0.5 text-[0.82rem] leading-snug text-ink-muted">{sub}</p>}
      </div>
      {action}
    </div>
  )
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-gold-600 ${className}`}>{children}</p>
  )
}

export function PageTitle({ eyebrow, title, sub, action }: { eyebrow?: ReactNode; title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        <h1 className="text-[2.1rem] leading-[1.05] font-semibold text-ink sm:text-[2.6rem]">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">{sub}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
    </div>
  )
}

const inputBase =
  'w-full rounded-xl border border-sand-300 bg-white/80 px-3.5 text-[0.95rem] text-ink placeholder:text-ink-muted/60 transition focus:border-gold-400 focus:bg-white focus:ring-4 focus:ring-gold-200/50 focus:outline-none'

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  autoFocus,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  hint?: string
  autoFocus?: boolean
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.8rem] font-medium text-ink-soft">
        {label}
      </label>
      <input
        id={id}
        className={`${inputBase} h-12`}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="mt-1.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  )
}

/** Getalveld met eenheid; accepteert komma of punt. */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  step = 0.01,
  min = 0,
  hint,
  decimals = 2,
  compact = false,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  unit?: string
  step?: number
  min?: number
  hint?: string
  decimals?: number
  compact?: boolean
}) {
  const id = useId()
  const [tekst, setTekst] = useState(getal(value, decimals))
  useEffect(() => {
    if (leesGetal(tekst) !== value) setTekst(getal(value, decimals))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1.5 block truncate text-[0.8rem] font-medium text-ink-soft">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          inputMode="decimal"
          className={`${inputBase} tabnum ${compact ? 'h-11' : 'h-12'} ${unit ? 'pr-12' : ''}`}
          value={tekst}
          data-step={step}
          onChange={(e) => {
            const t = e.target.value.replace(/[^\d.,]/g, '').replace(/([.,].*)[.,]/g, '$1')
            setTekst(t)
            onChange(Math.max(min, leesGetal(t)))
          }}
          onBlur={() => setTekst(getal(value, decimals))}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-ink-muted">{unit}</span>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs leading-snug text-ink-muted">{hint}</p>}
    </div>
  )
}

export function Checkbox({ checked, className = '' }: { checked: boolean; className?: string }) {
  return (
    <span
      className={`grid h-5.5 w-5.5 shrink-0 place-items-center rounded-md border transition ${
        checked ? 'border-gold-500 bg-gold-500 text-white' : 'border-sand-400 bg-white'
      } ${className}`}
    >
      {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
    </span>
  )
}

export function Badge({ children, tone = 'sand', className = '' }: { children: ReactNode; tone?: 'sand' | 'gold' | 'sage' | 'ink'; className?: string }) {
  const t = {
    sand: 'bg-sand-200/80 text-ink-soft ring-sand-300',
    gold: 'bg-gold-100 text-gold-700 ring-gold-200',
    sage: 'bg-[#e8eee4] text-[#4c6547] ring-[#d3dfcd]',
    ink: 'bg-ink text-sand-50 ring-ink',
  }[tone]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold whitespace-nowrap ring-1 ring-inset ${t} ${className}`}>
      {children}
    </span>
  )
}

export function Notice({
  children,
  title,
  className = '',
  tone = 'gold',
  action,
}: {
  children?: ReactNode
  title?: ReactNode
  className?: string
  tone?: 'gold' | 'sage'
  action?: ReactNode
}) {
  const t = tone === 'sage' ? 'border-[#d3dfcd] bg-[#eef3ea]' : 'border-gold-200 bg-gold-100/60'
  const Icon = tone === 'sage' ? CircleCheck : Info
  return (
    <div className={`flex flex-col gap-3 rounded-2xl border px-4 py-3.5 text-[0.83rem] leading-relaxed text-ink-soft sm:flex-row sm:items-center ${t} ${className}`}>
      <div className="flex min-w-0 flex-1 gap-3">
        <Icon className={`mt-0.5 h-4.5 w-4.5 shrink-0 ${tone === 'sage' ? 'text-sage' : 'text-gold-600'}`} />
        <div className="min-w-0">
          {title && <p className="font-semibold text-ink">{title}</p>}
          {children}
        </div>
      </div>
      {action && <div className="shrink-0 pl-7.5 sm:pl-0">{action}</div>}
    </div>
  )
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className="tabnum mt-1 font-display text-[1.9rem] leading-none font-semibold text-ink">{value}</p>
      {sub && <p className="mt-1.5 text-xs text-ink-muted">{sub}</p>}
    </div>
  )
}

/** Modaal venster: gecentreerd op desktop, als sheet van onderen op mobiel. */
export function Dialog({
  open,
  onClose,
  title,
  sub,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  sub?: ReactNode
  children?: ReactNode
  footer?: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', f)
    const oud = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', f)
      document.body.style.overflow = oud
    }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="no-print fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl border border-sand-300/70 bg-paper shadow-lift sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-sand-200 px-5 pt-5 pb-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[1.6rem] leading-tight font-semibold">{title}</h2>
            {sub && <p className="mt-0.5 text-[0.82rem] text-ink-muted">{sub}</p>}
          </div>
          <button type="button" aria-label="Sluiten" onClick={onClose} className="-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-muted hover:bg-sand-100 hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 py-5 sm:px-6">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-sand-200 bg-sand-50/80 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-end sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

/** Aan/uit-schakelaar. */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-gold-500' : 'bg-sand-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : ''}`} />
    </button>
  )
}
