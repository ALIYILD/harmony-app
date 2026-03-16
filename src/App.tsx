import { useState, useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { useSimulation } from './hooks/useSimulation';
import StateMonitor from './components/StateMonitor';
import CaregiverCoPilot from './components/CaregiverCoPilot';
import EventLogger from './components/EventLogger';
import DailySummary from './components/DailySummary';
import ChildProfileView from './components/ChildProfileView';
import GestureDictionary from './components/GestureDictionary';
import HomeDashboard from './components/HomeDashboard';
import SOSGuide from './components/SOSGuide';
import CalmToolkit from './components/CalmToolkit';
import EnvironmentScanner from './components/EnvironmentScanner';
import VideoAnalysis from './components/VideoAnalysis';
import ParentToneCoach from './components/ParentToneCoach';
import SessionTracker from './components/SessionTracker';
import PricingPage from './components/PricingPage';
import HarmonyChat from './components/HarmonyChat';
import VoiceAnalysis from './components/VoiceAnalysis';
import type { TabId } from './types';

const tabs: { id: TabId; label: string; icon: string; subtitle: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠', subtitle: 'Overview & summary' },
  { id: 'analysis', label: 'Analysis', icon: '📡', subtitle: 'Live sensors & camera' },
  { id: 'guide', label: 'Guide', icon: '💡', subtitle: 'What to do now' },
  { id: 'log', label: 'Log', icon: '✏️', subtitle: 'Record events' },
  { id: 'insights', label: 'Insights', icon: '📊', subtitle: 'Patterns & trends' },
  { id: 'leo', label: 'Leo', icon: '💙', subtitle: 'Profile & signs' },
];

const toastConfig = {
  info: { border: 'border-[#38C9F0]', icon: '💡' },
  warning: { border: 'border-[#F0C038]', icon: '⚠️' },
  danger: { border: 'border-[#FF6B6B]', icon: '🚨' },
  success: { border: 'border-[#00D9A6]', icon: '✓' },
};

const stateColors: Record<string, { emoji: string; color: string }> = {
  calm: { emoji: '🟢', color: 'bg-green-500/15 text-green-400' },
  engaged: { emoji: '🟢', color: 'bg-green-500/15 text-green-400' },
  uneasy: { emoji: '🟡', color: 'bg-yellow-500/15 text-yellow-400' },
  confused: { emoji: '🟡', color: 'bg-yellow-500/15 text-yellow-400' },
  frustrated: { emoji: '🟠', color: 'bg-orange-500/15 text-orange-400' },
  overloaded: { emoji: '🔴', color: 'bg-red-500/15 text-red-400' },
  dysregulated: { emoji: '🔴', color: 'bg-red-500/15 text-red-400' },
  shutdown_risk: { emoji: '🔴', color: 'bg-red-500/15 text-red-400' },
  sensory_seeking: { emoji: '🟡', color: 'bg-yellow-500/15 text-yellow-400' },
};

function LeoTab() {
  const [subTab, setSubTab] = useState<'profile' | 'signs'>('profile');
  return (
    <div>
      <div className="flex gap-2 px-4 pt-4 pb-2">
        <button
          onClick={() => setSubTab('profile')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            subTab === 'profile'
              ? 'bg-[#38C9F0]/15 text-[#38C9F0] border border-[#38C9F0]/30'
              : 'bg-[#132D46] text-[#5A7A9B] hover:bg-[#1A3A5C] hover:text-[#C8D4E4]'
          }`}
        >
          About Leo
        </button>
        <button
          onClick={() => setSubTab('signs')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            subTab === 'signs'
              ? 'bg-[#38C9F0]/15 text-[#38C9F0] border border-[#38C9F0]/30'
              : 'bg-[#132D46] text-[#5A7A9B] hover:bg-[#1A3A5C] hover:text-[#C8D4E4]'
          }`}
        >
          Leo's Signs
        </button>
      </div>
      {subTab === 'profile' ? <ChildProfileView /> : <GestureDictionary />}
    </div>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useAppStore();

  useEffect(() => {
    if (toasts.length === 0) return;
    const latest = toasts[toasts.length - 1];
    const timer = setTimeout(() => {
      removeToast(latest.id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts, removeToast]);

  return (
    <div className="fixed top-16 right-4 z-[100] flex flex-col gap-2 max-sm:left-4 max-sm:right-4 max-sm:items-center lg:right-8 lg:top-20 lg:max-w-sm">
      {toasts.map((toast) => {
        const cfg = toastConfig[toast.type];
        return (
          <div
            key={toast.id}
            className={`bg-[#0D1B2A] border border-[#1A3A5C] ${cfg.border} border-l-4 rounded-xl p-4 shadow-2xl flex items-start gap-3 animate-toast-in w-full`}
          >
            <span className="text-xl shrink-0">{cfg.icon}</span>
            <p className="text-white text-base font-medium leading-snug flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#5A7A9B] hover:text-white text-sm ml-2 shrink-0"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

const LogoSvg = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 220 175" fill="none">
    <defs>
      <linearGradient id="logo-child" x1="0" y1="100" x2="110" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#5ECEF3"/>
        <stop offset="100%" stopColor="#6BB4EA"/>
      </linearGradient>
      <linearGradient id="logo-parent-body" x1="100" y1="40" x2="190" y2="170" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#7BA4EC"/>
        <stop offset="100%" stopColor="#9088F0"/>
      </linearGradient>
      <linearGradient id="logo-parent-head" x1="130" y1="5" x2="155" y2="45" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#9B90F2"/>
        <stop offset="100%" stopColor="#8088EE"/>
      </linearGradient>
    </defs>
    {/* Child head */}
    <circle cx="90" cy="65" r="15" fill="url(#logo-child)"/>
    {/* Parent head */}
    <circle cx="148" cy="25" r="20" fill="url(#logo-parent-head)"/>
    {/* Child body — thin wave flowing to the left */}
    <path d="M5 160 C20 145, 35 130, 55 115 C70 103, 80 100, 92 105 C100 109, 105 115, 112 118" fill="url(#logo-child)"/>
    {/* Parent body — large filled curve flowing to the right */}
    <path d="M112 118 C120 122, 128 118, 135 108 C142 96, 148 75, 152 62 C155 52, 160 50, 166 58 C175 72, 182 100, 190 130 C195 148, 200 160, 210 170 L112 170 Z" fill="url(#logo-parent-body)"/>
  </svg>
);

export default function App() {
  const { activeTab, setActiveTab, isSimulating, simulationPhase, currentState } = useAppStore();
  const { run, reset } = useSimulation();
  const [demoExpanded, setDemoExpanded] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showCalm, setShowCalm] = useState(false);
  const [showEnvScan, setShowEnvScan] = useState(false);
  const [showVideoAnalysis, setShowVideoAnalysis] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showVoiceAnalysis, setShowVoiceAnalysis] = useState(false);

  const stateName = currentState.primaryState.replace('_', ' ');
  const stateDisplay = stateName.charAt(0).toUpperCase() + stateName.slice(1);
  const stateInfo = stateColors[currentState.primaryState] || stateColors.calm;

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeDashboard onSOS={() => setShowSOS(true)} onCalm={() => setShowCalm(true)} onEnvScan={() => setShowEnvScan(true)} onNavigate={setActiveTab} />;
      case 'analysis': return (
        <div>
          <div className="px-3 lg:px-5 pt-3"><ParentToneCoach compact /></div>
          <div className="px-3 lg:px-5 pt-2"><SessionTracker /></div>
          <StateMonitor />
        </div>
      );
      case 'guide': return (
        <div>
          <div className="px-4 pt-3"><ParentToneCoach /></div>
          <div className="px-4 pt-2"><SessionTracker /></div>
          <CaregiverCoPilot />
        </div>
      );
      case 'log': return <EventLogger />;
      case 'insights': return <DailySummary />;
      case 'leo': return <LeoTab />;
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
    <div className="min-h-screen bg-[#060E1C] flex flex-col font-glory">
      {/* Global Toast System */}
      <ToastContainer />

      {/* Full-screen overlays */}
      {showSOS && <SOSGuide onClose={() => setShowSOS(false)} />}
      {showCalm && <CalmToolkit onClose={() => setShowCalm(false)} />}
      {showEnvScan && <EnvironmentScanner onClose={() => setShowEnvScan(false)} />}
      {showVideoAnalysis && <VideoAnalysis onClose={() => setShowVideoAnalysis(false)} />}
      {showPricing && <PricingPage onClose={() => setShowPricing(false)} />}
      {showVoiceAnalysis && <VoiceAnalysis onClose={() => setShowVoiceAnalysis(false)} />}

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
          {/* Mobile: child state badge */}
          <div className={`lg:hidden ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${stateInfo.color}`}>
            <span>Leo: {stateDisplay}</span>
            <span>{stateInfo.emoji}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Quick action buttons */}
          <button
            onClick={() => setShowSOS(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#FF6B6B]/15 border border-[#FF6B6B]/30 text-[#FF6B6B] text-[10px] lg:text-xs font-bold rounded-full hover:bg-[#FF6B6B]/25 active:scale-95 transition-all"
          >
            🆘 Help Now
          </button>
          <button
            onClick={() => setShowCalm(true)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-[#00D9A6]/10 border border-[#00D9A6]/30 text-[#00D9A6] text-[10px] lg:text-xs font-bold rounded-full hover:bg-[#00D9A6]/20 active:scale-95 transition-all"
          >
            🧘 Calm Tools
          </button>
          <button
            onClick={() => setShowVoiceAnalysis(true)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-[#F0C038]/10 border border-[#F0C038]/30 text-[#F0C038] text-[10px] lg:text-xs font-bold rounded-full hover:bg-[#F0C038]/20 active:scale-95 transition-all"
          >
            🎙️ Voice
          </button>
          <button
            onClick={() => setShowVideoAnalysis(true)}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-[#8B6EE8]/10 border border-[#8B6EE8]/30 text-[#8B6EE8] text-[10px] lg:text-xs font-bold rounded-full hover:bg-[#8B6EE8]/20 active:scale-95 transition-all"
          >
            🎬 Video
          </button>
          <button
            onClick={() => setShowEnvScan(true)}
            className="hidden md:flex items-center gap-1 px-2.5 py-1.5 bg-[#38C9F0]/10 border border-[#38C9F0]/30 text-[#38C9F0] text-[10px] lg:text-xs font-bold rounded-full hover:bg-[#38C9F0]/20 active:scale-95 transition-all"
          >
            🔍 Scan Room
          </button>
          <span className="hidden lg:inline text-[#5A7A9B] text-sm italic">Connection, not correction.</span>
          {isSimulating && (
            <span className="text-[10px] font-semibold text-[#38C9F0] bg-[#38C9F0]/10 px-2 py-1 rounded-full animate-pulse lg:text-xs lg:px-3">
              LIVE DEMO
            </span>
          )}
        </div>
      </header>

      {/* Mobile Simulation Control Bar — collapsible */}
      <div className="lg:hidden sticky top-[52px] z-40 bg-[#0D1B2A]/95 backdrop-blur border-b border-[#1A3A5C] px-4 py-2">
        {!demoExpanded ? (
          <button
            onClick={() => setDemoExpanded(true)}
            className="px-3 py-1.5 bg-[#132D46] text-[#5A7A9B] text-xs font-semibold rounded-full hover:bg-[#1A3A5C] hover:text-[#C8D4E4] transition-all"
          >
            🎮 Demo
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={run}
              disabled={isSimulating}
              className="px-4 py-2 bg-gradient-to-r from-[#38C9F0] to-[#8B6EE8] text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-[#38C9F0]/20 active:scale-95"
            >
              {isSimulating ? '⏳ Simulating...' : '▶ Run Demo'}
            </button>
            <button
              onClick={reset}
              className="px-3 py-2 bg-[#132D46] text-[#5A7A9B] text-xs font-semibold rounded-xl hover:bg-[#1A3A5C] hover:text-[#C8D4E4] transition-all active:scale-95"
            >
              ↺ Reset
            </button>
            <button
              onClick={() => setDemoExpanded(false)}
              className="ml-auto px-2 py-1 text-[#5A7A9B] text-xs hover:text-white transition-all"
            >
              ✕
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
        )}
      </div>

      {/* Desktop: sidebar + content | Mobile: content only */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-[240px] shrink-0 bg-[#0D1B2A] border-r border-[#1A3A5C] overflow-y-auto">
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
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#38C9F0]/10 text-[#38C9F0] border-l-[3px] border-[#38C9F0]'
                    : 'text-[#5A7A9B] hover:bg-[#132D46] hover:text-[#C8D4E4]'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{tab.label}</span>
                  <span className="text-[10px] text-[#5A7A9B] font-normal leading-tight">{tab.subtitle}</span>
                </div>
              </button>
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="p-3 border-t border-[#1A3A5C] flex flex-col gap-2">
            <p className="text-[10px] font-semibold text-[#5A7A9B] uppercase tracking-wider text-center mb-1">Quick Actions</p>
            <button onClick={() => setShowSOS(true)} className="w-full flex items-center gap-2 px-3 py-2.5 bg-[#FF6B6B]/10 border border-[#FF6B6B]/25 text-[#FF6B6B] text-sm font-bold rounded-xl hover:bg-[#FF6B6B]/20 active:scale-95 transition-all">
              🆘 Help Now
            </button>
            <button onClick={() => setShowCalm(true)} className="w-full flex items-center gap-2 px-3 py-2 bg-[#00D9A6]/10 border border-[#00D9A6]/25 text-[#00D9A6] text-sm font-semibold rounded-xl hover:bg-[#00D9A6]/20 active:scale-95 transition-all">
              🧘 Calm Tools
            </button>
            <button onClick={() => setShowVoiceAnalysis(true)} className="w-full flex items-center gap-2 px-3 py-2 bg-[#F0C038]/10 border border-[#F0C038]/25 text-[#F0C038] text-sm font-semibold rounded-xl hover:bg-[#F0C038]/20 active:scale-95 transition-all">
              🎙️ Voice Analysis
            </button>
            <button onClick={() => setShowVideoAnalysis(true)} className="w-full flex items-center gap-2 px-3 py-2 bg-[#8B6EE8]/10 border border-[#8B6EE8]/25 text-[#8B6EE8] text-sm font-semibold rounded-xl hover:bg-[#8B6EE8]/20 active:scale-95 transition-all">
              🎬 Video Analysis
            </button>
            <button onClick={() => setShowEnvScan(true)} className="w-full flex items-center gap-2 px-3 py-2 bg-[#38C9F0]/10 border border-[#38C9F0]/25 text-[#38C9F0] text-sm font-semibold rounded-xl hover:bg-[#38C9F0]/20 active:scale-95 transition-all">
              🔍 Scan Room
            </button>
            <button onClick={() => setShowPricing(true)} className="w-full flex items-center gap-2 px-3 py-2 bg-[#8B6EE8]/10 border border-[#8B6EE8]/25 text-[#8B6EE8] text-sm font-semibold rounded-xl hover:bg-[#8B6EE8]/20 active:scale-95 transition-all">
              💎 Plans & Pricing
            </button>
          </div>

          {/* Sim controls at bottom */}
          <div className="p-3 border-t border-[#1A3A5C] flex flex-col gap-2">
            <p className="text-[10px] font-semibold text-[#5A7A9B] uppercase tracking-wider text-center">Demo Mode</p>
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
              {isSimulating ? '⏳ Simulating...' : '▶ Run Demo'}
            </button>
            <button
              onClick={reset}
              className="w-full px-3 py-2 bg-[#132D46] text-[#5A7A9B] text-sm font-semibold rounded-xl hover:bg-[#1A3A5C] hover:text-[#C8D4E4] transition-all active:scale-95"
            >
              ↺ Reset
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-4">
          <div className="lg:max-w-6xl lg:mx-auto">
            <div key={activeTab} className="animate-fade-in">
              {renderScreen()}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0D1B2A]/95 backdrop-blur-lg border-t border-[#1A3A5C] px-2 py-1 flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 min-h-[48px] rounded-xl transition-all ${
              activeTab === tab.id
                ? 'text-[#38C9F0] border-t-2 border-[#38C9F0] bg-[#38C9F0]/10'
                : 'text-[#5A7A9B]'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </button>
        ))}
      </nav>

      {/* Floating AI Chatbot */}
      <HarmonyChat />
    </div>
  );
}
