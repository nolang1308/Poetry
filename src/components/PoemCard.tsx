import { Link, useViewTransitionState } from 'react-router-dom'
import { Heart } from './icons'
import type { PoemDoc } from '../data/poems'
import './PoemCard.scss'

function PoemCard({ id, title, likes, date, image }: PoemDoc) {
  const to = `/poems/${encodeURIComponent(title)}`
  // 상세로 전환 중이면 공유 이름(poem-cover)으로 morph,
  // 그 외에는 카드별 고유 이름으로 재정렬 시 부드럽게 이동(FLIP).
  const isTransitioning = useViewTransitionState(to)
  const vtName = isTransitioning ? 'poem-cover' : `poem-card-${id}`

  return (
    <Link to={to} viewTransition className="poem-card">
      <div
        className="poem-card__cover"
        style={{
          backgroundImage: `url(${image})`,
          viewTransitionName: vtName,
        }}
        role="img"
        aria-label={title}
      />
      <div className="poem-card__info">
        <p className="poem-card__title">{title}</p>
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
