"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Place } from "@/types";

const ITEM_H = 150; // 슬롯릴 한 칸 높이
const REEL_LEN = 26;
const WHEEL_MAX = 8; // 돌림판 최대 조각
const CARD_MAX = 9; // 카드 최대 장수

const SLICE_COLORS = [
  "#3B82F6",
  "#22C55E",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sample<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function prefersReduced(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

interface PickerProps {
  candidates: Place[];
  onPicked: (place: Place) => void;
}

/* ---------- 1. 슬롯릴 ---------- */
export function ReelPicker({ candidates, onPicked }: PickerProps) {
  const [spinning, setSpinning] = useState(false);
  const [reel, setReel] = useState<Place[]>([]);
  const [spinKey, setSpinKey] = useState(0);
  const lastRef = useRef<string | null>(null);

  function pick() {
    if (spinning || candidates.length === 0) return;
    let pool = candidates;
    if (candidates.length > 1 && lastRef.current) {
      pool = candidates.filter((p) => p.id !== lastRef.current);
    }
    const final = rand(pool);
    lastRef.current = final.id;
    if (prefersReduced()) {
      onPicked(final);
      return;
    }
    const items = Array.from({ length: REEL_LEN - 1 }, () => rand(candidates));
    items.push(final);
    setReel(items);
    setSpinning(true);
    setSpinKey((k) => k + 1);
  }

  return (
    <div>
      <PickButton onClick={pick} disabled={candidates.length === 0 || spinning}>
        {spinning ? "뽑는 중…" : "돌려서 뽑기 🎰"}
      </PickButton>
      {spinning && (
        <div className="mt-4 flex min-h-[180px] items-center justify-center overflow-hidden rounded-xl bg-white p-4 shadow-sm">
          <div className="relative w-full overflow-hidden" style={{ height: ITEM_H }}>
            <motion.div
              key={spinKey}
              initial={{ y: 0 }}
              animate={{ y: -(reel.length - 1) * ITEM_H }}
              transition={{ duration: 2.4, ease: [0.12, 0.7, 0.1, 1] }}
              onAnimationComplete={() => {
                setSpinning(false);
                onPicked(reel[reel.length - 1]);
              }}
            >
              {reel.map((p, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center"
                  style={{ height: ITEM_H }}
                >
                  <span className="mb-1 text-base font-medium text-blue-500">{p.category}</span>
                  <span className="text-4xl font-extrabold text-gray-800">{p.name}</span>
                </div>
              ))}
            </motion.div>
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gray-100" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gray-100" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- 2. 돌림판 ---------- */
export function WheelPicker({ candidates, onPicked }: PickerProps) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const slices = useMemo(
    () => (candidates.length > WHEEL_MAX ? sample(candidates, WHEEL_MAX) : candidates),
    [candidates]
  );
  const n = slices.length;
  const sliceAngle = n > 0 ? 360 / n : 360;

  function pointOnCircle(cx: number, cy: number, r: number, deg: number) {
    const rad = (deg * Math.PI) / 180;
    return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
  }

  function pick() {
    if (spinning || n === 0) return;
    const idx = Math.floor(Math.random() * n);
    if (prefersReduced()) {
      onPicked(slices[idx]);
      return;
    }
    const target =
      360 * 5 - (idx * sliceAngle + sliceAngle / 2) + (rotation - (rotation % 360));
    setRotation(target);
    setSpinning(true);
    window.setTimeout(() => {
      setSpinning(false);
      onPicked(slices[idx]);
    }, 3200);
  }

  const R = 90;
  const C = 100;

  return (
    <div>
      <div className="mt-2 flex justify-center">
        <div className="relative" style={{ width: 220, height: 220 }}>
          {/* 포인터 */}
          <div
            className="absolute left-1/2 top-0 z-10 -translate-x-1/2"
            style={{
              width: 0,
              height: 0,
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: "16px solid #111827",
            }}
          />
          <motion.svg
            viewBox="0 0 200 200"
            width={220}
            height={220}
            animate={{ rotate: rotation }}
            transition={{ duration: 3.2, ease: [0.12, 0.75, 0.1, 1] }}
          >
            {slices.map((p, i) => {
              const a1 = i * sliceAngle;
              const a2 = (i + 1) * sliceAngle;
              const [x1, y1] = pointOnCircle(C, C, R, a1);
              const [x2, y2] = pointOnCircle(C, C, R, a2);
              const large = sliceAngle > 180 ? 1 : 0;
              const mid = a1 + sliceAngle / 2;
              const [lx, ly] = pointOnCircle(C, C, R * 0.62, mid);
              const name = p.name.length > 6 ? p.name.slice(0, 6) + "…" : p.name;
              return (
                <g key={p.id}>
                  <path
                    d={
                      n === 1
                        ? `M ${C - R} ${C} a ${R} ${R} 0 1 1 ${R * 2} 0 a ${R} ${R} 0 1 1 ${-R * 2} 0`
                        : `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`
                    }
                    fill={SLICE_COLORS[i % SLICE_COLORS.length]}
                  />
                  <text
                    x={lx}
                    y={ly}
                    fill="#fff"
                    fontSize="9"
                    fontWeight="700"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${mid} ${lx} ${ly})`}
                  >
                    {name}
                  </text>
                </g>
              );
            })}
            <circle cx={C} cy={C} r="14" fill="#fff" stroke="#E5E7EB" strokeWidth="2" />
          </motion.svg>
        </div>
      </div>
      {candidates.length > WHEEL_MAX && (
        <p className="mt-1 text-center text-[11px] text-gray-400">
          후보가 많아 무작위 {WHEEL_MAX}곳만 올렸어요
        </p>
      )}
      <div className="mt-3">
        <PickButton onClick={pick} disabled={n === 0 || spinning}>
          {spinning ? "돌리는 중…" : "돌림판 돌리기 🎡"}
        </PickButton>
      </div>
    </div>
  );
}

/* ---------- 3. 카드 뒤집기 ---------- */
export function CardsPicker({ candidates, onPicked }: PickerProps) {
  const cards = useMemo(
    () => sample(candidates, Math.min(CARD_MAX, candidates.length)),
    [candidates]
  );
  const [flipped, setFlipped] = useState<number | null>(null);

  function choose(i: number) {
    if (flipped !== null) return;
    setFlipped(i);
    window.setTimeout(() => onPicked(cards[i]), 650);
  }

  return (
    <div>
      <p className="mb-2 text-center text-sm text-gray-500">
        카드 한 장을 골라 뒤집어보세요 🃏
      </p>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((p, i) => {
          const isFlipped = flipped === i;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => choose(i)}
              disabled={flipped !== null}
              className="aspect-[3/4] [perspective:600px]"
            >
              <motion.div
                className="relative h-full w-full [transform-style:preserve-3d]"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-blue-600 text-2xl text-white shadow-sm [backface-visibility:hidden]">
                  ?
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white p-1 text-center shadow-sm [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  <span className="text-[10px] font-medium text-blue-600">{p.category}</span>
                  <span className="text-xs font-bold leading-tight text-gray-800">{p.name}</span>
                </div>
              </motion.div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- 4. 이상형 월드컵 ---------- */
export function WorldcupPicker({ candidates, onPicked }: PickerProps) {
  // 2의 제곱수로 맞춰 대진(최대 16강)
  const bracket = useMemo(() => {
    const pool = sample(candidates, candidates.length);
    let size = 2;
    while (size * 2 <= pool.length && size < 16) size *= 2;
    return pool.slice(0, Math.max(2, size));
  }, [candidates]);

  const [round, setRound] = useState<Place[]>(bracket);
  const [nextRound, setNextRound] = useState<Place[]>([]);
  const [pairIdx, setPairIdx] = useState(0);
  const [intro, setIntro] = useState(true);

  const a = round[pairIdx * 2];
  const b = round[pairIdx * 2 + 1];
  const totalPairs = Math.floor(round.length / 2);
  const roundName =
    round.length >= 16 ? "16강" : round.length >= 8 ? "8강" : round.length >= 4 ? "4강" : "결승";

  // 라운드가 바뀔 때마다 "○○강" 안내를 잠깐 보여준 뒤 숨김 (setState는 콜백에서만)
  useEffect(() => {
    const t = window.setTimeout(() => setIntro(false), 1100);
    return () => window.clearTimeout(t);
  }, [round]);

  function choose(winner: Place) {
    const nr = [...nextRound, winner];
    const nextPair = pairIdx + 1;
    if (nextPair >= totalPairs) {
      // 라운드 종료
      if (nr.length === 1) {
        onPicked(nr[0]);
        return;
      }
      setRound(nr);
      setNextRound([]);
      setPairIdx(0);
      setIntro(true); // 다음 라운드 안내 표시
    } else {
      setNextRound(nr);
      setPairIdx(nextPair);
    }
  }

  if (!a || !b) return null;

  if (intro) {
    return (
      <motion.div
        key={roundName + round.length}
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex min-h-[200px] flex-col items-center justify-center rounded-xl bg-white p-6 text-center shadow-sm"
      >
        <span className="text-5xl">🏆</span>
        <p className="mt-2 text-3xl font-extrabold text-gray-900">{roundName}</p>
        <p className="mt-1 text-sm text-gray-400">
          {round.length}곳 중 최고의 한 곳을 가려요
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-center text-sm font-semibold text-gray-500">
        {roundName} · {pairIdx + 1}/{totalPairs} — 더 끌리는 곳을 고르세요
      </p>
      <div className="space-y-2">
        {[a, b].map((p, i) => (
          <div key={p.id}>
            <button
              type="button"
              onClick={() => choose(p)}
              className="w-full rounded-xl border border-gray-200 bg-white p-4 text-center transition hover:border-blue-400 hover:bg-blue-50"
            >
              <p className="text-xs font-medium text-blue-600">{p.category}</p>
              <p className="text-lg font-extrabold text-gray-900">{p.name}</p>
            </button>
            {i === 0 && <p className="my-1 text-center text-xs font-bold text-gray-400">VS</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- 공용 뽑기 버튼 ---------- */
function PickButton({
  onClick,
  disabled,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.96 }}
      className="w-full rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
    >
      {children}
    </motion.button>
  );
}
