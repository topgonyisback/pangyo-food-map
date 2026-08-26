"use client";

import { useRef } from "react";
import { QUICK_SCORE_LABEL, QuickScore } from "@/types";
import { quickScoreColor, scoreToColor } from "@/lib/rating";

const SEGMENTS = [1, 2, 3, 4, 5];
const EMPTY = "#EFEBE6";

function segRounded(i: number): string {
  if (i === 1) return "rounded-l-full rounded-r-sm";
  if (i === 5) return "rounded-r-full rounded-l-sm";
  return "rounded-sm";
}

function formatScore(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

// 세그먼트 하나 (frac: 0~1 만큼 왼쪽부터 채움 → 반쪽 채움 지원)
function Seg({ frac, color, cls }: { frac: number; color: string; cls: string }) {
  return (
    <div className={`relative overflow-hidden ${cls}`} style={{ backgroundColor: EMPTY }}>
      {frac > 0 && (
        <div
          className="absolute inset-y-0 left-0"
          style={{ width: `${frac * 100}%`, backgroundColor: color }}
        />
      )}
    </div>
  );
}

// 입력용: 탭하거나 밀어서 0~5(0.5 단위) 선택
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
  const color = active ? quickScoreColor(value) : EMPTY;

  function fromClientX(clientX: number) {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    let ratio = (clientX - r.left) / r.width;
    ratio = Math.min(1, Math.max(0, ratio));
    const snapped = Math.round(ratio * 5 * 2) / 2; // 0~5, 0.5 단위
    onChange(snapped as QuickScore);
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline gap-2">
        <span
          className="text-xl font-extrabold"
          style={{ color: active ? quickScoreColor(value) : "#9CA3AF" }}
        >
          {active ? formatScore(value) : "–"}
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
        {SEGMENTS.map((i) => {
          const frac = active ? Math.min(1, Math.max(0, value - (i - 1))) : 0;
          return <Seg key={i} frac={frac} color={color} cls={`h-9 flex-1 ${segRounded(i)}`} />;
        })}
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-medium text-gray-400">
        <span>노맛</span>
        <span>인생맛집</span>
      </div>
    </div>
  );
}

// 표시용(작은 반쪽 채움 바): 개별 평가 점수를 한눈에
export function SegmentedRatingBar({ score }: { score: QuickScore }) {
  const color = quickScoreColor(score);
  return (
    <div className="flex gap-0.5">
      {SEGMENTS.map((i) => {
        const frac = Math.min(1, Math.max(0, score - (i - 1)));
        return <Seg key={i} frac={frac} color={color} cls={`h-1.5 w-3.5 ${segRounded(i)}`} />;
      })}
    </div>
  );
}

// 표시용(평균 채움 바): 평균(0~5)을 점수 색으로 채움
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
