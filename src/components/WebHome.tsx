import { Link } from 'react-router-dom'
import WebNav from './WebNav'
import ArrowRight from './ArrowRight'
import { useVisits } from '../hooks/useVisits'
import type { HomeContent } from '../data/home'
import './WebHome.scss'

function WebHome({ home }: { home: HomeContent }) {
  const visits = useVisits()

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
            <div className="web-home__cta-buttons">
              <Link to="/poems" className="web-home__primary-button">
                <span>전체 시 보러가기</span>
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/books"
                className="web-home__primary-button web-home__primary-button--outline"
              >
                <span>시집으로 보러가기</span>
                <ArrowRight size={18} />
              </Link>
            </div>
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

      {/* 다녀간 사람 수 — 숫자를 받아온 뒤에만 조용히 보여 준다 */}
      {visits !== null && (
        <p className="web-home__visits">
          지금까지 {visits.toLocaleString('ko-KR')}분이 다녀가셨습니다
        </p>
      )}
    </div>
  )
}

export default WebHome
