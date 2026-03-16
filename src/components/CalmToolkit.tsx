import { useState, useEffect, useCallback, useRef } from 'react';

type ToolId = 'breathing' | 'timer' | 'sounds' | 'choices' | 'fidget' | 'feelings';

interface Ripple {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface CalmToolkitProps {
  onClose: () => void;
}

// ─── Breathing Exercise (fullscreen) ────────────────────────────────────────
function BreathingExercise({ fullscreen }: { fullscreen: boolean }) {
  const [phase, setPhase] = useState<'in' | 'hold' | 'out'>('in');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 100;
        // 4s breathe in, 2s hold, 4s breathe out = 10s total cycle
        const cycleMs = next % 10000;
        if (cycleMs < 4000) setPhase('in');
        else if (cycleMs < 6000) setPhase('hold');
        else setPhase('out');
        return next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const cycleMs = elapsed % 10000;
  // Scale: breathe in 1->1.6, hold 1.6, breathe out 1.6->1
  let scale = 1;
  if (cycleMs < 4000) {
    scale = 1 + 0.6 * (cycleMs / 4000);
  } else if (cycleMs < 6000) {
    scale = 1.6;
  } else {
    scale = 1.6 - 0.6 * ((cycleMs - 6000) / 4000);
  }

  const label = phase === 'in' ? 'Breathe in...' : phase === 'hold' ? 'Hold...' : 'Breathe out...';

  return (
    <div
      className={`flex flex-col items-center justify-center ${fullscreen ? 'h-full' : 'h-full min-h-[180px]'}`}
      style={{ background: fullscreen ? 'linear-gradient(135deg, #0A2E2E, #0D3B3B, #0A2E2E)' : 'transparent' }}
    >
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: fullscreen ? 200 : 100,
          height: fullscreen ? 200 : 100,
          transform: `scale(${scale})`,
          transition: 'transform 0.1s linear',
          backgroundColor: '#00D9A6',
          boxShadow: '0 0 40px rgba(0, 217, 166, 0.4), 0 0 80px rgba(0, 217, 166, 0.2)',
        }}
      />
      <p
        className={`mt-8 font-medium text-white/90 ${fullscreen ? 'text-2xl' : 'text-base'}`}
      >
        {label}
      </p>
    </div>
  );
}

// ─── Visual Timer (fullscreen) ──────────────────────────────────────────────
function VisualTimer({ fullscreen }: { fullscreen: boolean }) {
  const [duration, setDuration] = useState(60); // seconds
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    if (!running || remaining <= 0) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false);
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, remaining]);

  const selectDuration = (secs: number) => {
    setDuration(secs);
    setRemaining(secs);
    setRunning(false);
    setFinished(false);
  };

  const toggleRunning = () => {
    if (finished) {
      setRemaining(duration);
      setFinished(false);
      setRunning(true);
    } else {
      setRunning(!running);
    }
  };

  const progress = duration > 0 ? remaining / duration : 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const radius = fullscreen ? 90 : 52;
  const stroke = fullscreen ? 8 : 5;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const durations = [
    { label: '1m', secs: 60 },
    { label: '2m', secs: 120 },
    { label: '3m', secs: 180 },
    { label: '5m', secs: 300 },
  ];

  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <p className={`font-bold text-white ${fullscreen ? 'text-4xl' : 'text-2xl'}`}>
          All done! ⭐
        </p>
        <button
          onClick={() => { setRemaining(duration); setFinished(false); }}
          className="px-6 py-2 rounded-xl bg-[#00D9A6]/20 text-[#00D9A6] text-sm font-medium"
        >
          Reset
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="relative" onClick={toggleRunning} style={{ cursor: 'pointer' }}>
        <svg
          width={(radius + stroke) * 2}
          height={(radius + stroke) * 2}
          className="transform -rotate-90"
        >
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke="#1A3A5C"
            strokeWidth={stroke}
          />
          <circle
            cx={radius + stroke}
            cy={radius + stroke}
            r={radius}
            fill="none"
            stroke="#22D3EE"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.3s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold text-white tabular-nums ${fullscreen ? 'text-4xl' : 'text-2xl'}`}>
            {minutes}:{seconds.toString().padStart(2, '0')}
          </span>
          <span className="text-xs text-white/40 mt-1">
            {running ? 'tap to pause' : 'tap to start'}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        {durations.map((d) => (
          <button
            key={d.secs}
            onClick={() => selectDuration(d.secs)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              duration === d.secs
                ? 'bg-[#22D3EE]/20 text-[#22D3EE]'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Calm Sounds ────────────────────────────────────────────────────────────
const SOUNDS = [
  { id: 'ocean', emoji: '\u{1F30A}', label: 'Ocean waves' },
  { id: 'rain', emoji: '\u{1F327}\uFE0F', label: 'Rain' },
  { id: 'music', emoji: '\u{1F3B5}', label: 'Soft music' },
  { id: 'whitenoise', emoji: '\u{1F32C}\uFE0F', label: 'White noise' },
  { id: 'nature', emoji: '\u{1F426}', label: 'Nature' },
  { id: 'silence', emoji: '\u{1F507}', label: 'Silence' },
] as const;

function CalmSounds({ fullscreen }: { fullscreen: boolean }) {
  const [playing, setPlaying] = useState<string | null>(null);
  const [eqBars, setEqBars] = useState([0.3, 0.5, 0.7, 0.4, 0.6]);

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setEqBars(Array.from({ length: 5 }, () => 0.2 + Math.random() * 0.8));
    }, 200);
    return () => clearInterval(interval);
  }, [playing]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-2">
      {playing && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-end gap-0.5 h-6">
            {eqBars.map((h, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-[#00D9A6]"
                style={{ height: `${h * 24}px`, transition: 'height 0.15s ease' }}
              />
            ))}
          </div>
          <span className={`text-[#00D9A6] font-medium ${fullscreen ? 'text-base' : 'text-xs'}`}>
            Playing: {SOUNDS.find((s) => s.id === playing)?.label}
          </span>
        </div>
      )}
      <div className={`grid grid-cols-3 gap-2 w-full ${fullscreen ? 'max-w-sm' : ''}`}>
        {SOUNDS.map((sound) => (
          <button
            key={sound.id}
            onClick={() => setPlaying(playing === sound.id ? null : sound.id)}
            className={`flex flex-col items-center justify-center rounded-2xl p-3 transition-all ${
              playing === sound.id
                ? 'bg-[#00D9A6]/15 border border-[#00D9A6]/40 scale-105'
                : 'bg-white/5 border border-white/5 hover:bg-white/10'
            }`}
          >
            <span className={fullscreen ? 'text-3xl' : 'text-2xl'}>{sound.emoji}</span>
            <span className={`mt-1 text-white/70 ${fullscreen ? 'text-sm' : 'text-[10px]'}`}>
              {sound.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Visual Choice Cards ────────────────────────────────────────────────────
function VisualChoices({ fullscreen }: { fullscreen: boolean }) {
  const [chosen, setChosen] = useState<string | null>(null);

  if (chosen) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-20 h-20 rounded-full bg-[#00D9A6]/20 flex items-center justify-center">
          <span className="text-4xl text-[#00D9A6]">✓</span>
        </div>
        <p className={`text-white font-semibold ${fullscreen ? 'text-2xl' : 'text-lg'}`}>
          Leo chose: {chosen}
        </p>
        <button
          onClick={() => setChosen(null)}
          className="px-5 py-2 rounded-xl bg-white/5 text-white/50 text-sm"
        >
          Show again
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full gap-4 px-4">
      <button
        onClick={() => setChosen('Break')}
        className={`flex-1 flex flex-col items-center justify-center rounded-3xl border-2 border-blue-400/30 bg-blue-500/10 hover:bg-blue-500/20 transition-colors ${
          fullscreen ? 'py-16' : 'py-8'
        }`}
      >
        <span className={fullscreen ? 'text-5xl' : 'text-3xl'}>⏸</span>
        <span className={`mt-3 font-bold text-blue-300 ${fullscreen ? 'text-3xl' : 'text-xl'}`}>
          Break
        </span>
      </button>
      <button
        onClick={() => setChosen('More')}
        className={`flex-1 flex flex-col items-center justify-center rounded-3xl border-2 border-green-400/30 bg-green-500/10 hover:bg-green-500/20 transition-colors ${
          fullscreen ? 'py-16' : 'py-8'
        }`}
      >
        <span className={fullscreen ? 'text-5xl' : 'text-3xl'}>➕</span>
        <span className={`mt-3 font-bold text-green-300 ${fullscreen ? 'text-3xl' : 'text-xl'}`}>
          More
        </span>
      </button>
    </div>
  );
}

// ─── Sensory Fidget ─────────────────────────────────────────────────────────
const RIPPLE_COLORS = ['#00D9A6', '#22D3EE', '#A78BFA', '#F472B6', '#FBBF24', '#34D399'];

function SensoryFidget({ fullscreen }: { fullscreen: boolean }) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const addRipple = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const color = RIPPLE_COLORS[Math.floor(Math.random() * RIPPLE_COLORS.length)];
    const id = nextId.current++;
    setRipples((prev) => [...prev, { id, x, y, color }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 1000);
  }, []);

  const handlePointer = useCallback(
    (e: React.PointerEvent | React.TouchEvent) => {
      e.preventDefault();
      if ('touches' in e) {
        for (let i = 0; i < e.touches.length; i++) {
          addRipple(e.touches[i].clientX, e.touches[i].clientY);
        }
      } else {
        addRipple(e.clientX, e.clientY);
      }
    },
    [addRipple]
  );

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointer}
      onTouchStart={handlePointer}
      onPointerMove={(e) => { if (e.buttons > 0) handlePointer(e); }}
      className="relative w-full h-full overflow-hidden cursor-pointer select-none"
      style={{
        background: fullscreen
          ? 'radial-gradient(circle at 50% 50%, #0D1B2A, #060E1C)'
          : 'transparent',
        minHeight: fullscreen ? '100%' : 180,
        touchAction: 'none',
      }}
    >
      {ripples.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-white/20 text-sm">Touch anywhere</p>
        </div>
      )}
      {ripples.map((r) => (
        <div
          key={r.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: r.x,
            top: r.y,
            width: 20,
            height: 20,
            marginLeft: -10,
            marginTop: -10,
            backgroundColor: r.color,
            opacity: 0,
            transform: 'scale(0)',
            animation: 'ripple-expand 1s ease-out forwards',
          }}
        />
      ))}
      <style>{`
        @keyframes ripple-expand {
          0% { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Feelings Cards ─────────────────────────────────────────────────────────
const FEELINGS = [
  { id: 'happy', emoji: '\u{1F60A}', label: 'Happy', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
  { id: 'sad', emoji: '\u{1F622}', label: 'Sad', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)' },
  { id: 'angry', emoji: '\u{1F620}', label: 'Angry', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
  { id: 'scared', emoji: '\u{1F630}', label: 'Scared', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
] as const;

function FeelingsCards({ fullscreen }: { fullscreen: boolean }) {
  const [selected, setSelected] = useState<string | null>(null);

  if (selected) {
    const feeling = FEELINGS.find((f) => f.id === selected)!;
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <span className={fullscreen ? 'text-7xl' : 'text-5xl'}>{feeling.emoji}</span>
        <p className={`font-bold ${fullscreen ? 'text-3xl' : 'text-xl'}`} style={{ color: feeling.color }}>
          {feeling.label}
        </p>
        <p className="text-white/40 text-sm">Leo is feeling {feeling.label.toLowerCase()}</p>
        <button
          onClick={() => setSelected(null)}
          className="px-5 py-2 rounded-xl bg-white/5 text-white/50 text-sm mt-2"
        >
          Show again
        </button>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 gap-3 h-full items-center px-3 ${fullscreen ? 'max-w-md mx-auto py-8' : 'py-2'}`}>
      {FEELINGS.map((f) => (
        <button
          key={f.id}
          onClick={() => setSelected(f.id)}
          className={`flex flex-col items-center justify-center rounded-3xl border-2 transition-transform hover:scale-105 ${
            fullscreen ? 'py-10' : 'py-5'
          }`}
          style={{ backgroundColor: f.bg, borderColor: f.border }}
        >
          <span className={fullscreen ? 'text-5xl' : 'text-3xl'}>{f.emoji}</span>
          <span
            className={`mt-2 font-bold ${fullscreen ? 'text-2xl' : 'text-base'}`}
            style={{ color: f.color }}
          >
            {f.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Tool definitions ───────────────────────────────────────────────────────
interface ToolDef {
  id: ToolId;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
}

const TOOLS: ToolDef[] = [
  { id: 'breathing', title: 'Breathing', subtitle: 'Calm breaths', emoji: '\u{1F4A8}', gradient: 'linear-gradient(135deg, #0A2E2E, #0D3B3B)' },
  { id: 'timer', title: 'Timer', subtitle: 'Visual countdown', emoji: '\u23F3', gradient: 'linear-gradient(135deg, #0A1E3D, #0D2A4A)' },
  { id: 'sounds', title: 'Sounds', subtitle: 'Calm sounds', emoji: '\u{1F3B6}', gradient: 'linear-gradient(135deg, #1A0A2E, #2D0D3B)' },
  { id: 'choices', title: 'Choices', subtitle: 'Pick one', emoji: '\u{1F449}', gradient: 'linear-gradient(135deg, #0A2E1A, #0D3B24)' },
  { id: 'fidget', title: 'Fidget', subtitle: 'Touch & play', emoji: '\u{1F7E3}', gradient: 'linear-gradient(135deg, #2E0A1A, #3B0D24)' },
  { id: 'feelings', title: 'Feelings', subtitle: 'How I feel', emoji: '\u{1F49B}', gradient: 'linear-gradient(135deg, #2E2E0A, #3B380D)' },
];

// ─── Main Component ─────────────────────────────────────────────────────────
export default function CalmToolkit({ onClose }: CalmToolkitProps) {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  const renderTool = (id: ToolId, fullscreen: boolean) => {
    switch (id) {
      case 'breathing':
        return <BreathingExercise fullscreen={fullscreen} />;
      case 'timer':
        return <VisualTimer fullscreen={fullscreen} />;
      case 'sounds':
        return <CalmSounds fullscreen={fullscreen} />;
      case 'choices':
        return <VisualChoices fullscreen={fullscreen} />;
      case 'fidget':
        return <SensoryFidget fullscreen={fullscreen} />;
      case 'feelings':
        return <FeelingsCards fullscreen={fullscreen} />;
    }
  };

  // ─── Fullscreen tool view ───────────────────────────────────────────────
  if (activeTool) {
    const tool = TOOLS.find((t) => t.id === activeTool)!;
    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col"
        style={{ background: '#060E1C' }}
      >
        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={() => setActiveTool(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/50 text-sm backdrop-blur-sm hover:bg-white/10 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        </div>

        {/* Tool title */}
        <div className="absolute top-4 right-4 z-10">
          <span className="text-white/20 text-sm">{tool.emoji} {tool.title}</span>
        </div>

        {/* Tool content */}
        <div className="flex-1">
          {renderTool(activeTool, true)}
        </div>
      </div>
    );
  }

  // ─── Grid view ──────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col overflow-y-auto"
      style={{ background: '#060E1C' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Calm Toolkit</h1>
          <p className="text-sm text-white/40 mt-0.5">Show this screen to Leo</p>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white/50 hover:bg-white/10 transition-colors shrink-0"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 px-4 pb-8 pt-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className="flex flex-col items-center justify-center rounded-3xl border border-[#1A3A5C] p-5 min-h-[160px] transition-transform hover:scale-[1.03] active:scale-[0.97]"
            style={{ background: tool.gradient }}
          >
            <span className="text-4xl mb-3">{tool.emoji}</span>
            <span className="text-white font-semibold text-base">{tool.title}</span>
            <span className="text-white/40 text-xs mt-0.5">{tool.subtitle}</span>

            {/* Mini preview for breathing */}
            {tool.id === 'breathing' && (
              <div
                className="w-6 h-6 rounded-full mt-3"
                style={{
                  backgroundColor: '#00D9A6',
                  boxShadow: '0 0 12px rgba(0,217,166,0.4)',
                  animation: 'breathe-mini 4s ease-in-out infinite',
                }}
              />
            )}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes breathe-mini {
          0%, 100% { transform: scale(0.8); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
