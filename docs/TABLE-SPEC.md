# ARK - 테이블 정의서 (MVP 11개)

> **정본: 이 GitHub 문서.** [Confluence 페이지](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4158980234)는 열람용 미러. 실행 가능한 DDL은 `server-spec/schema.sql`(server-spec 브랜치)이 짝 원본.
> 최종 동기화: 2026-08-13 (Confluence v4 기준)

---

[ERD](ERD.md)의 2026-08-05 개정 모델(불변 질문 + 케이스 고정) 기준 테이블 정의서다. MVP 구현 대상 **11개**(룰 3 + 케이스 8)만 다룬다. comment, notification 등 Full Spec 전용은 하단 확장 노트 참조.

## 공통 규칙

* PK는 전부 `uuid`, 시각은 전부 `timestamptz`.
* 제약 칸에 `null 허용`이 없으면 **NOT NULL**이다.
* 상태, 코드류는 enum 타입 대신 `varchar` + CHECK 제약 — 값 추가 시 CHECK 갱신만(타입 마이그레이션 없음). 오타, 임의 값의 DB 유입 차단이 목적.
* 룰 테이블(segment, question, doc_template)의 삭제는 전부 **소프트 삭제**(`deactivated_at` 세팅) — 과거 케이스가 계속 참조하므로 행은 보존.
* **question은 불변**: UPDATE는 `deactivated_at` 세팅만 허용. 내용 수정 = 비활성 + 새 행(새 id).

## 1. 룰 테이블 (3)

### 1.1 segment — 세그먼트 정의

고객 유형(entity)과 서비스, 업종 축의 세그먼트 사전. Collection 국가 추가 = 여기 행 1개 insert. 일반 편집 가능 — 변경은 신규 케이스에만 영향(케이스는 판정 결과와 질문 구성을 자체 보관).

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK |  |
| axis | varchar | CHECK: `entity` / `service` / `sector` | 세그먼트 축 |
| code | varchar | 활성 행 중 unique (partial index) | `ENTITY_CORP`, `SVC_PAYOUT`, `SVC_COL_KRW` … |
| label | varchar |  | 표시명 (코드와 분리, PRD 4.1) |
| classification_trigger | jsonb | null 허용 | 이 세그먼트로 판정되는 조건: `{priority, logic, conditions:[{field, op, value}]}` 배열. 1차 제출 시 1회 평가 후 결과를 케이스에 저장 — 이후 변경해도 기존 케이스 재판정 없음 |
| question_overrides | jsonb | null 허용 | 세그먼트별 질문 예외: `{question_id: {enabled, option_filter:[값…], display_order}}`. 공통 질문의 옵션 부분집합(자금원천 CORP 5종 등), on/off |
| doc_overrides | jsonb | null 허용 | 세그먼트별 서류 예외: `{doc_type: {enabled, is_required}}` |
| created_at | timestamptz |  |  |
| deactivated_at | timestamptz | null 허용 | 소프트 삭제 — 신규 케이스에서 노출 중단 |

* 오버라이드가 세그먼트 수십 개 규모로 커져 역방향 조회("질문 X를 쓰는 세그먼트")가 잦아지면 map 테이블로 승격한다(ERD 원칙: 필요할 때 정규화).

### 1.2 question — 질문 라이브러리 (불변)

질문 1개 = 행 1개. 진행 중 케이스가 계속 다시 읽는 유일한 룰 정의라서 **불변** — 문구, 옵션 수정 불가, 수정 = 비활성 + 새 행. 그래서 케이스가 질문 id 목록만 고정하면 소급이 원천 차단된다.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK | 응답(`intake_response.answers`)의 키 |
| code | varchar | 활성 행 중 unique | 의미 키 (예: `Q_BIZ_CATEGORY`). 교체 시 새 행이 승계 — 응답 통계를 계보로 묶는 기준 |
| phase | varchar | CHECK: `first` / `second` | 1차 / 2차 설문 |
| classification | varchar | CHECK: `common` / `own` | 공통(전 세그먼트 자동 포함) / 세그먼트 고유 |
| owner_segment_id | uuid | FK → segment, null 허용 | `own`일 때 소속 세그먼트 |
| label | text |  | 질문 문구 |
| input_type | varchar | CHECK | `text` / `textarea` / `select` / `radio` / `multi` / `number` / `date` |
| options | jsonb | null 허용 | 선택지 `[{value, label}]` — 질문 내용의 일부라 내장, 함께 불변 |
| is_required | boolean |  |  |
| show_when | jsonb | null 허용 | 표시 조건 `{question_id, value}` — `[질문]=[값]` 구조만(PRD 4.3) |
| repeat | boolean | default false | 반복 입력 그룹 (BO, 공동·각자대표 n명 — \[추가\] 버튼). **응답 구조는 2.4 참조** |
| parent_question_id | uuid | FK → question, null 허용 | 반복 그룹 하위필드, 꼬리 질문의 부모 |
| display_order | int |  | 기본 표시 순서 (세그먼트별 순서는 segment 오버라이드) |
| replaces_question_id | uuid | FK → question, null 허용 | 교체 계보 — 어떤 질문을 대체했는지 |
| created_by_staff_id | uuid | FK → staff, null 허용 | MVP 시드는 null, Full은 룰 패널 작성자 |
| created_at | timestamptz |  |  |
| deactivated_at | timestamptz | null 허용 | 소프트 삭제 — 신규 케이스에서 제외, 과거 응답 렌더는 유지 |

### 1.3 doc_template — 서류 정의

서류 종류 사전. 케이스 생성 시 여기서 `document` 행으로 복사되므로(스냅샷) 템플릿 변경은 기존 케이스에 영향 없음 — 일반 편집 가능.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK |  |
| type | varchar | 활성 행 중 unique | 표준 코드 (`BIZ_REGISTRATION` 등) — 세그먼트 합집합 dedup 키 |
| display_name | varchar |  | 고객 화면 표시명 |
| classification | varchar | CHECK: `common` / `own` | 공통 / 세그먼트 고유 |
| owner_segment_id | uuid | FK → segment, null 허용 | `own`일 때 소속 세그먼트 |
| is_required | boolean |  | 필수 / 선택 |
| is_conditional | boolean |  | 조건부 여부 |
| condition | jsonb | null 허용 | 섹터 조건, entity×service 교집합 조건 (MVP 미사용 — 송금 전용) |
| guide | text | null 허용 | 제출 안내 — 발급 3개월 이내, 날인, 실거래본, 마스킹 가능 등 (Rule 검토 v1.0.5) |
| created_at | timestamptz |  |  |
| deactivated_at | timestamptz | null 허용 | 소프트 삭제 |

## 2. 케이스 테이블 (8)

### 2.1 customer — 고객 계정

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK |  |
| email | varchar | unique | 로그인 식별자 |
| auth_method | varchar | CHECK: `otp` / `password`, default `otp` | **MVP =** `otp`(이메일 OTP, 2026-08-07 확정). 비밀번호 없음. OTP 코드 발급/검증 저장(단기 TTL)은 별도 저장소(테이블 또는 외부 서비스/Redis) — 인증 인프라라 개발팀 선택, 이 스키마엔 미포함 |
| password_hash | varchar | null 허용 | MVP 미사용(항상 null) — password 전환 대비 남겨둠 |
| business_reg_no | varchar | null 허용, 인덱스 | 사업자등록번호 — 2차 제출 시 백필. MVP는 저장만(중복 자동 판단은 Full) |
| company_name | varchar |  | 회사명 — 1차 응답에서 복사 (대시보드 표시용). **Full 파기 후에도 잔존** |
| contact_name | varchar | null 허용 | 담당자명 — 1차 응답에서 복사. **Full 파기 후에도 잔존**(응답을 지워도 남도록 여기에 복사) |
| created_at | timestamptz |  |  |

* MVP는 email unique만 강제 — 동일 사업자가 이메일을 달리해 중복 계정을 만들 수 있다. **운영이 대시보드에서 수동 식별 후 중복 케이스를 드롭 처리**(PRD 2.1 MVP 표). `business_reg_no` 인덱스는 이 수동 조회용이기도 하다.
* **Full 파기 잔존 항목** — 케이스 종료 1개월 후 파기 시 `company_name`, `contact_name`만 유지(+ 케이스의 entity/services = 희망 거래형태). 응답, 파일은 삭제되므로 이 둘을 응답 밖 customer에 복사해둔다. 상세는 3장.

### 2.2 staff — 내부 직원

인증은 구글 SSO — 이 테이블은 인가(역할)만. MVP는 화면 없이 직접 행 관리.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK |  |
| email | varchar | unique | 구글 로그인(백오피스 계정) 식별자 |
| name | varchar |  |  |
| role | varchar | CHECK: `SALES` / `OPS` / `COMPLIANCE` / `ADMIN` | 역할 = 접근 권한 |
| is_active | boolean |  | 비활성화 = 접근 차단 (PRD 2.4) |
| created_at | timestamptz |  |  |

### 2.3 onboarding_case — 케이스 (중심 테이블)

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK |  |
| customer_id | uuid | FK → customer, not null |  |
| status | varchar | CHECK: PRD 3.1 상태 9종 | `INQUIRY_RECEIVED` … `CLOSED` (신명칭 — PI-124) |
| close_reason | varchar | null 허용, CHECK | `DROPPED`(내부 중단) / `EXITED`(고객 이탈) |
| revision_requested_from | varchar | null 허용 | 보완요청을 낸 검토 단계 — 재제출 시 복귀 대상. **파생 캐시**: 원천은 revision_request의 미해결 행. 케이스는 한 시점에 한 검토 단계에만 있으므로 미해결 행은 항상 같은 단계(불변식) — 전이 로직이 조인 없이 케이스 행만 읽도록 두는 캐시이며, 보완요청/재제출 전이 시 함께 갱신 |
| entity_code | varchar | null 허용 | 판정 결과. MVP: `ENTITY_CORP` / `ENTITY_INDIV`만. **희망 거래형태의 일부 — Full 파기 후 잔존** |
| services | text\[\] | default `{}` | 판정 결과 (복수). MVP: `{SVC_PAYOUT}` 고정 — 전 케이스 동일 값이라 **GIN 인덱스는 Full에서**. **희망 거래형태 — Full 파기 후 잔존** |
| sectors | text\[\] | default `{}` | KRW 하위 업종. MVP 미사용 |
| segment_meta | jsonb |  | 설립국가, 거래규모 + 판정에 적용된 트리거 기록 (판정 근거 보존). _파기 시 삭제 대상_ |
| pinned_question_ids | jsonb |  | **질문 구성 고정**: `{first:[question_id…], second:[…]}`. first는 케이스 생성 시, second는 1차 제출(세그먼트 판정) 시 확정 — 이후 룰 변경 소급 차단 |
| assignee_staff_id | uuid | FK → staff, null 허용 | 현재 담당자. 담당 역할은 status에서 유도 |
| last_customer_action_at | timestamptz |  | MVP는 기록만 (자동 이탈 배치는 Full) |
| created_at / updated_at | timestamptz |  |  |

* **1계정 1활성 케이스**: `CREATE UNIQUE INDEX … ON onboarding_case(customer_id) WHERE status NOT IN ('COMPLETED','CLOSED')`
* 대시보드 인덱스: `(status, updated_at desc)`

### 2.4 intake_response — 1차/2차 응답

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK |  |
| case_id | uuid | FK → onboarding_case, not null |  |
| phase | varchar | CHECK: `first` / `second`, unique `(case_id, phase)` | 케이스당 최대 2행 |
| status | varchar | CHECK | `not_started` / `submitted` (MVP — `draft` 임시저장은 Full) |
| answers | jsonb |  | `{question_id: value}` 전체 응답 — question이 불변이라 언제든 정확히 조인됨. **반복 그룹 구조는 아래 참조.** _Full 파기 시 삭제 대상_ |
| saved_at | timestamptz |  | 마지막 저장 |
| submitted_at | timestamptz | null 허용 | 제출 시각 |

* **answers의 값 규칙** — 일반 질문: 스칼라 (`"값"`, 숫자) / multi: 문자열 배열 / **반복 그룹(question.repeat=true): 부모 질문 id를 키로 한 객체 배열**. 각 객체의 키는 하위 질문(parent_question_id로 연결된 question) id.

```
{
  "q-corp-name": "센트비",
  "q-rep-type": "공동",
  "q-bo-group": [
    { "q-bo-name": "김OO", "q-bo-birth": "1980-01-01", "q-bo-nationality": "KR" },
    { "q-bo-name": "이OO", "q-bo-birth": "1985-05-05", "q-bo-nationality": "KR" }
  ]
}
```

### 2.5 document — 케이스별 요구 서류

세그먼트 판정 시 doc_template에서 **복사 생성**(합집합 + type dedup) — 이 복사가 서류 목록의 소급 차단이다.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK |  |
| case_id | uuid | FK → onboarding_case, not null |  |
| doc_template_id | uuid | FK → doc_template, **not null (MVP)** | 생성 근거 템플릿. MVP는 모든 서류가 템플릿에서 생성되므로 not null — Full에서 즉석 추가(ad-hoc) 도입 시 null 허용으로 완화 |
| type | varchar | unique `(case_id, type)` | 템플릿에서 복사 — dedup을 DB 레벨에서도 보장 |
| display_name | varchar |  | 템플릿에서 복사 |
| status | varchar | CHECK: PRD 3.2 문서 상태 5종 | `NOT_REQUESTED` … `APPROVED` |
| is_required | boolean |  | 템플릿에서 복사 |
| created_at / updated_at | timestamptz |  |  |

### 2.6 document_file — 제출본 (append-only)

파일 바이너리는 오브젝트 스토리지(S3 등), DB에는 키만. 새 제출본 업로드 시 이전 행 `is_latest=false`, 삭제 없음.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK |  |
| document_id | uuid | FK → document, not null |  |
| file_name | varchar |  |  |
| file_size | int |  | 상한 **10MB** (2026-08-07 확정) — API에서 검증 |
| mime_type | varchar |  | 허용 **pdf, png, jpg** (2026-08-07 확정). 바이러스 스캔은 Full |
| storage_key | varchar |  | 오브젝트 스토리지 키 |
| uploader_type | varchar | CHECK: `CUSTOMER` / `STAFF` | 업로드 주체. MVP 업로드는 고객만 — 항상 `CUSTOMER` |
| uploader_staff_id | uuid | FK → staff, null 허용 | `STAFF`일 때만 — 센티넬 값과 FK를 한 컬럼에 섞지 않는다 |
| is_latest | boolean |  | 현재 검토 대상 제출본 |
| uploaded_at | timestamptz |  |  |

* **MVP는 서류당 1파일(멀티업로드 불가), Full은 멀티업로드** (2026-08-07 확정) — API 제약이며 스키마는 두 경우 동일(제출본은 늘 행 추가). 허용 pdf/png/jpg, 상한 10MB. _Full 파기 시 삭제 대상_

### 2.7 revision_request — 서류별 보완 사유

"현재 라운드 사유만 고객 노출"(PRD 2.1) = `resolved_at IS NULL`인 행만 내려주면 됨. 과거 라운드는 내부용 보존. **보완 복귀 대상의 신뢰 원천**(케이스의 revision_requested_from은 이 테이블의 파생 캐시).

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK |  |
| document_id | uuid | FK → document, not null |  |
| reason | text |  | 서류별 사유 — 입력 필수 (PRD 2.2) |
| requested_by_staff_id | uuid | FK → staff, not null |  |
| requested_from_status | varchar |  | 요청 당시 검토 단계 — 재제출 시 복귀 대상 기록 |
| requested_at | timestamptz |  |  |
| resolved_at | timestamptz | null 허용 | 고객 재제출 시각 |

### 2.8 case_event — 통합 이력 로그 (append-only)

케이스 상태 변경, 서류 상태 변경, 담당자 변경, 반려/종료 사유를 한 테이블에 쌓는다. 타임라인 화면 = 이 테이블 하나. 수정/삭제 없음.

| 컬럼 | 타입 | 제약 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK |  |
| case_id | uuid | FK → onboarding_case, not null, 인덱스 |  |
| event_type | varchar | CHECK: `CASE_CREATED` / `CASE_STATUS_CHANGED` / `DOC_STATUS_CHANGED` / `ASSIGNEE_CHANGED` | 이벤트 종류. **추가 = CHECK 갱신** — 의도된 비용(오타, 임의 값의 DB 유입 차단이 우선). 세부 구분은 payload로 |
| actor_type | varchar | CHECK: `CUSTOMER` / `STAFF` / `SYSTEM` | 행위 주체 |
| actor_id | uuid | null 허용 | customer 또는 staff id (actor_type으로 해석) |
| payload | jsonb |  | `{prev, next, reason, close_reason, document_id …}` |
| created_at | timestamptz |  | 타임라인 정렬 키 |

## 3. Full Spec 확장 노트

아래는 지금 만들지 않는다. 전부 **추가 또는 완화만으로** 확장 가능(기존 11테이블 파괴적 변경 없음).

* **comment** 테이블 — 고객 댓글 + 내부 노트 (visibility로 구분)
* **notification** 테이블 — in-app 알림
* **document**에 `is_ad_hoc`, `requested_by_staff_id` 컬럼 + `doc_template_id` NOT NULL 완화 — 즉석 서류 추가 요청
* **멀티업로드** — Full은 서류당 여러 파일 허용(MVP는 1파일). 스키마 변경 없음(document_file은 이미 다건 append 구조), API 제약만 해제.
* **intake_response.status**에 `draft` 값 — 임시저장
* **onboarding_case.services**에 GIN 인덱스 — Collection 추가로 서비스 필터가 의미 생길 때
* 바이러스 스캔 — 업로드 파이프라인에 스캐너(ClamAV 등) 연동
* **케이스 종료 1개월 후 파기 배치** — **삭제**: `intake_response`, `document`, `document_file`(파일), `revision_request`, `onboarding_case.segment_meta`. **잔존**: `customer`(company_name, contact_name) + `onboarding_case`(entity_code, services=희망 거래형태, status). MVP는 자동 파기 없음(수동만). ⚠️ 1개월 기준, 담당자명(개인정보) 보관 근거는 컴플라이언스 사인오프 필요.
* 사업자번호 자동 중복 판단 — `business_reg_no` 활용 (컬럼은 이미 있음)
* segment 오버라이드 jsonb의 map 테이블 승격 — 세그먼트 규모가 커지면
