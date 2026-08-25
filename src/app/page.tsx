"use client";

import { useState } from "react";
import MapView from "@/components/MapView";
import ListPanel from "@/components/ListPanel";
import PickView from "@/components/PickView";
import SearchBar from "@/components/SearchBar";
import AccountMenu from "@/components/AccountMenu";
import AuthModal, { AuthMode } from "@/components/AuthModal";
import { usePlaces } from "@/hooks/usePlaces";
import { useReviews } from "@/hooks/useReviews";
import { useIsHydrated } from "@/hooks/useIsHydrated";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { PinMode } from "@/types";

type ViewMode = "map" | "list" | "pick";

const TABS: { id: ViewMode; label: string; shortLabel: string; icon: string }[] = [
  { id: "map", label: "지도", shortLabel: "지도", icon: "🗺️" },
  { id: "list", label: "리스트", shortLabel: "리스트", icon: "📋" },
  { id: "pick", label: "오늘 뭐먹지?", shortLabel: "뭐먹지?", icon: "🎲" },
];

export default function Home() {
  return (
    <AuthProvider>
      <HomeInner />
    </AuthProvider>
  );
}

function HomeInner() {
  const [view, setView] = useState<ViewMode>("map");
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState<PinMode>(null);
  const [authModal, setAuthModal] = useState<AuthMode | null>(null);
  const [focusNonce, setFocusNonce] = useState(0);
  const { places, addPlace, updatePlaceLocation, updatePlace, loadError } = usePlaces();
  const { reviews, addReview, updateReview, deleteReview } = useReviews();
  const hydrated = useIsHydrated();
  const { user } = useAuth();

  function startAddingPlace() {
    if (!user) {
      setAuthModal("signin");
      return;
    }
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

  function handleTabChange(next: ViewMode) {
    setView(next);
    setSelectedPlaceId(null);
  }

  const requireLogin = () => setAuthModal("signin");

  function selectFromSearch(placeId: string) {
    setSelectedPlaceId(placeId);
    setFocusNonce((n) => n + 1);
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* 전체 화면 지도 배경 (지도/리스트/뭐먹지 공통) */}
      <div className="absolute inset-0">
        {!hydrated ? null : (
          <MapView
            places={places}
            reviews={reviews}
            onAddReview={addReview}
            onUpdateReview={updateReview}
            onDeleteReview={deleteReview}
            selectedPlaceId={selectedPlaceId}
            onSelectPlace={setSelectedPlaceId}
            pinMode={pinMode}
            onExitPinMode={() => setPinMode(null)}
            onStartEditLocation={startEditingLocation}
            onAddPlace={addPlace}
            onUpdatePlaceLocation={updatePlaceLocation}
            onUpdatePlace={updatePlace}
            onRequireLogin={requireLogin}
            renderCard={view === "map"}
            centerOnSelect={view !== "map"}
            focusNonce={focusNonce}
          />
        )}
      </div>

      {/* 지도 뷰: 상단 검색바 (가게 선택 시 지도 이동 + 상세 열림) */}
      {hydrated && view === "map" && !pinMode && !selectedPlaceId && (
        <SearchBar places={places} reviews={reviews} onSelect={selectFromSearch} />
      )}

      {/* 리스트 뷰: 지도 위에 카테고리·목록·상세 3단 패널 */}
      {hydrated && view === "list" && !pinMode && (
        <ListPanel
          places={places}
          reviews={reviews}
          selectedPlaceId={selectedPlaceId}
          onSelectPlace={setSelectedPlaceId}
          onAddReview={addReview}
          onUpdateReview={updateReview}
          onDeleteReview={deleteReview}
          onEditLocation={startEditingLocation}
          onUpdatePlace={updatePlace}
          onRequireLogin={requireLogin}
        />
      )}

      {/* 오늘 뭐먹지 뷰: 지도 위에 조건·뽑기 패널 */}
      {hydrated && view === "pick" && !pinMode && (
        <PickView
          places={places}
          reviews={reviews}
          onGoToPlace={goToPlaceOnMap}
          onSelectPlace={setSelectedPlaceId}
        />
      )}

      {/* 플로팅 상단 컨트롤 (메뉴 + 계정 = 하나의 덩어리) — 핀 편집 중엔 숨김 */}
      <div
        className={`pointer-events-none absolute inset-x-2 top-2 z-20 flex justify-center sm:justify-start sm:px-1 ${
          pinMode ? "hidden" : ""
        }`}
      >
        <div className="pointer-events-auto flex max-w-full items-center gap-1.5 rounded-2xl bg-white/90 p-1.5 shadow-lg ring-1 ring-black/5 backdrop-blur">
          <nav className="flex gap-1">
            {TABS.map((tab) => {
              const active = view === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-1 whitespace-nowrap rounded-xl px-2 py-1.5 text-sm font-semibold transition sm:px-2.5 ${
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  }`}
                >
                  <span className="text-[15px] leading-none">{tab.icon}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="h-5 w-px shrink-0 bg-gray-200" />
          <AccountMenu
            onLogin={() => setAuthModal("signin")}
            onChangePassword={() => setAuthModal("newpassword")}
            onChangeNickname={() => setAuthModal("nickname")}
          />
        </div>
      </div>

      {/* 데이터 로드 실패 안내 배너 */}
      {hydrated && loadError && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center px-3">
          <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-red-500 px-4 py-2 text-sm text-white shadow-lg">
            <span>데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="shrink-0 rounded-lg bg-white/20 px-2 py-0.5 text-xs font-semibold hover:bg-white/30"
            >
              새로고침
            </button>
          </div>
        </div>
      )}

      {/* 새 가게 추가 플로팅 버튼 */}
      {hydrated && !pinMode && view !== "pick" && (
        <button
          type="button"
          onClick={startAddingPlace}
          className="absolute bottom-5 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-2xl text-white shadow-lg hover:bg-blue-700"
          aria-label="새 가게 추가"
        >
          +
        </button>
      )}

      {authModal && (
        <AuthModal initialMode={authModal} onClose={() => setAuthModal(null)} />
      )}
    </div>
  );
}
