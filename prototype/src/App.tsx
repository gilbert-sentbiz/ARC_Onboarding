import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/customer/LandingPage'
import OnboardingForm from './pages/customer/OnboardingForm'
import FirstIntakeReview from './pages/customer/FirstIntakeReview'
import InformationForm from './pages/customer/InformationForm'
import SecondIntakeReview from './pages/customer/SecondIntakeReview'
import DocumentUpload from './pages/customer/DocumentUpload'
import CasePage from './pages/customer/CasePage'
import InternalLoginPage from './pages/internal/InternalLoginPage'
import InternalDashboard from './pages/internal/InternalDashboard'
import InternalCaseDetail from './pages/internal/InternalCaseDetail'
import InternalCRM from './pages/internal/InternalCRM'
import InternalRulesPanel from './pages/internal/InternalRulesPanel'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/customer/onboarding" element={<OnboardingForm />} />
        <Route path="/customer/case/:id/review/first" element={<FirstIntakeReview />} />
        <Route path="/customer/case/:id/information" element={<InformationForm />} />
        <Route path="/customer/case/:id/review/second" element={<SecondIntakeReview />} />
        <Route path="/customer/case/:id/documents" element={<DocumentUpload />} />
        <Route path="/customer/case/:id" element={<CasePage />} />
        <Route path="/internal" element={<InternalLoginPage />} />
        <Route path="/internal/dashboard" element={<InternalDashboard />} />
        <Route path="/internal/case/:id" element={<InternalCaseDetail />} />
        <Route path="/internal/crm" element={<InternalCRM />} />
        <Route path="/internal/rules" element={<InternalRulesPanel />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
