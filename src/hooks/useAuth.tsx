"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updatePassword as fbUpdatePassword,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { fetchNickname, insertProfile, isNicknameTaken } from "@/lib/db";

interface AuthContextValue {
  user: User | null;
  nickname: string | null;
  loading: boolean;
  signUp: (email: string, password: string, nickname: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(auth));

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        fetchNickname(u.uid)
          .then((n) => setNickname(n))
          .catch(() => {});
      } else {
        setNickname(null);
      }
    });
    return () => unsub();
  }, []);

  async function signUp(email: string, password: string, nick: string) {
    if (!auth) throw new Error(CONNECT_FAIL_MSG);
    const trimmed = nick.trim();
    if (trimmed.length === 0) throw new Error("닉네임을 입력해주세요.");

    let taken: boolean;
    try {
      taken = await isNicknameTaken(trimmed);
    } catch (e) {
      throw friendlyAuthError(e);
    }
    if (taken) throw new Error("이미 사용 중인 닉네임이에요.");

    let uid: string;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
    } catch (e) {
      throw friendlyAuthError(e);
    }

    try {
      await insertProfile(uid, trimmed);
    } catch {
      throw new Error("닉네임 저장에 실패했어요. (이미 쓰는 닉네임일 수 있어요)");
    }
    setNickname(trimmed);
  }

  async function signIn(email: string, password: string) {
    if (!auth) throw new Error(CONNECT_FAIL_MSG);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      throw friendlyAuthError(e);
    }
  }

  async function signOut() {
    if (!auth) return;
    await fbSignOut(auth);
  }

  async function sendPasswordReset(email: string) {
    if (!auth) throw new Error(CONNECT_FAIL_MSG);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      throw friendlyAuthError(e);
    }
  }

  async function updatePassword(currentPassword: string, newPassword: string) {
    const current = auth?.currentUser;
    if (!current || !current.email) throw new Error("로그인이 필요해요.");

    // 1) 현재 비밀번호로 재인증
    try {
      const cred = EmailAuthProvider.credential(current.email, currentPassword);
      await reauthenticateWithCredential(current, cred);
    } catch (e) {
      const raw =
        typeof e === "object" && e !== null && "code" in e
          ? String((e as { code: string }).code).toLowerCase()
          : "";
      if (
        raw.includes("wrong-password") ||
        raw.includes("invalid-credential") ||
        raw.includes("invalid-login")
      ) {
        throw new Error("현재 비밀번호가 올바르지 않아요.");
      }
      throw friendlyAuthError(e);
    }

    // 2) 새 비밀번호로 변경
    try {
      await fbUpdatePassword(current, newPassword);
    } catch (e) {
      throw friendlyAuthError(e);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        nickname,
        loading,
        signUp,
        signIn,
        signOut,
        sendPasswordReset,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

const CONNECT_FAIL_MSG = "서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.";

function friendlyAuthError(e: unknown): Error {
  const raw =
    typeof e === "object" && e !== null && "code" in e
      ? String((e as { code: string }).code)
      : e instanceof Error
        ? e.message
        : "";
  return new Error(translateAuthError(raw));
}

function translateAuthError(codeOrMessage: string): string {
  const m = codeOrMessage.toLowerCase();
  if (m.includes("network") || m.includes("failed to fetch") || m.includes("unavailable"))
    return CONNECT_FAIL_MSG;
  if (
    m.includes("invalid-credential") ||
    m.includes("wrong-password") ||
    m.includes("user-not-found") ||
    m.includes("invalid-login")
  )
    return "이메일 또는 비밀번호가 올바르지 않아요.";
  if (m.includes("email-already-in-use")) return "이미 가입된 이메일이에요.";
  if (m.includes("weak-password")) return "비밀번호는 6자 이상이어야 해요.";
  if (m.includes("invalid-email")) return "이메일 형식이 올바르지 않아요.";
  if (m.includes("too-many-requests"))
    return "요청이 많아요. 잠시 후 다시 시도해주세요.";
  if (m.includes("requires-recent-login"))
    return "보안을 위해 다시 로그인한 뒤 비밀번호를 변경해주세요.";
  return "문제가 발생했어요. 잠시 후 다시 시도해주세요.";
}
