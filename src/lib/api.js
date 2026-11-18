// ============================================================
// CAPA DE DATOS DE COAGRO VET
// Hoy guarda todo en el navegador (localStorage), sin datos de prueba.
// Cuando exista el backend, reemplaza el cuerpo de cada función por la
// llamada real (ver TODO API). Los componentes no necesitan cambios.
//
// TODO API (base de datos): tablas sugeridas
//   owners        (id, name, dni UNIQUE, phone, email, address)
//   pets          (id, owner_id, name, species, breed, sex, age_value, age_unit,
//                  age_in_months, age_recorded_at, temperament, vaccinated, health)
//   appointments  (id, pet_id, owner_id, date, time, duration, status, notes, created_by)
//   appointment_services (appointment_id, service_id)
//   appointment_history  (appointment_id, action, user_id, at)
// ============================================================

import { addDays, toISODate } from './dates.js'
import { getLoginLog, getSession } from './auth.js'

// TODO API: URL base del backend. Crea un archivo .env con:
// VITE_API_URL=https://tu-servidor.com/api
// const API_URL = import.meta.env.VITE_API_URL

// Quién realiza la acción. Con el backend real, el servidor lo toma del token de sesión,
// no del navegador.
const actor = () => {
  const s = getSession()
  return { id: s?.id ?? null, name: s?.name ?? 'Desconocido' }
}

const KEY = 'coagrovet:db:v1'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('No se pudo leer el almacenamiento local', e)
  }
  return { owners: [], pets: [], appointments: [] }
}

function save(db) {
  localStorage.setItem(KEY, JSON.stringify(db))
}

const uid = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

const toMin = (t) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
const toHHMM = (n) =>
  `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`

const normalize = (s = '') =>
  s.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
const normDni = (s = '') => s.replace(/[^0-9a-z]/gi, '').toUpperCase()
const onlyDigits = (s = '') => s.replace(/\D/g, '')

// Une la cita con los datos del dueño y la mascota (lo que usa la Agenda)
function expand(db, a) {
  const owner = db.owners.find((o) => o.id === a.ownerId)
  const pet = db.pets.find((p) => p.id === a.petId)
  return {
    ...a,
    client: owner?.name ?? '—',
    phone: owner?.phone ?? '',
    patient: pet?.name ?? '—',
    species: pet?.species ?? '',
    service: a.services.map((s) => s.name).join(', '),
  }
}

// ------------------------------------------------------------
// AGENDA
// ------------------------------------------------------------

// Citas de un día. date = 'YYYY-MM-DD'
export async function getAppointmentsByDate(date) {
  // TODO API: reemplazar por:
  // const res = await fetch(`${API_URL}/appointments?date=${date}`)
  // if (!res.ok) throw new Error('No se pudieron cargar las citas')
  // return res.json()   // debe incluir client, phone, patient, species, service e history
  //
  // TODO API: agregar el token de sesión en los headers cuando exista login.
  await wait()
  const db = load()
  return db.appointments.filter((a) => a.date === date).map((a) => expand(db, a))
}

// Citas de un mes agrupadas por día. month = 'YYYY-MM'
// Resultado: { '2026-10-05': [cita, cita], ... }
export async function getAppointmentsByMonth(month) {
  // TODO API: reemplazar por:
  // const res = await fetch(`${API_URL}/appointments?month=${month}`)
  // if (!res.ok) throw new Error('No se pudo cargar el calendario')
  // const list = await res.json()
  // return list.reduce((acc, a) => { (acc[a.date] ||= []).push(a); return acc }, {})
  await wait()
  const db = load()
  const result = {}
  db.appointments
    .filter((a) => a.date.startsWith(`${month}-`))
    .forEach((a) => {
      ;(result[a.date] ||= []).push(expand(db, a))
    })
  return result
}

// Cambia el estado de una cita. status: agendada | completada | cancelada
export async function updateAppointmentStatus(id, status) {
  // TODO API: reemplazar por:
  // const res = await fetch(`${API_URL}/appointments/${id}`, {
  //   method: 'PATCH',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ status }),
  // })
  // if (!res.ok) throw new Error('No se pudo actualizar la cita')
  // return res.json()   // debe devolver el history actualizado
  await wait()
  const db = load()
  const appointment = db.appointments.find((a) => a.id === id)
  if (!appointment) throw new Error('No se encontró la cita')
  appointment.status = status
  appointment.history = [
    ...(appointment.history ?? []),
    { action: status, by: actor(), at: new Date().toISOString() },
  ]
  save(db)
  return { id, status, history: appointment.history }
}

// ------------------------------------------------------------
// AGENDAR CITA
// ------------------------------------------------------------

// Horarios de un día para una duración dada (minutos).
export async function getAvailableSlots(date, duration) {
  // TODO API: reemplazar por:
  // const res = await fetch(`${API_URL}/availability?date=${date}&duration=${duration}`)
  // if (!res.ok) throw new Error('No se pudo consultar la disponibilidad')
  // return res.json()   // [{ time: '08:00', available: true }, ...]
  //
  // El backend debe decidir qué horas están libres según el horario de la clínica,
  // los días cerrados, la cantidad de groomers y las citas activas (no canceladas),
  // y no ofrecer horas que ya pasaron.
  await wait()
  const [y, m, d] = date.split('-').map(Number)
  if (new Date(y, m - 1, d).getDay() === 0) return [] // domingo cerrado

  const db = load()
  // Las citas canceladas no ocupan horario: ese tiempo vuelve a quedar libre
  const busy = db.appointments.filter((a) => a.date === date && a.status !== 'cancelada')
  const now = new Date()
  const open = 8 * 60 // TODO API: horario de apertura
  const close = 17 * 60 // TODO API: horario de cierre
  const slots = []
  for (let start = open; start + duration <= close; start += 30) {
    const overlaps = busy.some(
      (a) => start < toMin(a.time) + a.duration && toMin(a.time) < start + duration
    )
    // Una hora que ya pasó (o es ahora mismo) no se puede agendar
    const isPast = new Date(y, m - 1, d, Math.floor(start / 60), start % 60) <= now
    slots.push({ time: toHHMM(start), available: !overlaps && !isPast })
  }
  return slots
}

// Busca un cliente por su número de identidad (para evitar duplicados)
export async function findOwnerByDni(dni) {
  // TODO API: GET /owners?dni=...
  const db = load()
  return db.owners.find((o) => normDni(o.dni) === normDni(dni)) ?? null
}

// Crea la cita. Si el cliente es nuevo, crea también su expediente (dueño + mascota).
// payload: { date, time, duration, services, notes,
//            ownerId | owner,   // cliente existente o datos del nuevo
//            petId | pet }      // mascota existente o datos de la nueva
export async function createAppointment(payload) {
  // TODO API: reemplazar por:
  // const res = await fetch(`${API_URL}/appointments`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload),
  // })
  // if (!res.ok) throw new Error('No se pudo guardar la cita')
  // return res.json()
  //
  // El backend debe, en una sola transacción: crear el dueño si es nuevo (dni único),
  // crear la mascota si es nueva, validar que el horario siga libre y que no sea una
  // hora pasada, y guardar la cita con quién la creó.
  await wait(400)
  const db = load()

  const start = toMin(payload.time)
  const [py, pm, pd] = payload.date.split('-').map(Number)
  const startsAt = new Date(py, pm - 1, pd, Math.floor(start / 60), start % 60)
  if (startsAt <= new Date()) throw new Error('Esa hora ya pasó. Elige un horario posterior')

  const clash = db.appointments.some(
    (a) =>
      a.date === payload.date &&
      a.status !== 'cancelada' &&
      start < toMin(a.time) + a.duration &&
      toMin(a.time) < start + payload.duration
  )
  if (clash) throw new Error('Ese horario ya fue ocupado. Elige otra hora')

  let owner
  if (payload.ownerId) {
    owner = db.owners.find((o) => o.id === payload.ownerId)
    if (!owner) throw new Error('No se encontró al cliente')
  } else {
    if (db.owners.some((o) => normDni(o.dni) === normDni(payload.owner.dni))) {
      throw new Error('Ya existe un cliente con ese número de identidad')
    }
    const o = payload.owner
    owner = {
      id: uid('own'),
      name: o.name.trim(),
      dni: o.dni.trim(),
      phone: o.phone.trim(),
      email: o.email.trim(),
      address: o.address.trim(),
      createdAt: new Date().toISOString(),
    }
    db.owners.push(owner)
  }

  let pet
  if (payload.petId) {
    pet = db.pets.find((p) => p.id === payload.petId && p.ownerId === owner.id)
    if (!pet) throw new Error('No se encontró la mascota')
  } else {
    pet = {
      id: uid('pet'),
      ownerId: owner.id,
      ...payload.pet,
      name: payload.pet.name.trim(),
      ageRecordedAt: toISODate(new Date()),
      createdAt: new Date().toISOString(),
    }
    db.pets.push(pet)
  }

  const appointment = {
    id: uid('apt'),
    date: payload.date,
    time: payload.time,
    duration: payload.duration,
    status: 'agendada',
    ownerId: owner.id,
    petId: pet.id,
    services: payload.services,
    notes: payload.notes.trim(),
    createdAt: new Date().toISOString(),
    createdBy: actor(),
    history: [{ action: 'agendada', by: actor(), at: new Date().toISOString() }],
  }
  db.appointments.push(appointment)
  save(db)
  return expand(db, appointment)
}

// ------------------------------------------------------------
// CLIENTES Y EXPEDIENTES
// ------------------------------------------------------------

// Busca clientes por nombre, número de identidad, teléfono o nombre de mascota.
// Cada cliente trae todas sus mascotas. Sin texto devuelve todos.
export async function searchOwners(query = '') {
  // TODO API: reemplazar por GET /owners?search=...  (incluir las mascotas de cada dueño)
  const db = load()
  const q = normalize(query)
  const qDigits = onlyDigits(query)
  const qDni = normDni(query)

  const list = db.owners.map((o) => ({ ...o, pets: db.pets.filter((p) => p.ownerId === o.id) }))
  const found = !q
    ? list
    : list.filter(
        (o) =>
          normalize(o.name).includes(q) ||
          o.pets.some((p) => normalize(p.name).includes(q)) ||
          (qDni.length >= 3 && normDni(o.dni).includes(qDni)) ||
          (qDigits.length >= 3 && onlyDigits(o.phone).includes(qDigits))
      )
  return found.sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

// Expediente completo de una mascota: datos, dueño, historial de citas y servicios brindados.
export async function getPetRecord(petId) {
  // TODO API: reemplazar por GET /pets/:id/record
  const db = load()
  const pet = db.pets.find((p) => p.id === petId)
  if (!pet) throw new Error('No se encontró el expediente')
  const owner = db.owners.find((o) => o.id === pet.ownerId)

  const appointments = db.appointments
    .filter((a) => a.petId === petId)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`))

  // Servicios brindados = los de citas completadas
  const counts = {}
  appointments
    .filter((a) => a.status === 'completada')
    .forEach((a) =>
      a.services.forEach((s) => {
        if (!counts[s.name]) counts[s.name] = { name: s.name, count: 0, last: a.date }
        counts[s.name].count += 1
      })
    )

  return { pet, owner, appointments, services: Object.values(counts) }
}


// ------------------------------------------------------------
// INFORMES (ADMINISTRADOR)
// ------------------------------------------------------------

// Resumen de la empresa entre dos fechas (YYYY-MM-DD, ambas incluidas).
// Todo se calcula por la fecha de la cita.
export async function getReport(from, to) {
  // TODO API: reemplazar por GET /admin/reports?from=&to=
  // Debe devolver exactamente esta forma: { totals, services, days, staff, appointments }
  // Solo el rol administrador debe poder llamar a este endpoint (validar en el servidor).
  await wait()
  const db = load()
  const list = db.appointments.filter((a) => a.date >= from && a.date <= to)
  const count = (status) => list.filter((a) => a.status === status).length
  const cancelada = count('cancelada')
  const inRange = (iso) => {
    const d = toISODate(new Date(iso))
    return d >= from && d <= to
  }

  // Servicios solicitados (las citas canceladas no cuentan)
  const serviceCount = {}
  list
    .filter((a) => a.status !== 'cancelada')
    .forEach((a) =>
      a.services.forEach((s) => {
        serviceCount[s.name] = (serviceCount[s.name] ?? 0) + 1
      })
    )

  // Citas por día, incluyendo los días sin citas
  const days = {}
  for (let d = from; d <= to; d = addDays(d, 1)) {
    days[d] = { date: d, agendada: 0, completada: 0, cancelada: 0 }
  }
  list.forEach((a) => {
    if (days[a.date]) days[a.date][a.status] += 1
  })

  // Actividad del personal: quién agendó, completó y canceló
  const field = { agendada: 'agendadas', completada: 'completadas', cancelada: 'canceladas' }
  const staff = {}
  list.forEach((a) =>
    (a.history ?? []).forEach((h) => {
      const key = h.by.id ?? h.by.name
      if (!staff[key]) staff[key] = { name: h.by.name, agendadas: 0, completadas: 0, canceladas: 0 }
      if (field[h.action]) staff[key][field[h.action]] += 1
    })
  )

  return {
    totals: {
      total: list.length,
      agendada: count('agendada'),
      completada: count('completada'),
      cancelada,
      cancelRate: list.length ? Math.round((cancelada / list.length) * 100) : 0,
      newOwners: db.owners.filter((o) => inRange(o.createdAt)).length,
      newPets: db.pets.filter((p) => inRange(p.createdAt)).length,
    },
    services: Object.entries(serviceCount)
      .map(([name, total]) => ({ name, count: total }))
      .sort((a, b) => b.count - a.count),
    days: Object.values(days),
    staff: Object.values(staff).sort((a, b) => a.name.localeCompare(b.name, 'es')),
    appointments: list
      .map((a) => expand(db, a))
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)),
  }
}

// Inicios y cierres de sesión del personal entre dos fechas (el más reciente primero).
export async function getAccessLog(from, to) {
  // TODO API: reemplazar por GET /admin/logins?from=&to=
  // Cada registro: { id, userId, name, role, loginAt, logoutAt }
  await wait()
  return getLoginLog().filter((e) => {
    const d = toISODate(new Date(e.loginAt))
    return d >= from && d <= to
  })
}