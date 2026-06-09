const baseFields = [
  "서비스 유형",
  "수금 국가",
  "지급 국가",
  "엔터티 유형",
  "설립 국가",
];

const segments = {
  corporate: {
    name: "SentBiz Corporate",
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
    customerStatus: "접수 완료",
  },
  individual: {
    name: "SentBiz Individual",
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
    customerStatus: "접수 완료",
  },
  fi: {
    name: "FI",
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
    customerStatus: "검토중",
  },
  krw: {
    name: "KRW Collection",
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
    customerStatus: "검토중",
  },
  vnd: {
    name: "VND Collection",
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
    customerStatus: "검토중",
  },
  id: {
    name: "ID Collection",
    description: "현재는 자리표시자다. 질문 구조와 제출 서류가 아직 정의되지 않았다.",
    questions: ["추후 정의 예정"],
    documents: ["추후 정의 예정"],
    extraDocuments: ["없음"],
    customerStatus: "접수 완료",
  },
};

const flow = [
  "문의 접수",
  "정보 입력",
  "자동 분류 및 서류 안내",
  "서류 제출",
  "추가 검토",
  "운영 확인",
  "이탈 케이스 관리",
];

const caseStates = [
  ["INQUIRY_RECEIVED", "접수 완료", "케이스 생성"],
  ["SALES_REVIEW_REQUIRED", "검토중", "영업 검토 필요"],
  ["COMPLIANCE_REVIEW_REQUIRED", "검토중", "컴플라이언스 검토 필요"],
  ["OPS_REVIEW_REQUIRED", "계정 생성중", "운영 확인 필요"],
  ["COMPLETED", "완료", "완료"],
  ["CLOSED", "진행 중단", "종료"],
];

const customerHistory = [
  "6월 2일 정보 입력 완료",
  "6월 2일 기본 서류 요청 생성",
  "6월 3일 문서 제출 완료",
  "6월 4일 보완 요청 수신",
];

const messages = [
  { from: "컴플라이언스", at: "6월 4일 10:14", text: "은행계좌 사본과 계약서 최신본을 다시 제출해 주세요." },
  { from: "고객", at: "6월 4일 13:05", text: "계약서 재업로드했고, 은행계좌 사본도 첨부했습니다." },
  { from: "운영", at: "6월 5일 16:30", text: "계정 생성 후 로그인 안내를 전달드릴 예정입니다." },
];

const roleViews = {
  sales: {
    summary: "문의 직후 케이스를 분류하고, 이탈 케이스를 기록한 뒤 컴플라이언스로 넘긴다.",
    actions: ["케이스 분류", "고객 유형 / 거래 유형 판단", "이탈 케이스 CRM 기록", "다음 단계 인계"],
    checks: ["입력값 누락 여부", "세그먼트 판단 가능 여부", "후속 액션 시점", "이탈 여부"],
  },
  compliance: {
    summary: "제출 서류와 자동 안내 결과를 검토하고, 추가 서류 요청 / 승인 / 드롭을 처리한다.",
    actions: ["자동 안내 모니터링", "문서 검토", "보완 요청", "승인 또는 드롭", "운영 인계"],
    checks: ["공통 필수 서류", "세그먼트별 추가 서류", "문서 오류", "드롭 판단 근거"],
  },
  ops: {
    summary: "승인된 케이스를 확인하고 서류를 내려받은 뒤 고객에게 계정을 안내한다.",
    actions: ["승인 케이스 확인", "문서 다운로드", "계정 안내 발송", "완료 처리"],
    checks: ["승인 상태 확인", "필수 서류 존재 여부", "고객 정보 확인", "안내 메시지 정확성"],
  },
};

const demoCases = [
  ["ARC-2401", "SentBiz Corporate", "검토중", "민지 / 영업"],
  ["ARC-2402", "FI", "검토중", "Cecille / 컴플라이언스"],
  ["ARC-2403", "KRW Collection", "계정 생성중", "Operations"],
];

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

const topTabs = document.querySelectorAll(".top-tab");
const views = document.querySelectorAll(".view");

topTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const { view } = tab.dataset;
    topTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
    views.forEach((panel) => panel.classList.toggle("is-active", panel.id === `view-${view}`));
  });
});

function renderOverview() {
  document.getElementById("flow-list").innerHTML = flow
    .map(
      (item, index) => `
        <li>
          <span class="flow-index">${index + 1}</span>
          <h3>${item}</h3>
        </li>`
    )
    .join("");

  document.getElementById("segment-grid").innerHTML = Object.values(segments)
    .map(
      (segment) => `
        <article class="segment-card">
          <span class="segment-tag">Segment</span>
          <h3>${segment.name}</h3>
          <p>${segment.description}</p>
        </article>`
    )
    .join("");

  document.getElementById("state-stack").innerHTML = caseStates
    .map(
      ([code, customerLabel, internalLabel], index) => `
        <article class="state-card">
          <span class="segment-tag">${index + 1}</span>
          <h3>${code}</h3>
          <p>고객: ${customerLabel}</p>
          <p>내부: ${internalLabel}</p>
        </article>`
    )
    .join("");
}

function renderSegmentOptions() {
  const select = document.getElementById("segment-select");
  select.innerHTML = Object.entries(segments)
    .map(([key, segment]) => `<option value="${key}">${segment.name}</option>`)
    .join("");
}

function renderCustomerView(segmentKey = "corporate") {
  const segment = segments[segmentKey];
  document.getElementById("customer-case-status").textContent = segment.customerStatus;
  document.getElementById("customer-next-title").textContent = segment.name;
  document.getElementById("customer-next-copy").textContent =
    "공통 인테이크 입력값을 기준으로 이 세그먼트가 판정되었고, 아래 질문과 제출 서류가 고객에게 노출된다.";

  document.getElementById("customer-stats").innerHTML = [
    ["현재 세그먼트", segment.name, "고객 유형과 처리 기준이 자동으로 반영된다."],
    ["공통 질문", `${baseFields.length}개`, "모든 고객이 공통으로 입력해야 하는 기준 정보다."],
    ["기본 서류", `${segment.documents.length}개`, "현재 세그먼트에 기본으로 필요한 제출 항목이다."],
    ["추가 서류", `${segment.extraDocuments.length}개`, "조건에 따라 추가되거나 검토되는 항목이다."],
  ]
    .map(
      ([label, value, copy]) => `
        <article class="stat-card">
          <span>${label}</span>
          <strong>${value}</strong>
          <p>${copy}</p>
        </article>`
    )
    .join("");

  document.getElementById("customer-base-fields").innerHTML = baseFields.map((field) => `<li>${field}</li>`).join("");
  document.getElementById("customer-segment-fields").innerHTML = segment.questions.map((field) => `<li>${field}</li>`).join("");
  document.getElementById("customer-documents").innerHTML = segment.documents.map((item) => `<li>${item}</li>`).join("");
  document.getElementById("customer-extra-documents").innerHTML = segment.extraDocuments.map((item) => `<li>${item}</li>`).join("");
  document.getElementById("customer-history").innerHTML = customerHistory.map((item) => `<li>${item}</li>`).join("");

  document.getElementById("customer-messages").innerHTML = messages
    .map(
      (message) => `
        <article class="message">
          <div class="message__meta">
            <strong>${message.from}</strong>
            <span>${message.at}</span>
          </div>
          <div>${message.text}</div>
        </article>`
    )
    .join("");

  document.getElementById("customer-timeline").innerHTML = [
    ["1", "로그인 / 가입", "이메일과 비밀번호를 입력한다.", "is-complete"],
    ["2", "최초 설문", "분류 기준이 되는 정보를 입력한다.", "is-active"],
    ["3", "서류 제출", "필요한 서류만 업로드한다.", ""],
    ["4", "검토 / 계정 생성", "검토 완료 후 계정 안내를 받는다.", ""],
  ]
    .map(
      ([step, title, copy, stateClass]) => `
        <article class="timeline-step ${stateClass}">
          <span>STEP ${step}</span>
          <strong>${title}</strong>
          <p>${copy}</p>
        </article>`
    )
    .join("");

  document.getElementById("intake-fields").innerHTML = segment.questions
    .slice(0, 4)
    .map((item) => `<div class="message"><strong>${item}</strong></div>`)
    .join("");
}

function renderInternalView(roleKey = "sales", segmentKey = "corporate") {
  const role = roleViews[roleKey];
  const segment = segments[segmentKey];
  document.getElementById("role-summary").innerHTML = `
    <span class="role-chip">${roleKey.toUpperCase()}</span>
    <p>${role.summary}</p>
  `;

  document.getElementById("role-actions").innerHTML = role.actions.map((item) => `<li>${item}</li>`).join("");
  document.getElementById("role-checks").innerHTML = role.checks.map((item) => `<li>${item}</li>`).join("");
  document.getElementById("internal-current-state").textContent =
    roleKey === "sales" ? "영업 검토 필요" : roleKey === "compliance" ? "컴플라이언스 검토 필요" : "운영 확인 필요";
  document.getElementById("internal-segment-name").textContent = segment.name;
  document.getElementById("internal-doc-state").textContent = roleKey === "compliance" ? "검토중 / 보완 요청" : "제출 완료";
  document.getElementById("internal-close-reason").textContent = "-";

  document.getElementById("internal-case-list").innerHTML = demoCases
    .map(
      ([id, segmentName, status, owner]) => `
        <tr>
          <td>${id}</td>
          <td>${segmentName}</td>
          <td>${status}</td>
          <td>${owner}</td>
        </tr>`
    )
    .join("");

  document.getElementById("internal-messages").innerHTML = messages
    .map(
      (message) => `
        <article class="message">
          <div class="message__meta">
            <strong>${message.from}</strong>
            <span>${message.at}</span>
          </div>
          <div>${message.text}</div>
        </article>`
    )
    .join("");
}

renderOverview();
renderSegmentOptions();
renderCustomerView();
renderInternalView();

function switchCustomerPage(page) {
  document.querySelectorAll(".customer-page").forEach((node) => {
    const shouldShow =
      (page === "auth" && node.id === "customer-page-auth") ||
      (page === "survey" && (node.id === "customer-page-survey" || node.id === "customer-page-survey-docs"));
    node.classList.toggle("is-active", shouldShow);
  });

  document.querySelectorAll("[data-customer-page]").forEach((node) => {
    node.classList.toggle("is-active", node.dataset.customerPage === page);
  });
}

document.getElementById("simulate-button").addEventListener("click", () => {
  const segmentKey = determineSegment();
  renderCustomerView(segmentKey);
  renderInternalView(document.getElementById("role-select").value, segmentKey);
});

document.getElementById("role-select").addEventListener("change", (event) => {
  renderInternalView(event.target.value, determineSegment());
});

document.getElementById("go-to-survey").addEventListener("click", () => {
  switchCustomerPage("survey");
  renderCustomerView(determineSegment());
});

document.getElementById("back-to-auth").addEventListener("click", () => {
  switchCustomerPage("auth");
});

document.querySelectorAll("[data-customer-page]").forEach((node) => {
  node.addEventListener("click", () => {
    switchCustomerPage(node.dataset.customerPage);
  });
});
