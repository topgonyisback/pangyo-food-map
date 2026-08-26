"use client";

import { useEffect, useRef, useState } from "react";
import { Place, PinMode, Review } from "@/types";
import { useNaverMapsScript } from "@/hooks/useNaverMapsScript";
import { averageQuickRating, scoreToColor } from "@/lib/rating";
import PlaceCard from "./PlaceCard";
import AddPlaceForm from "./AddPlaceForm";

// 아이스크림미디어(판교역로 225-20 시공빌딩)를 초기 지도 중심으로
const PANGYO_CENTER = { lat: 37.4001063, lng: 127.1080857 };

interface MapViewProps {
  places: Place[];
  reviews: Review[];
  onAddReview: (review: Omit<Review, "id" | "createdAt">) => void;
  onUpdateReview: (
    reviewId: string,
    patch: Pick<
      Review,
      "quickRating" | "atmosphereRating" | "restroomRating" | "freeComment" | "menuNotes"
    >
  ) => void;
  onDeleteReview: (reviewId: string) => void;
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string | null) => void;
  pinMode: PinMode;
  onExitPinMode: () => void;
  onStartEditLocation: (placeId: string) => void;
  onAddPlace: (place: Omit<Place, "id">) => Promise<Place>;
  onUpdatePlaceLocation: (placeId: string, coords: { lat: number; lng: number }) => void;
  onUpdatePlace: (
    placeId: string,
    patch: Partial<Pick<Place, "name" | "category" | "naverMapUrl">>
  ) => void;
  onRequireLogin: () => void;
  renderCard?: boolean;
  centerOnSelect?: boolean;
  focusNonce?: number;
}

export default function MapView({
  places,
  reviews,
  onAddReview,
  onUpdateReview,
  onDeleteReview,
  selectedPlaceId,
  onSelectPlace,
  pinMode,
  onExitPinMode,
  onStartEditLocation,
  onAddPlace,
  onUpdatePlaceLocation,
  onUpdatePlace,
  onRequireLogin,
  renderCard = true,
  centerOnSelect = false,
  focusNonce = 0,
}: MapViewProps) {
  const status = useNaverMapsScript();
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<naver.maps.Map | null>(null);
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const pendingMarkerRef = useRef<naver.maps.Marker | null>(null);
  const highlightRef = useRef<naver.maps.Marker | null>(null);
  const tooltipRef = useRef<naver.maps.InfoWindow | null>(null);
  const pinModeRef = useRef(pinMode);
  const closeRef = useRef<() => void>(() => {});
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );

  useEffect(() => {
    pinModeRef.current = pinMode;
  }, [pinMode]);

  useEffect(() => {
    if (status !== "loaded" || !mapDivRef.current || mapRef.current) return;
    mapRef.current = new window.naver.maps.Map(mapDivRef.current, {
      center: new window.naver.maps.LatLng(PANGYO_CENTER.lat, PANGYO_CENTER.lng),
      zoom: 16,
    });

    // hover 툴팁(상호명)용 InfoWindow (재사용)
    tooltipRef.current = new window.naver.maps.InfoWindow({
      content: "",
      borderWidth: 0,
      disableAnchor: true,
      backgroundColor: "transparent",
      pixelOffset: new window.naver.maps.Point(0, -6),
    });

    window.naver.maps.Event.addListener(mapRef.current, "click", (e: unknown) => {
      if (pinModeRef.current) {
        const coord = (e as naver.maps.PointerEvent).coord;
        setPendingLocation({ lat: coord.lat(), lng: coord.lng() });
        return;
      }
      // 핀 모드가 아닐 때 빈 지도 클릭 → 열려있는 상세 닫기
      closeRef.current();
    });
  }, [status]);

  // 최신 선택 상태를 클릭 핸들러에서 참조
  useEffect(() => {
    closeRef.current = () => {
      if (!pinModeRef.current && selectedPlaceId) onSelectPlace(null);
    };
  }, [selectedPlaceId, onSelectPlace]);

  // ESC: 핀(추가·위치수정) 모드 취소 / 열려있는 상세 닫기
  useEffect(() => {
    function onKey(ev: KeyboardEvent) {
      if (ev.key !== "Escape") return;
      if (pinMode) {
        setPendingLocation(null);
        onExitPinMode();
      } else if (selectedPlaceId) {
        onSelectPlace(null);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinMode, selectedPlaceId, onExitPinMode, onSelectPlace]);

  // 컨테이너 크기 변경(모바일 회전·주소창 노출/숨김·창 크기 변경) 시 지도 리사이즈
  useEffect(() => {
    if (status !== "loaded" || !mapRef.current || !mapDivRef.current) return;
    const el = mapDivRef.current;
    const trigger = () => {
      if (mapRef.current) window.naver.maps.Event.trigger(mapRef.current, "resize");
    };
    const ro = new ResizeObserver(trigger);
    ro.observe(el);
    window.addEventListener("resize", trigger);
    window.addEventListener("orientationchange", trigger);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", trigger);
      window.removeEventListener("orientationchange", trigger);
    };
  }, [status]);

  useEffect(() => {
    if (status !== "loaded" || !mapRef.current) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const editingPlaceId = pinMode?.type === "edit" ? pinMode.placeId : null;

    places
      .filter((place) => place.id !== editingPlaceId)
      .forEach((place) => {
        const placeReviews = reviews.filter((r) => r.placeId === place.id);
        const color = scoreToColor(averageQuickRating(placeReviews));

        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(place.lat, place.lng),
          map: mapRef.current!,
          icon: {
            content: `<div style="box-sizing:border-box;width:24px;height:24px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);cursor:pointer;"></div>`,
            anchor: new window.naver.maps.Point(12, 12),
          },
        });
        window.naver.maps.Event.addListener(marker, "click", () => onSelectPlace(place.id));

        // hover 시 상호명 툴팁
        const safeName = place.name
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
        window.naver.maps.Event.addListener(marker, "mouseover", () => {
          if (pinModeRef.current || !tooltipRef.current || !mapRef.current) return;
          tooltipRef.current.setContent(
            `<div style="background:#111827;color:#fff;padding:4px 9px;border-radius:8px;font-size:12px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.35);">${safeName}</div>`
          );
          tooltipRef.current.open(mapRef.current, marker);
        });
        window.naver.maps.Event.addListener(marker, "mouseout", () => {
          tooltipRef.current?.close();
        });

        markersRef.current.push(marker);
      });
  }, [status, places, reviews, onSelectPlace, pinMode]);

  useEffect(() => {
    if (status !== "loaded" || !mapRef.current) return;

    pendingMarkerRef.current?.setMap(null);
    pendingMarkerRef.current = null;

    if (pendingLocation) {
      pendingMarkerRef.current = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(pendingLocation.lat, pendingLocation.lng),
        map: mapRef.current,
        icon: {
          content:
            '<div style="box-sizing:border-box;width:28px;height:28px;border-radius:50%;background:#2563EB;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.45);"></div>',
          anchor: new window.naver.maps.Point(14, 14),
        },
      });
    }
  }, [status, pendingLocation]);

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null;

  // 리스트에서 가게 선택 시 지도를 그 위치로 이동
  useEffect(() => {
    if (!centerOnSelect || status !== "loaded" || !mapRef.current || !selectedPlace) return;
    mapRef.current.setCenter(
      new window.naver.maps.LatLng(selectedPlace.lat, selectedPlace.lng)
    );
  }, [centerOnSelect, status, selectedPlace]);

  // 검색으로 가게 선택 시 그 위치로 이동 + 확대 (지도 뷰용)
  useEffect(() => {
    if (focusNonce === 0 || status !== "loaded" || !mapRef.current || !selectedPlace) return;
    mapRef.current.setCenter(
      new window.naver.maps.LatLng(selectedPlace.lat, selectedPlace.lng)
    );
    mapRef.current.setZoom(17);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusNonce]);

  // 가게가 선택될 때마다(마커 클릭·검색·리스트·뽑기) 그 지점에 펄스 하이라이트
  useEffect(() => {
    if (status !== "loaded" || !mapRef.current || !selectedPlace) {
      highlightRef.current?.setMap(null);
      highlightRef.current = null;
      return;
    }
    highlightRef.current?.setMap(null);
    highlightRef.current = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(selectedPlace.lat, selectedPlace.lng),
      map: mapRef.current,
      zIndex: 1000,
      icon: {
        content: '<div class="pin-pulse"></div>',
        anchor: new window.naver.maps.Point(24, 24),
      },
    });
    const t = window.setTimeout(() => {
      highlightRef.current?.setMap(null);
      highlightRef.current = null;
    }, 3000);
    return () => window.clearTimeout(t);
  }, [status, selectedPlace]);

  const editingPlace =
    pinMode?.type === "edit" ? places.find((p) => p.id === pinMode.placeId) ?? null : null;
  const categorySuggestions = Array.from(new Set(places.map((p) => p.category)));

  return (
    <div className="relative h-full w-full">
      {/* 핀 모드에서 네이버 지도 손모양 커서를 십자 커서로 강제 (globals.css가 아닌 인라인으로 확실히 적용) */}
      <style>{`
        .pin-cursor, .pin-cursor * { cursor: crosshair !important; }
        .pin-pulse { width: 48px; height: 48px; border-radius: 9999px; background: rgba(37,99,235,.35); animation: pinpulse 1.1s ease-out infinite; }
        @keyframes pinpulse {
          0% { transform: scale(.35); opacity: 1; box-shadow: 0 0 0 0 rgba(37,99,235,.6); }
          70% { transform: scale(1.7); opacity: 0; box-shadow: 0 0 0 20px rgba(37,99,235,0); }
          100% { transform: scale(1.7); opacity: 0; }
        }
      `}</style>
      <div
        ref={mapDivRef}
        className={`h-full w-full ${pinMode ? "pin-cursor" : ""}`}
      />

      {status === "missing-key" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-6">
          <div className="max-w-sm rounded-xl bg-white p-6 text-center shadow">
            <p className="mb-2 text-lg font-semibold text-gray-800">지도를 표시하려면</p>
            <p className="text-sm text-gray-600">
              네이버 클라우드 플랫폼에서 Maps Client ID를 발급받아{" "}
              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">.env.local</code> 의{" "}
              <code className="rounded bg-gray-100 px-1 py-0.5 text-xs">
                NEXT_PUBLIC_NAVER_MAP_CLIENT_ID
              </code>{" "}
              에 넣어주세요. 자세한 방법은 README를 참고하세요.
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-6">
          <p className="text-sm text-red-500">
            지도를 불러오지 못했습니다. Client ID와 서비스 URL 등록 상태를 확인해주세요.
          </p>
        </div>
      )}

      {pinMode && !pendingLocation && (
        <div className="absolute left-1/2 top-4 flex -translate-x-1/2 items-center gap-3 rounded-full bg-gray-900/90 px-4 py-2 text-sm text-white shadow-lg">
          <span>
            {pinMode.type === "add"
              ? "지도를 탭해서 가게 위치를 선택하세요"
              : "지도를 탭해서 새 위치를 선택하세요"}
          </span>
          <button
            type="button"
            onClick={onExitPinMode}
            className="rounded-full bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30"
          >
            취소
          </button>
        </div>
      )}

      {pendingLocation && pinMode?.type === "add" && (
        <div className="absolute inset-y-0 right-0 w-full max-w-sm shadow-xl sm:m-3 sm:rounded-xl">
          <AddPlaceForm
            coords={pendingLocation}
            categorySuggestions={categorySuggestions}
            onCancel={() => setPendingLocation(null)}
            onSave={async (place) => {
              try {
                const newPlace = await onAddPlace(place);
                onSelectPlace(newPlace.id);
                setPendingLocation(null);
                onExitPinMode();
              } catch (e) {
                console.error("가게 저장 실패:", e);
                alert("가게 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
              }
            }}
          />
        </div>
      )}

      {pendingLocation && pinMode?.type === "edit" && editingPlace && (
        <div className="absolute left-1/2 top-20 w-[calc(100%-2rem)] max-w-xs -translate-x-1/2 rounded-xl bg-white p-4 shadow-xl">
          <p className="mb-1 text-sm font-semibold text-gray-900">{editingPlace.name}</p>
          <p className="mb-3 text-xs text-gray-500">
            새 위치: {pendingLocation.lat.toFixed(5)}, {pendingLocation.lng.toFixed(5)}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPendingLocation(null)}
              className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              다시 선택
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdatePlaceLocation(editingPlace.id, pendingLocation);
                onSelectPlace(editingPlace.id);
                setPendingLocation(null);
                onExitPinMode();
              }}
              className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              이 위치로 저장
            </button>
          </div>
        </div>
      )}

      {renderCard && !pinMode && selectedPlace && (
        <div className="absolute inset-y-0 right-0 z-30 w-full max-w-sm shadow-xl sm:m-3 sm:rounded-xl">
          <PlaceCard
            key={selectedPlace.id}
            place={selectedPlace}
            reviews={reviews.filter((r) => r.placeId === selectedPlace.id)}
            onAddReview={onAddReview}
            onUpdateReview={onUpdateReview}
            onDeleteReview={onDeleteReview}
            onClose={() => onSelectPlace(null)}
            onEditLocation={() => onStartEditLocation(selectedPlace.id)}
            onUpdatePlace={onUpdatePlace}
            onRequireLogin={onRequireLogin}
          />
        </div>
      )}
    </div>
  );
}
