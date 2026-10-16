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
import { HireBytePage } from './pages/HireBytePage';
import { recruiterApi } from './services/recruiterApi';
import './hirebyte.css';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [navParams, setNavParams] = useState<any>({});

  React.useEffect(() => {
    // Detect invite token from URL query or path (/interview/:token, /join/:token, /invite/:token)
    const params = new URLSearchParams(window.location.search);
    const queryToken = params.get('token');
    const path = window.location.pathname;
    let inviteToken = queryToken;

    if (!inviteToken) {
      if (path.includes('/interview/')) {
        const parts = path.split('/interview/');
        if (parts.length > 1) {
          inviteToken = parts[1].replace(/^\//, '').split('/')[0];
        }
      } else if (path.includes('/join/')) {
        const parts = path.split('/join/');
        if (parts.length > 1) {
          inviteToken = parts[1].replace(/^\//, '').split('/')[0];
        }
      } else if (path.includes('/invite/')) {
        const parts = path.split('/invite/');
        if (parts.length > 1) {
          inviteToken = parts[1].replace(/^\//, '').split('/')[0];
        }
      }
    }

    if (inviteToken) {
      setCurrentTab('candidate-join');
      setNavParams({ inviteToken });
    }
  }, []);

  const handleNavigate = (tab: string, param?: any) => {
    setCurrentTab(tab);
    setNavParams(param || {});
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: '#f0eff5', color: '#6b6b80' }}>
        <div className="w-12 h-12 border-4 rounded-full animate-spin" style={{ borderColor: 'rgba(108,92,231,0.2)', borderTopColor: '#6c5ce7' }} />
        <span className="text-sm font-semibold">Loading Virtual Interviewer Platform...</span>
      </div>
    );
  }

  // Fallback to landing/login if unauthenticated and requesting protected tab
  const isProtected = ['dashboard', 'resume', 'setup-interview', 'live-interview', 'report', 'profile', 'admin', 'recruiter'].includes(currentTab);
  const effectiveTab = !user && isProtected ? 'login' : currentTab;

  // HireByte page renders standalone with its own navbar
  if (effectiveTab === 'hirebyte') {
    return <HireBytePage onNavigate={handleNavigate} />;
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${effectiveTab === 'live-interview' ? 'bg-slate-950' : ''}`}
      style={{
        background: effectiveTab === 'live-interview' ? '#020617' : '#f0eff5',
        fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif"
      }}
    >
      {effectiveTab !== 'live-interview' && <Navbar currentTab={effectiveTab} onNavigate={handleNavigate} />}

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
            initialResume={navParams.resume}
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

      {effectiveTab !== 'live-interview' && <Footer />}
    </div>
  );
};

export default App;
