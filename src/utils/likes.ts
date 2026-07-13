// 브라우저별 좋아요 상태(중복 좋아요 방지)를 localStorage에 기억
const KEY = 'liked-poems'

function read(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(KEY) || '[]'))
  } catch {
    return new Set()
  }
}

export function isLiked(id: string): boolean {
  return read().has(id)
}

export function setLikedLocal(id: string, liked: boolean) {
  const s = read()
  if (liked) s.add(id)
  else s.delete(id)
  localStorage.setItem(KEY, JSON.stringify([...s]))
}
