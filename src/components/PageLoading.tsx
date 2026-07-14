import { Loader } from './icons'
import './PageLoading.scss'

// 전체 화면 로딩 표시 ("페이지 구성 중…").
// 홈: 지정 프로필 사진이 준비되기 전까지 기본 사진이 스치는 것을 막기 위해 사용.
function PageLoading({ text = '페이지 구성 중…' }: { text?: string }) {
  return (
    <div className="page-loading">
      <Loader size={26} className="page-loading__spinner" />
      <span className="page-loading__text">{text}</span>
    </div>
  )
}

export default PageLoading
