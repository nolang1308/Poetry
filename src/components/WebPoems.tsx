import { useEffect, useRef, useState } from 'react'
import WebNav from './WebNav'
import PoemCard from './PoemCard'
import { Search, SortIcon, Loader } from './icons'
import type { PoemDoc } from '../data/poems'
import { usePoemFilter, type SortKey } from '../hooks/usePoemFilter'
import { withViewTransition } from '../utils/viewTransition'
import './WebPoems.scss'

const sortChips: { label: string; key: SortKey }[] = [
  { label: '좋아요순', key: 'likes' },
  { label: '등록일순', key: 'date' },
  { label: '가나다순', key: 'title' },
]

// 한 번에 노출하는 시 개수 (스크롤로 계속 불러옴)
const PAGE_SIZE = 10

// 5개씩 끊어서 책장 행으로 구성
function chunk<T>(arr: T[], size: number): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size))
  return rows
}

interface WebPoemsProps {
  poems: PoemDoc[]
  loading: boolean
  // 시집 페이지에서 재사용할 때 제목/설명/활성 메뉴를 바꿔 끼운다
  heading?: string
  sub?: string
  navActive?: 'poems' | 'books'
}

function WebPoems({
  poems,
  loading,
  heading = '시',
  sub = '한 편의 시는 한 권의 책이 됩니다. 마음에 드는 표지를 골라 펼쳐 보세요.',
  navActive = 'poems',
}: WebPoemsProps) {
  const { query, setQuery, sort, setSort, results } = usePoemFilter(poems)

  // 무한 스크롤: 처음엔 10편, 하단 센티널이 보일 때마다 10편씩 더 노출
  const [visible, setVisible] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // 검색어·정렬이 바뀌면 다시 처음 10편부터
  useEffect(() => {
    setVisible(PAGE_SIZE)
  }, [query, sort])

  const shown = results.slice(0, visible)
  const hasMore = visible < results.length
  const rows = chunk(shown, 5)

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
    <div className="web-poems">
      <WebNav active={navActive} />

      <div className="web-poems__container">
        <header className="web-poems__header">
          <h1 className="web-poems__title">{heading}</h1>
          <p className="web-poems__sub">{sub}</p>
        </header>

        <div className="web-poems__controls">
          <div className="web-poems__search">
            <Search size={18} className="web-poems__search-icon" />
            <input
              className="web-poems__search-input"
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
          <div className="web-poems__filters">
            <SortIcon size={16} className="web-poems__sort-icon" />
            {sortChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className={
                  'web-poems__chip' +
                  (sort === chip.key ? ' web-poems__chip--active' : '')
                }
                onClick={() => onSort(chip.key)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="web-poems__empty">시를 불러오는 중…</p>
        ) : results.length > 0 ? (
          <div className="web-poems__grid">
            {rows.map((row, ri) => (
              <div className="web-poems__row" key={ri}>
                <div className="web-poems__covers">
                  {row.map((poem) => (
                    <PoemCard key={poem.id} {...poem} />
                  ))}
                </div>
                <div className="web-poems__shelf" />
              </div>
            ))}
          </div>
        ) : query ? (
          <p className="web-poems__empty">
            '{query}'에 대한 검색 결과가 없습니다.
          </p>
        ) : (
          <p className="web-poems__empty">등록된 시가 없습니다.</p>
        )}

        {!loading && hasMore && (
          <div className="web-poems__loading" ref={sentinelRef}>
            <Loader size={18} className="web-poems__spinner" />
            <span className="web-poems__loading-text">계속 불러오는 중...</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default WebPoems
