import Phaser from 'phaser';
import { useGameStore } from '@/store/useGameStore';
import { useUISTore } from '@/store/useUISTore';
import type { CarState, RaceConfig, TireCompound } from '@/types/game';
import { Track } from '../objects/Track';
import { Car } from '../objects/Car';
import { AIController } from '../objects/AIController';
import { TireSystem } from '../systems/TireSystem';
import { FuelSystem } from '../systems/FuelSystem';
import { EventSystem } from '../systems/EventSystem';
import { PitStopSystem } from '../systems/PitStopSystem';
import { getTrackById, getPointOnPath, getTrackPathLength } from '../config/trackData';
import { GAME_CONSTANTS } from '../config/constants';

export class RaceScene extends Phaser.Scene {
  private track: Track | null = null;
  private cars: Map<string, Car> = new Map();
  private aiControllers: Map<string, AIController> = new Map();
  private eventSystem: EventSystem = new EventSystem();
  private trackPathLength: number = 0;
  private countdownTimer: number = 0;
  private lastNotificationTime: number = 0;
  private cameraTarget: Car | null = null;

  constructor() {
    super({ key: 'RaceScene' });
  }

  init(): void {
    const gameState = useGameStore.getState();
    const uiState = useUISTore.getState();
    const track = getTrackById(uiState.selectedTrack);
    
    if (!track || !gameState.config) {
      console.error('Track or config not found');
      return;
    }
    
    this.trackPathLength = getTrackPathLength(track.path);
  }

  create(): void {
    const uiState = useUISTore.getState();
    const gameState = useGameStore.getState();
    const trackData = getTrackById(uiState.selectedTrack);
    
    if (!trackData) {
      console.error('Track not found');
      return;
    }

    this.track = new Track(this, trackData);
    
    const worldSize = trackData.worldSize;
    this.cameras.main.setBounds(
      -worldSize.width / 2,
      -worldSize.height / 2,
      worldSize.width,
      worldSize.height
    );

    this.cameras.main.setZoom(uiState.cameraZoom);

    this.createCars();
    
    gameState.cars.forEach(carState => {
      if (carState.isPlayer) {
        const playerCar = this.cars.get(carState.id);
        if (playerCar) {
          this.cameraTarget = playerCar;
          this.cameras.main.startFollow(playerCar, true, 0.1, 0.1);
        }
      }
    });

    this.countdownTimer = 5;
    
    this.input.keyboard?.on('keydown-ESC', () => {
      const gameState = useGameStore.getState();
      if (gameState.raceState === 'running') {
        useGameStore.getState().pauseRace();
        useUISTore.getState().setShowPauseMenu(true);
      } else if (gameState.raceState === 'paused') {
        useGameStore.getState().resumeRace();
        useUISTore.getState().setShowPauseMenu(false);
      }
    });

    this.input.keyboard?.on('keydown-SPACE', () => {
      const gameState = useGameStore.getState();
      if (gameState.raceState === 'countdown') return;
      
      const uiState = useUISTore.getState();
      const playerCar = gameState.cars.find(c => c.isPlayer);
      
      if (playerCar && !playerCar.pitStopPlanned && !playerCar.inPit) {
        useGameStore.getState().callPitStop(
          playerCar.id,
          uiState.selectedTire,
          uiState.pitStopFuelAmount
        );
      }
    });

    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any, deltaX: number, deltaY: number) => {
      const uiState = useUISTore.getState();
      const newZoom = uiState.cameraZoom + deltaY * 0.001;
      useUISTore.getState().setCameraZoom(newZoom);
      this.cameras.main.setZoom(newZoom);
    });
  }

  private createCars(): void {
    const gameState = useGameStore.getState();
    const uiState = useUISTore.getState();
    const config = gameState.config;
    
    if (!config) return;

    const trackData = getTrackById(uiState.selectedTrack);
    if (!trackData) return;

    this.cars.clear();
    this.aiControllers.clear();

    gameState.cars.forEach((carState, index) => {
      const startOffset = index * 0.003;
      const startProgress = -startOffset;
      const startPoint = getPointOnPath(trackData.path, startProgress);
      
      const car = new Car(this, startPoint.x, startPoint.y, carState);
      car.setRotation(startPoint.angle);
      car.setDepth(10 - index);
      
      this.cars.set(carState.id, car);
      
      if (!carState.isPlayer) {
        this.aiControllers.set(carState.id, new AIController(config.difficulty));
      }
    });
  }

  update(time: number, delta: number): void {
    const gameState = useGameStore.getState();
    const deltaSeconds = delta / 1000;

    if (gameState.raceState === 'countdown') {
      this.updateCountdown(deltaSeconds);
      return;
    }

    if (gameState.raceState === 'paused' || gameState.raceState === 'finished') {
      return;
    }

    this.updateGame(deltaSeconds, time);
  }

  private updateCountdown(deltaSeconds: number): void {
    this.countdownTimer -= deltaSeconds;
    
    if (this.countdownTimer <= 0) {
      useGameStore.getState().startRace();
      this.countdownTimer = 0;
    }
  }

  private updateGame(deltaSeconds: number, currentTime: number): void {
    const gameState = useGameStore.getState();
    const config = gameState.config;
    const uiState = useUISTore.getState();
    
    if (!config) return;

    useGameStore.getState().updateRaceTime(deltaSeconds);
    useGameStore.getState().updateWeather(deltaSeconds);

    if (this.eventSystem.shouldCheckEvents(gameState.raceTime)) {
      const event = this.eventSystem.generateRandomEvent(
        gameState.currentLap,
        gameState.totalLaps,
        gameState.weather,
        gameState.cars,
        config
      );
      
      if (event) {
        useGameStore.getState().triggerEvent(event);
      }
    }

    const { updated, expired } = this.eventSystem.updateEvents(
      gameState.activeEvents,
      gameState.currentLap,
      deltaSeconds
    );

    if (expired.length > 0) {
      expired.forEach(event => {
        useGameStore.getState().deactivateEvent(event.id);
        
        if (event.type === 'safety_car') {
          useGameStore.getState().deactivateSafetyCar();
        }
      });
    }

    this.updateAllCars(deltaSeconds);
    useGameStore.getState().calculatePositions();

    this.cars.forEach((car, carId) => {
      const carState = gameState.cars.find(c => c.id === carId);
      if (!carState) return;
      
      const trackData = getTrackById(uiState.selectedTrack);
      if (!trackData) return;
      
      const position = getPointOnPath(trackData.path, carState.trackProgress);
      car.updatePosition(position.x, position.y, position.angle);
      car.updateCarState(carState);

      if (!carState.inPit && !carState.retired) {
        const tireSlip = 1 - TireSystem.getGripMultiplier(carState, gameState.weather);
        car.addTireMark(this, position.x, position.y, position.angle, tireSlip);
      }
    });

    if (this.track) {
      this.track.setWeather(gameState.weather, gameState.weatherTransitionProgress);
    }

    if (gameState.showNotification && currentTime - this.lastNotificationTime > 3000) {
      useGameStore.getState().clearNotification();
      this.lastNotificationTime = currentTime;
    }

    if (gameState.currentLap >= gameState.totalLaps) {
      useGameStore.getState().finishRace();
      useUISTore.getState().setView('results');
    }
  }

  private updateAllCars(deltaSeconds: number): void {
    const gameState = useGameStore.getState();
    const uiState = useUISTore.getState();
    const config = gameState.config;
    
    if (!config) return;

    const trackData = getTrackById(uiState.selectedTrack);
    if (!trackData) return;

    gameState.cars.forEach(carState => {
      if (carState.retired) return;

      if (carState.inPit) {
        this.updatePitStop(carState, deltaSeconds);
        return;
      }

      let speed: number;
      if (carState.isPlayer) {
        speed = this.calculatePlayerSpeed(carState);
      } else {
        const aiController = this.aiControllers.get(carState.id);
        if (aiController) {
          speed = aiController.calculateSpeed(
            carState,
            gameState.weather,
            gameState.safetyCarActive,
            config.difficulty
          );
          
          if (aiController.decideUndercut(carState, gameState.cars.find(c => c.isPlayer)!, gameState.currentLap)) {
            if (!carState.pitStopPlanned) {
              const pitDecision = aiController.decidePitStop(
                carState, gameState.currentLap, gameState.totalLaps,
                gameState.weather, config
              );
              if (pitDecision.pitNow) {
                useGameStore.getState().callPitStop(
                  carState.id, pitDecision.nextTire, pitDecision.fuelAmount
                );
                useGameStore.getState().triggerEvent({
                  type: 'undercut',
                  lap: gameState.currentLap,
                  startTime: gameState.currentLap,
                  duration: 2,
                  data: { opponentId: carState.id }
                });
              }
            }
          }
          
          aiController.updateAggression(
            carState, carState.position, gameState.totalLaps - gameState.currentLap
          );
        } else {
          speed = 0;
        }
      }

      const progressIncrement = (speed / this.trackPathLength) * deltaSeconds * 0.5;
      let newProgress = carState.trackProgress + progressIncrement;
      let newLap = carState.lap;
      let newCurrentLapTime = carState.currentLapTime + deltaSeconds;
      let newTotalTime = carState.totalTime + deltaSeconds;
      let newBestLapTime = carState.bestLapTime;
      let lapStartTime = carState.lapStartTime;

      if (newProgress >= 1) {
        newProgress -= 1;
        newLap++;
        newBestLapTime = Math.min(newBestLapTime, newCurrentLapTime);
        newCurrentLapTime = 0;
        lapStartTime = gameState.raceTime;

        useGameStore.setState({ currentLap: Math.max(newLap, gameState.currentLap) });

        if (carState.pitStopPlanned) {
          useGameStore.getState().executePitStop(carState.id);
          return;
        }

        if (!carState.isPlayer) {
          const aiController = this.aiControllers.get(carState.id);
          if (aiController && !carState.pitStopPlanned) {
            const pitDecision = aiController.decidePitStop(
              carState, newLap, gameState.totalLaps, gameState.weather, config
            );
            if (pitDecision.pitNow) {
              useGameStore.getState().callPitStop(
                carState.id, pitDecision.nextTire, pitDecision.fuelAmount
              );
            }
          }
        }
      }

      const newTireWear = TireSystem.calculateWear(
        carState, deltaSeconds, speed, gameState.weather, config.difficulty
      );
      const newTireTemp = TireSystem.calculateTemperature(
        carState, deltaSeconds, speed, gameState.weather
      );
      const newFuel = FuelSystem.calculateConsumption(
        carState, deltaSeconds, speed, config.difficulty
      );

      const blowoutCheck = TireSystem.checkBlowoutRisk({ ...carState, tireWear: newTireWear });
      const fuelCheck = FuelSystem.checkFuelLevel({ ...carState, fuel: newFuel });

      let retired = carState.retired;
      let retirementReason = carState.retirementReason;

      if (blowoutCheck.risk) {
        retired = true;
        retirementReason = blowoutCheck.message;
        if (carState.isPlayer) {
          useGameStore.getState().setNotification('💥 ' + blowoutCheck.message, 'danger');
        }
      }

      if (fuelCheck.critical) {
        retired = true;
        retirementReason = fuelCheck.message;
        if (carState.isPlayer) {
          useGameStore.getState().setNotification('⛽ ' + fuelCheck.message, 'danger');
        }
      }

      if (carState.isPlayer) {
        if (blowoutCheck.message && !blowoutCheck.risk) {
          this.showConditionalNotification(blowoutCheck.message, 'warning');
        }
        if (fuelCheck.message && !fuelCheck.critical) {
          this.showConditionalNotification(fuelCheck.message, 'warning');
        }
      }

      useGameStore.getState().updateCar(carState.id, {
        trackProgress: newProgress,
        lap: newLap,
        speed,
        currentLapTime: newCurrentLapTime,
        totalTime: newTotalTime,
        bestLapTime: newBestLapTime,
        lapStartTime,
        tireWear: newTireWear,
        tireTemperature: newTireTemp,
        fuel: newFuel,
        distanceTravelled: carState.distanceTravelled + speed * deltaSeconds,
        retired,
        retirementReason
      });
    });
  }

  private calculatePlayerSpeed(carState: CarState): number {
    const gameState = useGameStore.getState();
    const config = gameState.config;
    
    if (!config) return 0;

    const gripMultiplier = TireSystem.getGripMultiplier(carState, gameState.weather);
    const fuelPenalty = FuelSystem.getSpeedPenalty(carState.fuel, carState.maxFuel);
    
    let speed = carState.baseSpeed * gripMultiplier * fuelPenalty;
    
    if (gameState.safetyCarActive) {
      speed *= GAME_CONSTANTS.SAFETY_CAR_SPEED;
    }
    
    return speed;
  }

  private updatePitStop(carState: CarState, deltaSeconds: number): void {
    const newPitTimer = Math.max(0, carState.pitTimer - deltaSeconds);
    
    if (newPitTimer <= 0) {
      useGameStore.getState().updateCar(carState.id, {
        inPit: false,
        pitTimer: 0
      });
    } else {
      useGameStore.getState().updateCar(carState.id, {
        pitTimer: newPitTimer
      });
    }
  }

  private showConditionalNotification(message: string, type: 'info' | 'warning' | 'danger'): void {
    const gameState = useGameStore.getState();
    if (!gameState.showNotification || gameState.notification?.message !== message) {
      useGameStore.getState().setNotification(message, type);
    }
  }

  getCountdownTime(): number {
    return Math.ceil(this.countdownTimer);
  }

  setCameraZoom(zoom: number): void {
    this.cameras.main.setZoom(zoom);
  }

  destroy(): void {
    this.cars.forEach(car => car.destroy());
    this.cars.clear();
    this.aiControllers.clear();
    
    if (this.track) {
      this.track.destroy();
      this.track = null;
    }
  }
}
