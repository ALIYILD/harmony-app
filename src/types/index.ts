export type ChildState =
  | 'calm'
  | 'engaged'
  | 'uneasy'
  | 'confused'
  | 'frustrated'
  | 'overloaded'
  | 'dysregulated'
  | 'shutdown_risk'
  | 'sensory_seeking';

export type Trajectory = 'stable' | 'escalating' | 'de-escalating';

export type ConfidenceLevel = 'likely' | 'possible' | 'uncertain' | 'low';

export interface StateEstimate {
  primaryState: ChildState;
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  secondaryState?: ChildState;
  secondaryConfidence?: number;
  trajectory: Trajectory;
  trajectoryConfidence: number;
  modalityContributions: {
    audio: number;
    vision: number;
    biometric: number;
    context: number;
  };
  timestamp: number;
}

export interface SensorReading {
  audio: {
    vocalIntensity: number;
    pitch: number;
    cryingScore: number;
    vocalStimScore: number;
    silenceRatio: number;
    breathingRate: number;
  };
  vision: {
    facialDistress: number;
    bodyTension: number;
    movementVelocity: number;
    repetitiveMotion: number;
    gazeAvoidance: number;
    stillnessScore: number;
  };
  biometric: {
    heartRate: number;
    hrv: number;
    heartRateTrend: number;
    activityLevel: number;
  };
  context: {
    timeOfDay: string;
    dayType: 'school' | 'weekend' | 'holiday';
    minutesSinceTransition: number;
    minutesSinceMeal: number;
    ambientNoise: number;
    ambientLight: number;
    routineAdherence: number;
  };
}

export interface Suggestion {
  id: string;
  type: 'do' | 'avoid' | 'sensory' | 'communication';
  text: string;
  detail?: string;
  icon: string;
  priority: number;
  successRate?: number;
}

export interface EventLog {
  id: string;
  timestamp: number;
  type: 'meltdown' | 'near_meltdown' | 'shutdown' | 'sensory_overload' | 'frustration' | 'good_moment' | 'transition_difficulty' | 'other';
  trigger?: string;
  intervention?: string;
  outcome?: 'helped' | 'no_effect' | 'made_worse' | 'unknown';
  notes?: string;
  stateAtTime?: StateEstimate;
  duration?: number;
}

export interface SensoryProfile {
  sound: { level: number; triggers: string[] };
  light: { level: number; triggers: string[] };
  touch: { level: number; triggers: string[] };
  taste: { level: number; triggers: string[] };
  movement: { level: number; triggers: string[] };
  smell: { level: number; triggers: string[] };
}

export interface ChildProfile {
  name: string;
  age: number;
  communicationLevel: 'nonverbal' | 'minimal_verbal' | 'verbal_limited' | 'verbal';
  sensoryProfile: SensoryProfile;
  knownTriggers: string[];
  calmingStrategies: string[];
  preferences: string[];
  routineNotes: string;
}

export interface DailySummary {
  date: string;
  overallMood: string;
  stateBreakdown: Record<ChildState, number>;
  events: EventLog[];
  highlights: string[];
  concerns: string[];
  totalCalmMinutes: number;
  totalElevatedMinutes: number;
  totalHighRiskMinutes: number;
  interventionSuccess: number;
}

export type TabId = 'monitor' | 'copilot' | 'log' | 'summary' | 'profile' | 'gestures';

export interface GestureEntry {
  id: string;
  label: string;
  category: 'need' | 'emotion' | 'request' | 'refusal' | 'sensory' | 'social' | 'custom';
  confidence: number;
  timesConfirmed: number;
  source: 'personal' | 'common';
  createdAt: number;
  lastSeenAt: number;
  description?: string;
}

export interface GestureEvent {
  id: string;
  timestamp: number;
  matchedLabel: string | null;
  matchSource: 'personal' | 'common' | null;
  confidence: number;
  wasLabeled: boolean;
  assignedLabel?: string;
}
