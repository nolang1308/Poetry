import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase'

// 한 시집에 담을 수 있는 시의 최대 편수
export const MAX_BOOK_POEMS = 100

// 시집: 관리자가 이름을 붙여 시들을 묶은 단위. poemIds는 선택한 순서 그대로.
// image는 시집 표지 사진(선택). 없으면 목록에서 첫 번째 시의 사진을 쓴다.
// lastImage는 책 펼침 모션에서 맨 마지막 장에 보여줄 사진(선택).
// name2는 표지 제목의 둘째 줄(선택) — 표지에서 name 아래에 따로 표시된다.
export interface Book {
  name: string
  name2?: string
  poemIds: string[]
  image?: string
  lastImage?: string
}

// Firestore 문서(문서 id 포함)
export interface BookDoc extends Book {
  id: string
}

const booksCol = collection(db, 'books')

function fromDoc(id: string, data: DocumentData): BookDoc {
  return {
    id,
    name: data.name ?? '',
    name2: data.name2 ?? '',
    poemIds: Array.isArray(data.poemIds) ? data.poemIds : [],
    image: data.image ?? '',
    lastImage: data.lastImage ?? '',
  }
}

// 실시간 구독 (sortKey 내림차순: 최근 만든 시집이 앞)
function subscribeBooks(cb: (books: BookDoc[]) => void) {
  const q = query(booksCol, orderBy('sortKey', 'desc'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => fromDoc(d.id, d.data())))
  })
}

// ── 전역 싱글턴 스토어 (poemsRepo와 동일한 패턴) ──
let cache: BookDoc[] | null = null
const listeners = new Set<(books: BookDoc[]) => void>()
let started = false

function ensureStarted() {
  if (started) return
  started = true
  subscribeBooks((list) => {
    cache = list
    listeners.forEach((l) => l(list))
  })
}

export function getBooksCache(): BookDoc[] | null {
  return cache
}

export function subscribeBooksStore(cb: (books: BookDoc[]) => void): () => void {
  ensureStarted()
  listeners.add(cb)
  if (cache) cb(cache)
  return () => {
    listeners.delete(cb)
  }
}

export async function addBook(data: Book) {
  await addDoc(booksCol, {
    name: data.name,
    name2: data.name2 ?? '',
    poemIds: data.poemIds.slice(0, MAX_BOOK_POEMS),
    image: data.image ?? '',
    lastImage: data.lastImage ?? '',
    sortKey: Date.now(),
  })
}

export async function updateBook(id: string, data: Book) {
  await updateDoc(doc(db, 'books', id), {
    name: data.name,
    name2: data.name2 ?? '',
    poemIds: data.poemIds.slice(0, MAX_BOOK_POEMS),
    image: data.image ?? '',
    lastImage: data.lastImage ?? '',
  })
}

export async function deleteBook(id: string) {
  await deleteDoc(doc(db, 'books', id))
}

// 시가 삭제되면 그 시를 담고 있던 시집의 poemIds에서도 빼낸다.
// 이걸 하지 않으면 존재하지 않는 id가 시집에 남아 정원(최대 편수)만
// 차지한 채 화면에는 보이지 않는다.
export async function removePoemsFromBooks(poemIds: string[]) {
  if (poemIds.length === 0) return
  const removed = new Set(poemIds)

  // 관리자 화면은 시집을 이미 구독 중이므로 캐시를 쓰고, 없으면 직접 읽는다
  const books =
    cache ??
    (await getDocs(booksCol)).docs.map((d) => fromDoc(d.id, d.data()))

  await Promise.all(
    books
      .filter((b) => b.poemIds.some((pid) => removed.has(pid)))
      .map((b) =>
        updateDoc(doc(db, 'books', b.id), {
          poemIds: b.poemIds.filter((pid) => !removed.has(pid)),
        }),
      ),
  )
}
