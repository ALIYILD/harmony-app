import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { ChildState } from '../types';

/* ─── Constants ─── */

const STATE_COLOR: Record<ChildState, string> = {
  calm: '#38C9F0',
  engaged: '#00D9A6',
  uneasy: '#F0C038',
  confused: '#F0C038',
  frustrated: '#FF6B6B',
  overloaded: '#FF6B6B',
  dysregulated: '#FF4444',
  shutdown_risk: '#8B6EE8',
  sensory_seeking: '#8B6EE8',
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
  sensory_seeking: 'Seeking Input',
};

const BODY_DESC: Record<ChildState, { posture: string; movement: string; eyeContact: string }> = {
  calm:            { posture: 'Relaxed',   movement: 'Calm',      eyeContact: 'Present' },
  engaged:         { posture: 'Relaxed',   movement: 'Calm',      eyeContact: 'Present' },
  uneasy:          { posture: 'Tense',     movement: 'Fidgeting', eyeContact: 'Seeking' },
  confused:        { posture: 'Tense',     movement: 'Fidgeting', eyeContact: 'Avoiding' },
  frustrated:      { posture: 'Tense',     movement: 'Agitated',  eyeContact: 'Avoiding' },
  overloaded:      { posture: 'Tense',     movement: 'Agitated',  eyeContact: 'Avoiding' },
  dysregulated:    { posture: 'Rocking',   movement: 'Agitated',  eyeContact: 'Avoiding' },
  shutdown_risk:   { posture: 'Collapsed', movement: 'Calm',      eyeContact: 'Avoiding' },
  sensory_seeking: { posture: 'Tense',     movement: 'Fidgeting', eyeContact: 'Seeking' },
};

const BODY_LABEL: Record<ChildState, string> = {
  calm: 'open and relaxed, with natural movement',
  engaged: 'alert and focused, leaning forward',
  uneasy: 'slightly tense with some fidgeting',
  confused: 'stiff, with gaze shifting frequently',
  frustrated: 'tense and guarded, with clenched hands',
  overloaded: 'curled inward, covering ears or eyes',
  dysregulated: 'erratic, with repetitive or intense movement',
  shutdown_risk: 'still and withdrawn, low energy',
  sensory_seeking: 'restless, seeking touch or movement input',
};

const SENSORY_COMFORT: Record<ChildState, { comfortable: boolean; note: string }> = {
  calm:            { comfortable: true,  note: 'Ambient noise and lighting are within a comfortable range.' },
  engaged:         { comfortable: true,  note: 'The environment appears well-suited for focused activity.' },
  uneasy:          { comfortable: false, note: 'Slight environmental discomfort detected — check noise or lighting levels.' },
  confused:        { comfortable: false, note: 'Environmental cues may be unclear or inconsistent.' },
  frustrated:      { comfortable: false, note: 'Sensory load appears elevated — consider reducing stimulation.' },
  overloaded:      { comfortable: false, note: 'Multiple sensory inputs are exceeding comfort levels.' },
  dysregulated:    { comfortable: false, note: 'Environment is contributing to overload — immediate reduction recommended.' },
  shutdown_risk:   { comfortable: false, note: 'Sustained overload has led to withdrawal — minimise all input.' },
  sensory_seeking: { comfortable: false, note: 'Currently seeking sensory input — offering appropriate outlets may help.' },
};

const TIMELINE_SEGMENTS: Record<ChildState, { segments: { range: string; label: string; color: string }[] }> = {
  calm:            { segments: [{ range: '0-10s', label: 'Calm', color: '#38C9F0' }, { range: '10-20s', label: 'Relaxed', color: '#38C9F0' }, { range: '20-30s', label: 'Content', color: '#00D9A6' }] },
  engaged:         { segments: [{ range: '0-8s', label: 'Focused', color: '#00D9A6' }, { range: '8-20s', label: 'Engaged', color: '#00D9A6' }, { range: '20-30s', label: 'Active interest', color: '#38C9F0' }] },
  uneasy:          { segments: [{ range: '0-8s', label: 'Calm', color: '#38C9F0' }, { range: '8-18s', label: 'Slight unease', color: '#F0C038' }, { range: '18-30s', label: 'Fidgeting', color: '#F0C038' }] },
  confused:        { segments: [{ range: '0-10s', label: 'Attentive', color: '#38C9F0' }, { range: '10-20s', label: 'Uncertain', color: '#F0C038' }, { range: '20-30s', label: 'Confused', color: '#F0C038' }] },
  frustrated:      { segments: [{ range: '0-5s', label: 'Calm', color: '#38C9F0' }, { range: '5-12s', label: 'Slight tension', color: '#F0C038' }, { range: '12-20s', label: 'Frustrated', color: '#FF6B6B' }, { range: '20-30s', label: 'Seeking comfort', color: '#F0C038' }] },
  overloaded:      { segments: [{ range: '0-5s', label: 'Uneasy', color: '#F0C038' }, { range: '5-15s', label: 'Rising distress', color: '#FF6B6B' }, { range: '15-30s', label: 'Overloaded', color: '#FF6B6B' }] },
  dysregulated:    { segments: [{ range: '0-5s', label: 'Tense', color: '#F0C038' }, { range: '5-15s', label: 'Escalating', color: '#FF6B6B' }, { range: '15-25s', label: 'Dysregulated', color: '#FF4444' }, { range: '25-30s', label: 'Peak distress', color: '#FF4444' }] },
  shutdown_risk:   { segments: [{ range: '0-10s', label: 'Withdrawing', color: '#8B6EE8' }, { range: '10-20s', label: 'Low response', color: '#8B6EE8' }, { range: '20-30s', label: 'Near shutdown', color: '#CC44CC' }] },
  sensory_seeking: { segments: [{ range: '0-10s', label: 'Restless', color: '#F0C038' }, { range: '10-20s', label: 'Seeking input', color: '#8B6EE8' }, { range: '20-30s', label: 'Active seeking', color: '#8B6EE8' }] },
};

const RECOMMENDATIONS: Record<ChildState, { icon: string; text: string; detail: string }[]> = {
  calm: [
    { icon: '\u2728', text: 'Great time for learning activities', detail: 'Leo is in a regulated state — this is an ideal window for gentle play or new experiences.' },
    { icon: '\uD83D\uDDE3\uFE0F', text: 'Encourage communication practice', detail: 'Try offering choices with visual cards to build communication skills.' },
  ],
  engaged: [
    { icon: '\u23F8\uFE0F', text: 'Avoid interrupting the flow', detail: 'Leo is deeply engaged — let this activity continue naturally.' },
    { icon: '\uD83D\uDCF7', text: 'Note what caught his attention', detail: 'Understanding what engages Leo can help build future activities.' },
  ],
  uneasy: [
    { icon: '\uD83E\uDDE9', text: 'Offer a familiar comfort item', detail: 'A favourite toy or blanket can help Leo feel grounded.' },
    { icon: '\uD83D\uDD07', text: 'Check for environmental stressors', detail: 'Look for changes in noise, light, or routine that may be causing discomfort.' },
    { icon: '\uD83D\uDDE3\uFE0F', text: 'Use simple language and visuals', detail: 'Keep instructions short and clear. Visual supports can reduce uncertainty.' },
  ],
  confused: [
    { icon: '\uD83D\uDCCB', text: 'Simplify the current task', detail: 'Break the activity into smaller, clearer steps with visual cues.' },
    { icon: '\uD83E\uDD1D', text: 'Offer gentle guidance', detail: 'Model the expected behaviour rather than giving verbal instructions.' },
  ],
  frustrated: [
    { icon: '\u23F8\uFE0F', text: 'Pause all demands immediately', detail: 'Leo needs space to regulate. Remove expectations for now.' },
    { icon: '\uD83C\uDFE0', text: 'Offer a calm-down space', detail: 'A quiet corner with dim lighting and soft textures can help.' },
    { icon: '\uD83C\uDFA7', text: 'Try noise-cancelling headphones', detail: 'Reducing auditory input can lower overall sensory load.' },
  ],
  overloaded: [
    { icon: '\uD83D\uDD07', text: 'Reduce all sensory input now', detail: 'Dim lights, lower volume, and minimise people in the space.' },
    { icon: '\uD83E\uDDE8', text: 'Offer deep pressure if tolerated', detail: 'A weighted blanket or firm hug (if Leo accepts) can help regulate.' },
    { icon: '\u23F3', text: 'Give time without expectations', detail: 'Recovery from overload takes time. Avoid rushing re-engagement.' },
  ],
  dysregulated: [
    { icon: '\uD83D\uDEE1\uFE0F', text: 'Prioritise safety', detail: 'Ensure Leo and those around him are safe. Remove any hazards.' },
    { icon: '\uD83E\uDD2B', text: 'Stay calm and present', detail: 'Your calm presence is the most effective support right now. Avoid verbal instructions.' },
    { icon: '\u23F3', text: 'Wait for the first signs of calming', detail: 'Interventions are most effective once the peak has passed.' },
  ],
  shutdown_risk: [
    { icon: '\uD83D\uDCA4', text: 'Minimise all stimulation', detail: 'Leo needs a low-demand, quiet environment to recover.' },
    { icon: '\u2764\uFE0F', text: 'Offer quiet companionship', detail: 'Sit nearby without speaking. Let Leo know you are there.' },
  ],
  sensory_seeking: [
    { icon: '\uD83C\uDFA8', text: 'Offer appropriate sensory activities', detail: 'Playdough, water play, or a swing can channel the seeking behaviour.' },
    { icon: '\uD83C\uDFB5', text: 'Try rhythmic movement or music', detail: 'Rhythmic activities can satisfy the sensory need constructively.' },
    { icon: '\uD83E\uDDE9', text: 'Redirect to structured play', detail: 'Guide the energy towards a productive activity with clear boundaries.' },
  ],
};

const ANALYSIS_STEPS = [
  'Detecting faces...',
  'Analysing body language...',
  'Detecting gestures and signs...',
  'Interpreting emotional state...',
  'Checking communication attempts...',
  'Generating insights...',
];

interface MockLibraryEntry {
  id: string;
  date: string;
  duration: string;
  state: ChildState;
  finding: string;
}

const MOCK_LIBRARY: MockLibraryEntry[] = [
  { id: 'lib-1', date: 'Yesterday 3:42 PM',    duration: '15s', state: 'frustrated',      finding: 'Detected ear covering gesture' },
  { id: 'lib-2', date: 'Yesterday 10:15 AM',    duration: '22s', state: 'calm',            finding: 'Positive engagement, eye contact present' },
  { id: 'lib-3', date: '2 days ago 2:30 PM',    duration: '18s', state: 'sensory_seeking', finding: 'Repeated rocking, seeking input' },
  { id: 'lib-4', date: '3 days ago 9:00 AM',    duration: '27s', state: 'engaged',         finding: 'Sustained focus on toy, vocalisation' },
];

type Mode = 'record' | 'analysing' | 'results' | 'library' | 'library-detail';
type ActiveTab = 'record' | 'library';

/* ─── Component ─── */

interface VideoAnalysisProps {
  onClose: () => void;
}

export default function VideoAnalysis({ onClose }: VideoAnalysisProps) {
  const { currentState, sensorReadings, childProfile, gestureDictionary, addToast } = useAppStore();
  const childName = childProfile.name;

  /* ─── State ─── */
  const [mode, setMode] = useState<Mode>('record');
  const [, setActiveTab] = useState<ActiveTab>('record');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [, setAnalysisComplete] = useState(false);
  const [selectedLibraryEntry, setSelectedLibraryEntry] = useState<MockLibraryEntry | null>(null);
  const [cameraError, setCameraError] = useState(false);

  /* ─── Refs ─── */
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ─── Camera Setup ─── */
  const startCamera = useCallback(async () => {
    setCameraError(false);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError(true);
    }
  }, [facingMode]);

  useEffect(() => {
    if (mode === 'record') {
      startCamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, facingMode]);

  /* ─── Cleanup on unmount ─── */
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Recording ─── */
  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      setMode('analysing');
    };
    mediaRecorderRef.current = recorder;
    recorder.start(100);
    setIsRecording(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime(prev => {
        if (prev >= 29) {
          stopRecording();
          return 30;
        }
        return prev + 1;
      });
    }, 1000);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
  }, []);

  const flipCamera = useCallback(() => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, []);

  /* ─── Analysis animation ─── */
  useEffect(() => {
    if (mode !== 'analysing') return;
    setAnalysisStep(0);
    setAnalysisComplete(false);

    const timers: ReturnType<typeof setTimeout>[] = [];
    ANALYSIS_STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setAnalysisStep(i + 1);
      }, (i + 1) * 500));
    });
    timers.push(setTimeout(() => {
      setAnalysisComplete(true);
      setMode('results');
    }, 3200));

    return () => timers.forEach(clearTimeout);
  }, [mode]);

  /* ─── Record Another ─── */
  const recordAnother = useCallback(() => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingTime(0);
    setAnalysisStep(0);
    setAnalysisComplete(false);
    setMode('record');
    setActiveTab('record');
  }, [recordedUrl]);

  /* ─── Tab switching ─── */
  const switchToRecord = useCallback(() => {
    if (mode === 'library' || mode === 'library-detail') {
      if (recordedBlob) {
        setMode('results');
      } else {
        setMode('record');
      }
    }
    setActiveTab('record');
    setSelectedLibraryEntry(null);
  }, [mode, recordedBlob]);

  const switchToLibrary = useCallback(() => {
    setActiveTab('library');
    setMode('library');
    setSelectedLibraryEntry(null);
  }, []);

  /* ─── Helpers ─── */
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const stateColor = STATE_COLOR[currentState.primaryState];
  const emotionLabel = EMOTION_LABEL[currentState.primaryState];
  const bodyDesc = BODY_DESC[currentState.primaryState];
  const bodyLabel = BODY_LABEL[currentState.primaryState];
  const sensoryInfo = SENSORY_COMFORT[currentState.primaryState];
  const timeline = TIMELINE_SEGMENTS[currentState.primaryState];
  const recs = RECOMMENDATIONS[currentState.primaryState];
  const detectedGestures = gestureDictionary.slice(0, 3);

  /* ─── Render: Recording screen ─── */
  const renderRecordScreen = () => (
    <div className="flex flex-col h-full">
      {/* Camera view */}
      <div className="flex-1 relative bg-black rounded-2xl mx-4 mt-2 overflow-hidden">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[#5A7A9B] gap-2">
            <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9.75a2.25 2.25 0 002.25-2.25V7.5a2.25 2.25 0 00-2.25-2.25H4.5A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span className="text-sm">Camera not available</span>
            <span className="text-xs">Grant camera permissions to record</span>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
        )}

        {/* REC indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-xs font-bold tracking-wider">REC</span>
            <span className="text-white/80 text-xs font-mono">{formatTime(recordingTime)}</span>
          </div>
        )}

        {/* Camera label + flip */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <span className="bg-black/60 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm tracking-wider">
            {facingMode === 'environment' ? 'BACK CAM' : 'FRONT CAM'}
          </span>
          {!isRecording && (
            <button
              onClick={flipCamera}
              className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform"
            >
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Recording controls */}
      <div className="flex flex-col items-center py-6 gap-3">
        {isRecording && (
          <span className="text-white/60 text-xs">
            {formatTime(recordingTime)} / 00:30
          </span>
        )}
        <div className="flex items-center gap-6">
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-red-500/20 border border-red-500/40 px-5 py-2.5 rounded-full active:scale-95 transition-transform"
            >
              <span className="w-4 h-4 rounded-sm bg-red-500" />
              <span className="text-red-400 text-sm font-bold">Stop</span>
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={cameraError}
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-red-500/30"
              style={isRecording ? { animation: 'pulse-record 1.5s ease-in-out infinite' } : {}}
            >
              <span className="w-6 h-6 rounded-full bg-white" />
            </button>
          )}
        </div>
        {!isRecording && (
          <span className="text-[#5A7A9B] text-xs">Tap to start recording (max 30s)</span>
        )}
      </div>
    </div>
  );

  /* ─── Render: Analysing screen ─── */
  const renderAnalysingScreen = () => (
    <div className="flex flex-col h-full px-4 pt-2">
      {/* Video playback */}
      {recordedUrl && (
        <div className="rounded-2xl overflow-hidden bg-black" style={{ height: '35%' }}>
          <video
            ref={playbackRef}
            src={recordedUrl}
            controls
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Analysis steps */}
      <div className="mt-6 space-y-3">
        <h3 className="text-white font-bold text-lg">Analysing video...</h3>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-[#0D1B2A] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(analysisStep / ANALYSIS_STEPS.length) * 100}%`,
              background: 'linear-gradient(90deg, #38C9F0, #00D9A6)',
            }}
          />
        </div>

        {/* Steps list */}
        <div className="space-y-2 mt-4">
          {ANALYSIS_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              {analysisStep > i ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="12" fill="#00D9A6" fillOpacity={0.15} />
                  <path d="M7 12.5L10.5 16L17 9" stroke="#00D9A6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : analysisStep === i ? (
                <span className="w-[18px] h-[18px] flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-[#38C9F0] animate-pulse" />
                </span>
              ) : (
                <span className="w-[18px] h-[18px] flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#1A3A5C]" />
                </span>
              )}
              <span className={`text-sm ${analysisStep > i ? 'text-white/80' : analysisStep === i ? 'text-white' : 'text-[#5A7A9B]'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ─── Render: Results screen ─── */
  const renderResultsScreen = () => (
    <div className="flex flex-col h-full overflow-y-auto pb-32">
      {/* Video playback (smaller) */}
      {recordedUrl && (
        <div className="mx-4 mt-2 rounded-2xl overflow-hidden bg-black" style={{ height: '30vh' }}>
          <video
            src={recordedUrl}
            controls
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {/* a) Emotional State Detected */}
        <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
          <h3 className="text-xs font-bold tracking-wider uppercase mb-3" style={{ color: stateColor }}>
            Emotional State Detected
          </h3>
          <p className="text-white text-sm font-semibold mb-2">
            {childName} appears to be {currentState.primaryState.replace('_', ' ')} in this video
          </p>
          {/* Confidence bar */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[#5A7A9B] text-xs w-20">Confidence</span>
            <div className="flex-1 h-2 rounded-full bg-[#060E1C] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${currentState.confidence * 100}%`, backgroundColor: stateColor }}
              />
            </div>
            <span className="text-white text-xs font-mono w-10 text-right">
              {Math.round(currentState.confidence * 100)}%
            </span>
          </div>
          <p className="text-[#C8D4E4] text-xs leading-relaxed">
            Facial cues suggest <span className="text-white font-medium">{emotionLabel}</span>.
            Body language is {bodyLabel}.
          </p>
        </div>

        {/* b) Body Language Summary */}
        <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
          <h3 className="text-xs font-bold text-[#38C9F0] tracking-wider uppercase mb-3">
            Body Language Summary
          </h3>
          <div className="space-y-2">
            {([['Posture', bodyDesc.posture], ['Movement', bodyDesc.movement], ['Eye Contact', bodyDesc.eyeContact]] as const).map(([label, value]) => {
              const dotColor = value === 'Calm' || value === 'Relaxed' || value === 'Present'
                ? '#00D9A6'
                : value === 'Fidgeting' || value === 'Seeking' || value === 'Tense' || value === 'Shifting'
                  ? '#F0C038'
                  : '#FF6B6B';
              return (
                <div key={label} className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                  <span className="text-[#5A7A9B] text-xs w-20">{label}</span>
                  <span className="text-white text-sm font-medium">{value}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* c) Communication Attempts */}
        <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
          <h3 className="text-xs font-bold text-[#8B6EE8] tracking-wider uppercase mb-3">
            Communication Attempts Detected
          </h3>
          {detectedGestures.length > 0 ? (
            <div className="space-y-3">
              {detectedGestures.map((g) => (
                <div key={g.id} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#8B6EE8]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8B6EE8" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3" />
                    </svg>
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium">Possible sign: {g.label}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8B6EE8]/15 text-[#8B6EE8]">
                        {Math.round(g.confidence * 100)}%
                      </span>
                    </div>
                    {g.description && (
                      <p className="text-[#5A7A9B] text-xs mt-0.5">{g.description}</p>
                    )}
                  </div>
                </div>
              ))}
              <p className="text-[#C8D4E4] text-xs leading-relaxed mt-2">
                {childName} may be trying to communicate needs through these gestures.
              </p>
            </div>
          ) : (
            <p className="text-[#5A7A9B] text-xs">No specific communication gestures detected in this clip.</p>
          )}
        </div>

        {/* d) Sensory Indicators */}
        <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
          <h3 className="text-xs font-bold text-[#F0C038] tracking-wider uppercase mb-3">
            Sensory Indicators
          </h3>
          <p className="text-white text-sm font-semibold mb-1">
            {childName} appears {sensoryInfo.comfortable ? 'comfortable' : 'overwhelmed'} in this environment
          </p>
          <p className="text-[#C8D4E4] text-xs leading-relaxed">{sensoryInfo.note}</p>
          <div className="flex gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#5A7A9B]">Noise:</span>
              <span className="text-[10px] text-white font-mono">{sensorReadings.context.ambientNoise} dB</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#5A7A9B]">Light:</span>
              <span className="text-[10px] text-white font-mono">{sensorReadings.context.ambientLight}%</span>
            </div>
          </div>
        </div>

        {/* e) Recommendations */}
        <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
          <h3 className="text-xs font-bold text-[#00D9A6] tracking-wider uppercase mb-3">
            Recommendations
          </h3>
          <div className="space-y-3">
            {recs.map((rec, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-lg mt-0.5 shrink-0">{rec.icon}</span>
                <div>
                  <p className="text-white text-sm font-semibold">{rec.text}</p>
                  <p className="text-[#5A7A9B] text-xs mt-0.5 leading-relaxed">{rec.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* f) Micro-Expression Breakdown */}
        <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
          <h3 className="text-xs font-bold text-[#38C9F0] tracking-wider uppercase mb-3">
            Micro-Expression Breakdown
          </h3>
          {/* Timeline bar */}
          <div className="flex rounded-full overflow-hidden h-4 mb-3">
            {timeline.segments.map((seg, i) => {
              const totalSegments = timeline.segments.length;
              return (
                <div
                  key={i}
                  className="h-full"
                  style={{
                    backgroundColor: seg.color,
                    flex: 1,
                    opacity: 0.8 + (i / totalSegments) * 0.2,
                  }}
                />
              );
            })}
          </div>
          {/* Segment labels */}
          <div className="space-y-1.5">
            {timeline.segments.map((seg, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-[#5A7A9B] text-[11px] font-mono w-14">{seg.range}</span>
                <span className="text-white text-xs">{seg.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-[210] bg-gradient-to-t from-[#060E1C] via-[#060E1C] to-transparent pt-6 pb-6 px-4">
        <div className="flex gap-3">
          <button
            onClick={recordAnother}
            className="flex-1 py-3 rounded-xl bg-[#0D1B2A] border border-[#1A3A5C] text-white text-sm font-semibold active:scale-95 transition-transform"
          >
            Record Another
          </button>
          <button
            onClick={() => addToast("Analysis saved to Leo's timeline", 'success')}
            className="flex-1 py-3 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #38C9F0, #00D9A6)', color: '#060E1C' }}
          >
            Save Analysis
          </button>
        </div>
        <button
          onClick={() => addToast('Report ready to share', 'success')}
          className="w-full mt-2 py-3 rounded-xl bg-[#8B6EE8]/15 border border-[#8B6EE8]/30 text-[#8B6EE8] text-sm font-semibold active:scale-95 transition-transform"
        >
          Share with Therapist
        </button>
      </div>
    </div>
  );

  /* ─── Render: Library screen ─── */
  const renderLibraryScreen = () => (
    <div className="flex flex-col h-full px-4 pt-2 overflow-y-auto pb-8">
      <div className="space-y-3">
        {MOCK_LIBRARY.map((entry) => (
          <button
            key={entry.id}
            onClick={() => {
              setSelectedLibraryEntry(entry);
              setMode('library-detail');
            }}
            className="w-full bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4 text-left active:scale-[0.98] transition-transform"
          >
            <div className="flex gap-3">
              {/* Thumbnail placeholder */}
              <div className="w-16 h-16 rounded-xl bg-[#1A3A5C] flex items-center justify-center shrink-0">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="#5A7A9B" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[#5A7A9B] text-[11px] mb-1">
                  <span>{entry.date}</span>
                  <span>·</span>
                  <span>{entry.duration}</span>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: STATE_COLOR[entry.state] }}
                  />
                  <span className="text-white text-sm font-semibold capitalize">
                    {entry.state.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-[#C8D4E4] text-xs truncate">{entry.finding}</p>
              </div>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#5A7A9B" strokeWidth={2} className="shrink-0 mt-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  /* ─── Render: Library detail screen ─── */
  const renderLibraryDetailScreen = () => {
    if (!selectedLibraryEntry) return null;
    const entry = selectedLibraryEntry;
    const entryState = entry.state;
    const entryColor = STATE_COLOR[entryState];
    const entryEmotion = EMOTION_LABEL[entryState];
    const entryBody = BODY_DESC[entryState];
    const entryTimeline = TIMELINE_SEGMENTS[entryState];
    const entryRecs = RECOMMENDATIONS[entryState];

    return (
      <div className="flex flex-col h-full overflow-y-auto pb-8">
        {/* Header with back */}
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => { setSelectedLibraryEntry(null); setMode('library'); }}
            className="w-8 h-8 rounded-full bg-[#0D1B2A] flex items-center justify-center active:scale-90 transition-transform"
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <span className="text-white text-sm font-semibold">{entry.date}</span>
            <span className="text-[#5A7A9B] text-xs ml-2">{entry.duration}</span>
          </div>
        </div>

        {/* Thumbnail placeholder */}
        <div className="mx-4 rounded-2xl bg-[#1A3A5C] h-40 flex items-center justify-center">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="#5A7A9B" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
          </svg>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Emotional state */}
          <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
            <h3 className="text-xs font-bold tracking-wider uppercase mb-2" style={{ color: entryColor }}>
              Emotional State
            </h3>
            <p className="text-white text-sm">{childName} appeared {entryState.replace('_', ' ')}</p>
            <p className="text-[#C8D4E4] text-xs mt-1">Facial cues: {entryEmotion}</p>
          </div>

          {/* Body language */}
          <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-[#38C9F0] tracking-wider uppercase mb-2">Body Language</h3>
            <div className="space-y-1.5">
              {([['Posture', entryBody.posture], ['Movement', entryBody.movement], ['Eye Contact', entryBody.eyeContact]] as const).map(([label, value]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[#5A7A9B] text-xs w-20">{label}</span>
                  <span className="text-white text-xs">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Key finding */}
          <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-[#F0C038] tracking-wider uppercase mb-2">Key Finding</h3>
            <p className="text-white text-sm">{entry.finding}</p>
          </div>

          {/* Timeline */}
          <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-[#38C9F0] tracking-wider uppercase mb-2">Expression Timeline</h3>
            <div className="flex rounded-full overflow-hidden h-3 mb-2">
              {entryTimeline.segments.map((seg, i) => (
                <div key={i} className="h-full flex-1" style={{ backgroundColor: seg.color }} />
              ))}
            </div>
            <div className="space-y-1">
              {entryTimeline.segments.map((seg, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: seg.color }} />
                  <span className="text-[#5A7A9B] text-[10px] font-mono w-12">{seg.range}</span>
                  <span className="text-white text-[11px]">{seg.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-[#0D1B2A] border border-[#1A3A5C] rounded-2xl p-4">
            <h3 className="text-xs font-bold text-[#00D9A6] tracking-wider uppercase mb-2">Recommendations</h3>
            <div className="space-y-2">
              {entryRecs.slice(0, 2).map((rec, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-base shrink-0">{rec.icon}</span>
                  <div>
                    <p className="text-white text-sm font-medium">{rec.text}</p>
                    <p className="text-[#5A7A9B] text-xs">{rec.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ─── Main Render ─── */
  const currentTab: ActiveTab = mode === 'library' || mode === 'library-detail' ? 'library' : 'record';

  return (
    <div className="fixed inset-0 z-[200] bg-[#060E1C] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <div>
          <h1 className="text-white text-lg font-bold">Video Analysis</h1>
          {mode === 'record' && (
            <p className="text-[#5A7A9B] text-xs mt-0.5">
              Record {childName} to understand what's happening
            </p>
          )}
          {mode === 'analysing' && (
            <p className="text-[#38C9F0] text-xs mt-0.5">Processing video clip...</p>
          )}
          {mode === 'results' && (
            <p className="text-[#00D9A6] text-xs mt-0.5">Analysis complete</p>
          )}
          {(mode === 'library' || mode === 'library-detail') && (
            <p className="text-[#5A7A9B] text-xs mt-0.5">Saved video analyses</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-[#0D1B2A] flex items-center justify-center active:scale-90 transition-transform"
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      {mode !== 'analysing' && (
        <div className="flex mx-4 mb-2 bg-[#0D1B2A] rounded-xl p-1">
          <button
            onClick={switchToRecord}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              currentTab === 'record'
                ? 'bg-[#1A3A5C] text-white'
                : 'text-[#5A7A9B]'
            }`}
          >
            Record
          </button>
          <button
            onClick={switchToLibrary}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              currentTab === 'library'
                ? 'bg-[#1A3A5C] text-white'
                : 'text-[#5A7A9B]'
            }`}
          >
            Library
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'record' && renderRecordScreen()}
        {mode === 'analysing' && renderAnalysingScreen()}
        {mode === 'results' && renderResultsScreen()}
        {mode === 'library' && renderLibraryScreen()}
        {mode === 'library-detail' && renderLibraryDetailScreen()}
      </div>

      {/* Pulse animation for record button */}
      <style>{`
        @keyframes pulse-record {
          0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
          50% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
        }
      `}</style>
    </div>
  );
}
