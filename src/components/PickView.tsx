"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Place, Review } from "@/types";
import { averageQuickRating, scoreToColor, scoreToFiveText } from "@/lib/rating";

interface PickViewProps {
  places: Place[];
  reviews: Review[];
  onGoToPlace: (placeId: string) => void;
  onSelectPlace: (placeId: string | null) => void;
}

type Phase = "idle" | "spinning" | "result";
type PickMode = "lunch" | "coffee";

const ITEM_H = 150; // 릴 한 칸 높이(px)
const REEL_LEN = 26; // 스핀 동안 지나가는 칸 수

// 커피타임 카테고리 판별 (그 외는 점심시간)
const COFFEE_KEYWORDS = ["카페", "커피", "디저트", "베이커리", "브런치", "빵"];
function isCoffeeCategory(cat: string): boolean {
  return COFFEE_KEYWORDS.some((k) => cat.includes(k));
}

export default function PickView({
  places,
  reviews,
  onGoToPlace,
  onSelectPlace,
}: PickViewProps) {
  const [mode, setMode] = useState<PickMode>("lunch");
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [excludeBad, setExcludeBad] = useState(true);
  const [phase, setPhase] = useState<Phase>("idle");
  const [reel, setReel] = useState<Place[]>([]);
  const [spinKey, setSpinKey] = useState(0);
  const [resultId, setResultId] = useState<string | null>(null);
  const lastPickedRef = useRef<string | null>(null);
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
    setPhase("idle");
    setResultId(null);
  }

  function changeMode(m: PickMode) {
    setMode(m);
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
    // 슬롯 릴(결과 영역) 위치에서 터지도록 원점 계산 (뷰포트 정중앙 X)
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
    <div className="absolute inset-x-2 top-16 z-10 flex max-h-[calc(100%-4.5rem)] flex-col overflow-y-auto rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-black/5 backdrop-blur sm:inset-x-auto sm:left-3 sm:w-96">
      <h2 className="mb-1 text-xl font-bold text-gray-900">오늘 뭐먹지? 🎲</h2>
      <p className="mb-4 text-sm text-gray-500">모드와 조건을 고르고 버튼을 누르면 랜덤으로 골라드려요.</p>

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
      <div className="mb-4 space-y-3 rounded-2xl bg-white p-3.5 shadow-sm">
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
              setPhase("idle");
              setResultId(null);
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

      {/* 뽑기 버튼 (필터 바로 아래) */}
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
            : mode === "coffee"
              ? "오늘의 커피 뽑기 ☕"
              : "오늘의 점심 뽑기 🎲"}
      </motion.button>

      {candidates.length === 0 && (
        <p className="mt-3 text-center text-sm text-gray-400">
          조건에 맞는 가게가 없어요. 필터를 바꾸거나 가게를 먼저 등록해보세요.
        </p>
      )}

      {/* 결과 / 슬롯 — 버튼을 누른 뒤에만 하단에 등장 */}
      {phase !== "idle" && (
        <div
          ref={stageRef}
          className="mt-4 flex min-h-[200px] items-center justify-center overflow-hidden rounded-xl bg-white p-4 shadow-sm"
        >
          {phase === "spinning" ? (
            // 슬롯 릴 (세로로 감속하며 멈춤)
            <div className="relative w-full overflow-hidden" style={{ height: ITEM_H }}>
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
                    <span className="mb-1 text-base font-medium text-blue-500">
                      {p.category}
                    </span>
                    <span className="text-4xl font-extrabold text-gray-800">{p.name}</span>
                  </div>
                ))}
              </motion.div>
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
              </div>
            </motion.div>
          ) : null}
        </div>
      )}
    </div>
  );
}
