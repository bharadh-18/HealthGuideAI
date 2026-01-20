
import React from 'react';
import { motion } from 'framer-motion';
import { EMERGENCY_INSTRUCTIONS, CACHED_FAQS } from '../services/offlineData';

interface OfflineResourcesProps {
  onClose: () => void;
  lowBandwidth: boolean;
}

export const OfflineResources: React.FC<OfflineResourcesProps> = ({ onClose, lowBandwidth }) => {
  const transition = lowBandwidth ? { duration: 0 } : { type: "spring", damping: 25, stiffness: 200 };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={transition}
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 dark:bg-black/85 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Essential Health Resources
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Available offline for your safety</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <section>
            <h3 className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Emergency Instructions
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              {EMERGENCY_INSTRUCTIONS.map((item, idx) => (
                <div key={idx} className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl">
                  <h4 className="font-bold text-red-800 dark:text-red-300 mb-1">{item.title}</h4>
                  <p className="text-sm text-red-700 dark:text-red-400/80 leading-relaxed">{item.content}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">Common Health FAQs</h3>
            <div className="space-y-4">
              {CACHED_FAQS.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.content}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-500 max-w-md mx-auto">
            These resources are pre-loaded to ensure you have vital information even without an internet connection. Always seek professional help in emergencies.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
