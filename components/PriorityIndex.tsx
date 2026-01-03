import React from 'react';
import { PriorityAction } from '../types';

interface Props {
  actions: PriorityAction[];
}

export const PriorityIndex: React.FC<Props> = ({ actions }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'FOCUS': return '🎯';
      case 'PAUSE': return '🛑';
      case 'REVISE': return '⚡';
      default: return '•';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'FOCUS': return 'bg-red-50 border-red-100 text-red-800';
      case 'PAUSE': return 'bg-amber-50 border-amber-100 text-amber-800';
      case 'REVISE': return 'bg-blue-50 border-blue-100 text-blue-800';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-slate-700">Priority Index</h3>
        <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">ALGORITHM GENERATED</span>
      </div>
      <div className="p-4 space-y-3">
        {actions.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Great job! No critical issues detected.</p>
        ) : (
          actions.map((action, idx) => (
            <div key={idx} className={`p-3 rounded-lg border flex items-start gap-3 ${getColor(action.type)}`}>
              <span className="text-2xl">{getIcon(action.type)}</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm uppercase tracking-wide opacity-75">{action.type}</span>
                  <span className="font-bold text-base">{action.topic}</span>
                </div>
                <p className="text-sm opacity-90 leading-tight">{action.reason}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
