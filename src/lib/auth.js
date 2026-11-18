// ============================================================
// AUTENTICACIÓN Y CUENTAS (simulado)
// Esto es solo para desarrollo: las contraseñas guardadas en el navegador
// NO son seguras. En producción las valida el backend.
//
// TODO API: reemplazar por:
//   POST   /auth/login      { username, password, role } -> { token, user }
//   GET    /admin/employees              -> lista de empleados (sin contraseña)
//   POST   /admin/employees              -> crear empleado (el servidor guarda la contraseña cifrada)
//   DELETE /admin/employees/:id          -> quitar empleado
// El servidor debe validar el rol administrador en cada una de estas peticiones.
// ============================================================

const SESSION_KEY = 'coagrovet:session'
const LOG_KEY = 'coagrovet:logins:v1'
const USERS_KEY = 'coagrovet:users:v1'

// Cuentas iniciales. El administrador puede quitar a los empleados desde Ajustes.
const SEED_USERS = [
  { id: 'usr_admin', name: 'Administrador', username: 'admin', password: 'coagro123', role: 'admin', dni: '', phone: '', email: '', createdAt: new Date().toISOString(), createdBy: null },
  { id: 'usr_1', name: 'Empleado 1', username: 'empleado1', password: 'coagro123', role: 'employee', dni: '', phone: '', email: '', createdAt: new Date().toISOString(), createdBy: null },
  { id: 'usr_2', name: 'Empleado 2', username: 'empleado2', password: 'coagro123', role: 'employee', dni: '', phone: '', email: '', createdAt: new Date().toISOString(), createdBy: null },
]

const wait = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))
const normDni = (s = '') => s.replace(/[^0-9a-z]/gi, '').toUpperCase()

function readUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* si falla, se vuelve a crear con las cuentas iniciales */
  }
  localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS))
  return SEED_USERS
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function readLog() {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY)) ?? []
  } catch {
    return []
  }
}

// La sesión solo es válida mientras la cuenta siga existiendo
export function getSession() {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY))
    if (!s) return null
    return readUsers().some((u) => u.id === s.id) ? s : null
  } catch {
    return null
  }
}

export async function login(username, password, role) {
  await wait()
  const user = readUsers().find(
    (u) => u.username === username.trim().toLowerCase() && u.password === password && u.role === role
  )
  if (!user) throw new Error('Usuario o contraseña incorrectos')

  const loginId = `log_${Date.now()}`
  const session = { id: user.id, name: user.name, role: user.role, loginId }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))

  // Registro de accesos (para el informe del administrador)
  const log = readLog()
  log.push({ id: loginId, userId: user.id, name: user.name, role: user.role, loginAt: new Date().toISOString(), logoutAt: null })
  localStorage.setItem(LOG_KEY, JSON.stringify(log))
  return session
}

export function logout() {
  const session = getSession()
  if (session) {
    const log = readLog().map((e) => (e.id === session.loginId ? { ...e, logoutAt: new Date().toISOString() } : e))
    localStorage.setItem(LOG_KEY, JSON.stringify(log))
  }
  localStorage.removeItem(SESSION_KEY)
}

// Para el informe del administrador
export function getLoginLog() {
  // TODO API: GET /admin/logins
  return readLog().reverse()
}

// ------------------------------------------------------------
// CUENTAS DE EMPLEADOS (solo administrador)
// ------------------------------------------------------------

function requireAdmin() {
  if (getSession()?.role !== 'admin') throw new Error('Solo el administrador puede hacer esto')
}

// Empleados con su último acceso. Nunca devuelve la contraseña.
export async function getEmployees() {
  requireAdmin()
  await wait(150)
  const log = readLog()
  return readUsers()
    .filter((u) => u.role === 'employee')
    .map(({ password, ...u }) => ({
      ...u,
      lastLogin: log
        .filter((e) => e.userId === u.id)
        .reduce((max, e) => (!max || e.loginAt > max ? e.loginAt : max), null),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

// data: { name, username, dni, phone, email, password }
export async function createEmployee(data) {
  requireAdmin()
  await wait()
  const users = readUsers()
  const username = data.username.trim().toLowerCase()

  if (users.some((u) => u.username === username)) {
    throw new Error('Ese nombre de usuario ya existe. Elige otro')
  }
  if (users.some((u) => u.dni && normDni(u.dni) === normDni(data.dni))) {
    throw new Error('Ya existe una cuenta con ese número de identidad')
  }

  const employee = {
    id: `usr_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
    name: data.name.trim(),
    username,
    password: data.password, // TODO API: el servidor debe guardarla cifrada, nunca en texto plano
    role: 'employee',
    dni: data.dni.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    createdAt: new Date().toISOString(),
    createdBy: getSession().name,
  }
  writeUsers([...users, employee])
  const { password, ...safe } = employee
  return safe
}

// Quita la cuenta. Las citas que agendó se conservan con su nombre.
export async function deleteEmployee(id) {
  requireAdmin()
  await wait()
  const users = readUsers()
  const user = users.find((u) => u.id === id)
  if (!user) throw new Error('No se encontró la cuenta')
  if (user.role === 'admin') throw new Error('La cuenta de administrador no se puede quitar')
  writeUsers(users.filter((u) => u.id !== id))
}

// ------------------------------------------------------------
// EDITAR EMPLEADOS Y VER CONTRASEÑA (solo administrador)
// ------------------------------------------------------------

let failedAttempts = 0
let lockedUntil = 0

// Confirma que quien pide la acción es el administrador, usando su propia contraseña.
// TODO API: POST /admin/verify-password { password } -> 200 | 401
// El bloqueo por intentos fallidos debe aplicarse en el servidor.
async function verifyAdminPassword(password) {
  requireAdmin()
  await wait()
  if (Date.now() < lockedUntil) {
    const secs = Math.ceil((lockedUntil - Date.now()) / 1000)
    throw new Error(`Demasiados intentos. Espera ${secs} segundos`)
  }
  const admin = readUsers().find((u) => u.id === getSession().id)
  if (!admin || admin.password !== password) {
    failedAttempts += 1
    if (failedAttempts >= 5) {
      lockedUntil = Date.now() + 60000
      failedAttempts = 0
    }
    throw new Error('Contraseña incorrecta')
  }
  failedAttempts = 0
}

// Devuelve la contraseña de un empleado, solo si el administrador confirma con la suya.
// TODO API: con el backend real las contraseñas se guardan cifradas y no se pueden leer.
// Si el servidor no permite verlas, este botón debe cambiarse por "Restablecer contraseña".
export async function revealEmployeePassword(id, adminPassword) {
  await verifyAdminPassword(adminPassword)
  const employee = readUsers().find((u) => u.id === id && u.role === 'employee')
  if (!employee) throw new Error('No se encontró la cuenta')
  return employee.password
}

// data: { name, username, dni, phone, email, password }
// Si password viene vacía, se conserva la actual.
export async function updateEmployee(id, data) {
  requireAdmin()
  await wait()
  const users = readUsers()
  const index = users.findIndex((u) => u.id === id && u.role === 'employee')
  if (index === -1) throw new Error('No se encontró la cuenta')

  const username = data.username.trim().toLowerCase()
  if (users.some((u) => u.id !== id && u.username === username)) {
    throw new Error('Ese nombre de usuario ya existe. Elige otro')
  }
  if (users.some((u) => u.id !== id && u.dni && normDni(u.dni) === normDni(data.dni))) {
    throw new Error('Ya existe una cuenta con ese número de identidad')
  }

  const updated = {
    ...users[index],
    name: data.name.trim(),
    username,
    dni: data.dni.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    password: data.password ? data.password : users[index].password,
    updatedAt: new Date().toISOString(),
    updatedBy: getSession().name,
  }
  users[index] = updated
  writeUsers(users)
  const { password, ...safe } = updated
  return safe
}
