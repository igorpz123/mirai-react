import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';
import FuzzyText from '@/components/fuzzy-text';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 px-4 text-center">
        {/* 404 Number */}
        <FuzzyText
          baseIntensity={0.2}
          hoverIntensity={0.5}
          enableHover={true}
        >
          404
        </FuzzyText>
        <FuzzyText
          baseIntensity={0.1}
          hoverIntensity={0.5}
          enableHover={true}
          fontSize={40}
        >
          Página Não Encontrada
        </FuzzyText>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            variant="default"
            size="lg"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <Home className="size-4" />
            Ir para Home
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
