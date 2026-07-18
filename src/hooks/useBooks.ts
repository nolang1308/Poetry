import { useEffect, useState } from 'react'
import { subscribeBooksStore, getBooksCache } from '../data/booksRepo'
import type { BookDoc } from '../data/booksRepo'

// Firestore의 시집 목록을 전역 캐시 기반으로 구독하는 공용 훅 (usePoems와 동일 패턴)
export function useBooks() {
  const [books, setBooks] = useState<BookDoc[]>(() => getBooksCache() ?? [])
  const [loading, setLoading] = useState(() => getBooksCache() === null)

  useEffect(() => {
    return subscribeBooksStore((list) => {
      setBooks(list)
      setLoading(false)
    })
  }, [])

  return { books, loading }
}
