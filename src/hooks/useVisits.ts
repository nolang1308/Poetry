import { useEffect, useState } from 'react'
import { subscribeVisits, getVisitsCache } from '../data/statsRepo'

// 사이트 전체 방문자 수를 구독. 아직 받아오기 전이면 null이라
// 화면에서 숫자가 0으로 잠깐 깜빡이는 일이 없다.
export function useVisits(): number | null {
  const [visits, setVisits] = useState<number | null>(() => getVisitsCache())

  useEffect(() => subscribeVisits(setVisits), [])

  return visits
}
