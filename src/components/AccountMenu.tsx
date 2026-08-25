"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AccountMenuProps {
  onLogin: () => void;
  onChangePassword: () => void;
  onChangeNickname: () => void;
}

export default function AccountMenu({
  onLogin,
  onChangePassword,
  onChangeNickname,
}: AccountMenuProps) {
  const { user, nickname, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <button
        type="button"
        onClick={onLogin}
        className="whitespace-nowrap rounded-full bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        로그인
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[120px] items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <span className="truncate">{nickname ?? "내 계정"}</span>
        <span className="text-xs text-gray-400">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-1 w-36 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onChangeNickname();
              }}
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              닉네임 변경
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onChangePassword();
              }}
              className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              비밀번호 변경
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                signOut();
              }}
              className="block w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-gray-50"
            >
              로그아웃
            </button>
          </div>
        </>
      )}
    </div>
  );
}
