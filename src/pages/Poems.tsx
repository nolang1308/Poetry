import { useMemo } from 'react'
import WebPoems from '../components/WebPoems'
import MobilePoems from '../components/MobilePoems'
import { usePoems } from '../hooks/usePoems'
import { useBooks } from '../hooks/useBooks'
import { buildPoemNumbers, sortByRegistrationAsc } from '../data/poemNumbers'

function Poems() {
  const { poems, loading } = usePoems()
  const { books } = useBooks()
  // 시집에 담긴 시는 제목 앞에 "시집번호-시번호"를 단다
  const numbers = useMemo(() => buildPoemNumbers(books, poems), [books, poems])
  // 기본 표시는 등록순 오름차순: 먼저 등록한 시가 앞, 최신 시가 마지막
  const ordered = useMemo(() => sortByRegistrationAsc(poems), [poems])

  return (
    <>
      <WebPoems
        poems={ordered}
        loading={loading}
        numbers={numbers}
        initialSort="all"
        showUnreadFilter
      />
      <MobilePoems
        poems={ordered}
        loading={loading}
        numbers={numbers}
        initialSort="all"
        showUnreadFilter
      />
    </>
  )
}

export default Poems
