import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../firebase'
import {
  isDataUrl,
  uploadImageReplacing,
  deleteImageFolder,
} from './imageStorage'

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

// Firestore 문서(문서 id 포함).
// sortKey는 시집의 순서 값 — 처음엔 만든 시각(ms)이고, 관리자가 순서를
// 바꿔 저장하면 시집들끼리 이 값을 새 순서대로 다시 나눠 갖는다. 시집 목록·시집 번호가 모두 이 값을 따른다.
export interface BookDoc extends Book {
  id: string
  sortKey: number
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
    sortKey: Number(data.sortKey ?? 0),
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

// 표지·마지막 장 사진: data URL이면 Storage에 올리고 문서에는 URL만 남긴다.
// 두 장이 한 시집에 속하므로 books/{id} 아래 하위 폴더로 나눠 담는다.
async function resolveImage(
  id: string,
  sub: 'cover' | 'last',
  image?: string,
): Promise<string> {
  if (!image) return ''
  if (!isDataUrl(image)) return image
  return uploadImageReplacing(`books/${id}/${sub}`, image)
}

export async function addBook(data: Book) {
  // 사진 업로드 경로에 문서 id가 필요하므로 id를 먼저 받아 둔다
  const ref = doc(booksCol)
  const [image, lastImage] = await Promise.all([
    resolveImage(ref.id, 'cover', data.image),
    resolveImage(ref.id, 'last', data.lastImage),
  ])
  await setDoc(ref, {
    name: data.name,
    name2: data.name2 ?? '',
    poemIds: data.poemIds.slice(0, MAX_BOOK_POEMS),
    image,
    lastImage,
    sortKey: Date.now(),
  })
}

export async function updateBook(id: string, data: Book) {
  const [image, lastImage] = await Promise.all([
    resolveImage(id, 'cover', data.image),
    resolveImage(id, 'last', data.lastImage),
  ])
  await updateDoc(doc(db, 'books', id), {
    name: data.name,
    name2: data.name2 ?? '',
    poemIds: data.poemIds.slice(0, MAX_BOOK_POEMS),
    image,
    lastImage,
  })
}

// 시집 순서 저장 (관리자만 — 보안 규칙). ordered는 공개 화면 순서(1번이 앞).
// 지금 시집들이 가진 순서 값을 작은 것부터 새 순서대로 다시 나눠 주고,
// 값이 바뀌는 시집만 한 묶음으로 고친다. 다른 필드(시·사진)는 그대로다.
export async function saveBookOrder(ordered: BookDoc[]) {
  const keys = ordered.map((b) => b.sortKey).sort((x, y) => x - y)
  // 같은 값이 있으면 순서가 정해지지 않으므로 앞 값보다 항상 크게 벌린다
  for (let i = 1; i < keys.length; i++) {
    if (keys[i] <= keys[i - 1]) keys[i] = keys[i - 1] + 1
  }
  const batch = writeBatch(db)
  let changed = 0
  ordered.forEach((b, i) => {
    if (b.sortKey === keys[i]) return
    batch.update(doc(db, 'books', b.id), { sortKey: keys[i] })
    changed++
  })
  if (changed > 0) await batch.commit()
}

export async function deleteBook(id: string) {
  await deleteDoc(doc(db, 'books', id))
  // Storage에 올려 둔 사진도 함께 정리 (실패해도 삭제 흐름은 유지)
  await deleteImageFolder(`books/${id}`)
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
