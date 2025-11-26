"use client";

import { Globe, Paperclip, Send, BrainCircuit, MapPin } from "lucide-react";
import React, { useState } from "react";
import { Textarea } from "./textarea";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { useAutoResizeTextarea } from "../hooks/use-auto-resize-textarea";

interface AIInputWithSearchProps {
  id?: string;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  onSubmit?: (value: string) => void;
  onFileSelect?: (file: File) => void;
  className?: string;
  defaultValue?: string;
  
  // Feature flags & toggles
  isThinkingEnabled?: boolean;
  isSearchEnabled?: boolean;
  isMapsEnabled?: boolean;
  onToggleThinking?: () => void;
  onToggleSearch?: () => void;
  onToggleMaps?: () => void;
}

interface FeatureToggleBtnProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
  colorTheme: 'purple' | 'sky' | 'green';
}

function FeatureToggleBtn({ icon: Icon, label, isActive, onClick, colorTheme }: FeatureToggleBtnProps) {
  
  const colorClasses = {
    purple: {
      active: "bg-purple-500/15 border-purple-400 text-purple-500",
      icon: "text-purple-500",
      text: "text-purple-500"
    },
    sky: {
      active: "bg-sky-500/15 border-sky-400 text-sky-500",
      icon: "text-sky-500",
      text: "text-sky-500"
    },
    green: {
      active: "bg-green-500/15 border-green-400 text-green-500",
      icon: "text-green-500",
      text: "text-green-500"
    }
  };

  const theme = colorClasses[colorTheme];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full transition-all flex items-center gap-2 px-2 py-1 border h-8",
        isActive
          ? theme.active
          : "bg-transparent border-transparent text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
      )}
      title={label}
    >
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
        <motion.div
          animate={{
            rotate: isActive ? 180 : 0,
            scale: isActive ? 1.1 : 1,
          }}
          whileHover={{
            scale: 1.1,
            transition: { type: "spring", stiffness: 300, damping: 10 },
          }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
        >
          <Icon
            className={cn(
              "w-4 h-4",
              isActive ? theme.icon : "text-inherit"
            )}
          />
        </motion.div>
      </div>
      <AnimatePresence>
        {isActive && (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={cn("text-sm overflow-hidden whitespace-nowrap flex-shrink-0 font-medium", theme.text)}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export function AIInputWithSearch({
  id = "ai-input-with-search",
  placeholder = "Search the web...",
  minHeight = 48,
  maxHeight = 164,
  onSubmit,
  onFileSelect,
  className,
  defaultValue = "",
  isThinkingEnabled = false,
  isSearchEnabled = false,
  isMapsEnabled = false,
  onToggleThinking,
  onToggleSearch,
  onToggleMaps
}: AIInputWithSearchProps) {
  const [value, setValue] = useState(defaultValue);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight,
    maxHeight,
  });

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit?.(value);
      setValue("");
      adjustHeight(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect?.(file);
    }
  };

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative max-w-xl w-full mx-auto">
        <div className="relative flex flex-col">
          <div
            className="overflow-y-auto"
            style={{ maxHeight: `${maxHeight}px` }}
          >
            <Textarea
              id={id}
              value={value}
              placeholder={placeholder}
              className="w-full rounded-xl rounded-b-none px-4 py-3 bg-slate-50 dark:bg-white/5 border-none dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/70 resize-none focus-visible:ring-0 leading-[1.2]"
              ref={textareaRef}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              onChange={(e) => {
                setValue(e.target.value);
                adjustHeight();
              }}
            />
          </div>

          <div className="h-12 bg-slate-50 dark:bg-white/5 rounded-b-xl border-t border-slate-100 dark:border-white/5">
            <div className="absolute left-3 bottom-2 flex items-center gap-1">
              <label className="cursor-pointer rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors mr-1">
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileChange}
                />
                <Paperclip className="w-4 h-4 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors" />
              </label>

              {onToggleThinking && (
                <FeatureToggleBtn 
                  icon={BrainCircuit}
                  label="Think"
                  isActive={isThinkingEnabled}
                  onClick={onToggleThinking}
                  colorTheme="purple"
                />
              )}

              {onToggleSearch && (
                <FeatureToggleBtn 
                  icon={Globe}
                  label="Search"
                  isActive={isSearchEnabled}
                  onClick={onToggleSearch}
                  colorTheme="sky"
                />
              )}

              {onToggleMaps && (
                <FeatureToggleBtn 
                  icon={MapPin}
                  label="Maps"
                  isActive={isMapsEnabled}
                  onClick={onToggleMaps}
                  colorTheme="green"
                />
              )}
            </div>
            
            <div className="absolute right-3 bottom-3">
              <button
                type="button"
                onClick={handleSubmit}
                className={cn(
                  "rounded-lg p-2 transition-colors",
                  value
                    ? "bg-sky-500/15 text-sky-500"
                    : "bg-transparent text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
