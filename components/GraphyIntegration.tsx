import React, { useState } from 'react';
import { ResponseRow } from '../types';
import { fetchGraphyData } from '../services/graphyService';

interface Props {
  onDataLoaded: (data: ResponseRow[]) => void;
  defaultEmail?: string;
}

export const GraphyIntegration: React.FC<Props> = ({ onDataLoaded, defaultEmail = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your login details.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchGraphyData(email, password);
      onDataLoaded(data);
      setIsOpen(false);
      setPassword(''); // Clear sensitive data
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-white border border-slate-200 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition shadow-sm flex items-center gap-2 text-sm"
      >
        {/* Cloud Download Icon */}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
        Sync Course Data
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative">
            
            {/* Clean Header */}
            <div className="px-6 pt-6 pb-2 flex justify-between items-start">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                 </div>
                 <div>
                    <h3 className="font-bold text-slate-800 text-lg">Connect Account</h3>
                    <p className="text-xs text-slate-500">learn.ipmat-pro.com</p>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-6">
                Sign in to your course portal to automatically sync your latest mock test results.
              </p>
              
              <form onSubmit={handleSync} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 outline-none"
                  />
                </div>

                {error && <p className="text-red-500 text-xs font-medium text-center">{error}</p>}

                <button 
                  type="submit" 
                  disabled={loading}
                  className={`w-full text-white font-bold rounded-xl text-sm px-5 py-3 text-center transition-transform active:scale-[0.98] shadow-lg shadow-indigo-200 ${loading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                >
                  {loading ? 'Authenticating...' : 'Sign In & Sync'}
                </button>
              </form>
            </div>
            
            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
              <p className="text-xs text-slate-400">Secure connection via TLS 1.3</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};