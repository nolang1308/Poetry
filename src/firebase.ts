import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getAuth, signInAnonymously } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyBwlIuW2PqH_MZ7xm-5dNOhMIQhkjQ9fqA',
  authDomain: 'poetry-kwonilwon.firebaseapp.com',
  projectId: 'poetry-kwonilwon',
  storageBucket: 'poetry-kwonilwon.firebasestorage.app',
  messagingSenderId: '952090116571',
  appId: '1:952090116571:web:f2ddb60cde9005f19e27fe',
}

// 관리자 로그인 아이디로 쓰는 전화번호를 내부 이메일로 매핑
export function phoneToEmail(phone: string) {
  return `${phone.replace(/\D/g, '')}@poetry-admin.web`
}

// 관리자 계정 목록 (전화번호 기반 내부 이메일).
// 여기에 추가하고 firestore.rules의 isAdmin() 목록도 같이 갱신해야 실제 권한이 생긴다.
export const ADMIN_EMAILS = [
  '01092375405@poetry-admin.web',
  '01035959152@poetry-admin.web',
]

export const app = initializeApp(firebaseConfig)
// 받은 데이터를 브라우저(IndexedDB)에 저장해 두는 오프라인 캐시.
// 재방문 시 캐시로 즉시 화면을 그리고, 뒤에서 변경분만 받아온다.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})
export const auth = getAuth(app)
// 사진 원본 저장소. Firestore 문서에는 다운로드 URL만 넣는다.
export const storage = getStorage(app)

// 게스트 식별용 익명 로그인. 댓글 작성 등 uid가 필요한 순간에만 호출한다.
// 이미 로그인돼 있으면(관리자 포함) 그 uid를 그대로 쓴다.
export async function ensureSignedIn(): Promise<string> {
  if (auth.currentUser) return auth.currentUser.uid
  const cred = await signInAnonymously(auth)
  return cred.user.uid
}
