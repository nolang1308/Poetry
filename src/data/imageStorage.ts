import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject,
  listAll,
  type StorageReference,
} from 'firebase/storage'
import { storage } from '../firebase'

// 폼에서 방금 올린(아직 Storage에 없는) 사진인지 — data URL 여부로 판단
export const isDataUrl = (s?: string) => Boolean(s && s.startsWith('data:'))

// data URL 사진을 지정 폴더에 올리고 다운로드 URL을 돌려준다.
// 같은 폴더에 있던 이전 파일들은 업로드 성공 후 지워서 폴더당 한 장만 남긴다.
// (파일명이 매번 달라야 교체 시 브라우저·CDN 캐시가 꼬이지 않는다)
export async function uploadImageReplacing(
  folder: string,
  dataUrl: string,
): Promise<string> {
  let old: StorageReference[] = []
  try {
    old = (await listAll(ref(storage, folder))).items
  } catch {
    // 목록 조회 실패는 무시 — 새 업로드는 그대로 진행
  }
  const fileRef = ref(storage, `${folder}/${Date.now()}.jpg`)
  await uploadString(fileRef, dataUrl, 'data_url')
  const url = await getDownloadURL(fileRef)
  await Promise.all(old.map((i) => deleteObject(i).catch(() => {})))
  return url
}

async function deleteFolderRec(r: StorageReference): Promise<void> {
  const { items, prefixes } = await listAll(r)
  await Promise.all([
    ...items.map((i) => deleteObject(i).catch(() => {})),
    ...prefixes.map((p) => deleteFolderRec(p)),
  ])
}

// 문서 삭제 시 딸린 사진 폴더까지 정리. 실패해도 문서 삭제 흐름은 막지 않는다.
export async function deleteImageFolder(folder: string) {
  try {
    await deleteFolderRec(ref(storage, folder))
  } catch {
    // 폴더가 없거나 권한 오류 — 조용히 통과
  }
}
