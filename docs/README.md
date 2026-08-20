# ARK 온보딩 플랫폼 — 문서 허브

**이 폴더가 기획 문서의 정본(source of truth)이다.** Confluence는 이해관계자(업무·컴플) 열람용 미러다 — 내용 수정은 여기(GitHub)에서 하고 Confluence 미러에 반영한다.

## 문서

| 문서 | 내용 | Confluence 미러 |
| --- | --- | --- |
| [PRD.md](PRD.md) | 제품 요구사항 — 개요·화면·상태값·분류/질문/서류·MVP 요약 | [4134994324](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4134994324) |
| [ERD.md](ERD.md) | 서버 데이터 모델 — 설계 원칙·다이어그램·동작 흐름 | [4148920321](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4148920321) |
| [TABLE-SPEC.md](TABLE-SPEC.md) | 테이블 정의서 — 컬럼·제약 상세 (11개 테이블) | [4158980234](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4158980234) |
| [CHANGELOG.md](CHANGELOG.md) | 전체 변경 이력 | (로컬에서 이관) |

### 서버 문서 (2026-08-13 docs/로 이관)

| 문서 | 내용 |
| --- | --- |
| [SERVER-STANDARD.md](SERVER-STANDARD.md) | 서버 규범 — 회사 백엔드 표준 바인딩, 불변식, 상태 전이, API 후보, 도메인 (구 `server-spec/CLAUDE.md`) |
| [API-SPEC.md](API-SPEC.md) | 프론트↔서버 API 계약 — 엔드포인트 20개, 타입드 DTO, 인증 (구현 티켓 PI-152~) |
| [LOCAL_DEV.md](LOCAL_DEV.md) | 로컬 도커 환경 규격 (compose, 이관 지점) |
| [schema.sql](schema.sql) | Postgres DDL 원본 (Liquibase changelog의 짝) |

> **AI 컨텍스트용**: `SERVER-STANDARD.md`는 백엔드 레포(`ark-backend`) 루트에 `CLAUDE.md`로도 복사해 둬야 코딩 AI가 자동 로드한다(docs/는 참조 정본, ark-backend 루트는 실행 컨텍스트). — ark-backend 루트에 CLAUDE.md 부재, 추가 필요.

## 코드 (다른 위치)

| 자산 | 위치 |
| --- | --- |
| 서버 백엔드 코드 | `gilbert-sentbiz/ark-backend` 레포 (Kotlin/Spring) |
| 프론트 프로토타입 | 이 레포 `prototype-next/` (mvp 브랜치 배포) |
| 질문 문구·옵션 원천 | [설문 시트](https://docs.google.com/spreadsheets/d/1b7ZMAWl6QIgLT-fnRnrt3r2fdmLUKc785VzyRk1J3pQ/edit) |

## 운영 규칙

- **정본은 이 docs/ (main 브랜치).** 낡은 `arc-client-portal-spec.md`는 2026년 5월 초기 스펙 — deprecated, 참고용.
- 문서는 배포에 영향 없는 `main` 브랜치에 둔다(배포는 `mvp` 푸시만 트리거).
- PRD/ERD/정의서 수정 시: 이 마크다운을 고치고 → Confluence 미러 반영 → CHANGELOG 기록.
