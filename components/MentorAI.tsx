import React, { useState } from 'react';
import { FullAnalysis } from '../types';
import { generateMentorFeedback } from '../services/geminiService';

interface Props {
  analysis: FullAnalysis;
}

export const MentorAI: React.FC<Props> = ({ analysis }) => {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generateMentorFeedback(analysis);
    setFeedback(result);
    setLoading(false);
  };

  // Helper to parse markdown-style bolding **text**
  const parseContent = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-yellow-300 font-semibold">{part.replace(/\*\*/g, '')}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-xl shadow-lg text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 p-3 opacity-10">
        <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" /></svg>
      </div>
      
      <div className="p-6 relative z-10">
        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
          <span>🤖</span> AI Mentor Summary
        </h3>
        <p className="text-indigo-200 text-sm mb-6">
          Get personalized, deep insights powered by Gemini. Not just charts, but strategy.
        </p>

        {!feedback && !loading && (
          <button 
            onClick={handleGenerate}
            className="w-full py-3 bg-white text-indigo-900 font-bold rounded-lg hover:bg-indigo-50 transition-colors shadow-md flex items-center justify-center gap-2"
          >
            <span>Analyze My Performance</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </button>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-400 border-t-white rounded-full animate-spin"></div>
            <p className="text-sm text-indigo-200 animate-pulse">Analyzing topic matrices...</p>
          </div>
        )}

        {feedback && (
          <div className="prose prose-invert prose-sm max-w-none bg-white/10 p-4 rounded-lg border border-white/20">
            {feedback.split('\n').map((line, i) => (
              <p key={i} className="mb-2 leading-relaxed">
                {parseContent(line)}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};