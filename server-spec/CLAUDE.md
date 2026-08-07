# ARC 온보딩 플랫폼 — 서버

SentBe(센트비)의 B2B 고객 온보딩 플랫폼 서버. 고객이 설문에 답하고 서류를 올리면, 내부 3역할(영업 → 운영 → 컴플라이언스 → 운영)이 순서대로 심사해서 계정을 개설한다. MVP는 **송금 전용** — 한국 법인(CORP)과 한국 개인사업자(INDIV)만 온보딩한다.

## 스택, 로컬 환경

- **backend: Kotlin** (Spring Boot 또는 Ktor — 개발팀 선택), Gradle
- **frontend: React** — 기존 `prototype-next`(Next.js)를 재사용, localStorage 접근을 API 호출로 전환. 접점은 `prototype-next/services/`
- **db: Postgres** (`schema.sql`) · **storage: MinIO**(로컬 S3 호환, 회사 환경에선 실 S3)
- 로컬은 **도커 compose**로 db/storage/backend/frontend를 통째로 기동 → 검증 후 회사 환경 이관. 목표 구조와 이관 규격은 `LOCAL_DEV.md`. 로컬↔회사 차이는 **환경변수로만** 흡수(S3 엔드포인트 등 하드코딩 금지).

## 스펙 원천 (충돌 시 이 순서)

1. [테이블 정의서](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4158980234) — 스키마 (`schema.sql`의 원본)
2. [PRD](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4134994324) — 스콥, 화면, 워크플로우 (섹션별 MVP vs Full 표 — MVP 열만 구현)
3. [ERD](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4148920321) — 설계 원칙과 이유
4. 프로토타입 `prototype-next/` — 화면·플로우의 살아있는 스펙. 서버 로직의 참조 구현은 `prototype-next/services/`

스펙 변경은 문서 → 코드 순서. 코드에서 먼저 바꾸지 않는다.

## 절대 어기면 안 되는 불변식

1. **question 행은 불변.** UPDATE는 `deactivated_at` 세팅만 허용 (schema.sql에 트리거로 강제됨). 질문 수정 = 기존 행 비활성 + 새 행 insert (`replaces_question_id`로 계보 연결).
2. **케이스는 룰을 "고정"해서 참조한다.** 케이스 생성 시 1차 질문 id 목록, 1차 제출 시 2차 질문 id 목록을 `onboarding_case.pinned_question_ids`에 저장. 진행 중 케이스의 화면은 항상 이 목록으로 렌더 — 룰 변경이 기존 케이스에 소급되면 버그다.
3. **서류 목록은 판정 시점에 doc_template에서 document 행으로 복사**된다 (합집합 + type dedup). 이후 템플릿 변경은 기존 케이스에 영향 없어야 한다.
4. **세그먼트 분류는 1차 제출 시 1회 평가 후 결과 저장** (`entity_code`, `services`). 재평가 없음.
5. **case_event는 append-only.** 수정, 삭제 금지. 타임라인 화면 = 이 테이블 하나.
6. **1계정 1활성 케이스** — partial unique index로 강제됨. COMPLETED/CLOSED 이후에만 새 케이스 가능.
7. **룰 테이블(segment, question, doc_template) 삭제는 소프트 삭제**(`deactivated_at`) — 과거 케이스가 참조하므로 행은 보존.

## 케이스 상태와 전이

상태 (PRD 3.1 — 액션 기준 명명, 담당 역할은 별도 매핑):

| 코드 | 내부 라벨 | 담당 |
| --- | --- | --- |
| `INQUIRY_RECEIVED` | 케이스 생성 (1차, 2차 정보 입력 중) | 고객 |
| `DOCUMENT_SUBMISSION_REQUIRED` | 서류 제출 대기 | 고객 |
| `INITIAL_SCREENING` | 1차 스크리닝 | 영업 (SALES) |
| `DOCUMENT_SCREENING_REQUIRED` | 서류 스크리닝 | 운영 (OPS) |
| `APPROVAL_REVIEW_REQUIRED` | 심사, 승인 | 컴플라이언스 (COMPLIANCE) |
| `ACCOUNT_SETUP_REQUIRED` | 계정 개설 | 운영 (OPS) |
| `REVISION_REQUESTED` | 보완 요청 (고객 대기) | 고객 |
| `COMPLETED` | 완료 | — |
| `CLOSED` | 종료 (`close_reason`: DROPPED=내부 중단 / EXITED=고객 이탈) | — |

정상 흐름:

| from | to | 주체 | 트리거 |
| --- | --- | --- | --- |
| INQUIRY_RECEIVED | DOCUMENT_SUBMISSION_REQUIRED | 고객 | 2차 설문 제출 (서류 목록 생성) |
| DOCUMENT_SUBMISSION_REQUIRED | INITIAL_SCREENING | 고객 | 필수 서류 전부 업로드 후 제출 |
| INITIAL_SCREENING | DOCUMENT_SCREENING_REQUIRED | 영업 | 1차 스크리닝 통과 |
| DOCUMENT_SCREENING_REQUIRED | APPROVAL_REVIEW_REQUIRED | 운영 | 서류 스크리닝 통과 |
| APPROVAL_REVIEW_REQUIRED | ACCOUNT_SETUP_REQUIRED | 컴플라이언스 | 심사 승인 (서류 전건 APPROVED) |
| ACCOUNT_SETUP_REQUIRED | COMPLETED | 운영 | 계정 개설 완료 |

보완 루프 (검토 3단계 공통):

- INITIAL_SCREENING / DOCUMENT_SCREENING_REQUIRED / APPROVAL_REVIEW_REQUIRED → **REVISION_REQUESTED** (보완요청 — 서류별 사유 입력 필수, `revision_requested_from`에 요청 단계 기록)
- REVISION_REQUESTED → **`revision_requested_from`에 기록된 단계로 복귀** (고객 재제출 시)
- 미해결 revision_request 행은 항상 같은 단계 출신이다 (케이스는 한 시점에 한 단계) — `revision_requested_from`은 파생 캐시, 원천은 revision_request 테이블

종료: 위 모든 상태에서 내부가 사유 입력 후 CLOSED(DROPPED) 가능. 자동 이탈(EXITED 배치)은 Full Spec — MVP는 수동만.

서류 상태(문서당): `NOT_REQUESTED → REQUESTED → SUBMITTED → APPROVED 또는 REVISION_REQUIRED → SUBMITTED …` 승인은 컴플라이언스만, 개별 승인만(일괄 없음).

구현 참조: `prototype-next/services/stateMachine.ts` (구현체와 위 표가 다르면 PRD 3.1이 맞음 — PM에게 확인).

## API 후보 목록

프로토타입 서비스 레이어(`prototype-next/services/`)의 함수가 곧 필요한 엔드포인트다. 초안:

| 프로토타입 함수 | 제안 REST | 권한 |
| --- | --- | --- |
| createCase | POST /cases (1차 응답 포함) | 고객 |
| getIntakeResponse | GET /cases/{id}/intake/{phase} | 고객, 내부 |
| confirmSecondIntake | POST /cases/{id}/intake/second (제출 → 분류 확정 + 서류 생성) | 고객 |
| getDocuments | GET /cases/{id}/documents | 고객, 내부 |
| uploadFile | POST /documents/{id}/files | 고객 |
| approveDocument | POST /documents/{id}/approve | 컴플라이언스 |
| requestRevision | POST /documents/{id}/revision-requests (사유 필수) | 영업, 운영, 컴플라이언스 |
| resubmitRevision | POST /cases/{id}/resubmit (→ 요청 단계로 복귀) | 고객 |
| transitionStatus | POST /cases/{id}/transitions (가드 = 위 전이표) | 역할별 |
| changeOwner | PATCH /cases/{id}/assignee | 내부 |
| (caseEventStore) | GET /cases/{id}/events (타임라인) | 고객(일부), 내부 |
| (ruleStore) | GET /rules/active (1차 질문, 세그먼트, 핀 대상 조회용) | 고객, 내부 |

인증: 고객 = email + password (잠정, Open), 내부 = 구글 SSO(백오피스 계정) + staff 테이블 role 인가. 내부 API는 VDI/백오피스 망, 고객 API는 인터넷망 — 망 분리는 API 계층에서, DB는 공유.

## MVP에서 만들지 않는 것

수금(Collection)과 FI 세그먼트 전체, 룰 관리 화면(룰은 시드로만 — 시드 변경은 마이그레이션), 댓글, 알림, 임시저장(draft), 일괄 승인, 즉석 서류 추가(ad-hoc), 사업자번호 자동 중복 판단, 자동 이탈 배치, 계정/권한 관리 화면. 전부 Full Spec — 스키마는 추가/완화만으로 확장되도록 이미 설계돼 있으니 미리 만들지 말 것.

## 데이터 주의

실고객 데이터, 운영 크리덴셜을 AI 도구 입력에 넣지 않는다. 시드와 테스트 데이터는 전부 가짜(schema.sql 하단 예시). 개인정보 컬럼(사업자번호, 연락처, BO 정보)은 로그에 남기지 않는다.
