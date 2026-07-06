"use client";

import { useState } from "react";
import { Place } from "@/types";
import { PRESET_CATEGORIES } from "@/lib/categories";

interface AddPlaceFormProps {
  coords: { lat: number; lng: number };
  categorySuggestions: string[];
  onSave: (place: Omit<Place, "id">) => void;
  onCancel: () => void;
}

export default function AddPlaceForm({
  coords,
  categorySuggestions,
  onSave,
  onCancel,
}: AddPlaceFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [naverMapUrl, setNaverMapUrl] = useState("");

  const categoryOptions = Array.from(new Set([...PRESET_CATEGORIES, ...categorySuggestions]));

  const canSave = name.trim().length > 0 && naverMapUrl.trim().length > 0;

  function openNaverMapPreview() {
    const url =
      naverMapUrl.trim() ||
      `https://map.naver.com/p/search/${encodeURIComponent(name.trim() || "판교")}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleSave() {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      category: category.trim() || "기타",
      naverMapUrl: naverMapUrl.trim(),
      lat: coords.lat,
      lng: coords.lng,
    });
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex items-start justify-between border-b border-gray-100 p-4">
        <h2 className="text-lg font-bold text-gray-900">새 가게 추가</h2>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <p className="text-xs text-gray-500">
          선택한 위치: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
        </p>

        <div>
          <label className="mb-1 block text-xs text-gray-500">가게 이름 (필수)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 판교 국밥집"
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
            autoFocus
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">카테고리</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900"
          >
            <option value="">카테고리 선택</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs text-gray-500">네이버지도 링크 (필수)</label>
          <input
            value={naverMapUrl}
            onChange={(e) => setNaverMapUrl(e.target.value)}
            placeholder="네이버지도 앱/웹에서 복사한 링크를 붙여넣으세요"
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900"
          />
          <button
            type="button"
            onClick={openNaverMapPreview}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600"
          >
            네이버지도에서 검색/확인하기 ↗
          </button>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            다시 선택
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
