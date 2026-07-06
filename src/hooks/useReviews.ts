"use client";

import { useEffect, useState } from "react";
import { Review } from "@/types";
import { fetchReviews, insertReview } from "@/lib/db";

export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    let active = true;
    fetchReviews()
      .then((rows) => {
        if (active) setReviews(rows);
      })
      .catch((e) => console.error("평가 불러오기 실패:", e));
    return () => {
      active = false;
    };
  }, []);

  function addReview(review: Omit<Review, "id" | "createdAt">) {
    insertReview(review)
      .then((created) => setReviews((prev) => [...prev, created]))
      .catch((e) => console.error("평가 저장 실패:", e));
  }

  function reviewsForPlace(placeId: string) {
    return reviews.filter((r) => r.placeId === placeId);
  }

  return { reviews, addReview, reviewsForPlace };
}
