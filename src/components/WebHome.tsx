import { Link } from 'react-router-dom'
import WebNav from './WebNav'
import ArrowRight from './ArrowRight'
import type { HomeContent } from '../data/home'
import './WebHome.scss'

function WebHome({ home }: { home: HomeContent }) {
  return (
    <div className="web-home">
      <WebNav active="home" />

      <section className="web-home__hero">
        <div className="web-home__hero-left">
          <div className="web-home__eyebrow">
            <span className="web-home__eyebrow-line" />
            <span className="web-home__eyebrow-text">{home.eyebrow}</span>
          </div>

          <div className="web-home__headline">
            <h1 className="web-home__headline-1">{home.headline1}</h1>
            <h1 className="web-home__headline-2">{home.headline2}</h1>
          </div>

          <p className="web-home__intro">{home.intro}</p>

          <div className="web-home__cta">
            <Link to="/books" className="web-home__primary-button">
              <span>{home.ctaLabel}</span>
              <ArrowRight size={18} />
            </Link>
            <a href="#" className="web-home__secondary-link">
              {home.secondaryLabel}
            </a>
          </div>
        </div>

        <div className="web-home__hero-right">
          <div className="web-home__photo-wrap">
            <Link
              to="/admin/login"
              className="web-home__photo-link"
              aria-label="관리자 로그인"
            >
              <img src={home.webImage} className="web-home__photo" alt={home.eyebrow} />
            </Link>
            <div className="web-home__verse-card">
              <p className="web-home__verse">{home.verseWeb}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default WebHome
