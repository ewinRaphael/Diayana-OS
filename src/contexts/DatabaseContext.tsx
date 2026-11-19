// ============================================================
// NexusOS — DatabaseContext
// Provides the IDataStore singleton to all components
// ============================================================

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { getStore, resetStore, type IDataStore } from '../lib/database';

interface DatabaseContextType {
  store: IDataStore | null;
  isLoading: boolean;
  error: string | null;
  refreshStore: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

interface DatabaseProviderProps {
  children: ReactNode;
}

function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [store, setStore] = useState<IDataStore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const initStore = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const instance = await getStore();
      if (mountedRef.current) {
        setStore(instance);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to initialize database');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const refreshStore = useCallback(async () => {
    resetStore();
    setStore(null);
    await initStore();
  }, [initStore]);

  // Initialize on mount
  useEffect(() => {
    mountedRef.current = true;
    initStore();
    return () => {
      mountedRef.current = false;
    };
  }, [initStore]);

  // Listen for settings changes and re-initialize the store
  useEffect(() => {
    const handleSettingsChange = () => {
      refreshStore();
    };

    window.addEventListener('nexus-settings-changed', handleSettingsChange);
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === 'nexus_settings') {
        handleSettingsChange();
      }
    });

    return () => {
      window.removeEventListener('nexus-settings-changed', handleSettingsChange);
      // Note: storage listener cleanup uses same reference
    };
  }, [refreshStore]);

  const value: DatabaseContextType = {
    store,
    isLoading,
    error,
    refreshStore,
  };

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextType {
  const ctx = useContext(DatabaseContext);
  if (!ctx) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return ctx;
}

export { DatabaseProvider };
export default DatabaseProvider;
