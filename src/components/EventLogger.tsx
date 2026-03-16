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

const OUTCOME_OPTIONS: { value: EventLog['outcome']; label: string; color: string; bg: string }[] = [
  { value: 'helped', label: '✓ Helped', color: 'text-green-700', bg: 'bg-green-100 border-green-300' },
  { value: 'no_effect', label: '— No Effect', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-300' },
  { value: 'made_worse', label: '✗ Made Worse', color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
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
    case 'helped': return { text: 'Helped', className: 'bg-green-100 text-green-700' };
    case 'no_effect': return { text: 'No Effect', className: 'bg-gray-100 text-gray-600' };
    case 'made_worse': return { text: 'Made Worse', className: 'bg-red-100 text-red-700' };
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
    <div className="min-h-screen pb-28" style={{ backgroundColor: '#F8F7FF' }}>
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-lg text-white font-medium text-sm animate-fade-in"
          style={{ backgroundColor: '#6C5CE7' }}>
          Event logged successfully
        </div>
      )}

      <div className="px-4 pt-6 pb-4 max-w-lg mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Log an Event</h1>
          <span className="text-sm font-medium px-3 py-1 rounded-full bg-white shadow-sm text-gray-500">
            {currentTime}
          </span>
        </div>

        {/* Event Type Grid */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">What happened? <span className="text-red-400">*</span></p>
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
                      ? 'border-[#6C5CE7] bg-white shadow-md scale-[1.03]'
                      : 'border-transparent bg-white shadow-sm hover:shadow-md'
                  }`}
                >
                  <span className="text-2xl">{evt.emoji}</span>
                  <span className={`text-sm font-medium ${isSelected ? 'text-[#6C5CE7]' : 'text-gray-700'}`}>
                    {evt.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Trigger Selection */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">What may have triggered this?</p>
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
                      ? 'bg-[#6C5CE7] text-white border-[#6C5CE7]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#6C5CE7]/40'
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
                className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border border-dashed border-[#6C5CE7]/50 text-[#6C5CE7] hover:bg-[#6C5CE7]/5 transition-colors"
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
                  className="w-32 px-3 py-1.5 rounded-full text-xs border border-[#6C5CE7]/40 focus:outline-none focus:border-[#6C5CE7] bg-white"
                />
                <button
                  type="button"
                  onClick={addCustomTrigger}
                  className="shrink-0 w-7 h-7 rounded-full bg-[#6C5CE7] text-white text-xs flex items-center justify-center"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Strategies */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">What did you try?</p>
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
                      ? 'bg-[#6C5CE7] text-white border-[#6C5CE7]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#6C5CE7]/40'
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
                className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border border-dashed border-[#6C5CE7]/50 text-[#6C5CE7] hover:bg-[#6C5CE7]/5 transition-colors"
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
                  className="w-32 px-3 py-1.5 rounded-full text-xs border border-[#6C5CE7]/40 focus:outline-none focus:border-[#6C5CE7] bg-white"
                />
                <button
                  type="button"
                  onClick={addCustomStrategy}
                  className="shrink-0 w-7 h-7 rounded-full bg-[#6C5CE7] text-white text-xs flex items-center justify-center"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Did It Help? */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Did it help?</p>
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
                      ? `${opt.bg} ${opt.color} scale-[1.03]`
                      : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any quick notes..."
            rows={2}
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 resize-y focus:outline-none focus:border-[#6C5CE7] focus:ring-1 focus:ring-[#6C5CE7]/30 shadow-sm"
          />
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={!selectedType}
          className={`w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg transition-all duration-200 ${
            selectedType
              ? 'bg-gradient-to-r from-[#6C5CE7] to-[#8B7CF7] hover:shadow-xl active:scale-[0.98]'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Save Event
        </button>

        {/* Recent Events */}
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Recent Events</h2>
          <div className="space-y-2.5">
            {recentEvents.map((event) => {
              const badge = outcomeLabel(event.outcome);
              return (
                <div
                  key={event.id}
                  className="flex items-center gap-3 p-3.5 bg-white rounded-2xl shadow-sm"
                >
                  <span className="text-2xl">{getEventEmoji(event.type)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800 capitalize">
                        {event.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-400">{timeAgo(event.timestamp)}</span>
                    </div>
                    {event.trigger && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">{event.trigger}</p>
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
