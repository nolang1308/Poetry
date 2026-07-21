// 사이트 방문 집계를 하루 한 번으로 제한한다.
// 새로고침이나 페이지 이동으로 숫자가 부풀려지지 않게 하기 위함.
const KEY = 'last-visit-day'

function today(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 오늘 아직 세지 않았다면 true를 돌려주고 오늘 날짜를 기록한다.
// localStorage를 쓸 수 없는 환경에서는 세지 않는다(부풀리는 것보다 낫다).
export function shouldCountVisit(): boolean {
  try {
    const day = today()
    if (localStorage.getItem(KEY) === day) return false
    localStorage.setItem(KEY, day)
    return true
  } catch {
    return false
  }
}
