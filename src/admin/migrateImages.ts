import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { isDataUrl, uploadImageReplacing } from '../data/imageStorage'
import type { PoemDoc } from '../data/poems'
import type { BookDoc } from '../data/booksRepo'

let ran = false

// 예전 방식(base64가 Firestore 문서 안에 저장)으로 남아 있는 사진을
// Storage로 옮기고 문서에는 다운로드 URL만 남기는 일회성 정리.
// 관리자 화면에서 목록이 준비되면 뒤에서 조용히 실행된다.
// 이미 옮겨진 문서(URL)는 건너뛰므로 몇 번을 불러도 안전하다.
export async function migrateBase64Images(
  poems: PoemDoc[],
  books: BookDoc[],
): Promise<void> {
  if (ran) return
  ran = true

  // 한 편씩 차례로 — 업로드를 몰아치지 않아 화면 사용을 방해하지 않는다.
  // 개별 실패는 건너뛴다 (남은 문서는 다음 방문 때 다시 시도된다).
  for (const p of poems) {
    if (!isDataUrl(p.image)) continue
    try {
      const url = await uploadImageReplacing(`poems/${p.id}`, p.image)
      await updateDoc(doc(db, 'poems', p.id), { image: url })
    } catch {
      // 다음 방문 때 재시도
    }
  }

  for (const b of books) {
    const patch: Record<string, string> = {}
    try {
      if (isDataUrl(b.image)) {
        patch.image = await uploadImageReplacing(`books/${b.id}/cover`, b.image!)
      }
      if (isDataUrl(b.lastImage)) {
        patch.lastImage = await uploadImageReplacing(
          `books/${b.id}/last`,
          b.lastImage!,
        )
      }
      if (Object.keys(patch).length > 0) {
        await updateDoc(doc(db, 'books', b.id), patch)
      }
    } catch {
      // 다음 방문 때 재시도
    }
  }

  try {
    const snap = await getDoc(doc(db, 'settings', 'home'))
    const data = snap.data() ?? {}
    const patch: Record<string, string> = {}
    if (isDataUrl(data.webImage)) {
      patch.webImage = await uploadImageReplacing('home/web', data.webImage)
    }
    if (isDataUrl(data.mobileImage)) {
      patch.mobileImage = await uploadImageReplacing(
        'home/mobile',
        data.mobileImage,
      )
    }
    if (Object.keys(patch).length > 0) {
      await updateDoc(doc(db, 'settings', 'home'), patch)
    }
  } catch {
    // 다음 방문 때 재시도
  }
}
