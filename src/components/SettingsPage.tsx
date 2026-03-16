import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';

interface SettingsPageProps {
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Toggle switch                                                      */
/* ------------------------------------------------------------------ */

function Toggle({
  label,
  description,
  defaultOn = false,
}: {
  label: string;
  description: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);

  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-[#5A7A94] mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => setOn(!on)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
          on ? 'bg-[#38C9F0]' : 'bg-[#1A3A5C]'
        }`}
        aria-label={`${label}: ${on ? 'on' : 'off'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            on ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section card                                                       */
/* ------------------------------------------------------------------ */

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-5">
      <h2 className="text-base font-bold text-white mb-3">{title}</h2>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Slider                                                             */
/* ------------------------------------------------------------------ */

function Slider({
  label,
  levels,
  defaultIndex = 1,
}: {
  label: string;
  levels: string[];
  defaultIndex?: number;
}) {
  const [idx, setIdx] = useState(defaultIndex);

  return (
    <div className="py-2">
      <p className="text-sm font-medium text-white mb-2">{label}</p>
      <div className="flex items-center gap-2">
        {levels.map((l, i) => (
          <button
            key={l}
            onClick={() => setIdx(i)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              i === idx
                ? 'bg-[#38C9F0] text-[#060E1C]'
                : 'bg-[#081624] text-[#5A7A94] hover:text-[#8EADC1]'
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SettingsPage({ onClose }: SettingsPageProps) {
  const { addToast } = useAppStore();

  return (
    <div className="fixed inset-0 z-[200] bg-[#060E1C] overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-[210] bg-[#060E1C]/90 backdrop-blur-md border-b border-[#1A3A5C] px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Settings</h1>
        <button
          onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-[#0D1B2A] border border-[#1A3A5C] text-[#8EADC1] hover:text-white transition-colors text-lg"
          aria-label="Close"
        >
          &times;
        </button>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-5 pb-20">
        {/* ---- 1. Account ---- */}
        <Card title="Account">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[#5A7A94] uppercase">
                Caregiver name
              </label>
              <input
                type="text"
                value="Sarah"
                disabled
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[#081624] border border-[#1A3A5C] text-white text-sm opacity-60 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-xs text-[#5A7A94] uppercase">Email</label>
              <input
                type="email"
                value="sarah@example.com"
                disabled
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[#081624] border border-[#1A3A5C] text-white text-sm opacity-60 cursor-not-allowed"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5A7A94] uppercase">Plan</p>
                <p className="text-sm text-white font-medium">
                  Family{' '}
                  <span className="text-[#8EADC1]">
                    (&pound;14.99/month)
                  </span>
                </p>
              </div>
              <button className="px-4 py-1.5 rounded-lg border border-[#38C9F0] text-[#38C9F0] text-xs font-semibold hover:bg-[#38C9F0]/10 transition-colors">
                Manage
              </button>
            </div>
          </div>
        </Card>

        {/* ---- 2. Privacy Controls ---- */}
        <Card title="Privacy Controls">
          <div className="divide-y divide-[#1A3A5C]">
            <Toggle
              label="Microphone access"
              description="Allows audio analysis for tone detection and vocal patterns"
              defaultOn
            />
            <Toggle
              label="Camera access"
              description="Enables gesture recognition and facial expression analysis"
              defaultOn
            />
            <Toggle
              label="Wearable data"
              description="Imports heart rate and activity data from connected wearables"
              defaultOn
            />
            <Toggle
              label="Cloud sync"
              description="Sync data to the cloud for cross-device access. When off, all data stays on-device only"
            />
            <Toggle
              label="Anonymous model improvement"
              description="Share anonymised, aggregated patterns to help improve HarmonyAlert for everyone"
            />
          </div>
        </Card>

        {/* ---- 3. Data Management ---- */}
        <Card title="Data Management">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#8EADC1]">Data stored on device</span>
              <span className="text-white font-medium">2.4 MB</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#8EADC1]">Cloud data</span>
              <span className="text-[#5A7A94]">None (sync disabled)</span>
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() =>
                  addToast('Preparing data export...', 'info')
                }
                className="px-4 py-2 rounded-xl bg-[#081624] border border-[#1A3A5C] text-[#8EADC1] hover:text-white text-sm font-medium transition-colors"
              >
                Download my data
              </button>
              <button
                onClick={() =>
                  addToast(
                    'Are you sure? This action is irreversible. Tap again to confirm.',
                    'danger'
                  )
                }
                className="px-4 py-2 rounded-xl bg-[#1C0A0A] border border-red-900/50 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
              >
                Delete all data
              </button>
            </div>
          </div>
        </Card>

        {/* ---- 4. Notifications ---- */}
        <Card title="Notifications">
          <div className="divide-y divide-[#1A3A5C]">
            <Toggle
              label="Escalation alerts"
              description="Get notified when Leo enters elevated or high-risk states"
              defaultOn
            />
            <Toggle
              label="Daily summary"
              description="Receive a summary of the day's emotional regulation at 8 PM"
              defaultOn
            />
            <Toggle
              label="Tone coaching prompts"
              description="Real-time suggestions to adjust your tone during interactions"
              defaultOn
            />
            <Toggle
              label="Gesture detected"
              description="Alert when a new or known gesture is recognised by the camera"
            />
            <Toggle
              label="Session reminders"
              description="Reminders to start monitoring sessions at scheduled times"
              defaultOn
            />
          </div>
        </Card>

        {/* ---- 5. Modality Settings ---- */}
        <Card title="Modality Settings">
          <Slider
            label="Audio sensitivity"
            levels={['Low', 'Medium', 'High']}
            defaultIndex={1}
          />
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">
                Camera frame rate
              </p>
              <p className="text-xs text-[#5A7A94] mt-0.5">
                Adaptive (1&ndash;5 FPS)
              </p>
            </div>
            <span className="text-xs text-[#38C9F0] bg-[#38C9F0]/10 px-2.5 py-1 rounded-full font-medium">
              Adaptive
            </span>
          </div>
          <div className="py-3 flex items-center justify-between border-t border-[#1A3A5C]">
            <div>
              <p className="text-sm font-medium text-white">Wearable</p>
              <p className="text-xs text-[#5A7A94] mt-0.5">Apple Watch</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Connected
            </span>
          </div>
        </Card>

        {/* ---- 6. Clinical & Compliance ---- */}
        <Card title="Clinical & Compliance">
          <div className="space-y-2.5">
            {[
              { label: 'GDPR Compliant', ok: true },
              { label: 'NHS DTAC Ready', ok: true },
              { label: 'Data Protection Impact Assessment: Filed', ok: true },
              { label: 'ICO Registration: Pending', ok: false },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-sm"
              >
                <span
                  className={
                    item.ok ? 'text-emerald-400' : 'text-amber-400'
                  }
                >
                  {item.ok ? '\u2713' : '\u25CB'}
                </span>
                <span className="text-[#8EADC1]">{item.label}</span>
              </div>
            ))}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-[#1A3A5C]">
              <button className="text-sm text-[#38C9F0] hover:underline">
                View privacy policy
              </button>
              <button className="text-sm text-[#38C9F0] hover:underline">
                View terms of service
              </button>
            </div>
          </div>
        </Card>

        {/* ---- 7. About ---- */}
        <Card title="About">
          <div className="space-y-1.5 text-sm text-[#8EADC1]">
            <p>
              <span className="font-bold bg-gradient-to-r from-[#38C9F0] to-[#6C63FF] bg-clip-text text-transparent">
                HarmonyAlert
              </span>{' '}
              v1.0.0
            </p>
            <p>Built in Oxford, UK</p>
            <p>&copy; 2026 HarmonyAlert</p>
            <p>
              Contact:{' '}
              <a
                href="mailto:hello@harmonyalert.com"
                className="text-[#38C9F0] hover:underline"
              >
                hello@harmonyalert.com
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
