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
