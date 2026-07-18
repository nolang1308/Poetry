import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore'
import { db, ensureSignedIn } from '../firebase'

export const MAX_COMMENT_NICKNAME = 20
export const MAX_COMMENT_CONTENT = 500

// 게스트 댓글. authorUid는 익명 로그인 uid — 본인 수정/삭제 판정에 쓴다.
export interface CommentDoc {
  id: string
  poemId: string
  nickname: string
  content: string
  authorUid: string
  createdAt: number
}

const commentsCol = collection(db, 'comments')

// 시 한 편의 댓글 실시간 구독.
// 복합 인덱스가 필요 없도록 where만 쓰고 정렬(최신순)은 클라이언트에서 한다.
export function subscribeComments(
  poemId: string,
  cb: (list: CommentDoc[]) => void,
) {
  const q = query(commentsCol, where('poemId', '==', poemId))
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        poemId: data.poemId ?? '',
        nickname: data.nickname ?? '',
        content: data.content ?? '',
        authorUid: data.authorUid ?? '',
        createdAt: Number(data.createdAt ?? 0),
      }
    })
    list.sort((a, b) => b.createdAt - a.createdAt)
    cb(list)
  })
}

export async function addComment(
  poemId: string,
  nickname: string,
  content: string,
) {
  const uid = await ensureSignedIn()
  await addDoc(commentsCol, {
    poemId,
    nickname: nickname.trim().slice(0, MAX_COMMENT_NICKNAME),
    content: content.trim().slice(0, MAX_COMMENT_CONTENT),
    authorUid: uid,
    createdAt: Date.now(),
  })
}

// 보안 규칙상 content 필드만, 작성자 본인만 수정할 수 있다
export async function updateComment(id: string, content: string) {
  await updateDoc(doc(db, 'comments', id), {
    content: content.trim().slice(0, MAX_COMMENT_CONTENT),
  })
}

// 작성자 본인 또는 관리자만 (보안 규칙에서 검증)
export async function deleteComment(id: string) {
  await deleteDoc(doc(db, 'comments', id))
}
