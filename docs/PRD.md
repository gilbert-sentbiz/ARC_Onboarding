# ARK - 온보딩 플랫폼 PRD

> **정본(source of truth): 이 GitHub 문서.** [Confluence 페이지](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4134994324)는 이해관계자(업무·컴플) 열람용 **미러**다. 내용 수정은 여기(GitHub)에서 하고 Confluence 미러에 반영한다.
> 최종 동기화: 2026-08-13 (Confluence v31 기준)

---

## 1. 개요

### 1.1 목적

* 현재 신규 고객 온보딩은 홈페이지 통한 인입 → 1차 스크리닝 및 서류 안내(통화, 이메일) → 서류 획득(이메일) → 심사(지라) → 계정 생성 단계로 진행되고 있음.
* 각 단계별 고객과의 소통이 통화와 이메일을 통해 이루어져 손이 많이 가고 속도가 느림. 이로 인해 고객 이탈도 많이 발생함
* 고객 인입이 증가해도 온보딩 업무가 병목이 되어 빠른 확장이 어려움

### 1.2 제품 구조

* 고객용 제품 : 고객이 질문에 답을 하고 서류를 업로드 하는 제품
* 내부 제품 : 케이스 정보를 확인하고 상태 변경, 심사, 보완의견 전달 등 온보딩에 필요한 업무를 하는 제품

### 1.3 사용자 & 역할

| 역할 | 하는 일 |
| --- | --- |
| 고객 | 문의 시작, 정보 입력, 서류 제출, 보완 |
| 영업 (SALES) | 세그먼트 확인, 서류 제출 확인, 1차 스크리닝 후 운영 인계 |
| 운영 (OPS) | 제출 서류 스크리닝(컴플라이언스 인계 전), 컴플라이언스 승인 후 계정 안내 |
| 컴플라이언스 (COMPLIANCE) | 설문 및 서류 심사, 룰 관리 |

### 1.4 라이프사이클 (6단계)

| # | 단계 | 고객 | 내부 |
| --- | --- | --- | --- |
| 1 | 문의 접수 | 온보딩 시작 | 케이스 생성 |
| 2 | 정보 입력 | 필요한 정보 입력 | 세그먼트 판단 기준 확보 |
| 3 | 자동 분류, 서류 안내 | 추가 정보 입력, 필요한 서류 확인 | 세그먼트 판단, 안내 항목 결정 |
| 4 | 서류 제출 | 서류 업로드 | 제출 접수 |
| 5 | 심사 | 요청 시 보완 재제출 | 영업 1차 스크리닝 → 운영 서류 스크리닝 → 컴플라이언스 심사 |
| 6 | 계정 개설 | 완료까지 대기 | 운영이 최종 확인 후 계정 안내 |

> **이탈(EXITED)** = 고객이 중간에 중단 / **드롭(DROPPED)** = 내부 판단으로 진행 중단.

---

## 2. 화면

> 각 섹션 끝의 **MVP vs Full Spec** 표는 1차 프로토타입에서 제외/축소되는 부분이다. 표에 없는 항목은 MVP = Full Spec 동일. **MVP 스콥 축소 확정(2026-08-04)**: 송금 전용(CORP, INDIV), ad-hoc 서류 추가·일괄 승인·사업자번호 중복 자동 판단 제외. **국내 FI 추가(2026-08-21)**: 금융기관 + 설립국가 KR은 MVP 온보딩 진행 — 2차 질문·서류까지. 단 FI 서비스 선택(5번 계약서 5-1 지급/5-2 결제)은 확정 전이라 MVP 제외. 워크플로우 4단계와 보완요청 3역할 권한, 서류 미리보기, 고객 타임라인은 유지.

### 2.1 고객 제품

* **화면 목록 (7)**

| 화면 | 역할 |
| --- | --- |
| 시작 | 로그인 또는 계정 생성 + 케이스 시작 |
| 1차 정보 입력 | 1차 질문 15개(조건부 표시), 진행률, 임시저장 |
| 1차 리뷰 | 1차 답변 읽기 전용 확인 → 제출 시 세그먼트 분류 실행 |
| 2차 정보 입력 | 세그먼트별 2차 질문(섹션 그룹핑), 1차 자동 채움, 임시저장 |
| 2차 리뷰 | 1차+2차 전체 확인 → 제출 시 서류 제출 단계로 진입 |
| 서류 업로드 | 세그먼트별 서류 목록 + 업로드. 보완 모드 시 보완 서류 강조 |
| 상태 & 이력 | 진행 타임라인 + 메시지 + 완료/종료 안내 |

**접근, 네비게이션**

* 계정 생성, 로그인 방식 열려있음(이메일 + OTP or 이메일 + PW or …)
    * 법인에 2개 이메일이 문의 할 경우 중복제거 해야 함
    * 동일 법인이 이탈 후 재시도 할 수 있음
    * 사업자 기준으로 중복 판단할 수 있도록
* **1 계정 - 1 활성 케이스** (활성 = 접수부터 계정 개설까지 진행 중인 케이스). 종료/완료 이후 새 케이스 가능.
    * 시간이 지났을 경우 삭제하는 정책 필요
* 재로그인 시 진행 상황별 자동 라우팅 :

| 진행 상황 | 이동 화면 |
| --- | --- |
| 1차 질문 응답중 | 1차 정보 입력 (임시저장 복원) |
| 1차 제출 / 2차 질문 응답 중 | 2차 정보 입력 (임시저장 복원) |
| 1차, 2차 모두 제출 | 서류 업로드 |
| 보완 요청됨 | 서류 업로드 (보완 모드) |
| 내부 심사 진행 중 / 완료 / 종료 | 상태 & 이력 |
| 활성 케이스 없음 | 시작 페이지 |

**임시저장** — 1차/2차 입력에 "임시저장" 버튼(수동, 자동저장 아님). 입력 데이터는 미시작 → 작성 중(임시저장) → 제출 완료 순으로 진행.

**리뷰 화면** — 질문+답변 읽기 전용. 수정하려면 "이전"으로 입력 화면 복귀. 2차 리뷰에서 "이전"으로 1차까지 거슬러 수정 가능. **1차 수정 시 세그먼트 재계산** → 세그먼트가 바뀌면 안내 표시, 유효한 2차 응답은 유지, 신규 질문은 빈 값, 사라진 질문은 삭제.

**서류 업로드 — 두 모드**

* _기본 모드_ (서류 제출 단계): 서류별 업로드/미리보기/재업로드, 필수 전부 업로드 시 제출 활성화.
* _보완 모드_ (보완 요청 시): 보완 필요 서류마다 **요청한 담당자가 쓴 서류별 사유**를 옆에 표시. 내부가 추가 요청한 미정의 서류도 함께 노출. 보완+추가 서류를 모두 올려야 제출 활성화 → 제출 시 보완을 요청한 검토 단계로 복귀. 고객에겐 **현재 라운드 사유만** 노출(과거 라운드, 누적 횟수 숨김).

**상태 & 이력** — 진행 타임라인 + 담당자 1:1 메시지 + 상태별 안내 문구(보완 요청 시엔 업로드 이동 버튼, 완료/종료 시엔 새 케이스 시작 버튼).

**MVP vs Full Spec**

| 항목 | MVP | Full Spec |
| --- | --- | --- |
| 임시저장 | 제외 — 일괄 제출만 (작성 중 상태 없음) | 임시저장 + 미시작/작성 중/제출 완료 |
| 리뷰 화면 | 1차/2차 단일 화면 통합, 1차로 돌아가 세그먼트 재계산하는 흐름 제외 | 1차/2차 분리 + 재수정 시 세그먼트 재계산 |
| 상태 & 이력 — 메시지 | 댓글 영역 제외 (타임라인, 상태 안내만) | 댓글 포함 |
| 사업자번호 중복 판단 | **제외** — 이메일 unique만, 동일 법인 중복 케이스는 내부 수동 처리(드롭) | 사업자 기준 자동 중복 판단 |

### 2.2 내부 제품 - 케이스 관리

**로그인** — 센트비 내부 직원 구글 로그인 - 백오피스 계정

**케이스 대시보드** — 3역할 공용. 로그인 역할의 담당 단계로 필터 자동 설정(운영은 서류 스크리닝, 계정 개설 2단계, 권한 범위 내 수동 변경 가능).

목록: 회사명, 상태, 세그먼트, 생성일, 최종 수정일, 대기 일수, 담당자. 기본 정렬 = 최종 수정일 내림차순. 상단 바에 로고, 역할 표시, 로그아웃.

**케이스 상세 — 3탭**

| 탭 | 내용 |
| --- | --- |
| 고객정보 | 1차+2차 입력 + 세그먼트 판단 결과 (읽기 전용) |
| 서류 | 서류 목록 + 미리보기/다운로드 + 검토 액션 + 추가 요청 서류 생성 |
| 이력 | 타임라인 / 고객 댓글 / 내부 노트(고객 비공개, append-only) |

* **서류 검토 액션**: 개별 `[보완요청]`, `[+서류 추가 요청]`(미정의 서류, 서류명 직접 입력)은 **영업, 운영, 컴플라이언스 모두** 가능 — 실행 시 케이스가 보완 요청 상태로 전환되고 요청한 검토 단계가 기록됨. `[승인]`/`[일괄 승인]`은 **컴플라이언스만**. 다운로드는 전 역할. 보완요청 시 서류별 사유 입력 **필수**.
* **추가 서류 요청** : 케이스에 따라 기존 목록에 없던 서류를 추가로 요청할 수 있다.
* **제출 이력**: 제출본 전부 보존(덮어쓰기 X), 최신본이 현재 검토 대상, 이전본은 접기/펼치기.
* **하단 액션 버튼**은 역할, 단계별로 다르며 케이스 상태를 전이시킨다 → 전이 규칙은 3.1 참조.

**MVP vs Full Spec**

| 항목 | MVP | Full Spec |
| --- | --- | --- |
| 담당자 배정 | 1개 역할별 1개 계정만 | 라운드로빈 자동 배정 + 수동 변경 |
| 케이스 상세 이력 탭 | 타임라인만 | 타임라인 + 고객 채팅 + 내부 노트 |
| 제출 이력 | 최신 제출본만 | 전체 제출본 보존 |
| 서류 다운로드 | 개별만 | 개별 + 일괄(zip) |
| 서류 추가 요청 (ad-hoc) | **제외** — 추가 서류가 필요하면 보완요청 사유에 기재 | 목록에 없는 서류 즉석 추가 (서류명 직접 입력) |
| 서류 일괄 승인 | **제외** — 개별 승인만 | 개별 + 일괄 승인 (컴플라이언스) |

* 한번에 한종류 파일을 n개로 나눠서 내는 경우 → **MVP는 서류당 1파일(멀티업로드 불가), Full은 멀티업로드** (2026-08-07 확정, PI-127).
    * 허용 형식 pdf, png, jpg / 상한 10MB (2026-08-07 확정). 바이러스 스캔은 Full.

### 2.3 내부 제품 - 룰 관리 패널

1차 응답 → 분류 → 2차 질문 → 서류로 이어지는 룰을 코드 수정 없이 편집하는 내부 패널. **COMPLIANCE만 접근**. 변경은 **신규 케이스에만** 적용(진행 중 케이스는 생성 시점 룰로 고정, 룰셋 version 기록).

* 3단계 편집 = **① 분류 룰**(1차 응답 → 세그먼트) / **② 질문 룰**(세그먼트 → 2차 질문, 공통 라이브러리 참조 + 고유 질문 작성) / **③ 서류 룰**(세그먼트 → 서류 체크리스트 + 섹터/교집합 조건 슬롯).
* `[+ 국가 추가]` 위저드(4스텝: 기본정보 → 분류조건 → 질문 → 서류)로 신규 Collection 국가(`SVC_COL_IDR` 등)를 통째로 정의. entity는 추가 대상 아님(한국 사업주체 분류 고정).

**MVP vs Full Spec**

| 항목 | MVP | Full Spec |
| --- | --- | --- |
| 룰 관리 패널 전체 | 제외 — 분류/질문/서류 룰 하드코딩(시드), 신규 국가는 코드 수정 | 컴플라이언스가 패널에서 live 편집 + 국가 추가 위저드 |

### 2.4 내부 제품 - 계정/권한 관리

내부 직원 계정과 역할(권한)을 화면에서 관리한다. **관리자 전용.**

* 계정 목록: 이메일, 이름, 역할(영업/운영/컴플라이언스), 활성 여부.
* 역할 = 접근 권한(볼 수 있는 케이스 단계·화면, 수행 가능한 액션). 역할 변경은 즉시 반영.

**MVP vs Full Spec**

| 항목 | MVP | Full Spec |
| --- | --- | --- |
| 계정/권한 관리 화면 | 제외 — 테이블(데이터)로만 계정·역할 관리, 화면 없음 | 관리자용 계정 추가·역할 지정/변경·비활성화 화면 |

---

## 3. 상태값

상태는 담당자(역할)가 아니라 **케이스가 대기 중인 액션**으로 명명하고, 각 상태의 담당 역할을 따로 매핑한다. 그래서 운영이 서류 스크리닝, 계정 개설 두 단계를 맡아도 별개 상태로 자연스럽게 구분된다.

### 3.1 케이스 상태 + 전이

| 고객 라벨 | 내부 라벨 | 코드 | 담당 |
| --- | --- | --- | --- |
| 접수 완료 | 케이스 생성 | `INQUIRY_RECEIVED` | 고객(정보 입력) |
| 서류 제출 필요 | 서류 제출 대기 | `DOCUMENT_SUBMISSION_REQUIRED` | 고객 |
| 검토중 | 1차 스크리닝 | `INITIAL_SCREENING` | 영업 |
| 검토중 | 서류 스크리닝 필요 | `DOCUMENT_SCREENING_REQUIRED` | 운영 |
| 검토중 | 심사, 승인 필요 | `APPROVAL_REVIEW_REQUIRED` | 컴플라이언스 |
| 계정 생성중 | 계정 개설 필요 | `ACCOUNT_SETUP_REQUIRED` | 운영 |
| 보완 필요 | 보완 요청 (고객 대기) | `REVISION_REQUESTED` | 고객 |
| 완료 | 완료 | `COMPLETED` | — |
| 진행 중단 | 종료 (`closeReason`: `DROPPED`/`EXITED`) | `CLOSED` | — |

**전이표** (주체, 트리거 → 다음 상태)

정상 흐름 (영업 → 운영 → 컴플라이언스 → 운영):

| from | to | 주체 | 트리거 |
| --- | --- | --- | --- |
| INQUIRY_RECEIVED | DOCUMENT_SUBMISSION_REQUIRED | 고객 | 2차 설문 제출 (서류 목록 생성) |
| DOCUMENT_SUBMISSION_REQUIRED | INITIAL_SCREENING | 고객 | 필수 서류 전부 업로드 후 제출 |
| INITIAL_SCREENING | DOCUMENT_SCREENING_REQUIRED | 영업 | 1차 스크리닝 통과 |
| DOCUMENT_SCREENING_REQUIRED | APPROVAL_REVIEW_REQUIRED | 운영 | 서류 스크리닝 통과 |
| APPROVAL_REVIEW_REQUIRED | ACCOUNT_SETUP_REQUIRED | 컴플라이언스 | 심사 승인 (서류 전건 APPROVED) |
| ACCOUNT_SETUP_REQUIRED | COMPLETED | 운영 | 계정 개설 완료 |

> **원본 다이어그램 이미지**는 [Confluence 미러 3.1절](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4134994324) 참조(GitHub 마크다운으로는 텍스트 전이표가 정본).

* 검토 단계 4종 = `INITIAL_SCREENING`, `DOCUMENT_SCREENING_REQUIRED`, `APPROVAL_REVIEW_REQUIRED`, `ACCOUNT_SETUP_REQUIRED`.
* 반려/종료 시 사유 입력 필수(타임라인 기록). 서류 `[승인]`/`[일괄 승인]`은 컴플라이언스만.
* 역할별 열람, 변경 권한은 각 역할의 담당 상태 기준. 영업은 `DOCUMENT_SUBMISSION_REQUIRED`부터 열람 가능.
* 자동 이탈(EXITED)은 3.3 참조.
* 보완요청 시 케이스는 `REVISION_REQUESTED`로 전환하고 `revisionRequestedFrom`에 요청 검토 단계를 기록한다. 고객 재제출 시 그 단계로 복귀.

### 3.2 문서 상태 + 전이

| 고객 라벨 | 내부 라벨 | 코드 |
| --- | --- | --- |
| 해당 없음 | 미제출 | `NOT_REQUESTED` |
| 제출 필요 | 제출 요청 | `REQUESTED` |
| 제출 완료 | 검토중 | `SUBMITTED` |
| 보완 필요 | 보완 요청 | `REVISION_REQUIRED` |
| 승인 완료 | 승인 완료 | `APPROVED` |

전이: `NOT_REQUESTED → REQUESTED → SUBMITTED →` (`APPROVED` 또는 `REVISION_REQUIRED → SUBMITTED` 반복). 세그먼트 변경으로 불필요해지면 `REQUESTED → NOT_REQUESTED`(예외).

### 3.3 전역 규칙

* **보완 복귀**: 보완요청, 서류 추가 요청을 낸 검토 단계를 저장 → 고객 재제출 시 그 단계로 복귀(영업, 운영, 컴플라이언스 각 검토 단계).
* **자동 이탈**: 고객 액션 필요 상태에서 n일간(별도 설정) 무활동 시 `CLOSED (EXITED)` 자동 전이. 내부 검토 중 상태엔 적용 안 함.

**MVP vs Full Spec**

| 항목 | MVP | Full Spec |
| --- | --- | --- |
| 자동 이탈 타이머 | 제외 — 내부 수동 종료만 | 무활동 5일 시 자동 `CLOSED (EXITED)` |

> 케이스/문서 상태값, 전이표, 워크플로우는 MVP·Full 동일. **워크플로우 4단계(영업 → 운영 → 컴플라이언스 → 운영)와 보완요청 3역할 권한은 MVP에서도 유지한다(2026-08-04 확정).**

---

## 4. 분류, 질문, 서류

1차 응답 → 세그먼트 판정 → 세그먼트별 2차 질문 → 세그먼트별 서류로 이어지는 파이프라인이다. _SentBiz Rule 검토(v1.0.5, BO 4143349976) 반영 — 구현은 PI-115~120._

### 4.1 세그먼트 모델

3개 축. 코드(시스템 식별자)와 표시명을 분리한다.

| 축 | 값 |
| --- | --- |
| **Entity** (사업주체) | `ENTITY_CORP`(한국 법인) / `ENTITY_INDIV`(한국 개인) / `ENTITY_FI`(금융기관, 수금 이용자, 해외 법인/개인 포함) |
| **Service** (이용 서비스) | `SVC_PAYOUT`(송금) / `SVC_COL_KRW` / `SVC_COL_VND` / `SVC_COL_ETC`(미정의 국가 폴백). Collection은 **수금 국가** 단위 |
| **Sector** (업종) | KRW Collection 하위 속성. Trading(B2B/B2C), Consulting, Development/Design, Advertising/Marketing, Research, IT, 쿠팡셀러 — KRW 2차 질문의 **Main Business Activity** 선택값으로 결정 |

* **합집합 + dedup**: 한 고객이 여러 세그먼트를 가질 수 있어(송금+수금 등) service, sector는 배열. **2차 질문과 서류는 보유 세그먼트의 합집합으로 결정하고 코드(type) 기준 중복 제거.**
* 신규 Collection 국가는 룰 패널에서 추가(2.3).

### 4.2 1차 질문 → 세그먼트 매핑

**1차 질문 (확정 15문항)** — 회사명, 담당자(이름/직함/전화/이메일), 이용 서비스(복수), 수금 국가(수금 시), 송금 출발/도착 국가(송금 시), 사업자 유형, 설립 국가, 거래 규모(필수), 유입 경로, 추가 문의, 개인정보 동의. 전문은 설문 시트 참조. _1차 인테이크 질문 검토(v1.0.5) 반영 — 거래 건수 삭제, 거래 규모 필수화, 통화 기타는 select 내 '기타' 선택 시 직접 입력._

**Step 1 — entity 판정** (사업자 유형 #10 + 설립 국가 #11, 6칸 완전 닫힘)

| 조건 | → entity |
| --- | --- |
| 수금 선택 → 사업자 유형 금융기관 자동 고정 | `ENTITY_FI` |
| 금융기관 (국가 무관) | `ENTITY_FI` |
| 법인/개인 + 해외 | `ENTITY_FI` |
| 법인 + 한국 | `ENTITY_CORP` |
| 개인 + 한국 | `ENTITY_INDIV` |

> 요약 조건: FI = `수금 이용 OR 금융기관 OR 설립국가=해외`. 설립 국가는 명시 선택값 `KR`로 받는다(자유 텍스트 매칭 안 함). 사업자 유형 선택지 레이블은 '금융기관(PG사·PSP·MSB 등)'으로 표기한다(구 '금융업', 검토 v1.0.5 반영). **MVP: 1차 질문 이용 서비스에서 수금 옵션을 노출하지 않고 송금이 선택된 상태로 고정한다(수금 국가 질문도 미노출) — 2026-08-05 확정, PI-126. FI 판정 분기(2026-08-21 개정): 금융기관 + 설립국가 KR → 국내 FI로 온보딩 진행(송금). 해외 설립(법인·개인·해외 FI) → '준비 중' 안내 후 종료. 즉 MVP 진행 대상 = CORP, INDIV, 국내 FI(전부 송금).**

**Step 2 — service 추가** (서비스 #6 + 수금 국가 #7, 복수)

| 조건 | → service |
| --- | --- |
| 송금 포함 | `SVC_PAYOUT` |
| 수금 + 한국 | `SVC_COL_KRW` |
| 수금 + 베트남 | `SVC_COL_VND` |
| 수금 + 기타(미정의) | `SVC_COL_ETC` (폴백) |

**최종 세그먼트 = entity 1개 + service 복수의 합집합.** 수금 국가 선택지는 등록된 service 세그먼트에서 동적 생성(패널에서 국가 추가 시 1차 #7에도 반영).

### 4.3 2차 질문

**관리 모델 — 질문 라이브러리 + 세그먼트 매핑.** 질문은 단일 원천(라이브러리)에서 1번만 정의하고 세그먼트가 체크로 참조한다(복사 X). 라이브러리 1곳 수정이 전 세그먼트에 반영.

* **3계층**: 공통 질문(전 세그먼트 자동 포함) / entity 고유 / service, 통화 고유. 세그먼트 질문 = 공통 ∪ 고유, 질문 코드 dedup.
* **공통 질문 구성** (Rule 검토 v1.0.5): 사업자등록번호, 업태, 종목, VASP 여부, 거래 목적(판매대금 정산대행/기타), 자금원천, 과세 구분(과세/면세), 홈페이지 주소, 대표자 연락처, 주요 정산대행 요청 품목, 회사 규모, 상장 여부, 설립일자 + BO 필드(성명, 생년월일, 국적, 거주국가). 레이블은 사업자등록증 표기 기준(업태/종목).
* **옵션 필터 오버라이드**: 공통 질문이라도 세그먼트별로 옵션 부분집합만 노출 가능(예: 자금원천 — CORP·FI 5개(사업소득/부동산 임대/부동산 양도/금융소득/기타), INDIV 8개 전체).
* **표시조건**은 `[질문]=[값]` 구조(자유 텍스트 금지). **반복 입력**(소유자, 이사, 경영진 n명)은 반복 플래그 + 하위필드 — 인원수 사전 질문 없이 \[추가\] 버튼으로 늘린다.
* **표시 방식**: 섹션 기반 멀티스텝 위저드(진행바, 스텝 저장/복원). 한 화면에 섹션 2개 기본(작으면 3개). 1차 값은 2차에 자동 채움 + 수정 가능.

**세그먼트별 고유 질문 (요약)** — 전문, 옵션은 설문 시트가 단일 원천. _MVP 활성 = Corporate, Individual, **국내 FI**(질문·서류까지, 서비스 선택/5번 계약서 제외). KRW·VND·기타 Collection, 해외 FI는 Full Spec._

| 세그먼트 | 화면 | 고유 질문 핵심 |
| --- | --- | --- |
| Corporate | 2화면 | 회사명(국문/영문), 회사 연락처, 사업장 주소, 법인 유형(**비영리 선택 시 온보딩 불가**), 법인 등록번호, 대표자 유형(단독/공동/**각자** — 공동·각자 시 전원 반복 입력) / **BO 별도 섹션**: 확인생략 체크 → 25% 자연인 → 2단계(최대 지분 등) → 3단계(대표자=BO), BO는 \[추가\]로 반복 입력 |
| Individual | 2화면 | 상호(국문/**영문**), 연락처, 사업장 주소, 거주지, 대표자 정보(성명 국문/영문, 생년월일, 성별, 국적) / 대표자=BO 여부(아니오 시 BO 정보 수집) |
| FI (국내) — **MVP 포함** | 2화면 (축소) | 법적 명칭(국문/영문), 법인 유형, 법인 등록번호, 웹사이트, 사업장 주소, 설립일/국가, 회사·대표 연락처, 대표자(성명, 생년월일, 성별, 국적) / 25%+ 소유자 반복 입력(CORP BO와 동일 구조), AML 제재 이력. **삭제됨**: 인허가(기관/유형/발급/만료), 외부 감사인, FI/MSB/PSP 중개, 모회사, AML 정책 보유, 중복 문항. **서비스 선택(5번 계약서 5-1/5-2)은 MVP 제외 — 확정 후 별도 반영(에스더)** |
| KRW Collection — Full만 | 4섹션 | A 기본정보(FI 거래 이력, 서브머천트 보유 등) / B 사업 성격(**Main Business Activity 옵션 → 섹터·서류 분기**, 사업 설명, 자금 원천) / C 상품·서비스(이용 목적, 가상계좌 수, 고정계좌 발급 사유, 예상 거래량, 입금자 관계/유형) / D 담당자(성명, 직함, 연락처). 공통·FI와 중복 항목은 자동 채움 + dedup |
| VND Collection — Full만 | +4문항 | 주요 사업활동, 계좌개설 목적, 입금자 관계, 입금자 유형 |
| 기타 Collection — Full만 | — | 미정 (placeholder) |

* BO 필드(성명, 생년월일, 국적, 거주국가)는 공통, BO **판별 로직**은 entity 고유.

### 4.4 서류

**결정 로직**: entity 세그먼트 서류 + service 세그먼트 서류 = 최종 목록(합집합). KRW는 섹터(Main Business Activity)별 추가 서류. **표준 type 코드로 dedup**(의미 같으면 같은 type, 고객 화면엔 1건). 단 범위, 형식이 다르면 별개 type 유지(예: 은행계좌 사본 ≠ 은행 거래내역).

표준 type 예: `BIZ_REGISTRATION`, `DIRECTOR_LIST`, `SHAREHOLDER_LIST`, `ID_COPY`(대표자 신분증), `CONTRACT`, `SAMPLE_INVOICE_SHIPPING`. _WEBSITE_URL은 서류에서 제거 — 공통 질문으로 이동(v1.0.5)._

**서류 조건 명시** (Rule 검토 v1.0.5): 발급 유효기간(법인등기부등본, 법인인감증명서, 주주명부 — 3개월 이내 발급본), 날인(주주명부), 대상 범위(법인인감 — 각자·공동대표 전원 징구), 실거래 기준(계약서 — 실제 계약서, 마스킹 가능 안내 / 인보이스 — 실거래본).

**조건부 서류 2축** (룰 패널 서류 탭 슬롯):

* **섹터 조건**: `sector = 값 → 추가 서류` (KRW Collection 업종별, 쿠팡셀러 특수 경로).
* **교집합(entity) 조건**: `entity + service` 조합 전용. 예) `{FI + KRW}` → KYC Documents for Sample Merchants.

**세그먼트별 서류 (요약)** — 전체 목록은 Rule 검토 하위 서류 페이지 참조. _MVP는 Corporate, Individual, **국내 FI**._

| 세그먼트 | 서류 수 | 비고 |
| --- | --- | --- |
| Corporate | 필수 8종 + 선택 2종 | 사업자등록증, 법인등기부등본, 날인 주주명부, 대표자 신분증, 법인인감, 은행계좌, 실제 계약서, 인보이스 + 선택: 선적 자료, 세관 서류(신규) |
| Individual | 필수 4종 + 선택 2종 | 사업자등록증, 대표자 신분증, 은행계좌, 실거래 인보이스 + 선택: 계약서(필수→선택 전환), 선적자료(B/L, AWB) |
| FI (국내) — **MVP 포함** | 8종 | 공통 6종(사업자등록증, 등기부, 인감, 대표자 신분증, 주주명부, 법인명의 은행계좌) + 금융 라이선스 사본, AML 내부통제규정. 기존 13종에서 축소(감사보고서, AML감사, 조직도, 지분도, Wolfsberg, Board Resolution 제외). 해외 FI 정책 미정(Full) |
| KRW Collection — Full만 | 기본 6종 + 섹터별 | 기본 6종 + 선택(Articles of Incorporation, 사무실 사진) + Main Business Activity별 추가 서류, 쿠팡 3종. 제출 안내: 영문 외 번역본 동봉, 제출 불가 시 사유, 실거래 샘플 우선, 민감정보 블라인드 가능 |
| VND Collection — Full만 | 16종 | Company Charter, Certificate of Incorporation, 회계사 서류 등 (일부 조건부, 미정) |

**MVP vs Full Spec**

| 항목 | MVP | Full Spec |
| --- | --- | --- |
| Entity 세그먼트 | **CORP, INDIV, 국내 FI**(금융기관+설립KR) — 해외 설립 FI는 '준비 중' 종료 | CORP, INDIV, FI(국내·해외) |
| Service 세그먼트 | **송금만** — 1차 질문에서 수금 옵션 미노출, 송금 선택 고정 (PI-126) | 송금 + KRW, VND, 기타 Collection |
| FI 2차 질문, 서류 | **국내 FI 포함**(질문·서류) — 서비스 선택/5번 계약서 제외 | 국내 FI 정비안 전체(서비스 선택 포함) + 해외 FI |
| KRW / VND / 기타 Collection 2차 질문, 서류 | 제외 | KRW 4섹션(A~D), VND 4문항, 섹터별 서류 등 |
| entity × service 교집합 조건부 서류 (FI + KRW → KYC) | 제외 — KRW 세그먼트 제외라 FI+KRW 조합 자체가 없음(국내 FI는 송금만) | 적용 |

> 1차 질문 15문항, Corporate/Individual/국내 FI 2차 질문과 서류, 질문 라이브러리 + 매핑 모델은 MVP·Full 동일(국내 FI 서비스 선택은 MVP 제외).

---

## 5. MVP 요약

MVP 차이는 각 섹션(2장 화면, 3장 상태값, 4장 분류·질문·서류)의 **MVP vs Full Spec** 표로 정리했다. 아래는 한눈에 보기. _스콥 축소 확정 2026-08-04._

* **제외** — **수금(Collection) 전체, 해외 설립 FI, FI 서비스 선택(5번 계약서 5-1/5-2) (MVP entity = CORP·INDIV·국내 FI, 전부 송금 — 1차 질문에서 수금 옵션 미노출·송금 고정; 금융기관+설립KR만 국내 FI로 진행, 해외설립 FI는 '준비 중' 종료)**, 서류 추가 요청(ad-hoc), 서류 일괄 승인, 사업자번호 중복 자동 판단, 텍스트 소통(댓글), in-app 알림, 룰 관리 패널, 계정/권한 관리 화면, 자동 이탈 타이머, entity×service 교집합 조건부 서류.
* **축소** — 담당자 배정(수동만), 제출 이력(최신본만), 임시저장(일괄 제출만), 서류 다운로드(개별만), 리뷰 화면(단일 통합), 멀티업로드(서류당 1파일).
* **유지 확정** — 워크플로우 4단계(영업 → 운영 → 컴플라이언스 → 운영), 보완요청 3역할 권한, 세그먼트 자동 분류 + 서류 자동 안내, 보완 루프(서류별 사유), 서류 미리보기, 고객 타임라인.

---

## 참고

* 원본 PRD(초기): https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4113727492
* 질문 전문(문구, 옵션) 단일 원천 — 설문 시트 "ARK 고객 유형별 설문": https://docs.google.com/spreadsheets/d/1b7ZMAWl6QIgLT-fnRnrt3r2fdmLUKc785VzyRk1J3pQ/edit
* SentBiz Rule 검토(v1.0.5): https://sentbe-product.atlassian.net/wiki/spaces/BO/pages/4143349976 — 반영 티켓 PI-114~120
* Full Spec 보관본: https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4155506735 / 코드 브랜치 `archive/full-spec-v1.0.5`, 배포는 `mvp` 브랜치 전용
* 서버 설계: [ERD.md](ERD.md), [TABLE-SPEC.md](TABLE-SPEC.md), 서버 규범 `server-spec/CLAUDE.md`(server-spec 브랜치)

### 미해결 (Open)

* 내부제품은 VDI 내부에서만 사용 — 프론트를 백오피스에 추가, 계정은 백오피스 계정. 고객제품은 인터넷망.
* 파기 정책(케이스 종료 1개월 후 부분 파기)은 컴플라이언스 사인오프 필요.

---

# English Version

# ARK - Onboarding Platform PRD

> **Source of truth: this GitHub document.** The [Confluence page](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4134994324) is a **mirror** for stakeholder (business·compliance) viewing. Edit content here (GitHub) and reflect it into the Confluence mirror.
> Last synced: 2026-08-13 (against Confluence v31)

---

## 1. Overview

### 1.1 Purpose

* Today, new-customer onboarding runs through: inbound via the website → initial screening and document guidance (call, email) → document acquisition (email) → review (Jira) → account creation.
* Communication with the customer at each stage happens by call and email, which is labor-intensive and slow. This also causes a lot of customer drop-off.
* Even as customer inbound grows, onboarding work becomes the bottleneck, making rapid scaling hard.

### 1.2 Product Structure

* Customer product: the product where the customer answers questions and uploads documents.
* Internal product: the product for reviewing case information, changing status, screening, delivering revision feedback, and other onboarding work.

### 1.3 Users & Roles

| Role | What they do |
| --- | --- |
| Customer | Start the inquiry, enter information, submit documents, revise |
| Sales (SALES) | Confirm the segment, confirm document submission, hand off to ops after initial screening |
| Ops (OPS) | Screen submitted documents (before compliance handoff), guide account setup after compliance approval |
| Compliance (COMPLIANCE) | Review the survey and documents, manage rules |

### 1.4 Lifecycle (6 stages)

| # | Stage | Customer | Internal |
| --- | --- | --- | --- |
| 1 | Inquiry received | Start onboarding | Create case |
| 2 | Enter information | Enter required information | Obtain segment-decision basis |
| 3 | Auto-classification, document guidance | Enter additional information, check required documents | Decide segment, determine guidance items |
| 4 | Document submission | Upload documents | Accept submission |
| 5 | Review | Re-submit revisions on request | Sales initial screening → ops document screening → compliance review |
| 6 | Account setup | Wait until complete | Ops does final check and guides account setup |

> **EXITED** = the customer stops midway / **DROPPED** = internal judgment stops the process.

---

## 2. Screens

> The **MVP vs Full Spec** table at the end of each section covers what is excluded/reduced in the first prototype. Items not in a table are MVP = Full Spec. **MVP scope reduction confirmed (2026-08-04)**: remittance-only (CORP, INDIV), ad-hoc document addition·bulk approval·automatic business-number duplicate detection excluded. **Domestic FI added (2026-08-21)**: financial institutions + establishment country KR proceed with MVP onboarding — through second questions·documents. However, FI service selection (contract item 5, 5-1 payout / 5-2 settlement) is not finalized and is excluded from MVP. The 4-stage workflow, the 3-role revision-request permissions, document preview, and the customer timeline are retained.

### 2.1 Customer Product

* **Screen list (7)**

| Screen | Role |
| --- | --- |
| Start | Log in or create account + start case |
| First information entry | 15 first questions (conditional display), progress bar, draft-save |
| First review | Read-only confirm of first answers → on submit, run segment classification |
| Second information entry | Per-segment second questions (section grouping), auto-fill from first, draft-save |
| Second review | Confirm all first+second → on submit, enter the document-submission stage |
| Document upload | Per-segment document list + upload. In revision mode, highlight revision documents |
| Status & history | Progress timeline + messages + completion/closure guidance |

**Access, navigation**

* Account creation and login methods are open (email + OTP or email + PW or …)
    * If two emails from one corporation inquire, they must be deduplicated
    * The same corporation may retry after dropping out
    * Enable duplicate detection on a business-registration basis
* **One account – one active case** (active = a case in progress from intake to account setup). A new case is possible after closure/completion.
    * A policy is needed to delete after time passes
* On re-login, auto-route by progress:

| Progress | Destination screen |
| --- | --- |
| Answering first questions | First information entry (draft restored) |
| First submitted / answering second questions | Second information entry (draft restored) |
| Both first and second submitted | Document upload |
| Revision requested | Document upload (revision mode) |
| Internal review in progress / completed / closed | Status & history |
| No active case | Start page |

**Draft-save** — the first/second entry screens have a "Save draft" button (manual, not auto-save). Input data proceeds not-started → in-progress (draft-saved) → submitted.

**Review screen** — question+answer, read-only. To edit, go "Back" to the entry screen. From the second review you can go "Back" all the way to the first to edit. **Editing the first re-computes the segment** → if the segment changes, show guidance; keep valid second responses, leave new questions blank, and delete questions that disappeared.

**Document upload — two modes**

* _Default mode_ (document-submission stage): per-document upload/preview/re-upload; submit is enabled once all required documents are uploaded.
* _Revision mode_ (on revision request): for each document needing revision, show **the per-document reason written by the requesting staff** beside it. Undefined documents additionally requested by internal staff are shown too. Both revision and additional documents must all be uploaded to enable submit → on submit, return to the review stage that requested the revision. The customer sees **only the current round's reasons** (past rounds and the cumulative count are hidden).

**Status & history** — progress timeline + 1:1 messages with the assignee + per-status guidance text (a go-to-upload button on revision request, a start-new-case button on completion/closure).

**MVP vs Full Spec**

| Item | MVP | Full Spec |
| --- | --- | --- |
| Draft-save | Excluded — batch submit only (no in-progress state) | Draft-save + not-started/in-progress/submitted |
| Review screen | First/second merged into one screen; the flow of going back to the first to re-compute the segment is excluded | First/second separated + segment re-computation on re-edit |
| Status & history — messages | Comment area excluded (timeline, status guidance only) | Comments included |
| Business-number duplicate detection | **Excluded** — email unique only; duplicate cases for the same corporation handled manually by internal staff (drop) | Automatic duplicate detection on a business-registration basis |

### 2.2 Internal Product - Case Management

**Login** — SentBe internal staff Google login - back-office account

**Case dashboard** — shared by the 3 roles. The default filter is auto-set to the logged-in role's stage (ops handles the two stages document screening and account setup; manual change is possible within its permission scope).

List: company name, status, segment, created date, last modified date, days waiting, assignee. Default sort = last modified date descending. Top bar has the logo, role indicator, and logout.

**Case detail — 3 tabs**

| Tab | Content |
| --- | --- |
| Customer info | First+second entries + segment-decision result (read-only) |
| Documents | Document list + preview/download + review actions + create additional requested documents |
| History | Timeline / customer comments / internal notes (hidden from the customer, append-only) |

* **Document review actions**: individual `[Request revision]` and `[+ Request additional document]` (undefined documents, document name entered manually) are available to **sales, ops, and compliance alike** — on execution the case switches to the revision-requested state and the requesting review stage is recorded. `[Approve]`/`[Bulk approve]` are **compliance only**. Download is for all roles. On revision request, a per-document reason is **required**.
* **Additional document request**: depending on the case, documents not on the existing list can be requested additionally.
* **Submission history**: all submissions are preserved (no overwrite); the latest is the current review target, previous ones collapse/expand.
* **Bottom action buttons** differ by role and stage and transition the case status → see 3.1 for transition rules.

**MVP vs Full Spec**

| Item | MVP | Full Spec |
| --- | --- | --- |
| Assignee assignment | One account per role only | Round-robin auto-assignment + manual change |
| Case detail history tab | Timeline only | Timeline + customer chat + internal notes |
| Submission history | Latest submission only | All submissions preserved |
| Document download | Individual only | Individual + bulk (zip) |
| Additional document request (ad-hoc) | **Excluded** — if an additional document is needed, note it in the revision-request reason | Ad-hoc addition of documents not on the list (document name entered manually) |
| Document bulk approval | **Excluded** — individual approval only | Individual + bulk approval (compliance) |

* When one type of file is split into n parts in a single submission → **MVP is 1 file per document (no multi-upload); Full is multi-upload** (confirmed 2026-08-07, PI-127).
    * Allowed formats pdf, png, jpg / max 10MB (confirmed 2026-08-07). Virus scanning is Full.

### 2.3 Internal Product - Rule Management Panel

An internal panel to edit the rules that flow first response → classification → second questions → documents, without code changes. **COMPLIANCE-only access.** Changes apply **to new cases only** (in-progress cases are pinned to the rules at creation time; the ruleset version is recorded).

* 3-stage editing = **① classification rules** (first response → segment) / **② question rules** (segment → second questions, referencing a shared library + authoring unique questions) / **③ document rules** (segment → document checklist + sector/intersection condition slots).
* The `[+ Add country]` wizard (4 steps: basic info → classification conditions → questions → documents) defines a whole new Collection country (`SVC_COL_IDR`, etc.). entity is not an addition target (Korean business-entity classification is fixed).

**MVP vs Full Spec**

| Item | MVP | Full Spec |
| --- | --- | --- |
| Rule-management panel (whole) | Excluded — classification/question/document rules hardcoded (seed); new countries via code changes | Compliance edits live in the panel + country-addition wizard |

### 2.4 Internal Product - Account/Permission Management

Manage internal-staff accounts and roles (permissions) from a screen. **Admin-only.**

* Account list: email, name, role (sales/ops/compliance), active status.
* A role = access permissions (which case stages·screens are visible, which actions can be performed). Role changes take effect immediately.

**MVP vs Full Spec**

| Item | MVP | Full Spec |
| --- | --- | --- |
| Account/permission management screen | Excluded — manage accounts·roles via the table (data) only, no screen | Admin screen for adding accounts·assigning/changing roles·deactivating |

---

## 3. Statuses

Statuses are named by **the action the case is waiting on**, not by the assignee (role), and the responsible role of each status is mapped separately. That way, even though ops handles the two stages document screening and account setup, they are naturally distinguished as separate statuses.

### 3.1 Case Statuses + Transitions

| Customer Label | Internal Label | Code | Owner |
| --- | --- | --- | --- |
| Received | Case created | `INQUIRY_RECEIVED` | Customer (entering info) |
| Document submission required | Awaiting document submission | `DOCUMENT_SUBMISSION_REQUIRED` | Customer |
| Under review | Initial screening | `INITIAL_SCREENING` | Sales |
| Under review | Document screening required | `DOCUMENT_SCREENING_REQUIRED` | Ops |
| Under review | Review, approval required | `APPROVAL_REVIEW_REQUIRED` | Compliance |
| Account being created | Account setup required | `ACCOUNT_SETUP_REQUIRED` | Ops |
| Revision required | Revision requested (awaiting customer) | `REVISION_REQUESTED` | Customer |
| Completed | Completed | `COMPLETED` | — |
| Stopped | Closed (`closeReason`: `DROPPED`/`EXITED`) | `CLOSED` | — |

**Transition table** (actor, trigger → next status)

Normal flow (sales → ops → compliance → ops):

| from | to | Actor | Trigger |
| --- | --- | --- | --- |
| INQUIRY_RECEIVED | DOCUMENT_SUBMISSION_REQUIRED | Customer | Second survey submitted (document list generated) |
| DOCUMENT_SUBMISSION_REQUIRED | INITIAL_SCREENING | Customer | All required documents uploaded then submitted |
| INITIAL_SCREENING | DOCUMENT_SCREENING_REQUIRED | Sales | Passed initial screening |
| DOCUMENT_SCREENING_REQUIRED | APPROVAL_REVIEW_REQUIRED | Ops | Passed document screening |
| APPROVAL_REVIEW_REQUIRED | ACCOUNT_SETUP_REQUIRED | Compliance | Review approved (all documents APPROVED) |
| ACCOUNT_SETUP_REQUIRED | COMPLETED | Ops | Account setup complete |

> **The original diagram image** is in [section 3.1 of the Confluence mirror](https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4134994324) (in GitHub markdown, the text transition table is authoritative).

* The 4 review stages = `INITIAL_SCREENING`, `DOCUMENT_SCREENING_REQUIRED`, `APPROVAL_REVIEW_REQUIRED`, `ACCOUNT_SETUP_REQUIRED`.
* On rejection/closure, a reason is required (recorded in the timeline). Document `[Approve]`/`[Bulk approve]` are compliance only.
* Per-role view and change permissions are based on each role's owned status. Sales can view from `DOCUMENT_SUBMISSION_REQUIRED` onward.
* Automatic dropout (EXITED) — see 3.3.
* On revision request, the case switches to `REVISION_REQUESTED` and records the requesting review stage in `revisionRequestedFrom`. On customer re-submission, it returns to that stage.

### 3.2 Document Statuses + Transitions

| Customer Label | Internal Label | Code |
| --- | --- | --- |
| Not applicable | Not submitted | `NOT_REQUESTED` |
| Submission required | Submission requested | `REQUESTED` |
| Submitted | Under review | `SUBMITTED` |
| Revision required | Revision requested | `REVISION_REQUIRED` |
| Approved | Approved | `APPROVED` |

Transitions: `NOT_REQUESTED → REQUESTED → SUBMITTED →` (`APPROVED` or `REVISION_REQUIRED → SUBMITTED` repeat). If a segment change makes it unnecessary, `REQUESTED → NOT_REQUESTED` (exception).

### 3.3 Global Rules

* **Revision return**: store the review stage that issued the revision request or additional document request → on customer re-submission, return to that stage (each of the sales, ops, compliance review stages).
* **Automatic dropout**: after n days (separately configured) of inactivity in a state that requires customer action, auto-transition to `CLOSED (EXITED)`. Not applied to internal review states.

**MVP vs Full Spec**

| Item | MVP | Full Spec |
| --- | --- | --- |
| Automatic dropout timer | Excluded — internal manual closure only | Auto `CLOSED (EXITED)` after 5 days of inactivity |

> Case/document statuses, the transition table, and the workflow are identical for MVP·Full. **The 4-stage workflow (sales → ops → compliance → ops) and the 3-role revision-request permissions are retained in MVP too (confirmed 2026-08-04).**

---

## 4. Classification, Questions, Documents

A pipeline flowing first response → segment decision → per-segment second questions → per-segment documents. _Reflects the SentBiz Rule review (v1.0.5, BO 4143349976) — implementation in PI-115~120._

### 4.1 Segment Model

3 axes. The code (system identifier) is separated from the display name.

| Axis | Values |
| --- | --- |
| **Entity** (business entity) | `ENTITY_CORP` (Korean corporation) / `ENTITY_INDIV` (Korean individual) / `ENTITY_FI` (financial institution, Collection user, including overseas corporation/individual) |
| **Service** (service used) | `SVC_PAYOUT` (remittance) / `SVC_COL_KRW` / `SVC_COL_VND` / `SVC_COL_ETC` (fallback for undefined countries). Collection is per **collection country** |
| **Sector** (industry) | A sub-attribute of KRW Collection. Trading (B2B/B2C), Consulting, Development/Design, Advertising/Marketing, Research, IT, Coupang seller — decided by the **Main Business Activity** selection in the KRW second questions |

* **Union + dedup**: one customer can have multiple segments (remittance+collection, etc.), so service and sector are arrays. **Second questions and documents are decided by the union of the held segments and deduplicated by code (type).**
* New Collection countries are added in the rule panel (2.3).

### 4.2 First Questions → Segment Mapping

**First questions (15 confirmed)** — company name, contact (name/title/phone/email), services used (multiple), collection country (if collecting), remittance origin/destination country (if remitting), business type, establishment country, transaction volume (required), inflow channel, additional inquiry, privacy consent. See the survey sheet for the full text. _Reflects the first-intake question review (v1.0.5) — transaction count removed, transaction volume made required, "other currency" is free-entry when "other" is selected in the select._

**Step 1 — entity decision** (business type #10 + establishment country #11, a fully closed 6-cell)

| Condition | → entity |
| --- | --- |
| Collection selected → business type auto-fixed to financial institution | `ENTITY_FI` |
| Financial institution (regardless of country) | `ENTITY_FI` |
| Corporation/individual + overseas | `ENTITY_FI` |
| Corporation + Korea | `ENTITY_CORP` |
| Individual + Korea | `ENTITY_INDIV` |

> Summary condition: FI = `uses Collection OR financial institution OR establishment country = overseas`. The establishment country is received as the explicit selection `KR` (no free-text matching). The business-type option label is written as 'financial institution (PG·PSP·MSB, etc.)' (formerly 'financial business', reflecting review v1.0.5). **MVP: the collection option is not shown in the first-question services, remittance is fixed as selected (the collection-country question is also hidden) — confirmed 2026-08-05, PI-126. FI decision branch (revised 2026-08-21): financial institution + establishment country KR → onboard as domestic FI (remittance). Overseas establishment (corporation·individual·overseas FI) → show a 'coming soon' notice and close. That is, the MVP targets = CORP, INDIV, domestic FI (all remittance).**

**Step 2 — service addition** (service #6 + collection country #7, multiple)

| Condition | → service |
| --- | --- |
| Includes remittance | `SVC_PAYOUT` |
| Collection + Korea | `SVC_COL_KRW` |
| Collection + Vietnam | `SVC_COL_VND` |
| Collection + other (undefined) | `SVC_COL_ETC` (fallback) |

**Final segment = 1 entity + the union of multiple services.** The collection-country options are dynamically generated from the registered service segments (adding a country in the panel also reflects into first #7).

### 4.3 Second Questions

**Management model — question library + segment mapping.** A question is defined once in a single source (the library) and segments reference it by check (no copying). Editing the library in one place reflects across all segments.

* **3 tiers**: common questions (auto-included in all segments) / entity-unique / service, currency-unique. A segment's questions = common ∪ unique, deduplicated by question code.
* **Common question composition** (Rule review v1.0.5): business registration number, business category (up-tae), business item (jong-mok), VASP status, transaction purpose (settlement agency for sales proceeds/other), source of funds, tax classification (taxable/exempt), homepage address, representative contact, main settlement-agency requested items, company size, listing status, establishment date + BO fields (name, date of birth, nationality, country of residence). Labels follow the business-registration-certificate wording (business category/item).
* **Option filter override**: even a common question can expose only a subset of options per segment (e.g., source of funds — CORP·FI 5 (business income/real-estate rental/real-estate transfer/financial income/other), INDIV all 8).
* **Display conditions** are `[question]=[value]` structured (no free text). **Repeated entry** (owners, directors, executives of n people) uses a repeat flag + sub-fields — no upfront count question; grow via the [Add] button.
* **Display method**: section-based multi-step wizard (progress bar, step save/restore). Two sections per screen by default (three if small). First values auto-fill into the second + are editable.

**Per-segment unique questions (summary)** — the survey sheet is the single source for the full text and options. _MVP active = Corporate, Individual, **domestic FI** (through questions·documents, excluding service selection/contract item 5). KRW·VND·other Collection and overseas FI are Full Spec._

| Segment | Screens | Core unique questions |
| --- | --- | --- |
| Corporate | 2 screens | Company name (KO/EN), company contact, business address, corporation type (**non-profit selection = onboarding not allowed**), corporation registration number, representative type (sole/joint/**several** — for joint·several, all entered repeatedly) / **separate BO section**: skip-verification check → 25% natural person → step 2 (largest shareholding, etc.) → step 3 (representative=BO); BO entered repeatedly via [Add] |
| Individual | 2 screens | Trade name (KO/**EN**), contact, business address, residence, representative info (name KO/EN, date of birth, gender, nationality) / whether representative=BO (if no, collect BO info) |
| FI (domestic) — **MVP included** | 2 screens (reduced) | Legal name (KO/EN), corporation type, corporation registration number, website, business address, establishment date/country, company·representative contact, representative (name, date of birth, gender, nationality) / 25%+ owner repeated entry (same structure as CORP BO), AML sanctions history. **Removed**: license (authority/type/issuance/expiry), external auditor, FI/MSB/PSP intermediation, parent company, AML policy holding, duplicate items. **Service selection (contract item 5, 5-1/5-2) is excluded from MVP — reflected separately after confirmation (Esther)** |
| KRW Collection — Full only | 4 sections | A basic info (FI transaction history, sub-merchant holding, etc.) / B business nature (**Main Business Activity option → sector·document branching**, business description, source of funds) / C products·services (purpose of use, number of virtual accounts, reason for fixed-account issuance, expected transaction volume, depositor relationship/type) / D contact (name, title, contact). Items duplicated with common·FI are auto-filled + deduped |
| VND Collection — Full only | +4 questions | Main business activity, account-opening purpose, depositor relationship, depositor type |
| Other Collection — Full only | — | TBD (placeholder) |

* BO fields (name, date of birth, nationality, country of residence) are common; the BO **determination logic** is entity-unique.

### 4.4 Documents

**Decision logic**: entity-segment documents + service-segment documents = the final list (union). KRW has additional documents per sector (Main Business Activity). **Dedup by standard type code** (same meaning = same type, shown as 1 item on the customer screen). But if scope or format differs, keep separate types (e.g., bank-account copy ≠ bank transaction statement).

Example standard types: `BIZ_REGISTRATION`, `DIRECTOR_LIST`, `SHAREHOLDER_LIST`, `ID_COPY` (representative ID), `CONTRACT`, `SAMPLE_INVOICE_SHIPPING`. _WEBSITE_URL is removed from documents — moved to a common question (v1.0.5)._

**Explicit document conditions** (Rule review v1.0.5): issuance validity period (corporate registry extract, corporate seal certificate, shareholder list — issued within 3 months), sealing (shareholder list), target scope (corporate seal — collected from all several·joint representatives), real-transaction basis (contract — the actual contract, masking-allowed notice / invoice — the actual-transaction copy).

**Conditional documents, 2 axes** (rule panel document-tab slots):

* **Sector condition**: `sector = value → additional document` (per KRW Collection industry, the Coupang-seller special path).
* **Intersection (entity) condition**: exclusive to an `entity + service` combination. E.g., `{FI + KRW}` → KYC Documents for Sample Merchants.

**Per-segment documents (summary)** — see the Rule review's sub document page for the full list. _MVP is Corporate, Individual, **domestic FI**._

| Segment | Document count | Notes |
| --- | --- | --- |
| Corporate | 8 required + 2 optional | Business registration certificate, corporate registry extract, sealed shareholder list, representative ID, corporate seal, bank account, actual contract, invoice + optional: shipping materials, customs documents (new) |
| Individual | 4 required + 2 optional | Business registration certificate, representative ID, bank account, actual-transaction invoice + optional: contract (required→optional), shipping materials (B/L, AWB) |
| FI (domestic) — **MVP included** | 8 types | 6 common (business registration certificate, registry extract, seal, representative ID, shareholder list, corporate-name bank account) + financial-license copy, AML internal-control regulations. Reduced from the previous 13 (audit report, AML audit, org chart, ownership chart, Wolfsberg, Board Resolution excluded). Overseas FI policy TBD (Full) |
| KRW Collection — Full only | 6 base + per-sector | 6 base + optional (Articles of Incorporation, office photo) + per-Main-Business-Activity additional documents, Coupang 3. Submission guidance: include a translation for non-English, reason if unable to submit, prefer actual-transaction samples, sensitive info may be blinded |
| VND Collection — Full only | 16 types | Company Charter, Certificate of Incorporation, accountant documents, etc. (some conditional, TBD) |

**MVP vs Full Spec**

| Item | MVP | Full Spec |
| --- | --- | --- |
| Entity segment | **CORP, INDIV, domestic FI** (financial institution + establishment KR) — overseas-established FI is closed with 'coming soon' | CORP, INDIV, FI (domestic·overseas) |
| Service segment | **Remittance only** — collection option not shown in first questions, remittance selection fixed (PI-126) | Remittance + KRW, VND, other Collection |
| FI second questions, documents | **Domestic FI included** (questions·documents) — service selection/contract item 5 excluded | Full domestic-FI revision (including service selection) + overseas FI |
| KRW / VND / other Collection second questions, documents | Excluded | KRW 4 sections (A~D), VND 4 questions, per-sector documents, etc. |
| entity × service intersection conditional documents (FI + KRW → KYC) | Excluded — since the KRW segment is excluded, the FI+KRW combination itself does not exist (domestic FI is remittance-only) | Applied |

> The 15 first questions, the Corporate/Individual/domestic-FI second questions and documents, and the question-library + mapping model are identical for MVP·Full (domestic-FI service selection is excluded from MVP).

---

## 5. MVP Summary

MVP differences are organized in the **MVP vs Full Spec** tables of each section (chapter 2 screens, chapter 3 statuses, chapter 4 classification·questions·documents). The below is an at-a-glance view. _Scope reduction confirmed 2026-08-04._

* **Excluded** — **all of Collection, overseas-established FI, FI service selection (contract item 5, 5-1/5-2) (MVP entities = CORP·INDIV·domestic FI, all remittance — the collection option is not shown in the first questions and remittance is fixed; only financial institution + establishment KR proceeds as domestic FI, overseas-established FI is closed with 'coming soon')**, ad-hoc document request, document bulk approval, automatic business-number duplicate detection, text communication (comments), in-app notifications, the rule-management panel, the account/permission management screen, the automatic dropout timer, entity×service intersection conditional documents.
* **Reduced** — assignee assignment (manual only), submission history (latest only), draft-save (batch submit only), document download (individual only), review screen (single merged), multi-upload (1 file per document).
* **Retained (confirmed)** — the 4-stage workflow (sales → ops → compliance → ops), the 3-role revision-request permissions, automatic segment classification + automatic document guidance, the revision loop (per-document reasons), document preview, the customer timeline.

---

## References

* Original PRD (initial): https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4113727492
* Single source for the full question text (wording, options) — the survey sheet "ARK Customer-Type Survey": https://docs.google.com/spreadsheets/d/1b7ZMAWl6QIgLT-fnRnrt3r2fdmLUKc785VzyRk1J3pQ/edit
* SentBiz Rule review (v1.0.5): https://sentbe-product.atlassian.net/wiki/spaces/BO/pages/4143349976 — reflected in tickets PI-114~120
* Full Spec archive: https://sentbe-product.atlassian.net/wiki/spaces/NSBS/pages/4155506735 / code branch `archive/full-spec-v1.0.5`; deployment is `mvp`-branch only
* Server design: [ERD.md](ERD.md), [TABLE-SPEC.md](TABLE-SPEC.md), server norm `server-spec/CLAUDE.md` (server-spec branch)

### Open

* The internal product is used only inside VDI — the frontend is added to the back office, accounts are back-office accounts. The customer product is on the internet.
* The disposal policy (partial disposal 1 month after case closure) requires compliance sign-off.
