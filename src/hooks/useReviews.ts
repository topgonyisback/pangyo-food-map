"use client";

import { useEffect, useState } from "react";
import { Review } from "@/types";
import { loadReviews, saveReviews } from "@/lib/storage";

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>(() => loadReviews());

  useEffect(() => {
    saveReviews(reviews);
  }, [reviews]);

  function addReview(review: Omit<Review, "id" | "createdAt">) {
    const newReview: Review = {
      ...review,
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    setReviews((prev) => [...prev, newReview]);
  }

  function reviewsForPlace(placeId: string) {
    return reviews.filter((r) => r.placeId === placeId);
  }

  return { reviews, addReview, reviewsForPlace };
}
