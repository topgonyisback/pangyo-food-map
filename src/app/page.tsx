"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import ListView from "@/components/ListView";
import { usePlaces } from "@/hooks/usePlaces";
import { useReviews } from "@/hooks/useReviews";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import { PinMode } from "@/types";

type ViewMode = "map" | "list";

export default function Home() {
  const [view, setView] = useState<ViewMode>("map");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState<PinMode>(null);
  const { places, addPlace, updatePlaceLocation, updatePlace } = usePlaces();
  const { reviews, addReview } = useReviews();
  const hydrated = useIsHydrated();

  function startAddingPlace() {
    setSelectedPlaceId(null);
    setView("map");
    setPinMode({ type: "add" });
  }

  function startEditingLocation(placeId: string) {
    setView("map");
    setPinMode({ type: "edit", placeId });
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5">
        <h1 className="text-base font-bold text-gray-900">🍚 판교 점심 지도</h1>
        <div className="flex overflow-hidden rounded-full border border-gray-200">
          <button
            type="button"
            onClick={() => setView("map")}
            className={`px-4 py-1.5 text-sm font-medium ${
              view === "map" ? "bg-blue-600 text-white" : "bg-white text-gray-600"
            }`}
          >
            지도
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`px-4 py-1.5 text-sm font-medium ${
              view === "list" ? "bg-blue-600 text-white" : "bg-white text-gray-600"
            }`}
          >
            리스트
          </button>
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        {!hydrated ? null : view === "map" ? (
          <MapView
            places={places}
            reviews={reviews}
            onAddReview={addReview}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={setSelectedPlaceId}
            pinMode={pinMode}
            onExitPinMode={() => setPinMode(null)}
            onStartEditLocation={startEditingLocation}
            onAddPlace={addPlace}
            onUpdatePlaceLocation={updatePlaceLocation}
            onUpdatePlace={updatePlace}
          />
        ) : (
          <ListView
            places={places}
            reviews={reviews}
            onAddReview={addReview}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={setSelectedPlaceId}
            onEditLocation={startEditingLocation}
            onUpdatePlace={updatePlace}
          />
        )}

        {hydrated && !pinMode && (
          <button
            type="button"
            onClick={startAddingPlace}
            className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg hover:bg-blue-700"
            aria-label="새 가게 추가"
          >
            +
          </button>
        )}
      </main>
    </div>
  );
}
