import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase'

// 한 시집에 담을 수 있는 시의 최대 편수
export const MAX_BOOK_POEMS = 100

// 시집: 관리자가 이름을 붙여 시들을 묶은 단위. poemIds는 선택한 순서 그대로.
export interface Book {
  name: string
  poemIds: string[]
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
    poemIds: Array.isArray(data.poemIds) ? data.poemIds : [],
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
    poemIds: data.poemIds.slice(0, MAX_BOOK_POEMS),
    sortKey: Date.now(),
  })
}

export async function updateBook(id: string, data: Book) {
  await updateDoc(doc(db, 'books', id), {
    name: data.name,
    poemIds: data.poemIds.slice(0, MAX_BOOK_POEMS),
  })
}

export async function deleteBook(id: string) {
  await deleteDoc(doc(db, 'books', id))
}
