import { useMemo } from 'react';
import type { ChildState, ConfidenceLevel, EventLog, GestureEntry, TabId } from '../types';
import { useAppStore } from '../store/useAppStore';
import { generateMockDailySummary, generateMockEventLogs } from '../data/mockData';
import StressRing from './StressRing';

/* ─── Color & label maps ─── */

const stateColorMap: Record<ChildState, string> = {
  calm: '#00D9A6',
  engaged: '#00D9A6',
  uneasy: '#F0C038',
  confused: '#F0C038',
  sensory_seeking: '#F0C038',
  frustrated: '#FF6B6B',
  overloaded: '#FF6B6B',
  dysregulated: '#8B6EE8',
  shutdown_risk: '#8B6EE8',
};

const friendlyStateLabel: Record<ChildState, string> = {
  calm: 'calm and regulated',
  engaged: 'focused and engaged',
  uneasy: 'a little uneasy',
  confused: 'a bit confused',
  frustrated: 'feeling frustrated',
  overloaded: 'feeling overloaded',
  dysregulated: 'having a very hard time',
  shutdown_risk: 'shutting down — needs space',
  sensory_seeking: 'seeking sensory input',
};

const eventTypeEmoji: Record<string, string> = {
  meltdown: '\uD83C\uDF0A',
  near_meltdown: '\u26A0\uFE0F',
  shutdown: '\uD83D\uDD07',
  sensory_overload: '\uD83D\uDD0A',
  frustration: '\uD83D\uDE24',
  good_moment: '\u2728',
  transition_difficulty: '\uD83D\uDD04',
  other: '\uD83D\uDCDD',
};

const eventTypeLabel: Record<string, string> = {
  meltdown: 'Meltdown',
  near_meltdown: 'Near meltdown',
  shutdown: 'Shutdown',
  sensory_overload: 'Sensory overload',
  frustration: 'Frustration',
  good_moment: 'Good moment',
  transition_difficulty: 'Transition difficulty',
  other: 'Event',
};

const gestureCategoryEmoji: Record<string, string> = {
  need: '\uD83C\uDF7D\uFE0F',
  emotion: '\uD83D\uDC9C',
  request: '\uD83D\uDC4B',
  refusal: '\u270B',
  sensory: '\uD83C\uDFA7',
  social: '\uD83E\uDD17',
  custom: '\u2B50',
};

/* ─── Helpers ─── */

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getConfidencePhrase(level: ConfidenceLevel): string {
  switch (level) {
    case 'likely': return 'Harmony is fairly confident about this';
    case 'possible': return 'Harmony thinks this is likely';
    case 'uncertain': return 'Harmony is still learning this pattern';
    case 'low': return 'Harmony is still learning';
  }
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function minutesToFriendly(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} minutes`;
  if (m === 0) return `${h} hours`;
  return `${h}h ${m}m`;
}

function noiseLabel(db: number): { text: string; icon: string; comfort: string } {
  if (db < 30) return { text: 'Very quiet', icon: '\uD83D\uDD07', comfort: 'Great environment for Leo' };
  if (db < 45) return { text: 'Moderate', icon: '\uD83D\uDD09', comfort: 'Good environment for Leo' };
  if (db < 60) return { text: 'Noticeable', icon: '\uD83D\uDD0A', comfort: 'Consider reducing noise' };
  return { text: 'Loud', icon: '\uD83D\uDD0A', comfort: 'Too loud — Leo may struggle' };
}

function lightLabel(level: number): string {
  if (level < 30) return 'Dim';
  if (level < 70) return 'Comfortable';
  return 'Bright';
}

function dayFaceEmoji(summary: ReturnType<typeof generateMockDailySummary>): string {
  const total = summary.totalCalmMinutes + summary.totalElevatedMinutes + summary.totalHighRiskMinutes;
  if (total === 0) return '\uD83D\uDE0A';
  const calmRatio = summary.totalCalmMinutes / total;
  if (calmRatio > 0.7) return '\uD83D\uDE0A';
  if (calmRatio > 0.45) return '\uD83D\uDE10';
  return '\uD83D\uDE1F';
}

function dayFaceLabel(summary: ReturnType<typeof generateMockDailySummary>): string {
  const total = summary.totalCalmMinutes + summary.totalElevatedMinutes + summary.totalHighRiskMinutes;
  if (total === 0) return 'Just getting started';
  const calmRatio = summary.totalCalmMinutes / total;
  if (calmRatio > 0.7) return 'Mostly calm';
  if (calmRatio > 0.45) return 'Mixed';
  return 'Difficult';
}

/* ─── Sub-components ─── */

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-3 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}

function QuickActionButton({
  icon,
  label,
  tint,
  onClick,
}: {
  icon: string;
  label: string;
  tint: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-[#1A3A5C] p-3 sm:p-4 min-h-[72px] sm:min-h-[80px] transition-transform active:scale-95"
      style={{ backgroundColor: tint }}
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-sm font-semibold text-white">{label}</span>
    </button>
  );
}

/* ─── Main Component ─── */

interface HomeDashboardProps {
  onSOS?: () => void;
  onCalm?: () => void;
  onEnvScan?: () => void;
  onNavigate?: (tab: TabId) => void;
}

export default function HomeDashboard({ onSOS, onCalm, onEnvScan, onNavigate }: HomeDashboardProps) {
  const currentState = useAppStore((s) => s.currentState);
  const sensorReadings = useAppStore((s) => s.sensorReadings);
  const childProfile = useAppStore((s) => s.childProfile);
  const eventLogs = useAppStore((s) => s.eventLogs);
  const gestureDictionary = useAppStore((s) => s.gestureDictionary);

  const dailySummary = useMemo(() => generateMockDailySummary(), []);
  const mockEvents = useMemo(() => generateMockEventLogs(), []);

  const childName = childProfile.name;
  const stateColor = stateColorMap[currentState.primaryState];
  const stateLabel = friendlyStateLabel[currentState.primaryState];

  // Merge and sort events
  const allEvents: EventLog[] = useMemo(() => {
    const merged = [...eventLogs, ...mockEvents];
    const seen = new Set<string>();
    const deduped = merged.filter((e) => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });
    return deduped.sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);
  }, [eventLogs, mockEvents]);

  // Top gestures
  const topGestures: GestureEntry[] = useMemo(
    () => [...gestureDictionary].sort((a, b) => b.confidence - a.confidence).slice(0, 5),
    [gestureDictionary]
  );

  // Count meltdowns in today's events
  const todayMeltdowns = dailySummary.events.filter((e) => e.type === 'meltdown').length;
  const todayElevated = dailySummary.totalElevatedMinutes > 0 ? 1 : 0;

  // Sensor data
  const noise = sensorReadings.context.ambientNoise;
  const noiseInfo = noiseLabel(noise);
  const light = sensorReadings.context.ambientLight;
  const lightText = lightLabel(light);
  const routineAdherence = sensorReadings.context.routineAdherence;

  // Sleep mock (not in store, so we derive a realistic mock)
  const sleepHours = 5;
  const sleepMinutes = 20;
  const sleepTotal = `${sleepHours}h ${sleepMinutes}m`;
  const sleepOk = sleepHours >= 8;

  // Communication today mock
  const totalSigns = 8;
  const topSigns = ['More', 'Help', 'Hug'];
  const newGestures = 3;

  // Contextual insights
  const insights = useMemo(() => {
    const list: { text: string; color: string }[] = [];

    if (!sleepOk) {
      list.push({
        text: `${childName} slept poorly last night \u2014 he may be more sensitive today`,
        color: '#F0C038',
      });
    }

    const hour = new Date().getHours();
    if (hour >= 15 && hour <= 17) {
      list.push({
        text: `It\u2019s ${new Date().toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' })} \u2014 this is usually a tricky time after school`,
        color: '#F0C038',
      });
    }

    if (routineAdherence < 0.8) {
      list.push({
        text: 'His routine is a bit off today \u2014 keep things predictable where you can',
        color: '#F0C038',
      });
    } else {
      list.push({
        text: 'Following his routine well today \u2014 that\u2019s helping him stay steady',
        color: '#00D9A6',
      });
    }

    if (noise > 50) {
      list.push({
        text: `The environment is noisy (${Math.round(noise)} dB) \u2014 consider reducing sound`,
        color: '#FF6B6B',
      });
    }

    return list.slice(0, 3);
  }, [childName, routineAdherence, noise, sleepOk]);

  // Harmony learning stats
  const daysLearning = 12;
  const totalEventsLogged = 34;
  const signsLearned = gestureDictionary.length;
  const patternsFound = 8;

  // Stress ring value: map state to 0-100
  const stressValue = useMemo(() => {
    const map: Record<ChildState, number> = {
      calm: 15,
      engaged: 20,
      uneasy: 40,
      confused: 45,
      sensory_seeking: 35,
      frustrated: 60,
      overloaded: 75,
      dysregulated: 90,
      shutdown_risk: 95,
    };
    return map[currentState.primaryState];
  }, [currentState.primaryState]);

  // Day bar proportions
  const totalDayMins =
    dailySummary.totalCalmMinutes + dailySummary.totalElevatedMinutes + dailySummary.totalHighRiskMinutes;
  const calmPct = totalDayMins > 0 ? (dailySummary.totalCalmMinutes / totalDayMins) * 100 : 100;
  const elevPct = totalDayMins > 0 ? (dailySummary.totalElevatedMinutes / totalDayMins) * 100 : 0;
  const highPct = totalDayMins > 0 ? (dailySummary.totalHighRiskMinutes / totalDayMins) * 100 : 0;

  return (
    <div className="min-h-screen pb-28 px-3 sm:px-4 pt-4 sm:pt-6 max-w-4xl mx-auto overflow-x-hidden" style={{ backgroundColor: '#060E1C' }}>
      {/* ━━━ 1. Greeting + Status Hero ━━━ */}
      <section className="mb-6">
        <div
          className="rounded-3xl p-4 sm:p-6 relative overflow-hidden"
          style={{
            background: `radial-gradient(ellipse at 50% 80%, ${stateColor}18 0%, transparent 70%), #0D1B2A`,
            border: `1px solid ${stateColor}30`,
          }}
        >
          <p className="text-lg text-white/80 mb-1">
            {getGreeting()}, Sarah {'\uD83D\uDC4B'}
          </p>

          <div className="flex flex-col md:flex-row md:items-center md:gap-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white leading-snug mt-2 mb-3">
                {childName} is{' '}
                <span style={{ color: stateColor }}>{stateLabel}</span>
                {' '}right now
              </h1>

              <p className="text-sm mb-1" style={{ color: '#8CA3BD' }}>
                {getConfidencePhrase(currentState.confidenceLevel)}
              </p>

              {currentState.trajectory !== 'stable' && (
                <p className="text-sm" style={{ color: '#8CA3BD' }}>
                  {currentState.trajectory === 'escalating'
                    ? 'Things seem to be building up a little'
                    : 'Things are starting to settle down'}
                </p>
              )}
            </div>

            <div className="mt-4 md:mt-0 flex justify-center">
              <StressRing
                value={stressValue}
                size={120}
                state={currentState.primaryState}
                confidence={currentState.confidence}
                confidenceLevel={currentState.confidenceLevel}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ 2. Quick Insight Cards ━━━ */}
      <section className="mb-6">
        <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible scrollbar-hide -mx-3 px-3 sm:-mx-4 sm:px-4 md:mx-0 md:px-0">
          {/* a) How the day is going */}
          <Card className="min-w-[220px] sm:min-w-[260px] md:min-w-0 flex-shrink-0">
            <p className="text-sm font-medium mb-3" style={{ color: '#5A7A9B' }}>
              How {childName}&apos;s day is going
            </p>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{dayFaceEmoji(dailySummary)}</span>
              <span className="text-lg font-semibold text-white">{dayFaceLabel(dailySummary)}</span>
            </div>
            <p className="text-sm mb-3" style={{ color: '#C8D4E4' }}>
              Calm for {minutesToFriendly(dailySummary.totalCalmMinutes)} &middot;{' '}
              {todayElevated} elevated period{todayElevated !== 1 ? 's' : ''} &middot;{' '}
              {todayMeltdowns} meltdown{todayMeltdowns !== 1 ? 's' : ''}
            </p>
            {/* Day bar */}
            <div className="flex h-2 rounded-full overflow-hidden bg-[#132D46]">
              <div style={{ width: `${calmPct}%`, backgroundColor: '#00D9A6' }} />
              <div style={{ width: `${elevPct}%`, backgroundColor: '#F0C038' }} />
              <div style={{ width: `${highPct}%`, backgroundColor: '#FF6B6B' }} />
            </div>
          </Card>

          {/* b) Last night's sleep */}
          <Card className="min-w-[220px] sm:min-w-[260px] md:min-w-0 flex-shrink-0">
            <p className="text-sm font-medium mb-3" style={{ color: '#5A7A9B' }}>
              Last night&apos;s sleep
            </p>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{'\uD83D\uDECF\uFE0F'}</span>
              <span
                className="text-lg font-semibold"
                style={{ color: sleepOk ? '#00D9A6' : '#F0C038' }}
              >
                {sleepTotal}
              </span>
            </div>
            <p className="text-sm mb-1" style={{ color: '#C8D4E4' }}>
              {sleepOk ? 'Good rest for ' + childName : 'Below ' + childName + '\u2019s needs'}
            </p>
            {!sleepOk && (
              <p className="text-xs" style={{ color: '#F0C038' }}>
                This may affect his regulation today
              </p>
            )}
          </Card>

          {/* c) Communication today */}
          <Card className="min-w-[220px] sm:min-w-[260px] md:min-w-0 flex-shrink-0">
            <p className="text-sm font-medium mb-3" style={{ color: '#5A7A9B' }}>
              Communication today
            </p>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{'\uD83E\uDD1F'}</span>
              <span className="text-lg font-semibold text-white">
                {totalSigns} signs used
              </span>
            </div>
            <p className="text-sm mb-1" style={{ color: '#C8D4E4' }}>
              Most used: {topSigns.join(', ')}
            </p>
            <p className="text-xs" style={{ color: '#00D9A6' }}>
              {newGestures} new gestures detected
            </p>
          </Card>

          {/* d) Environment right now */}
          <Card className="min-w-[220px] sm:min-w-[260px] md:min-w-0 flex-shrink-0">
            <p className="text-sm font-medium mb-3" style={{ color: '#5A7A9B' }}>
              Environment right now
            </p>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{noiseInfo.icon}</span>
              <div>
                <p className="text-sm text-white">
                  Noise: {noiseInfo.text} ({Math.round(noise)} dB)
                </p>
                <p className="text-sm text-white">Light: {lightText}</p>
              </div>
            </div>
            <p
              className="text-xs font-medium"
              style={{ color: noise < 50 ? '#00D9A6' : '#F0C038' }}
            >
              {noiseInfo.comfort}
            </p>
          </Card>
        </div>
      </section>

      {/* ━━━ 3. What to Watch For ━━━ */}
      {insights.length > 0 && (
        <section className="mb-6">
          <Card>
            <h2 className="text-base font-semibold text-white mb-4">
              Things to keep in mind right now
            </h2>
            <div className="flex flex-col gap-3">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className="pl-4 py-2 rounded-lg"
                  style={{
                    borderLeft: `3px solid ${insight.color}`,
                    backgroundColor: `${insight.color}08`,
                  }}
                >
                  <p className="text-sm" style={{ color: '#C8D4E4' }}>
                    {insight.text}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* ━━━ 4. Quick Actions ━━━ */}
      <section className="mb-6">
        <div className="grid grid-cols-2 gap-3">
          <QuickActionButton
            icon={'\uD83C\uDD98'}
            label="Help Now"
            tint="rgba(255, 107, 107, 0.12)"
            onClick={onSOS}
          />
          <QuickActionButton
            icon={'\uD83E\uDDD8'}
            label="Calm Tools"
            tint="rgba(0, 217, 166, 0.12)"
            onClick={onCalm}
          />
          <QuickActionButton
            icon={'\u270F\uFE0F'}
            label="Log Event"
            tint="rgba(240, 192, 56, 0.12)"
            onClick={() => onNavigate?.('log')}
          />
          <QuickActionButton
            icon={'\uD83D\uDD0D'}
            label="Check Room"
            tint="rgba(56, 159, 240, 0.12)"
            onClick={onEnvScan}
          />
        </div>
      </section>

      {/* ━━━ 5. Recent Events ━━━ */}
      <section className="mb-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Recent events</h2>
            <button className="text-sm font-medium" style={{ color: '#389FF0' }}>
              See all
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {allEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ backgroundColor: '#132D46' }}
              >
                <span className="text-2xl mt-0.5">
                  {eventTypeEmoji[event.type] || '\uD83D\uDCDD'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white truncate">
                      {eventTypeLabel[event.type] || 'Event'}
                    </p>
                    <p className="text-xs flex-shrink-0" style={{ color: '#5A7A9B' }}>
                      {timeAgo(event.timestamp)}
                    </p>
                  </div>
                  {event.trigger && (
                    <p className="text-xs mt-0.5" style={{ color: '#8CA3BD' }}>
                      {event.trigger}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ━━━ 6. Leo's Top Signs ━━━ */}
      <section className="mb-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">
              {childName}&apos;s signs to remember
            </h2>
            <button className="text-sm font-medium" style={{ color: '#389FF0' }}>
              See all signs &rarr;
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {topGestures.map((g) => (
              <div
                key={g.id}
                className="flex items-start gap-3 p-3 rounded-xl"
                style={{ backgroundColor: '#132D46' }}
              >
                <span className="text-2xl mt-0.5">
                  {gestureCategoryEmoji[g.category] || '\u2B50'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{g.label}</p>
                  {g.description && (
                    <p className="text-xs mt-0.5" style={{ color: '#8CA3BD' }}>
                      {g.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* ━━━ 7. Harmony Learning Card ━━━ */}
      <section className="mb-6">
        <div
          className="rounded-2xl p-5 border"
          style={{
            backgroundColor: 'rgba(139, 110, 232, 0.08)',
            borderColor: 'rgba(139, 110, 232, 0.2)',
          }}
        >
          <h2 className="text-base font-semibold text-white mb-2">
            {'\uD83E\uDDE0'} Harmony has been learning {childName} for {daysLearning} days
          </h2>
          <p className="text-sm mb-3" style={{ color: '#C8D4E4' }}>
            {totalEventsLogged} events logged &middot; {signsLearned} signs learned &middot;{' '}
            {patternsFound} patterns found
          </p>
          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden mb-3" style={{ backgroundColor: '#1A3A5C' }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min((daysLearning / 90) * 100, 100)}%`,
                background: 'linear-gradient(90deg, #8B6EE8, #00D9A6)',
              }}
            />
          </div>
          <p className="text-xs" style={{ color: '#8CA3BD' }}>
            The more you use Harmony, the better it understands {childName}
          </p>
        </div>
      </section>
    </div>
  );
}
