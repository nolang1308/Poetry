import { Link } from 'react-router-dom'
import './WebNav.scss'

interface WebNavProps {
  active: 'home' | 'poems'
}

const links: { label: string; to: string; key: WebNavProps['active'] }[] = [
  { label: '홈', to: '/', key: 'home' },
  { label: '시', to: '/poems', key: 'poems' },
]

function WebNav({ active }: WebNavProps) {
  return (
    <nav className="web-nav">
      <Link to="/" className="web-nav__brand">
        <span className="web-nav__brand-mark">詩</span>
        <span className="web-nav__brand-name">권일원의 시</span>
      </Link>
      <div className="web-nav__links">
        {links.map((link, i) => (
          <Link
            key={link.label + i}
            to={link.to}
            className={
              'web-nav__link' +
              (link.key === active ? ' web-nav__link--active' : '')
            }
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}

export default WebNav
