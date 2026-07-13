import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X } from './icons'
import './MobileMenu.scss'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

const links: { label: string; to: string; external?: boolean }[] = [
  { label: '홈', to: '/' },
  { label: '시', to: '/poems' },
]

function MobileMenu({ open, onClose }: MobileMenuProps) {
  // 열려 있을 때 ESC로 닫기 + 배경 스크롤 잠금
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <div
      className={'mobile-menu' + (open ? ' mobile-menu--open' : '')}
      aria-hidden={!open}
    >
      <div className="mobile-menu__backdrop" onClick={onClose} />
      <nav className="mobile-menu__panel" aria-label="메뉴">
        <div className="mobile-menu__head">
          <span className="mobile-menu__brand">
            <span className="mobile-menu__mark">詩</span>
            권일원의 시
          </span>
          <button
            type="button"
            className="mobile-menu__close"
            onClick={onClose}
            aria-label="메뉴 닫기"
          >
            <X size={22} />
          </button>
        </div>

        <ul className="mobile-menu__links">
          {links.map((link) =>
            link.external ? (
              <li key={link.label}>
                <a href="#" className="mobile-menu__link" onClick={onClose}>
                  {link.label}
                </a>
              </li>
            ) : (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="mobile-menu__link"
                  onClick={onClose}
                >
                  {link.label}
                </Link>
              </li>
            ),
          )}
        </ul>
      </nav>
    </div>
  )
}

export default MobileMenu
