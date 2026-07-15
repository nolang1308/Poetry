import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { usePoems } from '../hooks/usePoems'
import { addPoem, updatePoem } from '../data/poemsRepo'
import { fileToEditableUrl } from '../utils/image'
import AutoTextarea from '../components/AutoTextarea'
import RichEditor from '../components/RichEditor'
import PoemPreview from '../components/PoemPreview'
import ImageCropper from '../components/ImageCropper'
import type { Poem } from '../data/poems'
import './AdminPoemForm.scss'

function todayString() {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`
}

// 데이터 준비 여부를 판단하는 래퍼
function AdminPoemForm() {
  const { id } = useParams()
  const { poems, loading } = usePoems()

  if (!id) {
    return (
      <PoemForm
        initial={{
          title: '',
          date: todayString(),
          likes: '0',
          image: '',
          content: '',
          note: '',
        }}
      />
    )
  }

  if (loading) {
    return <div className="poem-detail-loading">불러오는 중…</div>
  }

  const existing = poems.find((p) => p.id === id)
  if (!existing) return <Navigate to="/admin/home" replace />

  return <PoemForm id={id} initial={existing} />
}

function PoemForm({ id, initial }: { id?: string; initial: Poem }) {
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [form, setForm] = useState<Poem>(initial)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  const set = (key: keyof Poem, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일 다시 선택 가능하도록 초기화
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 등록할 수 있습니다.')
      return
    }
    try {
      // 원본을 크롭 편집기로 열어 위치·확대를 맞춘 뒤 표지로 저장
      const dataUrl = await fileToEditableUrl(file)
      setCropSrc(dataUrl)
      setFileName(file.name)
      setError('')
    } catch {
      setError('이미지를 불러오지 못했습니다.')
    }
  }

  const onCropConfirm = (dataUrl: string) => {
    set('image', dataUrl)
    setCropSrc(null)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('제목을 입력해 주세요.')
      return
    }
    setSaving(true)
    try {
      if (editing && id) await updatePoem(id, form)
      else await addPoem(form)
      navigate('/admin/home')
    } catch {
      setError('저장에 실패했습니다. 다시 시도해 주세요.')
      setSaving(false)
    }
  }

  return (
    <div className="admin-form">
      <div className="admin-form__container">
        <Link to="/admin/home" className="admin-form__back">
          ← 시 관리로
        </Link>
        <h1 className="admin-form__title">{editing ? '시 수정' : '시 등록'}</h1>

        <form className="admin-form__body" onSubmit={onSubmit}>
          <div className="admin-form__fields">
              <label className="admin-form__field">
                <span className="admin-form__label">제목</span>
                <input
                  className="admin-form__input"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder="시 제목"
                />
              </label>

              <div className="admin-form__field">
                <span className="admin-form__label">내용</span>
                <RichEditor
                  value={form.content ?? ''}
                  onChange={(html) => set('content', html)}
                />
              </div>

              <label className="admin-form__field">
                <span className="admin-form__label">시인의 노트</span>
                <AutoTextarea
                  className="admin-form__textarea admin-form__textarea--short"
                  value={form.note ?? ''}
                  onChange={(e) => set('note', e.target.value)}
                  placeholder="시에 대한 시인의 한마디 (선택)"
                />
              </label>

              <div className="admin-form__field">
                <span className="admin-form__label">표지 사진</span>
                <div className="admin-form__cover-row">
                  <label className="admin-form__file">
                    <input
                      type="file"
                      accept="image/*"
                      className="admin-form__file-input"
                      onChange={onFile}
                    />
                    <span className="admin-form__file-btn">파일 선택</span>
                    <span className="admin-form__file-name">
                      {fileName || (form.image ? '등록된 사진' : '선택된 파일 없음')}
                    </span>
                  </label>
                  {form.image && (
                    <div className="admin-form__cover-preview">
                      <div
                        className="admin-form__cover-thumb"
                        style={{ backgroundImage: `url(${form.image})` }}
                        role="img"
                        aria-label="표지 미리보기"
                      />
                      <button
                        type="button"
                        className="admin-form__cover-edit"
                        onClick={() => setCropSrc(form.image)}
                      >
                        위치 조정
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <label className="admin-form__field">
                <span className="admin-form__label">등록일</span>
                <input
                  className="admin-form__input"
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  placeholder="2026.07.13"
                />
              </label>
          </div>

          {error && <p className="admin-form__error">{error}</p>}

          <div className="admin-form__actions">
            <Link to="/admin/home" className="admin-form__cancel">
              취소
            </Link>
            <button
              type="button"
              className="admin-form__preview-btn"
              onClick={() => setPreview(true)}
            >
              미리보기
            </button>
            <button
              type="submit"
              className="admin-form__submit"
              disabled={saving}
            >
              {saving ? '저장 중…' : editing ? '수정 저장' : '등록하기'}
            </button>
          </div>
        </form>
      </div>

      {preview && (
        <PoemPreview poem={form} onClose={() => setPreview(false)} />
      )}

      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          onCancel={() => setCropSrc(null)}
          onConfirm={onCropConfirm}
        />
      )}
    </div>
  )
}

export default AdminPoemForm
