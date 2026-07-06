"use client";

import { useEffect, useState } from "react";

const SCRIPT_ID = "naver-maps-sdk";

type ScriptStatus = "missing-key" | "loading" | "loaded" | "error";

function getInitialStatus(clientId?: string): ScriptStatus {
  if (!clientId) return "missing-key";
  if (typeof window !== "undefined" && window.naver?.maps) return "loaded";
  return "loading";
}

export function useNaverMapsScript(): ScriptStatus {
  const clientId = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID;
  const [status, setStatus] = useState<ScriptStatus>(() => getInitialStatus(clientId));

  useEffect(() => {
    if (!clientId || status === "loaded") return;

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => setStatus("loaded"));
      existing.addEventListener("error", () => setStatus("error"));
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    // NCP 신규 발급 키는 ncpKeyId 파라미터를 사용합니다. (레거시 키는 ncpClientId)
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
    script.async = true;
    script.onload = () => setStatus("loaded");
    script.onerror = () => setStatus("error");
    document.head.appendChild(script);
  }, [clientId, status]);

  return status;
}
