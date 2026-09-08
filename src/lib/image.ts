// 업로드 전 브라우저에서 이미지 최적화: 긴 변 1280px, JPEG, 300KB 이하 목표.
// canvas로 다시 그리기 때문에 EXIF(위치정보 등)는 자동 제거되고, 회전은 imageOrientation으로 보정.

export const MAX_PHOTOS_PER_REVIEW = 5;
const MAX_INPUT_BYTES = 10 * 1024 * 1024; // 10MB 초과 원본은 거절
const MAX_EDGE = 1280;
const TARGET_BYTES = 300 * 1024;

export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "이미지 파일만 올릴 수 있어요.";
  if (file.size > MAX_INPUT_BYTES) return "10MB 이하 사진만 올릴 수 있어요.";
  return null;
}

async function loadBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return await createImageBitmap(file);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("이미지 변환에 실패했어요."))),
      "image/jpeg",
      quality
    );
  });
}

export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지 처리를 지원하지 않는 브라우저예요.");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();

  // 품질을 낮춰가며 목표 용량 맞추기 (최소 0.5)
  let quality = 0.8;
  let blob = await canvasToBlob(canvas, quality);
  while (blob.size > TARGET_BYTES && quality > 0.5) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, quality);
  }
  return blob;
}
