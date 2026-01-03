import React, { useState } from 'react';
import { db } from '../services/dataStore';
import { ExamConfig, StudentProfile } from '../types';

interface Props {
  onViewStudent: (studentId: string) => void;
}

export const AdminDashboard: React.FC<Props> = ({ onViewStudent }) => {
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'EXAMS'>('STUDENTS');
  const [students] = useState(db.getStudents());
  const [exams, setExams] = useState(db.getExamConfigs());

  // Exam Config State
  const [editingExam, setEditingExam] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState('');

  const handleAddTopic = (examId: string) => {
    if (!newTopic.trim()) return;
    const currentConfig = exams.find(e => e.id === examId);
    if (currentConfig) {
      const updatedTopics = [...currentConfig.importantTopics, newTopic];
      db.updateExamConfig(examId, updatedTopics);
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Admin Control Center</h1>
        <p className="text-slate-500 mt-1">Manage cohorts, view student reports, and configure exam algorithms.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px]">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('STUDENTS')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'STUDENTS' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Learner Management
          </button>
          <button 
            onClick={() => setActiveTab('EXAMS')}
            className={`px-6 py-4 text-sm font-medium transition-colors ${activeTab === 'EXAMS' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Exam Configuration
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'STUDENTS' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Enrolled Students ({students.length})</h3>
                <div className="relative">
                  <input type="text" placeholder="Search student..." className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500" />
                  <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Courses</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mocks Attempted</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {students.map(student => {
                      const history = db.getStudentHistory(student.id);
                      return (
                        <tr key={student.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-xl">
                                {student.avatar}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-slate-900">{student.name}</div>
                                <div className="text-sm text-slate-500">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {student.enrolledCourses.map(c => (
                                <span key={c} className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {history.length} Mocks
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => onViewStudent(student.id)} className="text-indigo-600 hover:text-indigo-900">View Report</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'EXAMS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {exams.map(exam => (
                <div key={exam.id} className="border border-slate-200 rounded-xl p-6 bg-slate-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{exam.name}</h3>
                      <p className="text-sm text-slate-500">ID: {exam.id}</p>
                    </div>
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">High Priority Topics (Weightage Boost)</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {exam.importantTopics.map(topic => (
                        <span key={topic} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-sm text-slate-700 flex items-center gap-2 shadow-sm">
                          {topic}
                          <button onClick={() => handleRemoveTopic(exam.id, topic)} className="text-slate-400 hover:text-red-500">×</button>
                        </span>
                      ))}
                      {exam.importantTopics.length === 0 && <p className="text-sm text-slate-400 italic">No priority topics configured.</p>}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add topic (e.g. Geometry)"
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500"
                      value={editingExam === exam.id ? newTopic : ''}
                      onChange={(e) => {
                        setEditingExam(exam.id);
                        setNewTopic(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddTopic(exam.id);
                      }}
                    />
                    <button 
                      onClick={() => handleAddTopic(exam.id)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Reports for this exam will prioritize these topics.</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
