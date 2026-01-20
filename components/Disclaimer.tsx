
import React from 'react';

export const Disclaimer: React.FC = () => {
  return (
    <div className="mx-6 mt-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl flex items-start gap-4 text-blue-800 dark:text-blue-300 transition-colors">
      <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-50 dark:border-blue-800">
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="text-[11px] leading-relaxed font-semibold">
        <p className="uppercase tracking-widest text-[9px] text-blue-600 dark:text-blue-400 mb-0.5">Medical Safety Notice</p>
        <p className="opacity-80">This assistant is for triage information only. It does not provide medical diagnosis. In case of emergency, please call 911 or your local health services immediately.</p>
      </div>
    </div>
  );
};
