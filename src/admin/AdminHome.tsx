import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdmin } from './AdminContext'
import { usePoems } from '../hooks/usePoems'
import { deletePoems } from '../data/poemsRepo'
import { Check, Trash, Plus, PenLine, X, Search } from '../components/icons'
import './AdminHome.scss'

const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, '')

function AdminHome() {
  const { logout } = useAdmin()
  const { poems, loading } = usePoems()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')

  const q = normalize(query)
  const filtered = q
    ? poems.filter((p) => normalize(p.title).includes(q))
    : poems
  const filteredIds = filtered.map((p) => p.id)
  const allSelected =
    filtered.length > 0 && filteredIds.every((id) => selected.has(id))

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) filteredIds.forEach((id) => next.delete(id))
      else filteredIds.forEach((id) => next.add(id))
      return next
    })

  const clearSelection = () => setSelected(new Set())

  const deleteSelected = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`선택한 ${selected.size}편의 시를 삭제할까요?`)) return
    try {
      await deletePoems([...selected])
      clearSelection()
    } catch {
      window.alert('삭제에 실패했습니다.')
    }
  }

  const deleteOne = async (id: string, title: string) => {
    if (!window.confirm(`'${title}'을(를) 삭제할까요?`)) return
    try {
      await deletePoems([id])
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch {
      window.alert('삭제에 실패했습니다.')
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  return (
    <div className="admin-home">
      <header className="admin-home__top">
        <div className="admin-home__brand">
          <span className="admin-home__mark">詩</span>
          <span className="admin-home__brand-name">권일원의 시 · 관리자</span>
        </div>
        <div className="admin-home__top-actions">
          <Link to="/admin/home-settings" className="admin-home__link">
            홈 화면 편집
          </Link>
          <Link to="/" className="admin-home__link">
            사이트 보기
          </Link>
          <button
            type="button"
            className="admin-home__link"
            onClick={handleLogout}
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="admin-home__container">
        <div className="admin-home__header">
          <div>
            <h1 className="admin-home__title">시 관리</h1>
            <p className="admin-home__sub">
              총 {poems.length}편
              {q && ` · 검색 ${filtered.length}편`}
            </p>
          </div>
          <Link to="/admin/new" className="admin-home__register">
            <Plus size={16} />
            시 등록
          </Link>
        </div>

        <div className="admin-home__search">
          <Search size={18} className="admin-home__search-icon" />
          <input
            className="admin-home__search-input"
            type="text"
            placeholder="제목으로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="admin-home__toolbar">
          <label className="admin-home__select-all">
            <span
              className={
                'admin-home__checkbox' +
                (allSelected ? ' admin-home__checkbox--on' : '')
              }
            >
              {allSelected && <Check size={14} />}
            </span>
            <input
              type="checkbox"
              className="admin-home__sr"
              checked={allSelected}
              onChange={toggleAll}
            />
            전체 선택
          </label>

          <span className="admin-home__count">{selected.size}개 선택됨</span>

          <div className="admin-home__bulk">
            <button
              type="button"
              className="admin-home__bulk-btn"
              onClick={clearSelection}
              disabled={selected.size === 0}
            >
              <X size={15} />
              선택 해제
            </button>
            <button
              type="button"
              className="admin-home__bulk-btn admin-home__bulk-btn--danger"
              onClick={deleteSelected}
              disabled={selected.size === 0}
            >
              <Trash size={15} />
              선택 삭제
            </button>
          </div>
        </div>

        {loading ? (
          <p className="admin-home__empty">시를 불러오는 중…</p>
        ) : filtered.length === 0 ? (
          <p className="admin-home__empty">
            {poems.length === 0
              ? '등록된 시가 없습니다.'
              : `'${query}'에 대한 검색 결과가 없습니다.`}
          </p>
        ) : (
          <div className="admin-home__grid">
            {filtered.map((poem) => {
              const on = selected.has(poem.id)
              return (
                <div
                  key={poem.id}
                  className={
                    'admin-card' + (on ? ' admin-card--selected' : '')
                  }
                >
                  <button
                    type="button"
                    className="admin-card__cover"
                    style={{ backgroundImage: `url(${poem.image})` }}
                    onClick={() => toggle(poem.id)}
                    aria-pressed={on}
                    aria-label={`${poem.title} 선택`}
                  >
                    <span
                      className={
                        'admin-card__check' +
                        (on ? ' admin-card__check--on' : '')
                      }
                    >
                      {on && <Check size={15} />}
                    </span>
                  </button>

                  <div className="admin-card__info">
                    <p className="admin-card__title">{poem.title}</p>
                    <p className="admin-card__meta">
                      {poem.date} · 좋아요 {poem.likes}
                    </p>
                  </div>

                  <div className="admin-card__actions">
                    <Link
                      to={`/admin/edit/${poem.id}`}
                      className="admin-card__btn"
                    >
                      <PenLine size={14} />
                      수정
                    </Link>
                    <button
                      type="button"
                      className="admin-card__btn admin-card__btn--danger"
                      onClick={() => deleteOne(poem.id, poem.title)}
                    >
                      <Trash size={14} />
                      삭제
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminHome
