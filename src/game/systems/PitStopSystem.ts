import type { CarState, TireCompound, RaceConfig, Weather } from '@/types/game';
import { GAME_CONSTANTS, TIRE_COMPOUNDS } from '@/game/config/constants';
import { TireSystem } from './TireSystem';
import { FuelSystem } from './FuelSystem';

export class PitStopSystem {
  static shouldPit(
    car: CarState,
    currentLap: number,
    totalLaps: number,
    weather: Weather,
    config: RaceConfig,
    isPlayer: boolean
  ): { shouldPit: boolean; recommendedTire: TireCompound; recommendedFuel: number; reason: string } {
    if (car.inPit || car.pitStopPlanned || car.retired) {
      return { shouldPit: false, recommendedTire: car.tireCompound, recommendedFuel: 0, reason: '' };
    }

    const lapsRemaining = totalLaps - currentLap;
    const reasons: string[] = [];

    const tireWearThreshold = isPlayer ? 0.75 : 0.7;
    if (car.tireWear >= tireWearThreshold) {
      reasons.push('轮胎磨损严重');
    }

    const fuelThreshold = isPlayer ? 0.2 : 0.25;
    const fuelPercentage = car.fuel / car.maxFuel;
    const fuelLapsRemaining = car.fuel / GAME_CONSTANTS.FUEL_PER_LAP;
    if (fuelPercentage <= fuelThreshold || fuelLapsRemaining <= lapsRemaining * 0.3) {
      reasons.push('燃油不足');
    }

    const isWetWeather = weather !== 'dry';
    const hasWetTire = car.tireCompound === 'wet';
    if (isWetWeather && !hasWetTire) {
      reasons.push('需要更换雨胎');
    } else if (!isWetWeather && hasWetTire && currentLap > 1) {
      reasons.push('赛道变干，可换回干胎');
    }

    if (reasons.length === 0) {
      return { shouldPit: false, recommendedTire: car.tireCompound, recommendedFuel: 0, reason: '' };
    }

    const recommendedTire = TireSystem.getRecommendedCompound(weather, currentLap, totalLaps);
    const recommendedFuel = FuelSystem.calculateFuelNeed(car, lapsRemaining + 2);

    return {
      shouldPit: true,
      recommendedTire,
      recommendedFuel: Math.min(recommendedFuel, car.maxFuel - car.fuel),
      reason: reasons.join('、')
    };
  }

  static getOptimalPitWindow(
    currentLap: number,
    totalLaps: number,
    tireWear: number,
    fuel: number,
    maxFuel: number
  ): { bestLap: number; window: [number, number] } {
    const lapsUntilTireChange = Math.max(1, Math.floor((1 - tireWear) * 20));
    const lapsUntilFuelStop = Math.max(1, Math.floor(fuel / GAME_CONSTANTS.FUEL_PER_LAP));
    const optimalLap = currentLap + Math.min(lapsUntilTireChange, lapsUntilFuelStop);
    
    return {
      bestLap: optimalLap,
      window: [optimalLap - 1, optimalLap + 2]
    };
  }

  static calculatePitStopLoss(
    currentPosition: number,
    cars: CarState[],
    pitStopTime: number = GAME_CONSTANTS.PIT_STOP_DURATION
  ): { positionsLost: number; timeLost: number } {
    const carsBehind = cars.filter(c => !c.isPlayer && !c.retired && !c.inPit);
    const timePerPosition = 1.5;
    const positionsLost = Math.min(carsBehind.length, Math.floor(pitStopTime / timePerPosition));
    
    return {
      positionsLost,
      timeLost: pitStopTime
    };
  }

  static getPitStopStrategies(
    currentLap: number,
    totalLaps: number,
    weather: Weather
  ): Array<{
    name: string;
    stops: number;
    compounds: TireCompound[];
    description: string;
  }> {
    const lapsRemaining = totalLaps - currentLap;
    
    return [
      {
        name: '一停策略',
        stops: 1,
        compounds: lapsRemaining > 30 ? ['hard', 'soft'] : ['medium', 'soft'],
        description: '保守策略，进站次数少但单圈速度较慢'
      },
      {
        name: '两停策略',
        stops: 2,
        compounds: lapsRemaining > 40 ? ['medium', 'hard', 'soft'] : ['soft', 'medium', 'soft'],
        description: '平衡策略，在速度和进站次数间取得平衡'
      },
      {
        name: '三停策略',
        stops: 3,
        compounds: ['soft', 'soft', 'medium', 'soft'],
        description: '激进策略，追求最快圈速但进站次数多'
      }
    ];
  }

  static evaluateStrategy(
    pitStops: number,
    compounds: TireCompound[],
    totalTime: number,
    finalPosition: number,
    weatherChanges: number
  ): { score: number; quality: 'excellent' | 'good' | 'average' | 'poor' } {
    const positionScore = Math.max(0, (10 - finalPosition + 1) * 100);
    const timeScore = Math.max(0, 5000 - totalTime * 10);
    const strategyScore = Math.max(0, 300 - pitStops * 50 - weatherChanges * 30);
    
    const totalScore = positionScore + timeScore + strategyScore;
    
    let quality: 'excellent' | 'good' | 'average' | 'poor';
    if (totalScore >= 1500) quality = 'excellent';
    else if (totalScore >= 1000) quality = 'good';
    else if (totalScore >= 500) quality = 'average';
    else quality = 'poor';
    
    return { score: totalScore, quality };
  }
}
