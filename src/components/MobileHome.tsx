import { useState } from 'react'
import { Link } from 'react-router-dom'
import ArrowRight from './ArrowRight'
import { Menu } from './icons'
import MobileMenu from './MobileMenu'
import type { HomeContent } from '../data/home'
import './MobileHome.scss'

function MobileHome({ home }: { home: HomeContent }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="mobile-home">
      <header className="mobile-home__top-bar">
        <span className="mobile-home__site-title">{home.mobileTitle}</span>
        <button
          type="button"
          className="mobile-home__menu-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="메뉴 열기"
        >
          <Menu size={24} />
        </button>
      </header>
      <div className="mobile-home__divider" />

      <div className="mobile-home__content">
        <Link
          to="/admin/login"
          className="mobile-home__photo-link"
          aria-label="관리자 로그인"
        >
          <img
            src={home.mobileImage}
            className="mobile-home__photo"
            alt={home.poetName}
          />
        </Link>

        <div className="mobile-home__name-block">
          <span className="mobile-home__eyebrow">{home.mobileEyebrow}</span>
          <h1 className="mobile-home__poet-name">{home.poetName}</h1>
        </div>

        <p className="mobile-home__intro">{home.mobileIntro}</p>

        <div className="mobile-home__verse-block">
          <span className="mobile-home__verse-line" />
          <p className="mobile-home__verse">{home.verseMobile}</p>
        </div>
      </div>

      <div className="mobile-home__button-wrap">
        <Link to="/poems" className="mobile-home__primary-button">
          <span>전체 시 보러가기</span>
          <ArrowRight size={18} />
        </Link>
        <Link
          to="/books"
          className="mobile-home__primary-button mobile-home__primary-button--outline"
        >
          <span>시집으로 보러가기</span>
          <ArrowRight size={18} />
        </Link>
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}

export default MobileHome
