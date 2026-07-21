import { Navigate, useParams } from 'react-router-dom'
import WebPoems from '../components/WebPoems'
import MobilePoems from '../components/MobilePoems'
import { useBooks } from '../hooks/useBooks'
import { usePoems } from '../hooks/usePoems'
import { buildPoemNumbers, sortByRegistrationAsc } from '../data/poemNumbers'

// 시집 상세: 해당 시집에 담긴 시들만 기존 시 목록 화면 그대로 보여준다
function BookPoems() {
  const { id } = useParams()
  const { books, loading: booksLoading } = useBooks()
  const { poems, loading: poemsLoading } = usePoems()
  const loading = booksLoading || poemsLoading

  const book = books.find((b) => b.id === id)
  if (!loading && !book) return <Navigate to="/books" replace />

  // 기본 표시는 등록순 오름차순: 먼저 등록한 시가 앞, 최신 시가 마지막
  const idSet = new Set(book?.poemIds ?? [])
  const bookPoems = sortByRegistrationAsc(poems).filter((p) => idSet.has(p.id))
  const numbers = buildPoemNumbers(books, poems)

  const name = book?.name ?? '시집'

  return (
    <>
      <WebPoems
        poems={bookPoems}
        loading={loading}
        heading={name}
        sub={`시집 「${name}」에 담긴 ${bookPoems.length}편의 시입니다.`}
        navActive="books"
        initialSort="all"
        numbers={numbers}
        showUnreadFilter
      />
      <MobilePoems
        poems={bookPoems}
        loading={loading}
        heading={name}
        backTo="/books"
        initialSort="all"
        numbers={numbers}
        showUnreadFilter
      />
    </>
  )
}

export default BookPoems
