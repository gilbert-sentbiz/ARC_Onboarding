const STORAGE_KEY = "arc-onboarding-customer";

const segments = {
  corporate: {
    name: "법인 사업자",
    description: "대표자와 실제소유자 관련 정보를 입력한다.",
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
    detailSections: [
      ["섹션 1", "기본 정보", "가맹점 기본 정보와 법인 기본값 입력"],
      ["섹션 2", "실제 소유자 확인사항", "BO 면제 여부와 실제 소유자 정보 입력"],
      ["섹션 3", "추가 확인사항", "거래 목적, 자금원, 상장 여부 등 입력"],
    ],
    detailFields: [
      "회사명 (한글)",
      "회사명 (영문)",
      "사업자등록번호",
      "법인 등록번호",
      "사업장 주소",
      "대표자 1 성명 / 생년월일 / 국적",
      "실제소유자 1 성명 / 생년월일 / 거주국가",
      "거래 목적",
      "자금 및 재산 원천",
      "설립일자",
    ],
  },
  individual: {
    name: "개인 사업자",
    description: "대표자와 실제소유자 관련 정보를 입력한다.",
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
    detailSections: [
      ["섹션 1", "기본 정보", "사업체 기본 정보와 대표자 기본값 입력"],
      ["섹션 2", "실제 소유자 확인", "대표자와 BO 동일 여부 확인"],
      ["섹션 3", "추가 확인사항", "거래 목적과 자금원 입력"],
    ],
    detailFields: [
      "사업체명",
      "사업자등록번호",
      "연락처",
      "사업장 주소",
      "대표자 성명 / 생년월일 / 성별 / 국적",
      "BO 동일 여부",
      "BO 성명 / 생년월일 / 거주국가",
      "거래 목적",
      "자금 및 재산 원천",
    ],
  },
  fi: {
    name: "금융기관",
    description: "금융기관 관련 정보를 상세히 입력한다.",
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
    detailSections: [
      ["섹션 A", "기본 정보", "법인, 라이선스, 지점, 대표자, 웹사이트 등"],
      ["섹션 B", "원하는 서비스", "Collection / Payout, 발신 국가, 가상자산 여부"],
      ["섹션 C", "자금원 및 재산원", "자본, 투자자산, 이익, 기타 자금원"],
      ["섹션 D", "소유 및 경영 구조", "모회사, 25% 이상 소유자, 이사, 경영진"],
      ["섹션 E", "법률 및 AML", "제재, 조사, 소송, FATF 관할 관련 질문"],
      ["섹션 F", "정책 및 교육", "컴플라이언스 / 리스크 정책과 직원 교육 여부"],
    ],
    detailFields: [
      "등록 법인명",
      "법적 형태",
      "설립 / 등록 일자 및 국가",
      "라이선스 유형 / 발급일 / 만료일",
      "SentBe에서 원하는 서비스",
      "Collection 수취 통화",
      "상위 고객 거래 구조",
      "25% 이상 소유자 정보",
      "AML 위반 / 조사 / 소송 이력",
      "서면 정책 및 직원 교육 여부",
    ],
  },
  krw: {
    name: "원화 수금",
    description: "업종과 사업 관련 정보를 추가로 입력한다.",
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
    detailSections: [
      ["항목 1", "업종 / 하위 분류", "업종에 따라 필요한 정보가 달라진다."],
      ["항목 2", "기본 정보", "사업 기본 정보를 이어서 입력한다."],
    ],
    detailFields: [
      "업종 / 하위 세그먼트",
      "기본 정보",
      "실제 소유자 정보",
      "추가 확인사항",
    ],
  },
  vnd: {
    name: "베트남 동 수금",
    description: "사업과 거래 관련 정보를 추가로 입력한다.",
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
    detailSections: [
      ["단일 폼", "기본 사업 정보", "법인명, 사업자 번호, 주소, 설립지, 웹사이트 등"],
      ["거래 정보", "거래 규모 및 목적", "예상 월 거래 규모, 계좌 개설 목적 등"],
      ["Collection 추가값", "입금자 관계", "입금자와의 관계, 법인/개인 여부"],
    ],
    detailFields: [
      "법인 / 사업체 전체 명칭",
      "사업자 번호",
      "등록 사업장 주소",
      "설립지",
      "사업 웹사이트",
      "담당자 이름 / 연락처 / 이메일",
      "엔터티 유형",
      "업종 유형",
      "예상 월 거래 규모",
      "계좌 개설 목적",
      "입금자와의 관계",
      "입금자가 법인인지 개인인지 여부",
    ],
  },
  id: {
    name: "인도네시아 수금",
    description: "현재 준비 중인 입력 흐름이다.",
    questions: ["추후 정의 예정"],
    documents: ["추후 정의 예정"],
    extraDocuments: ["없음"],
    detailSections: [["안내", "준비 중", "입력 항목을 준비 중이다."]],
    detailFields: ["추후 정의 예정"],
  },
};

function determineSegment() {
  const serviceType = document.getElementById("service-type")?.value;
  const serviceCountry = document.getElementById("service-country")?.value;
  const entityType = document.getElementById("entity-type")?.value;

  if (serviceType === "collection" && serviceCountry === "KR") return "krw";
  if (serviceType === "collection" && serviceCountry === "VN") return "vnd";
  if (serviceType === "collection" && serviceCountry === "ID") return "id";
  if (entityType === "fi") return "fi";
  if (entityType === "individual") return "individual";
  return "corporate";
}

function updateServiceCountryField() {
  const serviceType = document.getElementById("service-type");
  const countryLabel = document.getElementById("country-label");
  const serviceCountry = document.getElementById("service-country");

  if (!serviceType || !countryLabel || !serviceCountry) return;

  if (serviceType.value === "collection") {
    countryLabel.textContent = "수금 국가";
    serviceCountry.innerHTML = `
      <option value="KR">한국 (KRW)</option>
      <option value="VN">베트남 (VND)</option>
      <option value="ID">인도네시아 (IDR)</option>
    `;
  } else {
    countryLabel.textContent = "지급 국가";
    serviceCountry.innerHTML = `
      <option value="KR">한국</option>
      <option value="US">미국</option>
      <option value="VN">베트남</option>
      <option value="SG">싱가포르</option>
    `;
  }
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
  if (!segments[key]) return;
}

function renderDetails() {
  const key = determineSegment();
  const segment = segments[key];
  const sectionList = document.getElementById("detail-section-list");
  const fields = document.getElementById("detail-fields");

  if (!sectionList) return;

  sectionList.innerHTML = segment.detailSections
    .map(
      ([index, title, copy]) => `
        <article class="detail-section-card">
          <span>${index}</span>
          <strong>${title}</strong>
          <p>${copy}</p>
        </article>`
    )
    .join("");

  fields.innerHTML = segment.detailFields
    .map(
      (field, index) => `
        <article class="detail-field-card">
          <span>항목 ${index + 1}</span>
          <strong>${field}</strong>
          <p>이 단계에서 입력해야 하는 정보입니다.</p>
        </article>`
    )
    .join("");
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
    updateServiceCountryField();
    document.querySelectorAll("select").forEach((select) => {
      select.addEventListener("change", renderSurvey);
    });
    document.getElementById("service-type")?.addEventListener("change", () => {
      updateServiceCountryField();
      renderSurvey();
    });
    renderSurvey();
  }
}

if (document.getElementById("detail-section-list")) {
  const authState = loadAuthState();
  if (!authState.signedIn) {
    window.location.href = "./login.html";
  } else {
    renderDetails();
  }
}
