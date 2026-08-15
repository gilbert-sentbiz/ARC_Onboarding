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

## 환경변수 전체 목록

`.env` 파일로 관리한다. 실제 `.env`는 커밋하지 않고 `.env.example`만 공유.

```env
# ── 데이터베이스 ──────────────────────────────────
DB_URL=jdbc:postgresql://db:5432/arc_db
DB_USERNAME=arc_user
DB_PASSWORD=arc_pass

# ── 스토리지 (MinIO / S3) ─────────────────────────
S3_ENDPOINT=http://storage:9000
S3_BUCKET=arc-documents
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
DB_URL=jdbc:postgresql://localhost:5432/arc \
DB_USERNAME=arc DB_PASSWORD=arc \
REDIS_HOST=localhost REDIS_PORT=6379 \
S3_ENDPOINT=http://localhost:9000 \
S3_BUCKET=arc-documents \
SPRING_PROFILES_ACTIVE=local \
java -jar build/libs/arc-backend-0.0.1-SNAPSHOT.jar
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
