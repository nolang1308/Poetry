import { useMemo, useState } from 'react'
import type { PoemDoc } from '../data/poems'
import './PoemViewsRanking.scss'

// 처음에 보여 주는 편수 (나머지는 "전체 보기"로 펼친다)
const TOP = 10

const format = (n: number) => n.toLocaleString('ko-KR')

// 시별 조회수 순위. 조회수가 많은 시부터 한 줄에 하나씩,
// 제목 · 막대(가장 많이 읽힌 시 대비 길이) · 숫자를 나란히 보여 준다.
// views가 null이면 받아오는 중. 한 번도 열리지 않은 시는 0으로 센다.
function PoemViewsRanking({
  poems,
  loading,
  views,
  error,
}: {
  poems: PoemDoc[]
  loading: boolean
  views: Map<string, number> | null
  error: boolean
}) {
  const [showAll, setShowAll] = useState(false)

  const ranked = useMemo(() => {
    if (!views) return []
    // poems는 최신 등록순이라 뒤집어 둔다 → 조회수가 같으면 먼저 등록한 시가 위
    // (sort는 순서를 보존하는 정렬이다)
    return [...poems]
      .reverse()
      .map((p) => ({ id: p.id, title: p.title, count: views.get(p.id) ?? 0 }))
      .sort((a, b) => b.count - a.count)
  }, [poems, views])

  const total = ranked.reduce((sum, r) => sum + r.count, 0)
  const max = ranked[0]?.count ?? 0
  const shown = showAll ? ranked : ranked.slice(0, TOP)
  const ready = !error && !loading && views !== null

  return (
    <section className="poem-views" aria-label="시별 조회수">
      <div className="poem-views__head">
        <div>
          <h2 className="poem-views__title">시별 조회수</h2>
          <p className="poem-views__sub">
            많이 읽힌 순 · 같은 기기에서 같은 시는 하루에 한 번만 셉니다
          </p>
        </div>
        {ready && total > 0 && (
          <p className="poem-views__total">
            전체 <strong>{format(total)}</strong>회
          </p>
        )}
      </div>

      {error ? (
        <p className="poem-views__empty">조회수를 불러오지 못했습니다.</p>
      ) : !ready ? (
        <p className="poem-views__empty">조회수를 불러오는 중…</p>
      ) : ranked.length === 0 ? (
        <p className="poem-views__empty">등록된 시가 없습니다.</p>
      ) : total === 0 ? (
        <p className="poem-views__empty">아직 집계된 조회가 없습니다.</p>
      ) : (
        <>
          <ol className="poem-views__list">
            {shown.map((r, i) => (
              <li key={r.id} className="poem-views__row">
                <span className="poem-views__rank">{i + 1}</span>
                <span className="poem-views__name">{r.title}</span>
                <span className="poem-views__track" aria-hidden="true">
                  {r.count > 0 && (
                    <span
                      className="poem-views__bar"
                      style={{ width: `${(r.count / max) * 100}%` }}
                    />
                  )}
                </span>
                <span className="poem-views__count">{format(r.count)}</span>
              </li>
            ))}
          </ol>

          {ranked.length > TOP && (
            <button
              type="button"
              className="poem-views__more"
              aria-expanded={showAll}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? '접기' : `전체 ${ranked.length}편 보기`}
            </button>
          )}
        </>
      )}
    </section>
  )
}

export default PoemViewsRanking
