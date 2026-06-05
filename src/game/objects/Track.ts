import Phaser from 'phaser';
import type { TrackData, Weather } from '@/types/game';
import { getPointOnPath } from '@/game/config/trackData';
import { WeatherSystem } from '../systems/WeatherSystem';

export class Track extends Phaser.GameObjects.Container {
  private trackData: TrackData;
  private trackGraphics: Phaser.GameObjects.Graphics;
  private pitLaneGraphics: Phaser.GameObjects.Graphics | null = null;
  private weather: Weather = 'dry';
  private rainParticles: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  private rainIntensity: number = 0;

  constructor(scene: Phaser.Scene, trackData: TrackData) {
    super(scene, 0, 0);
    this.trackData = trackData;
    
    this.trackGraphics = scene.add.graphics();
    this.add(this.trackGraphics);
    
    this.drawTrack();
    this.drawPitLane();
    
    scene.add.existing(this);
  }

  private drawTrack(): void {
    this.trackGraphics.clear();
    
    const path = this.trackData.path;
    const width = this.trackData.width;
    
    this.trackGraphics.fillStyle(0x1a472a, 1);
    this.trackGraphics.fillRect(
      -this.trackData.worldSize.width / 2,
      -this.trackData.worldSize.height / 2,
      this.trackData.worldSize.width,
      this.trackData.worldSize.height
    );
    
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(-this.trackData.worldSize.width / 2, this.trackData.worldSize.width / 2);
      const y = Phaser.Math.Between(-this.trackData.worldSize.height / 2, this.trackData.worldSize.height / 2);
      this.trackGraphics.fillStyle(0x0d3320, 0.3);
      this.trackGraphics.fillCircle(x, y, Phaser.Math.Between(20, 60));
    }
    
    this.trackGraphics.lineStyle(width, 0x2d2d2d, 1);
    this.trackGraphics.beginPath();
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      if (i === 0) {
        this.trackGraphics.moveTo(p.x!, p.y!);
      } else {
        this.trackGraphics.lineTo(p.x!, p.y!);
      }
    }
    this.trackGraphics.closePath();
    this.trackGraphics.strokePath();
    
    this.trackGraphics.lineStyle(width * 0.9, 0x3d3d3d, 1);
    this.trackGraphics.beginPath();
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      if (i === 0) {
        this.trackGraphics.moveTo(p.x!, p.y!);
      } else {
        this.trackGraphics.lineTo(p.x!, p.y!);
      }
    }
    this.trackGraphics.closePath();
    this.trackGraphics.strokePath();
    
    this.trackGraphics.lineStyle(width * 0.03, 0xffffff, 1);
    this.trackGraphics.beginPath();
    for (let i = 0; i < path.length; i++) {
      const p = path[i];
      if (i === 0) {
        this.trackGraphics.moveTo(p.x!, p.y!);
      } else {
        this.trackGraphics.lineTo(p.x!, p.y!);
      }
    }
    this.trackGraphics.closePath();
    this.trackGraphics.strokePath();
    
    for (let i = 0; i < path.length; i += 2) {
      const p1 = path[i];
      const p2 = path[(i + 1) % path.length];
      const angle = Math.atan2(p2.y! - p1.y!, p2.x! - p1.x!);
      const perpAngle = angle + Math.PI / 2;
      const halfWidth = width / 2;
      
      for (let j = 0; j < 8; j++) {
        const t = j / 8;
        const x = p1.x! + (p2.x! - p1.x!) * t;
        const y = p1.y! + (p2.y! - p1.y!) * t;
        
        const leftX = x + Math.cos(perpAngle) * halfWidth;
        const leftY = y + Math.sin(perpAngle) * halfWidth;
        const rightX = x - Math.cos(perpAngle) * halfWidth;
        const rightY = y - Math.sin(perpAngle) * halfWidth;
        
        const color = j % 2 === 0 ? 0xff0000 : 0xffffff;
        this.trackGraphics.fillStyle(color, 1);
        this.trackGraphics.fillRoundedRect(leftX - 6, leftY - 4, 12, 8, 2);
        this.trackGraphics.fillRoundedRect(rightX - 6, rightY - 4, 12, 8, 2);
      }
    }
    
    const startPoint = this.trackData.startPosition;
    const startAngle = Math.atan2(
      path[1].y! - path[0].y!,
      path[1].x! - path[0].x!
    );
    const perpStart = startAngle + Math.PI / 2;
    
    this.trackGraphics.lineStyle(4, 0xffffff, 1);
    this.trackGraphics.beginPath();
    this.trackGraphics.moveTo(
      startPoint.x! + Math.cos(perpStart) * width / 2,
      startPoint.y! + Math.sin(perpStart) * width / 2
    );
    this.trackGraphics.lineTo(
      startPoint.x! - Math.cos(perpStart) * width / 2,
      startPoint.y! - Math.sin(perpStart) * width / 2
    );
    this.trackGraphics.strokePath();
  }

  private drawPitLane(): void {
    if (this.pitLaneGraphics) {
      this.pitLaneGraphics.destroy();
    }
    
    this.pitLaneGraphics = this.scene.add.graphics();
    this.add(this.pitLaneGraphics);
    
    const pitPoint = getPointOnPath(this.trackData.path, this.trackData.pitPosition);
    const perpAngle = pitPoint.angle + Math.PI / 2;
    const halfWidth = this.trackData.width / 2;
    
    this.pitLaneGraphics.fillStyle(0x4a4a4a, 0.8);
    for (let i = 0; i < 5; i++) {
      const progress = (this.trackData.pitPosition + i * 0.01) % 1;
      const point = getPointOnPath(this.trackData.path, progress);
      const offsetX = Math.cos(perpAngle) * (halfWidth + 40);
      const offsetY = Math.sin(perpAngle) * (halfWidth + 40);
      this.pitLaneGraphics.fillRoundedRect(
        point.x + offsetX - 15,
        point.y + offsetY - 8,
        30, 16, 3
      );
    }
    
    this.pitLaneGraphics.fillStyle(0xff6600, 1);
    const firstPitPoint = getPointOnPath(this.trackData.path, this.trackData.pitPosition);
    this.pitLaneGraphics.fillCircle(firstPitPoint.x, firstPitPoint.y, 10);
  }

  setWeather(weather: Weather, transitionProgress: number): void {
    this.weather = weather;
    this.rainIntensity = WeatherSystem.getRainIntensity(weather) * (0.5 + transitionProgress * 0.5);
    this.updateRainEffect();
  }

  private updateRainEffect(): void {
    if (this.rainIntensity > 0) {
      if (!this.rainParticles) {
        this.rainParticles = this.scene.add.particles(0, 0, 'pixel', {
          speed: { min: 200, max: 400 },
          angle: { min: 200, max: 220 },
          scale: { start: 1, end: 1 },
          alpha: { start: 0.6, end: 0.2 },
          lifespan: 1500,
          quantity: 10 * this.rainIntensity,
          blendMode: 'ADD',
          follow: this,
          emitZone: {
            type: 'edge',
            source: new Phaser.Geom.Rectangle(
              -this.trackData.worldSize.width / 2,
              -this.trackData.worldSize.height / 2,
              this.trackData.worldSize.width,
              this.trackData.worldSize.height
            ),
            quantity: 50
          }
        });
      } else {
        this.rainParticles.setQuantity(10 * this.rainIntensity);
      }
    } else if (this.rainParticles) {
      this.rainParticles.stop();
      this.rainParticles.destroy();
      this.rainParticles = null;
    }
  }

  getTrackData(): TrackData {
    return this.trackData;
  }

  getWorldSize(): { width: number; height: number } {
    return this.trackData.worldSize;
  }

  destroy(fromScene?: boolean): void {
    if (this.rainParticles) {
      this.rainParticles.destroy();
    }
    if (this.pitLaneGraphics) {
      this.pitLaneGraphics.destroy();
    }
    super.destroy(fromScene);
  }
}
