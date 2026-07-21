import { useEffect, useState } from 'react'
import { likePoem, likeNote } from '../data/poemsRepo'
import { isLiked, setLikedLocal, type LikeKind } from '../utils/likes'

// 시 본문 / 시인의 노트 좋아요 토글 (웹·모바일 상세가 공유).
// 누른 상태는 이 브라우저의 localStorage에, 카운트는 Firestore에 둔다.
// 화면은 먼저 바꾸고(낙관적), 서버 반영이 실패하면 되돌린다.
// disabled(미리보기)일 때는 아무 것도 하지 않는다.
export function useLike(poemId: string, kind: LikeKind, disabled = false) {
  const [liked, setLiked] = useState(() => isLiked(poemId, kind))

  useEffect(() => setLiked(isLiked(poemId, kind)), [poemId, kind])

  const toggle = () => {
    if (disabled) return
    const next = !liked
    setLiked(next)
    setLikedLocal(poemId, next, kind)
    const send = kind === 'note' ? likeNote : likePoem
    send(poemId, next).catch(() => {
      setLiked(!next)
      setLikedLocal(poemId, !next, kind)
    })
  }

  return { liked, toggle }
}
