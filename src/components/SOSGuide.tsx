import { useState, useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { ChildState } from '../types';

interface SOSGuideProps {
  onClose: () => void;
}

interface Step {
  instruction: string;
  explanation: string;
}

const stateSteps: Record<string, Step[]> = {
  frustrated: [
    { instruction: 'Stop all demands', explanation: "Remove the current task. Leo can't process right now." },
    { instruction: 'Reduce noise and light', explanation: 'Turn off TV, dim lights, close curtains if possible.' },
    { instruction: 'Give space', explanation: "Step back 1\u20132 metres. Stay visible but don't crowd." },
    { instruction: 'Offer ear defenders', explanation: "Place them nearby. Don't force them on." },
    { instruction: 'Wait quietly', explanation: "Don't talk. Your calm presence is enough." },
    { instruction: 'Watch for first signs of calm', explanation: 'Breathing slows, body softens, eye contact returns.' },
    { instruction: 'Offer weighted blanket', explanation: 'When Leo seems ready. Let him choose.' },
    { instruction: 'Gentle re-engagement', explanation: "Use a familiar sign or visual card. Don't rush." },
  ],
  overloaded: [
    { instruction: 'Stop all demands', explanation: "Remove the current task. Leo can't process right now." },
    { instruction: 'Reduce noise and light', explanation: 'Turn off TV, dim lights, close curtains if possible.' },
    { instruction: 'Give space', explanation: "Step back 1\u20132 metres. Stay visible but don't crowd." },
    { instruction: 'Offer ear defenders', explanation: "Place them nearby. Don't force them on." },
    { instruction: 'Wait quietly', explanation: "Don't talk. Your calm presence is enough." },
    { instruction: 'Watch for first signs of calm', explanation: 'Breathing slows, body softens, eye contact returns.' },
    { instruction: 'Offer weighted blanket', explanation: 'When Leo seems ready. Let him choose.' },
    { instruction: 'Gentle re-engagement', explanation: "Use a familiar sign or visual card. Don't rush." },
  ],
  dysregulated: [
    { instruction: 'Ensure safety first', explanation: 'Clear the area of anything that could cause harm.' },
    { instruction: "Don't intervene yet", explanation: 'During active meltdown, most actions make it worse.' },
    { instruction: 'Be present, be calm', explanation: 'Sit nearby. Breathe slowly. Leo feels your energy.' },
    { instruction: 'Protect without restraining', explanation: 'Guide away from danger without holding.' },
    { instruction: 'Wait for the peak to pass', explanation: 'Meltdowns have a curve. This will pass.' },
    { instruction: "First calm sign \u2192 weighted blanket nearby", explanation: "Don't put on him. Place it within reach." },
    { instruction: 'Low, slow voice or humming', explanation: 'When breathing slows, try a familiar tune.' },
    { instruction: 'No questions, no discussion', explanation: 'Just comfort. Processing comes later.' },
  ],
  shutdown_risk: [
    { instruction: 'Reduce ALL input', explanation: 'Silence, dim, stillness. The nervous system is protecting itself.' },
    { instruction: "Don't force interaction", explanation: 'Shutdown is not ignoring you. It\u2019s involuntary.' },
    { instruction: 'Create a safe cocoon', explanation: 'Favourite blanket, dim room, familiar smells.' },
    { instruction: 'Be patient', explanation: "Recovery can take minutes to hours. There's no rushing it." },
    { instruction: 'Offer water', explanation: "Place it nearby when there's movement." },
    { instruction: 'Wait for Leo to re-engage', explanation: "He'll come back when he's ready." },
  ],
};

const mildSteps: Step[] = [
  { instruction: "You're doing great", explanation: 'Leo is managing well right now.' },
  { instruction: 'Maintain the current environment', explanation: "What's working is working." },
  { instruction: 'Watch for early signs', explanation: 'Subtle changes in voice, movement, or eye contact.' },
  { instruction: 'Have calming tools ready', explanation: 'Ear defenders, blanket, fidget toy within reach.' },
];

const mildStates: ChildState[] = ['calm', 'engaged', 'uneasy', 'confused', 'sensory_seeking'];

const stateLabels: Record<ChildState, string> = {
  calm: 'calm',
  engaged: 'engaged',
  uneasy: 'feeling uneasy',
  confused: 'confused',
  frustrated: 'frustrated',
  overloaded: 'sensory overloaded',
  dysregulated: 'dysregulated',
  shutdown_risk: 'at risk of shutdown',
  sensory_seeking: 'sensory seeking',
};

const stateColors: Record<ChildState, string> = {
  calm: '#00D9A6',
  engaged: '#00D9A6',
  uneasy: '#FFB800',
  confused: '#FFB800',
  frustrated: '#FF6B35',
  overloaded: '#FF6B35',
  dysregulated: '#FF3B5C',
  shutdown_risk: '#C850C0',
  sensory_seeking: '#FFB800',
};

function getStepsForState(state: ChildState): Step[] {
  if (mildStates.includes(state)) return mildSteps;
  return stateSteps[state] || mildSteps;
}

function formatTimer(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min} min ${sec.toString().padStart(2, '0')} sec`;
}

export default function SOSGuide({ onClose }: SOSGuideProps) {
  const { currentState, childProfile, addEventLog } = useAppStore();
  const steps = getStepsForState(currentState.primaryState);

  const [completedSteps, setCompletedSteps] = useState<boolean[]>(() =>
    new Array(steps.length).fill(false)
  );
  const [activeStrategies, setActiveStrategies] = useState<Set<string>>(new Set());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showResolvePanel, setShowResolvePanel] = useState(false);
  const startTimeRef = useRef(Date.now());

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset completed steps when state changes
  useEffect(() => {
    setCompletedSteps(new Array(steps.length).fill(false));
  }, [currentState.primaryState, steps.length]);

  const toggleStep = useCallback((index: number) => {
    setCompletedSteps(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const toggleStrategy = useCallback((strategy: string) => {
    setActiveStrategies(prev => {
      const next = new Set(prev);
      if (next.has(strategy)) {
        next.delete(strategy);
      } else {
        next.add(strategy);
      }
      return next;
    });
  }, []);

  const handleResolve = useCallback((whatHelped: string) => {
    addEventLog({
      id: `sos-${Date.now()}`,
      timestamp: startTimeRef.current,
      type: currentState.primaryState === 'dysregulated' ? 'meltdown'
        : currentState.primaryState === 'shutdown_risk' ? 'shutdown'
        : currentState.primaryState === 'overloaded' ? 'sensory_overload'
        : currentState.primaryState === 'frustrated' ? 'frustration'
        : 'other',
      intervention: whatHelped || Array.from(activeStrategies).join(', ') || undefined,
      outcome: 'helped',
      duration: Math.floor((Date.now() - startTimeRef.current) / 60000),
      stateAtTime: currentState,
      notes: `SOS Guide used. Steps completed: ${completedSteps.filter(Boolean).length}/${steps.length}`,
    });
    onClose();
  }, [addEventLog, currentState, activeStrategies, completedSteps, steps.length, onClose]);

  const resolveOptions = [
    'Weighted blanket',
    'Ear defenders',
    'Quiet room',
    'Deep pressure',
    'Music',
    'Waited it out',
    'Movement break',
    'Other',
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#060E1C' }}>
      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(0.8); opacity: 0.4; }
          50% { transform: scale(1.3); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <div
        className="flex-shrink-0 relative px-6 pt-6 pb-8"
        style={{
          background: 'linear-gradient(180deg, #0A1628 0%, #060E1C 100%)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 4L14 14M14 4L4 14" stroke="#8896A8" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Timer */}
        <div className="absolute top-4 left-6 text-xs font-mono" style={{ color: '#6B7D94' }}>
          {formatTimer(elapsedSeconds)}
        </div>

        {/* Breathing circle */}
        <div className="mt-6 mb-4">
          <div
            className="w-20 h-20 rounded-full mx-auto"
            style={{
              background: 'radial-gradient(circle, rgba(0,217,166,0.3), transparent)',
              animation: 'breathe 4s ease-in-out infinite',
            }}
          />
        </div>

        {/* Calming message */}
        <h1
          className="text-center text-2xl font-semibold tracking-tight"
          style={{ color: '#E8EDF3' }}
        >
          Take a breath. You've got this.
        </h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-40">
        {/* State banner */}
        <div
          className="mx-2 mb-6 px-5 py-4 rounded-2xl border"
          style={{
            background: '#0D1B2A',
            borderColor: '#1A3A5C',
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-base font-medium" style={{ color: '#E8EDF3' }}>
              {childProfile.name} may be{' '}
              <span style={{ color: stateColors[currentState.primaryState] }}>
                {stateLabels[currentState.primaryState]}
              </span>
            </p>
            <span
              className="text-xs px-2 py-1 rounded-full"
              style={{
                color: '#8896A8',
                background: 'rgba(255,255,255,0.05)',
              }}
            >
              {currentState.confidenceLevel}
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3 mx-2">
          {steps.map((step, i) => {
            const done = completedSteps[i];
            return (
              <button
                key={`${currentState.primaryState}-${i}`}
                onClick={() => toggleStep(i)}
                className="w-full text-left px-5 py-4 rounded-2xl border transition-all duration-300"
                style={{
                  background: '#0D1B2A',
                  borderColor: done ? '#00D9A6' : '#1A3A5C',
                  opacity: done ? 0.6 : 1,
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Step number or checkmark */}
                  <div className="flex-shrink-0 mt-0.5">
                    {done ? (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,217,166,0.15)' }}
                      >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                          <path
                            d="M4 9.5L7.5 13L14 5"
                            stroke="#00D9A6"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold"
                        style={{
                          background: 'linear-gradient(135deg, rgba(0,217,166,0.12), rgba(168,130,255,0.12))',
                          backgroundClip: 'padding-box',
                        }}
                      >
                        <span
                          style={{
                            background: 'linear-gradient(135deg, #00D9A6, #A882FF)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          {i + 1}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Step content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-base font-semibold leading-snug"
                      style={{
                        color: done ? '#6B7D94' : '#FFFFFF',
                        textDecoration: done ? 'line-through' : 'none',
                      }}
                    >
                      {step.instruction}
                    </p>
                    <p
                      className="text-sm mt-1 leading-relaxed"
                      style={{ color: done ? '#4A5B6E' : '#C8D4E4' }}
                    >
                      {step.explanation}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* "What's helping" strategies */}
        <div className="mx-2 mt-8">
          <p className="text-sm font-medium mb-3" style={{ color: '#8896A8' }}>
            What's helping right now
          </p>
          <div className="flex flex-wrap gap-2">
            {childProfile.calmingStrategies.map((strategy) => {
              const active = activeStrategies.has(strategy);
              return (
                <button
                  key={strategy}
                  onClick={() => toggleStrategy(strategy)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border"
                  style={{
                    background: active ? 'rgba(0,217,166,0.12)' : 'rgba(255,255,255,0.04)',
                    borderColor: active ? '#00D9A6' : '#1A3A5C',
                    color: active ? '#00D9A6' : '#8896A8',
                  }}
                >
                  {active ? `${strategy} \u2713` : strategy}
                </button>
              );
            })}
          </div>
          {activeStrategies.size > 0 && (
            <p className="text-xs mt-3" style={{ color: '#00D9A6' }}>
              Using: {Array.from(activeStrategies).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="flex-shrink-0 px-6 py-5 border-t"
        style={{
          background: 'linear-gradient(180deg, #060E1C 0%, #0A1628 100%)',
          borderColor: '#1A3A5C',
        }}
      >
        {showResolvePanel ? (
          <div>
            <p className="text-sm font-medium mb-3 text-center" style={{ color: '#C8D4E4' }}>
              What helped most?
            </p>
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {resolveOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => handleResolve(option)}
                  className="px-4 py-2 rounded-full text-sm font-medium border transition-colors"
                  style={{
                    background: 'rgba(0,217,166,0.08)',
                    borderColor: '#1A3A5C',
                    color: '#C8D4E4',
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowResolvePanel(false)}
              className="w-full text-center text-xs py-2"
              style={{ color: '#6B7D94' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowResolvePanel(true)}
            className="w-full py-4 rounded-2xl text-base font-semibold transition-colors"
            style={{
              background: 'linear-gradient(135deg, #00D9A6, #00B88C)',
              color: '#060E1C',
            }}
          >
            Crisis resolved
          </button>
        )}
      </div>
    </div>
  );
}
