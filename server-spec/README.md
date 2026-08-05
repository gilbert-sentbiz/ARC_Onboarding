# ARC 서버 스펙 패키지

ARC 온보딩 플랫폼 **서버 구현 핸드오버 패키지**입니다. 파일 3개가 전부입니다.

| 파일 | 뭔가요 | 어떻게 쓰나요 |
| --- | --- | --- |
| `CLAUDE.md` | AI 코딩 도구용 컨텍스트 (도메인, 불변식, 상태 전이, API 후보) | **서버 리포 루트에 복사**하면 끝. Cursor 등 다른 도구면 rules 파일로 |
| `schema.sql` | Postgres DDL — 테이블 11개, 제약, 인덱스 | 그대로 실행하면 DB가 뜹니다. 이후 오너십은 개발팀에 |
| `README.md` | 이 문서 | |

## 스펙은 어디 있나요

- **화면과 플로우**: 동작하는 프로토타입이 스펙입니다 — 이 리포 `prototype-next/` (mvp 브랜치가 배포본). 궁금한 동작은 문서보다 사이트에서 먼저 확인하세요.
- **스키마**: [테이블 정의서](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4158980234) (schema.sql의 원본) + [ERD](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4148920321) (설계 이유)
- **스콥과 워크플로우**: [PRD](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4134994324) — 섹션마다 MVP vs Full 표가 있습니다. MVP만 보면 됩니다.
- **질문 문구·옵션**: [설문 시트](https://docs.google.com/spreadsheets/d/1b7ZMAWl6QIgLT-fnRnrt3r2fdmLUKc785VzyRk1J3pQ/edit)가 단일 원천 (시드 데이터의 원본)

## 협업 규칙 (3개만)

1. **스펙의 원천은 Confluence 문서**입니다. 이 패키지와 문서가 다르면 문서가 맞습니다 (발견하면 알려주세요).
2. **스펙 질문은 해당 Confluence 문서에 코멘트**로 남겨주세요 — 답이 문서에 쌓여서 다음 사람이 또 안 물어봐도 됩니다.
3. **스펙을 바꾸고 싶으면 PM(Gilbert)에게** — 문서를 고친 뒤에 코드가 따라갑니다. 반대 순서 금지.

그 외 브랜치 전략, 리뷰 방식, 보드는 개발팀 관례대로 하시면 됩니다.

## 한 가지 부탁

AI 도구에 **실고객 데이터, 운영 크리덴셜은 넣지 말아주세요.** 시드와 테스트 데이터는 전부 가짜로 — schema.sql 하단에 가짜 시드 예시가 있습니다.
