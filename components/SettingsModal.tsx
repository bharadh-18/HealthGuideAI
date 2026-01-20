
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSettings } from '../types';

interface SettingsModalProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onSave, onClose }) => {
  const [thinkingList, setThinkingList] = useState<string[]>(settings.thinkingMessages);
  const [newItem, setNewItem] = useState('');
  const [lowBandwidth, setLowBandwidth] = useState(settings.lowBandwidthMode);
  const [textOnly, setTextOnly] = useState(settings.textOnlyMode);

  const handleAdd = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newItem.trim()) {
      setThinkingList([...thinkingList, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemove = (index: number) => {
    setThinkingList(thinkingList.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({ 
      ...settings, 
      thinkingMessages: thinkingList.length > 0 ? thinkingList : ['Thinking...'],
      lowBandwidthMode: lowBandwidth,
      textOnlyMode: textOnly
    });
    onClose();
  };

  const Toggle = ({ active, onToggle, label, description }: any) => (
    <div className="flex items-center justify-between py-4">
      <div className="pr-4">
        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{label}</p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-1">{description}</p>
      </div>
      <button 
        onClick={() => onToggle(!active)}
        className={`w-12 h-6 rounded-full relative transition-all duration-300 flex-shrink-0 ${active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-200 dark:bg-slate-800'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${active ? 'translate-x-7' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800"
      >
        <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Preferences</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <section>
            <label className="block text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
              AI Thinking Sequence
            </label>
            
            <div className="space-y-2 mb-4">
              <AnimatePresence initial={false}>
                {thinkingList.map((msg, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-xl group"
                  >
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{msg}</span>
                    <button 
                      onClick={() => handleRemove(idx)}
                      className="p-1.5 text-slate-300 hover:text-red-500 transition-all rounded-lg hover:bg-white dark:hover:bg-slate-700 opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add a custom phase..."
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={!newItem.trim()}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </form>
            <p className="mt-3 text-[10px] text-slate-400 dark:text-slate-500 font-medium">These messages cycle while Medly prepares your guidance.</p>
          </section>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
            <Toggle 
              label="Low Bandwidth UI" 
              active={lowBandwidth} 
              onToggle={setLowBandwidth} 
              description="Simplifies visuals and reduces animations for efficiency."
            />
            <div className="border-t border-slate-50 dark:border-slate-800/50" />
            <Toggle 
              label="Text Only Mode" 
              active={textOnly} 
              onToggle={setTextOnly} 
              description="Disables file uploads and camera features for privacy."
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold py-4 rounded-2xl transition-all text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 text-sm"
            >
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
