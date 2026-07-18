import { useMemo, useState } from 'react'
import type { Poem } from '../data/poems'

export type SortKey = 'likes' | 'date' | 'title' | 'all'

// 시 목록에 검색어 필터 + 정렬을 적용하는 공용 훅 (입력 타입 T를 그대로 유지)
export function usePoemFilter<T extends Poem>(poems: T[], initialSort: SortKey = 'likes') {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>(initialSort)
  // 등록일순의 방향 (false = 최신부터 내림차순, true = 오래된 것부터 오름차순)
  const [dateAsc, setDateAsc] = useState(false)

  const results = useMemo(() => {
    // 띄어쓰기 무시: 검색어와 제목 모두 공백 제거 후 비교
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '')
    const q = normalize(query)
    const filtered = q
      ? poems.filter((p) => normalize(p.title).includes(q))
      : poems.slice()

    switch (sort) {
      case 'likes':
        return filtered.sort((a, b) => Number(b.likes) - Number(a.likes))
      case 'date':
        return filtered.sort((a, b) =>
          dateAsc ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date),
        )
      case 'title':
        return filtered.sort((a, b) => a.title.localeCompare(b.title, 'ko'))
      case 'all':
      default:
        return filtered
    }
  }, [poems, query, sort, dateAsc])

  return { query, setQuery, sort, setSort, dateAsc, setDateAsc, results }
}
