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
  const [editingExam, setEditingExam] = useState<string | null>(null);
  const [newTopic, setNewTopic] = useState('');

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
              <div className="p-10 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-2xl">
                 <div className="w-16 h-16 bg-white text-indigo-600 rounded-full flex items-center justify-center shadow-sm mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                 </div>
                 <h2