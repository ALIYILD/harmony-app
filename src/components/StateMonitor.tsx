import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import StressRing from './StressRing';
import AudioAnalyzer from './AudioAnalyzer';
import CameraFeed from './CameraFeed';
import BiometricsPanel from './BiometricsPanel';
import type { ChildState, Trajectory } from '../types';

const stateToValue: Record<ChildState, number> = {
  calm: 10, engaged: 15, uneasy: 35, confused: 40,
  sensory_seeking: 45, frustrated: 65, overloaded: 80,
  dysregulated: 90, shutdown_risk: 95,
};

const dotColorClass: Record<string, string> = {
  calm: 'bg-[#38C9F0]', engaged: 'bg-[#38C9F0]',
  uneasy: 'bg-[#F0C038]', confused: 'bg-[#F0C038]', sensory_seeking: 'bg-[#F0C038]',
  frustrated: 'bg-[#FF6B6B]', overloaded: 'bg-[#FF6B6B]',
  dysregulated: 'bg-[#8B6EE8]', shutdown_risk: 'bg-[#8B6EE8]',
};

function trajectoryDisplay(t: Trajectory): { icon: string; label: string; color: string } {
  switch (t) {
    case 'escalating': return { icon: '\u2191', label: 'Escalating \u2014 watch closely', color: '#FF6B6B' };
    case 'de-escalating': return { icon: '\u2193', label: 'De-escalating', color: '#00D9A6' };
    default: return { icon: '\u2192', label: 'Stable', color: '#38C9F0' };
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
  calm: 'Calm & Regulated', engaged: 'Engaged & Focused',
  uneasy: 'Possibly Uneasy', confused: 'May Be Confused',
  frustrated: 'Possibly Frustrated', overloaded: 'Likely Overloaded',
  dysregulated: 'Dysregulated', shutdown_risk: 'Shutdown Risk',
  sensory_seeking: 'Sensory Seeking',
};

export default function StateMonitor() {
  const { currentState, sensorReadings, stateHistory, childProfile, monitoringActive } = useAppStore();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const { primaryState, confidence, confidenceLevel, trajectory, modalityContributions } = currentState;
  const ringValue = stateToValue[primaryState];
  const traj = trajectoryDisplay(trajectory);

  const recentChanges = stateHistory
    .filter((s, i, arr) => i === 0 || s.primaryState !== arr[i - 1].primaryState)
    .slice(-4)
    .reverse();

  return (
    <div className="min-h-screen w-full px-3 lg:px-6 py-4" style={{ backgroundColor: '#060E1C', color: '#C8D4E4' }}>
      <div className="max-w-[1600px] mx-auto w-full space-y-4">

        {/* ═══ Header ═══ */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${dotColorClass[primaryState] || 'bg-[#38C9F0]'}`}
              style={{ animation: monitoringActive ? 'pulse 2s ease-in-out infinite' : 'none' }}
            />
            <h1 className="text-lg font-bold text-white">Monitoring {childProfile.name}</h1>
            <span className="text-[10px] font-semibold text-[#38C9F0] bg-[#38C9F0]/10 px-2 py-0.5 rounded-full">LIVE</span>
          </div>
          <span className="text-xs font-medium text-[#5A7A9B]">
            {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* ═══ Top Row: Stress Ring + Quick Stats ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Stress Ring + Trajectory */}
          <div className="lg:col-span-3">
            <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4 flex flex-col items-center">
              <StressRing value={ringValue} size={160} state={primaryState} confidence={confidence} confidenceLevel={confidenceLevel} />
              <div className="flex items-center gap-2 mt-3 w-full justify-center rounded-xl py-2 px-3 bg-[#132D46]">
                <span className="text-lg font-bold" style={{ color: traj.color }}>{traj.icon}</span>
                <span className="text-sm font-semibold" style={{ color: traj.color }}>{traj.label}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats + Modality Fusion */}
          <div className="lg:col-span-5">
            <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4 h-full">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[#5A7A9B] mb-3">Live Sensor Readings</h2>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Heart Rate', value: sensorReadings.biometric.heartRate, unit: 'BPM', color: sensorReadings.biometric.heartRate > 110 ? '#FF6B6B' : sensorReadings.biometric.heartRate > 90 ? '#F0C038' : '#00D9A6' },
                  { label: 'Vocal Intensity', value: sensorReadings.audio.vocalIntensity, unit: 'dB', color: sensorReadings.audio.vocalIntensity > 60 ? '#FF6B6B' : sensorReadings.audio.vocalIntensity > 35 ? '#F0C038' : '#00D9A6' },
                  { label: 'HRV', value: sensorReadings.biometric.hrv, unit: 'ms', color: sensorReadings.biometric.hrv < 25 ? '#FF6B6B' : sensorReadings.biometric.hrv < 40 ? '#F0C038' : '#00D9A6' },
                  { label: 'Noise', value: sensorReadings.context.ambientNoise, unit: 'dB', color: sensorReadings.context.ambientNoise > 60 ? '#FF6B6B' : sensorReadings.context.ambientNoise > 40 ? '#F0C038' : '#00D9A6' },
                  { label: 'Routine', value: Math.round(sensorReadings.context.routineAdherence * 100), unit: '%', color: sensorReadings.context.routineAdherence < 0.5 ? '#FF6B6B' : sensorReadings.context.routineAdherence < 0.7 ? '#F0C038' : '#00D9A6' },
                  { label: 'Breathing', value: sensorReadings.audio.breathingRate, unit: '/min', color: sensorReadings.audio.breathingRate > 28 ? '#FF6B6B' : sensorReadings.audio.breathingRate > 22 ? '#F0C038' : '#00D9A6' },
                ].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-[9px] text-[#5A7A9B] uppercase tracking-wider font-semibold">{s.label}</p>
                    <p className="text-xl font-bold transition-colors duration-500" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[9px] text-[#5A7A9B]">{s.unit}</p>
                  </div>
                ))}
              </div>
              {/* Modality Fusion */}
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[#5A7A9B] mb-2">Modality Fusion</h2>
              <div className="space-y-1.5">
                {[
                  { label: 'Audio', value: modalityContributions.audio, color: '#38C9F0', icon: '🎤' },
                  { label: 'Vision', value: modalityContributions.vision, color: '#6B7CE8', icon: '👁️' },
                  { label: 'Biometric', value: modalityContributions.biometric, color: '#8B6EE8', icon: '❤️' },
                  { label: 'Context', value: modalityContributions.context, color: '#00D9A6', icon: '📍' },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-2">
                    <span className="text-xs">{m.icon}</span>
                    <span className="text-[10px] font-medium text-[#5A7A9B] w-14">{m.label}</span>
                    <div className="flex-1 h-1.5 bg-[#132D46] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.value * 100}%`, backgroundColor: m.color }} />
                    </div>
                    <span className="text-[10px] font-bold text-white w-8 text-right">{Math.round(m.value * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-4">
            <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4 h-full">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[#5A7A9B] mb-3">State Timeline</h2>
              {recentChanges.length === 0 ? (
                <p className="text-xs text-[#5A7A9B]">Run the demo to see live state transitions.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {recentChanges.map((s, i) => (
                    <div key={`${s.timestamp}-${i}`} className="flex items-center gap-3 bg-[#132D46] rounded-xl p-2.5">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{
                        backgroundColor:
                          s.primaryState === 'calm' || s.primaryState === 'engaged' ? '#00D9A6'
                          : s.primaryState === 'frustrated' || s.primaryState === 'overloaded' ? '#FF6B6B'
                          : s.primaryState === 'dysregulated' || s.primaryState === 'shutdown_risk' ? '#8B6EE8'
                          : '#F0C038',
                      }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-semibold text-white block">{stateLabelMap[s.primaryState]}</span>
                        <span className="text-[10px] text-[#5A7A9B]">{timeAgo(s.timestamp)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Context snapshot */}
              <div className="mt-4 pt-3 border-t border-[#1A3A5C]">
                <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[#5A7A9B] mb-2">Context</h2>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-[#5A7A9B]">Time:</span> <span className="text-white font-medium">{sensorReadings.context.timeOfDay}</span></div>
                  <div><span className="text-[#5A7A9B]">Day:</span> <span className="text-white font-medium capitalize">{sensorReadings.context.dayType}</span></div>
                  <div><span className="text-[#5A7A9B]">Since transition:</span> <span className="text-white font-medium">{sensorReadings.context.minutesSinceTransition}m</span></div>
                  <div><span className="text-[#5A7A9B]">Since meal:</span> <span className="text-white font-medium" style={{ color: sensorReadings.context.minutesSinceMeal > 120 ? '#F0C038' : '#C8D4E4' }}>{sensorReadings.context.minutesSinceMeal}m</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ Main Panels: Camera | Audio | Biometrics — all visible ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Camera Feed */}
          <div>
            <CameraFeed />
          </div>

          {/* Audio Analyzer */}
          <div>
            <AudioAnalyzer />
          </div>

          {/* Biometrics + Correlations */}
          <div>
            <BiometricsPanel />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
