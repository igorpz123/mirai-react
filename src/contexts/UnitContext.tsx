// src/contexts/UnitContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface UnitContextType {
  unitId: number | null;
  setUnitId: (id: number | null) => void;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export const UnitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unitId, setUnitId] = useState<number | null>(null);

  return (
    <UnitContext.Provider value={{ unitId, setUnitId }}>
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