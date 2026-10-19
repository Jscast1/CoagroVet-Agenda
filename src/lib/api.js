// ============================================================
// CAPA DE DATOS DE COAGRO VET
// Hoy usa datos simulados. Cuando exista el backend, reemplaza
// el cuerpo de cada función por la llamada real (ver TODO API).
// ============================================================

// TODO API: URL base del backend. Crea un archivo .env con:
// VITE_API_URL=https://tu-servidor.com/api
// const API_URL = import.meta.env.VITE_API_URL

const MOCK = [
  { id: 1, time: '08:00', duration: 30, client: 'María Fúnez', phone: '9988-1234', patient: 'Luna', species: 'Perro', service: 'Consulta general', vet: 'Dr. Mejía', status: 'completada', place: 'Clínica', notes: 'Control de peso.' },
  { id: 2, time: '09:00', duration: 45, client: 'Finca El Roble', phone: '9755-4410', patient: 'Lote de 12 terneros', species: 'Bovino', service: 'Vacunación', vet: 'Dra. Reyes', status: 'en_curso', place: 'Domicilio', notes: 'Llevar vacuna triple.' },
  { id: 3, time: '10:30', duration: 30, client: 'Carlos Aguilar', phone: '3301-7788', patient: 'Michi', species: 'Gato', service: 'Desparasitación', vet: 'Dr. Mejía', status: 'confirmada', place: 'Clínica', notes: '' },
  { id: 4, time: '11:30', duration: 60, client: 'Ana Zelaya', phone: '9456-0021', patient: 'Rocky', species: 'Perro', service: 'Cirugía menor', vet: 'Dra. Reyes', status: 'confirmada', place: 'Clínica', notes: 'Ayuno de 8 horas.' },
  { id: 5, time: '14:00', duration: 30, client: 'José Pineda', phone: '8890-3345', patient: 'Canela', species: 'Equino', service: 'Revisión', vet: 'Dr. Mejía', status: 'pendiente', place: 'Domicilio', notes: '' },
  { id: 6, time: '15:30', duration: 30, client: 'Rosa Banegas', phone: '9922-6710', patient: 'Pelusa', species: 'Conejo', service: 'Consulta general', vet: 'Dra. Reyes', status: 'pendiente', place: 'Clínica', notes: '' },
]

const wait = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms))

// Simulación: genera las citas de un día (borrar al conectar la API real)
function mockForDate(date) {
  const [y, m, d] = date.split('-').map(Number)
  if (new Date(y, m - 1, d).getDay() === 0) return [] // domingo sin citas
  return MOCK.filter((_, i) => (i + d) % 3 !== 0).map((a) => ({ ...a, date }))
}

// Devuelve las citas de un día. date = 'YYYY-MM-DD'
export async function getAppointmentsByDate(date) {
  // TODO API: reemplazar por:
  // const res = await fetch(`${API_URL}/appointments?date=${date}`)
  // if (!res.ok) throw new Error('No se pudieron cargar las citas')
  // return res.json()
  //
  // TODO API: agregar el token de sesión en los headers cuando exista login.
  await wait()
  return mockForDate(date)
}

// Devuelve las citas de un mes, agrupadas por día. month = 'YYYY-MM'
// Resultado: { '2026-10-05': [cita, cita], '2026-10-06': [...] }
export async function getAppointmentsByMonth(month) {
  // TODO API: reemplazar por:
  // const res = await fetch(`${API_URL}/appointments?month=${month}`)
  // if (!res.ok) throw new Error('No se pudo cargar el calendario')
  // const list = await res.json()
  // return list.reduce((acc, a) => {
  //   (acc[a.date] ||= []).push(a)
  //   return acc
  // }, {})
  //
  // TODO API: para el calendario basta con id, date, time, patient y status.
  // Puedes pedirle al backend una versión resumida y más liviana.
  await wait(300)
  const [y, m] = month.split('-').map(Number)
  const total = new Date(y, m, 0).getDate()
  const result = {}
  for (let d = 1; d <= total; d++) {
    const iso = `${month}-${String(d).padStart(2, '0')}`
    const list = mockForDate(iso)
    if (list.length) result[iso] = list
  }
  return result
}

// Cambia el estado de una cita. status: pendiente | confirmada | en_curso | completada | cancelada
export async function updateAppointmentStatus(id, status) {
  // TODO API: reemplazar por:
  // const res = await fetch(`${API_URL}/appointments/${id}`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ status }),
  // })
  // if (!res.ok) throw new Error('No se pudo actualizar la cita')
  // return res.json()
  await wait(250)
  return { id, status }
}