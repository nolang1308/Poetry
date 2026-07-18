import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { auth, phoneToEmail, ADMIN_EMAILS } from '../firebase'

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

  // 익명(게스트) 로그인 사용자는 관리자가 아니다 — 반드시 관리자 이메일로 판정
  const authed =
    !!user && !user.isAnonymous && ADMIN_EMAILS.includes(user.email ?? '')

  return (
    <AdminContext.Provider value={{ authed, authLoading, login, logout }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
