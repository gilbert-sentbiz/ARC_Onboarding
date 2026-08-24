# 온보딩 플랫폼 PRD 변경 로그

## 2026-08-15 — API: 임시저장 제외 + 프론트 전환 토대·통합 테스트 티켓

> Gilbert 결정. 임시저장 MVP 제외, 그리고 프론트 API 전환 1·2·3 중 앱-레벨 토대·통합을 티켓화.

- **임시저장 MVP 제외** — C3·C5(`PUT /intake/first|second`) 스코프 아웃. API-SPEC MVP 18개(고객 11 + 내부 7). PI-155·157 `mvp-scope-out`, 착수 안 함. 제출(C4·C6)이 answers 직접 수신.
- **프론트 API 전환(1·2·3) 정리**: ②타입드 DTO·③계약 테스트는 이미 엔드포인트 20개 티켓에 각각 반영. 추가로 —
  - **PI-173** 프론트 API 전환 토대(선행) — OpenAPI 클라이언트·타입, API client(4프로필 base URL), 세션(OTP/SSO), localStorage 제거.
  - **PI-174** 통합/계약 테스트 1패스(후행) — 전 엔드포인트 연동 후 고객·내부 골든패스 end-to-end, 계약 불일치 0.
- 순서: PI-173 → 엔드포인트 프론트 연동 → PI-174.

## 2026-08-15 — API 설계서 + 엔드포인트별 구현 티켓 (PI-152~172)

> 프론트↔서버 API 계약을 백엔드 표준에 맞게 정립. 엔드포인트 20개 각각을 티켓으로.

- **설계 정본**: [docs/API-SPEC.md](API-SPEC.md) — 엔드포인트 20개(고객 13 + 내부 7), 타입드 요청/응답 DTO, 인증(고객 OTP / 내부 SSO), 알려진 정합 이슈 3개.
- **우산 PI-152** + 엔드포인트별 서브태스크 20개(PI-153~172, 라벨 `api`). 각 티켓 = 그 엔드포인트에 대해 ①타입드 DTO(Map→data class) ②프론트 서비스 연동(OpenAPI 계약 기준) ③계약 테스트(Kotest)를 다 수행. + OpenAPI/REST Docs 스니펫, 인증·역할 가드.
- 정합 반영: C4·C8·I3·I5는 각각 분류 1회/재제출 복귀/상태머신(PI-142)/보완요청 3역할(PI-143)과 맞물림. C3·C5(임시저장 PUT)는 MVP 정합 판단 대상.
- 검토 결과 백엔드 엔드포인트 커버리지는 양호(고객/내부 경로 `/internal/*` 분리도 됨), 타임라인은 케이스 상세에 포함, 담당자 수동변경은 MVP 제외.

## 2026-08-13 — 문서 GitHub 정본 통일 + 서버 작업 위치 정리

> 기획 문서가 Confluence·로컬 Obsidian·낡은 GitHub 사본으로 흩어져 있던 것을 GitHub 정본으로 통일. Confluence는 열람용 미러로 전환.

- **정본 = GitHub `ARK_Onboarding/docs/` (main 브랜치)**: PRD.md, ERD.md, TABLE-SPEC.md, CHANGELOG.md, README(문서 허브) 신규. Confluence 3개 문서(4134994324/4148920321/4158980234)는 미러. 각 문서 상단에 정본/미러 헤더.
- 로컬 Obsidian PRD·CHANGELOG는 이관 배너 후 참고용. 낡은 `docs/arc-client-portal-spec.md`(5월 초기 스펙)는 DEPRECATED.
- 수정 방향 전환: **GitHub 마크다운 편집 → Confluence 미러 반영 → CHANGELOG**. ark-pm·ark-qa 스킬 지침에 반영.
- **서버 문서도 docs/로 이관** (완전 통일): `docs/SERVER-STANDARD.md`(구 server-spec/CLAUDE.md 규범), `docs/LOCAL_DEV.md`, `docs/schema.sql`. server-spec 브랜치 `server-spec/`는 이제 구 위치.
  - 단, `SERVER-STANDARD.md`는 AI 자동 로드를 위해 `ark-backend` 레포 루트에 `CLAUDE.md`로도 복사 필요(현재 부재) — 후속.
  - 서버 코드: `gilbert-sentbiz/ark-backend` 레포 (Kotlin/Spring, 회사 백엔드 표준).
  - 서버 데이터 모델은 docs/ERD.md·TABLE-SPEC.md(정본).
  - 서버 QA 적대 리뷰 결과(상태머신 설계 위반 PI-142·143 등)는 아래 2026-08-12 항목 참조 — 아직 미수정(To Do).

## 2026-08-12 — 서버 코드 QA 적대 리뷰: 상태머신 설계 위반 발견 (PI-142~145)

> ark-dev가 재정렬(PI-133) 백엔드 구현 완료(ark-backend 레포). QA 적대 리뷰 결과 빌드/스택/스키마/소급차단은 표준 부합, 워크플로우 상태전이에서 설계 위반 4건.

- **PI-142** 🔴 케이스 상태머신 재구성 — `CaseService.advanceStatus`가 DOCUMENT_SCREENING_REQUIRED(운영 서류 스크리닝) 단계를 건너뛰고 영업(SALES) 전이가 전무. 4단계(영업→운영→컴플→운영)가 3단계로 축소됨. 고객 주도 전이가 스태프 advance로 모델링.
- **PI-143** 🔴 보완 루프 완결 — 재제출 복귀 미구현(revisionRequestedFrom 저장만, resubmit 부재 → REVISION_REQUESTED에 갇힘), case/document requestRevision 미조율, 영업 제외.
- **PI-144** 🟠 case.services에 원응답 복사 → 분류 결과(SVC_*)로 저장해야.
- **PI-145** 🟡 헥사고날 포트 적용 불일치(case/document port 없음) + 명명(in/out).
- 정상 확인: question 불변 트리거·partial unique index, 분류 1회+pinned_question_ids 고정(소급차단), 서류 합집합 dedup, 고객 소유 확인·개별 승인 COMPLIANCE, 버전/JDBC/Liquibase/ktlint/log4j2/Redis/SecretsManager/springdoc/Kotest 전부 표준 부합.
- PI-133 하위 서브태스크(`qa-fix` 라벨). 142·143은 오픈 전 필수.

## 2026-08-11 — 회사 백엔드 표준 반영 + 서버 재정렬/레포 분리 (PI-133, PI-134)

> 회사 백엔드팀 공식 표준(BizPlatform, Confluence S2/4173660292) 확정. 구현은 우리(ark-dev)가 전부, 회사 백엔드는 인프라 지원만. 표준을 서버·프론트 설계에 강하게 반영.

- **표준 핵심**: Kotlin 2.3.20 + Spring Boot 4.1.0 + JDK 25 / **Spring Data JDBC(JPA 금지)** / **Liquibase**(Flyway 아님) / **헥사고날(Ports & Adapters)** / ktlint 1.8.0 강제 / Kotest+Testcontainers / Log4j2 / Redis / AWS SDK v2 / 사내 Nexus / 4프로필(local·dev·stg·prd).
- **ARK 편입**: bizplatform 안 모듈, 패키지 `com.sentbe.bizplatform.onboarding.{도메인}`(모듈명 확정은 백엔드팀). 도메인 분할 case/intake/document/rule/customer/staff/global.
- **ark-dev가 이미 개발한 server/ 코드(PI-128~132)는 표준 이전 작성 → 비준수**(Spring Boot 3.4/JPA/Flyway/평면). 동작하는 참조 구현으로 유지, 표준 위에서 재구성.
- **문서**: server-spec/CLAUDE.md에 "회사 백엔드 표준(BINDING)" 섹션 정밀 반영 + LOCAL_DEV.md 스택 갱신 (`97f7df1`).
- **티켓**: PI-133(표준 재정렬 — 우산)을 **요소별 서브태스크 7개로 분할**(ark-dev 과신 금지, 한 입 크기): PI-135 스켈레톤·빌드규범 / PI-136 Liquibase 스키마·시드 / PI-137 영속성 인프라(JDBC 컨버터) / PI-138 rule 도메인 / PI-139 case+intake / PI-140 document+파일 / PI-141 customer·staff 인증. 순서 135→136→137→138→139→140, 141은 137 뒤. 각 서브태스크가 대응 참조 구현(PI-128~132)을 가리킴.
- **PI-134**(회사 깃헙 이전)는 발급 후 대기(parked)로 축소 — 레포 생성은 PI-135에 흡수. 패키지 모듈명은 잠정 `arc`(`com.sentbe.bizplatform.ark.*`), 백엔드팀 확정 시 리네임.
- **프론트**: 전용 회사 표준 없음 → 백엔드 API 계약·4프로필·인증(OTP/SSO)에 맞춤.

## 2026-08-07 — 서버 백엔드 착수 티켓 (PI-128~132, 마일스톤 5개)

> Spring Boot(Kotlin) 참조 구현으로 서버 착수. 실제 코딩은 ark-dev, PM은 티켓까지. 도커 로컬 → 회사 환경 이관.

- **PI-128** M1 로컬 도커 기동 (compose: Postgres+MinIO+backend+frontend)
- **PI-129** M2 스키마+시드 (Flyway = server-spec/schema.sql 11테이블 + 룰 시드 CORP/INDIV·송금)
- **PI-130** M3 코어 플로우 (케이스 생성·인테이크·분류 1회 평가·질문 고정·서류 복사생성·4단계 심사)
- **PI-131** M4 보완 루프 + 파일 업로드(MinIO, pdf/png/jpg·10MB·서류당 1파일)
- **PI-132** M5 인증(고객 이메일 OTP·내부 구글 SSO) + 회사 환경 이관 준비
- 순서: 128→129→130→(131,132), Blocks 링크. 라벨 backend·server. 참조 = server-spec 브랜치 + 정의서/ERD.
- 데이터 파기 배치는 컴플라이언스 사인오프 후 별도(M5 미포함).

## 2026-08-07 — 서버 착수 전 미결정 사항 확정

> Gilbert 결정. 도커 착수 전 Open 이슈 정리.

- **파일 정책**: 허용 pdf/png/jpg, 상한 10MB, 서류당 1파일(멀티업로드 불가). 바이러스 스캔은 Full.
- **고객 인증**: 이메일 + 이메일 OTP (비밀번호 없음). password_hash 미사용, OTP 저장소는 개발팀 구현 선택. 내부는 구글 SSO 유지.
- **케이스 파기**: MVP 수동 파기만. **Full은 케이스 종료 1개월 후 파기 배치** — 응답(intake_response)·서류(document)·파일(document_file)·segment_meta 삭제, 회사명·담당자명·희망거래형태(entity/services)만 잔존. → 스키마 함의: `customer.contact_name` 추가(회사명처럼 1차에서 복사, 응답 삭제 후에도 잔존). ⚠️ **1개월 기준·담당자명 보관 근거는 컴플라이언스 사인오프 필요 — 별도 트랙.**
- **멀티업로드**: **MVP 서류당 1파일 / Full 멀티업로드** 명시. PI-120이 프론트에 멀티업로드를 이미 구현 → mvp에서 되돌리는 티켓 **PI-127 생성**.
- 반영: server-spec(schema.sql/CLAUDE.md/LOCAL_DEV.md, `87b6f8f`), 테이블 정의서, ERD Open, 킥오프 가이드, PRD.

## 2026-08-07 — 서버 스택 확정 + 로컬 도커 우선 접근

> 개발팀 협의. 로컬에서 도커로 전체 스택 구동 → 검증 후 회사 환경 이관. 인프라 정책 미확정 상태에서 착수 가능해짐.

- **스택**: backend Kotlin(Spring/Ktor는 개발팀 선택), frontend React(prototype-next 재사용), db Postgres, storage MinIO(로컬 S3 대역).
- **이관 전략**: 로컬↔회사 차이를 환경변수로만 흡수(S3 엔드포인트 교체 등). MinIO → 실 S3, compose Postgres → 사내 Postgres.
- **문서**: server-spec 브랜치에 LOCAL_DEV.md 신규(compose 서비스 구성, 환경변수 이관 지점, 이관 체크리스트) + README/CLAUDE.md에 스택 반영 (`6d7c8dd`). 킥오프 가이드 v2 — 결정 목록을 "로컬은 이렇게 / 회사 값은 이관 시"로 재구성, 마일스톤에 로컬 도커 기동 + 이관 단계 추가.
- 내 역할은 문서 반영까지(A안). compose/Dockerfile 실제 파일은 개발팀이 프레임워크 확정 후 규격대로 작성.

## 2026-08-05 — 서버 개발팀 핸드오버 준비 (server-spec 패키지 + 킥오프 문서)

> 인프라 이유로 서버 구현은 사내 개발팀이 진행. AI 협업 초보 팀 기준의 "초보 버전"으로 축소 (파일 3개, 프로세스 최소). Gilbert 지시로 리포에 직접 푸시 (server-spec 브랜치 — 배포 트리거 없음).

- **server-spec 브랜치** (`6a30e86`, origin/mvp 기반): `server-spec/` 폴더 — README(협업 규칙 3개 + 자산 링크), CLAUDE.md(AI용 올인원: 불변식 7개, 상태 전이표, API 후보 12개, 데이터 반입 금지), schema.sql(정의서 v2 기준 DDL 11테이블 + question 불변 트리거 + 가짜 시드). ※ 로컬 Postgres 없어 DDL 실행 검증 미완 — 개발팀 첫 실행 시 확인 필요.
- **킥오프 가이드**: [ARK 서버 킥오프 — 공유 세션 가이드](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4159078576) — 아젠다(시연 우선), 시연 시나리오, 개발팀에 묻는 결정 4개(인프라 망분리, SSO, 파일 정책, 리포/보드), 마일스톤 초안 4단계.
- 참고: mvp 브랜치에 PI-121~126 전부 반영 확인 (`e66ac98`, Dev 완료).

## 2026-08-05 — ERD 재설계: 불변 질문 + 케이스 고정 모델 (ERD v4, 정의서 신규)

> Gilbert와 설계 논의 결과. rule_set JSONB 버전 스냅샷을 버리고 정규화 모델로 전환 — 룰 패널 CRUD와 Collection 국가 확장(행 insert) 대비.

- **핵심 모델**: 소급 차단 = 케이스가 고정 (pinned_question_ids + document 행 복사 + 분류 1회 평가 후 저장). 불변은 question만(수정 = 비활성 + 새 행, replaces 계보), segment/doc_template은 일반 편집(신규 케이스에만 영향).
- **테이블 11개** = 룰 3(segment, question, doc_template) + 케이스 8. rule_set 테이블 제거, 분류 룰/오버라이드는 segment에 jsonb 내장(커지면 map 승격).
- **문서**: ERD 본문 개정(v4, 요약+흐름 중심) + 하위 [테이블 정의서 (MVP 11개)](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4158980234) 신규 — 컬럼/제약 상세는 정의서가 원본.
- 참고: 프로토타입(PI-123 완료분)의 RuleSet JSON 시드는 클라이언트 표현으로 유지 가능 — 서버 전환 시 이 테이블들로 분해. 재작업 티켓 불필요 판단.
- **리뷰 반영 (정의서 v2)**: uploaded_by → uploader_type + uploader_staff_id 분리, event_type CHECK 추가, repeat 응답 jsonb 구조 정의(부모 id 키 + 객체 배열, 예시 포함), auth_method 잠정 password, doc_template_id NOT NULL(MVP), revision_requested_from은 파생 캐시로 명시(원천 = revision_request, 반박: 다단계 동시 보완요청은 워크플로우상 불가), GIN 인덱스 Full 이동, NOT NULL 표기 규칙 명시.

## 2026-08-05 — MVP 1차 설문: 수금 옵션 미노출, 송금 선택 고정 (PRD v31, PI-126)

> Gilbert 결정. PI-121의 "수금 선택 시 준비 중 안내" 방식을 대체 — MVP는 수금을 선택지에서 아예 제거.

- **PRD 반영 (v31)**: 4.2 MVP 노트(수금 옵션 미노출 + 송금 고정, 수금 국가 질문 미노출, FI 차단은 유지), 4.4 Service 세그먼트 행, 5장 MVP 요약.
- **PI-126 (To Do, mvp)**: 1차 질문 #6 수금 옵션 제거 + 송금 프리셀렉트, #7 수금 국가 미노출 확인, 분류는 항상 SVC_PAYOUT. 룰셋 시드에서 disable(삭제 아님, Full 복원 대비). 설문 시트는 Full 버전 유지.
- 순서: PI-121 → PI-126. PI-125와 함께 배포 푸시 전 처리 권장.

## 2026-08-05 — ERD MVP 스코프 반영 + 데이터 레이어 정합화 티켓 (PI-123, PI-124)

> ERD 문서를 MVP 축소에 맞춰 갱신하고, 프로토타입 데이터 레이어를 ERD 구조로 리팩터링하는 작업을 티켓으로 생성 (PI-121 이후 진행).

- **ERD 문서 (Confluence 4148920321, v3)**: 4장을 "MVP 스코프"로 확장 — 4.1 MVP 구성(테이블 9개 다이어그램 + 구현 제약: CORP·INDIV + SVC_PAYOUT 고정, 즉석 서류 추가 없음, 사업자번호 저장만, 임시저장 없음, 개별 승인만, 서류당 파일 1개, 룰셋 시드 1행), 4.2 MVP↔Full 매핑. 별도 MVP ERD 문서는 만들지 않음(단일 문서 유지, 스키마 변경 없음).
- **PI-123 (To Do, mvp)**: 모놀리식 Case를 ERD 엔티티 구조로 분리(onboarding_case, document, document_file, revision_request, case_event) + 모든 데이터 접근을 서비스 레이어로 일원화 — 서버 전환 시 레이어 교체만으로 대응.
- **PI-124 (To Do, mvp)**: 케이스 상태코드 PRD 신명칭 마이그레이션 (ERD Open 이슈 5).
- 순서: PI-121(축소) → PI-123 → PI-124 (Blocks 링크 설정 완료).

## 2026-08-05 — PI-121 누락 보완: 룰 관리 패널 비노출 (PI-125)

> Gilbert 지적으로 발견. PRD 2.3은 MVP에서 룰 관리 패널 제외(룰 하드코딩, 질문 전문은 설문 시트가 원천)인데, PI-121 축소 범위에 이 항목이 빠져 있었음.

- **PI-125 (To Do, mvp)**: mvp 브랜치에서 룰 관리 패널 비노출 — 네비 제거 + 라우트 차단(소프트 제거, 코드 삭제 아님). 룰셋 시드는 읽기 전용 원천으로 유지. Full Spec 라인 영향 없음.
- 순서 갱신: PI-121 → **PI-125** → PI-123 → PI-124.
- 참고: PI-121은 To Test 상태로 확인됨(별도 세션에서 개발 진행).

## 2026-08-04 — MVP 스콥 축소 확정 (PRD v30, PI-121)

> Gilbert 결정. 축소분은 mvp 브랜치에서 PI-121로 구현(120까지 main 개발 완료 후).

- **제외 확정**: 수금(Collection) 전체 + FI 세그먼트 — MVP는 **송금 전용(CORP, INDIV만)**, 수금/FI 판정 시 '준비 중' 안내. ad-hoc 서류 추가 요청, 서류 일괄 승인(개별만), 사업자번호 중복 자동 판단(이메일 unique만), entity×service 교집합 서류(자연 소멸).
- **유지 확정**: 워크플로우 4단계, 보완요청 3역할 권한, 서류 미리보기, 고객 타임라인, 세그먼트 자동 분류.
- **티켓**: PI-121(mvp 축소 구현, To Do) 신규. PI-117(FI), PI-118(KRW)은 `mvp-scope-out` 라벨 — Full Spec 전용, main에서만.
- 참고: PI-115~118이 이미 To Test 상태로 확인됨(별도 세션에서 개발 진행된 것으로 보임 — 확인 필요).

## 2026-08-04 — 배포 라인 분리: mvp 브랜치 전용 배포

> 축소 스콥만 호스팅하기 위해 배포 라인을 분리. **main 푸시는 더 이상 배포되지 않음.**

- **mvp 브랜치 신설** — GitHub Pages 배포는 mvp 푸시에서만 트리거. 사이트 URL 변화 없음.
- **main** — Full Spec 개발 라인 (PI-115~120 진행). 자동 배포 중단(수동 workflow_dispatch만 가능).
- 플로우: PI-120까지 main에서 개발 → main을 mvp로 머지 → mvp에서 축소 → 완료 시점에 `archive/full-spec-v1.1` 브랜치로 Full Spec 최종본 보존.
- 개발(ark-dev) 유의: 커밋·푸시해도 사이트에 반영 안 됨. 셀프테스트는 로컬 dev server 기준.

## 2026-08-04 — 스콥 축소 시작 (MVP 이하) + Full Spec 보존

> Gilbert가 PRD를 MVP 스콥(또는 그 이하)으로 직접 축소 편집 중. 축소 전 상태는 아래에 보존.

- **코드**: `archive/full-spec-v1.0.5` 브랜치 (= main `2c16288`, PI-114 반영본). main은 축소 스콥 라인으로 계속.
- **문서**: [Full Spec 보관본 2026-08-04](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4155506735) — PRD v27 스냅샷, 본 PRD 하위 페이지.
- **티켓**: PI-115~120은 스콥 확정 후 재분류 예정 (스콥 아웃 시 삭제하지 않고 `scope-out` 라벨).

## 2026-08-04 — SentBiz Rule 검토(v1.0.5) 반영: 질문·서류 룰 전면 개편 (PI-115~120)

> Daisy 검토(BO 스페이스 4143349976 하위 8개 페이지) 반영. PRD·설문 시트 갱신, 구현은 전부 티켓(To Do).

### PRD 변경 (Confluence 4134994324)
- **공통 2차 질문**: 업태/종목 레이블 정정, 자금원천 옵션 필터(CORP·FI 5종), 거래 목적 공통 승격, 신규 4종(과세구분·홈페이지·대표자 연락처·정산대행품목), 회사규모·상장·설립일 공통 이동.
- **CORP/INDIV**: 각자대표 추가, BO 카운트 삭제→반복 추가, 비영리법인 온보딩 차단, INDIV 상호 영문명.
- **국내 FI**: 8문항 삭제(인허가·외부감사인·중개·모회사·AML정책·중복), 명칭 정리. 서류 13종→8종 수준 축소.
- **KRW Collection**: 업종 1문항 → A~D 4섹션 재구성(Main Business Activity 옵션 → 섹터·서류 분기).
- **서류**: 유효기간(3개월)·날인 조건, 인보이스/선적/세관 분리, 선택 전환(INDIV 계약서, KRW Articles), WEBSITE_URL 서류→질문 이동.

### 코드 지시 (티켓, To Do)
- **PI-115** 공통 2차 질문 개편 / **PI-116** CORP·INDIV 개편 / **PI-117** 국내 FI 축소 / **PI-118** KRW A~D 재구성 / **PI-119** 서류 룰 개편 / **PI-120** 멀티업로드(스콥 확정 필요).

### Open (확인 필요)
- FI 서비스 선택 5번 계약서(5-1 지급/5-2 결제) — 에스더 확인 / 홍콩 CR+BR 이중 서류 / 해외 FI 분리 여부 / 멀티업로드 vs MVP 제한 상충.

## 2026-08-04 — 1차 인테이크 질문 검토 반영 (PI-114, 구현 완료)

> Daisy 검토(BO 4144496641). 이번 건은 예외적으로 코드까지 선반영 후 티켓 사후 등록(To Test). 이후부터 PM은 티켓까지만.

- 사업자 유형 레이블 '금융업' → '금융기관(PG사·PSP·MSB 등)' (value `financial` 유지).
- 거래 규모 필수화, **거래 건수 질문 삭제**, 기타 통화는 select 내 '기타' 인라인 입력으로 통합. 1차 질문 16 → **15문항**.
- 커밋 `2c16288` (prototype-next), PRD v26.

## 2026-07-27~08-01 — PRD 단일 원천 이전 + 재편 (기록 보강)

> 이 기간 변경이 로그에 누락되어 소급 기록. **PRD 단일 원천은 Confluence "ARK - 온보딩 플랫폼 PRD"(NSBS 4134994324)로 이전** — 이 로컬 PRD 파일은 구버전.

- 개발자용 PRD 신설(원본 축약 + MVP 비교 통합), 넘버링 1~5장.
- 워크플로우 변경: **영업(1차 스크리닝) → 운영(서류 스크리닝) → 컴플라이언스(심사) → 운영(계정 개설)**. 상태를 액션 기반으로 재명명(`INITIAL_SCREENING`, `DOCUMENT_SCREENING_REQUIRED`, `APPROVAL_REVIEW_REQUIRED`, `ACCOUNT_SETUP_REQUIRED`).
- CRM(종료 케이스 관리) 스콥 제외, 계정/권한 관리 화면(2.4) 추가(MVP 제외), 케이스 상태 전이 다이어그램 이미지 삽입.
- 서버 ERD 문서 신설(NSBS 4148920321, 테이블 11개·JSONB 룰셋·통합 이벤트 로그).

## 2026-07-24 — 룰 패널 질문 CRUD 재정의 + 서류 일괄 다운로드 (PI-82~85)

> 질문 관리 = 생성·삭제·순서변경만(수정 제외). 서류 일괄 다운로드(zip) 추가.

### PRD 변경 (로컬 PRD 반영 완료)
- **10.4.2**: 질문 인라인 편집 제거 → **생성·삭제·순서변경만**(수정하려면 삭제 후 재생성).
- **9.2.7.3 서류 탭**: **일괄 다운로드(zip)** 버튼 추가 — 케이스 업로드 서류(문서별 최신본)를 하나의 .zip으로. 프로토타입은 클라이언트(JSZip) 압축.

### 코드 지시 (티켓)
- **PI-82** 질문 생성 / **PI-83** 질문 삭제 / **PI-84** 순서 변경(드래그) — PI-80과 relates, 인라인 편집 대체.
- **PI-85** [Case Detail] 서류 일괄 다운로드(zip).

> PRD는 Confluence 사본(NSBS 4113727492)도 있으나, **변경 이력·최신 반영은 이 로컬 PRD + CHANGELOG 기준으로 유지**한다. (컨플 반영은 별도.)

## 2026-07-21 — 서류 중복 제거: 공통 서류 + 세그먼트 매핑 (PI-81)

> 질문(PI-77)과 동일 모델을 서류에 적용. 세그먼트별 재수록 제거, 공통 서류 1곳 + 다중 매핑 + 세그먼트 오버라이드.

### PRD 변경 (§9.12 — 로컬 PRD 반영 완료)
- **9.12 재편**: 세그먼트별 전체 나열 → **공통 서류(8, 다중 매핑+오버라이드) + entity/service 고유**. dedup 키 = 표준 `type`.
- 공통 8: 사업자등록증·신분증·주주명부·이사명부·계약서·샘플인보이스·은행증빙·홈페이지. 오버라이드: 신분증 대상범위(대표자 vs +이사·UBO), 은행 사본 vs 거래내역.
- 고유: 법인 2(등기부·인감) / 개인 0 / FI 8(인허가·정책·재무제표·AML감사·조직도·Wolfsberg·Board Resolution·KYC샘플) / KRW(정관+섹터7+쿠팡3) / VND 9.
- 전문 단일 원천 = 설문 시트 `서류 공통`·`서류 고유` 탭.

### 코드 지시 (티켓)
- **PI-81** [Documents] 서류 dedup 모델(다중 매핑+오버라이드) + §10.4.3 서류 룰 패널. PI-77과 relates(같은 모델).

## 2026-07-21 — 룰 패널 질문 룰 화면 재설계 (목업 확정) (PI-80)

> 룰 패널 "질문 룰" 화면을 목업 기준으로 재설계. 목업 repo 커밋 + PI-80 발행.

### PRD 변경
- **10.4.2 화면 명세 추가**: 좌측 네비(인테이크 1차 질문 / Entity / Service), 1차 질문 별도 페이지+토글, 공통(2차) per-세그먼트 토글·고객 화면 분할 구분선·옵션필터(전체 옵션 표시+비활성), 세그먼트 질문 다중매핑 칩·인라인 편집·반복·조건부 중첩·FI 서비스뷰, Collection=FI+통화고유 안내.

### 산출물 / 티켓
- 목업: `prototype/docs/rules-panel-mockup.html` (repo main 커밋). 아티팩트 아님 — dev가 브라우저로 열람.
- **PI-80** [Rule Panel] 질문 룰 화면 재설계(목업 기준). **PI-77(모델)이 blocks**, PI-78과 relates. 질문 데이터는 시트 기준(PI-77 시드), 본 티켓은 UI·동작만.

## 2026-07-19 — 입력 검증 포맷 확장 (전화·이메일·URL·숫자·해외 등록번호)

> §9.16에 번호·연락처·숫자 포맷 규칙 추가.

### PRD 변경
- **9.16 입력 검증**: ① 해외 사업자등록번호 = 자릿수 강제 X, 형식 안내만(VND=UEN/NIB/ERC). ② 전화번호 = 국가별 강제 대신 **E.164 완화 검증(숫자 7~15자리)**, 이메일 표준, URL 스킴 보정. ③ 숫자·비율 = 금액(0+, 콤마표시/숫자저장), 건수(1+ 정수), 지점수(0+ 정수), 인원수(1+ 정수), 지분율(0~100 %).

### 코드 지시 (티켓)
- **PI-79** [Validation] 입력 포맷 검증(전화 E.164·이메일·URL·숫자·국내외 등록번호) 1·2차 폼 적용.

## 2026-07-19 — 2차 질문 화면 분할 규칙 (PI-77)

> 2차 질문 화면을 섹션 기반 멀티스텝 위저드로. 화면당 섹션 2개 기본(작으면 3개).

### PRD 변경
- **9.5 2차 질문 표시 방식**: "한번에 표시" → **섹션 기반 멀티스텝 위저드**(진행바·스텝 저장). 화면당 섹션 2개 기본, 섹션 작으면 3개. 반복 입력은 스텝 내 "N명 추가", 조건부는 인라인 확장.
- 세그먼트별 화면 구성 명시: Corporate 2화면(18·20) / Individual 2화면(12·14) / FI 4화면(뷰별 총 61~69, 화면2 서비스만 상이). Collection은 별도 화면 아님 — FI 수금 서비스에 통화 고유 얹힘.
- **10.4.2 질문 룰(룰 패널)**: 라이브러리+매핑 모델로 정렬 — 공통 옵션 필터 오버라이드, FI 서비스 뷰, `[질문]=[값]` 조건 구조 반영. "옵션 다르면 별개 질문" 원칙 → "옵션만 다르면 공통+옵션필터"로 수정. 예시 최신화(회사명=공통).
- **10.6 룰셋 데이터 구조**: `SegmentQuestionRule.commonQuestionRefs`를 `CommonQuestionRef[]`(questionId + `optionFilter?`)로 확장 — 세그먼트별 옵션 필터 오버라이드 저장.

### 코드 지시 (티켓)
- **PI-77**에 화면 분할 스펙 추가 반영.
- **PI-78** [Rule Panel] 신규 — 룰 패널 질문 편집 UI를 라이브러리+매핑으로 정렬(옵션필터 UI·FI 서비스뷰·조건 구조·optionFilter 데이터필드). PI-77과 Relates.

## 2026-07-17 — 2차 질문 구조 재편: 질문 라이브러리 + 세그먼트 매핑 (PI-77)

> 설문 시트 정리안(FI·Corporate·Individual·VND Collection) + KRW Collection 기준으로 2차 질문을 재구성. 중복 제거, 단일 원천 모델, FI 서비스 3뷰.

### PRD 변경
- **9.5 질문 관리 모델**: "3분류"를 **질문 라이브러리(단일 원천) + 세그먼트 매핑(체크 on/off)** 모델로 재정의. 공통은 전 세그먼트 자동 포함, entity/통화 고유만 체크. 규칙 추가 — 공통 옵션 필터 오버라이드, 표시조건 `[질문]=[값]` 구조화, 반복 입력 플래그, BO 필드(공통) vs BO 판별 로직(entity 고유). 질문 전문의 단일 원천 = 설문 시트.
- **9.6 Corporate**: 1차/2차 공통 중복 제거 → 고유만(19→7 + BO 판별). 자금원천 옵션 필터(5개) 명시.
- **9.7 Individual**: 고유만(12→3 + BO 판별).
- **9.8 FI**: 서비스별 **3뷰(송금만/수금만/둘다)** 로 재편. 코어(기본정보·인허가·소유경영·법률AML·정책교육) 공통 + 서비스 조건부. 공통·인허가게이트 제거, 반복 입력 블록화, 정책·교육 예/아니오 12개 → 복수선택 2문항.
- **9.10 VND Collection**: KRW 패턴으로 통일 — 고유 4개(주요사업활동·계좌개설목적·입금자 관계/유형)만, 나머지 상속. 사업자번호 UEN/NIB/ERC 형식은 공통 질문 표시조건으로.

### 코드 지시 (티켓)
- **PI-77 [2nd Questions]** 질문 라이브러리+세그먼트 매핑 모델로 2차 질문 시드 재구성 + 공통 상속/dedup + FI 서비스 3뷰 + 공통 옵션 필터 오버라이드.

## 2026-07-14 — 수금 선택 시 사업자 유형 금융업(FI) 고정 (PI-75)

> 개인/법인 사업자는 송금 전용. 수금 선택 시 entity를 FI로 강제하고 1차 폼에서 사업자 유형을 금융업으로 자동 고정·비활성.

### PRD 변경
- **9.4 축1 Entity**: `ENTITY_FI` 정의 확장 — 금융업 OR 수금 이용자 OR 해외 법인/개인. 국내·해외 FI 모두 포함(FI ≠ 해외 전용)
- **9.5 1차 #10 사업자 유형**: 수금 선택 시 '금융업' 자동 고정·비활성, 송금만이면 자유 선택
- **9.5 Step 1 매핑**: 서비스 선행 규칙 추가(수금→금융업 고정→FI), 개인/법인 송금 전용 명시, 설립국가는 국내/해외 FI 구분용으로 계속 수집(entity 판정 불변)

### 코드 지시 (티켓)
- **PI-75 [Customer 1st Intake]** 수금 선택 시 사업자 유형 금융업 자동 고정·잠금 + classifier(수금→FI, 국내 FI 유지)

## 2026-07-13 — 제품 수정 7건 반영 + 티켓 6건 발행 (PI-68~73)

> Gilbert 제품 수정 요청 7건. 서류 보완요청 권한 확대, 미정의 서류 추가 요청, 파일 다운로드, in-app 알림, 송금 국가 선택식, 입력 검증(등록번호·날짜).

### PRD 변경
- **8.1 케이스 상태 전이**: 영업(`SALES_REVIEW_REQUIRED`)·운영(`OPS_REVIEW_REQUIRED`)도 서류 보완요청 시 `REVISION_REQUESTED`로 전환. 재제출 시 무조건 컴플라이언스 → **보완요청을 발생시킨 역할의 검토 단계로 복귀**(`revisionRequestedFrom` 기록). 컴플라이언스 보완요청 행에도 `revisionRequestedFrom` 명시
- **8.3 역할별 권한**: 영업 전이 목록에 `REVISION_REQUESTED` 추가, 운영에 `REVISION_REQUESTED` 추가. 서류별 보완요청·미정의 서류 추가 요청은 영업·컴플·운영 공통, 승인은 컴플라이언스 전용 명시
- **9.2.7.3 서류 탭**: 개별 [보완요청]을 영업·운영까지 확대(사유 필수). **[+ 서류 추가 요청]** 신설(직원이 displayName 직접 입력, `isAdHoc`/`requestedBy`, 케이스 자동 `REVISION_REQUESTED`). 미리보기/목록에 **[다운로드]** 추가(전 역할). 탭 요약행 권한 문구 갱신
- **9.2.5 서류 업로드(보완 모드)**: ad-hoc 요청 서류(`isAdHoc`, `REQUESTED`)를 고객 화면에 함께 노출, 전부 업로드해야 제출 활성화
- **9.5 1차 질문 #8·#9**: 송금 출발 국가 → **단일 선택**, 도착 국가 → **복수 선택** (등록국가 동적 + 기타 직접입력, 리스트 추후). 텍스트 입력에서 변경
- **9.6 #3·#9 / 9.7 #2**: 한국(설립국가=KR) 시 사업자등록번호 10자리·법인등록번호 13자리 검증 표기
- **9.15 알림 체계 신설**: in-app 알림. 트리거 4종(상태 변경/담당자 배정·변경/보완요청/새 메시지)·수신자·벨 아이콘. 메시지 문구 TBD
- **9.16 입력 검증 규칙 신설**: 한국 등록번호 자릿수(길이만, 체크섬 제외)·날짜 YYYY-MM-DD 유효일 검증
- **9.3 데이터 모델**: `Case.revisionRequestedFrom`, `Document.isAdHoc`/`requestedBy`, `Notification`/`NotificationType` 추가. localStorage key `notifications` 추가
- **9.13 프로토타입 범위**: in-app 알림·서류 다운로드·미정의 서류 추가 요청을 구현 범위에 반영, 이메일/SMS는 범위 밖 유지

### 코드 지시 (티켓, 에픽 PI-27)
- **PI-68 [Internal]** 영업·운영 서류별 보완요청 + `revisionRequestedFrom` 요청자 복귀 라우팅 (상태머신 기반, 선행 티켓)
- **PI-69 [Internal]** 미정의 서류 추가 요청 (직원 서류명 직접 입력 → 고객 제출). *PI-68 선행(Blocks)*
- **PI-70 [Internal]** 고객 업로드 파일 다운로드 (서류 탭·미리보기, 전 역할)
- **PI-71 [Notification]** in-app 알림 체계 (벨·목록·트리거 4종). 문구 TBD
- **PI-72 [Customer 1st Intake]** 송금 국가 선택식 (출발 단일/도착 복수). 가능 국가 리스트 TBD → placeholder
- **PI-73 [Validation]** 한국 등록번호 자릿수 + 날짜 형식 검증

---

## 2026-07-01 — 보완요청(REVISION_REQUESTED) 고객 화면 스펙 정의

> 컴플라이언스 서류 보완요청 시 고객 화면 동작의 명세 공백 4건 확정.

### PRD 변경
- **9.2.6 상태 & 이력 상태별 추가 표시**: `REVISION_REQUESTED` 행 신설 — "보완이 필요합니다. 서류 업로드 화면에서 서류별 보완 사유를 확인하고 제출해주세요" 안내 + 서류 업로드 이동 버튼
- **9.2.5 서류 업로드 보완 모드**: 상단 단일 메모 → **서류별 보완 사유 표시**(어떤 서류에 어떤 사유인지 고객이 서류 단위로 확인). 서류별 사유 없을 때만 공통 안내. **보완 필요 서류를 모두 재업로드해야 제출 버튼 활성화**. 고객에겐 현재 라운드 사유만 표시(누적 횟수/과거 라운드 미노출, 제출 이력은 append-only 보존)
- **용어 통일**: 사용자 대면 표현 "재제출" → "제출" 전면 통일 (버튼·안내·상태전이·이력 표기). 데이터 모델 주석 등 내부 설명은 의미 보존 위해 "새 제출본 업로드 시"로 조정
- **9.2.7.3 서류 탭 검토 액션**: 개별 서류 [보완요청] 사유 입력 **선택 → 필수** (고객 화면 서류별 표시 위해)

---

## 2026-07-01 — QA 이슈 5건 티켓 발행 + 가상자산 문항 통일 (PI-61~65)

> Gilbert가 프로토타입 테스트 중 발견한 5건. PI-62/63/64/65는 To Do, PI-61은 결정 대기로 Blocked 처리.

### PRD 변경
- **9.5·9.6·9.7·9.8 가상자산 문항 통일**: FI("가상자산 서비스 제공업체(VASP)")와 Corporate·Individual("가상자산 취급업소")로 갈렸던 문구를 **"가상자산사업자(VASP)에 해당하나요?"** 공통 문항으로 통일. "예" 시 꼬리질문(2-1 자산 수탁 장소 / 2-2 설립·인허가국 외 고객 온보딩 → 2-2-1 거주국·2-2-2 인허가 / 2-3 출금·전환 목적)을 3개 엔티티 공통으로 적용. FI Section B #9~14 = 공통 VASP 블록. Corporate/Individual 섹션3 #2에는 꼬리질문 신규 추가. 9.5 공통 질문 목록에 VASP 추가 (PI-64)
- **9.2.2 고객 네비게이션**: 상단 바에 로그아웃 버튼 상시 노출 + 클릭 시 세션 종료·시작 페이지 이동 명시 (PI-62)

### 코드 지시 (티켓)
- **PI-64 [Customer 2nd Intake]** 가상자산 문항 통일 + 공통 꼬리질문 노출 (Corp/Individual 신규 추가, FI는 문구 통일). 6/30 항목 8(꼬리질문 노출)의 스펙 확정본
- **PI-65 [Customer 2nd Intake]** BO 스크리닝 질문 라디오 렌더링 (6/30 항목 10 잔여)
- **PI-63 [Customer 1st Intake]** 1차 #7 수금국가 옵션을 세그먼트 라벨("KRW Collection")이 아닌 국가명(한국)으로 표시
- **PI-62 [Customer Nav]** 고객화면 상단 로그아웃 버튼 (PRD 9.2.2 반영 완료)
- **PI-66 [Customer 2nd Intake Review]** 2차 리뷰 화면 항목을 영문 키 → 한글 질문 라벨로 표시 (PRD 변경 불필요, 렌더링 버그)
- **PI-61 [Rule Panel] (Blocked)** entity 매핑 완전성 보장 — 강제 방식(저장 시 검증 vs 폴백 기본값) 결정 대기

---

## 2026-06-30 — 제품 이슈 17건 수정 (5개 티켓 묶음) (PI-27)

> Gilbert가 실제 제품에서 발견한 이슈 17건을 제품 영역별 5개 티켓으로 묶음. 룰 패널 2건, 고객 2차 설문 1건, 서류 1건, 메시징 1건. 일부는 PRD 수정 동반.

### PRD 변경
- **9.4 service 코드 네이밍**: 수금 코드에 `COL` 접두 추가 — `SVC_KRW`→`SVC_COL_KRW`, `SVC_VND`→`SVC_COL_VND`, `SVC_ETC`→`SVC_COL_ETC`, 신규 예시 `SVC_COL_IDR`/`SVC_COL_CNY`. 송금은 `SVC_PAYOUT` 유지. 9.5/10.4/10.5/10.6 예시 일괄 반영 (항목 5)
- **10.4.1 entity 분류조건**: 입력 조건을 읽기 전용 → **드롭다운 편집 가능**(닫힌 옵션 한정). FI는 `금융업(전체)`/`법인·개인+해외` 두 행, 금융업 행은 국가 무관 명시 (항목 1·2)
- **10.4.2 / 10.8 고유 질문**: service 고유 질문 추가 외 **수정·삭제 가능** 명시 (항목 7)
- **9.6 섹션2 #1**: "회사가 다음에 해당하면" — 복수 선택(체크) → **단일 선택(라디오)**, 문구 "선택해주세요", 해당없음 선택 시 BO 진행 (항목 10)
- **9.12 표준 type 코드**: 공통 서류 정규화 표 신설(`BIZ_REGISTRATION`/`DIRECTOR_LIST`/`SHAREHOLDER_LIST`/`ID_COPY`/`CONTRACT`/`SAMPLE_INVOICE_SHIPPING`/`WEBSITE_URL`) — 의미 동일 서류 dedup, 범위/형식 다르면 별개 유지. 홈페이지 = URL 텍스트 입력 명시 (항목 14·15)

### 코드 지시 (티켓 5개)

- **T1 [Rule Panel] 분류조건 편집·정확성** (항목 1,2,3,4)
  - entity 매핑 행의 입력 조건+결과를 드롭다운 편집 가능 + 행 추가/삭제 (1)
  - FI 조건 정정 — 금융업이면 국가 무관(설립국가 ≠ KR 조건 제거) (2)
  - service 분류조건 탭 수금국가를 텍스트 입력 → 드롭다운 (3)
  - 기타(SVC_COL_ETC) Collection도 "수금 + 미정의 국가" 분류조건을 패널에 노출 (4)
- **T2 [Rule Panel] 네이밍·탭순서·고유질문 편집** (항목 5,6,7) — *T1에 의존(Blocks)*
  - SVC 코드 리네임 `SVC_COL_*` (classifier/seed/케이스 데이터 전체) (5)
  - service 세그먼트 탭 순서를 entity처럼 분류조건 → 질문 → 서류로 (6)
  - 고유 질문 수정·삭제 UI (7)
- **T3 [Customer 2nd Intake] 폼 조건/입력 수정** (항목 8,9,10,11,12,13)
  - 가상자산 취급업소 "예" 선택 시 꼬리질문 노출 (8)
  - 공동대표 반복입력 추가 버튼 라벨 "대표자 추가하기" (9)
  - 회사 해당사항 질문 라디오(단일) 전환 (10)
  - 실소유자 반복입력 추가 버튼 라벨 "실제 소유자(BO) 추가하기" (11)
  - 거래목적 "기타" 선택 시 직접입력 필드 노출 (12)
  - KRW 업종 질문을 별도 화면 분리 없이 2차 폼 하단 인라인 질문으로 (13)
- **T4 [Customer Documents] 중복제거·홈페이지 입력** (항목 14,15)
  - 시드 서류를 9.12 표준 type으로 정규화 후 의미 기준 dedup, 고객 화면 1건 노출 (14)
  - 홈페이지 주소를 파일 업로드 → URL 텍스트 입력 필드로 (15)
- **T5 [Messaging] 마지막 글자 중복 버그** (항목 16,17)
  - 고객 메시지 입력 시 마지막 글자 중복 기록 (16)
  - 내부 직원 고객채팅·내부노트 입력에도 동일 버그 (17)
  - 추정: controlled input의 onChange/onComposition(IME) 또는 전송 핸들러 상태 처리 문제 — 한글 조합 입력 재현 후 수정

---

## 2026-06-29 — 룰 재점검 4탄: Document 패널 표시 (PI-27)

> 서류 레이어 재점검. **런타임(`buildDocuments`)은 정상**, 패널(`DocumentsEditor`)만 버그 — 교집합 룰(entity×service) 표시 자리 없음 + find-first로 KRW base 가로챔. PRD 10.4.3 갱신. 티켓 D1.

### PRD 변경
- **10.4.3 [서류] 탭**: 기본 / 섹터 조건 / **교집합(entity) 조건** 3분할. `{FI+KRW}` KYC를 교집합 슬롯에 표시 (가 방식)

### 근거 (재점검 발견)
- documentRules 런타임은 다축 합집합+dedup 정상 (고객 서류는 올바름)
- 패널 DocumentsEditor: 교집합 룰(`{FI,KRW}`)이 자리 없어 FI 탭 누락 + KRW 탭 base 가로챔(find-first)

### 코드 지시 (D1)
- **D1 [Panel]**: 서류 탭을 기본/섹터/교집합 3섹션으로. find-first 제거(entity 조건 정확히 분리). 런타임은 안 건드림

---

## 2026-06-29 — 룰 재점검 3탄: Service 분류 (국가 단위) (PI-27)

> service 분류 재점검. 수금을 **국가 단위**로 통일(통화 차원 제거), 수금국가 옵션을 룰 기반 동적 생성(패널 국가추가 ↔ 1차 폼 연동), OTHER 폴백. PRD 9.4/9.5/1차 #7 갱신. 티켓 S1/S2.

### PRD 변경
- **9.5 Step2**: 수금 = 국가 단위, 통화 분류 제거. 수금국가 동적 생성 + OTHER 폴백
- **1차 #7**: 수금국가 동적 옵션, 국가 기준
- **9.4**: Collection = 수금 국가 단위. 코드/라벨(`SVC_KRW`, "KRW Collection")은 유지

### 근거 (재점검 발견)
- 수금국가 옵션이 1차 폼에 하드코딩(KRW/VND/OTHER) → 패널 국가추가와 **단절**. IDR/CNY 추가해도 분류될 길 없음
- OTHER 블랙홀: 비KRW/VND 수금이 전부 `SVC_OTHER_COLL`로 뭉쳐 구분 소실
- `collectionCountries` 명명 혼란 (국가 필드인데 통화코드 값)

### 코드 지시 (S1/S2)
- **S1 [Core]**: service 분류를 국가 단위로 (통화 트리거 제거→국가), `classifyServices` OTHER 폴백, 명명 정리
- **S2 [Form]**: 1차 폼 수금국가 옵션을 룰(등록 세그먼트) 기반 동적 생성 + OTHER 직접입력

---

## 2026-06-26 — 룰 재점검 2탄: Question 트리 모델 (PI-27)

> 질문 레이어 재점검. 2차 폼이 하드코딩 폼 + 룰 11개로 이원화돼 있고, 질문이 트리(공통/고유 + 조건부 꼬리 + 반복)인데 평면 모델이라 못 담음. PRD 10.4.2/10.6 갱신. 티켓 Q1~Q4.

### PRD 변경
- **10.4.2 [질문] 탭**: 공통 섹션 + 고유 섹션(세그먼트 전환 시 교체) + 조건부 꼬리질문 = **확장 패널** 와이어
- **10.6 `PanelQuestion`**: 트리 필드 추가 — `classification` / `scope` / `repeat` / `children`(조건부 꼬리) / `showWhen`(부모 응답 트리거) / `labelOverrides`
- **원칙**: 정보가 비슷해도 형식·옵션·구조가 다르면 별개 질문 (사업자등록번호 공통 vs 법인등록번호 CORP 고유, 자금원천 CORP·INDIV vs FI)

### 근거 (재점검 발견)
- 2차 폼 = 하드코딩 폼(CorporateForm 등, PRD 질문 대부분) + DynamicQuestionsSection(룰 11개) **이원화** → 패널 Step2가 11개만 통제하는 반쪽, BO 등 중복 위험
- 시드 질문이 PRD 9.6~9.10과 크게 다름(축약/창작: 거래성격·거래상대국가는 PRD에 없음), 조건부·반복·섹션 전무

### 코드 지시 (티켓 Q1~Q4)
- **Q1 [Core]**: `PanelQuestion` 트리 확장 (`children`/`repeat`/`showWhen`/`classification`/`scope`)
- **Q2 [Seed]**: PRD 9.6~9.10 전체를 질문 트리로 시드 (공통=형식동일만, entity/service 고유, 조건부/반복 포함)
- **Q3 [Panel]**: Questions 탭 공통/고유 2섹션 + 세그먼트 전환 교체 + 조건부 확장패널
- **Q4 [Form]**: 하드코딩 2차 폼 제거, DynamicQuestionsSection 트리 렌더로 일원화

---

## 2026-06-26 — 룰 재점검 1탄: Entity 분류 (PI-27)

> 구현된 룰 패널을 PM이 재점검. entity 분류부터. 닫힌 6조합 명시(default 제거), 설립국가 선택형, 패널 세그먼트별 조건 표시. PRD 9.5 / 1차 #11 갱신. 티켓 E1/E2/E3.

### PRD 변경
- **1차 #11 설립국가**: 자유 텍스트 → **한국/해외 선택**(해외는 국가명 입력). 분류는 한국 여부만 사용, `isKorea()` 키워드 매칭 제거(예: "KOR" 오분류 방지)
- **9.5 entity 매핑**: `default` 폴백 제거. businessType(3) × 국가(2) = **6조합 명시 + 우선순위**(FI 우선). 세그먼트별 조건 — `ENTITY_FI`=`금융업 OR 해외`, `ENTITY_CORP`=`법인 AND 한국`, `ENTITY_INDIV`=`개인 AND 한국`

### 근거 (재점검 발견)
- entityClassificationRules가 단일조건 순서체인 → AND가 순서로 숨고, 개인사업자가 `default`로만 존재
- businessType은 닫힌 3옵션인데 "그 외 전부→INDIV"라 빈값/오타 오분류 위험
- 설립국가 자유 텍스트 → `isKorea()` 키워드 매칭 오분류 위험
- 패널 Classification 탭: 세그먼트를 바꿔도 전역 체인 전체가 동일 표시
- (참고) 런타임 `buildDocuments`/`classifyEntity` 자체는 정상 — 문제는 룰 모델 표현과 패널 표시

### 코드 지시 (티켓 E1~E3)
- **E1 [Core]**: `EntityClassificationRule` 타입을 AND 결합 + 우선순위로 확장, default 제거 6조합 시드, `classifyEntity` 결정적 평가. (types, ruleStore, segmentClassifier)
- **E2 [고객 폼]**: 설립국가 입력을 한국/해외 selector로, `foundingCountry='KR'`/국가명 저장. (OnboardingForm)
- **E3 [패널]**: Classification 탭이 선택 세그먼트의 자기 조건만 표시(전역 체인 X), 개인사업자도 명시 조건. 추가로 우측 **탭 순서를 조건 → 질문 → 서류**로 정렬(현재 구현은 조건-서류-질문으로 PRD 10.4.0과 불일치). (InternalRulesPanel)

---

## 2026-06-26 — v2: 룰 관리 패널 + 세그먼트 모델 재정의 🆕

> 1차 응답 → 분류 → 2차 질문 → 서류 룰을 화면에서 조정하는 **룰 관리 패널** 신규 기획. 세그먼트 모델을 3축(entity/service/sector)으로 재정의. PRD v2로 반영, 원본은 `온보딩 플랫폼 - PRD (Prototype) - v1 backup 20260626.md`로 백업.

### 세그먼트 모델 재정의 (9.3, 9.4, 9.5)
- 3축 구조: **entity 단일 / service 복수 / sector 복수(KRW 종속)**
- 송금을 service 세그먼트 `SVC_PAYOUT`으로 승격 — 2차 질문·서류 선택 키를 세그먼트로 통일
- 세그먼트 코드(ID)/표시명 분리: `ENTITY_CORP`, `SVC_KRW` 등
- `SegmentInfo` 개정: `entity` / `services[]` / `sectors[]`. `complianceRisk` 제거
- 2차 질문·서류 = 보유 세그먼트 합집합 + dedup(type 기준)

### 2차 질문 3분류 (9.5)
- ① 공통 질문(여러 세그먼트 공유) → 별도 문서/시드, 패널에서 선택
- ② entity 고유 질문(FI 등 복잡·조건부·반복) → 별도 문서/시드, 패널 밖
- ③ service 고유 질문(KRW 섹터, VND 입금자 등 단순형) → 룰 관리 패널에서 작성/관리

### 룰 관리 패널 신규 (10장)
- 접근: **COMPLIANCE 전용**
- 동작: **live** — 룰 변경 시 신규 케이스의 분류·질문·서류에 실제 반영
- 3단계: Step1 분류 매핑 / Step2 질문(공통 선택 + 고유 작성) / Step3 서류(체크리스트 + 섹터 조건 슬롯)
- 세그먼트는 1급 객체. 신규 Collection 국가(IDR/CNY 등)를 패널에서 추가(분류조건+질문+서류 한 묶음)
- 룰셋 데이터 구조 정의(`RuleSet`, localStorage `rule_set` + `rule_set_history`)
- 룰 변경은 신규 케이스만 적용, 케이스에 룰셋 version 기록
- 화면 레이아웃(10.4.0): **세그먼트 중심** — 좌측 세그먼트 목록 + [분류 룰], 우측 선택 세그먼트의 `[분류조건][질문][서류]` 탭 (entity는 [질문][서류] 2탭)
- 탭별 와이어프레임: [분류 룰] entity 매핑 테이블 / [분류조건] 폼 / [질문] 상하 2분할(공통 선택 + 고유 작성) / [서류] 상하 2분할(기본 + 섹터 조건슬롯) / [+ 국가 추가] 4스텝 위저드

### 코드 수정 지시 (요약)
- `segmentClassifier.ts` / `documentRequirements.ts`: 하드코딩 제거 → 룰셋(`rule_set`) 기반으로 전환
- 현재 코드 룰이 PRD 9.12와 불일치(서류 종수 등) → 룰셋 시드를 PRD 기준으로 채울 것
- `SegmentInfo` 사용처: `entitySegment`/`serviceSegments` → `entity`/`services`/`sectors`로 마이그레이션
- 내부 네비에 [룰 관리] 추가(COMPLIANCE만 노출), 라우트 `/internal/rules` 신규
- 구현 순서: 분류(Step1)·서류(Step3) live 먼저, 2차 질문 연동(Step2) 다음

---

## 2026-06-26 — QA: 미QA 델타 검증 (c5082fc → 배포본 06a0406)

> 직전 QA(06-24)는 `c5082fc` 기준. 이후 4커밋(`06a0406`/`4462843`/`def2e41`/`f611746`)이 미QA 상태여서 origin/main 직접 조회로 검증. 상세는 `QA.md` 2026-06-26 섹션.

### ✅ PRD 수정 — NOT_REQUESTED 라벨 (§7.2)

- 문서 상태 `NOT_REQUESTED`의 **내부 화면 enum `요청 전` → `미제출`** 로 변경.
- 배경: 코드(`def2e41`, `InternalCaseDetail.tsx:23`)가 뱃지 라벨을 `미제출`로 선반영. PRD는 `요청 전`이었음.
- 결정(Gilbert): 개발자 의도가 반영된 최신 배포본 워딩(`미제출`)을 정답으로 채택 → PRD를 코드에 맞춤. **코드 수정 없음.**

### 🟢 정합성 개선 확인 (수정 지시 없음)

- `06a0406` — `complianceRisk`/`ComplianceRisk` 완전 제거(segmentClassifier/types/classifier). PRD §9.3 SegmentInfo에 없던 코드 전용 필드였으므로 제거가 PRD 정합. 내부 케이스 상세 '리스크' 표시도 함께 제거됨 — 정상.
- `4462843`/`f611746` — InternalCaseDetail 구 localStorage 케이스용 null 가드. PRD 영향 없음.

### 🔴 재flag — 미반영 코드 수정 지시 (P2, 06-24에서 이월)

**[내부-2] 케이스 레벨 [보완요청] 사유 강제 — 4커밋 동안 미반영, 여전히 열림.**
- origin/main `06a0406` `InternalCaseDetail.tsx:89` 여전히 `{ label: '보완 요청', to: 'REVISION_REQUESTED', needsNote: true }`.
- 수정: `needsNote: true` → `false` (아래 06-24 섹션 지시 그대로). 현재 유일한 열린 코드 수정 항목.

---

## 2026-06-24 — QA: 06-23 내부 직원용 PRD 반영 검증 (배포본 c5082fc)

> 06-23 PRD(2~8순위)가 커밋 `c5082fc`로 구현·배포됨. 내부 직원용 위주 전수 검증 + 고객용 리그레션. headless 런타임 재현 + 빌드/타입체크 통과. 상세는 `QA.md` 2026-06-24 섹션.

- ✅ 2순위 담당자 할당(자동 라운드로빈 + 수동 변경/이력) — 동작 확인
- ✅ 3순위 서류별 보완요청 → 케이스 자동 REVISION_REQUESTED, 사유 선택(빈 값 가능) — 확인
- ✅ 4순위 대시보드 대기일수·담당자 컬럼 — 확인
- ✅ 5순위 반려 사유 필수 + 이력 타임라인 — 확인
- ✅ 6순위 서류 미리보기 모달 + 재제출 이력 보존(isLatest) + 이전 제출본 접기/펼치기 — 확인 (고객 `DocumentUpload` 재제출 보존도 리그레션 통과)
- ✅ 7순위 내부 노트 append-only + 작성자/시간 — 확인
- ✅ 8순위 계정 생성 confirm-only(폼 없음)→COMPLETED + 고객 COMPLETED 카피 변경 — 확인
- ✅ 고객용 리그레션(가입→온보딩, 전 라우트 렌더, 8순위 카피, 재제출 보존) — 전부 통과, 에러 0

### 🟠 코드 수정 지시 — PRD 불일치 1건 (P2)

**[내부-2] 케이스 레벨 [보완요청] 사유 입력 강제 — `InternalCaseDetail.tsx` `getActions`**
- PRD 9.2.7.3(라인 495): "[보완요청](케이스 레벨) **사유 입력 불필요**" (서류 보완 외 예측 못한 상황에서 케이스를 즉시 REVISION_REQUESTED로 전환하는 용도)
- 코드: COMPLIANCE 액션 `{ label: '보완 요청', to: 'REVISION_REQUESTED', needsNote: true }` → 사유 textarea 강제 + "확인" 버튼 disabled + "필수" 문구. PRD와 반대로 사유를 강제함.
- 수정: 해당 액션 `needsNote: true` → `false` (메모는 선택 입력으로 허용). 서류별 [보완요청](사유 선택)·doc-level 전환은 이미 PRD대로 정상이므로 손대지 말 것.
- 참고(버그 아님): `internalStaffStore` DEMO_ACCOUNTS가 역할당 1명이라 2순위 담당자 변경/라운드로빈을 데모에서 보여주기 어려움 — 데모용으로 역할당 2명 이상 시드 권장.

---

## 2026-06-23 — 내부 직원용 PRD 셀프 리뷰 반영 ✅

> 내부 직원 사용자 관점 셀프 리뷰 8개 이슈 발굴. 알림(1순위)은 프로토타입 범위 제외. 2~8순위 전체 논의 완료 및 PRD 반영.

### [완료] 8순위 — 운영 계정 생성 플로우 단순화 (9.2.7.3, 9.2.6)

- [계정 생성] 클릭 시 확인 다이얼로그만 표시 → 즉시 COMPLETED 전이. 별도 입력 폼 없음
- [계정 안내 메일 발송] 버튼 제거. 계정 안내는 외부 시스템이 처리
- 고객 화면 COMPLETED: "계정 정보 영역" 제거 → 온보딩 완료 안내 메시지로 대체

### [완료] 7순위 — 내부 노트 정책 (9.2.7.3)

- 모든 역할 열람 가능 (역할 간 공개)
- 작성자, 작성 시간 표시 필수
- 수정/삭제 불가 (append-only). 정정 필요 시 새 노트로 추가

### [완료] 6순위 — 서류 검토 UX 상세 (9.2.7.3, 9.3)

- 서류 미리보기: 파일명 클릭 시 모달 표시, 모달 내 [닫기] 버튼만. 검토 액션은 모달 밖 목록에서 수행
- 재제출 이력: 제출본 전부 보존 (이전 파일 삭제 안 함), 각 제출본에 제출일 표시
- 서류 탭: 현재 제출본(isLatest=true) 기본 표시, 이전 제출본 접기/펼치기
- 데이터 모델 UploadedFile에 `isLatest: boolean` 필드 추가

### [완료] 5순위 — 반려 후 워크플로우 (9.2.7.3)

- 반려 후 담당자 별도 액션 정의 없음. 대시보드 정렬(최종 수정일 내림차순)로 자동 상단 노출
- 반려 사유 필수 입력, 이력 탭 타임라인에 사유 포함 표시

### [완료] 4순위 — 대시보드 목록 항목 추가 (9.2.7.2)

- 대기 일수, 담당자 이름 추가 (기존: 회사명, 상태, 세그먼트, 생성일, 최종 수정일)
- 대기 일수: 현재 상태로 전환된 시점부터 오늘까지 일수
- 기본 정렬: 최종 수정일 내림차순

### [완료] 3순위 — 보완요청 구조 명확화 (9.2.7.3)

- 서류별 [보완요청] 클릭 시 해당 서류 `REVISION_REQUIRED` + 케이스 자동 `REVISION_REQUESTED` 전환
- 서류별 보완요청 사유 입력은 선택 (필수 아님)
- 케이스 레벨 [보완요청] 버튼 별도 유지 — 서류 외 예측 못한 상황 대응용, 사유 입력 불필요
- 서류 탭에서 [반려 + 사유 입력] 항목 제거 (하단 액션 버튼으로 일원화)

### [완료] 2순위 — 케이스 담당자 할당 규칙 (4.2)

- 자동 배분: 케이스 단계 전환 시 해당 역할 담당자 중 라운드로빈으로 자동 배정
- 수동 변경: 케이스 상세에서 변경 가능. 변경 주체 역할 제한 없음, 변경 대상은 같은 역할 내 직원
- 담당자 변경 시 타임라인 이력 기록

---

코딩 클로드는 작업 전 이 파일을 먼저 확인할 것.
PRD 원본: `온보딩 플랫폼 - PRD (Prototype).md`

---

## 2026-06-22 — ✅ 내부 제품 전수 재검증 통과 (배포본 dbfd297)

> 내부-P0(로그인 후 백지) **수정 확인 + 내부 화면 전수 재검증 완료.** headless Chrome로 시드 케이스 주입 후 3개 역할(SALES/COMPLIANCE/OPS) × (로그인·대시보드·케이스 상세 3탭·종료 케이스·CRM) + 상호작용(상태전환 3종·서류 승인·메시지/노트) 점검 → **전 화면·전 동작 런타임 에러 0.** 상세는 `QA.md` 2026-06-22 "내부 사용자 제품 전수 재검증" 섹션.

- ✅ [내부-P0] 로그인 후 백지 — commit `dbfd297` (`useMemo`로 셀렉터 안정화). **해결 확인.**
- 내부 제품 현재 열린 이슈 없음.

---

## 2026-06-22 — 🔴 P0 내부 화면 하얀 화면 (로그인 후 백지)

> 배포본 `90505f3`에서 **헤드리스 브라우저로 재현 확인.** 내부 로그인 성공 후 대시보드가 백지. 상세는 `QA.md` 2026-06-22 "내부 사용자 제품" 섹션. → ✅ `dbfd297`에서 해결, 위 항목 참조.

**[내부-P0] 로그인 후 하얀 화면 — `InternalDashboard.tsx:47`, `InternalCRM.tsx:30`**
- 증상: 내부 로그인(sales/compliance/ops) 성공 → `/internal/dashboard` 이동했으나 화면 완전 백지. 콘솔에 `React error #185 (Maximum update depth exceeded)`.
- 원인: `const cases = useCaseStore((s) => Object.values(s.cases))` — 셀렉터가 렌더마다 새 배열 참조 반환 → `useSyncExternalStore` 무한 루프 → 컴포넌트 언마운트. 데이터 유무 무관 항상 크래시.
- 수정: 셀렉터에서 배열 생성 금지.
  - 방법 A(권장): `const casesMap = useCaseStore((s) => s.cases)` + `const cases = useMemo(() => Object.values(casesMap), [casesMap])`
  - 방법 B: `useCaseStore(useShallow((s) => Object.values(s.cases)))` (`zustand/react/shallow`)
- 두 파일 모두 동일 수정 필요. `InternalCaseDetail.tsx`는 `s.cases[id]` 안정 참조라 영향 없음.
- ⚠️ 같은 안티패턴(셀렉터 내 `Object.values`/`.filter`/`.map`/`.sort`) 다른 곳에도 있는지 일괄 점검 권장. (`tsc`/빌드로는 안 잡힘 — 런타임 루프)

---

## 2026-06-22 — 06-19 P0 수정 재검증 (배포본 9b960c6)

> ✅ **06-19 P0 버그 수정 확인 완료.** 코드 정독 + `tsc --noEmit`(에러 0) + `vite build`(성공)로 검증. 상세는 `QA.md` 2026-06-22 섹션.
> 분석 기준: origin/main = **9b960c6** (06-19 대비 +25커밋). 수정 커밋 `021e205`(2차 폼 빈칸·세그먼트 오분류), `23ed170`(classify 크래시 방어), `9b960c6`(내부 대시보드 가드).

- ✅ [P0-1] 2차 입력 휘발 — 5개 폼 `initialData` 주입/소비 확인. **해결.**
- ✅ [P0-2] 세그먼트 오분류 — `saveFirstIntakeDraft` 재계산 + `classifyEntity` 빈 국가 가드 확인. **해결.**
- ✅ [P2-4] 1이메일=1활성케이스 — `findByEmail`에 `status !== 'CLOSED'` 가드 확인. **해결.**

### 남은 코드 수정 지시

**[P1-3] 1차→2차 자동 채움 — 미구현** (`InformationForm`이 `firstIntake` 미참조). 블로커 아님.

**[P3-신규] entity 단계 임시저장 데이터 손실 엣지 — `InformationForm/index.tsx`**
- 증상: entity 단계에서 "임시저장" 누르면 `secondIntake.data`가 `{entity:...}`로 통째 덮어써져, 이미 입력한 KRW/VND 단계 값이 **새로고침 시** 사라질 수 있음(진행 중엔 안전).
- 수정: entity 단계 `onDraftSave`를 `saveDraft({ ...accumulated, entity: d })`로 변경(기존 누적 보존).

---

## 2026-06-19 — 고객 플로우 QA (배포본 4c9fa5d 기준, "설문이 안 넘어감" 추적)

> ✅ 코드 반영 완료 (2026-06-19) — P0-1, P0-2, P2-4 수정. commit 021e205
> 상세/재현 경로는 `QA.md` 2026-06-19 섹션 참조.
> 분석 기준: github.com/gilbert-sentbiz/ARK_Onboarding origin/main = **4c9fa5d** (배포본).
> ✅ 배포본에서 이미 수정 확인 (재지시 불필요): 자금원천 8개 / 탭 바 / 케이스 상태 전환 시점 / 내부 화면 4개.

### 코드 수정 지시 — 아직 라이브인 버그만

**[P0-1] 2차 입력 데이터 휘발 — `InformationForm/index.tsx` + 각 2차 폼**
- 증상: 2차 폼 작성 → 리뷰에서 "수정하기" → 입력이 전부 빈칸. (재로그인 후 2차 수정 진입도 동일)
- 원인: `InformationForm`이 `accumulated`는 복원하지만 `entityProps`로 안 넘김. `CorporateForm`/`IndividualForm`/`FIForm`/`KRWCollectionSection`/`VNDCollectionSection`이 initialData를 안 받고 전부 빈 `useState`로 시작.
- 수정: 각 폼에 `initialData` prop 추가 → `useState` 초기값으로 사용. `entityProps`에 `initialData: accumulated.entity` 추가, KRW/VND 스테이지에도 `accumulated.krwCollection`/`vndCollection` 주입.

**[P0-2] 세그먼트 오분류 — `caseService.ts` / `segmentClassifier.ts`**
- 증상: 1차 step0에서 임시저장 후 제출하면 법인 고객인데 FIForm이 뜸.
- 원인: `saveFirstIntakeDraft` draft 갱신 분기가 `segmentInfo`를 재계산 안 함. `classifyEntity`가 빈 `foundingCountry`를 `isKorea('')===false`로 FI 분류.
- 수정 (확정 방향 — 재제출 시 항상 재계산): draft 갱신 분기에서도 `segmentInfo = classify(formData)` 항상 갱신 + `classifyEntity`에 빈 국가/빈 businessType 가드 추가(부분 데이터로 FI 단정 금지).

**[P1-3] 1차→2차 자동 채움 (PRD 9.5)** — 2차 폼이 1차 값(회사명·연락처·설립국가 등)을 초기값으로 읽도록. P0-1 작업과 함께 처리 권장.

**[P2-4] 1이메일=1활성케이스 — `caseService.ts`** — 기존 케이스가 draft 아니면 새 caseId 중복 생성 가능. `findByEmail`를 활성 케이스 기준으로 좁히거나 재제출 시 동일 케이스 갱신 보장.

---

## 2026-06-18 — 내부용 화면 QA 결과 반영

> ✅ 코드 반영 완료 (2026-06-19) — 아래 3건 모두 구현. commit 2b2262c

### 코드 수정 지시 (3건)

**1. `InternalCaseDetail.tsx` 서류 탭 — 일괄 승인 버튼 추가**
- 현재: 서류별 개별 승인/보완요청만 있음
- 추가: "일괄 승인" 버튼 — 미승인 서류가 1건 이상 있을 때 활성화, 클릭 시 전체 일괄 승인 처리

**2. `CasePage.tsx` COMPLETED 카드 — 계정 안내 내용 동적 표시**
- 현재: 고정 문구 표시 ("센트비 기업 서비스 계정이 생성되었습니다...")
- 변경: statusHistory에서 COMPLETED 전환 이벤트의 note 값을 읽어 표시
- PRD 9.2.6: 운영팀이 계정 생성 완료 시 입력한 내용을 고객이 볼 수 있어야 함

**3. `caseService.ts` — 케이스 상태 전환 시점 수정**
- 현재: `createCase()` (1차 리뷰 제출)에서 DOCUMENT_SUBMISSION_REQUIRED로 전환
- 수정: `createCase()`는 INQUIRY_RECEIVED 유지, `confirmSecondIntake()` (2차 리뷰 제출)에서만 DOCUMENT_SUBMISSION_REQUIRED로 전환
- PRD 9.2.4 기준

---

## 2026-06-17 — 내부 화면 셀프 리뷰 반영 (6건)

### 8.3 역할별 권한 보완
- 컴플라이언스: SALES_REVIEW_REQUIRED(반려) 추가
- 운영: COMPLIANCE_REVIEW_REQUIRED(반려), CLOSED 추가

### 8.1 상태 전이 보완
- INQUIRY_RECEIVED → CLOSED(EXITED) 자동 이탈 행 추가
- OPS_REVIEW_REQUIRED → CLOSED(DROPPED) 운영 판단 종료 행 추가
- 내부 검토 상태(SALES/COMPLIANCE/OPS)의 EXITED: "고객이 진행을 중단함" → "내부에서 고객 중단 의사를 확인하고 수동 종료함"으로 명확화

### OPS 계정 생성 플로우 정의
- [계정 생성] 클릭 시 계정 정보 입력 폼 표시 → 입력 완료 시 COMPLETED 전이
- [계정 안내 메일 발송] 버튼 추가 (COMPLETED 후 표시). 프로토타입 미구현 (버튼만)

### 데이터 모델 보완
- Case에 `lastCustomerActionAt` 필드 추가 (자동 이탈 판단용)

---

## 2026-06-16 — CRM 화면 + 자동 이탈 규칙

### PRD 9.2.7.4 CRM (종료 케이스 관리) 추가

- 영업 전용 화면. CLOSED 케이스 목록 (종료 날짜, 사유, 세그먼트, 영업 액션 요약)
- 케이스 클릭 시 종료 사유 상세 + 영업 액션 기록 (텍스트, 여러 건 누적 가능)
- 상단 바에 [대시보드] [CRM] 전환 추가 (영업만 CRM 표시)

### 자동 이탈 규칙 추가

- 고객 액션이 `INACTIVITY_CLOSE_DAYS`(기본 5일) 없으면 자동 CLOSED (EXITED)
- 적용 상태: DOCUMENT_SUBMISSION_REQUIRED, REVISION_REQUESTED
- 비적용: 내부 검토 상태 (SALES_REVIEW, COMPLIANCE_REVIEW, OPS_REVIEW)
- 프로토타입: 5일 고정. 제품화 시 설정 가능하도록 설계

### 데이터 모델 추가

- `SalesAction`: 영업 액션 (caseId, author, text, createdAt)
- `INACTIVITY_CLOSE_DAYS`: 자동 이탈 기간 상수 (프로토타입 5일)
- localStorage key: `sales_actions_<caseId>`

### 8.1 상태 전이 수정

- DOCUMENT_SUBMISSION_REQUIRED, REVISION_REQUESTED의 EXITED 전이: "고객이 진행을 중단함" → "고객 액션이 INACTIVITY_CLOSE_DAYS 동안 없음 (시스템 자동)"

### 코드 수정 지시

- CRM 페이지 신규 생성 (`/internal/crm`)
- 영업 액션 store 신규 생성
- 자동 이탈 로직 구현 (고객 액션 기준 N일 체크)
- 상단 바에 [대시보드] [CRM] 탭 추가 (영업만)
- `App.tsx` 라우트 추가: `/internal/crm`

---

## 2026-06-16 — 내부용 화면 상세 설계

### PRD 9.2.7 전면 교체 — 내부 화면 7개 → 3개 통합

**기존:** 케이스 대시보드, 케이스 상세, 서류 검토, 메시지, 보완 요청, 승인&드롭, 운영 확인 (테이블 한 줄씩)
**변경:** 3개 화면으로 통합 + 상세 스펙 추가

1. **내부 로그인** (9.2.7.1)
   - 이메일+PW 로그인 (가입 없음, 관리자가 계정 생성)
   - 프로토타입: 데모 계정 시드 (sales/compliance/ops @sentbe.com)

2. **케이스 대시보드** (9.2.7.2)
   - 공용 목록, 로그인 역할에 따라 필터 자동 설정
   - 상단 바: 로고 + 역할 표시 + 로그아웃

3. **케이스 상세** (9.2.7.3)
   - 탭 3개: [고객정보] [서류] [이력]
   - 고객정보: 1차+2차 입력 + 세그먼트 (읽기 전용)
   - 서류: 목록 + 컴플라이언스 검토 액션 (개별 승인/보완요청, 일괄 승인, 반려)
   - 이력: 타임라인(상태 변경 포함) + 고객 채팅 + 내부 노트(고객 비공개)
   - 하단 액션 버튼: 역할+상태별 (영업: 1차 스크리닝 완료/반려, 컴플라이언스: 서류 승인/보완요청/반려/종료, 운영: 계정 생성/반려/종료)

### 데이터 모델 추가 (9.3)

- `InternalStaff`: 내부 직원 계정 (email, password, role, name)
- `InternalNote`: 내부 노트 (caseId, author, text, createdAt) — 고객 비공개
- localStorage key 추가: `internal_staff`, `internal_notes_<caseId>`

### 코드 수정 지시

- `InternalLoginPage.tsx` 수정: 역할 카드 선택 → 이메일+PW 로그인으로 변경
- 내부 대시보드 페이지 신규 생성 (`/internal/dashboard`)
- 내부 케이스 상세 페이지 신규 생성 (`/internal/case/:id`)
- `App.tsx` 라우트 추가: `/internal/dashboard`, `/internal/case/:id`
- 내부 직원 store 신규 생성 (데모 계정 시드 포함)
- 내부 노트 store 신규 생성

---

## 2026-06-16 (보완)

### QA 재확인 — 추가 코드 수정 지시

**확인 완료:**
- IndividualForm.tsx 자금원천: 7개(+기타) 확인 → PRD 8개와 일치, 수정 불필요

**미수정 확인 (재지시):**
- documentRequirements.ts / CorporateForm.tsx 자금원천 — 이전 QA 지시 미반영. QA.md 참조하여 수정할 것

**신규 코드 수정 지시:**
- 탭 바 네비게이션: `DocumentUpload.tsx`와 `CasePage.tsx` 상단에 "서류 업로드 | 상태 & 이력" 탭 바 추가
  - `DOCUMENT_SUBMISSION_REQUIRED` 또는 `REVISION_REQUESTED` 상태일 때만 "서류 업로드" 탭 활성화
  - 1차/2차 입력 및 리뷰 화면에서는 탭 바 미표시 (PRD 9.2.2)

**내부용 화면:**
- 현재 InternalLoginPage.tsx 만 존재 — 의도적 미구현, 2차 작업으로 미룸

---

## 2026-06-16

### QA 결과 반영 — PRD 수정 + 코드 수정 지시

**PRD 수정 완료:**
- 8.1 상태 전이: 반려 전이 2건 추가 (COMPLIANCE→SALES_REVIEW_REQUIRED, OPS→COMPLIANCE_REVIEW_REQUIRED)
- 9.6 Corporate 자금원천: 5개 → 8개로 변경 (사업소득 / 근로·연금소득 / 부동산 임대소득 / 부동산 양도소득 / 금융소득(이자·배당) / 상속·증여 / 일시 재산양도로 인한 소득 / 기타(직접 입력))

**코드 수정 필요 (QA.md 참조):**
1. `documentRequirements.ts` — 모든 세그먼트 서류 목록을 PRD 풀 리스트로 교체 (Corporate 9종, Individual 6종, FI 13종, KRW 기본6+섹터별, VND 16종)
2. `InformationForm/CorporateForm.tsx` — 자금원천 5개 → 8개로 변경
3. `InformationForm/IndividualForm.tsx` — 자금원천 8개와 일치 확인
4. 탭 바 네비게이션 (서류 업로드 | 상태&이력) 구현 확인

**QA 문서:** `QA.md` 생성됨. 코딩 클로드는 이 파일 참조할 것.

---

### 시작 페이지, 네비게이션, 서류 제출 후 이동 정의

**시작 페이지:**
- 별도 회원가입 없음. 이메일+PW 입력 → 기존 계정이면 로그인, 없으면 계정 자동 생성 + 케이스 시작

**네비게이션:**
- 로그인 후 상단 탭 바: 서류 업로드 | 상태 & 이력 (자유 전환)
- 1차/2차 입력 및 리뷰 중에는 탭 바 미표시

**서류 제출/재제출 후:**
- 제출 완료 메시지 표시 → 상태 & 이력으로 자동 이동

**PRD 섹션:**
- 9.2.2 케이스 접근 규칙 → "케이스 접근 및 네비게이션"으로 확장 (시작 페이지 동작, 네비게이션 추가)
- 9.2.5 서류 업로드 상세에 제출 후 이동 추가

---

### 고객용 화면 통합 (10개 → 7개)

**삭제된 화면:**
- 서류 안내 — 서류 업로드에 통합
- 보완 대응 — 서류 업로드의 보완 모드로 통합
- 메시지 (문의) — 상태&이력 화면의 메시지 영역으로 통합
- 완료 화면 (라우팅 테이블에만 있었음) — 상태&이력의 COMPLETED 모드로 통합

**최종 고객 화면 7개:**
1. 시작 페이지
2. 1차 정보 입력
3. 1차 리뷰
4. 2차 정보 입력
5. 2차 리뷰
6. 서류 업로드
7. 상태 & 이력

**서류 업로드 화면 변경:**
- 기본 모드 (DOCUMENT_SUBMISSION_REQUIRED): 서류 목록 + 업로드
- 보완 모드 (REVISION_REQUESTED): 보완 필요 서류 강조 + 재업로드 → 재제출 시 COMPLIANCE_REVIEW_REQUIRED로 전이

**상태&이력 화면 변경:**
- 공통: 타임라인 + 상태 변경 이력 + 메시지 영역 (1:1 채팅)
- COMPLETED: 계정 정보 영역 + 새 케이스 시작 버튼
- CLOSED: 종료 사유 + 새 케이스 시작 버튼

**라우팅 테이블 변경:**
- REVISION_REQUESTED → 서류 업로드 (보완 모드)
- COMPLETED → 상태 & 이력 (완료)
- CLOSED → 상태 & 이력 (종료) — 신규 추가

**PRD 섹션 번호 변경:**
- 9.2.5 서류 업로드 화면 상세 (신규)
- 9.2.6 상태&이력 화면 상세 (신규)
- 9.2.7 내부용 화면 (구 9.2.6)
