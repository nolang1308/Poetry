import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import WebPoemDetail from '../components/WebPoemDetail'
import MobilePoemDetail from '../components/MobilePoemDetail'
import { getPoemContext } from '../data/poems'
import { usePoems } from '../hooks/usePoems'
import { viewPoem } from '../data/poemsRepo'
import { isSeen, markSeen } from '../utils/seen'

function PoemDetail() {
  const { title } = useParams()
  const { poems, loading } = usePoems()
  const ctx = getPoemContext(poems, decodeURIComponent(title ?? ''))

  // 시가 바뀌면 맨 위로 스크롤
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [title])

  // 한 번 열어 본 시는 기억해 둔다 → 목록의 NEW 배지가 떨어진다.
  // 처음 여는 시라면 조회수도 함께 올린다(같은 사람이 다시 열면 세지 않는다).
  const poemId = ctx?.poem.id
  useEffect(() => {
    if (!poemId) return
    if (!isSeen(poemId)) viewPoem(poemId).catch(() => {})
    markSeen(poemId)
  }, [poemId])

  if (loading) {
    return <div className="poem-detail-loading">시를 불러오는 중…</div>
  }

  if (!ctx) {
    return <div className="poem-detail-loading">시를 찾을 수 없습니다.</div>
  }

  return (
    <>
      <WebPoemDetail ctx={ctx} />
      <MobilePoemDetail ctx={ctx} />
    </>
  )
}

export default PoemDetail
