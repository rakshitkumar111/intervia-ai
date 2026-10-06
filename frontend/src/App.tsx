import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CandidateDashboard } from './pages/CandidateDashboard';
import { ResumeUploadPage } from './pages/ResumeUploadPage';
import { SetupInterviewPage } from './pages/SetupInterviewPage';
import { LiveInterviewPage } from './pages/LiveInterviewPage';
import { InterviewReportPage } from './pages/InterviewReportPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { RecruiterPortalPage } from './pages/RecruiterPortalPage';
import { CandidateJoinPage } from './pages/CandidateJoinPage';
import { recruiterApi } from './services/recruiterApi';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [navParams, setNavParams] = useState<any>({});

  React.useEffect(() => {
    // Detect invite token from URL query or path
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get('token');
    const path = window.location.pathname;
    let inviteToken = queryToken;
    if (!inviteToken && path.includes('/join/')) {
      const parts = path.split('/join/');
      if (parts.length > 1) {
        inviteToken = parts[1].replace(/^\//, '').split('/')[0];
      }
    }
    if (inviteToken) {
      setCurrentTab('candidate-join');
      setNavParams({ inviteToken });
    }
  }, []);

  const handleNavigate = (tab: string, param?: any) => {
    setCurrentTab(tab);
    if (param) {
      setNavParams(param);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-slate-400">
        <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        <span className="text-sm font-semibold">Loading Virtual Interviewer Platform...</span>
      </div>
    );
  }

  // Fallback to landing/login if unauthenticated and requesting protected tab
  const isProtected = ['dashboard', 'resume', 'setup-interview', 'live-interview', 'report', 'profile', 'admin', 'recruiter'].includes(currentTab);
  const effectiveTab = !user && isProtected ? 'login' : currentTab;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-brand-500 selection:text-white">
      <Navbar currentTab={effectiveTab} onNavigate={handleNavigate} />

      <main className="flex-1">
        {effectiveTab === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        {effectiveTab === 'login' && <LoginPage onNavigate={handleNavigate} />}
        {effectiveTab === 'register' && <RegisterPage onNavigate={handleNavigate} />}
        {effectiveTab === 'dashboard' && <CandidateDashboard onNavigate={handleNavigate} />}
        {effectiveTab === 'resume' && <ResumeUploadPage onNavigate={handleNavigate} />}
        {effectiveTab === 'setup-interview' && (
          <SetupInterviewPage
            onNavigate={handleNavigate}
            initialResumeId={navParams.resumeId}
          />
        )}
        {effectiveTab === 'live-interview' && (
          <LiveInterviewPage
            interviewId={navParams.interviewId}
            onNavigate={handleNavigate}
          />
        )}
        {effectiveTab === 'report' && (
          <InterviewReportPage
            interviewId={navParams.interviewId}
            onNavigate={handleNavigate}
          />
        )}
        {effectiveTab === 'candidate-join' && (
          <CandidateJoinPage
            inviteToken={navParams.inviteToken}
            onNavigate={handleNavigate}
          />
        )}
        {effectiveTab === 'profile' && <ProfilePage />}
        {effectiveTab === 'admin' && <AdminDashboardPage />}
        {effectiveTab === 'recruiter' && <RecruiterPortalPage onNavigate={handleNavigate} />}
      </main>

      <Footer />
    </div>
  );
};

export default App;
