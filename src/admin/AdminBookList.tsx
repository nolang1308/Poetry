import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useBlocker } from 'react-router-dom'
import { deleteBook, saveBookOrder, type BookDoc } from '../data/booksRepo'
import { Book, GripVertical, PenLine, Trash } from '../components/icons'
import './AdminHome.scss'

// 화면 위/아래 가장자리에서 자동 스크롤이 시작되는 거리(px)와 최대 속도
const EDGE = 80
const MAX_SPEED = 14

// 관리자 홈의 시집 목록.
// 공개 화면과 같은 순서(1번 시집이 맨 위)로 보여 주고, 손잡이를 끌어
// 순서를 바꾼다. 바꾼 순서는 '순서 저장'을 눌러야 실제로 반영된다.
function AdminBookList({ books }: { books: BookDoc[] }) {
  // 저장된 순서 (books는 sortKey 내림차순이라 뒤집는다)
  const saved = useMemo(() => [...books].reverse(), [books])

  // 끌어서 배치 중인 순서 (시집 id 목록). null이면 저장된 순서 그대로.
  const [draftIds, setDraftIds] = useState<string[] | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 배치 중에 시집이 추가·삭제돼도 어긋나지 않게: 없어진 시집은 빼고
  // 새로 생긴 시집은 맨 뒤에 붙인다.
  const shown = useMemo(() => {
    if (!draftIds) return saved
    const byId = new Map(saved.map((b) => [b.id, b]))
    const placed = draftIds
      .map((id) => byId.get(id))
      .filter((b): b is BookDoc => !!b)
    const placedIds = new Set(draftIds)
    return [...placed, ...saved.filter((b) => !placedIds.has(b.id))]
  }, [saved, draftIds])

  const dirty = shown.some((b, i) => b.id !== saved[i]?.id)

  // ── 드래그 ──
  const listRef = useRef<HTMLUListElement>(null)
  const dragRef = useRef<{ id: string; pointerId: number; y: number; raf: number } | null>(null)
  const stopDragRef = useRef<(() => void) | null>(null)

  // 손가락/커서 높이(y)에 맞춰 끌고 있는 시집의 자리를 정한다.
  // 지금 화면(DOM) 순서를 기준으로 계산해, 상태 반영 전이어도 결과가 같다.
  const placeAt = (y: number) => {
    const drag = dragRef.current
    const list = listRef.current
    if (!drag || !list) return
    const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-book-id]'))
    const ids = rows.map((r) => r.dataset.bookId ?? '')
    const from = ids.indexOf(drag.id)
    if (from === -1) return
    // 끌고 있는 시집을 뺀 나머지 중, 가운데선이 y보다 위에 있는 줄의 수 = 새 자리
    let to = 0
    rows.forEach((r) => {
      if (r.dataset.bookId === drag.id) return
      const rect = r.getBoundingClientRect()
      if (y > rect.top + rect.height / 2) to++
    })
    if (to === from) return
    const next = ids.filter((id) => id !== drag.id)
    next.splice(to, 0, drag.id)
    setDraftIds(next)
  }

  const onHandlePointerDown = (e: React.PointerEvent, id: string) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (saving) return
    e.preventDefault() // 마우스로 끌 때 글자가 선택되지 않게
    stopDragRef.current?.()

    const drag = { id, pointerId: e.pointerId, y: e.clientY, raf: 0 }
    dragRef.current = drag
    setDragId(id)

    // 목록이 화면보다 길면 가장자리에 머무는 동안 자동으로 스크롤하며 계속 배치
    const tick = () => {
      let dy = 0
      if (drag.y < EDGE) {
        dy = -Math.ceil(((EDGE - drag.y) / EDGE) * MAX_SPEED)
      } else if (drag.y > window.innerHeight - EDGE) {
        dy = Math.ceil(((drag.y - (window.innerHeight - EDGE)) / EDGE) * MAX_SPEED)
      }
      if (dy) {
        window.scrollBy(0, dy)
        placeAt(drag.y)
      }
      drag.raf = requestAnimationFrame(tick)
    }
    drag.raf = requestAnimationFrame(tick)

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== drag.pointerId) return
      ev.preventDefault()
      drag.y = ev.clientY
      placeAt(ev.clientY)
    }
    const stop = () => {
      cancelAnimationFrame(drag.raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onEnd)
      window.removeEventListener('pointercancel', onEnd)
      dragRef.current = null
      stopDragRef.current = null
      setDragId(null)
    }
    const onEnd = (ev: PointerEvent) => {
      if (ev.pointerId === drag.pointerId) stop()
    }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onEnd)
    window.addEventListener('pointercancel', onEnd)
    stopDragRef.current = stop
  }

  // 화면을 벗어나면 끌던 중이라도 정리
  useEffect(() => () => stopDragRef.current?.(), [])

  // 키보드: 손잡이에 초점을 두고 ↑/↓ 로 한 칸씩
  const onHandleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const to = index + (e.key === 'ArrowUp' ? -1 : 1)
    if (to < 0 || to >= shown.length) return
    const ids = shown.map((b) => b.id)
    const [moved] = ids.splice(index, 1)
    ids.splice(to, 0, moved)
    setDraftIds(ids)
  }

  // ── 저장 / 취소 ──
  const save = async () => {
    setSaving(true)
    try {
      await saveBookOrder(shown)
      setDraftIds(null)
    } catch {
      window.alert('시집 순서를 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => setDraftIds(null)

  // 저장하지 않은 순서가 있으면 다른 화면으로 가거나 창을 닫기 전에 묻는다
  const blocker = useBlocker(dirty)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm('저장하지 않은 시집 순서가 있습니다. 저장하지 않고 나갈까요?')) {
      blocker.proceed()
    } else {
      blocker.reset()
    }
  }, [blocker])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const removeBook = async (id: string, name: string) => {
    if (!window.confirm(`시집 '${name}'을(를) 삭제할까요? (담긴 시는 지워지지 않습니다)`)) return
    try {
      await deleteBook(id)
    } catch {
      window.alert('삭제에 실패했습니다.')
    }
  }

  return (
    <section className="admin-home__books">
      <div className="admin-home__books-head">
        <h2 className="admin-home__books-title">시집 · {books.length}권</h2>
        {dirty ? (
          <div className="admin-home__books-save">
            <span className="admin-home__books-hint">
              바뀐 순서는 저장해야 반영돼요
            </span>
            <button
              type="button"
              className="admin-card__btn"
              onClick={cancel}
              disabled={saving}
            >
              취소
            </button>
            <button
              type="button"
              className="admin-card__btn admin-home__books-save-btn"
              onClick={save}
              disabled={saving}
            >
              {saving ? '저장 중…' : '순서 저장'}
            </button>
          </div>
        ) : (
          books.length > 1 && (
            <span className="admin-home__books-hint">
              손잡이를 끌어 순서를 바꿀 수 있어요
            </span>
          )
        )}
      </div>

      <ul className="admin-home__book-list" ref={listRef}>
        {shown.map((book, i) => (
          <li
            key={book.id}
            data-book-id={book.id}
            className={
              'admin-home__book-row' +
              (dragId === book.id ? ' admin-home__book-row--dragging' : '')
            }
          >
            <button
              type="button"
              className="admin-home__book-handle"
              onPointerDown={(e) => onHandlePointerDown(e, book.id)}
              onKeyDown={(e) => onHandleKeyDown(e, i)}
              disabled={saving || books.length < 2}
              aria-label={`'${book.name}' 순서 바꾸기 (위/아래 화살표 키)`}
              title="끌어서 순서 바꾸기"
            >
              <GripVertical size={16} />
            </button>
            <Book size={16} className="admin-home__book-icon" />
            <span className="admin-home__book-name">
              <span className="admin-home__book-no">{i + 1}.</span>
              {book.name}
            </span>
            <span className="admin-home__book-count">
              시 {book.poemIds.length}편
            </span>
            <div className="admin-home__book-actions">
              <Link to={`/admin/book/edit/${book.id}`} className="admin-card__btn">
                <PenLine size={14} />
                수정
              </Link>
              <button
                type="button"
                className="admin-card__btn admin-card__btn--danger"
                onClick={() => removeBook(book.id, book.name)}
              >
                <Trash size={14} />
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default AdminBookList
