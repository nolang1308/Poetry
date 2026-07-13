import './Toast.scss'

interface ToastProps {
  message: string
  visible: boolean
}

// 화면 하단 중앙에 떠오르는 플로팅 바
function Toast({ message, visible }: ToastProps) {
  return (
    <div
      className={'toast' + (visible ? ' toast--show' : '')}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  )
}

export default Toast
