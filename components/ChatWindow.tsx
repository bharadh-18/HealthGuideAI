
import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, Attachment } from '../types';

interface ChatWindowProps {
  messages: Message[];
  onSend: (content: string, attachment?: Attachment) => void;
  isTyping: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSend, isTyping }) => {
  const [input, setInput] = useState('');
  const [stagedFile, setStagedFile] = useState<Attachment | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || stagedFile) && !isTyping) {
      onSend(input, stagedFile || undefined);
      setInput('');
      setStagedFile(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload an image (JPG/PNG) or a PDF file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = (event.target?.result as string).split(',')[1];
      setStagedFile({
        data: base64String,
        mimeType: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    // Clear the input so the same file can be picked again if removed
    e.target.value = '';
  };

  const commonQuestions = [
    "Hello! How are you doing today?",
    "I have a mild fever and cough.",
    "Can you summarize my prescription?",
    "Common causes of back pain?"
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm mx-6 mb-6 rounded-2xl border border-slate-200 relative overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto py-12">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Hello there! I'm HealthGuide.</h3>
            <p className="text-slate-500 mb-8">I'm here to listen and help. You can also upload your prescriptions for a summary.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {commonQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => onSend(q)}
                  className="text-left p-3 text-sm bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all text-slate-700 hover:text-blue-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${
                msg.role === Role.USER ? 'bg-slate-200 text-slate-600' : 'bg-blue-600 text-white'
              }`}>
                {msg.role === Role.USER ? 'U' : 'AI'}
              </div>
              <div className="flex flex-col gap-2">
                {msg.attachment && (
                  <div className={`flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-white ${msg.role === Role.USER ? 'self-end' : 'self-start'}`}>
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                      {msg.attachment.mimeType.includes('pdf') ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/></svg>
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-600 truncate max-w-[120px]">{msg.attachment.name}</span>
                  </div>
                )}
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === Role.USER 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none prose prose-slate max-w-none'
                }`}>
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                AI
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200">
        {stagedFile && (
          <div className="max-w-4xl mx-auto mb-3 flex items-center gap-3 p-2 bg-white border border-blue-100 rounded-xl shadow-sm animate-in slide-in-from-bottom-2 duration-200">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500">
              {stagedFile.mimeType.includes('pdf') ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/></svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/></svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-700 truncate">{stagedFile.name}</p>
              <p className="text-[10px] text-slate-400">Ready to analyze</p>
            </div>
            <button 
              onClick={() => setStagedFile(null)}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png,.pdf"
            className="hidden" 
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-500 hover:bg-white hover:text-blue-600 rounded-xl transition-all border border-transparent hover:border-slate-200"
            title="Attach a prescription or report"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={stagedFile ? "Ask about this document..." : "Type your message here..."}
            className="flex-1 px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={(!input.trim() && !stagedFile) || isTyping}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center justify-center w-12 h-12"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-2">
          Your friendly Health Assistant • Version 2.2 • Now with Document Analysis
        </p>
      </div>
    </div>
  );
};
