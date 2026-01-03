import React, { useState, useEffect } from 'react';
import { db } from './services/dataStore';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { MockAnalysisDashboard } from './components/MockAnalysisDashboard';

// Simple Routing Types
type ViewState = 
  | { type: 'LOADING' }
  | { type: 'ADMIN_DASH' }
  | { type: 'STUDENT_DASH'; studentId: string }
  | { type: 'MOCK_DETAIL'; studentId: string; mockId: string; returnTo: 'ADMIN' | 'STUDENT' };

export default function App() {
  const [view, setView] = useState<ViewState>({ type: 'LOADING' });

  // SIMULATE SSO: automatically detect logged-in user from "entranceug.com"
  useEffect(() => {
    const initSession = async () => {
      // PRODUCTION TODO: Read user ID from cookie or JWT
      // const userId = getUserIdFromCookie();
      
      setTimeout(() => {
        // Defaulting to the demo student for the "Analytics Tab" view
        setView({ type: 'STUDENT_DASH', studentId: 'STU_001' });
      }, 800); 
    };
    initSession();
  }, []);

  // PRODUCTION TODO: Point this to your actual main dashboard
  const handleExitToMainSite = () => {
    // window.location.href = "https://www.entranceug.com/dashboard";
    alert("In a live environment, this would redirect the user back to www.entranceug.com");
  };

  const renderContent = () => {
    switch (view.type) {
      case 'LOADING':
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium animate-pulse">Loading your analytics profile...</p>
          </div>
        );

      case 'ADMIN_DASH':
        return (
          <AdminDashboard 
            onViewStudent={(id) => {
              setView({ type: 'STUDENT_DASH', studentId: id });
            }}
          />
        );

      case 'STUDENT_DASH':
        const student = db.getStudent(view.studentId);
        if (!student) return <div>Student not found</div>;
        return (
          <div className="min-h-screen bg-slate-50 pb-20">
             <Navbar 
               role="Student" 
               // Hidden feature: Double click logo to toggle Admin for demo purposes
               onToggleAdmin={() => setView({ type: 'ADMIN_DASH' })}
               onExit={handleExitToMainSite}
             />
             <StudentDashboard 
               student={student} 
               onViewMock={(mockId) => setView({ type: 'MOCK_DETAIL', studentId: view.studentId, mockId, returnTo: view.studentId === 'STU_001' ? 'STUDENT' : 'ADMIN' })}
             />
          </div>
        );

      case 'MOCK_DETAIL':
        const attempt = db.getMockDetails(view.studentId, view.mockId);
        if (!attempt) return <div>Mock data not found</div>;
        return (
          <div className="min-h-screen bg-slate-50 pb-20">
             <Navbar role="Report View" onBack={() => setView({ type: 'STUDENT_DASH', studentId: view.studentId })} />
             <div className="max-w-7xl mx-auto px-4 mt-8">
                <MockAnalysisDashboard 
                  data={attempt.data} 
                  title={`Report: ${attempt.summary.id} (${attempt.summary.examType})`}
                  onBack={() => setView({ type: 'STUDENT_DASH', studentId: view.studentId })}
                />
             </div>
          </div>
        );
    }
  };

  return renderContent();
}

// Simplified Navbar to match entranceug.com style usually
const Navbar = ({ role, onBack, onToggleAdmin, onExit }: { role: string, onBack?: () => void, onToggleAdmin?: () => void, onExit?: () => void }) => (
  <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back
            </button>
          )}
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onDoubleClick={onToggleAdmin} 
            title="Double click for Admin view (Demo)"
          >
            <span className="text-2xl">📊</span>
            <span className="font-bold text-xl tracking-tight text-slate-800">EntranceUG Analytics</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
           {onExit ? (
             <button onClick={onExit} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
               <span>Return to Main Site</span>
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
             </button>
           ) : (
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               <span className="text-sm font-medium text-slate-600">Live Sync</span>
             </div>
           )}
        </div>
      </div>
    </div>
  </nav>
);