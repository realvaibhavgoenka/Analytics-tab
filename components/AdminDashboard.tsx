import React, { useState, useRef } from 'react';
import { db } from '../services/dataStore';
import { ExamConfig, StudentProfile, ResponseRow } from '../types';

interface Props {
  onViewStudent: (studentId: string) => void;
}

export const AdminDashboard: React.FC<Props> = ({ onViewStudent }) => {
  const [activeTab, setActiveTab] = useState<'DATA' | 'STUDENTS' | 'EXAMS'>('DATA');
  const [students, setStudents] = useState(db.getStudents());
  const [exams, setExams] = useState(db.getExamConfigs());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exam Config State
  const [newTopic, setNewTopic] = useState('');
  const [selectedExamId, setSelectedExamId] = useState<string>('IPMAT');

  const refreshData = () => {
    setStudents([...db.getStudents()]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          // Send to DB for Bulk Ingestion
          db.bulkIngest(json as ResponseRow[]);
          refreshData();
          setActiveTab('STUDENTS');
          alert(`Successfully imported data for ${db.getStudents().length} unique students.`);
        } else {
          alert('Invalid JSON format. Expected an array of objects.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse file. Please ensure it is valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleAddTopic = () => {
    if (!newTopic.trim()) return;
    const currentConfig = exams.find(e => e.id === selectedExamId);
    if (currentConfig) {
      const updatedTopics = [...currentConfig.importantTopics, newTopic];
      db.updateExamConfig(selectedExamId, updatedTopics);
      setExams([...db.getExamConfigs()]); // Refresh local state
      setNewTopic('');
    }
  };

  const handleRemoveTopic = (examId: string, topic: string) => {
    const currentConfig = exams.find(e => e.id === examId);
    if (currentConfig) {
      const updatedTopics = currentConfig.importantTopics.filter(t => t !== topic);
      db.updateExamConfig(examId, updatedTopics);
      setExams([...db.getExamConfigs()]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Control Center</h1>
          <p className="text-slate-500 mt-1">Manage cohorts, import real data, and configure exam algorithms.</p>
        </div>
        <div className="text-right">
             <div className="text-sm font-semibold text-slate-700">Total Learners</div>
             <div className="text-3xl font-bold text-indigo-600">{students.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px]">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
           <button 
            onClick={() => setActiveTab('DATA')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'DATA' ? 'bg-white border-t-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            📂 Data Warehouse
          </button>
          <button 
            onClick={() => setActiveTab('STUDENTS')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'STUDENTS' ? 'bg-white border-t-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            🎓 Learner Management
          </button>
          <button 
            onClick={() => setActiveTab('EXAMS')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'EXAMS' ? 'bg-white border-t-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            ⚙️ Exam Config
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'DATA' && (
            <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in">
              <div 
                className="p-10 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl cursor-pointer hover:bg-indigo-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                 <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json"
                    onChange={handleFileUpload}
                 />
                 <div className="w-16 h-16 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-sm mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                 </div>
                 <h2 className="text-xl font-bold text-indigo-900">Upload Master Dataset</h2>
                 <p className="text-indigo-700 mt-2">Supports .JSON format exported from LMS/Excel</p>
                 <p className="text-xs text-indigo-500 mt-4">Required fields: student_id, mock_id, question_id, is_correct, etc.</p>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-xl text-left border border-slate-100">
                <h3 className="font-bold text-slate-700 mb-2">Ingestion Rules:</h3>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                  <li>System will automatically generate Student Profiles based on unique <code className="bg-slate-200 px-1 rounded">student_id</code> found in rows.</li>
                  <li>Mock Attempts are grouped by <code className="bg-slate-200 px-1 rounded">student_id</code> and <code className="bg-slate-200 px-1 rounded">mock_id</code>.</li>
                  <li>Performance metrics (Score, Accuracy) are calculated on-the-fly during ingestion.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'STUDENTS' && (
            <div>
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold text-slate-800">Enrolled Learners</h2>
                 <input 
                   type="text" 
                   placeholder="Search ID..." 
                   className="px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                 />
               </div>
               
               {students.length === 0 ? (
                 <div className="text-center py-20 text-slate-400">
                   <p className="mb-2">No students found.</p>
                   <button onClick={() => setActiveTab('DATA')} className="text-indigo-600 font-medium hover:underline">Go to Data Warehouse</button>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {students.map(student => (
                     <div key={student.id} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow bg-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-xl">
                            {student.avatar || '🎓'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-700 text-sm">{student.name}</p>
                            <p className="text-xs text-slate-500">{student.email}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => onViewStudent(student.id)}
                          className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-bold rounded hover:bg-indigo-100"
                        >
                          View Dash
                        </button>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}

          {activeTab === 'EXAMS' && (
            <div className="max-w-4xl mx-auto">
               <div className="flex gap-6 mb-8">
                 <div className="w-1/3 border-r border-slate-100 pr-6">
                    <h3 className="font-bold text-slate-500 text-xs uppercase mb-4">Select Exam Config</h3>
                    <div className="space-y-2">
                      {exams.map(exam => (
                        <div 
                          key={exam.id}
                          onClick={() => setSelectedExamId(exam.id)}
                          className={`p-3 rounded-lg cursor-pointer text-sm font-medium flex justify-between items-center ${selectedExamId === exam.id ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-white text-slate-600 hover:bg-slate-50 border border-transparent'}`}
                        >
                          {exam.name}
                          {selectedExamId === exam.id && <span className="text-indigo-500">●</span>}
                        </div>
                      ))}
                    </div>
                 </div>
                 
                 <div className="w-2/3">
                    {exams.find(e => e.id === selectedExamId) && (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-bold text-slate-800">Priority Topics</h3>
                          <span className="text-xs text-slate-400">These topics trigger "High Priority" alerts in analysis.</span>
                        </div>
                        
                        <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
                          <div className="flex flex-wrap gap-2">
                             {exams.find(e => e.id === selectedExamId)?.importantTopics.map(topic => (
                               <span key={topic} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-700 flex items-center gap-2">
                                 {topic}
                                 <button 
                                   onClick={() => handleRemoveTopic(selectedExamId, topic)}
                                   className="text-slate-400 hover:text-red-500"
                                 >
                                   ×
                                 </button>
                               </span>
                             ))}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={newTopic}
                            onChange={(e) => setNewTopic(e.target.value)}
                            placeholder="Add new important topic..."
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            onKeyPress={(e) => e.key === 'Enter' && handleAddTopic()}
                          />
                          <button 
                            onClick={handleAddTopic}
                            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
                          >
                            Add
                          </button>
                        </div>
                      </>
                    )}
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};