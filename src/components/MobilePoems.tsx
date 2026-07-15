import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PoemCard from './PoemCard'
import MobileMenu from './MobileMenu'
import { Search, ChevronLeft, Menu, Loader, Square, LayoutGrid } from './icons'
import type { PoemDoc } from '../data/poems'
import { usePoemFilter, type SortKey } from '../hooks/usePoemFilter'
import { withViewTransition } from '../utils/viewTransition'
import './MobilePoems.scss'

const filterChips: { label: string; key: SortKey }[] = [
  { label: '좋아요순', key: 'likes' },
  { label: '등록일순', key: 'date' },
  { label: '전체', key: 'all' },
]

// 한 번에 노출하는 시 개수 (스크롤로 계속 불러옴)
const PAGE_SIZE = 10

// 목록 보기 방식 (1열/2열) — 마지막 선택을 기억한다
type ViewCols = 1 | 2
const VIEW_KEY = 'poems-view-cols'

function loadViewCols(): ViewCols {
  try {
    return localStorage.getItem(VIEW_KEY) === '2' ? 2 : 1
  } catch {
    return 1
  }
}

function MobilePoems({ poems, loading }: { poems: PoemDoc[]; loading: boolean }) {
  const { query, setQuery, sort, setSort, results } = usePoemFilter(poems)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cols, setCols] = useState<ViewCols>(loadViewCols)

  const onCols = (next: ViewCols) => {
    if (next === cols) return
    withViewTransition(() => setCols(next))
    try {
      localStorage.setItem(VIEW_KEY, String(next))
    } catch {
      // 저장 실패는 무시 (보기 전환은 그대로 동작)
    }
  }

  // 무한 스크롤: 처음엔 10편, 하단 센티널이 보일 때마다 10편씩 더 노출
  const [visible, setVisible] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // 검색어·정렬이 바뀌면 다시 처음 10편부터
  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [query, sort])

  const shown = results.slice(0, visible)
  const hasMore = visible < results.length

  useEffect(() => {
    if (loading || !hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((v) => Math.min(v + PAGE_SIZE, results.length))
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [loading, hasMore, visible, results.length])

  // 한글 조합(IME) 중에는 flushSync/전환을 걸지 않아야 글자가 끊기지 않는다
  const composing = useRef(false)
  const applyQuery = (v: string, animate: boolean) => {
    if (animate) withViewTransition(() => setQuery(v))
    else setQuery(v)
  }
  const onSort = (key: SortKey) => withViewTransition(() => setSort(key))

  return (
    <div className="mobile-poems">
      <header className="mobile-poems__top-bar">
        <Link to="/" className="mobile-poems__icon-btn" aria-label="뒤로">
          <ChevronLeft size={24} />
        </Link>
        <span className="mobile-poems__title">시</span>
        <button
          type="button"
          className="mobile-poems__icon-btn"
          aria-label="메뉴 열기"
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={24} />
        </button>
      </header>
      <div className="mobile-poems__divider" />

      <div className="mobile-poems__body">
        <div className="mobile-poems__search">
          <Search size={17} className="mobile-poems__search-icon" />
          <input
            className="mobile-poems__search-input"
            type="text"
            placeholder="제목으로 검색"
            value={query}
            onChange={(e) => applyQuery(e.target.value, !composing.current)}
            onCompositionStart={() => {
              composing.current = true
            }}
            onCompositionEnd={(e) => {
              composing.current = false
              applyQuery(e.currentTarget.value, true)
            }}
          />
        </div>

        <div className="mobile-poems__filter-row">
          <div className="mobile-poems__chips">
            {filterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className={
                  'mobile-poems__chip' +
                  (sort === chip.key ? ' mobile-poems__chip--active' : '')
                }
                onClick={() => onSort(chip.key)}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="mobile-poems__view" role="group" aria-label="보기 방식">
            <button
              type="button"
              className={
                'mobile-poems__view-btn' +
                (cols === 1 ? ' mobile-poems__view-btn--active' : '')
              }
              aria-label="1열로 보기"
              aria-pressed={cols === 1}
              onClick={() => onCols(1)}
            >
              <Square size={16} />
            </button>
            <button
              type="button"
              className={
                'mobile-poems__view-btn' +
                (cols === 2 ? ' mobile-poems__view-btn--active' : '')
              }
              aria-label="2열로 보기"
              aria-pressed={cols === 2}
              onClick={() => onCols(2)}
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="mobile-poems__empty">시를 불러오는 중…</p>
        ) : results.length > 0 ? (
          <div
            className={`mobile-poems__grid mobile-poems__grid--${cols}`}
          >
            {shown.map((poem) => (
              <PoemCard key={poem.id} {...poem} />
            ))}
          </div>
        ) : query ? (
          <p className="mobile-poems__empty">
            '{query}'에 대한 검색 결과가 없습니다.
          </p>
        ) : (
          <p className="mobile-poems__empty">등록된 시가 없습니다.</p>
        )}

        {!loading && hasMore && (
          <div className="mobile-poems__loading" ref={sentinelRef}>
            <Loader size={16} className="mobile-poems__spinner" />
            <span className="mobile-poems__loading-text">계속 불러오는 중...</span>
          </div>
        )}
      </div>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  )
}

export default MobilePoems
