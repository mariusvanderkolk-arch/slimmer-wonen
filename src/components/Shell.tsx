import type { ReactNode } from 'react'
import { Plus, Settings } from 'lucide-react'
import { Logo } from './Logo'
import { Button } from './ui'
import { ga, type Route } from '../lib/router'

export function Shell({ route, children }: { route: Route; children: ReactNode }) {
  const link = (actief: boolean) =>
    `rounded-lg px-1.5 py-2 text-[0.85rem] font-medium whitespace-nowrap transition sm:px-3 sm:text-sm ${actief ? 'text-ink' : 'text-ink-muted hover:text-ink'}`
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="no-print sticky top-0 z-40 border-b border-sand-300/60 bg-sand-100/85 backdrop-blur-md supports-[backdrop-filter]:bg-sand-100/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[4.5rem] sm:px-6">
          <a href="#/" className="rounded-lg" aria-label="Slimmer Wonen, naar projecten">
            <span className="sm:hidden">
              <Logo compact />
            </span>
            <span className="hidden sm:block">
              <Logo />
            </span>
          </a>
          <nav className="flex items-center gap-0.5 sm:gap-1">
            <a href="#/" className={`${link(route.naam === 'home')} hidden sm:block`}>
              Projecten
            </a>
            <a href="#/prijzen" className={link(route.naam === 'prijzen')}>
              Prijzen
            </a>
            <a href="#/over" className={link(route.naam === 'over')}>
              Over
            </a>
            <a
              href="#/instellingen"
              aria-label="Instellingen"
              title="Instellingen"
              aria-current={route.naam === 'instellingen' ? 'page' : undefined}
              className={`grid h-10 w-8 place-items-center rounded-lg transition sm:w-10 ${route.naam === 'instellingen' ? 'text-ink' : 'text-ink-muted hover:text-ink'}`}
            >
              <Settings className="h-[1.15rem] w-[1.15rem]" />
            </a>
            <span className="ml-1.5 hidden sm:block">
              <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => ga('/nieuw')}>
                Nieuw project
              </Button>
            </span>
            <button
              type="button"
              aria-label="Nieuw project"
              onClick={() => ga('/nieuw')}
              className="ml-1 grid h-10 w-10 place-items-center rounded-xl bg-ink text-sand-50 shadow-[0_6px_18px_-10px_rgba(43,38,32,.7)] active:scale-95 sm:hidden"
            >
              <Plus className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className={`no-print border-t border-sand-300/60 ${route.naam === 'home' || route.naam === 'over' || route.naam === 'prijzen' || route.naam === 'instellingen' ? '' : 'pb-20'}`}>
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Slimmer Wonen · demo-versie</p>
          <p>Voorbeeldprijzen, tenzij je eigen prijzen invult · gegevens blijven op dit apparaat</p>
        </div>
      </footer>
    </div>
  )
}
