import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/customer/LandingPage'
import OnboardingForm from './pages/customer/OnboardingForm'
import CasePage from './pages/customer/CasePage'
import InformationForm from './pages/customer/InformationForm'
import InternalLoginPage from './pages/internal/InternalLoginPage'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/customer/onboarding" element={<OnboardingForm />} />
        <Route path="/customer/case/:id" element={<CasePage />} />
        <Route path="/customer/case/:id/information" element={<InformationForm />} />
        <Route path="/internal" element={<InternalLoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
