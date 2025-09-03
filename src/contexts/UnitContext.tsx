// src/contexts/UnitContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface UnitContextType {
  unitId: number | null;
  setUnitId: (id: number) => void;
  isLoading: boolean;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export const UnitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [unitId, setUnitId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carrega a unidade padrão ao inicializar
  useEffect(() => {
    const initializeUnit = () => {
      try {
        // Primeiro tenta recuperar do localStorage
        const savedUnitId = localStorage.getItem('selectedUnitId');
        
        if (savedUnitId) {
          const parsedId = parseInt(savedUnitId);
          if (!isNaN(parsedId)) {
            setUnitId(parsedId);
          } else {
            // Se não houver unidade salva, define a unidade padrão (id: 1)
            setUnitId(1);
            localStorage.setItem('selectedUnitId', '1');
          }
        } else {
          // Define unidade padrão como 1 se não houver nada salvo
          setUnitId(1);
          localStorage.setItem('selectedUnitId', '1');
        }
      } catch (error) {
        console.error('Erro ao carregar unidade padrão:', error);
        // Em caso de erro, define unidade 1 como padrão
        setUnitId(1);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUnit();
  }, []);

  // Atualiza o localStorage sempre que mudar a unidade
  const handleSetUnitId = (id: number) => {
    setUnitId(id);
    localStorage.setItem('selectedUnitId', id.toString());
  };

  return (
    <UnitContext.Provider 
      value={{ 
        unitId, 
        setUnitId: handleSetUnitId,
        isLoading
      }}
    >
      {children}
    </UnitContext.Provider>
  );
};

export const useUnit = (): UnitContextType => {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnit deve ser usado dentro de UnitProvider');
  }
  return context;
};