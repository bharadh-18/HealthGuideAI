
import React from 'react';
import { ChatSession } from '../types';

interface SidebarProps {
  sessions: ChatSession[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  isOpen: boolean;
  toggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ sessions, activeId, onSelect, onNewChat, isOpen }) => {
  return (
    <aside className={`${isOpen ? 'w-80' : 'w-0'} bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out flex flex-col overflow-hidden border-r border-slate-800`}>
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="font-bold text-lg">HealthGuide AI</h1>
        </div>
      </div>

      <button
        onClick={onNewChat}
        className="mx-4 my-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl transition-colors font-medium shadow-lg shadow-blue-900/20"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        New Session
      </button>

      <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
        <h2 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recent Queries</h2>
        <div className="space-y-1">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelect(session.id)}
              className={`w-full text-left px-3 py-3 rounded-lg flex items-center gap-3 transition-all ${
                activeId === session.id 
                ? 'bg-slate-800 text-white ring-1 ring-slate-700' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <svg className={`w-4 h-4 ${activeId === session.id ? 'text-blue-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="truncate text-sm">{session.title}</span>
            </button>
          ))}
          {sessions.length === 0 && (
            <p className="px-3 text-xs text-slate-500 italic">No history yet</p>
          )}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold">
            P
          </div>
          <div>
            <p className="text-sm font-medium">Guest Patient</p>
            <p className="text-xs text-slate-500">Free Tier</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
