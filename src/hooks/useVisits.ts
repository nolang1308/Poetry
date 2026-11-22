import { useEffect, useState } from 'react'
import { subscribeVisits } from '../data/visitsRepo'
import type { VisitData } from '../data/visitSeries'

// 방문자 수를 구독한다 (관리자 화면 전용 — 보안 규칙상 관리자만 읽을 수 있다).
// since(YYYY-MM-DD)부터 오늘까지의 날짜별 값과 누적 값을 받는다.
// data가 null이면 아직 받아오는 중, error가 true면 읽기에 실패한 것이다.
export function useVisits(since: string): {
  data: VisitData | null
  error: boolean
} {
  const [data, setData] = useState<VisitData | null>(null)
  const [error, setError] = useState(false)

  useEffect(
    () =>
      subscribeVisits(
        since,
        (d) => {
          setData(d)
          setError(false)
        },
        () => setError(true),
      ),
    [since],
  )

  return { data, error }
}
