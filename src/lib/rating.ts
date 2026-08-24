import { QuickScore, Review } from "@/types";

// 한줄 평가는 1~5 점수이므로 평균이 곧 5점 만점 점수
export function averageQuickRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.quickRating, 0);
  return sum / reviews.length;
}

// 평균(1~5) → 색 (빨/노/초 3구간, 핀·배지용)
export function scoreToColor(score: number | null): string {
  if (score === null) return "#9CA3AF"; // gray - 아직 평가 없음
  if (score < 2.5) return "#EF4444"; // red
  if (score < 3.5) return "#F59E0B"; // yellow
  return "#22C55E"; // green
}

// 개별 점수(1~5) → 색 (5단계 램프: 빨→주황→노랑→라임→초록)
const QUICK_COLORS: Record<QuickScore, string> = {
  1: "#EF4444", // red
  2: "#F59E0B", // amber
  3: "#FACC15", // yellow
  4: "#84CC16", // lime
  5: "#22C55E", // green
};

export function quickScoreColor(score: QuickScore): string {
  return QUICK_COLORS[score];
}

// 표시용 평균 문자열 ("3.8"). 평가 없으면 "–"
export function scoreToFiveText(score: number | null): string {
  return score === null ? "–" : score.toFixed(1);
}

// 5단계 분포 (각 점수별 개수)
export interface QuickDist {
  counts: Record<QuickScore, number>;
  total: number;
}

export function ratingDistribution(reviews: Review[]): QuickDist {
  const counts: Record<QuickScore, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) counts[r.quickRating] += 1;
  return { counts, total: reviews.length };
}
