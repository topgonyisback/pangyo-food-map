"use client";

import { useMemo, useState } from "react";
import { Place, Review } from "@/types";
import { averageQuickRating, scoreToColor, scoreToFiveText } from "@/lib/rating";

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

interface SearchBarProps {
  places: Place[];
  reviews: Review[];
  onSelect: (placeId: string) => void;
}

export default function SearchBar({ places, reviews, onSelect }: SearchBarProps) {
  const [q, setQ] = useState("");
  const query = normalize(q);

  const results = useMemo(() => {
    if (!query) return [];
    return places
      .filter(
        (p) => normalize(p.name).includes(query) || normalize(p.category).includes(query)
      )
      .slice(0, 8);
  }, [places, query]);

  return (
    <div className="pointer-events-none absolute inset-x-2 top-16 z-20 sm:inset-x-auto sm:left-3 sm:w-96">
      {/* 검색 입력 */}
      <div className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 shadow-lg ring-1 ring-black/5">
        <span className="text-base leading-none text-gray-400" aria-hidden>
          🔍
        </span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="가게 이름·카테고리 검색"
          className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label="검색어 지우기"
            className="shrink-0 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* 결과 드롭다운 */}
      {query && (
        <div className="pointer-events-auto mt-1.5 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
          {results.length === 0 ? (
            <p className="px-3.5 py-4 text-sm text-gray-400">
              &apos;{q}&apos; 검색 결과가 없어요
            </p>
          ) : (
            <ul className="max-h-[60vh] overflow-y-auto">
              {results.map((p) => {
                const score = averageQuickRating(reviews.filter((r) => r.placeId === p.id));
                return (
                  <li key={p.id} className="border-b border-gray-50 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(p.id);
                        setQ("");
                      }}
                      className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-blue-600">{p.category}</p>
                        <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
                      </div>
                      <span
                        className="shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
                        style={{ backgroundColor: scoreToColor(score) }}
                      >
                        {scoreToFiveText(score)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
