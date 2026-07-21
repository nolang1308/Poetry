import { doc, onSnapshot, setDoc, increment } from 'firebase/firestore'
import { db } from '../firebase'
import { shouldCountVisit } from '../utils/visit'

// 사이트 전체 방문자 수. settings/stats 문서의 visits 필드 하나만 쓴다.
// (홈 콘텐츠가 들어 있는 settings/home 과는 문서를 분리해 둔다)
const ref = doc(db, 'settings', 'stats')

// 전역 싱글턴 캐시 (poemsRepo·homeRepo와 동일한 패턴)
let cache: number | null = null
const listeners = new Set<(n: number) => void>()
let started = false

function ensureStarted() {
  if (started) return
  started = true
  onSnapshot(ref, (snap) => {
    cache = Number(snap.data()?.visits ?? 0)
    listeners.forEach((l) => l(cache!))
  })
}

export function getVisitsCache(): number | null {
  return cache
}

export function subscribeVisits(cb: (n: number) => void): () => void {
  ensureStarted()
  listeners.add(cb)
  if (cache !== null) cb(cache)
  return () => {
    listeners.delete(cb)
  }
}

// 방문 1회 집계. 하루에 한 번만 실제로 올라간다.
// 문서가 아직 없으면 이 호출이 visits: 1 로 만들어 준다.
export async function countVisit() {
  if (!shouldCountVisit()) return
  try {
    await setDoc(ref, { visits: increment(1) }, { merge: true })
  } catch {
    // 집계 실패는 화면에 영향을 주지 않으므로 조용히 넘어간다
  }
}
