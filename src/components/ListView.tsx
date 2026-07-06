"use client";

import { Place, Review } from "@/types";
import { averageQuickRating, scoreToColor, scoreToLabel } from "@/lib/rating";
import PlaceCard from "./PlaceCard";

interface ListViewProps {
  places: Place[];
  reviews: Review[];
  onAddReview: (review: Omit<Review, "id" | "createdAt">) => void;
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string | null) => void;
  onEditLocation: (placeId: string) => void;
  onUpdatePlace: (
    placeId: string,
    patch: Partial<Pick<Place, "name" | "category" | "naverMapUrl">>
  ) => void;
}

export default function ListView({
  places,
  reviews,
  onAddReview,
  selectedPlaceId,
  onSelectPlace,
  onEditLocation,
  onUpdatePlace,
}: ListViewProps) {
  const sorted = [...places].sort((a, b) => {
    const scoreA = averageQuickRating(reviews.filter((r) => r.placeId === a.id)) ?? -1;
    const scoreB = averageQuickRating(reviews.filter((r) => r.placeId === b.id)) ?? -1;
    return scoreB - scoreA;
  });

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;

  return (
    <div className="relative h-full w-full overflow-y-auto bg-gray-50 p-3">
      <ul className="space-y-2">
        {sorted.map((place) => {
          const placeReviews = reviews.filter((r) => r.placeId === place.id);
          const score = averageQuickRating(placeReviews);
          return (
            <li key={place.id}>
              <button
                type="button"
                onClick={() => onSelectPlace(place.id)}
                className="flex w-full items-center justify-between rounded-xl bg-white p-4 text-left shadow-sm hover:shadow"
              >
                <div>
                  <p className="text-xs font-medium text-blue-600">{place.category}</p>
                  <p className="font-semibold text-gray-900">{place.name}</p>
                  <p className="text-xs text-gray-400">평가 {placeReviews.length}건</p>
                </div>
                <span
                  className="whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: scoreToColor(score) }}
                >
                  {scoreToLabel(score)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selectedPlace && (
        <div className="fixed inset-0 z-10 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-sm shadow-xl">
            <PlaceCard
              place={selectedPlace}
              reviews={reviews.filter((r) => r.placeId === selectedPlace.id)}
              onAddReview={onAddReview}
              onClose={() => onSelectPlace(null)}
              onEditLocation={() => onEditLocation(selectedPlace.id)}
              onUpdatePlace={onUpdatePlace}
            />
          </div>
        </div>
      )}
    </div>
  );
}
