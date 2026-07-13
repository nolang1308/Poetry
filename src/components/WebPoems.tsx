import { useEffect, useRef, useState } from 'react'
import WebNav from './WebNav'
import PoemCard from './PoemCard'
import { Search, SortIcon, ChevronLeft, ChevronRight } from './icons'
import type { PoemDoc } from '../data/poems'
import { usePoemFilter, type SortKey } from '../hooks/usePoemFilter'
import { withViewTransition } from '../utils/viewTransition'
import './WebPoems.scss'

const sortChips: { label: string; key: SortKey }[] = [
  { label: '좋아요순', key: 'likes' },
  { label: '등록일순', key: 'date' },
  { label: '가나다순', key: 'title' },
]

const PAGE_SIZE = 10 // 한 페이지에 표시할 시 수 (책장 2줄)

// 5개씩 끊어서 책장 행으로 구성
function chunk<T>(arr: T[], size: number): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size))
  return rows
}

// 페이지 버튼 목록 (많으면 생략기호로 축약)
function pageItems(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const items: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) items.push('…')
  for (let i = start; i <= end; i++) items.push(i)
  if (end < total - 1) items.push('…')
  items.push(total)
  return items
}

function WebPoems({ poems, loading }: { poems: PoemDoc[]; loading: boolean }) {
  const { query, setQuery, sort, setSort, results } = usePoemFilter(poems)
  const [page, setPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE))

  // 결과가 줄어 현재 페이지가 넘치면 보정
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  // 페이지 이동 시 상단으로
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  // 한글 조합(IME) 중에는 flushSync/전환을 걸지 않아야 글자가 끊기지 않는다
  const composing = useRef(false)
  const applyQuery = (v: string, animate: boolean) => {
    const run = () => {
      setQuery(v)
      setPage(1)
    }
    if (animate) withViewTransition(run)
    else run()
  }

  const onSort = (key: SortKey) =>
    withViewTransition(() => {
      setSort(key)
      setPage(1)
    })
  const onPage = (p: number) => withViewTransition(() => setPage(p))

  const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const rows = chunk(pageResults, 5)

  return (
    <div className="web-poems">
      <WebNav active="poems" />

      <div className="web-poems__container">
        <header className="web-poems__header">
          <h1 className="web-poems__title">시</h1>
          <p className="web-poems__sub">
            한 편의 시는 한 권의 책이 됩니다. 마음에 드는 표지를 골라 펼쳐 보세요.
          </p>
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

        {!loading && totalPages > 1 && (
          <div className="web-poems__pagination">
            <button
              type="button"
              className="web-poems__page-btn"
              onClick={() => onPage(Math.max(1, page - 1))}
              disabled={page === 1}
              aria-label="이전 페이지"
            >
              <ChevronLeft size={18} />
            </button>

            {pageItems(page, totalPages).map((it, i) =>
              it === '…' ? (
                <span key={`e${i}`} className="web-poems__ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={it}
                  type="button"
                  className={
                    'web-poems__page-btn' +
                    (it === page ? ' web-poems__page-btn--active' : '')
                  }
                  onClick={() => onPage(it)}
                >
                  {it}
                </button>
              ),
            )}

            <button
              type="button"
              className="web-poems__page-btn"
              onClick={() => onPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              aria-label="다음 페이지"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default WebPoems
