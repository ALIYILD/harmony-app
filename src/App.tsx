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
    <div className="min-h-screen bg-[#F8F7FF] flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-purple-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C5CE7] to-[#FF7675] flex items-center justify-center text-white text-sm font-bold">H</div>
          <div>
            <h1 className="text-sm font-bold text-[#2D3436] leading-none">Harmony</h1>
            <p className="text-[10px] text-[#B2BEC3] font-medium tracking-wider uppercase">Autism Support Co-Pilot</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSimulating && (
            <span className="text-[10px] font-semibold text-[#FF7675] bg-red-50 px-2 py-1 rounded-full animate-pulse">
              LIVE DEMO
            </span>
          )}
        </div>
      </header>

      {/* Simulation Control Bar */}
      <div className="sticky top-[52px] z-40 bg-white/95 backdrop-blur border-b border-purple-50 px-4 py-2 flex items-center gap-2">
        <button
          onClick={run}
          disabled={isSimulating}
          className="px-4 py-2 bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all hover:shadow-lg active:scale-95"
        >
          {isSimulating ? '⏳ Simulating...' : '▶ Run Demo Scenario'}
        </button>
        <button
          onClick={reset}
          className="px-3 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-all active:scale-95"
        >
          ↺ Reset
        </button>
        {isSimulating && (
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#FF7675] rounded-full transition-all duration-1000"
                style={{ width: `${(simulationPhase / 5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-[#B2BEC3] whitespace-nowrap">
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
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-purple-100 px-2 py-1.5 flex justify-around max-w-lg mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'text-[#6C5CE7] bg-purple-50'
                : 'text-[#B2BEC3]'
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
