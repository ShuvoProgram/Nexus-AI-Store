import React, { useState, useEffect, useRef } from 'react';
import { ToolAgent, ChatMessage } from '../types';
import { createChatSession, sendMessageStream } from '../services/gemini';
import { Send, ArrowLeft, BrainCircuit, Bot, User, Loader2, Mic, Trash2, Globe, MapPin, ExternalLink, Check, Copy, AlertTriangle } from 'lucide-react';
import { Content } from '@google/genai';
// @ts-ignore
import ReactMarkdown from 'react-markdown';
// @ts-ignore
import remarkGfm from 'remark-gfm';
import { AIChatInput } from './ui/ai-chat-input';
import { ConfirmModal } from './ui/ConfirmModal';

interface ChatInterfaceProps {
  tool: ToolAgent;
  onBack: () => void;
  onSwitchToVoice: () => void;
}

const MarkdownComponents = {
  p: ({ node, ...props }: any) => <p className="mb-3 last:mb-0 leading-relaxed" {...props} />,
  h1: ({ node, ...props }: any) => <h1 className="text-xl font-bold mb-3 mt-4 border-b border-slate-200 dark:border-slate-700 pb-2" {...props} />,
  h2: ({ node, ...props }: any) => <h2 className="text-lg font-bold mb-2 mt-3" {...props} />,
  h3: ({ node, ...props }: any) => <h3 className="text-md font-bold mb-2 mt-2" {...props} />,
  h4: ({ node, ...props }: any) => <h4 className="text-sm font-bold mb-1 mt-2" {...props} />,
  ul: ({ node, ...props }: any) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
  ol: ({ node, ...props }: any) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
  li: ({ node, ...props }: any) => <li className="" {...props} />,
  blockquote: ({ node, ...props }: any) => <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 italic my-3 text-slate-600 dark:text-slate-400" {...props} />,
  code: ({ node, inline, className, children, ...props }: any) => {
    return inline ? (
      <code className="bg-slate-200 dark:bg-slate-800 rounded px-1.5 py-0.5 font-mono text-xs font-medium text-slate-800 dark:text-slate-200" {...props}>{children}</code>
    ) : (
      <div className="relative group my-4">
        <pre className="bg-slate-950 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm font-mono shadow-sm border border-slate-800">
          <code className={className} {...props}>{children}</code>
        </pre>
      </div>
    )
  },
  table: ({ node, ...props }: any) => <div className="overflow-x-auto my-4 rounded-lg border border-slate-200 dark:border-slate-700"><table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700" {...props} /></div>,
  thead: ({ node, ...props }: any) => <thead className="bg-slate-50 dark:bg-slate-800" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors" {...props} />,
  th: ({ node, ...props }: any) => <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-r border-slate-200 dark:border-slate-700 last:border-r-0" {...props} />,
  td: ({ node, ...props }: any) => <td className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-700 last:border-r-0" {...props} />,
  a: ({ node, ...props }: any) => <a className="text-blue-600 dark:text-blue-400 hover:underline font-medium" target="_blank" rel="noreferrer" {...props} />,
  hr: ({ node, ...props }: any) => <hr className="my-6 border-slate-200 dark:border-slate-700" {...props} />,
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ tool, onBack, onSwitchToVoice }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Features
  const [deepThinkEnabled, setDeepThinkEnabled] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [mapsEnabled, setMapsEnabled] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | undefined>(undefined);

  const chatSessionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load History
  useEffect(() => {
    const storageKey = `nexus_chat_${tool.id}`;
    let initialMessages: ChatMessage[] = [];

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        initialMessages = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }

    if (initialMessages.length === 0) {
      initialMessages = [{
        id: 'welcome',
        role: 'model',
        text: tool.welcomeMessage
      }];
    }

    setMessages(initialMessages);
  }, [tool.id]);

  // Handle Session Creation/Re-creation when config changes
  useEffect(() => {
    if (messages.length === 0) return;

    const historyPayload: Content[] = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    // If Maps is enabled, ensure we try to get location if not already
    if (mapsEnabled && !userLocation) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.warn("Location access denied or failed", error);
          }
        );
      }
    }

    chatSessionRef.current = createChatSession({
      systemInstruction: tool.systemInstruction,
      useThinking: deepThinkEnabled,
      enableSearch: searchEnabled,
      enableMaps: mapsEnabled,
      location: userLocation,
      history: historyPayload,
      modelPreference: tool.modelPreference
    });

  }, [tool.id, tool.systemInstruction, tool.modelPreference, deepThinkEnabled, searchEnabled, mapsEnabled, userLocation, messages.length === 0]);

  // Save History
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(`nexus_chat_${tool.id}`, JSON.stringify(messages));
    }
  }, [messages, tool.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle Logic Toggles (Mutex logic)
  const toggleThinking = () => {
    const newVal = !deepThinkEnabled;
    setDeepThinkEnabled(newVal);
    if (newVal) {
      setSearchEnabled(false);
      setMapsEnabled(false);
    }
  };

  const toggleSearch = () => {
    const newVal = !searchEnabled;
    setSearchEnabled(newVal);
    if (newVal) setDeepThinkEnabled(false);
  };

  const toggleMaps = () => {
    const newVal = !mapsEnabled;
    setMapsEnabled(newVal);
    if (newVal) setDeepThinkEnabled(false);
  };

  const handleClearHistory = () => {
    setShowClearConfirm(true);
  };

  const confirmClearHistory = () => {
    localStorage.removeItem(`nexus_chat_${tool.id}`);

    const welcomeMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'model',
      text: tool.welcomeMessage
    };

    setMessages([welcomeMsg]);

    // Force re-init
    chatSessionRef.current = createChatSession({
      systemInstruction: tool.systemInstruction,
      useThinking: deepThinkEnabled,
      enableSearch: searchEnabled,
      enableMaps: mapsEnabled,
      location: userLocation,
      history: [{ role: 'model', parts: [{ text: tool.welcomeMessage }] }],
      modelPreference: tool.modelPreference
    });

    setShowClearConfirm(false);
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: text
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const stream = await sendMessageStream(chatSessionRef.current, userMsg.text);

      const botMsgId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'model',
        text: '',
        isThinking: deepThinkEnabled
      }]);

      let fullResponse = '';
      let accumulatedMetadata: any = null;

      for await (const chunk of stream) {
        const text = chunk.text;
        if (chunk.candidates?.[0]?.groundingMetadata) {
          accumulatedMetadata = chunk.candidates[0].groundingMetadata;
        }

        if (text) {
          fullResponse += text;
          setMessages(prev => prev.map(msg =>
            msg.id === botMsgId
              ? {
                ...msg,
                text: fullResponse,
                isThinking: false,
                groundingMetadata: accumulatedMetadata
              }
              : msg
          ));
        }
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "I encountered an error processing your request. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Clear History: Alt + Delete
      if (e.altKey && e.key === 'Delete') {
        e.preventDefault();
        handleClearHistory();
      }
      // Switch to Voice: Alt + V
      if (e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        onSwitchToVoice();
      }
      // Thinking: Alt + P (Pro)
      if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        toggleThinking();
      }
      // Search: Alt + S
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        toggleSearch();
      }
      // Maps: Alt + M
      if (e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleMaps();
      }
      // Focus Input: Alt + /
      if (e.altKey && e.key === '/') {
        e.preventDefault();
        document.querySelector('input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deepThinkEnabled, searchEnabled, mapsEnabled, messages, tool.id]); // Dependencies for state closures inside handlers

  // Helper to render grounding chips
  const renderGrounding = (metadata: any) => {
    if (!metadata?.groundingChunks) return null;

    const webSources = metadata.groundingChunks.filter((c: any) => c.web);

    if (webSources.length === 0 && !metadata.searchEntryPoint) return null;

    return (
      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
          <Globe className="w-3 h-3" /> Sources
        </div>
        <div className="flex flex-wrap gap-2">
          {webSources.map((chunk: any, i: number) => (
            <a
              key={i}
              href={chunk.web.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
            >
              <span className="truncate max-w-[200px]">{chunk.web.title}</span>
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          ))}
        </div>
        {metadata.searchEntryPoint && (
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            <div dangerouslySetInnerHTML={{ __html: metadata.searchEntryPoint.renderedContent }} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background transition-colors">
      {/* Header */}
      <div className="flex flex-col border-b border-border bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-3">
            <button onClick={onBack} title="Back (Esc)" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${tool.color} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center`}>
                <tool.icon className={`w-5 h-5 ${tool.color.replace('bg-', 'text-')}`} />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-sm font-serif-brand">{tool.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {deepThinkEnabled ? 'Gemini 3 Pro (Thinking)' : tool.modelPreference ? tool.modelPreference : 'Gemini 3 Pro'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearHistory}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-destructive dark:text-slate-500 dark:hover:text-destructive rounded-full transition-colors"
              title="Clear Chat History (Alt+Delete)"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 bg-background scroll-smooth">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm border border-border mt-1 ${msg.role === 'user' ? 'bg-foreground' : 'bg-card'
              }`}>
              {msg.role === 'user'
                ? <User className="w-4 h-4 text-background" />
                : <Bot className="w-4 h-4 text-foreground" />
              }
            </div>

            <div className={`max-w-[90%] md:max-w-[80%] space-y-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.role === 'user'
                  ? 'bg-foreground text-background rounded-tr-sm text-left'
                  : 'bg-muted text-foreground rounded-tl-sm border border-border w-full'
                }`}>
                {msg.text ? (
                  <div className={`markdown-body ${msg.role === 'user' ? 'text-background' : ''}`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={MarkdownComponents}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : msg.isThinking ? (
                  <div className="flex items-center gap-2 text-muted-foreground italic">
                    <BrainCircuit className="w-4 h-4 animate-pulse text-purple-500" />
                    Thinking deeply...
                  </div>
                ) : null}

                {/* Render Sources if available */}
                {msg.role === 'model' && msg.groundingMetadata && renderGrounding(msg.groundingMetadata)}

              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center">
              <Bot className="w-4 h-4 text-foreground" />
            </div>
            <div className="bg-muted px-5 py-3.5 rounded-2xl rounded-tl-sm border border-border flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Generating response...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={confirmClearHistory}
        title="Clear Chat History?"
        description="This will permanently delete all messages in this conversation. This action cannot be undone."
        confirmText="Clear History"
        cancelText="Cancel"
        icon={Trash2}
        variant="danger"
      />

      {/* Input */}
      <div className="p-4 md:p-6 bg-background border-t border-border">
        <AIChatInput
          placeholder={
            deepThinkEnabled ? "Ask a complex question..." :
              searchEnabled ? "Ask about recent events or facts..." :
                mapsEnabled ? "Ask about places nearby..." :
                  "Type your message..."
          }
          onSubmit={(value) => {
            handleSend(value);
          }}
          onFileSelect={(file) => {
            console.log("File selected:", file);
            // Future integration: Handle file upload
          }}
          className="max-w-4xl mx-auto"

          // Pass state and handlers
          isThinkingEnabled={deepThinkEnabled}
          onToggleThinking={toggleThinking}

          isSearchEnabled={searchEnabled}
          onToggleSearch={toggleSearch}

          isMapsEnabled={mapsEnabled}
          onToggleMaps={toggleMaps}

          onMicClick={onSwitchToVoice}
        />
      </div>
    </div>
  );
};

export default ChatInterface;