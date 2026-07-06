-- Step 4 (동료와 공유 + 로그인)를 붙일 때 사용할 스키마 초안입니다.
-- 지금 단계(로컬 저장)에서는 실행하지 않아도 됩니다.

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  created_at timestamptz not null default now()
);

create table places (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  category text,
  lat double precision not null,
  lng double precision not null,
  naver_map_url text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  user_id uuid references auth.users(id),
  author_name text not null,
  quick_rating text not null check (quick_rating in ('bad', 'soso', 'good')),
  atmosphere_rating text check (atmosphere_rating in ('bad', 'soso', 'good')),
  restroom_rating text check (restroom_rating in ('bad', 'soso', 'good')),
  free_comment text,
  created_at timestamptz not null default now()
);

create table menu_notes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references reviews(id) on delete cascade,
  menu_name text not null,
  rating text not null check (rating in ('bad', 'soso', 'good'))
);

-- 같은 팀 멤버만 조회/작성 가능하도록 RLS 정책은 로그인 방식이 정해진 뒤 추가합니다.
alter table places enable row level security;
alter table reviews enable row level security;
alter table menu_notes enable row level security;
