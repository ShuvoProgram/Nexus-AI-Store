import React, { useEffect, useState, useRef } from 'react';
import { ToolAgent } from '../types';
import { LiveClient } from '../services/liveClient';
import { Mic, MicOff, ArrowLeft, X, Activity, MessageSquare } from 'lucide-react';
import { VoiceVisualizer3D } from './ui/VoiceVisualizer3D';

interface VoiceInterfaceProps {
  tool: ToolAgent;
  onBack: () => void;
  onSwitchToChat: () => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ tool, onBack, onSwitchToChat }) => {
  const [isActive, setIsActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const liveClientRef = useRef<LiveClient | null>(null);

  const toggleSession = () => {
    if (isActive) {
      liveClientRef.current?.disconnect();
      setIsActive(false);
      setVolume(0);
    } else {
      const client = new LiveClient(tool.systemInstruction);
      client.onVolumeChange = (v) => setVolume(v);
      client.onDisconnect = () => setIsActive(false);
      liveClientRef.current = client;
      setIsActive(true);
    }
  };

  useEffect(() => {
    return () => {
      liveClientRef.current?.disconnect();
    };
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Session: Space
      if (e.code === 'Space') {
         // Prevent default only if we are not focused on a button that needs space
         if (document.activeElement?.tagName !== 'BUTTON') {
             e.preventDefault();
             toggleSession();
         }
      }
      // Switch to Chat: Alt + C
      if (e.altKey && e.key.toLowerCase() === 'c') {
         e.preventDefault();
         onSwitchToChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onSwitchToChat]);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors">
        {/* Background Ambient Effect (Subtle) */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 dark:bg-indigo-900/10 rounded-full blur-[100px] transition-all duration-1000 ${isActive ? 'scale-100 opacity-100' : 'scale-75 opacity-20'}`} />

        <div className="relative z-10 flex flex-col h-full">
            <div className="p-6 flex justify-between items-center">
                <button onClick={onBack} title="Back (Esc)" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" /> 
                    <span className="font-medium">Back</span>
                </button>
                
                <button 
                  onClick={onSwitchToChat}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-full transition-colors flex items-center gap-2 shadow-sm"
                  title="Switch to Text Chat (Alt+C)"
                >
                  <span className="text-sm font-medium">Text Chat</span>
                  <MessageSquare className="w-4 h-4" />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center gap-8">
                <div className="text-center space-y-4">
                    <div className="inline-block p-4 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                        <tool.icon className={`w-8 h-8 ${tool.color.replace('bg-', 'text-')}`} />
                    </div>
                    <h2 className="text-4xl font-serif-brand font-bold text-slate-900 dark:text-white tracking-tight">{tool.name}</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-light text-lg">{isActive ? "Listening..." : "Tap to start conversation"}</p>
                </div>

                {/* Main Interaction Area */}
                <div className="relative w-[400px] h-[400px] flex items-center justify-center">
                    
                    {/* 3D Visualizer Background (Only visible when active) */}
                    <div className="absolute inset-0 z-0 flex items-center justify-center">
                       <VoiceVisualizer3D volume={volume} isActive={isActive} />
                    </div>

                    {/* Central Button */}
                    <button 
                        onClick={toggleSession}
                        title={isActive ? "End Conversation (Space)" : "Start Conversation (Space)"}
                        className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl backdrop-blur-md ${
                            isActive 
                            ? 'bg-white/10 dark:bg-black/30 text-white border border-white/20' 
                            : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-100 dark:border-slate-800 hover:scale-105 hover:border-indigo-300 dark:hover:border-indigo-700'
                        }`}
                    >
                        {isActive ? (
                            <X className="w-8 h-8" />
                        ) : (
                            <Mic className="w-8 h-8" />
                        )}
                    </button>
                </div>
            </div>

            <div className="p-8 text-center">
                <p className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-widest font-semibold">Powered by Gemini 2.5 Live API</p>
            </div>
        </div>
    </div>
  );
};

export default VoiceInterface;