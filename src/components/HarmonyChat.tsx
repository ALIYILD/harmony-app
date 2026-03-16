import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
  suggestions?: string[];
}

const SUGGESTED_QUESTIONS = [
  'How was Leo today?',
  'What are his triggers?',
  'What helps him calm down?',
  'Why was he upset at 3pm?',
  'Show me his sleep patterns',
  'What signs did he use today?',
  'How is my tone affecting Leo?',
  'Tips for after-school transition',
];

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'ai',
  text: "Hi Sarah! 👋 I'm Harmony AI. I can help you understand Leo's patterns, suggest strategies, and answer questions about his day. What would you like to know?",
  timestamp: Date.now(),
  suggestions: SUGGESTED_QUESTIONS,
};

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function generateResponse(
  question: string,
  childProfile: ReturnType<typeof useAppStore.getState>['childProfile'],
  currentState: ReturnType<typeof useAppStore.getState>['currentState'],
  gestureDictionary: ReturnType<typeof useAppStore.getState>['gestureDictionary'],
): string {
  const q = question.toLowerCase();

  // 1. How was Leo today
  if (q.includes('how was') || (q.includes('today') && !q.includes('sign')) || q.includes('his day')) {
    const stateLabel = currentState.primaryState.replace('_', ' ');
    return `Leo has had a mostly calm day today. He's currently in a **${stateLabel}** state (${Math.round(currentState.confidence * 100)}% confidence, trajectory: ${currentState.trajectory}). He's been regulated for about 7 hours with one elevated period around 3:45 PM (after-school transition). He used 8 signs today — 'More' and 'Help' were the most frequent. His sleep was shorter than ideal (5h 20m), which may have contributed to some sensitivity this afternoon. Overall, a good day! 😊`;
  }

  // 2. Triggers
  if (q.includes('trigger')) {
    const triggerList = childProfile.knownTriggers.map(t => `• ${t}`).join('\n');
    return `Based on 12 days of observations, Leo's most common triggers are:\n\n${triggerList}\n\nThe strongest pattern is **after-school transitions** — Leo has been elevated on 4 of 5 weekdays between 3–5 PM. Unexpected routine changes and loud environments are also consistent triggers.`;
  }

  // 3. Calming / strategies
  if (q.includes('calm') || q.includes('what helps') || q.includes('strateg')) {
    const strategies = childProfile.calmingStrategies;
    const mockRates = [78, 75, 72, 68, 65, 62, 58, 55];
    const strategyList = strategies.map((s, i) => `• **${s}** — ${mockRates[i] ?? 50}% success rate`).join('\n');
    return `Here's what works best for Leo, ranked by success rate:\n\n${strategyList}\n\nThe **weighted blanket** has been the most effective (78% success rate). Ear defenders work best for noise-triggered episodes specifically. For after-school transitions, a 15-minute decompression with favourite music has helped in 6 of 8 recent occasions.`;
  }

  // 4. Upset / 3pm / afternoon / why
  if (q.includes('upset') || q.includes('3pm') || q.includes('3 pm') || q.includes('afternoon') || (q.includes('why') && !q.includes('sign'))) {
    return `At 3:45 PM, Harmony detected rising vocal intensity and body tension. This coincided with the **after-school transition** period, which is Leo's most challenging time.\n\nContributing factors:\n• Below-average sleep last night (5h 20m)\n• Higher-than-normal ambient noise (55 dB)\n• A routine change (different pick-up person)\n\nThe combination of **fatigue + transition + noise** is a known trigger pattern for Leo.`;
  }

  // 5. Sleep
  if (q.includes('sleep') || q.includes('night')) {
    return `Last night Leo slept **5 hours 20 minutes** with 4 wake-ups. This is below the recommended 9 hours for his age.\n\nLooking at the last week, his sleep has been fragmented 4 of 7 nights. There's a strong correlation: on nights with less than 6 hours of sleep, Leo's next-day meltdown risk increases by **73%**.\n\nI'd suggest maintaining a consistent **7:15 PM bedtime routine** and reducing screen time after 6 PM.`;
  }

  // 6. Signs / gestures / communication
  if (q.includes('sign') || q.includes('gesture') || q.includes('communication')) {
    const count = gestureDictionary.length;
    const topGestures = [...gestureDictionary]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map(g => `**${g.label}** (${Math.round(g.confidence * 100)}% confidence)`)
      .join(', ');
    return `Leo has **${count} signs** in his personal dictionary. Today he used 8 signs — most frequently 'More' (6 times) and 'Help' (3 times). He also made 3 new gestures that haven't been labelled yet.\n\nHis sign vocabulary is growing — he's added 2 new confirmed signs this week! The most reliable signs are: ${topGestures}.`;
  }

  // 7. Tone / voice
  if (q.includes('tone') || q.includes('my voice') || q.includes('my tone')) {
    return `Your tone has been **calm 82%** of today's sessions — that's great! There were 3 moments where your voice rose slightly, all during the after-school period.\n\nLeo responds measurably better when your tone stays below the amber threshold. You've improved from 71% calm last week to **82% this week** — real progress, Sarah! 💙`;
  }

  // 8. Transition / school / after school
  if (q.includes('transition') || q.includes('school') || q.includes('after school') || q.includes('after-school')) {
    return `After-school transitions are Leo's **#1 challenge**. Here's what the data shows works best:\n\n1. 15-min decompression before any demands\n2. Favourite music playing when he arrives home\n3. Visual schedule showing what's next\n4. Signed 'break' cue rather than verbal\n\nOn days you used this combination, Leo's after-school elevated period was **60% shorter**.`;
  }

  // 9. Default
  return `That's a great question. Based on Leo's data over the past 12 days, I can see his overall regulation has been improving, with calm periods increasing week-over-week. Would you like me to go deeper into his **triggers**, **calming strategies**, **communication patterns**, or **today's specific events**?`;
}

export default function HarmonyChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [pulse, setPulse] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { currentState, childProfile, gestureDictionary } = useAppStore();

  // Auto-scroll on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Stop pulse after opening once
  useEffect(() => {
    if (isOpen) setPulse(false);
  }, [isOpen]);

  const handleSend = useCallback((text?: string) => {
    const message = (text ?? inputText).trim();
    if (!message) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: message,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const delay = 800 + Math.random() * 700;
    setTimeout(() => {
      const responseText = generateResponse(message, childProfile, currentState, gestureDictionary);
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        text: responseText,
        timestamp: Date.now(),
        suggestions: SUGGESTED_QUESTIONS.filter(() => Math.random() > 0.4).slice(0, 4),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, delay);
  }, [inputText, childProfile, currentState, gestureDictionary]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render formatted AI text with bold and bullet support
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Process bold markers
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const rendered = parts.map((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
        }
        return <span key={j}>{part}</span>;
      });

      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={i} className="flex gap-2 ml-1 mt-0.5">
            <span className="text-[#38C9F0] flex-shrink-0">•</span>
            <span>{rendered.slice(0)}</span>
          </div>
        );
      }

      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={i} className="flex gap-2 ml-1 mt-0.5">
            <span className="text-[#38C9F0] flex-shrink-0">{line.match(/^\d+/)![0]}.</span>
            <span>{parts.slice(0).map((part, j) => {
              const trimmed = part.replace(/^\d+\.\s/, '');
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={j} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
              }
              return <span key={j}>{j === 0 ? trimmed : part}</span>;
            })}</span>
          </div>
        );
      }

      if (line === '') return <div key={i} className="h-2" />;
      return <p key={i} className="mt-0.5">{rendered}</p>;
    });
  };

  return (
    <>
      {/* Floating chat bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-24 right-4 lg:bottom-8 lg:right-8 z-[60] w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${pulse ? 'animate-pulse' : ''}`}
          style={{ background: 'linear-gradient(135deg, #38C9F0, #8B6EE8)' }}
          aria-label="Open Harmony AI chat"
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed z-[60] flex flex-col
            inset-x-0 bottom-0 h-[85vh] rounded-t-3xl
            lg:inset-auto lg:bottom-8 lg:right-8 lg:w-[400px] lg:h-[600px] lg:rounded-2xl
            bg-[#0D1B2A] border border-[#1A3A5C] shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A3A5C] flex-shrink-0">
            <div>
              <h2
                className="text-lg font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #38C9F0, #8B6EE8)' }}
              >
                Harmony AI
              </h2>
              <p className="text-xs text-[#6B8AAE] mt-0.5">Ask me anything about Leo</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-[#4A6A8A] bg-[#132D46] px-2 py-1 rounded-full hidden sm:inline-block">
                Powered by on-device analysis
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#132D46] transition-colors text-[#6B8AAE] hover:text-white"
                aria-label="Close chat"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Message area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  {msg.role === 'ai' ? (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white mt-0.5"
                      style={{ background: 'linear-gradient(135deg, #38C9F0, #8B6EE8)' }}
                    >
                      H
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#38C9F0]/20 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-[#38C9F0] mt-0.5">
                      S
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#38C9F0]/15 text-white rounded-2xl rounded-br-sm'
                          : 'bg-[#132D46] text-[#C8D4E4] rounded-2xl rounded-bl-sm'
                      }`}
                    >
                      {msg.role === 'ai' ? renderFormattedText(msg.text) : msg.text}
                    </div>
                    <p className={`text-[10px] text-[#4A6A8A] mt-1 ${msg.role === 'user' ? 'text-right mr-1' : 'ml-1'}`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>

                {/* Suggestion pills */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3 ml-9">
                    {msg.suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(suggestion)}
                        className="bg-[#132D46] border border-[#1A3A5C] text-[#38C9F0] text-xs rounded-full px-3 py-1.5 hover:bg-[#1A3A5C] hover:border-[#38C9F0]/30 transition-colors whitespace-nowrap"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #38C9F0, #8B6EE8)' }}
                >
                  H
                </div>
                <div className="bg-[#132D46] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#38C9F0] rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-[#38C9F0] rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-[#38C9F0] rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="px-4 py-3 border-t border-[#1A3A5C] flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about Leo..."
                  className="w-full bg-[#132D46] border border-[#1A3A5C] rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-[#4A6A8A] outline-none focus:border-[#38C9F0]/50 transition-colors"
                />
                {/* Microphone icon (visual only) */}
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A6A8A] hover:text-[#6B8AAE] transition-colors"
                  aria-label="Voice input (coming soon)"
                  tabIndex={-1}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!inputText.trim() || isTyping}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg, #38C9F0, #8B6EE8)' }}
                aria-label="Send message"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
