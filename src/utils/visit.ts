// 사이트 방문 집계를 "같은 브라우저는 하루 한 번"으로 제한한다.
// 새로고침이나 페이지 이동으로 숫자가 부풀려지지 않게 하기 위함.
const KEY = 'last-visit-day'

const DAY_MS = 24 * 60 * 60 * 1000

// 한국 시간 기준 날짜(YYYY-MM-DD). daysAgo만큼 이전 날짜도 구할 수 있다.
// 방문자가 어느 시간대에 있든 하루의 경계가 같아야 날짜별 집계가 맞는다.
// (한국은 서머타임이 없어 UTC+9로 고정 계산해도 된다)
export function kstDay(daysAgo = 0): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000 - daysAgo * DAY_MS)
    .toISOString()
    .slice(0, 10)
}

// 검색 로봇·자동화 브라우저는 방문자로 세지 않는다
export function isBot(): boolean {
  return (
    navigator.webdriver === true ||
    /bot|crawl|spider|yeti|slurp|daumoa|headless|lighthouse/i.test(
      navigator.userAgent,
    )
  )
}

// 오늘 아직 세지 않았다면 오늘 날짜를 기록하고 true를 돌려준다.
// localStorage를 쓸 수 없는 환경에서는 세지 않는다(부풀리는 것보다 낫다).
export function claimVisit(day: string): boolean {
  try {
    if (localStorage.getItem(KEY) === day) return false
    localStorage.setItem(KEY, day)
    return true
  } catch {
    return false
  }
}

// 집계 저장이 실패했을 때 기록을 되돌린다 → 다음 접속 때 다시 시도된다
export function releaseVisit() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // 되돌리기 실패는 무시 (오늘 한 번 덜 세질 뿐이다)
  }
}

// ── 시별 조회수: 같은 브라우저에서 같은 시는 하루에 한 번만 센다 ──
// 날짜가 바뀌면 목록을 새로 시작하므로 저장 내용이 계속 불어나지 않는다.
const VIEWS_KEY = 'viewed-poems-today'

function readViewed(day: string): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(VIEWS_KEY) || 'null')
    return saved?.day === day && Array.isArray(saved.ids) ? saved.ids : []
  } catch {
    return []
  }
}

// 오늘 이 시를 아직 세지 않았다면 기록하고 true를 돌려준다.
// localStorage를 쓸 수 없는 환경에서는 세지 않는다(부풀리는 것보다 낫다).
export function claimPoemView(poemId: string, day: string): boolean {
  try {
    const ids = readViewed(day)
    if (ids.includes(poemId)) return false
    localStorage.setItem(VIEWS_KEY, JSON.stringify({ day, ids: [...ids, poemId] }))
    return true
  } catch {
    return false
  }
}

// 집계 저장이 실패했을 때 기록을 되돌린다 → 다음에 열 때 다시 시도된다
export function releasePoemView(poemId: string, day: string) {
  try {
    const ids = readViewed(day).filter((id) => id !== poemId)
    localStorage.setItem(VIEWS_KEY, JSON.stringify({ day, ids }))
  } catch {
    // 되돌리기 실패는 무시 (오늘 한 번 덜 세질 뿐이다)
  }
}
