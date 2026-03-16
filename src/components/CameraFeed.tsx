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
  calm: 'Happy',
  engaged: 'Engaged',
  uneasy: 'Uncertain',
  confused: 'Confused',
  frustrated: 'Distressed',
  overloaded: 'Overloaded',
  dysregulated: 'Dysregulated',
  shutdown_risk: 'Withdrawn',
  sensory_seeking: 'Seeking',
};

/* ─── body language state mapping ─── */
interface BodyLanguage {
  shoulders: string;
  hands: string;
  posture: string;
  gesture: string;
  gestureLabel: string;
}

function getBodyLanguage(state: ChildState): BodyLanguage {
  switch (state) {
    case 'calm':
    case 'engaged':
      return {
        shoulders: 'Relaxed',
        hands: 'Open / Resting',
        posture: 'Open',
        gesture: 'Reaching / Pointing',
        gestureLabel: 'Hand: Reaching / Pointing',
      };
    case 'uneasy':
    case 'confused':
      return {
        shoulders: 'Slightly Tense',
        hands: 'Fidgeting',
        posture: 'Shifting',
        gesture: 'Self-touching',
        gestureLabel: 'Hand: Self-touching',
      };
    case 'frustrated':
    case 'overloaded':
      return {
        shoulders: 'Raised / Tense',
        hands: 'Clenched / Covering ears',
        posture: 'Closed / Curled',
        gesture: 'Self-soothing',
        gestureLabel: 'Hand: Self-soothing gesture',
      };
    case 'dysregulated':
      return {
        shoulders: 'Very Tense',
        hands: 'Flapping / Hitting',
        posture: 'Rocking',
        gesture: 'Repetitive movement',
        gestureLabel: 'Body: Repetitive movement detected',
      };
    case 'shutdown_risk':
      return {
        shoulders: 'Dropped',
        hands: 'Still',
        posture: 'Collapsed',
        gesture: 'Withdrawal',
        gestureLabel: 'Body: Withdrawal posture',
      };
    case 'sensory_seeking':
      return {
        shoulders: 'Slightly Tense',
        hands: 'Fidgeting',
        posture: 'Shifting',
        gesture: 'Seeking stimulation',
        gestureLabel: 'Hand: Seeking stimulation',
      };
  }
}

/* ─── AU mapping by state ─── */
interface AUDisplay {
  topLeft: string | null;
  topRight: string | null;
  left: string | null;
  right: string | null;
  blinkRate: number;
}

function getAUDisplay(state: ChildState, t: number): AUDisplay {
  const baseBlinkRate = 12 + Math.round(Math.sin(t * 0.3) * 3);
  const isFrustrated = state === 'frustrated' || state === 'overloaded' || state === 'dysregulated';
  const isCalm = state === 'calm' || state === 'engaged';

  return {
    topLeft: isFrustrated ? 'AU4: Brow Lowerer' : null,
    topRight: isCalm ? 'AU6: Cheek Raiser' : null,
    left: isFrustrated ? 'AU15: Lip Corner Depressor' : null,
    right: isCalm ? 'AU12: Lip Corner Puller' : null,
    blinkRate: isFrustrated ? baseBlinkRate + 6 : isCalm ? baseBlinkRate : baseBlinkRate + 2,
  };
}

/* ─── micro-expression timeline state ─── */
type MicroExpressionColor = '#38C9F0' | '#F0C038' | '#FF6B6B';

function getMicroColor(state: ChildState): MicroExpressionColor {
  switch (state) {
    case 'calm':
    case 'engaged':
      return '#38C9F0';
    case 'uneasy':
    case 'confused':
    case 'sensory_seeking':
      return '#F0C038';
    default:
      return '#FF6B6B';
  }
}

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

  ctx.beginPath();
  ctx.moveTo(x, y + cornerLen);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.lineTo(x + cornerLen, y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + w - cornerLen, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + cornerLen);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x, y + h - cornerLen);
  ctx.lineTo(x, y + h - r);
  ctx.arcTo(x, y + h, x + r, y + h, r);
  ctx.lineTo(x + cornerLen, y + h);
  ctx.stroke();

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

function drawBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  textColor: string,
  bgColor: string = 'rgba(6,14,28,0.8)',
  padding: number = 5,
): { width: number; height: number } {
  ctx.font = `${fontSize}px "SF Mono", "Fira Code", monospace`;
  const metrics = ctx.measureText(text);
  const h = fontSize + padding * 2;
  const w = metrics.width + padding * 2;

  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 3);
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.fillText(text, x + padding, y + fontSize + padding - 2);

  return { width: w, height: h };
}

function drawConnectorLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.8;
  ctx.setLineDash([2, 2]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.setLineDash([]);
}

/* ─── metric bar sub-component ─── */
function MetricBar({ label, value, flagged }: { label: string; value: number; flagged?: boolean }) {
  const pct = Math.min(Math.max(value * 100, 0), 100);
  const barColor = pct > 60 ? '#FF6B6B' : pct > 35 ? '#F0C038' : '#38C9F0';

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="font-mono" style={{ color: '#C8D4E4' }}>
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

/* =================================================================
   CameraFeed -- main component
   ================================================================= */
export default function CameraFeed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const frameCountRef = useRef(0);

  /* gaze trail buffer */
  const gazeTrailRef = useRef<{ x: number; y: number }[]>([]);

  /* micro-expression timeline buffer (last 10 seconds = ~600 frames at 60fps) */
  const microTimelineRef = useRef<MicroExpressionColor[]>([]);

  const [cameraReady, setCameraReady] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const currentState = useAppStore((s) => s.currentState);
  const sensorReadings = useAppStore((s) => s.sensorReadings);

  /* ── start camera ── */
  const startCamera = useCallback(async (facing: 'user' | 'environment' = facingMode) => {
    try {
      // Stop existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: 640, height: 480 },
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
  }, [facingMode]);

  /* ── flip camera ── */
  const flipCamera = useCallback(() => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newFacing);
    startCamera(newFacing);
  }, [facingMode, startCamera]);

  /* ── canvas draw loop ── */
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(drawFrame);
      return;
    }

    /* match canvas to video actual display size */
    const rect = video.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;
    const frame = frameCountRef.current++;
    const t = frame / 60;
    const scale = W / 640;

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
    const bodyLang = getBodyLanguage(state);
    const auDisplay = getAUDisplay(state, t);
    const v = sensorReadings.vision;

    /* ── face bounding box (centre-ish with micro-drift) ── */
    const bw = 180 * scale;
    const bh = 220 * (H / 480);
    const driftX = Math.sin(t * 0.7) * 4;
    const driftY = Math.cos(t * 0.9) * 3;
    const bx = (W - bw) / 2 + 12 + driftX;
    const by = (H - bh) / 2 - 40 + driftY;

    const pulseAlpha = 0.7 + 0.3 * Math.sin(t * 2.5);
    const pulsedColor = color + Math.round(pulseAlpha * 255).toString(16).padStart(2, '0');

    drawCornerBrackets(ctx, bx, by, bw, bh, 28 * scale, pulsedColor, 2.5);

    /* ── top overlay bar ── */
    const barH = 28 * (H / 480);
    ctx.fillStyle = 'rgba(6,14,28,0.8)';
    ctx.fillRect(0, 0, W, barH);
    ctx.strokeStyle = 'rgba(56,201,240,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, barH);
    ctx.lineTo(W, barH);
    ctx.stroke();

    // recording dot
    const dotAlpha = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.fillStyle = `rgba(255,80,80,${dotAlpha})`;
    ctx.beginPath();
    ctx.arc(14 * scale, barH / 2, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,80,80,${dotAlpha * 0.25})`;
    ctx.beginPath();
    ctx.arc(14 * scale, barH / 2, 7 * scale, 0, Math.PI * 2);
    ctx.fill();

    // title
    ctx.font = `bold ${10 * scale}px "SF Mono", "Fira Code", monospace`;
    ctx.fillStyle = '#A0B8D0';
    ctx.letterSpacing = '2px';
    ctx.fillText('VISION ANALYSIS \u2014 LIVE', 26 * scale, barH / 2 + 3.5);
    ctx.letterSpacing = '0px';

    // timestamp
    const timeStr = formatTime();
    ctx.font = `${10 * scale}px "SF Mono", "Fira Code", monospace`;
    const timW = ctx.measureText(timeStr).width;
    ctx.fillStyle = '#607890';
    ctx.fillText(timeStr, W - timW - 10, barH / 2 + 3.5);

    /* ── name badge above face box ── */
    const fs = Math.max(9, 11 * scale);
    ctx.font = `bold ${fs}px "SF Mono", "Fira Code", monospace`;
    const nameText = 'Leo \u00B7 5yr \u00B7 Male';
    const nameMetrics = ctx.measureText(nameText);
    const badgePad = 6 * scale;
    const badgeH = 18 * (H / 480);
    const badgeX = bx;
    const badgeY = by - badgeH - 6;

    ctx.fillStyle = 'rgba(6,14,28,0.8)';
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, nameMetrics.width + badgePad * 2, badgeH, 4);
    ctx.fill();
    ctx.fillStyle = '#E0E8F0';
    ctx.fillText(nameText, badgeX + badgePad, badgeY + badgeH - 5 * (H / 480));

    // emotion label below name
    const emotionText = EMOTION_LABEL[state] || state;
    ctx.font = `${Math.max(8, 10 * scale)}px "SF Mono", "Fira Code", monospace`;
    const emMetrics = ctx.measureText(emotionText);
    const emBadgeY = badgeY + badgeH + 3;
    const emBadgeH = 16 * (H / 480);

    ctx.fillStyle = 'rgba(6,14,28,0.8)';
    ctx.beginPath();
    ctx.roundRect(badgeX, emBadgeY, emMetrics.width + badgePad * 2 + 12, emBadgeH, 4);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(badgeX + badgePad + 4, emBadgeY + emBadgeH / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(emotionText, badgeX + badgePad + 12, emBadgeY + emBadgeH - 4 * (H / 480));

    /* ── crosshair at face centre ── */
    const cx = bx + bw / 2;
    const cy = by + bh / 2;
    const chLen = 8 * scale;
    ctx.strokeStyle = `rgba(56,201,240,${0.2 + 0.1 * Math.sin(t * 3)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - chLen, cy);
    ctx.lineTo(cx + chLen, cy);
    ctx.moveTo(cx, cy - chLen);
    ctx.lineTo(cx, cy + chLen);
    ctx.stroke();

    /* ═══════════════════════════════════════════════════════
       (a) FACIAL ACTION UNITS (AU) DISPLAY
       ═══════════════════════════════════════════════════════ */
    const auFontSize = Math.max(7, 8 * scale);
    const auColor = 'rgba(139,110,232,0.9)'; // lavender
    const auBg = 'rgba(6,14,28,0.8)';
    const auConnectorColor = 'rgba(139,110,232,0.35)';

    // AU4: top-left
    if (auDisplay.topLeft) {
      const ax = bx - 10 * scale;
      const ay = by - 2;
      drawBadge(ctx, auDisplay.topLeft, ax - ctx.measureText(auDisplay.topLeft).width - 14, ay, auFontSize, auColor, auBg);
      const badgeRight = ax - 4;
      drawConnectorLine(ctx, badgeRight, ay + auFontSize / 2, bx, by + 10, auConnectorColor);
    }

    // AU6: top-right
    if (auDisplay.topRight) {
      const ax = bx + bw + 10 * scale;
      const ay = by - 2;
      drawBadge(ctx, auDisplay.topRight, ax, ay, auFontSize, auColor, auBg);
      drawConnectorLine(ctx, ax, ay + auFontSize / 2, bx + bw, by + 10, auConnectorColor);
    }

    // AU15: left side
    if (auDisplay.left) {
      const ax = bx - 10 * scale;
      const ay = by + bh * 0.6;
      const textW = ctx.measureText(auDisplay.left).width;
      drawBadge(ctx, auDisplay.left, ax - textW - 14, ay, auFontSize, auColor, auBg);
      drawConnectorLine(ctx, ax - 4, ay + auFontSize / 2, bx, by + bh * 0.65, auConnectorColor);
    }

    // AU12: right side
    if (auDisplay.right) {
      const ax = bx + bw + 10 * scale;
      const ay = by + bh * 0.6;
      drawBadge(ctx, auDisplay.right, ax, ay, auFontSize, auColor, auBg);
      drawConnectorLine(ctx, ax, ay + auFontSize / 2, bx + bw, by + bh * 0.65, auConnectorColor);
    }

    // AU45: blink rate - always shown, bottom of face box
    {
      const blinkText = `AU45: Blink Rate: ${auDisplay.blinkRate}/min`;
      const blinkX = bx;
      const blinkY = by + bh + 6;
      drawBadge(ctx, blinkText, blinkX, blinkY, auFontSize, auColor, auBg);
    }

    // confidence below blink
    {
      const confText = `Confidence: ${Math.round(confidence * 100)}%`;
      const confX = bx;
      const confY = by + bh + 6 + auFontSize + 14;
      drawBadge(ctx, confText, confX, confY, auFontSize, '#A0B8D0', auBg);
    }

    /* ═══════════════════════════════════════════════════════
       (c) BODY LANGUAGE INDICATORS - below face box
       ═══════════════════════════════════════════════════════ */
    {
      const blFontSize = Math.max(7, 8 * scale);
      const startY = by + bh + 6 + (auFontSize + 14) * 2 + 4;
      const blColor = '#C8D4E4';
      const items = [
        `SHOULDERS: ${bodyLang.shoulders}`,
        `HANDS: ${bodyLang.hands}`,
        `POSTURE: ${bodyLang.posture}`,
      ];
      items.forEach((text, i) => {
        drawBadge(ctx, text, bx, startY + i * (blFontSize + 12), blFontSize, blColor, 'rgba(6,14,28,0.8)');
      });
    }

    /* ═══════════════════════════════════════════════════════
       (d) GAZE TRACKING — simulated dot with trail
       ═══════════════════════════════════════════════════════ */
    {
      const gazeX = cx + Math.sin(t * 1.3) * 12 * scale + Math.sin(t * 3.7) * 5 * scale;
      const gazeY = cy - 15 * (H / 480) + Math.cos(t * 1.1) * 8 * (H / 480) + Math.cos(t * 2.9) * 3 * (H / 480);

      const trail = gazeTrailRef.current;
      trail.push({ x: gazeX, y: gazeY });
      if (trail.length > 30) trail.shift();

      // draw trail
      for (let i = 0; i < trail.length - 1; i++) {
        const alpha = (i / trail.length) * 0.5;
        ctx.fillStyle = `rgba(56,201,240,${alpha})`;
        ctx.beginPath();
        ctx.arc(trail[i].x, trail[i].y, 1.5 * scale, 0, Math.PI * 2);
        ctx.fill();
      }

      // current gaze dot
      ctx.fillStyle = 'rgba(56,201,240,0.9)';
      ctx.beginPath();
      ctx.arc(gazeX, gazeY, 3 * scale, 0, Math.PI * 2);
      ctx.fill();

      // outer glow
      ctx.fillStyle = 'rgba(56,201,240,0.2)';
      ctx.beginPath();
      ctx.arc(gazeX, gazeY, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
    }

    /* ═══════════════════════════════════════════════════════
       (e) GESTURE DETECTION BOXES
       ═══════════════════════════════════════════════════════ */
    {
      const gestFontSize = Math.max(7, 9 * scale);
      const isFrustrated = state === 'frustrated' || state === 'overloaded';
      const isRepetitive = v.repetitiveMotion > 0.3;

      // primary gesture box
      const gx = bx - 30 * scale;
      const gy = by + bh * 0.3;
      const gw = 0.13 * W;
      const gh = 0.11 * H;
      const gestDriftX = Math.sin(t * 1.1) * 2;
      const gestDriftY = Math.cos(t * 0.8) * 2;

      const gestColor = isFrustrated ? 'rgba(255,107,107,0.5)' : 'rgba(56,201,240,0.4)';
      drawCornerBrackets(ctx, gx + gestDriftX, gy + gestDriftY, gw, gh, 14 * scale, gestColor, 1.5);

      const gestConf = Math.round(65 + Math.sin(t * 0.5) * 12);
      const gestText = `${bodyLang.gestureLabel} (${gestConf}%)`;
      ctx.font = `${gestFontSize}px "SF Mono", "Fira Code", monospace`;
      const glm = ctx.measureText(gestText);
      ctx.fillStyle = 'rgba(6,14,28,0.8)';
      ctx.beginPath();
      ctx.roundRect(gx + gestDriftX, gy + gestDriftY - gestFontSize - 8, glm.width + 10, gestFontSize + 8, 3);
      ctx.fill();
      ctx.fillStyle = isFrustrated ? 'rgba(255,107,107,0.9)' : 'rgba(56,201,240,0.9)';
      ctx.fillText(gestText, gx + gestDriftX + 5, gy + gestDriftY - 5);

      // repetitive motion box (pulsing red border)
      if (isRepetitive) {
        const rx = 0.6 * W;
        const ry = 0.55 * H;
        const rw = 0.2 * W;
        const rh = 0.15 * H;
        const repPulse = 0.5 + 0.5 * Math.sin(t * 4);
        const repColor = `rgba(255,68,68,${repPulse})`;

        drawCornerBrackets(ctx, rx, ry, rw, rh, 14 * scale, repColor, 2.5);

        const repConf = Math.round(70 + v.repetitiveMotion * 25);
        const repText = `Body: Repetitive movement (${repConf}%)`;
        ctx.font = `${gestFontSize}px "SF Mono", "Fira Code", monospace`;
        const rlm = ctx.measureText(repText);
        ctx.fillStyle = 'rgba(6,14,28,0.8)';
        ctx.beginPath();
        ctx.roundRect(rx, ry - gestFontSize - 8, rlm.width + 10, gestFontSize + 8, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,68,68,0.9)';
        ctx.fillText(repText, rx + 5, ry - 5);
      }

      // sensory toy box
      const sx2 = 0.72 * W + Math.sin(t * 0.9) * 2;
      const sy2 = 0.68 * H + Math.cos(t * 0.7) * 2;
      const sw2 = 0.14 * W;
      const sh2 = 0.1 * H;
      drawCornerBrackets(ctx, sx2, sy2, sw2, sh2, 14 * scale, 'rgba(56,201,240,0.3)', 1.5);
      const toyText = 'Sensory toy';
      ctx.font = `${gestFontSize}px "SF Mono", "Fira Code", monospace`;
      const tlm = ctx.measureText(toyText);
      ctx.fillStyle = 'rgba(6,14,28,0.8)';
      ctx.beginPath();
      ctx.roundRect(sx2, sy2 - gestFontSize - 8, tlm.width + 10, gestFontSize + 8, 3);
      ctx.fill();
      ctx.fillStyle = 'rgba(56,201,240,0.6)';
      ctx.fillText(toyText, sx2 + 5, sy2 - 5);
    }

    /* ═══════════════════════════════════════════════════════
       (b) MICRO-EXPRESSION TIMELINE BAR
       ═══════════════════════════════════════════════════════ */
    {
      const timeline = microTimelineRef.current;
      // push current state colour every ~6 frames (~10 fps sampling)
      if (frame % 6 === 0) {
        timeline.push(getMicroColor(state));
        if (timeline.length > 100) timeline.shift();
      }

      const tlHeight = 18 * (H / 480);
      const tlY = H - tlHeight - 8;
      const tlX = 10;
      const tlW = W - 20;
      const labelFs = Math.max(6, 7 * scale);

      // background
      ctx.fillStyle = 'rgba(6,14,28,0.8)';
      ctx.beginPath();
      ctx.roundRect(tlX - 2, tlY - labelFs - 8, tlW + 4, tlHeight + labelFs + 12, 4);
      ctx.fill();

      // label
      ctx.font = `bold ${labelFs}px "SF Mono", "Fira Code", monospace`;
      ctx.fillStyle = '#5A7A9B';
      ctx.fillText('MICRO-EXPRESSION TIMELINE', tlX + 2, tlY - 3);

      // segments
      const segW = tlW / 100;
      timeline.forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(tlX + i * segW, tlY, segW + 0.5, tlHeight);
      });
      ctx.globalAlpha = 1;

      // current position marker
      const markerX = tlX + (timeline.length - 1) * segW;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(markerX, tlY - 1);
      ctx.lineTo(markerX, tlY + tlHeight + 1);
      ctx.stroke();
    }

    /* ═══════════════════════════════════════════════════════
       (f) ANALYSIS CONFIDENCE PANEL — bottom-right
       ═══════════════════════════════════════════════════════ */
    {
      const pFontSize = Math.max(7, 8 * scale);
      const lineH = pFontSize + 6;
      const panelLines = [
        { label: 'FACE DETECTED:', value: 'YES', dot: '#38C9F0' },
        { label: 'TRACKING QUALITY:', value: `${Math.round(90 + Math.sin(t * 0.4) * 4)}%`, dot: null },
        { label: 'LANDMARKS:', value: '68 pts', dot: null },
        { label: 'FPS:', value: '30', dot: null },
      ];
      const panelW = 160 * scale;
      const panelH = panelLines.length * lineH + 10;
      const panelX = W - panelW - 10;
      const panelY = H - panelH - 36 * (H / 480);

      ctx.fillStyle = 'rgba(6,14,28,0.85)';
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, 4);
      ctx.fill();
      ctx.strokeStyle = 'rgba(56,201,240,0.15)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.roundRect(panelX, panelY, panelW, panelH, 4);
      ctx.stroke();

      panelLines.forEach((line, i) => {
        const ly = panelY + 8 + i * lineH;
        ctx.font = `${pFontSize}px "SF Mono", "Fira Code", monospace`;

        if (line.dot) {
          ctx.fillStyle = line.dot;
          ctx.beginPath();
          ctx.arc(panelX + 8, ly + pFontSize / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        const textOffsetX = line.dot ? 16 : 8;
        ctx.fillStyle = '#5A7A9B';
        ctx.fillText(line.label, panelX + textOffsetX, ly + pFontSize);
        const labelW = ctx.measureText(line.label).width;
        ctx.fillStyle = '#C8D4E4';
        ctx.fillText(` ${line.value}`, panelX + textOffsetX + labelW, ly + pFontSize);
      });
    }

    rafRef.current = requestAnimationFrame(drawFrame);
  }, [currentState, sensorReadings]);

  /* ── lifecycle ── */
  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((tr) => tr.stop());
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

  /* ── derived metrics ── */
  const v = sensorReadings.vision;
  const state = currentState.primaryState;
  const bodyLang = getBodyLanguage(state);

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

  const eyeContact = Math.round((1 - v.gazeAvoidance) * 100);
  const blinkRate = 12 + Math.round(
    (state === 'frustrated' || state === 'overloaded' || state === 'dysregulated') ? 6 : 0
  );

  const stressIndicators: string[] = [];
  if (bodyLang.shoulders.includes('Tense') || bodyLang.shoulders.includes('Raised'))
    stressIndicators.push('Shoulder tension');
  if (bodyLang.hands.includes('Clenched') || bodyLang.hands.includes('Covering'))
    stressIndicators.push('Self-protective hands');
  if (bodyLang.posture.includes('Closed') || bodyLang.posture.includes('Rocking'))
    stressIndicators.push('Closed/rocking posture');
  if (v.repetitiveMotion > 0.3)
    stressIndicators.push('Repetitive movements');
  if (v.gazeAvoidance > 0.5)
    stressIndicators.push('Gaze avoidance');

  /* ═══ render ═══ */
  return (
    <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* ── Video + Canvas ── */}
        <div className="relative w-full lg:flex-1 bg-[#060E18]" style={{ aspectRatio: '4/3' }}>
          {permissionDenied ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(56,201,240,1) 1px, transparent 1px), linear-gradient(90deg, rgba(56,201,240,1) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
              />
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
                  onClick={() => startCamera()}
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
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
              />
              {/* Flip Camera Button */}
              <button
                onClick={flipCamera}
                className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-[#0D1B2A]/80 border border-[#1A3A5C] flex items-center justify-center text-[#38C9F0] hover:bg-[#132D46] active:scale-90 transition-all backdrop-blur-sm"
                title={facingMode === 'user' ? 'Switch to back camera' : 'Switch to front camera'}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                  <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
                  <path d="m14 9-3 3 3 3" />
                  <path d="m10 15 3-3-3-3" />
                </svg>
              </button>
              {/* Camera mode label */}
              <div className="absolute top-3 left-3 z-20 text-[9px] font-semibold text-[#5A7A9B] bg-[#0D1B2A]/80 border border-[#1A3A5C] px-2 py-1 rounded-full backdrop-blur-sm">
                {facingMode === 'user' ? 'FRONT' : 'BACK'} CAM
              </div>
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

        {/* ── Metrics Panel: compact grid on mobile, side panel on desktop ── */}
        <div className="lg:w-72 w-full border-t lg:border-t-0 lg:border-l border-[#1A3A5C] p-4">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-[#1A3A5C] mb-3">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: STATE_COLOR[state] }}
            />
            <h3 className="text-xs font-mono font-bold tracking-wider uppercase" style={{ color: '#C8D4E4' }}>
              Vision Metrics
            </h3>
          </div>

          {/* On mobile: 2-column grid. On desktop: single column stack */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {/* Core metric bars */}
            <MetricBar label="Facial Distress" value={v.facialDistress} />
            <MetricBar label="Body Tension" value={v.bodyTension} />

            {/* Movement velocity */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono" style={{ color: '#C8D4E4' }}>Movement</span>
                <span className="text-white font-mono font-semibold">
                  {v.movementVelocity.toFixed(2)}{' '}
                  <span style={{ color: '#5A7A9B' }} className="font-normal">m/s</span>
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

            {/* Eye Contact */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono" style={{ color: '#C8D4E4' }}>Eye Contact</span>
                <span className="text-white font-mono font-semibold">{eyeContact}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${eyeContact}%`,
                    background: eyeContact > 60
                      ? 'linear-gradient(90deg, #38C9F088, #38C9F0)'
                      : eyeContact > 30
                        ? 'linear-gradient(90deg, #F0C03888, #F0C038)'
                        : 'linear-gradient(90deg, #FF6B6B88, #FF6B6B)',
                  }}
                />
              </div>
            </div>

            {/* Blink Rate */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-mono" style={{ color: '#C8D4E4' }}>Blink Rate</span>
                <span className="text-white font-mono font-semibold">
                  {blinkRate}{' '}
                  <span style={{ color: '#5A7A9B' }} className="font-normal">/min</span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.min((blinkRate / 30) * 100, 100)}%`,
                    background: blinkRate > 20
                      ? 'linear-gradient(90deg, #FF6B6B88, #FF6B6B)'
                      : 'linear-gradient(90deg, #38C9F088, #38C9F0)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Micro-Expression Summary card */}
          <div className="mt-3 p-3 rounded-xl bg-[#0A1628] border border-[#1A3A5C]">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: '#5A7A9B' }}>
              Micro-Expression
            </p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: STATE_COLOR[state] }} />
              <span className="text-sm font-semibold font-mono" style={{ color: STATE_COLOR[state] }}>
                {EMOTION_LABEL[state]}
              </span>
              <span className="text-[10px] font-mono" style={{ color: '#5A7A9B' }}>
                ({Math.round(currentState.confidence * 100)}%)
              </span>
            </div>
          </div>

          {/* Posture card */}
          <div className="mt-3 p-3 rounded-xl bg-[#0A1628] border border-[#1A3A5C]">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: '#5A7A9B' }}>
              Posture Analysis
            </p>
            <p className={`text-sm font-semibold font-mono ${postureColor}`}>{posture}</p>
            <div className="mt-1.5 flex gap-3 text-[10px] font-mono" style={{ color: '#5A7A9B' }}>
              <span>
                Still: <span style={{ color: '#C8D4E4' }}>{(v.stillnessScore * 100).toFixed(0)}%</span>
              </span>
              <span>
                Vel: <span style={{ color: '#C8D4E4' }}>{v.movementVelocity.toFixed(2)}</span>
              </span>
            </div>
          </div>

          {/* Stress Indicators */}
          <div className="mt-3 p-3 rounded-xl bg-[#0A1628] border border-[#1A3A5C]">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: '#5A7A9B' }}>
              Stress Indicators
            </p>
            {stressIndicators.length === 0 ? (
              <p className="text-xs font-mono" style={{ color: '#38C9F0' }}>No stress signals detected</p>
            ) : (
              <ul className="space-y-1">
                {stressIndicators.map((si, i) => (
                  <li key={i} className="text-xs font-mono flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <span style={{ color: '#FF6B6B' }}>{si}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Body Language summary */}
          <div className="mt-3 p-3 rounded-xl bg-[#0A1628] border border-[#1A3A5C]">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-1.5" style={{ color: '#5A7A9B' }}>
              Body Language
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
              <span style={{ color: '#5A7A9B' }}>Shoulders</span>
              <span style={{ color: '#C8D4E4' }}>{bodyLang.shoulders}</span>
              <span style={{ color: '#5A7A9B' }}>Hands</span>
              <span style={{ color: '#C8D4E4' }}>{bodyLang.hands}</span>
              <span style={{ color: '#5A7A9B' }}>Posture</span>
              <span style={{ color: '#C8D4E4' }}>{bodyLang.posture}</span>
              <span style={{ color: '#5A7A9B' }}>Gesture</span>
              <span style={{ color: '#C8D4E4' }}>{bodyLang.gesture}</span>
            </div>
          </div>

          {/* Trajectory indicator */}
          <div className="mt-3 p-3 rounded-xl bg-[#0A1628] border border-[#1A3A5C]">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-1" style={{ color: '#5A7A9B' }}>
              Trajectory
            </p>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-mono font-bold"
                style={{ color: STATE_COLOR[state] }}
              >
                {currentState.trajectory === 'stable'
                  ? '\u2192 Stable'
                  : currentState.trajectory === 'escalating'
                    ? '\u2191 Escalating'
                    : '\u2193 De-escalating'}
              </span>
              <span className="text-[10px] font-mono" style={{ color: '#5A7A9B' }}>
                ({Math.round(currentState.trajectoryConfidence * 100)}%)
              </span>
            </div>
          </div>

          {/* Vision Contribution */}
          <div className="mt-3 p-3 rounded-xl bg-[#0A1628] border border-[#1A3A5C]">
            <p className="text-[10px] font-mono uppercase tracking-wider mb-2" style={{ color: '#5A7A9B' }}>
              Vision Contribution
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#38C9F0] transition-all duration-700"
                  style={{ width: `${currentState.modalityContributions.vision * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono font-semibold" style={{ color: '#38C9F0' }}>
                {Math.round(currentState.modalityContributions.vision * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
