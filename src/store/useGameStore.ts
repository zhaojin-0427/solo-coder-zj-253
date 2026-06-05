import { create } from 'zustand';
import type {
  CarState,
  RaceConfig,
  RaceState,
  RaceEvent,
  Weather,
  TireCompound,
  PitStopResult,
  StrategyFeedback
} from '@/types/game';
import {
  GAME_CONSTANTS,
  TIRE_COMPOUNDS,
  DIFFICULTY_CONFIG,
  CAR_COLORS,
  DRIVER_NAMES
} from '@/game/config/constants';
import { generateId, calculateScore } from '@/utils/helpers';
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

  initRace: (config: RaceConfig) => {
    const cars: CarState[] = [];
    const totalCars = config.aiOpponents + 1;
    
    const playerCar = createInitialCarState(0, true, config);
    cars.push(playerCar);
    
    for (let i = 0; i < config.aiOpponents; i++) {
      cars.push(createInitialCarState(i, false, config));
    }
    
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
      strategyFeedback: null
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

    if (event.type === 'rain') {
      set({ targetWeather: event.data?.intensity || 'light_rain' });
      get().setNotification('⚠️ 注意！天气变化，即将降雨！', 'warning');
    } else if (event.type === 'safety_car') {
      get().activateSafetyCar(event.duration);
      get().setNotification('🚨 安全车出动！所有车辆必须减速！', 'danger');
    } else if (event.type === 'crash') {
      get().setNotification('💥 事故发生！注意避让！', 'danger');
    } else if (event.type === 'undercut' && event.data?.opponentId) {
      const opponent = get().cars.find(c => c.id === event.data!.opponentId);
      if (opponent) {
        get().setNotification(`📊 ${opponent.name}执行Undercut策略，提前进站！`, 'warning');
      }
    }
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
      set({
        weather: state.targetWeather,
        weatherTransitionProgress: 0
      });
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
    const playerCar = state.cars.find(c => c.id === state.playerCarId);
    
    if (playerCar && state.config) {
      const score = calculateScore(
        playerCar.position,
        playerCar.totalTime,
        playerCar.bestLapTime,
        playerCar.pitStops,
        state.config.difficulty
      );

      saveHighScore({
        id: generateId(),
        trackId: state.config.trackId,
        trackName: state.config.trackName,
        difficulty: state.config.difficulty,
        position: playerCar.position,
        totalTime: playerCar.totalTime,
        bestLapTime: playerCar.bestLapTime,
        pitStops: playerCar.pitStops,
        score,
        tiresUsed: [],
        retired: playerCar.retired,
        date: Date.now()
      });
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
      strategyFeedback: null
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
    set({
      safetyCarActive: true,
      safetyCarLapsRemaining: laps
    });
  },

  deactivateSafetyCar: () => {
    set({
      safetyCarActive: false,
      safetyCarLapsRemaining: 0
    });
    get().setNotification('安全车已离开，比赛恢复！', 'info');
  }
}));
