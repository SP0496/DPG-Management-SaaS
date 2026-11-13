import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsAndConditionsPage } from './pages/TermsAndConditionsPage';
import { DomainSetupGuidePage } from './pages/DomainSetupGuidePage';
import { LoginPage } from './pages/LoginPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-[#EAF6FF] text-[#142B4A] font-sans selection:bg-[#FF8C42] selection:text-[#142B4A]">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
            <Route path="/domain-setup" element={<DomainSetupGuidePage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};

export default App;
