"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Place, Review } from "@/types";
import { averageQuickRating, scoreToColor, scoreToLabel } from "@/lib/rating";

interface PickViewProps {
  places: Place[];
  reviews: Review[];
  onGoToPlace: (placeId: string) => void;
  onSelectPlace: (placeId: string | null) => void;
}

type Phase = "idle" | "spinning" | "result";

const ITEM_H = 76; // 릴 한 칸 높이(px)
const REEL_LEN = 26; // 스핀 동안 지나가는 칸 수

export default function PickView({
  places,
  reviews,
  onGoToPlace,
  onSelectPlace,
}: PickViewProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [excludeBad, setExcludeBad] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [reel, setReel] = useState<Place[]>([]);
  const [spinKey, setSpinKey] = useState(0);
  const [resultId, setResultId] = useState<string | null>(null);
  const lastPickedRef = useRef<string | null>(null);

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
        if (score !== null && score < 1.75) return false;
      }
      return true;
    });
  }, [places, reviews, selectedCategories, excludeBad]);

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
    setPhase("idle");
    setResultId(null);
  }

  function fireConfetti() {
    confetti({ particleCount: 130, spread: 75, origin: { y: 0.65 }, scalar: 0.9 });
    setTimeout(
      () => confetti({ particleCount: 60, spread: 100, origin: { y: 0.6 } }),
      180
    );
  }

  function finish(final: Place) {
    setResultId(final.id);
    setPhase("result");
    lastPickedRef.current = final.id;
    onSelectPlace(final.id); // 지도를 뽑힌 가게로 이동
    fireConfetti();
  }

  function handlePick() {
    if (candidates.length === 0 || phase === "spinning") return;

    let finalPool = candidates;
    if (candidates.length > 1 && lastPickedRef.current) {
      finalPool = candidates.filter((p) => p.id !== lastPickedRef.current);
    }
    const final = finalPool[Math.floor(Math.random() * finalPool.length)];

    // 접근성: 애니메이션 최소화 설정이면 바로 결과
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      finish(final);
      return;
    }

    // 릴 구성: 무작위 칸들 + 마지막에 당첨
    const items: Place[] = Array.from(
      { length: REEL_LEN - 1 },
      () => candidates[Math.floor(Math.random() * candidates.length)]
    );
    items.push(final);
    setReel(items);
    setResultId(null);
    setPhase("spinning");
    setSpinKey((k) => k + 1);
  }

  const resultPlace = places.find((p) => p.id === resultId) ?? null;
  const resultScore = resultPlace
    ? averageQuickRating(reviews.filter((r) => r.placeId === resultPlace.id))
    : null;

  return (
    <div className="absolute inset-x-2 top-16 bottom-2 z-10 flex flex-col overflow-y-auto rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-black/5 backdrop-blur sm:inset-x-auto sm:left-3 sm:w-96">
      <h2 className="mb-1 text-xl font-bold text-gray-900">오늘 뭐먹지? 🎲</h2>
      <p className="mb-4 text-sm text-gray-500">조건을 고르고 버튼을 누르면 랜덤으로 골라드려요.</p>

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
                    ? "border-orange-500 bg-orange-500 text-white"
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
            onChange={(e) => {
              setExcludeBad(e.target.checked);
              setPhase("idle");
              setResultId(null);
            }}
            className="h-4 w-4"
          />
          &apos;별로예요&apos; 평가받은 곳 제외
        </label>

        <p className="text-xs text-gray-400">후보 {candidates.length}곳</p>
      </div>

      {/* 결과 / 슬롯 영역 */}
      <div className="mb-4 flex min-h-[180px] flex-1 items-center justify-center overflow-hidden rounded-xl bg-white p-4 shadow-sm">
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
          // 슬롯 릴 (세로로 감속하며 멈춤)
          <div
            className="relative w-full overflow-hidden"
            style={{ height: ITEM_H }}
          >
            <motion.div
              key={spinKey}
              initial={{ y: 0 }}
              animate={{ y: -(reel.length - 1) * ITEM_H }}
              transition={{ duration: 2.4, ease: [0.12, 0.7, 0.1, 1] }}
              onAnimationComplete={() => finish(reel[reel.length - 1])}
            >
              {reel.map((p, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center"
                  style={{ height: ITEM_H }}
                >
                  <span className="text-xs font-medium text-blue-500">{p.category}</span>
                  <span className="text-2xl font-bold text-gray-800">{p.name}</span>
                </div>
              ))}
            </motion.div>
            {/* 가운데 강조 라인 */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gray-100" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gray-100" />
          </div>
        ) : resultPlace ? (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="w-full text-center"
          >
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
          </motion.div>
        ) : null}
      </div>

      {/* 뽑기 버튼 */}
      <motion.button
        type="button"
        onClick={handlePick}
        disabled={candidates.length === 0 || phase === "spinning"}
        whileTap={{ scale: 0.96 }}
        className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        {phase === "spinning"
          ? "뽑는 중…"
          : phase === "result"
            ? "다시 뽑기 🎲"
            : "오늘의 점심 뽑기 🎲"}
      </motion.button>
    </div>
  );
}
