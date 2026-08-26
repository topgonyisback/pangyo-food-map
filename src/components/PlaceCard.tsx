"use client";

import { useState } from "react";
import {
  ATMOSPHERE_TIER_LABEL,
  MENU_TIER_LABEL,
  MenuNote,
  Place,
  QUICK_SCORE_LABEL,
  QuickScore,
  RESTROOM_TIER_LABEL,
  Review,
  ThreeTier,
} from "@/types";
import { PRESET_CATEGORIES } from "@/lib/categories";
import {
  averageQuickRating,
  quickScoreColor,
  ratingDistribution,
  scoreToFiveText,
} from "@/lib/rating";
import {
  AverageFillBar,
  SegmentedRatingBar,
  SegmentedRatingInput,
} from "./SegmentedRating";
import { useAuth } from "@/hooks/useAuth";

const TIERS: ThreeTier[] = ["bad", "soso", "good"];

type ReviewDraft = {
  quickRating?: QuickScore;
  atmosphereRating?: ThreeTier;
  restroomRating?: ThreeTier;
  freeComment: string;
  menuNotes: MenuNote[];
};

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

// 평가 입력 필드 (신규 작성 / 수정 공용)
function RatingFields({
  draft,
  setDraft,
}: {
  draft: ReviewDraft;
  setDraft: (updater: (prev: ReviewDraft) => ReviewDraft) => void;
}) {
  const [showDetail, setShowDetail] = useState(
    draft.menuNotes.length > 0 || !!draft.atmosphereRating || !!draft.restroomRating
  );

  function updateMenuNote(index: number, patch: Partial<MenuNote>) {
    setDraft((prev) => ({
      ...prev,
      menuNotes: prev.menuNotes.map((n, i) => (i === index ? { ...n, ...patch } : n)),
    }));
  }

  return (
    <>
      <label className="mb-1 block text-xs text-gray-500">한줄 평가 (필수)</label>
      <SegmentedRatingInput
        value={draft.quickRating}
        onChange={(v) => setDraft((prev) => ({ ...prev, quickRating: v }))}
      />

      <label className="mb-1 mt-2 block text-xs text-gray-500">자유 메모 (선택)</label>
      <textarea
        value={draft.freeComment}
        onChange={(e) => setDraft((prev) => ({ ...prev, freeComment: e.target.value }))}
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
            <label className="mb-1 block text-xs text-gray-500">메뉴별 평가 (먹은 메뉴만)</label>
            <div className="space-y-2">
              {draft.menuNotes.map((note, i) => (
                <div key={i} className="space-y-2.5 rounded-md bg-white p-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      value={note.menuName}
                      onChange={(e) => updateMenuNote(i, { menuName: e.target.value })}
                      placeholder="메뉴 이름"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          menuNotes: prev.menuNotes.filter((_, idx) => idx !== i),
                        }))
                      }
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
                  setDraft((prev) => ({
                    ...prev,
                    menuNotes: [...prev.menuNotes, { menuName: "", rating: "soso" }],
                  }))
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
              value={draft.atmosphereRating}
              onChange={(v) => setDraft((prev) => ({ ...prev, atmosphereRating: v }))}
              labels={ATMOSPHERE_TIER_LABEL}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">화장실</label>
            <TierButtons
              value={draft.restroomRating}
              onChange={(v) => setDraft((prev) => ({ ...prev, restroomRating: v }))}
              labels={RESTROOM_TIER_LABEL}
            />
          </div>
        </div>
      )}
    </>
  );
}

const EMPTY_DRAFT: ReviewDraft = {
  quickRating: undefined,
  atmosphereRating: undefined,
  restroomRating: undefined,
  freeComment: "",
  menuNotes: [],
};

function draftToPatch(draft: ReviewDraft) {
  return {
    quickRating: draft.quickRating!,
    atmosphereRating: draft.atmosphereRating,
    restroomRating: draft.restroomRating,
    freeComment: draft.freeComment.trim() || undefined,
    menuNotes: draft.menuNotes.filter((n) => n.menuName.trim().length > 0),
  };
}

interface PlaceCardProps {
  place: Place;
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
  onClose: () => void;
  onEditLocation: () => void;
  onUpdatePlace: (
    placeId: string,
    patch: Partial<Pick<Place, "name" | "category" | "naverMapUrl">>
  ) => void;
  onRequireLogin: () => void;
}

export default function PlaceCard({
  place,
  reviews,
  onAddReview,
  onUpdateReview,
  onDeleteReview,
  onClose,
  onEditLocation,
  onUpdatePlace,
  onRequireLogin,
}: PlaceCardProps) {
  const { user, nickname } = useAuth();
  const isOwnPlace = !!user && place.userId === user.uid;

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(place.name);
  const [editCategory, setEditCategory] = useState(place.category);
  const [editUrl, setEditUrl] = useState(place.naverMapUrl);

  const [draft, setDraft] = useState<ReviewDraft>(EMPTY_DRAFT);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ReviewDraft>(EMPTY_DRAFT);

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

  function handleSubmit() {
    if (draft.quickRating === undefined) return;
    onAddReview({
      placeId: place.id,
      authorName: nickname ?? "익명",
      ...draftToPatch(draft),
    });
    setDraft(EMPTY_DRAFT);
  }

  function startEditReview(r: Review) {
    setEditingReviewId(r.id);
    setEditDraft({
      quickRating: r.quickRating,
      atmosphereRating: r.atmosphereRating,
      restroomRating: r.restroomRating,
      freeComment: r.freeComment ?? "",
      menuNotes: r.menuNotes,
    });
  }

  function handleSaveEdit() {
    if (!editingReviewId || editDraft.quickRating === undefined) return;
    onUpdateReview(editingReviewId, draftToPatch(editDraft));
    setEditingReviewId(null);
  }

  const score = averageQuickRating(reviews);
  const dist = ratingDistribution(reviews);

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

      {/* 종합평가 요약: 5점 평균 + 그라데이션 채움 바 + 5단계 분포 축 */}
      {dist.total > 0 && (
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="mb-1.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {scoreToFiveText(score)}
            </span>
            <span className="text-xs text-gray-400">/ 5점 · 평가 {dist.total}건</span>
          </div>
          <AverageFillBar avg={score ?? 0} />
        </div>
      )}

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
          /* 네이버지도 · (평가남기기|정보수정·위치수정) 한 줄 배치 */
          <div
            className={`mb-4 gap-2 ${
              isOwnPlace ? "grid grid-cols-3" : !user ? "grid grid-cols-2" : "flex"
            }`}
          >
            <a
              href={place.naverMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-green-500 px-2 py-2 text-xs font-semibold text-white hover:bg-green-600 sm:text-sm"
            >
              네이버지도
            </a>
            {!user && (
              <button
                type="button"
                onClick={onRequireLogin}
                className="whitespace-nowrap rounded-lg border border-blue-300 bg-blue-50 px-2 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 sm:text-sm"
              >
                평가남기기
              </button>
            )}
            {isOwnPlace && (
              <>
                <button
                  type="button"
                  onClick={startEditingInfo}
                  className="flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 sm:text-sm"
                >
                  ✏️ 정보수정
                </button>
                <button
                  type="button"
                  onClick={onEditLocation}
                  className="flex flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-lg border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 sm:text-sm"
                >
                  📍 위치수정
                </button>
              </>
            )}
          </div>
        )}

        {/* 평가 작성 (로그인 시 폼) */}
        {user && (
          <div className="mb-4 space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">
              작성자: <span className="font-medium text-gray-700">{nickname ?? "…"}</span>
            </p>
            <RatingFields draft={draft} setDraft={setDraft} />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={draft.quickRating === undefined}
              className="mt-2 w-full rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              평가 등록
            </button>
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-700">
            지금까지의 평가 ({reviews.length})
          </h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400">아직 평가가 없어요. 첫 평가를 남겨보세요!</p>
          ) : (
            <ul className="space-y-3">
              {[...reviews].reverse().map((r) => {
                const mine = !!user && r.userId === user.uid;
                if (editingReviewId === r.id) {
                  return (
                    <li key={r.id} className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <RatingFields draft={editDraft} setDraft={setEditDraft} />
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingReviewId(null)}
                          className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-600 hover:bg-white"
                        >
                          취소
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          disabled={editDraft.quickRating === undefined}
                          className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white disabled:bg-gray-300"
                        >
                          저장
                        </button>
                      </div>
                    </li>
                  );
                }
                return (
                  <li key={r.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="font-medium text-gray-800">{r.authorName}</span>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <SegmentedRatingBar score={r.quickRating} />
                        <span
                          className="text-xs font-semibold"
                          style={{ color: quickScoreColor(r.quickRating) }}
                        >
                          {QUICK_SCORE_LABEL[r.quickRating]}
                        </span>
                      </div>
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
                    {r.freeComment && (
                      <p className="mt-1 whitespace-pre-line text-gray-700">{r.freeComment}</p>
                    )}
                    {mine && (
                      <div className="mt-2 flex gap-3 text-xs">
                        <button
                          type="button"
                          onClick={() => startEditReview(r)}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm("이 평가를 삭제할까요?")) onDeleteReview(r.id);
                          }}
                          className="font-medium text-red-500 hover:underline"
                        >
                          삭제
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
