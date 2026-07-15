import { useLayoutEffect, useRef, useState } from 'react'

// 제목이 한 줄에 들어올 때까지 폰트 크기를 단계적으로 줄이는 훅.
// - CSS만으로는 "글자 수/폭"을 알 수 없어, 실제 렌더 높이를 측정한다.
// - 카드 폭은 반응형이라 부모 요소를 ResizeObserver로 관측해 재측정한다.
//   (제목 자신이 아니라 폭이 카드에 고정된 부모를 관측 → 폰트 변경으로 인한
//    무한 루프 없음)
// - min에서도 한 줄에 안 들어오면 그대로 두 줄로 다 보여 준다(제목 잘림 없음).
export function useFitText<T extends HTMLElement>(
  text: string,
  max = 19,
  min = 13,
  step = 0.5,
) {
  const ref = useRef<T>(null)
  const [size, setSize] = useState(max)

  useLayoutEffect(() => {
    const el = ref.current
    const parent = el?.parentElement
    if (!el || !parent) return

    const measure = () => {
      let s = max
      el.style.fontSize = `${s}px`
      const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || s * 1.4
      // 한 줄 높이의 1.5배를 넘으면 두 줄로 넘친 것 → 폰트를 줄인다
      while (s > min && el.scrollHeight > lineHeight * 1.5) {
        s -= step
        el.style.fontSize = `${s}px`
      }
      setSize(s)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(parent)
    return () => ro.disconnect()
  }, [text, max, min, step])

  return { ref, size }
}
