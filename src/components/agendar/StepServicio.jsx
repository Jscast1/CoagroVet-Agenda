import { Check } from 'lucide-react'
import { CATEGORY, SERVICES } from '../../lib/services.js'

export default function StepServicio({ selected, onToggle, error }) {
  return (
    <div>
      <h2 className="text-lg font-extrabold text-navy-700">{CATEGORY}</h2>
      <p className="mb-4 text-sm text-muted">Marca uno o varios servicios para esta cita.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {SERVICES.map((s) => {
          const active = selected.includes(s.id)
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onToggle(s.id)}
              aria-pressed={active}
              className={`flex items-center gap-3 rounded-xl p-4 text-left ring-1 transition-colors ${
                active ? 'bg-navy-700 text-white ring-navy-700' : 'bg-white ring-black/10 hover:bg-navy-100'
              }`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${
                  active ? 'bg-brand-orange' : 'border border-black/20'
                }`}
              >
                {active && <Check size={16} aria-hidden />}
              </span>
              <span className="font-semibold">{s.name}</span>
            </button>
          )
        })}
      </div>

      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
      {selected.length > 0 && (
        <p className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm text-navy-700">
          {selected.length} {selected.length === 1 ? 'servicio seleccionado' : 'servicios seleccionados'}
        </p>
      )}
    </div>
  )
}