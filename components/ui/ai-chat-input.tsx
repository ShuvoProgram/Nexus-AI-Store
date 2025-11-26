"use client" 

import * as React from "react"
import { useState, useEffect, useRef } from "react";
import { Lightbulb, Mic, Globe, Paperclip, Send, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { cn } from "../../lib/utils";

const PLACEHOLDERS = [
  "Generate website with HextaUI",
  "Create a new project with Next.js",
  "What is the meaning of life?",
  "What is the best way to learn React?",
  "How to cook a delicious meal?",
  "Summarize this article",
];

interface AIChatInputProps {
  onSubmit: (value: string) => void;
  isThinkingEnabled: boolean;
  onToggleThinking: () => void;
  isSearchEnabled: boolean;
  onToggleSearch: () => void;
  isMapsEnabled: boolean;
  onToggleMaps: () => void;
  placeholder?: string;
  className?: string;
  onFileSelect?: (file: File) => void;
  onMicClick?: () => void;
}
 
export const AIChatInput = ({
  onSubmit,
  isThinkingEnabled,
  onToggleThinking,
  isSearchEnabled,
  onToggleSearch,
  isMapsEnabled,
  onToggleMaps,
  placeholder,
  className,
  onFileSelect,
  onMicClick
}: AIChatInputProps) => {
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
 
  // Cycle placeholder text when input is inactive
  useEffect(() => {
    if (isActive || inputValue) return;
 
    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
        setShowPlaceholder(true);
      }, 400);
    }, 3000);
 
    return () => clearInterval(interval);
  }, [isActive, inputValue]);
 
  // Close input when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        if (!inputValue) setIsActive(false);
      }
    };
 
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue]);
 
  const handleActivate = () => {
    setIsActive(true);
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onSubmit(inputValue);
      setInputValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
 
  const containerVariants: Variants = {
    collapsed: {
      height: 60,
      boxShadow: "0 2px 8px 0 rgba(0,0,0,0.08)",
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
    expanded: {
      height: 120,
      boxShadow: "0 8px 32px 0 rgba(0,0,0,0.16)",
      transition: { type: "spring", stiffness: 120, damping: 18 },
    },
  };
 
  const placeholderContainerVariants: Variants = {
    initial: {},
    animate: { transition: { staggerChildren: 0.025 } },
    exit: { transition: { staggerChildren: 0.015, staggerDirection: -1 } },
  };
 
  const letterVariants: Variants = {
    initial: {
      opacity: 0,
      filter: "blur(12px)",
      y: 10,
    },
    animate: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        opacity: { duration: 0.25 },
        filter: { duration: 0.4 },
        y: { type: "spring", stiffness: 80, damping: 20 },
      },
    },
    exit: {
      opacity: 0,
      filter: "blur(12px)",
      y: -10,
      transition: {
        opacity: { duration: 0.2 },
        filter: { duration: 0.3 },
        y: { type: "spring", stiffness: 80, damping: 20 },
      },
    },
  };
 
  return (
    <div className={cn("w-full flex justify-center items-center text-slate-900 dark:text-slate-100", className)}>
      <motion.div
        ref={wrapperRef}
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        variants={containerVariants}
        animate={isActive || inputValue ? "expanded" : "collapsed"}
        initial="collapsed"
        style={{ overflow: "hidden", borderRadius: 32 }}
        onClick={handleActivate}
      >
        <div className="flex flex-col items-stretch w-full h-full">
          {/* Input Row */}
          <div className="flex items-center gap-2 p-2.5 rounded-full max-w-3xl w-full h-[60px]">
            <label className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-500 dark:text-slate-400">
              <input 
                type="file" 
                className="hidden" 
                onChange={(e) => onFileSelect?.(e.target.files?.[0] as File)}
              />
              <Paperclip size={20} />
            </label>
 
            {/* Text Input & Placeholder */}
            <div className="relative flex-1 h-full flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 border-0 outline-0 bg-transparent w-full font-normal text-slate-900 dark:text-slate-100 placeholder:text-transparent"
                style={{ position: "relative", zIndex: 1 }}
                onFocus={handleActivate}
              />
              <div className="absolute left-0 top-0 w-full h-full pointer-events-none flex items-center">
                <AnimatePresence mode="wait">
                  {showPlaceholder && !isActive && !inputValue && (
                    <motion.span
                      key={placeholderIndex}
                      className="text-slate-400 dark:text-slate-500 select-none pointer-events-none"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        zIndex: 0,
                      }}
                      variants={placeholderContainerVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {(placeholder || PLACEHOLDERS[placeholderIndex])
                        .split("")
                        .map((char, i) => (
                          <motion.span
                            key={i}
                            variants={letterVariants}
                            style={{ display: "inline-block" }}
                          >
                            {char === " " ? "\u00A0" : char}
                          </motion.span>
                        ))}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
 
            <button
              className="p-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400"
              title="Switch to Voice Mode"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onMicClick?.();
              }}
            >
              <Mic size={20} />
            </button>
            <button
              className={cn(
                "flex items-center gap-1 p-2.5 rounded-full font-medium justify-center transition-all",
                inputValue.trim() 
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90" 
                  : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600"
              )}
              title="Send"
              type="button"
              tabIndex={-1}
              onClick={handleSubmit}
            >
              <Send size={18} />
            </button>
          </div>
 
          {/* Expanded Controls */}
          <motion.div
            className="w-full flex justify-start px-4 items-center text-sm"
            variants={{
              hidden: {
                opacity: 0,
                y: 20,
                pointerEvents: "none" as const,
                transition: { duration: 0.25 },
              },
              visible: {
                opacity: 1,
                y: 0,
                pointerEvents: "auto" as const,
                transition: { duration: 0.35, delay: 0.08 },
              },
            }}
            initial="hidden"
            animate={isActive || inputValue ? "visible" : "hidden"}
          >
            <div className="flex gap-3 items-center">
              {/* Think Toggle */}
              <button
                className={`flex items-center gap-1 px-4 py-2 rounded-full transition-all font-medium group text-xs ${
                  isThinkingEnabled
                    ? "bg-purple-500/15 outline outline-1 outline-purple-500/60 text-purple-600 dark:text-purple-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                title="Reasoning Model"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleThinking();
                }}
              >
                <Lightbulb
                  className={cn("w-4 h-4 transition-all", isThinkingEnabled && "fill-purple-500 text-purple-500")}
                />
                Think
              </button>
 
              {/* Search Toggle */}
              <motion.button
                className={`flex items-center px-4 gap-1 py-2 rounded-full transition font-medium whitespace-nowrap overflow-hidden justify-start text-xs ${
                  isSearchEnabled
                    ? "bg-sky-500/15 outline outline-1 outline-sky-500/60 text-sky-600 dark:text-sky-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                title="Google Search"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSearch();
                }}
                initial={false}
                animate={{
                  width: isSearchEnabled ? 100 : 36,
                  paddingLeft: isSearchEnabled ? 16 : 9, // Adjust padding to center icon when collapsed
                }}
              >
                <div className="flex-1 flex justify-center">
                  <Globe size={16} />
                </div>
                <motion.span
                  className="pb-[1px]"
                  initial={false}
                  animate={{
                    opacity: isSearchEnabled ? 1 : 0,
                    width: isSearchEnabled ? "auto" : 0
                  }}
                >
                  Search
                </motion.span>
              </motion.button>

               {/* Maps Toggle */}
               <motion.button
                className={`flex items-center px-4 gap-1 py-2 rounded-full transition font-medium whitespace-nowrap overflow-hidden justify-start text-xs ${
                  isMapsEnabled
                    ? "bg-green-500/15 outline outline-1 outline-green-500/60 text-green-600 dark:text-green-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                title="Google Maps"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMaps();
                }}
                initial={false}
                animate={{
                  width: isMapsEnabled ? 100 : 36,
                  paddingLeft: isMapsEnabled ? 16 : 9,
                }}
              >
                <div className="flex-1 flex justify-center">
                  <MapPin size={16} />
                </div>
                <motion.span
                  className="pb-[1px]"
                  initial={false}
                  animate={{
                    opacity: isMapsEnabled ? 1 : 0,
                    width: isMapsEnabled ? "auto" : 0
                  }}
                >
                  Maps
                </motion.span>
              </motion.button>

            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
