import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdmin } from './AdminContext'
import { usePoems } from '../hooks/usePoems'
import { useBooks } from '../hooks/useBooks'
import {
  buildPoemNumbers,
  buildRegistrationNumbers,
} from '../data/poemNumbers'
import { deletePoems } from '../data/poemsRepo'
import { deleteBook } from '../data/booksRepo'
import {
  Check,
  Trash,
  Plus,
  PenLine,
  X,
  Search,
  Book,
  LayoutGrid,
} from '../components/icons'
import './AdminHome.scss'

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '')

// 목록을 3열로 크게 볼지 여부 — 마지막 선택을 기억한다
const COLS_KEY = 'admin-poems-3col'

function loadThreeCols(): boolean {
  try {
    return localStorage.getItem(COLS_KEY) === '1'
  } catch {
    return false
  }
}

function AdminHome() {
  const { logout } = useAdmin()
  const { poems, loading } = usePoems()
  const { books } = useBooks()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  // 기본은 화면 폭에 맞춰 자동, 켜면 3열로 고정해 표지를 크게 본다
  const [threeCols, setThreeCols] = useState(loadThreeCols)
  // 묶음 선택은 필요할 때만 — 평소에는 표지에 선택 박스를 띄우지 않는다
  const [selectMode, setSelectMode] = useState(false)

  // 제목 앞에 붙는 등록 순번 (먼저 등록한 시가 1번)
  const regNumbers = useMemo(() => buildRegistrationNumbers(poems), [poems])
  // 어느 시집에도 담기지 않은 시를 가려내기 위한 시집 번호표
  const bookNumbers = useMemo(
    () => buildPoemNumbers(books, poems),
    [books, poems],
  )

  const toggleCols = () => {
    const next = !threeCols
    setThreeCols(next)
    try {
      localStorage.setItem(COLS_KEY, next ? '1' : '0')
    } catch {
      // 저장 실패는 무시 (보기 전환은 그대로 동작)
    }
  }

  const q = normalize(query)
  const filtered = q
    ? poems.filter((p) => normalize(p.title).includes(q))
    : poems
  const filteredIds = filtered.map((p) => p.id)
  const allSelected =
    filtered.length > 0 && filteredIds.every((id) => selected.has(id))

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) filteredIds.forEach((id) => next.delete(id))
      else filteredIds.forEach((id) => next.add(id))
      return next
    })

  const clearSelection = () => setSelected(new Set())

  // 선택 모드를 끄면 고른 것도 함께 비운다
  const exitSelectMode = () => {
    setSelectMode(false)
    clearSelection()
  }

  const deleteSelected = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`선택한 ${selected.size}편의 시를 삭제할까요?`)) return
    try {
      await deletePoems([...selected])
      clearSelection()
    } catch {
      window.alert('삭제에 실패했습니다.')
    }
  }

  const removeBook = async (id: string, name: string) => {
    if (!window.confirm(`시집 '${name}'을(를) 삭제할까요? (담긴 시는 지워지지 않습니다)`)) return
    try {
      await deleteBook(id)
    } catch {
      window.alert('삭제에 실패했습니다.')
    }
  }

  const deleteOne = async (id: string, title: string) => {
    if (!window.confirm(`'${title}'을(를) 삭제할까요?`)) return
    try {
      await deletePoems([id])
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch {
      window.alert('삭제에 실패했습니다.')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-home">
      <header className="admin-home__top">
        <div className="admin-home__brand">
          <span className="admin-home__mark">詩</span>
          <span className="admin-home__brand-name">권일원의 시 · 관리자</span>
        </div>
        <div className="admin-home__top-actions">
          <Link to="/admin/home-settings" className="admin-home__link">
            홈 화면 편집
          </Link>
          <Link to="/" className="admin-home__link">
            사이트 보기
          </Link>
          <button
            type="button"
            className="admin-home__link"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="admin-home__container">
        <div className="admin-home__header">
          <div>
            <h1 className="admin-home__title">시 관리</h1>
            <p className="admin-home__sub">
              총 {poems.length}편
              {q && ` · 검색 ${filtered.length}편`}
            </p>
          </div>
          <div className="admin-home__header-actions">
            <Link
              to="/admin/book/new"
              className="admin-home__register admin-home__register--book"
            >
              <Book size={16} />
              시집 만들기
            </Link>
            <Link to="/admin/new" className="admin-home__register">
              <Plus size={16} />
              시 등록
            </Link>
          </div>
        </div>

        {books.length > 0 && (
          <section className="admin-home__books">
            <h2 className="admin-home__books-title">시집 · {books.length}권</h2>
            <ul className="admin-home__book-list">
              {books.map((book) => (
                <li key={book.id} className="admin-home__book-row">
                  <Book size={16} className="admin-home__book-icon" />
                  <span className="admin-home__book-name">{book.name}</span>
                  <span className="admin-home__book-count">
                    시 {book.poemIds.length}편
                  </span>
                  <div className="admin-home__book-actions">
                    <Link
                      to={`/admin/book/edit/${book.id}`}
                      className="admin-card__btn"
                    >
                      <PenLine size={14} />
                      수정
                    </Link>
                    <button
                      type="button"
                      className="admin-card__btn admin-card__btn--danger"
                      onClick={() => removeBook(book.id, book.name)}
                    >
                      <Trash size={14} />
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="admin-home__search">
          <Search size={18} className="admin-home__search-icon" />
          <input
            className="admin-home__search-input"
            type="text"
            placeholder="제목으로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="admin-home__toolbar">
          {selectMode ? (
            <>
              <label className="admin-home__select-all">
                <span
                  className={
                    'admin-home__checkbox' +
                    (allSelected ? ' admin-home__checkbox--on' : '')
                  }
                >
                  {allSelected && <Check size={14} />}
                </span>
                <input
                  type="checkbox"
                  className="admin-home__sr"
                  checked={allSelected}
                  onChange={toggleAll}
                />
                전체 선택
              </label>

              <span className="admin-home__count">
                {selected.size}개 선택됨
              </span>
            </>
          ) : (
            <button
              type="button"
              className="admin-home__select-btn"
              onClick={() => setSelectMode(true)}
            >
              <Check size={15} />
              묶음 선택
            </button>
          )}

          <button
            type="button"
            className={
              'admin-home__cols-btn' +
              (threeCols ? ' admin-home__cols-btn--on' : '')
            }
            onClick={toggleCols}
            aria-pressed={threeCols}
            title="목록을 3열로 크게 보기"
          >
            <LayoutGrid size={15} />
            3열로 보기
          </button>

          {selectMode && (
            <div className="admin-home__bulk">
              <button
                type="button"
                className="admin-home__bulk-btn"
                onClick={clearSelection}
                disabled={selected.size === 0}
              >
                <X size={15} />
                선택 해제
              </button>
              <button
                type="button"
                className="admin-home__bulk-btn admin-home__bulk-btn--danger"
                onClick={deleteSelected}
                disabled={selected.size === 0}
              >
                <Trash size={15} />
                선택 삭제
              </button>
              <button
                type="button"
                className="admin-home__bulk-btn admin-home__bulk-btn--done"
                onClick={exitSelectMode}
              >
                완료
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <p className="admin-home__empty">시를 불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <p className="admin-home__empty">
            {poems.length === 0
              ? '등록된 시가 없습니다.'
              : `'${query}'에 대한 검색 결과가 없습니다.`}
          </p>
        ) : (
          <div
            className={
              'admin-home__grid' + (threeCols ? ' admin-home__grid--3' : '')
            }
          >
            {filtered.map((poem) => {
              const on = selected.has(poem.id)
              // 아직 어느 시집에도 담기지 않은 시
              const unfiled = !bookNumbers.has(poem.id)
              const cover = (
                <>
                  {poem.image && (
                    <img
                      className="admin-card__cover-img"
                      src={poem.image}
                      alt=""
                    />
                  )}
                  {unfiled && (
                    <span className="admin-card__unfiled">미수록</span>
                  )}
                </>
              )
              return (
                <div
                  key={poem.id}
                  className={
                    'admin-card' + (on ? ' admin-card--selected' : '')
                  }
                >
                  {/* 선택 모드일 때만 표지가 눌리는 선택 버튼이 된다 */}
                  {selectMode ? (
                    <button
                      type="button"
                      className="admin-card__cover"
                      onClick={() => toggle(poem.id)}
                      aria-pressed={on}
                      aria-label={`${poem.title} 선택`}
                    >
                      {cover}
                      <span
                        className={
                          'admin-card__check' +
                          (on ? ' admin-card__check--on' : '')
                        }
                      >
                        {on && <Check size={15} />}
                      </span>
                    </button>
                  ) : (
                    <Link
                      to={`/admin/edit/${poem.id}`}
                      className="admin-card__cover admin-card__cover--link"
                      aria-label={`${poem.title} 수정`}
                    >
                      {cover}
                    </Link>
                  )}

                  <div className="admin-card__info">
                    <p className="admin-card__title">
                      <span className="admin-card__seq">
                        {regNumbers.get(poem.id)}.
                      </span>{' '}
                      {poem.title}
                    </p>
                    <p className="admin-card__meta">
                      {poem.date} · 좋아요 {poem.likes} · 조회 {poem.views}
                    </p>
                  </div>

                  {/* 수정은 표지를 누르면 되므로 삭제만 남긴다 */}
                  <div className="admin-card__actions">
                    <button
                      type="button"
                      className="admin-card__btn admin-card__btn--danger"
                      onClick={() => deleteOne(poem.id, poem.title)}
                    >
                      <Trash size={14} />
                      삭제
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminHome
