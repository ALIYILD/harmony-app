import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import StressRing from './StressRing';
import AudioAnalyzer from './AudioAnalyzer';
import CameraFeed from './CameraFeed';
import BiometricsPanel from './BiometricsPanel';
import type { ChildState, Trajectory } from '../types';

/* ---------- helpers ---------- */

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

/* ---------- main component ---------- */

export default function StateMonitor() {
  const { currentState, sensorReadings, stateHistory, childProfile, monitoringActive } = useAppStore();
  const [now, setNow] = useState(new Date());
  const [activeModality, setActiveModality] = useState<'overview' | 'audio' | 'camera' | 'biometrics'>('overview');

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

  const modalityTabs = [
    { id: 'overview' as const, label: 'Overview', icon: '📊' },
    { id: 'audio' as const, label: 'Audio', icon: '🎤' },
    { id: 'camera' as const, label: 'Camera', icon: '📷' },
    { id: 'biometrics' as const, label: 'Biometrics', icon: '❤️' },
  ];

  return (
    <div className="min-h-screen w-full px-4 py-5 flex flex-col gap-4" style={{ backgroundColor: '#060E1C', color: '#C8D4E4' }}>
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-4">

        {/* ---- Top Section ---- */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${dotColorClass[primaryState] || 'bg-[#38C9F0]'}`}
              style={{ animation: monitoringActive ? 'pulse 2s ease-in-out infinite' : 'none' }}
            />
            <h1 className="text-lg font-bold text-white">Monitoring {childProfile.name}</h1>
          </div>
          <span className="text-xs font-medium" style={{ color: '#5A7A9B' }}>
            {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>

        {/* ---- Desktop: Side-by-side layout / Mobile: stacked ---- */}
        <div className="flex flex-col lg:flex-row gap-4">

          {/* Left column: Stress Ring + Trajectory + Modality summary */}
          <div className="flex flex-col gap-4 lg:w-[320px] shrink-0">
            {/* Stress Ring */}
            <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4 flex flex-col items-center">
              <StressRing value={ringValue} size={180} state={primaryState} confidence={confidence} confidenceLevel={confidenceLevel} />
            </div>

            {/* Trajectory */}
            <div className="flex items-center justify-center gap-2 rounded-2xl py-3 px-4 border border-[#1A3A5C] bg-[#0D1B2A]">
              <span className="text-xl font-bold" style={{ color: traj.color }}>{traj.icon}</span>
              <span className="text-sm font-medium" style={{ color: traj.color }}>{traj.label}</span>
            </div>

            {/* Modality contribution bars */}
            <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[#5A7A9B] mb-3">Modality Contributions</h2>
              <div className="space-y-2.5">
                {[
                  { label: 'Audio', value: modalityContributions.audio, color: '#38C9F0' },
                  { label: 'Vision', value: modalityContributions.vision, color: '#6B7CE8' },
                  { label: 'Biometric', value: modalityContributions.biometric, color: '#8B6EE8' },
                  { label: 'Context', value: modalityContributions.context, color: '#00D9A6' },
                ].map((m) => (
                  <div key={m.label} className="flex items-center gap-2">
                    <span className="text-[10px] font-medium text-[#5A7A9B] w-16">{m.label}</span>
                    <div className="flex-1 h-2 bg-[#132D46] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.value * 100}%`, backgroundColor: m.color }} />
                    </div>
                    <span className="text-[10px] font-bold text-white w-8 text-right">{Math.round(m.value * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Timeline */}
            <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-[#5A7A9B] mb-3">Recent Timeline</h2>
              {recentChanges.length === 0 ? (
                <p className="text-xs text-[#5A7A9B]">No state changes recorded yet. Run the demo to see transitions.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {recentChanges.map((s, i) => (
                    <div key={`${s.timestamp}-${i}`} className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{
                        backgroundColor:
                          s.primaryState === 'calm' || s.primaryState === 'engaged' ? '#00D9A6'
                          : s.primaryState === 'frustrated' || s.primaryState === 'overloaded' ? '#FF6B6B'
                          : s.primaryState === 'dysregulated' || s.primaryState === 'shutdown_risk' ? '#8B6EE8'
                          : '#F0C038',
                      }} />
                      <span className="text-xs font-medium text-white flex-1">{stateLabelMap[s.primaryState]}</span>
                      <span className="text-[10px] text-[#5A7A9B]">{timeAgo(s.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Modality detail panels */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Modality tab switcher */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {modalityTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveModality(tab.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    activeModality === tab.id
                      ? 'bg-[#38C9F0]/15 text-[#38C9F0] border border-[#38C9F0]/30'
                      : 'bg-[#0D1B2A] text-[#5A7A9B] border border-[#1A3A5C] hover:text-[#C8D4E4]'
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active modality panel */}
            <div className="animate-fade-in" key={activeModality}>
              {activeModality === 'overview' && (
                <div className="space-y-4">
                  <AudioAnalyzer />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <BiometricsPanel />
                  </div>
                </div>
              )}
              {activeModality === 'audio' && <AudioAnalyzer />}
              {activeModality === 'camera' && <CameraFeed />}
              {activeModality === 'biometrics' && <BiometricsPanel />}
            </div>

            {/* Quick sensor stats (always visible) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#5A7A9B] uppercase tracking-wider">Heart Rate</p>
                <p className="text-xl font-bold text-white">{sensorReadings.biometric.heartRate}</p>
                <p className="text-[10px] text-[#5A7A9B]">BPM</p>
              </div>
              <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#5A7A9B] uppercase tracking-wider">Vocal Intensity</p>
                <p className="text-xl font-bold text-white">{sensorReadings.audio.vocalIntensity}</p>
                <p className="text-[10px] text-[#5A7A9B]">dB</p>
              </div>
              <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#5A7A9B] uppercase tracking-wider">Noise Level</p>
                <p className="text-xl font-bold text-white">{sensorReadings.context.ambientNoise}</p>
                <p className="text-[10px] text-[#5A7A9B]">dB</p>
              </div>
              <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-xl p-3 text-center">
                <p className="text-[10px] text-[#5A7A9B] uppercase tracking-wider">Routine</p>
                <p className="text-xl font-bold text-white">{Math.round(sensorReadings.context.routineAdherence * 100)}%</p>
                <p className="text-[10px] text-[#5A7A9B]">adherence</p>
              </div>
            </div>
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
