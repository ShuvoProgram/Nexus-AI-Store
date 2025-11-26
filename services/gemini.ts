import { GoogleGenAI, Chat, GenerateContentResponse, Content } from "@google/genai";

interface ChatConfigOptions {
  model?: string;
  systemInstruction?: string;
  useThinking?: boolean;
  enableSearch?: boolean;
  enableMaps?: boolean;
  location?: { latitude: number; longitude: number };
  history?: Content[];
  modelPreference?: string;
}

export const createChatSession = (options: ChatConfigOptions): Chat => {
  // Initialize the client at the time of session creation to ensure it picks up the correct API key
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error(
      'API Key is missing! Please add GEMINI_API_KEY to your .env file in the root directory.\n' +
      'Example: GEMINI_API_KEY=your_api_key_here\n' +
      'After adding the key, restart the dev server with: npm run dev'
    );
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  // Default to Pro or user preference
  let model = options.modelPreference || 'gemini-3-pro-preview';
  
  const tools: any[] = [];
  const config: any = {
    systemInstruction: options.systemInstruction,
  };

  // Logic for Model and Tool Selection
  if (options.useThinking) {
    // Thinking Mode: MUST use gemini-3-pro-preview
    model = 'gemini-3-pro-preview';
    config.thinkingConfig = { thinkingBudget: 32768 };
    // Thinking cannot be combined with tools in this specific config setup usually, 
    // or at least we prioritize the "Thinking" capability if selected.
  } else if (options.enableSearch || options.enableMaps) {
    // Grounding Mode: Prompt requests gemini-2.5-flash for these tools
    model = 'gemini-2.5-flash';
    
    if (options.enableSearch) {
      tools.push({ googleSearch: {} });
    }
    
    if (options.enableMaps) {
      tools.push({ googleMaps: {} });
      if (options.location) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: options.location.latitude,
              longitude: options.location.longitude
            }
          }
        };
      }
    }
  }

  if (tools.length > 0) {
    config.tools = tools;
  }

  return ai.chats.create({
    model: model,
    config: config,
    history: options.history
  });
};

export const sendMessageStream = async (
  chat: Chat, 
  message: string
): Promise<AsyncIterable<GenerateContentResponse>> => {
  return chat.sendMessageStream({ message });
};