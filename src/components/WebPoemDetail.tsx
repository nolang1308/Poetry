import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import WebNav from './WebNav'
import ArrowRight from './ArrowRight'
import { ArrowLeft, Heart, Bookmark, Share, PenLine } from './icons'
import { poemContent, parseStanzas, type PoemContext } from '../data/poems'
import { likePoem } from '../data/poemsRepo'
import { isLiked, setLikedLocal } from '../utils/likes'
import { copyText } from '../utils/clipboard'
import { useToast } from '../hooks/useToast'
import Toast from './Toast'
import './WebPoemDetail.scss'

function WebPoemDetail({ ctx }: { ctx: PoemContext }) {
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
    <div className="web-poem">
      <WebNav active="poems" />

      <div className="web-poem__container">
        <div className="web-poem__action-bar">
          <Link to="/poems" className="web-poem__back">
            <ArrowLeft size={17} />
            <span>시 목록으로</span>
          </Link>
          <div className="web-poem__actions">
            <button
              type="button"
              className={
                'web-poem__action' +
                (liked ? ' web-poem__action--liked' : '')
              }
              onClick={onLike}
              aria-pressed={liked}
            >
              <Heart size={17} filled={liked} className="web-poem__action-icon" />
              {poem.likes}
            </button>
            <span className="web-poem__action">
              <Bookmark size={17} className="web-poem__action-icon" />
              저장
            </span>
            <button
              type="button"
              className="web-poem__action"
              onClick={onShare}
            >
              <Share size={17} className="web-poem__action-icon" />
              공유
            </button>
          </div>
        </div>

        <div className="web-poem__reading">
          <div className="web-poem__photo-column">
            <div
              className="web-poem__photo"
              style={{ backgroundImage: `url(${poem.image})` }}
              role="img"
              aria-label={poem.title}
            />
          </div>

          <article className="web-poem__poem-column">
            <h1 className="web-poem__title">{poem.title}</h1>
            <div className="web-poem__meta">
              <span>{poem.date}</span>
              <span className="web-poem__meta-dot">·</span>
              <span>좋아요 {poem.likes}</span>
            </div>
            <span className="web-poem__rule" />
            <div className="web-poem__body">
              {stanzas.map((stanza, si) => (
                <p key={si} className="web-poem__stanza">
                  {stanza.map((line, li) => (
                    <span key={li}>
                      {line}
                      {li < stanza.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              ))}
            </div>
            <span className="web-poem__signature">{poemContent.signature}</span>
          </article>
        </div>

        <section className="web-poem__note">
          <div className="web-poem__note-header">
            <PenLine size={20} className="web-poem__note-pen" />
            <h2 className="web-poem__note-heading">시인의 노트</h2>
            <span className="web-poem__note-head-rule" />
          </div>
          <div className="web-poem__note-card">
            <div className="web-poem__note-inner">
              <div className="web-poem__poet-row">
                <span className="web-poem__avatar">{poemContent.poetInitial}</span>
                <div className="web-poem__who">
                  <span className="web-poem__poet-name">{poemContent.poet}</span>
                  <span className="web-poem__poet-written">
                    {poem.date} 작성 · 시인의 한마디
                  </span>
                </div>
              </div>
              <p className="web-poem__note-body">{note}</p>
            </div>
          </div>
        </section>

        <nav className="web-poem__poem-nav">
          <Link
            to={`/poems/${encodeURIComponent(prev.title)}`}
            viewTransition
            className="web-poem__nav-card web-poem__nav-card--prev"
          >
            <ArrowLeft size={22} className="web-poem__nav-icon" />
            <span className="web-poem__nav-text">
              <span className="web-poem__nav-label">이전 시 읽기</span>
              <span className="web-poem__nav-title">{prev.title}</span>
            </span>
          </Link>
          <Link
            to={`/poems/${encodeURIComponent(next.title)}`}
            viewTransition
            className="web-poem__nav-card web-poem__nav-card--next"
          >
            <span className="web-poem__nav-text web-poem__nav-text--right">
              <span className="web-poem__nav-label">다음 시 읽기</span>
              <span className="web-poem__nav-title">{next.title}</span>
            </span>
            <ArrowRight size={22} className="web-poem__nav-icon" />
          </Link>
        </nav>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}

export default WebPoemDetail
