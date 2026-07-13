import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Heart, Share, PenLine } from './icons'
import { poemContent, parseStanzas, type PoemContext } from '../data/poems'
import { likePoem } from '../data/poemsRepo'
import { isLiked, setLikedLocal } from '../utils/likes'
import { copyText } from '../utils/clipboard'
import { useToast } from '../hooks/useToast'
import Toast from './Toast'
import './MobilePoemDetail.scss'

function MobilePoemDetail({ ctx }: { ctx: PoemContext }) {
  const { poem, prev, next } = ctx
  const stanzas = parseStanzas(poem.content) ?? poemContent.stanzas

  const note = poem.note?.trim() ? poem.note : poemContent.note
  const toast = useToast()

  const onShare = async () => {
    const ok = await copyText(window.location.href)
    toast.show(ok ? '링크가 복사되었습니다' : '복사에 실패했습니다')
  }

  const [liked, setLiked] = useState(() => isLiked(poem.id))
  useEffect(() => setLiked(isLiked(poem.id)), [poem.id])

  const onLike = () => {
    const next = !liked
    setLiked(next)
    setLikedLocal(poem.id, next)
    likePoem(poem.id, next).catch(() => {
      setLiked(!next)
      setLikedLocal(poem.id, !next)
    })
  }

  return (
    <div className="mobile-poem">
      <header className="mobile-poem__top-bar">
        <Link to="/poems" className="mobile-poem__back">
          <ChevronLeft size={20} />
          <span>시 목록</span>
        </Link>
        <div className="mobile-poem__actions">
          <button
            type="button"
            className={
              'mobile-poem__icon-btn' +
              (liked ? ' mobile-poem__icon-btn--liked' : '')
            }
            onClick={onLike}
            aria-pressed={liked}
            aria-label="좋아요"
          >
            <Heart size={21} filled={liked} />
          </button>
          <button
            type="button"
            className="mobile-poem__icon-btn"
            onClick={onShare}
            aria-label="공유"
          >
            <Share size={21} />
          </button>
        </div>
      </header>

      <div
        className="mobile-poem__cover"
        style={{ backgroundImage: `url(${poem.image})` }}
        role="img"
        aria-label={poem.title}
      />

      <div className="mobile-poem__body">
        <div className="mobile-poem__header">
          <h1 className="mobile-poem__title">{poem.title}</h1>
          <div className="mobile-poem__meta">
            <span>{poem.date}</span>
            <span className="mobile-poem__meta-dot">·</span>
            <span className="mobile-poem__likes">
              <Heart size={14} className="mobile-poem__likes-heart" />
              {poem.likes}
            </span>
          </div>
        </div>

        <div className="mobile-poem__poem">
          {stanzas.map((stanza, si) => (
            <div key={si} className="mobile-poem__stanza">
              {stanza.map((line, li) => (
                <p key={li} className="mobile-poem__line">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>

        <span className="mobile-poem__signature">{poemContent.signature}</span>

        <div className="mobile-poem__note">
          <div className="mobile-poem__note-heading">
            <PenLine size={16} className="mobile-poem__note-pen" />
            <span className="mobile-poem__note-title">시인의 노트</span>
          </div>
          <div className="mobile-poem__poet-row">
            <span className="mobile-poem__avatar">{poemContent.poetInitial}</span>
            <div className="mobile-poem__poet-info">
              <span className="mobile-poem__poet-name">{poemContent.poet}</span>
              <span className="mobile-poem__poet-date">{poem.date} 작성</span>
            </div>
          </div>
          <p className="mobile-poem__note-body">{note}</p>
        </div>

        <div className="mobile-poem__nav-divider" />

        <nav className="mobile-poem__poem-nav">
          <Link
            to={`/poems/${encodeURIComponent(prev.title)}`}
            viewTransition
            className="mobile-poem__nav-card mobile-poem__nav-card--prev"
          >
            <span className="mobile-poem__nav-dir">← 이전 시 읽기</span>
            <span className="mobile-poem__nav-title">{prev.title}</span>
          </Link>
          <Link
            to={`/poems/${encodeURIComponent(next.title)}`}
            viewTransition
            className="mobile-poem__nav-card mobile-poem__nav-card--next"
          >
            <span className="mobile-poem__nav-dir">다음 시 읽기 →</span>
            <span className="mobile-poem__nav-title">{next.title}</span>
          </Link>
        </nav>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}

export default MobilePoemDetail
