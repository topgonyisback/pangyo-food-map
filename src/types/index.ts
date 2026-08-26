export type ThreeTier = "bad" | "soso" | "good";

// 한줄 평가: 0~5, 0.5 단위 (11단계)
export type QuickScore = number;

export const QUICK_SCORES: QuickScore[] = [
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5,
];

export const QUICK_SCORE_LABEL: Record<number, string> = {
  0: "노맛",
  0.5: "최악",
  1: "별로",
  1.5: "좀 별로",
  2: "아쉬움",
  2.5: "쏘쏘",
  3: "무난",
  3.5: "괜찮음",
  4: "맛있음",
  4.5: "아주 맛있음",
  5: "인생맛집",
};

export type PinMode = { type: "add" } | { type: "edit"; placeId: string } | null;

export interface Place {
  id: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  naverMapUrl: string;
  userId?: string | null;
}

export interface MenuNote {
  menuName: string;
  rating: ThreeTier;
}

export interface Review {
  id: string;
  placeId: string;
  authorName: string;
  quickRating: QuickScore;
  atmosphereRating?: ThreeTier;
  restroomRating?: ThreeTier;
  freeComment?: string;
  menuNotes: MenuNote[];
  createdAt: string;
  userId?: string | null;
}

export const THREE_TIER_LABEL: Record<ThreeTier, string> = {
  bad: "별로예요",
  soso: "쏘쏘예요",
  good: "맛있어요",
};

export const MENU_TIER_LABEL: Record<ThreeTier, string> = {
  bad: "맛없었음",
  soso: "보통",
  good: "맛있었음",
};

export const ATMOSPHERE_TIER_LABEL: Record<ThreeTier, string> = {
  bad: "별로예요",
  soso: "쏘쏘예요",
  good: "좋아요",
};

export const RESTROOM_TIER_LABEL: Record<ThreeTier, string> = {
  bad: "별로예요",
  soso: "쏘쏘예요",
  good: "깨끗해요",
};
