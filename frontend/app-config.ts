export interface AppConfig {
  pageTitle: string;
  pageDescription: string;
  companyName: string;

  supportsChatInput: boolean;
  supportsVideoInput: boolean;
  supportsScreenShare: boolean;
  isPreConnectBufferEnabled: boolean;

  logo: string;
  startButtonText: string;
  accent?: string;
  logoDark?: string;
  accentDark?: string;

  audioVisualizerType?: 'bar' | 'wave' | 'grid' | 'radial' | 'aura';
  audioVisualizerColor?: `#${string}`;
  audioVisualizerColorDark?: `#${string}`;
  audioVisualizerColorShift?: number;
  audioVisualizerBarCount?: number;
  audioVisualizerGridRowCount?: number;
  audioVisualizerGridColumnCount?: number;
  audioVisualizerRadialBarCount?: number;
  audioVisualizerRadialRadius?: number;
  audioVisualizerWaveLineWidth?: number;

  // agent dispatch configuration
  agentName?: string;

  // LiveKit Cloud Sandbox configuration
  sandboxId?: string;
}

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'Voice of Bharat',
  pageTitle: 'Voice of Bharat — Community Financial Services Helpline',
  pageDescription:
    'AI Voice Helpline for Indian Government Financial Schemes, Banking Literacy, and Fraud Awareness. Powered by Murf Falcon TTS.',

  supportsChatInput: true,
  supportsVideoInput: false,
  supportsScreenShare: false,
  isPreConnectBufferEnabled: true,

  logo: '/murf-logo.svg',
  accent: '#FF9933',
  logoDark: '/murf-logo-dark.svg',
  accentDark: '#10B981',
  startButtonText: 'Start Helpline Call | बात शुरू करें',

  audioVisualizerType: 'aura',
  audioVisualizerColor: '#FF9933',
  audioVisualizerColorDark: '#10B981',

  // agent dispatch configuration
  agentName: process.env.AGENT_NAME || 'my-agent',

  // LiveKit Cloud Sandbox configuration
  sandboxId: undefined,
};
