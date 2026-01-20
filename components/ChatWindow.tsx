
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
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Handle camera stream lifecycle when the modal opens/closes
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const initCamera = async () => {
      if (!isCameraOpen) return;

      // Check for basic support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Camera access is not supported or is blocked in this context. Ensure you are using a secure connection (HTTPS).");
        setIsCameraOpen(false);
        return;
      }

      try {
        // Simplified constraints for maximum compatibility
        activeStream = await navigator.mediaDevices.getUserMedia({ 
          video: true,
          audio: false 
        });

        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
          try {
            await videoRef.current.play();
          } catch (playErr) {
            console.warn("Auto-play failed, waiting for user interaction:", playErr);
          }
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        
        let errorMessage = "Could not access camera.";
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = "Camera access was denied by the browser or platform. Please check your browser's permission settings and ensure this site has 'Camera' access enabled.";
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = "No camera found on your device.";
        } else if (err.name === 'SecurityError') {
          errorMessage = "Security policy prevented camera access. This usually happens if the site is not secure (must use HTTPS).";
        }

        alert(errorMessage);
        setIsCameraOpen(false);
      }
    };

    initCamera();

    // Cleanup function to stop tracks when modal closes or component unmounts
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isCameraOpen]);

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
    e.target.value = '';
  };

  const stopCamera = () => {
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64String = dataUrl.split(',')[1];
        
        setStagedFile({
          data: base64String,
          mimeType: 'image/jpeg',
          name: `health_capture_${Date.now()}.jpg`
        });
        stopCamera();
      }
    }
  };

  const quickPrompts = [
    { text: "Calculate my daily calories", icon: "🔥" },
    { text: "Healthy swaps for junk food", icon: "🥗" },
    { text: "Vegan meal ideas", icon: "🌱" },
    { text: "Portion control tips", icon: "🍽️" }
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white shadow-sm mx-6 mb-6 rounded-2xl border border-slate-200 relative overflow-hidden">
      {/* Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl overflow-hidden shadow-2xl w-full max-w-lg relative">
            <div className="p-4 flex items-center justify-between border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Camera Preview</h3>
              <button onClick={stopCamera} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="aspect-video bg-black relative flex items-center justify-center">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="p-6 flex justify-center gap-4">
              <button 
                onClick={capturePhoto}
                className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 transition-all active:scale-90"
                title="Capture Photo"
              >
                <div className="w-8 h-8 rounded-full border-2 border-white"></div>
              </button>
            </div>
            <p className="text-center text-xs text-slate-400 pb-4 px-4 font-medium">Position clearly and ensure good lighting for analysis.</p>
          </div>
        </div>
      )}

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto py-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Welcome to HealthGuide AI</h3>
            <p className="text-slate-500 mb-8 max-w-sm">Your all-in-one assistant for symptoms, medical reports, and personalized nutrition support.</p>
            
            <div className="grid grid-cols-2 gap-3 w-full">
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => onSend(p.text)}
                  className="flex items-center gap-3 text-left p-4 bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-300 rounded-xl transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{p.icon}</span>
                  <span className="text-sm font-medium text-slate-700">{p.text}</span>
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
                  
                  {/* Grounding Sources Rendering */}
                  {msg.groundingSources && msg.groundingSources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Sources & References</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.groundingSources.map((source: any, idx: number) => (
                          source.web && (
                            <a 
                              key={idx} 
                              href={source.web.uri} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-blue-600 hover:text-blue-700 hover:border-blue-300 transition-all shadow-sm"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span className="truncate max-w-[150px]">{source.web.title || 'Source'}</span>
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}
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
          <div className="flex gap-1">
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
            <button
              type="button"
              onClick={() => setIsCameraOpen(true)}
              className="p-3 text-slate-500 hover:bg-white hover:text-blue-600 rounded-xl transition-all border border-transparent hover:border-slate-200"
              title="Take a photo"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={stagedFile ? "Ask about this document..." : "Type your message or ask about nutrition..."}
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
        <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
          Your friendly Health Assistant • Secure Context Camera Access
        </p>
      </div>
    </div>
  );
};
