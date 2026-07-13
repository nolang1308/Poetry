import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import WebPoemDetail from '../components/WebPoemDetail'
import MobilePoemDetail from '../components/MobilePoemDetail'
import { getPoemContext } from '../data/poems'
import { usePoems } from '../hooks/usePoems'

function PoemDetail() {
  const { title } = useParams()
  const { poems, loading } = usePoems()
  const ctx = getPoemContext(poems, decodeURIComponent(title ?? ''))

  // 시가 바뀌면 맨 위로 스크롤
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [title])

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
