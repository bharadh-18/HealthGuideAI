
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { Header } from './components/Header';
import { Disclaimer } from './components/Disclaimer';
import { BookingModal } from './components/BookingModal';
import { LoginPage } from './components/LoginPage';
import { ChatSession, Role, Message, SUPPORTED_LANGUAGES, Attachment, User } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(SUPPORTED_LANGUAGES[0]);
  const [isTyping, setIsTyping] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any | null>(null);
  
  const activeSession = sessions.find(s => s.id === activeSessionId);

  useEffect(() => {
    const savedUser = localStorage.getItem('healthguide_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      const storageKey = `health_sessions_${user.email}`;
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
          console.error("Failed to parse saved sessions", e);
          handleNewChat();
        }
      } else {
        handleNewChat();
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && sessions.length > 0) {
      const storageKey = `health_sessions_${user.email}`;
      localStorage.setItem(storageKey, JSON.stringify(sessions));
    }
  }, [sessions, user]);

  const handleLogin = (newUser: User) => {
    localStorage.setItem('healthguide_user', JSON.stringify(newUser));
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('healthguide_user');
    setUser(null);
    setSessions([]);
    setActiveSessionId(null);
  };

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Health Query',
      messages: [],
      language: currentLanguage.code,
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    geminiService.startNewChat(currentLanguage.code);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    const session = sessions.find(s => s.id === id);
    if (session) {
      geminiService.startNewChat(session.language);
    }
  };

  const handleLanguageChange = (lang: typeof SUPPORTED_LANGUAGES[0]) => {
    setCurrentLanguage(lang);
    if (activeSessionId) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, language: lang.code } : s));
      geminiService.startNewChat(lang.code);
    }
  };

  const handleSendMessage = async (content: string, attachment?: Attachment) => {
    if (!activeSessionId || (!content.trim() && !attachment)) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: content || (attachment ? `Analyzed document: ${attachment.name}` : ""),
      timestamp: new Date(),
      attachment
    };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: [...s.messages, userMessage],
          title: s.messages.length === 0 ? (content.slice(0, 30) || attachment?.name || 'New Query') : s.title
        };
      }
      return s;
    }));

    setIsTyping(true);
    const assistantMessageId = (Date.now() + 1).toString();

    try {
      await geminiService.sendMessage(
        content || "Please analyze this document.", 
        (chunk, groundingSources) => {
          setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
              const existingMsg = s.messages.find(m => m.id === assistantMessageId);
              if (existingMsg) {
                return {
                  ...s,
                  messages: s.messages.map(m => m.id === assistantMessageId ? { ...m, content: chunk, groundingSources } : m)
                };
              } else {
                return {
                  ...s,
                  messages: [...s.messages, {
                    id: assistantMessageId,
                    role: Role.ASSISTANT,
                    content: chunk,
                    timestamp: new Date(),
                    groundingSources
                  }]
                };
              }
            }
            return s;
          }));
        },
        (details) => {
          setBookingDetails(details);
        },
        attachment ? { data: attachment.data, mimeType: attachment.mimeType } : undefined
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 overflow-hidden font-inter">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full w-full"
          >
            <LoginPage onLogin={handleLogin} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-full w-full overflow-hidden"
          >
            <Sidebar 
              sessions={sessions} 
              activeId={activeSessionId} 
              onSelect={handleSelectSession} 
              onNewChat={handleNewChat}
              isOpen={isSidebarOpen}
              toggle={() => setIsSidebarOpen(!isSidebarOpen)}
              onLogout={handleLogout}
              user={user}
            />
            
            <main className="flex-1 flex flex-col relative h-full">
              <Header 
                currentLanguage={currentLanguage} 
                onLanguageChange={handleLanguageChange}
                isSidebarOpen={isSidebarOpen}
                toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              />
              
              <div className="flex-1 overflow-hidden flex flex-col">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Disclaimer />
                </motion.div>
                <div className="flex-1 overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSessionId || 'empty'}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="absolute inset-0"
                    >
                      <ChatWindow 
                        messages={activeSession?.messages || []} 
                        onSend={handleSendMessage}
                        isTyping={isTyping}
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
        {bookingDetails && (
          <BookingModal 
            details={bookingDetails} 
            onClose={() => setBookingDetails(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
