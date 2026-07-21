import { Link } from 'react-router-dom'
import { ChevronLeft, Heart, Share, PenLine } from './icons'
import { poemContent, parseStanzas, isRichHtml, type PoemContext } from '../data/poems'
import { copyText } from '../utils/clipboard'
import { useToast } from '../hooks/useToast'
import { useLike } from '../hooks/useLike'
import Toast from './Toast'
import PoemComments from './PoemComments'
import './MobilePoemDetail.scss'

function MobilePoemDetail({ ctx, preview = false }: { ctx: PoemContext; preview?: boolean }) {
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
    <div className="mobile-poem">
      <header className="mobile-poem__top-bar">
        {preview ? (
          <span />
        ) : (
          <Link to="/poems" className="mobile-poem__back">
            <ChevronLeft size={20} />
            <span>시 목록</span>
          </Link>
        )}
        <div className="mobile-poem__actions">
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

      <div className="mobile-poem__body">
        <div className="mobile-poem__header">
          <h1 className="mobile-poem__title">{poem.title}</h1>
          <div className="mobile-poem__title-side">
            <span className="mobile-poem__signature">
              {poemContent.signature}
            </span>
            <span className="mobile-poem__side-dot">·</span>
            <span className="mobile-poem__side-date">{poem.date}</span>
            <span className="mobile-poem__side-dot">·</span>
            <span className="mobile-poem__likes">
              <Heart size={14} className="mobile-poem__likes-heart" />
              {poem.likes}
            </span>
          </div>
        </div>

        {rich ? (
          <div
            className="poem-prose"
            dangerouslySetInnerHTML={{ __html: poem.content! }}
          />
        ) : (
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
        )}

        {!rich && poem.image && (
          <img
            className="mobile-poem__photo"
            src={poem.image}
            alt={poem.title}
          />
        )}

        <div className="mobile-poem__note">
          <div className="mobile-poem__note-heading">
            <PenLine size={16} className="mobile-poem__note-pen" />
            <span className="mobile-poem__note-title">시인의 노트</span>
            {/* 노트에만 누르는 좋아요 (시 본문 좋아요와 별개로 집계) */}
            <button
              type="button"
              className={
                'mobile-poem__note-like' +
                (noteLike.liked ? ' mobile-poem__note-like--liked' : '')
              }
              onClick={noteLike.toggle}
              aria-pressed={noteLike.liked}
              aria-label="시인의 노트에 좋아요"
            >
              <Heart size={14} filled={noteLike.liked} />
              {poem.noteLikes}
            </button>
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

        {/* 시 본문 좋아요 — 다 읽고 난 자리(댓글 바로 위)에 둔다 */}
        <div className="mobile-poem__like-bar">
          <p className="mobile-poem__like-label">이 시가 마음에 드셨나요?</p>
          <button
            type="button"
            className={
              'mobile-poem__like-btn' +
              (poemLike.liked ? ' mobile-poem__like-btn--liked' : '')
            }
            onClick={poemLike.toggle}
            aria-pressed={poemLike.liked}
          >
            <Heart size={19} filled={poemLike.liked} />
            <span className="mobile-poem__like-count">{poem.likes}</span>
          </button>
        </div>

        {!preview && <PoemComments poemId={poem.id} />}

        {!preview && (
          <>
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
          </>
        )}
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}

export default MobilePoemDetail
