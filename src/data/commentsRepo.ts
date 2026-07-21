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
// parentId가 비어 있으면 원 댓글, 값이 있으면 그 댓글에 달린 답글이다.
// 답글의 답글도 parentId는 항상 최상위 댓글을 가리킨다(깊이 1단계 고정).
export interface CommentDoc {
  id: string
  poemId: string
  nickname: string
  content: string
  authorUid: string
  createdAt: number
  parentId: string
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
        // 답글 기능 이전에 쓴 댓글에는 필드가 없다 → 원 댓글로 취급
        parentId: data.parentId ?? '',
      }
    })
    list.sort((a, b) => b.createdAt - a.createdAt)
    cb(list)
  })
}

// parentId를 넘기면 그 댓글에 달린 답글로 등록된다.
export async function addComment(
  poemId: string,
  nickname: string,
  content: string,
  parentId = '',
) {
  const uid = await ensureSignedIn()
  await addDoc(commentsCol, {
    poemId,
    nickname: nickname.trim().slice(0, MAX_COMMENT_NICKNAME),
    content: content.trim().slice(0, MAX_COMMENT_CONTENT),
    authorUid: uid,
    createdAt: Date.now(),
    parentId,
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

// 원 댓글 하나와 거기 달린 답글들.
// comment가 null이면 원 댓글이 삭제된 자리(답글만 남은 경우)를 뜻한다.
export interface CommentNode {
  id: string
  comment: CommentDoc | null
  replies: CommentDoc[]
}

// 평평한 댓글 목록을 "원 댓글 + 답글" 2단 구조로 묶는다.
// 원 댓글은 최신순(목록에서 받은 순서), 답글은 대화 흐름대로 오래된 순.
// 원 댓글이 삭제됐는데 답글이 남아 있으면 자리표시자 노드를 만들어 답글을
// 잃어버리지 않게 한다 — 남의 답글은 대신 지울 수 없으므로 실제로 생기는 상황.
export function buildCommentTree(list: CommentDoc[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>()
  // 정렬 기준 시각. 자리표시자는 남은 답글 중 가장 최근 시각을 쓴다.
  const sortAt = new Map<string, number>()

  list.forEach((c) => {
    if (c.parentId) return
    nodes.set(c.id, { id: c.id, comment: c, replies: [] })
    sortAt.set(c.id, c.createdAt)
  })

  list.forEach((c) => {
    if (!c.parentId) return
    let node = nodes.get(c.parentId)
    if (!node) {
      node = { id: c.parentId, comment: null, replies: [] }
      nodes.set(c.parentId, node)
      sortAt.set(c.parentId, 0)
    }
    node.replies.push(c)
    if (!node.comment) {
      sortAt.set(c.parentId, Math.max(sortAt.get(c.parentId) ?? 0, c.createdAt))
    }
  })

  const result = [...nodes.values()]
  result.forEach((n) => n.replies.sort((a, b) => a.createdAt - b.createdAt))
  result.sort((a, b) => (sortAt.get(b.id) ?? 0) - (sortAt.get(a.id) ?? 0))
  return result
}
