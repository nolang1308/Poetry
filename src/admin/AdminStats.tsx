import { usePoems } from '../hooks/usePoems'
import { usePoemViews } from '../hooks/usePoemViews'
import { useVisits } from '../hooks/useVisits'
import { historyStart } from '../data/visitSeries'
import { kstDay } from '../utils/visit'
import AdminTopBar from './AdminTopBar'
import PoemViewsRanking from './PoemViewsRanking'
import VisitDashboard from './VisitDashboard'
import './AdminStats.scss'

// 관리자 통계 탭: 사이트 방문자 수(일간·주간·월간·누적)와 시별 조회수
function AdminStats() {
  const today = kstDay()
  // 가장 긴 보기(월간 12개월)에 필요한 날짜부터 한 번에 읽어 온다
  const { data, error } = useVisits(historyStart(today))
  const { poems, loading: poemsLoading } = usePoems()
  const poemViews = usePoemViews()

  return (
    <div className="admin-stats">
      <AdminTopBar active="stats" />

      <div className="admin-stats__container">
        <h1 className="admin-stats__title">통계</h1>
        <p className="admin-stats__sub">
          사이트 방문자 수와 시별 조회수입니다. 같은 기기는 하루에 한 번만
          세고, 날짜는 한국 시간 기준입니다.
        </p>

        <VisitDashboard data={data} error={error} today={today} />

        <PoemViewsRanking
          poems={poems}
          loading={poemsLoading}
          views={poemViews.views}
          error={poemViews.error}
        />
      </div>
    </div>
  )
}

export default AdminStats
