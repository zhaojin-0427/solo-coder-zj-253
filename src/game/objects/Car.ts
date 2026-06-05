import Phaser from 'phaser';
import type { CarState, TireCompound, Weather } from '@/types/game';
import { TIRE_COMPOUNDS } from '@/game/config/constants';

export class Car extends Phaser.GameObjects.Container {
  private carSprite: Phaser.GameObjects.Graphics;
  private tireMarks: Phaser.GameObjects.Graphics[] = [];
  private carState: CarState;
  private _carScale: number = 0.8;

  constructor(scene: Phaser.Scene, x: number, y: number, carState: CarState) {
    super(scene, x, y);
    this.carState = carState;
    
    this.carSprite = scene.add.graphics();
    this.add(this.carSprite);
    
    this.drawCar();
    
    scene.add.existing(this);
  }

  private drawCar(): void {
    this.carSprite.clear();
    
    const color = Phaser.Display.Color.HexStringToColor(this.carState.color).color;
    const tireColor = TIRE_COMPOUNDS[this.carState.tireCompound].color;
    const tireHex = Phaser.Display.Color.HexStringToColor(tireColor).color;
    
    this.carSprite.save();
    this.carSprite.scaleX = this._carScale;
    this.carSprite.scaleY = this._carScale;
    
    this.carSprite.fillStyle(color, 1);
    this.carSprite.beginPath();
    this.carSprite.moveTo(-25, 0);
    this.carSprite.lineTo(-15, -12);
    this.carSprite.lineTo(15, -12);
    this.carSprite.lineTo(25, 0);
    this.carSprite.lineTo(15, 12);
    this.carSprite.lineTo(-15, 12);
    this.carSprite.closePath();
    this.carSprite.fillPath();
    
    this.carSprite.fillStyle(0x1a1a2e, 0.9);
    this.carSprite.beginPath();
    this.carSprite.moveTo(-10, 0);
    this.carSprite.lineTo(-5, -7);
    this.carSprite.lineTo(10, -7);
    this.carSprite.lineTo(15, 0);
    this.carSprite.lineTo(10, 7);
    this.carSprite.lineTo(-5, 7);
    this.carSprite.closePath();
    this.carSprite.fillPath();
    
    this.carSprite.fillStyle(tireHex, 1);
    this.carSprite.fillRoundedRect(-22, -14, 10, 6, 2);
    this.carSprite.fillRoundedRect(-22, 8, 10, 6, 2);
    this.carSprite.fillRoundedRect(12, -14, 10, 6, 2);
    this.carSprite.fillRoundedRect(12, 8, 10, 6, 2);
    
    if (this.carState.isPlayer) {
      this.carSprite.lineStyle(2, 0xffffff, 0.8);
      this.carSprite.strokeRoundedRect(-28, -16, 56, 32, 4);
    }
    
    if (this.carState.inPit) {
      this.carSprite.fillStyle(0xffff00, 0.3);
      this.carSprite.fillRoundedRect(-30, -18, 60, 36, 6);
    }
    
    if (this.carState.retired) {
      this.carSprite.fillStyle(0xff0000, 0.5);
      this.carSprite.fillRoundedRect(-30, -18, 60, 36, 6);
    }
    
    this.carSprite.restore();
  }

  updateCarState(carState: CarState): void {
    const tireChanged = this.carState.tireCompound !== carState.tireCompound;
    const colorChanged = this.carState.color !== carState.color;
    const pitChanged = this.carState.inPit !== carState.inPit;
    
    this.carState = carState;
    
    if (tireChanged || colorChanged || pitChanged) {
      this.drawCar();
    }
  }

  updatePosition(x: number, y: number, angle: number): void {
    this.setPosition(x, y);
    this.setRotation(angle);
  }

  addTireMark(scene: Phaser.Scene, x: number, y: number, angle: number, intensity: number): void {
    if (intensity < 0.3) return;
    
    const mark = scene.add.graphics();
    mark.fillStyle(0x000000, intensity * 0.3);
    mark.save();
    mark.x = x;
    mark.y = y;
    mark.rotation = angle;
    mark.fillRoundedRect(-8, -3, 16, 6, 2);
    mark.restore();
    mark.setDepth(-1);
    
    this.tireMarks.push(mark);
    
    if (this.tireMarks.length > 100) {
      const oldMark = this.tireMarks.shift();
      if (oldMark) oldMark.destroy();
    }
  }

  getState(): CarState {
    return this.carState;
  }

  destroy(fromScene?: boolean): void {
    this.tireMarks.forEach(mark => mark.destroy());
    this.tireMarks = [];
    super.destroy(fromScene);
  }
}
