// ============================================================
// NexusOS — Root Application
// ============================================================

import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { DatabaseProvider } from './contexts/DatabaseContext';
import { AppShell } from './components/layout/AppShell';

export function App() {
  return (
    <WorkspaceProvider>
      <DatabaseProvider>
        <AppShell />
      </DatabaseProvider>
    </WorkspaceProvider>
  );
}

export default App;
