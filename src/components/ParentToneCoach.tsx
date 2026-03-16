import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

interface ParentToneCoachProps {
  compact?: boolean;
}

interface MicroPrompt {
  id: string;
  message: string;
  secondary?: string;
  borderColor: string;
  duration: number;
}

interface SessionStats {
  startTime: number;
  promptsShown: number;
  promptsFollowed: number;
  toneHistory: number[];
  bestCalmStreak: number;
  currentCalmStreak: number;
}

const PHASE_TONE_TARGETS: Record<number, number> = {
  0: 25,
  1: 40,
  2: 60,
  3: 80,
  4: 50,
  5: 20,
};

const PROMPT_COOLDOWN_MS = 15_000;

function getToneLabel(score: number): string {
  if (score <= 30) return 'Calm and warm';
  if (score <= 55) return 'Moderate, steady';
  if (score <= 75) return 'Slightly rising';
  return 'Elevated — try softening';
}

function getToneColor(score: number): string {
  if (score <= 30) return '#00D9A6';
  if (score <= 55) return '#F0C038';
  if (score <= 75) return '#F0C038';
  return '#FF6B6B';
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function calculateSpectralCentroid(dataArray: Uint8Array, sampleRate: number, fftSize: number): number {
  let weightedSum = 0;
  let totalMagnitude = 0;
  const binFrequency = sampleRate / fftSize;

  for (let i = 0; i < dataArray.length; i++) {
    const magnitude = dataArray[i];
    const frequency = i * binFrequency;
    weightedSum += magnitude * frequency;
    totalMagnitude += magnitude;
  }

  return totalMagnitude === 0 ? 0 : weightedSum / totalMagnitude;
}

export default function ParentToneCoach({ compact = false }: ParentToneCoachProps) {
  const { isSimulating, simulationPhase, childProfile } = useAppStore();
  const childName = childProfile?.name || 'Leo';

  const [toneScore, setToneScore] = useState(20);
  const [activePrompt, setActivePrompt] = useState<MicroPrompt | null>(null);
  const [promptFading, setPromptFading] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    startTime: Date.now(),
    promptsShown: 0,
    promptsFollowed: 0,
    toneHistory: [],
    bestCalmStreak: 0,
    currentCalmStreak: 0,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPromptTimeRef = useRef(0);
  const prevScoreRef = useRef(20);
  const wasElevatedRef = useRef(false);
  const promptTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simTargetRef = useRef(25);

  // Start real mic analysis
  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setMicActive(true);
    } catch {
      // Mic access denied — fall back to idle values
      setMicActive(false);
    }
  }, []);

  const stopMic = useCallback(() => {
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setMicActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMic();
      if (promptTimeoutRef.current) clearTimeout(promptTimeoutRef.current);
    };
  }, [stopMic]);

  // Start mic when not simulating
  useEffect(() => {
    if (!isSimulating) {
      startMic();
    } else {
      stopMic();
    }
    return () => {
      if (!isSimulating) stopMic();
    };
  }, [isSimulating, startMic, stopMic]);

  // Real mic analysis loop
  useEffect(() => {
    if (isSimulating || !micActive || !analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const timeData = new Float32Array(bufferLength);
    const freqData = new Uint8Array(bufferLength);

    const interval = setInterval(() => {
      if (!analyserRef.current) return;

      analyser.getFloatTimeDomainData(timeData);
      analyser.getByteFrequencyData(freqData);

      // RMS energy
      let sumSq = 0;
      for (let i = 0; i < timeData.length; i++) {
        sumSq += timeData[i] * timeData[i];
      }
      const rms = Math.sqrt(sumSq / timeData.length);

      // Spectral centroid
      const sampleRate = audioContextRef.current?.sampleRate || 44100;
      const centroid = calculateSpectralCentroid(freqData, sampleRate, analyser.fftSize);

      // Map to tone score
      // RMS: 0 (silent) to ~0.5 (loud) -> 0-60 contribution
      const volumeScore = clamp(rms * 120, 0, 60);
      // Centroid: 0 to ~4000Hz -> 0-40 contribution
      const pitchScore = clamp((centroid / 4000) * 40, 0, 40);

      const raw = volumeScore + pitchScore;
      // Add natural variation (+/- 3)
      const jitter = (Math.random() - 0.5) * 6;
      const score = clamp(Math.round(raw + jitter), 0, 100);

      setToneScore(score);
    }, 200);

    analysisIntervalRef.current = interval;

    return () => {
      clearInterval(interval);
      analysisIntervalRef.current = null;
    };
  }, [isSimulating, micActive]);

  // Simulation tone score
  useEffect(() => {
    if (!isSimulating) return;

    const target = PHASE_TONE_TARGETS[simulationPhase] ?? 25;
    simTargetRef.current = target;

    const interval = setInterval(() => {
      setToneScore((prev) => {
        const diff = simTargetRef.current - prev;
        const step = diff * 0.15 + (Math.random() - 0.5) * 6;
        return clamp(Math.round(prev + step), 0, 100);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isSimulating, simulationPhase]);

  // Track session stats
  useEffect(() => {
    setSessionStats((prev) => {
      const newHistory = [...prev.toneHistory, toneScore];
      const isCalm = toneScore <= 40;
      const newCalmStreak = isCalm ? prev.currentCalmStreak + 1 : 0;
      return {
        ...prev,
        toneHistory: newHistory,
        currentCalmStreak: newCalmStreak,
        bestCalmStreak: Math.max(prev.bestCalmStreak, newCalmStreak),
      };
    });
  }, [toneScore]);

  // Show prompt
  const showPrompt = useCallback(
    (prompt: MicroPrompt) => {
      const now = Date.now();
      if (now - lastPromptTimeRef.current < PROMPT_COOLDOWN_MS) return;
      lastPromptTimeRef.current = now;

      setActivePrompt(prompt);
      setPromptFading(false);

      setSessionStats((prev) => ({
        ...prev,
        promptsShown: prev.promptsShown + 1,
      }));

      if (promptTimeoutRef.current) clearTimeout(promptTimeoutRef.current);

      // Start fade 1s before removal
      promptTimeoutRef.current = setTimeout(() => {
        setPromptFading(true);
        promptTimeoutRef.current = setTimeout(() => {
          setActivePrompt(null);
          setPromptFading(false);
        }, 500);
      }, prompt.duration - 500);
    },
    []
  );

  // Micro-prompt triggers
  useEffect(() => {
    const prev = prevScoreRef.current;

    if (toneScore >= 76 && prev < 76) {
      wasElevatedRef.current = true;
      showPrompt({
        id: `red-${Date.now()}`,
        message: `Take a breath. ${childName} responds better to a low, calm voice.`,
        secondary: 'Try lowering your pitch and slowing down',
        borderColor: '#FF6B6B',
        duration: 7000,
      });
    } else if (toneScore >= 56 && toneScore < 76 && prev < 56) {
      wasElevatedRef.current = true;
      showPrompt({
        id: `amber-${Date.now()}`,
        message: 'Your tone is rising slightly. Try speaking a little softer.',
        secondary: 'A gentle voice helps keep things calm',
        borderColor: '#F0C038',
        duration: 5000,
      });
    } else if (toneScore < 40 && wasElevatedRef.current) {
      wasElevatedRef.current = false;
      setSessionStats((s) => ({
        ...s,
        promptsFollowed: s.promptsFollowed + 1,
      }));
      showPrompt({
        id: `recovery-${Date.now()}`,
        message: `Great job — your voice is calm again. ${childName} can feel the difference. 💙`,
        borderColor: '#00D9A6',
        duration: 5000,
      });
    }

    prevScoreRef.current = toneScore;
  }, [toneScore, childName, showPrompt]);

  // Derived values
  const markerPosition = clamp(toneScore, 0, 100);
  const elapsedMin = Math.floor((Date.now() - sessionStats.startTime) / 60_000);
  const calmPercent =
    sessionStats.toneHistory.length > 0
      ? Math.round(
          (sessionStats.toneHistory.filter((s) => s <= 40).length /
            sessionStats.toneHistory.length) *
            100
        )
      : 100;
  // Each history entry is ~200ms, so bestCalmStreak * 0.2 = seconds, /60 = minutes
  const bestCalmMin = Math.round((sessionStats.bestCalmStreak * 0.2) / 60 * 10) / 10;

  return (
    <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4 relative">
      {/* Micro-prompt overlay */}
      {activePrompt && (
        <div
          className={`absolute left-3 right-3 -top-2 z-20 transition-all duration-500 ${
            promptFading ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
          }`}
          style={{ animation: promptFading ? undefined : 'slideDown 0.4s ease-out' }}
        >
          <div
            className="bg-[#0D1B2A] border-l-4 rounded-xl p-3 shadow-2xl"
            style={{ borderLeftColor: activePrompt.borderColor }}
          >
            <p className="text-sm text-white font-medium leading-snug">
              {activePrompt.message}
            </p>
            {activePrompt.secondary && (
              <p className="text-xs text-[#8EACCD] mt-1">{activePrompt.secondary}</p>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{
              backgroundColor: micActive || isSimulating ? '#00D9A6' : '#8EACCD',
              boxShadow: micActive || isSimulating ? '0 0 6px #00D9A6' : 'none',
            }}
          />
          <span className="text-xs text-[#8EACCD] font-medium tracking-wide uppercase">
            Tone Coach
          </span>
        </div>
        {!micActive && !isSimulating && (
          <span className="text-xs text-[#8EACCD]/60">Mic unavailable</span>
        )}
      </div>

      {/* Tone bar */}
      <div className="relative mb-2">
        <div
          className="h-3 rounded-full w-full"
          style={{
            background: 'linear-gradient(to right, #00D9A6, #F0C038 50%, #FF6B6B)',
          }}
        />
        {/* Marker */}
        <div
          className="absolute top-0 w-3 h-3 rounded-full bg-white border-2 border-white/80 transition-all duration-300 ease-out"
          style={{
            left: `calc(${markerPosition}% - 6px)`,
            boxShadow: `0 0 8px ${getToneColor(toneScore)}, 0 2px 4px rgba(0,0,0,0.3)`,
          }}
        />
      </div>

      {/* Tone label */}
      <p className="text-xs mb-1" style={{ color: getToneColor(toneScore) }}>
        Your tone:{' '}
        <span className="font-medium">{getToneLabel(toneScore)}</span>
      </p>

      {/* Stats section */}
      {!compact && (
        <>
          <button
            onClick={() => setStatsExpanded(!statsExpanded)}
            className="flex items-center gap-1 mt-3 text-xs text-[#8EACCD]/70 hover:text-[#8EACCD] transition-colors cursor-pointer"
          >
            <svg
              className={`w-3 h-3 transition-transform duration-200 ${
                statsExpanded ? 'rotate-90' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Session details
          </button>

          {statsExpanded && (
            <div className="mt-2 space-y-1.5 text-xs text-[#8EACCD]/80 pl-1">
              <p>
                This session:{' '}
                <span className="text-white/90">{elapsedMin < 1 ? '<1' : elapsedMin} min</span>
              </p>
              <p>
                Prompts shown:{' '}
                <span className="text-white/90">{sessionStats.promptsShown}</span>
              </p>
              <p>
                Tone remained calm:{' '}
                <span className="text-white/90">{calmPercent}% of the time</span>
              </p>
              {bestCalmMin > 0 && (
                <p>
                  Best moment:{' '}
                  <span className="text-white/90">
                    {bestCalmMin} min stretch of perfectly calm tone
                  </span>
                </p>
              )}
            </div>
          )}
        </>
      )}

      {/* Inline keyframe animation */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
