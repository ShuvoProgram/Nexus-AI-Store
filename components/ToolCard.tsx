import React from 'react';
import { ToolAgent, AgentType } from '../types';
import { ArrowRight, Mic, Sparkles, Settings } from 'lucide-react';

interface ToolCardProps {
  tool: ToolAgent;
  onClick: (tool: ToolAgent) => void;
  onSettingsClick: (tool: ToolAgent) => void;
}

const ToolCard: React.FC<ToolCardProps> = ({ tool, onClick, onSettingsClick }) => {
  return (
    <div
      className="group relative bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-lg hover:shadow-slate-100 dark:hover:shadow-none cursor-pointer overflow-hidden flex flex-col h-full justify-between"
    >
      <div onClick={() => onClick(tool)} className="absolute inset-0 z-0"></div>

      <div className="relative z-10 pointer-events-none">
        <div className="flex justify-between items-start mb-5">
          <div className={`w-12 h-12 rounded-lg ${tool.color} bg-opacity-10 dark:bg-opacity-20 flex items-center justify-center group-hover:scale-105 transition-transform`}>
            <tool.icon className={`w-6 h-6 ${tool.color.replace('bg-', 'text-')}`} />
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onSettingsClick(tool);
            }}
            className="pointer-events-auto p-2 text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            title="Agent Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 font-serif-brand tracking-tight">{tool.name}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 h-10 line-clamp-2 leading-relaxed">{tool.description}</p>
      </div>

      <div className="relative z-10 flex items-center justify-between text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide pt-4 border-t border-slate-50 dark:border-slate-800 pointer-events-none">
        <div className="flex items-center gap-2">
          {tool.type === AgentType.VOICE ? (
            <span className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 px-2 py-1 rounded-md">
              <Mic className="w-3 h-3" /> Live Audio
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-blue-500 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-md">
              <Sparkles className="w-3 h-3" /> Gemini
            </span>
          )}
        </div>
        <span className="group-hover:translate-x-1 transition-transform text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300">
          <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
};

export default ToolCard;