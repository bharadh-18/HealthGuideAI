
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { Header } from './components/Header';
import { Disclaimer } from './components/Disclaimer';
import { BookingModal } from './components/BookingModal';
import { ChatSession, Role, Message, SUPPORTED_LANGUAGES, Attachment } from './types';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentLanguage, setCurrentLanguage] = useState(SUPPORTED_LANGUAGES[0]);
  const [isTyping, setIsTyping] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any | null>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId);

  useEffect(() => {
    if (sessions.length === 0) {
      handleNewChat();
    }
  }, []);

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
        (chunk) => {
          setSessions(prev => prev.map(s => {
            if (s.id === activeSessionId) {
              const existingMsg = s.messages.find(m => m.id === assistantMessageId);
              if (existingMsg) {
                return {
                  ...s,
                  messages: s.messages.map(m => m.id === assistantMessageId ? { ...m, content: chunk } : m)
                };
              } else {
                return {
                  ...s,
                  messages: [...s.messages, {
                    id: assistantMessageId,
                    role: Role.ASSISTANT,
                    content: chunk,
                    timestamp: new Date()
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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar 
        sessions={sessions} 
        activeId={activeSessionId} 
        onSelect={handleSelectSession} 
        onNewChat={handleNewChat}
        isOpen={isSidebarOpen}
        toggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <main className="flex-1 flex flex-col relative h-full">
        <Header 
          currentLanguage={currentLanguage} 
          onLanguageChange={handleLanguageChange}
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        <div className="flex-1 overflow-hidden flex flex-col">
          <Disclaimer />
          <ChatWindow 
            messages={activeSession?.messages || []} 
            onSend={handleSendMessage}
            isTyping={isTyping}
          />
        </div>
      </main>

      <BookingModal 
        details={bookingDetails} 
        onClose={() => setBookingDetails(null)} 
      />
    </div>
  );
};

export default App;
