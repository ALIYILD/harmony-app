import { useAppStore } from '../store/useAppStore';
import type { SensoryProfile } from '../types';

const senseConfig: {
  key: keyof SensoryProfile;
  label: string;
  emoji: string;
}[] = [
  { key: 'sound', label: 'Sound', emoji: '🔊' },
  { key: 'light', label: 'Light', emoji: '💡' },
  { key: 'touch', label: 'Touch', emoji: '✋' },
  { key: 'taste', label: 'Taste', emoji: '👅' },
  { key: 'movement', label: 'Movement', emoji: '🏃' },
  { key: 'smell', label: 'Smell', emoji: '👃' },
];

function getBarColor(level: number): string {
  if (level <= 30) return '#00D9A6';
  if (level <= 60) return '#F0C038';
  return '#FF6B6B';
}

function communicationLabel(level: string): string {
  switch (level) {
    case 'nonverbal':
      return 'Nonverbal';
    case 'minimal_verbal':
      return 'Minimal Verbal';
    case 'verbal_limited':
      return 'Verbal (Limited)';
    case 'verbal':
      return 'Verbal';
    default:
      return level;
  }
}

const successRates = [78, 74, 82, 71, 85, 68, 76, 80];

export default function ChildProfileView() {
  const childProfile = useAppStore((s) => s.childProfile);

  return (
    <div className="min-h-screen pb-28 px-4 pt-6" style={{ backgroundColor: '#060E1C' }}>
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #38C9F0, #8B6EE8)' }}>
          {childProfile.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{childProfile.name}</h1>
          <p className="text-[#5A7A9B] text-sm">{childProfile.age} years old</p>
          <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium text-[#38C9F0] bg-[#38C9F0]/15">
            {communicationLabel(childProfile.communicationLevel)}
          </span>
        </div>
      </div>

      {/* Sensory Profile Card */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-5 mb-4">
        <h2 className="text-lg font-semibold text-white mb-4">Sensory Profile</h2>
        <div className="space-y-4">
          {senseConfig.map(({ key, label, emoji }) => {
            const sense = childProfile.sensoryProfile[key];
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base w-6 text-center">{emoji}</span>
                  <span className="text-sm font-medium text-[#C8D4E4] w-20">{label}</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden bg-[#132D46]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${sense.level}%`, backgroundColor: getBarColor(sense.level) }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-[#C8D4E4] w-8 text-right">{sense.level}</span>
                </div>
                {sense.level > 50 && sense.triggers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 ml-28 mt-1">
                    {sense.triggers.map((trigger) => (
                      <span
                        key={trigger}
                        className="text-xs px-2 py-0.5 rounded-full bg-[#132D46] text-[#5A7A9B] border border-[#1A3A5C]"
                      >
                        {trigger}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Known Triggers Card */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-5 mb-4">
        <h2 className="text-lg font-semibold text-white mb-3">Known Triggers</h2>
        <div className="flex flex-wrap gap-2">
          {childProfile.knownTriggers.map((trigger) => (
            <span
              key={trigger}
              className="text-sm px-3 py-1.5 rounded-full bg-[#FF6B6B]/10 text-[#FF6B6B] border border-[#FF6B6B]/20"
            >
              {trigger}
            </span>
          ))}
        </div>
      </div>

      {/* What Works Card */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-5 mb-4">
        <h2 className="text-lg font-semibold text-white mb-3">What Works for {childProfile.name}</h2>
        <div className="flex flex-wrap gap-2">
          {childProfile.calmingStrategies.map((strategy, i) => (
            <span
              key={strategy}
              className="text-sm px-3 py-1.5 rounded-full bg-[#00D9A6]/10 text-[#00D9A6] border border-[#00D9A6]/20 inline-flex items-center gap-1.5"
            >
              {strategy}
              <span className="text-xs text-[#00D9A6]/70 font-medium">
                {successRates[i % successRates.length]}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Communication Preferences Card */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-5 mb-4" style={{ borderLeft: '4px solid #38C9F0' }}>
        <h2 className="text-lg font-semibold text-white mb-3">Communication Notes</h2>
        <div className="space-y-3">
          {childProfile.preferences.map((pref) => (
            <div key={pref} className="flex items-start gap-2.5">
              <span className="text-base mt-0.5 shrink-0">💡</span>
              <p className="text-sm text-[#C8D4E4] leading-relaxed">{pref}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Routine Notes Card */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-5 mb-4">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span>🕐</span>
          Daily Routine
        </h2>
        <div className="bg-[#132D46] rounded-xl p-4 border border-[#1A3A5C]">
          <p className="text-sm text-[#C8D4E4] leading-relaxed">{childProfile.routineNotes}</p>
        </div>
      </div>

      {/* Learning Progress Card */}
      <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-5 mb-4">
        <h2 className="text-lg font-semibold text-white mb-1">Harmony is Learning</h2>
        <p className="text-xs text-[#5A7A9B] mb-4">
          The more you log, the better Harmony understands {childProfile.name}
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#C8D4E4]">Days of observations</span>
            <span className="text-sm font-semibold text-white">12</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#C8D4E4]">Events logged</span>
            <span className="text-sm font-semibold text-white">34</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#C8D4E4]">Trigger patterns identified</span>
            <span className="text-sm font-semibold text-white">8</span>
          </div>
          <div className="pt-2 border-t border-[#1A3A5C]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#C8D4E4]">Personalisation</span>
              <span className="text-sm font-semibold text-[#38C9F0]">42%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#132D46]">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: '42%', background: 'linear-gradient(90deg, #38C9F0, #8B6EE8)' }}
              />
            </div>
            <p className="text-xs text-[#5A7A9B] mt-1.5 text-right">improving</p>
          </div>
        </div>
      </div>
    </div>
  );
}
