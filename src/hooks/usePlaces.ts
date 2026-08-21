"use client";

import { useEffect, useState } from "react";
import { Place } from "@/types";
import { fetchPlaces, insertPlace, updatePlaceRow } from "@/lib/db";

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;
    fetchPlaces()
      .then((rows) => {
        if (active) setPlaces(rows);
      })
      .catch((e) => {
        console.error("가게 불러오기 실패:", e);
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function addPlace(place: Omit<Place, "id">): Promise<Place> {
    const created = await insertPlace(place);
    setPlaces((prev) => [...prev, created]);
    return created;
  }

  function updatePlaceLocation(placeId: string, coords: { lat: number; lng: number }) {
    setPlaces((prev) => prev.map((p) => (p.id === placeId ? { ...p, ...coords } : p)));
    updatePlaceRow(placeId, coords).catch((e) => console.error("위치 저장 실패:", e));
  }

  function updatePlace(
    placeId: string,
    patch: Partial<Pick<Place, "name" | "category" | "naverMapUrl">>
  ) {
    setPlaces((prev) => prev.map((p) => (p.id === placeId ? { ...p, ...patch } : p)));
    updatePlaceRow(placeId, patch).catch((e) => console.error("정보 저장 실패:", e));
  }

  return { places, addPlace, updatePlaceLocation, updatePlace, loading, loadError };
}
