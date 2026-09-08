// 사진 저장소: Cloudinary (무료 티어, 카드 불필요)
// - 업로드: 브라우저에서 압축 후 unsigned preset으로 직접 업로드
// - 삭제: 서버 키가 필요해 /api/photo/delete 라우트를 통해 처리(본인 사진만)
import { auth } from "./firebase";
import { compressImage } from "./image";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
const NOT_READY = "사진 저장소 설정이 아직 안 됐어요. 관리자에게 알려주세요.";
const UPLOAD_FAIL = "사진 업로드에 실패했어요. 잠시 후 다시 시도해주세요.";

export function isCloudinaryUrl(url: string): boolean {
  return /res\.cloudinary\.com\/[^/]+\/image\/upload\//.test(url);
}

// 리뷰 사진 업로드 → 원본(압축본) URL 배열. public_id에 uid를 넣어 소유자 판별에 사용.
export async function uploadReviewPhotos(files: File[], uid: string): Promise<string[]> {
  if (files.length === 0) return [];
  if (!CLOUD || !PRESET) throw new Error(NOT_READY);
  const stamp = Date.now();
  const urls: string[] = [];
  for (let i = 0; i < files.length; i++) {
    const blob = await compressImage(files[i]);
    const form = new FormData();
    form.append("file", blob, `${stamp}-${i}.jpg`);
    form.append("upload_preset", PRESET);
    form.append("public_id", `reviews/${uid}/${stamp}-${i}`);
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw new Error(UPLOAD_FAIL);
    const data = (await res.json()) as { secure_url?: string };
    if (!data.secure_url) throw new Error(UPLOAD_FAIL);
    urls.push(data.secure_url);
  }
  return urls;
}

// 사진 삭제 (best-effort): 로그인 토큰과 함께 서버 라우트에 요청, 서버가 본인 것만 지움
export async function deletePhotoUrls(urls: string[]): Promise<void> {
  const targets = urls.filter(isCloudinaryUrl);
  if (targets.length === 0 || !auth?.currentUser) return;
  try {
    const idToken = await auth.currentUser.getIdToken();
    await fetch("/api/photo/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls: targets, idToken }),
    });
  } catch {
    // 정리 실패는 무시
  }
}

// 썸네일 URL: Cloudinary 변환(정방형 crop + 자동 포맷/품질)을 /upload/ 뒤에 삽입
export function thumbUrl(url: string, size = 160): string {
  if (!isCloudinaryUrl(url)) return url;
  return url.replace("/image/upload/", `/image/upload/c_fill,w_${size},h_${size},f_auto,q_auto/`);
}
