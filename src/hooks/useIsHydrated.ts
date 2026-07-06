"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// 서버 렌더링과 클라이언트 hydration 시점의 값이 다른 상태(localStorage 등)를
// 안전하게 다루기 위한 표준 패턴입니다.
export function useIsHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
