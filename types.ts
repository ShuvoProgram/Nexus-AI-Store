import { LucideIcon } from 'lucide-react';

export enum AgentType {
  CHAT = 'CHAT',
  VOICE = 'VOICE'
}

export interface ToolAgent {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  type: AgentType;
  color: string;
  systemInstruction: string;
  welcomeMessage: string;
  modelPreference?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
  groundingMetadata?: any;
}

export interface LiveConnectionState {
  isConnected: boolean;
  isSpeaking: boolean;
  volume: number;
}