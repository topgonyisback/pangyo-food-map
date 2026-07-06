# 판교 점심 지도

판교 근처 식당/카페를 동료들과 등록하고, 지도에서 핀으로 탐색하며 평가를 쌓는 웹앱.

## 지금 상태 (Step 1~3)

- 풀스크린 지도 뷰 + 리스트 뷰, 네이버 지도 API 연동 완료
- 우측 하단 **"+" 버튼**으로 새 가게 추가: 지도를 탭해서 위치 선택 → 이름/카테고리/네이버지도 링크 입력 → 저장하면 바로 평가 입력 화면으로 이어짐
  - 카테고리는 드롭다운(`<select>`)에서 선택 (한식/중식/일식/양식/분식/아시안/카페/디저트/기타 + 기존 카테고리)
  - 링크 입력란 아래 **"네이버지도에서 검색/확인하기"** 버튼으로 새 탭에서 바로 검색/확인 가능
- 평가 카드의 **"✏️ 정보 수정"** 버튼으로 등록된 가게(샘플 포함)의 이름/카테고리/네이버지도 링크를 수정할 수 있고, **"📍 위치 수정"** 버튼으로 핀 위치도 지도를 다시 탭해서 옮길 수 있음. 마커는 좌표에 중앙 정렬됨(anchor 지정)
- 퀵 평가(별로/쏘쏘/맛있어요) + 자유 메모(선택, 한줄 평가 바로 아래) + 상세 평가(메뉴별/분위기/화장실)
- 가게 목록과 평가 모두 **브라우저 localStorage**에 저장됨 (내 컴퓨터에서는 새로고침해도 유지, 다른 사람과는 아직 공유 안 됨)
- `src/data/dummy-places.ts` 의 샘플 데이터 5곳은 최초 1회 시드로 들어가고, 이후엔 localStorage의 전체 가게 목록이 기준이 됨 (수정/추가 내용 포함)

## 실행하기

```bash
npm install
cp .env.local.example .env.local   # 네이버 지도 Client ID를 아래에 채워넣기
npm run dev
```

`http://localhost:3000` 접속.

## 네이버 지도 Client ID 발급받기 (지도가 안 보인다면 이거부터)

1. [Naver Cloud Platform](https://www.ncloud.com) 가입/로그인
2. 콘솔 → **AI·NAVER API** → **Application** → **Maps** 신청
3. Application 등록 시 **Web 서비스 URL**에 아래 두 개를 등록
   - `http://localhost:3000` (로컬 개발용)
   - 배포 후 실제 도메인 (예: `https://pangyo-lunch-map.vercel.app`) — 나중에 추가해도 됨
4. 발급된 **Client ID**를 복사해서 `.env.local` 의 `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` 에 붙여넣기
5. 서버 재시작 (`npm run dev`)

Client ID를 넣지 않아도 앱 자체는 실행되고, 지도 자리에 안내 메시지가 대신 표시됩니다.

## 다음 단계 (아직 미구현)

- **Step 4 — 동료와 공유 + 로그인**: Supabase 프로젝트를 만들고 `supabase/schema.sql` 을 실행하면, 지금 localStorage에 있는 평가를 여러 명이 함께 보고 쓰는 구조로 옮길 수 있습니다. ([supabase.com](https://supabase.com)에서 무료 프로젝트 생성 → Project Settings → API 에서 URL/anon key 확인 → `.env.local` 에 입력)
- **Step 5 — 배포**: [Vercel](https://vercel.com)에 이 저장소를 연결하면 폰에서도 접속 가능한 URL이 생깁니다. 배포 시 위 두 환경변수를 Vercel 프로젝트 설정에도 동일하게 등록해야 합니다.
- **네이버지도 이미지 자동 수집**: 네이버가 공식 지원하지 않는 기능이라 보류 중. 지금은 가게 등록 시 사진을 직접 업로드하는 방식을 권장.

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
    usePlaces.ts            가게 목록 상태 관리 (더미 + localStorage 커스텀 가게)
    useReviews.ts          평가 데이터 상태 관리 (localStorage 연동)
    useNaverMapsScript.ts   네이버 지도 SDK 동적 로드
  lib/
    storage.ts              localStorage 읽기/쓰기
    rating.ts                평점 평균/색상 계산
  data/dummy-places.ts       기본으로 항상 보이는 샘플 가게 데이터 (5곳)
  types/index.ts              Place / Review / MenuNote 타입 정의
supabase/schema.sql            Step 4용 DB 스키마 초안
```
