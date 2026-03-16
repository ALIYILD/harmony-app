import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { ChildState } from '../types';

const EMOTION_MAP: Record<ChildState, { label: string; color: string }> = {
  calm: { label: 'Calm', color: '#00D9A6' },
  engaged: { label: 'Engaged', color: '#38C9F0' },
  uneasy: { label: 'Uneasy', color: '#F0C038' },
  confused: { label: 'Uncertain', color: '#F0C038' },
  frustrated: { label: 'Frustrated', color: '#FF6B6B' },
  overloaded: { label: 'Distressed', color: '#FF6B6B' },
  dysregulated: { label: 'High Distress', color: '#FF6B6B' },
  shutdown_risk: { label: 'Withdrawal', color: '#8B6EE8' },
  sensory_seeking: { label: 'Seeking Input', color: '#8B6EE8' },
};

const BAR_COUNT = 64;

export default function AudioAnalyzer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [micActive, setMicActive] = useState(false);
  const [micDenied, setMicDenied] = useState(false);

  const currentState = useAppStore((s) => s.currentState);
  const sensorReadings = useAppStore((s) => s.sensorReadings);

  const emotion = EMOTION_MAP[currentState.primaryState] ?? EMOTION_MAP.calm;
  const audio = sensorReadings.audio;

  // ---------- mic setup ----------
  const initMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      streamRef.current = stream;
      setMicActive(true);
      setMicDenied(false);
    } catch {
      setMicActive(false);
      setMicDenied(true);
    }
  }, []);

  // ---------- canvas draw loop ----------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let simPhase = 0;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const W = rect.width;
      const H = rect.height;
      ctx.clearRect(0, 0, W, H);

      const barWidth = W / BAR_COUNT - 2;
      const dataArray = new Uint8Array(BAR_COUNT);

      if (analyserRef.current && micActive) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        // simulated waveform
        simPhase += 0.04;
        for (let i = 0; i < BAR_COUNT; i++) {
          const base = Math.sin(simPhase + i * 0.2) * 0.4 + 0.5;
          const wave2 = Math.sin(simPhase * 1.7 + i * 0.35) * 0.2;
          const wave3 = Math.sin(simPhase * 0.6 + i * 0.1) * 0.15;
          dataArray[i] = Math.max(10, Math.min(255, (base + wave2 + wave3) * 180));
        }
      }

      for (let i = 0; i < BAR_COUNT; i++) {
        const val = dataArray[i] / 255;
        const barH = Math.max(4, val * (H - 8));
        const x = i * (barWidth + 2) + 1;
        const y = H - barH;

        // gradient from cyan to lavender across the bars
        const t = i / (BAR_COUNT - 1);
        const r = Math.round(56 + t * (139 - 56));
        const g = Math.round(201 + t * (110 - 201));
        const b = Math.round(240 + t * (232 - 240));

        ctx.fillStyle = `rgba(${r},${g},${b},${0.6 + val * 0.4})`;
        ctx.beginPath();
        const radius = Math.min(barWidth / 2, 3);
        ctx.moveTo(x, y + barH);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barH);
        ctx.closePath();
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [micActive]);

  // ---------- init mic on mount ----------
  useEffect(() => {
    initMic();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, [initMic]);

  // ---------- metric helpers ----------
  const Metric = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="bg-[#0A1525] rounded-xl px-3 py-2.5 flex flex-col gap-1">
      <span className="text-[#5A7A9B] text-[10px] uppercase tracking-wider leading-none">
        {label}
      </span>
      <div className="text-white font-bold text-sm leading-tight">{children}</div>
    </div>
  );

  const MiniBar = ({ value, max, color }: { value: number; max: number; color: string }) => (
    <div className="h-1.5 w-full bg-[#1A3A5C] rounded-full mt-1 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, (value / max) * 100)}%`, backgroundColor: color }}
      />
    </div>
  );

  return (
    <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-3 sm:p-4 flex flex-col gap-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              micActive ? 'bg-[#00D9A6] animate-pulse' : 'bg-[#FF6B6B]'
            }`}
          />
          <span className="text-[#38C9F0] text-[11px] font-bold uppercase tracking-wider">
            Audio Analysis
          </span>
        </div>
        {micActive && (
          <span className="text-[#5A7A9B] text-[10px] uppercase tracking-wider">Live</span>
        )}
      </div>

      {/* Canvas waveform */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg"
          style={{ height: 120 }}
        />
        {micDenied && !micActive && (
          <button
            onClick={initMic}
            className="absolute inset-0 flex flex-col items-center justify-center bg-[#0D1B2A]/70 rounded-lg cursor-pointer transition-colors hover:bg-[#0D1B2A]/50"
          >
            <svg
              className="w-6 h-6 text-[#5A7A9B] mb-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
              />
            </svg>
            <span className="text-[#5A7A9B] text-xs font-medium">Tap to enable microphone</span>
          </button>
        )}
      </div>

      {/* Emotion + Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Metric label="Detected Tone">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: emotion.color }}
            />
            <span style={{ color: emotion.color }}>{emotion.label}</span>
          </div>
        </Metric>

        <Metric label="Vocal Intensity">
          <span>{audio.vocalIntensity} dB</span>
          <MiniBar value={audio.vocalIntensity} max={100} color="#38C9F0" />
        </Metric>

        <Metric label="Pitch">
          <span>{audio.pitch} Hz</span>
        </Metric>

        <Metric label="Breathing">
          <span>{audio.breathingRate}/min</span>
        </Metric>

        <Metric label="Crying Score">
          <span>{(audio.cryingScore * 100).toFixed(0)}%</span>
          <MiniBar value={audio.cryingScore} max={1} color="#FF6B6B" />
        </Metric>

        <Metric label="Vocal Stimming">
          <span>{(audio.vocalStimScore * 100).toFixed(0)}%</span>
          <MiniBar value={audio.vocalStimScore} max={1} color="#8B6EE8" />
        </Metric>
      </div>
    </div>
  );
}
