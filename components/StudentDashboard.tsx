import React, { useMemo, useState, useEffect } from 'react';
import { db } from '../services/dataStore';
import { fetchStudentMocks } from '../services/graphyService';
import { generateMockData } from '../services/analyticsEngine';
import { StudentProfile, ResponseRow, MockAttempt } from '../types';
import { TrendAnalysisChart } from './Charts';

interface Props {
  student: StudentProfile;
  onViewMock: (mockId: string) => void;
}

export const StudentDashboard: React.FC<Props> = ({ student, onViewMock }) => {
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [isSyncing, setIsSyncing] = useState(false);
  const [simulatingTest, setSimulatingTest] = useState(false);
  
  const history = useMemo(() => db.getStudentHistory(student.id), [student.id, lastUpdate]);
  
  // Auto-Fetch Data on Mount (Simulating "Seamless Integration")
  useEffect(() => {
    const syncData = async () => {
      // Don't sync if we already have plenty of history (just a heuristic for demo)
      if (history.length > 5) return;

      setIsSyncing(true);
      try {
        const data = await fetchStudentMocks(student.id);
        handleDataImport(data);
      } catch (e) {
        console.error("Auto-sync failed", e);
      } finally {
        setIsSyncing(false);
      }
    };
    
    syncData();
  }, [student.id]);

  const handleDataImport = (data: ResponseRow[]) => {
    if (data.length === 0) return;
    const mockId = data[0].mock_id;
    
    // Check duplication
    if (db.getMockDetails(student.id, mockId)) return;

    const attempted = data.filter(r => r.attempted);
    const correct = attempted.filter(r => r.is_correct).length;
    const score = correct * 4 - (attempted.length - correct);
    const accuracy = attempted.length ? (correct / attempted.length) * 100 : 0;
    const avgTime = attempted.length ? attempted.reduce((a, b) => a + b.time_taken_seconds, 0) / attempted.length : 0;

    const newAttempt: MockAttempt = {
      id: mockId,
      studentId: student.id,
      examId: 'IPMAT',
      date: new Date().toISOString().split('T')[0],
      data: data,
      summary: {
        id: mockId,
        date: new Date().toISOString().split('T')[0],
        score,
        accuracy,
        avgTime,
        examType: 'IPMAT (Latest)'
      }
    };

    db.addAttempt(student.id, newAttempt);
    setLastUpdate(Date.now());
  };

  const handleSimulateTest = async () => {
    setSimulatingTest(true);
    // Simulate the time passing for a test (fast-forward)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newMockId = `MOCK_NEW_${Math.floor(Math.random() * 10000)}`;
    const rawData = generateMockData(newMockId);
    // Assign to current student
    rawData.forEach(r => r.student_id = student.id);
    
    handleDataImport(rawData);
    setSimulatingTest(false);
  };

  // Aggregate Stats
  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const avgScore = history.reduce((acc, curr) => acc + curr.summary.score, 0) / history.length;
    const totalQ = history.length;
    
    const topicMisses: Record<string, number> = {};
    history.forEach(attempt => {
      attempt.data.forEach(q => {
        if (q.attempted && !q.is_correct) {
          topicMisses[q.topic] = (topicMisses[q.topic] || 0) + 1;
        }
      });
    });
    
    const weaknesses = Object.entries(topicMisses)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic, count]) => ({ topic, count }));

    return { avgScore, totalQ, weaknesses };
  }, [history]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-3xl shadow-sm border border-indigo-200">
            {student.avatar}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Performance Overview</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-slate-500 text-sm">Student:</span>
              <span className="font-semibold text-slate-700">{student.name}</span>
            </div>
          </div>
        </div>
        
        {/* Sync Status Indicator */}
        <div className="flex items-center gap-3">
           {(isSyncing || simulatingTest) ? (
             <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100 text-sm font-medium">
               <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               {simulatingTest ? 'Processing Test Results...' : 'Syncing latest results...'}
             </div>
           ) : (
             <div className="flex items-center gap-2 px-4 py-2 bg-white text-slate-500 rounded-lg border border-slate-200 text-sm">
               <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
               Data Up to Date
             </div>
           )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Average Score</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-bold text-slate-800">{Math.round(stats?.avgScore || 0)}</span>
            <span className="text-sm text-green-500 font-medium">↑ 12 pts</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Tests Taken</p>
          <div className="mt-2">
            <span className="text-4xl font-bold text-slate-800">{stats?.totalQ || 0}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Focus Area</p>
          <div className="mt-2">
            <span className="text-xl font-bold text-red-500">{stats?.weaknesses[0]?.topic || 'None'}</span>
            <p className="text-xs text-slate-400 mt-1">
              Frequent errors in recent tests
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Trend & History */}
        <div className="lg:col-span-2 space-y-8">
          
          <TrendAnalysisChart history={history.map(h => h.summary)} />

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-700">Detailed Mock History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase">
                    <th className="px-6 py-3 text-left font-medium">Exam Name</th>
                    <th className="px-6 py-3 text-left font-medium">Date</th>
                    <th className="px-6 py-3 text-left font-medium">Score</th>
                    <th className="px-6 py-3 text-left font-medium">Accuracy</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.slice().reverse().map((h) => (
                    <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-700">{h.id} <span className="text-xs text-slate-400 ml-2">({h.summary.examType})</span></td>
                      <td className="px-6 py-4 text-slate-600">{h.date}</td>
                      <td className="px-6 py-4 font-bold text-indigo-600">{h.summary.score}</td>
                      <td className="px-6 py-4">
                         <span className={`px-2 py-1 rounded text-xs font-semibold ${h.summary.accuracy > 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                           {Math.round(h.summary.accuracy)}%
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => onViewMock(h.id)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          View Report &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                     <tr>
                       <td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">
                         No history available.
                       </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Aggregated Priorities */}
        <div className="space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
               <span>🚨</span> Critical Focus Areas
             </h3>
             <p className="text-sm text-slate-500 mb-4">Based on your cumulative performance.</p>
             
             <div className="space-y-3">
               {stats?.weaknesses.map((w, idx) => (
                 <div key={idx} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                   <span className="font-medium text-red-800">{w.topic}</span>
                   <span className="text-xs font-bold bg-white px-2 py-1 rounded text-red-600 shadow-sm">{w.count} errors</span>
                 </div>
               ))}
               {(!stats?.weaknesses || stats.weaknesses.length === 0) && <p className="text-sm text-slate-400">No major weaknesses detected yet.</p>}
             </div>
           </div>

           <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
             <h3 className="font-bold text-lg mb-2">Next Mock Available</h3>
             <p className="text-indigo-100 text-sm mb-4">IPMAT Full Length Mock #05 is live now.</p>
             <button 
               onClick={handleSimulateTest}
               disabled={simulatingTest}
               className={`w-full py-2 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition shadow ${simulatingTest ? 'opacity-75 cursor-wait' : ''}`}
             >
               {simulatingTest ? 'Starting Exam...' : 'Start Test Now'}
             </button>
           </div>
        </div>
      </div>
    </div>
  );
};