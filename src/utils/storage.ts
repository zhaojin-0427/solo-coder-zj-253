import type { HighScore } from '@/types/game';

const STORAGE_KEY = 'f1_strategy_highscores';
const MAX_SCORES = 10;

export function saveHighScore(score: HighScore): void {
  try {
    const scores = getHighScores();
    scores.push(score);
    scores.sort((a, b) => b.score - a.score);
    const trimmedScores = scores.slice(0, MAX_SCORES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedScores));
  } catch (error) {
    console.error('Failed to save high score:', error);
  }
}

export function getHighScores(): HighScore[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load high scores:', error);
  }
  return [];
}

export function clearHighScores(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear high scores:', error);
  }
}

export function getBestScoreForTrack(trackName: string, difficulty: string): HighScore | null {
  const scores = getHighScores();
  const filtered = scores.filter(s => s.trackName === trackName && s.difficulty === difficulty);
  return filtered.length > 0 ? filtered[0] : null;
}
