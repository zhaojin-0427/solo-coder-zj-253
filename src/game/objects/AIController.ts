import type { CarState, RaceConfig, Weather, TireCompound } from '@/types/game';
import { DIFFICULTY_CONFIG, GAME_CONSTANTS, TIRE_COMPOUNDS } from '@/game/config/constants';
import { TireSystem } from '../systems/TireSystem';
import { FuelSystem } from '../systems/FuelSystem';
import { PitStopSystem } from '../systems/PitStopSystem';

export class AIController {
  private aggression: number;
  private pitStopStrategy: 'conservative' | 'normal' | 'aggressive';

  constructor(difficulty: string) {
    const difficultyConfig = DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG];
    const baseAggression = difficultyConfig.aiSpeedMultiplier - 0.8;
    this.aggression = Math.max(0.1, Math.min(0.9, baseAggression + (Math.random() - 0.5) * 0.2));
    
    const strategyRoll = Math.random();
    if (strategyRoll < 0.3) this.pitStopStrategy = 'conservative';
    else if (strategyRoll < 0.7) this.pitStopStrategy = 'normal';
    else this.pitStopStrategy = 'aggressive';
  }

  calculateSpeed(
    car: CarState,
    weather: Weather,
    safetyCarActive: boolean,
    difficulty: string
  ): number {
    if (car.retired) return 0;
    if (car.inPit) return 0;

    const difficultyConfig = DIFFICULTY_CONFIG[difficulty as keyof typeof DIFFICULTY_CONFIG];
    const gripMultiplier = TireSystem.getGripMultiplier(car, weather);
    const fuelPenalty = FuelSystem.getSpeedPenalty(car.fuel, car.maxFuel);
    
    let baseSpeed = car.baseSpeed * difficultyConfig.aiSpeedMultiplier;
    baseSpeed *= gripMultiplier * fuelPenalty;
    
    if (safetyCarActive) {
      baseSpeed *= GAME_CONSTANTS.SAFETY_CAR_SPEED;
    }
    
    const randomVariation = 0.98 + Math.random() * 0.04;
    const aggressionFactor = 1 + (this.aggression - 0.5) * 0.1;
    
    return baseSpeed * randomVariation * aggressionFactor;
  }

  decidePitStop(
    car: CarState,
    currentLap: number,
    totalLaps: number,
    weather: Weather,
    config: RaceConfig
  ): { pitNow: boolean; nextTire: TireCompound; fuelAmount: number } {
    if (car.inPit || car.pitStopPlanned || car.retired) {
      return { pitNow: false, nextTire: car.tireCompound, fuelAmount: 0 };
    }

    const pitAdvice = PitStopSystem.shouldPit(car, currentLap, totalLaps, weather, config, false);
    
    let pitNow = pitAdvice.shouldPit;
    let nextTire = pitAdvice.recommendedTire;
    let fuelAmount = pitAdvice.recommendedFuel;
    
    if (this.pitStopStrategy === 'aggressive') {
      if (car.tireWear > 0.6) pitNow = true;
      nextTire = weather !== 'dry' ? 'wet' : 'soft';
    } else if (this.pitStopStrategy === 'conservative') {
      if (car.tireWear < 0.85 && pitAdvice.reason === '轮胎磨损严重') {
        pitNow = false;
      }
      nextTire = weather !== 'dry' ? 'wet' : 'hard';
      fuelAmount = Math.min(fuelAmount * 1.2, car.maxFuel - car.fuel);
    }
    
    if (Math.random() < 0.15 && car.tireWear > 0.5 && !pitNow) {
      pitNow = true;
    }
    
    return { pitNow, nextTire, fuelAmount };
  }

  decideUndercut(
    car: CarState,
    playerCar: CarState,
    currentLap: number
  ): boolean {
    if (car.inPit || car.pitStopPlanned || car.retired) return false;
    if (car.position >= playerCar.position) return false;
    
    const positionGap = playerCar.position - car.position;
    if (positionGap > 3) return false;
    
    const tireAdvantage = playerCar.tireWear - car.tireWear;
    if (tireAdvantage > 0.1 && this.aggression > 0.5) {
      return Math.random() < 0.4;
    }
    
    return false;
  }

  getDrivingStyle(): string {
    switch (this.pitStopStrategy) {
      case 'aggressive': return '激进';
      case 'normal': return '平衡';
      case 'conservative': return '保守';
    }
  }

  updateAggression(
    car: CarState,
    currentPosition: number,
    lapsRemaining: number
  ): void {
    if (currentPosition <= 3) {
      this.aggression = Math.min(0.9, this.aggression + 0.05);
    } else if (currentPosition >= 8) {
      this.aggression = Math.min(0.9, this.aggression + 0.1);
    }
    
    if (lapsRemaining <= 5) {
      this.aggression = Math.min(0.95, this.aggression + 0.1);
    }
  }
}
