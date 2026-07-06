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
