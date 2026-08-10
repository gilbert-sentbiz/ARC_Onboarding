-- OTP 토큰 (고객 이메일 인증, 단기 TTL)
create table otp_token (
  id         uuid primary key default gen_random_uuid(),
  email      varchar not null,
  code       varchar(6) not null,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
create index otp_token_email_idx on otp_token (email, expires_at);

-- 고객 세션 (OTP 검증 후 발급, 24시간 TTL)
create table customer_session (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customer(id),
  token       text not null unique,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);
create index customer_session_token_idx on customer_session (token);

-- 내부 직원 세션 (목 SSO 발급, 8시간 TTL)
create table staff_session (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references staff(id),
  token      text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index staff_session_token_idx on staff_session (token);
