"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Place, Review } from "@/types";
import { averageQuickRating, scoreToColor, scoreToLabel } from "@/lib/rating";

interface PickViewProps {
  places: Place[];
  reviews: Review[];
  onGoToPlace: (placeId: string) => void;
}

type Phase = "idle" | "spinning" | "result";

export default function PickView({ places, reviews, onGoToPlace }: PickViewProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [excludeBad, setExcludeBad] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [displayId, setDisplayId] = useState<string | null>(null);
  const [resultId, setResultId] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPickedRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const allCategories = useMemo(
    () => Array.from(new Set(places.map((p) => p.category))),
    [places]
  );

  const candidates = useMemo(() => {
    return places.filter((p) => {
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) {
        return false;
      }
      if (excludeBad) {
        const score = averageQuickRating(reviews.filter((r) => r.placeId === p.id));
        // 평가가 없으면(=null) 후보 유지, '별로'(score<1.75)만 제외
        if (score !== null && score < 1.75) return false;
      }
      return true;
    });
  }, [places, reviews, selectedCategories, excludeBad]);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  function handlePick() {
    if (candidates.length === 0 || phase === "spinning") return;

    // 직전에 뽑힌 곳은 후보가 2곳 이상일 때만 제외
    let finalPool = candidates;
    if (candidates.length > 1 && lastPickedRef.current) {
      finalPool = candidates.filter((p) => p.id !== lastPickedRef.current);
    }
    const final = finalPool[Math.floor(Math.random() * finalPool.length)];

    setPhase("spinning");
    setResultId(null);

    let ticks = 0;
    const totalTicks = 16;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDisplayId(candidates[Math.floor(Math.random() * candidates.length)].id);
      ticks += 1;
      if (ticks >= totalTicks) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayId(final.id);
        setResultId(final.id);
        setPhase("result");
        lastPickedRef.current = final.id;
      }
    }, 70);
  }

  const displayPlace = places.find((p) => p.id === displayId) ?? null;
  const resultPlace = places.find((p) => p.id === resultId) ?? null;
  const resultScore = resultPlace
    ? averageQuickRating(reviews.filter((r) => r.placeId === resultPlace.id))
    : null;

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-gray-50 p-4 pt-16">
      <h2 className="mb-1 text-xl font-bold text-gray-900">오늘 뭐먹지? 🎲</h2>
      <p className="mb-4 text-sm text-gray-500">
        조건을 고르고 버튼을 누르면 랜덤으로 골라드려요.
      </p>

      {/* 필터 */}
      <div className="mb-4 space-y-3 rounded-xl bg-white p-3 shadow-sm">
        <div>
          <p className="mb-1.5 text-xs font-medium text-gray-500">카테고리 (없으면 전체)</p>
          <div className="flex flex-wrap gap-1.5">
            {allCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  selectedCategories.includes(cat)
                    ? "border-blue-500 bg-blue-500 text-white"
                    : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={excludeBad}
            onChange={(e) => setExcludeBad(e.target.checked)}
            className="h-4 w-4"
          />
          &apos;별로예요&apos; 평가받은 곳 제외
        </label>

        <p className="text-xs text-gray-400">후보 {candidates.length}곳</p>
      </div>

      {/* 결과 / 슬롯 영역 */}
      <div className="mb-4 flex min-h-[140px] flex-1 items-center justify-center rounded-xl bg-white p-4 shadow-sm">
        {candidates.length === 0 ? (
          <p className="text-center text-sm text-gray-400">
            조건에 맞는 가게가 없어요.
            <br />
            필터를 바꾸거나 가게를 먼저 등록해보세요.
          </p>
        ) : phase === "idle" ? (
          <p className="text-center text-sm text-gray-400">
            아래 버튼을 눌러 오늘의 점심을 뽑아보세요!
          </p>
        ) : phase === "spinning" ? (
          <p className="text-center text-2xl font-bold text-gray-400">
            {displayPlace?.name ?? "…"}
          </p>
        ) : resultPlace ? (
          <div className="w-full text-center">
            <p className="mb-1 text-xs font-medium text-blue-600">{resultPlace.category}</p>
            <p className="mb-2 text-2xl font-bold text-gray-900">{resultPlace.name}</p>
            <span
              className="inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: scoreToColor(resultScore) }}
            >
              {scoreToLabel(resultScore)}
            </span>

            <div className="mt-4 space-y-2">
              <a
                href={resultPlace.naverMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1 rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600"
              >
                네이버지도에서 보기 ↗
              </a>
              <button
                type="button"
                onClick={() => onGoToPlace(resultPlace.id)}
                className="flex w-full items-center justify-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                지도에서 보기 · 평가하기
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* 뽑기 버튼 */}
      <button
        type="button"
        onClick={handlePick}
        disabled={candidates.length === 0 || phase === "spinning"}
        className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {phase === "spinning" ? "뽑는 중…" : phase === "result" ? "다시 뽑기 🎲" : "오늘의 점심 뽑기 🎲"}
      </button>
    </div>
  );
}
