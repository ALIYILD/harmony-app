import { useEffect, useRef, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { ChildState } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hrColor(hr: number): string {
  if (hr <= 90) return '#00D9A6';
  if (hr <= 110) return '#F0C038';
  return '#FF6B6B';
}

function hrvColor(hrv: number): string {
  if (hrv > 40) return '#00D9A6';
  if (hrv >= 25) return '#F0C038';
  return '#FF6B6B';
}

function activityLabel(level: number): string {
  if (level < 0.2) return 'Sedentary';
  if (level <= 0.5) return 'Light';
  if (level <= 0.7) return 'Moderate';
  return 'High';
}

function activityColor(level: number): string {
  if (level < 0.2) return '#5A7A9B';
  if (level <= 0.5) return '#00D9A6';
  if (level <= 0.7) return '#F0C038';
  return '#FF6B6B';
}

function trendArrow(trend: number): string {
  if (trend > 0) return '↑';
  if (trend < 0) return '↓';
  return '→';
}

function isEscalated(state: ChildState): boolean {
  return ['uneasy', 'frustrated', 'overloaded', 'dysregulated', 'shutdown_risk'].includes(state);
}

function isHighEscalation(state: ChildState): boolean {
  return ['overloaded', 'frustrated', 'dysregulated', 'shutdown_risk'].includes(state);
}

// ---------------------------------------------------------------------------
// Mini Sparkline SVG
// ---------------------------------------------------------------------------

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data) - 5;
  const max = Math.max(...data) + 5;
  const w = 120;
  const h = 32;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min)) * h;
    return `${x},${y}`;
  });
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mt-1">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Sleep Bar Chart
// ---------------------------------------------------------------------------

const SLEEP_DATA = [7.5, 6.0, 5.5, 8.0, 4.5, 5.2, 5.3];
const SLEEP_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const RECOMMENDED_SLEEP = 9;

function SleepChart() {
  const maxH = Math.max(RECOMMENDED_SLEEP, ...SLEEP_DATA);
  return (
    <div className="flex items-end gap-1 h-[56px] mt-2 relative">
      {/* Recommended line */}
      <div
        className="absolute left-0 right-0 border-t border-dashed"
        style={{
          borderColor: '#00D9A6',
          bottom: `${(RECOMMENDED_SLEEP / maxH) * 100}%`,
        }}
      >
        <span className="absolute -top-3 right-0 text-[8px]" style={{ color: '#00D9A6' }}>
          9h rec.
        </span>
      </div>
      {SLEEP_DATA.map((hrs, i) => {
        const pct = (hrs / maxH) * 100;
        const barColor = hrs >= RECOMMENDED_SLEEP ? '#00D9A6' : hrs >= 7 ? '#F0C038' : '#FF6B6B';
        return (
          <div key={i} className="flex flex-col items-center flex-1 gap-0.5">
            <div
              className="w-full rounded-sm min-w-[8px]"
              style={{ height: `${pct}%`, backgroundColor: barColor, opacity: 0.85 }}
            />
            <span className="text-[7px] text-[#5A7A9B]">{SLEEP_LABELS[i]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Risk Correlation Card
// ---------------------------------------------------------------------------

function CorrelationCard({
  icon,
  text,
  borderColor,
  muted,
  glow,
}: {
  icon: string;
  text: string;
  borderColor: string;
  muted?: boolean;
  glow?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3 transition-all duration-300"
      style={{
        backgroundColor: '#132D46',
        borderLeft: `3px solid ${borderColor}`,
        opacity: muted ? 0.55 : 1,
        boxShadow: glow ? `0 0 12px ${borderColor}44` : 'none',
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-sm shrink-0">{icon}</span>
        <p className="text-[11px] leading-relaxed" style={{ color: muted ? '#5A7A9B' : '#C8D8E8' }}>
          {text}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function BiometricsPanel() {
  const sensorReadings = useAppStore((s) => s.sensorReadings);
  const currentState = useAppStore((s) => s.currentState);

  const { heartRate, hrv, heartRateTrend, activityLevel } = sensorReadings.biometric;
  const { ambientNoise, ambientLight, routineAdherence } = sensorReadings.context;

  const primaryState = currentState.primaryState;
  const escalated = isEscalated(primaryState);
  const highEscalation = isHighEscalation(primaryState);

  // --- HR history for sparkline ---
  const hrHistory = useRef<number[]>([]);

  useEffect(() => {
    const arr = hrHistory.current;
    // Seed with fake data on first render
    if (arr.length === 0) {
      const base = heartRate;
      for (let i = 0; i < 19; i++) {
        arr.push(base + Math.round((Math.random() - 0.5) * 12));
      }
    }
    arr.push(heartRate);
    if (arr.length > 20) arr.splice(0, arr.length - 20);
  }, [heartRate]);

  // Copy for render (useRef doesn't trigger re-render, but heartRate change does)
  const sparkData = useMemo(() => [...hrHistory.current], [heartRate]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Pulse animation speed ---
  const pulseDuration = heartRate > 0 ? (60 / heartRate).toFixed(2) : '0.75';

  // --- Correlation data ---
  const adherencePct = Math.round(routineAdherence * 100);

  return (
    <div
      className="rounded-2xl p-4 space-y-4"
      style={{ backgroundColor: '#0D1B2A', border: '1px solid #1A3A5C' }}
    >
      {/* ---- Wearable badge ---- */}
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-wider" style={{ color: '#5A7A9B' }}>
          Biometrics
        </h3>
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: '#5A7A9B' }}>
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: '#00D9A6' }}
          />
          Apple Watch &middot; Connected
        </div>
      </div>

      {/* ---- HR / HRV row ---- */}
      <div className="grid grid-cols-2 gap-3">
        {/* Heart Rate */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: '#5A7A9B' }}>
            Heart Rate
          </span>
          <div className="flex items-baseline gap-2">
            {/* Pulsing heart */}
            <span
              className="inline-block"
              style={{
                animation: `pulse-heart ${pulseDuration}s ease-in-out infinite`,
                fontSize: '18px',
              }}
            >
              ❤️
            </span>
            <span className="text-3xl font-bold" style={{ color: hrColor(heartRate) }}>
              {heartRate}
            </span>
            <span className="text-xs" style={{ color: '#5A7A9B' }}>
              bpm
            </span>
            <span className="text-lg" style={{ color: hrColor(heartRate) }}>
              {trendArrow(heartRateTrend)}
            </span>
          </div>
          <Sparkline data={sparkData} color={hrColor(heartRate)} />
        </div>

        {/* HRV */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: '#5A7A9B' }}>
            Heart Rate Variability
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold" style={{ color: hrvColor(hrv) }}>
              {hrv}
            </span>
            <span className="text-xs" style={{ color: '#5A7A9B' }}>
              ms
            </span>
          </div>
          <p className="text-[10px] italic" style={{ color: '#5A7A9B' }}>
            {hrv < 40 ? 'Low HRV may indicate stress' : 'HRV within healthy range'}
          </p>
        </div>
      </div>

      {/* ---- Activity Level ---- */}
      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#5A7A9B' }}>
          Activity Level
        </span>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#1A3A5C' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round(activityLevel * 100)}%`,
                backgroundColor: activityColor(activityLevel),
              }}
            />
          </div>
          <span className="text-xs font-semibold text-white whitespace-nowrap">
            {activityLabel(activityLevel)}
          </span>
          <span className="text-[10px]" style={{ color: '#5A7A9B' }}>
            {Math.round(activityLevel * 100)}%
          </span>
        </div>
      </div>

      {/* ---- Sleep Card ---- */}
      <div className="rounded-xl p-3 space-y-1" style={{ backgroundColor: '#132D46' }}>
        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#5A7A9B' }}>
          Last Night&apos;s Sleep
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold" style={{ color: '#FF6B6B' }}>
            5h 20m
          </span>
          <span className="text-[10px]" style={{ color: '#FF6B6B' }}>
            Below recommended (9h)
          </span>
        </div>
        <p className="text-[10px]" style={{ color: '#F0C038' }}>
          Quality: Fragmented — 4 wake-ups
        </p>
        <SleepChart />
      </div>

      {/* ---- Risk Correlations ---- */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: '#5A7A9B' }}>
          AI Risk Correlations
        </span>

        {/* a) Sleep + Noise */}
        <CorrelationCard
          icon="🛏️🔊 → ⚠️"
          text="Low sleep (5h 20m) + elevated ambient noise → 73% higher sensory overload risk today"
          borderColor={highEscalation ? '#FF6B6B' : '#F0C038'}
          muted={!escalated}
          glow={highEscalation}
        />

        {/* b) Movement + Activity */}
        <CorrelationCard
          icon="🏃😴 → 📊"
          text="Reduced movement this morning (below baseline) + after-school fatigue → possible irritability window 3-5 PM"
          borderColor="#F0C038"
          muted={!escalated}
          glow={escalated}
        />

        {/* c) Heart Rate + Historical */}
        <CorrelationCard
          icon="❤️📈 → 🔮"
          text="HR elevated 15% above Leo's baseline. Similar patterns preceded 3 of last 5 difficult evenings."
          borderColor={heartRate > 100 ? '#FF6B6B' : '#F0C038'}
          muted={!escalated && heartRate <= 100}
          glow={heartRate > 100}
        />

        {/* d) Routine Deviation */}
        <CorrelationCard
          icon="📋⏰ → 📊"
          text={`Routine adherence today: ${adherencePct}%. Days below 70% have 2.4x meltdown rate.`}
          borderColor={
            routineAdherence < 0.6 ? '#FF6B6B' : routineAdherence < 0.8 ? '#F0C038' : '#00D9A6'
          }
          muted={routineAdherence >= 0.8 && !escalated}
          glow={routineAdherence < 0.6}
        />

        {/* e) Sensory Load Accumulation (only when escalated) */}
        {escalated && (
          <CorrelationCard
            icon="🌊"
            text={`Cumulative sensory load building: noise ${Math.round(ambientNoise)}dB + bright light (${Math.round(ambientLight)}%) + 2h since last break. Consider proactive sensory break.`}
            borderColor="#FF6B6B"
            glow={highEscalation}
          />
        )}
      </div>

      {/* ---- Pulse keyframes (injected once) ---- */}
      <style>{`
        @keyframes pulse-heart {
          0%, 100% { transform: scale(1); }
          15% { transform: scale(1.3); }
          30% { transform: scale(1); }
          45% { transform: scale(1.15); }
          60% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
