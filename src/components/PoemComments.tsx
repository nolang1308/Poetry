import { useEffect, useMemo, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, ADMIN_EMAILS } from '../firebase'
import {
  subscribeComments,
  addComment,
  updateComment,
  deleteComment,
  buildCommentTree,
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

function saveNickname(name: string) {
  try {
    localStorage.setItem(NICK_KEY, name.trim())
  } catch {
    // 이름 기억 실패는 무시 (등록은 그대로 진행)
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
// 답글은 1단계까지만 — 답글에 다는 답글도 같은 원 댓글 아래에 나란히 붙는다.
function PoemComments({ poemId }: { poemId: string }) {
  const [comments, setComments] = useState<CommentDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null)
  const [isAdmin, setIsAdmin] = useState(false)

  // 이름은 원 댓글·답글 폼이 함께 쓴다 (한 번 입력하면 계속 유지)
  const [nickname, setNickname] = useState(loadNickname)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)

  const tree = useMemo(() => buildCommentTree(comments), [comments])

  useEffect(() => {
    setLoading(true)
    setEditingId(null)
    setReplyTo(null)
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

  const submitComment = async (content: string, parentId = '') => {
    saveNickname(nickname)
    await addComment(poemId, nickname, content, parentId)
  }

  const startEdit = (c: CommentDoc) => {
    setReplyTo(null)
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

  const remove = async (id: string, hasReplies: boolean) => {
    const message = hasReplies
      ? '이 댓글을 삭제할까요? 달려 있는 답글은 그대로 남습니다.'
      : '이 댓글을 삭제할까요?'
    if (!window.confirm(message)) return
    try {
      await deleteComment(id)
    } catch {
      window.alert('삭제에 실패했습니다.')
    }
  }

  // 원 댓글 / 답글이 공유하는 한 줄 렌더링
  const renderComment = (c: CommentDoc, rootId: string, hasReplies: boolean) => {
    const mine = !!uid && uid === c.authorUid
    const editing = editingId === c.id

    return (
      <>
        <div className="poem-comments__item-head">
          <span className="poem-comments__item-name">{c.nickname}</span>
          <span className="poem-comments__item-time">
            {formatTime(c.createdAt)}
          </span>
          {!editing && (
            <span className="poem-comments__item-actions">
              <button
                type="button"
                className="poem-comments__item-btn"
                onClick={() => {
                  setEditingId(null)
                  setReplyTo(replyTo === rootId ? null : rootId)
                }}
              >
                답글
              </button>
              {mine && (
                <button
                  type="button"
                  className="poem-comments__item-btn"
                  onClick={() => startEdit(c)}
                >
                  수정
                </button>
              )}
              {(mine || isAdmin) && (
                <button
                  type="button"
                  className="poem-comments__item-btn poem-comments__item-btn--danger"
                  onClick={() => remove(c.id, hasReplies)}
                >
                  삭제
                </button>
              )}
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
      </>
    )
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

      <CommentForm
        nickname={nickname}
        onNicknameChange={setNickname}
        onSubmit={(content) => submitComment(content)}
        placeholder="이 시를 읽고 든 마음을 남겨 주세요."
        submitLabel="댓글 남기기"
        noun="댓글"
      />

      {loading ? (
        <p className="poem-comments__empty">댓글을 불러오는 중…</p>
      ) : tree.length === 0 ? (
        <p className="poem-comments__empty">
          아직 댓글이 없습니다. 첫 마음을 남겨 보세요.
        </p>
      ) : (
        <ul className="poem-comments__list">
          {tree.map((node) => (
            <li key={node.id} className="poem-comments__item">
              {node.comment ? (
                renderComment(node.comment, node.id, node.replies.length > 0)
              ) : (
                // 원 댓글이 지워졌지만 답글이 남은 자리
                <p className="poem-comments__removed">삭제된 댓글입니다.</p>
              )}

              {node.replies.length > 0 && (
                <ul className="poem-comments__replies">
                  {node.replies.map((r) => (
                    <li key={r.id} className="poem-comments__reply">
                      {renderComment(r, node.id, false)}
                    </li>
                  ))}
                </ul>
              )}

              {replyTo === node.id && (
                <CommentForm
                  nickname={nickname}
                  onNicknameChange={setNickname}
                  onSubmit={async (content) => {
                    await submitComment(content, node.id)
                    setReplyTo(null)
                  }}
                  placeholder="답글을 남겨 주세요."
                  submitLabel="답글 남기기"
                  noun="답글"
                  reply
                  onCancel={() => setReplyTo(null)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

// 원 댓글·답글이 함께 쓰는 작성 폼.
// 이름은 부모가 들고 있고(공유), 입력 중인 내용·오류는 폼마다 따로 관리한다.
function CommentForm({
  nickname,
  onNicknameChange,
  onSubmit,
  placeholder,
  submitLabel,
  noun,
  reply = false,
  onCancel,
}: {
  nickname: string
  onNicknameChange: (v: string) => void
  onSubmit: (content: string) => Promise<void>
  placeholder: string
  submitLabel: string
  noun: string
  reply?: boolean
  onCancel?: () => void
}) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nickname.trim()) {
      setError('이름을 입력해 주세요.')
      return
    }
    if (!content.trim()) {
      setError(`${noun} 내용을 입력해 주세요.`)
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit(content)
      setContent('')
    } catch {
      setError(`${noun} 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.`)
    }
    setSubmitting(false)
  }

  return (
    <form
      className={
        'poem-comments__form' + (reply ? ' poem-comments__form--reply' : '')
      }
      onSubmit={submit}
    >
      <input
        className="poem-comments__nickname"
        type="text"
        placeholder="이름"
        maxLength={MAX_COMMENT_NICKNAME}
        value={nickname}
        onChange={(e) => onNicknameChange(e.target.value)}
      />
      <AutoTextarea
        className="poem-comments__input"
        placeholder={placeholder}
        maxLength={MAX_COMMENT_CONTENT}
        value={content}
        autoFocus={reply}
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
        <span className="poem-comments__form-btns">
          {onCancel && (
            <button
              type="button"
              className="poem-comments__item-btn"
              onClick={onCancel}
            >
              취소
            </button>
          )}
          <button
            type="submit"
            className="poem-comments__submit"
            disabled={submitting}
          >
            {submitting ? '등록 중…' : submitLabel}
          </button>
        </span>
      </div>
    </form>
  )
}

export default PoemComments
