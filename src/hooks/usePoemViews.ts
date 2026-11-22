import { useEffect, useState } from 'react'
import { subscribePoemViews } from '../data/poemViewsRepo'

// 시별 조회수를 구독한다 (관리자 화면 전용 — 보안 규칙상 관리자만 읽을 수 있다).
// views가 null이면 아직 받아오는 중, error가 true면 읽기에 실패한 것이다.
export function usePoemViews(): {
  views: Map<string, number> | null
  error: boolean
} {
  const [views, setViews] = useState<Map<string, number> | null>(null)
  const [error, setError] = useState(false)

  useEffect(
    () =>
      subscribePoemViews(
        (v) => {
          setViews(v)
          setError(false)
        },
        () => setError(true),
      ),
    [],
  )

  return { views, error }
}
