import { useEffect, useRef, useState } from 'react'

// 잠깐 떴다 사라지는 토스트 메시지 상태
export function useToast(duration = 2200) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const show = (msg: string) => {
    setMessage(msg)
    setVisible(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(false), duration)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  return { message, visible, show }
}
