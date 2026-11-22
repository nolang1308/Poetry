import {
  collection,
  doc,
  documentId,
  increment,
  onSnapshot,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { auth, db, ADMIN_EMAILS } from '../firebase'
import { claimVisit, isBot, kstDay, releaseVisit } from '../utils/visit'
import type { VisitData } from './visitSeries'

// 사이트 방문자 수. visits 컬렉션에 문서 하나당 count 필드 하나만 둔다.
//   visits/total       누적
//   visits/2026-11-22  그날 하루 (한국 시간 기준)
// 읽기는 관리자만 가능하다(보안 규칙) — 숫자는 관리자 화면에만 보인다.
// 주간·월간·누적 추이는 따로 저장하지 않고 날짜별 값에서 계산한다(visitSeries).
const visitsCol = collection(db, 'visits')
const TOTAL_ID = 'total'

// 집계 대상인지 판정한다 — 개발 서버·검색 로봇·관리자는 세지 않는다.
// (방문자 수와 시별 조회수가 같은 기준을 쓴다)
export async function isCountableVisitor(): Promise<boolean> {
  if (import.meta.env.DEV) return false
  if (isBot()) return false

  // 로그인 복원이 끝난 뒤에 판정해야 관리자 본인의 방문이 섞이지 않는다
  await auth.authStateReady()
  const user = auth.currentUser
  return !(user && !user.isAnonymous && ADMIN_EMAILS.includes(user.email ?? ''))
}

// 방문 1회 집계. 어느 페이지로 들어오든 앱이 뜰 때 한 번 호출한다.
// 같은 브라우저는 하루에 한 번만 세고, 관리자·검색 로봇·개발 서버는 세지 않는다.
export async function countVisit() {
  if (window.location.pathname.startsWith('/admin')) return
  if (!(await isCountableVisitor())) return

  const day = kstDay()
  if (!claimVisit(day)) return

  try {
    // 누적과 오늘 치를 한 묶음으로 올려 두 숫자가 어긋나지 않게 한다.
    // 문서가 아직 없으면 이 쓰기가 count: 1 로 만들어 준다.
    const batch = writeBatch(db)
    batch.set(doc(visitsCol, TOTAL_ID), { count: increment(1) }, { merge: true })
    batch.set(doc(visitsCol, day), { count: increment(1) }, { merge: true })
    await batch.commit()
  } catch {
    // 집계 실패는 화면에 영향을 주지 않는다. 다음 접속 때 다시 시도한다.
    releaseVisit()
  }
}

// 관리자 화면용 실시간 구독. 누적 문서 + since(YYYY-MM-DD)부터 오늘까지의
// 날짜별 문서만 읽는다. 두 구독이 모두 첫 값을 받은 뒤부터 cb를 부른다.
// 권한이 없거나(로그아웃 직후 등) 읽기에 실패하면 onError를 부른다.
export function subscribeVisits(
  since: string,
  cb: (data: VisitData) => void,
  onError: () => void,
): () => void {
  const today = kstDay()

  let total: number | null = null
  let days: Map<string, number> | null = null

  const emit = () => {
    if (total === null || days === null) return
    cb({ total, days })
  }

  const unsubTotal = onSnapshot(
    doc(visitsCol, TOTAL_ID),
    (snap) => {
      total = Number(snap.data()?.count ?? 0)
      emit()
    },
    onError,
  )

  // 문서 id가 날짜라서 id 범위로 필요한 기간만 가져온다.
  // ('total'은 숫자로 시작하는 날짜보다 뒤에 정렬되므로 상한에서 걸러진다)
  const unsubDays = onSnapshot(
    query(
      visitsCol,
      where(documentId(), '>=', since),
      where(documentId(), '<=', today),
    ),
    (snap) => {
      days = new Map(
        snap.docs.map((d) => [d.id, Number(d.data().count ?? 0)]),
      )
      emit()
    },
    onError,
  )

  return () => {
    unsubTotal()
    unsubDays()
  }
}
