import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePoems } from '../hooks/usePoems'
import { useBooks } from '../hooks/useBooks'
import {
  buildPoemNumbers,
  buildRegistrationNumbers,
} from '../data/poemNumbers'
import { deletePoems } from '../data/poemsRepo'
import { deleteBook } from '../data/booksRepo'
import { migrateBase64Images } from './migrateImages'
import { useVisits } from '../hooks/useVisits'
import { usePoemViews } from '../hooks/usePoemViews'
import { kstDay } from '../utils/visit'
import AdminTopBar from './AdminTopBar'
import VisitStats from './VisitStats'
import {
  Check,
  Trash,
  Plus,
  PenLine,
  X,
  Search,
  Book,
  LayoutGrid,
  SortIcon,
} from '../components/icons'
import './AdminHome.scss'

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '')

// 목록 정렬 방법. 기본은 등록순(최신부터)이고, 등록순만 방향을 뒤집을 수 있다.
type AdminSort = 'date' | 'likes' | 'views' | 'title'

const sortChips: { key: AdminSort; label: string }[] = [
  { key: 'date', label: '등록순' },
  { key: 'likes', label: '좋아요순' },
  { key: 'views', label: '조회수순' },
  { key: 'title', label: '가나다순' },
]

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
  const { poems, loading } = usePoems()
  const { books, loading: booksLoading } = useBooks()
  // 요약 카드에는 오늘을 포함한 최근 7일 치만 있으면 된다
  const visits = useVisits(kstDay(6))
  // 시별 조회수 (시 id → 횟수). 받아오기 전에는 null
  const { views: poemViews } = usePoemViews()

  // 예전 방식(base64)으로 저장된 사진이 남아 있으면 Storage로 옮긴다.
  // 목록이 다 준비된 뒤 한 번만 — 이미 옮긴 문서는 건너뛰므로 부담 없다.
  useEffect(() => {
    if (loading || booksLoading) return
    void migrateBase64Images(poems, books)
  }, [loading, booksLoading, poems, books])

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<AdminSort>('date')
  // 등록순의 방향 (false = 최신부터, true = 오래된 것부터)
  const [dateAsc, setDateAsc] = useState(false)
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

  // 화면에 그릴 순서. poems는 최신 등록순으로 오고, 정렬은 순서를 보존하므로
  // 값이 같은 시끼리는 최신 등록이 앞에 온다.
  const viewsOf = (id: string) => poemViews?.get(id) ?? 0
  const sorted =
    sort === 'likes'
      ? [...filtered].sort((a, b) => Number(b.likes) - Number(a.likes))
      : sort === 'views'
        ? [...filtered].sort((a, b) => viewsOf(b.id) - viewsOf(a.id))
        : sort === 'title'
          ? [...filtered].sort((a, b) => a.title.localeCompare(b.title, 'ko'))
          : dateAsc
            ? [...filtered].reverse()
            : filtered

  // 등록순이 이미 켜진 상태에서 다시 누르면 방향이 뒤집힌다
  const onSort = (key: AdminSort) => {
    if (key === 'date' && sort === 'date') setDateAsc((v) => !v)
    else setSort(key)
  }
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

  return (
    <div className="admin-home">
      <AdminTopBar active="poems" />

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

        <VisitStats data={visits.data} error={visits.error} />

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

        <div className="admin-home__sort" role="group" aria-label="정렬">
          <SortIcon size={16} className="admin-home__sort-icon" />
          {sortChips.map((chip) => {
            const active = sort === chip.key
            const isDate = chip.key === 'date'
            // 조회수는 받아온 뒤에야 정렬할 수 있다
            const waiting = chip.key === 'views' && !poemViews
            return (
              <button
                key={chip.key}
                type="button"
                className={
                  'admin-home__sort-chip' +
                  (active ? ' admin-home__sort-chip--on' : '')
                }
                aria-pressed={active}
                disabled={waiting}
                title={
                  waiting
                    ? '조회수를 아직 불러오지 못했습니다'
                    : isDate && active
                      ? '다시 누르면 순서가 뒤집힙니다'
                      : undefined
                }
                onClick={() => onSort(chip.key)}
              >
                {chip.label}
                {isDate && active && (dateAsc ? ' ↑' : ' ↓')}
              </button>
            )
          })}
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
          // 불러오는 동안 실제 카드와 같은 틀의 자리표시자를 은은히 깜빡여 보여준다
          <div
            className={
              'admin-home__grid' + (threeCols ? ' admin-home__grid--3' : '')
            }
            aria-busy="true"
            aria-label="시를 불러오는 중"
          >
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="admin-card admin-card--skeleton">
                <div className="admin-card__cover admin-card__skeleton-cover" />
                <div className="admin-card__info">
                  <span className="admin-card__skeleton-line" />
                  <span className="admin-card__skeleton-line admin-card__skeleton-line--short" />
                </div>
              </div>
            ))}
          </div>
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
            {sorted.map((poem) => {
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
                      {poem.date} · 좋아요 {poem.likes}
                    </p>
                    {/* 좁은 카드에서 잘리지 않도록 조회수는 따로 한 줄 */}
                    <p className="admin-card__meta">
                      조회{' '}
                      {poemViews
                        ? (poemViews.get(poem.id) ?? 0).toLocaleString('ko-KR')
                        : '-'}
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
