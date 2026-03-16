import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { ChildState } from '../types';

/* ─── Constants ─── */

const STATE_COLOR: Record<ChildState, string> = {
  calm: '#38C9F0',
  engaged: '#00D9A6',
  uneasy: '#F0C038',
  confused: '#F0C038',
  frustrated: '#FF6B6B',
  overloaded: '#FF6B6B',
  dysregulated: '#FF4444',
  shutdown_risk: '#8B6EE8',
  sensory_seeking: '#8B6EE8',
};

const VOCAL_TONE_DESC: Record<ChildState, { tone: string; description: string }> = {
  calm: { tone: 'calm', description: 'Voice is quiet and rhythmic, with steady breathing patterns' },
  engaged: { tone: 'engaged', description: 'Vocalisations are animated and expressive, with varied pitch' },
  uneasy: { tone: 'uneasy', description: 'Slight vocal tension detected, with occasional pitch rises' },
  confused: { tone: 'uncertain', description: 'Vocalisations are hesitant, with irregular pacing' },
  frustrated: { tone: 'frustrated', description: 'Vocal intensity is elevated with sharp pitch changes' },
  overloaded: { tone: 'distressed', description: 'High vocal intensity, rapid breathing, and distress vocalisations' },
  dysregulated: { tone: 'highly distressed', description: 'Intense vocalisations with erratic pitch and volume spikes' },
  shutdown_risk: { tone: 'withdrawn', description: 'Very low vocal output, near silence, shallow breathing detected' },
  sensory_seeking: { tone: 'stimming', description: 'Repetitive vocal patterns detected — likely self-regulatory' },
};

const SENSORY_STATE_DESC: Record<ChildState, string> = {
  calm: 'comfortable',
  engaged: 'comfortable',
  uneasy: 'mildly overstimulated',
  confused: 'uncertain',
  frustrated: 'overstimulated',
  overloaded: 'significantly overstimulated',
  dysregulated: 'in sensory crisis',
  shutdown_risk: 'withdrawn from sensory input',
  sensory_seeking: 'seeking input',
};

const ANALYSIS_STEPS = [
  'Processing audio...',
  'Detecting emotional tone...',
  'Analysing speech patterns...',
  'Generating insights...',
];

const PARENT_COACHING_SENTENCES = [
  "Leo, let's take a break. You're doing well.",
  "I can see you're working hard. Let's slow down together.",
  "It's okay. We can try again when you're ready.",
  "You're safe. I'm right here with you.",
  "Let's breathe together. In... and out...",
];

const PARENT_TIPS = [
  { title: 'Lower your pitch slightly', detail: "Leo processes low tones better. A deeper, slower voice helps him feel safe and reduces sensory load." },
  { title: 'Add a 2-second pause between sentences', detail: "Processing time is essential. Pausing gives Leo's brain space to absorb what you've said before the next instruction." },
  { title: "Mirror Leo's volume level rather than talking over it", detail: "Matching his volume shows attunement. If he's quiet, be quiet. It builds trust and co-regulation." },
  { title: 'Humming works better than words during high distress', detail: "When Leo is overwhelmed, words become sensory input. A gentle hum provides connection without overload." },
];

const DAILY_SCORES = [
  { day: 'Mon', score: 7.4 },
  { day: 'Tue', score: 9.1 },
  { day: 'Wed', score: 7.2 },
  { day: 'Thu', score: 8.0 },
  { day: 'Fri', score: 7.6 },
  { day: 'Sat', score: 8.5 },
  { day: 'Sun', score: 8.2 },
];

interface MockLibraryEntry {
  id: string;
  date: string;
  mode: 'leo' | 'parent';
  duration: string;
  finding: string;
  state: ChildState | null;
  calmPercent: number | null;
  badge: string | null;
}

const MOCK_LIBRARY: MockLibraryEntry[] = [
  { id: 'vl-1', date: 'Today 2:15 PM', mode: 'leo', duration: '30s', finding: 'Calm vocalisations — possible requesting pattern', state: 'calm', calmPercent: null, badge: null },
  { id: 'vl-2', date: 'Today 10:30 AM', mode: 'parent', duration: '22s', finding: '85% calm — Good improvement', state: null, calmPercent: 85, badge: null },
  { id: 'vl-3', date: 'Yesterday 4:00 PM', mode: 'leo', duration: '45s', finding: 'Elevated intensity — After-school period', state: 'frustrated', calmPercent: null, badge: null },
  { id: 'vl-4', date: 'Yesterday 9:00 AM', mode: 'parent', duration: '18s', finding: '92% calm', state: null, calmPercent: 92, badge: 'Best this week' },
];

type ActiveTab = 'record' | 'coach' | 'library';
type RecordMode = 'leo' | 'parent';
type Screen = 'recording' | 'analysing' | 'results';

const PARENT_TIMELINE_SEGMENTS = [
  { range: '0–8s', label: 'Calm', color: '#00D9A6' },
  { range: '8–15s', label: 'Slightly rising', color: '#F0C038' },
  { range: '15–25s', label: 'Calm again', color: '#00D9A6' },
  { range: '25–30s', label: 'Warm close', color: '#38C9F0' },
];

/* ─── Component ─── */

interface VoiceAnalysisProps {
  onClose: () => void;
}

export default function VoiceAnalysis({ onClose }: VoiceAnalysisProps) {
  const { currentState, sensorReadings, childProfile, addToast } = useAppStore();
  const childName = childProfile.name;

  /* ─── State ─── */
  const [activeTab, setActiveTab] = useState<ActiveTab>('record');
  const [recordMode, setRecordMode] = useState<RecordMode>('leo');
  const [screen, setScreen] = useState<Screen>('recording');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [micError, setMicError] = useState(false);

  // Coach tab state
  const [coachSentenceIdx, setCoachSentenceIdx] = useState(0);
  const [coachRecording, setCoachRecording] = useState(false);
  const [coachRecordingTime, setCoachRecordingTime] = useState(0);
  const [coachResult, setCoachResult] = useState<{ score: number; breakdown: { pitch: number; pace: number; warmth: number; pauses: number } } | null>(null);

  /* ─── Refs ─── */
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coachTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const coachStreamRef = useRef<MediaStream | null>(null);
  const coachAudioCtxRef = useRef<AudioContext | null>(null);
  const coachAnalyserRef = useRef<AnalyserNode | null>(null);
  const coachCanvasRef = useRef<HTMLCanvasElement>(null);
  const coachAnimFrameRef = useRef<number>(0);

  /* ─── Audio setup ─── */
  const startAudio = useCallback(async () => {
    setMicError(false);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext();
      audioContextRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
    } catch {
      setMicError(true);
    }
  }, []);

  /* ─── Waveform drawing ─── */
  const drawWaveform = useCallback((
    canvas: HTMLCanvasElement | null,
    analyser: AnalyserNode | null,
    isActive: boolean,
  ) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barCount = 64;
    const gap = 2;
    const barWidth = (width - gap * (barCount - 1)) / barCount;

    ctx.clearRect(0, 0, width, height);

    const dataArray = new Uint8Array(barCount);
    if (analyser && isActive) {
      analyser.getByteFrequencyData(dataArray);
    } else {
      // Gentle idle animation
      const time = Date.now() / 1000;
      for (let i = 0; i < barCount; i++) {
        dataArray[i] = Math.floor(15 + 10 * Math.sin(time * 2 + i * 0.3));
      }
    }

    for (let i = 0; i < barCount; i++) {
      const value = dataArray[i] / 255;
      const barHeight = Math.max(4, value * height * 0.85);
      const x = i * (barWidth + gap);
      const y = (height - barHeight) / 2;

      // Cyan to lavender gradient per bar
      const t = i / (barCount - 1);
      const r = Math.round(56 + t * (139 - 56));
      const g = Math.round(201 + t * (110 - 201));
      const b = Math.round(240 + t * (232 - 240));

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, barWidth / 2);
      ctx.fill();
    }
  }, []);

  const animateWaveform = useCallback(() => {
    drawWaveform(canvasRef.current, analyserRef.current, isRecording);
    animFrameRef.current = requestAnimationFrame(animateWaveform);
  }, [drawWaveform, isRecording]);

  /* ─── Start waveform loop when on record tab ─── */
  useEffect(() => {
    if (activeTab === 'record' && screen === 'recording') {
      startAudio();
      animFrameRef.current = requestAnimationFrame(animateWaveform);
    }
    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [activeTab, screen, startAudio, animateWaveform]);

  /* ─── Cleanup on unmount ─── */
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (timerRef.current) clearInterval(timerRef.current);
      if (coachTimerRef.current) clearInterval(coachTimerRef.current);
      if (coachStreamRef.current) coachStreamRef.current.getTracks().forEach(t => t.stop());
      if (coachAudioCtxRef.current) coachAudioCtxRef.current.close();
      cancelAnimationFrame(animFrameRef.current);
      cancelAnimationFrame(coachAnimFrameRef.current);
    };
  }, []);

  /* ─── Recording ─── */
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = () => { /* capture handled by stop */ };
    recorder.onstop = () => {
      setScreen('analysing');
    };
    mediaRecorderRef.current = recorder;
    recorder.start(100);
    setIsRecording(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 59) {
          stopRecording();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  /* ─── Analysis animation ─── */
  useEffect(() => {
    if (screen !== 'analysing') return;
    setAnalysisStep(0);

    const timers: ReturnType<typeof setTimeout>[] = [];
    ANALYSIS_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setAnalysisStep(i + 1);
      }, (i + 1) * 375));
    });
    timers.push(setTimeout(() => {
      setScreen('results');
    }, 1500));

    return () => timers.forEach(clearTimeout);
  }, [screen]);

  /* ─── Record another ─── */
  const recordAnother = useCallback(() => {
    setRecordingTime(0);
    setAnalysisStep(0);
    setScreen('recording');
  }, []);

  /* ─── Coach tab waveform ─── */
  const animateCoachWaveform = useCallback(() => {
    drawWaveform(coachCanvasRef.current, coachAnalyserRef.current, coachRecording);
    coachAnimFrameRef.current = requestAnimationFrame(animateCoachWaveform);
  }, [drawWaveform, coachRecording]);

  useEffect(() => {
    if (activeTab === 'coach') {
      coachAnimFrameRef.current = requestAnimationFrame(animateCoachWaveform);
    }
    return () => {
      cancelAnimationFrame(coachAnimFrameRef.current);
    };
  }, [activeTab, animateCoachWaveform]);

  const startCoachRecording = useCallback(async () => {
    setCoachResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      coachStreamRef.current = stream;
      const ctx = new AudioContext();
      coachAudioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      coachAnalyserRef.current = analyser;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
    } catch {
      return;
    }
    setCoachRecording(true);
    setCoachRecordingTime(0);
    coachTimerRef.current = setInterval(() => {
      setCoachRecordingTime(prev => {
        if (prev >= 14) {
          stopCoachRecording();
          return 15;
        }
        return prev + 1;
      });
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCoachRecording = useCallback(() => {
    setCoachRecording(false);
    if (coachTimerRef.current) {
      clearInterval(coachTimerRef.current);
      coachTimerRef.current = null;
    }
    if (coachStreamRef.current) {
      coachStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (coachAudioCtxRef.current) {
      coachAudioCtxRef.current.close();
      coachAudioCtxRef.current = null;
    }
    coachAnalyserRef.current = null;
    // Simulate result
    setTimeout(() => {
      setCoachResult({
        score: +(7 + Math.random() * 2.5).toFixed(1),
        breakdown: {
          pitch: +(7 + Math.random() * 2.5).toFixed(1),
          pace: +(6.5 + Math.random() * 3).toFixed(1),
          warmth: +(7.5 + Math.random() * 2).toFixed(1),
          pauses: +(6 + Math.random() * 3.5).toFixed(1),
        },
      });
    }, 600);
  }, []);

  /* ─── Helpers ─── */
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const stateColor = STATE_COLOR[currentState.primaryState];
  const toneDesc = VOCAL_TONE_DESC[currentState.primaryState];
  const audio = sensorReadings.audio;

  /* ─── Derived mock data from store ─── */
  const vocalIntensityLabel = audio.vocalIntensity < 30 ? 'Low' : audio.vocalIntensity < 60 ? 'Moderate' : 'High';
  const pitchLabel = audio.pitch < 150 ? 'Low' : audio.pitch < 250 ? 'Normal' : 'High';
  const cryingLabel = audio.cryingScore < 0.1 ? 'Minimal' : audio.cryingScore < 0.4 ? 'Moderate' : 'Elevated';
  const vocalStimDetected = audio.vocalStimScore > 0.15;
  const silencePercent = Math.round(audio.silenceRatio * 100);
  const vocalisationCount = Math.round((1 - audio.silenceRatio) * 45 * 0.5);
  const intentLabel = audio.vocalIntensity < 30 ? 'self-regulating' : audio.vocalIntensity < 50 ? 'requesting' : 'protesting';
  const sensoryStateLabel = SENSORY_STATE_DESC[currentState.primaryState];

  // Parent mode mock
  const parentCalmPercent = 78;
  const parentPrevCalmPercent = 68;

  /* ─── Render: Record tab — Recording screen ─── */
  const renderRecordingScreen = () => (
    <div className="flex flex-col h-full px-4 pt-2">
      {/* Mode toggle */}
      <div className="flex mx-auto bg-[#0D1B2A] rounded-full p-1 mb-4">
        <button
          onClick={() => setRecordMode('leo')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
            recordMode === 'leo' ? 'bg-[#38C9F0] text-[#060E1C]' : 'text-[#5A7A9B]'
          }`}
        >
          Record {childName}
        </button>
        <button
          onClick={() => setRecordMode('parent')}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-colors ${
            recordMode === 'parent' ? 'bg-[#38C9F0] text-[#060E1C]' : 'text-[#5A7A9B]'
          }`}
        >
          Record Myself
        </button>
      </div>

      {/* Waveform Visualisation */}
      <div className="rounded-2xl overflow-hidden bg-[#0D1B2A] border border-[#1A3A5C] mb-6">
        {micError ? (
          <div className="h-[200px] flex flex-col items-center justify-center text-[#5A7A9B] gap-2">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
            </svg>
            <span className="text-sm">Microphone not available</span>
            <span className="text-xs">Grant microphone permissions to record</span>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: 200 }}
          />
        )}
      </div>

      {/* Recording timer */}
      {isRecording && (
        <div className="text-center mb-3">
          <span className="text-white text-3xl font-mono font-bold">{formatTime(recordingTime)}</span>
          <span className="text-[#5A7A9B] text-sm ml-2">/ 01:00</span>
        </div>
      )}

      {/* Recording controls */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-6">
          {isRecording ? (
            <>
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 px-6 py-3 rounded-full active:scale-95 transition-transform"
              >
                <span className="w-4 h-4 rounded-sm bg-red-500" />
                <span className="text-red-400 text-sm font-bold">Stop</span>
              </button>
            </>
          ) : (
            <button
              onClick={startRecording}
              disabled={micError}
              className="w-20 h-20 rounded-full bg-[#FF6B6B] flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-500/30"
              style={isRecording ? { animation: 'pulse-voice-record 1.5s ease-in-out infinite' } : {}}
            >
              <span className="w-8 h-8 rounded-full bg-white" />
            </button>
          )}
        </div>
        {!isRecording && (
          <span className="text-[#5A7A9B] text-xs">Tap to start recording (max 60s)</span>
        )}
      </div>
    </div>
  );

  /* ─── Render: Analysing screen ─── */
  const renderAnalysingScreen = () => (
    <div className="flex flex-col h-full px-4 pt-8">
      <div className="space-y-3">
        <h3 className="text-white font-bold text-lg">Analysing audio...</h3>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-[#0D1B2A] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(analysisStep / ANALYSIS_STEPS.length) * 100}%`,
              background: 'linear-gradient(90deg, #38C9F0, #8B6EE8)',
            }}
          />
        </div>

        {/* Steps list */}
        <div className="space-y-3 mt-4">
          {ANALYSIS_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              {analysisStep > i ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#00D9A6" fillOpacity={0.15} />
                  <path d="M7 12.5L10.5 16L17 9" stroke="#00D9A6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : analysisStep === i ? (
                <span className="w-5 h-5 flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-[#38C9F0] animate-pulse" />
                </span>
              ) : (
                <span className="w-5 h-5 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#1A3A5C]" />
                </span>
              )}
              <span className={`text-sm ${analysisStep > i ? 'text-white/80' : analysisStep === i ? 'text-white' : 'text-[#5A7A9B]'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ─── Render: Leo results ─── */
  const renderLeoResults = () => (
    <div className="px-4 py-4 space-y-4">
      {/* a) Emotional Tone Detected */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
        <h3 className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: stateColor }}>
          Emotional Tone Detected
        </h3>
        <p className="text-white text-sm font-semibold mb-2">
          {childName} sounds {toneDesc.tone}
        </p>
        {/* Confidence bar */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-[#5A7A9B] text-xs w-20">Confidence</span>
          <div className="flex-1 h-2 rounded-full bg-[#060E1C] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${currentState.confidence * 100}%`, backgroundColor: stateColor }}
            />
          </div>
          <span className="text-white text-xs font-mono w-10 text-right">
            {Math.round(currentState.confidence * 100)}%
          </span>
        </div>
        <p className="text-[#C8D4E4] text-xs leading-relaxed">{toneDesc.description}</p>
      </div>

      {/* b) Vocal Pattern Analysis */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
        <h3 className="text-xs font-bold text-[#38C9F0] tracking-wider uppercase mb-3">
          Vocal Pattern Analysis
        </h3>
        <div className="space-y-3">
          {/* Vocal intensity */}
          <div className="flex items-center justify-between">
            <span className="text-[#5A7A9B] text-xs">Vocal intensity</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 rounded-full bg-[#060E1C] overflow-hidden">
                <div className="h-full rounded-full bg-[#38C9F0]" style={{ width: `${Math.min(audio.vocalIntensity, 100)}%` }} />
              </div>
              <span className="text-white text-xs font-medium w-16 text-right">{vocalIntensityLabel}</span>
            </div>
          </div>
          {/* Pitch */}
          <div className="flex items-center justify-between">
            <span className="text-[#5A7A9B] text-xs">Pitch range</span>
            <span className="text-white text-xs font-medium">{pitchLabel} ({audio.pitch} Hz)</span>
          </div>
          {/* Breathing rate */}
          <div className="flex items-center justify-between">
            <span className="text-[#5A7A9B] text-xs">Breathing rate</span>
            <span className="text-white text-xs font-medium">{audio.breathingRate} bpm</span>
          </div>
          {/* Crying score */}
          <div className="flex items-center justify-between">
            <span className="text-[#5A7A9B] text-xs">Crying score</span>
            <span className="text-white text-xs font-medium">{cryingLabel}</span>
          </div>
          {/* Vocal stimming */}
          <div className="flex items-center justify-between">
            <span className="text-[#5A7A9B] text-xs">Vocal stimming detected</span>
            <span className={`text-xs font-medium ${vocalStimDetected ? 'text-[#F0C038]' : 'text-[#00D9A6]'}`}>
              {vocalStimDetected ? 'Yes — repetitive vocal patterns' : 'No'}
            </span>
          </div>
          {/* Silence ratio */}
          <div className="flex items-center justify-between">
            <span className="text-[#5A7A9B] text-xs">Silence ratio</span>
            <span className="text-white text-xs font-medium">{silencePercent}%</span>
          </div>
        </div>
      </div>

      {/* c) Communication Attempts */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
        <h3 className="text-xs font-bold text-[#8B6EE8] tracking-wider uppercase mb-3">
          Communication Attempts
        </h3>
        <p className="text-white text-sm font-semibold mb-1">
          Vocalisations detected: {vocalisationCount} in {recordingTime || 30} seconds
        </p>
        <p className="text-[#C8D4E4] text-xs leading-relaxed mt-2">
          Possible communication intent: <span className="text-white font-medium">{intentLabel}</span>
        </p>
        <p className="text-[#5A7A9B] text-xs mt-1">
          Based on vocal intensity and pattern analysis
        </p>
      </div>

      {/* d) Sensory State Indicator */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
        <h3 className="text-xs font-bold text-[#F0C038] tracking-wider uppercase mb-3">
          Sensory State Indicator
        </h3>
        <p className="text-white text-sm leading-relaxed">
          Vocal patterns suggest {childName} may be <span className="font-semibold" style={{ color: stateColor }}>{sensoryStateLabel}</span>
        </p>
      </div>

      {/* e) Comparison to Baseline */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
        <h3 className="text-xs font-bold text-[#00D9A6] tracking-wider uppercase mb-3">
          Comparison to Baseline
        </h3>
        <p className="text-[#C8D4E4] text-xs mb-3">Compared to {childName}'s usual vocal patterns:</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#5A7A9B] text-xs">Intensity</span>
            <span className="text-[#F0C038] text-xs font-medium">15% above baseline</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#5A7A9B] text-xs">Pitch</span>
            <span className="text-[#00D9A6] text-xs font-medium">Within normal range</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#5A7A9B] text-xs">Pattern match</span>
            <span className="text-white text-xs font-medium">Seen 8 times before</span>
          </div>
        </div>
        <p className="text-[#5A7A9B] text-xs mt-3 leading-relaxed">
          This pattern has been seen 8 times before — usually during transitions.
        </p>
      </div>
    </div>
  );

  /* ─── Render: Parent results ─── */
  const renderParentResults = () => (
    <div className="px-4 py-4 space-y-4">
      {/* a) Your Tone Analysis */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
        <h3 className="text-xs font-bold text-[#38C9F0] tracking-wider uppercase mb-3">
          Your Tone Analysis
        </h3>
        <p className="text-white text-sm font-semibold mb-2">
          Your tone was calm and warm
        </p>
        <p className="text-[#C8D4E4] text-xs mb-3">
          {parentCalmPercent}% of the recording was in the calm range
        </p>
        {/* Calm proportion bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-3 rounded-full bg-[#060E1C] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${parentCalmPercent}%`, background: 'linear-gradient(90deg, #00D9A6, #38C9F0)' }}
            />
          </div>
          <span className="text-white text-xs font-mono">{parentCalmPercent}%</span>
        </div>
      </div>

      {/* b) Micro-Moment Breakdown */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
        <h3 className="text-xs font-bold text-[#8B6EE8] tracking-wider uppercase mb-3">
          Micro-Moment Breakdown
        </h3>
        {/* Timeline bar */}
        <div className="flex rounded-full overflow-hidden h-4 mb-3">
          {PARENT_TIMELINE_SEGMENTS.map((seg, i) => (
            <div
              key={i}
              className="h-full"
              style={{ backgroundColor: seg.color, flex: 1 }}
            />
          ))}
        </div>
        {/* Segment labels */}
        <div className="space-y-1.5">
          {PARENT_TIMELINE_SEGMENTS.map((seg, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
              <span className="text-[#5A7A9B] text-[11px] font-mono w-14">{seg.range}</span>
              <span className="text-white text-xs">{seg.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* c) Tone Coaching Feedback */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
        <h3 className="text-xs font-bold text-[#00D9A6] tracking-wider uppercase mb-3">
          Tone Coaching Feedback
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#F0C038]/15 flex items-center justify-center shrink-0 mt-0.5 text-xs">1</span>
            <p className="text-[#C8D4E4] text-xs leading-relaxed">
              Your pitch rose at the <span className="text-white font-medium">12-second mark</span> — this often happens when repeating instructions. Try <span className="text-[#38C9F0] font-medium">pausing instead of repeating</span>.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#00D9A6]/15 flex items-center justify-center shrink-0 mt-0.5 text-xs">2</span>
            <p className="text-[#C8D4E4] text-xs leading-relaxed">
              Great use of <span className="text-[#00D9A6] font-medium">low, slow tone in the first 8 seconds</span>. {childName} responds best to this register.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#38C9F0]/15 flex items-center justify-center shrink-0 mt-0.5 text-xs">3</span>
            <p className="text-[#C8D4E4] text-xs leading-relaxed">
              Consider adding <span className="text-[#38C9F0] font-medium">more pauses between sentences</span> — it gives {childName} processing time.
            </p>
          </div>
        </div>
      </div>

      {/* d) Impact on Leo */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
        <h3 className="text-xs font-bold text-[#F0C038] tracking-wider uppercase mb-3">
          Impact on {childName}
        </h3>
        <p className="text-[#C8D4E4] text-xs leading-relaxed mb-2">
          When your tone stays in the calm range, {childName}'s stress indicators are <span className="text-[#00D9A6] font-medium">40% lower</span> on average.
        </p>
        <p className="text-[#C8D4E4] text-xs leading-relaxed">
          Your calm-voice percentage has improved from <span className="text-white font-medium">{parentPrevCalmPercent}%</span> to <span className="text-[#00D9A6] font-medium">{parentCalmPercent}%</span> this week — great progress!
        </p>
      </div>

      {/* e) Session Comparison */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
        <h3 className="text-xs font-bold text-[#38C9F0] tracking-wider uppercase mb-3">
          Session Comparison
        </h3>
        <p className="text-[#5A7A9B] text-xs mb-3">This recording vs your average:</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[#C8D4E4] text-xs">Calmer tone</span>
            <span className="text-[#00D9A6] text-xs font-bold flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00D9A6" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
              Improved
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#C8D4E4] text-xs">Fewer pitch spikes</span>
            <span className="text-[#00D9A6] text-xs font-bold flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00D9A6" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
              Fewer
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#C8D4E4] text-xs">More pauses</span>
            <span className="text-[#F0C038] text-xs font-bold flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F0C038" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
              </svg>
              Area to work on
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── Render: Results screen ─── */
  const renderResultsScreen = () => (
    <div className="flex flex-col h-full overflow-y-auto pb-32">
      {recordMode === 'leo' ? renderLeoResults() : renderParentResults()}

      {/* Action buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-[210] bg-gradient-to-t from-[#060E1C] via-[#060E1C] to-transparent pt-6 pb-6 px-4">
        <div className="flex gap-3">
          <button
            onClick={recordAnother}
            className="flex-1 py-3 rounded-xl bg-[#0D1B2A] border border-[#1A3A5C] text-white text-sm font-semibold active:scale-95 transition-transform"
          >
            Record Another
          </button>
          <button
            onClick={() => addToast(`Analysis saved to ${childName}'s timeline`, 'success')}
            className="flex-1 py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #38C9F0, #00D9A6)', color: '#060E1C' }}
          >
            Save to Timeline
          </button>
        </div>
        <button
          onClick={() => addToast('Report ready to share with therapist', 'success')}
          className="w-full mt-2 py-3 rounded-xl bg-[#8B6EE8]/15 border border-[#8B6EE8]/30 text-[#8B6EE8] text-sm font-semibold active:scale-95 transition-transform"
        >
          Share with Therapist
        </button>
      </div>
    </div>
  );

  /* ─── Render: Coach tab ─── */
  const renderCoachTab = () => {
    const weekAvg = (DAILY_SCORES.reduce((sum, d) => sum + d.score, 0) / DAILY_SCORES.length).toFixed(1);
    const bestDay = DAILY_SCORES.reduce((best, d) => d.score > best.score ? d : best, DAILY_SCORES[0]);

    return (
      <div className="flex flex-col h-full overflow-y-auto pb-8 px-4 pt-2">
        {/* 1. Try This Exercise Card */}
        <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4 mb-4">
          <h3 className="text-xs font-bold text-[#38C9F0] tracking-wider uppercase mb-2">
            Try This Exercise
          </h3>
          <p className="text-[#5A7A9B] text-xs mb-3">
            Read this sentence to {childName} in a calm, low voice:
          </p>
          <div className="bg-[#060E1C] rounded-xl p-4 mb-4">
            <p className="text-white text-lg font-medium text-center leading-relaxed">
              "{PARENT_COACHING_SENTENCES[coachSentenceIdx]}"
            </p>
          </div>
          <button
            onClick={() => setCoachSentenceIdx((coachSentenceIdx + 1) % PARENT_COACHING_SENTENCES.length)}
            className="text-[#38C9F0] text-xs font-medium mb-4 active:opacity-70"
          >
            Try a different sentence
          </button>

          {/* Waveform */}
          <div className="rounded-xl overflow-hidden bg-[#060E1C] mb-3">
            <canvas
              ref={coachCanvasRef}
              className="w-full"
              style={{ height: 100 }}
            />
          </div>

          {/* Record/stop button */}
          <div className="flex flex-col items-center gap-2">
            {coachRecording ? (
              <>
                <span className="text-white text-sm font-mono">{formatTime(coachRecordingTime)}</span>
                <button
                  onClick={stopCoachRecording}
                  className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 px-5 py-2 rounded-full active:scale-95 transition-transform"
                >
                  <span className="w-3 h-3 rounded-sm bg-red-500" />
                  <span className="text-red-400 text-sm font-bold">Stop</span>
                </button>
              </>
            ) : (
              <button
                onClick={startCoachRecording}
                className="w-14 h-14 rounded-full bg-[#FF6B6B] flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-red-500/30"
              >
                <span className="w-5 h-5 rounded-full bg-white" />
              </button>
            )}
          </div>

          {/* Coach result */}
          {coachResult && (
            <div className="mt-4 bg-[#060E1C] rounded-xl p-4">
              <div className="text-center mb-3">
                <span className="text-3xl font-bold text-white">{coachResult.score}</span>
                <span className="text-[#5A7A9B] text-lg"> / 10</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ['Pitch', coachResult.breakdown.pitch],
                    ['Pace', coachResult.breakdown.pace],
                    ['Warmth', coachResult.breakdown.warmth],
                    ['Pauses', coachResult.breakdown.pauses],
                  ] as const
                ).map(([label, val]) => (
                  <div key={label} className="flex items-center justify-between bg-[#0D1B2A] rounded-lg px-3 py-2">
                    <span className="text-[#5A7A9B] text-xs">{label}</span>
                    <span className="text-white text-xs font-bold">{val}</span>
                  </div>
                ))}
              </div>
              {coachResult.score >= 8 ? (
                <p className="text-[#00D9A6] text-xs text-center mt-3">Wonderful — that was a beautifully calm delivery!</p>
              ) : coachResult.score >= 6.5 ? (
                <p className="text-[#38C9F0] text-xs text-center mt-3">Good effort! Try slowing down a little more and lowering your pitch.</p>
              ) : (
                <p className="text-[#F0C038] text-xs text-center mt-3">Keep practising! Focus on a slow, low voice with pauses between phrases.</p>
              )}
            </div>
          )}
        </div>

        {/* 2. Daily Tone Score */}
        <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4 mb-4">
          <h3 className="text-xs font-bold text-[#00D9A6] tracking-wider uppercase mb-3">
            Daily Tone Score
          </h3>
          <div className="text-center mb-4">
            <span className="text-4xl font-bold text-white">8.2</span>
            <span className="text-[#5A7A9B] text-lg"> / 10</span>
            <p className="text-[#5A7A9B] text-xs mt-1">Today</p>
          </div>
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-[#5A7A9B]">Your best: <span className="text-[#00D9A6] font-bold">{bestDay.score} ({bestDay.day})</span></span>
            <span className="text-[#5A7A9B]">Week avg: <span className="text-white font-bold">{weekAvg}</span></span>
          </div>
          {/* Bar chart */}
          <div className="flex items-end justify-between gap-1 h-20">
            {DAILY_SCORES.map((d, i) => {
              const height = (d.score / 10) * 100;
              const isToday = i === DAILY_SCORES.length - 1;
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-white font-mono">{d.score}</span>
                  <div className="w-full rounded-t-md" style={{
                    height: `${height}%`,
                    background: isToday ? 'linear-gradient(180deg, #38C9F0, #00D9A6)' : '#1A3A5C',
                  }} />
                  <span className={`text-[10px] ${isToday ? 'text-[#38C9F0] font-bold' : 'text-[#5A7A9B]'}`}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. Tips Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#F0C038] tracking-wider uppercase">
            Voice Coaching Tips
          </h3>
          {PARENT_TIPS.map((tip, i) => (
            <div key={i} className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-[#F0C038]/15 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#F0C038" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </span>
                <div>
                  <p className="text-white text-sm font-semibold">{tip.title}</p>
                  <p className="text-[#5A7A9B] text-xs mt-1 leading-relaxed">{tip.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  /* ─── Render: Library tab ─── */
  const renderLibraryTab = () => (
    <div className="flex flex-col h-full overflow-y-auto pb-8 px-4 pt-2">
      <div className="space-y-3">
        {MOCK_LIBRARY.map((entry) => {
          const indicatorColor = entry.mode === 'leo'
            ? (entry.state ? STATE_COLOR[entry.state] : '#38C9F0')
            : (entry.calmPercent && entry.calmPercent >= 85 ? '#00D9A6' : '#38C9F0');

          return (
            <div
              key={entry.id}
              className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                {/* Colored indicator */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: indicatorColor + '20' }}>
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke={indicatorColor} strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[#5A7A9B] text-[11px] mb-1">
                    <span>{entry.date}</span>
                    <span>·</span>
                    <span className={`font-semibold ${entry.mode === 'leo' ? 'text-[#38C9F0]' : 'text-[#8B6EE8]'}`}>
                      {entry.mode === 'leo' ? childName : 'Parent'}
                    </span>
                    <span>·</span>
                    <span>{entry.duration}</span>
                  </div>
                  <p className="text-white text-sm font-medium mb-0.5">{entry.finding}</p>
                  {entry.badge && (
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00D9A6]/15 text-[#00D9A6] mt-1">
                      {entry.badge}
                    </span>
                  )}
                </div>
                <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-2" style={{ backgroundColor: indicatorColor }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ─── Main Render ─── */
  const showTabs = screen !== 'analysing';

  return (
    <div className="fixed inset-0 z-[200] bg-[#060E1C] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h1 className="text-white text-lg font-bold">Voice Analysis</h1>
          {activeTab === 'record' && screen === 'recording' && (
            <p className="text-[#5A7A9B] text-xs mt-0.5">Record a conversation to analyse</p>
          )}
          {activeTab === 'record' && screen === 'analysing' && (
            <p className="text-[#38C9F0] text-xs mt-0.5">Processing audio clip...</p>
          )}
          {activeTab === 'record' && screen === 'results' && (
            <p className="text-[#00D9A6] text-xs mt-0.5">Analysis complete</p>
          )}
          {activeTab === 'coach' && (
            <p className="text-[#5A7A9B] text-xs mt-0.5">Practice your calm voice</p>
          )}
          {activeTab === 'library' && (
            <p className="text-[#5A7A9B] text-xs mt-0.5">Saved voice analyses</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#0D1B2A] flex items-center justify-center active:scale-90 transition-transform"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      {showTabs && (
        <div className="flex mx-4 mb-2 bg-[#0D1B2A] rounded-xl p-1">
          {(['record', 'coach', 'library'] as const).map((tab) => {
            const labels: Record<ActiveTab, string> = { record: 'Record', coach: 'Parent Coach', library: 'Library' };
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  if (tab === 'record' && screen !== 'results') {
                    setScreen('recording');
                  }
                }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === tab
                    ? 'bg-[#38C9F0] text-[#060E1C]'
                    : 'text-[#5A7A9B]'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'record' && screen === 'recording' && renderRecordingScreen()}
        {activeTab === 'record' && screen === 'analysing' && renderAnalysingScreen()}
        {activeTab === 'record' && screen === 'results' && renderResultsScreen()}
        {activeTab === 'coach' && renderCoachTab()}
        {activeTab === 'library' && renderLibraryTab()}
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse-voice-record {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.5); }
          50% { box-shadow: 0 0 0 14px rgba(255, 107, 107, 0); }
        }
      `}</style>
    </div>
  );
}
