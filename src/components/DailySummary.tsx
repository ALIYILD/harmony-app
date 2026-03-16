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
  calm: '#00B894',
  engaged: '#6C5CE7',
  uneasy: '#FDCB6E',
  confused: '#74b9ff',
  frustrated: '#F59E0B',
  overloaded: '#FF6B6B',
  dysregulated: '#EF4444',
  shutdown_risk: '#d63031',
  sensory_seeking: '#a29bfe',
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

export default function DailySummary() {
  const summary = useMemo(() => generateMockDailySummary(), []);

  const pieData = useMemo(
    () =>
      Object.entries(summary.stateBreakdown)
        .filter(([, value]) => value > 0)
        .map(([key, value]) => ({
          name: STATE_LABELS[key] || key,
          value,
          color: STATE_COLORS[key] || '#ccc',
        })),
    [summary]
  );

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#F8F7FF' }}>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* ---- Date Header ---- */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Today's Summary</h1>
          <p className="text-sm text-gray-500 mt-0.5">{summary.date}</p>
          <p className="text-sm font-medium mt-1" style={{ color: '#6C5CE7' }}>
            {summary.overallMood}
          </p>
        </div>

        {/* ---- Key Stats Row ---- */}
        <div className="grid grid-cols-3 gap-3">
          {/* Calm */}
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <span className="text-lg">🟢</span>
            <p className="text-2xl font-bold" style={{ color: '#00B894' }}>
              {summary.totalCalmMinutes}
            </p>
            <p className="text-xs text-gray-500">min calm</p>
          </div>
          {/* Elevated */}
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <span className="text-lg">🟡</span>
            <p className="text-2xl font-bold" style={{ color: '#F59E0B' }}>
              {summary.totalElevatedMinutes}
            </p>
            <p className="text-xs text-gray-500">min elevated</p>
          </div>
          {/* High Risk */}
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <span className="text-lg">🔴</span>
            <p className="text-2xl font-bold" style={{ color: '#EF4444' }}>
              {summary.totalHighRiskMinutes}
            </p>
            <p className="text-xs text-gray-500">min high risk</p>
          </div>
        </div>

        {/* ---- State Breakdown Chart ---- */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">State Breakdown</h2>
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
                formatter={(value: number, name: string) => [`${value}%`, name]}
                contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
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
                <span className="text-xs text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Today's Timeline Chart ---- */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Today's Timeline</h2>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={hourlyStateData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="stressGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity={0.8} />
                  <stop offset="50%" stopColor="#F59E0B" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#00B894" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                formatter={(value: number) => [`${value}`, 'Stress Level']}
              />
              <Area
                type="monotone"
                dataKey="level"
                stroke="#6C5CE7"
                strokeWidth={2}
                fill="url(#stressGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* ---- Weekly Overview Chart ---- */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Weekly Overview</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyStateData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    calm: 'Calm',
                    elevated: 'Elevated',
                    highRisk: 'High Risk',
                  };
                  return labels[value] || value;
                }}
              />
              <Bar dataKey="calm" stackId="a" fill="#00B894" radius={[0, 0, 0, 0]} />
              <Bar dataKey="elevated" stackId="a" fill="#F59E0B" />
              <Bar dataKey="highRisk" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ---- Highlights Card ---- */}
        <div
          className="bg-white rounded-2xl p-4 shadow-sm"
          style={{ borderLeft: '4px solid #10B981' }}
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Highlights</h2>
          <ul className="space-y-2">
            {summary.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="shrink-0 mt-0.5">&#11088;</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- Concerns Card ---- */}
        <div
          className="bg-white rounded-2xl p-4 shadow-sm"
          style={{ borderLeft: '4px solid #F59E0B' }}
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Concerns</h2>
          <ul className="space-y-2">
            {summary.concerns.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="shrink-0 mt-0.5">&#9888;&#65039;</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* ---- Intervention Effectiveness ---- */}
        <div className="bg-white rounded-2xl p-5 shadow-sm text-center">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Intervention Effectiveness</h2>
          <div className="relative inline-flex items-center justify-center">
            <svg width="120" height="120" viewBox="0 0 120 120">
              {/* Background circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="10"
              />
              {/* Progress circle */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="#6C5CE7"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${(summary.interventionSuccess / 100) * 314.16} 314.16`}
                transform="rotate(-90 60 60)"
              />
            </svg>
            <span
              className="absolute text-3xl font-bold"
              style={{ color: '#6C5CE7' }}
            >
              {summary.interventionSuccess}%
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">of logged interventions helped</p>
        </div>

        {/* ---- Pattern Insights ---- */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Pattern Insights</h2>
          <div className="space-y-2.5">
            {patternInsights.map((insight, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 rounded-xl p-3"
                style={{ backgroundColor: '#F8F7FF' }}
              >
                <span className="text-lg shrink-0">{insight.icon}</span>
                <p className="text-sm text-gray-700">{insight.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
