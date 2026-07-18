import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import WebNav from '../components/WebNav'
import MobileMenu from '../components/MobileMenu'
import ArrowRight from '../components/ArrowRight'
import { ChevronLeft, Menu, Book } from '../components/icons'
import { useBooks } from '../hooks/useBooks'
import { usePoems } from '../hooks/usePoems'
import type { BookDoc } from '../data/booksRepo'
import type { PoemDoc } from '../data/poems'
import './Books.scss'

// 책 펼침 모션에서 촤라락 넘어가는 속지 페이지 수
const LEAF_COUNT = 4
// 모션이 끝나기를 기다렸다가 이동하는 시간(ms). SCSS 애니메이션 길이와 맞춘다.
// (중앙 이동·수평 세우기 0.45s → 표지 열림 → 마지막 속지 ~1.15s + 잠깐의 여운)
const OPEN_DURATION = 1250

// 시집 카드: 표지는 관리자가 지정한 사진 → 없으면 첫 번째 시 사진 → 없으면 詩 마크
function BookCard({ book, poemById }: { book: BookDoc; poemById: Map<string, PoemDoc> }) {
  const navigate = useNavigate()
  const [opening, setOpening] = useState(false)
  // 펼침 모션 때 책을 화면 정중앙으로 옮기기 위한 이동량(px)과 확대 배율
  const [offset, setOffset] = useState<{ x: number; y: number; scale: number } | null>(null)
  const cover =
    book.image ||
    book.poemIds.map((id) => poemById.get(id)?.image).find((img) => img)
  // 삭제된 시는 편수에서 제외
  const count = book.poemIds.filter((id) => poemById.has(id)).length
  // 펼침 모션의 속지에 보여줄 시 사진들 (시집에 담긴 순서대로)
  const leafImages = book.poemIds
    .map((id) => poemById.get(id)?.image)
    .filter((img): img is string => !!img)
    .slice(0, LEAF_COUNT)

  // 모바일에서는 바로 이동하지 않고 책 펼침 모션을 먼저 보여준다
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!window.matchMedia('(max-width: 768px)').matches) return // $breakpoint-mobile
    e.preventDefault()
    if (opening) return
    // 현재 책 위치 기준으로 화면 정중앙까지의 이동량과 확대 배율 계산.
    // 열린 표지 날개는 책등 왼쪽으로 책 폭의 ~절반(원근 확대 포함)만큼
    // 튀어나오므로, 그 폭까지 포함해 배율을 제한하고 책을 날개 폭의
    // 절반만큼 오른쪽으로 밀어 "펼친 모습 전체"가 화면 중앙에 오게 한다.
    const FLAP = 0.5
    const bookEl = e.currentTarget.querySelector('.book-card__book')
    if (bookEl) {
      const r = bookEl.getBoundingClientRect()
      const scale = Math.min(
        1.8,
        (window.innerWidth * 0.94) / (r.width * (1 + FLAP)),
        (window.innerHeight * 0.85) / r.height,
      )
      setOffset({
        x:
          window.innerWidth / 2 -
          (r.left + r.width / 2) +
          (r.width * scale * FLAP) / 2,
        y: window.innerHeight / 2 - (r.top + r.height / 2),
        scale,
      })
    }
    setOpening(true)
    window.setTimeout(() => navigate(`/books/${book.id}`), OPEN_DURATION)
  }

  return (
    <Link
      to={`/books/${book.id}`}
      className={'book-card' + (opening ? ' book-card--opening' : '')}
      style={
        opening && offset
          ? ({
              '--dx': `${offset.x}px`,
              '--dy': `${offset.y}px`,
              '--open-scale': offset.scale,
            } as React.CSSProperties)
          : undefined
      }
      onClick={handleClick}
    >
      {/* 3D 책: 뒤표지 + 책배(페이지 단면) + 앞표지(사진) */}
      <div className="book-card__book">
        <span className="book-card__back" aria-hidden="true" />
        <span className="book-card__pages" aria-hidden="true" />
        {/* 펼침 모션에서 순서대로 넘어가는 속지들 (평소엔 표지 뒤에 숨어 있음).
            시집에 담긴 시 사진이 있으면 속지에 인쇄된 도판처럼 보여준다 */}
        {Array.from({ length: LEAF_COUNT }, (_, i) => (
          <span
            key={i}
            className="book-card__leaf"
            style={{ '--i': i } as React.CSSProperties}
            aria-hidden="true"
          >
            {leafImages[i] && (
              <img className="book-card__leaf-img" src={leafImages[i]} alt="" />
            )}
          </span>
        ))}
        <div className="book-card__cover">
          {/* 표지 구성: 좌상단 제목 · 아래쪽 사진(오른쪽 끝까지, 원본 비율 유지) */}
          <span className="book-card__cover-title">{book.name}</span>
          <span className="book-card__cover-rule" aria-hidden="true" />
          <div
            className={
              'book-card__cover-photo' +
              (cover ? '' : ' book-card__cover-photo--empty')
            }
          >
            {cover ? (
              <img className="book-card__cover-img" src={cover} alt={book.name} />
            ) : (
              <span className="book-card__cover-mark">詩</span>
            )}
          </div>
          <span className="book-card__spine" aria-hidden="true" />
        </div>
      </div>
      <div className="book-card__info">
        <p className="book-card__name">{book.name}</p>
        <p className="book-card__count">시 {count}편</p>
      </div>
    </Link>
  )
}

// 시집 목록 (시집 보러가기 첫 화면). 웹/모바일 레이아웃을 한 컴포넌트에서 처리.
function Books() {
  const { books, loading: booksLoading } = useBooks()
  const { poems, loading: poemsLoading } = usePoems()
  const [menuOpen, setMenuOpen] = useState(false)
  const loading = booksLoading || poemsLoading

  const poemById = new Map(poems.map((p) => [p.id, p]))

  const grid = loading ? (
    <p className="books__empty">시집을 불러오는 중…</p>
  ) : books.length === 0 ? (
    // 시집이 없을 때: 안내와 함께 전체 시 목록으로 자연스럽게 유도
    <div className="books__none">
      <Book size={36} className="books__none-icon" />
      <p className="books__none-text">아직 등록된 시집이 없습니다.</p>
      <p className="books__none-sub">대신 등록된 모든 시를 한 곳에서 만나보세요.</p>
      <Link to="/poems" className="books__none-btn">
        <span>전체 시 보기</span>
        <ArrowRight size={18} />
      </Link>
    </div>
  ) : (
    <div className="books__grid">
      {books.map((book) => (
        <BookCard key={book.id} book={book} poemById={poemById} />
      ))}
    </div>
  )

  return (
    <>
      {/* Web */}
      <div className="web-books">
        <WebNav active="books" />
        <div className="web-books__container">
          <header className="web-books__header">
            <div>
              <h1 className="web-books__title">시집</h1>
              <p className="web-books__sub">
                시들을 묶어 엮은 시집입니다. 마음에 드는 시집을 골라 펼쳐 보세요.
              </p>
            </div>
            {books.length > 0 && (
              <Link to="/poems" className="web-books__all-link">
                전체 시 보기 →
              </Link>
            )}
          </header>
          {grid}
        </div>
      </div>

      {/* Mobile */}
      <div className="mobile-books">
        <header className="mobile-books__top-bar">
          <Link to="/" className="mobile-books__icon-btn" aria-label="뒤로">
            <ChevronLeft size={24} />
          </Link>
          <span className="mobile-books__title">시집</span>
          <button
            type="button"
            className="mobile-books__icon-btn"
            aria-label="메뉴 열기"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </header>
        <div className="mobile-books__divider" />
        <div className="mobile-books__body">
          {books.length > 0 && (
            <Link to="/poems" className="mobile-books__all-link">
              전체 시 보기 →
            </Link>
          )}
          {grid}
        </div>
        <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      </div>
    </>
  )
}

export default Books
