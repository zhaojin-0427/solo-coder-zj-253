import type { TireCompound, TireStats, Difficulty, DifficultyConfig } from '@/types/game';

export const TIRE_COMPOUNDS: Record<TireCompound, TireStats> = {
  soft: {
    grip: 1.06,
    wearRate: 2.8,
    optimalTemp: [85, 105],
    color: '#EF4444',
    name: '软胎'
  },
  medium: {
    grip: 1.0,
    wearRate: 1.6,
    optimalTemp: [75, 95],
    color: '#FBBF24',
    name: '中性胎'
  },
  hard: {
    grip: 0.94,
    wearRate: 0.85,
    optimalTemp: [70, 90],
    color: '#F9FAFB',
    name: '硬胎'
  },
  wet: {
    grip: 1.15,
    wearRate: 3.2,
    optimalTemp: [35, 55],
    color: '#3B82F6',
    name: '雨胎'
  }
};

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    aiSpeedMultiplier: 0.82,
    eventFrequency: 0.4,
    tireWearMultiplier: 0.65,
    fuelConsumptionMultiplier: 0.7,
    name: '简单'
  },
  normal: {
    aiSpeedMultiplier: 0.94,
    eventFrequency: 1.0,
    tireWearMultiplier: 1.0,
    fuelConsumptionMultiplier: 1.0,
    name: '一般'
  },
  hard: {
    aiSpeedMultiplier: 1.03,
    eventFrequency: 1.6,
    tireWearMultiplier: 1.35,
    fuelConsumptionMultiplier: 1.15,
    name: '困难'
  }
};

export const GAME_CONSTANTS = {
  BASE_LAP_TIME: 60,
  MAX_FUEL_LOAD: 110,
  FUEL_PER_LAP: 2.2,
  FUEL_SPEED_PENALTY: 0.0015,
  PIT_STOP_DURATION: 3.2,
  PIT_SPEED_LIMIT: 0.4,
  TIRE_WEAR_CRITICAL: 0.85,
  TIRE_BLOWOUT_RISK: 0.95,
  TIRE_PERFORMANCE_FALLOFF: 0.5,
  TEMP_GRIP_PENALTY: 0.15,
  WET_GRIP_PENALTY_DRY_TIRE: 0.4,
  DRY_GRIP_PENALTY_WET_TIRE: 0.25,
  SAFETY_CAR_SPEED: 0.55,
  EVENT_CHECK_INTERVAL: 5,
  RAIN_TRANSITION_TIME: 8,
  PLAYER_START_POSITION: 5,
  NUMBER_OF_OPPONENTS: 9,
  MAX_PIT_STOPS: 5
} as const;

export const CAR_COLORS = [
  '#DC2626',
  '#06B6D4',
  '#F59E0B',
  '#8B5CF6',
  '#10B981',
  '#EC4899',
  '#F97316',
  '#14B8A6',
  '#6366F1',
  '#84CC16'
];

export const DRIVER_NAMES = [
  '维斯塔潘',
  '汉密尔顿',
  '勒克莱尔',
  '佩雷兹',
  '拉塞尔',
  '塞恩斯',
  '诺里斯',
  '阿隆索',
  '奥康',
  '加斯利'
];
