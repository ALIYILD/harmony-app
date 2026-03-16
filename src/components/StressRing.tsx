import type { ChildState, ConfidenceLevel } from '../types';

interface StressRingProps {
  value: number;
  size?: number;
  state: ChildState;
  confidence?: number;
  confidenceLevel?: ConfidenceLevel;
}

const stateColorMap: Record<ChildState, string> = {
  calm: '#00D9A6',
  engaged: '#00D9A6',
  uneasy: '#F0C038',
  confused: '#F0C038',
  sensory_seeking: '#F0C038',
  frustrated: '#FF6B6B',
  overloaded: '#FF6B6B',
  dysregulated: '#8B6EE8',
  shutdown_risk: '#8B6EE8',
};

const stateLabelMap: Record<ChildState, string> = {
  calm: 'Calm & Regulated',
  engaged: 'Engaged & Focused',
  uneasy: 'Possibly Uneasy',
  confused: 'May Be Confused',
  frustrated: 'Possibly Frustrated',
  overloaded: 'Likely Overloaded',
  dysregulated: 'Dysregulated',
  shutdown_risk: 'Shutdown Risk',
  sensory_seeking: 'Sensory Seeking',
};

export default function StressRing({
  value,
  size = 200,
  state,
  confidence,
  confidenceLevel,
}: StressRingProps) {
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedValue = Math.max(0, Math.min(100, value));
  const strokeDashoffset = circumference - (normalizedValue / 100) * circumference;
  const color = stateColorMap[state];
  const label = stateLabelMap[state];
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(56, 201, 240, 0.1)"
            strokeWidth={strokeWidth}
          />
          {/* Colored arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.5s ease',
            }}
          />
        </svg>

        {/* Center value */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color: '#FFFFFF' }}
        >
          <span
            className="font-bold leading-none"
            style={{
              fontSize: size * 0.22,
              transition: 'color 0.5s ease',
            }}
          >
            {normalizedValue}
          </span>
        </div>
      </div>

      {/* State label */}
      <p
        className="text-base font-semibold text-center leading-tight"
        style={{ color: '#C8D4E4', transition: 'color 0.5s ease' }}
      >
        {label}
      </p>

      {/* Confidence */}
      {confidence !== undefined && confidenceLevel && (
        <p className="text-xs text-center" style={{ color: '#5A7A9B' }}>
          Confidence: {confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1)} (
          {Math.round(confidence * 100)}%)
        </p>
      )}
    </div>
  );
}
