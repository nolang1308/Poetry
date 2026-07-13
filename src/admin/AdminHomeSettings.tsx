import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { subscribeHome, updateHome } from '../data/homeRepo'
import type { HomeContent } from '../data/home'
import { resizeImage } from '../utils/image'
import './AdminHomeSettings.scss'

type TextKey = Exclude<keyof HomeContent, 'webImage' | 'mobileImage'>
type ImageKey = 'webImage' | 'mobileImage'

function AdminHomeSettings() {
  const navigate = useNavigate()
  const [form, setForm] = useState<HomeContent | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // 저장된 홈 콘텐츠가 도착하면 한 번만 폼 초기화
  useEffect(() => subscribeHome((h) => setForm((prev) => prev ?? h)), [])

  if (!form) return <div className="poem-detail-loading">불러오는 중…</div>

  const set = (key: keyof HomeContent, value: string) =>
    setForm((f) => (f ? { ...f, [key]: value } : f))

  const onFile =
    (key: ImageKey) => async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 등록할 수 있습니다.')
        return
      }
      try {
        const url = await resizeImage(file, key === 'mobileImage' ? 700 : 1000)
        set(key, url)
        setError('')
      } catch {
        setError('이미지를 불러오지 못했습니다.')
      }
    }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      // 새로 올린(dataURL) 이미지만 저장. 기본 에셋 경로는 저장하지 않음.
      const payload: Partial<HomeContent> = { ...form }
      if (!form.webImage.startsWith('data:')) delete payload.webImage
      if (!form.mobileImage.startsWith('data:')) delete payload.mobileImage
      await updateHome(payload)
      navigate('/admin/home')
    } catch {
      setError('저장에 실패했습니다. 다시 시도해 주세요.')
      setSaving(false)
    }
  }

  const text = (label: string, key: TextKey) => (
    <label className="admin-settings__field">
      <span className="admin-settings__label">{label}</span>
      <input
        className="admin-settings__input"
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
      />
    </label>
  )

  const area = (label: string, key: TextKey, rows = 3) => (
    <label className="admin-settings__field">
      <span className="admin-settings__label">{label}</span>
      <textarea
        className="admin-settings__textarea"
        rows={rows}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
      />
    </label>
  )

  const imageField = (label: string, key: ImageKey, round?: boolean) => (
    <div className="admin-settings__field">
      <span className="admin-settings__label">{label}</span>
      <div className="admin-settings__image-row">
        <div
          className={
            'admin-settings__thumb' +
            (round ? ' admin-settings__thumb--round' : '')
          }
          style={{ backgroundImage: `url(${form[key]})` }}
        />
        <label className="admin-settings__file">
          <input
            type="file"
            accept="image/*"
            className="admin-settings__file-input"
            onChange={onFile(key)}
          />
          <span className="admin-settings__file-btn">사진 변경</span>
        </label>
      </div>
    </div>
  )

  return (
    <div className="admin-settings">
      <div className="admin-settings__container">
        <Link to="/admin/home" className="admin-settings__back">
          ← 시 관리로
        </Link>
        <h1 className="admin-settings__title">홈 화면 편집</h1>

        <form onSubmit={onSubmit}>
          <section className="admin-settings__section">
            <h2 className="admin-settings__section-title">사진</h2>
            {imageField('웹 히어로 사진', 'webImage')}
            {imageField('모바일 프로필 사진', 'mobileImage', true)}
          </section>

          <section className="admin-settings__section">
            <h2 className="admin-settings__section-title">웹 홈 문구</h2>
            {text('상단 라벨', 'eyebrow')}
            {text('헤드라인 1', 'headline1')}
            {text('헤드라인 2', 'headline2')}
            {area('소개글', 'intro', 4)}
            {text('버튼 문구 (모바일과 공용)', 'ctaLabel')}
            {text('보조 링크 문구', 'secondaryLabel')}
            {area('사진 위 시구', 'verseWeb', 2)}
          </section>

          <section className="admin-settings__section">
            <h2 className="admin-settings__section-title">모바일 홈 문구</h2>
            {text('상단 제목', 'mobileTitle')}
            {text('상단 라벨', 'mobileEyebrow')}
            {text('시인 이름', 'poetName')}
            {area('소개글', 'mobileIntro', 3)}
            {area('시구', 'verseMobile', 2)}
          </section>

          {error && <p className="admin-settings__error">{error}</p>}

          <div className="admin-settings__actions">
            <Link to="/admin/home" className="admin-settings__cancel">
              취소
            </Link>
            <button
              type="submit"
              className="admin-settings__submit"
              disabled={saving}
            >
              {saving ? '저장 중…' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminHomeSettings
