// 날짜별 방문 수를 그래프용 계열(일간·주간·월간·누적)로 가공하는 순수 함수 모음.
// 날짜 키는 모두 한국 시간 기준 'YYYY-MM-DD' 문자열이다 (utils/visit 의 kstDay).
// 키 자체가 이미 한국 날짜이므로 계산할 때는 시간대 없는 달력 날짜로만 다룬다.

// 구독으로 받아 온 원본: 누적 값 + 조회 구간 안의 날짜별 값
export interface VisitData {
  total: number
  days: Map<string, number>
}

// 그래프의 점(막대) 하나
export interface SeriesPoint {
  key: string
  // x축에 쓰는 짧은 이름
  label: string
  // 말풍선·표에 쓰는 온전한 이름
  title: string
  value: number
}

// 그래프 한 장에 보여 주는 기간 (오늘·이번 주·이번 달 포함)
export const DAILY_DAYS = 7
export const WEEKLY_WEEKS = 5
export const MONTHLY_MONTHS = 12

const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAYS = '일월화수목금토'

const toDate = (key: string) => new Date(`${key}T00:00:00Z`)
const toKey = (d: Date) => d.toISOString().slice(0, 10)

export function addDays(key: string, n: number): string {
  return toKey(new Date(toDate(key).getTime() + n * DAY_MS))
}

// 그 날이 속한 주의 월요일
function mondayOf(key: string): string {
  return addDays(key, -((toDate(key).getUTCDay() + 6) % 7))
}

// 그 날이 속한 달에서 monthsAgo 달 전의 1일
function monthStart(key: string, monthsAgo = 0): string {
  const d = toDate(key)
  return toKey(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - monthsAgo, 1)))
}

// 그래프들이 필요로 하는 가장 이른 날짜 — 이 날부터 오늘까지만 읽어 오면 된다.
// (월간 12개월이 가장 길다. 주간 5주·일간 7일은 그 안에 들어온다)
export function historyStart(today: string): string {
  return monthStart(today, MONTHLY_MONTHS - 1)
}

// 11.22
const shortDate = (key: string) =>
  `${Number(key.slice(5, 7))}.${Number(key.slice(8, 10))}`
// 2026.11.22 (일)
const fullDate = (key: string) =>
  `${key.slice(0, 4)}.${shortDate(key)} (${WEEKDAYS[toDate(key).getUTCDay()]})`

const sumRange = (days: Map<string, number>, from: string, count: number) => {
  let sum = 0
  for (let i = 0; i < count; i++) sum += days.get(addDays(from, i)) ?? 0
  return sum
}

// 일간: 최근 7일, 하루에 막대 하나
export function dailySeries(data: VisitData, today: string): SeriesPoint[] {
  const points: SeriesPoint[] = []
  for (let i = DAILY_DAYS - 1; i >= 0; i--) {
    const key = addDays(today, -i)
    points.push({
      key,
      label: i === 0 ? '오늘' : shortDate(key),
      title: fullDate(key),
      value: data.days.get(key) ?? 0,
    })
  }
  return points
}

// 주간: 최근 5주, 한 주(월~일)에 막대 하나. 마지막 막대는 진행 중인 이번 주.
export function weeklySeries(data: VisitData, today: string): SeriesPoint[] {
  const thisMonday = mondayOf(today)
  const points: SeriesPoint[] = []
  for (let i = WEEKLY_WEEKS - 1; i >= 0; i--) {
    const start = addDays(thisMonday, -7 * i)
    points.push({
      key: start,
      label: i === 0 ? '이번 주' : shortDate(start),
      title: `${start.slice(0, 4)}.${shortDate(start)} ~ ${shortDate(addDays(start, 6))}`,
      value: sumRange(data.days, start, 7),
    })
  }
  return points
}

// 월간: 최근 12개월, 한 달에 막대 하나. 마지막 막대는 진행 중인 이번 달.
export function monthlySeries(data: VisitData, today: string): SeriesPoint[] {
  const byMonth = new Map<string, number>()
  data.days.forEach((n, key) => {
    const month = key.slice(0, 7)
    byMonth.set(month, (byMonth.get(month) ?? 0) + n)
  })

  const points: SeriesPoint[] = []
  for (let i = MONTHLY_MONTHS - 1; i >= 0; i--) {
    const month = monthStart(today, i).slice(0, 7)
    const m = Number(month.slice(5, 7))
    points.push({
      key: month,
      label: i === 0 ? '이번 달' : `${m}월`,
      title: `${month.slice(0, 4)}년 ${m}월`,
      value: byMonth.get(month) ?? 0,
    })
  }
  return points
}

// 누적: 그날까지 쌓인 전체 방문 수의 추이 (하루에 점 하나).
// 누적 문서의 값에서 거꾸로 계산하므로, 조회 구간보다 오래된 방문도
// 출발점(구간 첫날 이전에 이미 쌓여 있던 값)에 빠짐없이 들어간다.
// 집계된 방문이 하나도 없으면 빈 배열을 돌려준다.
export function cumulativeSeries(data: VisitData, today: string): SeriesPoint[] {
  if (data.total <= 0) return []

  const windowStart = historyStart(today)
  let inWindow = 0
  let firstDay = ''
  data.days.forEach((n, key) => {
    if (n <= 0 || key < windowStart || key > today) return
    inWindow += n
    if (!firstDay || key < firstDay) firstDay = key
  })
  // 조회 구간이 시작되기 전에 이미 쌓여 있던 방문
  const before = Math.max(0, data.total - inWindow)

  // 구간 이전 기록이 있으면 구간 전체를, 없으면 첫 방문 전날(0)부터 그린다.
  // 다만 기간이 너무 짧으면 선이 되지 않으므로 최소 일주일은 보여 준다.
  let start = before > 0 || !firstDay ? windowStart : addDays(firstDay, -1)
  const weekAgo = addDays(today, -6)
  if (start > weekAgo) start = weekAgo
  if (start < windowStart) start = windowStart

  const points: SeriesPoint[] = []
  let running = before
  for (let key = start; key <= today; key = addDays(key, 1)) {
    running += data.days.get(key) ?? 0
    points.push({
      key,
      label: key === today ? '오늘' : shortDate(key),
      title: `${fullDate(key)}까지`,
      value: running,
    })
  }
  return points
}

// 관리자 홈의 요약 카드용: 오늘 / 어제 / 최근 7일(오늘 포함) / 누적
export function recentSummary(data: VisitData, today: string) {
  return {
    today: data.days.get(today) ?? 0,
    yesterday: data.days.get(addDays(today, -1)) ?? 0,
    week: sumRange(data.days, addDays(today, -6), 7),
    total: data.total,
  }
}
