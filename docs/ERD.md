# ARK - 서버 데이터 모델 (ERD)

> **정본: 이 GitHub 문서.** [Confluence 페이지](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4148920321)는 열람용 미러. 컬럼↔Kotlin 변수 매핑은 [TABLE-SPEC.md](TABLE-SPEC.md), DDL 원본은 `ark-backend` liquibase(`src/main/resources/db/changelog/sql/`).
> 최종 동기화: **2026-08-26 — `ark-backend` 구현 스키마 기준** (liquibase V002 스키마 + V004 인증, JdbcEntity 13개).

---

[PRD](PRD.md) 기반으로 설계하고 **`ark-backend`에 실제 구현된** 서버 데이터 모델이다(2026-08-26 구현 반영). **2026-08-05 설계**: 룰셋 JSONB 버전 스냅샷(구 rule_set 테이블)을 버리고, **불변 질문 + 케이스 고정** 모델로 재설계 — 룰 패널 CRUD와 Collection 국가 확장이 행 단위로 자연스러워진다. 컬럼↔변수 상세는 [TABLE-SPEC.md](TABLE-SPEC.md) 참조.

## 1. 설계 원칙

* **테이블 14개 (룰 3 + 케이스 8 + 인증 3).** 인증(`otp_token`·`customer_session`·`staff_session`)은 PI-132에서 추가(liquibase V004). comment, notification 등 Full Spec 확장은 전부 테이블/컬럼 추가만으로 — 기존 스키마 변경 없음.
* **소급 차단은 "케이스가 고정"으로 달성한다.** 질문 구성은 케이스의 `pinned_question_ids`에 확정 시점 id 목록으로 저장, 서류 목록은 `document` 행으로 복사 생성, 세그먼트 분류는 1차 제출 시 1회 평가 후 결과 저장. 그래서 룰셋 버전 스냅샷이 필요 없다.
* **불변은 question 하나만.** 질문은 진행 중 케이스가 화면을 그릴 때마다 계속 다시 읽는 유일한 룰 정의라서 수정 불가 — 생성 + 소프트 삭제만 허용, 수정 = 비활성 + 새 행(`replaces_question_id` 계보). 내용이 불변이니 케이스는 id 목록만 고정하면 전체가 고정된다.
* **segment, doc_template은 일반 편집 가능.** 변경이 신규 케이스에만 영향을 주는 구조라(위 고정 덕분) 버저닝 불필요. Full Spec 룰 패널은 이 테이블들의 단순 CRUD 화면이 된다.
* **Collection 국가 추가 = 행 insert.** segment 행 1개 + 고유 질문, 서류 행 — 스키마 변경 없음.
* **1차/2차 응답은 JSONB 1행.** `{question_id: value}` — question이 불변이라 언제 조회해도 정확히 조인된다.
* **이력은 통합 이벤트 로그 1개**(`case_event`, append-only), **파일 바이너리는 DB 밖**(오브젝트 스토리지, DB엔 키만), **상태 코드는** `varchar` + CHECK.

> 망 분리(내부 제품 = VDI/백오피스, 고객 제품 = 인터넷망)는 API 계층에서 나누고, DB는 하나를 공유하는 전제다. 필요 시 read replica로 분리.

## 2. ERD

```
[룰 도메인 — 룰 패널(Full)이 편집하는 영역]

 ┌─────────┐ 1 (own 소속) N ┌──────────────┐   ┌──────────────┐
 │ segment │ ────────────── │   question   │   │ doc_template │
 └────┬────┘                │   (불변)     │   │              │
      │ 1 (own 소속)        └──────────────┘   └──────┬───────┘
      └───────────────────────────────────────────────┘
   분류 트리거 + 질문/서류 오버라이드는 segment에 jsonb 내장

[케이스 도메인 — 케이스가 룰을 "고정"해서 참조]

 ┌──────────┐ 1           N ┌─────────────────────────┐
 │ customer │ ───────────── │    onboarding_case      │
 └──────────┘               │ pinned_question_ids     │
 ┌──────────┐ ───────────── │ = 질문 구성 고정        │
 │  staff   │ 1 (assignee) N└────────────┬────────────┘
 └──────────┘                          1 │
           ┌───────────────────┬─────────┴───────────┐
         N │                 N │                   N │
  ┌────────────────┐    ┌───────────┐      ┌─────────────────┐
  │intake_response │    │ document  │◄──── │ doc_template    │
  │{question_id:값}│    └─────┬─────┘ 복사 │ (판정 시 생성)  │
  └────────────────┘        1 │            └─────────────────┘
                  ┌───────────┴─────────┐      ┌─────────────────┐
                N │                   N │      │   case_event    │
        ┌───────────────┐   ┌──────────────────┐ (통합 이력 로그,│
        │ document_file │   │ revision_request │  케이스 1:N)    │
        └───────────────┘   └──────────────────┘└─────────────────┘
```

Mermaid 소스 (필요 시 도구에 붙여넣기):

```
erDiagram
  segment ||--o{ question : "own 소속"
  segment ||--o{ doc_template : "own 소속"
  question ||--o{ question : "parent / replaces (self-ref)"
  staff ||--o{ question : "authors (created_by)"
  doc_template ||--o{ document : "판정 시 복사 생성"
  customer ||--o{ onboarding_case : "owns"
  staff ||--o{ onboarding_case : "assignee"
  onboarding_case ||--o{ intake_response : ""
  onboarding_case ||--o{ document : ""
  document ||--o{ document_file : "submissions"
  document ||--o{ revision_request : "revision reasons"
  staff ||--o{ document_file : "uploads (STAFF)"
  staff ||--o{ revision_request : "requests"
  onboarding_case ||--o{ case_event : "timeline"
  customer ||--o{ customer_session : "auth"
  staff ||--o{ staff_session : "auth"
  %% otp_token: email 기반 코드 발급 (customer.email 논리 참조, FK 없음)
```

## 3. 테이블 요약

컬럼 정의는 [TABLE-SPEC.md](TABLE-SPEC.md)가 원본이다.

| 테이블 | 담는 것 |
| --- | --- |
| **segment** | 세그먼트 사전 — 코드/표시명 + 분류 트리거(jsonb) + 세그먼트별 질문/서류 오버라이드(jsonb). 국가 추가 = 행 1개 |
| **question** (불변) | 질문 1개 = 행 1개 — 문구, 옵션, 표시조건, 공통/고유. 수정 = 새 행 + 계보 |
| **doc_template** | 서류 종류 사전 — type 코드(dedup 키), 표시명, 필수/조건부, 제출 안내 |
| **customer** | 고객 계정 — 이메일, 회사명, 담당자명, 사업자번호 |
| **staff** | 내부 직원 — 구글 SSO 식별자, 역할(인가) |
| **onboarding_case** | 케이스 원장 — 상태, 세그먼트 판정 결과, 담당자, **고정된 질문 id 목록** |
| **intake_response** | 설문 답변 — 1차 1행 + 2차 1행, `{question_id: value}` |
| **document** | 케이스별 요구 서류 목록 + 서류 상태 (템플릿에서 복사 생성) |
| **document_file** | 업로드 파일 — 파일명, 스토리지 키 (append-only) |
| **revision_request** | 서류별 보완 요청 사유 — 누가, 어느 단계에서, 왜 |
| **case_event** | 타임라인 — 모든 상태/담당자 변경 이력 (append-only) |
| **otp_token** (인증) | 이메일 OTP 코드 발급/만료 (email 기반, FK 없음). JdbcEntity 없이 직접 접근 |
| **customer_session** (인증) | 고객 세션 토큰 — OTP 검증 후 발급, `token` unique |
| **staff_session** (인증) | 내부 직원 세션 토큰 — mock-login/SSO 후 발급, `token` unique |

## 3.5 구현 반영 노트 (2026-08-26, ark-backend 기준)

설계와 스키마 골격은 동일하며, 구현에서 확인된 상세는 다음과 같다. 컬럼↔Kotlin 변수 전체는 [TABLE-SPEC.md](TABLE-SPEC.md).

* **jsonb 매핑 타입이 도메인별로 다름** — 케이스 계열은 `Map<String,Any>`(컨버터로 파싱): `onboarding_case.segment_meta`/`pinned_question_ids`, `intake_response.answers`, `case_event.payload`. 반면 **룰 계열은 `String?`(raw json 문자열 보관)**: `segment.classification_trigger`/`question_overrides`/`doc_overrides`, `question.options`/`show_when`, `doc_template.condition`.
* **감사필드** — `created_at`은 `@CreatedDate @ReadOnlyProperty val createdAt: Instant?`, `updated_at`은 `@LastModifiedDate ... Instant?`. 그 외 시각 컬럼은 `OffsetDateTime?`.
* **`text[]` 매핑** — `onboarding_case.services`/`sectors` → `List<String>` (읽기 ArrayToStringListConverter, 쓰기 `::text[]` 캐스팅).
* **DB 강제 불변식** — `question_immutable` 트리거(deactivated_at만 변경 허용), 고객당 활성 케이스 1개(`case_one_active_per_customer_uq`), 서류당 케이스 유일(`unique(case_id,type)`), 파일 업로더 무결성 CHECK(`(uploader_type='STAFF') = (uploader_staff_id IS NOT NULL)`), 각 룰 테이블 `code/type` active-unique 부분 인덱스.
* **JdbcEntity = 13개** (otp_token 제외, 세션/OTP는 인증 어댑터). 파일명: `{Segment,Question,DocTemplate,OnboardingCase,CaseEvent,IntakeResponse,Document,DocumentFile,RevisionRequest,Customer,CustomerSession,Staff,StaffSession}JdbcEntity`.

## 4. 동작 흐름 (소급 차단이 작동하는 방식)

1. **케이스 생성** — 활성 first 질문을 조회해 `pinned_question_ids.first`에 고정. 이후 1차 질문이 바뀌어도 이 케이스 화면은 그대로.
2. **1차 제출** — segment의 분류 트리거를 **1회 평가** → `entity_code`, `services` 저장(판정 근거는 `segment_meta`에 기록). 보유 세그먼트의 2차 질문(공통 ∪ 고유, 오버라이드 적용)을 `pinned_question_ids.second`에 고정. 서류는 doc_template 합집합 + type dedup으로 `document` 행 **복사 생성**.
3. **이후 룰 변경**(질문 교체, 템플릿/트리거/오버라이드 수정) — 신규 케이스부터만 반영. 진행 중 케이스는 고정된 id와 복사된 행으로 계속 동작.

## 5. MVP 스코프

* **룰 테이블 3개는 시드 insert로만 채운다** — 룰 패널 없음(PI-125), 질문 전문의 원천은 설문 시트. 질문 변경 = 시드 마이그레이션으로 새 행 insert (불변 원칙은 MVP에서도 동일).
* MVP 구현 제약 (스키마는 그대로, 값과 API만 제한):
    * **세그먼트**: entity는 `ENTITY_CORP`, `ENTITY_INDIV`만. services는 `SVC_PAYOUT` 고정 — 1차 질문에서 수금 옵션 미노출, 송금 선택 고정(PI-126). sectors 미사용.
    * **즉석 서류 추가 없음** — 서류 목록은 doc_template에서만.
    * **사업자번호 중복 자동판단 없음** — `business_reg_no` 저장만.
    * **임시저장 없음** — `intake_response.status`는 not_started / submitted만.
    * **고객 인증 = 이메일 OTP**, **파일 pdf/png/jpg, 10MB, 서류당 1개(Full은 멀티업로드)**, **승인은 개별만**, **파기는 수동만(Full은 자동)**, **staff는 직접 행 관리**.
* Full Spec 확장 목록(comment, notification, ad-hoc 컬럼, draft, 멀티업로드, 자동 파기, 자동 이탈, 중복 판단, 오버라이드 map 승격)은 [TABLE-SPEC.md](TABLE-SPEC.md) 3장 참조.

## 6. 확정 필요 (Open)

1. **파일 정책** — [확정 2026-08-07] pdf/png/jpg, 상한 10MB, MVP 서류당 1파일 / Full 멀티업로드. 바이러스 스캔은 Full.
2. **케이스 파기 정책** — [방향 확정 2026-08-07] MVP는 수동 파기만. Full은 **케이스 종료 1개월 후 파기 배치** — 응답·서류·파일 삭제, 회사명·담당자명·희망 거래형태(entity/services)만 잔존(TABLE-SPEC 3장). ⚠️ **1개월 기준·담당자명(개인정보) 보관 근거는 컴플라이언스 사인오프 필요** (별도 트랙).
3. **고객 로그인 방식** — [확정 2026-08-07] 이메일 + 이메일 OTP(비밀번호 없음). OTP 코드 저장소(테이블/외부 서비스)는 개발팀 구현 선택. 내부는 구글 SSO.
4. **상태 코드 표기** — [완료] 프론트 신명칭 마이그레이션 PI-124. 서버는 처음부터 신명칭.
5. **질문 교체 계보 운영 기준** — 교체 시 code 승계 규칙(응답 통계를 어느 단위로 묶을지) 확정 필요. _룰 패널(Full) 도입 시 확정 — MVP는 시드 관리라 급하지 않음._
6. **사업자 기준 중복 판단 (Full Spec)** — 사업자등록번호는 2차 수집이라 중복 검사를 2차 제출 시점에 하는 흐름이 맞는지.
