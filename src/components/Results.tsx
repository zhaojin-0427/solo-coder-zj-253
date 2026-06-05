import { Trophy, Clock, Flag, Gauge, Home, RotateCcw, Award } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { useUISTore } from '@/store/useUISTore';
import { TIRE_COMPOUNDS } from '@/game/config/constants';
import { PitStopSystem } from '@/game/systems/PitStopSystem';
import { formatTime, formatLapTime, getOrdinalSuffix, calculateScore } from '@/utils/helpers';

export function Results() {
  const { cars, playerCarId, raceTime, config, pitStopResults } = useGameStore();
  const { setView, setShowPauseMenu } = useUISTore();

  const playerCar = cars.find(c => c.id === playerCarId);
  const sortedCars = [...cars].sort((a, b) => a.position - b.position);

  if (!playerCar || !config) return null;

  const score = calculateScore(
    playerCar.position,
    playerCar.totalTime,
    playerCar.bestLapTime,
    playerCar.pitStops,
    config.difficulty
  );

  const playerPitStops = pitStopResults.filter(p => p.carId === playerCarId);
  const weatherChanges = 0;

  const strategyEvaluation = PitStopSystem.evaluateStrategy(
    playerCar.pitStops,
    playerPitStops.map(p => p.tireCompound),
    playerCar.totalTime,
    playerCar.position,
    weatherChanges
  );

  const getQualityColor = () => {
    switch (strategyEvaluation.quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-cyan-400';
      case 'average': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
    }
  };

  const getQualityText = () => {
    switch (strategyEvaluation.quality) {
      case 'excellent': return '完美策略！';
      case 'good': return '良好表现';
      case 'average': return '还有提升空间';
      case 'poor': return '需要改进';
    }
  };

  const getPositionEmoji = () => {
    if (playerCar.position === 1) return '🏆';
    if (playerCar.position === 2) return '🥈';
    if (playerCar.position === 3) return '🥉';
    return '🏁';
  };

  const handleRestart = () => {
    useGameStore.getState().resetRace();
    setShowPauseMenu(false);
    setView('menu');
  };

  const handleRetry = () => {
    useGameStore.getState().resetRace();
    useGameStore.getState().initRace(config);
    setShowPauseMenu(false);
    setView('race');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-racing-dark via-racing-dark-light to-racing-dark flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">{getPositionEmoji()}</div>
          <h1 className="text-5xl font-display font-black text-white mb-2">
            {playerCar.position === 1 ? '冠军！' : `第 ${getOrdinalSuffix(playerCar.position)} 名`}
          </h1>
          <p className="text-xl text-racing-silver font-body">
            {config.trackName} · {config.difficulty === 'easy' ? '简单' : config.difficulty === 'normal' ? '一般' : '困难'}模式
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-6 border border-racing-dark-light">
            <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-racing-gold" />
              比赛成绩
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-racing-silver">最终排名</span>
                <span className="text-3xl font-display font-black text-racing-gold">
                  {getOrdinalSuffix(playerCar.position)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-racing-silver">总用时</span>
                <span className="text-2xl font-display font-bold text-white font-mono">
                  {formatTime(playerCar.totalTime)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-racing-silver">最佳圈速</span>
                <span className="text-2xl font-display font-bold text-purple-400 font-mono">
                  {formatLapTime(playerCar.bestLapTime)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-racing-silver">完成圈数</span>
                <span className="text-2xl font-display font-bold text-white">
                  {playerCar.lap} / {config.totalLaps}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-racing-silver">进站次数</span>
                <span className="text-2xl font-display font-bold text-cyan-400">
                  {playerCar.pitStops}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-racing-silver">得分</span>
                <span className="text-3xl font-display font-black text-racing-red">
                  {score.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-6 border border-racing-dark-light">
            <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
              <Gauge className="w-5 h-5 text-cyan-400" />
              策略评价
            </h3>
            <div className="text-center mb-6">
              <div className={`text-4xl font-display font-black ${getQualityColor()} mb-2`}>
                {getQualityText()}
              </div>
              <div className="text-racing-silver">
                策略得分: {strategyEvaluation.score} 分
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-display font-bold text-white mb-2">进站记录</h4>
              {playerPitStops.length === 0 ? (
                <div className="text-racing-silver text-sm">无进站</div>
              ) : (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {playerPitStops.map((pit, index) => (
                    <div key={index} className="flex justify-between items-center text-sm bg-racing-dark/50 p-2 rounded-lg">
                      <span className="text-racing-silver">第 {pit.lap} 圈</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: TIRE_COMPOUNDS[pit.tireCompound].color }}
                        />
                        <span className="text-white">{TIRE_COMPOUNDS[pit.tireCompound].name}</span>
                        <span className="text-racing-silver">+{pit.fuelAdded.toFixed(0)}kg</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {playerCar.retired && playerCar.retirementReason && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <div className="text-red-400 text-sm">
                  退赛原因: {playerCar.retirementReason}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-6 border border-racing-dark-light mb-8">
          <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <Flag className="w-5 h-5 text-racing-red" />
            最终排名
          </h3>
          <div className="space-y-2">
            {sortedCars.map((car, index) => (
              <div
                key={car.id}
                className={`flex items-center gap-4 p-3 rounded-xl ${
                  car.isPlayer ? 'bg-racing-red/20 border border-racing-red/50' : 'bg-racing-dark/30'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg ${
                  index === 0 ? 'bg-yellow-500 text-racing-dark' :
                  index === 1 ? 'bg-gray-400 text-racing-dark' :
                  index === 2 ? 'bg-amber-700 text-white' :
                  'bg-racing-dark-light text-white'
                }`}>
                  {car.position}
                </div>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: car.color }}
                />
                <div className="flex-1">
                  <div className="font-display font-bold text-white">
                    {car.name}
                    {car.isPlayer && <span className="text-racing-red ml-2">(你)</span>}
                  </div>
                </div>
                <div className="text-racing-silver font-mono text-sm">
                  {formatTime(car.totalTime)}
                </div>
                {car.retired && (
                  <span className="text-red-400 text-sm">DNF</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleRestart}
            className="flex-1 py-4 px-8 bg-racing-dark-light text-white rounded-2xl font-display font-bold hover:bg-racing-dark-light/80 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            返回主菜单
          </button>
          <button
            onClick={handleRetry}
            className="flex-1 py-4 px-8 bg-gradient-to-r from-racing-red to-racing-red-light text-white rounded-2xl font-display font-bold hover:from-racing-red-light hover:to-racing-red transition-all flex items-center justify-center gap-2 animate-glow"
          >
            <RotateCcw className="w-5 h-5" />
            再来一局
          </button>
        </div>

        <div className="text-center mt-6 text-racing-silver/60 text-sm">
          成绩已保存到本地记录
        </div>
      </div>
    </div>
  );
}
