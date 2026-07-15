// data URL / objectURL 을 HTMLImageElement 로 로드
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'))
    img.src = src
  })
}

// 크롭 영역(원본 픽셀 좌표)만큼 잘라 JPEG data URL 로 반환.
// react-easy-crop 의 croppedAreaPixels 를 그대로 받는다.
export async function getCroppedImg(
  src: string,
  area: { x: number; y: number; width: number; height: number },
  max = 900,
  quality = 0.85,
): Promise<string> {
  const img = await loadImage(src)
  const scale = Math.min(1, max / Math.max(area.width, area.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(area.width * scale)
  canvas.height = Math.round(area.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas context 없음')
  ctx.drawImage(
    img,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    canvas.width,
    canvas.height,
  )
  return canvas.toDataURL('image/jpeg', quality)
}

// 파일을 (크롭 편집용) data URL 로 읽되, 지나치게 크면 축소해 로드 부담을 줄임
export function fileToEditableUrl(file: File, max = 1600, quality = 0.9) {
  return resizeImage(file, max, quality)
}

// 업로드 이미지를 캔버스로 축소해 JPEG data URL로 변환
// (Firestore 문서 1MB 제한 안에 들어오도록 크기를 줄임)
export function resizeImage(
  file: File,
  max = 1000,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > max || height > max) {
        if (width >= height) {
          height = Math.round((height * max) / width)
          width = max
        } else {
          width = Math.round((width * max) / height)
          height = max
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas context 없음'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('이미지를 불러오지 못했습니다.'))
    }
    img.src = url
  })
}
