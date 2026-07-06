import { MenuNote, Place, Review, ThreeTier } from "@/types";
import { supabase } from "./supabase";

// --- DB row 형태 (snake_case) ↔ 앱 타입 (camelCase) 매핑 ---

interface PlaceRow {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  naver_map_url: string;
}

interface ReviewRow {
  id: string;
  place_id: string;
  author_name: string;
  quick_rating: ThreeTier;
  atmosphere_rating: ThreeTier | null;
  restroom_rating: ThreeTier | null;
  free_comment: string | null;
  menu_notes: MenuNote[] | null;
  created_at: string;
}

function rowToPlace(r: PlaceRow): Place {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    lat: r.lat,
    lng: r.lng,
    naverMapUrl: r.naver_map_url,
  };
}

function rowToReview(r: ReviewRow): Review {
  return {
    id: r.id,
    placeId: r.place_id,
    authorName: r.author_name,
    quickRating: r.quick_rating,
    atmosphereRating: r.atmosphere_rating ?? undefined,
    restroomRating: r.restroom_rating ?? undefined,
    freeComment: r.free_comment ?? undefined,
    menuNotes: r.menu_notes ?? [],
    createdAt: r.created_at,
  };
}

// --- Places ---

export async function fetchPlaces(): Promise<Place[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("places").select("*");
  if (error) throw error;
  return (data as PlaceRow[]).map(rowToPlace);
}

export async function insertPlace(place: Omit<Place, "id">): Promise<Place> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("places")
    .insert({
      name: place.name,
      category: place.category,
      lat: place.lat,
      lng: place.lng,
      naver_map_url: place.naverMapUrl,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToPlace(data as PlaceRow);
}

export async function updatePlaceRow(
  placeId: string,
  patch: Partial<Pick<Place, "name" | "category" | "naverMapUrl" | "lat" | "lng">>
): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.category !== undefined) dbPatch.category = patch.category;
  if (patch.naverMapUrl !== undefined) dbPatch.naver_map_url = patch.naverMapUrl;
  if (patch.lat !== undefined) dbPatch.lat = patch.lat;
  if (patch.lng !== undefined) dbPatch.lng = patch.lng;
  const { error } = await supabase.from("places").update(dbPatch).eq("id", placeId);
  if (error) throw error;
}

// --- Reviews ---

export async function fetchReviews(): Promise<Review[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as ReviewRow[]).map(rowToReview);
}

export async function insertReview(
  review: Omit<Review, "id" | "createdAt">
): Promise<Review> {
  if (!supabase) throw new Error("Supabase not configured");
  const { data, error } = await supabase
    .from("reviews")
    .insert({
      place_id: review.placeId,
      author_name: review.authorName,
      quick_rating: review.quickRating,
      atmosphere_rating: review.atmosphereRating ?? null,
      restroom_rating: review.restroomRating ?? null,
      free_comment: review.freeComment ?? null,
      menu_notes: review.menuNotes,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToReview(data as ReviewRow);
}
