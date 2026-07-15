import { useCallback, useEffect, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { getCroppedImg } from '../utils/image'
import './ImageCropper.scss'

interface Props {
  src: string // 편집할 원본 이미지 (data URL)
  aspect?: number // 크롭 비율 (기본 3:4 표지)
  onCancel: () => void
  onConfirm: (dataUrl: string) => void
}

// 인스타/카톡 프로필처럼 고정 프레임 안에서 사진을 드래그·확대해 위치를 맞추고
// 그 영역대로 크롭하는 모달.
function ImageCropper({ src, aspect = 3 / 4, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [areaPixels, setAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setAreaPixels(pixels)
  }, [])

  // ESC로 취소
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const confirm = async () => {
    if (!areaPixels) return
    setSaving(true)
    try {
      const dataUrl = await getCroppedImg(src, areaPixels)
      onConfirm(dataUrl)
    } catch {
      setSaving(false)
    }
  }

  return (
    <div className="image-cropper" role="dialog" aria-modal="true">
      <div className="image-cropper__stage">
        <Cropper
          image={src}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          minZoom={1}
          maxZoom={4}
          restrictPosition
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="image-cropper__panel">
        <p className="image-cropper__hint">
          사진을 드래그해 위치를 맞추고, 슬라이더로 확대·축소하세요.
        </p>
        <div className="image-cropper__zoom">
          <span className="image-cropper__zoom-label">축소</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="image-cropper__zoom-range"
            aria-label="확대·축소"
          />
          <span className="image-cropper__zoom-label">확대</span>
        </div>
        <div className="image-cropper__actions">
          <button
            type="button"
            className="image-cropper__btn image-cropper__btn--ghost"
            onClick={onCancel}
          >
            취소
          </button>
          <button
            type="button"
            className="image-cropper__btn image-cropper__btn--primary"
            onClick={confirm}
            disabled={saving || !areaPixels}
          >
            {saving ? '적용 중…' : '적용'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ImageCropper
