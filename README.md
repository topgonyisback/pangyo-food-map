# 판교 점심 지도

판교 근처 식당/카페를 동료들과 등록하고, 지도에서 핀으로 탐색하며 평가를 쌓는 웹앱.

## 지금 상태

- 풀스크린 지도 뷰 + 리스트 뷰, 네이버 지도 API 연동 완료
- 우측 하단 **"+" 버튼**으로 새 가게 추가: 지도를 탭해서 위치 선택 → 이름/카테고리/네이버지도 링크 입력 → 저장하면 바로 평가 입력 화면으로 이어짐
  - 카테고리는 드롭다운(`<select>`)에서 선택 (한식/중식/일식/양식/분식/아시안/카페/디저트/기타 + 기존 카테고리)
  - 링크 입력란 아래 **"네이버지도에서 검색/확인하기"** 버튼으로 새 탭에서 바로 검색/확인 가능
- 평가 카드의 **"✏️ 정보 수정"** 버튼으로 등록된 가게(샘플 포함)의 이름/카테고리/네이버지도 링크를 수정할 수 있고, **"📍 위치 수정"** 버튼으로 핀 위치도 지도를 다시 탭해서 옮길 수 있음. 마커는 좌표에 중앙 정렬됨(anchor 지정)
- 퀵 평가(별로/쏘쏘/맛있어요) + 자유 메모(선택, 한줄 평가 바로 아래) + 상세 평가(메뉴별/분위기/화장실)
- 가게 목록과 평가 모두 **Supabase(클라우드 DB)** 에 저장됨 → 접속하는 누구나 같은 데이터를 보고 함께 평가 (작성자 이름만 개인 편의로 브라우저에 기억)

## 실행하기

```bash
npm install
cp .env.local.example .env.local   # 네이버 지도 Client ID + Supabase URL/키를 채워넣기
npm run dev
```

`http://localhost:3000` 접속.

## Supabase 설정 (데이터 저장소)

가게/평가 데이터는 Supabase에 저장됩니다.

1. [supabase.com](https://supabase.com)에서 무료 프로젝트 생성
2. **SQL Editor**에서 `supabase/schema.sql` 내용을 붙여넣고 Run → 테이블(places, reviews) 생성
3. **Project Settings → API**에서 Project URL과 publishable key(`sb_publishable_...`)를 복사해 `.env.local`의
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 입력
4. 서버 재시작

> 로그인 전 단계라 publishable(anon) 키로 읽기/쓰기를 허용하는 RLS 정책을 씁니다(팀 내부용). 삭제 정책은 넣지 않아, 실수/악용으로 데이터가 지워지지 않습니다.

## 네이버 지도 Client ID 발급받기 (지도가 안 보인다면 이거부터)

1. [Naver Cloud Platform](https://www.ncloud.com) 가입/로그인
2. 콘솔 → **AI·NAVER API** → **Application** → **Maps** 신청
3. Application 등록 시 **Web 서비스 URL**에 아래 두 개를 등록
   - `http://localhost:3000` (로컬 개발용)
   - 배포 후 실제 도메인 (예: `https://pangyo-lunch-map.vercel.app`) — 나중에 추가해도 됨
4. 발급된 **Client ID**를 복사해서 `.env.local` 의 `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 에 붙여넣기
5. 서버 재시작 (`npm run dev`)

Client ID를 넣지 않아도 앱 자체는 실행되고, 지도 자리에 안내 메시지가 대신 표시됩니다.

## 다음 단계

- **배포**: [Vercel](https://vercel.com)에 이 저장소를 연결하면 폰에서도 접속 가능한 URL이 생깁니다. 배포 시 환경변수(`NEXT_PUBLIC_NAVER_MAP_CLIENT_ID`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)를 Vercel 프로젝트 설정에도 동일하게 등록하고, 네이버 지도 콘솔의 Web 서비스 URL에 배포 도메인을 추가해야 합니다.
- **로그인/팀**: 지금은 로그인 없이 공유하는 MVP. 나중에 Supabase Auth로 "본인 글만 수정/삭제" 등을 붙일 수 있습니다.
- **네이버지도 이미지 자동 수집**: 네이버가 공식 지원하지 않는 기능이라 보류 중.

## 폴더 구조

```
src/
  app/page.tsx          지도/리스트 뷰 전환하는 메인 화면
  components/
    MapView.tsx          네이버 지도 + 핀 마커 + 가게 추가 모드(지도 탭)
    ListView.tsx          리스트 화면
    PlaceCard.tsx          평가 입력/조회 카드 (지도, 리스트 공용)
    AddPlaceForm.tsx        새 가게 등록 폼 (지도에서 위치 선택 후 표시)
  hooks/
    usePlaces.ts            가게 목록 상태 관리 (Supabase 연동)
    useReviews.ts          평가 데이터 상태 관리 (Supabase 연동)
    useNaverMapsScript.ts   네이버 지도 SDK 동적 로드
  lib/
    supabase.ts             Supabase 클라이언트
    db.ts                    가게/평가 CRUD (snake_case↔camelCase 매핑)
    storage.ts              작성자 이름만 로컬 기억 (개인 편의)
    categories.ts            카테고리 프리셋
    rating.ts                평점 평균/색상 계산
  types/index.ts              Place / Review / MenuNote 타입 정의
supabase/schema.sql            DB 스키마 (SQL Editor에서 실행)
```
