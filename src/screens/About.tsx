import { Calculator, Camera, Database, RotateCcw, ShoppingCart } from 'lucide-react'
import { LogoMark } from '../components/Logo'
import { Badge, Button, Card, PageTitle } from '../components/ui'
import { toast } from '../components/Toast'
import { projectStore } from '../lib/store'
import { ga } from '../lib/router'

const BLOKKEN = [
  {
    icon: Calculator,
    titel: 'Berekeningen',
    badge: <Badge tone="sage">Werkt</Badge>,
    tekst:
      'Oppervlakken en materialen worden berekend met gangbare vuistregels: snijverlies (instelbaar), lijm per tegelformaat, voegmiddel volgens de fabrikantformule, primer, waterdichting, egaliseermiddel, kit en profielen. Controleer bij twijfel altijd de technische fiche van het product.',
  },
  {
    icon: ShoppingCart,
    titel: 'Richtprijzen',
    badge: <Badge tone="gold">Voorbeeld</Badge>,
    tekst:
      'De prijzen van Gamma, Praxis, Hornbach en Karwei zijn voorbeeldprijzen uit een lokale tabel, geen actuele winkelprijzen. De app is zo opgezet dat echte prijzen later gekoppeld kunnen worden.',
  },
  {
    icon: Camera,
    titel: "Foto's & automatisch opmeten",
    badge: <Badge tone="gold">Binnenkort</Badge>,
    tekst:
      "Foto's maken en bewaren bij een project werkt al. Automatisch opmeten en foto-analyse met AI zijn nog niet actief; de berekening gebruikt de handmatig ingevoerde maten.",
  },
  {
    icon: Database,
    titel: 'Jouw gegevens',
    badge: <Badge tone="sage">Lokaal</Badge>,
    tekst:
      "Projecten en foto's worden alleen op dit apparaat opgeslagen (in de browser). Er gaat niets naar een server. Wis je de browsergegevens, dan zijn ook de projecten weg.",
  },
]

export function About() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-16 sm:px-6 sm:pt-10">
      <PageTitle
        eyebrow="Over de app"
        title="Slimmer Wonen"
        sub="Een rekenhulp voor aannemers en klussers bij het renoveren van badkamers: van opmeten tot een nette inkooplijst en offerte."
      />
      <div className="mt-8 grid gap-4">
        {BLOKKEN.map((b) => (
          <Card key={b.titel} className="flex gap-4 p-5 sm:p-6">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-700 ring-1 ring-gold-200">
              <b.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {b.titel} {b.badge}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{b.tekst}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card className="mt-6 flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        <LogoMark className="h-14 w-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Voorbeeldprojecten</p>
          <p className="mt-0.5 text-sm text-ink-muted">Zet de twee voorbeeldprojecten terug om de app te verkennen.</p>
        </div>
        <Button
          variant="secondary"
          icon={<RotateCcw className="h-4 w-4" />}
          onClick={() => {
            projectStore.herstelVoorbeelden()
            toast('Voorbeeldprojecten hersteld')
            ga('/')
          }}
        >
          Herstellen
        </Button>
      </Card>
    </div>
  )
}
