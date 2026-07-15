import { useRef } from 'react'
import { useEditor, useEditorState, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle, FontSize, FontFamily } from '@tiptap/extension-text-style'
import ImageResize from 'tiptap-extension-resize-image'
import { resizeImage } from '../utils/image'
import { Bold, Italic, AlignLeft, AlignCenter, AlignRight, Image as ImageIcon } from './icons'
import './RichEditor.scss'

interface Props {
  value: string
  onChange: (html: string) => void
}

// 시 내용 폰트 프리셋 (빈 값 = 사이트 기본인 꾹꾹체) — 로드된 폰트와 맞춘다
const FONT_FAMILIES = [
  { label: '기본 (꾹꾹체)', value: '' },
  { label: '명조', value: "'Nanum Myeongjo', serif" },
  { label: '고딕', value: "'Noto Sans KR', sans-serif" },
  { label: '고운 바탕', value: "'Gowun Batang', serif" },
  { label: '고운 돋움', value: "'Gowun Dodum', sans-serif" },
  { label: '손글씨', value: "'Nanum Pen Script', cursive" },
]

// 시 내용 글자 크기 프리셋 (빈 값 = 기본 16px)
const FONT_SIZES = [
  { label: '작게', value: '14px' },
  { label: '보통', value: '' },
  { label: '조금 크게', value: '18px' },
  { label: '크게', value: '22px' },
  { label: '아주 크게', value: '28px' },
]

// 글 흐름 속에 사진을 삽입하고(드래그로 크기 조절·정렬 가능) 굵게/기울임/문단
// 정렬을 지원하는 리치 텍스트 에디터. content는 HTML 문자열로 오간다.
function RichEditor({ value, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontSize,
      FontFamily,
      // 삽입된 이미지를 드래그로 리사이즈 + 좌/가운데/우 정렬
      ImageResize.configure({ inline: false }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    // 상세/미리보기와 동일한 타이포 클래스를 편집 영역에도 적용
    editorProps: { attributes: { class: 'poem-prose' } },
  })

  // 툴바 활성 상태(굵게/정렬 등)를 선택 변경에 맞춰 갱신
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive('bold') ?? false,
      italic: editor?.isActive('italic') ?? false,
      left: editor?.isActive({ textAlign: 'left' }) ?? false,
      center: editor?.isActive({ textAlign: 'center' }) ?? false,
      right: editor?.isActive({ textAlign: 'right' }) ?? false,
      fontSize: (editor?.getAttributes('textStyle')?.fontSize as string) ?? '',
      fontFamily:
        (editor?.getAttributes('textStyle')?.fontFamily as string) ?? '',
    }),
  })

  if (!editor) return null

  const pickImage = () => fileRef.current?.click()

  const onFontSize = (value: string) => {
    if (value) editor.chain().focus().setFontSize(value).run()
    else editor.chain().focus().unsetFontSize().run()
  }

  const onFontFamily = (value: string) => {
    if (value) editor.chain().focus().setFontFamily(value).run()
    else editor.chain().focus().unsetFontFamily().run()
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // 같은 파일 다시 선택 가능하도록 초기화
    if (!file || !file.type.startsWith('image/')) return
    try {
      const dataUrl = await resizeImage(file)
      editor.chain().focus().setImage({ src: dataUrl }).run()
    } catch {
      // 이미지 로드 실패는 조용히 무시 (사용자가 다시 시도)
    }
  }

  return (
    <div className="rich-editor">
      <div className="rich-editor__toolbar">
        <button
          type="button"
          className={'rich-editor__btn' + (state?.bold ? ' rich-editor__btn--on' : '')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          aria-label="굵게"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          className={'rich-editor__btn' + (state?.italic ? ' rich-editor__btn--on' : '')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          aria-label="기울임"
        >
          <Italic size={16} />
        </button>

        <span className="rich-editor__divider" />

        <select
          className="rich-editor__select"
          value={state?.fontFamily ?? ''}
          onChange={(e) => onFontFamily(e.target.value)}
          aria-label="폰트"
        >
          {FONT_FAMILIES.map((f) => (
            <option
              key={f.label}
              value={f.value}
              style={f.value ? { fontFamily: f.value } : undefined}
            >
              {f.label}
            </option>
          ))}
        </select>

        <select
          className="rich-editor__select"
          value={state?.fontSize ?? ''}
          onChange={(e) => onFontSize(e.target.value)}
          aria-label="글자 크기"
        >
          {FONT_SIZES.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        <span className="rich-editor__divider" />

        <button
          type="button"
          className={'rich-editor__btn' + (state?.left ? ' rich-editor__btn--on' : '')}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          aria-label="왼쪽 정렬"
        >
          <AlignLeft size={16} />
        </button>
        <button
          type="button"
          className={'rich-editor__btn' + (state?.center ? ' rich-editor__btn--on' : '')}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          aria-label="가운데 정렬"
        >
          <AlignCenter size={16} />
        </button>
        <button
          type="button"
          className={'rich-editor__btn' + (state?.right ? ' rich-editor__btn--on' : '')}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          aria-label="오른쪽 정렬"
        >
          <AlignRight size={16} />
        </button>

        <span className="rich-editor__divider" />

        <button
          type="button"
          className="rich-editor__btn"
          onClick={pickImage}
          aria-label="사진 삽입"
        >
          <ImageIcon size={16} />
          <span className="rich-editor__btn-text">사진</span>
        </button>
      </div>

      <EditorContent editor={editor} className="rich-editor__content" />

      <input
        type="file"
        accept="image/*"
        ref={fileRef}
        onChange={onFile}
        hidden
      />
    </div>
  )
}

export default RichEditor
