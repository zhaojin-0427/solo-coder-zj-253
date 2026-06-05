import { useEffect, useRef } from 'react';
import { HUD } from './HUD';
import { PauseMenu } from './PauseMenu';
import { Results } from './Results';
import { useGameStore } from '@/store/useGameStore';
import { useUISTore } from '@/store/useUISTore';
import { gameEngine } from '@/game/GameEngine';
import { saveHighScore } from '@/utils/storage';
import { calculateScore, generateId } from '@/utils/helpers';
import { TIRE_COMPOUNDS } from '@/game/config/constants';

export function RaceView() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const { raceState, cars, playerCarId, config, finishRace, pitStopResults } = useGameStore();
  const { showPauseMenu, cameraZoom } = useUISTore();
  const hasSavedScore = useRef(false);

  useEffect(() => {
    if (canvasRef.current && !gameEngine.isInitialized()) {
      gameEngine.init(canvasRef.current);
    }

    return () => {
      if (gameEngine.isInitialized()) {
        gameEngine.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (raceState === 'finished' && !hasSavedScore.current && config) {
      hasSavedScore.current = true;
      
      const playerCar = cars.find(c => c.id === playerCarId);
      if (playerCar) {
        const playerPitStops = pitStopResults.filter(p => p.carId === playerCarId);
        const tiresUsed = playerPitStops.map(p => p.tireCompound);
        if (playerCar.tireCompound) {
          tiresUsed.unshift(playerCar.tireCompound);
        }

        const score = calculateScore(
          playerCar.position,
          playerCar.totalTime,
          playerCar.bestLapTime,
          playerCar.pitStops,
          config.difficulty
        );

        saveHighScore({
          id: generateId(),
          trackId: config.trackId,
          trackName: config.trackName,
          position: playerCar.position,
          totalTime: playerCar.totalTime,
          bestLapTime: playerCar.bestLapTime,
          pitStops: playerCar.pitStops,
          score,
          difficulty: config.difficulty,
          tiresUsed,
          retired: playerCar.retired,
          date: Date.now()
        });
      }
    }
  }, [raceState, cars, playerCarId, config, pitStopResults]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (raceState === 'running') {
          useGameStore.getState().pauseRace();
          useUISTore.getState().setShowPauseMenu(true);
        } else if (raceState === 'paused' && showPauseMenu) {
          useGameStore.getState().resumeRace();
          useUISTore.getState().setShowPauseMenu(false);
        }
      }
      
      if (e.key === ' ' && raceState === 'running') {
        e.preventDefault();
        const playerCar = cars.find(c => c.id === playerCarId);
        if (playerCar && !playerCar.pitStopPlanned && !playerCar.inPit) {
          const state = useUISTore.getState();
          useGameStore.getState().callPitStop(
            playerCarId,
            state.selectedTire,
            state.pitStopFuelAmount
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [raceState, cars, playerCarId, showPauseMenu]);

  useEffect(() => {
    if (gameEngine.isInitialized()) {
      const scene = gameEngine.getScene();
      if (scene && 'setCameraZoom' in scene) {
        (scene as any).setCameraZoom(cameraZoom);
      }
    }
  }, [cameraZoom]);

  if (raceState === 'finished') {
    return <Results />;
  }

  return (
    <div className="w-full h-screen bg-racing-dark relative overflow-hidden">
      <div ref={canvasRef} className="w-full h-full" />
      <HUD />
      {showPauseMenu && <PauseMenu />}
    </div>
  );
}
