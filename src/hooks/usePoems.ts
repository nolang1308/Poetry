import { useEffect, useState } from 'react'
import { subscribeStore, getPoemsCache } from '../data/poemsRepo'
import type { PoemDoc } from '../data/poems'

// Firestore의 시 목록을 전역 캐시 기반으로 구독하는 공용 훅.
// 이미 로드된 적이 있으면 캐시로 즉시 렌더(로딩 없음) → 화면 전환이 매끄러움.
export function usePoems() {
  const [poems, setPoems] = useState<PoemDoc[]>(() => getPoemsCache() ?? [])
  const [loading, setLoading] = useState(() => getPoemsCache() === null)

  useEffect(() => {
    return subscribeStore((list) => {
      setPoems(list)
      setLoading(false)
    })
  }, [])

  return { poems, loading }
}
