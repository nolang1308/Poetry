import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { usePoems } from '../hooks/usePoems'
import { useBooks } from '../hooks/useBooks'
import { addBook, updateBook, MAX_BOOK_POEMS } from '../data/booksRepo'
import { fileToEditableUrl } from '../utils/image'
import ImageCropper from '../components/ImageCropper'
import { Check, Search } from '../components/icons'
import type { Book } from '../data/booksRepo'
import './AdminPoemForm.scss'
import './AdminHome.scss'
import './AdminBookForm.scss'

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '')

// 데이터 준비 여부를 판단하는 래퍼 (AdminPoemForm과 동일 패턴)
function AdminBookForm() {
  const { id } = useParams()
  const { books, loading } = useBooks()

  if (!id) {
    return <BookForm initial={{ name: '', poemIds: [], image: '' }} />
  }

  if (loading) {
    return <div className="poem-detail-loading">불러오는 중…</div>
  }

  const existing = books.find((b) => b.id === id)
  if (!existing) return <Navigate to="/admin/home" replace />

  return <BookForm id={id} initial={existing} />
}

function BookForm({ id, initial }: { id?: string; initial: Book }) {
  const navigate = useNavigate()
  const editing = Boolean(id)
  const { poems, loading } = usePoems()
  const [name, setName] = useState(initial.name)
  // 선택한 순서를 그대로 시집의 시 순서로 쓴다
  const [selectedIds, setSelectedIds] = useState<string[]>(initial.poemIds)
  const [image, setImage] = useState(initial.image ?? '')
  const [fileName, setFileName] = useState('')
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

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
    setImage(dataUrl)
    setCropSrc(null)
  }

  const q = normalize(query)
  const filtered = q
    ? poems.filter((p) => normalize(p.title).includes(q))
    : poems

  // ── 모바일: 사진첩처럼 드래그로 여러 편 선택 ──
  // 카드를 짚고 가로로 끌기 시작하면 선택 모드가 되어, 손가락이 지나간
  // 범위의 시가 한 번에 선택(첫 카드가 이미 선택돼 있었다면 해제)된다.
  // 세로로 끌면 평소처럼 스크롤. 화면 가장자리에 닿으면 자동 스크롤.
  const dragRef = useRef({
    mode: 'idle' as 'idle' | 'pending' | 'select',
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    anchorId: '',
    action: true, // true = 선택, false = 해제
    base: [] as string[], // 드래그 시작 시점의 선택 목록
    raf: 0,
  })
  const suppressClick = useRef(false)
  // 문서 레벨 리스너에서 최신 값을 읽기 위한 ref
  const filteredIdsRef = useRef<string[]>([])
  filteredIdsRef.current = filtered.map((p) => p.id)
  const selectedRef = useRef(selectedIds)
  selectedRef.current = selectedIds

  useEffect(() => {
    const drag = dragRef.current

    // 손가락 위치의 카드까지 앵커에서 이어지는 범위를 선택/해제 반영
    const applyRange = (x: number, y: number) => {
      const d = drag
      const ids = filteredIdsRef.current
      const el = document
        .elementFromPoint(x, y)
        ?.closest('[data-poem-id]') as HTMLElement | null
      if (!el) return
      const a = ids.indexOf(d.anchorId)
      const b = ids.indexOf(el.dataset.poemId ?? '')
      if (a === -1 || b === -1) return
      const range = ids.slice(Math.min(a, b), Math.max(a, b) + 1)

      let next: string[]
      if (d.action) {
        const additions = range.filter((pid) => !d.base.includes(pid))
        next = [...d.base, ...additions]
        if (next.length > MAX_BOOK_POEMS) {
          next = next.slice(0, MAX_BOOK_POEMS)
          setError(`시집에는 최대 ${MAX_BOOK_POEMS}편까지 담을 수 있습니다.`)
        }
      } else {
        const rangeSet = new Set(range)
        next = d.base.filter((pid) => !rangeSet.has(pid))
      }

      const cur = selectedRef.current
      if (next.length !== cur.length || next.some((v, i) => v !== cur[i])) {
        setSelectedIds(next)
      }
    }

    // 화면 위/아래 가장자리에 손가락이 머물면 자동 스크롤하며 계속 선택
    const tick = () => {
      const d = dragRef.current
      if (d.mode !== 'select') return
      const EDGE = 80
      const MAX_SPEED = 14
      let dy = 0
      if (d.lastY < EDGE) {
        dy = -Math.ceil(((EDGE - d.lastY) / EDGE) * MAX_SPEED)
      } else if (d.lastY > window.innerHeight - EDGE) {
        dy = Math.ceil(((d.lastY - (window.innerHeight - EDGE)) / EDGE) * MAX_SPEED)
      }
      if (dy) {
        window.scrollBy(0, dy)
        applyRange(d.lastX, d.lastY)
      }
      d.raf = requestAnimationFrame(tick)
    }

    const onMove = (e: TouchEvent) => {
      const d = dragRef.current
      if (d.mode === 'idle') return
      const t = e.touches[0]
      d.lastX = t.clientX
      d.lastY = t.clientY
      if (d.mode === 'pending') {
        const dx = Math.abs(t.clientX - d.startX)
        const dyMove = Math.abs(t.clientY - d.startY)
        // 세로 우세 → 스크롤 제스처에 양보
        if (dyMove > 10 && dyMove > dx) {
          d.mode = 'idle'
          return
        }
        if (dx > 10 && dx >= dyMove) {
          d.mode = 'select'
          d.raf = requestAnimationFrame(tick)
        } else {
          return
        }
      }
      if (e.cancelable) e.preventDefault()
      applyRange(t.clientX, t.clientY)
    }

    const onEnd = () => {
      const d = dragRef.current
      if (d.mode === 'select') {
        // 드래그 직후 터치 지점 카드에 click이 따라오면 토글이 겹치므로 무시
        suppressClick.current = true
        setTimeout(() => {
          suppressClick.current = false
        }, 350)
      }
      d.mode = 'idle'
      cancelAnimationFrame(d.raf)
    }

    // 그리드가 로딩/검색으로 다시 마운트돼도 유지되도록 문서 레벨에 부착
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
    document.addEventListener('touchcancel', onEnd)
    return () => {
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onEnd)
      cancelAnimationFrame(drag.raf)
    }
  }, [])

  const onGridTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const card = (e.target as HTMLElement).closest(
      '[data-poem-id]',
    ) as HTMLElement | null
    if (!card) return
    const d = dragRef.current
    const t = e.touches[0]
    d.mode = 'pending'
    d.startX = d.lastX = t.clientX
    d.startY = d.lastY = t.clientY
    d.anchorId = card.dataset.poemId ?? ''
    d.base = selectedRef.current
    d.action = !selectedRef.current.includes(d.anchorId)
  }

  const toggle = (poemId: string) => {
    // 드래그 선택 직후 따라오는 click은 무시
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    setSelectedIds((prev) => {
      if (prev.includes(poemId)) {
        setError('')
        return prev.filter((x) => x !== poemId)
      }
      if (prev.length >= MAX_BOOK_POEMS) {
        setError(`시집에는 최대 ${MAX_BOOK_POEMS}편까지 담을 수 있습니다.`)
        return prev
      }
      setError('')
      return [...prev, poemId]
    })
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('시집 이름을 입력해 주세요.')
      return
    }
    if (selectedIds.length === 0) {
      setError('시집에 넣을 시를 한 편 이상 선택해 주세요.')
      return
    }
    setSaving(true)
    try {
      const data = { name: name.trim(), poemIds: selectedIds, image }
      if (editing && id) await updateBook(id, data)
      else await addBook(data)
      navigate('/admin/home')
    } catch {
      setError('저장에 실패했습니다. 다시 시도해 주세요.')
      setSaving(false)
    }
  }

  return (
    <div className="admin-form admin-book-form">
      <div className="admin-form__container admin-book-form__container">
        <Link to="/admin/home" className="admin-form__back">
          ← 시 관리로
        </Link>
        <h1 className="admin-form__title">
          {editing ? '시집 수정' : '시집 만들기'}
        </h1>

        <form className="admin-form__body" onSubmit={onSubmit}>
          <div className="admin-form__fields">
            <label className="admin-form__field">
              <span className="admin-form__label">시집 이름</span>
              <input
                className="admin-form__input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 계절의 결"
              />
            </label>

            <div className="admin-form__field">
              <span className="admin-form__label">표지 사진 (선택)</span>
              <p className="admin-book-form__guide">
                따로 정하지 않으면 시집에 담긴 첫 번째 시의 사진이 표지가 됩니다.
              </p>
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
                    {fileName || (image ? '등록된 사진' : '선택된 파일 없음')}
                  </span>
                </label>
                {image && (
                  <div className="admin-form__cover-preview">
                    <img
                      className="admin-form__cover-thumb"
                      src={image}
                      alt="표지 미리보기"
                    />
                    <div className="admin-book-form__cover-btns">
                      <button
                        type="button"
                        className="admin-form__cover-edit"
                        onClick={() => setCropSrc(image)}
                      >
                        위치 조정
                      </button>
                      <button
                        type="button"
                        className="admin-form__cover-edit admin-book-form__cover-remove"
                        onClick={() => {
                          setImage('')
                          setFileName('')
                        }}
                      >
                        표지 삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="admin-form__field">
              <span className="admin-form__label">시 선택</span>
              <p className="admin-book-form__guide">
                해당 시집에 넣을 시들을 선택하세요. (최대 {MAX_BOOK_POEMS}편)
                <br />
                <span className="admin-book-form__guide-tip">
                  휴대폰에서는 카드를 짚고 옆으로 쓸면 여러 편을 한 번에
                  선택할 수 있어요.
                </span>
              </p>

              <div className="admin-home__search admin-book-form__search">
                <Search size={18} className="admin-home__search-icon" />
                <input
                  className="admin-home__search-input"
                  type="text"
                  placeholder="제목으로 검색"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              <p className="admin-book-form__count">
                {selectedIds.length}/{MAX_BOOK_POEMS}편 선택됨
              </p>

              {loading ? (
                <p className="admin-home__empty">시를 불러오는 중…</p>
              ) : filtered.length === 0 ? (
                <p className="admin-home__empty">
                  {poems.length === 0
                    ? '등록된 시가 없습니다. 먼저 시를 등록해 주세요.'
                    : `'${query}'에 대한 검색 결과가 없습니다.`}
                </p>
              ) : (
                <div
                  className="admin-home__grid admin-book-form__grid"
                  onTouchStart={onGridTouchStart}
                >
                  {filtered.map((poem) => {
                    const order = selectedIds.indexOf(poem.id)
                    const on = order !== -1
                    return (
                      <div
                        key={poem.id}
                        data-poem-id={poem.id}
                        className={
                          'admin-card' + (on ? ' admin-card--selected' : '')
                        }
                      >
                        <button
                          type="button"
                          className="admin-card__cover"
                          onClick={() => toggle(poem.id)}
                          aria-pressed={on}
                          aria-label={`${poem.title} 선택`}
                        >
                          {poem.image && (
                            <img
                              className="admin-card__cover-img"
                              src={poem.image}
                              alt=""
                            />
                          )}
                          <span
                            className={
                              'admin-card__check' +
                              (on ? ' admin-card__check--on' : '')
                            }
                          >
                            {on ? (
                              <span className="admin-book-form__order">
                                {order + 1}
                              </span>
                            ) : (
                              <Check size={15} />
                            )}
                          </span>
                        </button>

                        <div className="admin-card__info">
                          <p className="admin-card__title">{poem.title}</p>
                          <p className="admin-card__meta">
                            {poem.date} · 좋아요 {poem.likes}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
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
              {saving ? '저장 중…' : editing ? '수정 저장' : '시집 등록'}
            </button>
          </div>
        </form>
      </div>

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

export default AdminBookForm
