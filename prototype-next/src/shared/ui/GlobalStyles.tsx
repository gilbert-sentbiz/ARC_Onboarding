'use client'

import { Global, css } from '@emotion/react'

import { colors, ease, fontFamily } from '@/src/shared/const/tokens'

const BASE_PATH = '/ARK_Onboarding'

const globalStyles = css`
  @font-face {
    font-family: 'Pretendard';
    font-weight: 100;
    font-display: swap;
    src: url('${BASE_PATH}/fonts/Pretendard-Thin.otf') format('opentype');
  }
  @font-face {
    font-family: 'Pretendard';
    font-weight: 200;
    font-display: swap;
    src: url('${BASE_PATH}/fonts/Pretendard-ExtraLight.otf') format('opentype');
  }
  @font-face {
    font-family: 'Pretendard';
    font-weight: 300;
    font-display: swap;
    src: url('${BASE_PATH}/fonts/Pretendard-Light.otf') format('opentype');
  }
  @font-face {
    font-family: 'Pretendard';
    font-weight: 400;
    font-display: swap;
    src: url('${BASE_PATH}/fonts/Pretendard-Regular.otf') format('opentype');
  }
  @font-face {
    font-family: 'Pretendard';
    font-weight: 500;
    font-display: swap;
    src: url('${BASE_PATH}/fonts/Pretendard-Medium.otf') format('opentype');
  }
  @font-face {
    font-family: 'Pretendard';
    font-weight: 600;
    font-display: swap;
    src: url('${BASE_PATH}/fonts/Pretendard-SemiBold.otf') format('opentype');
  }
  @font-face {
    font-family: 'Pretendard';
    font-weight: 700;
    font-display: swap;
    src: url('${BASE_PATH}/fonts/Pretendard-Bold.otf') format('opentype');
  }
  @font-face {
    font-family: 'Pretendard';
    font-weight: 800;
    font-display: swap;
    src: url('${BASE_PATH}/fonts/Pretendard-ExtraBold.otf') format('opentype');
  }
  @font-face {
    font-family: 'Pretendard';
    font-weight: 900;
    font-display: swap;
    src: url('${BASE_PATH}/fonts/Pretendard-Black.otf') format('opentype');
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html,
  body {
    font-family: ${fontFamily};
    color: ${colors.n900};
    background: ${colors.n50};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  button {
    cursor: pointer;
    border: none;
    background: transparent;
    font-family: inherit;
  }

  input,
  textarea,
  select {
    font-family: inherit;
    outline: none;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  :root {
    --sb-brand: ${colors.brand};
    --sb-brand-hover: ${colors.brandHover};
    --sb-brand-heavy: ${colors.brandHeavy};
    --sb-n50: ${colors.n50};
    --sb-n100: ${colors.n100};
    --sb-n150: ${colors.n150};
    --sb-n200: ${colors.n200};
    --sb-n300: ${colors.n300};
    --sb-n400: ${colors.n400};
    --sb-n500: ${colors.n500};
    --sb-n600: ${colors.n600};
    --sb-n700: ${colors.n700};
    --sb-n800: ${colors.n800};
    --sb-n900: ${colors.n900};
    --sb-positive: ${colors.positive};
    --sb-positive-light: ${colors.positiveLight};
    --sb-warning: ${colors.warning};
    --sb-warning-light: ${colors.warningLight};
    --sb-negative: ${colors.negative};
    --sb-negative-light: ${colors.negativeLight};
    --ease: ${ease};
  }
`

export function GlobalStyles() {
  return <Global styles={globalStyles} />
}
