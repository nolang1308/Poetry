import { useState } from 'react'
import { Link } from 'react-router-dom'
import WebNav from '../components/WebNav'
import MobileMenu from '../components/MobileMenu'
import ArrowRight from '../components/ArrowRight'
import { ChevronLeft, Menu, Book } from '../components/icons'
import { useBooks } from '../hooks/useBooks'
import { usePoems } from '../hooks/usePoems'
import type { BookDoc } from '../data/booksRepo'
import type { PoemDoc } from '../data/poems'
import './Books.scss'

// 시집 카드: 표지는 관리자가 지정한 사진 → 없으면 첫 번째 시 사진 → 없으면 詩 마크
function BookCard({ book, poemById }: { book: BookDoc; poemById: Map<string, PoemDoc> }) {
  const cover =
    book.image ||
    book.poemIds.map((id) => poemById.get(id)?.image).find((img) => img)
  // 삭제된 시는 편수에서 제외
  const count = book.poemIds.filter((id) => poemById.has(id)).length

  return (
    <Link to={`/books/${book.id}`} className="book-card">
      <div className="book-card__cover">
        {cover ? (
          <img className="book-card__cover-img" src={cover} alt={book.name} />
        ) : (
          <span className="book-card__cover-mark">詩</span>
        )}
        <span className="book-card__spine" />
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
