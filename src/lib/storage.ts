// 작성자 이름만 브라우저에 기억해두는 개인 편의용 저장소입니다.
// (가게/평가 데이터는 Supabase에 저장됩니다.)

const AUTHOR_KEY = "pangyo-lunch-author-name";

export function getAuthorName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(AUTHOR_KEY) ?? "";
}

export function setAuthorName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTHOR_KEY, name);
}
