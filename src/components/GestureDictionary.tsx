import { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { GestureEntry } from '../types';

const categoryEmojis: Record<GestureEntry['category'], string> = {
  request: '\u{1F932}',
  refusal: '\u{1F6AB}',
  emotion: '\u{1F622}',
  sensory: '\u{1F50A}',
  need: '\u{1F34E}',
  social: '\u{1F44B}',
  custom: '\u2B50',
};

const categoryLabels: Record<GestureEntry['category'], string> = {
  need: 'Needs',
  request: 'Requests',
  emotion: 'Emotions',
  refusal: 'Refusal',
  sensory: 'Sensory',
  social: 'Social',
  custom: 'Custom',
};

const allCategories: GestureEntry['category'][] = ['need', 'request', 'emotion', 'refusal', 'sensory', 'social', 'custom'];

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 80 ? 'bg-[#00D9A6]' : pct >= 60 ? 'bg-[#F0C038]' : 'bg-[#FF6B6B]';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#132D46] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-[#5A7A9B] font-medium w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function GestureDictionary() {
  const { gestureDictionary, addGesture, removeGesture } = useAppStore();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<GestureEntry['category'] | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState<GestureEntry['category']>('request');
  const [newDescription, setNewDescription] = useState('');

  const filtered = useMemo(() => {
    return gestureDictionary.filter((g) => {
      const matchSearch = !search || g.label.toLowerCase().includes(search.toLowerCase());
      const matchCategory = activeCategory === 'all' || g.category === activeCategory;
      return matchSearch && matchCategory;
    });
  }, [gestureDictionary, search, activeCategory]);

  const handleSave = () => {
    if (!newLabel.trim()) return;
    const entry: GestureEntry = {
      id: Date.now().toString(),
      label: newLabel.trim(),
      category: newCategory,
      confidence: 0.5,
      timesConfirmed: 0,
      source: 'personal',
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      description: newDescription.trim() || undefined,
    };
    addGesture(entry);
    setNewLabel('');
    setNewCategory('request');
    setNewDescription('');
    setShowModal(false);
  };

  return (
    <div className="min-h-screen bg-[#060E1C] px-4 py-6 lg:px-0">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white lg:text-2xl">Leo's Communication</h2>
          <p className="text-sm text-[#5A7A9B] mt-1">
            {gestureDictionary.length} gestures learned &middot; 24 recognised today
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-[#38C9F0] to-[#2AB0D4] text-white text-sm font-bold rounded-xl transition-all hover:shadow-lg hover:shadow-[#38C9F0]/20 active:scale-95 shrink-0"
        >
          + Add Gesture
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search gestures..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 bg-[#0D1B2A] border border-[#1A3A5C] rounded-xl text-white text-sm placeholder-[#5A7A9B] focus:outline-none focus:border-[#38C9F0] transition-colors"
        />
      </div>

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
            activeCategory === 'all'
              ? 'bg-[#38C9F0]/20 text-[#38C9F0] border border-[#38C9F0]/40'
              : 'bg-[#0D1B2A] text-[#5A7A9B] border border-[#1A3A5C] hover:text-[#C8D4E4]'
          }`}
        >
          All
        </button>
        {allCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? 'bg-[#38C9F0]/20 text-[#38C9F0] border border-[#38C9F0]/40'
                : 'bg-[#0D1B2A] text-[#5A7A9B] border border-[#1A3A5C] hover:text-[#C8D4E4]'
            }`}
          >
            {categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Gesture Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">{'\u{1F91F}'}</p>
          <p className="text-white font-semibold text-lg mb-2">No gestures yet</p>
          <p className="text-[#5A7A9B] text-sm max-w-xs mx-auto">
            Teach Harmony Leo's unique gestures and signs. Tap "Add Gesture" to start building his communication vocabulary.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((g) => (
            <div
              key={g.id}
              className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{categoryEmojis[g.category]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white font-bold text-base">{g.label}</h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        g.source === 'personal'
                          ? 'bg-[#38C9F0]/15 text-[#38C9F0]'
                          : 'bg-[#8B6EE8]/15 text-[#B8A5F0]'
                      }`}
                    >
                      {g.source === 'personal' ? 'Personal' : 'Common'}
                    </span>
                  </div>
                  {g.description && (
                    <p className="text-[#5A7A9B] text-sm mt-1 leading-snug">{g.description}</p>
                  )}
                  <div className="mt-3">
                    <ConfidenceBar confidence={g.confidence} />
                  </div>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[11px] text-[#5A7A9B] bg-[#132D46] px-2 py-0.5 rounded-full font-medium">
                      Confirmed {g.timesConfirmed} times
                    </span>
                    <span className="text-[11px] text-[#5A7A9B]">
                      Last seen: {relativeTime(g.lastSeenAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <button className="px-3 py-1.5 bg-[#132D46] text-[#C8D4E4] text-xs font-semibold rounded-lg hover:bg-[#1A3A5C] transition-colors">
                      Edit
                    </button>
                    <button
                      onClick={() => removeGesture(g.id)}
                      className="px-3 py-1.5 bg-[#132D46] text-[#FF6B6B] text-xs font-semibold rounded-lg hover:bg-[#2A1520] transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Gesture Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-white font-bold text-lg mb-4">Add New Gesture</h3>

            <label className="block mb-3">
              <span className="text-[#C8D4E4] text-sm font-semibold mb-1 block">Label</span>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. Want water"
                className="w-full px-3 py-2.5 bg-[#060E1C] border border-[#1A3A5C] rounded-xl text-white text-sm placeholder-[#5A7A9B] focus:outline-none focus:border-[#38C9F0] transition-colors"
              />
            </label>

            <label className="block mb-3">
              <span className="text-[#C8D4E4] text-sm font-semibold mb-1 block">Category</span>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as GestureEntry['category'])}
                className="w-full px-3 py-2.5 bg-[#060E1C] border border-[#1A3A5C] rounded-xl text-white text-sm focus:outline-none focus:border-[#38C9F0] transition-colors"
              >
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoryEmojis[cat]} {categoryLabels[cat]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block mb-5">
              <span className="text-[#C8D4E4] text-sm font-semibold mb-1 block">Description</span>
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe what the gesture looks like and what it means..."
                rows={3}
                className="w-full px-3 py-2.5 bg-[#060E1C] border border-[#1A3A5C] rounded-xl text-white text-sm placeholder-[#5A7A9B] focus:outline-none focus:border-[#38C9F0] transition-colors resize-none"
              />
            </label>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                disabled={!newLabel.trim()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-[#38C9F0] to-[#2AB0D4] text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-all hover:shadow-lg hover:shadow-[#38C9F0]/20 active:scale-95"
              >
                Save Gesture
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 bg-[#132D46] text-[#5A7A9B] text-sm font-semibold rounded-xl hover:bg-[#1A3A5C] hover:text-[#C8D4E4] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
