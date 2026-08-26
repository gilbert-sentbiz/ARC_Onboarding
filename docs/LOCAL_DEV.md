# 로컬 개발 환경 — Docker

개발팀과 합의(2026-08-07): **로컬에서 도커로 전체 스택을 돌려보고, 검증 후 회사 환경으로 이관**한다. 회사 인프라 정책(망 분리, 실 S3 등)이 확정되기 전에 개발을 시작할 수 있고, 이 로컬 구성이 이관의 청사진이 된다.

## 스택

회사 백엔드 표준(`CLAUDE.md`)을 따른다. **아래 표가 기준이며, 현재 `server/` 참조 구현의 값(Spring Boot 3.4·Flyway 등)은 비준수 — PI-133에서 표준으로 재정렬한다.**

| 레이어 | 기술 | 비고 |
| --- | --- | --- |
| backend | **Kotlin 2.3.20 + Spring Boot 4.1.0**, JDK 25, Gradle 9.2.1 | Spring Data JDBC(JPA 아님), Docker 멀티스테이지(temurin 25) |
| frontend | **React** | `prototype-next`(Next.js) 재사용 — localStorage → API 전환 |
| db | **PostgreSQL** | **Liquibase** 마이그레이션(= schema.sql 내용) |
| cache | **Redis** | OTP 코드 등 단기 TTL |
| storage | **MinIO** (S3 호환) | 로컬 S3 대역. 회사 환경에선 실 S3(AWS SDK v2)로 교체 |

## compose 서비스 구성

```
services:
  db        Postgres 16   :5432   ← Flyway V1(DDL) + V2(seed) + V3(auth) 자동 적용
  storage   MinIO         :9000 (API) / :9001 (콘솔)  ← 부팅 시 버킷 생성
  backend   Kotlin API    :8080   ← db, storage 헬스체크 후 기동
  frontend  React         :3000   ← backend API 호출
```

- 컨테이너 기동 순서: db, storage 먼저 → backend(마이그레이션 완료 후) → frontend

## 실행 (PI-229 — docker compose up 하나로 전부)

`docker-compose.yml`은 **백엔드 레포(`ark-backend`)** 에 있고, `frontend` 서비스가 프론트 레포(`ARK_Onboarding`)를 build context로 참조한다. 두 레포를 **형제 경로**로 클론한 전제:

```
work/
  ark-backend/        ← docker-compose.yml 여기
  ARK_Onboarding/     ← frontend build context (prototype-next)
```

```bash
cd ark-backend
cp .env.example .env          # 최초 1회
docker compose up -d --build  # db·redis·storage·backend·frontend 전부
```

- 접속: **http://localhost:3000/ARK_Onboarding/** (basePath 때문에 루트 `/`는 404)
- 프론트 경로가 형제가 아니면: `FRONTEND_CONTEXT=/abs/path/to/prototype-next docker compose up -d --build`
- 프론트는 `output:'standalone'`(서버 모드)로 빌드된다 — `next.config.ts`가 `DOCKER_BUILD=1`일 때 자동 전환(기본은 GitHub Pages용 정적 export). 브라우저가 호출하는 API는 호스트 기준 `http://localhost:8080` (build arg `FRONTEND_API_URL`로 오버라이드).

### 로그인 (로컬 데모)

- **고객**: 아무 이메일 + 만능 인증코드 **`000000`** (OTP 요청 불필요). `application-local.yaml`의 `ark.auth.otp-master-code`에만 설정 → dev/stg/prd 비활성.
- **내부**: `sales@sentbe.com` / `compliance@sentbe.com` / `ops@sentbe.com` + `sentbe1234` (mock-login).

⚠️ 로컬이라도 **가짜 데이터만** 사용. 실고객 개인정보·서류 금지.

## 환경변수 전체 목록

`.env` 파일로 관리한다. 실제 `.env`는 커밋하지 않고 `.env.example`만 공유.

```env
# ── 데이터베이스 ──────────────────────────────────
DB_URL=jdbc:postgresql://db:5432/ark_db
DB_USERNAME=ark_user
DB_PASSWORD=ark_pass

# ── 스토리지 (MinIO / S3) ─────────────────────────
S3_ENDPOINT=http://storage:9000
S3_BUCKET=ark-documents
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# ── 인증 모드 ─────────────────────────────────────
# console: OTP를 서버 로그로 출력 (로컬 기본값)
# smtp:    실제 이메일 발송 (회사 환경)
AUTH_MODE=console

# smtp 모드일 때만 필요
MAIL_FROM=arc-noreply@sentbe.com
MAIL_SMTP_HOST=
MAIL_SMTP_PORT=587
MAIL_SMTP_USERNAME=
MAIL_SMTP_PASSWORD=

# ── 내부 SSO ─────────────────────────────────────
# mock:   /internal/auth/mock-login 엔드포인트 사용 (로컬 기본값)
# google: 실제 Google OAuth2 (회사 환경)
SSO_MODE=mock

# google 모드일 때만 필요
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## JAR 직접 실행 (docker-compose 없이 백엔드만)

db / redis / storage 컨테이너는 docker-compose로 유지하고 백엔드만 로컬 JAR로 실행할 때는 아래 환경변수를 명시한다. **`application.yml` 기본값과 docker-compose MinIO 크리덴셜을 일치시켜야 403을 막을 수 있다.**

```bash
JAVA_HOME=/opt/homebrew/opt/openjdk \
DB_URL=jdbc:postgresql://localhost:5432/ark \
DB_USERNAME=ark DB_PASSWORD=ark \
REDIS_HOST=localhost REDIS_PORT=6379 \
S3_ENDPOINT=http://localhost:9000 \
S3_BUCKET=ark-documents \
SPRING_PROFILES_ACTIVE=local \
java -jar build/libs/ark-backend-0.0.1-SNAPSHOT.jar
```

> `S3_ACCESS_KEY` / `S3_SECRET_KEY`는 생략 — `application.yml` 기본값 `minioadmin:minioadmin`이 docker-compose MinIO 기본값과 일치하기 때문이다. 환경변수로 덮어쓰면 불일치 → 403이 발생한다.

## 로컬 인증 흐름

### 고객 (이메일 OTP)

```
1. POST /auth/otp/request   { "email": "customer@example.com" }
   → 서버 로그에서 OTP 코드 확인 (AUTH_MODE=console)
   예시: [OTP] email=customer@example.com code=482931 expires_at=...

2. POST /auth/otp/verify    { "email": "customer@example.com", "code": "482931" }
   → { "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }

3. 이후 모든 고객 API 호출 시:
   Authorization: Bearer xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 내부 직원 (목 SSO)

시드 직원 ID (V2 마이그레이션 기준):
| staffId | role |
| --- | --- |
| h0000001-0001-0001-0001-000000000001 | SALES |
| h0000002-0001-0001-0001-000000000002 | OPS |
| h0000003-0001-0001-0001-000000000003 | COMPLIANCE |
| h0000004-0001-0001-0001-000000000004 | ADMIN |

```
1. POST /internal/auth/mock-login   { "staffId": "h0000002-0001-..." }
   → { "token": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy" }

2. 이후 모든 내부 API 호출 시:
   Authorization: Bearer yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
```

## 회사 환경 이관 절차

### 1단계 — 스토리지 교체 (MinIO → S3)

```env
S3_ENDPOINT=https://s3.ap-northeast-2.amazonaws.com
S3_BUCKET=<실 버킷명>
S3_ACCESS_KEY=<IAM 액세스키>
S3_SECRET_KEY=<IAM 시크릿>
```

확인: 업로드/다운로드 동작, 버킷 퍼블릭 액세스 차단 설정

### 2단계 — 데이터베이스 교체

사내 Postgres에 접속하도록 `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` 교체.  
Flyway가 V1~V3 마이그레이션을 자동 적용함.

확인: `flyway_schema_history` 테이블 확인

### 3단계 — 고객 이메일 발송 교체 (콘솔 → SES)

```env
AUTH_MODE=smtp
MAIL_FROM=arc-noreply@sentbe.com
MAIL_SMTP_HOST=email-smtp.ap-northeast-2.amazonaws.com
MAIL_SMTP_PORT=587
MAIL_SMTP_USERNAME=<SES SMTP username>
MAIL_SMTP_PASSWORD=<SES SMTP password>
```

> `MailService` 클래스(향후 구현)가 AUTH_MODE=smtp일 때 실제 발송으로 분기한다.  
> 현재 AUTH_MODE=console이면 서버 로그에만 출력한다.

### 4단계 — 내부 SSO 교체 (목 → Google OAuth2)

```env
SSO_MODE=google
GOOGLE_CLIENT_ID=<백오피스 Google OAuth 클라이언트 ID>
GOOGLE_CLIENT_SECRET=<Google OAuth 클라이언트 시크릿>
```

> `StaffAuthFilter` 교체: 목 토큰 대신 Google ID Token 검증으로 전환.  
> `/internal/auth/mock-login` 엔드포인트는 프로덕션에서 비활성화.

### 5단계 — 망 분리

- 고객 API (`/auth/**`, `/cases/**`, `/documents/**`): 인터넷망 노출
- 내부 API (`/internal/**`): 백오피스/VDI 망으로만 접근 허용 (방화벽/로드밸런서 레벨 제어)
- DB: 내/외부 API가 동일 Postgres 공유 (네트워크 경계는 앱 위에서 처리)

## 데이터 주의

- MinIO, db의 시드, 테스트 데이터는 **전부 가짜**. 실고객 데이터, 운영 크리덴셜을 로컬 컨테이너나 AI 도구 입력에 넣지 않는다.
- 로컬 크리덴셜(MinIO 키 등)은 `.env.example`로 형태만 공유하고 실제 `.env`는 커밋하지 않는다.

---

# English Version

# Local Development Environment — Docker

Agreed with the dev team (2026-08-07): **run the entire stack locally with Docker, verify it, then migrate to the company environment.** This lets development start before the company infrastructure policy (network segregation, real S3, etc.) is finalized, and this local setup becomes the blueprint for the migration.

## Stack

Follows the company backend standard (`CLAUDE.md`). **The table below is authoritative; the current values in the `server/` reference implementation (Spring Boot 3.4, Flyway, etc.) are non-compliant — they will be realigned to the standard in PI-133.**

| Layer | Technology | Notes |
| --- | --- | --- |
| backend | **Kotlin 2.3.20 + Spring Boot 4.1.0**, JDK 25, Gradle 9.2.1 | Spring Data JDBC (not JPA), Docker multi-stage (temurin 25) |
| frontend | **React** | Reuse `prototype-next` (Next.js) — switch from localStorage to API |
| db | **PostgreSQL** | **Liquibase** migrations (= contents of schema.sql) |
| cache | **Redis** | Short-lived TTL for OTP codes, etc. |
| storage | **MinIO** (S3-compatible) | Local S3 stand-in. Replaced by real S3 (AWS SDK v2) in the company environment |

## compose Service Layout

```
services:
  db        Postgres 16   :5432   ← Flyway V1(DDL) + V2(seed) + V3(auth) 자동 적용
  storage   MinIO         :9000 (API) / :9001 (콘솔)  ← 부팅 시 버킷 생성
  backend   Kotlin API    :8080   ← db, storage 헬스체크 후 기동
  frontend  React         :3000   ← backend API 호출
```

- Container startup order: db, storage first → backend (after migration completes) → frontend

## Running (PI-229 — everything with a single docker compose up)

`docker-compose.yml` lives in the **backend repo (`ark-backend`)**, and the `frontend` service references the frontend repo (`ARK_Onboarding`) as a build context. This assumes the two repos are cloned as **sibling paths**:

```
work/
  ark-backend/        ← docker-compose.yml 여기
  ARK_Onboarding/     ← frontend build context (prototype-next)
```

```bash
cd ark-backend
cp .env.example .env          # 최초 1회
docker compose up -d --build  # db·redis·storage·backend·frontend 전부
```

- Access: **http://localhost:3000/ARK_Onboarding/** (because of the basePath, the root `/` returns 404)
- If the frontend path is not a sibling: `FRONTEND_CONTEXT=/abs/path/to/prototype-next docker compose up -d --build`
- The frontend is built with `output:'standalone'` (server mode) — `next.config.ts` switches automatically when `DOCKER_BUILD=1` (the default is a static export for GitHub Pages). The API the browser calls is host-based `http://localhost:8080` (override via the `FRONTEND_API_URL` build arg).

### Login (local demo)

- **Customer**: any email + the master verification code **`000000`** (no OTP request needed). Set only in `application-local.yaml`'s `ark.auth.otp-master-code` → disabled in dev/stg/prd.
- **Internal**: `sales@sentbe.com` / `compliance@sentbe.com` / `ops@sentbe.com` + `sentbe1234` (mock-login).

⚠️ Even locally, **use fake data only**. No real customer PII or documents.

## Full Environment Variable List

Managed via a `.env` file. The actual `.env` is not committed; only `.env.example` is shared.

```env
# ── 데이터베이스 ──────────────────────────────────
DB_URL=jdbc:postgresql://db:5432/ark_db
DB_USERNAME=ark_user
DB_PASSWORD=ark_pass

# ── 스토리지 (MinIO / S3) ─────────────────────────
S3_ENDPOINT=http://storage:9000
S3_BUCKET=ark-documents
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin

# ── 인증 모드 ─────────────────────────────────────
# console: OTP를 서버 로그로 출력 (로컬 기본값)
# smtp:    실제 이메일 발송 (회사 환경)
AUTH_MODE=console

# smtp 모드일 때만 필요
MAIL_FROM=arc-noreply@sentbe.com
MAIL_SMTP_HOST=
MAIL_SMTP_PORT=587
MAIL_SMTP_USERNAME=
MAIL_SMTP_PASSWORD=

# ── 내부 SSO ─────────────────────────────────────
# mock:   /internal/auth/mock-login 엔드포인트 사용 (로컬 기본값)
# google: 실제 Google OAuth2 (회사 환경)
SSO_MODE=mock

# google 모드일 때만 필요
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Running the JAR Directly (backend only, without docker-compose)

When you keep the db / redis / storage containers up with docker-compose but run only the backend as a local JAR, specify the environment variables below. **You must keep the `application.yml` defaults consistent with the docker-compose MinIO credentials to avoid 403 errors.**

```bash
JAVA_HOME=/opt/homebrew/opt/openjdk \
DB_URL=jdbc:postgresql://localhost:5432/ark \
DB_USERNAME=ark DB_PASSWORD=ark \
REDIS_HOST=localhost REDIS_PORT=6379 \
S3_ENDPOINT=http://localhost:9000 \
S3_BUCKET=ark-documents \
SPRING_PROFILES_ACTIVE=local \
java -jar build/libs/ark-backend-0.0.1-SNAPSHOT.jar
```

> `S3_ACCESS_KEY` / `S3_SECRET_KEY` are omitted — because the `application.yml` default `minioadmin:minioadmin` matches the docker-compose MinIO default. Overriding them with env vars causes a mismatch → 403.

## Local Authentication Flow

### Customer (email OTP)

```
1. POST /auth/otp/request   { "email": "customer@example.com" }
   → 서버 로그에서 OTP 코드 확인 (AUTH_MODE=console)
   예시: [OTP] email=customer@example.com code=482931 expires_at=...

2. POST /auth/otp/verify    { "email": "customer@example.com", "code": "482931" }
   → { "token": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }

3. 이후 모든 고객 API 호출 시:
   Authorization: Bearer xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Internal Staff (mock SSO)

Seed staff IDs (per the V2 migration):
| staffId | role |
| --- | --- |
| h0000001-0001-0001-0001-000000000001 | SALES |
| h0000002-0001-0001-0001-000000000002 | OPS |
| h0000003-0001-0001-0001-000000000003 | COMPLIANCE |
| h0000004-0001-0001-0001-000000000004 | ADMIN |

```
1. POST /internal/auth/mock-login   { "staffId": "h0000002-0001-..." }
   → { "token": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy" }

2. 이후 모든 내부 API 호출 시:
   Authorization: Bearer yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy
```

## Company Environment Migration Procedure

### Step 1 — Replace Storage (MinIO → S3)

```env
S3_ENDPOINT=https://s3.ap-northeast-2.amazonaws.com
S3_BUCKET=<실 버킷명>
S3_ACCESS_KEY=<IAM 액세스키>
S3_SECRET_KEY=<IAM 시크릿>
```

Verify: upload/download behavior, bucket public-access-block setting

### Step 2 — Replace Database

Swap `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` to connect to the in-house Postgres.  
Flyway applies the V1–V3 migrations automatically.

Verify: check the `flyway_schema_history` table

### Step 3 — Replace Customer Email Delivery (console → SES)

```env
AUTH_MODE=smtp
MAIL_FROM=arc-noreply@sentbe.com
MAIL_SMTP_HOST=email-smtp.ap-northeast-2.amazonaws.com
MAIL_SMTP_PORT=587
MAIL_SMTP_USERNAME=<SES SMTP username>
MAIL_SMTP_PASSWORD=<SES SMTP password>
```

> The `MailService` class (to be implemented) branches to real delivery when AUTH_MODE=smtp.  
> Currently, when AUTH_MODE=console, it only prints to the server log.

### Step 4 — Replace Internal SSO (mock → Google OAuth2)

```env
SSO_MODE=google
GOOGLE_CLIENT_ID=<백오피스 Google OAuth 클라이언트 ID>
GOOGLE_CLIENT_SECRET=<Google OAuth 클라이언트 시크릿>
```

> Replace `StaffAuthFilter`: switch from mock tokens to Google ID Token verification.  
> The `/internal/auth/mock-login` endpoint is disabled in production.

### Step 5 — Network Segregation

- Customer APIs (`/auth/**`, `/cases/**`, `/documents/**`): exposed to the internet
- Internal APIs (`/internal/**`): access allowed only from the back-office/VDI network (controlled at the firewall/load-balancer level)
- DB: internal and external APIs share the same Postgres (the network boundary is handled above the app)

## Data Caution

- MinIO, the db seed, and test data are **all fake**. Do not put real customer data or production credentials into local containers or AI-tool inputs.
- Local credentials (MinIO keys, etc.) are shared only in shape via `.env.example`; the actual `.env` is not committed.
