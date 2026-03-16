import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { getSuggestionsForState } from '../data/mockData';
import type { ChildState, Suggestion, Trajectory } from '../types';

// --- Helpers & Constants ---

const STATE_CONFIG: Record<ChildState, { label: string; bg: string; text: string; borderPulse: boolean }> = {
  calm:            { label: 'calm',              bg: 'bg-[#0D1B2A]',  text: 'text-[#38C9F0]',  borderPulse: false },
  engaged:         { label: 'engaged',           bg: 'bg-[#0D1B2A]',  text: 'text-[#00D9A6]',  borderPulse: false },
  uneasy:          { label: 'uneasy',            bg: 'bg-[#0D1B2A]',  text: 'text-[#F0C038]',  borderPulse: false },
  confused:        { label: 'confused',           bg: 'bg-[#0D1B2A]',  text: 'text-[#F0C038]',  borderPulse: false },
  frustrated:      { label: 'frustrated',         bg: 'bg-[#0D1B2A]',  text: 'text-[#FF6B6B]',  borderPulse: true  },
  overloaded:      { label: 'overloaded',         bg: 'bg-[#0D1B2A]',  text: 'text-[#FF6B6B]',  borderPulse: true  },
  dysregulated:    { label: 'dysregulated',       bg: 'bg-[#0D1B2A]',  text: 'text-[#FF6B6B]',  borderPulse: true  },
  shutdown_risk:   { label: 'at risk of shutdown', bg: 'bg-[#0D1B2A]',  text: 'text-[#8B6EE8]',  borderPulse: true  },
  sensory_seeking: { label: 'sensory seeking',    bg: 'bg-[#0D1B2A]',  text: 'text-[#8B6EE8]',  borderPulse: false },
};

const BANNER_COLORS: Record<ChildState, string> = {
  calm:            'from-[#060E1C] via-[#0D1B2A] to-[#38C9F0]/20',
  engaged:         'from-[#060E1C] via-[#0D1B2A] to-[#00D9A6]/20',
  uneasy:          'from-[#060E1C] via-[#0D1B2A] to-[#F0C038]/20',
  confused:        'from-[#060E1C] via-[#0D1B2A] to-[#F0C038]/15',
  frustrated:      'from-[#060E1C] via-[#0D1B2A] to-[#FF6B6B]/25',
  overloaded:      'from-[#060E1C] via-[#1A0A0A] to-[#FF6B6B]/30',
  dysregulated:    'from-[#060E1C] via-[#1A0A0A] to-[#FF6B6B]/40',
  shutdown_risk:   'from-[#060E1C] via-[#0D1B2A] to-[#8B6EE8]/25',
  sensory_seeking: 'from-[#060E1C] via-[#0D1B2A] to-[#8B6EE8]/20',
};

const BANNER_TEXT: Record<ChildState, string> = {
  calm:            'text-white',
  engaged:         'text-white',
  uneasy:          'text-white',
  confused:        'text-white',
  frustrated:      'text-white',
  overloaded:      'text-white',
  dysregulated:    'text-white',
  shutdown_risk:   'text-white',
  sensory_seeking: 'text-white',
};

const TYPE_BADGE: Record<Suggestion['type'], { label: string; bg: string; text: string }> = {
  do:            { label: 'DO',            bg: 'bg-[#00D9A6]/15', text: 'text-[#00D9A6]' },
  avoid:         { label: 'AVOID',         bg: 'bg-[#FF6B6B]/15', text: 'text-[#FF6B6B]' },
  sensory:       { label: 'SENSORY',       bg: 'bg-[#8B6EE8]/15', text: 'text-[#8B6EE8]' },
  communication: { label: 'COMMUNICATION', bg: 'bg-[#38C9F0]/15', text: 'text-[#38C9F0]' },
};

const TRAJECTORY_DISPLAY: Record<Trajectory, { arrow: string; label: string }> = {
  stable:          { arrow: '→',  label: 'Stable' },
  escalating:      { arrow: '↑',  label: 'Escalating' },
  'de-escalating': { arrow: '↓',  label: 'De-escalating' },
};

const QUICK_ACTIONS = [
  { emoji: '🎧', label: 'Ear Defenders' },
  { emoji: '🛋️', label: 'Weighted Blanket' },
  { emoji: '🃏', label: 'Visual Choice' },
  { emoji: '⏸️', label: 'Pause Demands' },
  { emoji: '🔇', label: 'Quiet Space' },
  { emoji: '⏱️', label: 'Visual Timer' },
];

const EXPLAINER_TEXT: Record<string, string> = {
  calm:            "Leo appears calm and regulated. His vocal tone is steady, movement is relaxed, and biometric readings suggest a settled nervous system. This is a good window for gentle interaction or preferred activities.",
  engaged:         "Leo appears focused and engaged with his current activity. Vocal and movement patterns suggest active attention. This is a positive state — interruptions may disrupt this flow.",
  uneasy:          "Leo's movement patterns suggest mild restlessness and his vocal tone has shifted slightly. This pattern may indicate early discomfort. Proactive environmental adjustments may help prevent escalation.",
  confused:        "Leo's behavioural signals suggest he may not understand the current expectation. Gaze patterns and body language indicate uncertainty. Simplifying the task or using visual supports may help.",
  frustrated:      "Leo's vocal intensity has increased and body movement suggests agitation. This pattern has previously preceded escalation. The most effective response in past similar moments has been to pause demands and offer a break.",
  overloaded:      "Multiple sensory inputs appear to be exceeding Leo's processing capacity. Audio and visual modalities both indicate high stimulation. Immediate environmental reduction is the priority.",
  dysregulated:    "Leo appears to be in active dysregulation. Heart rate is elevated, movement is intense, and vocal patterns indicate significant distress. Safety is the priority — most interventions are ineffective during this phase. Wait for the first signs of calming.",
  shutdown_risk:   "Leo may be approaching shutdown — the nervous system's protective response to sustained overload. Movement and vocalisation have decreased significantly. Reducing all demands and sensory input is critical.",
  sensory_seeking: "Leo appears to be seeking sensory input — increased movement, possible stimming behaviours. This is often a self-regulation strategy. Offering appropriate sensory outlets may channel this productively.",
};

// --- Toast Component ---

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div className="bg-[#132D46] text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg border border-[#1A3A5C]">
        {message}
      </div>
    </div>
  );
}

// --- Modality Bar Chart (mini) ---

function ModalityBars({ contributions }: { contributions: { audio: number; vision: number; biometric: number; context: number } }) {
  const items = [
    { key: 'Audio',     value: contributions.audio,     color: 'bg-[#38C9F0]' },
    { key: 'Vision',    value: contributions.vision,    color: 'bg-[#8B6EE8]' },
    { key: 'Biometric', value: contributions.biometric, color: 'bg-[#38C9F0]' },
    { key: 'Context',   value: contributions.context,   color: 'bg-[#8B6EE8]' },
  ];

  return (
    <div className="flex items-end gap-3 mt-3">
      {items.map((item) => (
        <div key={item.key} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[10px] text-[#5A7A9B] font-medium">{Math.round(item.value * 100)}%</span>
          <div className="w-full bg-[#060E1C] rounded-full h-16 relative overflow-hidden">
            <div
              className={`absolute bottom-0 w-full rounded-full ${item.color} transition-all duration-500`}
              style={{ height: `${item.value * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-[#5A7A9B] font-medium">{item.key}</span>
        </div>
      ))}
    </div>
  );
}

// --- Suggestion Card ---

function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const badge = TYPE_BADGE[suggestion.type];
  const isAvoid = suggestion.type === 'avoid';

  return (
    <div
      className={`rounded-2xl p-4 shadow-sm border border-[#1A3A5C] transition-all ${
        isAvoid ? 'bg-[#FF6B6B]/5 border-[#FF6B6B]/30' : 'bg-[#0D1B2A]'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5 shrink-0">{suggestion.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
            {suggestion.successRate && (
              <span className="text-[10px] font-medium text-[#00D9A6] bg-[#00D9A6]/10 px-2 py-0.5 rounded-full">
                Worked {suggestion.successRate}% of the time
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-white leading-snug">{suggestion.text}</p>
          {suggestion.detail && (
            <p className="text-xs text-[#5A7A9B] mt-1 leading-relaxed">{suggestion.detail}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function CaregiverCoPilot() {
  const { currentState, suggestions, setSuggestions, childProfile } = useAppStore();
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: '', visible: false });

  const childName = childProfile.name;

  // Sync suggestions with current state
  useEffect(() => {
    setSuggestions(getSuggestionsForState(currentState.primaryState, currentState.confidence));
  }, [currentState, setSuggestions]);

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2000);
  }, []);

  const handleQuickAction = useCallback(
    (label: string) => {
      showToast(`Logged: ${label}`);
    },
    [showToast],
  );

  const stateCfg = STATE_CONFIG[currentState.primaryState];
  const bannerGradient = BANNER_COLORS[currentState.primaryState];
  const bannerText = BANNER_TEXT[currentState.primaryState];
  const trajectory = TRAJECTORY_DISPLAY[currentState.trajectory];
  const isEscalating = currentState.trajectory === 'escalating';

  const prioritySuggestion = suggestions.length > 0 ? suggestions[0] : null;
  const remainingSuggestions = suggestions.slice(1);

  const explainer =
    EXPLAINER_TEXT[currentState.primaryState] ||
    `${childName}'s current state is being monitored. The system is analysing multiple inputs to provide guidance.`;

  return (
    <div className="min-h-screen pb-28 bg-[#060E1C]">
      {/* 1. Current State Banner */}
      <div className={`bg-gradient-to-r ${bannerGradient} px-5 py-4`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-base font-bold ${bannerText}`}>
              {childName} may be {stateCfg.label}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${bannerText} bg-white/10`}
              >
                {currentState.confidenceLevel.charAt(0).toUpperCase() + currentState.confidenceLevel.slice(1)} · {Math.round(currentState.confidence * 100)}%
              </span>
              <span className={`text-sm font-semibold ${bannerText}`}>
                {trajectory.arrow} {trajectory.label}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 2. Priority Action Card */}
        {prioritySuggestion && (
          <div
            className={`rounded-2xl p-5 shadow-md bg-[#0D1B2A] border-2 ${
              isEscalating ? 'border-[#FF6B6B] animate-pulse-border' : 'border-[#1A3A5C]'
            }`}
          >
            <div className="flex items-center gap-1 mb-2">
              <span className="text-[10px] font-bold tracking-wider text-[#38C9F0] bg-[#38C9F0]/10 px-2 py-0.5 rounded-full">
                PRIORITY ACTION
              </span>
              {prioritySuggestion.successRate && (
                <span className="text-[10px] font-medium text-[#00D9A6] bg-[#00D9A6]/10 px-2 py-0.5 rounded-full">
                  Worked {prioritySuggestion.successRate}% of the time
                </span>
              )}
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">{prioritySuggestion.icon}</span>
              <div>
                <p className="text-base font-bold text-white leading-snug">{prioritySuggestion.text}</p>
                {prioritySuggestion.detail && (
                  <p className="text-sm text-[#5A7A9B] mt-1 leading-relaxed">{prioritySuggestion.detail}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3. Suggestion Cards */}
        {remainingSuggestions.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#5A7A9B] tracking-wider uppercase px-1">Suggestions</h3>
            {remainingSuggestions.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} />
            ))}
          </div>
        )}

        {/* 4. Quick Actions Row */}
        <div>
          <h3 className="text-xs font-bold text-[#5A7A9B] tracking-wider uppercase px-1 mb-2">Quick Actions</h3>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                onClick={() => handleQuickAction(action.label)}
                className="shrink-0 flex flex-col items-center gap-1 bg-[#0D1B2A] rounded-2xl px-3 py-3 shadow-sm border border-[#1A3A5C] active:scale-95 transition-transform min-w-[76px]"
              >
                <span className="text-xl">{action.emoji}</span>
                <span className="text-[10px] font-medium text-[#38C9F0] whitespace-nowrap">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 5. "What's Happening" Explainer */}
        <div className="rounded-2xl p-5 bg-[#0D1B2A] shadow-sm border border-[#1A3A5C]">
          <h3 className="text-xs font-bold text-[#38C9F0] tracking-wider uppercase mb-2">
            What's Happening
          </h3>
          <p className="text-sm text-[#C8D4E4] leading-relaxed">{explainer}</p>
          <div className="mt-3">
            <h4 className="text-[10px] font-bold text-[#5A7A9B] tracking-wider uppercase mb-1">
              Contributing Modalities
            </h4>
            <ModalityBars contributions={currentState.modalityContributions} />
          </div>
        </div>
      </div>

      {/* Toast */}
      <Toast message={toast.message} visible={toast.visible} />

      {/* Pulsing border animation style */}
      <style>{`
        @keyframes pulse-border {
          0%, 100% { border-color: rgba(255, 107, 107, 0.3); }
          50% { border-color: rgba(255, 107, 107, 1); }
        }
        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
