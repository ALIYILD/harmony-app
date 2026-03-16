import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import StressRing from './StressRing';
import type { ChildState, Trajectory } from '../types';

/* ---------- helpers ---------- */

const stateToValue: Record<ChildState, number> = {
  calm: 10,
  engaged: 15,
  uneasy: 35,
  confused: 40,
  sensory_seeking: 45,
  frustrated: 65,
  overloaded: 80,
  dysregulated: 90,
  shutdown_risk: 95,
};

const dotColorClass: Record<string, string> = {
  calm: 'bg-[#38C9F0]',
  engaged: 'bg-[#38C9F0]',
  uneasy: 'bg-[#F0C038]',
  confused: 'bg-[#F0C038]',
  sensory_seeking: 'bg-[#F0C038]',
  frustrated: 'bg-[#FF6B6B]',
  overloaded: 'bg-[#FF6B6B]',
  dysregulated: 'bg-[#8B6EE8]',
  shutdown_risk: 'bg-[#8B6EE8]',
};

function cardBorderColor(val: number): string {
  if (val < 0.35) return 'border-[#00D9A6]';
  if (val < 0.65) return 'border-[#F0C038]';
  return 'border-[#FF6B6B]';
}

function trajectoryDisplay(t: Trajectory): { icon: string; label: string; color: string } {
  switch (t) {
    case 'escalating':
      return { icon: '\u2191', label: 'Escalating \u2014 watch closely', color: '#FF6B6B' };
    case 'de-escalating':
      return { icon: '\u2193', label: 'De-escalating', color: '#00D9A6' };
    default:
      return { icon: '\u2192', label: 'Stable', color: '#F0C038' };
  }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const stateLabelMap: Record<ChildState, string> = {
  calm: 'Calm & Regulated',
  engaged: 'Engaged & Focused',
  uneasy: 'Possibly Uneasy',
  confused: 'May Be Confused',
  frustrated: 'Possibly Frustrated',
  overloaded: 'Likely Overloaded',
  dysregulated: 'Dysregulated',
  shutdown_risk: 'Shutdown Risk',
  sensory_seeking: 'Sensory Seeking',
};

/* ---------- waveform bars ---------- */

function WaveformBars() {
  const barColors = ['#38C9F0', '#4AC4F0', '#5CBEF0', '#6EB8EE', '#7FB2EC', '#8FACEA', '#9FA6E8', '#8B6EE8'];
  return (
    <div className="flex items-end gap-[3px] h-5">
      {barColors.map((color, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full"
          style={{
            backgroundColor: color,
            opacity: 0.85,
            animation: `waveBar 1.2s ease-in-out ${(i + 1) * 0.1}s infinite alternate`,
          }}
        />
      ))}
      <style>{`
        @keyframes waveBar {
          0% { height: 4px; }
          100% { height: 18px; }
        }
      `}</style>
    </div>
  );
}

/* ---------- main component ---------- */

export default function StateMonitor() {
  const { currentState, sensorReadings, stateHistory, childProfile, monitoringActive } =
    useAppStore();

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { primaryState, confidence, confidenceLevel, trajectory, modalityContributions } =
    currentState;
  const ringValue = stateToValue[primaryState];
  const traj = trajectoryDisplay(trajectory);

  /* recent history (last 4 unique state changes) */
  const recentChanges = stateHistory
    .filter((s, i, arr) => i === 0 || s.primaryState !== arr[i - 1].primaryState)
    .slice(-4)
    .reverse();

  /* modality cards data */
  const modalities = [
    {
      label: 'Audio',
      icon: '\uD83C\uDFA4',
      contribution: modalityContributions.audio,
      metric: `Vocal ${sensorReadings.audio.vocalIntensity}dB`,
      intensity: sensorReadings.audio.vocalIntensity / 100,
    },
    {
      label: 'Vision',
      icon: '\uD83D\uDC41\uFE0F',
      contribution: modalityContributions.vision,
      metric: `Tension ${Math.round(sensorReadings.vision.bodyTension * 100)}%`,
      intensity: sensorReadings.vision.bodyTension,
    },
    {
      label: 'Biometric',
      icon: '\u2764\uFE0F',
      contribution: modalityContributions.biometric,
      metric: `${sensorReadings.biometric.heartRate} BPM`,
      intensity: sensorReadings.biometric.heartRate > 110 ? 0.8 : sensorReadings.biometric.heartRate > 90 ? 0.5 : 0.2,
    },
    {
      label: 'Context',
      icon: '\uD83D\uDCC5',
      contribution: modalityContributions.context,
      metric: `Routine ${Math.round(sensorReadings.context.routineAdherence * 100)}%`,
      intensity: 1 - sensorReadings.context.routineAdherence,
    },
  ];

  return (
    <div
      className="min-h-screen w-full max-w-[428px] mx-auto px-4 py-5 flex flex-col gap-5"
      style={{ backgroundColor: '#060E1C', color: '#C8D4E4' }}
    >
      {/* ---- Top Section ---- */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${dotColorClass[primaryState] || 'bg-[#38C9F0]'}`}
            style={{ animation: monitoringActive ? 'pulse 2s ease-in-out infinite' : 'none' }}
          />
          <h1 className="text-lg font-bold text-white">Monitoring {childProfile.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <WaveformBars />
          <span className="text-xs font-medium" style={{ color: '#5A7A9B' }}>
            {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ---- Stress Ring ---- */}
      <div className="flex justify-center py-2">
        <StressRing
          value={ringValue}
          size={200}
          state={primaryState}
          confidence={confidence}
          confidenceLevel={confidenceLevel}
        />
      </div>

      {/* ---- Trajectory ---- */}
      <div
        className="flex items-center justify-center gap-2 rounded-2xl py-3 px-4 border border-[#1A3A5C]"
        style={{ backgroundColor: '#0D1B2A' }}
      >
        <span className="text-xl font-bold" style={{ color: traj.color }}>
          {traj.icon}
        </span>
        <span className="text-sm font-medium" style={{ color: traj.color }}>
          {traj.label}
        </span>
      </div>

      {/* ---- Modality Cards ---- */}
      <div className="grid grid-cols-2 gap-3">
        {modalities.map((m) => (
          <div
            key={m.label}
            className={`rounded-2xl border-l-4 border border-[#1A3A5C] p-3 ${cardBorderColor(m.intensity)}`}
            style={{ backgroundColor: '#0D1B2A' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">{m.icon}</span>
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#5A7A9B' }}>{m.label}</span>
            </div>
            <p className="text-xs font-medium text-white">
              {m.metric}
            </p>
            <p className="text-[10px] mt-1" style={{ color: '#5A7A9B' }}>
              Contribution: {Math.round(m.contribution * 100)}%
            </p>
          </div>
        ))}
      </div>

      {/* ---- Recent Timeline ---- */}
      <div
        className="rounded-2xl p-4 border border-[#1A3A5C]"
        style={{ backgroundColor: '#0D1B2A' }}
      >
        <h2 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: '#5A7A9B' }}>Recent Timeline</h2>
        {recentChanges.length === 0 ? (
          <p className="text-xs" style={{ color: '#5A7A9B' }}>
            No state changes recorded yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentChanges.map((s, i) => (
              <div key={`${s.timestamp}-${i}`} className="flex items-center gap-3">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      s.primaryState === 'calm' || s.primaryState === 'engaged'
                        ? '#00D9A6'
                        : s.primaryState === 'frustrated' || s.primaryState === 'overloaded'
                          ? '#FF6B6B'
                          : s.primaryState === 'dysregulated' || s.primaryState === 'shutdown_risk'
                            ? '#8B6EE8'
                            : '#F0C038',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-white">{stateLabelMap[s.primaryState]}</span>
                </div>
                <span className="text-[10px] shrink-0" style={{ color: '#5A7A9B' }}>
                  {timeAgo(s.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
