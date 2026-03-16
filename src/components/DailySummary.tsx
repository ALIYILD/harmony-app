import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { generateMockDailySummary, weeklyStateData, hourlyStateData } from '../data/mockData';

const STATE_COLORS: Record<string, string> = {
  calm: '#00D9A6',
  engaged: '#8B6EE8',
  uneasy: '#F0C038',
  confused: '#38C9F0',
  frustrated: '#F0C038',
  overloaded: '#FF6B6B',
  dysregulated: '#FF6B6B',
  shutdown_risk: '#FF6B6B',
  sensory_seeking: '#8B6EE8',
};

const STATE_LABELS: Record<string, string> = {
  calm: 'Calm',
  engaged: 'Engaged',
  uneasy: 'Uneasy',
  confused: 'Confused',
  frustrated: 'Frustrated',
  overloaded: 'Overloaded',
  dysregulated: 'Dysregulated',
  shutdown_risk: 'Shutdown Risk',
  sensory_seeking: 'Sensory Seeking',
};

const patternInsights = [
  { icon: '🔄', text: 'After-school transitions: elevated on 4 of 5 weekdays' },
  { icon: '🔊', text: 'Sound sensitivity peaks between 3-5 PM' },
  { icon: '🛋️', text: 'Weighted blanket: most effective calming strategy (78% success)' },
  { icon: '☀️', text: 'Calm periods longest on weekends (avg +45 min)' },
];

const darkTooltipStyle = {
  backgroundColor: '#0D1B2A',
  border: '1px solid #1A3A5C',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#fff',
};

export default function DailySummary() {
  const summary = useMemo(() => generateMockDailySummary(), []);

  const pieData = useMemo(
    () =>
      Object.entries(summary.stateBreakdown)
        .filter(([, value]) => value > 0)
        .map(([key, value]) => ({
          name: STATE_LABELS[key] || key,
          value,
          color: STATE_COLORS[key] || '#5A7A9B',
        })),
    [summary]
  );

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#060E1C' }}>
      <div className="max-w-lg mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5 overflow-x-hidden">
        {/* ---- Date Header ---- */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-white">Today's Summary</h1>
          <p className="text-sm text-[#5A7A9B] mt-0.5">{summary.date}</p>
          <p className="text-sm font-medium mt-1 bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(to right, #38C9F0, #8B6EE8)', WebkitBackgroundClip: 'text' }}>
            {summary.overallMood}
          </p>
        </div>

        {/* ---- Key Stats Row ---- */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {/* Calm */}
          <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-2 sm:p-3 text-center">
            <span className="text-base sm:text-lg">🟢</span>
            <p className="text-xl sm:text-2xl font-bold text-[#00D9A6]">
              {summary.totalCalmMinutes}
            </p>
            <p className="text-[10px] sm:text-xs text-[#5A7A9B]">min calm</p>
          </div>
          {/* Elevated */}
          <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-2 sm:p-3 text-center">
            <span className="text-base sm:text-lg">🟡</span>
            <p className="text-xl sm:text-2xl font-bold text-[#F0C038]">
              {summary.totalElevatedMinutes}
            </p>
            <p className="text-[10px] sm:text-xs text-[#5A7A9B]">min elevated</p>
          </div>
          {/* High Risk */}
          <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-2 sm:p-3 text-center">
            <span className="text-base sm:text-lg">🔴</span>
            <p className="text-xl sm:text-2xl font-bold text-[#FF6B6B]">
              {summary.totalHighRiskMinutes}
            </p>
            <p className="text-[10px] sm:text-xs text-[#5A7A9B]">min high risk</p>
          </div>
        </div>

        {/* ---- State Breakdown Chart ---- */}
        <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-3 sm:p-4">
          <h2 className="text-sm font-semibold text-[#C8D4E4] mb-2">State Breakdown</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: unknown, name: unknown) => [`${value}%`, String(name)]}
                contentStyle={darkTooltipStyle}
                itemStyle={{ color: '#C8D4E4' }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center mt-2">
            {pieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-[#C8D4E4]">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Today's Timeline Chart ---- */}
        <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-3 sm:p-4">
          <h2 className="text-sm font-semibold text-[#C8D4E4] mb-2">Today's Timeline</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hourlyStateData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B6EE8" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#38C9F0" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#38C9F0" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A3A5C" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#5A7A9B' }} stroke="#1A3A5C" />
              <YAxis tick={{ fontSize: 10, fill: '#5A7A9B' }} domain={[0, 100]} stroke="#1A3A5C" />
              <Tooltip
                contentStyle={darkTooltipStyle}
                itemStyle={{ color: '#C8D4E4' }}
                formatter={(value: unknown) => [`${value}`, 'Stress Level']}
              />
              <Area
                type="monotone"
                dataKey="level"
                stroke="#38C9F0"
                strokeWidth={2}
                fill="url(#stressGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ---- Weekly Overview Chart ---- */}
        <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-3 sm:p-4">
          <h2 className="text-sm font-semibold text-[#C8D4E4] mb-2">Weekly Overview</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyStateData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A3A5C" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5A7A9B' }} stroke="#1A3A5C" />
              <YAxis tick={{ fontSize: 10, fill: '#5A7A9B' }} stroke="#1A3A5C" />
              <Tooltip contentStyle={darkTooltipStyle} itemStyle={{ color: '#C8D4E4' }} />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: '#C8D4E4' }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    calm: 'Calm',
                    elevated: 'Elevated',
                    highRisk: 'High Risk',
                  };
                  return labels[value] || value;
                }}
              />
              <Bar dataKey="calm" stackId="a" fill="#00D9A6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="elevated" stackId="a" fill="#F0C038" />
              <Bar dataKey="highRisk" stackId="a" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ---- Highlights Card ---- */}
        <div
          className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4"
          style={{ borderLeft: '4px solid #38C9F0' }}
        >
          <h2 className="text-sm font-semibold text-[#C8D4E4] mb-2">Highlights</h2>
          <ul className="space-y-2">
            {summary.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#C8D4E4]">
                <span className="shrink-0 mt-0.5">&#11088;</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- Concerns Card ---- */}
        <div
          className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4"
          style={{ borderLeft: '4px solid #F0C038' }}
        >
          <h2 className="text-sm font-semibold text-[#C8D4E4] mb-2">Concerns</h2>
          <ul className="space-y-2">
            {summary.concerns.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#C8D4E4]">
                <span className="shrink-0 mt-0.5">&#9888;&#65039;</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- Intervention Effectiveness ---- */}
        <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-3 sm:p-5 text-center">
          <h2 className="text-sm font-semibold text-[#C8D4E4] mb-3">Intervention Effectiveness</h2>
          <div className="relative inline-flex items-center justify-center">
            <svg width="120" height="120" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#1A3A5C"
                strokeWidth="10"
              />
              {/* Progress circle */}
              <defs>
                <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38C9F0" />
                  <stop offset="100%" stopColor="#8B6EE8" />
                </linearGradient>
              </defs>
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="url(#circleGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(summary.interventionSuccess / 100) * 314.16} 314.16`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <span className="absolute text-3xl font-bold text-[#38C9F0]">
              {summary.interventionSuccess}%
            </span>
          </div>
          <p className="text-sm text-[#5A7A9B] mt-2">of logged interventions helped</p>
        </div>

        {/* ---- Pattern Insights ---- */}
        <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-3 sm:p-4">
          <h2 className="text-sm font-semibold text-[#C8D4E4] mb-3">Pattern Insights</h2>
          <div className="space-y-2.5">
            {patternInsights.map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-xl p-3 bg-[#132D46]"
              >
                <span className="text-lg shrink-0">{insight.icon}</span>
                <p className="text-sm text-[#C8D4E4]">{insight.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
