"use client";

import { useState } from "react";
import {
  ATMOSPHERE_TIER_LABEL,
  MENU_TIER_LABEL,
  MenuNote,
  Place,
  RESTROOM_TIER_LABEL,
  Review,
  THREE_TIER_LABEL,
  ThreeTier,
} from "@/types";
import { getAuthorName, setAuthorName } from "@/lib/storage";
import { PRESET_CATEGORIES } from "@/lib/categories";

const TIERS: ThreeTier[] = ["bad", "soso", "good"];

function TierButtons({
  value,
  onChange,
  labels,
}: {
  value?: ThreeTier;
  onChange: (v: ThreeTier) => void;
  labels: Record<ThreeTier, string>;
}) {
  return (
    <div className="flex gap-2">
      {TIERS.map((tier) => (
        <button
          key={tier}
          type="button"
          onClick={() => onChange(tier)}
          className={`flex-1 rounded-lg border px-2 py-1.5 text-sm transition ${
            value === tier
              ? "border-blue-500 bg-blue-500 text-white"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          {labels[tier]}
        </button>
      ))}
    </div>
  );
}

interface PlaceCardProps {
  place: Place;
  reviews: Review[];
  onAddReview: (review: Omit<Review, "id" | "createdAt">) => void;
  onClose: () => void;
  onEditLocation: () => void;
  onUpdatePlace: (
    placeId: string,
    patch: Partial<Pick<Place, "name" | "category" | "naverMapUrl">>
  ) => void;
}

export default function PlaceCard({
  place,
  reviews,
  onAddReview,
  onClose,
  onEditLocation,
  onUpdatePlace,
}: PlaceCardProps) {
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(place.name);
  const [editCategory, setEditCategory] = useState(place.category);
  const [editUrl, setEditUrl] = useState(place.naverMapUrl);
  const [showDetail, setShowDetail] = useState(false);
  const [quickRating, setQuickRating] = useState<ThreeTier | undefined>();
  const [atmosphereRating, setAtmosphereRating] = useState<ThreeTier | undefined>();
  const [restroomRating, setRestroomRating] = useState<ThreeTier | undefined>();
  const [freeComment, setFreeComment] = useState("");
  const [menuNotes, setMenuNotes] = useState<MenuNote[]>([]);
  const [authorName, setAuthorNameState] = useState(() => getAuthorName());

  function startEditingInfo() {
    setEditName(place.name);
    setEditCategory(place.category);
    setEditUrl(place.naverMapUrl);
    setIsEditingInfo(true);
  }

  function handleSaveInfo() {
    if (editName.trim().length === 0) return;
    onUpdatePlace(place.id, {
      name: editName.trim(),
      category: editCategory.trim() || "기타",
      naverMapUrl: editUrl.trim(),
    });
    setIsEditingInfo(false);
  }

  const categoryOptions = Array.from(new Set([...PRESET_CATEGORIES, place.category]));

  function updateMenuNote(index: number, patch: Partial<MenuNote>) {
    setMenuNotes((prev) => prev.map((n, i) => (i === index ? { ...n, ...patch } : n)));
  }

  function removeMenuNote(index: number) {
    setMenuNotes((prev) => prev.filter((_, i) => i !== index));
  }

  function resetForm() {
    setQuickRating(undefined);
    setAtmosphereRating(undefined);
    setRestroomRating(undefined);
    setFreeComment("");
    setMenuNotes([]);
    setShowDetail(false);
  }

  function handleSubmit() {
    if (!quickRating) return;
    const name = authorName.trim() || "익명";
    setAuthorName(name);

    onAddReview({
      placeId: place.id,
      authorName: name,
      quickRating,
      atmosphereRating,
      restroomRating,
      freeComment: freeComment.trim() || undefined,
      menuNotes: menuNotes.filter((n) => n.menuName.trim().length > 0),
    });
    resetForm();
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-start justify-between border-b border-gray-100 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-blue-600">{place.category}</p>
          <h2 className="truncate text-lg font-bold text-gray-900">{place.name}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isEditingInfo ? (
          <div className="mb-4 space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-sm font-semibold text-gray-800">가게 정보 수정</p>
            <div>
              <label className="mb-1 block text-xs text-gray-500">가게 이름 (필수)</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">카테고리</label>
              <select
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">네이버지도 링크</label>
              <input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingInfo(false)}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-600 hover:bg-white"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveInfo}
                disabled={editName.trim().length === 0}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                저장
              </button>
            </div>
          </div>
        ) : (
          <>
            <a
              href={place.naverMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 flex items-center justify-center gap-1 rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600"
            >
              네이버지도에서 보기 ↗
            </a>

            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={startEditingInfo}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                ✏️ 정보 수정
              </button>
              <button
                type="button"
                onClick={onEditLocation}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                📍 위치 수정
              </button>
            </div>
          </>
        )}

        <div className="mb-4 space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <label className="mb-1 block text-xs text-gray-500">작성자</label>
          <input
            value={authorName}
            onChange={(e) => setAuthorNameState(e.target.value)}
            placeholder="이름을 입력하세요"
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
          />

          <label className="mb-1 mt-2 block text-xs text-gray-500">한줄 평가 (필수)</label>
          <TierButtons value={quickRating} onChange={setQuickRating} labels={THREE_TIER_LABEL} />

          <label className="mb-1 mt-2 block text-xs text-gray-500">자유 메모 (선택)</label>
          <textarea
            value={freeComment}
            onChange={(e) => setFreeComment(e.target.value)}
            rows={2}
            placeholder="자유롭게 의견을 남겨주세요"
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
          />

          <button
            type="button"
            onClick={() => setShowDetail((v) => !v)}
            className="mt-2 text-xs font-medium text-blue-600 underline"
          >
            {showDetail ? "상세 평가 접기" : "상세 평가 추가하기 (선택)"}
          </button>

          {showDetail && (
            <div className="mt-2 space-y-3 border-t border-gray-200 pt-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  메뉴별 평가 (먹은 메뉴만)
                </label>
                <div className="space-y-2">
                  {menuNotes.map((note, i) => (
                    <div key={i} className="space-y-1 rounded-md bg-white p-2">
                      <div className="flex gap-2">
                        <input
                          value={note.menuName}
                          onChange={(e) => updateMenuNote(i, { menuName: e.target.value })}
                          placeholder="메뉴 이름"
                          className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() => removeMenuNote(i)}
                          className="text-xs text-gray-400 hover:text-red-500"
                        >
                          삭제
                        </button>
                      </div>
                      <TierButtons
                        value={note.rating}
                        onChange={(v) => updateMenuNote(i, { rating: v })}
                        labels={MENU_TIER_LABEL}
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setMenuNotes((prev) => [...prev, { menuName: "", rating: "soso" }])
                    }
                    className="w-full rounded-md border border-dashed border-gray-300 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
                  >
                    + 메뉴 추가
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">분위기</label>
                <TierButtons
                  value={atmosphereRating}
                  onChange={setAtmosphereRating}
                  labels={ATMOSPHERE_TIER_LABEL}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">화장실</label>
                <TierButtons
                  value={restroomRating}
                  onChange={setRestroomRating}
                  labels={RESTROOM_TIER_LABEL}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!quickRating}
            className="mt-2 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            평가 등록
          </button>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            지금까지의 평가 ({reviews.length})
          </h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400">아직 평가가 없어요. 첫 평가를 남겨보세요!</p>
          ) : (
            <ul className="space-y-3">
              {[...reviews].reverse().map((r) => (
                <li key={r.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-medium text-gray-800">{r.authorName}</span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {THREE_TIER_LABEL[r.quickRating]}
                    </span>
                  </div>
                  {r.menuNotes.length > 0 && (
                    <p className="text-xs text-gray-500">
                      메뉴:{" "}
                      {r.menuNotes
                        .map((n) => `${n.menuName}(${MENU_TIER_LABEL[n.rating]})`)
                        .join(", ")}
                    </p>
                  )}
                  {r.atmosphereRating && (
                    <p className="text-xs text-gray-500">
                      분위기: {ATMOSPHERE_TIER_LABEL[r.atmosphereRating]}
                    </p>
                  )}
                  {r.restroomRating && (
                    <p className="text-xs text-gray-500">
                      화장실: {RESTROOM_TIER_LABEL[r.restroomRating]}
                    </p>
                  )}
                  {r.freeComment && <p className="mt-1 text-gray-700">{r.freeComment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
