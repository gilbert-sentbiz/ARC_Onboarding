# 로컬 개발 환경 — Docker

개발팀과 합의(2026-08-07): **로컬에서 도커로 전체 스택을 돌려보고, 검증 후 회사 환경으로 이관**한다. 회사 인프라 정책(망 분리, 실 S3 등)이 확정되기 전에 개발을 시작할 수 있고, 이 로컬 구성이 이관의 청사진이 된다.

이 문서는 **목표 구조와 규격**이다. 실제 `docker-compose.yml`, `Dockerfile`은 개발팀이 프레임워크 확정 후 작성한다 (아래 규격대로 짜면 우리가 의도한 구조로 수렴).

## 스택

| 레이어 | 기술 | 비고 |
| --- | --- | --- |
| backend | **Kotlin** (Spring Boot 또는 Ktor — 개발팀 선택) | Gradle 빌드 |
| frontend | **React** | 지금 `prototype-next`(Next.js) 재사용 — 새로 짜지 않고 localStorage → API 전환 |
| db | **PostgreSQL** | `server-spec/schema.sql` 그대로 |
| storage | **MinIO** (S3 호환) | 로컬 S3 대역. 회사 환경에선 실 S3로 교체 |

## compose 서비스 구성

```
services:
  db        Postgres      :5432   ← schema.sql로 초기화
  storage   MinIO         :9000 (API) / :9001 (콘솔)  ← 부팅 시 버킷 생성
  backend   Kotlin API    :8080   ← db, storage에 의존
  frontend  React         :3000   ← backend API 호출
```

- 컨테이너 기동 순서: db, storage 먼저 → backend(마이그레이션/헬스체크 후) → frontend
- db 초기화는 `schema.sql`을 Postgres 이미지의 init 마운트로 실행하거나 백엔드 마이그레이션 툴(Flyway 등)로. **택1은 개발팀 결정** — 단 스키마의 원본은 항상 정의서(Confluence)임을 유지

## 환경변수 (이관 지점)

로컬 ↔ 회사 환경 차이는 **환경변수로만** 흡수되게 한다. 코드에 엔드포인트를 하드코딩하지 않는다.

| 변수 | 로컬(도커) | 회사 환경 |
| --- | --- | --- |
| `DB_URL` | `db:5432` (compose 내부 DNS) | 사내 Postgres |
| `S3_ENDPOINT` | `http://storage:9000` (MinIO) | 실 S3 엔드포인트 |
| `S3_BUCKET` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` | MinIO 로컬 값 | 실 S3 크리덴셜 (시크릿 매니저) |
| `AUTH_MODE` (고객) | `password` (잠정) | 확정 후 (OTP 등) |
| 내부 SSO 설정 | 목(mock) 또는 스킵 | 백오피스 구글 SSO |

> **이관이 쉬운 이유**: 앱은 S3 *엔드포인트*만 바라보므로 MinIO → 실 S3 교체가 환경변수 몇 개다. DB는 같은 Postgres라 스키마 그대로 간다.

## 데이터 주의

- MinIO, db의 시드, 테스트 데이터는 **전부 가짜**. 실고객 데이터, 운영 크리덴셜을 로컬 컨테이너나 AI 도구 입력에 넣지 않는다.
- 로컬 크리덴셜(MinIO 키 등)은 `.env.example`로 형태만 공유하고 실제 `.env`는 커밋하지 않는다.

## 이관 체크리스트 (로컬 검증 완료 후)

1. `S3_ENDPOINT` 등 스토리지 변수를 실 S3로 교체 → 업로드/다운로드 재확인
2. DB를 사내 Postgres로 → `schema.sql`(또는 마이그레이션) 재적용
3. 망 분리 반영 — 내부 API는 백오피스/VDI 망, 고객 API는 인터넷망 (API 계층 분리, DB 공유)
4. 인증을 목에서 실제(내부 구글 SSO, 고객 확정 방식)로 교체
