'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'motion/react';
import { useAgent, useLocalParticipant, useSessionContext } from '@livekit/components-react';
import {
  ArrowClockwiseIcon,
  PhoneDisconnectIcon,
  ShieldCheckIcon,
  SpinnerIcon,
} from '@phosphor-icons/react';
import type { AppConfig } from '@/app-config';
import { AgentStateIndicator } from '@/components/agents-ui/agent-state-indicator';
import { AgentSessionView_01 } from '@/components/agents-ui/blocks/agent-session-view-01';
import { MicErrorModal } from '@/components/agents-ui/mic-error-modal';
import { WelcomeView } from '@/components/app/welcome-view';
import { Button } from '@/components/ui/button';

const MotionWelcomeView = motion.create(WelcomeView);
const MotionSessionView = motion.create(AgentSessionView_01);

const VIEW_MOTION_PROPS = {
  variants: {
    visible: { opacity: 1, scale: 1 },
    hidden: { opacity: 0, scale: 0.98 },
  },
  initial: 'hidden',
  animate: 'visible',
  exit: 'hidden',
  transition: { duration: 0.4, ease: 'easeOut' as const },
} as const;

interface ViewControllerProps {
  appConfig: AppConfig;
}

export function ViewController({ appConfig }: ViewControllerProps) {
  const { isConnected, start } = useSessionContext();
  const { localParticipant } = useLocalParticipant();
  const { state: agentState } = useAgent();
  const { resolvedTheme } = useTheme();

  const [isConnecting, setIsConnecting] = useState(false);
  const [hasEndedCall, setHasEndedCall] = useState(false);
  const [micError, setMicError] = useState(false);
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  const isConnectingRef = React.useRef(false);
  const wasConnectedRef = React.useRef(false);

  // Track transition into active call and subsequent end of call
  useEffect(() => {
    if (isConnected) {
      wasConnectedRef.current = true;
      setIsConnecting(false);
      setHasEndedCall(false);
    } else if (wasConnectedRef.current) {
      wasConnectedRef.current = false;
      setHasEndedCall(true);
      setIsConnecting(false);
    }
  }, [isConnected]);

  // Handle initiating call with mic permission check
  const handleStartCall = useCallback(async () => {
    setMicError(false);
    setIsConnecting(true);

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      }
      await start();
    } catch (err: unknown) {
      console.warn('Microphone permission check error:', err);
      setIsConnecting(false);
      const errorObj = err as { name?: string; message?: string };
      const isExplicitDenial =
        errorObj?.name === 'NotAllowedError' ||
        errorObj?.name === 'PermissionDeniedError' ||
        errorObj?.message?.includes('Permission denied') ||
        errorObj?.message?.includes('Permission dismissed');

      if (isExplicitDenial) {
        setMicError(true);
      } else {
        // If not explicitly denied permission, attempt direct start without pre-flight check
        try {
          await start();
        } catch (startErr) {
          console.error('Direct start error:', startErr);
          const startErrObj = startErr as { name?: string; message?: string };
          if (
            startErrObj?.name === 'NotAllowedError' ||
            startErrObj?.name === 'PermissionDeniedError'
          ) {
            setMicError(true);
          }
        }
      }
    }
  }, [start]);

  const handleStartNewCall = useCallback(() => {
    setHasEndedCall(false);
    handleStartCall();
  }, [handleStartCall]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'hi' : 'en'));
  };

  const isHi = lang === 'hi';

  return (
    <div className="bg-background relative h-svh w-full overflow-hidden">
      {/* Top Bar Navigation */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <a
          href="/dashboard"
          className="bg-card/80 hover:bg-card border-border/40 text-foreground flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-xs transition-all"
        >
          <span>📊</span>
          <span>{lang === 'en' ? 'Call Dashboard' : 'कॉल डैशबोर्ड'}</span>
        </a>
        <button
          onClick={toggleLanguage}
          className="bg-card/80 hover:bg-card border-border/40 text-foreground flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-xs transition-all"
        >
          <span>🌐</span>
          <span>{lang === 'en' ? 'हिंदी में बदलें' : 'Switch to English'}</span>
        </button>
      </div>

      {/* Mic Permission Error Modal (Step 4) */}
      <MicErrorModal
        isOpen={micError}
        onRetry={handleStartCall}
        onClose={() => setMicError(false)}
        lang={lang}
      />

      <AnimatePresence mode="wait">
        {/* 1. Ready State — Initial Welcome Screen */}
        {!isConnected && !isConnecting && !hasEndedCall && (
          <MotionWelcomeView
            key="welcome"
            {...VIEW_MOTION_PROPS}
            startButtonText={isHi ? 'हेल्पलाइन कॉल शुरू करें' : appConfig.startButtonText}
            onStartCall={handleStartCall}
            lang={lang}
            onLangToggle={toggleLanguage}
          />
        )}

        {/* 2. Connecting State — Joining Call Screen */}
        {!isConnected && isConnecting && (
          <motion.div
            key="connecting-screen"
            {...VIEW_MOTION_PROPS}
            className="bg-background/90 fixed inset-0 z-40 flex flex-col items-center justify-center p-6 text-center backdrop-blur-lg"
          >
            <div className="relative mb-6">
              <div className="flex size-20 items-center justify-center rounded-3xl border border-amber-500/30 bg-amber-500/10 text-amber-500 shadow-xl">
                <SpinnerIcon className="size-10 animate-spin" />
              </div>
              <span className="absolute -top-1 -right-1 flex size-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex size-4 rounded-full bg-amber-500"></span>
              </span>
            </div>

            <AgentStateIndicator state="connecting" lang={lang} className="mb-4 max-w-sm" />

            <p className="text-muted-foreground mt-2 max-w-xs text-xs leading-relaxed">
              {isHi
                ? 'मर्फ़ फाल्कन टीटीएस वॉइस इंजन एवं लाइवकिट सर्वर के साथ ऑडियो कनेक्शन जोड़ा जा रहा है...'
                : 'Establishing secure audio stream with Murf Falcon TTS voice engine...'}
            </p>
          </motion.div>
        )}

        {/* 3. Active Session State (Listening, Speaking, Thinking) */}
        {isConnected && (
          <MotionSessionView
            key="session-view"
            {...VIEW_MOTION_PROPS}
            supportsChatInput={appConfig.supportsChatInput}
            supportsVideoInput={false}
            supportsScreenShare={false}
            isPreConnectBufferEnabled={appConfig.isPreConnectBufferEnabled}
            audioVisualizerType={appConfig.audioVisualizerType}
            audioVisualizerColor={
              resolvedTheme === 'dark'
                ? appConfig.audioVisualizerColorDark
                : appConfig.audioVisualizerColor
            }
            audioVisualizerColorShift={appConfig.audioVisualizerColorShift}
            audioVisualizerBarCount={appConfig.audioVisualizerBarCount}
            audioVisualizerGridRowCount={appConfig.audioVisualizerGridRowCount}
            audioVisualizerGridColumnCount={appConfig.audioVisualizerGridColumnCount}
            audioVisualizerRadialBarCount={appConfig.audioVisualizerRadialBarCount}
            audioVisualizerRadialRadius={appConfig.audioVisualizerRadialRadius}
            audioVisualizerWaveLineWidth={appConfig.audioVisualizerWaveLineWidth}
            className="fixed inset-0"
          />
        )}

        {/* 5. Call Ended State */}
        {!isConnected && !isConnecting && hasEndedCall && (
          <motion.div
            key="call-ended-screen"
            {...VIEW_MOTION_PROPS}
            className="bg-background/95 fixed inset-0 z-40 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md"
          >
            <div className="mb-6 flex size-20 items-center justify-center rounded-3xl border border-rose-500/20 bg-rose-500/10 text-rose-500 shadow-xl">
              <PhoneDisconnectIcon className="size-10" />
            </div>

            <AgentStateIndicator state="disconnected" lang={lang} className="mb-6 max-w-sm" />

            <div className="bg-card border-border/50 w-full max-w-sm space-y-4 rounded-3xl border p-6 text-center shadow-lg">
              <h3 className="text-foreground text-lg font-bold">
                {isHi ? 'बातचीत समाप्त हो गई' : 'Conversation Ended'}
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {isHi
                  ? 'वॉइस ऑफ भारत हेल्पलाइन का उपयोग करने के लिए धन्यवाद। क्या आपके पास कोई अन्य वित्तीय प्रश्न है?'
                  : 'Thank you for consulting Voice of Bharat Financial Helpline. Do you have any further questions?'}
              </p>

              <div className="pt-2">
                <Button
                  size="lg"
                  onClick={handleStartNewCall}
                  className="w-full gap-2 rounded-full bg-linear-to-r from-amber-500 to-emerald-600 text-sm font-bold text-white shadow-md hover:from-amber-600 hover:to-emerald-700"
                >
                  <ArrowClockwiseIcon className="size-5" weight="bold" />
                  <span>{isHi ? 'नया सत्र शुरू करें' : 'Start New Session'}</span>
                </Button>
              </div>
            </div>

            <div className="text-muted-foreground mt-8 flex items-center gap-2 text-xs">
              <ShieldCheckIcon className="size-4 text-emerald-500" />
              <span>Voice of Bharat • Powered by Murf Falcon TTS</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
