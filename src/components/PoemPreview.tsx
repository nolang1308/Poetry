import { useEffect } from 'react'
import WebPoemDetail from './WebPoemDetail'
import MobilePoemDetail from './MobilePoemDetail'
import { X } from './icons'
import type { Poem, PoemDoc, PoemContext } from '../data/poems'
import './PoemPreview.scss'

// 흐르는 띠에 반복될 "미리보기입니다." 문구 (한 그룹 분량)
const marqueeWords = () =>
  Array.from({ length: 14 }, (_, i) => (
    <span key={i} className="poem-preview__word">
      미리보기입니다.
    </span>
  ))

// 작성/수정 중인 폼 값을 실제 시 상세 페이지 그대로 렌더해 보여주는 전체화면 미리보기.
// 저장 전이라 임시 id를 부여하고, 이전/다음 시는 자기 자신으로 채운다.
function PoemPreview({ poem: form, onClose }: { poem: Poem; onClose: () => void }) {
  const poem: PoemDoc = {
    ...form,
    id: 'preview',
    title: form.title || '제목 없음',
    noteLikes: '0', // 노트 좋아요는 저장 후에 쌓인다
  }
  const ctx: PoemContext = { poem, prev: poem, next: poem }

  // 미리보기가 열려 있는 동안 배경 스크롤 잠금 + ESC로 닫기
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div className="poem-preview" role="dialog" aria-modal="true">
      {/* 최상단 고정 헤더: 배너(배지·닫기) + 그 아래 흐르는 띠 */}
      <div className="poem-preview__header">
        <div className="poem-preview__bar">
          <span className="poem-preview__badge">미리보기</span>
          <button
            type="button"
            className="poem-preview__close"
            onClick={onClose}
          >
            <X size={17} />
            닫기
          </button>
        </div>

        {/* 위: 오른쪽 → 왼쪽으로 흐름 */}
        <div
          className="poem-preview__marquee poem-preview__marquee--top"
          aria-hidden="true"
        >
          <div className="poem-preview__track poem-preview__track--left">
            <div className="poem-preview__group">{marqueeWords()}</div>
            <div className="poem-preview__group">{marqueeWords()}</div>
          </div>
        </div>
      </div>

      <div className="poem-preview__stage">
        <WebPoemDetail ctx={ctx} preview />
        <MobilePoemDetail ctx={ctx} preview />
      </div>

      {/* 아래: 왼쪽 → 오른쪽으로 흐름 */}
      <div
        className="poem-preview__marquee poem-preview__marquee--bottom"
        aria-hidden="true"
      >
        <div className="poem-preview__track poem-preview__track--right">
          <div className="poem-preview__group">{marqueeWords()}</div>
          <div className="poem-preview__group">{marqueeWords()}</div>
        </div>
      </div>
    </div>
  )
}

export default PoemPreview
