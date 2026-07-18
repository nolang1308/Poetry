import { useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, ADMIN_EMAILS } from '../firebase'
import {
  subscribeComments,
  addComment,
  updateComment,
  deleteComment,
  MAX_COMMENT_NICKNAME,
  MAX_COMMENT_CONTENT,
  type CommentDoc,
} from '../data/commentsRepo'
import AutoTextarea from './AutoTextarea'
import './PoemComments.scss'

// 다음에 또 댓글을 쓸 때를 위해 이름을 기억해 둔다
const NICK_KEY = 'comment-nickname'

function loadNickname(): string {
  try {
    return localStorage.getItem(NICK_KEY) ?? ''
  } catch {
    return ''
  }
}

function formatTime(ms: number): string {
  if (!ms) return ''
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 시 상세 하단의 게스트 댓글 (웹/모바일 공용).
// 작성은 누구나(익명 로그인), 수정은 본인만, 삭제는 본인 또는 관리자.
function PoemComments({ poemId }: { poemId: string }) {
  const [comments, setComments] = useState<CommentDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null)
  const [isAdmin, setIsAdmin] = useState(false)

  const [nickname, setNickname] = useState(loadNickname)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    setLoading(true)
    setEditingId(null)
    return subscribeComments(poemId, (list) => {
      setComments(list)
      setLoading(false)
    })
  }, [poemId])

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null)
      setIsAdmin(!!u && !u.isAnonymous && ADMIN_EMAILS.includes(u.email ?? ''))
    })
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) {
      setError('이름을 입력해 주세요.')
      return
    }
    if (!content.trim()) {
      setError('댓글 내용을 입력해 주세요.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      localStorage.setItem(NICK_KEY, nickname.trim())
    } catch {
      // 이름 기억 실패는 무시 (등록은 그대로 진행)
    }
    try {
      await addComment(poemId, nickname, content)
      setContent('')
    } catch {
      setError('댓글 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
    setSubmitting(false)
  }

  const startEdit = (c: CommentDoc) => {
    setEditingId(c.id)
    setEditContent(c.content)
  }

  const saveEdit = async (id: string) => {
    if (!editContent.trim()) return
    try {
      await updateComment(id, editContent)
      setEditingId(null)
    } catch {
      window.alert('수정에 실패했습니다.')
    }
  }

  const remove = async (id: string) => {
    if (!window.confirm('이 댓글을 삭제할까요?')) return
    try {
      await deleteComment(id)
    } catch {
      window.alert('삭제에 실패했습니다.')
    }
  }

  return (
    <section className="poem-comments">
      <div className="poem-comments__heading">
        <h2 className="poem-comments__title">댓글</h2>
        {!loading && (
          <span className="poem-comments__count">{comments.length}</span>
        )}
        <span className="poem-comments__head-rule" />
      </div>

      <form className="poem-comments__form" onSubmit={onSubmit}>
        <input
          className="poem-comments__nickname"
          type="text"
          placeholder="이름"
          maxLength={MAX_COMMENT_NICKNAME}
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <AutoTextarea
          className="poem-comments__input"
          placeholder="이 시를 읽고 든 마음을 남겨 주세요."
          maxLength={MAX_COMMENT_CONTENT}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <div className="poem-comments__form-foot">
          {error ? (
            <span className="poem-comments__error">{error}</span>
          ) : (
            <span className="poem-comments__hint">
              {content.length}/{MAX_COMMENT_CONTENT}
            </span>
          )}
          <button
            type="submit"
            className="poem-comments__submit"
            disabled={submitting}
          >
            {submitting ? '등록 중…' : '댓글 남기기'}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="poem-comments__empty">댓글을 불러오는 중…</p>
      ) : comments.length === 0 ? (
        <p className="poem-comments__empty">
          아직 댓글이 없습니다. 첫 마음을 남겨 보세요.
        </p>
      ) : (
        <ul className="poem-comments__list">
          {comments.map((c) => {
            const mine = !!uid && uid === c.authorUid
            const editing = editingId === c.id
            return (
              <li key={c.id} className="poem-comments__item">
                <div className="poem-comments__item-head">
                  <span className="poem-comments__item-name">{c.nickname}</span>
                  <span className="poem-comments__item-time">
                    {formatTime(c.createdAt)}
                  </span>
                  {(mine || isAdmin) && !editing && (
                    <span className="poem-comments__item-actions">
                      {mine && (
                        <button
                          type="button"
                          className="poem-comments__item-btn"
                          onClick={() => startEdit(c)}
                        >
                          수정
                        </button>
                      )}
                      <button
                        type="button"
                        className="poem-comments__item-btn poem-comments__item-btn--danger"
                        onClick={() => remove(c.id)}
                      >
                        삭제
                      </button>
                    </span>
                  )}
                </div>

                {editing ? (
                  <div className="poem-comments__edit">
                    <AutoTextarea
                      className="poem-comments__input"
                      maxLength={MAX_COMMENT_CONTENT}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                    />
                    <div className="poem-comments__edit-btns">
                      <button
                        type="button"
                        className="poem-comments__item-btn"
                        onClick={() => setEditingId(null)}
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        className="poem-comments__item-btn poem-comments__item-btn--save"
                        onClick={() => saveEdit(c.id)}
                      >
                        저장
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="poem-comments__item-body">{c.content}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default PoemComments
