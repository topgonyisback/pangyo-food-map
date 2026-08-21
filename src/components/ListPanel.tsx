"use client";

import { useMemo, useState } from "react";
import { Place, Review } from "@/types";
import { averageQuickRating, scoreToColor, scoreToLabel } from "@/lib/rating";
import PlaceCard from "./PlaceCard";

const ALL = "전체";

interface ListPanelProps {
  places: Place[];
  reviews: Review[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string | null) => void;
  onAddReview: (review: Omit<Review, "id" | "createdAt">) => void;
  onUpdateReview: (
    reviewId: string,
    patch: Pick<
      Review,
      "quickRating" | "atmosphereRating" | "restroomRating" | "freeComment" | "menuNotes"
    >
  ) => void;
  onDeleteReview: (reviewId: string) => void;
  onEditLocation: (placeId: string) => void;
  onUpdatePlace: (
    placeId: string,
    patch: Partial<Pick<Place, "name" | "category" | "naverMapUrl">>
  ) => void;
  onRequireLogin: () => void;
}

export default function ListPanel({
  places,
  reviews,
  selectedPlaceId,
  onSelectPlace,
  onAddReview,
  onUpdateReview,
  onDeleteReview,
  onEditLocation,
  onUpdatePlace,
  onRequireLogin,
}: ListPanelProps) {
  const [category, setCategory] = useState<string>(ALL);

  const categories = useMemo(
    () => [ALL, ...Array.from(new Set(places.map((p) => p.category)))],
    [places]
  );

  const filtered = useMemo(() => {
    const list = category === ALL ? places : places.filter((p) => p.category === category);
    return [...list].sort((a, b) => {
      const sa = averageQuickRating(reviews.filter((r) => r.placeId === a.id)) ?? -1;
      const sb = averageQuickRating(reviews.filter((r) => r.placeId === b.id)) ?? -1;
      return sb - sa;
    });
  }, [places, reviews, category]);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;
  // 선택된 가게가 현재 카테고리 목록에 없으면 상세는 열지 않음(카테고리 전환 시 자연스럽게 닫힘)
  const showDetail = selectedPlace && (category === ALL || selectedPlace.category === category);

  return (
    <div className="pointer-events-none absolute inset-x-2 top-16 bottom-2 z-10 flex gap-2 overflow-x-auto sm:inset-x-auto sm:left-3">
      {/* 1단: 카테고리 LNB */}
      <div className="pointer-events-auto flex h-full w-20 shrink-0 flex-col overflow-y-auto rounded-2xl bg-white/95 py-1.5 shadow-lg ring-1 ring-black/5 backdrop-blur sm:w-28">
        {categories.map((cat) => {
          const active = cat === category;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`mx-1.5 my-0.5 rounded-lg px-2 py-2 text-left text-sm font-medium transition ${
                active
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 2단: 가게 목록 */}
      <div className="pointer-events-auto flex h-full w-56 shrink-0 flex-col overflow-y-auto rounded-2xl bg-white/95 p-2 shadow-lg ring-1 ring-black/5 backdrop-blur sm:w-64">
        <p className="px-1 pb-1 text-xs font-semibold text-gray-400">
          {category} · {filtered.length}곳
        </p>
        {filtered.length === 0 ? (
          <p className="px-1 py-4 text-sm text-gray-400">등록된 가게가 없어요.</p>
        ) : (
          <ul className="space-y-1.5">
            {filtered.map((place) => {
              const placeReviews = reviews.filter((r) => r.placeId === place.id);
              const score = averageQuickRating(placeReviews);
              const active = place.id === selectedPlaceId;
              return (
                <li key={place.id}>
                  <button
                    type="button"
                    onClick={() => onSelectPlace(place.id)}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border p-2.5 text-left transition ${
                      active
                        ? "border-orange-400 bg-orange-50"
                        : "border-gray-100 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-blue-600">{place.category}</p>
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {place.name}
                      </p>
                      <p className="text-[11px] text-gray-400">평가 {placeReviews.length}건</p>
                    </div>
                    <span
                      className="shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: scoreToColor(score) }}
                    >
                      {scoreToLabel(score)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 3단: 상세 + 평가 */}
      {showDetail && selectedPlace && (
        <div className="pointer-events-auto h-full w-[20rem] shrink-0 overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5 sm:w-96">
          <PlaceCard
            place={selectedPlace}
            reviews={reviews.filter((r) => r.placeId === selectedPlace.id)}
            onAddReview={onAddReview}
            onUpdateReview={onUpdateReview}
            onDeleteReview={onDeleteReview}
            onClose={() => onSelectPlace(null)}
            onEditLocation={() => onEditLocation(selectedPlace.id)}
            onUpdatePlace={onUpdatePlace}
            onRequireLogin={onRequireLogin}
          />
        </div>
      )}
    </div>
  );
}
