import { useCallback, useEffect, useState } from 'react'
import Cropper, { type Area, type MediaSize } from 'react-easy-crop'
import { getCroppedImg } from '../utils/image'
import './ImageCropper.scss'

interface Props {
  src: string // 편집할 원본 이미지 (data URL)
  onCancel: () => void
  onConfirm: (dataUrl: string) => void
}

// 카톡 프로필처럼 선택 가능한 크롭 비율. '원본'은 사진 고유 비율을 그대로 쓴다.
const ratioOptions = [
  { key: 'original', label: '원본', value: null },
  { key: '1:1', label: '1:1', value: 1 },
  { key: '3:4', label: '3:4', value: 3 / 4 },
  { key: '4:3', label: '4:3', value: 4 / 3 },
  { key: '9:16', label: '9:16', value: 9 / 16 },
  { key: '16:9', label: '16:9', value: 16 / 9 },
] as const

type RatioKey = (typeof ratioOptions)[number]['key']

// 인스타/카톡 프로필처럼 고정 프레임 안에서 사진을 드래그·확대해 위치를 맞추고
// 그 영역대로 크롭하는 모달.
function ImageCropper({ src, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [ratio, setRatio] = useState<RatioKey>('original')
  const [naturalAspect, setNaturalAspect] = useState<number | null>(null)
  const [areaPixels, setAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)

  const selected = ratioOptions.find((r) => r.key === ratio)!
  const aspect = selected.value ?? naturalAspect ?? 3 / 4

  const onMediaLoaded = useCallback((mediaSize: MediaSize) => {
    if (mediaSize.naturalHeight > 0) {
      setNaturalAspect(mediaSize.naturalWidth / mediaSize.naturalHeight)
    }
  }, [])

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setAreaPixels(pixels)
  }, [])

  // 비율을 바꾸면 위치·확대를 초기화해 새 프레임에 맞춘다
  const onRatio = (key: RatioKey) => {
    setRatio(key)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

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
          onMediaLoaded={onMediaLoaded}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="image-cropper__panel">
        <p className="image-cropper__hint">
          사진을 드래그해 위치를 맞추고, 슬라이더로 확대·축소하세요.
        </p>
        <div className="image-cropper__ratios" role="group" aria-label="크롭 비율">
          {ratioOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className={
                'image-cropper__ratio' +
                (ratio === option.key ? ' image-cropper__ratio--active' : '')
              }
              onClick={() => onRatio(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
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
