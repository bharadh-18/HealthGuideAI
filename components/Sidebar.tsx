
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatSession, User } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  toggle: () => void;
  onLogout: () => void;
  user: User;
}

export const Sidebar: React.FC<SidebarProps> = ({ sessions, activeId, onSelect, onNewChat, isOpen, onLogout, user }) => {
  return (
    <motion.aside 
      initial={false}
      animate={{ width: isOpen ? 320 : 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="bg-slate-900 text-slate-100 flex flex-col overflow-hidden border-r border-slate-800"
    >
      <div className="w-80 flex flex-col h-full">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="font-bold text-lg whitespace-nowrap">HealthGuide AI</h1>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewChat}
          className="mx-4 my-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition-colors font-medium shadow-lg whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Session
        </motion.button>

        <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
          <h2 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Queries</h2>
          <div className="space-y-1">
            <AnimatePresence initial={false}>
              {sessions.map((session) => (
                <motion.button
                  key={session.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ backgroundColor: "rgba(30, 41, 59, 0.5)" }}
                  onClick={() => onSelect(session.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-all whitespace-nowrap ${
                    activeId === session.id 
                    ? 'bg-slate-800 text-white ring-1 ring-slate-700' 
                    : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <svg className={`w-4 h-4 ${activeId === session.id ? 'text-blue-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className="truncate text-sm">{session.title}</span>
                </motion.button>
              ))}
            </AnimatePresence>
            {sessions.length === 0 && (
              <p className="px-3 text-xs text-slate-500 italic">No history yet</p>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 flex-shrink-0 flex items-center justify-center text-blue-400 font-bold border border-blue-600/30">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
              </div>
            </div>
            <motion.button 
              whileHover={{ scale: 1.1, color: "#f87171" }}
              whileTap={{ scale: 0.9 }}
              onClick={onLogout}
              className="p-2 text-slate-500 transition-all"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};
