
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatSession, User } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onNewChat: () => void;
  isOpen: boolean;
  toggle: () => void;
  onLogout: () => void;
  user: User;
  lastSaved?: Date | null;
  lowBandwidth: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ sessions, activeId, onSelect, onDelete, onNewChat, isOpen, onLogout, user, lastSaved, lowBandwidth }) => {
  const transition = lowBandwidth ? { duration: 0 } : { duration: 0.3, ease: "easeInOut" };

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? 300 : 0 }}
      transition={transition}
      className="bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col overflow-hidden border-r border-slate-200 dark:border-slate-800"
    >
      <div className="w-[300px] flex flex-col h-full">
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="font-bold text-xl tracking-tight whitespace-nowrap text-slate-900 dark:text-white">Medly</h1>
          </div>
        </div>

        <motion.button
          whileHover={lowBandwidth ? {} : { scale: 1.01 }}
          whileTap={lowBandwidth ? {} : { scale: 0.99 }}
          onClick={onNewChat}
          className="mx-6 mb-4 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition-all font-semibold shadow-md shadow-blue-100 dark:shadow-none whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Health Session
        </motion.button>

        <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
          <div className="flex items-center justify-between px-2 mb-3">
            <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Recent Consultations</h2>
          </div>
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {sessions.map((session) => (
                <div key={session.id} className="relative group">
                  <motion.button
                    layout={!lowBandwidth}
                    initial={!lowBandwidth ? { opacity: 0, x: -10 } : { opacity: 1 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => onSelect(session.id)}
                    className={`w-full text-left px-3 py-3 rounded-xl flex items-center gap-3 transition-all whitespace-nowrap pr-10 border ${
                      activeId === session.id 
                      ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-medium' 
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                    }`}
                  >
                    <svg className={`w-4 h-4 flex-shrink-0 ${activeId === session.id ? 'text-blue-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <span className="truncate text-sm">{session.title}</span>
                  </motion.button>
                  <button
                    onClick={(e) => onDelete(session.id, e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-widest">
              {lastSaved ? `Cloud Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Encrypted & Secure'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex-shrink-0 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold border border-blue-100 dark:border-blue-800">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user.name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-medium">Verified Patient</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-500 transition-all rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};
