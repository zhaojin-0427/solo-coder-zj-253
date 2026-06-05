import { ChevronLeft, ChevronRight, X, Check, BookOpen } from 'lucide-react';
import { useUISTore } from '@/store/useUISTore';
import { useGameStore } from '@/store/useGameStore';
import { TRACKS } from '@/game/config/trackData';
import { TIRE_COMPOUNDS, GAME_CONSTANTS } from '@/game/config/constants';

export function Tutorial() {
  const { tutorialStep, tutorialSteps, nextTutorialStep, prevTutorialStep,
    completeTutorialStep, setView, selectedTrack, selectedDifficulty,
    setSelectedTrack, setSelectedDifficulty, selectedTire, setSelectedTire,
    pitStopFuelAmount, setPitStopFuelAmount, selectedMode, setSelectedMode } = useUISTore();
  const { initRace } = useGameStore();

  const currentStep = tutorialSteps[tutorialStep];
  const isLastStep = tutorialStep === tutorialSteps.length - 1;
  const isFirstStep = tutorialStep === 0;

  const handleNext = () => {
    completeTutorialStep(currentStep.id);
    
    if (isLastStep) {
      const track = TRACKS.find(t => t.id === selectedTrack);
      if (track) {
        initRace({
          trackId: selectedTrack,
          trackName: track.name,
          totalLaps: 20,
          difficulty: selectedDifficulty,
          mode: selectedMode,
          startingFuel: pitStopFuelAmount,
          startingTire: selectedTire,
          aiOpponents: 9
        });
        setView('race');
      }
    } else {
      nextTutorialStep();
    }
  };

  const handleSkip = () => {
    setView('menu');
  };

  const tracks = TRACKS;
  const tires = [
    { value: 'soft', label: '软胎', color: TIRE_COMPOUNDS.soft.color },
    { value: 'medium', label: '中性胎', color: TIRE_COMPOUNDS.medium.color },
    { value: 'hard', label: '硬胎', color: TIRE_COMPOUNDS.hard.color }
  ];

  const renderStepContent = () => {
    switch (tutorialStep) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-racing-silver text-lg leading-relaxed">
              {currentStep.description}
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-racing-dark/50 p-4 rounded-xl border border-racing-dark-light">
                <div className="text-4xl mb-2">🏎️</div>
                <div className="font-display font-bold text-white">10台赛车</div>
              </div>
              <div className="bg-racing-dark/50 p-4 rounded-xl border border-racing-dark-light">
                <div className="text-4xl mb-2">🌧️</div>
                <div className="font-display font-bold text-white">动态天气</div>
              </div>
              <div className="bg-racing-dark/50 p-4 rounded-xl border border-racing-dark-light">
                <div className="text-4xl mb-2">🔧</div>
                <div className="font-display font-bold text-white">轮胎策略</div>
              </div>
              <div className="bg-racing-dark/50 p-4 rounded-xl border border-racing-dark-light">
                <div className="text-4xl mb-2">⚡</div>
                <div className="font-display font-bold text-white">实时决策</div>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-racing-silver text-lg leading-relaxed">
              {currentStep.description}
            </p>
            <div className="bg-racing-dark/50 p-6 rounded-xl border border-racing-dark-light">
              <h4 className="font-display font-bold text-white mb-4">轮胎配方对比</h4>
              <div className="grid grid-cols-3 gap-4">
                {tires.map((tire) => {
                  const compound = TIRE_COMPOUNDS[tire.value as keyof typeof TIRE_COMPOUNDS];
                  return (
                    <div
                      key={tire.value}
                      onClick={() => setSelectedTire(tire.value as any)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedTire === tire.value
                          ? 'border-white bg-white/10'
                          : 'border-racing-dark-light bg-racing-dark/50 hover:border-white/50'
                      }`}
                    >
                      <div
                        className="w-12 h-12 rounded-full mx-auto mb-2 border-2 border-white/30"
                        style={{ backgroundColor: tire.color }}
                      />
                      <div className="font-display font-bold text-white">{tire.label}</div>
                      <div className="text-xs text-racing-silver mt-2">
                        <div>抓地力: {compound.grip.toFixed(2)}</div>
                        <div>磨损率: {compound.wearRate}</div>
                        <div>最佳温度: {compound.optimalTemp[0]}-{compound.optimalTemp[1]}°C</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="text-sm text-racing-silver">
              💡 软胎速度最快但磨损最快，适合短距离冲刺；硬胎耐久但圈速较慢，适合长距离；
            </p>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-racing-silver text-lg leading-relaxed">
              {currentStep.description}
            </p>
            <div className="bg-racing-dark/50 p-6 rounded-xl border border-racing-dark-light">
              <h4 className="font-display font-bold text-white mb-4">燃油策略</h4>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="text-sm text-racing-silver mb-2">
                    起步燃油: <span className="text-white font-bold">{pitStopFuelAmount}kg</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max={GAME_CONSTANTS.MAX_FUEL_LOAD}
                    value={pitStopFuelAmount}
                    onChange={(e) => setPitStopFuelAmount(Number(e.target.value))}
                    className="w-full h-3 bg-racing-dark rounded-lg appearance-none cursor-pointer accent-racing-red"
                  />
                  <div className="flex justify-between text-xs text-racing-silver mt-2">
                    <span>40kg (轻-快)</span>
                    <span>{GAME_CONSTANTS.MAX_FUEL_LOAD}kg (满-慢)</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-500/20 p-3 rounded-lg">
                  <div className="text-2xl font-display font-bold text-green-400">-</div>
                  <div className="text-xs text-racing-silver">轻燃油</div>
                  <div className="text-xs text-racing-silver">速度更快</div>
                </div>
                <div className="bg-yellow-500/20 p-3 rounded-lg">
                  <div className="text-2xl font-display font-bold text-yellow-400">≈</div>
                  <div className="text-xs text-racing-silver">每圈消耗</div>
                  <div className="text-xs text-racing-silver">{GAME_CONSTANTS.FUEL_PER_LAP}kg</div>
                </div>
                <div className="bg-red-500/20 p-3 rounded-lg">
                  <div className="text-2xl font-display font-bold text-red-400">+</div>
                  <div className="text-xs text-racing-silver">重燃油</div>
                  <div className="text-xs text-racing-silver">进站更少</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-racing-silver text-lg leading-relaxed">
              {currentStep.description}
            </p>
            <div className="bg-racing-dark/50 p-6 rounded-xl border border-racing-dark-light">
              <h4 className="font-display font-bold text-white mb-4">进站时间损失</h4>
              <div className="text-center">
                <div className="text-6xl font-display font-black text-racing-red mb-2">
                  {GAME_CONSTANTS.PIT_STOP_DURATION}s
                </div>
                <div className="text-racing-silver">平均进站耗时</div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-racing-silver">换胎</span>
                  <span className="text-white">~2.0s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-racing-silver">加油</span>
                  <span className="text-white">~1.2s</span>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                <p className="text-sm text-yellow-400">
                  💡 按 <strong>空格键</strong> 可以快速呼叫进站
                </p>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <p className="text-racing-silver text-lg leading-relaxed">
              {currentStep.description}
            </p>
            <div className="bg-racing-dark/50 p-6 rounded-xl border border-racing-dark-light">
              <h4 className="font-display font-bold text-white mb-4">天气对抓地力的影响</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
                  <div className="text-4xl mb-2">☀️</div>
                  <div className="font-display font-bold text-white">干燥</div>
                  <div className="text-sm text-racing-silver">干胎100%抓地力</div>
                  <div className="text-sm text-racing-silver">雨胎-25%抓地力</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-500/20 border border-blue-500/30">
                  <div className="text-4xl mb-2">🌦️</div>
                  <div className="font-display font-bold text-white">小雨</div>
                  <div className="text-sm text-racing-silver">干胎-25%抓地力</div>
                  <div className="text-sm text-racing-silver">雨胎+15%抓地力</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-blue-600/20 border border-blue-600/30">
                  <div className="text-4xl mb-2">🌧️</div>
                  <div className="font-display font-bold text-white">大雨</div>
                  <div className="text-sm text-racing-silver">干胎-40%抓地力</div>
                  <div className="text-sm text-racing-silver">雨胎+15%抓地力</div>
                </div>
              </div>
            </div>
            <p className="text-sm text-racing-silver">
              💡 天气变化是渐进的，你有时间做出反应。注意观察HUD上的天气指示器！
            </p>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <p className="text-racing-silver text-lg leading-relaxed">
              {currentStep.description}
            </p>
            <div className="bg-racing-dark/50 p-6 rounded-xl border border-racing-dark-light">
              <h4 className="font-display font-bold text-white mb-4">AI对手策略</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 bg-racing-dark/50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center">⚡</div>
                  <div className="flex-1">
                    <div className="font-display font-bold text-white">激进型</div>
                    <div className="text-sm text-racing-silver">更多进站，追求最快圈速</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-racing-dark/50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">⚖️</div>
                  <div className="flex-1">
                    <div className="font-display font-bold text-white">平衡型</div>
                    <div className="text-sm text-racing-silver">平衡进站次数和圈速</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-racing-dark/50 rounded-lg">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">🐢</div>
                  <div className="flex-1">
                    <div className="font-display font-bold text-white">保守型</div>
                    <div className="text-sm text-racing-silver">更少进站，追求稳定性</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-orange-500/20 border border-orange-500/50 rounded-lg">
                <p className="text-sm text-orange-400">
                  💡 注意观察对手的进站时机，他们可能会使用Undercut策略在你之前进站来获得优势！
                </p>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <p className="text-racing-silver text-lg leading-relaxed">
              {currentStep.description}
            </p>
            <div className="bg-racing-dark/50 p-6 rounded-xl border border-racing-dark-light">
              <h4 className="font-display font-bold text-white mb-4">选择赛道</h4>
              <div className="space-y-3">
                {tracks.slice(0, 2).map(track => (
                  <button
                    key={track.id}
                    onClick={() => setSelectedTrack(track.id)}
                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                      selectedTrack === track.id
                        ? 'border-racing-red bg-racing-red/10'
                        : 'border-racing-dark-light bg-racing-dark/50 hover:border-racing-red/50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
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
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => setSelectedDifficulty('easy')}
                className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                  selectedDifficulty === 'easy' ? 'border-green-500 bg-green-500/20' : 'border-racing-dark-light'
                }`}
              >
                <div className="font-display font-bold text-white">简单</div>
                <div className="text-xs text-racing-silver">20圈</div>
              </button>
              <button
                onClick={() => setSelectedDifficulty('normal')}
                className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                  selectedDifficulty === 'normal' ? 'border-yellow-500 bg-yellow-500/20' : 'border-racing-dark-light'
                }`}
              >
                <div className="font-display font-bold text-white">一般</div>
                <div className="text-xs text-racing-silver">20圈</div>
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-racing-dark via-racing-dark-light to-racing-dark flex items-center justify-center p-8">
      <div className="w-full max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-display font-black text-white">策略学习模式</h1>
          </div>
          <button
            onClick={handleSkip}
            className="flex items-center gap-2 text-racing-silver hover:text-white transition-colors px-4 py-2 rounded-xl hover:bg-racing-dark-light"
          >
            <X className="w-5 h-5" />
            跳过教程
          </button>
        </div>

        <div className="flex gap-2 mb-8">
          {tutorialSteps.map((step, index) => (
            <div
              key={step.id}
              className="flex-1 h-2 rounded-full overflow-hidden bg-racing-dark-light"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  index <= tutorialStep
                    ? 'bg-cyan-500'
                    : 'bg-racing-dark-light'
                }`}
                style={{
                  width: index === tutorialStep ? '50%' : index < tutorialStep ? '100%' : '0%'
                }}
              />
            </div>
          ))}
        </div>

        <div className="bg-racing-dark-light/50 backdrop-blur-sm rounded-2xl p-8 border border-racing-dark-light">
          <div className="mb-6">
            <div className="text-sm text-cyan-400 font-display font-bold mb-2">
              步骤 {tutorialStep + 1} / {tutorialSteps.length}
            </div>
            <h2 className="text-2xl font-display font-bold text-white">
              {currentStep.title}
            </h2>
          </div>

          {renderStepContent()}

          <div className="flex gap-4 mt-8">
            <button
              onClick={prevTutorialStep}
              disabled={isFirstStep}
              className={`flex-1 py-4 px-8 rounded-xl font-display font-bold flex items-center justify-center gap-2 transition-all ${
                isFirstStep
                  ? 'bg-racing-dark-light text-racing-silver cursor-not-allowed opacity-50'
                  : 'bg-racing-dark-light text-white hover:bg-racing-dark-light/80'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              上一步
            </button>
            <button
              onClick={handleNext}
              className="flex-1 py-4 px-8 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-xl font-display font-bold hover:from-cyan-600 hover:to-cyan-500 transition-all flex items-center justify-center gap-2"
            >
              {isLastStep ? (
                <>
                  <Check className="w-5 h-5" />
                  开始练习
                </>
              ) : (
                <>
                  下一步
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
