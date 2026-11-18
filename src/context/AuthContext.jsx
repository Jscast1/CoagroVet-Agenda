import { createContext, useContext, useState } from 'react'
import { getSession, login, logout } from '../lib/auth.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getSession())

  async function signIn(username, password, role) {
    setUser(await login(username, password, role))
  }

  function signOut() {
    logout()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)