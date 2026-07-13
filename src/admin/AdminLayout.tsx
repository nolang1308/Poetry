import { Outlet } from 'react-router-dom'
import { AdminProvider } from './AdminContext'

// /admin/* 전체를 감싸 관리자 상태(인증·시 목록)를 공유
function AdminLayout() {
  return (
    <AdminProvider>
      <Outlet />
    </AdminProvider>
  )
}

export default AdminLayout
