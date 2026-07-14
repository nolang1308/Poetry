import { useEffect, useState } from 'react'
import { subscribeHome, getHomeCache } from '../data/homeRepo'
import { defaultHome, type HomeContent } from '../data/home'

// 홈 콘텐츠를 구독.
// loaded: Firestore에서 실제 저장값을 한 번이라도 받았는지 여부.
//   기본값(번들 사진)이 먼저 보였다가 지정 사진으로 교체되는 깜빡임을 막기 위해,
//   화면 쪽에서 loaded 전까지는 "페이지 구성 중" 화면을 띄우는 데 쓴다.
export function useHome(): { home: HomeContent; loaded: boolean } {
  const [home, setHome] = useState<HomeContent>(() => getHomeCache() ?? defaultHome)
  const [loaded, setLoaded] = useState(() => getHomeCache() !== null)

  useEffect(
    () =>
      subscribeHome((h) => {
        setHome(h)
        setLoaded(true)
      }),
    [],
  )

  return { home, loaded }
}
