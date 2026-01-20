
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { Header } from './components/Header';
import { Disclaimer } from './components/Disclaimer';
import { BookingModal } from './components/BookingModal';
import { LoginPage } from './components/LoginPage';
import { SettingsModal } from './components/SettingsModal';
import { OfflineResources } from './components/OfflineResources';
import { ChatSession, Role, Message, SUPPORTED_LANGUAGES, Attachment, User, AppSettings } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(SUPPORTED_LANGUAGES[0]);
  const [isTyping, setIsTyping] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOfflineResourcesOpen, setIsOfflineResourcesOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('medly_settings');
    return saved ? JSON.parse(saved) : { 
      thinkingMessages: ['Consulting knowledge...', 'Analyzing vitals...', 'Preparing guidance...'],
      lowBandwidthMode: false,
      textOnlyMode: false
    };
  });

  const activeSession = sessions.find(s => s.id === activeSessionId);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setIsOfflineResourcesOpen(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const savedUser = localStorage.getItem('medly_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user) {
      const storageKey = `medly_sessions_${user.email}`;
      const savedSessions = localStorage.getItem(storageKey);
      if (savedSessions) {
        try {
          const parsedSessions: ChatSession[] = JSON.parse(savedSessions);
          setSessions(parsedSessions);
          if (parsedSessions.length > 0) {
            setActiveSessionId(parsedSessions[0].id);
            geminiService.startNewChat(parsedSessions[0].language);
          } else {
            handleNewChat();
          }
        } catch (e) {
          handleNewChat();
        }
      } else {
        handleNewChat();
      }
    }
  }, [user]);

  // Persist sessions on every change
  useEffect(() => {
    if (user && sessions.length > 0) {
      localStorage.setItem(`medly_sessions_${user.email}`, JSON.stringify(sessions));
      setLastSaved(new Date());
    }
  }, [sessions, user]);

  // Save settings
  useEffect(() => {
    localStorage.setItem('medly_settings', JSON.stringify(settings));
  }, [settings]);

  // Explicit Auto-save Timer
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(() => {
      if (sessions.length > 0) {
        localStorage.setItem(`medly_sessions_${user.email}`, JSON.stringify(sessions));
        setLastSaved(new Date());
      }
    }, 120000); 

    return () => clearInterval(interval);
  }, [sessions, user]);

  const handleLogin = (newUser: User) => {
    localStorage.setItem('medly_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('medly_user');
    setUser(null);
    setSessions([]);
    setActiveSessionId(null);
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Consultation',
      messages: [],
      language: currentLanguage.code,
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    geminiService.startNewChat(currentLanguage.code);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedSessions = sessions.filter(s => s.id !== id);
    if (updatedSessions.length === 0) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: 'New Consultation',
        messages: [],
        language: currentLanguage.code,
      };
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
      geminiService.startNewChat(currentLanguage.code);
    } else {
      setSessions(updatedSessions);
      if (activeSessionId === id) {
        setActiveSessionId(updatedSessions[0].id);
        geminiService.startNewChat(updatedSessions[0].language);
      }
    }
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    const session = sessions.find(s => s.id === id);
    if (session) geminiService.startNewChat(session.language);
  };

  const handleLanguageChange = (lang: typeof SUPPORTED_LANGUAGES[0]) => {
    setCurrentLanguage(lang);
    if (activeSessionId) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, language: lang.code } : s));
      geminiService.startNewChat(lang.code);
    }
  };

  const handleGenerateSummary = () => {
    if (!activeSessionId || isTyping) return;
    handleSendMessage("Please generate a professional, clinical summary for my doctor, structured with sections for Symptoms, Onset, and Modifying factors.");
  };

  const handleRateMessage = (messageId: string, rating: 'up' | 'down') => {
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: s.messages.map(m => m.id === messageId ? { ...m, feedback: m.feedback === rating ? null : rating } : m)
        };
      }
      return s;
    }));
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!activeSessionId || isTyping) return;

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const messageIndex = s.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return s;
        const updatedMessages = [...s.messages];
        updatedMessages[messageIndex] = { ...updatedMessages[messageIndex], content: newContent };
        return { ...s, messages: updatedMessages };
      }
      return s;
    }));
  };

  const handleSendMessage = async (content: string, attachment?: Attachment) => {
    if (!activeSessionId || (!content.trim() && !attachment)) return;
    if (!isOnline) {
      setIsOfflineResourcesOpen(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: content,
      timestamp: new Date(),
      attachment
    };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: [...s.messages, userMessage],
          title: s.messages.length === 0 ? (content.slice(0, 30) || attachment?.name || 'Symptom Consultation') : s.title
        };
      }
      return s;
    }));

    setIsTyping(true);
    const assistantMessageId = (Date.now() + 1).toString();

    try {
      await geminiService.sendMessage(
        content, 
        (chunk, groundingSources) => {
          setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
              const existingMsg = s.messages.find(m => m.id === assistantMessageId);
              if (existingMsg) {
                return { ...s, messages: s.messages.map(m => m.id === assistantMessageId ? { ...m, content: chunk, groundingSources } : m) };
              } else {
                return { ...s, messages: [...s.messages, { id: assistantMessageId, role: Role.ASSISTANT, content: chunk, timestamp: new Date(), groundingSources }] };
              }
            }
            return s;
          }));
        },
        (details) => setBookingDetails(details),
        attachment ? { data: attachment.data, mimeType: attachment.mimeType } : undefined
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  const transition = settings.lowBandwidthMode ? { duration: 0 } : { duration: 0.5, ease: "easeInOut" };

  return (
    <div className={`h-screen w-screen overflow-hidden font-inter transition-colors ease-in-out bg-slate-50 dark:bg-slate-950`} style={{ transitionDuration: settings.lowBandwidthMode ? '0ms' : '500ms' }}>
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
            <LoginPage onLogin={handleLogin} />
          </motion.div>
        ) : (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full w-full" transition={transition}>
            <Sidebar 
              sessions={sessions} 
              activeId={activeSessionId} 
              onSelect={handleSelectSession} 
              onDelete={handleDeleteSession}
              onNewChat={handleNewChat} 
              isOpen={isSidebarOpen} 
              toggle={() => setIsSidebarOpen(!isSidebarOpen)} 
              onLogout={handleLogout} 
              user={user} 
              lastSaved={lastSaved}
              lowBandwidth={settings.lowBandwidthMode}
            />
            <main className="flex-1 flex flex-col relative h-full">
              <Header 
                currentLanguage={currentLanguage} 
                onLanguageChange={handleLanguageChange} 
                isSidebarOpen={isSidebarOpen} 
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
                onOpenSettings={() => setIsSettingsOpen(true)}
                isOnline={isOnline}
                onOpenOfflineResources={() => setIsOfflineResourcesOpen(true)}
                lowBandwidth={settings.lowBandwidthMode}
              />
              <div className="flex-1 overflow-hidden flex flex-col">
                <Disclaimer />
                <div className="flex-1 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeSessionId || 'empty'} 
                      initial={settings.lowBandwidthMode ? { opacity: 1 } : { opacity: 0, scale: 0.98 }} 
                      animate={{ opacity: 1, scale: 1 }} 
                      exit={settings.lowBandwidthMode ? { opacity: 0 } : { opacity: 0, scale: 0.98 }} 
                      className="absolute inset-0"
                    >
                      <ChatWindow 
                        messages={activeSession?.messages || []} 
                        onSend={handleSendMessage} 
                        onGenerateSummary={handleGenerateSummary} 
                        onRateMessage={handleRateMessage}
                        onEditMessage={handleEditMessage}
                        isTyping={isTyping} 
                        thinkingMessages={settings.thinkingMessages}
                        isOnline={isOnline}
                        onOpenOfflineResources={() => setIsOfflineResourcesOpen(true)}
                        lowBandwidth={settings.lowBandwidthMode}
                        textOnly={settings.textOnlyMode}
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {bookingDetails && <BookingModal details={bookingDetails} onClose={() => setBookingDetails(null)} />}
        {isSettingsOpen && <SettingsModal settings={settings} onSave={setSettings} onClose={() => setIsSettingsOpen(false)} />}
        {isOfflineResourcesOpen && <OfflineResources lowBandwidth={settings.lowBandwidthMode} onClose={() => setIsOfflineResourcesOpen(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default App;
