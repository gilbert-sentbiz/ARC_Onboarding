-- ============================================================
-- ARC 온보딩 플랫폼 — MVP 스키마 (테이블 11개)
-- 원본: Confluence "ARC - 테이블 정의서 (MVP 11개)" v2 (2026-08-05)
--   https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4158980234
-- 원칙: PK uuid / 시각 timestamptz / 상태·코드는 varchar + CHECK (enum 금지)
--       룰 테이블 삭제는 소프트 삭제(deactivated_at) / question은 불변(트리거 강제)
-- ============================================================

create extension if not exists pgcrypto;

-- ──────────────────────────────
-- 룰 도메인 (3) — Full Spec 룰 패널이 편집하는 영역. MVP는 시드로만 채움
-- ──────────────────────────────

create table segment (
  id                     uuid primary key default gen_random_uuid(),
  axis                   varchar not null check (axis in ('entity', 'service', 'sector')),
  code                   varchar not null,
  label                  varchar not null,
  classification_trigger jsonb,
  question_overrides     jsonb,
  doc_overrides          jsonb,
  created_at             timestamptz not null default now(),
  deactivated_at         timestamptz
);
create unique index segment_code_active_uq on segment (code) where deactivated_at is null;

comment on table segment is '세그먼트 사전. Collection 국가 추가 = 행 1개 insert. 변경은 신규 케이스에만 영향';

create table staff (
  id         uuid primary key default gen_random_uuid(),
  email      varchar not null unique,
  name       varchar not null,
  role       varchar not null check (role in ('SALES', 'OPS', 'COMPLIANCE', 'ADMIN')),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table staff is '내부 직원. 인증은 구글 SSO, 이 테이블은 인가(역할)만. MVP는 화면 없이 직접 행 관리';

create table question (
  id                    uuid primary key default gen_random_uuid(),
  code                  varchar not null,
  phase                 varchar not null check (phase in ('first', 'second')),
  classification        varchar not null check (classification in ('common', 'own')),
  owner_segment_id      uuid references segment (id),
  label                 text not null,
  input_type            varchar not null check (input_type in ('text', 'textarea', 'select', 'radio', 'multi', 'number', 'date')),
  options               jsonb,
  is_required           boolean not null default false,
  show_when             jsonb,
  repeat                boolean not null default false,
  parent_question_id    uuid references question (id),
  display_order         int not null default 0,
  replaces_question_id  uuid references question (id),
  created_by_staff_id   uuid references staff (id),
  created_at            timestamptz not null default now(),
  deactivated_at        timestamptz
);
create unique index question_code_active_uq on question (code) where deactivated_at is null;

comment on table question is '질문 라이브러리. 불변 — UPDATE는 deactivated_at만 허용(트리거). 수정 = 비활성 + 새 행';

create or replace function question_enforce_immutable() returns trigger as $$
begin
  if (to_jsonb(new) - 'deactivated_at') is distinct from (to_jsonb(old) - 'deactivated_at') then
    raise exception 'question rows are immutable: only deactivated_at may change. To edit, deactivate and insert a new row (set replaces_question_id).';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger question_immutable
  before update on question
  for each row execute function question_enforce_immutable();

create table doc_template (
  id               uuid primary key default gen_random_uuid(),
  type             varchar not null,
  display_name     varchar not null,
  classification   varchar not null check (classification in ('common', 'own')),
  owner_segment_id uuid references segment (id),
  is_required      boolean not null default true,
  is_conditional   boolean not null default false,
  condition        jsonb,
  guide            text,
  created_at       timestamptz not null default now(),
  deactivated_at   timestamptz
);
create unique index doc_template_type_active_uq on doc_template (type) where deactivated_at is null;

comment on table doc_template is '서류 사전. 케이스 판정 시 document 행으로 복사되므로 변경은 신규 케이스에만 영향';

-- ──────────────────────────────
-- 케이스 도메인 (8)
-- ──────────────────────────────

create table customer (
  id              uuid primary key default gen_random_uuid(),
  email           varchar not null unique,
  auth_method     varchar not null default 'otp' check (auth_method in ('otp', 'password')),
  password_hash   varchar,
  business_reg_no varchar,
  company_name    varchar,
  contact_name    varchar,
  created_at      timestamptz not null default now()
);
create index customer_biz_reg_no_idx on customer (business_reg_no);

create table onboarding_case (
  id                      uuid primary key default gen_random_uuid(),
  customer_id             uuid not null references customer (id),
  status                  varchar not null default 'INQUIRY_RECEIVED' check (status in (
                            'INQUIRY_RECEIVED', 'DOCUMENT_SUBMISSION_REQUIRED',
                            'INITIAL_SCREENING', 'DOCUMENT_SCREENING_REQUIRED',
                            'APPROVAL_REVIEW_REQUIRED', 'ACCOUNT_SETUP_REQUIRED',
                            'REVISION_REQUESTED', 'COMPLETED', 'CLOSED')),
  close_reason            varchar check (close_reason in ('DROPPED', 'EXITED')),
  revision_requested_from varchar,
  entity_code             varchar,
  services                text[] not null default '{}',
  sectors                 text[] not null default '{}',
  segment_meta            jsonb not null default '{}',
  pinned_question_ids     jsonb not null default '{}',
  assignee_staff_id       uuid references staff (id),
  last_customer_action_at timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
create unique index case_one_active_per_customer_uq on onboarding_case (customer_id)
  where status not in ('COMPLETED', 'CLOSED');
create index case_dashboard_idx on onboarding_case (status, updated_at desc);

comment on column onboarding_case.pinned_question_ids is 'first=케이스 생성 시, second=1차 제출 시 확정. 진행 중 케이스는 항상 이 목록으로 렌더 — 룰 변경 소급 차단';

create table intake_response (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references onboarding_case (id),
  phase        varchar not null check (phase in ('first', 'second')),
  status       varchar not null default 'not_started' check (status in ('not_started', 'submitted')),
  answers      jsonb not null default '{}',
  saved_at     timestamptz not null default now(),
  submitted_at timestamptz,
  unique (case_id, phase)
);

comment on column intake_response.answers is '일반: 스칼라 / multi: 문자열 배열 / repeat 그룹: {부모질문id: [{하위질문id: 값, ...}, ...]}';

create table document (
  id              uuid primary key default gen_random_uuid(),
  case_id         uuid not null references onboarding_case (id),
  doc_template_id uuid not null references doc_template (id),
  type            varchar not null,
  display_name    varchar not null,
  status          varchar not null default 'REQUESTED' check (status in (
                    'NOT_REQUESTED', 'REQUESTED', 'SUBMITTED', 'REVISION_REQUIRED', 'APPROVED')),
  is_required     boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (case_id, type)
);

create table document_file (
  id                uuid primary key default gen_random_uuid(),
  document_id       uuid not null references document (id),
  file_name         varchar not null,
  file_size         int not null,
  mime_type         varchar not null,
  storage_key       varchar not null,
  uploader_type     varchar not null check (uploader_type in ('CUSTOMER', 'STAFF')),
  uploader_staff_id uuid references staff (id),
  is_latest         boolean not null default true,
  uploaded_at       timestamptz not null default now(),
  check ((uploader_type = 'STAFF') = (uploader_staff_id is not null))
);
create index document_file_document_idx on document_file (document_id);

comment on table document_file is 'append-only. 새 제출본 업로드 시 이전 행 is_latest=false, 삭제 없음. MVP는 서류당 1파일 / 허용 pdf,png,jpg / 상한 10MB';

create table revision_request (
  id                     uuid primary key default gen_random_uuid(),
  document_id            uuid not null references document (id),
  reason                 text not null,
  requested_by_staff_id  uuid not null references staff (id),
  requested_from_status  varchar not null,
  requested_at           timestamptz not null default now(),
  resolved_at            timestamptz
);
create index revision_request_open_idx on revision_request (document_id) where resolved_at is null;

create table case_event (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references onboarding_case (id),
  event_type varchar not null check (event_type in (
               'CASE_CREATED', 'CASE_STATUS_CHANGED', 'DOC_STATUS_CHANGED', 'ASSIGNEE_CHANGED')),
  actor_type varchar not null check (actor_type in ('CUSTOMER', 'STAFF', 'SYSTEM')),
  actor_id   uuid,
  payload    jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index case_event_timeline_idx on case_event (case_id, created_at);

comment on table case_event is 'append-only 통합 이력. 수정, 삭제 금지. 타임라인 화면 = 이 테이블 하나';
