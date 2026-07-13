import { Navigate } from 'react-router-dom'
import { useAdmin } from './AdminContext'
import type { ReactNode } from 'react'

// 인증 확인 중에는 대기, 미인증 시 로그인 페이지로 리다이렉트
function RequireAuth({ children }: { children: ReactNode }) {
  const { authed, authLoading } = useAdmin()
  if (authLoading) {
    return <div className="poem-detail-loading">확인 중…</div>
  }
  if (!authed) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

export default RequireAuth
