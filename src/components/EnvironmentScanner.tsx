import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';

interface EnvironmentScannerProps {
  onClose: () => void;
}

// ---------- helpers ----------

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function rmsToDb(rms: number): number {
  if (rms <= 0) return 0;
  // Scale RMS (0-1) to a dB-like reading (0-100)
  const db = 20 * Math.log10(rms) + 90; // offset so silence ~0, loud ~90+
  return clamp(Math.round(db), 0, 100);
}

function getNoiseLabel(db: number) {
  if (db < 30) return { label: 'Quiet', color: '#00D9A6' };
  if (db < 50) return { label: 'Moderate', color: '#F0C038' };
  if (db < 70) return { label: 'Loud', color: '#FF8C42' };
  return { label: 'Very loud', color: '#FF6B6B' };
}

function getLightLabel(pct: number) {
  if (pct < 30) return { label: 'Dim', color: '#5A7A9B' };
  if (pct < 60) return { label: 'Comfortable', color: '#00D9A6' };
  if (pct < 80) return { label: 'Bright', color: '#F0C038' };
  return { label: 'Very bright', color: '#FF6B6B' };
}

function getCrowdLabel(db: number) {
  if (db < 30) return 'Quiet environment';
  if (db < 50) return 'Some activity nearby';
  return 'Busy environment';
}

function getTimeContext(timeStr: string): { text: string; isGood: boolean } {
  // Parse hour from timeStr like "3:45 PM" or "10:15 AM"
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  let hour = 0;
  if (match) {
    hour = parseInt(match[1]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
  } else {
    hour = new Date().getHours();
  }

  if (hour >= 15 && hour < 17) {
    return {
      text: `${timeStr} — this is typically Leo's most difficult time (after-school transition)`,
      isGood: false,
    };
  }
  if (hour >= 9 && hour < 12) {
    return {
      text: `${timeStr} — Leo is usually calm and regulated at this time`,
      isGood: true,
    };
  }
  if (hour >= 12 && hour < 14) {
    return {
      text: `${timeStr} — lunchtime can be unpredictable for Leo`,
      isGood: false,
    };
  }
  if (hour >= 17 && hour < 19) {
    return {
      text: `${timeStr} — Leo is winding down, keep stimulation low`,
      isGood: false,
    };
  }
  if (hour >= 19 || hour < 7) {
    return {
      text: `${timeStr} — evening routine time, Leo does well with consistency`,
      isGood: true,
    };
  }
  return {
    text: `${timeStr} — a generally neutral time for Leo`,
    isGood: true,
  };
}

function getScoreColor(score: number) {
  if (score >= 80) return '#00D9A6';
  if (score >= 60) return '#F0C038';
  if (score >= 40) return '#FF8C42';
  return '#FF6B6B';
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Great for Leo';
  if (score >= 60) return 'Mostly okay';
  if (score >= 40) return 'Some concerns';
  return 'Not ideal — consider changes';
}

// ---------- Score Circle SVG ----------

function ScoreCircle({ score }: { score: number }) {
  const size = 180;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalised = clamp(score, 0, 100);
  const offset = circumference - (normalised / 100) * circumference;
  const color = getScoreColor(score);
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(56, 201, 240, 0.08)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.6s ease',
              filter: `drop-shadow(0 0 8px ${color}40)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold text-5xl leading-none"
            style={{ color, transition: 'color 0.6s ease' }}
          >
            {normalised}
          </span>
          <span className="text-[#5A7A9B] text-xs mt-1">/ 100</span>
        </div>
      </div>
      <p
        className="text-base font-semibold text-center"
        style={{ color, transition: 'color 0.6s ease' }}
      >
        {getScoreLabel(score)}
      </p>
    </div>
  );
}

// ---------- Bar Meter ----------

function BarMeter({
  value,
  max,
  color,
  thresholdPct,
}: {
  value: number;
  max: number;
  color: string;
  thresholdPct?: number;
}) {
  const pct = clamp((value / max) * 100, 0, 100);
  return (
    <div className="relative h-2.5 w-full bg-[#1A3A5C] rounded-full overflow-visible">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
      {thresholdPct !== undefined && (
        <div
          className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-white/40 rounded-full"
          style={{ left: `${clamp(thresholdPct, 0, 100)}%` }}
        />
      )}
    </div>
  );
}

// ---------- Animated dots ----------

function AnimatedDots() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(id);
  }, []);
  return <span className="inline-block w-4 text-left">{dots}</span>;
}

// ---------- Main Component ----------

export default function EnvironmentScanner({ onClose }: EnvironmentScannerProps) {
  const sensorReadings = useAppStore((s) => s.sensorReadings);
  const childProfile = useAppStore((s) => s.childProfile);

  const [noiseDb, setNoiseDb] = useState<number>(sensorReadings.context.ambientNoise);
  const [micAvailable, setMicAvailable] = useState(false);
  const [scanning, setScanning] = useState(true);
  const [, setScanCount] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const childName = childProfile.name || 'Leo';
  const soundSensitivity = childProfile.sensoryProfile.sound.level;
  const lightSensitivity = childProfile.sensoryProfile.light.level;
  const ambientLight = sensorReadings.context.ambientLight;
  const timeOfDay = sensorReadings.context.timeOfDay;

  // ---------- mic setup ----------
  const startMic = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      streamRef.current = stream;
      setMicAvailable(true);
    } catch {
      setMicAvailable(false);
    }
  }, []);

  const readNoise = useCallback(() => {
    if (analyserRef.current && micAvailable) {
      const data = new Float32Array(analyserRef.current.fftSize);
      analyserRef.current.getFloatTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i];
      }
      const rms = Math.sqrt(sum / data.length);
      setNoiseDb(rmsToDb(rms));
    } else {
      // Fallback: use store value with slight randomisation
      setNoiseDb(() => {
        const base = sensorReadings.context.ambientNoise;
        const jitter = (Math.random() - 0.5) * 4;
        return clamp(Math.round(base + jitter), 0, 100);
      });
    }
  }, [micAvailable, sensorReadings.context.ambientNoise]);

  // ---------- scanning lifecycle ----------
  const startScan = useCallback(() => {
    setScanning(true);
    readNoise();
    // Read every 500ms for 3 seconds
    let reads = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      readNoise();
      reads++;
      if (reads >= 6) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setScanning(false);
      }
    }, 500);
    setScanCount((c) => c + 1);
  }, [readNoise]);

  // init
  useEffect(() => {
    startMic().then(() => {
      // Small delay so mic settles
      setTimeout(() => startScan(), 300);
    });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- computed values ----------
  const noise = getNoiseLabel(noiseDb);
  const light = getLightLabel(ambientLight);
  const crowd = getCrowdLabel(noiseDb);
  const timeCtx = getTimeContext(timeOfDay);

  // Sensory load: weighted combination
  const sensoryLoadPct = useMemo(() => {
    const noiseContrib = (noiseDb / 100) * 0.4;
    const lightContrib = (ambientLight / 100) * 0.25;
    const crowdContrib = noiseDb > 50 ? 0.25 : noiseDb > 30 ? 0.12 : 0.05;
    const timeContrib = timeCtx.isGood ? 0.05 : 0.15;
    return clamp(Math.round((noiseContrib + lightContrib + crowdContrib + timeContrib) * 100), 0, 100);
  }, [noiseDb, ambientLight, timeCtx.isGood]);

  // Threshold based on average sensitivity
  const thresholdPct = useMemo(() => {
    const avgSensitivity = (soundSensitivity + lightSensitivity) / 2;
    // Higher sensitivity = lower threshold
    return clamp(Math.round(100 - avgSensitivity * 0.7), 25, 90);
  }, [soundSensitivity, lightSensitivity]);

  const loadRatio = sensoryLoadPct / thresholdPct;

  // Overall score (inverse of load ratio, scaled)
  const overallScore = useMemo(() => {
    let score = 100;
    // Noise penalty
    if (noiseDb > 40) score -= (noiseDb - 40) * 0.8;
    if (noiseDb > 60) score -= (noiseDb - 60) * 0.5;
    // Light penalty
    if (ambientLight > 80) score -= (ambientLight - 80) * 0.5;
    if (ambientLight < 20) score -= (20 - ambientLight) * 0.3;
    // Time penalty
    if (!timeCtx.isGood) score -= 10;
    // Sensitivity multiplier
    const sensitivityFactor = (soundSensitivity + lightSensitivity) / 200;
    score -= sensitivityFactor * 15;
    return clamp(Math.round(score), 0, 100);
  }, [noiseDb, ambientLight, timeCtx.isGood, soundSensitivity, lightSensitivity]);

  // ---------- recommendations ----------
  const recommendations = useMemo(() => {
    const recs: { icon: string; text: string; type: 'good' | 'warning' | 'info' }[] = [];

    if (noiseDb < 40) {
      recs.push({ icon: 'check', text: 'Noise level is comfortable — no action needed', type: 'good' });
    } else if (noiseDb < 60) {
      recs.push({
        icon: 'warning',
        text: `Noise is moderate — offer ${childName} ear defenders if they seem uncomfortable`,
        type: 'warning',
      });
    } else {
      recs.push({
        icon: 'warning',
        text: `Noise is high — offer ear defenders or move to a quieter space`,
        type: 'warning',
      });
    }

    if (ambientLight >= 30 && ambientLight <= 70) {
      recs.push({ icon: 'check', text: `Current light level is comfortable for ${childName}`, type: 'good' });
    } else if (ambientLight > 70) {
      recs.push({
        icon: 'warning',
        text: 'Bright environment — consider sunglasses or moving to shade',
        type: 'warning',
      });
    } else {
      recs.push({ icon: 'info', text: 'Low light — this may be calming, or increase if activity needed', type: 'info' });
    }

    if (!timeCtx.isGood) {
      recs.push({
        icon: 'warning',
        text: `Approaching ${childName}'s difficult time — prepare calming tools`,
        type: 'warning',
      });
    }

    if (loadRatio < 0.6) {
      recs.push({ icon: 'check', text: 'Good environment for a social activity', type: 'good' });
    } else if (loadRatio > 0.8) {
      recs.push({
        icon: 'warning',
        text: `Sensory load is high — consider reducing input or taking a break`,
        type: 'warning',
      });
    }

    return recs.slice(0, 4);
  }, [noiseDb, ambientLight, timeCtx.isGood, loadRatio, childName]);

  // ---------- render ----------
  return (
    <div className="fixed inset-0 z-[200] bg-[#060E1C] overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-white text-2xl font-bold" style={{ fontFamily: 'Glory, sans-serif' }}>
              Environment Check
            </h1>
            <p className="text-[#5A7A9B] text-sm mt-1">
              {scanning ? (
                <>
                  Scanning {childName}'s environment
                  <AnimatedDots />
                </>
              ) : (
                `Scan complete for ${childName}'s environment`
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[#0D1B2A] border border-[#1A3A5C] text-[#5A7A9B] hover:text-white transition-colors shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Overall Score Circle */}
        <div className="flex justify-center mb-8">
          <ScoreCircle score={overallScore} />
        </div>

        {/* Factor Cards */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Noise Level */}
          <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#132D46] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38C9F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                    <path d="M19 10v2a7 7 0 01-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm">Noise Level</span>
                {micAvailable && (
                  <span className="text-[10px] text-[#00D9A6] uppercase tracking-wider font-bold">Live</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg">{noiseDb}</span>
                <span className="text-[#5A7A9B] text-xs">dB</span>
              </div>
            </div>
            <BarMeter value={noiseDb} max={100} color={noise.color} />
            <div className="flex justify-between mt-1.5 mb-3">
              <span className="text-[10px] text-[#5A7A9B]">Quiet</span>
              <span className="text-xs font-semibold" style={{ color: noise.color }}>{noise.label}</span>
              <span className="text-[10px] text-[#5A7A9B]">Very loud</span>
            </div>
            <div className="bg-[#0A1525] rounded-xl px-3 py-2.5 text-xs leading-relaxed">
              <p className="text-[#C8D4E4]">
                {childName}'s sound sensitivity:{' '}
                <span className="font-bold" style={{ color: soundSensitivity > 70 ? '#FF6B6B' : soundSensitivity > 40 ? '#F0C038' : '#00D9A6' }}>
                  {soundSensitivity > 70 ? 'HIGH' : soundSensitivity > 40 ? 'MODERATE' : 'LOW'} ({soundSensitivity}/100)
                </span>
              </p>
              {noiseDb > 40 && soundSensitivity > 50 && (
                <p className="text-[#F0C038] mt-1">
                  Current noise level may cause discomfort. Consider ear defenders.
                </p>
              )}
              {noiseDb <= 40 && (
                <p className="text-[#00D9A6] mt-1">
                  Current noise level is within {childName}'s comfort zone.
                </p>
              )}
            </div>
          </div>

          {/* Light Level */}
          <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#132D46] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F0C038" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm">Light Level</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-lg">{ambientLight}</span>
                <span className="text-[#5A7A9B] text-xs">%</span>
              </div>
            </div>
            <BarMeter value={ambientLight} max={100} color={light.color} />
            <div className="flex justify-between mt-1.5 mb-3">
              <span className="text-[10px] text-[#5A7A9B]">Dim</span>
              <span className="text-xs font-semibold" style={{ color: light.color }}>{light.label}</span>
              <span className="text-[10px] text-[#5A7A9B]">Very bright</span>
            </div>
            <div className="bg-[#0A1525] rounded-xl px-3 py-2.5 text-xs leading-relaxed">
              <p className="text-[#C8D4E4]">
                {childName}'s light sensitivity:{' '}
                <span className="font-bold" style={{ color: lightSensitivity > 70 ? '#FF6B6B' : lightSensitivity > 40 ? '#F0C038' : '#00D9A6' }}>
                  {lightSensitivity > 70 ? 'HIGH' : lightSensitivity > 40 ? 'MODERATE' : 'LOW'} ({lightSensitivity}/100)
                </span>
              </p>
              <p className="mt-1" style={{ color: light.color === '#00D9A6' ? '#00D9A6' : '#F0C038' }}>
                {light.label === 'Comfortable'
                  ? `Current light level is comfortable for ${childName}`
                  : light.label === 'Dim'
                    ? `Low light — may be soothing for ${childName}`
                    : `Bright light — monitor ${childName} for squinting or avoidance`}
              </p>
            </div>
          </div>

          {/* Crowdedness */}
          <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#132D46] flex items-center justify-center">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B6EE8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <span className="text-white font-semibold text-sm">Crowdedness</span>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-3">
              {['Quiet', 'Some activity', 'Busy'].map((level, i) => {
                const isActive =
                  (i === 0 && noiseDb < 30) ||
                  (i === 1 && noiseDb >= 30 && noiseDb < 50) ||
                  (i === 2 && noiseDb >= 50);
                return (
                  <div
                    key={level}
                    className="flex-1 h-2 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: isActive
                        ? i === 0
                          ? '#00D9A6'
                          : i === 1
                            ? '#F0C038'
                            : '#FF6B6B'
                        : '#1A3A5C',
                    }}
                  />
                );
              })}
            </div>
            <p className="text-sm font-semibold text-[#C8D4E4] mb-2">{crowd}</p>
            <div className="bg-[#0A1525] rounded-xl px-3 py-2.5 text-xs leading-relaxed text-[#C8D4E4]">
              {noiseDb < 30
                ? `A calm setting — ${childName} can focus and self-regulate here.`
                : noiseDb < 50
                  ? `Moderate activity around. Keep an eye on ${childName} for signs of overstimulation.`
                  : `Busy environment with lots of stimulation. ${childName} may need a quiet retreat soon.`}
            </div>
          </div>

          {/* Time & Routine */}
          <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#132D46] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38C9F0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="text-white font-semibold text-sm">Time & Routine</span>
            </div>
            <div className="bg-[#0A1525] rounded-xl px-3 py-2.5 text-xs leading-relaxed">
              <p style={{ color: timeCtx.isGood ? '#00D9A6' : '#F0C038' }} className="font-semibold">
                {timeCtx.text}
              </p>
              <p className="text-[#C8D4E4] mt-1.5">
                Day type:{' '}
                <span className="text-white font-semibold capitalize">
                  {sensorReadings.context.dayType}
                </span>
                {' — '}
                Routine adherence:{' '}
                <span className="text-white font-semibold">
                  {Math.round(sensorReadings.context.routineAdherence * 100)}%
                </span>
              </p>
            </div>
          </div>

          {/* Overall Sensory Load */}
          <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#132D46] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF8C42" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <span className="text-white font-semibold text-sm">Overall Sensory Load</span>
            </div>
            <BarMeter
              value={sensoryLoadPct}
              max={100}
              color={loadRatio > 0.8 ? '#FF6B6B' : loadRatio > 0.6 ? '#F0C038' : '#00D9A6'}
              thresholdPct={thresholdPct}
            />
            <div className="flex justify-between mt-1.5 mb-1">
              <span className="text-[10px] text-[#5A7A9B]">Low</span>
              <span className="text-[10px] text-[#5A7A9B]/60">
                threshold
              </span>
              <span className="text-[10px] text-[#5A7A9B]">High</span>
            </div>
            <p
              className="text-sm font-semibold mt-2"
              style={{
                color: loadRatio > 0.8 ? '#FF6B6B' : loadRatio > 0.6 ? '#F0C038' : '#00D9A6',
              }}
            >
              {loadRatio > 0.8
                ? `Current load: ${sensoryLoadPct}% of ${childName}'s threshold — consider reducing input`
                : `Current load: ${sensoryLoadPct}% of ${childName}'s threshold`}
            </p>
          </div>
        </div>

        {/* Recommendations Panel */}
        <div className="mb-8">
          <h2 className="text-white text-lg font-bold mb-3" style={{ fontFamily: 'Glory, sans-serif' }}>
            Recommendations
          </h2>
          <div className="flex flex-col gap-2.5">
            {recommendations.map((rec, i) => {
              const borderColor =
                rec.type === 'good' ? '#00D9A6' : rec.type === 'warning' ? '#F0C038' : '#38C9F0';
              const iconColor = borderColor;
              return (
                <div
                  key={i}
                  className="bg-[#132D46] rounded-xl px-4 py-3 flex items-start gap-3"
                  style={{ borderLeft: `3px solid ${borderColor}` }}
                >
                  <div className="shrink-0 mt-0.5">
                    {rec.icon === 'check' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : rec.icon === 'warning' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                    )}
                  </div>
                  <p className="text-[#C8D4E4] text-sm leading-relaxed">{rec.text}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scan Again Button */}
        <button
          onClick={startScan}
          disabled={scanning}
          className="w-full py-3.5 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300"
          style={{
            fontFamily: 'Glory, sans-serif',
            backgroundColor: scanning ? '#1A3A5C' : '#38C9F0',
            color: scanning ? '#5A7A9B' : '#060E1C',
            cursor: scanning ? 'not-allowed' : 'pointer',
          }}
        >
          {scanning ? 'Scanning...' : 'Scan Again'}
        </button>

        {/* Mic status note */}
        <p className="text-center text-[10px] text-[#5A7A9B] mt-3">
          {micAvailable
            ? 'Using live microphone for noise readings'
            : 'Microphone unavailable — using estimated noise data'}
        </p>
      </div>
    </div>
  );
}
