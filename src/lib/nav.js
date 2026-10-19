import { LayoutDashboard, CalendarPlus, CalendarDays, Users, PawPrint, Stethoscope, Settings } from 'lucide-react'

// Agrega o quita módulos aquí; el menú lateral se genera solo.
export const NAV = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard },
  { to: '/agendar', label: 'Agendar cita', icon: CalendarPlus },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/clientes', label: 'Clientes', icon: Users },
  { to: '/pacientes', label: 'Pacientes', icon: PawPrint },
  { to: '/servicios', label: 'Servicios', icon: Stethoscope },
  { to: '/ajustes', label: 'Ajustes', icon: Settings },
]
