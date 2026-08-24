"use client";

import { useRef } from "react";
import { QUICK_SCORE_LABEL, QuickScore } from "@/types";
import { quickScoreColor, scoreToColor } from "@/lib/rating";

const LEVELS: QuickScore[] = [1, 2, 3, 4, 5];
const EMPTY = "#EFEBE6";

function segRounded(lv: QuickScore): string {
  if (lv === 1) return "rounded-l-full rounded-r-sm";
  if (lv === 5) return "rounded-r-full rounded-l-sm";
  return "rounded-sm";
}

// 입력용: 탭하거나 밀어서 1~5 선택 (레퍼런스: 분절 Likert + 슬라이드)
export function SegmentedRatingInput({
  value,
  onChange,
}: {
  value?: QuickScore;
  onChange: (v: QuickScore) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const active = value !== undefined;

  function fromClientX(clientX: number) {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ratio = (clientX - r.left) / r.width;
    const lv = Math.min(5, Math.max(1, Math.ceil(ratio * 5)));
    onChange(lv as QuickScore);
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <span
          className="text-xl font-extrabold"
          style={{ color: active ? quickScoreColor(value) : "#9CA3AF" }}
        >
          {active ? value : "–"}
        </span>
        <span className={`text-sm font-semibold ${active ? "text-gray-900" : "text-gray-400"}`}>
          {active ? QUICK_SCORE_LABEL[value] : "탭하거나 밀어서 평가해주세요"}
        </span>
      </div>
      <div
        ref={trackRef}
        className="flex touch-none select-none gap-1"
        onPointerDown={(e) => {
          trackRef.current?.setPointerCapture(e.pointerId);
          dragging.current = true;
          fromClientX(e.clientX);
        }}
        onPointerMove={(e) => {
          if (dragging.current) fromClientX(e.clientX);
        }}
        onPointerUp={() => {
          dragging.current = false;
        }}
        onPointerCancel={() => {
          dragging.current = false;
        }}
      >
        {LEVELS.map((lv) => {
          const filled = active && lv <= value;
          return (
            <div
              key={lv}
              className={`h-9 flex-1 transition-colors ${segRounded(lv)}`}
              style={{ backgroundColor: filled ? quickScoreColor(lv) : EMPTY }}
            />
          );
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-medium text-gray-400">
        <span>별로</span>
        <span>맛있음</span>
      </div>
    </div>
  );
}

// 표시용(작은 분절 바): 개별 평가 점수를 한눈에
export function SegmentedRatingBar({ score }: { score: QuickScore }) {
  return (
    <div className="flex gap-0.5">
      {LEVELS.map((lv) => (
        <div
          key={lv}
          className={`h-1.5 w-3.5 ${segRounded(lv)}`}
          style={{ backgroundColor: lv <= score ? quickScoreColor(lv) : EMPTY }}
        />
      ))}
    </div>
  );
}

// 표시용(평균 채움 바): 평균(1~5)을 점수 색으로 채움 (레퍼런스: 노이즈/애널리틱스 카드)
export function AverageFillBar({ avg }: { avg: number }) {
  const pct = Math.min(100, Math.max(0, (avg / 5) * 100));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: EMPTY }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, backgroundColor: scoreToColor(avg) }}
      />
    </div>
  );
}
