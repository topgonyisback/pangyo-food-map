import { QuickScore, Review } from "@/types";

// 한줄 평가는 0~5 점수이므로 평균이 곧 5점 만점 점수
export function averageQuickRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.quickRating, 0);
  return sum / reviews.length;
}

// 점수(0~5) → 색 (반올림한 정수 단계 신호등: 별로 빨강 → 인생맛집 초록)
export function scoreToColor(score: number | null): string {
  if (score === null) return "#9CA3AF"; // gray - 아직 평가 없음
  if (score < 1.5) return "#EF4444"; // red (0~1)
  if (score < 2.5) return "#F59E0B"; // amber (1.5~2)
  if (score < 3.5) return "#FACC15"; // yellow (2.5~3)
  if (score < 4.5) return "#84CC16"; // lime (3.5~4)
  return "#22C55E"; // green (4.5~5)
}

// 개별 점수(0~5) → 색
export function quickScoreColor(score: QuickScore): string {
  return scoreToColor(score);
}

// 표시용 평균 문자열 ("3.8"). 평가 없으면 "–"
export function scoreToFiveText(score: number | null): string {
  return score === null ? "–" : score.toFixed(1);
}

// 분포 (정수 단계로 묶어 5줄 표시: 0.5 단위는 가까운 정수로 반올림)
export interface QuickDist {
  counts: Record<number, number>;
  total: number;
}

export function ratingDistribution(reviews: Review[]): QuickDist {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const bucket = Math.min(5, Math.max(1, Math.round(r.quickRating)));
    counts[bucket] += 1;
  }
  return { counts, total: reviews.length };
}
