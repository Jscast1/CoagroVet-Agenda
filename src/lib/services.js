export const CATEGORY = 'COAGROPET-SPA'

// Toda cita reserva el mismo tiempo, sin importar los servicios elegidos.
// TODO API: este valor puede venir de la configuración de la clínica (GET /settings).
export const APPOINTMENT_DURATION = 150 // minutos (2 h 30 min)

// TODO API: este catálogo vendrá de la base de datos (GET /services)
// para que la clínica pueda editar los servicios sin tocar código.
export const SERVICES = [
  { id: 'bano', name: 'Baño' },
  { id: 'bano-medicado', name: 'Baño medicado' },
  { id: 'corte-pelo', name: 'Corte de pelo' },
  { id: 'unas', name: 'Corte de uñas y limado' },
  { id: 'oidos', name: 'Limpieza de oídos' },
  { id: 'dental', name: 'Higiene dental' },
  { id: 'deslanado', name: 'Deslanado' },
  { id: 'cepillado', name: 'Cepillado' },
  { id: 'colorimetria', name: 'Colorimetría' },
]