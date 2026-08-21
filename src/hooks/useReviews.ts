"use client";

import { useEffect, useState } from "react";
import { Review } from "@/types";
import { deleteReviewRow, fetchReviews, insertReview, updateReviewRow } from "@/lib/db";

type ReviewEditable = Pick<
  Review,
  "quickRating" | "atmosphereRating" | "restroomRating" | "freeComment" | "menuNotes"
>;

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
      .catch((e) => {
        console.error("평가 저장 실패:", e);
        alert("평가 저장에 실패했어요. 로그인 상태를 확인해주세요.");
      });
  }

  function updateReview(reviewId: string, patch: ReviewEditable) {
    setReviews((prev) =>
      prev.map((r) => (r.id === reviewId ? { ...r, ...patch } : r))
    );
    updateReviewRow(reviewId, patch).catch((e) => {
      console.error("평가 수정 실패:", e);
      alert("평가 수정에 실패했어요.");
    });
  }

  function deleteReview(reviewId: string) {
    setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    deleteReviewRow(reviewId).catch((e) => {
      console.error("평가 삭제 실패:", e);
      alert("평가 삭제에 실패했어요.");
    });
  }

  function reviewsForPlace(placeId: string) {
    return reviews.filter((r) => r.placeId === placeId);
  }

  return { reviews, addReview, updateReview, deleteReview, reviewsForPlace };
}
