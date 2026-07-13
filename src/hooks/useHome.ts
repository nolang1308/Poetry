import { useEffect, useState } from 'react'
import { subscribeHome, getHomeCache } from '../data/homeRepo'
import { defaultHome, type HomeContent } from '../data/home'

// 홈 콘텐츠를 구독 (기본값이 즉시 있어 로딩 없이 렌더)
export function useHome(): HomeContent {
  const [home, setHome] = useState<HomeContent>(() => getHomeCache() ?? defaultHome)
  useEffect(() => subscribeHome(setHome), [])
  return home
}
