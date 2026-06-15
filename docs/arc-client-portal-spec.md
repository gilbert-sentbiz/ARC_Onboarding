  
**ARC**

**Client Portal Specification**

*Segments  ·  Inputs  ·  Documents*

**Source:**  arc-product-spec.md §4–§5, plus 고객확인서 and SentBe EDD Form v9 (pending integration)

**Owner:**  Jay Lee — Head of Product / Operations

**Date:**  May 2026

**Purpose**

Single source of truth for the client-facing portion of Arc onboarding — used to spec the four pages a prospective client sees: (1) inquiry, (2) portal intake / segmentation, (3) information input per segment, and (4) document upload per segment. Everything backoffice — auto-screening rules, risk assessment, approval routing, account provisioning — is out of scope here and lives in the master spec.

# **Table of Contents**

# **1\.  Overview**

Arc replaces today's email-and-Jira onboarding with a self-service portal. A prospective client moves through four pages, in this order:

| Page | What it does |
| :---- | :---- |
| **1\. Inquiry Page** | Public form on SentBe homepage. Captures lead info. Output → Sales qualification. |
| **2\. Portal Intake  /  Segmentation** | After Sales invites the lead, client logs into Arc via magic link. Answers a short set of questions; Arc determines which segment(s) they fall into. |
| **3\. Information Input** | Per the segment, client fills in the required information (customer information form fields — collection of info). |
| **4\. Document Upload** | Per the segment, client uploads the required documents (verification of info). |

*Out of scope: backoffice screening, risk assessment, approval workflow, NSB / BaoKim account provisioning. Those are covered in the master spec.*

*Note on FI clients: NDA confirmation is handled outside Arc as a pre-portal step (Sales-led). The magic-link invite to the portal is only sent after NDA is confirmed.*

# **2\.  Client Segments**

Arc has six client segments. A single client can fall into one entity-level segment plus zero or more service-level segments, with the union of all applicable requirements applied.

| Segment | Local Name | Definition |
| :---- | :---- | :---- |
| **SentBiz Corporate** | *법인 사업자* | Korean corporate entities using SentBe payout services. |
| **SentBiz Individual** | *개인 사업자* | Korean sole proprietors (individual business owners) using SentBe payout services. |
| **FI** | *Financial Institution* | Licensed financial institutions, remittance partners, MSBs. Also non-Korean entities wanting payouts via SG (SENDA). |
| **KRW Collection** | *Merchant* | Overseas companies collecting KRW payments through SentBe. |
| **VND Collection** | *Vietnam Dong* | Clients collecting in Vietnam via BaoKim. Currently scoped for CN / HK companies; VN, SG, ID coming soon. |
| **ID Collection** | *Placeholder* | Clients collecting in Indonesia. Definition and requirements TBD. |

# **3\.  Segmentation Matrix**

How Arc determines a client's segment from the inputs they provide. Inputs are collected across the Inquiry Page and Portal Intake; the segmentation engine maps the combination to one or more segments.

## **3.1  Inquiry Page Inputs  (public form on SentBe homepage)**

*Captured before the lead enters Arc. Used by Sales to qualify and trigger an Arc portal invite. Does not yet drive segmentation; provides initial context.*

| Field | Required? | Input Type |
| :---- | :---- | :---- |
| Company Name | Required | *Free text* |
| Title | Required | *Free text* |
| Name | Required | *Free text* |
| Phone Number | Required | *Format-validated* |
| Email | Required | *Format-validated* |
| How you heard about us | Optional | *Dropdown / free text* |
| Send Country | Required | *Country dropdown* |
| Receive Country | Required | *Country dropdown* |
| Projected Volume | Required | *Numeric range* |
| Number of Transactions | Required | *Numeric range* |
| Other Inquiries | Optional | *Free-text textarea* |
| Consent — collect & use private info | Required | *Checkbox* |

## **3.2  Portal Intake Inputs  (drive segmentation)**

*Asked after the client logs in via magic link. These five inputs determine which segment(s) apply, and therefore which information fields and document checklist are shown on the next pages.*

| Field | Input Type | Options |
| :---- | :---- | :---- |
| **Service Type** | Multi-select | Collections   /   Payouts |
| **Collection Country  (if Collections selected)** | Multi-select | Korea (KRW)   /   Vietnam (VND)   /   Indonesia (IDR)  — placeholder |
| **Payout Countries  (if Payouts selected)** | Multi-select | Country list — for operational setup, not segmentation |
| **Entity Type** | Single-select | Financial Institution   /   Corporate   /   Sole Proprietor |
| **Country of Incorporation** | Single-select | Country dropdown |

## **3.3  Inputs → Segment**

*Each row shows a combination of inputs and the resulting entity-level \+ service-level segment(s).*

| Entity Type | Country of Incorp. | Services Selected | Entity-Level Segment | Service-Level Segment(s) |
| :---- | :---- | :---- | :---- | :---- |
| Corporate | Korea | Payouts | SentBiz Corporate | — |
| Sole Proprietor | Korea | Payouts | SentBiz Individual | — |
| Financial Institution | Any | Payouts and/or Collections | FI | (union of selected collections) |
| Corporate or Sole Prop | Non-Korea | Payouts only | FI  (routed) | — |
| Any | Any | Collections → KRW | (entity-level applies) | KRW Collection |
| Any | Any | Collections → VND | (entity-level applies) | VND Collection |
| Any | Any | Collections → IDR | (entity-level applies) | ID Collection  (placeholder) |

*Rule: total requirements \= entity-level docs/fields ∪ each service-level docs/fields. FI overrides — if entity is FI, FI requirements apply regardless of services.*

## **3.4  Examples**

| Client | Inputs | Resolved Segment(s)  →  Required Doc Sets |
| :---- | :---- | :---- |
| Korean corporate, payouts overseas | Corporate / KR / Payouts | SentBiz Corporate  →  SentBiz Corporate docs only |
| Korean sole prop, payouts overseas | Sole Prop / KR / Payouts | SentBiz Individual  →  SentBiz Individual docs only |
| Korean FI sending overseas | FI / KR / Payouts | FI  →  FI docs |
| Overseas FI funding into SG (SENDA) for global payout | FI / Any / Payouts | FI  →  FI docs |
| Overseas corporate collecting KRW | Corporate / Non-KR / Collections (KRW) | FI (routed) \+ KRW Collection  →  FI docs \+ KRW docs |
| CN / HK company collecting VND | Corporate / CN-HK / Collections (VND) | FI (routed) \+ VND Collection  →  FI docs \+ VND docs |
| Korean corporate, payouts \+ KRW collection | Corporate / KR / Payouts \+ Collections (KRW) | SentBiz Corporate \+ KRW Collection  →  SentBiz docs \+ KRW docs |

# **4\.  Per-Segment Requirements**

For each segment: (a) what the client must enter on the Information Input page, (b) what the client must upload on the Document Upload page. Validation rules, KYC reviewer checklists, and screening logic are intentionally out of scope here — see the master spec.

## **4.1  SentBiz Corporate**

| PENDING INTEGRATION  ·  Information fields lifted from 고객확인서 (Customer Information Form, page 4 of 센트비즈 이용계약서). Doc list reflects current spec §5. *Lifted from the source document for visibility. Not yet merged into the master spec — exact field set, ordering, and required/optional flags subject to confirmation.* |
| :---- |

### **Information Input**

*Three sections, per 고객확인서. Two representative entries supported for co-CEO (각자대표) cases. Two BO entries supported.*

**Section 1 — Basic Information  (가맹점 기본 정보)**

| Field | Required? | Input Type / Options |
| :---- | :---- | :---- |
| **회사명 / Company Name  (Korean)** | Required | Free text |
| **회사명 / Company Name  (English)** | Required | Free text |
| **사업자등록번호 / Business Registration \#** | Required | Format-validated |
| **연락처 / Contact Number** | Required | Format-validated |
| **업종 / Industry  (per 사업자등록증)** | Required | Free text |
| **업태 / Business Type  (per 사업자등록증)** | Required | Free text |
| **사업장 주소 / Business Address** | Required | Address |
| **법인 유형 / Corporate Type** | Required | 영리법인  /  비영리법인 (단체) |
| **법인 등록번호 / Corporate Registration \#** | Required | Format-validated |
| **법인 국적 / Corporate Nationality** | Required | Country dropdown |
| **본점 주소 / Head Office Address** | Optional | Address — only if different from 사업장 주소 |
| **국내 거소·사무소 소재지** | Conditional | Address — only if foreign-entity / group |
| **대표자 1 — 성명 (한글) / Name (Korean)** | Required | Free text |
| **대표자 1 — 성명 (영문) / Name (English)** | Required | Free text |
| **대표자 1 — 생년월일 / DOB** | Required | Date |
| **대표자 1 — 성별 / Gender** | Required | M  /  F |
| **대표자 1 — 국적 / Nationality** | Required | Country dropdown |
| **대표자 2 — same five fields** | Conditional | Only if co-representative (각자대표) |

**Section 2 — Beneficial Owner Verification  (실제 소유자 확인사항)**

| Field | Required? | Input Type / Options |
| :---- | :---- | :---- |
| **확인생략 대상 / Exemption Check** | Optional | Multi-select:  국가·지자체  /  공공기관  /  금융회사  /  사업보고서 제출대상 법인 (상장회사). If any selected, BO entry is skipped. |
| **실제소유자 구분 — 1단계** | Conditional | 25% 이상의 지분을 소유한 사람 (자연인) |
| **실제소유자 구분 — 2단계** | Conditional | If 1단계 unknown:  ① 최대 지분 소유자  /  ② 대표자, 업무집행사원 또는 임원 과반수를 선임한 주주  /  ③ 법인·단체를 사실상 지배하는 사람 |
| **실제소유자 구분 — 3단계** | Conditional | If 1·2 unknown:  법인 또는 단체의 대표자 |
| **BO 1 — 성명 (한글) / Name (Korean)** | Required | Free text |
| **BO 1 — 성명 (영문) / Name (English)** | Required | Free text |
| **BO 1 — 생년월일 / DOB** | Required | Date |
| **BO 1 — 국적 / Nationality** | Required | Country dropdown |
| **BO 1 — 거주국가 / Country of Residence** | Required | Country dropdown |
| **BO 2 — same five fields** | Conditional | Only if multiple beneficial owners |

**Section 3 — Additional Verification  (추가 확인사항)**

| Field | Required? | Input Type / Options |
| :---- | :---- | :---- |
| **거래목적 / Transaction Purpose** | Required | 판매대금 정산대행  /  기타: \_\_\_ |
| **가상자산취급업소 여부** | Required | Yes  /  No |
| **자금 및 재산 원천 / Source of Funds & Wealth** | Required | Multi-select:  사업소득  /  부동산 임대소득  /  부동산 양도소득  /  금융소득 (이자·배당)  /  기타: \_\_\_ |
| **법인구분 / Corporate Size** | Required | 대기업  /  중소기업 |
| **상장정보 / Listing Status** | Required | 비상장  /  유가증권시장 (코스피)  /  코스닥  /  기타: \_\_\_ |
| **설립일자 / Establishment Date** | Required | Date |

### **Documents to Submit**

| \# | Document (KR) | Document (EN) | Format | Required? |
| :---- | :---- | :---- | :---- | :---- |
| 1 | 사업자등록증 | Business Registration Certificate | PDF / JPG / PNG | Required |
| 2 | 법인등기부등본 | Corporate Registry Extract | PDF / JPG / PNG | Required |
| 3 | 주주명부 | Shareholder List | PDF / JPG / PNG | Required |
| 4 | 대표자 신분증 사본 | CEO ID Copy  (all co-representatives) | PDF / JPG / PNG | Required |
| 5 | 법인인감증명서 | Corporate Seal Certificate | PDF / JPG / PNG | Required |
| 6 | 은행계좌 사본 | Bank Account Copy | PDF / JPG / PNG | Required |
| 7 | 계약서 | Contract (with counterparty) | PDF / JPG / PNG | Required |
| 8 | 샘플 인보이스 및 선적자료 | Sample Invoice & Shipping Documents | PDF / JPG / PNG | Required |
| 9 | 홈페이지 주소 | Website URL | URL text | Optional |

## **4.2  SentBiz Individual**

| PENDING INTEGRATION  ·  Information fields lifted from 고객확인서 — 개인 (individual) sections. Doc list reflects current spec §5. *Lifted from the source document for visibility. Not yet merged into the master spec — exact field set, ordering, and required/optional flags subject to confirmation.* |
| :---- |

### **Information Input**

**Section 1 — Basic Information**

| Field | Required? | Input Type / Options |
| :---- | :---- | :---- |
| **회사명 / Business Name** | Required | Free text |
| **사업자등록번호 / Business Registration \#** | Required | Format-validated |
| **연락처 / Contact Number** | Required | Format-validated |
| **업종 / Industry** | Required | Free text |
| **업태 / Business Type** | Required | Free text |
| **사업장 주소 / Business Address** | Required | Address |
| **거주지 / Residence** | Required | 국내  /  국외 |
| **대표자 — 성명 (한글)** | Required | Free text |
| **대표자 — 성명 (영문)** | Required | Free text |
| **대표자 — 생년월일 / DOB** | Required | Date |
| **대표자 — 성별 / Gender** | Required | M  /  F |
| **대표자 — 국적 / Nationality** | Required | Country dropdown |

**Section 2 — Beneficial Owner Verification**

| Field | Required? | Input Type / Options |
| :---- | :---- | :---- |
| **대표자와 실제소유자가 동일?** | Required | Yes  /  No |
| **BO — 성명 (한글)** | Conditional | Only if BO ≠ representative |
| **BO — 성명 (영문)** | Conditional | Same |
| **BO — 생년월일 / DOB** | Conditional | Same |
| **BO — 국적 / Nationality** | Conditional | Same |
| **BO — 거주국가 / Country of Residence** | Conditional | Same |

**Section 3 — Additional Verification**

| Field | Required? | Input Type / Options |
| :---- | :---- | :---- |
| **거래목적 / Transaction Purpose** | Required | 판매대금 정산대행  /  기타: \_\_\_ |
| **가상자산취급업소 여부** | Required | Yes  /  No |
| **자금 및 재산 원천 / Source of Funds** | Required | Multi-select:  사업소득  /  근로·연금소득  /  부동산 임대소득  /  부동산 양도소득  /  금융소득 (이자·배당)  /  상속·증여  /  일시 재산양도로 인한 소득  /  기타: \_\_\_ |

### **Documents to Submit**

| \# | Document (KR) | Document (EN) | Format | Required? |
| :---- | :---- | :---- | :---- | :---- |
| 1 | 사업자등록증 | Business Registration Certificate | PDF / JPG / PNG | Required |
| 2 | 대표자 신분증 사본 | Representative ID Copy | PDF / JPG / PNG | Required |
| 3 | 은행계좌 사본 | Bank Account Copy | PDF / JPG / PNG | Required |
| 4 | 계약서 | Contract | PDF / JPG / PNG | Required |
| 5 | 샘플 인보이스 및 선적자료 | Sample Invoice & Shipping Docs | PDF / JPG / PNG | Required |
| 6 | 홈페이지 주소 | Website URL | URL text | Optional |

## **4.3  FI (Financial Institution)**

*Pre-portal step (outside Arc): NDA confirmation is handled by Sales before the magic-link invite is sent. Once NDA is in place, the FI client receives the invite and proceeds through the portal flow below.*

| PENDING INTEGRATION  ·  Information fields lifted from SentBe EDD Form v9 (Sections A–F). The PDF EDD form itself is no longer a submitted document — its data is now collected through the portal fields below. Doc list reconciled against the Master CDD Checklist. *Lifted from the source document for visibility. Not yet merged into the master spec — exact field set, ordering, and required/optional flags subject to confirmation.* |
| :---- |

### **Information Input**

*Six sections, per EDD Form. The form is wide-ranging because FI clients face the highest scrutiny. Note: any “Yes” answer on the AML / criminal / litigation questions in Section E auto-escalates to Tier 2 (Esther) — pending integration confirmation.*

**Section A — Basic Information**

| Field | Required? |
| :---- | :---- |
| **1\.  Registered Legal Name of FI / Remittance Agent / Exchange Company** | Required |
| **2\.  Legal Form  (e.g., Stock Corporation, Partnership, etc.)** | Required |
| **3\.  Date and Country of Incorporation / Registration** | Required |
| **4\.  Registration Number** | Required |
| **5\.  Trade Name or other name(s) (if any), and previous names (if any)** | Optional |
| **6\.  Website** | Required |
| **7\.  Registered Address** | Required |
| **8\.  Principal Place of Business  (if different from registered)** | Conditional |
| **9\.  Number of Domestic / Foreign Branches** | Required |
| **10\.  Name of Licensing Authority & Regulator / Country of Jurisdiction** | Required |
| **11\.  Type of License  /  Date Issued  /  Expiry Date** | Required |
| **12\.  Name of External Auditors** | Required |
| **13\.  Taxation Status  (Taxpayer  /  Tax-exempt)** | Required |
| **14\.  Name of Representative** | Required |
| **15\.  Date of Birth of Representative** | Required |
| **16\.  Mobile / Phone Number and Email of Representative** | Required |
| **17\.  Type of Industry / Business** | Required |

**Section B — Services Sought from SentBe**

| Field | Required? |
| :---- | :---- |
| **18\.  Services sought from SentBe  (Collection  /  Payout)** | Required |
|        **For Collection — currencies received  (KRW  /  VND)** | Conditional |
| **19\.  Purpose of transactions — top 5 or more  (separate fields for Payouts and Collections)** | Required |
| **20\.  Originating countries of payout transactions** | Required |
| **21\.  Will you send transactions from upstream FI / MSB / PSP / similar clients?** | Required |
|        **21a. If yes — how many layers of nesting?** | Conditional |
|        **21b. Do you work with any unlicensed FIs / PSPs / MSBs?** | Conditional |
|        **21c. Originating countries of upstream client transactions** | Conditional |
| **22\.  Is your company a virtual asset service provider?** | Required |
|        **22a. If yes — where do you custody assets?** | Conditional |
|        **22b. Do you onboard customers from outside your country of incorporation / licensing?** | Conditional |
|        **22c. If yes — list countries where customers reside** | Conditional |
|        **22d. Under which license do you onboard non-resident customers?** | Conditional |
|        **22e. Main purposes customers request crypto off-ramp / fiat payout** | Conditional |

**Section C — Source of Funds & Source of Wealth**

| Field | Required? |
| :---- | :---- |
| **23\.  Capital Injection  —  Yes / No** | Required |
| **23\.  Liquid Investments  —  Yes / No** | Required |
| **23\.  Profits  —  Yes / No** | Required |
| **23\.  Others  —  Yes / No  (and specify)** | Required |

**Section D — Ownership & Management Structure**

| Field | Required? |
| :---- | :---- |
| **24\.  Name of parent / ultimate parent company** | Required |
| **25\.  Address of parent / ultimate parent** | Required |
| **26\.  Relationship with parent  (Branch / Subsidiary / Agency / etc.)** | Required |
| **27\.  Jurisdiction of licensing authority and regulator of parent** | Required |
| **28\.  Is parent publicly listed?  Where \+ ticker symbol?** | Conditional |
| **29\.  Owners 25%+  —  per owner:  Name, Nationality, DOB, % Ownership, Passport \#** | Required |
| **30\.  If any owner is a legal entity  —  shareholders of that entity:  Entity, Name, Nationality, DOB, % Ownership, Passport \#** | Conditional |
| **31\.  Directors  —  per director:  Name, Years of Service, Nationality, DOB, Passport \#** | Required |
| **32\.  Senior Management  —  per person:  Name, Position, Years of Service, Nationality, DOB, Passport \#** | Required |
| **33\.  Have any current or former executives / directors ever filed for bankruptcy?  \+  details** | Required |

**Section E — Legal and AML**

| Field | Required? |
| :---- | :---- |
| **34\.  Principal financial products / services offered  \+  geographical markets covered** | Required |
| **35\.  Does your institution have policies prohibiting dealings with shell companies?** | Required |
| **36\.  Does the company, parent, branches, subsidiaries, or related corporations have presence or operations in FATF black / grey list jurisdictions?** | Required |
| **37\.  Has your institution been subjected to administrative and/or monetary penalty for AML violations?  \+  details** | Required |
| **38\.  Have there been criminal or administrative proceedings or investigations against your institution or affiliates or any current/former executives/UBOs?  \+  details** | Required |
| **39\.  Any pending or ongoing litigation / investigation against your institution, affiliates, or current/former Executives / Directors?  \+  details** | Required |

**Section F — Compliance / Risk Policies & Training**

| Field | Required? |
| :---- | :---- |
| **40\.  Written policies on  —  Anti-Bribery & Corruption  /  AML  /  Business Continuity  /  Data Protection  /  Information Security  /  Risk Management   (Yes / No per topic, plus explanation if any 'No')** | Required |
| **41\.  Employee training on  —  same six topics   (Yes / No per topic)** | Required |

### **Documents to Submit**

| \# | Document | Format | Required? |
| :---- | :---- | :---- | :---- |
| 1 | Business Registration | PDF / JPG / PNG | Required |
| 2 | Remittance License  (or equivalent) | PDF / JPG / PNG | Required |
| 3 | Internal Policies  (Compliance / Risk) | PDF | Required |
| 4 | Latest Audited Financial Statements  (last 3 years) | PDF | Required |
| 5 | Latest AML Audit Report | PDF | Required |
| 6 | Organisational Chart | PDF | Required |
| 7 | Ownership Chart | PDF | Required |
| 8 | Official Document — List of Directors | PDF | Required |
| 9 | Certified ID Copies — All Corporate Directors and UBOs 25%+ | PDF / JPG / PNG | Required |
| 10 | Wolfsberg Anti-Money Laundering Questionnaire | PDF | Required |
| 11 | Board Resolution — providing authority to signatory | PDF | Required |
| 12 | Proof of Bank Account  (statement within last 3 months) | PDF | Required |
| 13 | Set of KYC Documents for Two Sample Merchants | PDFs | Conditional — KRW Collection FIs only |

*Notes: (a) Any document not in English must be accompanied by a certified or notarized translation. (b) KYC documents for sample merchants (item 13\) follow the same checklist as KRW Collection merchants — see §4.4. (c) The Sentbe EDD form is no longer required as a submitted document — its data is now collected via the portal Information Input fields above.*

## **4.4  KRW Collection**

*Service-level segment. Applies on top of the entity-level segment (typically FI for non-KR entities). Sector selection drives additional document requirements.*

### **Information Input**

| PENDING INTEGRATION  ·  KRW Collection-specific intake fields are not yet specified. Master CDD Checklist (Google Sheet) was the planned source — currently quota-limited, will be incorporated once accessible. Sector selection (below) is the one confirmed input. *Lifted from the source document for visibility. Not yet merged into the master spec — exact field set, ordering, and required/optional flags subject to confirmation.* |
| :---- |

| Field | Required? | Input Type / Options |
| :---- | :---- | :---- |
| **Sector / Sub-Segment** | Required | Single-select:  Trading (B2B)  /  Trading (B2C)  /  Consulting  /  Development-Design  /  Advertising-Marketing  /  Research  /  IT & Computer  /  Coupang  (Sunrate or Payful) |
| **All entity-level info fields** | Required | Per entity segment (FI fields if non-KR; SentBiz Corporate fields if KR corporate, etc.) |

### **Documents to Submit — Base  (all merchants)**

| \# | Document | Format | Required? |
| :---- | :---- | :---- | :---- |
| 1 | Certificate of Business Registration | PDF / JPG / PNG | Required |
| 2 | List of Directors | PDF | Required |
| 3 | List of Shareholders | PDF | Required |
| 4 | Articles of Incorporation | PDF | Required |
| 5 | ID Copies — CEOs, Directors, UBOs 25%+ | PDF / JPG / PNG | Required |
| 6 | Bank / E-wallet Statement  (Company Name) | PDF / JPG / PNG | Required |

### **Documents to Submit — Sector Add-Ons**

*Additional documents required based on the sector selected during intake.*

| Sector | Additional Documents |
| :---- | :---- |
| **Trading (B2B)** | Shipping Documents  (Bill of Lading, Air Waybill, or equivalent)  \+  Customs Declaration or Import/Export License  \+  Sample Export Invoice |
| **Trading (B2C)** | Logistics Slip  (delivery confirmation)  \+  Screenshot of Sales Record on Online Platform  \+  Sample Invoice to Buyer |
| **Consulting** | Client Contract  (scope of work)  \+  Consulting Report or Deliverable (sample)  \+  Company Portfolio or Case Studies |
| **Development / Design** | Client Contract  (technical specs)  \+  Project Planning Report OR In-Progress Screenshots  \+  Portfolio Samples |
| **Advertising / Marketing** | Client Contract  \+  Ad Deliverable OR Active Ad Platform Screenshot  \+  Marketing Proposal or Sample Campaign |
| **Research** | Client Contract  \+  Research Deliverable  (report, analysis, data) |
| **IT & Computer** | Client Contract  (technical specs)  \+  Software / System Documentation  \+  Project Deployment Evidence  (screenshots, certificates) |

### **Special Case — Sunrate / Payful Coupang Merchants**

*Instant-approval pathway: if all documents are present and valid, no manual review needed.*

| \# | Document |
| :---- | :---- |
| **1–6** | Base documents  (Certificate of Business Registration, Directors, Shareholders, Articles, IDs, Bank Statement) |
| **7** | Coupang Seller URL  \+  Screenshots — active seller account with sales history |
| **8** | Coupang Settlement Statement  (정산서) — recent settlement showing KRW collection |
| **9** | Service Agreement  (Sunrate or Payful) — signed between merchant and payment provider |

## **4.5  VND Collection**

*Service-level segment. Currently scoped for CN / HK companies; VN, SG, ID requirements pending from Minger. Document verification uses AsiaVerify as an additional layer.*

### **Information Input  (15 fields)**

| Field | Required? |
| :---- | :---- |
| **Full Name of Entity / Business** | Required |
| **Business Number  (UEN / NIB / ERC)** | Required |
| **Registered Business Address** | Required |
| **Place of Incorporation** | Required |
| **Business Website** | Required |
| **Name of Contact Person** | Required |
| **Contact Number** | Required |
| **Email of Contact Person** | Required |
| **Entity Type** | Required |
| **Industry Type** | Required |
| **Main Business Activity** | Required |
| **Anticipated Monthly Volume** | Required |
| **Purpose of Opening Account** | Required |
| **Relationship with the Depositor** | Required  (Collection only) |
| **Whether the Depositor will be corporate or individual** | Required  (Collection only) |

### **Documents to Submit**

| \# | Document | Format | Required? | Condition / Scope |
| :---- | :---- | :---- | :---- | :---- |
| 1 | Business Registration Certificate | PDF / JPG / PNG | Required | All |
| 2 | Company Charter | PDF | Conditional | If available; else company must confirm absence |
| 3 | Certificate of Incorporation | PDF | Required | HK: includes shareholder list. If 1 UBO owns 100%, may skip \#5 and \#7 |
| 4 | List of Directors | PDF | Required | All |
| 5 | Shareholders' Chart | PDF | Required | All 25%+ shareholders |
| 6 | Passport / ID Copy — UBOs, Directors, Representatives | PDF / JPG | Required | All Directors; all UBOs ≥ 25%; all authorized reps (if not a Director) |
| 7 | Board Resolution | PDF | Conditional | If signer is not the legal person |
| 8 | Licenses | PDF | Conditional | If applicable |
| 9 | Address of UBOs, Directors, Reps, Shareholders | PDF / text | Required | All |
| 10 | Bank Statement  (for SentBe App Users) | PDF | Conditional | SentBe App Users only |
| 11 | Sample Contract | PDF | Required | Collection only |
| 12 | Sample Shipping Documents  (invoice, B/L, etc.) | PDF | Required | Collection only |
| 13 | Accountant's ID | PDF / JPG | Required | VN entities only |
| 14 | Accountant's Proof of Address | PDF | Required | VN entities only |
| 15 | Office Photo with Company Logo | JPG / PNG | Pending | Newly added — Minger confirmation pending |
| 16 | Image of Product / Service Website | JPG / PNG / Screenshot | Pending | Must match invoice or shipping document. Pending confirmation |

## **4.6  ID Collection  (Indonesia)**

*Placeholder. Segment definition, intake fields, and document requirements are not yet specified.*

# **5\.  Out of Scope — Planned for Later Phases**

This document covers only the client-facing portion of onboarding. The following backoffice steps are part of Arc's broader automation roadmap and are specified in the full arc-product-spec.md, but are intentionally out of scope here so that this document remains a clean reference for Sales, Ops, and external sharing.

| Module | What it does |
| :---- | :---- |
| **Auto-Screening Pipeline** | Synchronous 5-step diagnostic pipeline that runs after submission:  repeat-applicant detection  ·  blacklist screening  ·  completeness check  ·  doc compliance rules  ·  sanctions / PEP screening (ComplyAdvantage)  ·  risk pre-fill. Produces a screening report; humans decide. |
| **Risk Assessment** | 9-question risk form, with 4 auto-populated from screening data and 5 manually scored. Two scoring methods (categorical Low/Med/High; quantitative 0–10) — admin-configurable per segment. |
| **Approval Workflow** | Tiered routing — LOW auto-approves; MEDIUM goes to Tier 1 (Daisy / Q / Cecille by product); HIGH or FI goes to Tier 2 (Esther). Per-product reviewer teams with primary \+ backup. Authority override modes and reversal handling defined. |
| **Info-Request & Resubmission** | When reviewers need more info, Arc generates a structured request to the client (deadline-driven, auto-timeout). Client returns to the same submission page with flagged docs marked. Re-screening runs from the failed step onward. |
| **Account Provisioning** | On approval:  Client ID issued instantly.  COAS clients — auto-generate NSB 12-endpoint provisioning payload (subject to commercial approval).  VCMO clients — BaoKim VA tracking (manual today; API exploration pending). |
| **Operational Analytics** | Time-based, volume, reviewer, and quality metrics, exposed via Executive, Operations, Quality, and Compliance dashboards. Every status transition is an event. |
| **Admin Panel** | Configurable rules, taxonomies, segments, reviewer assignments, thresholds, timeout/SLA values, email templates — all editable by Admin without code changes. |
| **Audit Trail** | Domain event log is the audit log. PII referenced by pointer, never inlined. 7-year retention. Immutable, replayable. |

*See arc-product-spec.md for the full specification of the above.*