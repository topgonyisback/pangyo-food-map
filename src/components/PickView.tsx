"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Place, Review } from "@/types";
import { averageQuickRating, scoreToColor, scoreToFiveText } from "@/lib/rating";
import {
  CardsPicker,
  ReelPicker,
  WheelPicker,
  WorldcupPicker,
} from "./PickMethods";

interface PickViewProps {
  places: Place[];
  reviews: Review[];
  onGoToPlace: (placeId: string) => void;
  onSelectPlace: (placeId: string | null) => void;
}

type PickMode = "lunch" | "coffee";
type Method = "reel" | "wheel" | "cards" | "worldcup";

// 커피타임 카테고리 판별 (그 외는 점심시간)
const COFFEE_KEYWORDS = ["카페", "커피", "디저트", "베이커리", "브런치", "빵"];
function isCoffeeCategory(cat: string): boolean {
  return COFFEE_KEYWORDS.some((k) => cat.includes(k));
}

const METHODS: { id: Method; label: string }[] = [
  { id: "reel", label: "🎰 슬롯" },
  { id: "wheel", label: "🎡 돌림판" },
  { id: "cards", label: "🃏 카드" },
  { id: "worldcup", label: "🏆 월드컵" },
];

export default function PickView({
  places,
  reviews,
  onGoToPlace,
  onSelectPlace,
}: PickViewProps) {
  const [mode, setMode] = useState<PickMode>("lunch");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [excludeBad, setExcludeBad] = useState(true);
  const [method, setMethod] = useState<Method>("reel");
  const [resultId, setResultId] = useState<string | null>(null);
  const [runKey, setRunKey] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);

  // 현재 모드(점심/커피)에 해당하는 카테고리들
  const modeCategories = useMemo(
    () =>
      Array.from(
        new Set(
          places
            .filter((p) =>
              mode === "coffee"
                ? isCoffeeCategory(p.category)
                : !isCoffeeCategory(p.category)
            )
            .map((p) => p.category)
        )
      ),
    [places, mode]
  );

  const candidates = useMemo(() => {
    return places.filter((p) => {
      const coffee = isCoffeeCategory(p.category);
      if (mode === "coffee" ? !coffee : coffee) return false; // 모드 불일치 제외
      if (excluded.has(p.category)) return false; // 사용자가 뺀 카테고리 제외
      if (excludeBad) {
        const score = averageQuickRating(reviews.filter((r) => r.placeId === p.id));
        if (score !== null && score < 2.5) return false;
      }
      return true;
    });
  }, [places, reviews, mode, excluded, excludeBad]);

  function resetPick() {
    setResultId(null);
    setRunKey((k) => k + 1);
  }

  function changeMode(m: PickMode) {
    setMode(m);
    resetPick();
  }

  function changeMethod(m: Method) {
    setMethod(m);
    resetPick();
  }

  function toggleExclude(cat: string) {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
    resetPick();
  }

  function fireConfetti() {
    let origin = { x: 0.5, y: 0.6 };
    const el = stageRef.current;
    if (el && typeof window !== "undefined") {
      const r = el.getBoundingClientRect();
      origin = {
        x: (r.left + r.width / 2) / window.innerWidth,
        y: (r.top + r.height / 2) / window.innerHeight,
      };
    }
    confetti({ particleCount: 130, spread: 75, origin, scalar: 0.9 });
    setTimeout(() => confetti({ particleCount: 60, spread: 100, origin }), 180);
  }

  function handlePicked(place: Place) {
    setResultId(place.id);
    onSelectPlace(place.id); // 지도를 뽑힌 가게로 이동
    fireConfetti();
  }

  const resultPlace = places.find((p) => p.id === resultId) ?? null;
  const resultScore = resultPlace
    ? averageQuickRating(reviews.filter((r) => r.placeId === resultPlace.id))
    : null;

  const pickerProps = { candidates, onPicked: handlePicked };

  return (
    <div className="absolute inset-x-2 top-16 z-10 flex max-h-[calc(100%-4.5rem)] flex-col overflow-y-auto rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-black/5 backdrop-blur sm:inset-x-auto sm:left-3 sm:w-96">
      <h2 className="mb-1 text-xl font-bold text-gray-900">오늘 뭐먹지? 🎲</h2>
      <p className="mb-4 text-sm text-gray-500">모드와 조건을 고르고 원하는 방식으로 골라보세요.</p>

      {/* 모드: 점심시간 / 커피타임 */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        {([
          { id: "lunch", label: "🍚 점심시간" },
          { id: "coffee", label: "☕ 커피타임" },
        ] as { id: PickMode; label: string }[]).map((m) => {
          const on = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => changeMode(m.id)}
              className={`rounded-xl border py-2.5 text-sm font-bold transition ${
                on
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* 필터 */}
      <div className="mb-3 space-y-3 rounded-2xl bg-white p-3.5 shadow-sm">
        <div>
          <p className="mb-2 text-xs font-semibold text-gray-500">
            카테고리 (빼고 싶은 건 눌러서 제외)
          </p>
          {modeCategories.length === 0 ? (
            <p className="text-xs text-gray-400">이 모드에 등록된 가게가 없어요.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {modeCategories.map((cat) => {
                const on = !excluded.has(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleExclude(cat)}
                    className={`inline-flex items-center gap-1 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                      on
                        ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                        : "border-gray-200 bg-white text-gray-400 line-through hover:bg-gray-50"
                    }`}
                  >
                    {on && <span className="text-[11px]">✓</span>}
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-gray-500">옵션</p>
          <button
            type="button"
            onClick={() => {
              setExcludeBad((v) => !v);
              resetPick();
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              excludeBad
                ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span
              className={`grid h-4 w-4 place-items-center rounded-md text-[11px] ${
                excludeBad ? "bg-white/25" : "border border-gray-300"
              }`}
            >
              {excludeBad ? "✓" : ""}
            </span>
            낮은 평가(2.5점 미만) 제외
          </button>
        </div>

        <p className="pt-0.5 text-xs text-gray-400">후보 {candidates.length}곳</p>
      </div>

      {/* 방식 선택 */}
      <div className="mb-3 grid grid-cols-4 gap-1.5">
        {METHODS.map((m) => {
          const on = method === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => changeMethod(m.id)}
              className={`rounded-lg border px-1 py-2 text-xs font-semibold transition ${
                on
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {candidates.length === 0 ? (
        <p className="mt-2 text-center text-sm text-gray-400">
          조건에 맞는 가게가 없어요. 필터를 바꾸거나 가게를 먼저 등록해보세요.
        </p>
      ) : resultPlace ? (
        /* 결과 */
        <div
          ref={stageRef}
          className="mt-1 flex min-h-[200px] flex-col items-center justify-center rounded-xl bg-white p-4 shadow-sm"
        >
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="w-full text-center"
          >
            <p className="mb-1 text-sm font-medium text-blue-600">{resultPlace.category}</p>
            <p className="mb-2.5 text-4xl font-extrabold text-gray-900">{resultPlace.name}</p>
            <span
              className="inline-block whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold text-white"
              style={{ backgroundColor: scoreToColor(resultScore) }}
            >
              {scoreToFiveText(resultScore)}점
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
              <button
                type="button"
                onClick={resetPick}
                className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
              >
                다시 뽑기 🎲
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        /* 선택한 방식으로 뽑기 */
        <div key={`${method}-${runKey}`}>
          {method === "reel" && <ReelPicker {...pickerProps} />}
          {method === "wheel" && <WheelPicker {...pickerProps} />}
          {method === "cards" && <CardsPicker {...pickerProps} />}
          {method === "worldcup" && <WorldcupPicker {...pickerProps} />}
        </div>
      )}
    </div>
  );
}
