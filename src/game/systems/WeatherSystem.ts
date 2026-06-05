import type { Weather } from '@/types/game';

export class WeatherSystem {
  private static readonly WEATHER_TRANSITIONS: Record<Weather, Weather[]> = {
    dry: ['dry', 'dry', 'dry', 'light_rain'],
    light_rain: ['dry', 'light_rain', 'light_rain', 'heavy_rain'],
    heavy_rain: ['light_rain', 'heavy_rain', 'heavy_rain', 'heavy_rain']
  };

  static shouldTriggerRain(currentLap: number, totalLaps: number, difficulty: string): boolean {
    const difficultyMultiplier = difficulty === 'hard' ? 1.5 : difficulty === 'normal' ? 1.0 : 0.5;
    const midRace = totalLaps * 0.3;
    const lateRace = totalLaps * 0.7;
    
    let baseChance = 0.02;
    if (currentLap > midRace && currentLap < lateRace) {
      baseChance = 0.04;
    }
    
    return Math.random() < baseChance * difficultyMultiplier;
  }

  static getNextWeather(current: Weather): Weather {
    const transitions = this.WEATHER_TRANSITIONS[current];
    return transitions[Math.floor(Math.random() * transitions.length)];
  }

  static getRainIntensity(weather: Weather): number {
    switch (weather) {
      case 'heavy_rain': return 1;
      case 'light_rain': return 0.4;
      default: return 0;
    }
  }

  static getTrackGripFactor(weather: Weather, transitionProgress: number): number {
    if (weather === 'dry' && transitionProgress === 0) return 1;
    
    const currentIntensity = this.getRainIntensity(weather);
    return 1 - currentIntensity * 0.3;
  }

  static getVisibilityFactor(weather: Weather): number {
    switch (weather) {
      case 'heavy_rain': return 0.7;
      case 'light_rain': return 0.9;
      default: return 1;
    }
  }

  static getWeatherName(weather: Weather): string {
    switch (weather) {
      case 'dry': return '干燥';
      case 'light_rain': return '小雨';
      case 'heavy_rain': return '大雨';
    }
  }

  static getWeatherIcon(weather: Weather): string {
    switch (weather) {
      case 'dry': return '☀️';
      case 'light_rain': return '🌦️';
      case 'heavy_rain': return '🌧️';
    }
  }

  static shouldRecommendWetTires(weather: Weather, transitionProgress: number): boolean {
    const intensity = this.getRainIntensity(weather);
    const effectiveIntensity = intensity * (0.5 + transitionProgress * 0.5);
    return effectiveIntensity > 0.3;
  }

  static estimateWeatherDuration(weather: Weather): number {
    const baseDuration = weather === 'heavy_rain' ? 8 : weather === 'light_rain' ? 5 : 15;
    return baseDuration + Math.floor(Math.random() * 5);
  }
}
