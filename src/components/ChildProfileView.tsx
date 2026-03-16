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
  if (level <= 30) return 'bg-green-500';
  if (level <= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function getBarTrackColor(level: number): string {
  if (level <= 30) return 'bg-green-100';
  if (level <= 60) return 'bg-amber-100';
  return 'bg-red-100';
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
    <div className="min-h-screen pb-28 px-4 pt-6" style={{ backgroundColor: '#F8F7FF' }}>
      {/* Profile Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #A855F7)' }}>
          {childProfile.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{childProfile.name}</h1>
          <p className="text-gray-500 text-sm">{childProfile.age} years old</p>
          <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium text-purple-700 bg-purple-100">
            {communicationLabel(childProfile.communicationLevel)}
          </span>
        </div>
      </div>

      {/* Sensory Profile Card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sensory Profile</h2>
        <div className="space-y-4">
          {senseConfig.map(({ key, label, emoji }) => {
            const sense = childProfile.sensoryProfile[key];
            return (
              <div key={key}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base w-6 text-center">{emoji}</span>
                  <span className="text-sm font-medium text-gray-700 w-20">{label}</span>
                  <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: undefined }}>
                    <div className={`h-full rounded-full ${getBarTrackColor(sense.level)} relative`}>
                      <div
                        className={`h-full rounded-full ${getBarColor(sense.level)} transition-all duration-500`}
                        style={{ width: `${sense.level}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 w-8 text-right">{sense.level}</span>
                </div>
                {sense.level > 50 && sense.triggers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 ml-28 mt-1">
                    {sense.triggers.map((trigger) => (
                      <span
                        key={trigger}
                        className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
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
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Known Triggers</h2>
        <div className="flex flex-wrap gap-2">
          {childProfile.knownTriggers.map((trigger) => (
            <span
              key={trigger}
              className="text-sm px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-100"
            >
              {trigger}
            </span>
          ))}
        </div>
      </div>

      {/* What Works Card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">What Works for {childProfile.name}</h2>
        <div className="flex flex-wrap gap-2">
          {childProfile.calmingStrategies.map((strategy, i) => (
            <span
              key={strategy}
              className="text-sm px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-100 inline-flex items-center gap-1.5"
            >
              {strategy}
              <span className="text-xs text-green-500 font-medium">
                {successRates[i % successRates.length]}%
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Communication Preferences Card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Communication Notes</h2>
        <div className="space-y-3">
          {childProfile.preferences.map((pref) => (
            <div key={pref} className="flex items-start gap-2.5">
              <span className="text-base mt-0.5 shrink-0">💡</span>
              <p className="text-sm text-gray-700 leading-relaxed">{pref}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Routine Notes Card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <span>🕐</span>
          Daily Routine
        </h2>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <p className="text-sm text-gray-700 leading-relaxed">{childProfile.routineNotes}</p>
        </div>
      </div>

      {/* Learning Progress Card */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Harmony is Learning</h2>
        <p className="text-xs text-gray-400 mb-4">
          The more you log, the better Harmony understands {childProfile.name}
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Days of observations</span>
            <span className="text-sm font-semibold text-gray-900">12</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Events logged</span>
            <span className="text-sm font-semibold text-gray-900">34</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Trigger patterns identified</span>
            <span className="text-sm font-semibold text-gray-900">8</span>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Personalisation</span>
              <span className="text-sm font-semibold text-purple-600">42%</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-purple-100">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: '42%', background: 'linear-gradient(90deg, #7C3AED, #A855F7)' }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5 text-right">improving</p>
          </div>
        </div>
      </div>
    </div>
  );
}
