import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { defaultHome, type HomeContent } from './home'

const ref = doc(db, 'settings', 'home')

// 전역 싱글턴 캐시 (기본값 + 저장된 값 병합)
let cache: HomeContent | null = null
const listeners = new Set<(h: HomeContent) => void>()
let started = false

function ensureStarted() {
  if (started) return
  started = true
  onSnapshot(ref, (snap) => {
    const saved = (snap.data() as Partial<HomeContent> | undefined) ?? {}
    cache = { ...defaultHome, ...saved }
    listeners.forEach((l) => l(cache!))
  })
}

export function getHomeCache(): HomeContent | null {
  return cache
}

export function subscribeHome(cb: (h: HomeContent) => void): () => void {
  ensureStarted()
  listeners.add(cb)
  if (cache) cb(cache)
  return () => {
    listeners.delete(cb)
  }
}

// 관리자만 (보안 규칙). 전달된 필드만 병합 저장.
export async function updateHome(data: Partial<HomeContent>) {
  await setDoc(ref, data, { merge: true })
}
