# ARK - API 설계서 (프론트 ↔ 서버 계약)

> **정본: 이 GitHub 문서.** 프론트↔서버 데이터 계약의 단일 원천. 백엔드 표준([SERVER-STANDARD.md](SERVER-STANDARD.md))을 따른다 — 각 엔드포인트는 헥사고날 `adapter/in` 컨트롤러 + **타입드 요청/응답 DTO**(Map 금지), Springdoc OpenAPI + Spring REST Docs 스니펫 산출. 프론트는 생성된 OpenAPI를 계약으로 삼아 연동한다.
> 최종: 2026-08-15. **MVP 대상 = 18개**(+ `/health` 제외). **임시저장 PUT 2개(C3·C5)는 MVP 제외 — Full Spec**(2026-08-15 확정).

## 백엔드 표준 반영 (설계 원칙)

이 API 설계는 [SERVER-STANDARD.md](SERVER-STANDARD.md)(회사 백엔드 표준)를 그대로 따른다:

- **아키텍처(헥사고날)**: 각 엔드포인트 = 도메인 `adapter/in` 컨트롤러 + `adapter/in`의 요청/응답 DTO. 컨트롤러는 **비즈니스 로직 없이** `application/port/in` 유스케이스만 호출. 영속성은 서비스가 `port/out`(JDBC 어댑터)로.
- **스택**: Kotlin 2.3.20 + Spring Boot 4.1.0(Spring MVC, 동기 + 코루틴), JDK 25. 영속성 Spring Data JDBC(JPA 아님), 마이그레이션 Liquibase.
- **DTO/직렬화**: 응답은 **타입드 data class(Map 금지)**, kotlinx-serialization + Jackson.
- **문서**: Springdoc OpenAPI(Swagger) + Spring REST Docs — 프론트 계약 원본.
- **품질**: ktlint 1.8.0, null 안정성 strict. 테스트 Kotest + Testcontainers(계약 테스트).
- **로깅** Log4j2, 오류 `GlobalExceptionHandler` 표준 에러 DTO.
- **인증/망분리**: 고객 API(인터넷망) OTP 세션 / 내부 `/internal/*`(백오피스·VDI 망) SSO + staff role. AWS SDK v2(S3·Secrets Manager), 4프로필(local/dev/stg/prd).

## 공통 규칙

- **인증**: 고객 API = 이메일 OTP 세션(인터넷망), 내부 API(`/internal/*`) = 구글 SSO + staff role(백오피스/VDI 망). 헤더/세션 방식은 인증 티켓 기준.
- **응답 DTO는 타입드 data class**로 정의(현재 `Map<String,Any>` → 전환). 그래야 OpenAPI 응답 스키마가 정확하고 프론트 타입이 계약과 일치.
- 시각은 ISO-8601(timestamptz), id는 uuid 문자열.
- 오류는 표준 에러 DTO `{ code, message }` + 적절한 HTTP status(GlobalExceptionHandler).
- 각 엔드포인트 = 프론트 서비스 레이어(`prototype-next/services/`)의 대응 함수와 1:1.

## 1. 고객 API (13 — MVP 11 + Full 2: C3·C5 임시저장)

| # | 메서드·경로 | 용도 | 요청 DTO | 응답 DTO |
| --- | --- | --- | --- | --- |
| C1 | `POST /cases` | 케이스 생성 + 1차 응답 시작 | `CreateCaseRequest{ }`(고객 세션에서 customerId) | `CaseResponse` |
| C2 | `GET /cases/{id}` | 고객 케이스 상세(본인 소유) | — | `CaseResponse`(status, 서류 요약, 안내) |
| ~~C3~~ | `PUT /cases/{id}/intake/first` | 1차 응답 저장 — **MVP 제외(임시저장 Full Spec)** | — | — |
| C4 | `POST /cases/{id}/intake/first/submit` | 1차 제출 → 분류 1회 + 2차 질문 고정 | `IntakeAnswersRequest{ answers }` | `CaseResponse`(entityCode, services, pinned) |
| ~~C5~~ | `PUT /cases/{id}/intake/second` | 2차 응답 저장 — **MVP 제외(임시저장 Full Spec)** | — | — |
| C6 | `POST /cases/{id}/intake/second/submit` | 2차 제출 → 서류 생성 → 서류 제출 대기 | `IntakeAnswersRequest{ answers }` | `CaseResponse` |
| C7 | `GET /cases/{id}/intake/{phase}` | 저장된 응답 조회 | — | `IntakeResponse` |
| C8 | `POST /cases/{id}/resubmit` | 보완 재제출 → 요청 검토 단계로 복귀 | — | `CaseResponse` |
| C9 | `GET /cases/{caseId}/documents` | 케이스 서류 목록(+현재 라운드 보완 사유) | — | `List<DocumentResponse>` |
| C10 | `POST /cases/{caseId}/documents/{docId}/file` | 서류 파일 업로드(pdf/png/jpg, 10MB, 1파일) | multipart `file` | `DocumentFileResponse` |
| C11 | `POST /auth/otp/request` | OTP 코드 발급(이메일) | `OtpRequest{ email }` | `{ sent: true }` |
| C12 | `POST /auth/otp/verify` | OTP 검증 → 세션 발급 | `OtpVerifyRequest{ email, code }` | `AuthSessionResponse` |
| C13 | `GET /rules/active` | 활성 룰(1차 질문·세그먼트·핀 대상) 조회 | `?segment=`(옵션) | `ActiveRulesResponse` |

## 2. 내부 API (7)

| # | 메서드·경로 | 용도 | 요청 DTO | 응답 DTO |
| --- | --- | --- | --- | --- |
| I1 | `GET /internal/cases` | 대시보드 목록(역할별 기본 필터) | `?status=&assignee=`(옵션) | `List<CaseSummaryResponse>` |
| I2 | `GET /internal/cases/{id}` | 케이스 상세 + 타임라인(case_event) | — | `InternalCaseResponse`(+ timeline) |
| I3 | `POST /internal/cases/{id}/advance` | 다음 검토 단계로 전이(역할 가드) | — | `CaseResponse` |
| I4 | `POST /internal/cases/{id}/close` | 케이스 종료(사유 필수) | `CloseRequest{ reason: DROPPED\|EXITED }` | `CaseResponse` |
| I5 | `POST /internal/documents/{id}/revision-requests` | 서류 보완요청(사유 필수, 영업·운영·컴플) | `RevisionRequest{ reason }` | `DocumentResponse` |
| I6 | `POST /internal/documents/{id}/approve` | 서류 승인(컴플라이언스, 개별) | — | `DocumentResponse` |
| I7 | `POST /internal/auth/mock-login` | (로컬) 내부 SSO 목 로그인 | `MockLoginRequest{ email, role }` | `AuthSessionResponse` |

## 3. 응답 DTO 정의 (타입드)

```
CaseResponse {
  id: uuid; status: string; entityCode: string?; services: string[];
  closeReason: string?; revisionRequestedFrom: string?;
  pinnedQuestionIds: { first: uuid[]; second: uuid[] };
  createdAt; updatedAt
}
CaseSummaryResponse { id; customerId; companyName?; status; entityCode?; services; assigneeStaffId?; createdAt; updatedAt }
InternalCaseResponse : CaseResponse + { segmentMeta; assigneeStaffId?; timeline: CaseEvent[] }
CaseEvent { id; eventType; actorType; actorId?; payload; createdAt }
IntakeResponse { caseId; phase; status; answers; savedAt; submittedAt? }
DocumentResponse { id; caseId; type; displayName; status; isRequired; latestFile?: DocumentFileResponse; openRevisionReason?: string }
DocumentFileResponse { id; documentId; fileName; fileSize; mimeType; isLatest; uploadedAt; uploaderType }
ActiveRulesResponse { segments: Segment[]; questions: Question[]; docTemplates: DocTemplate[] }
AuthSessionResponse { token/sessionId; role?; expiresAt }
```

## 4. 알려진 정합 이슈 (이 설계에서 해소)

1. **응답 `Map<String,Any>` → 위 타입드 DTO로 전환**(전 엔드포인트). OpenAPI 응답 스키마 정확화.
2. **프론트 연동 미검증** → 각 엔드포인트를 `prototype-next/services/` 대응 함수에서 실제 호출로 연결, OpenAPI 계약 기준.
3. **경로/동사 확정** — 업로드는 `/cases/{caseId}/documents/{docId}/file`(단수), 전이는 `advance`/`close`. generic `/transitions` 아님. 프론트는 이 실제 경로에 맞춘다.
4. **임시저장(PUT intake save)** — [확정 2026-08-15] **MVP 제외**(임시저장 = Full Spec). C3·C5 스코프 아웃 — 프론트 미연동, 백엔드 PUT 엔드포인트는 제거 또는 비활성. 제출(C4·C6)이 answers를 직접 받으므로 선행 저장 불필요.
5. **담당자 수동 변경**은 MVP 제외(역할당 1계정) — 엔드포인트 없음(정상).

## 5. 엔드포인트별 완료 기준 (공통 AC 템플릿)

각 API 티켓은 아래를 만족해야 완료:
- 타입드 요청/응답 DTO(Map 아님), 헥사고날 `adapter/in`에서 `port/in` 유스케이스 호출
- Springdoc OpenAPI에 정확한 스키마 노출 + Spring REST Docs 스니펫 생성
- 인증·역할 가드(고객 소유 / 내부 role) 적용
- 프론트 서비스 레이어가 이 엔드포인트를 실제 호출(localStorage 대체)
- 계약 테스트(Kotest, 요청/응답 스키마 + 권한 거부) 통과

---

# English Version

# ARK - API Design (Frontend ↔ Server Contract)

> **Source of truth: this GitHub document.** The single source for the frontend↔server data contract. Follows the backend standard ([SERVER-STANDARD.md](SERVER-STANDARD.md)) — each endpoint is a hexagonal `adapter/in` controller + a **typed request/response DTO** (no Map), producing Springdoc OpenAPI + Spring REST Docs snippets. The frontend integrates against the generated OpenAPI as the contract.
> Last updated: 2026-08-15. **MVP scope = 18 endpoints** (excluding `/health`). **The two draft-save PUTs (C3·C5) are excluded from MVP — Full Spec** (confirmed 2026-08-15).

## Backend Standard Applied (Design Principles)

This API design directly follows [SERVER-STANDARD.md](SERVER-STANDARD.md) (the company backend standard):

- **Architecture (hexagonal)**: each endpoint = a domain `adapter/in` controller + a request/response DTO in `adapter/in`. The controller has **no business logic** and only invokes `application/port/in` use cases. Persistence goes from the service through `port/out` (the JDBC adapter).
- **Stack**: Kotlin 2.3.20 + Spring Boot 4.1.0 (Spring MVC, synchronous + coroutines), JDK 25. Persistence with Spring Data JDBC (not JPA), migrations with Liquibase.
- **DTO/serialization**: responses are **typed data classes (no Map)**, kotlinx-serialization + Jackson.
- **Docs**: Springdoc OpenAPI (Swagger) + Spring REST Docs — the source for the frontend contract.
- **Quality**: ktlint 1.8.0, strict null safety. Tests with Kotest + Testcontainers (contract tests).
- **Logging** Log4j2, errors via the `GlobalExceptionHandler` standard error DTO.
- **Auth/network segregation**: customer APIs (internet) use OTP sessions / internal `/internal/*` (back-office·VDI network) use SSO + staff role. AWS SDK v2 (S3·Secrets Manager), 4 profiles (local/dev/stg/prd).

## Common Rules

- **Auth**: customer APIs = email OTP session (internet); internal APIs (`/internal/*`) = Google SSO + staff role (back-office/VDI network). Header/session mechanics follow the auth ticket.
- **Response DTOs are defined as typed data classes** (currently `Map<String,Any>` → to be converted). This makes the OpenAPI response schema accurate and the frontend types match the contract.
- Timestamps are ISO-8601 (timestamptz), ids are uuid strings.
- Errors use the standard error DTO `{ code, message }` + an appropriate HTTP status (GlobalExceptionHandler).
- Each endpoint = 1:1 with the corresponding function in the frontend service layer (`prototype-next/services/`).

## 1. Customer API (13 — MVP 11 + Full 2: C3·C5 draft-save)

| # | Method·Path | Purpose | Request DTO | Response DTO |
| --- | --- | --- | --- | --- |
| C1 | `POST /cases` | Create case + start first response | `CreateCaseRequest{ }` (customerId from the customer session) | `CaseResponse` |
| C2 | `GET /cases/{id}` | Customer case detail (owned by self) | — | `CaseResponse` (status, document summary, guidance) |
| ~~C3~~ | `PUT /cases/{id}/intake/first` | Save first response — **excluded from MVP (draft-save is Full Spec)** | — | — |
| C4 | `POST /cases/{id}/intake/first/submit` | First submit → classify once + pin second questions | `IntakeAnswersRequest{ answers }` | `CaseResponse` (entityCode, services, pinned) |
| ~~C5~~ | `PUT /cases/{id}/intake/second` | Save second response — **excluded from MVP (draft-save is Full Spec)** | — | — |
| C6 | `POST /cases/{id}/intake/second/submit` | Second submit → generate documents → await document submission | `IntakeAnswersRequest{ answers }` | `CaseResponse` |
| C7 | `GET /cases/{id}/intake/{phase}` | Retrieve saved responses | — | `IntakeResponse` |
| C8 | `POST /cases/{id}/resubmit` | Revision re-submit → return to the review stage | — | `CaseResponse` |
| C9 | `GET /cases/{caseId}/documents` | Case document list (+ current-round revision reasons) | — | `List<DocumentResponse>` |
| C10 | `POST /cases/{caseId}/documents/{docId}/file` | Upload document file (pdf/png/jpg, 10MB, 1 file) | multipart `file` | `DocumentFileResponse` |
| C11 | `POST /auth/otp/request` | Issue OTP code (email) | `OtpRequest{ email }` | `{ sent: true }` |
| C12 | `POST /auth/otp/verify` | Verify OTP → issue session | `OtpVerifyRequest{ email, code }` | `AuthSessionResponse` |
| C13 | `GET /rules/active` | Retrieve active rules (first questions·segments·pin targets) | `?segment=` (optional) | `ActiveRulesResponse` |

## 2. Internal API (7)

| # | Method·Path | Purpose | Request DTO | Response DTO |
| --- | --- | --- | --- | --- |
| I1 | `GET /internal/cases` | Dashboard list (default filter by role) | `?status=&assignee=` (optional) | `List<CaseSummaryResponse>` |
| I2 | `GET /internal/cases/{id}` | Case detail + timeline (case_event) | — | `InternalCaseResponse` (+ timeline) |
| I3 | `POST /internal/cases/{id}/advance` | Transition to the next review stage (role guard) | — | `CaseResponse` |
| I4 | `POST /internal/cases/{id}/close` | Close case (reason required) | `CloseRequest{ reason: DROPPED\|EXITED }` | `CaseResponse` |
| I5 | `POST /internal/documents/{id}/revision-requests` | Request document revision (reason required; sales·ops·compliance) | `RevisionRequest{ reason }` | `DocumentResponse` |
| I6 | `POST /internal/documents/{id}/approve` | Approve document (compliance, individual) | — | `DocumentResponse` |
| I7 | `POST /internal/auth/mock-login` | (local) internal SSO mock login | `MockLoginRequest{ email, role }` | `AuthSessionResponse` |

## 3. Response DTO Definitions (typed)

```
CaseResponse {
  id: uuid; status: string; entityCode: string?; services: string[];
  closeReason: string?; revisionRequestedFrom: string?;
  pinnedQuestionIds: { first: uuid[]; second: uuid[] };
  createdAt; updatedAt
}
CaseSummaryResponse { id; customerId; companyName?; status; entityCode?; services; assigneeStaffId?; createdAt; updatedAt }
InternalCaseResponse : CaseResponse + { segmentMeta; assigneeStaffId?; timeline: CaseEvent[] }
CaseEvent { id; eventType; actorType; actorId?; payload; createdAt }
IntakeResponse { caseId; phase; status; answers; savedAt; submittedAt? }
DocumentResponse { id; caseId; type; displayName; status; isRequired; latestFile?: DocumentFileResponse; openRevisionReason?: string }
DocumentFileResponse { id; documentId; fileName; fileSize; mimeType; isLatest; uploadedAt; uploaderType }
ActiveRulesResponse { segments: Segment[]; questions: Question[]; docTemplates: DocTemplate[] }
AuthSessionResponse { token/sessionId; role?; expiresAt }
```

## 4. Known Consistency Issues (resolved in this design)

1. **Response `Map<String,Any>` → convert to the typed DTOs above** (all endpoints). Makes the OpenAPI response schema accurate.
2. **Frontend integration unverified** → wire each endpoint to an actual call in the corresponding `prototype-next/services/` function, based on the OpenAPI contract.
3. **Path/verb finalized** — upload is `/cases/{caseId}/documents/{docId}/file` (singular), transitions are `advance`/`close`. Not a generic `/transitions`. The frontend conforms to these actual paths.
4. **Draft-save (PUT intake save)** — [confirmed 2026-08-15] **excluded from MVP** (draft-save = Full Spec). C3·C5 are scoped out — not wired on the frontend; the backend PUT endpoints are removed or disabled. Since the submits (C4·C6) take answers directly, no prior save is needed.
5. **Manual assignee change** is excluded from MVP (one account per role) — no endpoint (as intended).

## 5. Per-Endpoint Completion Criteria (common AC template)

Each API ticket must satisfy the following to be complete:
- Typed request/response DTO (not Map), invoking a `port/in` use case from the hexagonal `adapter/in`
- Accurate schema exposed in Springdoc OpenAPI + Spring REST Docs snippets generated
- Auth·role guards applied (customer ownership / internal role)
- The frontend service layer actually calls this endpoint (replacing localStorage)
- Contract tests (Kotest; request/response schema + authorization denial) pass
