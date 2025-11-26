import React, { useEffect } from 'react';
import { LucideIcon, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  icon?: LucideIcon;
  variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  icon: Icon = AlertTriangle,
  variant = 'warning'
}) => {
  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100 dark:bg-red-950/30',
      iconColor: 'text-red-600 dark:text-red-500',
      confirmButton: 'bg-destructive text-destructive-foreground hover:opacity-90'
    },
    warning: {
      iconBg: 'bg-amber-100 dark:bg-amber-950/30',
      iconColor: 'text-amber-600 dark:text-amber-500',
      confirmButton: 'bg-amber-600 dark:bg-amber-700 text-white hover:opacity-90'
    },
    info: {
      iconBg: 'bg-blue-100 dark:bg-blue-950/30',
      iconColor: 'text-blue-600 dark:text-blue-500',
      confirmButton: 'bg-primary text-primary-foreground hover:opacity-90'
    }
  };

  const styles = variantStyles[variant];

  return (
    <div 
      className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-card text-card-foreground rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon and Header */}
        <div className="flex flex-col items-center p-6 pb-4">
          <div className={`w-14 h-14 ${styles.iconBg} rounded-full flex items-center justify-center mb-4 ring-4 ring-background`}>
            <Icon className={`w-7 h-7 ${styles.iconColor}`} />
          </div>
          <h3 className="text-lg font-bold font-serif-brand text-center">{title}</h3>
          <p className="text-sm text-muted-foreground mt-2 text-center leading-relaxed">
            {description}
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium hover:bg-muted rounded-lg transition-colors border border-border"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-opacity ${styles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>

        {/* Hint */}
        <div className="px-6 pb-4 text-center">
          <p className="text-xs text-muted-foreground">
            Press <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-muted border border-border rounded">Esc</kbd> to cancel or <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-muted border border-border rounded">Enter</kbd> to confirm
          </p>
        </div>
      </div>
    </div>
  );
};
