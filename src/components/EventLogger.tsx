import { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { generateMockEventLogs } from '../data/mockData';
import type { EventLog } from '../types';

const EVENT_TYPES: { value: EventLog['type']; emoji: string; label: string }[] = [
  { value: 'meltdown', emoji: '😤', label: 'Meltdown' },
  { value: 'near_meltdown', emoji: '⚠️', label: 'Near Meltdown' },
  { value: 'shutdown', emoji: '🔇', label: 'Shutdown' },
  { value: 'sensory_overload', emoji: '🌊', label: 'Sensory Overload' },
  { value: 'frustration', emoji: '😣', label: 'Frustration' },
  { value: 'good_moment', emoji: '⭐', label: 'Good Moment' },
  { value: 'transition_difficulty', emoji: '🔄', label: 'Transition Difficulty' },
  { value: 'other', emoji: '📝', label: 'Other' },
];

const OUTCOME_OPTIONS: { value: EventLog['outcome']; label: string; color: string; selectedBg: string }[] = [
  { value: 'helped', label: '✓ Helped', color: '#00D9A6', selectedBg: 'rgba(0,217,166,0.15)' },
  { value: 'no_effect', label: '— No Effect', color: '#5A7A9B', selectedBg: 'rgba(90,122,155,0.15)' },
  { value: 'made_worse', label: '✗ Made Worse', color: '#FF6B6B', selectedBg: 'rgba(255,107,107,0.15)' },
];

function getEventEmoji(type: EventLog['type']): string {
  return EVENT_TYPES.find((e) => e.value === type)?.emoji ?? '📝';
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

function outcomeLabel(outcome?: EventLog['outcome']): { text: string; className: string } | null {
  if (!outcome) return null;
  switch (outcome) {
    case 'helped': return { text: 'Helped', className: 'bg-[#00D9A6]/15 text-[#00D9A6]' };
    case 'no_effect': return { text: 'No Effect', className: 'bg-[#5A7A9B]/15 text-[#5A7A9B]' };
    case 'made_worse': return { text: 'Made Worse', className: 'bg-[#FF6B6B]/15 text-[#FF6B6B]' };
    default: return null;
  }
}

export default function EventLogger() {
  const { childProfile, addEventLog, eventLogs, currentState } = useAppStore();

  const [selectedType, setSelectedType] = useState<EventLog['type'] | null>(null);
  const [selectedTriggers, setSelectedTriggers] = useState<string[]>([]);
  const [customTrigger, setCustomTrigger] = useState('');
  const [showCustomTrigger, setShowCustomTrigger] = useState(false);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [customStrategy, setCustomStrategy] = useState('');
  const [showCustomStrategy, setShowCustomStrategy] = useState(false);
  const [outcome, setOutcome] = useState<EventLog['outcome'] | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState(false);

  const mockEvents = useMemo(() => generateMockEventLogs(), []);
  const recentEvents = useMemo(() => {
    const combined = [...eventLogs, ...mockEvents];
    combined.sort((a, b) => b.timestamp - a.timestamp);
    return combined.slice(0, 5);
  }, [eventLogs, mockEvents]);

  const toggleTrigger = (trigger: string) => {
    setSelectedTriggers((prev) =>
      prev.includes(trigger) ? prev.filter((t) => t !== trigger) : [...prev, trigger]
    );
  };

  const addCustomTrigger = () => {
    const trimmed = customTrigger.trim();
    if (trimmed && !selectedTriggers.includes(trimmed)) {
      setSelectedTriggers((prev) => [...prev, trimmed]);
      setCustomTrigger('');
      setShowCustomTrigger(false);
    }
  };

  const toggleStrategy = (strategy: string) => {
    setSelectedStrategies((prev) =>
      prev.includes(strategy) ? prev.filter((s) => s !== strategy) : [...prev, strategy]
    );
  };

  const addCustomStrategy = () => {
    const trimmed = customStrategy.trim();
    if (trimmed && !selectedStrategies.includes(trimmed)) {
      setSelectedStrategies((prev) => [...prev, trimmed]);
      setCustomStrategy('');
      setShowCustomStrategy(false);
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setSelectedTriggers([]);
    setCustomTrigger('');
    setShowCustomTrigger(false);
    setSelectedStrategies([]);
    setCustomStrategy('');
    setShowCustomStrategy(false);
    setOutcome(undefined);
    setNotes('');
  };

  const handleSave = () => {
    if (!selectedType) return;

    const event: EventLog = {
      id: `e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      type: selectedType,
      trigger: selectedTriggers.length > 0 ? selectedTriggers.join(', ') : undefined,
      intervention: selectedStrategies.length > 0 ? selectedStrategies.join(', ') : undefined,
      outcome: outcome,
      notes: notes.trim() || undefined,
      stateAtTime: currentState,
    };

    addEventLog(event);
    resetForm();
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  const now = new Date();
  const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#060E1C' }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-lg text-white font-medium text-sm animate-fade-in bg-[#0D1B2A] border border-[#1A3A5C]"
          style={{ background: 'linear-gradient(to right, #38C9F0, #8B6EE8)' }}>
          Event logged successfully
        </div>
      )}

      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Log an Event</h1>
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-[#0D1B2A] border border-[#1A3A5C] text-[#5A7A9B]">
            {currentTime}
          </span>
        </div>

        {/* Event Type Grid */}
        <div>
          <p className="text-sm font-semibold text-[#C8D4E4] mb-2">What happened? <span className="text-[#FF6B6B]">*</span></p>
          <div className="grid grid-cols-2 gap-2.5">
            {EVENT_TYPES.map((evt) => {
              const isSelected = selectedType === evt.value;
              return (
                <button
                  key={evt.value}
                  type="button"
                  onClick={() => setSelectedType(evt.value)}
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 transition-all duration-150 text-left ${
                    isSelected
                      ? 'border-[#38C9F0] bg-[#132D46] shadow-md scale-[1.03]'
                      : 'border-[#1A3A5C] bg-[#0D1B2A] hover:bg-[#132D46]'
                  }`}
                >
                  <span className="text-2xl">{evt.emoji}</span>
                  <span className={`text-sm font-medium ${isSelected ? 'text-[#38C9F0]' : 'text-[#C8D4E4]'}`}>
                    {evt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trigger Selection */}
        <div>
          <p className="text-sm font-semibold text-[#C8D4E4] mb-2">What may have triggered this?</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {childProfile.knownTriggers.map((trigger) => {
              const isSelected = selectedTriggers.includes(trigger);
              return (
                <button
                  key={trigger}
                  type="button"
                  onClick={() => toggleTrigger(trigger)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#38C9F0]/20 text-[#38C9F0] border-[#38C9F0]'
                      : 'bg-[#132D46] text-[#C8D4E4] border-[#1A3A5C] hover:border-[#38C9F0]/40'
                  }`}
                >
                  {trigger}
                </button>
              );
            })}
            {!showCustomTrigger ? (
              <button
                type="button"
                onClick={() => setShowCustomTrigger(true)}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border border-dashed border-[#38C9F0]/50 text-[#38C9F0] hover:bg-[#38C9F0]/10 transition-colors"
              >
                + Custom
              </button>
            ) : (
              <div className="shrink-0 flex items-center gap-1.5">
                <input
                  type="text"
                  value={customTrigger}
                  onChange={(e) => setCustomTrigger(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTrigger()}
                  placeholder="Type trigger..."
                  autoFocus
                  className="w-32 px-3 py-1.5 rounded-full text-xs border border-[#38C9F0]/40 focus:outline-none focus:border-[#38C9F0] bg-[#132D46] text-white placeholder-[#5A7A9B]"
                />
                <button
                  type="button"
                  onClick={addCustomTrigger}
                  className="shrink-0 w-7 h-7 rounded-full bg-[#38C9F0] text-white text-xs flex items-center justify-center"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Strategies */}
        <div>
          <p className="text-sm font-semibold text-[#C8D4E4] mb-2">What did you try?</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {childProfile.calmingStrategies.map((strategy) => {
              const isSelected = selectedStrategies.includes(strategy);
              return (
                <button
                  key={strategy}
                  type="button"
                  onClick={() => toggleStrategy(strategy)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
                    isSelected
                      ? 'bg-[#8B6EE8]/20 text-[#8B6EE8] border-[#8B6EE8]'
                      : 'bg-[#132D46] text-[#C8D4E4] border-[#1A3A5C] hover:border-[#8B6EE8]/40'
                  }`}
                >
                  {strategy}
                </button>
              );
            })}
            {!showCustomStrategy ? (
              <button
                type="button"
                onClick={() => setShowCustomStrategy(true)}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border border-dashed border-[#8B6EE8]/50 text-[#8B6EE8] hover:bg-[#8B6EE8]/10 transition-colors"
              >
                + Custom
              </button>
            ) : (
              <div className="shrink-0 flex items-center gap-1.5">
                <input
                  type="text"
                  value={customStrategy}
                  onChange={(e) => setCustomStrategy(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomStrategy()}
                  placeholder="Type strategy..."
                  autoFocus
                  className="w-32 px-3 py-1.5 rounded-full text-xs border border-[#8B6EE8]/40 focus:outline-none focus:border-[#8B6EE8] bg-[#132D46] text-white placeholder-[#5A7A9B]"
                />
                <button
                  type="button"
                  onClick={addCustomStrategy}
                  className="shrink-0 w-7 h-7 rounded-full bg-[#8B6EE8] text-white text-xs flex items-center justify-center"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Did It Help? */}
        <div>
          <p className="text-sm font-semibold text-[#C8D4E4] mb-2">Did it help?</p>
          <div className="flex gap-2">
            {OUTCOME_OPTIONS.map((opt) => {
              const isSelected = outcome === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setOutcome(opt.value)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all duration-150 ${
                    isSelected
                      ? 'scale-[1.03]'
                      : 'bg-[#0D1B2A] border-[#1A3A5C] text-[#5A7A9B] hover:border-[#1A3A5C]'
                  }`}
                  style={isSelected ? { backgroundColor: opt.selectedBg, borderColor: opt.color, color: opt.color } : undefined}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-sm font-semibold text-[#C8D4E4] mb-2">Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any quick notes..."
            rows={2}
            className="w-full px-4 py-3 rounded-2xl border border-[#1A3A5C] bg-[#132D46] text-sm text-white placeholder-[#5A7A9B] resize-y focus:outline-none focus:border-[#38C9F0] focus:ring-1 focus:ring-[#38C9F0]/30"
          />
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!selectedType}
          className={`w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-all duration-200 ${
            selectedType
              ? 'hover:shadow-xl active:scale-[0.98]'
              : 'bg-[#1A3A5C] cursor-not-allowed opacity-50'
          }`}
          style={selectedType ? { background: 'linear-gradient(to right, #38C9F0, #8B6EE8)' } : undefined}
        >
          Save Event
        </button>

        {/* Recent Events */}
        <div>
          <h2 className="text-sm font-semibold text-[#C8D4E4] mb-3">Recent Events</h2>
          <div className="space-y-2.5">
            {recentEvents.map((event) => {
              const badge = outcomeLabel(event.outcome);
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3.5 bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl"
                >
                  <span className="text-2xl">{getEventEmoji(event.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white capitalize">
                        {event.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-[#5A7A9B]">{timeAgo(event.timestamp)}</span>
                    </div>
                    {event.trigger && (
                      <p className="text-xs text-[#5A7A9B] truncate mt-0.5">{event.trigger}</p>
                    )}
                  </div>
                  {badge && (
                    <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.className}`}>
                      {badge.text}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
