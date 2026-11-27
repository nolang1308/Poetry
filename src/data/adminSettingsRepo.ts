import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

// 관리자 화면 공통 설정. settings/admin 문서 하나에 담아, 어느 기기·어느
// 관리자 계정으로 열어도 같은 값이 적용된다. (쓰기는 관리자만 — 보안 규칙)
export type PoemOrder = 'asc' | 'desc'

// 시 관리 목록의 정렬 방법
export type AdminPoemSort = 'newest' | 'oldest' | 'likes' | 'views' | 'title'
const ADMIN_POEM_SORTS: AdminPoemSort[] = ['newest', 'oldest', 'likes', 'views', 'title']

export interface AdminSettings {
  // 시집 만들기/수정의 시 선택 목록 기본 정렬
  // (asc = 오래된순, desc = 최신순)
  bookPoemOrder: PoemOrder
  // 시 관리(관리자 홈) 목록의 기본 정렬
  adminPoemSort: AdminPoemSort
}

export const defaultAdminSettings: AdminSettings = {
  bookPoemOrder: 'desc',
  adminPoemSort: 'newest',
}

const ref = doc(db, 'settings', 'admin')

function fromData(data: Record<string, unknown> | undefined): AdminSettings {
  return {
    bookPoemOrder: data?.bookPoemOrder === 'asc' ? 'asc' : 'desc',
    adminPoemSort: ADMIN_POEM_SORTS.includes(data?.adminPoemSort as AdminPoemSort)
      ? (data?.adminPoemSort as AdminPoemSort)
      : defaultAdminSettings.adminPoemSort,
  }
}

// 전역 싱글턴 캐시 (homeRepo와 같은 패턴)
let cache: AdminSettings | null = null
const listeners = new Set<(s: AdminSettings) => void>()
let started = false

function emit(s: AdminSettings) {
  cache = s
  listeners.forEach((l) => l(s))
}

function ensureStarted() {
  if (started) return
  started = true
  onSnapshot(
    ref,
    (snap) => emit(fromData(snap.data())),
    // 읽기에 실패해도 화면이 멈추지 않게 기본값으로 진행한다
    () => emit(cache ?? defaultAdminSettings),
  )
}

export function getAdminSettingsCache(): AdminSettings | null {
  return cache
}

export function subscribeAdminSettings(
  cb: (s: AdminSettings) => void,
): () => void {
  ensureStarted()
  listeners.add(cb)
  if (cache) cb(cache)
  return () => {
    listeners.delete(cb)
  }
}

// 전달된 필드만 병합 저장
export async function updateAdminSettings(data: Partial<AdminSettings>) {
  await setDoc(ref, data, { merge: true })
}
