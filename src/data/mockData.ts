import type { ChildProfile, Suggestion, EventLog, DailySummary, GestureEntry } from '../types';

export function generateMockChildProfile(): ChildProfile {
  return {
    name: 'Leo',
    age: 7,
    communicationLevel: 'minimal_verbal',
    sensoryProfile: {
      sound: { level: 85, triggers: ['Sudden loud noises', 'Blender/vacuum', 'Crowded spaces', 'School bell'] },
      light: { level: 55, triggers: ['Fluorescent lighting', 'Direct sunlight'] },
      touch: { level: 70, triggers: ['Certain clothing textures', 'Unexpected touch', 'Sticky substances'] },
      taste: { level: 50, triggers: ['New food textures', 'Strong flavours'] },
      movement: { level: 30, triggers: ['Car journeys over 30 min'] },
      smell: { level: 45, triggers: ['Strong cleaning products', 'Perfume'] },
    },
    knownTriggers: [
      'Unexpected routine changes',
      'Loud or sudden noises',
      'Transitions between activities',
      'Being asked multiple questions',
      'Crowded environments',
      'After-school fatigue',
      'Hunger (missed snack time)',
      'New environments',
    ],
    calmingStrategies: [
      'Weighted blanket',
      'Ear defenders',
      'Quiet room with dim lights',
      'Favourite music (low volume)',
      'Deep pressure (firm hug if consented)',
      'Visual timer for transitions',
      'Favourite sensory toy (fidget cube)',
      'Rocking chair',
    ],
    preferences: [
      'Prefers visual choices over verbal questions',
      'Responds well to "first/then" boards',
      'Likes countdown warnings before transitions',
      'Calms faster with Mum than Dad (familiar voice tone)',
      'Responds to singing more than talking during distress',
    ],
    routineNotes: 'Follows a morning visual schedule. Needs 15-min decompression after school before any demands. Lunch at 12:00 — gets dysregulated if delayed. Bedtime routine starts at 7:15 PM.',
  };
}

export function getSuggestionsForState(state: string, _confidence?: number): Suggestion[] {
  const suggestions: Record<string, Suggestion[]> = {
    calm: [
      { id: 's1', type: 'communication', text: 'Good time for gentle interaction', detail: 'Leo is regulated — this is a good window for brief social engagement or offering choices', icon: '💬', priority: 1 },
      { id: 's2', type: 'do', text: 'Maintain current environment', detail: 'Current conditions seem to be working well. Avoid introducing sudden changes.', icon: '✓', priority: 2 },
    ],
    engaged: [
      { id: 's1', type: 'do', text: 'Let the activity continue', detail: 'Leo appears engaged. Avoid interrupting the current flow unless necessary.', icon: '🎯', priority: 1 },
      { id: 's2', type: 'avoid', text: 'Avoid verbal interruptions', detail: 'Sudden questions or demands may break engagement. Use visual cues if needed.', icon: '🚫', priority: 2 },
    ],
    uneasy: [
      { id: 's1', type: 'do', text: 'Reduce environmental stimulation', detail: 'Lower background noise if possible. Dim lights slightly. Reduce the number of people nearby.', icon: '🔉', priority: 1 },
      { id: 's2', type: 'communication', text: 'Use simple, calm language', detail: 'One-step instructions only. "Leo, sit" rather than "Leo, can you come and sit down at the table?"', icon: '💬', priority: 2 },
      { id: 's3', type: 'sensory', text: 'Offer ear defenders', detail: 'Leo\'s sound sensitivity is high. Proactive ear defender use has helped in 7 of 10 similar situations.', icon: '🎧', priority: 3 },
    ],
    frustrated: [
      { id: 's1', type: 'do', text: 'Pause all demands immediately', detail: 'Remove the current task or expectation. Leo cannot process demands when frustrated.', icon: '⏸️', priority: 1, successRate: 82 },
      { id: 's2', type: 'communication', text: 'Offer a visual choice of 2 options', detail: '"Break" card or "Help" card. Avoid verbal questions — use picture cards.', icon: '🃏', priority: 2, successRate: 74 },
      { id: 's3', type: 'avoid', text: 'Do not say "calm down" or "it\'s okay"', detail: 'Dismissive phrases increase distress. Stay quiet or use a low humming tone.', icon: '🚫', priority: 3 },
      { id: 's4', type: 'sensory', text: 'Offer weighted blanket', detail: 'Deep pressure has been Leo\'s most effective calming input. Success rate: 78% in logged episodes.', icon: '🛋️', priority: 4, successRate: 78 },
    ],
    overloaded: [
      { id: 's1', type: 'do', text: 'Move to quiet, dim space NOW', detail: 'Sensory overload requires immediate environmental change. Reduce ALL input.', icon: '🚪', priority: 1, successRate: 85 },
      { id: 's2', type: 'avoid', text: 'Do not touch without warning', detail: 'During overload, unexpected touch can escalate. Ask or use a visual cue first.', icon: '🚫', priority: 2 },
      { id: 's3', type: 'sensory', text: 'Ear defenders + dim lights', detail: 'Block auditory and visual input simultaneously. This combination works best for Leo.', icon: '🎧', priority: 3, successRate: 80 },
      { id: 's4', type: 'communication', text: 'Stop talking', detail: 'Verbal input IS sensory input. Reduce to zero words. Use presence only.', icon: '🤫', priority: 4 },
    ],
    dysregulated: [
      { id: 's1', type: 'do', text: 'Ensure safety — remove hazards', detail: 'Clear the area of anything that could cause harm. Stay nearby but give space.', icon: '🛡️', priority: 1 },
      { id: 's2', type: 'do', text: 'Wait — do not intervene yet', detail: 'During active dysregulation, most interventions make things worse. Be present, be calm, wait.', icon: '⏳', priority: 2 },
      { id: 's3', type: 'avoid', text: 'No demands, no questions, no reasoning', detail: 'Leo cannot process language right now. Any verbal input adds to overload.', icon: '🚫', priority: 3 },
      { id: 's4', type: 'sensory', text: 'When calming begins: weighted blanket', detail: 'Only introduce sensory support when you see the first signs of de-escalation.', icon: '🛋️', priority: 4 },
    ],
    shutdown_risk: [
      { id: 's1', type: 'do', text: 'Reduce ALL input immediately', detail: 'Shutdown is the nervous system protecting itself. Reduce demands to zero.', icon: '🔇', priority: 1 },
      { id: 's2', type: 'do', text: 'Create a safe, low-stimulation space', detail: 'Dim room, quiet, familiar items nearby. Let Leo choose whether to engage.', icon: '🏠', priority: 2 },
      { id: 's3', type: 'communication', text: 'Do not force interaction', detail: 'Shutdown is not "ignoring you". It is involuntary. Wait for Leo to re-engage on his terms.', icon: '💙', priority: 3 },
    ],
    sensory_seeking: [
      { id: 's1', type: 'sensory', text: 'Offer appropriate sensory input', detail: 'Fidget cube, textured toy, or movement break. Channel the seeking into a safe outlet.', icon: '🧩', priority: 1 },
      { id: 's2', type: 'do', text: 'Allow movement', detail: 'Pacing, rocking, or bouncing may be self-regulation. Do not restrict unless unsafe.', icon: '🏃', priority: 2 },
      { id: 's3', type: 'communication', text: 'Offer a movement break', detail: 'Use the "movement break" visual card. Leo responds well to structured physical activity.', icon: '🃏', priority: 3 },
    ],
    confused: [
      { id: 's1', type: 'communication', text: 'Simplify the current task', detail: 'Break into one step only. Show, don\'t tell. Use visual support.', icon: '📋', priority: 1 },
      { id: 's2', type: 'do', text: 'Demonstrate what you want', detail: 'Model the action rather than explaining. Leo processes visual input better than verbal.', icon: '👀', priority: 2 },
      { id: 's3', type: 'avoid', text: 'Don\'t repeat the same instruction louder', detail: 'If Leo didn\'t understand the first time, repeating louder won\'t help. Rephrase or show.', icon: '🚫', priority: 3 },
    ],
  };
  return suggestions[state] || suggestions.calm;
}

export function generateMockEventLogs(): EventLog[] {
  const now = Date.now();
  return [
    {
      id: 'e1',
      timestamp: now - 3600000 * 2,
      type: 'good_moment',
      trigger: 'Favourite music playing',
      notes: 'Danced and made eye contact with Mum for 10 seconds. Longest eye contact this week.',
      outcome: 'helped',
    },
    {
      id: 'e2',
      timestamp: now - 3600000 * 5,
      type: 'transition_difficulty',
      trigger: 'Leaving the park',
      intervention: 'Visual countdown timer (5 min warning)',
      outcome: 'helped',
      notes: 'Mild upset but recovered with countdown. No meltdown.',
    },
    {
      id: 'e3',
      timestamp: now - 3600000 * 8,
      type: 'sensory_overload',
      trigger: 'Dog barking next door',
      intervention: 'Ear defenders + quiet room',
      outcome: 'helped',
      duration: 15,
      notes: 'Covered ears, started rocking. Ear defenders helped within 3 minutes.',
    },
    {
      id: 'e4',
      timestamp: now - 86400000,
      type: 'near_meltdown',
      trigger: 'After school — routine change (different pick-up person)',
      intervention: 'Weighted blanket + favourite video',
      outcome: 'helped',
      duration: 25,
      notes: 'Very distressed when Grandma picked up instead of Mum. Took 25 min to regulate.',
    },
    {
      id: 'e5',
      timestamp: now - 86400000 * 2,
      type: 'meltdown',
      trigger: 'Supermarket — sensory overload + hunger',
      intervention: 'Left the store, sat in car with weighted blanket',
      outcome: 'helped',
      duration: 40,
      notes: 'Full meltdown in Tesco. Combination of noise, lights, and missed snack time. Need to avoid busy shopping times.',
    },
  ];
}

export function generateMockDailySummary(): DailySummary {
  return {
    date: new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
    overallMood: 'Mostly calm with one elevated period',
    stateBreakdown: {
      calm: 45,
      engaged: 25,
      uneasy: 12,
      confused: 3,
      frustrated: 8,
      overloaded: 4,
      dysregulated: 1,
      shutdown_risk: 0,
      sensory_seeking: 2,
    },
    events: generateMockEventLogs().slice(0, 3),
    highlights: [
      'Longest calm period this week: 2h 15m (morning)',
      'Self-requested ear defenders for first time',
      'Completed morning routine without support',
    ],
    concerns: [
      'After-school transition remains difficult',
      'Sound sensitivity seems elevated today',
    ],
    totalCalmMinutes: 420,
    totalElevatedMinutes: 72,
    totalHighRiskMinutes: 18,
    interventionSuccess: 83,
  };
}

export const weeklyStateData = [
  { day: 'Mon', calm: 65, elevated: 25, highRisk: 10 },
  { day: 'Tue', calm: 55, elevated: 30, highRisk: 15 },
  { day: 'Wed', calm: 72, elevated: 20, highRisk: 8 },
  { day: 'Thu', calm: 60, elevated: 28, highRisk: 12 },
  { day: 'Fri', calm: 50, elevated: 32, highRisk: 18 },
  { day: 'Sat', calm: 78, elevated: 15, highRisk: 7 },
  { day: 'Sun', calm: 75, elevated: 18, highRisk: 7 },
];

export const hourlyStateData = [
  { hour: '7AM', level: 25 },
  { hour: '8AM', level: 20 },
  { hour: '9AM', level: 15 },
  { hour: '10AM', level: 18 },
  { hour: '11AM', level: 22 },
  { hour: '12PM', level: 35 },
  { hour: '1PM', level: 28 },
  { hour: '2PM', level: 20 },
  { hour: '3PM', level: 55 },
  { hour: '4PM', level: 65 },
  { hour: '5PM', level: 42 },
  { hour: '6PM', level: 30 },
  { hour: '7PM', level: 25 },
  { hour: '8PM', level: 15 },
];

export function generateDefaultGestures(): GestureEntry[] {
  return [
    { id: 'g1', label: 'More', category: 'request', confidence: 0.92, timesConfirmed: 24, source: 'personal', createdAt: Date.now() - 86400000 * 12, lastSeenAt: Date.now() - 3600000, description: 'Taps fingers together — means "more" (food, activity, music)' },
    { id: 'g2', label: 'Stop / No more', category: 'refusal', confidence: 0.88, timesConfirmed: 18, source: 'personal', createdAt: Date.now() - 86400000 * 10, lastSeenAt: Date.now() - 7200000, description: 'Pushes hands forward, palms out — means "stop" or "no more"' },
    { id: 'g3', label: 'Help', category: 'request', confidence: 0.85, timesConfirmed: 15, source: 'personal', createdAt: Date.now() - 86400000 * 8, lastSeenAt: Date.now() - 1800000, description: 'Reaches toward caregiver with open hand — requesting help' },
    { id: 'g4', label: 'Ears hurt / Too loud', category: 'sensory', confidence: 0.78, timesConfirmed: 9, source: 'personal', createdAt: Date.now() - 86400000 * 6, lastSeenAt: Date.now() - 5400000, description: 'Covers ears or presses hands against ears — sound discomfort' },
    { id: 'g5', label: 'Want food', category: 'need', confidence: 0.82, timesConfirmed: 12, source: 'personal', createdAt: Date.now() - 86400000 * 9, lastSeenAt: Date.now() - 10800000, description: 'Hand to mouth gesture — hungry or wants a specific food' },
    { id: 'g6', label: 'Finished / All done', category: 'refusal', confidence: 0.75, timesConfirmed: 8, source: 'personal', createdAt: Date.now() - 86400000 * 5, lastSeenAt: Date.now() - 14400000, description: 'Waves both hands side to side — finished with activity' },
    { id: 'g7', label: 'Pointing', category: 'request', confidence: 0.95, timesConfirmed: 40, source: 'common', createdAt: Date.now() - 86400000 * 14, lastSeenAt: Date.now() - 600000, description: 'Points at object — wants that item or directing attention' },
    { id: 'g8', label: 'Upset / Distressed', category: 'emotion', confidence: 0.70, timesConfirmed: 6, source: 'personal', createdAt: Date.now() - 86400000 * 4, lastSeenAt: Date.now() - 21600000, description: 'Hits own legs repeatedly — sign of distress or frustration' },
    { id: 'g9', label: 'Want to go outside', category: 'request', confidence: 0.65, timesConfirmed: 5, source: 'personal', createdAt: Date.now() - 86400000 * 3, lastSeenAt: Date.now() - 43200000, description: 'Pulls caregiver toward door — wants to go outside' },
    { id: 'g10', label: 'Hug / Comfort', category: 'social', confidence: 0.90, timesConfirmed: 20, source: 'personal', createdAt: Date.now() - 86400000 * 11, lastSeenAt: Date.now() - 900000, description: 'Arms raised toward caregiver — requesting a hug or comfort' },
  ];
}
