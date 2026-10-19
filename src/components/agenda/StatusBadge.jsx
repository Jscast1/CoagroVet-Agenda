export const STATUS = {
  pendiente: { label: 'Pendiente', style: 'bg-amber-100 text-amber-800' },
  confirmada: { label: 'Confirmada', style: 'bg-navy-100 text-navy-700' },
  en_curso: { label: 'En curso', style: 'bg-brand-orange-soft text-brand-orange-dark' },
  completada: { label: 'Completada', style: 'bg-emerald-100 text-emerald-800' },
  cancelada: { label: 'Cancelada', style: 'bg-red-100 text-red-700' },
}

export default function StatusBadge({ status }) {
  const { label, style } = STATUS[status] ?? STATUS.pendiente
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {label}
    </span>
  )
}