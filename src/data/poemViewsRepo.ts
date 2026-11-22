import {
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  setDoc,
} from 'firebase/firestore'
import { db } from '../firebase'
import { claimPoemView, kstDay, releasePoemView } from '../utils/visit'
import { isCountableVisitor } from './visitsRepo'

// 시별 조회수. poemViews 컬렉션에 시 하나당 문서 하나(문서 id = 시 id),
// 필드는 count 하나뿐이다.
// 시 문서(poems)에 넣지 않고 따로 두는 이유:
//  - 읽기를 관리자로 막을 수 있다 (시 문서는 누구나 읽는다)
//  - 누가 시를 열 때마다 시 목록 전체 구독이 다시 내려오는 일이 없다
const viewsCol = collection(db, 'poemViews')

// 조회 1회 집계. 시 상세를 열 때 호출한다.
// 같은 브라우저에서 같은 시는 하루에 한 번만 세고,
// 관리자·검색 로봇·개발 서버는 세지 않는다 (방문자 수와 같은 기준).
export async function countPoemView(poemId: string) {
  if (!(await isCountableVisitor())) return

  const day = kstDay()
  if (!claimPoemView(poemId, day)) return

  try {
    // 문서가 아직 없으면 이 쓰기가 count: 1 로 만들어 준다
    await setDoc(doc(viewsCol, poemId), { count: increment(1) }, { merge: true })
  } catch {
    // 집계 실패는 화면에 영향을 주지 않는다. 다음에 열 때 다시 시도한다.
    releasePoemView(poemId, day)
  }
}

// 관리자 화면용 실시간 구독: 시 id → 조회수.
// 한 번도 열리지 않은 시는 문서가 없으므로 Map에 들어 있지 않다(0으로 본다).
export function subscribePoemViews(
  cb: (views: Map<string, number>) => void,
  onError: () => void,
): () => void {
  return onSnapshot(
    viewsCol,
    (snap) => {
      cb(new Map(snap.docs.map((d) => [d.id, Number(d.data().count ?? 0)])))
    },
    onError,
  )
}

// 시를 지울 때 조회수 문서도 함께 정리한다 (관리자만 가능).
// 실패해도 시 삭제 흐름은 막지 않는다.
export async function deletePoemViews(poemIds: string[]) {
  await Promise.all(
    poemIds.map((id) => deleteDoc(doc(viewsCol, id)).catch(() => {})),
  )
}
