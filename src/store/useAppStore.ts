import { create } from 'zustand';
import type { StateEstimate, SensorReading, EventLog, ChildProfile, TabId, Suggestion } from '../types';
import { generateMockChildProfile } from '../data/mockData';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
}

interface AppState {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  currentState: StateEstimate;
  setCurrentState: (state: StateEstimate) => void;

  sensorReadings: SensorReading;
  setSensorReadings: (readings: SensorReading) => void;

  suggestions: Suggestion[];
  setSuggestions: (suggestions: Suggestion[]) => void;

  eventLogs: EventLog[];
  addEventLog: (event: EventLog) => void;

  childProfile: ChildProfile;
  updateChildProfile: (profile: Partial<ChildProfile>) => void;

  stateHistory: StateEstimate[];
  addStateToHistory: (state: StateEstimate) => void;

  isSimulating: boolean;
  setIsSimulating: (v: boolean) => void;

  simulationPhase: number;
  setSimulationPhase: (p: number) => void;

  monitoringActive: boolean;
  setMonitoringActive: (v: boolean) => void;

  toasts: Toast[];
  addToast: (message: string, type?: 'info' | 'warning' | 'danger' | 'success') => void;
  removeToast: (id: string) => void;
}

const defaultState: StateEstimate = {
  primaryState: 'calm',
  confidence: 0.85,
  confidenceLevel: 'likely',
  trajectory: 'stable',
  trajectoryConfidence: 0.78,
  modalityContributions: { audio: 0.35, vision: 0.30, biometric: 0.20, context: 0.15 },
  timestamp: Date.now(),
};

const defaultSensors: SensorReading = {
  audio: { vocalIntensity: 22, pitch: 180, cryingScore: 0.02, vocalStimScore: 0.08, silenceRatio: 0.65, breathingRate: 18 },
  vision: { facialDistress: 0.08, bodyTension: 0.12, movementVelocity: 0.15, repetitiveMotion: 0.10, gazeAvoidance: 0.20, stillnessScore: 0.60 },
  biometric: { heartRate: 82, hrv: 48, heartRateTrend: 0, activityLevel: 0.25 },
  context: { timeOfDay: '10:15 AM', dayType: 'school', minutesSinceTransition: 45, minutesSinceMeal: 90, ambientNoise: 35, ambientLight: 60, routineAdherence: 0.85 },
};

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'monitor',
  setActiveTab: (tab) => set({ activeTab: tab }),

  currentState: defaultState,
  setCurrentState: (currentState) => set({ currentState }),

  sensorReadings: defaultSensors,
  setSensorReadings: (sensorReadings) => set({ sensorReadings }),

  suggestions: [],
  setSuggestions: (suggestions) => set({ suggestions }),

  eventLogs: [],
  addEventLog: (event) => set((s) => ({ eventLogs: [event, ...s.eventLogs] })),

  childProfile: generateMockChildProfile(),
  updateChildProfile: (profile) => set((s) => ({ childProfile: { ...s.childProfile, ...profile } })),

  stateHistory: [],
  addStateToHistory: (state) => set((s) => ({ stateHistory: [...s.stateHistory.slice(-100), state] })),

  isSimulating: false,
  setIsSimulating: (v) => set({ isSimulating: v }),

  simulationPhase: 0,
  setSimulationPhase: (p) => set({ simulationPhase: p }),

  monitoringActive: true,
  setMonitoringActive: (v) => set({ monitoringActive: v }),

  toasts: [],
  addToast: (message, type = 'info') => set((s) => ({
    toasts: [...s.toasts, { id: Date.now().toString(), message, type }]
  })),
  removeToast: (id) => set((s) => ({
    toasts: s.toasts.filter(t => t.id !== id)
  })),
}));
