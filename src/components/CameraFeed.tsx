import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { ChildState } from '../types';

/* ─── colour map by state ─── */
const STATE_COLOR: Record<ChildState, string> = {
  calm: '#38C9F0',
  engaged: '#38C9F0',
  uneasy: '#F0C038',
  confused: '#F0C038',
  frustrated: '#FF6B6B',
  overloaded: '#FF6B6B',
  dysregulated: '#FF4444',
  shutdown_risk: '#CC44CC',
  sensory_seeking: '#F0C038',
};

const EMOTION_LABEL: Record<ChildState, string> = {
  calm: 'Happy \u{1F60A}',
  engaged: 'Engaged \u{1F929}',
  uneasy: 'Uncertain \u{1F610}',
  confused: 'Confused \u{1F615}',
  frustrated: 'Distressed \u{1F624}',
  overloaded: 'Overloaded \u{1F630}',
  dysregulated: 'Dysregulated \u{1F616}',
  shutdown_risk: 'Withdrawn \u{1F636}',
  sensory_seeking: 'Seeking \u{1F50D}',
};

/* ─── helpers ─── */
function drawCornerBrackets(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cornerLen: number,
  color: string,
  lineWidth: number,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  const r = 6;

  // top-left
  ctx.beginPath();
  ctx.moveTo(x, y + cornerLen);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.lineTo(x + cornerLen, y);
  ctx.stroke();

  // top-right
  ctx.beginPath();
  ctx.moveTo(x + w - cornerLen, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + cornerLen);
  ctx.stroke();

  // bottom-left
  ctx.beginPath();
  ctx.moveTo(x, y + h - cornerLen);
  ctx.lineTo(x, y + h - r);
  ctx.arcTo(x, y + h, x + r, y + h, r);
  ctx.lineTo(x + cornerLen, y + h);
  ctx.stroke();

  // bottom-right
  ctx.beginPath();
  ctx.moveTo(x + w, y + h - cornerLen);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + w - cornerLen, y + h);
  ctx.stroke();
}

function formatTime() {
  const d = new Date();
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/* ─── metric bar sub-component ─── */
function MetricBar({ label, value, flagged }: { label: string; value: number; flagged?: boolean }) {
  const pct = Math.min(Math.max(value * 100, 0), 100);
  const barColor =
    pct > 60 ? '#FF6B6B' : pct > 35 ? '#F0C038' : '#38C9F0';

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-300 font-mono">
          {label}
          {flagged && (
            <span className="ml-1.5 text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded-full font-semibold">
              FLAG
            </span>
          )}
        </span>
        <span className="text-white font-mono font-semibold">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${barColor}88, ${barColor})` }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CameraFeed — main component
   ═══════════════════════════════════════════════════════ */
export default function CameraFeed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const frameCountRef = useRef(0);

  const [cameraReady, setCameraReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const currentState = useAppStore((s) => s.currentState);
  const sensorReadings = useAppStore((s) => s.sensorReadings);

  /* ── extra detection box positions (seeded once) ── */
  const extraBoxesRef = useRef([
    { x: 0.06, y: 0.18, w: 0.13, h: 0.11, label: 'Hand gesture' },
    { x: 0.72, y: 0.65, w: 0.16, h: 0.12, label: 'Sensory toy' },
  ]);

  /* ── start camera ── */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraReady(true);
        setPermissionDenied(false);
      }
    } catch {
      setPermissionDenied(true);
    }
  }, []);

  /* ── canvas draw loop ── */
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;
    const frame = frameCountRef.current++;
    const t = frame / 60; // seconds-ish

    ctx.clearRect(0, 0, W, H);

    /* ── scan lines ── */
    ctx.strokeStyle = 'rgba(56,201,240,0.05)';
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    /* ── moving scan bar ── */
    const scanY = (frame * 1.2) % H;
    const grad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20);
    grad.addColorStop(0, 'rgba(56,201,240,0)');
    grad.addColorStop(0.5, 'rgba(56,201,240,0.10)');
    grad.addColorStop(1, 'rgba(56,201,240,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanY - 20, W, 40);

    /* ── state-based colours ── */
    const state = currentState.primaryState;
    const color = STATE_COLOR[state] || '#38C9F0';
    const confidence = currentState.confidence;

    /* ── face bounding box (centre-ish with micro-drift) ── */
    const bw = 180 * (W / 640);
    const bh = 220 * (H / 480);
    const driftX = Math.sin(t * 0.7) * 4;
    const driftY = Math.cos(t * 0.9) * 3;
    const bx = (W - bw) / 2 + 12 + driftX;
    const by = (H - bh) / 2 - 30 + driftY;

    // pulse alpha
    const pulseAlpha = 0.7 + 0.3 * Math.sin(t * 2.5);
    const pulsedColor = color + Math.round(pulseAlpha * 255).toString(16).padStart(2, '0');

    drawCornerBrackets(ctx, bx, by, bw, bh, 28 * (W / 640), pulsedColor, 2.5);

    /* ── label badge: name ── */
    ctx.font = `bold ${11 * (W / 640)}px "SF Mono", "Fira Code", monospace`;
    const nameText = 'Leo \u00B7 5yr \u00B7 Male';
    const nameMetrics = ctx.measureText(nameText);
    const badgePad = 6 * (W / 640);
    const badgeH = 18 * (H / 480);
    const badgeX = bx;
    const badgeY = by - badgeH - 6;

    ctx.fillStyle = 'rgba(13,27,42,0.82)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, nameMetrics.width + badgePad * 2, badgeH, 4);
    ctx.fill();
    ctx.fillStyle = '#E0E8F0';
    ctx.fillText(nameText, badgeX + badgePad, badgeY + badgeH - 5 * (H / 480));

    /* ── emotion label below name badge ── */
    const emotionText = EMOTION_LABEL[state] || state;
    ctx.font = `${10 * (W / 640)}px "SF Mono", "Fira Code", monospace`;
    const emMetrics = ctx.measureText(emotionText);
    const emBadgeY = badgeY + badgeH + 3;
    const emBadgeH = 16 * (H / 480);

    ctx.fillStyle = 'rgba(13,27,42,0.82)';
    ctx.beginPath();
    ctx.roundRect(badgeX, emBadgeY, emMetrics.width + badgePad * 2 + 12, emBadgeH, 4);
    ctx.fill();

    // colored dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(badgeX + badgePad + 4, emBadgeY + emBadgeH / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.fillText(emotionText, badgeX + badgePad + 12, emBadgeY + emBadgeH - 4 * (H / 480));

    /* ── confidence label at bottom of box ── */
    const confText = `Confidence: ${Math.round(confidence * 100)}%`;
    ctx.font = `${10 * (W / 640)}px "SF Mono", "Fira Code", monospace`;
    const confMetrics = ctx.measureText(confText);
    const confBadgeY = by + bh + 6;
    const confBadgeH = 16 * (H / 480);

    ctx.fillStyle = 'rgba(13,27,42,0.82)';
    ctx.beginPath();
    ctx.roundRect(bx, confBadgeY, confMetrics.width + badgePad * 2, confBadgeH, 4);
    ctx.fill();
    ctx.fillStyle = '#A0B8D0';
    ctx.fillText(confText, bx + badgePad, confBadgeY + confBadgeH - 4 * (H / 480));

    /* ── extra detection boxes (decorative) ── */
    extraBoxesRef.current.forEach((box) => {
      const ex = box.x * W + Math.sin(t * 1.1 + box.x * 10) * 2;
      const ey = box.y * H + Math.cos(t * 0.8 + box.y * 10) * 2;
      const ew = box.w * W;
      const eh = box.h * H;

      drawCornerBrackets(ctx, ex, ey, ew, eh, 14 * (W / 640), 'rgba(56,201,240,0.4)', 1.5);

      ctx.font = `${9 * (W / 640)}px "SF Mono", "Fira Code", monospace`;
      const lm = ctx.measureText(box.label);
      ctx.fillStyle = 'rgba(13,27,42,0.72)';
      ctx.beginPath();
      ctx.roundRect(ex, ey - 14 * (H / 480), lm.width + 8, 14 * (H / 480), 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(56,201,240,0.7)';
      ctx.fillText(box.label, ex + 4, ey - 3 * (H / 480));
    });

    /* ── top overlay bar ── */
    const barH = 28 * (H / 480);
    ctx.fillStyle = 'rgba(13,27,42,0.75)';
    ctx.fillRect(0, 0, W, barH);
    // divider line
    ctx.strokeStyle = 'rgba(56,201,240,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barH);
    ctx.lineTo(W, barH);
    ctx.stroke();

    // recording dot (pulsing)
    const dotAlpha = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.fillStyle = `rgba(255,80,80,${dotAlpha})`;
    ctx.beginPath();
    ctx.arc(14 * (W / 640), barH / 2, 4 * (W / 640), 0, Math.PI * 2);
    ctx.fill();

    // outer glow
    ctx.fillStyle = `rgba(255,80,80,${dotAlpha * 0.25})`;
    ctx.beginPath();
    ctx.arc(14 * (W / 640), barH / 2, 7 * (W / 640), 0, Math.PI * 2);
    ctx.fill();

    // title
    ctx.font = `bold ${10 * (W / 640)}px "SF Mono", "Fira Code", monospace`;
    ctx.fillStyle = '#A0B8D0';
    ctx.letterSpacing = '2px';
    ctx.fillText('VISION ANALYSIS \u2014 LIVE', 26 * (W / 640), barH / 2 + 3.5);
    ctx.letterSpacing = '0px';

    // timestamp right-aligned
    const timeStr = formatTime();
    ctx.font = `${10 * (W / 640)}px "SF Mono", "Fira Code", monospace`;
    const timW = ctx.measureText(timeStr).width;
    ctx.fillStyle = '#607890';
    ctx.fillText(timeStr, W - timW - 10, barH / 2 + 3.5);

    /* ── crosshair at face centre ── */
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    const chLen = 8 * (W / 640);
    ctx.strokeStyle = `rgba(56,201,240,${0.2 + 0.1 * Math.sin(t * 3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - chLen, cy);
    ctx.lineTo(cx + chLen, cy);
    ctx.moveTo(cx, cy - chLen);
    ctx.lineTo(cx, cy + chLen);
    ctx.stroke();

    rafRef.current = requestAnimationFrame(drawFrame);
  }, [currentState]);

  /* ── lifecycle ── */
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      cancelAnimationFrame(rafRef.current);
    };
  }, [startCamera]);

  useEffect(() => {
    if (cameraReady) {
      rafRef.current = requestAnimationFrame(drawFrame);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [cameraReady, drawFrame]);

  /* ── derived vision metrics ── */
  const v = sensorReadings.vision;
  const posture =
    v.stillnessScore > 0.5
      ? 'Still / Resting'
      : v.movementVelocity > 0.4
        ? 'Active / Agitated'
        : 'Normal';

  const postureColor =
    v.movementVelocity > 0.4
      ? 'text-red-400'
      : v.stillnessScore > 0.5
        ? 'text-cyan-400'
        : 'text-slate-300';

  /* ═══ render ═══ */
  return (
    <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* ── Video + Canvas ── */}
        <div className="relative flex-1 min-h-[300px] bg-[#060E18]">
          {permissionDenied ? (
            /* ── Permission denied placeholder ── */
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              {/* simulated grid */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(56,201,240,1) 1px, transparent 1px), linear-gradient(90deg, rgba(56,201,240,1) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
              />
              {/* scan lines */}
              <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, rgba(56,201,240,1), rgba(56,201,240,1) 1px, transparent 1px, transparent 4px)',
                }}
              />
              <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[#1A3A5C]/50 border border-[#1A3A5C] flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                </div>
                <p className="text-slate-400 text-sm font-medium">Camera access required</p>
                <button
                  onClick={startCamera}
                  className="px-5 py-2 rounded-xl bg-[#38C9F0]/10 border border-[#38C9F0]/30 text-[#38C9F0] text-sm font-semibold hover:bg-[#38C9F0]/20 transition-colors cursor-pointer"
                >
                  Tap to enable camera
                </button>
              </div>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
                style={{ transform: 'scaleX(-1)' }}
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full"
                style={{ transform: 'scaleX(-1)' }}
              />
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#060E18]">
                  <div className="flex items-center gap-2 text-slate-500 text-sm">
                    <div className="w-4 h-4 border-2 border-[#38C9F0]/40 border-t-[#38C9F0] rounded-full animate-spin" />
                    Initialising camera...
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Side Metrics Panel ── */}
        <div className="lg:w-72 w-full border-t lg:border-t-0 lg:border-l border-[#1A3A5C] p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-[#1A3A5C]">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: STATE_COLOR[currentState.primaryState] }}
            />
            <h3 className="text-xs font-mono font-bold text-slate-300 tracking-wider uppercase">
              Vision Metrics
            </h3>
          </div>

          {/* Metric bars */}
          <div className="space-y-3">
            <MetricBar label="Facial Distress" value={v.facialDistress} />
            <MetricBar label="Body Tension" value={v.bodyTension} />

            {/* Movement velocity */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-mono">Movement</span>
                <span className="text-white font-mono font-semibold">
                  {v.movementVelocity.toFixed(2)}{' '}
                  <span className="text-slate-500 font-normal">m/s</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min(v.movementVelocity * 100, 100)}%`,
                    background:
                      v.movementVelocity > 0.5
                        ? 'linear-gradient(90deg, #FF6B6B88, #FF6B6B)'
                        : 'linear-gradient(90deg, #38C9F088, #38C9F0)',
                  }}
                />
              </div>
            </div>

            <MetricBar
              label="Repetitive Motion"
              value={v.repetitiveMotion}
              flagged={v.repetitiveMotion > 0.3}
            />
            <MetricBar label="Gaze Avoidance" value={v.gazeAvoidance} />
          </div>

          {/* Posture card */}
          <div className="mt-2 p-3 rounded-xl bg-[#0A1628] border border-[#1A3A5C]">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              Posture Analysis
            </p>
            <p className={`text-sm font-semibold font-mono ${postureColor}`}>{posture}</p>
            <div className="mt-1.5 flex gap-3 text-[10px] text-slate-500 font-mono">
              <span>
                Still:{' '}
                <span className="text-slate-400">{(v.stillnessScore * 100).toFixed(0)}%</span>
              </span>
              <span>
                Vel:{' '}
                <span className="text-slate-400">{v.movementVelocity.toFixed(2)}</span>
              </span>
            </div>
          </div>

          {/* Trajectory indicator */}
          <div className="p-3 rounded-xl bg-[#0A1628] border border-[#1A3A5C]">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-1">
              Trajectory
            </p>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-mono font-bold"
                style={{ color: STATE_COLOR[currentState.primaryState] }}
              >
                {currentState.trajectory === 'stable'
                  ? '\u2192 Stable'
                  : currentState.trajectory === 'escalating'
                    ? '\u2191 Escalating'
                    : '\u2193 De-escalating'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                ({Math.round(currentState.trajectoryConfidence * 100)}%)
              </span>
            </div>
          </div>

          {/* Modality contribution mini chart */}
          <div className="p-3 rounded-xl bg-[#0A1628] border border-[#1A3A5C]">
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
              Vision Contribution
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#38C9F0] transition-all duration-700"
                  style={{ width: `${currentState.modalityContributions.vision * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-[#38C9F0] font-semibold">
                {Math.round(currentState.modalityContributions.vision * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
