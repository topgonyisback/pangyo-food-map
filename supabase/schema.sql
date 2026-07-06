-- 판교 점심 지도 MVP 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run 하세요.
-- (로그인 없이 팀 내부 공유용. 나중에 로그인/팀 기능 붙일 때 RLS 정책을 강화합니다.)

create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '기타',
  lat double precision not null,
  lng double precision not null,
  naver_map_url text not null,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references places(id) on delete cascade,
  author_name text not null,
  quick_rating text not null check (quick_rating in ('bad', 'soso', 'good')),
  atmosphere_rating text check (atmosphere_rating in ('bad', 'soso', 'good')),
  restroom_rating text check (restroom_rating in ('bad', 'soso', 'good')),
  free_comment text,
  -- 메뉴별 평가는 [{ "menuName": "...", "rating": "good" }, ...] 형태의 JSON 배열로 저장
  menu_notes jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create index if not exists reviews_place_id_idx on reviews (place_id);

-- RLS: 로그인 전 단계라 publishable(anon) 키로 읽기/쓰기를 모두 허용합니다.
-- (팀 내부용 MVP. 로그인 기능을 붙이면 이 정책을 사용자/팀 기준으로 교체합니다.)
alter table places enable row level security;
alter table reviews enable row level security;

drop policy if exists "anon read places" on places;
drop policy if exists "anon write places" on places;
drop policy if exists "anon read reviews" on reviews;
drop policy if exists "anon write reviews" on reviews;

create policy "anon read places" on places for select using (true);
create policy "anon write places" on places for insert with check (true);
create policy "anon update places" on places for update using (true) with check (true);

create policy "anon read reviews" on reviews for select using (true);
create policy "anon write reviews" on reviews for insert with check (true);
