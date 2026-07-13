import WebHome from '../components/WebHome'
import MobileHome from '../components/MobileHome'
import { useHome } from '../hooks/useHome'

function Home() {
  const home = useHome()
  return (
    <>
      <WebHome home={home} />
      <MobileHome home={home} />
    </>
  )
}

export default Home
