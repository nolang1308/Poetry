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

// 목록 보기 방식 (3열 기본 / 1열) — 마지막 선택을 기억한다
type ViewCols = 1 | 3
const VIEW_KEY = 'poems-view-cols'

function loadViewCols(): ViewCols {
  try {
    // 저장값이 '1'일 때만 1열, 그 밖에는(값이 없거나 예전 '2') 기본 3열
    return localStorage.getItem(VIEW_KEY) === '1' ? 1 : 3
  } catch {
    return 3
  }
}

interface MobilePoemsProps {
  poems: PoemDoc[]
  loading: boolean
  // 시집 페이지에서 재사용할 때 상단 제목/뒤로가기 목적지를 바꿔 끼운다
  heading?: string
  backTo?: string
  // 기본 정렬 ('all'이면 전달된 순서 그대로)
  initialSort?: SortKey
  // 시 id → "시집번호-시번호" 번호표
  numbers?: Map<string, string>
  // "안 읽은 시만" 필터 버튼을 노출할지 (전체 시 · 시집 상세에서 사용)
  showUnreadFilter?: boolean
}

function MobilePoems({
  poems,
  loading,
  heading = '시',
  backTo = '/',
  initialSort = 'likes',
  numbers,
  showUnreadFilter = false,
}: MobilePoemsProps) {
  const {
    query,
    setQuery,
    sort,
    setSort,
    dateAsc,
    setDateAsc,
    unreadOnly,
    setUnreadOnly,
    unreadCount,
    results,
  } = usePoemFilter(poems, initialSort)
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

  // 검색어·정렬·필터가 바뀌면 다시 처음 10편부터
  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [query, sort, dateAsc, unreadOnly])

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
  // 등록일순이 이미 켜진 상태에서 다시 누르면 오름/내림차순이 뒤집힌다
  const onSort = (key: SortKey) =>
    withViewTransition(() => {
      if (key === 'date' && sort === 'date') setDateAsc((v) => !v)
      else setSort(key)
    })

  return (
    <div className="mobile-poems">
      <header className="mobile-poems__top-bar">
        <Link to={backTo} className="mobile-poems__icon-btn" aria-label="뒤로">
          <ChevronLeft size={24} />
        </Link>
        <span className="mobile-poems__title">{heading}</span>
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
            {filterChips.map((chip) => {
              const active = sort === chip.key
              const isDate = chip.key === 'date'
              return (
                <button
                  key={chip.key}
                  type="button"
                  className={
                    'mobile-poems__chip' +
                    (active ? ' mobile-poems__chip--active' : '')
                  }
                  onClick={() => onSort(chip.key)}
                >
                  {chip.label}
                  {isDate && active && (dateAsc ? ' ↑' : ' ↓')}
                </button>
              )
            })}

            {showUnreadFilter && (
              <>
                <span className="mobile-poems__chip-divider" aria-hidden="true" />
                <button
                  type="button"
                  className={
                    'mobile-poems__chip mobile-poems__chip--unread' +
                    (unreadOnly ? ' mobile-poems__chip--unread-on' : '')
                  }
                  onClick={() =>
                    withViewTransition(() => setUnreadOnly((v) => !v))
                  }
                  aria-pressed={unreadOnly}
                >
                  안 읽은 시 {unreadCount}
                </button>
              </>
            )}
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
                (cols === 3 ? ' mobile-poems__view-btn--active' : '')
              }
              aria-label="3열로 보기"
              aria-pressed={cols === 3}
              onClick={() => onCols(3)}
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
              <PoemCard
                key={poem.id}
                {...poem}
                num={numbers?.get(poem.id)}
                compact={cols === 3}
              />
            ))}
          </div>
        ) : query ? (
          <p className="mobile-poems__empty">
            '{query}'에 대한 검색 결과가 없습니다.
          </p>
        ) : unreadOnly ? (
          <p className="mobile-poems__empty">
            안 읽은 시가 없습니다. 모든 시를 읽으셨네요.
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
