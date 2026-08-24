import { QuickScore, Review } from "@/types";

// 한줄 평가는 1~5 점수이므로 평균이 곧 5점 만점 점수
export function averageQuickRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.quickRating, 0);
  return sum / reviews.length;
}

// 개별 점수(1~5) → 색 (따뜻한 램프: 노랑 → 진한 주황빨강, 레퍼런스 스타일)
const QUICK_COLORS: Record<QuickScore, string> = {
  1: "#FFD24D", // yellow
  2: "#FFAE1F", // amber
  3: "#FF8C1A", // orange
  4: "#FB6516", // deep orange
  5: "#F5411A", // red-orange
};

// 평균(1~5) → 색 (반올림한 단계 색, 핀·배지용)
export function scoreToColor(score: number | null): string {
  if (score === null) return "#9CA3AF"; // gray - 아직 평가 없음
  const lv = Math.min(5, Math.max(1, Math.round(score))) as QuickScore;
  return QUICK_COLORS[lv];
}

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
