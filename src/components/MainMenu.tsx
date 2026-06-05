import { useState } from 'react';
import { Trophy, Play, BookOpen, Settings, Flag, Zap, Clock, Target } from 'lucide-react';
import { useUISTore } from '@/store/useUISTore';
import { useGameStore } from '@/store/useGameStore';
import { TRACKS } from '@/game/config/trackData';
import { TIRE_COMPOUNDS, GAME_CONSTANTS, DIFFICULTY_CONFIG } from '@/game/config/constants';
import type { Difficulty, GameMode, TireCompound } from '@/types/game';

export function MainMenu() {
  const { 
    selectedTrack, selectedDifficulty, selectedMode, selectedTire, pitStopFuelAmount,
    setSelectedTrack, setSelectedDifficulty, setSelectedMode, setSelectedTire, setPitStopFuelAmount,
    setView 
  } = useUISTore();
  const { initRace } = useGameStore();
  const [showSetup, setShowSetup] = useState(false);

  const tracks = TRACKS;
  const difficulties: { value: Difficulty; label: string; desc: string }[] = [
    { value: 'easy', label: '简单', desc: 'AI速度较慢，事件较少' },
    { value: 'normal', label: '一般', desc: '平衡的游戏体验' },
    { value: 'hard', label: '困难', desc: 'AI速度快，事件频繁' }
  ];
  const modes: { value: GameMode; label: string; desc: string }[] = [
    { value: 'grand_prix', label: '大奖赛模式', desc: '完整的比赛体验' },
    { value: 'learning', label: '策略学习模式', desc: '带教程和反馈的学习模式' }
  ];
  const tires: { value: TireCompound; label: string; color: string }[] = [
    { value: 'soft', label: '软胎', color: TIRE_COMPOUNDS.soft.color },
    { value: 'medium', label: '中性胎', color: TIRE_COMPOUNDS.medium.color },
    { value: 'hard', label: '硬胎', color: TIRE_COMPOUNDS.hard.color }
  ];

  const handleStartRace = () => {
    const track = TRACKS.find(t => t.id === selectedTrack);
    if (!track) return;

    initRace({
      trackId: selectedTrack,
      trackName: track.name,
      totalLaps: selectedDifficulty === 'easy' ? 25 : selectedDifficulty === 'normal' ? 40 : 55,
      difficulty: selectedDifficulty,
      mode: selectedMode,
      startingFuel: pitStopFuelAmount,
      startingTire: selectedTire,
      aiOpponents: 9
    });

    if (selectedMode === 'learning') {
      setView('tutorial');
    } else {
      setView('race');
    }
  };

  if (showSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-racing-dark via-racing-dark-light to-racing-dark flex items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-display font-bold text-white mb-2">比赛设置</h1>
            <p className="text-racing-silver font-body">配置你的策略，准备出发</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-6 border border-racing-dark-light">
              <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                <Flag className="w-5 h-5 text-racing-red" />
                选择赛道
              </h3>
              <div className="space-y-3">
                {tracks.map(track => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrack(track.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      selectedTrack === track.id
                        ? 'border-racing-red bg-racing-red/10'
                        : 'border-racing-dark-light bg-racing-dark/50 hover:border-racing-red/50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-left">
                        <div className="font-display font-bold text-white">{track.name}</div>
                        <div className="text-sm text-racing-silver">{track.country}</div>
                      </div>
                      <div className="text-right text-sm text-racing-silver">
                        <div>{track.length}km</div>
                        <div>{track.corners}个弯角</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-6 border border-racing-dark-light">
              <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-racing-gold" />
                难度选择
              </h3>
              <div className="space-y-3 mb-6">
                {difficulties.map(diff => (
                  <button
                    key={diff.value}
                    onClick={() => setSelectedDifficulty(diff.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      selectedDifficulty === diff.value
                        ? 'border-racing-gold bg-racing-gold/10'
                        : 'border-racing-dark-light bg-racing-dark/50 hover:border-racing-gold/50'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-display font-bold text-white">{diff.label}</div>
                      <div className="text-sm text-racing-silver">{diff.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                游戏模式
              </h3>
              <div className="space-y-3">
                {modes.map(mode => (
                  <button
                    key={mode.value}
                    onClick={() => setSelectedMode(mode.value)}
                    className={`w-full p-4 rounded-xl border-2 transition-all ${
                      selectedMode === mode.value
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : 'border-racing-dark-light bg-racing-dark/50 hover:border-cyan-500/50'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-display font-bold text-white">{mode.label}</div>
                      <div className="text-sm text-racing-silver">{mode.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-6 border border-racing-dark-light">
              <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-racing-red-light" />
                起步轮胎
              </h3>
              <div className="flex gap-3 mb-6">
                {tires.map(tire => (
                  <button
                    key={tire.value}
                    onClick={() => setSelectedTire(tire.value)}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                      selectedTire === tire.value
                        ? 'border-white bg-white/10'
                        : 'border-racing-dark-light bg-racing-dark/50 hover:border-white/50'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-2 border-2 border-white/30"
                      style={{ backgroundColor: tire.color }}
                    />
                    <div className="font-display font-bold text-white text-sm">{tire.label}</div>
                    <div className="text-xs text-racing-silver">
                      {tire.value === 'soft' ? '速度+磨损快' : tire.value === 'medium' ? '平衡' : '耐久+速度慢'}
                    </div>
                  </button>
                ))}
              </div>

              <h3 className="text-xl font-display font-bold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-green-500" />
                起步燃油: {pitStopFuelAmount}kg
              </h3>
              <input
                type="range"
                min="40"
                max={GAME_CONSTANTS.MAX_FUEL_LOAD}
                value={pitStopFuelAmount}
                onChange={(e) => setPitStopFuelAmount(Number(e.target.value))}
                className="w-full h-2 bg-racing-dark rounded-lg appearance-none cursor-pointer accent-racing-red"
              />
              <div className="flex justify-between text-xs text-racing-silver mt-1">
                <span>40kg (轻)</span>
                <span>{GAME_CONSTANTS.MAX_FUEL_LOAD}kg (满)</span>
              </div>
              <p className="text-xs text-racing-silver mt-2">
                燃油越少速度越快，但需要更多进站。每圈约消耗{GAME_CONSTANTS.FUEL_PER_LAP}kg。
              </p>
            </div>

            <div className="bg-gradient-to-br from-racing-red/20 to-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-6 border border-racing-red/30">
              <h3 className="text-xl font-display font-bold text-white mb-4">策略预览</h3>
              <div className="space-y-3 text-racing-silver font-body">
                <div className="flex justify-between">
                  <span>赛道:</span>
                  <span className="text-white">{TRACKS.find(t => t.id === selectedTrack)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>难度:</span>
                  <span className="text-white">{DIFFICULTY_CONFIG[selectedDifficulty].name}</span>
                </div>
                <div className="flex justify-between">
                  <span>圈数:</span>
                  <span className="text-white">
                    {selectedDifficulty === 'easy' ? 25 : selectedDifficulty === 'normal' ? 40 : 55}圈
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>起步轮胎:</span>
                  <span className="text-white">{TIRE_COMPOUNDS[selectedTire].name}</span>
                </div>
                <div className="flex justify-between">
                  <span>起步燃油:</span>
                  <span className="text-white">{pitStopFuelAmount}kg</span>
                </div>
                <div className="flex justify-between">
                  <span>预计可跑:</span>
                  <span className="text-white">{Math.floor(pitStopFuelAmount / GAME_CONSTANTS.FUEL_PER_LAP)}圈</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button
              onClick={() => setShowSetup(false)}
              className="flex-1 py-4 px-8 bg-racing-dark-light text-white rounded-xl font-display font-bold hover:bg-racing-dark-light/80 transition-all"
            >
              返回
            </button>
            <button
              onClick={handleStartRace}
              className="flex-1 py-4 px-8 bg-gradient-to-r from-racing-red to-racing-red-light text-white rounded-xl font-display font-bold hover:from-racing-red-light hover:to-racing-red transition-all animate-glow flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              开始比赛
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-racing-dark via-racing-dark-light to-racing-dark flex items-center justify-center p-8 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-racing-red/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 text-center">
        <div className="mb-12">
          <div className="inline-block mb-4">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-16 h-1 bg-gradient-to-r from-transparent via-racing-red to-transparent" />
              <Flag className="w-12 h-12 text-racing-red" />
              <div className="w-16 h-1 bg-gradient-to-r from-transparent via-racing-red to-transparent" />
            </div>
          </div>
          <h1 className="text-6xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-racing-silver to-white mb-4 tracking-tight">
            F1 进站策略挑战
          </h1>
          <p className="text-xl text-racing-silver font-body tracking-wide">
            F1 PIT STOP STRATEGY CHALLENGE
          </p>
          <p className="text-racing-silver/60 font-body mt-2 max-w-2xl mx-auto">
            扮演车队策略师，管理轮胎磨损、燃油消耗，应对天气变化，击败AI对手，赢得大奖赛！
          </p>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <button
            onClick={() => setShowSetup(true)}
            className="w-full py-5 px-8 bg-gradient-to-r from-racing-red to-racing-red-light text-white rounded-2xl font-display font-bold text-xl hover:from-racing-red-light hover:to-racing-red transition-all transform hover:scale-105 animate-glow flex items-center justify-center gap-3 shadow-2xl shadow-racing-red/20"
          >
            <Play className="w-7 h-7" />
            开始大奖赛
          </button>

          <button
            onClick={() => {
              setSelectedMode('learning');
              setView('tutorial');
            }}
            className="w-full py-4 px-8 bg-racing-dark-light/50 backdrop-blur-sm border-2 border-racing-dark-light text-white rounded-2xl font-display font-bold hover:border-cyan-500/50 hover:bg-cyan-500/10 transition-all flex items-center justify-center gap-3"
          >
            <BookOpen className="w-6 h-6 text-cyan-400" />
            策略学习模式
          </button>

          <button
            onClick={() => setView('highscores')}
            className="w-full py-4 px-8 bg-racing-dark-light/50 backdrop-blur-sm border-2 border-racing-dark-light text-white rounded-2xl font-display font-bold hover:border-racing-gold/50 hover:bg-racing-gold/10 transition-all flex items-center justify-center gap-3"
          >
            <Trophy className="w-6 h-6 text-racing-gold" />
            最高分记录
          </button>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="bg-racing-dark-light/30 backdrop-blur-sm rounded-xl p-4 border border-racing-dark-light">
            <div className="text-3xl mb-2">🏎️</div>
            <div className="font-display font-bold text-white">10台赛车</div>
            <div className="text-xs text-racing-silver">与AI同场竞技</div>
          </div>
          <div className="bg-racing-dark-light/30 backdrop-blur-sm rounded-xl p-4 border border-racing-dark-light">
            <div className="text-3xl mb-2">🌧️</div>
            <div className="font-display font-bold text-white">动态天气</div>
            <div className="text-xs text-racing-silver">随机降雨挑战</div>
          </div>
          <div className="bg-racing-dark-light/30 backdrop-blur-sm rounded-xl p-4 border border-racing-dark-light">
            <div className="text-3xl mb-2">🚨</div>
            <div className="font-display font-bold text-white">安全车</div>
            <div className="text-xs text-racing-silver">突发事件应对</div>
          </div>
        </div>

        <div className="mt-8 text-racing-silver/40 text-sm font-body">
          按 ESC 暂停比赛 | 滚动鼠标缩放视角 | 空格键呼叫进站
        </div>
      </div>
    </div>
  );
}
