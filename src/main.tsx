import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import './index.scss'
import Home from './pages/Home'
import Poems from './pages/Poems'
import PoemDetail from './pages/PoemDetail'
import Books from './pages/Books'
import BookPoems from './pages/BookPoems'
import AdminBookForm from './admin/AdminBookForm'
import AdminLayout from './admin/AdminLayout'
import AdminLogin from './admin/AdminLogin'
import AdminHome from './admin/AdminHome'
import AdminPoemForm from './admin/AdminPoemForm'
import AdminHomeSettings from './admin/AdminHomeSettings'
import RequireAuth from './admin/RequireAuth'
import { countVisit } from './data/statsRepo'

// 어느 페이지로 들어오든 방문을 한 번 집계한다 (하루 1회로 제한됨)
countVisit()

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/books', element: <Books /> },
  { path: '/books/:id', element: <BookPoems /> },
  { path: '/poems', element: <Poems /> },
  { path: '/poems/:title', element: <PoemDetail /> },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: 'login', element: <AdminLogin /> },
      {
        path: 'home',
        element: (
          <RequireAuth>
            <AdminHome />
          </RequireAuth>
        ),
      },
      {
        path: 'home-settings',
        element: (
          <RequireAuth>
            <AdminHomeSettings />
          </RequireAuth>
        ),
      },
      {
        path: 'new',
        element: (
          <RequireAuth>
            <AdminPoemForm />
          </RequireAuth>
        ),
      },
      {
        path: 'edit/:id',
        element: (
          <RequireAuth>
            <AdminPoemForm />
          </RequireAuth>
        ),
      },
      {
        path: 'book/new',
        element: (
          <RequireAuth>
            <AdminBookForm />
          </RequireAuth>
        ),
      },
      {
        path: 'book/edit/:id',
        element: (
          <RequireAuth>
            <AdminBookForm />
          </RequireAuth>
        ),
      },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
