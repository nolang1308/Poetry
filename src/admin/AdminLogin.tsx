import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAdmin } from './AdminContext'
import './AdminLogin.scss'

function AdminLogin() {
  const { authed, authLoading, login } = useAdmin()
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!authLoading && authed) return <Navigate to="/admin/home" replace />

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim() || !password.trim()) {
      setError('전화번호와 비밀번호를 모두 입력해 주세요.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await login(phone, password)
      navigate('/admin/home')
    } catch (err) {
      const code = (err as { code?: string })?.code
      if (code === 'auth/too-many-requests') {
        setError('시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.')
      } else if (code === 'auth/network-request-failed') {
        setError('네트워크 오류가 발생했습니다.')
      } else {
        setError('전화번호 또는 비밀번호가 올바르지 않습니다.')
      }
      setSubmitting(false)
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login__card" onSubmit={onSubmit}>
        <div className="admin-login__brand">
          <span className="admin-login__mark">詩</span>
          <span className="admin-login__brand-name">권일원의 시</span>
        </div>
        <h1 className="admin-login__title">관리자 로그인</h1>
        <p className="admin-login__sub">시를 등록·수정·삭제하려면 로그인하세요.</p>

        <label className="admin-login__field">
          <span className="admin-login__label">전화번호</span>
          <input
            className="admin-login__input"
            type="tel"
            inputMode="tel"
            placeholder="010-0000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>

        <label className="admin-login__field">
          <span className="admin-login__label">비밀번호</span>
          <input
            className="admin-login__input"
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="admin-login__error">{error}</p>}

        <button
          type="submit"
          className="admin-login__submit"
          disabled={submitting}
        >
          {submitting ? '로그인 중…' : '로그인'}
        </button>

        <Link to="/" className="admin-login__back">
          ← 사이트로 돌아가기
        </Link>
      </form>
    </div>
  )
}

export default AdminLogin
