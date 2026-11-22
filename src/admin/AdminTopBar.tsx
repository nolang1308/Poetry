import { Link, useNavigate } from 'react-router-dom'
import { useAdmin } from './AdminContext'
import './AdminTopBar.scss'

const tabs = [
  { key: 'poems', label: '시 관리', to: '/admin/home' },
  { key: 'stats', label: '통계', to: '/admin/stats' },
] as const

type TabKey = (typeof tabs)[number]['key']

// 관리자 화면 공용 머리말: 브랜드 · 바로가기 줄 아래에 탭(시 관리 / 통계)을 둔다
function AdminTopBar({ active }: { active: TabKey }) {
  const { logout } = useAdmin()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <header className="admin-top">
      <div className="admin-top__bar">
        <div className="admin-top__brand">
          <span className="admin-top__mark">詩</span>
          <span className="admin-top__brand-name">권일원의 시 · 관리자</span>
        </div>
        <div className="admin-top__actions">
          <Link to="/admin/home-settings" className="admin-top__link">
            홈 화면 편집
          </Link>
          <Link to="/" className="admin-top__link">
            사이트 보기
          </Link>
          <button
            type="button"
            className="admin-top__link"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </div>

      <nav className="admin-top__tabs" aria-label="관리자 메뉴">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            to={tab.to}
            className={
              'admin-top__tab' +
              (tab.key === active ? ' admin-top__tab--active' : '')
            }
            aria-current={tab.key === active ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}

export default AdminTopBar
