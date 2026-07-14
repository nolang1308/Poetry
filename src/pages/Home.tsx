import { useEffect, useState } from 'react'
import WebHome from '../components/WebHome'
import MobileHome from '../components/MobileHome'
import PageLoading from '../components/PageLoading'
import { useHome } from '../hooks/useHome'

function Home() {
  const { home, loaded } = useHome()
  const [imagesReady, setImagesReady] = useState(false)

  // Firestore에서 지정 사진 URL을 받은 뒤(loaded), 그 사진이 실제로 다
  // 받아질 때까지 기다린다. 그래야 기본 사진 → 지정 사진으로 바뀌는
  // 깜빡임 없이 완성된 홈을 한 번에 보여줄 수 있다.
  useEffect(() => {
    if (!loaded) return
    let cancelled = false
    const urls = [home.webImage, home.mobileImage]
    let remaining = urls.length
    const done = () => {
      remaining -= 1
      if (remaining === 0 && !cancelled) setImagesReady(true)
    }
    urls.forEach((url) => {
      const img = new Image()
      img.onload = done
      img.onerror = done // 실패해도 화면은 열어 준다
      img.src = url
    })
    return () => {
      cancelled = true
    }
  }, [loaded, home.webImage, home.mobileImage])

  if (!loaded || !imagesReady) {
    return <PageLoading />
  }

  return (
    <>
      <WebHome home={home} />
      <MobileHome home={home} />
    </>
  )
}

export default Home
