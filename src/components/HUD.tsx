import { useEffect, useState } from 'react';
import { Gauge, Fuel, Timer, Flag, Thermometer, CloudRain, AlertTriangle } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { useUISTore } from '@/store/useUISTore';
import { TIRE_COMPOUNDS, GAME_CONSTANTS } from '@/game/config/constants';
import { WeatherSystem } from '@/game/systems/WeatherSystem';
import { formatTime, formatLapTime, getOrdinalSuffix } from '@/utils/helpers';
import { gameEngine } from '@/game/GameEngine';

export function HUD() {
  const { 
    raceState, currentLap, totalLaps, raceTime, cars, playerCarId, 
    weather, weatherTransitionProgress, safetyCarActive, 
    notification, showNotification, activeEvents, countdown
  } = useGameStore();
  const { showStrategyPanel, toggleStrategyPanel, selectedTire, pitStopFuelAmount,
    setSelectedTire, setPitStopFuelAmount } = useUISTore();
  const [countdownDisplay, setCountdownDisplay] = useState(5);

  const playerCar = cars.find(c => c.id === playerCarId);

  useEffect(() => {
    if (raceState === 'countdown') {
      const interval = setInterval(() => {
        const time = gameEngine.getCountdownTime();
        setCountdownDisplay(time);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [raceState]);

  if (!playerCar) return null;

  const tireCompound = TIRE_COMPOUNDS[playerCar.tireCompound];
  const tireWearPercent = playerCar.tireWear * 100;
  const fuelPercent = (playerCar.fuel / playerCar.maxFuel) * 100;
  
  const getTireWearColor = () => {
    if (tireWearPercent > 85) return 'bg-red-500';
    if (tireWearPercent > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getFuelColor = () => {
    if (fuelPercent < 15) return 'bg-red-500';
    if (fuelPercent < 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTempColor = () => {
    const [min, max] = tireCompound.optimalTemp;
    if (playerCar.tireTemperature < min) return 'text-blue-400';
    if (playerCar.tireTemperature > max) return 'text-red-400';
    return 'text-green-400';
  };

  const sortedCars = [...cars].sort((a, b) => a.position - b.position);
  const activeWeatherEvents = activeEvents.filter(e => e.active && e.type === 'rain');

  return (
    <div className="absolute inset-0 pointer-events-none font-body">
      {raceState === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="text-center">
            <div className="text-9xl font-display font-black text-white animate-pulse">
              {countdownDisplay > 0 ? countdownDisplay : 'GO!'}
            </div>
            <div className="text-2xl font-display text-racing-silver mt-4">准备出发</div>
          </div>
        </div>
      )}

      {showNotification && notification && (
        <div className={`absolute top-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl text-white font-display font-bold text-lg animate-bounce z-50 pointer-events-auto ${
          notification.type === 'danger' ? 'bg-red-600/90 border-2 border-red-400' :
          notification.type === 'warning' ? 'bg-yellow-600/90 border-2 border-yellow-400' :
          'bg-blue-600/90 border-2 border-blue-400'
        }`}>
          {notification.message}
        </div>
      )}

      {safetyCarActive && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-yellow-500/90 text-racing-dark rounded-xl font-display font-bold flex items-center gap-2 animate-pulse z-40">
          <AlertTriangle className="w-5 h-5" />
          安全车出动 | 剩余 {(() => {
            const safetyCarEvent = activeEvents.find(e => e.type === 'safety_car' && e.active);
            if (!safetyCarEvent) return 0;
            const remaining = Math.max(0, safetyCarEvent.duration - (currentLap - safetyCarEvent.startTime));
            return remaining;
          })()} 圈
        </div>
      )}

      <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
        <div className="bg-racing-dark/80 backdrop-blur-md rounded-2xl p-4 border border-racing-dark-light pointer-events-auto">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-racing-silver uppercase tracking-wider">圈数</div>
              <div className="text-3xl font-display font-bold text-white">
                {currentLap} <span className="text-lg text-racing-silver">/ {totalLaps}</span>
              </div>
            </div>
            <div className="w-px h-12 bg-racing-dark-light" />
            <div className="text-center">
              <div className="text-xs text-racing-silver uppercase tracking-wider">时间</div>
              <div className="text-2xl font-display font-bold text-white font-mono">
                {formatTime(raceTime)}
              </div>
            </div>
            <div className="w-px h-12 bg-racing-dark-light" />
            <div className="text-center">
              <div className="text-xs text-racing-silver uppercase tracking-wider">当前圈</div>
              <div className="text-2xl font-display font-bold text-cyan-400 font-mono">
                {formatLapTime(playerCar.currentLapTime)}
              </div>
            </div>
            <div className="w-px h-12 bg-racing-dark-light" />
            <div className="text-center">
              <div className="text-xs text-racing-silver uppercase tracking-wider">最佳圈</div>
              <div className="text-2xl font-display font-bold text-purple-400 font-mono">
                {formatLapTime(playerCar.bestLapTime)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-racing-dark/80 backdrop-blur-md rounded-2xl p-4 border border-racing-dark-light flex items-center gap-4 pointer-events-auto">
          <div className="text-center">
            <div className="text-xs text-racing-silver uppercase tracking-wider">排名</div>
            <div className="text-4xl font-display font-black text-racing-gold">
              {getOrdinalSuffix(playerCar.position)}
            </div>
          </div>
          <div className="w-px h-12 bg-racing-dark-light" />
          <div className="text-center">
            <div className="text-xs text-racing-silver uppercase tracking-wider">速度</div>
            <div className="text-2xl font-display font-bold text-white">
              {Math.round(playerCar.speed)} <span className="text-sm text-racing-silver">km/h</span>
            </div>
          </div>
          <div className="w-px h-12 bg-racing-dark-light" />
          <div className="flex items-center gap-2 px-3 py-1 bg-racing-dark-light rounded-xl">
            <CloudRain className={`w-5 h-5 ${weather !== 'dry' ? 'text-blue-400 animate-pulse' : 'text-yellow-400'}`} />
            <span className="font-display font-bold text-white">
              {WeatherSystem.getWeatherIcon(weather)} {WeatherSystem.getWeatherName(weather)}
            </span>
            {weatherTransitionProgress > 0 && weatherTransitionProgress < 1 && (
              <div className="w-16 h-2 bg-racing-dark rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all" 
                  style={{ width: `${weatherTransitionProgress * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 flex gap-4">
        <div className="bg-racing-dark/80 backdrop-blur-md rounded-2xl p-4 border border-racing-dark-light w-72 pointer-events-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-full border-2 border-white/30"
                style={{ backgroundColor: tireCompound.color }}
              />
              <span className="font-display font-bold text-white">{tireCompound.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Thermometer className={`w-4 h-4 ${getTempColor()}`} />
              <span className={`font-mono text-sm ${getTempColor()}`}>
                {Math.round(playerCar.tireTemperature)}°C
              </span>
            </div>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-racing-silver mb-1">
              <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> 轮胎磨损</span>
              <span className={tireWearPercent > 70 ? 'text-red-400 font-bold' : ''}>
                {tireWearPercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-racing-dark rounded-full overflow-hidden">
              <div 
                className={`h-full ${getTireWearColor()} transition-all duration-300`}
                style={{ width: `${tireWearPercent}%` }}
              />
            </div>
          </div>
          {tireWearPercent > GAME_CONSTANTS.TIRE_WEAR_CRITICAL * 100 && (
            <div className="text-xs text-red-400 animate-pulse">⚠️ 轮胎即将耗尽！</div>
          )}
        </div>

        <div className="bg-racing-dark/80 backdrop-blur-md rounded-2xl p-4 border border-racing-dark-light w-64 pointer-events-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Fuel className="w-5 h-5 text-green-400" />
              <span className="font-display font-bold text-white">燃油</span>
            </div>
            <span className="font-mono text-white">
              {playerCar.fuel.toFixed(1)} <span className="text-racing-silver text-xs">/ {playerCar.maxFuel}kg</span>
            </span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-racing-silver mb-1">
              <span>油量</span>
              <span className={fuelPercent < 20 ? 'text-red-400 font-bold' : ''}>
                {fuelPercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-racing-dark rounded-full overflow-hidden">
              <div 
                className={`h-full ${getFuelColor()} transition-all duration-300`}
                style={{ width: `${fuelPercent}%` }}
              />
            </div>
          </div>
          <div className="text-xs text-racing-silver">
            预计还可跑 {Math.floor(playerCar.fuel / GAME_CONSTANTS.FUEL_PER_LAP)} 圈
          </div>
        </div>

        <div className="bg-racing-dark/80 backdrop-blur-md rounded-2xl p-4 border border-racing-dark-light w-48 pointer-events-auto">
          <div className="flex items-center gap-2 mb-3">
            <Flag className="w-5 h-5 text-racing-red" />
            <span className="font-display font-bold text-white">进站</span>
          </div>
          <div className="text-sm mb-2">
            {playerCar.pitStopPlanned ? (
              <div className="text-yellow-400 animate-pulse">
                🟡 已计划进站 | {playerCar.nextTireCompound ? TIRE_COMPOUNDS[playerCar.nextTireCompound].name : ''}
              </div>
            ) : playerCar.inPit ? (
              <div className="text-cyan-400 animate-pulse">
                🔵 进站中 | {playerCar.pitTimer.toFixed(1)}s
              </div>
            ) : (
              <div className="text-racing-silver">未计划</div>
            )}
          </div>
          <div className="text-xs text-racing-silver">
            进站次数: {playerCar.pitStops}
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 pointer-events-auto">
        <button
          onClick={toggleStrategyPanel}
          className="bg-racing-dark/80 backdrop-blur-md rounded-2xl px-6 py-4 border border-racing-dark-light text-white font-display font-bold hover:border-racing-red transition-all"
        >
          {showStrategyPanel ? '关闭策略面板' : '打开策略面板 (SPACE)'}
        </button>
      </div>

      {showStrategyPanel && (
        <div className="absolute right-4 top-24 w-80 bg-racing-dark/95 backdrop-blur-md rounded-2xl p-6 border border-racing-dark-light pointer-events-auto">
          <h3 className="text-xl font-display font-bold text-white mb-4">策略面板</h3>
          
          <div className="mb-4">
            <div className="text-sm text-racing-silver mb-2">选择进站轮胎</div>
            <div className="flex gap-2">
              {(['soft', 'medium', 'hard', 'wet'] as const).map(tire => (
                <button
                  key={tire}
                  onClick={() => setSelectedTire(tire)}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                    selectedTire === tire
                      ? 'border-white bg-white/10'
                      : 'border-racing-dark-light bg-racing-dark/50 hover:border-white/50'
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded-full mx-auto mb-1 border-2 border-white/30"
                    style={{ backgroundColor: TIRE_COMPOUNDS[tire].color }}
                  />
                  <div className="text-xs font-display font-bold text-white">
                    {TIRE_COMPOUNDS[tire].name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm text-racing-silver mb-2">
              加油量: {pitStopFuelAmount}kg
            </div>
            {(() => {
              const maxFuelAdd = Math.max(0, GAME_CONSTANTS.MAX_FUEL_LOAD - playerCar.fuel);
              const minFuelAdd = Math.min(20, maxFuelAdd);
              const adjustedFuelAmount = Math.min(Math.max(pitStopFuelAmount, minFuelAdd), maxFuelAdd);
              
              if (maxFuelAdd <= 0) {
                return (
                  <div className="text-sm text-green-400 bg-green-400/20 rounded-lg p-3 text-center">
                    燃油已满，无需加油
                  </div>
                );
              }
              
              if (pitStopFuelAmount > maxFuelAdd) {
                setTimeout(() => setPitStopFuelAmount(adjustedFuelAmount), 0);
              }
              
              return (
                <input
                  type="range"
                  min={minFuelAdd}
                  max={maxFuelAdd}
                  value={adjustedFuelAmount}
                  onChange={(e) => setPitStopFuelAmount(Number(e.target.value))}
                  className="w-full h-2 bg-racing-dark rounded-lg appearance-none cursor-pointer accent-racing-red disabled:opacity-50"
                  disabled={maxFuelAdd < minFuelAdd}
                />
              );
            })()}
          </div>

          <button
            onClick={() => {
              if (!playerCar.pitStopPlanned && !playerCar.inPit) {
                useGameStore.getState().callPitStop(
                  playerCarId,
                  selectedTire,
                  pitStopFuelAmount
                );
              }
            }}
            disabled={playerCar.pitStopPlanned || playerCar.inPit}
            className={`w-full py-4 rounded-xl font-display font-bold transition-all ${
              playerCar.pitStopPlanned || playerCar.inPit
                ? 'bg-racing-dark-light text-racing-silver cursor-not-allowed'
                : 'bg-gradient-to-r from-racing-red to-racing-red-light text-white hover:from-racing-red-light hover:to-racing-red animate-glow'
            }`}
          >
            {playerCar.pitStopPlanned ? '已计划进站' : playerCar.inPit ? '进站中...' : '计划下一圈进站'}
          </button>
        </div>
      )}

      <div className="absolute right-4 top-4 w-64 bg-racing-dark/80 backdrop-blur-md rounded-2xl p-4 border border-racing-dark-light pointer-events-auto">
        <h3 className="text-sm font-display font-bold text-white mb-3 uppercase tracking-wider">
          <Flag className="w-4 h-4 inline mr-2 text-racing-red" />
          实时排名
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sortedCars.map((car, index) => (
            <div
              key={car.id}
              className={`flex items-center gap-3 p-2 rounded-lg ${
                car.isPlayer ? 'bg-racing-red/20 border border-racing-red/50' : ''
              } ${car.retired ? 'opacity-50' : ''}`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-display font-bold ${
                index === 0 ? 'bg-yellow-500 text-racing-dark' :
                index === 1 ? 'bg-gray-400 text-racing-dark' :
                index === 2 ? 'bg-amber-700 text-white' :
                'bg-racing-dark-light text-white'
              }`}>
                {car.position}
              </div>
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: car.color }}
              />
              <div className="flex-1">
                <div className="text-sm font-display font-bold text-white">
                  {car.name}
                  {car.isPlayer && <span className="text-racing-red ml-1">(你)</span>}
                </div>
                <div className="text-xs text-racing-silver">
                  L{car.lap} | {formatLapTime(car.currentLapTime)}
                </div>
              </div>
              {car.pitStopPlanned && (
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" title="计划进站" />
              )}
              {car.inPit && (
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" title="进站中" />
              )}
              {car.retired && (
                <div className="text-xs text-red-400">DNF</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
