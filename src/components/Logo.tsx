import { useId } from 'react'

export function LogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  const g = `sw-goud-${useId().replace(/:/g, '')}`
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="10" y1="8" x2="54" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#D9C08A" />
          <stop offset="1" stopColor="#B08D52" />
        </linearGradient>
      </defs>
      <path d="M16.5 26 32 12.4 47.5 26v24a4 4 0 0 1-4 4h-23a4 4 0 0 1-4-4Z" fill="#FBF6EC" />
      <path d="M16.5 28.5V50a4 4 0 0 0 4 4h23a4 4 0 0 0 4-4V28.5" stroke={`url(#${g})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 18.6V12.5h4.5v10" stroke={`url(#${g})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 31 32 11l23 20" stroke={`url(#${g})`} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="28" r="3" stroke={`url(#${g})`} strokeWidth="2.4" />
      <path d="M27.5 54v-9.5a4.5 4.5 0 0 1 9 0V54Z" fill={`url(#${g})`} />
    </svg>
  )
}

export function Logo({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className={compact ? 'h-8 w-8' : 'h-10 w-10'} />
      <span className="flex flex-col leading-none">
        <span className={`font-display font-semibold tracking-tight text-ink ${compact ? 'text-[1.35rem]' : 'text-[1.6rem]'}`}>
          Slimmer <span className="text-gold-600">Wonen</span>
        </span>
        {!compact && (
          <span className="mt-1 text-[0.62rem] font-medium uppercase tracking-[0.22em] text-ink-muted">Renovatie · Calculatie</span>
        )}
      </span>
    </span>
  )
}
