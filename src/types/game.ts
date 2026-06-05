export type TireCompound = 'soft' | 'medium' | 'hard' | 'wet';

export type Weather = 'dry' | 'light_rain' | 'heavy_rain';

export type Difficulty = 'easy' | 'normal' | 'hard';

export type GameMode = 'grand_prix' | 'learning';

export type RaceState = 'countdown' | 'running' | 'paused' | 'finished';

export type EventType = 'safety_car' | 'rain' | 'crash' | 'undercut' | 'finish' | 'retire';

export interface TireStats {
  grip: number;
  wearRate: number;
  optimalTemp: [number, number];
  color: string;
  name: string;
}

export interface DifficultyConfig {
  aiSpeedMultiplier: number;
  eventFrequency: number;
  tireWearMultiplier: number;
  fuelConsumptionMultiplier: number;
  name: string;
}

export interface CarState {
  id: string;
  name: string;
  color: string;
  isPlayer: boolean;
  position: number;
  lap: number;
  totalTime: number;
  bestLapTime: number;
  currentLapTime: number;
  lapStartTime: number;
  speed: number;
  baseSpeed: number;
  fuel: number;
  maxFuel: number;
  tireCompound: TireCompound;
  tireWear: number;
  tireTemperature: number;
  inPit: boolean;
  pitStops: number;
  pitTimer: number;
  pitStopPlanned: boolean;
  nextTireCompound: TireCompound | null;
  nextFuelAmount: number;
  trackProgress: number;
  distanceTravelled: number;
  retired: boolean;
  retirementReason: string | null;
}

export interface RaceEvent {
  id: string;
  type: EventType;
  lap: number;
  startTime: number;
  duration: number;
  active: boolean;
  notified: boolean;
  data?: Record<string, any>;
}

export interface RaceConfig {
  trackId: string;
  trackName: string;
  totalLaps: number;
  difficulty: Difficulty;
  mode: GameMode;
  startingFuel: number;
  startingTire: TireCompound;
  aiOpponents: number;
}

export interface HighScore {
  id: string;
  trackId: string;
  trackName: string;
  difficulty: Difficulty;
  position: number;
  totalTime: number;
  bestLapTime: number;
  pitStops: number;
  score: number;
  tiresUsed: TireCompound[];
  retired: boolean;
  date: number;
}

export interface TrackData {
  id: string;
  name: string;
  country: string;
  length: number;
  corners: number;
  difficulty: number;
  path: Phaser.Types.Math.Vector2Like[];
  width: number;
  pitPosition: number;
  worldSize: { width: number; height: number };
  startPosition: Phaser.Types.Math.Vector2Like;
}

export interface PitStopResult {
  carId: string;
  lap: number;
  tireCompound: TireCompound;
  fuelAdded: number;
  timeLost: number;
  positionsGained: number;
  positionsLost: number;
}

export interface StrategyFeedback {
  quality: 'excellent' | 'good' | 'average' | 'poor';
  score: number;
  comments: string[];
  suggestions: string[];
}

export interface TireUsageRecord {
  compound: TireCompound;
  startLap: number;
  endLap: number;
  stintLaps: number;
  avgWearRate: number;
}

export interface EventTimelineItem {
  id: string;
  type: EventType;
  lap: number;
  raceTime: number;
  description: string;
  duration?: number;
  data?: Record<string, any>;
  playerReactionTime?: number;
}

export interface StrategySuggestion {
  id: string;
  category: 'tire' | 'fuel' | 'pit' | 'weather' | 'safety';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  referenceLap: number;
  outcome?: 'better' | 'worse' | 'neutral';
}

export interface RaceSummary {
  keyMoments: string[];
  strategyEffectiveness: number;
  bestDecision: string;
  worstDecision: string;
  totalScore: number;
}

export interface LearningFeedbackItem {
  category: 'rain' | 'tire' | 'fuel' | 'safety_car';
  timing: 'excellent' | 'good' | 'average' | 'poor';
  description: string;
  reactionTime?: number;
  suggestion: string;
}

export interface LearningFeedback {
  overall: 'excellent' | 'good' | 'average' | 'poor';
  score: number;
  items: LearningFeedbackItem[];
  summary: string;
}

export interface RaceResult {
  id: string;
  finalPosition: number;
  totalTime: number;
  bestLapTime: number;
  lapsCompleted: number;
  retired: boolean;
  retirementReason: string | null;
  score: number;
  tireUsage: TireUsageRecord[];
  pitStops: PitStopResult[];
  eventTimeline: EventTimelineItem[];
  strategySuggestions: StrategySuggestion[];
  summary: RaceSummary;
  learningFeedback?: LearningFeedback;
  weatherChanges: Array<{ lap: number; from: Weather; to: Weather }>;
  safetyCarPeriods: Array<{ startLap: number; endLap: number }>;
}

export interface HighScore {
  id: string;
  trackId: string;
  trackName: string;
  difficulty: Difficulty;
  position: number;
  totalTime: number;
  bestLapTime: number;
  pitStops: number;
  score: number;
  tiresUsed: TireCompound[];
  retired: boolean;
  date: number;
  raceResult?: RaceResult;
  summary?: string;
  mode?: GameMode;
}

export interface TutorialStep {
  id: number;
  title: string;
  description: string;
  highlightElement?: string;
  actionRequired?: string;
  completed: boolean;
}
