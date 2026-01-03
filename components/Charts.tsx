import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';
import { SectionAnalytics, TopicAnalytics, MockSummary } from '../types';

interface SectionChartProps {
  data: SectionAnalytics[];
}

export const SectionPerformanceChart: React.FC<SectionChartProps> = ({ data }) => {
  return (
    <div className="h-64 w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Sectional Performance</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="section" tick={{fontSize: 12}} interval={0} />
          <YAxis />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend />
          <Bar dataKey="score" fill="#4f46e5" name="Score" radius={[4, 4, 0, 0]} barSize={40} />
          <Bar dataKey="accuracy" fill="#10b981" name="Accuracy %" radius={[4, 4, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface TopicScatterProps {
  sections: SectionAnalytics[];
}

export const TopicEfficiencyChart: React.FC<TopicScatterProps> = ({ sections }) => {
  const [selectedSection, setSelectedSection] = useState<string>('All');

  const filteredTopics = useMemo(() => {
    if (selectedSection === 'All') {
      return sections.flatMap(s => s.topics);
    }
    const sectionData = sections.find(s => s.section === selectedSection);
    return sectionData ? sectionData.topics : [];
  }, [sections, selectedSection]);

  // Filter out topics with 0 attempts to reduce noise
  const activeTopics = filteredTopics.filter(t => t.attempts > 0);

  return (
    <div className="h-96 w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Speed vs. Accuracy Matrix</h3>
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="text-sm border-slate-200 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50 py-1 px-3 border outline-none cursor-pointer hover:bg-slate-100 transition-colors"
        >
          <option value="All">All Sections</option>
          {sections.map(s => (
            <option key={s.section} value={s.section}>{s.section}</option>
          ))}
        </select>
      </div>
      
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid />
            <XAxis type="number" dataKey="avgTime" name="Avg Time (s)" unit="s" label={{ value: 'Speed (Time/Q)', position: 'insideBottom', offset: -10 }} />
            <YAxis type="number" dataKey="accuracy" name="Accuracy" unit="%" label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft' }} />
            <ZAxis type="number" dataKey="attempts" range={[50, 400]} name="Attempts" />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }} 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg text-sm">
                      <p className="font-bold text-slate-800 mb-1">{data.topic}</p>
                      <p className="text-slate-600">Accuracy: <span className="font-semibold text-indigo-600">{Math.round(data.accuracy)}%</span></p>
                      <p className="text-slate-600">Time: <span className="font-semibold text-indigo-600">{Math.round(data.avgTime)}s</span></p>
                      <p className="text-slate-600">Attempts: {data.attempts}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter name="Topics" data={activeTopics} fill="#6366f1">
              {activeTopics.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.accuracy > 80 ? '#10b981' : entry.accuracy < 50 ? '#ef4444' : '#f59e0b'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex justify-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Mastered</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Unsteady</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Critical</span>
      </div>
    </div>
  );
};

export const ErrorDistributionChart: React.FC<{ sections: SectionAnalytics[] }> = ({ sections }) => {
  const data = useMemo(() => {
    let conceptual = 0;
    let calculation = 0;
    let misinterpretation = 0;
    let timePressure = 0;

    sections.flatMap(s => s.topics).forEach(t => {
      const wrong = t.attempts - t.correct;
      if (wrong <= 0) return;

      // Heuristic mapping of Topic Status to Error Classification
      switch(t.status) {
        case 'Conceptual Gap':
        case 'Needs Practice':
          conceptual += wrong;
          break;
        case 'Accuracy Issue':
          // Moderate accuracy usually implies silly mistakes or calculation errors
          calculation += wrong;
          break;
        case 'Guessing':
          // Fast and wrong implies rushing or misreading
          misinterpretation += wrong;
          break;
        case 'Speed Issue':
          // Slow but generally correct. The few errors here might be due to overthinking or time pressure at the end.
          timePressure += wrong;
          break;
        case 'Mastered':
           // Even masters make calculation errors
          calculation += wrong;
          break;
        default:
          conceptual += wrong;
      }
    });

    return [
      { name: 'Conceptual Gap', value: conceptual, color: '#ef4444' }, // Red
      { name: 'Calculation Error', value: calculation, color: '#f59e0b' }, // Amber
      { name: 'Misinterpretation', value: misinterpretation, color: '#6366f1' }, // Indigo
      { name: 'Time Pressure', value: timePressure, color: '#8b5cf6' }, // Violet
    ].filter(d => d.value > 0);
  }, [sections]);

  return (
    <div className="h-64 w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col">
      <h3 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">Error Classification</h3>
      <div className="flex-1 min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pr-20">
          <div className="text-center">
             <span className="text-2xl font-bold text-slate-700">
               {data.reduce((acc, curr) => acc + curr.value, 0)}
             </span>
             <p className="text-xs text-slate-500 uppercase">Errors</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const TrendAnalysisChart: React.FC<{ history: MockSummary[] }> = ({ history }) => {
  // Use placeholder data if history is sparse to demonstrate the visual
  const data = history.length < 2 ? [
    { id: 'MOCK_001', accuracy: 55, avgTime: 140 },
    { id: 'MOCK_002', accuracy: 62, avgTime: 130 },
    { id: 'MOCK_003', accuracy: 58, avgTime: 125 },
    { id: 'MOCK_004', accuracy: 70, avgTime: 110 },
    ...history // Append actual data
  ] : history;

  const isPlaceholder = history.length < 2;

  return (
    <div className="h-80 w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 relative">
       <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Mock-on-Mock Trend</h3>
          {isPlaceholder && <span className="text-xs text-indigo-400 font-medium bg-indigo-50 px-2 py-0.5 rounded">Projected / Placeholder Data</span>}
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1"><span className="w-3 h-1 bg-emerald-500 rounded"></span> Accuracy</div>
          <div className="flex items-center gap-1"><span className="w-3 h-1 bg-indigo-500 rounded"></span> Speed (Time/Q)</div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="id" tick={{fontSize: 10}} />
          <YAxis yAxisId="left" orientation="left" stroke="#10b981" label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
          <YAxis yAxisId="right" orientation="right" stroke="#6366f1" label={{ value: 'Time (s)', angle: 90, position: 'insideRight' }} />
          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
          <Line yAxisId="left" type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={{r: 4}} name="Accuracy %" />
          <Line yAxisId="right" type="monotone" dataKey="avgTime" stroke="#6366f1" strokeWidth={2} dot={{r: 4}} name="Avg Time (s)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
