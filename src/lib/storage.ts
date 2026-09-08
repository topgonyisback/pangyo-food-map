import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";
import { compressImage } from "./image";

const CONNECT_FAIL = "사진 저장소에 연결하지 못했어요. 잠시 후 다시 시도해주세요.";

// 리뷰 사진 업로드: 압축 후 reviews/{uid}/{timestamp}-{i}.jpg 에 저장, 다운로드 URL 반환
export async function uploadReviewPhotos(files: File[], uid: string): Promise<string[]> {
  if (!storage) throw new Error(CONNECT_FAIL);
  const stamp = Date.now();
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const blob = await compressImage(files[i]);
    const path = `reviews/${uid}/${stamp}-${i}.jpg`;
    const r = ref(storage, path);
    await uploadBytes(r, blob, { contentType: "image/jpeg" });
    urls.push(await getDownloadURL(r));
  }
  return urls;
}

// 사진 삭제 (best-effort: 규칙상 본인 것만 지워지고, 실패해도 흐름은 계속)
export async function deletePhotoUrls(urls: string[]): Promise<void> {
  if (!storage || urls.length === 0) return;
  await Promise.all(
    urls.map(async (u) => {
      try {
        await deleteObject(ref(storage!, u));
      } catch {
        // 이미 없거나 권한 없음 → 무시
      }
    })
  );
}
