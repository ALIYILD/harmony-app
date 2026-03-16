import { useCallback, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { StateEstimate } from '../types';

export function useSimulation() {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const {
    setCurrentState, setSensorReadings, setIsSimulating,
    setSimulationPhase, addStateToHistory, setActiveTab,
    addToast, addEventLog
  } = useAppStore();

  const cleanup = useCallback(() => {
    timers.current.forEach(t => clearTimeout(t));
    timers.current = [];
  }, []);

  const run = useCallback(() => {
    cleanup();
    setIsSimulating(true);
    setSimulationPhase(0);
    setActiveTab('monitor');

    // Phase 0: Calm baseline (already default)

    // Phase 1: Early signs (3s) — uneasy
    timers.current.push(setTimeout(() => {
      setSimulationPhase(1);
      addToast('Vocal tone shift detected — monitoring closely', 'warning');
      const state: StateEstimate = {
        primaryState: 'uneasy',
        confidence: 0.65,
        confidenceLevel: 'possible',
        trajectory: 'escalating',
        trajectoryConfidence: 0.58,
        modalityContributions: { audio: 0.40, vision: 0.25, biometric: 0.20, context: 0.15 },
        timestamp: Date.now(),
      };
      setCurrentState(state);
      addStateToHistory(state);
      setSensorReadings({
        audio: { vocalIntensity: 38, pitch: 220, cryingScore: 0.05, vocalStimScore: 0.15, silenceRatio: 0.45, breathingRate: 22 },
        vision: { facialDistress: 0.25, bodyTension: 0.30, movementVelocity: 0.35, repetitiveMotion: 0.22, gazeAvoidance: 0.40, stillnessScore: 0.30 },
        biometric: { heartRate: 95, hrv: 38, heartRateTrend: 1, activityLevel: 0.40 },
        context: { timeOfDay: '3:42 PM', dayType: 'school', minutesSinceTransition: 12, minutesSinceMeal: 120, ambientNoise: 55, ambientLight: 70, routineAdherence: 0.60 },
      });
    }, 3000));

    // Phase 2: Frustrated (9s)
    timers.current.push(setTimeout(() => {
      setSimulationPhase(2);
      addToast('Stress threshold approaching — frustration building', 'danger');
      addEventLog({ id: 'sim-e1', timestamp: Date.now(), type: 'frustration', trigger: 'After-school transition + loud environment', notes: 'Detected by audio + vision modalities' });
      const state: StateEstimate = {
        primaryState: 'frustrated',
        confidence: 0.74,
        confidenceLevel: 'likely',
        secondaryState: 'sensory_seeking',
        secondaryConfidence: 0.45,
        trajectory: 'escalating',
        trajectoryConfidence: 0.72,
        modalityContributions: { audio: 0.45, vision: 0.30, biometric: 0.15, context: 0.10 },
        timestamp: Date.now(),
      };
      setCurrentState(state);
      addStateToHistory(state);
      setSensorReadings({
        audio: { vocalIntensity: 58, pitch: 280, cryingScore: 0.12, vocalStimScore: 0.30, silenceRatio: 0.25, breathingRate: 26 },
        vision: { facialDistress: 0.45, bodyTension: 0.55, movementVelocity: 0.50, repetitiveMotion: 0.40, gazeAvoidance: 0.55, stillnessScore: 0.10 },
        biometric: { heartRate: 108, hrv: 28, heartRateTrend: 2, activityLevel: 0.60 },
        context: { timeOfDay: '3:45 PM', dayType: 'school', minutesSinceTransition: 15, minutesSinceMeal: 123, ambientNoise: 62, ambientLight: 70, routineAdherence: 0.50 },
      });
    }, 9000));

    // Phase 3: Overloaded — switch to copilot (16s)
    timers.current.push(setTimeout(() => {
      setSimulationPhase(3);
      setActiveTab('copilot');
      addToast('Sensory overload detected — guidance sent to your device', 'danger');
      addEventLog({ id: 'sim-e2', timestamp: Date.now(), type: 'sensory_overload', trigger: 'Cumulative noise + routine deviation', intervention: 'Ear defenders + quiet space', notes: 'Auto-guided intervention triggered' });
      const state: StateEstimate = {
        primaryState: 'overloaded',
        confidence: 0.82,
        confidenceLevel: 'likely',
        trajectory: 'escalating',
        trajectoryConfidence: 0.80,
        modalityContributions: { audio: 0.40, vision: 0.35, biometric: 0.15, context: 0.10 },
        timestamp: Date.now(),
      };
      setCurrentState(state);
      addStateToHistory(state);
      setSensorReadings({
        audio: { vocalIntensity: 75, pitch: 340, cryingScore: 0.35, vocalStimScore: 0.55, silenceRatio: 0.10, breathingRate: 32 },
        vision: { facialDistress: 0.70, bodyTension: 0.75, movementVelocity: 0.65, repetitiveMotion: 0.60, gazeAvoidance: 0.80, stillnessScore: 0.05 },
        biometric: { heartRate: 125, hrv: 18, heartRateTrend: 3, activityLevel: 0.80 },
        context: { timeOfDay: '3:48 PM', dayType: 'school', minutesSinceTransition: 18, minutesSinceMeal: 126, ambientNoise: 70, ambientLight: 75, routineAdherence: 0.35 },
      });
    }, 16000));

    // Phase 4: De-escalating (28s)
    timers.current.push(setTimeout(() => {
      setSimulationPhase(4);
      addToast('De-escalating — Leo is responding to intervention', 'info');
      const state: StateEstimate = {
        primaryState: 'frustrated',
        confidence: 0.60,
        confidenceLevel: 'possible',
        trajectory: 'de-escalating',
        trajectoryConfidence: 0.68,
        modalityContributions: { audio: 0.35, vision: 0.30, biometric: 0.20, context: 0.15 },
        timestamp: Date.now(),
      };
      setCurrentState(state);
      addStateToHistory(state);
      setSensorReadings({
        audio: { vocalIntensity: 42, pitch: 240, cryingScore: 0.15, vocalStimScore: 0.35, silenceRatio: 0.35, breathingRate: 24 },
        vision: { facialDistress: 0.40, bodyTension: 0.45, movementVelocity: 0.30, repetitiveMotion: 0.35, gazeAvoidance: 0.50, stillnessScore: 0.25 },
        biometric: { heartRate: 105, hrv: 30, heartRateTrend: -1, activityLevel: 0.45 },
        context: { timeOfDay: '3:52 PM', dayType: 'school', minutesSinceTransition: 22, minutesSinceMeal: 130, ambientNoise: 40, ambientLight: 50, routineAdherence: 0.50 },
      });
    }, 28000));

    // Phase 5: Calm — resolved (40s), switch to monitor
    timers.current.push(setTimeout(() => {
      setSimulationPhase(5);
      setActiveTab('monitor');
      addToast('Resolved — Leo has returned to a calm state', 'success');
      addEventLog({ id: 'sim-e3', timestamp: Date.now(), type: 'good_moment', trigger: 'Successful de-escalation', intervention: 'Weighted blanket + reduced demands', outcome: 'helped', notes: 'Crisis averted — 4 minute de-escalation' });
      const state: StateEstimate = {
        primaryState: 'calm',
        confidence: 0.80,
        confidenceLevel: 'likely',
        trajectory: 'stable',
        trajectoryConfidence: 0.75,
        modalityContributions: { audio: 0.30, vision: 0.30, biometric: 0.25, context: 0.15 },
        timestamp: Date.now(),
      };
      setCurrentState(state);
      addStateToHistory(state);
      setSensorReadings({
        audio: { vocalIntensity: 20, pitch: 175, cryingScore: 0.02, vocalStimScore: 0.08, silenceRatio: 0.60, breathingRate: 18 },
        vision: { facialDistress: 0.08, bodyTension: 0.12, movementVelocity: 0.12, repetitiveMotion: 0.10, gazeAvoidance: 0.20, stillnessScore: 0.55 },
        biometric: { heartRate: 85, hrv: 45, heartRateTrend: -1, activityLevel: 0.25 },
        context: { timeOfDay: '3:58 PM', dayType: 'school', minutesSinceTransition: 28, minutesSinceMeal: 136, ambientNoise: 30, ambientLight: 45, routineAdherence: 0.75 },
      });
      setIsSimulating(false);
    }, 40000));
  }, [cleanup, setCurrentState, setSensorReadings, setIsSimulating, setSimulationPhase, addStateToHistory, setActiveTab, addToast, addEventLog]);

  const reset = useCallback(() => {
    cleanup();
    setIsSimulating(false);
    setSimulationPhase(0);
    const state: StateEstimate = {
      primaryState: 'calm',
      confidence: 0.85,
      confidenceLevel: 'likely',
      trajectory: 'stable',
      trajectoryConfidence: 0.78,
      modalityContributions: { audio: 0.35, vision: 0.30, biometric: 0.20, context: 0.15 },
      timestamp: Date.now(),
    };
    setCurrentState(state);
    setSensorReadings({
      audio: { vocalIntensity: 22, pitch: 180, cryingScore: 0.02, vocalStimScore: 0.08, silenceRatio: 0.65, breathingRate: 18 },
      vision: { facialDistress: 0.08, bodyTension: 0.12, movementVelocity: 0.15, repetitiveMotion: 0.10, gazeAvoidance: 0.20, stillnessScore: 0.60 },
      biometric: { heartRate: 82, hrv: 48, heartRateTrend: 0, activityLevel: 0.25 },
      context: { timeOfDay: '10:15 AM', dayType: 'school', minutesSinceTransition: 45, minutesSinceMeal: 90, ambientNoise: 35, ambientLight: 60, routineAdherence: 0.85 },
    });
  }, [cleanup, setCurrentState, setSensorReadings, setIsSimulating, setSimulationPhase]);

  return { run, reset, cleanup };
}
