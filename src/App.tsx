import { Shell } from './components/Shell'
import { useRoute } from './lib/router'
import { Home } from './screens/Home'
import { ProjectForm } from './screens/ProjectForm'
import { ProjectScreen } from './screens/ProjectScreen'
import { About } from './screens/About'
import { Toaster } from './components/Toast'

export default function App() {
  const route = useRoute()
  return (
    <Shell route={route}>
      {route.naam === 'home' && <Home />}
      {route.naam === 'nieuw' && <ProjectForm key="nieuw" />}
      {route.naam === 'bewerken' && <ProjectForm key={route.id} id={route.id} />}
      {route.naam === 'project' && <ProjectScreen id={route.id} stap={route.stap} />}
      {route.naam === 'over' && <About />}
      <Toaster />
    </Shell>
  )
}
