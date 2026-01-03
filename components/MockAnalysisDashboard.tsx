import React, { useMemo } from 'react';
import { SectionPerformanceChart, TopicEfficiencyChart, ErrorDistributionChart } from './Charts';
import { PriorityIndex } from './PriorityIndex';
import { MentorAI } from './MentorAI';
import { FullAnalysis, ResponseRow } from '../types';
import { analyzeMockData } from '../services/analyticsEngine';
import { db } from '../services/dataStore';

interface Props {
  data: ResponseRow[];
  onBack: () => void;
  title?: string;
}

export const MockAnalysisDashboard: React.FC<Props> = ({ data, onBack, title }) => {
  const analysis: FullAnalysis | null = useMemo(() => {
    if (!data || data.length === 0) return null;
    // Get important topics from DB for IPMAT (defaulting to IPMAT for this view)
    const config = db.getExamConfigs().find(c => c.id === 'IPMAT');
    return analyzeMockData(data, config?.importantTopics || []);
  }, [data]);

  const allTopics = useMemo(() => {
    if (!analysis) return [];
    return analysis.sections.flatMap(s => s.topics);
  }, [analysis]);

  if (!analysis) return <div className="p-10 text-center">No data available for analysis.</div>;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={onBack} className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
        <h2 className="text-xl font-bold text-slate-800">{title || `Analysis: ${analysis.mockId}`}</h2>
      </div>

      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium uppercase">Total Score</p>
          <p className="text-4xl font-bold text-indigo-600">{analysis.overallScore}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium uppercase">Accuracy</p>
          <p className={`text-4xl font-bold ${analysis.overallAccuracy > 80 ? 'text-emerald-500' : analysis.overallAccuracy > 60 ? 'text-amber-500' : 'text-red-500'}`}>
            {Math.round(analysis.overallAccuracy)}%
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium uppercase">Time Taken</p>
          <p className="text-2xl font-bold text-slate-800">{Math.floor(analysis.totalTime / 60)}m {Math.round(analysis.totalTime % 60)}s</p>
        </div>
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500 font-medium uppercase">Weakest Area</p>
          <p className="text-xl font-bold text-red-500 truncate">{analysis.weakestTopics[0] || 'N/A'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SectionPerformanceChart data={analysis.sections} />
            <ErrorDistributionChart sections={analysis.sections} />
          </div>
          <TopicEfficiencyChart sections={analysis.sections} />
          
          {/* Detailed Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-700">Topic Deep Dive</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 uppercase font-medium">
                  <tr>
                    <th className="px-6 py-3">Topic</th>
                    <th className="px-6 py-3">Attempts</th>
                    <th className="px-6 py-3">Accuracy</th>
                    <th className="px-6 py-3">Time/Q</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allTopics.map((t, i) => (
                    <tr key={i} className={`hover:bg-slate-50 transition-colors ${t.isImportant ? 'bg-indigo-50/50' : ''}`}>
                      <td className="px-6 py-3 font-medium text-slate-700 flex items-center gap-2">
                        {t.topic}
                        {t.isImportant && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200" title="Important Exam Topic">★</span>}
                      </td>
                      <td className="px-6 py-3">{t.attempts}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full ${t.accuracy >= 80 ? 'bg-emerald-500' : t.accuracy >= 50 ? 'bg-amber-400' : 'bg-red-500'}`} style={{width: `${t.accuracy}%`}}></div>
                          </div>
                          <span>{Math.round(t.accuracy)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-600">{Math.round(t.avgTime)}s</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-1 rounded text-xs font-semibold
                          ${t.status === 'Mastered' ? 'bg-emerald-100 text-emerald-800' : 
                            t.status === 'Speed Issue' ? 'bg-blue-100 text-blue-800' :
                            t.status === 'Conceptual Gap' ? 'bg-red-100 text-red-800' :
                            'bg-slate-100 text-slate-800'}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: AI & Priority */}
        <div className="space-y-6">
          <MentorAI analysis={analysis} />
          <PriorityIndex actions={analysis.priorityList} />
        </div>
      </div>
    </div>
  );
};
