import type { CarState, RaceEvent, RaceConfig, Weather } from '@/types/game';
import { GAME_CONSTANTS, DIFFICULTY_CONFIG } from '@/game/config/constants';
import { WeatherSystem } from './WeatherSystem';

export class EventSystem {
  private lastEventCheck: number = 0;

  shouldCheckEvents(currentTime: number): boolean {
    if (currentTime - this.lastEventCheck >= GAME_CONSTANTS.EVENT_CHECK_INTERVAL) {
      this.lastEventCheck = currentTime;
      return true;
    }
    return false;
  }

  generateRandomEvent(
    currentLap: number,
    totalLaps: number,
    currentWeather: Weather,
    cars: CarState[],
    config: RaceConfig
  ): Omit<RaceEvent, 'id' | 'active' | 'notified'> | null {
    const difficultyConfig = DIFFICULTY_CONFIG[config.difficulty];
    const baseChance = 0.15 * difficultyConfig.eventFrequency;
    
    if (Math.random() > baseChance) return null;
    
    const eventTypes: Array<{ type: RaceEvent['type']; weight: number }> = [
      { type: 'rain', weight: currentWeather === 'dry' ? 3 : 1 },
      { type: 'safety_car', weight: 2 },
      { type: 'crash', weight: 1.5 },
      { type: 'undercut', weight: 2.5 }
    ];
    
    const totalWeight = eventTypes.reduce((sum, e) => sum + e.weight, 0);
    let random = Math.random() * totalWeight;
    
    let selectedType: RaceEvent['type'] = 'rain';
    for (const event of eventTypes) {
      random -= event.weight;
      if (random <= 0) {
        selectedType = event.type;
        break;
      }
    }
    
    if (selectedType === 'rain' && currentWeather !== 'dry') {
      if (Math.random() > 0.5) {
        return {
          type: 'rain',
          lap: currentLap,
          startTime: currentLap,
          duration: WeatherSystem.estimateWeatherDuration('dry'),
          data: { intensity: 'dry' as Weather }
        };
      }
      return null;
    }
    
    if (selectedType === 'undercut') {
      const aiCars = cars.filter(c => !c.isPlayer && !c.inPit && !c.retired && c.lap > 0);
      if (aiCars.length === 0) return null;
      
      const undercutCar = aiCars[Math.floor(Math.random() * aiCars.length)];
      return {
        type: 'undercut',
        lap: currentLap,
        startTime: currentLap,
        duration: 2,
        data: { opponentId: undercutCar.id }
      };
    }
    
    if (selectedType === 'crash') {
      const aiCars = cars.filter(c => !c.isPlayer && !c.retired && c.lap > 0);
      if (aiCars.length === 0) return null;
      
      const crashedCar = aiCars[Math.floor(Math.random() * aiCars.length)];
      return {
        type: 'crash',
        lap: currentLap,
        startTime: currentLap,
        duration: 3,
        data: { crashedCarId: crashedCar.id }
      };
    }
    
    if (selectedType === 'safety_car') {
      const duration = 2 + Math.floor(Math.random() * 3);
      return {
        type: 'safety_car',
        lap: currentLap,
        startTime: currentLap,
        duration
      };
    }
    
    if (selectedType === 'rain') {
      const intensity: Weather = Math.random() > 0.5 ? 'heavy_rain' : 'light_rain';
      return {
        type: 'rain',
        lap: currentLap,
        startTime: currentLap,
        duration: WeatherSystem.estimateWeatherDuration(intensity),
        data: { intensity }
      };
    }
    
    return null;
  }

  updateEvents(
    events: RaceEvent[],
    currentLap: number,
    deltaTime: number
  ): { updated: RaceEvent[]; expired: RaceEvent[] } {
    const updated: RaceEvent[] = [];
    const expired: RaceEvent[] = [];
    
    for (const event of events) {
      if (!event.active) {
        updated.push(event);
        continue;
      }
      
      const elapsed = currentLap - event.startTime;
      if (elapsed >= event.duration) {
        expired.push({ ...event, active: false });
        updated.push({ ...event, active: false });
      } else {
        updated.push(event);
      }
    }
    
    return { updated, expired };
  }

  getEventMessage(event: RaceEvent): string {
    switch (event.type) {
      case 'safety_car':
        return `🚨 安全车出动！将持续${event.duration}圈`;
      case 'rain':
        const intensity = event.data?.intensity as string;
        return intensity === 'dry' 
          ? '☀️ 天气转晴，赛道逐渐变干' 
          : `🌧️ ${intensity === 'heavy_rain' ? '大' : '小'}雨来袭！请考虑更换雨胎`;
      case 'crash':
        return '💥 赛道上发生事故，请小心驾驶';
      case 'undercut':
        return '📊 对手执行Undercut策略，注意防守';
      default:
        return '';
    }
  }

  getEventTypeColor(type: RaceEvent['type']): string {
    switch (type) {
      case 'safety_car': return 'bg-yellow-500';
      case 'rain': return 'bg-blue-500';
      case 'crash': return 'bg-red-500';
      case 'undercut': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  }
}
