import React, { createContext, useContext, useState } from 'react';

interface InitializationContextValue {
  loading: boolean;
  setLoading: (value: boolean) => void;
}

const InitializationContext = createContext<InitializationContextValue | undefined>(undefined);

export const InitializationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(false);
  return (
    <InitializationContext.Provider value={{ loading, setLoading }}>
      {children}
    </InitializationContext.Provider>
  );
};

export const useInitialization = () => {
  const context = useContext(InitializationContext);
  if (!context) throw new Error('useInitialization must be used within InitializationProvider');
  return context;
};
