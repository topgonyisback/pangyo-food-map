import { Place, Review } from "@/types";

const STORAGE_KEY = "pangyo-lunch-reviews";
const AUTHOR_KEY = "pangyo-lunch-author-name";
const PLACES_KEY = "pangyo-lunch-places";

export function loadReviews(): Review[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Review[]) : [];
  } catch {
    return [];
  }
}

export function saveReviews(reviews: Review[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
}

export function getAuthorName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(AUTHOR_KEY) ?? "";
}

export function setAuthorName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTHOR_KEY, name);
}

export function loadPlaces(): Place[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PLACES_KEY);
    return raw ? (JSON.parse(raw) as Place[]) : null;
  } catch {
    return null;
  }
}

export function savePlaces(places: Place[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLACES_KEY, JSON.stringify(places));
}
