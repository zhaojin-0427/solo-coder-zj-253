import type { TrackData } from '@/types/game';

function generateOvalTrack(centerX: number, centerY: number, width: number, height: number, segments: number): Phaser.Types.Math.Vector2Like[] {
  const points: Phaser.Types.Math.Vector2Like[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = centerX + Math.cos(angle) * width;
    const y = centerY + Math.sin(angle) * height;
    points.push({ x, y });
  }
  return points;
}

function generateRoadCourse(centerX: number, centerY: number, scale: number): Phaser.Types.Math.Vector2Like[] {
  const points: Phaser.Types.Math.Vector2Like[] = [];
  const waypoints = [
    { x: 0, y: -1 },
    { x: 0.6, y: -0.9 },
    { x: 0.9, y: -0.5 },
    { x: 0.8, y: 0 },
    { x: 0.9, y: 0.4 },
    { x: 0.5, y: 0.8 },
    { x: 0, y: 0.9 },
    { x: -0.5, y: 0.8 },
    { x: -0.8, y: 0.5 },
    { x: -0.9, y: 0 },
    { x: -0.8, y: -0.4 },
    { x: -0.5, y: -0.8 },
  ];
  
  for (const wp of waypoints) {
    points.push({
      x: centerX + wp.x * scale,
      y: centerY + wp.y * scale
    });
  }
  return points;
}

export const TRACKS: TrackData[] = [
  {
    id: 'monza',
    name: '蒙扎赛道',
    country: '意大利',
    length: 5.793,
    corners: 11,
    difficulty: 2,
    path: generateOvalTrack(1200, 600, 500, 300, 32),
    width: 180,
    pitPosition: 0.88,
    worldSize: { width: 2400, height: 1200 },
    startPosition: { x: 1200, y: 900 }
  },
  {
    id: 'silverstone',
    name: '银石赛道',
    country: '英国',
    length: 5.891,
    corners: 18,
    difficulty: 4,
    path: generateRoadCourse(1200, 600, 450),
    width: 160,
    pitPosition: 0.92,
    worldSize: { width: 2400, height: 1200 },
    startPosition: { x: 1200, y: 150 }
  },
  {
    id: 'monaco',
    name: '摩纳哥赛道',
    country: '摩纳哥',
    length: 3.337,
    corners: 19,
    difficulty: 5,
    path: generateRoadCourse(1000, 500, 380),
    width: 140,
    pitPosition: 0.05,
    worldSize: { width: 2000, height: 1000 },
    startPosition: { x: 1000, y: 880 }
  },
  {
    id: 'spa',
    name: '斯帕赛道',
    country: '比利时',
    length: 7.004,
    corners: 20,
    difficulty: 5,
    path: generateRoadCourse(1400, 700, 550),
    width: 170,
    pitPosition: 0.85,
    worldSize: { width: 2800, height: 1400 },
    startPosition: { x: 1400, y: 1150 }
  }
];

export function getTrackById(id: string): TrackData | undefined {
  return TRACKS.find(track => track.id === id);
}

export function getTrackPathLength(path: Phaser.Types.Math.Vector2Like[]): number {
  let length = 0;
  for (let i = 0; i < path.length; i++) {
    const p1 = path[i];
    const p2 = path[(i + 1) % path.length];
    const dx = p2.x! - p1.x!;
    const dy = p2.y! - p1.y!;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

export function getPointOnPath(
  path: Phaser.Types.Math.Vector2Like[],
  progress: number
): { x: number; y: number; angle: number } {
  const normalizedProgress = ((progress % 1) + 1) % 1;
  const totalLength = getTrackPathLength(path);
  const targetDistance = normalizedProgress * totalLength;
  
  let accumulated = 0;
  for (let i = 0; i < path.length; i++) {
    const p1 = path[i];
    const p2 = path[(i + 1) % path.length];
    const dx = p2.x! - p1.x!;
    const dy = p2.y! - p1.y!;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);
    
    if (accumulated + segmentLength >= targetDistance) {
      const t = (targetDistance - accumulated) / segmentLength;
      const x = p1.x! + dx * t;
      const y = p1.y! + dy * t;
      const angle = Math.atan2(dy, dx);
      return { x, y, angle };
    }
    accumulated += segmentLength;
  }
  
  const lastPoint = path[path.length - 1];
  return { x: lastPoint.x!, y: lastPoint.y!, angle: 0 };
}
