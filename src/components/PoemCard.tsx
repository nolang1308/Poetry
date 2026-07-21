import { Link, useViewTransitionState } from 'react-router-dom'
import { Heart } from './icons'
import { useFitText } from '../hooks/useFitText'
import { isRecentlyAdded, type PoemDoc } from '../data/poems'
import { isSeen } from '../utils/seen'
import './PoemCard.scss'

// num: "시집번호-시번호" 번호표 (예: 1-3). 시집에 담긴 시에만 있다.
// compact: 3열처럼 칸이 좁을 때 글자를 한 단계 줄여 쓴다.
function PoemCard({
  id,
  title,
  likes,
  date,
  image,
  createdAt,
  num,
  compact = false,
}: PoemDoc & { num?: string; compact?: boolean }) {
  const to = `/poems/${encodeURIComponent(title)}`
  // 최근 등록됐고 이 브라우저에서 아직 열어 보지 않은 시에만 NEW를 붙인다
  const isNew = isRecentlyAdded(createdAt) && !isSeen(id)
  // 상세로 전환 중이면 공유 이름(poem-cover)으로 morph,
  // 그 외에는 카드별 고유 이름으로 재정렬 시 부드럽게 이동(FLIP).
  const isTransitioning = useViewTransitionState(to)
  const vtName = isTransitioning ? 'poem-cover' : `poem-card-${id}`
  const shownTitle = num ? `${num}. ${title}` : title
  // 제목이 길어 두 줄이 되면 한 줄에 맞게 폰트를 줄인다.
  // 좁은 칸(compact)에서는 시작 크기와 하한을 함께 낮춘다.
  const { ref: titleRef, size: titleSize } = useFitText<HTMLParagraphElement>(
    shownTitle,
    compact ? 13 : 19,
    compact ? 10 : 13,
  )

  return (
    <Link
      to={to}
      viewTransition
      className={'poem-card' + (compact ? ' poem-card--compact' : '')}
    >
      <img
        className="poem-card__cover"
        src={image}
        alt={title}
        style={{ viewTransitionName: vtName }}
      />
      {isNew && <span className="poem-card__new">NEW</span>}
      <div className="poem-card__info">
        <div className="poem-card__title-box">
          <p
            className="poem-card__title"
            ref={titleRef}
            style={{ fontSize: `${titleSize}px` }}
          >
            {shownTitle}
          </p>
        </div>
        <p className="poem-card__poet">권일원</p>
        <div className="poem-card__meta">
          <span className="poem-card__likes">
            <Heart size={13} className="poem-card__heart" />
            <span className="poem-card__like-count">{likes}</span>
          </span>
          <span className="poem-card__dot">·</span>
          <span className="poem-card__date">{date}</span>
        </div>
      </div>
    </Link>
  )
}

export default PoemCard
