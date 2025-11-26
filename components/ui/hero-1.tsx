
"use client";

import * as React from "react";
import { Sparkles, Search } from "lucide-react";

interface Hero1Props {
  searchValue: string;
  onSearchChange: (value: string) => void;
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
}

const Hero1 = ({ searchValue, onSearchChange }: Hero1Props) => {
  return (
    <div className="relative mb-8 text-foreground min-h-[400px] flex flex-col justify-center">

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto w-full">

        <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-full px-4 py-1.5 flex items-center gap-2 w-fit mx-auto shadow-sm">
            <span className="flex items-center gap-2 text-sm font-medium text-purple-700 dark:text-purple-200">
              <span className="bg-purple-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">NEW</span>
              Gemini 3 Pro Reasoning Model
            </span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-6 tracking-tight font-serif-brand animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          Supercharge your <br />
          <span className="inline-block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 dark:from-purple-400 dark:via-pink-400 dark:to-blue-400">
            productivity
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Access a suite of specialized AI agents powered by Google Gemini.
          From coding to coaching, find the perfect expert for your needs.
        </p>

        {/* Search bar */}
        <div className="relative max-w-2xl mx-auto w-full mb-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-full p-2 pl-6 flex items-center shadow-lg dark:shadow-none ring-1 ring-black/5 dark:ring-white/10 focus-within:ring-purple-400/50 transition-all">
            <Search className="w-5 h-5 text-slate-400 mr-3" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for an agent (e.g., 'Coding', 'Finance')..."
              className="bg-transparent flex-1 outline-none text-foreground placeholder:text-muted-foreground h-10"
            />
            <div className="flex items-center gap-1 pr-1">
              <div className="hidden md:flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span>AI Powered</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export { Hero1 };
