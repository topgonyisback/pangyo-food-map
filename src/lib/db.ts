import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { MenuNote, Place, Review } from "@/types";
import { auth, db } from "./firebase";

const CONNECT_FAIL = "서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.";

function requireUserId(): string {
  const uid = auth?.currentUser?.uid;
  if (!uid) throw new Error("로그인이 필요합니다.");
  return uid;
}

// --- Firestore 문서 ↔ 앱 타입 매핑 ---

function toPlace(id: string, d: Record<string, unknown>): Place {
  return {
    id,
    name: (d.name as string) ?? "",
    category: (d.category as string) ?? "기타",
    lat: (d.lat as number) ?? 0,
    lng: (d.lng as number) ?? 0,
    naverMapUrl: (d.naverMapUrl as string) ?? "",
    userId: (d.userId as string) ?? null,
  };
}

function toReview(id: string, d: Record<string, unknown>): Review {
  return {
    id,
    placeId: (d.placeId as string) ?? "",
    authorName: (d.authorName as string) ?? "익명",
    quickRating: d.quickRating as Review["quickRating"],
    atmosphereRating: (d.atmosphereRating as Review["atmosphereRating"]) ?? undefined,
    restroomRating: (d.restroomRating as Review["restroomRating"]) ?? undefined,
    freeComment: (d.freeComment as string) ?? undefined,
    menuNotes: (d.menuNotes as MenuNote[]) ?? [],
    createdAt: (d.createdAt as string) ?? "",
    userId: (d.userId as string) ?? null,
  };
}

// --- Profiles (닉네임) ---

export async function fetchNickname(userId: string): Promise<string | null> {
  if (!db) return null;
  const snap = await getDoc(doc(db, "profiles", userId));
  return snap.exists() ? ((snap.data().nickname as string) ?? null) : null;
}

export async function isNicknameTaken(nickname: string): Promise<boolean> {
  if (!db) return false;
  const snap = await getDoc(doc(db, "nicknames", nickname.toLowerCase()));
  return snap.exists();
}

export async function insertProfile(userId: string, nickname: string): Promise<void> {
  if (!db) throw new Error(CONNECT_FAIL);
  // 닉네임 중복 방지용 예약 문서 + 프로필 문서
  await setDoc(doc(db, "nicknames", nickname.toLowerCase()), { uid: userId });
  await setDoc(doc(db, "profiles", userId), { nickname });
}

// --- Places ---

export async function fetchPlaces(): Promise<Place[]> {
  if (!db) return [];
  const snap = await getDocs(collection(db, "places"));
  return snap.docs.map((d) => toPlace(d.id, d.data()));
}

export async function insertPlace(place: Omit<Place, "id">): Promise<Place> {
  if (!db) throw new Error(CONNECT_FAIL);
  const userId = requireUserId();
  const payload = {
    name: place.name,
    category: place.category,
    lat: place.lat,
    lng: place.lng,
    naverMapUrl: place.naverMapUrl,
    userId,
    createdAt: new Date().toISOString(),
  };
  const ref = await addDoc(collection(db, "places"), payload);
  return toPlace(ref.id, payload);
}

export async function updatePlaceRow(
  placeId: string,
  patch: Partial<Pick<Place, "name" | "category" | "naverMapUrl" | "lat" | "lng">>
): Promise<void> {
  if (!db) throw new Error(CONNECT_FAIL);
  await updateDoc(doc(db, "places", placeId), { ...patch });
}

// --- Reviews ---

export async function fetchReviews(): Promise<Review[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, "reviews"), orderBy("createdAt", "asc")));
  return snap.docs.map((d) => toReview(d.id, d.data()));
}

export async function insertReview(
  review: Omit<Review, "id" | "createdAt">
): Promise<Review> {
  if (!db) throw new Error(CONNECT_FAIL);
  const userId = requireUserId();
  const payload = {
    placeId: review.placeId,
    authorName: review.authorName,
    quickRating: review.quickRating,
    atmosphereRating: review.atmosphereRating ?? null,
    restroomRating: review.restroomRating ?? null,
    freeComment: review.freeComment ?? null,
    menuNotes: review.menuNotes,
    userId,
    createdAt: new Date().toISOString(),
  };
  const ref = await addDoc(collection(db, "reviews"), payload);
  return toReview(ref.id, payload);
}

export async function updateReviewRow(
  reviewId: string,
  patch: Partial<
    Pick<
      Review,
      "quickRating" | "atmosphereRating" | "restroomRating" | "freeComment" | "menuNotes"
    >
  >
): Promise<void> {
  if (!db) throw new Error(CONNECT_FAIL);
  const dbPatch: Record<string, unknown> = {};
  if (patch.quickRating !== undefined) dbPatch.quickRating = patch.quickRating;
  if (patch.atmosphereRating !== undefined)
    dbPatch.atmosphereRating = patch.atmosphereRating ?? null;
  if (patch.restroomRating !== undefined)
    dbPatch.restroomRating = patch.restroomRating ?? null;
  if (patch.freeComment !== undefined) dbPatch.freeComment = patch.freeComment ?? null;
  if (patch.menuNotes !== undefined) dbPatch.menuNotes = patch.menuNotes;
  await updateDoc(doc(db, "reviews", reviewId), dbPatch);
}

export async function deleteReviewRow(reviewId: string): Promise<void> {
  if (!db) throw new Error(CONNECT_FAIL);
  await deleteDoc(doc(db, "reviews", reviewId));
}
