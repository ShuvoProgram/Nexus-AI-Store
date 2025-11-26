import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

// Audio Context Global State
let audioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let processor: ScriptProcessorNode | null = null;
let sourceNode: MediaStreamAudioSourceNode | null = null;

// Helper to convert float32 to PCM16
function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  let binary = '';
  const len = int16.buffer.byteLength;
  const bytes = new Uint8Array(int16.buffer);
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return {
    data: btoa(binary),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Decode Audio Data Helper
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export class LiveClient {
  private ai: GoogleGenAI;
  private session: any = null;
  private outputContext: AudioContext;
  private outputNode: GainNode;
  private nextStartTime: number = 0;
  private isConnected: boolean = false;
  
  // Callbacks
  public onVolumeChange?: (volume: number) => void;
  public onDisconnect?: () => void;

  constructor(systemInstruction: string) {
    // Initialize fresh client to ensure API key is current
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    this.outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    this.outputNode = this.outputContext.createGain();
    this.outputNode.connect(this.outputContext.destination);
    
    this.connect(systemInstruction);
  }

  private async connect(systemInstruction: string) {
    try {
      // 1. Setup Input Audio
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. Setup Live Session
      const sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Live Session Opened');
            this.isConnected = true;
            this.startAudioInputStream(sessionPromise);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               await this.playAudioChunk(base64Audio);
            }
            // Basic volume simulation for visualizer
            if (this.onVolumeChange) {
                this.onVolumeChange(base64Audio ? Math.random() * 0.5 + 0.3 : 0.05); 
            }
          },
          onclose: () => {
            console.log('Live Session Closed');
            this.cleanup();
          },
          onerror: (err) => {
            console.error('Live Session Error', err);
            this.cleanup();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: systemInstruction,
        }
      });
      
      // Handle initial connection failures (e.g. invalid key, network)
      sessionPromise.catch(err => {
          console.error("Failed to establish live session connection:", err);
          this.cleanup();
      });

      this.session = sessionPromise;

    } catch (error) {
      console.error("Failed to connect live client", error);
      this.cleanup();
    }
  }

  private startAudioInputStream(sessionPromise: Promise<any>) {
    if (!audioContext || !mediaStream) return;

    sourceNode = audioContext.createMediaStreamSource(mediaStream);
    processor = audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (!this.isConnected) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Simple volume meter for input
      let sum = 0;
      for (let i=0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
      const rms = Math.sqrt(sum / inputData.length);
      if (this.onVolumeChange) this.onVolumeChange(rms * 5); // Boost visual

      const pcmBlob = createBlob(inputData);
      
      sessionPromise.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      }).catch(err => {
        // Suppress errors here if session is already closed/failed, 
        // as onError will handle the main state.
      });
    };

    sourceNode.connect(processor);
    processor.connect(audioContext.destination);
  }

  private async playAudioChunk(base64: string) {
    if (!this.outputContext) return;

    // Ensure we don't schedule in the past
    this.nextStartTime = Math.max(this.nextStartTime, this.outputContext.currentTime);

    const audioBuffer = await decodeAudioData(
      decode(base64), 
      this.outputContext, 
      24000, 
      1
    );

    const source = this.outputContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputNode);
    source.start(this.nextStartTime);
    
    this.nextStartTime += audioBuffer.duration;
  }

  public async disconnect() {
    if (this.session) {
        try {
            const s = await this.session;
            // @ts-ignore
            s.close(); 
        } catch (e) {
            console.warn("Could not close session cleanly (might already be closed or failed)", e);
        }
    }
    this.cleanup();
  }

  private cleanup() {
    this.isConnected = false;
    if (this.onDisconnect) this.onDisconnect();
    
    if (processor) {
        processor.disconnect();
        processor.onaudioprocess = null;
        processor = null;
    }
    if (sourceNode) {
        sourceNode.disconnect();
        sourceNode = null;
    }
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }
    // We keep outputContext alive to finish playing pending buffers
    this.nextStartTime = 0;
  }
}