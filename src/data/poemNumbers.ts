import type { BookDoc } from './booksRepo'
import type { PoemDoc } from './poems'

// 시 번호표: "시집번호-시번호" (예: 1-3).
// 시집 번호는 먼저 만든 시집이 1번, 시 번호는 그 시집 안에서
// 먼저 등록한 시가 1번이다. 시집에 담기지 않은 시는 번호가 없다.
export function buildPoemNumbers(
  books: BookDoc[],
  poems: PoemDoc[],
): Map<string, string> {
  // poems는 최신 등록순(내림차순) → 등록 오름차순 순번을 계산
  const regOrder = new Map<string, number>()
  poems.forEach((p, i) => regOrder.set(p.id, poems.length - i))

  const map = new Map<string, string>()
  // books도 최신순(내림차순) → 뒤에서부터가 1번 시집
  books.forEach((book, bi) => {
    const bookNo = books.length - bi
    const ids = book.poemIds
      .filter((id) => regOrder.has(id)) // 삭제된 시 제외
      .sort((a, b) => regOrder.get(a)! - regOrder.get(b)!)
    ids.forEach((id, i) => map.set(id, `${bookNo}-${i + 1}`))
  })
  return map
}

// 등록 오름차순(먼저 등록한 시가 앞) 정렬본을 반환
export function sortByRegistrationAsc(poems: PoemDoc[]): PoemDoc[] {
  // poems가 이미 등록 내림차순이므로 뒤집기만 하면 된다
  return [...poems].reverse()
}
