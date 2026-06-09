const STORAGE_KEY = "arc-onboarding-customer";

const segments = {
  corporate: {
    name: "법인 사업자",
    description: "일반 법인 고객. 대표자와 실제소유자 확인이 핵심이다.",
    questions: [
      "기본 정보: 회사명, 사업자등록번호, 연락처, 업종, 업태, 사업장 주소",
      "법인 정보: 법인 유형, 법인 등록번호, 법인 국적, 본점 주소",
      "대표자 정보: 대표자 1 기본값, 공동대표일 경우 대표자 2 추가",
      "실제소유자 확인: 면제 여부, BO 1 기본값, 다수일 경우 BO 2 추가",
      "추가 확인: 거래 목적, 가상자산취급업소 여부, 자금원, 법인구분, 상장정보, 설립일",
    ],
    documents: [
      "사업자등록증",
      "법인등기부등본",
      "주주명부",
      "대표자 신분증 사본",
      "법인인감증명서",
      "은행계좌 사본",
      "계약서",
      "샘플 인보이스 및 선적자료",
      "홈페이지 주소",
    ],
    extraDocuments: ["공동대표 여부에 따라 대표자 신분증 사본 복수 제출"],
  },
  individual: {
    name: "개인 사업자",
    description: "개인사업자 / 개인 엔터티. 대표자와 BO 동일 여부가 분기 기준이다.",
    questions: [
      "기본 정보: 사업체명, 사업자등록번호, 연락처, 업종, 업태, 사업장 주소",
      "대표자 정보: 성명, 생년월일, 성별, 국적",
      "실제소유자 확인: 대표자와 동일 여부, 다를 경우 BO 상세 정보",
      "추가 확인: 거래 목적, 가상자산취급업소 여부, 자금원",
    ],
    documents: [
      "사업자등록증",
      "대표자 신분증 사본",
      "은행계좌 사본",
      "계약서",
      "샘플 인보이스 및 선적자료",
      "홈페이지 주소",
    ],
    extraDocuments: ["BO가 대표자와 다를 경우 BO 확인 정보 추가"],
  },
  fi: {
    name: "금융기관",
    description: "금융기관 / 송금대행사 / 환전회사. 가장 긴 인테이크와 높은 수준의 검토가 필요하다.",
    questions: [
      "섹션 A: 기본 정보, 법적 형태, 등록 국가, 웹사이트, 주소, 지점 수, 라이선스, 대표자",
      "섹션 B: Collection / Payout 선택, 수취 통화, 거래 목적, 발신 국가, 상위 고객 구조, 가상자산 여부",
      "섹션 C: 자금원 및 재산원",
      "섹션 D: 모회사, 25% 이상 소유자, 이사, 고위 경영진, 파산 이력",
      "섹션 E: 법률 / AML, FATF 관할, 제재 / 소송 / 조사 이력",
      "섹션 F: 컴플라이언스 / 리스크 정책 및 직원 교육",
    ],
    documents: [
      "사업자등록",
      "송금 라이선스 또는 준하는 문서",
      "내부 정책 (컴플라이언스 / 리스크)",
      "최근 감사 재무제표",
      "최근 AML 감사 보고서",
      "조직도",
      "지분 구조도",
      "공식 문서 - 이사 명단",
      "공증된 신분증 사본",
      "Wolfsberg 자금세탁방지 설문서",
      "이사회 결의서",
      "은행계좌 증빙",
      "샘플 가맹점 2곳의 KYC 문서 세트",
    ],
    extraDocuments: ["KRW Collection FI일 경우 샘플 가맹점 KYC 문서 세트 필수"],
  },
  krw: {
    name: "원화 수금",
    description: "서비스 레벨 세그먼트. 엔터티 레벨 질문 위에 업종별 문서가 추가된다.",
    questions: [
      "업종 / 하위 세그먼트 선택: Trading, Consulting, Development / Design, Advertising / Marketing, Research, IT & Computer, Coupang",
      "엔터티 레벨 세그먼트 질문 재사용",
    ],
    documents: [
      "사업자등록증",
      "이사 명단",
      "주주 명단",
      "정관",
      "신분증 사본 - CEO, 이사, 25%+ UBO",
      "은행 / 전자지갑 명세서",
    ],
    extraDocuments: [
      "Trading (B2B): 선적 문서, 세관 신고서 또는 수출입 라이선스, 샘플 수출 인보이스",
      "Trading (B2C): 물류 전표, 온라인 플랫폼 판매 기록, 구매자 대상 샘플 인보이스",
      "Consulting: 고객 계약서, 컨설팅 산출물, 포트폴리오",
      "Development / Design: 고객 계약서, 프로젝트 기획 / 스크린샷, 포트폴리오",
      "Advertising / Marketing: 고객 계약서, 광고 산출물, 마케팅 제안서",
      "Research: 고객 계약서, 연구 산출물",
      "IT & Computer: 고객 계약서, 시스템 문서, 프로젝트 배포 증빙",
      "Coupang 특수 케이스: 판매자 URL / 스크린샷, 정산서, 서비스 계약서",
    ],
  },
  vnd: {
    name: "베트남 동 수금",
    description: "현재 CN / HK 기업 우선 범위. 조건부 서류가 많다.",
    questions: [
      "법인명, 사업자 번호, 등록 사업장 주소, 설립지",
      "웹사이트, 담당자 이름, 연락처, 담당자 이메일",
      "엔터티 유형, 업종 유형, 주요 사업 활동, 예상 월 거래 규모",
      "계좌 개설 목적, 입금자 관계, 입금자 법인/개인 여부",
    ],
    documents: [
      "사업자등록증",
      "회사 정관",
      "설립 증명서",
      "이사 명단",
      "주주 구조도",
      "여권 / 신분증 사본 - UBO, 이사, 대표자",
      "이사회 결의서",
      "라이선스",
      "UBO, 이사, 대표자, 주주의 주소",
      "은행 명세서",
      "샘플 계약서",
      "샘플 선적 문서",
      "회계사 신분증",
      "회계사 주소 증빙",
      "회사 로고가 보이는 사무실 사진",
      "상품 / 서비스 웹사이트 이미지",
    ],
    extraDocuments: [
      "회사 정관: 보유 시 제출, 없으면 부재 확인",
      "이사회 결의서: 서명자가 법적 대표자가 아닌 경우만",
      "라이선스: 해당 시 제출",
      "은행 명세서: SentBe 앱 사용자에 한함",
      "회계사 관련 문서: VN 법인에 한함",
    ],
  },
  id: {
    name: "인도네시아 수금",
    description: "현재는 자리표시자다. 질문 구조와 제출 서류가 아직 정의되지 않았다.",
    questions: ["추후 정의 예정"],
    documents: ["추후 정의 예정"],
    extraDocuments: ["없음"],
  },
};

function determineSegment() {
  const serviceType = document.getElementById("service-type")?.value;
  const collectionCountry = document.getElementById("collection-country")?.value;
  const entityType = document.getElementById("entity-type")?.value;

  if (serviceType === "collection" && collectionCountry === "KR") return "krw";
  if (serviceType === "collection" && collectionCountry === "VN") return "vnd";
  if (serviceType === "collection" && collectionCountry === "ID") return "id";
  if (entityType === "fi") return "fi";
  if (entityType === "individual") return "individual";
  return "corporate";
}

function saveAuthState() {
  const payload = {
    email: document.getElementById("email")?.value || "",
    signedIn: true,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadAuthState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function renderSurvey() {
  const key = determineSegment();
  const segment = segments[key];

  const name = document.getElementById("segment-name");
  const description = document.getElementById("segment-description");
  const chip = document.getElementById("segment-chip");

  if (!name) return;

  name.textContent = segment.name;
  description.textContent = segment.description;
  chip.textContent = segment.name;
}

const authForm = document.getElementById("auth-form");
if (authForm) {
  authForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveAuthState();
    window.location.href = "./survey.html";
  });
}

if (document.getElementById("segment-name")) {
  const authState = loadAuthState();
  if (!authState.signedIn) {
    window.location.href = "./login.html";
  } else {
    document.querySelectorAll("select").forEach((select) => {
      select.addEventListener("change", renderSurvey);
    });
    renderSurvey();
  }
}
