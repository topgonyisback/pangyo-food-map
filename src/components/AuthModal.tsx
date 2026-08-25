"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export type AuthMode = "signin" | "signup" | "reset" | "newpassword" | "nickname";

interface AuthModalProps {
  initialMode?: AuthMode;
  // recovery/설정에서 열릴 때는 닫기만, 일반 모달은 배경 클릭으로도 닫힘
  onClose: () => void;
}

export default function AuthModal({ initialMode = "signin", onClose }: AuthModalProps) {
  const {
    signIn,
    signUp,
    sendPasswordReset,
    updatePassword,
    changeNickname,
    nickname: currentNickname,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nickname, setNickname] = useState(
    initialMode === "nickname" ? (currentNickname ?? "") : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        await signIn(email.trim(), password);
        onClose();
      } else if (mode === "signup") {
        await signUp(email.trim(), password, nickname);
        onClose();
      } else if (mode === "reset") {
        await sendPasswordReset(email.trim());
        setInfo("재설정 링크를 이메일로 보냈어요. 메일함(스팸함 포함)을 확인해주세요.");
      } else if (mode === "newpassword") {
        if (currentPassword.length === 0) throw new Error("현재 비밀번호를 입력해주세요.");
        if (password.length < 6) throw new Error("새 비밀번호는 6자 이상이어야 해요.");
        if (password === currentPassword)
          throw new Error("새 비밀번호가 현재 비밀번호와 같아요.");
        await updatePassword(currentPassword, password);
        setInfo("비밀번호가 변경됐어요.");
        setTimeout(onClose, 900);
      } else if (mode === "nickname") {
        const trimmed = nickname.trim();
        if (trimmed.length === 0) throw new Error("닉네임을 입력해주세요.");
        if (trimmed === currentNickname) throw new Error("현재 닉네임과 같아요.");
        await changeNickname(trimmed);
        setInfo("닉네임이 변경됐어요.");
        setTimeout(onClose, 900);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했어요.");
    } finally {
      setBusy(false);
    }
  }

  const titles: Record<AuthMode, string> = {
    signin: "로그인",
    signup: "회원가입",
    reset: "비밀번호 찾기",
    newpassword: "비밀번호 변경",
    nickname: "닉네임 변경",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{titles[mode]}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          {(mode === "signup" || mode === "nickname") && (
            <div>
              <label className="mb-1 block text-xs text-gray-500">닉네임 (표시 이름)</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="예: 판교점심러"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
          )}

          {mode !== "newpassword" && mode !== "nickname" && (
            <div>
              <label className="mb-1 block text-xs text-gray-500">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
          )}

          {mode === "newpassword" && (
            <div>
              <label className="mb-1 block text-xs text-gray-500">현재 비밀번호</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
          )}

          {mode !== "reset" && mode !== "nickname" && (
            <div>
              <label className="mb-1 block text-xs text-gray-500">
                {mode === "newpassword" ? "새 비밀번호 (6자 이상)" : "비밀번호"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          {info && <p className="text-sm text-green-600">{info}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-300"
          >
            {busy
              ? "처리 중…"
              : mode === "signin"
                ? "로그인"
                : mode === "signup"
                  ? "가입하기"
                  : mode === "reset"
                    ? "재설정 메일 보내기"
                    : "변경하기"}
          </button>
        </div>

        {/* 모드 전환 링크 */}
        {mode !== "newpassword" && mode !== "nickname" && (
          <div className="mt-4 flex flex-col gap-1.5 text-center text-xs text-gray-500">
            {mode === "signin" && (
              <>
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  계정이 없어요 → 회원가입
                </button>
                <button
                  type="button"
                  className="hover:underline"
                  onClick={() => {
                    setMode("reset");
                    setError(null);
                    setInfo(null);
                  }}
                >
                  비밀번호를 잊었어요
                </button>
              </>
            )}
            {mode === "signup" && (
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setInfo(null);
                }}
              >
                이미 계정이 있어요 → 로그인
              </button>
            )}
            {mode === "reset" && (
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => {
                  setMode("signin");
                  setError(null);
                  setInfo(null);
                }}
              >
                ← 로그인으로 돌아가기
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
