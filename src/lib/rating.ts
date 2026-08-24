import { Review, ThreeTier } from "@/types";

const SCORE: Record<ThreeTier, number> = { bad: 1, soso: 2, good: 3 };

export function averageQuickRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + SCORE[r.quickRating], 0);
  return sum / reviews.length;
}

export function scoreToColor(score: number | null): string {
  if (score === null) return "#9CA3AF"; // gray - 아직 평가 없음
  if (score < 1.75) return "#EF4444"; // red
  if (score < 2.5) return "#F59E0B"; // yellow
  return "#22C55E"; // green
}

export function scoreToLabel(score: number | null): string {
  if (score === null) return "평가 없음";
  if (score < 1.75) return "별로예요";
  if (score < 2.5) return "쏘쏘예요";
  return "맛있어요";
}

// 내부 1~3점(별로1·쏘쏘2·맛있3) 평균을 5점 만점으로 환산.
// 별로예요=1, 쏘쏘예요=3, 맛있어요=5 균등 배정과 동일: five = avg*2 - 1
export function scoreToFive(score: number | null): number | null {
  if (score === null) return null;
  return Math.round((score * 2 - 1) * 10) / 10; // 소수점 1자리
}

// 표시용 5점 문자열 ("4.5"). 평가 없으면 "–"
export function scoreToFiveText(score: number | null): string {
  const five = scoreToFive(score);
  return five === null ? "–" : five.toFixed(1);
}

export interface RatingDist {
  good: number;
  soso: number;
  bad: number;
  total: number;
}

export function ratingDistribution(reviews: Review[]): RatingDist {
  let good = 0;
  let soso = 0;
  let bad = 0;
  for (const r of reviews) {
    if (r.quickRating === "good") good += 1;
    else if (r.quickRating === "soso") soso += 1;
    else bad += 1;
  }
  return { good, soso, bad, total: reviews.length };
}
