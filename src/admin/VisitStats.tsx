import { Link } from 'react-router-dom'
import { recentSummary, type VisitData } from '../data/visitSeries'
import { kstDay } from '../utils/visit'
import './VisitStats.scss'

const items: { label: string; key: keyof ReturnType<typeof recentSummary> }[] = [
  { label: '오늘', key: 'today' },
  { label: '어제', key: 'yesterday' },
  { label: '최근 7일', key: 'week' },
  { label: '누적', key: 'total' },
]

// 관리자 홈 상단의 방문자 수 요약. 자세한 추이는 통계 탭에서 본다.
// data가 아직 없으면(받아오는 중) 숫자 자리에 줄표를 보여 준다.
function VisitStats({ data, error }: { data: VisitData | null; error: boolean }) {
  const summary = data ? recentSummary(data, kstDay()) : null

  return (
    <section className="visit-stats" aria-label="방문자 수">
      <div className="visit-stats__head">
        <h2 className="visit-stats__title">방문자</h2>
        <Link to="/admin/stats" className="visit-stats__more">
          통계 자세히 보기 →
        </Link>
      </div>

      {error ? (
        <p className="visit-stats__error">방문자 수를 불러오지 못했습니다.</p>
      ) : (
        <dl className="visit-stats__grid">
          {items.map((item) => (
            <div key={item.key} className="visit-stats__item">
              <dt className="visit-stats__label">{item.label}</dt>
              <dd className="visit-stats__value">
                {summary ? summary[item.key].toLocaleString('ko-KR') : '-'}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

export default VisitStats
