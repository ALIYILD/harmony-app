import { useAppStore } from '../store/useAppStore';

interface TherapistReportProps {
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Pie-chart slice (pure CSS)                                         */
/* ------------------------------------------------------------------ */

function PieChart({
  slices,
}: {
  slices: { label: string; value: number; color: string }[];
}) {
  const total = slices.reduce((s, sl) => s + sl.value, 0);
  let cumulative = 0;

  // Build conic-gradient stops
  const stops = slices
    .map((sl) => {
      const start = (cumulative / total) * 360;
      cumulative += sl.value;
      const end = (cumulative / total) * 360;
      return `${sl.color} ${start}deg ${end}deg`;
    })
    .join(', ');

  return (
    <div className="flex items-center gap-6">
      <div
        className="w-28 h-28 rounded-full shrink-0"
        style={{ background: `conic-gradient(${stops})` }}
      />
      <div className="space-y-1.5">
        {slices.map((sl) => (
          <div key={sl.label} className="flex items-center gap-2 text-sm">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: sl.color }}
            />
            <span className="text-[#8EADC1]">
              {sl.label}:{' '}
              <span className="font-bold text-white">{sl.value}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */

function Section({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-6 space-y-4">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <span className="w-7 h-7 flex items-center justify-center rounded-full bg-[#38C9F0]/15 text-[#38C9F0] text-xs font-bold">
          {number}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat pill                                                          */
/* ------------------------------------------------------------------ */

function Stat({
  label,
  value,
  color = 'text-white',
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div>
      <p className="text-xs text-[#5A7A94] uppercase tracking-wide">{label}</p>
      <p className={`text-base font-bold ${color}`}>{value}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Intervention table                                                 */
/* ------------------------------------------------------------------ */

const interventionData = [
  { strategy: 'Quiet room', rate: 85, color: 'text-emerald-400' },
  { strategy: 'Ear defenders', rate: 80, note: 'noise triggers', color: 'text-emerald-400' },
  { strategy: 'Weighted blanket', rate: 78, color: 'text-emerald-400' },
  { strategy: 'Visual timer', rate: 72, note: 'transitions', color: 'text-[#38C9F0]' },
  { strategy: 'Music', rate: 65, note: 'general', color: 'text-amber-400' },
];

/* ------------------------------------------------------------------ */
/*  Trigger data                                                       */
/* ------------------------------------------------------------------ */

const triggerData = [
  { trigger: 'Unexpected routine changes', freq: 9 },
  { trigger: 'Loud / sudden noises', freq: 7 },
  { trigger: 'Transitions between activities', freq: 6 },
  { trigger: 'After-school fatigue', freq: 5 },
  { trigger: 'Change of pick-up person', freq: 3 },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function TherapistReport({ onClose }: TherapistReportProps) {
  const { addToast } = useAppStore();

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    addToast('Secure share link copied to clipboard', 'success');
  };

  return (
    <div className="fixed inset-0 z-[200] bg-[#060E1C] overflow-y-auto print:static print:bg-white print:text-black">
      {/* Close button (hidden in print) */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-[210] w-10 h-10 flex items-center justify-center rounded-full bg-[#0D1B2A] border border-[#1A3A5C] text-[#8EADC1] hover:text-white transition-colors text-xl print:hidden"
        aria-label="Close"
      >
        &times;
      </button>

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        {/* ---- Header ---- */}
        <header className="text-center space-y-2 pb-6 border-b border-[#1A3A5C]">
          <p className="text-2xl font-extrabold bg-gradient-to-r from-[#38C9F0] to-[#6C63FF] bg-clip-text text-transparent">
            HarmonyAlert
          </p>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Clinical Session Report &mdash; Leo
          </h1>
          <p className="text-sm text-[#8EADC1]">
            1 March &mdash; 16 March 2026 (16 days)
          </p>
          <p className="text-sm text-[#8EADC1]">
            For: <span className="text-white font-medium">Dr. Thompson</span>,
            Speech &amp; Language Therapist
          </p>
          <p className="text-xs text-[#5A7A94] mt-2">
            Generated by HarmonyAlert &middot; On-device analysis &middot; Not
            a clinical diagnosis
          </p>
        </header>

        {/* ---- 1. Child Overview ---- */}
        <Section number={1} title="Child Overview">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Stat label="Name" value="Leo" />
            <Stat label="Age" value="7 years" />
            <Stat label="Communication" value="Minimal verbal" />
            <Stat label="Days monitored" value="16" color="text-[#38C9F0]" />
            <Stat label="Total sessions" value="42" color="text-[#38C9F0]" />
            <Stat label="Events logged" value="34" color="text-[#38C9F0]" />
          </div>
        </Section>

        {/* ---- 2. Emotional Regulation Summary ---- */}
        <Section number={2} title="Emotional Regulation Summary">
          <PieChart
            slices={[
              { label: 'Calm', value: 62, color: '#34D399' },
              { label: 'Elevated', value: 24, color: '#FBBF24' },
              { label: 'High risk', value: 14, color: '#F87171' },
            ]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
            <div className="bg-[#081624] rounded-xl p-3 border border-[#1A3A5C]">
              <p className="text-xs text-[#5A7A94] uppercase">Trend</p>
              <p className="text-sm text-emerald-400 font-semibold">
                Improving &mdash; calm periods increased 18% over 2 weeks
              </p>
            </div>
            <div className="bg-[#081624] rounded-xl p-3 border border-[#1A3A5C]">
              <p className="text-xs text-[#5A7A94] uppercase">
                Meltdown frequency
              </p>
              <p className="text-sm text-white">
                <span className="text-[#F87171] font-bold">4/week</span>{' '}
                &rarr;{' '}
                <span className="text-emerald-400 font-bold">1.5/week</span>{' '}
                <span className="text-[#8EADC1]">(62% reduction)</span>
              </p>
            </div>
            <div className="bg-[#081624] rounded-xl p-3 border border-[#1A3A5C] sm:col-span-2">
              <p className="text-xs text-[#5A7A94] uppercase">
                Avg de-escalation time
              </p>
              <p className="text-sm text-white">
                <span className="text-amber-400 font-bold">12 min</span>{' '}
                &rarr;{' '}
                <span className="text-emerald-400 font-bold">4 min</span>
              </p>
            </div>
          </div>
        </Section>

        {/* ---- 3. Communication Progress ---- */}
        <Section number={3} title="Communication Progress">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Stat
              label="Signs in vocabulary"
              value="10"
              color="text-[#38C9F0]"
            />
            <Stat
              label="New signs this period"
              value="3"
              color="text-emerald-400"
            />
            <Stat
              label="Avg usage"
              value="12 signs/day (up from 6)"
              color="text-white"
            />
          </div>

          <div className="mt-2">
            <p className="text-xs text-[#5A7A94] uppercase mb-2">
              Most used signs
            </p>
            <div className="space-y-1.5">
              {[
                { sign: 'More', count: 24, conf: 92 },
                { sign: 'Help', count: 15, conf: 85 },
                { sign: 'Hug', count: 12, conf: 90 },
                { sign: 'Stop / No more', count: 10, conf: 88 },
                { sign: 'Want food', count: 8, conf: 82 },
              ].map((s, i) => (
                <div
                  key={s.sign}
                  className={`flex items-center justify-between text-sm px-3 py-1.5 rounded-lg ${
                    i % 2 === 0 ? 'bg-[#081624]' : 'bg-[#0D1B2A]'
                  }`}
                >
                  <span className="text-white font-medium">{s.sign}</span>
                  <span className="text-[#8EADC1]">
                    <span className="font-bold text-[#38C9F0]">{s.count}x</span>{' '}
                    &middot; {s.conf}% confidence
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-emerald-400 italic mt-2">
            Leo is increasingly initiating communication through signs.
          </p>
        </Section>

        {/* ---- 4. Trigger Analysis ---- */}
        <Section number={4} title="Trigger Analysis">
          <p className="text-xs text-[#5A7A94] uppercase mb-2">
            Top triggers by frequency
          </p>
          <div className="space-y-1.5">
            {triggerData.map((t, i) => (
              <div
                key={t.trigger}
                className={`flex items-center justify-between text-sm px-3 py-1.5 rounded-lg ${
                  i % 2 === 0 ? 'bg-[#081624]' : 'bg-[#0D1B2A]'
                }`}
              >
                <span className="text-white">{t.trigger}</span>
                <span className="font-bold text-amber-400">{t.freq}x</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="bg-[#081624] rounded-xl p-3 border border-[#1A3A5C]">
              <p className="text-xs text-[#5A7A94] uppercase">
                Time-of-day pattern
              </p>
              <p className="text-sm text-amber-400 font-semibold">
                3&ndash;5 PM highest risk (after-school)
              </p>
            </div>
            <div className="bg-[#081624] rounded-xl p-3 border border-[#1A3A5C]">
              <p className="text-xs text-[#5A7A94] uppercase">Environmental</p>
              <p className="text-sm text-white">
                Noise above{' '}
                <span className="font-bold text-[#F87171]">50 dB</span>{' '}
                correlates with 73% of elevated episodes
              </p>
            </div>
          </div>

          <p className="text-sm text-amber-400 italic mt-1">
            New trigger identified: change of pick-up person
          </p>
        </Section>

        {/* ---- 5. Intervention Effectiveness ---- */}
        <Section number={5} title="Intervention Effectiveness">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#5A7A94] uppercase text-xs">
                  <th className="pb-2 pr-4">Strategy</th>
                  <th className="pb-2 pr-4">Context</th>
                  <th className="pb-2 text-right">Success rate</th>
                </tr>
              </thead>
              <tbody>
                {interventionData.map((d, i) => (
                  <tr
                    key={d.strategy}
                    className={i % 2 === 0 ? 'bg-[#081624]' : ''}
                  >
                    <td className="py-2 px-3 rounded-l-lg text-white font-medium">
                      {d.strategy}
                    </td>
                    <td className="py-2 px-3 text-[#8EADC1]">
                      {d.note || '\u2014'}
                    </td>
                    <td
                      className={`py-2 px-3 rounded-r-lg text-right font-bold ${d.color}`}
                    >
                      {d.rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-[#8EADC1] italic mt-2">
            Verbal prompts less effective than visual/signed prompts for Leo.
          </p>
        </Section>

        {/* ---- 6. Caregiver Tone Analysis ---- */}
        <Section number={6} title="Caregiver Tone Analysis">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Stat
              label="Avg calm %"
              value="79%"
              color="text-emerald-400"
            />
            <Stat
              label="Trend"
              value="68% → 79%"
              color="text-emerald-400"
            />
            <Stat
              label="Coaching accepted"
              value="67%"
              color="text-[#38C9F0]"
            />
            <Stat
              label="Calm tone effect"
              value="40% faster de-escalation"
              color="text-emerald-400"
            />
          </div>
          <p className="text-sm text-[#8EADC1] mt-2">
            Correlation: parent calm tone &rarr;{' '}
            <span className="text-emerald-400 font-bold">
              40% faster de-escalation
            </span>
          </p>
        </Section>

        {/* ---- 7. Sleep & Biometric Patterns ---- */}
        <Section number={7} title="Sleep & Biometric Patterns">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Stat
              label="Avg sleep"
              value="5.8h"
              color="text-[#F87171]"
            />
            <Stat
              label="Recommended"
              value="9h"
              color="text-[#5A7A94]"
            />
            <Stat
              label="HR baseline"
              value="82 BPM"
              color="text-white"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="bg-[#081624] rounded-xl p-3 border border-[#1A3A5C]">
              <p className="text-xs text-[#5A7A94] uppercase">
                Sleep-behaviour link
              </p>
              <p className="text-sm text-white">
                Nights with{' '}
                <span className="font-bold text-[#F87171]">&lt; 6h</span>{' '}
                sleep correlate with{' '}
                <span className="font-bold text-amber-400">
                  2.4x more elevated episodes
                </span>{' '}
                the following day
              </p>
            </div>
            <div className="bg-[#081624] rounded-xl p-3 border border-[#1A3A5C]">
              <p className="text-xs text-[#5A7A94] uppercase">
                Elevated episode HR
              </p>
              <p className="text-sm text-white">
                Average{' '}
                <span className="font-bold text-[#F87171]">115 BPM</span>{' '}
                during episodes (baseline 82 BPM)
              </p>
            </div>
          </div>
        </Section>

        {/* ---- 8. Recommendations ---- */}
        <Section number={8} title="Recommendations">
          <ul className="space-y-3">
            {[
              'Consider structured decompression routine after school (15 min)',
              'Visual schedule for transitions shows highest effectiveness',
              'Sign vocabulary expanding well \u2014 continue encouraging \u201Cbreak\u201D and \u201Chelp\u201D signs',
              'Sleep optimisation may significantly reduce daytime dysregulation',
            ].map((r, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-[#8EADC1]"
              >
                <span className="mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-[#38C9F0]/15 text-[#38C9F0] text-xs font-bold">
                  {i + 1}
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-[#5A7A94] mt-4 italic">
            These recommendations are AI-generated based on logged patterns and
            are intended as supportive guidance only.
          </p>
        </Section>

        {/* ---- Footer ---- */}
        <footer className="text-center space-y-2 pt-6 border-t border-[#1A3A5C]">
          <p className="text-xs text-[#5A7A94]">
            This report was generated by HarmonyAlert using on-device multimodal
            analysis.
          </p>
          <p className="text-xs text-[#5A7A94]">
            It is intended as supplementary information for clinical
            professionals and does not constitute a diagnosis.
          </p>
          <p className="text-xs text-[#5A7A94]">
            &copy; 2026 HarmonyAlert &middot; harmonyalert.com
          </p>
        </footer>

        {/* ---- Action Buttons ---- */}
        <div className="flex flex-wrap items-center justify-center gap-3 pb-10 print:hidden">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-[#0D1B2A] border border-[#1A3A5C] text-[#8EADC1] hover:text-white text-sm font-medium transition-colors"
          >
            Print / Save as PDF
          </button>
          <button
            onClick={handleShare}
            className="px-5 py-2.5 rounded-xl bg-[#0D1B2A] border border-[#1A3A5C] text-[#8EADC1] hover:text-white text-sm font-medium transition-colors"
          >
            Share Securely
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#38C9F0] to-[#6C63FF] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
