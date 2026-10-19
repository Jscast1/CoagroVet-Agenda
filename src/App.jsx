import { Routes, Route } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Agenda from './pages/Agenda.jsx'
import Placeholder from './pages/Placeholder.jsx'
import { NAV } from './lib/nav.js'

// Módulos que ya tienen pantalla propia
const READY = { '/agenda': Agenda }

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        {NAV.filter((n) => n.to !== '/').map((n) => {
          const Page = READY[n.to]
          return (
            <Route
              key={n.to}
              path={n.to}
              element={Page ? <Page /> : <Placeholder title={n.label} />}
            />
          )
        })}
      </Route>
    </Routes>
  )
}