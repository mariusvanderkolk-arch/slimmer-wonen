import { Shell } from './components/Shell'
import { useRoute } from './lib/router'
import { Home } from './screens/Home'
import { ProjectForm } from './screens/ProjectForm'
import { ProjectScreen } from './screens/ProjectScreen'
import { About } from './screens/About'
import { Prices } from './screens/Prices'
import { Toaster } from './components/Toast'
import { KlantOfferte } from './screens/KlantOfferte'
import { Instellingen } from './screens/Instellingen'

export default function App() {
  const route = useRoute()
  if (route.naam === 'offerte-bekijken')
    return (
      <>
        <KlantOfferte code={route.data} />
        <Toaster />
      </>
    )
  return (
    <Shell route={route}>
      {route.naam === 'home' && <Home />}
      {route.naam === 'nieuw' && <ProjectForm key="nieuw" />}
      {route.naam === 'bewerken' && <ProjectForm key={route.id} id={route.id} />}
      {route.naam === 'project' && <ProjectScreen id={route.id} stap={route.stap} />}
      {route.naam === 'over' && <About />}
      {route.naam === 'prijzen' && <Prices terugNaar={route.terugNaar} />}
      {route.naam === 'instellingen' && <Instellingen sectie={route.sectie} />}
      <Toaster />
    </Shell>
  )
}
