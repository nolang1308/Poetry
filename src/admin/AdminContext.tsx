import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, phoneToEmail } from '../firebase'

interface AdminContextValue {
  authed: boolean
  authLoading: boolean
  login: (phone: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthLoading(false)
    })
  }, [])

  const login = async (phone: string, password: string) => {
    await signInWithEmailAndPassword(auth, phoneToEmail(phone), password)
  }

  const logout = async () => {
    await signOut(auth)
  }

  return (
    <AdminContext.Provider value={{ authed: !!user, authLoading, login, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
