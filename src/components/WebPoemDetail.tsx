import { Link } from 'react-router-dom'
import WebNav from './WebNav'
import ArrowRight from './ArrowRight'
import { ArrowLeft, Heart, Share, PenLine } from './icons'
import { poemContent, parseStanzas, isRichHtml, type PoemContext } from '../data/poems'
import { copyText } from '../utils/clipboard'
import { useToast } from '../hooks/useToast'
import { useLike } from '../hooks/useLike'
import Toast from './Toast'
import PoemComments from './PoemComments'
import './WebPoemDetail.scss'

function WebPoemDetail({ ctx, preview = false }: { ctx: PoemContext; preview?: boolean }) {
  const { poem, prev, next } = ctx
  const rich = isRichHtml(poem.content)
  const stanzas = parseStanzas(poem.content) ?? poemContent.stanzas

  const note = poem.note?.trim() ? poem.note : poemContent.note
  const toast = useToast()

  const onShare = async () => {
    if (preview) return // 미리보기에서는 동작하지 않음
    const ok = await copyText(window.location.href)
    toast.show(ok ? '링크가 복사되었습니다' : '복사에 실패했습니다')
  }

  // 시 본문 좋아요(댓글 위)와 시인의 노트 좋아요(노트 헤더)는 따로 집계된다
  const poemLike = useLike(poem.id, 'poem', preview)
  const noteLike = useLike(poem.id, 'note', preview)

  return (
    <div className="web-poem">
      <WebNav active="poems" />

      <div className="web-poem__container">
        <div className="web-poem__action-bar">
          {preview ? (
            <span />
          ) : (
            <Link to="/poems" className="web-poem__back">
              <ArrowLeft size={17} />
              <span>시 목록으로</span>
            </Link>
          )}
          <div className="web-poem__actions">
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
          <article className="web-poem__poem-column">
            <div className="web-poem__title-row">
              <h1 className="web-poem__title">{poem.title}</h1>
              <div className="web-poem__title-side">
                <span className="web-poem__signature">
                  {poemContent.signature}
                </span>
                <span className="web-poem__side-dot">·</span>
                <span className="web-poem__side-meta">{poem.date}</span>
                <span className="web-poem__side-dot">·</span>
                <span className="web-poem__side-meta">좋아요 {poem.likes}</span>
              </div>
            </div>
            <span className="web-poem__rule" />
            {rich ? (
              <div
                className="web-poem__body poem-prose"
                dangerouslySetInnerHTML={{ __html: poem.content! }}
              />
            ) : (
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
            )}
            {!rich && poem.image && (
              <img
                className="web-poem__photo"
                src={poem.image}
                alt={poem.title}
              />
            )}
          </article>
        </div>

        <section className="web-poem__note">
          <div className="web-poem__note-header">
            <PenLine size={20} className="web-poem__note-pen" />
            <h2 className="web-poem__note-heading">시인의 노트</h2>
            <span className="web-poem__note-head-rule" />
            {/* 노트에만 누르는 좋아요 (시 본문 좋아요와 별개로 집계) */}
            <button
              type="button"
              className={
                'web-poem__note-like' +
                (noteLike.liked ? ' web-poem__note-like--liked' : '')
              }
              onClick={noteLike.toggle}
              aria-pressed={noteLike.liked}
              aria-label="시인의 노트에 좋아요"
            >
              <Heart size={16} filled={noteLike.liked} />
              {poem.noteLikes}
            </button>
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

        {/* 시 본문 좋아요 — 다 읽고 난 자리(댓글 바로 위)에 둔다 */}
        <div className="web-poem__like-bar">
          <p className="web-poem__like-label">이 시가 마음에 드셨나요?</p>
          <button
            type="button"
            className={
              'web-poem__like-btn' +
              (poemLike.liked ? ' web-poem__like-btn--liked' : '')
            }
            onClick={poemLike.toggle}
            aria-pressed={poemLike.liked}
          >
            <Heart size={20} filled={poemLike.liked} />
            <span className="web-poem__like-count">{poem.likes}</span>
          </button>
        </div>

        {!preview && <PoemComments poemId={poem.id} />}

        {!preview && (
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
        )}
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}

export default WebPoemDetail
