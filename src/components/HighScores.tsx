import { Trophy, Calendar, Timer, X, Trash2, ChevronDown, ChevronUp, Flag, Clock, Award, Car, Droplets, AlertTriangle } from 'lucide-react';
import { useUISTore } from '@/store/useUISTore';
import { getHighScores, clearHighScores } from '@/utils/storage';
import { useState, useEffect } from 'react';
import { HighScore } from '@/types/game';
import { formatTime, getOrdinalSuffix, formatLapTime } from '@/utils/helpers';
import { TIRE_COMPOUNDS } from '@/game/config/constants';

export function HighScores() {
  const { setView } = useUISTore();
  const [scores, setScores] = useState<HighScore[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = () => {
    setScores(getHighScores());
  };

  const handleClearScores = () => {
    clearHighScores();
    setScores([]);
    setShowClearConfirm(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'normal': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-white';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'normal': return '一般';
      case 'hard': return '困难';
      default: return difficulty;
    }
  };

  const getMedalEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}`;
  };

  const getModeBadge = (mode?: string) => {
    if (mode === 'learning') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-display font-bold bg-purple-500/20 text-purple-400">
          策略学习
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-racing-dark via-racing-dark-light to-racing-dark flex items-center justify-center p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-3xl py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-racing-gold" />
            <h1 className="text-3xl font-display font-black text-white">最高分记录</h1>
          </div>
          <div className="flex gap-3">
            {scores.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors px-4 py-2 rounded-xl hover:bg-red-500/10"
              >
                <Trash2 className="w-5 h-5" />
                清除记录
              </button>
            )}
            <button
              onClick={() => setView('menu')}
              className="flex items-center gap-2 text-racing-silver hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-racing-dark-light"
            >
              <X className="w-5 h-5" />
              返回
            </button>
          </div>
        </div>

        {showClearConfirm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-racing-dark-light rounded-2xl p-6 border border-racing-dark max-w-md w-full mx-4">
              <h3 className="text-xl font-display font-bold text-white mb-4">确认清除</h3>
              <p className="text-racing-silver mb-6">确定要清除所有最高分记录吗？此操作不可恢复。</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 bg-racing-dark text-white rounded-xl font-display font-bold hover:bg-racing-dark/80 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleClearScores}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-display font-bold hover:bg-red-500 transition-all"
                >
                  确认清除
                </button>
              </div>
            </div>
          </div>
        )}

        {scores.length === 0 ? (
          <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-12 border border-racing-dark-light text-center">
            <div className="text-6xl mb-4">🏁</div>
            <h3 className="text-2xl font-display font-bold text-white mb-2">暂无记录</h3>
            <p className="text-racing-silver mb-6">完成一场比赛后，你的成绩将显示在这里</p>
            <button
              onClick={() => setView('menu')}
              className="px-8 py-4 bg-gradient-to-r from-racing-red to-racing-red-light text-white rounded-xl font-display font-bold hover:from-racing-red-light hover:to-racing-red transition-all"
            >
              开始比赛
            </button>
          </div>
        ) : (
          <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-6 border border-racing-dark-light">
            <div className="space-y-3">
              {scores.map((score, index) => (
                <div
                  key={score.id}
                  className={`rounded-xl transition-all overflow-hidden ${
                    index === 0
                      ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30'
                      : index === 1
                      ? 'bg-gradient-to-r from-gray-400/20 to-transparent border border-gray-400/30'
                      : index === 2
                      ? 'bg-gradient-to-r from-amber-700/20 to-transparent border border-amber-700/30'
                      : 'bg-racing-dark/50 border border-racing-dark-light'
                  }`}
                >
                  <div
                    className={`flex items-center gap-4 p-4 cursor-pointer hover:scale-[1.01] transition-transform ${
                      expandedId === score.id ? 'bg-racing-dark-light/30' : ''
                    }`}
                    onClick={() => toggleExpand(score.id)}
                  >
                    <div className="w-12 h-12 flex items-center justify-center text-2xl font-bold">
                      {getMedalEmoji(index)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xl font-display font-bold text-white">
                          {getOrdinalSuffix(score.position)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-display font-bold ${getDifficultyColor(score.difficulty)} bg-current/10`}>
                          {getDifficultyText(score.difficulty)}
                        </span>
                        {getModeBadge(score.mode)}
                        <span className="text-racing-silver text-sm">{score.trackName}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-racing-silver flex-wrap">
                        <span className="flex items-center gap-1">
                          <Timer className="w-4 h-4" />
                          {formatTime(score.totalTime)}
                        </span>
                        <span className="flex items-center gap-1">
                          🏎️
                          最佳圈: {formatLapTime(score.bestLapTime)}
                        </span>
                        <span>
                          进站 {score.pitStops} 次
                        </span>
                        {score.tiresUsed && score.tiresUsed.length > 0 && (
                          <div className="flex items-center gap-1">
                            轮胎:
                            <div className="flex gap-1">
                              {score.tiresUsed.map((tire, i) => (
                                <div
                                  key={i}
                                  className="w-4 h-4 rounded-full border border-white/30"
                                  style={{ backgroundColor: TIRE_COMPOUNDS[tire]?.color || '#888' }}
                                  title={TIRE_COMPOUNDS[tire]?.name || tire}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      {score.summary && (
                        <div className="text-xs text-racing-silver mt-1 truncate">
                          📝 {score.summary}
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-display font-black text-racing-red">
                        {score.score.toLocaleString()}
                      </div>
                      <div className="text-xs text-racing-silver flex items-center justify-end gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(score.date).toLocaleDateString('zh-CN')}
                      </div>
                    </div>

                    <div className="text-racing-silver">
                      {expandedId === score.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {expandedId === score.id && score.raceResult && (
                    <div className="px-4 pb-4 border-t border-racing-dark-light pt-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-racing-dark/50 rounded-xl p-3 text-center">
                          <div className="text-lg font-display font-bold text-racing-gold">
                            {getOrdinalSuffix(score.raceResult.finalPosition)}
                          </div>
                          <div className="text-xs text-racing-silver">最终排名</div>
                        </div>
                        <div className="bg-racing-dark/50 rounded-xl p-3 text-center">
                          <div className="text-lg font-display font-bold text-white font-mono">
                            {formatTime(score.raceResult.totalTime)}
                          </div>
                          <div className="text-xs text-racing-silver">总用时</div>
                        </div>
                        <div className="bg-racing-dark/50 rounded-xl p-3 text-center">
                          <div className="text-lg font-display font-bold text-purple-400 font-mono">
                            {formatLapTime(score.raceResult.bestLapTime)}
                          </div>
                          <div className="text-xs text-racing-silver">最佳圈速</div>
                        </div>
                        <div className="bg-racing-dark/50 rounded-xl p-3 text-center">
                          <div className="text-lg font-display font-bold text-cyan-400">
                            {score.raceResult.lapsCompleted}
                          </div>
                          <div className="text-xs text-racing-silver">完成圈数</div>
                        </div>
                      </div>

                      {score.raceResult.summary && (
                        <div className="bg-racing-dark/50 rounded-xl p-4 mb-4">
                          <h4 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4 text-cyan-400" />
                            比赛摘要
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-racing-silver w-20">策略有效性:</span>
                              <div className="flex-1">
                                <div className="w-full h-2 bg-racing-dark rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-racing-red to-racing-gold"
                                    style={{ width: `${score.raceResult.summary.strategyEffectiveness}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-white font-mono w-12 text-right">
                                {score.raceResult.summary.strategyEffectiveness}%
                              </span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-racing-silver w-20">关键时刻:</span>
                              <div className="flex-1">
                                <ul className="list-disc list-inside text-white">
                                  {score.raceResult.summary.keyMoments.map((moment, i) => (
                                    <li key={i}>{moment}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-racing-silver w-20">最佳决策:</span>
                              <span className="text-green-400">{score.raceResult.summary.bestDecision}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-racing-silver w-20">待改进:</span>
                              <span className="text-yellow-400">{score.raceResult.summary.worstDecision}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {score.raceResult.tireUsage && score.raceResult.tireUsage.length > 0 && (
                        <div className="bg-racing-dark/50 rounded-xl p-4 mb-4">
                          <h4 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                            <Car className="w-4 h-4 text-red-400" />
                            轮胎使用序列
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {score.raceResult.tireUsage.map((tire, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 bg-racing-dark-light/50 px-3 py-2 rounded-lg"
                              >
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: TIRE_COMPOUNDS[tire.compound]?.color || '#888' }}
                                />
                                <span className="text-white text-sm">
                                  {TIRE_COMPOUNDS[tire.compound]?.name || tire.compound}
                                </span>
                                <span className="text-racing-silver text-xs">
                                  {tire.startLap}-{tire.endLap}圈 ({tire.stintLaps}圈)
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {score.raceResult.pitStops && score.raceResult.pitStops.length > 0 && (
                        <div className="bg-racing-dark/50 rounded-xl p-4 mb-4">
                          <h4 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-cyan-400" />
                            进站记录
                          </h4>
                          <div className="space-y-2">
                            {score.raceResult.pitStops.map((pit, i) => (
                              <div key={i} className="flex justify-between items-center text-sm bg-racing-dark-light/30 p-2 rounded-lg">
                                <span className="text-racing-silver">第 {pit.lap} 圈</span>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: TIRE_COMPOUNDS[pit.tireCompound]?.color || '#888' }}
                                  />
                                  <span className="text-white">
                                    {TIRE_COMPOUNDS[pit.tireCompound]?.name || pit.tireCompound}
                                  </span>
                                  <span className="text-racing-silver">+{pit.fuelAdded.toFixed(0)}kg</span>
                                  <span className="text-yellow-400">-{pit.timeLost.toFixed(1)}s</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {score.raceResult.eventTimeline && score.raceResult.eventTimeline.length > 0 && (
                        <div className="bg-racing-dark/50 rounded-xl p-4">
                          <h4 className="font-display font-bold text-white mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-400" />
                            关键事件
                          </h4>
                          <div className="relative">
                            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-racing-dark-light" />
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {score.raceResult.eventTimeline.slice(0, 8).map((event) => (
                                <div key={event.id} className="relative pl-8">
                                  <div className={`absolute left-1.5 w-3 h-3 rounded-full border-2 border-racing-dark-light ${
                                    event.type === 'rain' ? 'bg-blue-500' :
                                    event.type === 'safety_car' ? 'bg-yellow-500' :
                                    event.type === 'crash' ? 'bg-red-500' :
                                    event.type === 'undercut' ? 'bg-orange-500' : 'bg-gray-500'
                                  }`} />
                                  <div className="text-sm">
                                    <span className="text-white font-bold">第 {event.lap} 圈</span>
                                    <span className="text-racing-silver text-xs ml-2">
                                      {formatTime(event.raceTime)}
                                    </span>
                                    <div className="text-racing-silver text-sm">{event.description}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {score.raceResult.retired && score.raceResult.retirementReason && (
                        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                          <div className="text-red-400 text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            退赛原因: {score.raceResult.retirementReason}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-racing-silver/60 text-sm">
          记录保存在本地浏览器中
        </div>
      </div>
    </div>
  );
}
