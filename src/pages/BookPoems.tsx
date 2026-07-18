import { Navigate, useParams } from 'react-router-dom'
import WebPoems from '../components/WebPoems'
import MobilePoems from '../components/MobilePoems'
import { useBooks } from '../hooks/useBooks'
import { usePoems } from '../hooks/usePoems'
import type { PoemDoc } from '../data/poems'

// 시집 상세: 해당 시집에 담긴 시들만 기존 시 목록 화면 그대로 보여준다
function BookPoems() {
  const { id } = useParams()
  const { books, loading: booksLoading } = useBooks()
  const { poems, loading: poemsLoading } = usePoems()
  const loading = booksLoading || poemsLoading

  const book = books.find((b) => b.id === id)
  if (!loading && !book) return <Navigate to="/books" replace />

  // 시집에 담긴 순서 그대로, 삭제된 시는 건너뛴다
  const poemById = new Map(poems.map((p) => [p.id, p]))
  const bookPoems = (book?.poemIds ?? [])
    .map((poemId) => poemById.get(poemId))
    .filter((p): p is PoemDoc => Boolean(p))

  const name = book?.name ?? '시집'

  return (
    <>
      <WebPoems
        poems={bookPoems}
        loading={loading}
        heading={name}
        sub={`시집 「${name}」에 담긴 ${bookPoems.length}편의 시입니다.`}
        navActive="books"
      />
      <MobilePoems
        poems={bookPoems}
        loading={loading}
        heading={name}
        backTo="/books"
      />
    </>
  )
}

export default BookPoems
