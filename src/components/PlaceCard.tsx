"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { deletePhotoUrls, thumbUrl, uploadReviewPhotos } from "@/lib/storage";
import { MAX_PHOTOS_PER_REVIEW, validateImageFile } from "@/lib/image";

const TIERS: ThreeTier[] = ["bad", "soso", "good"];

type ReviewDraft = {
  quickRating?: QuickScore;
  atmosphereRating?: ThreeTier;
  restroomRating?: ThreeTier;
  freeComment: string;
  menuNotes: MenuNote[];
  photos: string[]; // 이미 업로드된 사진 URL (수정 시)
  newFiles: File[]; // 아직 업로드 안 한 새 사진
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

// 사진 선택기: 기존 사진(URL) + 새 파일 미리보기, 리뷰당 최대 5장
function PhotoPicker({
  draft,
  setDraft,
}: {
  draft: ReviewDraft;
  setDraft: (updater: (prev: ReviewDraft) => ReviewDraft) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(
    () => draft.newFiles.map((f) => URL.createObjectURL(f)),
    [draft.newFiles]
  );
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const total = draft.photos.length + draft.newFiles.length;
  const remaining = MAX_PHOTOS_PER_REVIEW - total;

  function onFiles(list: FileList | null) {
    if (!list) return;
    const picked: File[] = [];
    const errors: string[] = [];
    for (const f of Array.from(list)) {
      if (picked.length >= remaining) break;
      const err = validateImageFile(f);
      if (err) errors.push(`${f.name}: ${err}`);
      else picked.push(f);
    }
    if (errors.length) alert(errors.join("\n"));
    if (picked.length) setDraft((prev) => ({ ...prev, newFiles: [...prev.newFiles, ...picked] }));
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mt-2">
      <label className="mb-1 block text-xs text-gray-500">
        사진 (선택) · {total}/{MAX_PHOTOS_PER_REVIEW}
      </label>
      <div className="flex flex-wrap gap-2">
        {draft.photos.map((u) => (
          <div key={u} className="relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbUrl(u, 128)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({ ...prev, photos: prev.photos.filter((p) => p !== u) }))
              }
              className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-[11px] text-white"
              aria-label="사진 제거"
            >
              ✕
            </button>
          </div>
        ))}
        {previews.map((u, i) => (
          <div key={u} className="relative h-16 w-16 overflow-hidden rounded-lg bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  newFiles: prev.newFiles.filter((_, idx) => idx !== i),
                }))
              }
              className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-[11px] text-white"
              aria-label="사진 제거"
            >
              ✕
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-500 hover:bg-gray-100"
          >
            <span className="text-lg leading-none">📷</span>
            <span className="mt-0.5 text-[10px]">추가</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      <p className="mt-1 text-[10px] text-gray-400">업로드 시 자동으로 축소·압축돼요 (장당 약 300KB)</p>
    </div>
  );
}

// 전체화면 사진 보기 (좌우/ESC/스와이프)
function Lightbox({
  photos,
  index,
  onClose,
  onIndex,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const touchX = useRef<number | null>(null);
  const prev = () => onIndex((index - 1 + photos.length) % photos.length);
  const next = () => onIndex((index + 1) % photos.length);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopImmediatePropagation(); // 지도 카드 닫기(ESC) 핸들러까지 막기
        onClose();
      } else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey, { capture: true });
    return () => window.removeEventListener("keydown", onKey, { capture: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, photos.length]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (dx > 40) prev();
        else if (dx < -40) next();
      }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-3 top-3 rounded-full bg-white/15 px-3 py-1.5 text-sm text-white hover:bg-white/25"
        aria-label="닫기"
      >
        ✕
      </button>
      {photos.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-2xl text-white hover:bg-white/25"
            aria-label="이전"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/15 px-3 py-2 text-2xl text-white hover:bg-white/25"
            aria-label="다음"
          >
            ›
          </button>
        </>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[index]}
        alt=""
        className="max-h-[85vh] max-w-[95vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-white/80">
        {index + 1} / {photos.length}
      </p>
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

      <PhotoPicker draft={draft} setDraft={setDraft} />

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
  photos: [],
  newFiles: [],
};

// newFiles는 제출 시점에 업로드해서 photos로 합친 뒤 넘김
function draftToPatch(draft: ReviewDraft, photos: string[]) {
  return {
    quickRating: draft.quickRating!,
    atmosphereRating: draft.atmosphereRating,
    restroomRating: draft.restroomRating,
    freeComment: draft.freeComment.trim() || undefined,
    menuNotes: draft.menuNotes.filter((n) => n.menuName.trim().length > 0),
    photos,
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
      "quickRating" | "atmosphereRating" | "restroomRating" | "freeComment" | "menuNotes" | "photos"
    >
  ) => void;
  onDeleteReview: (reviewId: string) => void;
  onClose: () => void;
  onEditLocation: () => void;
  onUpdatePlace: (
    placeId: string,
    patch: Partial<Pick<Place, "name" | "category" | "naverMapUrl">>
  ) => void;
  onDeletePlace: (placeId: string) => void;
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
  onDeletePlace,
  onRequireLogin,
}: PlaceCardProps) {
  const { user, nickname } = useAuth();
  const isOwnPlace = !!user && place.userId === user.uid;

  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [editName, setEditName] = useState(place.name);
  const [editCategory, setEditCategory] = useState(place.category);
  const [editUrl, setEditUrl] = useState(place.naverMapUrl);

  const [draft, setDraft] = useState<ReviewDraft>(EMPTY_DRAFT);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ReviewDraft>(EMPTY_DRAFT);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);
  const [copied, setCopied] = useState(false);

  function handleShare() {
    const url = `${window.location.origin}${window.location.pathname}?place=${place.id}`;
    const done = () => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(done);
    } else {
      done();
    }
  }

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

  async function handleSubmit() {
    if (draft.quickRating === undefined || uploading || !user) return;
    setUploading(true);
    try {
      const uploaded = await uploadReviewPhotos(draft.newFiles, user.uid);
      onAddReview({
        placeId: place.id,
        authorName: nickname ?? "익명",
        ...draftToPatch(draft, [...draft.photos, ...uploaded]),
      });
      setDraft(EMPTY_DRAFT);
      setShowRatingForm(false);
    } catch (e) {
      console.error("사진 업로드 실패:", e);
      alert(e instanceof Error ? e.message : "사진 업로드에 실패했어요.");
    } finally {
      setUploading(false);
    }
  }

  function startEditReview(r: Review) {
    setEditingReviewId(r.id);
    setEditDraft({
      quickRating: r.quickRating,
      atmosphereRating: r.atmosphereRating,
      restroomRating: r.restroomRating,
      freeComment: r.freeComment ?? "",
      menuNotes: r.menuNotes,
      photos: r.photos,
      newFiles: [],
    });
  }

  async function handleSaveEdit() {
    if (!editingReviewId || editDraft.quickRating === undefined || uploading || !user) return;
    setUploading(true);
    try {
      const uploaded = await uploadReviewPhotos(editDraft.newFiles, user.uid);
      const photos = [...editDraft.photos, ...uploaded];
      const original = reviews.find((r) => r.id === editingReviewId);
      const removed = (original?.photos ?? []).filter((u) => !editDraft.photos.includes(u));
      onUpdateReview(editingReviewId, draftToPatch(editDraft, photos));
      setEditingReviewId(null);
      void deletePhotoUrls(removed); // 빼버린 사진은 저장소에서도 정리(best-effort)
    } catch (e) {
      console.error("사진 업로드 실패:", e);
      alert(e instanceof Error ? e.message : "사진 업로드에 실패했어요.");
    } finally {
      setUploading(false);
    }
  }

  const score = averageQuickRating(reviews);
  const dist = ratingDistribution(reviews);
  const allPhotos = reviews.flatMap((r) => r.photos);

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-start justify-between border-b border-gray-100 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-blue-600">{place.category}</p>
          <h2 className="truncate text-lg font-bold text-gray-900">{place.name}</h2>
        </div>
        <div className="ml-2 flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleShare}
            className="whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50"
            aria-label="공유 링크 복사"
          >
            {copied ? "복사됨 ✓" : "🔗 공유"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>
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
        {/* 이 가게의 전체 사진 (모든 리뷰 사진 모음) */}
        {allPhotos.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-semibold text-gray-500">📷 사진 {allPhotos.length}장</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allPhotos.map((u, i) => (
                <button
                  key={`${u}-${i}`}
                  type="button"
                  onClick={() => setLightbox({ photos: allPhotos, index: i })}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumbUrl(u, 160)} alt="" className="h-full w-full object-cover" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}

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
            <button
              type="button"
              onClick={() => {
                if (confirm(`'${place.name}' 가게를 삭제할까요?\n삭제하면 되돌릴 수 없어요.`)) {
                  onDeletePlace(place.id);
                }
              }}
              className="mt-1 w-full rounded-lg border border-red-200 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
            >
              🗑️ 가게 삭제
            </button>
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

        {/* 평가 작성 (로그인 시): 평가하기 버튼 → 폼 펼침 */}
        {user &&
          (showRatingForm ? (
            <div className="mb-4 space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-500">
                작성자: <span className="font-medium text-gray-700">{nickname ?? "…"}</span>
              </p>
              <RatingFields draft={draft} setDraft={setDraft} />
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRatingForm(false);
                    setDraft(EMPTY_DRAFT);
                  }}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-600 hover:bg-white"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={draft.quickRating === undefined || uploading}
                  className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {uploading ? "사진 업로드 중…" : "평가 등록"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowRatingForm(true)}
              className="mb-4 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              ✏️ 평가하기
            </button>
          ))}

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
                          disabled={editDraft.quickRating === undefined || uploading}
                          className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white disabled:bg-gray-300"
                        >
                          {uploading ? "사진 업로드 중…" : "저장"}
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
                    {r.photos.length > 0 && (
                      <div className="mt-2 flex gap-1.5 overflow-x-auto">
                        {r.photos.map((u, i) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => setLightbox({ photos: r.photos, index: i })}
                            className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-gray-100"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={thumbUrl(u, 112)} alt="" className="h-full w-full object-cover" loading="lazy" />
                          </button>
                        ))}
                      </div>
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

      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          index={lightbox.index}
          onClose={() => setLightbox(null)}
          onIndex={(i) => setLightbox({ photos: lightbox.photos, index: i })}
        />
      )}
    </div>
  );
}
