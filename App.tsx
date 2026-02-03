import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Share2, 
  Code, 
  RotateCcw, 
  ChevronRight, 
  ChevronDown,
  Mic, 
  Paperclip, 
  SendHorizontal,
  Box,
  Monitor,
  Settings,
  AlertCircle,
  Image as ImageIcon,
  Eye,
  BarChart2,
  Download,
  GitBranch,
  Zap,
  LayoutTemplate,
  Lock,
  Plus
} from 'lucide-react';
import MobileApp from './components/MobileApp';
import { LogEntry, LogType } from './types';
import { sendMessageToGemini } from './services/gemini';

// Custom Icons
const AppleIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M17.844 1.35914C16.5297 1.45934 15.2492 2.21415 14.7397 3.39955C14.2882 4.45095 14.509 5.86435 15.3117 6.84675C16.1444 7.86974 17.5833 8.35094 18.7371 8.04015C19.349 7.87975 19.8608 7.48875 20.2119 6.94695C20.9344 5.82415 20.6736 4.19035 19.6601 3.23795C19.1484 2.75675 18.5161 2.45595 17.844 1.35914ZM16.3276 8.52135C14.7136 8.52135 13.911 9.61415 12.6371 9.64415C11.3332 9.66415 10.4601 8.50135 9.07659 8.53135C7.29023 8.57154 5.21319 10.3259 5.21319 13.9317C5.21319 17.0657 7.07971 21.657 9.11671 21.657C9.77872 21.657 10.1596 21.1657 11.4536 21.1657C12.7576 21.1657 13.0684 21.677 13.9009 21.6469C16.1472 21.5667 17.6535 17.6673 17.6535 17.6673C17.6134 17.6473 14.86 16.5947 14.8801 13.3903C14.9001 10.7471 16.3276 8.52135 16.3276 8.52135Z" /></svg>
);
const AndroidIcon = ({ size = 14, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M17.523 15.3414C17.523 16.3298 16.7118 17.1309 15.711 17.1309C14.7102 17.1309 13.899 16.3298 13.899 15.3414C13.899 14.3529 14.7102 13.5518 15.711 13.5518C16.7118 13.5518 17.523 14.3529 17.523 15.3414ZM10.101 15.3414C10.101 16.3298 9.2898 17.1309 8.28905 17.1309C7.2883 17.1309 6.47705 16.3298 6.47705 15.3414C6.47705 14.3529 7.2883 13.5518 8.28905 13.5518C9.2898 13.5518 10.101 14.3529 10.101 15.3414ZM21.036 10.8872C20.8407 10.8872 20.6554 10.817 20.4994 10.6667L18.8209 8.98805C19.787 7.86536 20.353 6.44196 20.353 4.88836C20.353 2.18206 18.1573 0 15.4302 0C13.4395 0 11.722 1.15261 10.9218 2.82651L7.5453 2.82651C3.3783 2.82651 0 6.16436 0 10.2758V18.6652C0 21.0406 1.94205 22.9592 4.3329 22.9592H19.6671C22.058 22.9592 24 21.0406 24 18.6652V13.8354C24 12.2016 22.6826 10.8872 21.036 10.8872Z" /></svg>
);
const WebIcon = ({ size = 14, className = "" }) => (
    <div className={`border-[1.5px] border-current rounded-[2px] w-[${size}px] h-[${size}px] ${className}`}></div>
);

const App: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '100', type: LogType.SYSTEM, message: 'Project settings updated successfully', detail: 'app.json', timestamp: new Date() },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userLog: LogEntry = {
      id: generateId(),
      type: LogType.USER,
      message: chatInput,
      timestamp: new Date()
    };
    setLogs(prev => [...prev, userLog]);
    setChatInput('');
    setIsTyping(true);
    const responseText = await sendMessageToGemini(chatInput, []);
    setIsTyping(false);
    const aiLog: LogEntry = {
      id: generateId(),
      type: LogType.AI,
      message: responseText,
      timestamp: new Date()
    };
    setLogs(prev => [...prev, aiLog]);
    setTimeout(() => {
        setLogs(prev => [...prev, {
            id: generateId(),
            type: LogType.SYSTEM,
            message: 'Project settings updated successfully',
            detail: 'Updated UI components',
            timestamp: new Date()
        }]);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-[#e4e4e7] font-sans text-[13px] overflow-hidden">
      
      {/* LEFT PANEL: Sidebar / Logs / Chat */}
      <div className="w-[340px] flex flex-col border-r border-[#27272a] bg-[#0a0a0a] flex-shrink-0 z-20">
        {/* Header */}
        <div className="h-12 border-b border-[#27272a] flex items-center px-3 justify-between bg-[#0a0a0a]">
            <div className="flex items-center gap-2 hover:bg-[#27272a] p-1.5 -ml-1 rounded cursor-pointer transition-colors max-w-[260px]">
                <ChevronRight size={16} className="text-gray-500" />
                <span className="font-semibold text-gray-200 truncate">DineDate - Hẹn Hò và Gặp Gỡ</span>
                <Lock size={12} className="text-gray-500 flex-shrink-0" />
                <ChevronDown size={14} className="text-gray-500 flex-shrink-0"/>
            </div>
            <div className="flex items-center gap-1">
                 <button className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-[#27272a] transition-colors"><LayoutTemplate size={16} /></button>
            </div>
        </div>

        {/* Logs Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scroll-smooth custom-scrollbar" ref={scrollRef}>
           
           {/* Block 1: Direct File Edits */}
           <div className="space-y-0.5">
               <div className="group flex items-center gap-2 py-0.5 cursor-pointer">
                    <div className="w-1.5 h-1.5 rounded-full bg-white border border-gray-500 flex-shrink-0"></div>
                    <span className="text-gray-400 font-medium">Edited</span>
                    <span className="text-gray-400 font-mono text-[12px]">assets/images/splash-icon.png</span>
               </div>
               <div className="group flex items-center gap-2 py-0.5 cursor-pointer">
                    <div className="w-1.5 h-1.5 rounded-full bg-white border border-gray-500 flex-shrink-0"></div>
                    <span className="text-gray-400 font-medium">Edited</span>
                    <span className="text-gray-400 font-mono text-[12px]">assets/images/favicon.png</span>
                    
                    <div className="hidden group-hover:flex ml-auto items-center gap-2 bg-[#0a0a0a]">
                        <button className="text-[10px] text-gray-500 hover:text-gray-300">Restore</button>
                    </div>
               </div>
               <div className="flex justify-end gap-3 pt-1 opacity-60">
                   <button className="text-[10px] text-gray-500 flex items-center gap-1 hover:text-gray-300"><RotateCcw size={10}/> Restore</button>
                   <button className="text-[10px] text-gray-500 flex items-center gap-1 hover:text-gray-300"><Code size={10}/> Code</button>
                   <button className="text-[10px] text-gray-500 flex items-center gap-1 hover:text-gray-300"><Share2 size={10}/> Share</button>
               </div>
           </div>

           {/* Block 2: Rork System Message (Detailed) */}
           <div className="group relative">
               <div className="absolute left-[3px] top-2 bottom-0 w-[1px] bg-[#27272a] -z-10"></div>
               <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-white flex-shrink-0"></div>
                    <span className="font-bold text-gray-100">Rork</span>
               </div>
               
               <div className="pl-4">
                   <div className="mb-2">
                       <div className="text-gray-300 font-medium mb-1">Project settings updated successfully</div>
                       <div className="bg-[#18181b] border border-[#27272a] rounded-md overflow-hidden hover:border-[#3f3f46] transition-colors cursor-pointer">
                            <div className="px-3 py-2 flex items-center justify-between border-b border-[#27272a]">
                                <span className="text-gray-300 font-medium text-[12px]">Project settings updated successfully</span>
                                <ChevronRight size={12} className="text-gray-500"/>
                            </div>
                            <div className="px-3 py-1.5 flex items-center gap-2 bg-[#27272a]/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                <span className="text-gray-400 text-[12px]">Edited</span>
                                <span className="text-gray-400 font-mono text-[12px]">app.json</span>
                            </div>
                       </div>
                   </div>
               </div>
               
               <div className="pl-4 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="text-[10px] text-gray-500 flex items-center gap-1 hover:text-gray-300"><RotateCcw size={10}/> Restore</button>
                    <button className="text-[10px] text-gray-500 flex items-center gap-1 hover:text-gray-300"><Code size={10}/> Code</button>
                    <button className="text-[10px] text-gray-500 flex items-center gap-1 hover:text-gray-300"><Share2 size={10}/> Share</button>
               </div>
           </div>

            {/* Block 3: Rork System Message (Collapsed) */}
           <div className="group relative">
               <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-white flex-shrink-0"></div>
                    <span className="font-bold text-gray-100">Rork</span>
               </div>
               <div className="pl-4">
                   <div className="bg-[#18181b] border border-[#27272a] rounded-md px-3 py-2 flex items-center justify-between hover:border-[#3f3f46] transition-colors cursor-pointer">
                        <span className="text-gray-300 font-medium text-[12px]">Project settings updated successfully</span>
                        <ChevronRight size={12} className="text-gray-500"/>
                   </div>
               </div>
           </div>

           {/* Block 4: Rork System Message (Collapsed) */}
           <div className="group relative">
               <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-2 h-2 rounded-full bg-white flex-shrink-0"></div>
                    <span className="font-bold text-gray-100">Rork</span>
               </div>
               <div className="pl-4">
                   <div className="bg-[#18181b] border border-[#27272a] rounded-md px-3 py-2 flex items-center justify-between hover:border-[#3f3f46] transition-colors cursor-pointer">
                        <span className="text-gray-300 font-medium text-[12px]">Project settings updated successfully</span>
                        <ChevronRight size={12} className="text-gray-500"/>
                   </div>
               </div>
           </div>
            
           {/* Dynamic Logs */}
          {logs.filter(l => l.type !== LogType.EDIT && l.id !== '100').map((log) => (
             <div key={log.id} className="animate-fade-in group relative">
                {log.type === LogType.USER ? (
                     <div className="flex justify-end mb-2">
                         <div className="bg-[#27272a] text-gray-200 px-3 py-2 rounded-xl rounded-tr-sm max-w-[90%] leading-relaxed border border-[#3f3f46]">
                             {log.message}
                         </div>
                     </div>
                ) : log.type === LogType.AI ? (
                    <div className="mb-2">
                        <div className="flex items-center gap-2 mb-1.5">
                             <div className="w-2 h-2 rounded-full bg-white flex-shrink-0"></div>
                             <span className="font-bold text-gray-100">Rork</span>
                        </div>
                        <div className="pl-4">
                             <div className="text-gray-300 leading-relaxed text-[13px]">{log.message}</div>
                        </div>
                    </div>
                ) : (
                    <div className="pl-4 mb-2">
                       <div className="bg-[#18181b] border border-[#27272a] rounded-md px-3 py-2 flex items-center justify-between">
                            <span className="text-gray-300 font-medium text-[12px]">{log.message}</span>
                            <ChevronRight size={12} className="text-gray-500"/>
                       </div>
                    </div>
                )}
             </div>
          ))}

           {/* Error Log Block */}
           <div className="pl-4 mt-2">
                <div className="bg-[#450a0a]/20 border border-[#7f1d1d]/30 rounded-md p-2.5 flex items-start gap-2.5 group cursor-pointer hover:border-[#7f1d1d]/50 transition-colors">
                     <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5"/>
                     <div className="flex-1 min-w-0">
                         <div className="flex items-center justify-between mb-0.5">
                             <span className="text-red-200 font-medium text-[12px]">1 error while running the app</span>
                             <button className="bg-[#0a0a0a] border border-[#7f1d1d]/40 text-red-200 text-[10px] px-2 py-0.5 rounded hover:bg-red-950 font-medium">Fix all</button>
                         </div>
                         <div className="text-red-300/60 font-mono text-[11px] truncate">
                             [Supabase] Error fetching review stats: [object Object]
                         </div>
                     </div>
                </div>
           </div>
            
            {isTyping && <div className="text-xs text-gray-500 italic pl-4">Updating...</div>}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-[#0a0a0a] border-t border-[#27272a]">
             <div className="relative bg-[#18181b] rounded-xl border border-[#27272a] p-2 focus-within:border-gray-500 transition-colors shadow-sm">
                <textarea 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe the mobile app you want to build..." 
                    className="w-full bg-transparent outline-none text-[13px] text-gray-200 resize-none h-10 placeholder-gray-500 font-normal leading-relaxed custom-scrollbar py-1"
                />
                <div className="flex justify-between items-center mt-1 px-0.5">
                    <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-1.5 bg-[#27272a] pl-2 pr-2.5 py-0.5 rounded-full text-gray-300 border border-[#3f3f46] hover:border-gray-500 cursor-pointer transition-colors group">
                             <div className="w-3 h-3 flex items-center justify-center">
                                 <svg viewBox="0 0 24 24" className="w-full h-full text-blue-400 fill-current"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                             </div>
                             <span className="font-semibold text-[11px] bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text text-transparent group-hover:text-white">Gemini 3 Pro</span>
                             <ChevronDown size={10} className="text-gray-500 ml-0.5"/>
                        </div>
                         <ImageIcon size={16} className="text-gray-500 hover:text-gray-300 cursor-pointer transition-colors ml-1" />
                         <Paperclip size={16} className="text-gray-500 hover:text-gray-300 cursor-pointer transition-colors" />
                    </div>
                    <div className="flex items-center gap-3">
                        <Mic size={16} className="text-gray-500 hover:text-gray-300 cursor-pointer" />
                        <button 
                            onClick={handleSendMessage}
                            className={`p-1.5 rounded-md transition-all ${chatInput.trim() ? 'bg-white text-black hover:bg-gray-200' : 'text-gray-600'}`}
                        >
                            <SendHorizontal size={16} />
                        </button>
                    </div>
                </div>
             </div>
        </div>
      </div>

      {/* CENTER PANEL: Canvas */}
      <div className="flex-1 flex flex-col bg-[#000] relative min-w-0">
        {/* Toolbar */}
        <div className="h-12 border-b border-[#27272a] flex items-center justify-between px-3 bg-[#0a0a0a] z-10">
             <div className="flex items-center gap-3">
                 <div className="flex items-center gap-1 text-gray-500">
                     <button className="p-1.5 hover:bg-[#27272a] rounded text-gray-400"><Code size={14}/></button>
                     <button className="p-1.5 hover:bg-[#27272a] rounded text-gray-400"><ChevronRight size={14}/></button>
                 </div>
                 <div className="h-3 w-[1px] bg-[#27272a]"></div>
                 <div className="flex items-center bg-[#18181b] rounded-md border border-[#27272a] p-0.5">
                    <button className="flex items-center gap-2 bg-[#27272a] text-gray-200 px-2 py-1 rounded text-[12px] font-medium shadow-sm">
                        <Eye size={12} /> Preview
                    </button>
                    <button className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-[#27272a] rounded"><BarChart2 size={12} /></button>
                 </div>
             </div>

             <div className="flex items-center gap-2">
                 <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1e1b4b] text-[#c7d2fe] border border-[#312e81] rounded-md text-[12px] font-bold transition-colors hover:bg-[#2e2a5b]">
                    <span className="text-[10px]">✨</span> Upgrade
                 </button>
                 <button className="flex items-center gap-1.5 px-3 py-1.5 text-gray-400 hover:text-gray-200 text-[12px] font-medium border border-[#27272a] rounded-md hover:bg-[#27272a] transition-colors">
                     <Box size={12}/> Integrations
                 </button>
                 
                 <div className="flex items-center border border-[#27272a] rounded-md bg-[#0a0a0a]">
                     <button className="p-1.5 hover:bg-[#27272a] text-gray-400 border-r border-[#27272a]"><Download size={14}/></button>
                     <button className="p-1.5 hover:bg-[#27272a] text-gray-400"><GitBranch size={14}/></button>
                 </div>

                 <button className="flex items-center gap-2 px-3 py-1.5 bg-white text-black rounded-md text-[12px] font-bold hover:bg-gray-200 transition-colors shadow-sm ml-1">
                     <Share2 size={12}/> Publish
                 </button>
                 <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-orange-500 border border-white/10 ml-1"></div>
             </div>
        </div>
        
        {/* Floating Live Indicator */}
        <div className="absolute top-[60px] right-6 z-20">
             <div className="flex items-center bg-[#0a0a0a] border border-[#27272a] rounded-lg shadow-xl p-1 gap-1">
                 <div className="flex items-center gap-2 px-2 py-1 hover:bg-[#27272a] rounded cursor-pointer border-r border-[#27272a] mr-1">
                     <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </div>
                    <span className="text-gray-200 font-medium text-[11px]">Live</span>
                    <ChevronDown size={10} className="text-gray-500" />
                 </div>
                 <button className="p-1 text-gray-400 hover:text-yellow-400 hover:bg-[#27272a] rounded"><Zap size={12} fill="currentColor" className="text-yellow-500/40 hover:text-yellow-500"/></button>
                 <button className="p-1 text-gray-400 hover:text-white hover:bg-[#27272a] rounded"><AppleIcon size={12} /></button>
                 <button className="p-1 text-gray-400 hover:text-green-400 hover:bg-[#27272a] rounded"><AndroidIcon size={12} /></button>
                 <button className="p-1 text-gray-400 hover:text-blue-400 hover:bg-[#27272a] rounded"><WebIcon size={10} className="w-[12px] h-[12px]" /></button>
             </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center bg-[#050505] relative overflow-hidden">
            {/* Grid Background - Fainter */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]"></div>

            {/* Mobile Device Frame */}
            <div className="relative w-[375px] h-[812px] bg-black rounded-[50px] border-[6px] border-[#18181b] shadow-[0_0_100px_-30px_rgba(0,0,0,0.7)] overflow-hidden ring-1 ring-white/5 z-10 scale-[0.95] origin-center">
                {/* Dynamic Island */}
                <div className="absolute top-[11px] left-1/2 transform -translate-x-1/2 w-[100px] h-[30px] bg-black rounded-[20px] z-50 flex items-center justify-center">
                    <div className="flex gap-1.5 items-center justify-end w-full pr-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#333]/60"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]"></div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="absolute top-0 w-full h-12 z-40 flex justify-between items-end px-6 pb-2">
                    <div className="text-white text-[13px] font-semibold tracking-wide pl-2">9:41</div>
                     <div className="flex items-center gap-1.5">
                        <div className="h-3 w-4">
                            <svg viewBox="0 0 24 24" fill="white" className="w-full h-full"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                        </div>
                        <div className="w-6 h-2.5 rounded-[3px] border border-white/30 relative p-[1px]">
                            <div className="bg-white w-full h-full rounded-[1px]"></div>
                        </div>
                     </div>
                </div>

                {/* App Content */}
                <MobileApp />

                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-[130px] h-[5px] bg-white/90 rounded-full z-50"></div>
            </div>
        </div>
      </div>

      {/* RIGHT PANEL: Info / QR */}
      <div className="w-[300px] border-l border-[#27272a] bg-[#0a0a0a] flex flex-col p-6 flex-shrink-0 z-20">
           <h2 className="text-lg font-bold mb-4 text-gray-100 tracking-tight">Test on your phone</h2>
           
           <div className="bg-white p-3 rounded-lg mb-4 self-start shadow-lg ring-1 ring-white/10">
               {/* QR Code */}
               <div className="w-32 h-32 bg-black">
                    <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-black bg-white">
                        <rect width="100" height="100" fill="white"/>
                        <path d="M10 10h20v20h-20zM14 14v12h12v-12zM70 10h20v20h-20zM74 14v12h12v-12zM10 70h20v20h-20zM14 74v12h12v-12z" />
                        <rect x="36" y="10" width="8" height="8"/>
                        <rect x="48" y="10" width="8" height="8"/>
                        <rect x="60" y="20" width="8" height="8"/>
                        <rect x="36" y="30" width="8" height="8"/>
                        <rect x="48" y="48" width="8" height="8"/>
                        <rect x="60" y="60" width="8" height="8"/>
                        <rect x="80" y="80" width="8" height="8"/>
                        <rect x="40" y="70" width="8" height="8"/>
                        <path d="M40 40h20v20h-20z" fill="black"/>
                        <path d="M70 40h4v4h-4zM76 46h4v4h-4zM70 70h4v4h-4z" fill="black"/>
                    </svg>
               </div>
           </div>

           <h3 className="text-sm font-bold text-gray-200 mb-2">Scan QR code to test</h3>
           <div className="text-gray-400 text-[12px] space-y-2 mb-6 ml-0.5">
               <div className="flex items-start gap-2">
                   <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#27272a] text-[10px] font-bold text-gray-300 mt-0.5">1</span>
                   <span>Open Camera app on your device</span>
               </div>
               <div className="flex items-start gap-2">
                   <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#27272a] text-[10px] font-bold text-gray-300 mt-0.5">2</span>
                   <span>Scan the QR code above to view</span>
               </div>
           </div>

           <div className="bg-[#18181b] border border-[#27272a] rounded-lg p-3 flex gap-2.5 shadow-sm">
               <AlertCircle size={16} className="text-gray-500 flex-shrink-0 mt-0.5"/>
               <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                   Browser preview lacks native functions & looks different. Test on device for the best results.
               </p>
           </div>
      </div>
    </div>
  );
};

export default App;