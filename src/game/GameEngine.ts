import Phaser from 'phaser';
import { RaceScene } from './scenes/RaceScene';

export class GameEngine {
  private game: Phaser.Game | null = null;
  private container: HTMLElement | null = null;
  private raceScene: RaceScene | null = null;
  private initialized: boolean = false;

  isInitialized(): boolean {
    return this.initialized;
  }

  getScene(): RaceScene | null {
    return this.raceScene;
  }

  getRaceScene(): RaceScene | null {
    return this.raceScene;
  }

  init(container: HTMLElement): void {
    this.container = container;
    
    if (this.game) {
      this.destroy();
    }

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: container.clientWidth,
      height: container.clientHeight,
      parent: container,
      scene: [RaceScene],
      backgroundColor: '#1a1a2e',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false
        }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      render: {
        pixelArt: false,
        antialias: true
      }
    };

    this.game = new Phaser.Game(config);

    this.game.events.on('ready', () => {
      this.raceScene = this.game?.scene.getScene('RaceScene') as RaceScene;
      this.initialized = true;
    });
  }

  getCountdownTime(): number {
    return this.raceScene?.getCountdownTime() || 0;
  }

  destroy(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    this.raceScene = null;
    this.container = null;
    this.initialized = false;
  }

  resize(width: number, height: number): void {
    if (this.game) {
      this.game.scale.resize(width, height);
    }
  }
}

export const gameEngine = new GameEngine();
