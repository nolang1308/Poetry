import WebPoems from '../components/WebPoems'
import MobilePoems from '../components/MobilePoems'
import { usePoems } from '../hooks/usePoems'

function Poems() {
  const { poems, loading } = usePoems()

  return (
    <>
      <WebPoems poems={poems} loading={loading} />
      <MobilePoems poems={poems} loading={loading} />
    </>
  )
}

export default Poems
