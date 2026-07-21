// 브라우저별 좋아요 상태(중복 좋아요 방지)를 localStorage에 기억.
// 시 본문과 시인의 노트는 따로 누를 수 있어 저장 키를 나눈다.
export type LikeKind = 'poem' | 'note'

const KEYS: Record<LikeKind, string> = {
  poem: 'liked-poems',
  note: 'liked-poem-notes',
}

function read(kind: LikeKind): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEYS[kind]) || '[]'))
  } catch {
    return new Set()
  }
}

export function isLiked(id: string, kind: LikeKind = 'poem'): boolean {
  return read(kind).has(id)
}

export function setLikedLocal(
  id: string,
  liked: boolean,
  kind: LikeKind = 'poem',
) {
  const s = read(kind)
  if (liked) s.add(id)
  else s.delete(id)
  localStorage.setItem(KEYS[kind], JSON.stringify([...s]))
}
