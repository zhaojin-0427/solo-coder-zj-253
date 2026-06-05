import { useState } from 'react';
import { 
  Trophy, Clock, Flag, Gauge, Home, RotateCcw, Award, 
  Droplets, Car, AlertTriangle, 
  CloudRain, AlertCircle, ChevronDown, ChevronUp, 
  Zap, Target, TrendingUp, TrendingDown
} from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { useUISTore } from '@/store/useUISTore';
import { TIRE_COMPOUNDS } from '@/game/config/constants';
import { PitStopSystem } from '@/game/systems/PitStopSystem';
import { formatTime, formatLapTime, getOrdinalSuffix, calculateScore } from '@/utils/helpers';
import type { EventTimelineItem, StrategySuggestion, LearningFeedbackItem, TireUsageRecord } from '@/types/game';

export function Results() {
  const { cars, playerCarId, raceTime, config, pitStopResults, raceResult } = useGameStore();
  const { setView, setShowPauseMenu } = useUISTore();
  const [showTimeline, setShowTimeline] = useState(false);
  const [showStrategy, setShowStrategy] = useState(false);
  const [showLearning, setShowLearning] = useState(false);

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
  const weatherChanges = raceResult?.weatherChanges || [];

  const strategyEvaluation = PitStopSystem.evaluateStrategy(
    playerCar.pitStops,
    playerPitStops.map(p => p.tireCompound),
    playerCar.totalTime,
    playerCar.position,
    weatherChanges.length
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

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'rain': return <CloudRain className="w-4 h-4" />;
      case 'safety_car': return <AlertTriangle className="w-4 h-4" />;
      case 'crash': return <AlertCircle className="w-4 h-4" />;
      case 'undercut': return <Zap className="w-4 h-4" />;
      case 'finish': return <Flag className="w-4 h-4" />;
      case 'retire': return <AlertCircle className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'rain': return 'bg-blue-500';
      case 'safety_car': return 'bg-yellow-500';
      case 'crash': return 'bg-red-500';
      case 'undercut': return 'bg-orange-500';
      case 'finish': return 'bg-green-500';
      case 'retire': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-500/10';
      case 'high': return 'border-orange-500 bg-orange-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'low': return 'border-green-500 bg-green-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'medium': return <Target className="w-4 h-4 text-yellow-400" />;
      case 'low': return <TrendingUp className="w-4 h-4 text-green-400" />;
      default: return <Target className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTimingColor = (timing: string) => {
    switch (timing) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-cyan-400';
      case 'average': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'rain': return <CloudRain className="w-4 h-4" />;
      case 'tire': return <Car className="w-4 h-4" />;
      case 'fuel': return <Droplets className="w-4 h-4" />;
      case 'safety_car': return <AlertTriangle className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
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

  const tireUsage: TireUsageRecord[] = raceResult?.tireUsage || [];
  const eventTimeline: EventTimelineItem[] = raceResult?.eventTimeline || [];
  const strategySuggestions: StrategySuggestion[] = raceResult?.strategySuggestions || [];
  const learningFeedback = raceResult?.learningFeedback;
  const isLearningMode = config?.mode === 'learning';

  return (
    <div className="min-h-screen bg-gradient-to-br from-racing-dark via-racing-dark-light to-racing-dark flex items-center justify-center p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-5xl py-8">
        <div className="text-center mb-8">
          <div className="text-8xl mb-4">{getPositionEmoji()}</div>
          <h1 className="text-4xl md:text-5xl font-display font-black text-white mb-2">
            {playerCar.retired ? '未完赛' : playerCar.position === 1 ? '冠军！' : '第 ' + getOrdinalSuffix(playerCar.position) + ' 名'}
          </h1>
          <p className="text-xl text-racing-silver font-body">
            {config.trackName} · {config.difficulty === 'easy' ? '简单' : config.difficulty === 'normal' ? '一般' : '困难'}模式
            {isLearningMode && <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-sm">策略学习</span>}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-4 border border-racing-dark-light text-center">
            <div className="text-3xl md:text-4xl font-display font-black text-racing-gold">
              {getOrdinalSuffix(playerCar.position)}
            </div>
            <div className="text-sm text-racing-silver">最终排名</div>
          </div>
          <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-4 border border-racing-dark-light text-center">
            <div className="text-2xl md:text-3xl font-display font-bold text-white font-mono">
              {formatTime(playerCar.totalTime)}
            </div>
            <div className="text-sm text-racing-silver">总用时</div>
          </div>
          <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-4 border border-racing-dark-light text-center">
            <div className="text-2xl md:text-3xl font-display font-bold text-purple-400 font-mono">
              {formatLapTime(playerCar.bestLapTime)}
            </div>
            <div className="text-sm text-racing-silver">最佳圈速</div>
          </div>
          <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-4 border border-racing-dark-light text-center">
            <div className="text-2xl md:text-3xl font-display font-bold text-cyan-400">
              {playerCar.lap} / {config.totalLaps}
            </div>
            <div className="text-sm text-racing-silver">完成圈数</div>
          </div>
        </div>

        {playerCar.retired && playerCar.retirementReason && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-center">
            <div className="flex items-center justify-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span className="font-display font-bold">退赛原因: {playerCar.retirementReason}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-6 border border-racing-dark-light">
            <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-racing-gold" />
              比赛成绩
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-racing-silver">最终排名</span>
                <span className="text-2xl font-display font-black text-racing-gold">
                  {getOrdinalSuffix(playerCar.position)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-racing-silver">总用时</span>
                <span className="text-xl font-display font-bold text-white font-mono">
                  {formatTime(playerCar.totalTime)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-racing-silver">最佳圈速</span>
                <span className="text-xl font-display font-bold text-purple-400 font-mono">
                  {formatLapTime(playerCar.bestLapTime)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-racing-silver">完成圈数</span>
                <span className="text-xl font-display font-bold text-white">
                  {playerCar.lap} / {config.totalLaps}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-racing-silver">进站次数</span>
                <span className="text-xl font-display font-bold text-cyan-400">
                  {playerCar.pitStops}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-racing-silver">得分</span>
                <span className="text-2xl font-display font-black text-racing-red">
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
              <div className={"text-3xl md:text-4xl font-display font-black " + getQualityColor() + " mb-2"}>
                {getQualityText()}
              </div>
              <div className="text-racing-silver">
                策略得分: {strategyEvaluation.score} 分
              </div>
            </div>

            {raceResult?.summary && (
              <div className="mb-4 p-3 bg-racing-dark/50 rounded-xl">
                <div className="text-sm text-racing-silver mb-2">策略有效性</div>
                <div className="w-full h-2 bg-racing-dark rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-racing-red to-racing-gold transition-all duration-1000"
                    style={{ width: raceResult.summary.strategyEffectiveness + '%' }}
                  />
                </div>
                <div className="mt-2 text-xs text-racing-silver">
                  <div>最佳决策: {raceResult.summary.bestDecision}</div>
                  <div>待改进: {raceResult.summary.worstDecision}</div>
                </div>
              </div>
            )}

            <div className="mb-4">
              <h4 className="text-sm font-display font-bold text-white mb-2">轮胎使用序列</h4>
              {tireUsage.length === 0 ? (
                <div className="text-racing-silver text-sm">无记录</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tireUsage.map((tire, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-racing-dark/50 px-3 py-2 rounded-lg"
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: TIRE_COMPOUNDS[tire.compound].color }}
                      />
                      <span className="text-white text-sm">{TIRE_COMPOUNDS[tire.compound].name}</span>
                      <span className="text-racing-silver text-xs">
                        {tire.startLap}-{tire.endLap}圈 ({tire.stintLaps}圈)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
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
          </div>
        </div>

        <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-6 border border-racing-dark-light mb-6">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              关键事件时间线
              <span className="text-sm text-racing-silver font-normal">({eventTimeline.length} 个事件)</span>
            </h3>
            {showTimeline ? <ChevronUp className="w-5 h-5 text-racing-silver" /> : <ChevronDown className="w-5 h-5 text-racing-silver" />}
          </button>
          
          {showTimeline && (
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {eventTimeline.length === 0 ? (
                <div className="text-racing-silver text-center py-8">
                  本场比赛无特殊事件
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-racing-dark-light" />
                  {eventTimeline.map((event, index) => (
                    <div key={event.id} className="relative pl-10 pb-4 last:pb-0">
                      <div className={"absolute left-2.5 w-3 h-3 rounded-full " + getEventTypeColor(event.type) + " border-2 border-racing-dark-light"} />
                      <div className="bg-racing-dark/50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={"p-1.5 rounded-lg " + getEventTypeColor(event.type) + " bg-opacity-20"}>
                            {getEventTypeIcon(event.type)}
                          </div>
                          <span className="text-white font-display font-bold text-sm">
                            第 {event.lap} 圈
                          </span>
                          <span className="text-racing-silver text-xs font-mono">
                            {formatTime(event.raceTime)}
                          </span>
                        </div>
                        <div className="text-racing-silver text-sm">{event.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-6 border border-racing-dark-light mb-6">
          <button
            onClick={() => setShowStrategy(!showStrategy)}
            className="w-full flex items-center justify-between text-left"
          >
            <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              策略建议
              <span className="text-sm text-racing-silver font-normal">({strategySuggestions.length} 条建议)</span>
            </h3>
            {showStrategy ? <ChevronUp className="w-5 h-5 text-racing-silver" /> : <ChevronDown className="w-5 h-5 text-racing-silver" />}
          </button>
          
          {showStrategy && (
            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {strategySuggestions.length === 0 ? (
                <div className="text-racing-silver text-center py-8">
                  策略执行完美，无特别建议
                </div>
              ) : (
                <div className="space-y-3">
                  {strategySuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className={"border-l-4 " + getPriorityColor(suggestion.priority) + " rounded-xl p-4 bg-racing-dark/50"}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getPriorityIcon(suggestion.priority)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-display font-bold">{suggestion.title}</span>
                            <span className="text-xs text-racing-silver">第 {suggestion.referenceLap} 圈</span>
                            {suggestion.outcome && (
                              <span className={"text-xs px-2 py-0.5 rounded-full " + (
                                suggestion.outcome === 'better' ? 'bg-green-500/20 text-green-400' :
                                suggestion.outcome === 'worse' ? 'bg-red-500/20 text-red-400' :
                                'bg-yellow-500/20 text-yellow-400'
                              )}>
                                {suggestion.outcome === 'better' ? '表现优秀' :
                                 suggestion.outcome === 'worse' ? '待改进' : '可优化'}
                              </span>
                            )}
                          </div>
                          <p className="text-racing-silver text-sm">{suggestion.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {isLearningMode && learningFeedback && (
          <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 mb-6">
            <button
              onClick={() => setShowLearning(!showLearning)}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                策略学习反馈
                <span className="text-sm text-purple-400 font-normal">学习模式</span>
              </h3>
              {showLearning ? <ChevronUp className="w-5 h-5 text-racing-silver" /> : <ChevronDown className="w-5 h-5 text-racing-silver" />}
            </button>
            
            {showLearning && (
              <div className="mt-4">
                <div className="text-center mb-6 p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
                  <div className={"text-4xl font-display font-black " + getTimingColor(learningFeedback.overall) + " mb-2"}>
                    {learningFeedback.overall === 'excellent' ? '策略大师！' :
                     learningFeedback.overall === 'good' ? '表现优秀！' :
                     learningFeedback.overall === 'average' ? '还需努力！' : '需要加强！'}
                  </div>
                  <div className="text-3xl font-display font-bold text-purple-400 mb-2">
                    {learningFeedback.score} / 100 分
                  </div>
                  <p className="text-racing-silver text-sm">{learningFeedback.summary}</p>
                </div>

                <div className="space-y-3">
                  {learningFeedback.items.map((item: LearningFeedbackItem, index: number) => (
                    <div key={index} className="bg-racing-dark/50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-racing-dark-light">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-display font-bold text-white">
                              {item.category === 'rain' ? '降雨响应' :
                               item.category === 'tire' ? '轮胎管理' :
                               item.category === 'fuel' ? '燃油策略' : '安全车应对'}
                            </span>
                            <span className={"text-sm " + getTimingColor(item.timing)}>
                              {item.timing === 'excellent' ? '优秀' :
                               item.timing === 'good' ? '良好' :
                               item.timing === 'average' ? '一般' : '较差'}
                            </span>
                            {item.reactionTime !== undefined && (
                              <span className="text-xs text-racing-silver">
                                反应时间: {item.reactionTime} 圈
                              </span>
                            )}
                          </div>
                          <p className="text-racing-silver text-sm mb-1">{item.description}</p>
                          <p className="text-cyan-400 text-sm">💡 {item.suggestion}</p>
                        </div>
                        {item.timing === 'excellent' && <TrendingUp className="w-5 h-5 text-green-400" />}
                        {item.timing === 'poor' && <TrendingDown className="w-5 h-5 text-red-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-6 border border-racing-dark-light mb-8">
          <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
            <Flag className="w-5 h-5 text-racing-red" />
            最终排名
          </h3>
          <div className="space-y-2">
            {sortedCars.map((car, index) => (
              <div
                key={car.id}
                className={"flex items-center gap-4 p-3 rounded-xl " + (car.isPlayer ? 'bg-racing-red/20 border border-racing-red/50' : 'bg-racing-dark/30')}
              >
                <div className={"w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-lg " + (
                  index === 0 ? 'bg-yellow-500 text-racing-dark' :
                  index === 1 ? 'bg-gray-400 text-racing-dark' :
                  index === 2 ? 'bg-amber-700 text-white' :
                  'bg-racing-dark-light text-white'
                )}>
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
                  <div className="text-xs text-racing-silver">
                    {car.lap} 圈 · 最佳 {formatLapTime(car.bestLapTime)}
                  </div>
                </div>
                <div className="text-racing-silver font-mono text-sm">
                  {formatTime(car.totalTime)}
                </div>
                {car.retired && (
                  <span className="text-red-400 text-sm font-display font-bold">DNF</span>
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
