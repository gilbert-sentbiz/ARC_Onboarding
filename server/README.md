# ARC 온보딩 서버

SentBe ARC 온보딩 플랫폼 백엔드. Kotlin + Spring Boot / Postgres / MinIO / Next.js 프론트엔드.

## 로컬 기동

### 사전 준비

- Docker Desktop (또는 Docker Engine + Compose v2)
- Java/Gradle 불필요 — 빌드는 Docker 멀티스테이지로 진행

### 첫 실행

```bash
cd server/

# 1. 환경변수 파일 복사 (기본값으로 바로 실행 가능)
cp .env.example .env

# 2. 전체 스택 기동 (최초 빌드 포함, 5~10분 소요)
docker compose up --build

# 3. 확인
curl http://localhost:8080/health          # {"status":"ok"}
open http://localhost:9001                # MinIO 콘솔 (minio_access / minio_secret)
open http://localhost:3000/ARC_Onboarding # 프론트엔드
```

### 재기동 (코드 변경 없을 때)

```bash
docker compose up
```

### 백엔드만 재빌드

```bash
docker compose up --build backend
```

### 종료

```bash
docker compose down        # 볼륨 유지
docker compose down -v     # 볼륨(DB·MinIO 데이터)도 삭제
```

## 서비스 포트

| 서비스 | 포트 | 비고 |
|--------|------|------|
| backend | 8080 | Spring Boot API |
| db | 5432 | Postgres (컨테이너 간 arc_db) |
| storage | 9000 | MinIO S3 API |
| storage (콘솔) | 9001 | MinIO 웹 콘솔 |
| frontend | 3000 | Next.js dev server |

## 환경변수와 이관

로컬(MinIO/Docker) ↔ 회사 환경(실 S3/Postgres) 차이는 `.env` 수정만으로 흡수.
이관 절차는 `../server-spec/LOCAL_DEV.md` 참조.

## 스펙 참조

- 도메인 불변식·상태 전이: `CLAUDE.md`
- 테이블 정의: `../server-spec/schema.sql`
- 환경 이관 체크리스트: `../server-spec/LOCAL_DEV.md`
