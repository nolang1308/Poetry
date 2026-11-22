import { useMemo, useState } from 'react'
import {
  cumulativeSeries,
  dailySeries,
  monthlySeries,
  weeklySeries,
  DAILY_DAYS,
  MONTHLY_MONTHS,
  WEEKLY_WEEKS,
  type VisitData,
} from '../data/visitSeries'
import StatsChart from './StatsChart'
import './VisitDashboard.scss'

type ViewKey = 'daily' | 'weekly' | 'monthly' | 'total'

// 타일(= 보기 전환 버튼) 하나의 구성.
// caption은 타일의 큰 숫자가 가리키는 기간, range는 그래프가 보여 주는 기간이다.
const views: {
  key: ViewKey
  label: string
  caption: string
  title: string
  range: string
}[] = [
  {
    key: 'daily',
    label: '일간',
    caption: '오늘',
    title: '일간 방문자',
    range: `최근 ${DAILY_DAYS}일`,
  },
  {
    key: 'weekly',
    label: '주간',
    caption: '이번 주',
    title: '주간 방문자',
    range: `최근 ${WEEKLY_WEEKS}주 · 월요일부터 일요일까지`,
  },
  {
    key: 'monthly',
    label: '월간',
    caption: '이번 달',
    title: '월간 방문자',
    range: `최근 ${MONTHLY_MONTHS}개월`,
  },
  {
    key: 'total',
    label: '누적',
    caption: '전체',
    title: '누적 방문자',
    range: `그날까지 쌓인 방문자 수 · 최대 ${MONTHLY_MONTHS}개월`,
  },
]

const format = (n: number) => n.toLocaleString('ko-KR')

// 방문자 통계: 위쪽 타일 네 개(일간·주간·월간·누적)로 보기를 고르고,
// 아래 카드에 고른 보기의 그래프(또는 같은 내용의 표)를 보여 준다.
// data가 null이면 받아오는 중, today는 한국 시간 기준 오늘(YYYY-MM-DD).
function VisitDashboard({
  data,
  error,
  today,
}: {
  data: VisitData | null
  error: boolean
  today: string
}) {
  const [view, setView] = useState<ViewKey>('daily')
  const [asTable, setAsTable] = useState(false)

  const series = useMemo(
    () =>
      data
        ? {
            daily: dailySeries(data, today),
            weekly: weeklySeries(data, today),
            monthly: monthlySeries(data, today),
            total: cumulativeSeries(data, today),
          }
        : null,
    [data, today],
  )

  // 타일의 큰 숫자: 진행 중인 기간의 값(각 계열의 마지막 점), 누적은 전체 값
  const headline = (key: ViewKey) => {
    if (!data || !series) return '-'
    if (key === 'total') return format(data.total)
    return format(series[key][series[key].length - 1].value)
  }

  const current = views.find((v) => v.key === view)!
  const points = series ? series[view] : []
  const hasData = points.some((p) => p.value > 0)

  return (
    <div className="visit-dash">
      <div className="visit-dash__tiles" role="group" aria-label="통계 보기 선택">
        {views.map((v) => (
          <button
            key={v.key}
            type="button"
            className={
              'visit-dash__tile' + (v.key === view ? ' visit-dash__tile--on' : '')
            }
            aria-pressed={v.key === view}
            onClick={() => setView(v.key)}
          >
            <span className="visit-dash__tile-label">{v.label}</span>
            <span className="visit-dash__tile-value">{headline(v.key)}</span>
            <span className="visit-dash__tile-caption">{v.caption}</span>
          </button>
        ))}
      </div>

      <section className="visit-dash__card" aria-label={current.title}>
        <div className="visit-dash__head">
          <div>
            <h2 className="visit-dash__title">{current.title}</h2>
            <p className="visit-dash__range">{current.range}</p>
          </div>
          {hasData && (
            <button
              type="button"
              className="visit-dash__toggle"
              aria-pressed={asTable}
              onClick={() => setAsTable((v) => !v)}
            >
              {asTable ? '그래프로 보기' : '표로 보기'}
            </button>
          )}
        </div>

        {error ? (
          <p className="visit-dash__empty">방문자 수를 불러오지 못했습니다.</p>
        ) : !series ? (
          <p className="visit-dash__empty">통계를 불러오는 중…</p>
        ) : !hasData ? (
          <p className="visit-dash__empty">
            이 기간에는 아직 집계된 방문이 없습니다.
          </p>
        ) : asTable ? (
          // 그래프와 같은 내용을 숫자로 — 최근 것이 위로 오게 뒤집어 보여 준다
          <div className="visit-dash__table-wrap" tabIndex={0}>
            <table className="visit-dash__table">
              <thead>
                <tr>
                  <th scope="col">기간</th>
                  <th scope="col">방문자 수</th>
                </tr>
              </thead>
              <tbody>
                {[...points].reverse().map((p) => (
                  <tr key={p.key}>
                    <th scope="row">{p.title}</th>
                    <td>{format(p.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <StatsChart
            // 보기를 바꾸면 가리키던 위치를 버리고 새로 그린다
            key={view}
            kind={view === 'total' ? 'line' : 'bar'}
            points={points}
            label={`${current.title} 그래프, ${current.range}`}
          />
        )}
      </section>
    </div>
  )
}

export default VisitDashboard
