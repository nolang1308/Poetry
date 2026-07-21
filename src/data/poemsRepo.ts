import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  increment,
  query,
  orderBy,
  limit,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase'
import { removePoemsFromBooks } from './booksRepo'
import { webPoems, type Poem, type PoemDoc } from './poems'

const poemsCol = collection(db, 'poems')

function fromDoc(id: string, data: DocumentData): PoemDoc {
  return {
    id,
    title: data.title ?? '',
    content: data.content ?? '',
    note: data.note ?? '',
    date: data.date ?? '',
    likes: String(data.likes ?? 0),
    // 노트 좋아요·조회수 도입 이전 문서에는 필드가 없다 → 0으로 본다
    noteLikes: String(data.noteLikes ?? 0),
    views: String(data.views ?? 0),
    image: data.image ?? '',
    // 등록 시각. 정렬용으로 넣던 값을 NEW 배지 판정에도 그대로 쓴다.
    createdAt: Number(data.sortKey ?? 0),
  }
}

// 실시간 구독 (sortKey 내림차순: 최신/상단 우선)
export function subscribePoems(cb: (poems: PoemDoc[]) => void) {
  const q = query(poemsCol, orderBy('sortKey', 'desc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => fromDoc(d.id, d.data())))
  })
}

// ── 전역 싱글턴 스토어 ──
// 하나의 Firestore 리스너를 앱 전체가 공유하고, 마지막 값을 캐시.
// 페이지를 이동해도 데이터가 즉시 준비되어 있어(로딩 깜빡임 없음)
// 표지→상세 View Transition이 매끄럽게 이어진다.
let cache: PoemDoc[] | null = null
const listeners = new Set<(poems: PoemDoc[]) => void>()
let started = false

function ensureStarted() {
  if (started) return
  started = true
  subscribePoems((list) => {
    cache = list
    listeners.forEach((l) => l(list))
  })
}

export function getPoemsCache(): PoemDoc[] | null {
  return cache
}

export function subscribeStore(cb: (poems: PoemDoc[]) => void): () => void {
  ensureStarted()
  listeners.add(cb)
  if (cache) cb(cache)
  return () => {
    listeners.delete(cb)
  }
}

export async function addPoem(data: Poem) {
  await addDoc(poemsCol, {
    title: data.title,
    content: data.content ?? '',
    note: data.note ?? '',
    date: data.date,
    likes: Number(data.likes) || 0,
    noteLikes: 0,
    views: 0,
    image: data.image ?? '',
    sortKey: Date.now(),
  })
}

export async function updatePoem(id: string, data: Poem) {
  await updateDoc(doc(db, 'poems', id), {
    title: data.title,
    content: data.content ?? '',
    note: data.note ?? '',
    date: data.date,
    likes: Number(data.likes) || 0,
    image: data.image ?? '',
  })
}

// 시를 지우고, 그 시를 담고 있던 시집에서도 함께 빼낸다.
// (시집에 남겨 두면 보이지 않는 채로 정원만 차지한다)
export async function deletePoems(ids: string[]) {
  await Promise.all(ids.map((id) => deleteDoc(doc(db, 'poems', id))))
  await removePoemsFromBooks(ids)
}

// 시 본문 좋아요 ±1 (보안 규칙상 likes 필드만 단독 변경 허용)
export async function likePoem(id: string, liked: boolean) {
  await updateDoc(doc(db, 'poems', id), { likes: increment(liked ? 1 : -1) })
}

// 시인의 노트 좋아요 ±1 (본문 좋아요와 별개로 집계).
// 필드가 없는 기존 문서에서도 increment가 0부터 시작하므로 그대로 동작한다.
export async function likeNote(id: string, liked: boolean) {
  await updateDoc(doc(db, 'poems', id), {
    noteLikes: increment(liked ? 1 : -1),
  })
}

// 조회수 +1. 이 브라우저에서 처음 여는 시일 때만 호출한다(utils/seen 기준).
// 보안 규칙상 감소는 허용하지 않는다.
export async function viewPoem(id: string) {
  await updateDoc(doc(db, 'poems', id), { views: increment(1) })
}

// 컬렉션이 비어 있으면 기존 샘플 시들로 시드 (앱 최초 실행 시 1회)
let seedPromise: Promise<void> | null = null

export function ensureSeeded() {
  if (!seedPromise) seedPromise = seed()
  return seedPromise
}

async function seed() {
  const snap = await getDocs(query(poemsCol, limit(1)))
  if (!snap.empty) return

  const batch = writeBatch(db)
  const base = Date.now()
  webPoems.forEach((p, i) => {
    const ref = doc(poemsCol)
    batch.set(ref, {
      title: p.title,
      content: '',
      date: p.date,
      likes: Number(p.likes) || 0,
      image: p.image,
      sortKey: base - i, // 배열 순서 유지 (앞쪽이 상단)
    })
  })
  await batch.commit()
}
