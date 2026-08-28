"use client";

import { useMemo, useState } from "react";
import { Place, Review } from "@/types";
import { averageQuickRating, scoreToColor, scoreToFiveText } from "@/lib/rating";
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
  onDeletePlace: (placeId: string) => void;
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
  onDeletePlace,
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
    <div className="pointer-events-none absolute inset-x-2 top-16 bottom-2 z-30 flex flex-col gap-2 sm:inset-x-auto sm:bottom-auto sm:left-3 sm:flex-row sm:items-start sm:overflow-x-visible">
      {/* 1단: 카테고리 — 모바일은 가로 칩, 데스크톱은 세로 LNB */}
      <div className="pointer-events-auto flex shrink-0 gap-1 overflow-x-auto rounded-2xl bg-white/95 p-1.5 shadow-lg ring-1 ring-black/5 backdrop-blur sm:max-h-[calc(100dvh-5rem)] sm:w-28 sm:flex-col sm:overflow-y-auto sm:py-1.5">
        {categories.map((cat) => {
          const active = cat === category;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition sm:mx-1.5 sm:my-0.5 sm:px-2 sm:py-2 sm:text-left ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 2단: 가게 목록 — 모바일은 남은 높이 채우고 세로 스크롤 */}
      <div className="pointer-events-auto flex min-h-0 flex-1 flex-col overflow-y-auto rounded-2xl bg-white/95 p-2 shadow-lg ring-1 ring-black/5 backdrop-blur sm:max-h-[calc(100dvh-5rem)] sm:w-64 sm:flex-none">
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
                        ? "border-blue-400 bg-blue-50"
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
                      className="shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                      style={{ backgroundColor: scoreToColor(score) }}
                    >
                      {scoreToFiveText(score)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 3단: 상세 + 평가 — 모바일은 전체화면 오버레이, 데스크톱은 3번째 컬럼 */}
      {showDetail && selectedPlace && (
        <div className="pointer-events-auto fixed inset-0 z-40 overflow-y-auto bg-white sm:relative sm:inset-auto sm:z-auto sm:max-h-[calc(100dvh-5rem)] sm:w-96 sm:shrink-0 sm:rounded-2xl sm:shadow-xl sm:ring-1 sm:ring-black/5">
          <PlaceCard
            key={selectedPlace.id}
            place={selectedPlace}
            reviews={reviews.filter((r) => r.placeId === selectedPlace.id)}
            onAddReview={onAddReview}
            onUpdateReview={onUpdateReview}
            onDeleteReview={onDeleteReview}
            onClose={() => onSelectPlace(null)}
            onEditLocation={() => onEditLocation(selectedPlace.id)}
            onUpdatePlace={onUpdatePlace}
            onDeletePlace={onDeletePlace}
            onRequireLogin={onRequireLogin}
          />
        </div>
      )}
    </div>
  );
}
