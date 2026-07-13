import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { usePoems } from '../hooks/usePoems'
import { addPoem, updatePoem } from '../data/poemsRepo'
import { resizeImage } from '../utils/image'
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

  const set = (key: keyof Poem, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 등록할 수 있습니다.')
      return
    }
    try {
      const dataUrl = await resizeImage(file)
      set('image', dataUrl)
      setFileName(file.name)
      setError('')
    } catch {
      setError('이미지를 불러오지 못했습니다.')
    }
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
          <div className="admin-form__grid">
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

              <label className="admin-form__field">
                <span className="admin-form__label">내용</span>
                <textarea
                  className="admin-form__textarea"
                  value={form.content ?? ''}
                  onChange={(e) => set('content', e.target.value)}
                  placeholder="시 내용을 입력하세요"
                  rows={9}
                />
              </label>

              <label className="admin-form__field">
                <span className="admin-form__label">시인의 노트</span>
                <textarea
                  className="admin-form__textarea admin-form__textarea--short"
                  value={form.note ?? ''}
                  onChange={(e) => set('note', e.target.value)}
                  placeholder="시에 대한 시인의 한마디 (선택)"
                  rows={5}
                />
              </label>

              <div className="admin-form__field">
                <span className="admin-form__label">사진</span>
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

            <div className="admin-form__preview">
              <span className="admin-form__label">미리보기</span>
              <div
                className="admin-form__cover"
                style={
                  form.image ? { backgroundImage: `url(${form.image})` } : undefined
                }
              />
              <p className="admin-form__preview-title">
                {form.title || '제목 없음'}
              </p>
              <p className="admin-form__preview-meta">{form.date}</p>
            </div>
          </div>

          {error && <p className="admin-form__error">{error}</p>}

          <div className="admin-form__actions">
            <Link to="/admin/home" className="admin-form__cancel">
              취소
            </Link>
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
    </div>
  )
}

export default AdminPoemForm
