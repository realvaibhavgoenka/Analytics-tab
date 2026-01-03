import React, { useRef } from 'react';
import { ResponseRow } from '../types';

interface Props {
  onDataLoaded: (data: ResponseRow[]) => void;
}

export const FileUpload: React.FC<Props> = ({ onDataLoaded }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Try parsing JSON first
        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          if (Array.isArray(json)) {
            onDataLoaded(json as ResponseRow[]);
          } else {
            alert('Invalid JSON format. Expected an array of response objects.');
          }
        } else {
          // Placeholder for CSV logic, typically would use papaparse here
          // For now, we only strictly support the JSON structure provided in the prompt
          // but we prompt the user nicely.
          alert('Currently, only the standardized JSON format is supported for full analytics.');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
         onClick={() => fileInputRef.current?.click()}>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".json,.csv"
        className="hidden" 
      />
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
        </div>
        <div>
          <p className="font-semibold text-slate-700">Click to upload response sheet</p>
          <p className="text-sm text-slate-500 mt-1">Supports Standardized JSON</p>
        </div>
      </div>
    </div>
  );
};
