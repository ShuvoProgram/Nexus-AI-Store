
import React, { useState, useEffect, useRef } from 'react';
import { AGENTS } from './constants';
import ToolCard from './components/ToolCard';
import ChatInterface from './components/ChatInterface';
import VoiceInterface from './components/VoiceInterface';
import { ToolAgent, AgentType } from './types';
import { Crown, Sun, Moon, Keyboard, X, Save, Lock } from 'lucide-react';
import { Hero1 } from './components/ui/hero-1';

interface AgentPreference {
  systemInstruction?: string;
  modelPreference?: string;
}

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolAgent | null>(null);
  const [mode, setMode] = useState<AgentType>(AgentType.CHAT);
  const [searchQuery, setSearchQuery] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Settings Modal State
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<ToolAgent | null>(null);
  const [tempSystemInstruction, setTempSystemInstruction] = useState('');
  const [tempModelPreference, setTempModelPreference] = useState('');

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(false);
  const authInputRef = useRef<HTMLInputElement>(null);

  // Agent Preferences State
  const [preferences, setPreferences] = useState<Record<string, AgentPreference>>({});

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Load Preferences on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nexus_agent_preferences');
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load preferences", e);
    }
  }, []);

  // Toggle Theme Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Focus auth input when modal opens
  useEffect(() => {
    if (authModalOpen && authInputRef.current) {
      setTimeout(() => authInputRef.current?.focus(), 100);
    }
  }, [authModalOpen]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle Theme: Alt + T
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        toggleTheme();
      }
      // Back / Close: Escape (only if tool is active)
      if (e.key === 'Escape') {
        if (showShortcuts) {
          e.preventDefault();
          setShowShortcuts(false);
        } else if (authModalOpen) {
          e.preventDefault();
          setAuthModalOpen(false);
          setAuthPassword('');
          setAuthError(false);
        } else if (settingsModalOpen) {
          e.preventDefault();
          setSettingsModalOpen(false);
        } else if (activeTool) {
          e.preventDefault();
          setActiveTool(null);
        }
      }
      // Show Shortcuts: Shift + ?
      if (e.shiftKey && e.key === '?') {
        // Only if not in an input
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowShortcuts(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, showShortcuts, settingsModalOpen, authModalOpen]);

  // Helper to merge default agent config with user preferences
  const getConfiguredAgent = (agent: ToolAgent): ToolAgent => {
    const prefs = preferences[agent.id];
    if (!prefs) return agent;

    return {
      ...agent,
      systemInstruction: prefs.systemInstruction || agent.systemInstruction,
      modelPreference: prefs.modelPreference || undefined
    };
  };

  const handleToolSelect = (tool: ToolAgent) => {
    const configuredTool = getConfiguredAgent(tool);
    setActiveTool(configuredTool);
    setMode(tool.type);
  };

  const handleSettingsClick = (tool: ToolAgent) => {
    // 1. Set the agent we want to edit
    const configuredTool = getConfiguredAgent(tool);
    setEditingAgent(tool);
    setTempSystemInstruction(configuredTool.systemInstruction);
    setTempModelPreference(configuredTool.modelPreference || 'gemini-3-pro-preview');

    // 2. Open Auth Modal first
    setAuthModalOpen(true);
    setAuthPassword('');
    setAuthError(false);
  };

  const handleAuthSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (authPassword === 'admin@123') {
      setAuthModalOpen(false);
      setSettingsModalOpen(true);
      setAuthPassword('');
      setAuthError(false);
    } else {
      setAuthError(true);
      // Shake animation logic could go here
    }
  };

  const handleSavePreferences = () => {
    if (!editingAgent) return;

    const newPrefs = {
      ...preferences,
      [editingAgent.id]: {
        systemInstruction: tempSystemInstruction,
        modelPreference: tempModelPreference
      }
    };

    setPreferences(newPrefs);
    localStorage.setItem('nexus_agent_preferences', JSON.stringify(newPrefs));
    setSettingsModalOpen(false);
  };

  const filteredAgents = AGENTS.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderActiveTool = () => {
    if (!activeTool) return null;

    if (mode === AgentType.VOICE) {
      return (
        <VoiceInterface
          tool={activeTool}
          onBack={() => setActiveTool(null)}
          onSwitchToChat={() => setMode(AgentType.CHAT)}
        />
      );
    }

    return (
      <ChatInterface
        tool={activeTool}
        onBack={() => setActiveTool(null)}
        onSwitchToVoice={() => setMode(AgentType.VOICE)}
      />
    );
  };

  const ShortcutRow = ({ label, keys }: { label: string, keys: string[] }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-600 dark:text-slate-300">{label}</span>
      <div className="flex gap-1">
        {keys.map((k, i) => (
          <kbd key={i} className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded-md dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 min-w-[24px] text-center">
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-purple-100 dark:selection:bg-purple-900/30 transition-colors duration-300 relative">

      {/* Global Theme Background Gradients */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute top-[20%] left-[20%] w-[300px] h-[300px] bg-pink-500/10 dark:bg-pink-600/20 rounded-full blur-[100px] mix-blend-multiply dark:mix-blend-screen opacity-50" />
      </div>

      {/* Auth Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-border animate-in zoom-in-95 duration-200 p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-serif-brand">Admin Access</h3>
              <p className="text-sm text-muted-foreground mt-1">Enter password to configure {editingAgent?.name}</p>
            </div>

            <form onSubmit={handleAuthSubmit}>
              <div className="mb-4">
                <input
                  ref={authInputRef}
                  type="password"
                  value={authPassword}
                  onChange={(e) => {
                    setAuthPassword(e.target.value);
                    setAuthError(false);
                  }}
                  placeholder="Password"
                  className={`w-full bg-muted border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/10 outline-none transition-colors ${authError ? 'border-destructive focus:border-destructive' : 'border-border'}`}
                />
                {authError && <p className="text-xs text-destructive mt-2 font-medium">Incorrect password. Try Again.</p>}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-opacity"
                >
                  Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsModalOpen && editingAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-border animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-bold font-serif-brand">Customize {editingAgent.name}</h3>
              <button onClick={() => setSettingsModalOpen(false)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Base Model</label>
                <select
                  value={tempModelPreference}
                  onChange={(e) => setTempModelPreference(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/10 outline-none"
                >
                  <option value="gemini-3-pro-preview">Gemini 3 Pro (Reasoning & Complex Tasks)</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Speed & Efficiency)</option>
                </select>
                <p className="text-xs text-muted-foreground mt-2">Note: Specialized features like "Thinking" or "Search" may override this selection automatically.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">System Instructions</label>
                <textarea
                  value={tempSystemInstruction}
                  onChange={(e) => setTempSystemInstruction(e.target.value)}
                  rows={8}
                  className="w-full bg-muted border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/10 outline-none resize-none font-mono"
                  placeholder="How should this agent behave?"
                />
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setSettingsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium hover:bg-muted rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-opacity flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg">
                  <Keyboard className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold font-serif-brand">Keyboard Shortcuts</h3>
              </div>
              <button
                onClick={() => setShowShortcuts(false)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Global */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Global</h4>
                  <ShortcutRow label="Toggle Theme" keys={['Alt', 'T']} />
                  <ShortcutRow label="Back / Close" keys={['Esc']} />
                  <ShortcutRow label="Show Shortcuts" keys={['Shift', '?']} />
                </div>

                {/* Voice */}
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Voice Mode</h4>
                  <ShortcutRow label="Start / Stop" keys={['Space']} />
                  <ShortcutRow label="Switch to Chat" keys={['Alt', 'C']} />
                </div>

                {/* Chat */}
                <div className="md:col-span-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Chat Mode</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <div>
                      <ShortcutRow label="Send Message" keys={['Enter']} />
                      <ShortcutRow label="Send (Multiline)" keys={['Ctrl', 'Enter']} />
                      <ShortcutRow label="Focus Input" keys={['Alt', '/']} />
                      <ShortcutRow label="Clear History" keys={['Alt', 'Del']} />
                    </div>
                    <div>
                      <ShortcutRow label="Switch to Voice" keys={['Alt', 'V']} />
                      <ShortcutRow label="Toggle Thinking" keys={['Alt', 'P']} />
                      <ShortcutRow label="Toggle Search" keys={['Alt', 'S']} />
                      <ShortcutRow label="Toggle Maps" keys={['Alt', 'M']} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-muted/50 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">Press <kbd className="font-sans">Esc</kbd> to close</p>
            </div>
          </div>
        </div>
      )}

      {activeTool ? (
        <div className="h-screen animate-fade-in relative z-10 bg-background/50 backdrop-blur-xl">
          {renderActiveTool()}
        </div>
      ) : (
        <div className="flex flex-col min-h-screen relative overflow-hidden">

          {/* Top Navigation */}
          <nav className="flex items-center justify-between px-6 py-4 lg:px-12 border-b border-transparent relative z-20">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-foreground" />
              <span className="font-serif-brand text-xl font-bold tracking-tight text-foreground">NexusStore</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowShortcuts(true)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                title="Keyboard Shortcuts (Shift + ?)"
              >
                <Keyboard className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-border mx-1"></div>

              <button
                onClick={toggleTheme}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted"
                title={isDarkMode ? "Switch to Light Mode (Alt+T)" : "Switch to Dark Mode (Alt+T)"}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button className="w-8 h-8 ml-2 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
                N
              </button>
            </div>
          </nav>

          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-0 w-full relative z-10">
            {/* Hero Component */}
            <Hero1
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              suggestions={[]}
              onSuggestionClick={(s) => setSearchQuery(s)}
            />

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
              {filteredAgents.map((agent) => (
                <ToolCard
                  key={agent.id}
                  tool={agent}
                  onClick={handleToolSelect}
                  onSettingsClick={handleSettingsClick}
                />
              ))}
              {filteredAgents.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <p>No agents found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </main>

          <footer className="py-8 text-center text-muted-foreground text-sm border-t border-border bg-background/50 backdrop-blur-sm relative z-20">
            <p>© 2025 Nexus AI Store. Built with Gemini 2.5 Live & 3 Pro Preview.</p>
          </footer>
        </div>
      )}
    </div>
  );
};

export default App;
