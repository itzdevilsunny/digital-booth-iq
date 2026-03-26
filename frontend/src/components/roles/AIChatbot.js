import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, X, Mic, MicOff, 
  Volume2, Sparkles, Loader2
} from 'lucide-react';
import { aiChat, speechToText, textToSpeech } from '../../api';

export default function AIChatbot({ currentUser, boothId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: `Namaste ${currentUser?.name || 'Citizen'}. I am ESarthi, your institutional AI assistant. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text = input) => {
    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiChat({
        message: text,
        user_id: currentUser?.id || 'anonymous',
        booth_id: boothId || 17
      });

      const botMessage = { role: 'bot', content: response.response };
      setMessages(prev => [...prev, botMessage]);
      
      // Auto-TTS for bot reply if needed (optional)
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'bot', content: "I'm sorry, I encountered a sync error. Please try again." }]);
    }
    setLoading(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (e) => {
        audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('file', audioBlob, 'voice.wav');
        formData.append('user_id', currentUser?.id || 'anonymous');

        setLoading(true);
        try {
          const result = await speechToText(formData);
          if (result.transcript) {
            handleSend(result.transcript);
          }
        } catch (e) { console.error(e); }
        setLoading(false);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (e) { console.error(e); }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleTTS = async (text) => {
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('text', text);
      formData.append('user_id', currentUser?.id || 'anonymous');
      
      const result = await textToSpeech(formData);
      if (result.audio_content) {
        const audio = new Audio(`data:audio/wav;base64,${result.audio_content}`);
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => setIsSpeaking(false);
        audio.play();
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <>
      {/* Chat Toggle Button - above bottom nav on mobile */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-28 right-5 md:bottom-8 md:right-8 z-[60] size-14 md:size-16 bg-emerald-600 text-white rounded-full shadow-2xl shadow-emerald-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden border-2 border-emerald-500/40"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <MessageSquare size={24} className="relative z-10" />
        <div className="absolute -top-1 -right-1 size-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="fixed bottom-0 right-0 md:bottom-28 md:right-8 z-[70] w-full md:w-[400px] h-[75vh] md:h-[560px] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#0c0c0c] p-5 flex items-center justify-between text-white relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="size-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <Sparkles size={24} className="text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-black tracking-tight uppercase">ESarthi AI</h3>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Protocol Active</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all relative z-10">
                <X size={20} />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50"
            >
              {messages.map((m, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: m.role === 'user' ? 20 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[8px] font-mono font-black text-slate-400 uppercase tracking-widest">
                        {m.role === 'user' ? currentUser?.name || 'CITIZEN' : 'SYSTEM COMMAND'}
                      </span>
                      {m.role === 'bot' && (
                        <button 
                          onClick={() => handleTTS(m.content)}
                          className={`p-1 rounded-md hover:bg-slate-200 transition-colors ${isSpeaking ? 'text-emerald-500' : 'text-slate-400'}`}
                        >
                          <Volume2 size={10} />
                        </button>
                      )}
                    </div>
                    <div className={`p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                      m.role === 'user' 
                        ? 'bg-[#0c0c0c] text-white rounded-tr-none' 
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                    }`}>
                      {m.content}
                    </div>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-emerald-500" />
                    <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Processing...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-white border-t border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Inquire with ESarthi..."
                    className="w-full pl-4 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                  />
                  <button 
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-emerald-500 hover:bg-slate-100'}`}
                  >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                </div>
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="p-4 bg-[#0c0c0c] text-emerald-400 rounded-2xl shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
                >
                  <Send size={20} />
                </button>
              </div>
              <p className="text-center mt-4 text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                Institutional AI Oversight Protocol v4.0.2
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
