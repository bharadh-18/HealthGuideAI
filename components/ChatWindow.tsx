
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, Role, Attachment } from '../types';

interface ChatWindowProps {
  messages: Message[];
  onSend: (content: string, attachment?: Attachment) => void;
  onGenerateSummary: () => void;
  onRateMessage?: (messageId: string, rating: 'up' | 'down') => void;
  onEditMessage?: (messageId: string, content: string) => void;
  isTyping: boolean;
  thinkingMessages: string[];
  isOnline: boolean;
  onOpenOfflineResources: () => void;
  lowBandwidth: boolean;
  textOnly: boolean;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onSend, 
  onGenerateSummary, 
  onRateMessage, 
  onEditMessage, 
  isTyping, 
  thinkingMessages,
  isOnline,
  onOpenOfflineResources,
  lowBandwidth,
  textOnly
}) => {
  const [input, setInput] = useState('');
  const [stagedFile, setStagedFile] = useState<Attachment | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [typingMessage, setTypingMessage] = useState(thinkingMessages[0] || 'Thinking...');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editInput, setEditInput] = useState('');
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    let interval: any;
    if (isTyping && thinkingMessages.length > 0) {
      let i = 0;
      setTypingMessage(thinkingMessages[0]);
      interval = setInterval(() => {
        i = (i + 1) % thinkingMessages.length;
        setTypingMessage(thinkingMessages[i]);
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isTyping, thinkingMessages]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const initCamera = async () => {
      if (!isCameraOpen || textOnly) return;
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          await videoRef.current.play();
        }
      } catch (err: any) {
        setIsCameraOpen(false);
      }
    };
    initCamera();
    return () => { activeStream?.getTracks().forEach(track => track.stop()); };
  }, [isCameraOpen, textOnly]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      onOpenOfflineResources();
      return;
    }
    if ((input.trim() || stagedFile) && !isTyping) {
      onSend(input, stagedFile || undefined);
      setInput('');
      setStagedFile(null);
    }
  };

  const startEditing = (msg: Message) => {
    setEditingId(msg.id);
    setEditInput(msg.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditInput('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && editInput.trim() && onEditMessage) {
      onEditMessage(editingId, editInput);
      setEditingId(null);
      setEditInput('');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || textOnly) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = (event.target?.result as string).split(',')[1];
      setStagedFile({ data: base64String, mimeType: file.type, name: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current && !textOnly) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setStagedFile({
          data: dataUrl.split(',')[1],
          mimeType: 'image/jpeg',
          name: `health_capture_${Date.now()}.jpg`
        });
        setIsCameraOpen(false);
      }
    }
  };

  const isClinicalSummary = (content: string) => content.includes("CLINICAL SUMMARY") || content.includes("[PATIENT PROFILE]");
  const msgTransition = lowBandwidth ? { duration: 0 } : { duration: 0.3, ease: "easeOut" };

  return (
    <div className={`flex-1 flex flex-col h-full bg-white dark:bg-slate-900 mx-6 mb-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 relative overflow-hidden transition-all duration-300 ${lowBandwidth ? '' : 'shadow-2xl shadow-blue-900/5'}`}>
      <AnimatePresence>
        {isCameraOpen && !textOnly && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 dark:bg-black/90 backdrop-blur-md p-4">
            <motion.div initial={!lowBandwidth ? { scale: 0.9, y: 20 } : { opacity: 1 }} animate={{ scale: 1, y: 0 }} exit={!lowBandwidth ? { scale: 0.9, y: 20 } : { opacity: 0 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl w-full max-w-lg relative border border-slate-200 dark:border-slate-800">
              <div className="p-5 flex items-center justify-between border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <h3 className="font-bold text-slate-900 dark:text-slate-100 px-2">Clinical Capture</h3>
                <button onClick={() => setIsCameraOpen(false)} className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="aspect-video bg-black flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
              </div>
              <div className="p-8 flex justify-center bg-white dark:bg-slate-900">
                <button onClick={capturePhoto} className="group w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-xl active:scale-90 transition-transform border-[6px] border-blue-50 dark:border-blue-900/30">
                  <div className="w-8 h-8 rounded-lg bg-white group-hover:scale-110 transition-transform"></div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        {!isOnline && (
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-5 rounded-3xl flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div>
              <p className="text-blue-900 dark:text-blue-100 font-bold">Limited Offline Mode</p>
              <p className="text-blue-700 dark:text-blue-400/80 text-xs mt-1 max-w-xs mx-auto">AI consultation is paused, but your essential first-aid resources remain accessible.</p>
            </div>
            <button 
              onClick={onOpenOfflineResources}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-200 dark:shadow-none"
            >
              View First Aid FAQs
            </button>
          </div>
        )}

        {messages.length === 0 && (
          <motion.div initial={!lowBandwidth ? { opacity: 0, y: 15 } : { opacity: 1 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full text-center max-w-lg mx-auto py-12">
            <div className="relative mb-8">
              {!lowBandwidth && (
                <motion.div 
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 blur-3xl rounded-full"
                />
              )}
              <div className="relative w-24 h-24 bg-white dark:bg-slate-800 rounded-[2rem] flex items-center justify-center shadow-xl border border-slate-100 dark:border-slate-700">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-3 tracking-tight">Hi there! I'm Medly</h3>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-medium leading-relaxed">Your professional assistant for symptom checks and health queries.</p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {["Check common symptoms", "Consult on lifestyle habits", "Prepare for a doctor's visit"].map((tip, i) => (
                <span key={i} className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-full text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{tip}</span>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={!lowBandwidth ? { opacity: 0, y: 10, scale: 0.98 } : { opacity: 1 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={msgTransition} className={`flex ${msg.role === Role.USER ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-4 max-w-[80%] ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}>
                <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-xs shadow-sm ${msg.role === Role.USER ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-blue-600 text-white'}`}>
                  {msg.role === Role.USER ? 'You' : 'AI'}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className={`p-5 rounded-[1.5rem] text-[15px] leading-[1.6] shadow-sm relative group transition-all duration-300 border ${
                    msg.role === Role.USER 
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-tr-none border-slate-900 dark:border-white' 
                    : isClinicalSummary(msg.content)
                      ? 'bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-emerald-900/50 text-slate-800 dark:text-slate-100 font-mono shadow-md rounded-tl-none'
                      : 'bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border-slate-100 dark:border-slate-700 rounded-tl-none'
                  }`}>
                    {msg.content.split('\n').map((line, i) => <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>)}
                    
                    {msg.role === Role.USER && isOnline && (
                      <button 
                        onClick={() => startEditing(msg)}
                        className="absolute -left-12 top-0 p-2 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-blue-600 transition-all rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex gap-4 items-center">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">AI</div>
              <div className="bg-white dark:bg-slate-800 px-5 py-4 rounded-[1.5rem] rounded-tl-none flex gap-3 items-center border border-slate-100 dark:border-slate-700 shadow-sm">
                {!lowBandwidth && (
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map(i => <motion.span key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} className="w-2 h-2 bg-blue-500 rounded-full" />)}
                  </div>
                )}
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{typingMessage}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-50 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-4xl mx-auto flex flex-col gap-3">
          {stagedFile && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800">
              <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-blue-600">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-blue-900 dark:text-blue-100 truncate">{stagedFile.name}</p>
                <p className="text-[10px] text-blue-700 dark:text-blue-400 uppercase font-bold tracking-widest">Medical Record Attached</p>
              </div>
              <button onClick={() => setStagedFile(null)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl text-blue-400 hover:text-red-500 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="flex gap-4 items-center">
            {!textOnly && (
              <>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <div className="flex gap-1.5 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <button 
                    type="button" 
                    disabled={!isOnline}
                    onClick={() => fileInputRef.current?.click()} 
                    className="p-2.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50" 
                    title="Upload Record"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </button>
                  <button 
                    type="button" 
                    disabled={!isOnline}
                    onClick={() => setIsCameraOpen(true)} 
                    className="p-2.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50" 
                    title="Camera Capture"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </button>
                </div>
              </>
            )}
            <div className="flex-1 relative">
              <input 
                type="text" 
                value={input} 
                disabled={!isOnline}
                onChange={(e) => setInput(e.target.value)} 
                placeholder={isOnline ? "Describe your symptoms or ask a health query..." : "Emergency resource mode active..."} 
                className={`w-full pl-6 pr-6 py-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-900 dark:text-slate-100 font-medium disabled:bg-slate-100 dark:disabled:bg-slate-900/50`} 
              />
            </div>
            <button 
              type="submit" 
              disabled={(!input.trim() && !stagedFile) || isTyping || (!isOnline && input.trim() === '')} 
              className={`bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-[1.2rem] flex items-center justify-center transition-all shadow-lg shadow-blue-500/20 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:shadow-none ${!lowBandwidth ? 'active:scale-90' : ''}`}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
          <div className="flex justify-center mt-2">
            <button onClick={onGenerateSummary} className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-blue-500 uppercase tracking-widest transition-colors">Generate Clinical Summary for Doctor</button>
          </div>
        </div>
      </div>
    </div>
  );
};
