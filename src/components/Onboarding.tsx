import React, { useState, useCallback } from 'react';
import type { SensoryProfile } from '../types';
import { useAppStore } from '../store/useAppStore';

interface OnboardingProps {
  onComplete: () => void;
}

type CommunicationLevel = 'nonverbal' | 'minimal_verbal' | 'verbal_limited' | 'verbal';
type SensitivityLevel = 0 | 1 | 2 | 3;
type CaregiverRole = 'mum' | 'dad' | 'carer' | 'grandparent' | 'other';

const TOTAL_STEPS = 8;

const COMMUNICATION_OPTIONS: { value: CommunicationLevel; title: string; description: string; icon: string }[] = [
  { value: 'nonverbal', title: 'Nonverbal', description: 'Does not use spoken words', icon: '🤫' },
  { value: 'minimal_verbal', title: 'Minimal verbal', description: 'Uses some words or word approximations', icon: '🗣️' },
  { value: 'verbal_limited', title: 'Verbal (limited)', description: 'Speaks in short phrases', icon: '💬' },
  { value: 'verbal', title: 'Verbal', description: 'Speaks in full sentences', icon: '🗨️' },
];

const SENSITIVITY_LABELS = ['Low', 'Medium', 'High', 'Very High'] as const;

const SENSORY_CATEGORIES: { key: keyof Omit<SensoryProfile, 'smell'>; label: string; emoji: string; description: string }[] = [
  { key: 'sound', label: 'Sound sensitivity', emoji: '🔊', description: 'Reaction to noises and sounds' },
  { key: 'light', label: 'Light sensitivity', emoji: '💡', description: 'Reaction to brightness and visual stimuli' },
  { key: 'touch', label: 'Touch sensitivity', emoji: '🤚', description: 'Reaction to textures and physical contact' },
  { key: 'taste', label: 'Taste / Smell', emoji: '👃', description: 'Reaction to food textures, tastes, and smells' },
  { key: 'movement', label: 'Movement', emoji: '🏃', description: 'Need for or aversion to physical motion' },
];

const TRIGGER_OPTIONS = [
  'Loud noises', 'Routine changes', 'Transitions', 'Crowds', 'New places',
  'Hunger', 'Tiredness', 'Being rushed', 'Too many questions', 'Unexpected touch',
  'Bright lights', 'After school', 'Waiting', 'Sensory overload',
];

const STRATEGY_OPTIONS = [
  'Weighted blanket', 'Ear defenders', 'Quiet room', 'Favourite music',
  'Deep pressure', 'Visual timer', 'Fidget toy', 'Rocking',
  'Being alone', 'Water/drink', 'Favourite video', 'Going outside', 'Singing/humming',
];

const CAREGIVER_ROLES: { value: CaregiverRole; label: string }[] = [
  { value: 'mum', label: 'Mum' },
  { value: 'dad', label: 'Dad' },
  { value: 'carer', label: 'Carer' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'other', label: 'Other' },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const updateChildProfile = useAppStore((s) => s.updateChildProfile);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [animating, setAnimating] = useState(false);

  // Step 2
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState<number | ''>('');
  const [communicationLevel, setCommunicationLevel] = useState<CommunicationLevel | ''>('');

  // Step 3
  const [sensory, setSensory] = useState<Record<string, SensitivityLevel>>({
    sound: 1,
    light: 1,
    touch: 1,
    taste: 1,
    movement: 1,
  });

  // Step 4
  const [triggers, setTriggers] = useState<string[]>([]);
  const [customTrigger, setCustomTrigger] = useState('');

  // Step 5
  const [strategies, setStrategies] = useState<string[]>([]);
  const [customStrategy, setCustomStrategy] = useState('');

  // Step 6
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverRole, setCaregiverRole] = useState<CaregiverRole | ''>('');

  // Step 7
  const [consent, setConsent] = useState({
    onDevice: false,
    microphone: false,
    camera: false,
    notMedical: false,
  });

  const displayName = childName || 'your child';

  const goTo = useCallback((target: number) => {
    setDirection(target > step ? 'forward' : 'back');
    setAnimating(true);
    setTimeout(() => {
      setStep(target);
      setAnimating(false);
    }, 200);
  }, [step]);

  const next = () => goTo(step + 1);
  const back = () => goTo(step - 1);

  const canProceed = (): boolean => {
    switch (step) {
      case 2: return childName.trim().length > 0 && childAge !== '' && communicationLevel !== '';
      case 6: return caregiverName.trim().length > 0 && caregiverRole !== '';
      case 7: return consent.onDevice && consent.microphone && consent.camera && consent.notMedical;
      default: return true;
    }
  };

  const handleComplete = () => {
    updateChildProfile({
      name: childName.trim(),
      age: typeof childAge === 'number' ? childAge : 5,
      communicationLevel: communicationLevel || 'verbal',
      sensoryProfile: {
        sound: { level: sensory.sound, triggers: [] },
        light: { level: sensory.light, triggers: [] },
        touch: { level: sensory.touch, triggers: [] },
        taste: { level: sensory.taste, triggers: [] },
        movement: { level: sensory.movement, triggers: [] },
        smell: { level: 1, triggers: [] },
      },
      knownTriggers: triggers,
      calmingStrategies: strategies,
    });
    onComplete();
  };

  const togglePill = (item: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const addCustomItem = (value: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, setCurrent: React.Dispatch<React.SetStateAction<string>>) => {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    setCurrent('');
  };

  // --- Render helpers ---

  const renderProgressDots = () => (
    <div className="flex items-center justify-center gap-2 pt-6 pb-4">
      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
        const dotStep = i + 1;
        const isActive = dotStep === step;
        const isDone = dotStep < step;
        return (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              isActive ? 'w-6 bg-[#38C9F0]' : isDone ? 'w-2 bg-[#B39DDB]' : 'w-2 bg-[#1A3A5C]'
            }`}
          />
        );
      })}
    </div>
  );

  const renderNavButtons = (options?: { showSkip?: boolean; nextLabel?: string; onNext?: () => void }) => (
    <div className="flex items-center gap-3 mt-8">
      {step > 1 && (
        <button
          onClick={back}
          className="flex-1 py-3 rounded-xl border border-[#1A3A5C] text-white/70 text-sm font-medium hover:bg-[#1A3A5C]/40 transition-colors"
        >
          Back
        </button>
      )}
      {options?.showSkip && (
        <button
          onClick={next}
          className="flex-1 py-3 rounded-xl border border-[#1A3A5C] text-white/50 text-sm font-medium hover:bg-[#1A3A5C]/40 transition-colors"
        >
          Skip
        </button>
      )}
      <button
        onClick={options?.onNext || next}
        disabled={!canProceed()}
        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
          canProceed()
            ? 'bg-gradient-to-r from-[#38C9F0] to-[#B39DDB] text-[#060E1C] hover:opacity-90'
            : 'bg-[#1A3A5C] text-white/30 cursor-not-allowed'
        }`}
      >
        {options?.nextLabel || 'Next'}
      </button>
    </div>
  );

  const BrandLogo = () => (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="waveGrad" x1="10" y1="60" x2="110" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38C9F0" />
          <stop offset="1" stopColor="#B39DDB" />
        </linearGradient>
      </defs>
      <circle cx="38" cy="52" r="22" fill="#38C9F0" opacity="0.85" />
      <circle cx="82" cy="52" r="22" fill="#B39DDB" opacity="0.85" />
      <path
        d="M 16 80 Q 36 60, 60 72 Q 84 84, 104 66"
        stroke="url(#waveGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );

  const renderSensitivitySelector = (key: string, level: SensitivityLevel) => (
    <div className="flex items-center gap-2 mt-2">
      {SENSITIVITY_LABELS.map((label, i) => (
        <button
          key={label}
          onClick={() => setSensory({ ...sensory, [key]: i as SensitivityLevel })}
          className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
            level === i
              ? 'bg-[#38C9F0] text-[#060E1C]'
              : 'bg-[#132D46] text-white/50 hover:bg-[#1A3A5C]'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  const renderSensitivityBar = (level: SensitivityLevel) => (
    <div className="h-1.5 w-full bg-[#132D46] rounded-full mt-2 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${((level + 1) / 4) * 100}%`,
          background: level <= 1 ? '#38C9F0' : level === 2 ? '#F0A838' : '#F05538',
        }}
      />
    </div>
  );

  const renderPillGrid = (
    options: string[],
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => (
    <div className="flex flex-wrap gap-2 mt-4">
      {options.map((item) => {
        const isSelected = selected.includes(item);
        return (
          <button
            key={item}
            onClick={() => togglePill(item, selected, setSelected)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              isSelected
                ? 'bg-[#38C9F0]/20 border border-[#38C9F0] text-[#38C9F0]'
                : 'bg-[#0D1B2A] border border-[#1A3A5C] text-white/60 hover:border-[#38C9F0]/40'
            }`}
          >
            {item}
          </button>
        );
      })}
    </div>
  );

  // --- Steps ---

  const stepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
            <BrandLogo />
            <h1 className="mt-8 text-4xl font-bold bg-gradient-to-r from-[#38C9F0] to-[#B39DDB] bg-clip-text text-transparent">
              Welcome to Harmony
            </h1>
            <p className="mt-4 text-white/60 text-lg leading-relaxed max-w-xs">
              Real-time coaching for families who care deeply.
            </p>
            <p className="mt-6 text-white/40 text-sm max-w-xs">
              Let's set up your child's profile. This takes about 2 minutes.
            </p>
            <button
              onClick={next}
              className="mt-10 w-full max-w-xs py-4 rounded-xl bg-gradient-to-r from-[#38C9F0] to-[#B39DDB] text-[#060E1C] font-semibold text-base hover:opacity-90 transition-opacity"
            >
              Get Started
            </button>
          </div>
        );

      case 2:
        return (
          <div className="flex-1 px-6 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mt-4">Tell us about your child</h2>
            <p className="text-white/50 text-sm mt-1 mb-6">We'll use this to personalise Harmony for them.</p>

            <label className="block text-white/70 text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              placeholder="Child's name"
              className="w-full py-3.5 px-4 bg-[#132D46] border border-[#1A3A5C] rounded-xl text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-[#38C9F0] transition-colors"
            />

            <label className="block text-white/70 text-sm font-medium mt-5 mb-2">Age</label>
            <input
              type="number"
              min={1}
              max={18}
              value={childAge}
              onChange={(e) => {
                const v = parseInt(e.target.value);
                setChildAge(isNaN(v) ? '' : Math.min(18, Math.max(1, v)));
              }}
              placeholder="Age"
              className="w-full py-3.5 px-4 bg-[#132D46] border border-[#1A3A5C] rounded-xl text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-[#38C9F0] transition-colors"
            />

            <label className="block text-white/70 text-sm font-medium mt-5 mb-3">Communication level</label>
            <div className="grid grid-cols-1 gap-3">
              {COMMUNICATION_OPTIONS.map((opt) => {
                const isSelected = communicationLevel === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setCommunicationLevel(opt.value)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#38C9F0] bg-[#38C9F0]/10'
                        : 'border-[#1A3A5C] bg-[#0D1B2A] hover:border-[#38C9F0]/40'
                    }`}
                  >
                    <span className="text-2xl mt-0.5">{opt.icon}</span>
                    <div>
                      <div className={`font-semibold text-sm ${isSelected ? 'text-[#38C9F0]' : 'text-white'}`}>
                        {opt.title}
                      </div>
                      <div className="text-white/40 text-xs mt-0.5">{opt.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            {renderNavButtons()}
          </div>
        );

      case 3:
        return (
          <div className="flex-1 px-6 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mt-4">
              How does {displayName} respond to these?
            </h2>
            <p className="text-white/50 text-sm mt-1 mb-6">
              This helps Harmony detect sensory triggers early.
            </p>

            <div className="space-y-5">
              {SENSORY_CATEGORIES.map((cat) => (
                <div key={cat.key} className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="text-white font-medium text-sm">{cat.label}</span>
                  </div>
                  <p className="text-white/40 text-xs mt-1">{cat.description}</p>
                  {renderSensitivitySelector(cat.key, sensory[cat.key])}
                  {renderSensitivityBar(sensory[cat.key])}
                </div>
              ))}
            </div>
            {renderNavButtons()}
          </div>
        );

      case 4:
        return (
          <div className="flex-1 px-6 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mt-4">
              What tends to cause difficulties?
            </h2>
            <p className="text-white/50 text-sm mt-1">
              Select any that apply for {displayName}. You can always update these later.
            </p>

            {renderPillGrid(TRIGGER_OPTIONS, triggers, setTriggers)}

            <div className="mt-5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customTrigger}
                  onChange={(e) => setCustomTrigger(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomItem(customTrigger, triggers, setTriggers, setCustomTrigger)}
                  placeholder="Add custom trigger..."
                  className="flex-1 py-2.5 px-4 bg-[#132D46] border border-[#1A3A5C] rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#38C9F0] transition-colors"
                />
                <button
                  onClick={() => addCustomItem(customTrigger, triggers, setTriggers, setCustomTrigger)}
                  className="px-4 py-2.5 rounded-xl bg-[#1A3A5C] text-white/60 text-sm hover:bg-[#38C9F0]/20 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
            {renderNavButtons({ showSkip: true })}
          </div>
        );

      case 5:
        return (
          <div className="flex-1 px-6 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mt-4">
              What helps {displayName} calm down?
            </h2>
            <p className="text-white/50 text-sm mt-1">
              These will appear as suggestions during difficult moments.
            </p>

            {renderPillGrid(STRATEGY_OPTIONS, strategies, setStrategies)}

            <div className="mt-5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customStrategy}
                  onChange={(e) => setCustomStrategy(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomItem(customStrategy, strategies, setStrategies, setCustomStrategy)}
                  placeholder="Add custom strategy..."
                  className="flex-1 py-2.5 px-4 bg-[#132D46] border border-[#1A3A5C] rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#38C9F0] transition-colors"
                />
                <button
                  onClick={() => addCustomItem(customStrategy, strategies, setStrategies, setCustomStrategy)}
                  className="px-4 py-2.5 rounded-xl bg-[#1A3A5C] text-white/60 text-sm hover:bg-[#38C9F0]/20 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
            {renderNavButtons({ showSkip: true })}
          </div>
        );

      case 6:
        return (
          <div className="flex-1 px-6 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mt-4">What should we call you?</h2>
            <p className="text-white/50 text-sm mt-1 mb-6">
              So Harmony can speak to you personally.
            </p>

            <label className="block text-white/70 text-sm font-medium mb-2">Your name</label>
            <input
              type="text"
              value={caregiverName}
              onChange={(e) => setCaregiverName(e.target.value)}
              placeholder="Your name"
              className="w-full py-3.5 px-4 bg-[#132D46] border border-[#1A3A5C] rounded-xl text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-[#38C9F0] transition-colors"
            />

            <label className="block text-white/70 text-sm font-medium mt-6 mb-3">I am...</label>
            <div className="grid grid-cols-3 gap-3">
              {CAREGIVER_ROLES.map((role) => {
                const isSelected = caregiverRole === role.value;
                return (
                  <button
                    key={role.value}
                    onClick={() => setCaregiverRole(role.value)}
                    className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-[#38C9F0] bg-[#38C9F0]/10 text-[#38C9F0]'
                        : 'border-[#1A3A5C] bg-[#0D1B2A] text-white/60 hover:border-[#38C9F0]/40'
                    }`}
                  >
                    {role.label}
                  </button>
                );
              })}
            </div>
            {renderNavButtons()}
          </div>
        );

      case 7:
        return (
          <div className="flex-1 px-6 overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mt-4">Your privacy is our priority</h2>
            <p className="text-white/50 text-sm mt-1 mb-6">
              Harmony is designed with privacy at its core. Please review and confirm the following.
            </p>

            <div className="space-y-4">
              {[
                { key: 'onDevice' as const, text: 'I understand Harmony processes audio and video on-device only' },
                { key: 'microphone' as const, text: 'I consent to microphone access for voice analysis' },
                { key: 'camera' as const, text: 'I consent to camera access for visual analysis' },
                { key: 'notMedical' as const, text: 'I understand this is decision support, not medical advice' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setConsent({ ...consent, [item.key]: !consent[item.key] })}
                  className="flex items-start gap-3 w-full text-left"
                >
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      consent[item.key]
                        ? 'bg-[#38C9F0] border-[#38C9F0]'
                        : 'border-[#1A3A5C] bg-transparent'
                    }`}
                  >
                    {consent[item.key] && (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6L5 9L10 3" stroke="#060E1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-white/70 text-sm leading-snug">{item.text}</span>
                </button>
              ))}
            </div>

            <div className="mt-8 bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
              <p className="text-white/50 text-xs leading-relaxed">
                All data stays on your device. Nothing is sent to the cloud without your explicit permission.
              </p>
              <p className="text-[#38C9F0]/60 text-xs font-medium mt-2">
                GDPR & NHS DTAC compliant
              </p>
            </div>
            {renderNavButtons({ nextLabel: 'Agree & Continue' })}
          </div>
        );

      case 8:
        return (
          <div className="flex-1 px-6 overflow-y-auto flex flex-col items-center text-center">
            <div className="mt-8 text-6xl">🎉</div>
            <h2 className="text-2xl font-bold text-white mt-4">
              You're all set, {caregiverName || 'there'}!
            </h2>
            <p className="text-white/50 text-base mt-2">
              {childName ? `${childName}'s` : "Your child's"} profile is ready.
            </p>
            <p className="text-white/40 text-sm mt-4 max-w-xs leading-relaxed">
              Harmony will learn {displayName}'s unique patterns over time. The more you use it, the better it understands {displayName}.
            </p>

            <div className="w-full mt-8 space-y-3">
              {[
                { icon: '📱', tip: 'Keep Harmony open during daily routines' },
                { icon: '📝', tip: 'Log events to help Harmony learn' },
                { icon: '📖', tip: 'Check the Guide tab when you need help' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4"
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-white/60 text-sm text-left">{item.tip}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleComplete}
              className="mt-8 w-full py-4 rounded-xl bg-gradient-to-r from-[#38C9F0] to-[#B39DDB] text-[#060E1C] font-semibold text-base hover:opacity-90 transition-opacity"
            >
              Start Using Harmony
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-[#060E1C] flex flex-col overflow-hidden">
      {step > 1 && step < 8 && renderProgressDots()}
      <div
        className={`flex-1 flex flex-col overflow-y-auto transition-all duration-200 ${
          animating
            ? direction === 'forward'
              ? 'opacity-0 translate-x-8'
              : 'opacity-0 -translate-x-8'
            : 'opacity-100 translate-x-0'
        }`}
      >
        {stepContent()}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
