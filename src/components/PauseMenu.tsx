import { Play, Home, RotateCcw, X, Settings } from 'lucide-react';
import { useGameStore } from '@/store/useGameStore';
import { useUISTore } from '@/store/useUISTore';

export function PauseMenu() {
  const { resumeRace, resetRace, initRace, config, playerCarId, cars } = useGameStore();
  const { setView, setShowPauseMenu, cameraZoom, setCameraZoom } = useUISTore();

  const handleResume = () => {
    resumeRace();
    setShowPauseMenu(false);
  };

  const handleRestart = () => {
    if (config) {
      resetRace();
      initRace(config);
      setShowPauseMenu(false);
    }
  };

  const handleMainMenu = () => {
    resetRace();
    setShowPauseMenu(false);
    setView('menu');
  };

  const playerCar = cars.find(c => c.id === playerCarId);

  return (
    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-racing-dark-light rounded-2xl p-8 border border-racing-dark max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-display font-black text-white">暂停</h2>
          <button
            onClick={handleResume}
            className="w-10 h-10 rounded-full bg-racing-dark flex items-center justify-center text-racing-silver hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {playerCar && (
          <div className="bg-racing-dark/50 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-racing-silver uppercase">当前排名</div>
                <div className="text-xl font-display font-bold text-white">{playerCar.position}</div>
              </div>
              <div>
                <div className="text-xs text-racing-silver uppercase">圈数</div>
                <div className="text-xl font-display font-bold text-white">{playerCar.lap}/{config?.totalLaps}</div>
              </div>
              <div>
                <div className="text-xs text-racing-silver uppercase">进站</div>
                <div className="text-xl font-display font-bold text-white">{playerCar.pitStops}</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-racing-dark/50 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-display font-bold text-white mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            摄像机设置
          </h3>
          <div className="flex items-center gap-4">
            <span className="text-sm text-racing-silver whitespace-nowrap">缩放</span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={cameraZoom}
              onChange={(e) => setCameraZoom(Number(e.target.value))}
              className="flex-1 h-2 bg-racing-dark rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <span className="text-sm text-white font-mono w-12 text-right">
              {cameraZoom.toFixed(1)}x
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleResume}
            className="w-full py-4 bg-gradient-to-r from-racing-red to-racing-red-light text-white rounded-xl font-display font-bold hover:from-racing-red-light hover:to-racing-red transition-all flex items-center justify-center gap-2 animate-glow"
          >
            <Play className="w-5 h-5" />
            继续比赛
          </button>
          <button
            onClick={handleRestart}
            className="w-full py-4 bg-racing-dark text-white rounded-xl font-display font-bold hover:bg-racing-dark/80 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            重新开始
          </button>
          <button
            onClick={handleMainMenu}
            className="w-full py-4 bg-racing-dark text-white rounded-xl font-display font-bold hover:bg-racing-dark/80 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            返回主菜单
          </button>
        </div>

        <div className="mt-6 text-center text-racing-silver/60 text-xs">
          按 ESC 继续游戏
        </div>
      </div>
    </div>
  );
}
