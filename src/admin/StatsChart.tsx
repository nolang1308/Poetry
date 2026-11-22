import { useLayoutEffect, useRef, useState } from 'react'
import type { SeriesPoint } from '../data/visitSeries'
import './StatsChart.scss'

interface Props {
  // bar: 기간별 값을 막대로 / line: 쌓여 가는 값을 선과 옅은 면으로
  kind: 'bar' | 'line'
  points: SeriesPoint[]
  // 그래프가 보여 주는 것 (스크린 리더용 이름)
  label: string
}

// 그림 영역 바깥 여백(px). 위쪽은 값 이름표, 아래쪽은 x축 이름표 자리다.
const PAD_TOP = 26
const PAD_BOTTOM = 28
const PAD_RIGHT = 14
const MAX_BAR = 24

const format = (n: number) => n.toLocaleString('ko-KR')

// 글자 폭 어림값(12px 기준) — 한글은 넓고 숫자·기호는 좁다.
// 이름표가 서로 겹치지 않게 솎아 내는 데만 쓰므로 정확할 필요는 없다.
const textWidth = (s: string) =>
  [...s].reduce((w, ch) => w + (ch.charCodeAt(0) > 255 ? 12 : 7), 0)

// y축 눈금: 0부터 시작해 1·2·5 단위로 끊은 깔끔한 정수 4~5개
function niceScale(max: number): { top: number; ticks: number[] } {
  const raw = Math.max(max, 1) / 4
  const mag = 10 ** Math.floor(Math.log10(raw))
  const norm = raw / mag
  const step = Math.max(1, (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag)
  const top = Math.max(step, Math.ceil(max / step) * step)
  const ticks: number[] = []
  for (let v = 0; v <= top; v += step) ticks.push(v)
  return { top, ticks }
}

// 방문자 수 그래프. 화면 폭에 맞춰 다시 그리고(글자 크기는 그대로),
// 마우스·터치·좌우 화살표 키로 각 값의 말풍선을 볼 수 있다.
function StatsChart({ kind, points, label }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const [active, setActive] = useState<number | null>(null)

  useLayoutEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const n = points.length
  const height = width > 0 && width < 480 ? 240 : 300

  const max = points.reduce((m, p) => Math.max(m, p.value), 0)
  const { top, ticks } = niceScale(max)
  // 눈금 숫자는 10만 미만이면 그대로, 그 이상이면 만 단위로 줄여 쓴다
  const tickText = (v: number) =>
    top >= 100000 && v > 0 ? `${format(v / 10000)}만` : format(v)

  const left = Math.max(...ticks.map((t) => textWidth(tickText(t)))) + 10
  const plotW = Math.max(0, width - left - PAD_RIGHT)
  const plotH = height - PAD_TOP - PAD_BOTTOM
  const baseY = PAD_TOP + plotH
  const y = (v: number) => PAD_TOP + plotH * (1 - v / top)

  // 점 하나가 차지하는 가로 간격과 그 중심 x
  const gap = kind === 'bar' ? plotW / Math.max(n, 1) : plotW / Math.max(n - 1, 1)
  const cx = (i: number) =>
    kind === 'bar'
      ? left + gap * (i + 0.5)
      : n > 1
        ? left + gap * i
        : left + plotW / 2
  // 막대 굵기: 칸의 6할쯤만 채워 사이에 숨 쉴 틈을 두고(최대 24px),
  // 칸이 아주 좁을 때는 2px 틈만 남기고 채워 막대가 실처럼 가늘어지지 않게 한다
  const barW = Math.min(
    MAX_BAR,
    Math.max(1.5, gap * 0.62, Math.min(gap - 2, 8)),
  )

  // x축 이름표는 겹치지 않는 간격으로 솎되, 맨 끝(오늘·이번 주…)은 항상 남긴다
  // (이웃한 두 이름표의 중심 거리 ≥ 보통 이름표와 가장 긴 이름표의 평균 폭 + 여백)
  const widths = points.map((p) => textWidth(p.label)).sort((a, b) => a - b)
  const slot =
    n > 0 ? (widths[n - 1] + widths[Math.floor(n / 2)]) / 2 + 10 : 0
  const every = Math.max(1, Math.ceil(slot / Math.max(gap, 1)))
  const showLabel = (i: number) => (n - 1 - i) % every === 0

  // 글자가 그림 밖으로 잘려 나가지 않도록 가장자리에서는 정렬을 바꾼다
  const anchorAt = (x: number, text: string) => {
    const half = textWidth(text) / 2
    if (x + half > width) return { x: width, anchor: 'end' as const }
    if (x - half < 0) return { x: 0, anchor: 'start' as const }
    return { x, anchor: 'middle' as const }
  }

  // 값 이름표는 골라서만 붙인다: 막대는 가장 큰 값과 맨 끝 값, 선은 맨 끝 값.
  // (나머지 값은 축 눈금·말풍선·표로 읽는다)
  const valueLabels: number[] = []
  if (n > 0 && max > 0) {
    const last = n - 1
    if (kind === 'line') {
      valueLabels.push(last)
    } else {
      const peak = points.reduce((best, p, i) => (p.value >= points[best].value ? i : best), 0)
      valueLabels.push(peak)
      const room =
        (textWidth(format(points[peak].value)) + textWidth(format(points[last].value))) / 2 + 8
      if (last !== peak && points[last].value > 0 && cx(last) - cx(peak) >= room) {
        valueLabels.push(last)
      }
    }
  }

  const indexAt = (clientX: number, svg: SVGSVGElement) => {
    const x = clientX - svg.getBoundingClientRect().left - left
    const i = kind === 'bar' ? Math.floor(x / gap) : Math.round(x / gap)
    return Math.min(n - 1, Math.max(0, i))
  }

  const onPointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (n === 0 || plotW <= 0) return
    setActive(indexAt(e.clientX, e.currentTarget))
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (n === 0) return
    const cur = active ?? n - 1
    let next: number | null = null
    if (e.key === 'ArrowLeft') next = active === null ? n - 1 : Math.max(0, cur - 1)
    else if (e.key === 'ArrowRight') next = active === null ? n - 1 : Math.min(n - 1, cur + 1)
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = n - 1
    else if (e.key === 'Escape') {
      setActive(null)
      return
    }
    if (next === null) return
    e.preventDefault()
    setActive(next)
  }

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${cx(i).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(' ')

  const activePoint = active !== null ? points[active] : null

  return (
    <div
      ref={wrapRef}
      className="stats-chart"
      style={{ height }}
      role="group"
      aria-roledescription="그래프"
      aria-label={`${label}. 좌우 화살표 키로 값을 하나씩 볼 수 있습니다.`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
    >
      {width > 0 && (
        <svg
          className="stats-chart__svg"
          width={width}
          height={height}
          aria-hidden="true"
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          // 터치는 손을 떼도 말풍선을 남겨 두고, 마우스는 벗어나면 지운다
          onPointerLeave={(e) => {
            if (e.pointerType === 'mouse') setActive(null)
          }}
        >
          {/* 가로 눈금선과 y축 숫자 */}
          {ticks.map((t) => {
            const ty = Math.round(y(t)) + 0.5
            return (
              <g key={t}>
                <line
                  className={
                    'stats-chart__grid' + (t === 0 ? ' stats-chart__grid--base' : '')
                  }
                  x1={left}
                  x2={width}
                  y1={ty}
                  y2={ty}
                />
                <text
                  className="stats-chart__tick"
                  x={left - 8}
                  y={ty}
                  textAnchor="end"
                  dominantBaseline="middle"
                >
                  {tickText(t)}
                </text>
              </g>
            )
          })}

          {kind === 'bar' ? (
            <>
              {/* 가리킨 칸 전체를 옅게 깔아 어느 막대인지 보여 준다 */}
              {active !== null && (
                <rect
                  className="stats-chart__band"
                  x={left + gap * active}
                  y={PAD_TOP}
                  width={gap}
                  height={plotH}
                />
              )}
              {points.map((p, i) => {
                if (p.value <= 0) return null
                // 아주 작은 값도 보이도록 최소 높이를 준다
                const h = Math.max(2, baseY - y(p.value))
                const x = cx(i) - barW / 2
                const r = Math.min(4, barW / 2, h)
                const t = baseY - h
                // 위쪽만 둥글리고 바닥은 기준선에 반듯하게 붙인다
                const d =
                  `M${x},${baseY} V${t + r} Q${x},${t} ${x + r},${t} ` +
                  `H${x + barW - r} Q${x + barW},${t} ${x + barW},${t + r} V${baseY} Z`
                return (
                  <path
                    key={p.key}
                    className={
                      'stats-chart__bar' +
                      (i === active ? ' stats-chart__bar--active' : '')
                    }
                    d={d}
                  />
                )
              })}
            </>
          ) : (
            n > 0 && (
              <>
                <path
                  className="stats-chart__area"
                  d={`${linePath} L${cx(n - 1).toFixed(1)},${baseY} L${cx(0).toFixed(1)},${baseY} Z`}
                />
                <path className="stats-chart__line" d={linePath} />
                {active !== null && (
                  <line
                    className="stats-chart__cross"
                    x1={Math.round(cx(active)) + 0.5}
                    x2={Math.round(cx(active)) + 0.5}
                    y1={PAD_TOP}
                    y2={baseY}
                  />
                )}
                {/* 끝점(오늘)과 가리킨 점에만 표시를 둔다 */}
                {[...new Set([n - 1, ...(active !== null ? [active] : [])])].map((i) => (
                  <circle
                    key={i}
                    className="stats-chart__dot"
                    cx={cx(i)}
                    cy={y(points[i].value)}
                    r={4.5}
                  />
                ))}
              </>
            )
          )}

          {/* 골라 붙인 값 이름표 (가리키고 있는 점은 말풍선이 대신한다) */}
          {valueLabels.map((i) => {
            if (i === active) return null
            const text = format(points[i].value)
            if (kind === 'line') {
              return (
                <text
                  key={i}
                  className="stats-chart__value"
                  x={cx(i) + 4}
                  y={y(points[i].value) - 11}
                  textAnchor="end"
                >
                  {text}
                </text>
              )
            }
            const pos = anchorAt(cx(i), text)
            return (
              <text
                key={i}
                className="stats-chart__value"
                x={pos.x}
                y={Math.min(y(points[i].value), baseY - 2) - 6}
                textAnchor={pos.anchor}
              >
                {text}
              </text>
            )
          })}

          {/* x축 이름표 */}
          {points.map((p, i) => {
            if (!showLabel(i)) return null
            const pos = anchorAt(cx(i), p.label)
            return (
              <text
                key={p.key}
                className={
                  'stats-chart__tick' +
                  (i === n - 1 ? ' stats-chart__tick--now' : '')
                }
                x={pos.x}
                y={baseY + 18}
                textAnchor={pos.anchor}
              >
                {p.label}
              </text>
            )
          })}
        </svg>
      )}

      {/* 말풍선: 값을 크게, 기간을 그 아래에 */}
      <div
        className="stats-chart__tip"
        role="status"
        hidden={!activePoint}
        style={
          activePoint && active !== null
            ? {
                left: Math.min(Math.max(cx(active), 66), Math.max(66, width - 66)),
                top: y(activePoint.value) - 12,
              }
            : undefined
        }
      >
        {activePoint && (
          <>
            <strong className="stats-chart__tip-value">
              {format(activePoint.value)}명
            </strong>
            <span className="stats-chart__tip-label">{activePoint.title}</span>
          </>
        )}
      </div>
    </div>
  )
}

export default StatsChart
