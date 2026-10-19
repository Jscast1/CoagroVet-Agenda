import { Menu, Bell, Search } from 'lucide-react'

export default function Topbar({ onMenu }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-black/5 bg-white/90 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-navy-700 hover:bg-surface lg:hidden" aria-label="Abrir menú">
        <Menu size={22} />
      </button>

      <label className="relative hidden max-w-md flex-1 sm:block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          placeholder="Buscar cliente, paciente o cita"
          className="w-full rounded-lg border border-black/10 bg-surface py-2 pl-9 pr-3 text-sm placeholder:text-muted focus:border-brand-orange focus:outline-none"
        />
      </label>

      <div className="ml-auto flex items-center gap-3">
        <button className="rounded-lg p-2 text-navy-700 hover:bg-surface" aria-label="Notificaciones">
          <Bell size={20} />
        </button>
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-navy-700 text-sm font-bold text-white">CV</span>
          <span className="hidden text-sm font-semibold text-navy-700 md:block">Recepción</span>
        </div>
      </div>
    </header>
  )
}
