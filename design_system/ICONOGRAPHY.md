# Iconography — SentBiz

## Primary Icon Library: Phosphor Icons

SentBiz UI는 **[Phosphor Icons](https://phosphoricons.com)**을 표준 아이콘 라이브러리로 사용한다.
인라인 SVG 직접 작성은 금지. 반드시 `@phosphor-icons/react` 컴포넌트로 import해 사용한다.

### 설치

```bash
npm install @phosphor-icons/react
```

### 기본 사용법

```tsx
import { MagnifyingGlass, Check, Trash } from '@phosphor-icons/react';

// 기본 (Regular, 20px)
<MagnifyingGlass size={20} />

// 상태 아이콘 (Fill variant)
<CheckCircle weight="fill" size={20} color="var(--s-status-positive)" />

// 색상 상속
<ArrowRight size={16} color="currentColor" />
```

### 사용 규칙

| 규칙 | 내용 |
|---|---|
| **기본 variant** | `regular` (weight 생략 시 기본값) — 메뉴, 버튼, 인라인 |
| **상태/강조 variant** | `fill` — status badge, 선택된 nav, toast |
| **크기** | `size` prop으로 자유롭게 지정. 관례적 기준: 인라인 `16px`, 기본 UI `20px`, 강조 `24px` — 디자인에 맞게 커스텀 가능 |
| **색상** | `currentColor` 또는 명시적 토큰. `--fg-2` (`#293548`)가 기본 아이콘 색 |
| **이모지 금지** | 이모지를 아이콘 대체재로 쓰지 않는다 |
| **SVG 직접 작성 금지** | Phosphor에 없는 아이콘은 먼저 팀에 확인 후 추가 |

---

## SentBiz 커스텀 아이콘 → Phosphor 매핑

Figma 디자인에서 SentBiz 커스텀 아이콘명(`Si*`)을 보면 아래 표에서 Phosphor 대응 컴포넌트를 찾아 사용한다.

### Actions

| SentBiz 아이콘 | Phosphor 컴포넌트 | 비고 |
|---|---|---|
| `SiSearch` | `MagnifyingGlass` | |
| `SiClose` | `X` | |
| `SiCheck` | `Check` | |
| `SiAdd` | `Plus` | |
| `SiDelete` | `Trash` | |
| `SiEdit` | `PencilSimple` | |
| `SiCopy` | `Copy` | |
| `SiDownload` | `DownloadSimple` | |
| `SiUpload` | `UploadSimple` | |
| `SiRefresh` | `ArrowClockwise` | |

### Navigation

| SentBiz 아이콘 | Phosphor 컴포넌트 | 비고 |
|---|---|---|
| `SiSidebarFold` | `SidebarSimple` | |
| `SiSidebarUnfold` | `SidebarSimple` | |
| `SiDrawer` | `SidebarSimple` | |
| `SiPageList` | `List` | |
| `SiMoreVert` | `DotsThreeVertical` | |
| `SiMoreHoriz` | `DotsThree` | |

### Arrows

| SentBiz 아이콘 | Phosphor 컴포넌트 | 비고 |
|---|---|---|
| `SiArrowUp` | `ArrowUp` | |
| `SiArrowDown` | `ArrowDown` | |
| `SiArrowLeft` | `ArrowLeft` | |
| `SiArrowRight` | `ArrowRight` | |

### Data & System

| SentBiz 아이콘 | Phosphor 컴포넌트 | 비고 |
|---|---|---|
| `SiCalendar` | `Calendar` | |
| `SiHistory` | `ClockCounterClockwise` | |
| `SiFile` | `File` | |
| `SiSetting` | `Gear` | |
| `SiNotification` | `Bell` | |
| `SiHelp` | `Question` | |
| `SiHelpCenter` | `Question` | |
| `SiLogin` | `SignIn` | |
| `SiLogout` | `SignOut` | |
| `SiLoader` | `CircleNotch` | 애니메이션 spinning 적용 |

### Status (Fill variant 사용)

| SentBiz 아이콘 | Phosphor 컴포넌트 | 색상 토큰 |
|---|---|---|
| `SiFillCheck` | `CheckCircle` weight="fill" | `--s-status-positive` |
| `SiFillError` | `XCircle` weight="fill" | `--s-status-negative` |
| `SiFillWarning` | `Warning` weight="fill" | `--s-status-warning` |
| `SiFillInfo` | `Info` weight="fill" | `--s-status-progress` |
| `SiFillNotification` | `Bell` weight="fill" | `--fg-2` |

### Input Affordances

| SentBiz 아이콘 | Phosphor 컴포넌트 | 비고 |
|---|---|---|
| `SiVisibilityOn` | `Eye` | |
| `SiVisibilityOff` | `EyeSlash` | |
| `SiDeleteCircle` | `XCircle` | |

---

## 로고 & 브랜드 에셋

로고는 Phosphor 대체 불가. 반드시 기존 SVG 에셋을 사용한다.

| 파일 | 배경 | S마크 | 사용 컨텍스트 |
|---|---|---|---|
| `logo-mark-light-navy.svg` | 흰색 | 네이비 `#122666` | 흰/밝은 배경 위 (V.2 신규) |
| `logo-mark-dark-navy.svg` | 네이비 `#122666` | 흰색 | 네이비/다크 배경 위 (V.2 신규) |
| `logo-mark-light.svg` | 흰색 | 다크 | 레거시 |
| `logo-mark-dark.svg` | 다크 | 흰색 | 레거시 |
| `wordmark-white.svg` | — | 흰색 워드마크, 92×20 | 다크/브랜드블루 배경 위 |
| `wordmark-dark.svg` | — | `#0F172A` 워드마크, 92×20 | 밝은 배경 위 |

**V.2 기준 신규 작업에는 `light-navy` / `dark-navy` 변형을 사용한다.**

최소 마크 크기: **20×20** / 최소 워드마크: **72×15**. 여백: s 글자 너비만큼 사방 확보.

---

## Phosphor에 없는 아이콘이 필요할 때

1. [phosphoricons.com](https://phosphoricons.com) 에서 다시 검색 (약 1,000개 이상)
2. 없으면 **팀 디자이너에게 확인** 후 커스텀 SVG 추가
3. 커스텀 추가 시 `assets/icons/`에 kebab-case로 저장하고 이 문서에 등록

**절대 하지 말 것:** Lucide, Heroicons, Material Icons 등 타 라이브러리 혼용 — stroke weight와 optical metric이 다르다.
