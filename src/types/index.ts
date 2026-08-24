export type ThreeTier = "bad" | "soso" | "good";

// 한줄 평가: 1~5 단계
export type QuickScore = 1 | 2 | 3 | 4 | 5;

export const QUICK_SCORE_LABEL: Record<QuickScore, string> = {
  1: "별로",
  2: "조금 별로",
  3: "쏘쏘",
  4: "적당히 맛있음",
  5: "맛있음",
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
