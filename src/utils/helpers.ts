import type {
  CarState,
  RaceConfig,
  TireUsageRecord,
  EventTimelineItem,
  StrategySuggestion,
  RaceSummary,
  LearningFeedback,
  PitStopResult,
  Weather,
  LearningFeedbackItem
} from '@/types/game';
import { TIRE_COMPOUNDS, GAME_CONSTANTS } from '@/game/config/constants';

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function formatLapTime(seconds: number): string {
  if (seconds === Infinity || seconds === 0) return '--:--.---';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function calculateScore(
  position: number,
  totalTime: number,
  bestLap: number,
  pitStops: number,
  difficulty: string
): number {
  const positionScore = Math.max(0, (10 - position + 1) * 100);
  const timeScore = Math.max(0, 5000 - totalTime * 10);
  const lapScore = Math.max(0, 2000 - bestLap * 50);
  const pitStopPenalty = pitStops * 50;
  const difficultyMultiplier = difficulty === 'hard' ? 1.5 : difficulty === 'normal' ? 1.2 : 1.0;
  
  return Math.floor((positionScore + timeScore + lapScore - pitStopPenalty) * difficultyMultiplier);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function generateStrategySuggestions(
  playerCar: CarState,
  config: RaceConfig,
  tireUsage: TireUsageRecord[],
  eventTimeline: EventTimelineItem[],
  weatherChanges: Array<{ lap: number; from: Weather; to: Weather }>,
  safetyCarPeriods: Array<{ startLap: number; endLap: number }>
): StrategySuggestion[] {
  const suggestions: StrategySuggestion[] = [];
  const totalLaps = config.totalLaps;
  const lapsCompleted = playerCar.lap;

  const rainEvents = eventTimeline.filter(e => e.type === 'rain');
  const rainWithPit = rainEvents.filter(re => {
    const pitAfterRain = tireUsage.find(t => t.startLap >= re.lap && t.startLap <= re.lap + 3);
    return pitAfterRain;
  });

  if (rainEvents.length > 0 && rainWithPit.length < rainEvents.length) {
    const missedRain = rainEvents.find(re => 
      !tireUsage.find(t => t.startLap >= re.lap && t.startLap <= re.lap + 3)
    );
    if (missedRain) {
      const intensity = missedRain.data?.intensity as Weather;
      if (intensity && intensity !== 'dry') {
        suggestions.push({
          id: generateId(),
          category: 'weather',
          priority: 'high',
          title: '降雨响应不及时',
          description: `第${missedRain.lap}圈降雨后未及时更换雨胎，建议在降雨后3圈内完成进站换胎`,
          referenceLap: missedRain.lap,
          outcome: 'worse'
        });
      }
    }
  }

  const avgStintLength = tireUsage.length > 0 
    ? tireUsage.reduce((sum, t) => sum + t.stintLaps, 0) / tireUsage.length 
    : 0;
  
  if (avgStintLength < 10 && tireUsage.length > 2) {
    suggestions.push({
      id: generateId(),
      category: 'tire',
      priority: 'medium',
      title: '进站过于频繁',
      description: `平均每段轮胎仅使用${avgStintLength.toFixed(1)}圈，建议延长轮胎使用周期以减少进站损失`,
      referenceLap: Math.floor(lapsCompleted / 2),
      outcome: 'worse'
    });
  }

  tireUsage.forEach((stint, index) => {
    if (stint.avgWearRate > 0.04 && stint.compound !== 'wet') {
      suggestions.push({
        id: generateId(),
        category: 'tire',
        priority: 'low',
        title: `${TIRE_COMPOUNDS[stint.compound].name}磨损过快`,
        description: `第${index + 1}段轮胎平均磨损率${(stint.avgWearRate * 100).toFixed(1)}%/圈，考虑使用更耐用的轮胎配方`,
        referenceLap: stint.startLap,
        outcome: 'neutral'
      });
    }
  });

  const fuelPerLap = playerCar.distanceTravelled > 0 
    ? (config.startingFuel - playerCar.fuel + tireUsage.filter(t => t.startLap > 0).reduce((sum, t, i) => {
        const pit = playerCar.pitStops > i ? 50 : 0;
        return sum + pit;
      }, 0)) / Math.max(1, lapsCompleted)
    : GAME_CONSTANTS.FUEL_PER_LAP;

  if (fuelPerLap > GAME_CONSTANTS.FUEL_PER_LAP * 1.1) {
    suggestions.push({
      id: generateId(),
      category: 'fuel',
      priority: 'medium',
      title: '燃油负载优化',
      description: `实际油耗${fuelPerLap.toFixed(2)}kg/圈高于预期，建议减少初始载油量或增加进站加油量`,
      referenceLap: 1,
      outcome: 'neutral'
    });
  }

  safetyCarPeriods.forEach(period => {
    const pitDuringSC = tireUsage.find(t => 
      t.startLap >= period.startLap && t.startLap <= period.endLap
    );
    if (!pitDuringSC && lapsCompleted > period.endLap) {
      suggestions.push({
        id: generateId(),
        category: 'safety',
        priority: 'high',
        title: '错过安全车窗口',
        description: `第${period.startLap}-${period.endLap}圈安全车期间未进站，安全车期间进站损失时间更少`,
        referenceLap: period.startLap,
        outcome: 'worse'
      });
    }
  });

  const undercutEvents = eventTimeline.filter(e => e.type === 'undercut');
  undercutEvents.forEach(event => {
    const playerPitAfter = tireUsage.find(t => 
      t.startLap >= event.lap && t.startLap <= event.lap + 2
    );
    if (!playerPitAfter) {
      suggestions.push({
        id: generateId(),
        category: 'pit',
        priority: 'medium',
        title: 'Undercut防守不足',
        description: `第${event.lap}圈对手执行Undercut时未及时跟进，考虑在对手进站后1-2圈内回应`,
        referenceLap: event.lap,
        outcome: 'worse'
      });
    }
  });

  if (playerCar.position <= 3 && tireUsage.length <= 2) {
    suggestions.push({
      id: generateId(),
      category: 'pit',
      priority: 'low',
      title: '策略执行优秀',
      description: `进站策略高效，仅${tireUsage.length}次进站就取得第${playerCar.position}名的好成绩`,
      referenceLap: lapsCompleted,
      outcome: 'better'
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

export function generateRaceSummary(
  playerCar: CarState,
  config: RaceConfig,
  eventTimeline: EventTimelineItem[],
  pitStops: PitStopResult[],
  score: number
): RaceSummary {
  const keyMoments: string[] = [];
  
  if (playerCar.position === 1) {
    keyMoments.push('获得冠军，策略执行完美');
  } else if (playerCar.position <= 3) {
    keyMoments.push(`登上领奖台，获得第${playerCar.position}名`);
  } else {
    keyMoments.push(`以第${playerCar.position}名完赛`);
  }

  if (playerCar.retired) {
    keyMoments.push(`因${playerCar.retirementReason}退赛`);
  }

  const bestLapEvent = eventTimeline.find(e => e.type === 'rain');
  if (bestLapEvent) {
    keyMoments.push(`比赛中经历天气变化`);
  }

  if (pitStops.length > 0) {
    keyMoments.push(`完成${pitStops.length}次进站策略`);
  }

  const safetyCarEvents = eventTimeline.filter(e => e.type === 'safety_car');
  if (safetyCarEvents.length > 0) {
    keyMoments.push(`遭遇${safetyCarEvents.length}次安全车出动`);
  }

  let strategyEffectiveness = 50;
  if (playerCar.position <= 3) strategyEffectiveness += 30;
  else if (playerCar.position <= 6) strategyEffectiveness += 15;
  
  if (pitStops.length <= 2 && config.totalLaps >= 30) strategyEffectiveness += 10;
  if (pitStops.length >= 4) strategyEffectiveness -= 10;
  
  if (playerCar.bestLapTime < 70) strategyEffectiveness += 10;
  
  strategyEffectiveness = Math.min(100, Math.max(0, strategyEffectiveness));

  let bestDecision = '稳定发挥';
  let worstDecision = '无明显失误';

  const rainEvents = eventTimeline.filter(e => e.type === 'rain');
  const goodPitAfterRain = rainEvents.some(re => 
    pitStops.some(p => p.lap >= re.lap && p.lap <= re.lap + 2 && p.tireCompound === 'wet')
  );
  
  if (goodPitAfterRain) {
    bestDecision = '降雨时及时更换雨胎';
  }

  if (pitStops.length > 3) {
    worstDecision = '进站次数过多';
  }

  const missedSafetyCar = eventTimeline
    .filter(e => e.type === 'safety_car')
    .some(sc => !pitStops.some(p => p.lap >= sc.lap && p.lap <= sc.lap + sc.duration));
  
  if (missedSafetyCar) {
    worstDecision = '错过安全车进站窗口';
  }

  return {
    keyMoments,
    strategyEffectiveness,
    bestDecision,
    worstDecision,
    totalScore: score
  };
}

export function generateLearningFeedback(
  playerCar: CarState,
  eventTimeline: EventTimelineItem[],
  tireUsage: TireUsageRecord[],
  weatherHistory: Array<{ lap: number; from: Weather; to: Weather; raceTime: number }>,
  safetyCarPeriods: Array<{ startLap: number; endLap: number; startTime: number }>,
  pitStops: PitStopResult[]
): LearningFeedback {
  const items: LearningFeedbackItem[] = [];
  let totalScore = 0;

  weatherHistory.forEach(weather => {
    if (weather.to === 'dry') return;
    
    const pitAfterRain = pitStops.find(p => 
      p.lap >= weather.lap && p.lap <= weather.lap + 3
    );
    
    let timing: 'excellent' | 'good' | 'average' | 'poor';
    let description: string;
    let suggestion: string;
    let score = 0;

    if (pitAfterRain && pitAfterRain.lap === weather.lap) {
      timing = 'excellent';
      description = `第${weather.lap}圈降雨时立即进站换胎，响应迅速`;
      suggestion = '继续保持对天气变化的敏感度';
      score = 25;
    } else if (pitAfterRain && pitAfterRain.lap <= weather.lap + 1) {
      timing = 'good';
      description = `第${weather.lap}圈降雨后${pitAfterRain.lap - weather.lap}圈进站，响应及时`;
      suggestion = '尝试在降雨警报时提前做好进站准备';
      score = 20;
    } else if (pitAfterRain && pitAfterRain.lap <= weather.lap + 3) {
      timing = 'average';
      description = `第${weather.lap}圈降雨后${pitAfterRain.lap - weather.lap}圈才进站，损失了时间`;
      suggestion = '降雨后应在3圈内完成换胎，避免干胎在湿地行驶';
      score = 10;
    } else {
      timing = 'poor';
      description = `第${weather.lap}圈降雨后未及时更换雨胎，严重影响圈速`;
      suggestion = '收到降雨警报后立即规划进站，3圈内必须完成换胎';
      score = 0;
    }

    items.push({
      category: 'rain',
      timing,
      description,
      suggestion,
      reactionTime: pitAfterRain ? (pitAfterRain.lap - weather.lap) : undefined
    });
    totalScore += score;
  });

  let tireScore = 0;
  if (tireUsage.length <= 2) {
    tireScore = 25;
    items.push({
      category: 'tire',
      timing: 'excellent',
      description: `轮胎管理优秀，仅用${tireUsage.length}套轮胎完成比赛`,
      suggestion: '继续保持高效的轮胎策略',
      reactionTime: undefined
    });
  } else if (tireUsage.length <= 3) {
    tireScore = 20;
    items.push({
      category: 'tire',
      timing: 'good',
      description: `轮胎管理良好，使用${tireUsage.length}套轮胎`,
      suggestion: '尝试优化进站窗口，进一步减少进站次数',
      reactionTime: undefined
    });
  } else if (tireUsage.length <= 4) {
    tireScore = 10;
    items.push({
      category: 'tire',
      timing: 'average',
      description: `进站${tireUsage.length}次，略微频繁`,
      suggestion: '延长每套轮胎的使用圈数，平衡速度和耐用性',
      reactionTime: undefined
    });
  } else {
    tireScore = 0;
    items.push({
      category: 'tire',
      timing: 'poor',
      description: `进站${tireUsage.length}次，策略过于保守`,
      suggestion: '减少不必要的进站，每站损失约3.2秒',
      reactionTime: undefined
    });
  }
  totalScore += tireScore;

  let fuelScore = 0;
  const totalFuelAdded = pitStops.reduce((sum, p) => sum + p.fuelAdded, 0);
  const totalFuelUsed = playerCar.maxFuel - playerCar.fuel + totalFuelAdded;
  const expectedFuel = playerCar.lap * GAME_CONSTANTS.FUEL_PER_LAP;
  
  if (Math.abs(totalFuelUsed - expectedFuel) < expectedFuel * 0.1) {
    fuelScore = 25;
    items.push({
      category: 'fuel',
      timing: 'excellent',
      description: '燃油计算精准，完赛时剩余燃油量合理',
      suggestion: '继续保持精确的燃油计算能力',
      reactionTime: undefined
    });
  } else if (Math.abs(totalFuelUsed - expectedFuel) < expectedFuel * 0.2) {
    fuelScore = 18;
    items.push({
      category: 'fuel',
      timing: 'good',
      description: '燃油管理良好，剩余量在合理范围内',
      suggestion: '可以进一步优化加油量，减少不必要的负重',
      reactionTime: undefined
    });
  } else if (totalFuelUsed > expectedFuel * 1.2) {
    fuelScore = 10;
    items.push({
      category: 'fuel',
      timing: 'average',
      description: '燃油负载偏高，增加了车身重量',
      suggestion: '减少初始载油量，利用进站补充燃油',
      reactionTime: undefined
    });
  } else {
    fuelScore = 0;
    items.push({
      category: 'fuel',
      timing: 'poor',
      description: '燃油计算偏差较大，存在燃油耗尽风险',
      suggestion: '每圈消耗约2.2kg燃油，根据剩余圈数精确计算加油量',
      reactionTime: undefined
    });
  }
  totalScore += fuelScore;

  safetyCarPeriods.forEach(period => {
    const pitDuringSC = pitStops.find(p => 
      p.lap >= period.startLap && p.lap <= period.endLap
    );
    
    let timing: 'excellent' | 'good' | 'average' | 'poor';
    let description: string;
    let suggestion: string;
    let score = 0;

    if (pitDuringSC) {
      timing = 'excellent';
      description = `第${period.startLap}圈安全车期间成功进站，大幅减少时间损失`;
      suggestion = '安全车是免费进站的绝佳机会，继续保持';
      score = 25;
    } else {
      timing = 'poor';
      description = `第${period.startLap}-${period.endLap}圈安全车期间未进站，错失免费进站窗口`;
      suggestion = '安全车出动时应立即评估进站策略，通常进站收益远大于损失';
      score = 5;
    }

    items.push({
      category: 'safety_car',
      timing,
      description,
      suggestion,
      reactionTime: undefined
    });
    totalScore += score;
  });

  if (weatherHistory.length === 0) {
    totalScore += 25;
  }
  if (safetyCarPeriods.length === 0) {
    totalScore += 25;
  }

  const maxPossibleScore = 100;
  let overall: 'excellent' | 'good' | 'average' | 'poor';
  if (totalScore >= 85) overall = 'excellent';
  else if (totalScore >= 65) overall = 'good';
  else if (totalScore >= 40) overall = 'average';
  else overall = 'poor';

  const summaries: Record<string, string> = {
    excellent: '策略大师！你对各种突发情况的应对堪称完美，继续保持！',
    good: '表现优秀！你已经掌握了基本的策略应对，继续精进细节。',
    average: '还需努力！你对策略的理解还有提升空间，多加练习。',
    poor: '需要加强！建议仔细学习教程，了解各种情况的应对方法。'
  };

  return {
    overall,
    score: Math.min(maxPossibleScore, totalScore),
    items,
    summary: summaries[overall]
  };
}
