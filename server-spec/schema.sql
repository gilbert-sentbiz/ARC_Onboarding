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
  code                   varchar not null,   -- ENTITY_CORP, SVC_PAYOUT, SVC_COL_KRW ...
  label                  varchar not null,   -- 표시명 (코드와 분리)
  classification_trigger jsonb,              -- [{priority, logic, conditions:[{field, op, value}]}] 1차 제출 시 1회 평가
  question_overrides     jsonb,              -- {question_id: {enabled, option_filter:[...], display_order}}
  doc_overrides          jsonb,              -- {doc_type: {enabled, is_required}}
  created_at             timestamptz not null default now(),
  deactivated_at         timestamptz         -- 소프트 삭제: 신규 케이스에서 노출 중단
);
create unique index segment_code_active_uq on segment (code) where deactivated_at is null;

comment on table segment is '세그먼트 사전. Collection 국가 추가 = 행 1개 insert. 변경은 신규 케이스에만 영향';

create table staff (
  id         uuid primary key default gen_random_uuid(),
  email      varchar not null unique,        -- 구글 SSO(백오피스 계정) 식별자
  name       varchar not null,
  role       varchar not null check (role in ('SALES', 'OPS', 'COMPLIANCE', 'ADMIN')),
  is_active  boolean not null default true,  -- false = 접근 차단
  created_at timestamptz not null default now()
);

comment on table staff is '내부 직원. 인증은 구글 SSO, 이 테이블은 인가(역할)만. MVP는 화면 없이 직접 행 관리';

create table question (
  id                    uuid primary key default gen_random_uuid(),
  code                  varchar not null,   -- 의미 키 (Q_BIZ_CATEGORY 등). 교체 시 새 행이 승계
  phase                 varchar not null check (phase in ('first', 'second')),
  classification        varchar not null check (classification in ('common', 'own')),
  owner_segment_id      uuid references segment (id),  -- own일 때 소속 세그먼트
  label                 text not null,
  input_type            varchar not null check (input_type in ('text', 'textarea', 'select', 'radio', 'multi', 'number', 'date')),
  options               jsonb,              -- [{value, label}] 질문 내용의 일부라 내장, 함께 불변
  is_required           boolean not null default false,
  show_when             jsonb,              -- {question_id, value} — [질문]=[값] 구조만
  repeat                boolean not null default false,  -- 반복 입력 그룹 (BO n명 등)
  parent_question_id    uuid references question (id),   -- 반복 그룹 하위필드, 꼬리 질문의 부모
  display_order         int not null default 0,
  replaces_question_id  uuid references question (id),   -- 교체 계보
  created_by_staff_id   uuid references staff (id),      -- MVP 시드는 null
  created_at            timestamptz not null default now(),
  deactivated_at        timestamptz
);
create unique index question_code_active_uq on question (code) where deactivated_at is null;

comment on table question is '질문 라이브러리. 불변 — UPDATE는 deactivated_at만 허용(트리거). 수정 = 비활성 + 새 행';

-- question 불변 강제: deactivated_at 외의 컬럼 변경을 거부
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
  type             varchar not null,   -- 표준 코드 (BIZ_REGISTRATION 등). 세그먼트 합집합 dedup 키
  display_name     varchar not null,
  classification   varchar not null check (classification in ('common', 'own')),
  owner_segment_id uuid references segment (id),
  is_required      boolean not null default true,
  is_conditional   boolean not null default false,
  condition        jsonb,              -- 섹터 조건, entity×service 교집합 (MVP 미사용)
  guide            text,               -- 제출 안내: 발급 3개월 이내, 날인, 실거래본 등
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
  auth_method     varchar not null default 'password' check (auth_method in ('password', 'otp')),  -- MVP 잠정 password
  password_hash   varchar,
  business_reg_no varchar,             -- 2차 제출 시 백필. MVP는 저장만(자동 중복 판단 없음, 운영 수동 식별용)
  company_name    varchar,
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
  revision_requested_from varchar,     -- 파생 캐시. 원천 = revision_request 미해결 행 (항상 같은 단계 — 불변식)
  entity_code             varchar,     -- 판정 결과. MVP: ENTITY_CORP / ENTITY_INDIV
  services                text[] not null default '{}',  -- MVP: {SVC_PAYOUT} 고정. GIN 인덱스는 Full에서
  sectors                 text[] not null default '{}',  -- MVP 미사용
  segment_meta            jsonb not null default '{}',   -- 설립국가, 거래규모 + 적용 분류 트리거 (판정 근거)
  pinned_question_ids     jsonb not null default '{}',   -- {first:[question_id...], second:[...]} 소급 차단의 핵심
  assignee_staff_id       uuid references staff (id),
  last_customer_action_at timestamptz,                   -- MVP 기록만 (자동 이탈은 Full)
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);
-- 1계정 1활성 케이스
create unique index case_one_active_per_customer_uq on onboarding_case (customer_id)
  where status not in ('COMPLETED', 'CLOSED');
create index case_dashboard_idx on onboarding_case (status, updated_at desc);

comment on column onboarding_case.pinned_question_ids is 'first=케이스 생성 시, second=1차 제출 시 확정. 진행 중 케이스는 항상 이 목록으로 렌더 — 룰 변경 소급 차단';

create table intake_response (
  id           uuid primary key default gen_random_uuid(),
  case_id      uuid not null references onboarding_case (id),
  phase        varchar not null check (phase in ('first', 'second')),
  status       varchar not null default 'not_started' check (status in ('not_started', 'submitted')),  -- draft는 Full
  answers      jsonb not null default '{}',  -- {question_id: value}. 반복 그룹: 부모 id 키에 객체 배열
  saved_at     timestamptz not null default now(),
  submitted_at timestamptz,
  unique (case_id, phase)
);

comment on column intake_response.answers is '일반: 스칼라 / multi: 문자열 배열 / repeat 그룹: {부모질문id: [{하위질문id: 값, ...}, ...]}';

create table document (
  id              uuid primary key default gen_random_uuid(),
  case_id         uuid not null references onboarding_case (id),
  doc_template_id uuid not null references doc_template (id),  -- Full에서 ad-hoc 도입 시 null 완화
  type            varchar not null,   -- 템플릿에서 복사
  display_name    varchar not null,   -- 템플릿에서 복사 (소급 차단)
  status          varchar not null default 'REQUESTED' check (status in (
                    'NOT_REQUESTED', 'REQUESTED', 'SUBMITTED', 'REVISION_REQUIRED', 'APPROVED')),
  is_required     boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (case_id, type)              -- 합집합 dedup을 DB 레벨에서도 보장
);

create table document_file (
  id                uuid primary key default gen_random_uuid(),
  document_id       uuid not null references document (id),
  file_name         varchar not null,
  file_size         int not null,     -- 상한 미정(Open) — API에서 검증
  mime_type         varchar not null, -- pdf, png, jpg (확정 필요 — Open)
  storage_key       varchar not null, -- 오브젝트 스토리지 키. 바이너리는 DB에 두지 않는다
  uploader_type     varchar not null check (uploader_type in ('CUSTOMER', 'STAFF')),
  uploader_staff_id uuid references staff (id),
  is_latest         boolean not null default true,
  uploaded_at       timestamptz not null default now(),
  check ((uploader_type = 'STAFF') = (uploader_staff_id is not null))
);
create index document_file_document_idx on document_file (document_id);

comment on table document_file is 'append-only. 새 제출본 업로드 시 이전 행 is_latest=false, 삭제 없음. MVP는 서류당 1파일(API 제약)';

create table revision_request (
  id                     uuid primary key default gen_random_uuid(),
  document_id            uuid not null references document (id),
  reason                 text not null,     -- 서류별 사유, 입력 필수
  requested_by_staff_id  uuid not null references staff (id),
  requested_from_status  varchar not null,  -- 요청 당시 검토 단계 = 재제출 시 복귀 대상 (신뢰 원천)
  requested_at           timestamptz not null default now(),
  resolved_at            timestamptz        -- 고객 재제출 시각. null = 현재 라운드(고객 노출 대상)
);
create index revision_request_open_idx on revision_request (document_id) where resolved_at is null;

create table case_event (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references onboarding_case (id),
  event_type varchar not null check (event_type in (
               'CASE_CREATED', 'CASE_STATUS_CHANGED', 'DOC_STATUS_CHANGED', 'ASSIGNEE_CHANGED')),
               -- 종류 추가 = CHECK 갱신 (의도된 비용). 세부 구분은 payload로
  actor_type varchar not null check (actor_type in ('CUSTOMER', 'STAFF', 'SYSTEM')),
  actor_id   uuid,
  payload    jsonb not null default '{}',  -- {prev, next, reason, close_reason, document_id ...}
  created_at timestamptz not null default now()
);
create index case_event_timeline_idx on case_event (case_id, created_at);

comment on table case_event is 'append-only 통합 이력. 수정, 삭제 금지. 타임라인 화면 = 이 테이블 하나';

-- ──────────────────────────────
-- 가짜 시드 예시 (형태 참고용 — 실제 시드는 설문 시트에서 생성)
-- ──────────────────────────────

insert into segment (axis, code, label, classification_trigger) values
  ('entity',  'ENTITY_CORP',  '한국 법인',     '[{"priority": 10, "logic": "AND", "conditions": [{"field": "businessType", "op": "eq", "value": "corp"}, {"field": "foundingCountry", "op": "eq", "value": "KR"}]}]'),
  ('entity',  'ENTITY_INDIV', '한국 개인사업자', '[{"priority": 11, "logic": "AND", "conditions": [{"field": "businessType", "op": "eq", "value": "individual"}, {"field": "foundingCountry", "op": "eq", "value": "KR"}]}]'),
  ('service', 'SVC_PAYOUT',   '송금',          '[{"priority": 1, "logic": "AND", "conditions": [{"field": "services", "op": "contains", "value": "remittance"}]}]');

insert into question (code, phase, classification, label, input_type, is_required, options) values
  ('Q_COMPANY_NAME', 'first',  'common', '회사명을 입력해주세요',        'text',   true, null),
  ('Q_BIZ_CATEGORY', 'second', 'common', '업태를 입력해주세요',          'text',   true, null),
  ('Q_TAX_TYPE',     'second', 'common', '과세 구분을 선택해주세요',      'radio',  true, '[{"value": "taxable", "label": "과세"}, {"value": "exempt", "label": "면세"}]');

insert into doc_template (type, display_name, classification, owner_segment_id, is_required, guide) values
  ('BIZ_REGISTRATION', '사업자등록증', 'common', null, true, null),
  ('SHAREHOLDER_LIST', '주주명부',     'own',
    (select id from segment where code = 'ENTITY_CORP' and deactivated_at is null),
    true, '발급 3개월 이내, 법인인감 날인본');
