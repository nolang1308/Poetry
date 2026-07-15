import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react'

// 입력 내용에 따라 높이가 자동으로 늘어나는 textarea.
// 값이 바뀔 때마다 height를 초기화한 뒤 scrollHeight로 맞춘다.
// (box-sizing: border-box 전역 적용 상태라 padding 포함해 정확히 계산됨)
function AutoTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null)

  const resize = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  // 값 변경 시(외부 상태 반영 포함) 및 최초 렌더 시 높이 재계산
  useLayoutEffect(resize, [props.value])

  return <textarea {...props} ref={ref} />
}

export default AutoTextarea
