import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 px-4 text-center">
        {/* 404 Number */}
        <div className="flex items-center justify-center">
          <h1 className="text-[120px] font-bold text-primary leading-none">404</h1>
        </div>

        {/* Message */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold text-foreground">
            Página não encontrada
          </h2>
          <p className="text-muted-foreground max-w-md">
            A página que você está procurando não existe ou foi removida.
          </p>
        </div>

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
