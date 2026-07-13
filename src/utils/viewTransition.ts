import { flushSync } from 'react-dom'

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => unknown
}

// 상태 변경을 View Transition으로 감싸 DOM 변화(재정렬 등)를 부드럽게 애니메이션.
// 미지원 브라우저 / 모션 최소화 설정에서는 그냥 즉시 반영.
export function withViewTransition(update: () => void) {
  const doc = document as DocWithVT
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!doc.startViewTransition || reduce) {
    update()
    return
  }
  doc.startViewTransition(() => flushSync(update))
}
