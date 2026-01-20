
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SUPPORTED_LANGUAGES, Language } from '../types';
import { useTheme } from '../ThemeContext';

interface HeaderProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  onOpenSettings: () => void;
  isOnline: boolean;
  onOpenOfflineResources: () => void;
  lowBandwidth: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentLanguage, 
  onLanguageChange, 
  isSidebarOpen, 
  toggleSidebar, 
  onOpenSettings,
  isOnline,
  onOpenOfflineResources,
  lowBandwidth
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-30 transition-all duration-500 ease-in-out">
      <div className="flex items-center gap-5">
        <button 
          onClick={toggleSidebar}
          className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-500 dark:text-slate-400 transition-all"
          title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="hidden md:flex flex-col">
          <div className="flex items-center gap-2">
            <h2 className="text-slate-900 dark:text-slate-100 font-extrabold text-xl tracking-tight transition-colors duration-500">Medly</h2>
            {!isOnline && (
              <span className="bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-blue-100 dark:border-blue-800">Offline</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`}></span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
              {isOnline ? 'Verified Expert AI Active' : 'Emergency Guidelines Active'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {!isOnline && (
          <button
            onClick={onOpenOfflineResources}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-[11px] font-bold uppercase hidden lg:inline">First Aid Resources</span>
          </button>
        )}

        <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
          <button
            onClick={toggleTheme}
            className="p-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:shadow-sm"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <ThemeIcon theme={theme} />
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2.5 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all text-slate-500 dark:text-slate-400 hover:shadow-sm"
            title="Personalize Experience"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl transition-all text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md"
          >
            <span className="text-xl">{currentLanguage.flag}</span>
            <span className="hidden sm:inline uppercase tracking-widest text-xs">{currentLanguage.name}</span>
            <svg className={`w-4 h-4 transition-transform duration-300 ${showLangMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {showLangMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowLangMenu(false)}></div>
                <motion.div 
                  initial={!lowBandwidth ? { opacity: 0, y: 10, scale: 0.95 } : { opacity: 1 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={!lowBandwidth ? { opacity: 0, y: 10, scale: 0.95 } : { opacity: 0 }}
                  className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl z-20 py-2 max-h-[70vh] overflow-y-auto custom-scrollbar"
                >
                  <div className="px-4 py-2 mb-1 border-b border-slate-50 dark:border-slate-700">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Select Language</p>
                  </div>
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        onLanguageChange(lang);
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3 text-sm transition-all ${
                        currentLanguage.code === lang.code ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span className="flex-1 text-left">{lang.name}</span>
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

const ThemeIcon = ({ theme }: { theme: 'light' | 'dark' }) => (
  theme === 'light' ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707.707M7.757 6.343l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
  )
);
