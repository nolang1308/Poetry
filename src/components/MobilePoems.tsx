import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import PoemCard from './PoemCard'
import MobileMenu from './MobileMenu'
import { Search, ChevronLeft, Menu, Loader } from './icons'
import type { PoemDoc } from '../data/poems'
import { usePoemFilter, type SortKey } from '../hooks/usePoemFilter'
import { withViewTransition } from '../utils/viewTransition'
import './MobilePoems.scss'

const filterChips: { label: string; key: SortKey }[] = [
  { label: '좋아요순', key: 'likes' },
  { label: '등록일순', key: 'date' },
  { label: '전체', key: 'all' },
]

function chunk<T>(arr: T[], size: number): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size))
  return rows
}

function MobilePoems({ poems, loading }: { poems: PoemDoc[]; loading: boolean }) {
  const { query, setQuery, sort, setSort, results } = usePoemFilter(poems)
  const rows = chunk(results, 2)
  const [menuOpen, setMenuOpen] = useState(false)

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

        {loading ? (
          <p className="mobile-poems__empty">시를 불러오는 중…</p>
        ) : results.length > 0 ? (
          <div className="mobile-poems__grid">
            {rows.map((row, ri) => (
              <div className="mobile-poems__row" key={ri}>
                {row.map((poem) => (
                  <PoemCard key={poem.id} {...poem} />
                ))}
              </div>
            ))}
          </div>
        ) : query ? (
          <p className="mobile-poems__empty">
            '{query}'에 대한 검색 결과가 없습니다.
          </p>
        ) : (
          <p className="mobile-poems__empty">등록된 시가 없습니다.</p>
        )}

        {!loading && !query && results.length > 0 && (
          <div className="mobile-poems__loading">
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
