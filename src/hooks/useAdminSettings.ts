import { useEffect, useState } from 'react'
import {
  defaultAdminSettings,
  getAdminSettingsCache,
  subscribeAdminSettings,
  type AdminSettings,
} from '../data/adminSettingsRepo'

// 관리자 공통 설정을 구독.
// loaded: 저장된 값을 한 번이라도 받았는지 — 기본값으로 먼저 그렸다가
// 저장값으로 바뀌는 깜빡임을 막는 데 쓴다.
export function useAdminSettings(): { settings: AdminSettings; loaded: boolean } {
  const [settings, setSettings] = useState<AdminSettings>(
    () => getAdminSettingsCache() ?? defaultAdminSettings,
  )
  const [loaded, setLoaded] = useState(() => getAdminSettingsCache() !== null)

  useEffect(
    () =>
      subscribeAdminSettings((s) => {
        setSettings(s)
        setLoaded(true)
      }),
    [],
  )

  return { settings, loaded }
}
