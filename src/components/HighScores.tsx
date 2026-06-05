import { Trophy, Calendar, Timer, X, Trash2 } from 'lucide-react';
import { useUISTore } from '@/store/useUISTore';
import { getHighScores, clearHighScores } from '@/utils/storage';
import { useState, useEffect } from 'react';
import { HighScore } from '@/types/game';
import { formatTime, getOrdinalSuffix } from '@/utils/helpers';
import { TIRE_COMPOUNDS } from '@/game/config/constants';

export function HighScores() {
  const { setView } = useUISTore();
  const [scores, setScores] = useState<HighScore[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-racing-dark via-racing-dark-light to-racing-dark flex items-center justify-center p-8">
      <div className="w-full max-w-3xl">
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
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all hover:scale-[1.01] ${
                    index === 0
                      ? 'bg-gradient-to-r from-yellow-500/20 to-transparent border border-yellow-500/30'
                      : index === 1
                      ? 'bg-gradient-to-r from-gray-400/20 to-transparent border border-gray-400/30'
                      : index === 2
                      ? 'bg-gradient-to-r from-amber-700/20 to-transparent border border-amber-700/30'
                      : 'bg-racing-dark/50 border border-racing-dark-light'
                  }`}
                >
                  <div className="w-12 h-12 flex items-center justify-center text-2xl font-bold">
                    {getMedalEmoji(index)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-display font-bold text-white">
                        {getOrdinalSuffix(score.position)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-display font-bold ${getDifficultyColor(score.difficulty)} bg-current/10`}>
                        {getDifficultyText(score.difficulty)}
                      </span>
                      <span className="text-racing-silver text-sm">{score.trackName}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-racing-silver">
                      <span className="flex items-center gap-1">
                        <Timer className="w-4 h-4" />
                        {formatTime(score.totalTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        🏎️
                        最佳圈: {formatTime(score.bestLapTime)}
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
