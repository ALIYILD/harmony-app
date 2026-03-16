import { useAppStore } from './store/useAppStore';
import { useSimulation } from './hooks/useSimulation';
import StateMonitor from './components/StateMonitor';
import CaregiverCoPilot from './components/CaregiverCoPilot';
import EventLogger from './components/EventLogger';
import DailySummary from './components/DailySummary';
import ChildProfileView from './components/ChildProfileView';
import type { TabId } from './types';

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'monitor', label: 'Monitor', icon: '📡' },
  { id: 'copilot', label: 'Co-Pilot', icon: '🧭' },
  { id: 'log', label: 'Log', icon: '📝' },
  { id: 'summary', label: 'Summary', icon: '📊' },
  { id: 'profile', label: 'Profile', icon: '👤' },
];

export default function App() {
  const { activeTab, setActiveTab, isSimulating, simulationPhase } = useAppStore();
  const { run, reset } = useSimulation();

  const renderScreen = () => {
    switch (activeTab) {
      case 'monitor': return <StateMonitor />;
      case 'copilot': return <CaregiverCoPilot />;
      case 'log': return <EventLogger />;
      case 'summary': return <DailySummary />;
      case 'profile': return <ChildProfileView />;
    }
  };

  const phaseLabels = [
    'Ready',
    'Phase 1: Early signs detected',
    'Phase 2: Frustration building',
    'Phase 3: Sensory overload — intervention sent',
    'Phase 4: De-escalating with support',
    'Phase 5: Resolved — calm restored',
  ];

  return (
    <div className="min-h-screen bg-navy flex flex-col font-glory">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 bg-navy-card/90 backdrop-blur-lg border-b border-navy-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 68 68" fill="none">
            <defs>
              <linearGradient id="logo-grad" x1="0" y1="68" x2="68" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38C9F0"/>
                <stop offset="100%" stopColor="#8B6EE8"/>
              </linearGradient>
            </defs>
            <path d="M20 48C20 48 16 38 18 32C20 26 26 28 28 24C30 20 28 16 28 16" stroke="url(#logo-grad)" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <circle cx="28" cy="12" r="5" fill="#38C9F0"/>
            <path d="M32 48C32 48 36 34 38 30C40 26 44 28 46 24C48 20 46 18 46 18" stroke="url(#logo-grad)" strokeWidth="4" strokeLinecap="round" fill="none"/>
            <circle cx="44" cy="14" r="6" fill="#8B6EE8"/>
          </svg>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">HarmonyAlert</h1>
            <p className="text-[10px] text-muted font-semibold tracking-wider uppercase">Real-time coaching</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSimulating && (
            <span className="text-[10px] font-semibold text-cyan bg-cyan/10 px-2 py-1 rounded-full animate-pulse">
              LIVE DEMO
            </span>
          )}
        </div>
      </header>

      {/* Simulation Control Bar */}
      <div className="sticky top-[52px] z-40 bg-navy-card/95 backdrop-blur border-b border-navy-border px-4 py-2 flex items-center gap-2">
        <button
          onClick={run}
          disabled={isSimulating}
          className="px-4 py-2 bg-gradient-to-r from-cyan to-lavender text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-cyan/20 active:scale-95"
        >
          {isSimulating ? '⏳ Simulating...' : '▶ Run Demo Scenario'}
        </button>
        <button
          onClick={reset}
          className="px-3 py-2 bg-navy-hover text-muted text-xs font-semibold rounded-xl hover:bg-navy-border hover:text-body transition-all active:scale-95"
        >
          ↺ Reset
        </button>
        {isSimulating && (
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-navy-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan to-lavender rounded-full transition-all duration-1000"
                style={{ width: `${(simulationPhase / 5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-muted whitespace-nowrap">
              {phaseLabels[simulationPhase]}
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {renderScreen()}
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-navy-card/95 backdrop-blur-lg border-t border-navy-border px-2 py-1.5 flex justify-around max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'text-cyan bg-cyan/10'
                : 'text-muted'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
