import type { CarState, Difficulty, Weather } from '@/types/game';
import { GAME_CONSTANTS, DIFFICULTY_CONFIG } from '@/game/config/constants';
import { clamp } from '@/utils/helpers';

export class FuelSystem {
  static calculateConsumption(
    car: CarState,
    deltaTime: number,
    speed: number,
    difficulty: Difficulty
  ): number {
    const difficultyConfig = DIFFICULTY_CONFIG[difficulty];
    const speedFactor = (speed / 300) * 1.2;
    const baseConsumption = (GAME_CONSTANTS.FUEL_PER_LAP / 60) * deltaTime;
    const totalConsumption = baseConsumption * speedFactor * difficultyConfig.fuelConsumptionMultiplier;
    
    return clamp(car.fuel - totalConsumption, 0, car.maxFuel);
  }

  static getSpeedPenalty(fuel: number, maxFuel: number): number {
    const fuelWeight = fuel / maxFuel;
    return 1 - fuelWeight * GAME_CONSTANTS.FUEL_SPEED_PENALTY;
  }

  static checkFuelLevel(car: CarState): { critical: boolean; message: string | null } {
    const fuelPercentage = car.fuel / car.maxFuel;
    
    if (car.fuel <= 0) {
      return { critical: true, message: '燃油耗尽！赛车退出比赛！' };
    }
    
    if (fuelPercentage <= 0.05) {
      return { critical: false, message: '警告：燃油即将耗尽！' };
    }
    
    if (fuelPercentage <= 0.15) {
      return { critical: false, message: '注意：燃油不足，请规划进站' };
    }
    
    return { critical: false, message: null };
  }

  static calculateFuelNeed(car: CarState, lapsRemaining: number): number {
    const estimatedConsumption = lapsRemaining * GAME_CONSTANTS.FUEL_PER_LAP * 1.1;
    return Math.max(0, estimatedConsumption - car.fuel);
  }

  static getOptimalFuelLoad(laps: number, weather: Weather): number {
    const baseFuel = laps * GAME_CONSTANTS.FUEL_PER_LAP;
    const weatherFactor = weather !== 'dry' ? 1.15 : 1.0;
    const safetyMargin = 1.1;
    return Math.min(baseFuel * weatherFactor * safetyMargin, GAME_CONSTANTS.MAX_FUEL_LOAD);
  }
}
