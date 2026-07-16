"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import ListView from "@/components/ListView";
import PickView from "@/components/PickView";
import { usePlaces } from "@/hooks/usePlaces";
import { useReviews } from "@/hooks/useReviews";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import { PinMode } from "@/types";

type ViewMode = "map" | "list" | "pick";

const TABS: { id: ViewMode; label: string }[] = [
  { id: "map", label: "지도" },
  { id: "list", label: "리스트" },
  { id: "pick", label: "오늘 뭐먹지?" },
];

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

  function goToPlaceOnMap(placeId: string) {
    setView("map");
    setSelectedPlaceId(placeId);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-4 py-2.5">
        <h1 className="shrink-0 text-base font-bold text-gray-900">🍚 판교 점심 지도</h1>
        <div className="flex overflow-hidden rounded-full border border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={`whitespace-nowrap px-3 py-1.5 text-sm font-medium ${
                view === tab.id ? "bg-blue-600 text-white" : "bg-white text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
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
        ) : view === "list" ? (
          <ListView
            places={places}
            reviews={reviews}
            onAddReview={addReview}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={setSelectedPlaceId}
            onEditLocation={startEditingLocation}
            onUpdatePlace={updatePlace}
          />
        ) : (
          <PickView places={places} reviews={reviews} onGoToPlace={goToPlaceOnMap} />
        )}

        {hydrated && !pinMode && view !== "pick" && (
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
