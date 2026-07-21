// 이 브라우저에서 한 번이라도 열어 본 시의 id를 localStorage에 기억.
// 새로 올라온 시에 붙는 NEW 배지를, 읽고 나면 떼기 위해 쓴다.
const KEY = 'seen-poems'

// 목록에서 카드마다 조회하므로 한 번만 읽어 캐시한다.
// (markSeen이 캐시도 함께 갱신하므로 상세를 보고 목록으로 돌아오면 바로 반영된다)
let cache: Set<string> | null = null

function read(): Set<string> {
  if (cache) return cache
  try {
    cache = new Set(JSON.parse(localStorage.getItem(KEY) || '[]'))
  } catch {
    cache = new Set()
  }
  return cache
}

export function isSeen(id: string): boolean {
  return read().has(id)
}

export function markSeen(id: string) {
  const s = read()
  if (s.has(id)) return
  s.add(id)
  try {
    localStorage.setItem(KEY, JSON.stringify([...s]))
  } catch {
    // 저장 실패(사생활 보호 모드 등)는 무시 — 이번 세션 동안만 기억된다
  }
}
