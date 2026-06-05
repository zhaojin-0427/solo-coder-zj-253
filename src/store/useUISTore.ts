import { create } from 'zustand';
import type { TireCompound, GameMode, Difficulty, TutorialStep } from '@/types/game';

type ViewType = 'menu' | 'race' | 'results' | 'tutorial' | 'highscores';

interface UIState {
  currentView: ViewType;
  showStrategyPanel: boolean;
  selectedTire: TireCompound;
  pitStopFuelAmount: number;
  tutorialStep: number;
  tutorialSteps: TutorialStep[];
  selectedTrack: string;
  selectedDifficulty: Difficulty;
  selectedMode: GameMode;
  showPauseMenu: boolean;
  cameraZoom: number;

  setView: (view: ViewType) => void;
  toggleStrategyPanel: () => void;
  setShowStrategyPanel: (show: boolean) => void;
  setSelectedTire: (tire: TireCompound) => void;
  setPitStopFuelAmount: (amount: number) => void;
  nextTutorialStep: () => void;
  prevTutorialStep: () => void;
  resetTutorial: () => void;
  completeTutorialStep: (stepId: number) => void;
  setSelectedTrack: (trackId: string) => void;
  setSelectedDifficulty: (difficulty: Difficulty) => void;
  setSelectedMode: (mode: GameMode) => void;
  togglePauseMenu: () => void;
  setShowPauseMenu: (show: boolean) => void;
  setCameraZoom: (zoom: number) => void;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: '欢迎来到F1策略挑战',
    description: '在这个游戏中，你将扮演车队策略师，管理轮胎、燃油和进站策略来赢得比赛。让我们先了解基本操作。',
    completed: false
  },
  {
    id: 2,
    title: '轮胎管理',
    description: '不同轮胎配方有不同特性：软胎速度快但磨损快，硬胎耐久但圈速慢，雨胎在湿地有优势。注意监控轮胎磨损！',
    highlightElement: 'tire-status',
    completed: false
  },
  {
    id: 3,
    title: '燃油策略',
    description: '燃油越轻速度越快，但需要平衡进站次数。每圈消耗约2.2kg燃油。',
    highlightElement: 'fuel-status',
    completed: false
  },
  {
    id: 4,
    title: '进站时机',
    description: '选择正确的进站窗口至关重要。进站需要约3.2秒，选择不当会损失位置。使用策略面板计划进站。',
    highlightElement: 'strategy-panel',
    completed: false
  },
  {
    id: 5,
    title: '应对天气变化',
    description: '比赛中可能会突然降雨，需要及时更换雨胎。干胎在湿地抓地力会大幅下降！',
    highlightElement: 'weather-status',
    completed: false
  },
  {
    id: 6,
    title: '关注竞争对手',
    description: '观察对手的策略，他们可能会使用undercut（提前进站）来超越你。灵活应对！',
    highlightElement: 'standings',
    completed: false
  },
  {
    id: 7,
    title: '准备开始',
    description: '你已经掌握了基本知识！选择难度和赛道，开始你的策略大师之旅吧！',
    completed: false
  }
];

export const useUISTore = create<UIState>((set, get) => ({
  currentView: 'menu',
  showStrategyPanel: false,
  selectedTire: 'medium',
  pitStopFuelAmount: 50,
  tutorialStep: 0,
  tutorialSteps: [...TUTORIAL_STEPS],
  selectedTrack: 'monza',
  selectedDifficulty: 'normal',
  selectedMode: 'grand_prix',
  showPauseMenu: false,
  cameraZoom: 0.8,

  setView: (view) => set({ currentView: view }),

  toggleStrategyPanel: () => set(state => ({ 
    showStrategyPanel: !state.showStrategyPanel 
  })),

  setShowStrategyPanel: (show) => set({ showStrategyPanel: show }),

  setSelectedTire: (tire) => set({ selectedTire: tire }),

  setPitStopFuelAmount: (amount) => set({ pitStopFuelAmount: Math.max(0, Math.min(110, amount)) }),

  nextTutorialStep: () => set(state => ({
    tutorialStep: Math.min(state.tutorialStep + 1, state.tutorialSteps.length - 1)
  })),

  prevTutorialStep: () => set(state => ({
    tutorialStep: Math.max(0, state.tutorialStep - 1)
  })),

  resetTutorial: () => set({
    tutorialStep: 0,
    tutorialSteps: TUTORIAL_STEPS.map(s => ({ ...s, completed: false }))
  }),

  completeTutorialStep: (stepId) => set(state => ({
    tutorialSteps: state.tutorialSteps.map(s =>
      s.id === stepId ? { ...s, completed: true } : s
    )
  })),

  setSelectedTrack: (trackId) => set({ selectedTrack: trackId }),

  setSelectedDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),

  setSelectedMode: (mode) => set({ selectedMode: mode }),

  togglePauseMenu: () => set(state => ({ showPauseMenu: !state.showPauseMenu })),

  setShowPauseMenu: (show) => set({ showPauseMenu: show }),

  setCameraZoom: (zoom) => set({ cameraZoom: Math.max(0.5, Math.min(1.5, zoom)) })
}));
