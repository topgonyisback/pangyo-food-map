import { createHash } from "crypto";

// Cloudinary 사진 삭제 (서명 필요 → 서버에서만). 요청자의 Firebase 토큰을 검증해 본인 사진만 지움.
const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const FB_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// https://res.cloudinary.com/<cloud>/image/upload/v123/reviews/<uid>/<name>.jpg → reviews/<uid>/<name>
function publicIdFromUrl(url: string): string | null {
  const marker = "/image/upload/";
  const i = url.indexOf(marker);
  if (i < 0) return null;
  let rest = url.slice(i + marker.length).split(/[?#]/)[0];
  rest = rest.replace(/^v\d+\//, "");
  rest = rest.replace(/\.[a-zA-Z0-9]+$/, "");
  return rest.startsWith("reviews/") ? rest : null;
}

async function verifyUid(idToken: string): Promise<string | null> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FB_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!res.ok) return null;
  const data = (await res.json()) as { users?: { localId?: string }[] };
  return data.users?.[0]?.localId ?? null;
}

export async function POST(req: Request) {
  if (!CLOUD || !API_KEY || !API_SECRET || !FB_KEY) {
    return Response.json({ error: "사진 저장소 서버 설정이 없어요." }, { status: 500 });
  }

  let body: { urls?: unknown; idToken?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "잘못된 요청" }, { status: 400 });
  }
  const urls = Array.isArray(body.urls) ? (body.urls as unknown[]).filter((u) => typeof u === "string") : [];
  const idToken = typeof body.idToken === "string" ? body.idToken : "";
  if (urls.length === 0 || !idToken) {
    return Response.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const uid = await verifyUid(idToken);
  if (!uid) return Response.json({ error: "로그인이 필요해요." }, { status: 401 });

  const results: { url: string; ok: boolean; reason?: string }[] = [];
  for (const url of (urls as string[]).slice(0, 20)) {
    const publicId = publicIdFromUrl(url);
    if (!publicId || !publicId.startsWith(`reviews/${uid}/`)) {
      results.push({ url, ok: false, reason: "forbidden" });
      continue;
    }
    const timestamp = Math.floor(Date.now() / 1000);
    // Cloudinary 서명: 파라미터를 키순으로 정렬해 '&'로 이어 붙인 뒤 secret을 덧붙여 SHA-1
    const signature = createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
      .digest("hex");
    const form = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      api_key: API_KEY,
      signature,
    });
    try {
      const r = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/destroy`, {
        method: "POST",
        body: form,
      });
      const j = (await r.json().catch(() => ({}))) as { result?: string };
      results.push({ url, ok: r.ok && (j.result === "ok" || j.result === "not found") });
    } catch {
      results.push({ url, ok: false, reason: "network" });
    }
  }
  return Response.json({ results });
}
