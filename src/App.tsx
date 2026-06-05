import { MainMenu } from '@/components/MainMenu';
import { RaceView } from '@/components/RaceView';
import { HighScores } from '@/components/HighScores';
import { Tutorial } from '@/components/Tutorial';
import { Results } from '@/components/Results';
import { useUISTore } from '@/store/useUISTore';

export default function App() {
  const { currentView } = useUISTore();

  const renderView = () => {
    switch (currentView) {
      case 'menu':
        return <MainMenu />;
      case 'race':
        return <RaceView />;
      case 'results':
        return <Results />;
      case 'highscores':
        return <HighScores />;
      case 'tutorial':
        return <Tutorial />;
      default:
        return <MainMenu />;
    }
  };

  return (
    <div className="min-h-screen bg-racing-dark text-white font-body">
      {renderView()}
    </div>
  );
}
