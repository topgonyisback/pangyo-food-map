"use client";

import { useEffect, useState } from "react";
import { Place } from "@/types";
import { DUMMY_PLACES } from "@/data/dummy-places";
import { loadPlaces, savePlaces } from "@/lib/storage";

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>(() => loadPlaces() ?? DUMMY_PLACES);

  useEffect(() => {
    savePlaces(places);
  }, [places]);

  function addPlace(place: Omit<Place, "id">): Place {
    const newPlace: Place = {
      ...place,
      id: `place-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    setPlaces((prev) => [...prev, newPlace]);
    return newPlace;
  }

  function updatePlaceLocation(placeId: string, coords: { lat: number; lng: number }) {
    setPlaces((prev) => prev.map((p) => (p.id === placeId ? { ...p, ...coords } : p)));
  }

  function updatePlace(
    placeId: string,
    patch: Partial<Pick<Place, "name" | "category" | "naverMapUrl">>
  ) {
    setPlaces((prev) => prev.map((p) => (p.id === placeId ? { ...p, ...patch } : p)));
  }

  return { places, addPlace, updatePlaceLocation, updatePlace };
}
