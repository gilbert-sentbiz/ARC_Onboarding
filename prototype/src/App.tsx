import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/customer/LandingPage'
import OnboardingForm from './pages/customer/OnboardingForm'
import InternalLoginPage from './pages/internal/InternalLoginPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/customer/onboarding" element={<OnboardingForm />} />
        <Route path="/internal" element={<InternalLoginPage />} />
        {/* 이후 화면들이 추가될 자리 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
