# 판교 점심 지도

판교 근처 식당/카페를 동료들과 등록하고, 지도에서 핀으로 탐색하며 평가를 쌓는 팀 웹앱.
배포: https://pangyo-food-map.vercel.app (GitHub `main` 푸시 시 Vercel 자동 배포)

## 기능 요약

- **지도 뷰**: 풀스크린 네이버 지도, 평점 색상 핀(별로 빨강 → 인생맛집 초록), 핀 hover 시 상호명 툴팁, 상단 검색바(상호명·카테고리), 선택 시 펄스 하이라이트
- **리스트 뷰**: 카테고리 필터 + 평점순 목록(모바일은 가로 칩 + 세로 목록)
- **오늘 뭐먹지?**: 점심시간/커피타임 모드, 카테고리 옵트아웃, 낮은 평가 제외 → 슬롯릴 / 돌림판(조각 수·재추첨) / 카드 뒤집기 / 이상형 월드컵 4가지 방식
- **가게 상세**: 5점 만점(0.5 단위) 평균 + 채움 바, 사진 갤러리(라이트박스), 리뷰 목록, 공유 딥링크(`?place=<id>`)
- **평가**: 한줄 평가(0~5, 0.5 단위 분절 캡슐) + 자유 메모 + 사진(최대 5장, 업로드 전 자동 압축) + 상세(메뉴별/분위기/화장실)
- **계정**: 이메일+비밀번호 로그인, 닉네임(중복 방지) 변경, 비밀번호 변경(현재 비번 확인)/재설정 메일
- **권한**: 읽기는 누구나, 쓰기는 로그인 사용자, 가게 정보/위치 수정·삭제와 리뷰 수정·삭제는 작성자 본인만

## 기술 스택

- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4
- Firebase: Firestore(데이터) + Authentication(이메일/비번). 무료 Spark 플랜, 일시정지 없음
- Cloudinary: 리뷰 사진 저장(무료 티어, 카드 불필요). 삭제만 서버 라우트 경유
- 네이버 지도 Dynamic Map SDK, framer-motion, canvas-confetti

## 실행하기

```bash
npm install
cp .env.local.example .env.local   # 아래 환경변수 채우기
npm run dev
```

`http://localhost:3000` 접속. 환경변수를 바꾼 뒤에는 개발 서버를 재시작해야 반영됩니다.

## 환경변수

| 변수 | 용도 | 노출 |
|---|---|---|
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | 네이버 지도 Client ID | 공개 |
| `NEXT_PUBLIC_FIREBASE_*` (6개) | Firebase 웹 앱 설정 | 공개(보안은 Firestore 규칙이 담당) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | 공개 |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | unsigned 업로드 프리셋 이름 | 공개 |
| `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | 사진 삭제 API(서버 전용) | **비공개** — `NEXT_PUBLIC_` 금지 |

Vercel에도 같은 변수를 등록해야 합니다. `NEXT_PUBLIC_*`는 빌드 시점에 굽히므로 값 변경 후 **새 빌드**가 필요합니다(Redeploy가 캐시를 재사용하면 빈 커밋을 푸시).

## Firebase 설정

1. Firebase 콘솔에서 프로젝트 생성 → 웹 앱 추가 → SDK 설정 값을 `.env.local`에 입력
2. **Firestore Database** 생성(asia-northeast3, 프로덕션 모드) → 규칙 탭에 `firestore.rules` 붙여넣고 게시
3. **Authentication → 로그인 방법**에서 "이메일/비밀번호" 사용 설정(이메일 링크는 불필요)

컬렉션: `places`, `reviews`, `profiles/{uid}`(닉네임), `nicknames/{nickname}`(중복 방지 예약)

## Cloudinary 설정 (리뷰 사진)

1. [cloudinary.com](https://cloudinary.com) 무료 가입 → Dashboard의 **Cloud name**, **API Key**, **API Secret** 확인
2. **Settings → Upload → Upload presets → Add upload preset**
   - Signing mode: **Unsigned**
   - 이름을 `.env.local`의 `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`에 입력
3. 네 개 변수를 `.env.local`과 Vercel에 등록 → 서버 재시작/재배포

동작 방식: 브라우저가 사진을 긴 변 1280px·JPEG·약 300KB로 압축(EXIF 제거)한 뒤 `reviews/{uid}/…` 경로로 직접 업로드합니다. 삭제는 `/api/photo/delete`가 요청자의 Firebase 토큰을 검증해 **본인 사진만** 지웁니다. 변수가 비어 있으면 사진 없는 평가는 정상 동작하고, 사진 첨부 등록만 안내 메시지로 막힙니다.

## 네이버 지도 Client ID

1. [Naver Cloud Platform](https://www.ncloud.com) 콘솔 → **AI·Application Service → Maps → Dynamic Map** 신청
2. Web 서비스 URL에 `http://localhost:3000`과 배포 도메인 등록
3. Client ID를 `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`에 입력 (없어도 앱은 뜨고 지도 자리에 안내가 표시됨)

## 폴더 구조

```
src/
  app/
    page.tsx                  지도/리스트/뭐먹지 뷰 전환, 검색·딥링크, 인증 모달
    api/photo/delete/route.ts Cloudinary 사진 삭제(서명·토큰 검증)
  components/
    MapView.tsx               네이버 지도, 핀·툴팁·펄스, 핀 추가/위치 수정 모드, ESC·바깥 클릭 닫기
    ListPanel.tsx             리스트 뷰(반응형 3단/모바일 세로)
    PickView.tsx              오늘 뭐먹지? 모드·필터·방식 선택·결과
    PickMethods.tsx           슬롯릴 / 돌림판 / 카드 / 월드컵
    PlaceCard.tsx             가게 상세: 평점 요약, 갤러리·라이트박스, 평가 작성/수정, 정보·위치 수정, 삭제, 공유
    SegmentedRating.tsx       0~5 분절 캡슐 입력/표시
    SearchBar.tsx             지도 상단 검색
    AuthModal.tsx / AccountMenu.tsx  로그인·가입·비번·닉네임
    AddPlaceForm.tsx          새 가게 등록 폼
  hooks/  usePlaces, useReviews, useAuth, useNaverMapsScript, useIsHydrated
  lib/
    firebase.ts  db.ts(Firestore CRUD)  storage.ts(Cloudinary 업로드/삭제/썸네일)  image.ts(압축)
    rating.ts(평균·색상)  categories.ts
  types/index.ts              Place / Review / QuickScore 타입·라벨
firestore.rules               Firestore 보안 규칙(콘솔에 붙여넣기)
```

## 롤백

작업 단위마다 `backup-*` 태그를 남깁니다. 문제 시 `git reset --hard <tag>` 후 푸시.
