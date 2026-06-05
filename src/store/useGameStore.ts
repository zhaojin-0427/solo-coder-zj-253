import { create } from 'zustand';
import type {
  CarState,
  RaceConfig,
  RaceState,
  RaceEvent,
  Weather,
  TireCompound,
  PitStopResult,
  StrategyFeedback,
  TireUsageRecord,
  EventTimelineItem,
  StrategySuggestion,
  RaceResult,
  RaceSummary,
  LearningFeedback
} from '@/types/game';
import {
  GAME_CONSTANTS,
  TIRE_COMPOUNDS,
  DIFFICULTY_CONFIG,
  CAR_COLORS,
  DRIVER_NAMES
} from '@/game/config/constants';
import { generateId, calculateScore, generateStrategySuggestions, generateRaceSummary, generateLearningFeedback } from '@/utils/helpers';
import { saveHighScore } from '@/utils/storage';

interface GameStore {
  raceState: RaceState;
  currentLap: number;
  totalLaps: number;
  raceTime: number;
  countdown: number;
  cars: CarState[];
  playerCarId: string;
  weather: Weather;
  targetWeather: Weather;
  weatherTransitionProgress: number;
  safetyCarActive: boolean;
  safetyCarLapsRemaining: number;
  activeEvents: RaceEvent[];
  pitStopResults: PitStopResult[];
  strategyFeedback: StrategyFeedback | null;
  config: RaceConfig | null;
  notification: { message: string; type: 'info' | 'warning' | 'danger' } | null;
  showNotification: boolean;
  tireUsageHistory: TireUsageRecord[];
  eventTimeline: EventTimelineItem[];
  weatherHistory: Array<{ lap: number; from: Weather; to: Weather; raceTime: number }>;
  safetyCarPeriods: Array<{ startLap: number; endLap: number; startTime: number }>;
  raceResult: RaceResult | null;
  lastRaceResult: RaceResult | null;

  initRace: (config: RaceConfig) => void;
  updateCar: (carId: string, updates: Partial<CarState>) => void;
  updateAllCars: (updater: (car: CarState) => Partial<CarState> | void) => void;
  callPitStop: (carId: string, nextTire: TireCompound, fuelAmount: number) => void;
  executePitStop: (carId: string) => void;
  triggerEvent: (event: Omit<RaceEvent, 'id' | 'active' | 'notified'>) => void;
  deactivateEvent: (eventId: string) => void;
  updateRaceTime: (deltaTime: number) => void;
  updateWeather: (deltaTime: number) => void;
  startCountdown: () => void;
  startRace: () => void;
  pauseRace: () => void;
  resumeRace: () => void;
  finishRace: () => void;
  resetRace: () => void;
  calculatePositions: () => void;
  setNotification: (message: string, type: 'info' | 'warning' | 'danger') => void;
  clearNotification: () => void;
  setStrategyFeedback: (feedback: StrategyFeedback) => void;
  activateSafetyCar: (laps: number) => void;
  deactivateSafetyCar: () => void;
  recordTireChange: (carId: string, newCompound: TireCompound, lap: number) => void;
  recordEventToTimeline: (event: Omit<EventTimelineItem, 'id'>) => void;
  recordWeatherChange: (from: Weather, to: Weather, lap: number) => void;
  retirePlayer: (reason: string) => void;
  generateRaceResult: () => RaceResult | null;
  clearRaceResult: () => void;
}

function createInitialCarState(
  index: number,
  isPlayer: boolean,
  config: RaceConfig
): CarState {
  const startPosition = isPlayer ? GAME_CONSTANTS.PLAYER_START_POSITION - 1 : index;
  const baseSpeed = 220 + Math.random() * 15;
  
  return {
    id: generateId(),
    name: isPlayer ? '玩家' : DRIVER_NAMES[index % DRIVER_NAMES.length],
    color: isPlayer ? CAR_COLORS[0] : CAR_COLORS[(index + 1) % CAR_COLORS.length],
    isPlayer,
    position: startPosition + 1,
    lap: 0,
    totalTime: 0,
    bestLapTime: Infinity,
    currentLapTime: 0,
    lapStartTime: 0,
    speed: 0,
    baseSpeed,
    fuel: config.startingFuel,
    maxFuel: GAME_CONSTANTS.MAX_FUEL_LOAD,
    tireCompound: config.startingTire,
    tireWear: 0,
    tireTemperature: TIRE_COMPOUNDS[config.startingTire].optimalTemp[0],
    inPit: false,
    pitStops: 0,
    pitTimer: 0,
    pitStopPlanned: false,
    nextTireCompound: null,
    nextFuelAmount: 0,
    trackProgress: (10 - startPosition) * 0.002,
    distanceTravelled: 0,
    retired: false,
    retirementReason: null
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  raceState: 'paused',
  currentLap: 0,
  totalLaps: 0,
  raceTime: 0,
  countdown: 5,
  cars: [],
  playerCarId: '',
  weather: 'dry',
  targetWeather: 'dry',
  weatherTransitionProgress: 0,
  safetyCarActive: false,
  safetyCarLapsRemaining: 0,
  activeEvents: [],
  pitStopResults: [],
  strategyFeedback: null,
  config: null,
  notification: null,
  showNotification: false,
  tireUsageHistory: [],
  eventTimeline: [],
  weatherHistory: [],
  safetyCarPeriods: [],
  raceResult: null,
  lastRaceResult: null,

  initRace: (config: RaceConfig) => {
    const cars: CarState[] = [];
    const totalCars = config.aiOpponents + 1;
    
    const playerCar = createInitialCarState(0, true, config);
    cars.push(playerCar);
    
    for (let i = 0; i < config.aiOpponents; i++) {
      cars.push(createInitialCarState(i, false, config));
    }
    
    const initialTireRecord: TireUsageRecord = {
      compound: config.startingTire,
      startLap: 0,
      endLap: 0,
      stintLaps: 0,
      avgWearRate: 0
    };
    
    set({
      config,
      cars,
      playerCarId: playerCar.id,
      totalLaps: config.totalLaps,
      currentLap: 0,
      raceTime: 0,
      countdown: 5,
      raceState: 'countdown',
      weather: 'dry',
      targetWeather: 'dry',
      weatherTransitionProgress: 0,
      safetyCarActive: false,
      safetyCarLapsRemaining: 0,
      activeEvents: [],
      pitStopResults: [],
      strategyFeedback: null,
      tireUsageHistory: [initialTireRecord],
      eventTimeline: [],
      weatherHistory: [],
      safetyCarPeriods: [],
      raceResult: null
    });
    
    get().calculatePositions();
  },

  updateCar: (carId, updates) => {
    set(state => ({
      cars: state.cars.map(car =>
        car.id === carId ? { ...car, ...updates } : car
      )
    }));
  },

  updateAllCars: (updater) => {
    set(state => ({
      cars: state.cars.map(car => {
        const updates = updater(car);
        return updates ? { ...car, ...updates } : car;
      })
    }));
  },

  callPitStop: (carId, nextTire, fuelAmount) => {
    const car = get().cars.find(c => c.id === carId);
    if (!car || car.inPit || car.retired) return;
    
    set(state => ({
      cars: state.cars.map(c =>
        c.id === carId
          ? { ...c, pitStopPlanned: true, nextTireCompound: nextTire, nextFuelAmount: fuelAmount }
          : c
      )
    }));
    
    if (car.isPlayer) {
      get().setNotification(`进站计划已确认，下一圈将进站更换${TIRE_COMPOUNDS[nextTire].name}`, 'info');
    }
  },

  executePitStop: (carId) => {
    const state = get();
    const car = state.cars.find(c => c.id === carId);
    if (!car || car.retired) return;

    const nextTire = car.nextTireCompound || car.tireCompound;
    const fuelToAdd = Math.min(car.nextFuelAmount, car.maxFuel - car.fuel);
    const difficultyConfig = state.config ? DIFFICULTY_CONFIG[state.config.difficulty] : DIFFICULTY_CONFIG.normal;

    const pitResult: PitStopResult = {
      carId,
      lap: car.lap,
      tireCompound: nextTire,
      fuelAdded: fuelToAdd,
      timeLost: GAME_CONSTANTS.PIT_STOP_DURATION,
      positionsGained: 0,
      positionsLost: 0
    };

    if (car.isPlayer && nextTire !== car.tireCompound) {
      get().recordTireChange(carId, nextTire, car.lap);
    }

    set(state => ({
      cars: state.cars.map(c =>
        c.id === carId
          ? {
              ...c,
              tireCompound: nextTire,
              tireWear: 0,
              tireTemperature: TIRE_COMPOUNDS[nextTire].optimalTemp[0],
              fuel: Math.min(c.fuel + fuelToAdd, c.maxFuel),
              pitStops: c.pitStops + 1,
              inPit: true,
              pitTimer: GAME_CONSTANTS.PIT_STOP_DURATION,
              pitStopPlanned: false,
              nextTireCompound: null,
              nextFuelAmount: 0,
              totalTime: c.totalTime + GAME_CONSTANTS.PIT_STOP_DURATION
            }
          : c
      ),
      pitStopResults: [...state.pitStopResults, pitResult]
    }));

    if (car.isPlayer) {
      get().setNotification(`进站完成！更换${TIRE_COMPOUNDS[nextTire].name}，加油${fuelToAdd.toFixed(1)}kg`, 'info');
    }
  },

  triggerEvent: (event) => {
    const newEvent: RaceEvent = {
      ...event,
      id: generateId(),
      active: true,
      notified: false
    };
    
    set(state => ({
      activeEvents: [...state.activeEvents, newEvent]
    }));

    const state = get();
    let description = '';
    
    if (event.type === 'rain') {
      const intensity = event.data?.intensity as Weather || 'light_rain';
      set({ targetWeather: intensity });
      description = intensity === 'dry' ? '天气转晴，赛道逐渐变干' : 
        `${intensity === 'heavy_rain' ? '大' : '小'}雨来袭，请考虑更换雨胎`;
      get().setNotification('⚠️ 注意！天气变化，即将降雨！', 'warning');
    } else if (event.type === 'safety_car') {
      description = `安全车出动，将持续${event.duration}圈`;
      get().activateSafetyCar(event.duration);
      get().setNotification('🚨 安全车出动！所有车辆必须减速！', 'danger');
    } else if (event.type === 'crash') {
      description = '赛道上发生事故，请小心驾驶';
      get().setNotification('💥 事故发生！注意避让！', 'danger');
    } else if (event.type === 'undercut' && event.data?.opponentId) {
      const opponent = get().cars.find(c => c.id === event.data!.opponentId);
      description = opponent ? `${opponent.name}执行Undercut策略，提前进站` : '对手执行Undercut策略';
      if (opponent && !opponent.pitStopPlanned && !opponent.inPit && !opponent.retired) {
        const weather = state.weather;
        const currentLap = state.currentLap;
        const totalLaps = state.config?.totalLaps || 40;
        
        let nextTire: TireCompound;
        if (weather === 'dry') {
          if (opponent.tireWear > 0.6) {
            nextTire = currentLap < totalLaps * 0.7 ? 'medium' : 'hard';
          } else if (opponent.tireWear > 0.3) {
            nextTire = currentLap < totalLaps * 0.5 ? 'soft' : 'medium';
          } else {
            nextTire = opponent.tireCompound === 'soft' ? 'medium' : 'soft';
          }
        } else {
          nextTire = 'wet';
        }
        
        const fuelNeeded = (totalLaps - currentLap) * GAME_CONSTANTS.FUEL_PER_LAP;
        const fuelToAdd = Math.min(
          GAME_CONSTANTS.MAX_FUEL_LOAD - opponent.fuel,
          Math.max(20, fuelNeeded)
        );
        
        get().callPitStop(opponent.id, nextTire, fuelToAdd);
        get().setNotification(`📊 ${opponent.name}执行Undercut策略，提前进站！`, 'warning');
      }
    }

    get().recordEventToTimeline({
      type: event.type,
      lap: event.lap,
      raceTime: state.raceTime,
      description,
      data: event.data
    });
  },

  deactivateEvent: (eventId) => {
    set(state => ({
      activeEvents: state.activeEvents.map(e =>
        e.id === eventId ? { ...e, active: false } : e
      )
    }));
  },

  updateRaceTime: (deltaTime) => {
    const state = get();
    if (state.raceState !== 'running') return;
    
    set({ raceTime: state.raceTime + deltaTime });
  },

  updateWeather: (deltaTime) => {
    const state = get();
    if (state.weather === state.targetWeather) return;

    const transitionSpeed = 1 / GAME_CONSTANTS.RAIN_TRANSITION_TIME;
    const newProgress = Math.min(1, state.weatherTransitionProgress + deltaTime * transitionSpeed);

    if (newProgress >= 1) {
      const oldWeather = state.weather;
      const newWeather = state.targetWeather;
      set({
        weather: newWeather,
        weatherTransitionProgress: 0
      });
      get().recordWeatherChange(oldWeather, newWeather, state.currentLap);
    } else {
      set({ weatherTransitionProgress: newProgress });
    }
  },

  startCountdown: () => {
    set({ raceState: 'countdown', countdown: 5 });
  },

  startRace: () => {
    set(state => ({
      raceState: 'running',
      cars: state.cars.map(c => ({ ...c, lapStartTime: 0 }))
    }));
  },

  pauseRace: () => {
    const state = get();
    if (state.raceState === 'running') {
      set({ raceState: 'paused' });
    }
  },

  resumeRace: () => {
    const state = get();
    if (state.raceState === 'paused') {
      set({ raceState: 'running' });
    }
  },

  finishRace: () => {
    const state = get();
    
    if (state.raceState === 'finished') {
      return;
    }
    
    const playerCar = state.cars.find(c => c.id === state.playerCarId);
    
    if (playerCar && state.config) {
      get().recordEventToTimeline({
        type: playerCar.retired ? 'retire' : 'finish',
        lap: playerCar.lap,
        raceTime: state.raceTime,
        description: playerCar.retired 
          ? `比赛结束 - 因${playerCar.retirementReason}退赛` 
          : '比赛结束 - 顺利完赛'
      });
      
      const raceResult = get().generateRaceResult();
      
      if (raceResult) {
        const summaryText = `${raceResult.summary.keyMoments.slice(0, 2).join('；')}`;
        
        saveHighScore({
          id: generateId(),
          trackId: state.config.trackId,
          trackName: state.config.trackName,
          difficulty: state.config.difficulty,
          position: playerCar.position,
          totalTime: playerCar.totalTime,
          bestLapTime: playerCar.bestLapTime,
          pitStops: playerCar.pitStops,
          score: raceResult.score,
          tiresUsed: raceResult.tireUsage.map(t => t.compound),
          retired: playerCar.retired,
          date: Date.now(),
          raceResult,
          summary: summaryText,
          mode: state.config.mode
        });
      }
    }

    set({ raceState: 'finished' });
  },

  resetRace: () => {
    set({
      raceState: 'paused',
      currentLap: 0,
      raceTime: 0,
      cars: [],
      activeEvents: [],
      pitStopResults: [],
      strategyFeedback: null,
      tireUsageHistory: [],
      eventTimeline: [],
      weatherHistory: [],
      safetyCarPeriods: [],
      raceResult: null
    });
  },

  calculatePositions: () => {
    set(state => {
      const sortedCars = [...state.cars].sort((a, b) => {
        if (a.retired && !b.retired) return 1;
        if (!a.retired && b.retired) return -1;
        if (a.lap !== b.lap) return b.lap - a.lap;
        return b.trackProgress - a.trackProgress;
      });

      const updatedCars = state.cars.map(car => ({
        ...car,
        position: sortedCars.findIndex(c => c.id === car.id) + 1
      }));

      return { cars: updatedCars };
    });
  },

  setNotification: (message, type) => {
    set({
      notification: { message, type },
      showNotification: true
    });
  },

  clearNotification: () => {
    set({ showNotification: false });
  },

  setStrategyFeedback: (feedback) => {
    set({ strategyFeedback: feedback });
  },

  activateSafetyCar: (laps) => {
    const state = get();
    set({
      safetyCarActive: true,
      safetyCarLapsRemaining: laps,
      safetyCarPeriods: [...state.safetyCarPeriods, {
        startLap: state.currentLap,
        endLap: state.currentLap + laps,
        startTime: state.raceTime
      }]
    });
  },

  deactivateSafetyCar: () => {
    const state = get();
    const updatedPeriods = [...state.safetyCarPeriods];
    if (updatedPeriods.length > 0) {
      updatedPeriods[updatedPeriods.length - 1].endLap = state.currentLap;
    }
    set({
      safetyCarActive: false,
      safetyCarLapsRemaining: 0,
      safetyCarPeriods: updatedPeriods
    });
    get().setNotification('安全车已离开，比赛恢复！', 'info');
  },

  recordTireChange: (carId, newCompound, lap) => {
    set(state => {
      const car = state.cars.find(c => c.id === carId);
      if (!car) return state;

      const updatedHistory = [...state.tireUsageHistory];
      if (updatedHistory.length > 0) {
        const lastRecord = updatedHistory[updatedHistory.length - 1];
        lastRecord.endLap = lap;
        lastRecord.stintLaps = lap - lastRecord.startLap;
        lastRecord.avgWearRate = car.tireWear / Math.max(1, lastRecord.stintLaps);
      }

      updatedHistory.push({
        compound: newCompound,
        startLap: lap,
        endLap: lap,
        stintLaps: 0,
        avgWearRate: 0
      });

      return { tireUsageHistory: updatedHistory };
    });
  },

  recordEventToTimeline: (event) => {
    set(state => ({
      eventTimeline: [...state.eventTimeline, { ...event, id: generateId() }]
    }));
  },

  recordWeatherChange: (from, to, lap) => {
    const state = get();
    set(s => ({
      weatherHistory: [...s.weatherHistory, {
        lap,
        from,
        to,
        raceTime: state.raceTime
      }]
    }));
  },

  retirePlayer: (reason) => {
    const state = get();
    const playerCar = state.cars.find(c => c.id === state.playerCarId);
    if (!playerCar || playerCar.retired) return;

    set(s => ({
      cars: s.cars.map(c =>
        c.id === s.playerCarId
          ? { ...c, retired: true, retirementReason: reason }
          : c
      )
    }));
  },

  generateRaceResult: () => {
    const state = get();
    const playerCar = state.cars.find(c => c.id === state.playerCarId);
    if (!playerCar || !state.config) return null;

    const score = calculateScore(
      playerCar.position,
      playerCar.totalTime,
      playerCar.bestLapTime,
      playerCar.pitStops,
      state.config.difficulty
    );

    const tireUsage = [...state.tireUsageHistory];
    if (tireUsage.length > 0) {
      const lastRecord = tireUsage[tireUsage.length - 1];
      lastRecord.endLap = playerCar.lap;
      lastRecord.stintLaps = playerCar.lap - lastRecord.startLap;
      lastRecord.avgWearRate = playerCar.tireWear / Math.max(1, lastRecord.stintLaps);
    }

    const playerPitStops = state.pitStopResults.filter(p => p.carId === state.playerCarId);
    const weatherChanges = state.weatherHistory.map(w => ({
      lap: w.lap,
      from: w.from,
      to: w.to
    }));
    const safetyCarPeriods = state.safetyCarPeriods.map(p => ({
      startLap: p.startLap,
      endLap: p.endLap
    }));

    const strategySuggestions = generateStrategySuggestions(
      playerCar,
      state.config,
      tireUsage,
      state.eventTimeline,
      weatherChanges,
      safetyCarPeriods
    );

    const summary = generateRaceSummary(
      playerCar,
      state.config,
      state.eventTimeline,
      playerPitStops,
      score
    );

    const raceResult: RaceResult = {
      id: generateId(),
      finalPosition: playerCar.position,
      totalTime: playerCar.totalTime,
      bestLapTime: playerCar.bestLapTime,
      lapsCompleted: playerCar.lap,
      retired: playerCar.retired,
      retirementReason: playerCar.retirementReason,
      score,
      tireUsage,
      pitStops: playerPitStops,
      eventTimeline: state.eventTimeline,
      strategySuggestions,
      summary,
      weatherChanges,
      safetyCarPeriods
    };

    if (state.config.mode === 'learning') {
      raceResult.learningFeedback = generateLearningFeedback(
        playerCar,
        state.eventTimeline,
        tireUsage,
        state.weatherHistory,
        state.safetyCarPeriods,
        playerPitStops
      );
    }

    set({ raceResult, lastRaceResult: raceResult });
    return raceResult;
  },

  clearRaceResult: () => {
    set({ raceResult: null });
  }
}));
