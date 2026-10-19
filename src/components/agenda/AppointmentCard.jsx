import { Clock, MapPin, Phone, Stethoscope } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import Button from '../Button.jsx'
import { formatTime } from '../../lib/dates.js'

// Siguiente paso del flujo y el texto del botón
const NEXT = {
  pendiente: { status: 'confirmada', label: 'Confirmar' },
  confirmada: { status: 'en_curso', label: 'Iniciar atención' },
  en_curso: { status: 'completada', label: 'Completar' },
}

export default function AppointmentCard({ appointment: a, busy, onChangeStatus }) {
  const next = NEXT[a.status]
  const closed = a.status === 'completada' || a.status === 'cancelada'

  return (
    <article
      className={`flex gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5 ${
        closed ? 'opacity-70' : ''
      }`}
    >
      <div className="w-20 shrink-0 border-r border-black/10 pr-4 text-right">
        <p className="text-lg font-extrabold leading-tight text-navy-700">{formatTime(a.time)}</p>
        <p className="mt-1 flex items-center justify-end gap-1 text-xs text-muted">
          <Clock size={12} aria-hidden />
          {a.duration} min
        </p>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate font-bold text-ink">
              {a.patient} <span className="font-medium text-muted">· {a.species}</span>
            </h3>
            <p className="text-sm text-muted">{a.client}</p>
          </div>
          <StatusBadge status={a.status} />
        </div>

        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink/80">
          <li className="flex items-center gap-1.5">
            <Stethoscope size={14} className="text-brand-orange" aria-hidden />
            {a.service} · {a.vet}
          </li>
          <li className="flex items-center gap-1.5">
            <MapPin size={14} className="text-brand-orange" aria-hidden />
            {a.place}
          </li>
          <li className="flex items-center gap-1.5">
            <Phone size={14} className="text-brand-orange" aria-hidden />
            {a.phone}
          </li>
        </ul>

        {a.notes && <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-sm text-muted">{a.notes}</p>}

        {!closed && (
          <div className="mt-4 flex flex-wrap gap-2">
            {next && (
              <Button disabled={busy} onClick={() => onChangeStatus(a.id, next.status)}>
                {next.label}
              </Button>
            )}
            <Button variant="ghost" disabled={busy} onClick={() => onChangeStatus(a.id, 'cancelada')}>
              Cancelar cita
            </Button>
          </div>
        )}
      </div>
    </article>
  )
}