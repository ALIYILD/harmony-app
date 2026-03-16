import { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useSimulation } from './hooks/useSimulation';
import StateMonitor from './components/StateMonitor';
import CaregiverCoPilot from './components/CaregiverCoPilot';
import EventLogger from './components/EventLogger';
import DailySummary from './components/DailySummary';
import ChildProfileView from './components/ChildProfileView';
import type { TabId } from './types';

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'monitor', label: 'Monitor', icon: '\u{1F4E1}' },
  { id: 'copilot', label: 'Co-Pilot', icon: '\u{1F9ED}' },
  { id: 'log', label: 'Log', icon: '\u{1F4DD}' },
  { id: 'summary', label: 'Summary', icon: '\u{1F4CA}' },
  { id: 'profile', label: 'Profile', icon: '\u{1F464}' },
];

const toastConfig = {
  info: { border: 'border-[#38C9F0]', icon: '\u{1F4A1}' },
  warning: { border: 'border-[#F0C038]', icon: '\u26A0\uFE0F' },
  danger: { border: 'border-[#FF6B6B]', icon: '\u{1F6A8}' },
  success: { border: 'border-[#00D9A6]', icon: '\u2713' },
};

function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  useEffect(() => {
    if (toasts.length === 0) return;
    const latest = toasts[toasts.length - 1];
    const timer = setTimeout(() => {
      removeToast(latest.id);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toasts, removeToast]);

  return (
    <div className="fixed top-16 right-4 z-[100] flex flex-col gap-2 max-sm:left-4 max-sm:right-4 max-sm:items-center lg:right-8 lg:top-20 lg:max-w-sm">
      {toasts.map((toast) => {
        const cfg = toastConfig[toast.type];
        return (
          <div
            key={toast.id}
            className={`bg-[#0D1B2A] border border-[#1A3A5C] ${cfg.border} border-l-4 rounded-xl p-3 shadow-2xl flex items-start gap-2 animate-toast-in w-full`}
          >
            <span className="text-lg shrink-0">{cfg.icon}</span>
            <p className="text-white text-sm font-medium leading-tight flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#5A7A9B] hover:text-white text-xs ml-2 shrink-0"
            >
              x
            </button>
          </div>
        );
      })}
    </div>
  );
}

const LogoSvg = () => (
  <svg width="36" height="36" viewBox="0 0 68 68" fill="none">
    <defs>
      <linearGradient id="logo-grad" x1="0" y1="0" x2="68" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38C9F0"/>
        <stop offset="100%" stopColor="#8B6EE8"/>
      </linearGradient>
    </defs>
    <circle cx="24" cy="18" r="6" fill="#38C9F0"/>
    <circle cx="42" cy="14" r="7.5" fill="#8B6EE8"/>
    <path d="M6 56 C12 34, 20 40, 28 30 C33 23, 36 28, 40 32 C44 36, 52 26, 62 56" stroke="url(#logo-grad)" strokeWidth="5.5" strokeLinecap="round" fill="none"/>
  </svg>
);

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
    'Phase 3: Sensory overload \u2014 intervention sent',
    'Phase 4: De-escalating with support',
    'Phase 5: Resolved \u2014 calm restored',
  ];

  return (
    <div className="min-h-screen bg-[#060E1C] flex flex-col font-glory">
      {/* Global Toast System */}
      <ToastContainer />

      {/* Top Header Bar */}
      <header className="sticky top-0 z-50 bg-[#0D1B2A]/90 backdrop-blur-lg border-b border-[#1A3A5C] px-4 py-3 flex items-center justify-between lg:px-8">
        <div className="flex items-center gap-2">
          <div className="lg:hidden">
            <LogoSvg />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none lg:text-lg">HarmonyAlert</h1>
            <p className="text-[10px] text-[#5A7A9B] font-semibold tracking-wider uppercase lg:text-xs">Real-time coaching</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden lg:inline text-[#5A7A9B] text-sm italic">Connection, not correction.</span>
          {isSimulating && (
            <span className="text-[10px] font-semibold text-[#38C9F0] bg-[#38C9F0]/10 px-2 py-1 rounded-full animate-pulse lg:text-xs lg:px-3">
              LIVE DEMO
            </span>
          )}
        </div>
      </header>

      {/* Mobile Simulation Control Bar */}
      <div className="lg:hidden sticky top-[52px] z-40 bg-[#0D1B2A]/95 backdrop-blur border-b border-[#1A3A5C] px-4 py-2 flex items-center gap-2">
        <button
          onClick={run}
          disabled={isSimulating}
          className="px-4 py-2 bg-gradient-to-r from-[#38C9F0] to-[#8B6EE8] text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-[#38C9F0]/20 active:scale-95"
        >
          {isSimulating ? '\u23F3 Simulating...' : '\u25B6 Run Demo Scenario'}
        </button>
        <button
          onClick={reset}
          className="px-3 py-2 bg-[#132D46] text-[#5A7A9B] text-xs font-semibold rounded-xl hover:bg-[#1A3A5C] hover:text-[#C8D4E4] transition-all active:scale-95"
        >
          \u21BA Reset
        </button>
        {isSimulating && (
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-[#132D46] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#38C9F0] to-[#8B6EE8] rounded-full transition-all duration-1000"
                style={{ width: `${(simulationPhase / 5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-[#5A7A9B] whitespace-nowrap">
              {phaseLabels[simulationPhase]}
            </span>
          </div>
        )}
      </div>

      {/* Desktop: sidebar + content | Mobile: content only */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-[220px] shrink-0 bg-[#0D1B2A] border-r border-[#1A3A5C] overflow-y-auto">
          {/* Sidebar logo */}
          <div className="px-4 pt-5 pb-4 flex items-center gap-2 border-b border-[#1A3A5C]">
            <LogoSvg />
            <div>
              <p className="text-xs font-bold text-white leading-none">Harmony</p>
              <p className="text-[10px] text-[#5A7A9B] font-semibold">Alert</p>
            </div>
          </div>

          {/* Tab buttons */}
          <nav className="flex-1 flex flex-col gap-1 p-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#38C9F0]/10 text-[#38C9F0] border-l-[3px] border-[#38C9F0]'
                    : 'text-[#5A7A9B] hover:bg-[#132D46] hover:text-[#C8D4E4]'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Sim controls at bottom */}
          <div className="p-3 border-t border-[#1A3A5C] flex flex-col gap-2">
            {isSimulating && (
              <div className="mb-2">
                <div className="h-1.5 bg-[#132D46] rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-gradient-to-r from-[#38C9F0] to-[#8B6EE8] rounded-full transition-all duration-1000"
                    style={{ width: `${(simulationPhase / 5) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] font-medium text-[#5A7A9B] text-center">
                  {phaseLabels[simulationPhase]}
                </p>
              </div>
            )}
            <button
              onClick={run}
              disabled={isSimulating}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-[#38C9F0] to-[#8B6EE8] text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-[#38C9F0]/20 active:scale-95"
            >
              {isSimulating ? '\u23F3 Simulating...' : '\u25B6 Run Demo'}
            </button>
            <button
              onClick={reset}
              className="w-full px-3 py-2 bg-[#132D46] text-[#5A7A9B] text-sm font-semibold rounded-xl hover:bg-[#1A3A5C] hover:text-[#C8D4E4] transition-all active:scale-95"
            >
              \u21BA Reset
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-4">
          <div className="lg:max-w-3xl lg:mx-auto">
            <div key={activeTab} className="animate-fade-in">
              {renderScreen()}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0D1B2A]/95 backdrop-blur-lg border-t border-[#1A3A5C] px-2 py-1.5 flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
              activeTab === tab.id
                ? 'text-[#38C9F0] bg-[#38C9F0]/10'
                : 'text-[#5A7A9B]'
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
