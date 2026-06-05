import type { CarState, Weather, TireCompound, Difficulty } from '@/types/game';
import { TIRE_COMPOUNDS, GAME_CONSTANTS, DIFFICULTY_CONFIG } from '@/game/config/constants';
import { clamp, lerp } from '@/utils/helpers';

export class TireSystem {
  static calculateWear(
    car: CarState,
    deltaTime: number,
    speed: number,
    weather: Weather,
    difficulty: Difficulty
  ): number {
    const tireStats = TIRE_COMPOUNDS[car.tireCompound];
    const difficultyConfig = DIFFICULTY_CONFIG[difficulty];
    
    const speedFactor = speed / 300;
    const weatherFactor = weather === 'dry' ? 1 : weather === 'light_rain' ? 0.8 : 0.6;
    const tempFactor = this.getTemperatureFactor(car.tireTemperature, car.tireCompound);
    
    const baseWear = tireStats.wearRate * deltaTime / 60;
    const totalWear = baseWear * speedFactor * weatherFactor * tempFactor * difficultyConfig.tireWearMultiplier;
    
    return clamp(car.tireWear + totalWear, 0, 1);
  }

  static calculateTemperature(
    car: CarState,
    deltaTime: number,
    speed: number,
    weather: Weather
  ): number {
    const tireStats = TIRE_COMPOUNDS[car.tireCompound];
    const optimalTemp = (tireStats.optimalTemp[0] + tireStats.optimalTemp[1]) / 2;
    
    const speedHeating = (speed / 300) * 15 * deltaTime;
    const weatherCooling = weather === 'heavy_rain' ? 8 * deltaTime : weather === 'light_rain' ? 4 * deltaTime : 0;
    const wearHeating = car.tireWear > 0.7 ? 5 * deltaTime : 0;
    
    const naturalCooling = 0.5 * deltaTime;
    const targetTemp = optimalTemp + speedHeating - weatherCooling + wearHeating - naturalCooling;
    
    return lerp(car.tireTemperature, targetTemp, 0.02);
  }

  static getTemperatureFactor(temperature: number, compound: TireCompound): number {
    const stats = TIRE_COMPOUNDS[compound];
    const [minOptimal, maxOptimal] = stats.optimalTemp;
    
    if (temperature >= minOptimal && temperature <= maxOptimal) {
      return 1;
    }
    
    const deviation = temperature < minOptimal 
      ? minOptimal - temperature 
      : temperature - maxOptimal;
    
    return Math.max(0.7, 1 - (deviation / 30) * GAME_CONSTANTS.TEMP_GRIP_PENALTY);
  }

  static getGripMultiplier(
    car: CarState,
    weather: Weather
  ): number {
    const tireStats = TIRE_COMPOUNDS[car.tireCompound];
    const tempFactor = this.getTemperatureFactor(car.tireTemperature, car.tireCompound);
    
    let wearFactor = 1;
    if (car.tireWear > GAME_CONSTANTS.TIRE_WEAR_CRITICAL) {
      const excessWear = car.tireWear - GAME_CONSTANTS.TIRE_WEAR_CRITICAL;
      wearFactor = 1 - excessWear * GAME_CONSTANTS.TIRE_PERFORMANCE_FALLOFF * 2;
    } else if (car.tireWear > 0.5) {
      wearFactor = 1 - (car.tireWear - 0.5) * 0.2;
    }
    
    let weatherFactor = 1;
    const isWetTire = car.tireCompound === 'wet';
    const isWetWeather = weather !== 'dry';
    
    if (isWetWeather && !isWetTire) {
      weatherFactor = weather === 'heavy_rain' 
        ? 1 - GAME_CONSTANTS.WET_GRIP_PENALTY_DRY_TIRE 
        : 1 - GAME_CONSTANTS.WET_GRIP_PENALTY_DRY_TIRE * 0.6;
    } else if (!isWetWeather && isWetTire) {
      weatherFactor = 1 - GAME_CONSTANTS.DRY_GRIP_PENALTY_WET_TIRE;
    }
    
    return tireStats.grip * tempFactor * wearFactor * weatherFactor;
  }

  static checkBlowoutRisk(car: CarState): { risk: boolean; message: string | null } {
    if (car.tireWear >= GAME_CONSTANTS.TIRE_BLOWOUT_RISK) {
      const blowoutChance = (car.tireWear - GAME_CONSTANTS.TIRE_BLOWOUT_RISK) * 10;
      if (Math.random() < blowoutChance * 0.01) {
        return { risk: true, message: '轮胎爆胎！' };
      }
      return { risk: false, message: '警告：轮胎磨损严重，有爆胎风险！' };
    }
    
    if (car.tireWear >= GAME_CONSTANTS.TIRE_WEAR_CRITICAL) {
      return { risk: false, message: '警告：轮胎即将到达磨损极限！' };
    }
    
    return { risk: false, message: null };
  }

  static getRecommendedCompound(weather: Weather, lap: number, totalLaps: number): TireCompound {
    const lapsRemaining = totalLaps - lap;
    
    if (weather !== 'dry') {
      return 'wet';
    }
    
    if (lapsRemaining <= 10) {
      return 'soft';
    } else if (lapsRemaining <= 25) {
      return 'medium';
    }
    return Math.random() > 0.5 ? 'medium' : 'hard';
  }
}
