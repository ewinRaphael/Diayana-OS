// ============================================================
// NexusOS — App Shell Layout Container
// Unifies Sidebar, TopBar, MobileNav, FloatingFAB, and Modals
// ============================================================

import { useState } from 'react';
import { Sidebar, type NavPage } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { FloatingCaptureButton } from '../capture/FloatingCaptureButton';
import { CaptureModal } from '../capture/CaptureModal';
import { DashboardPage } from '../../pages/DashboardPage';
import { BusinessWorkspace } from '../../pages/BusinessWorkspace';
import { PersonalWorkspace } from '../../pages/PersonalWorkspace';
import { CalendarPage } from '../../pages/CalendarPage';
import { VaultPage } from '../../pages/VaultPage';
import { SettingsPage } from '../../pages/SettingsPage';

export function AppShell() {
  const [currentPage, setCurrentPage] = useState<NavPage>('dashboard');
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);

  const handleOpenCapture = () => setIsCaptureOpen(true);
  const handleCloseCapture = () => setIsCaptureOpen(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-obsidian text-text-primary font-sans">
      {/* 1. Desktop Collapsible Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header with Segmented Workspace Switcher */}
        <TopBar
          currentPage={currentPage}
          onOpenCapture={handleOpenCapture}
          onNavigate={setCurrentPage}
        />

        {/* Scrollable Main Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-8">
          {currentPage === 'dashboard' && (
            <DashboardPage
              onNavigate={setCurrentPage}
              onOpenCapture={handleOpenCapture}
            />
          )}
          {currentPage === 'business' && <BusinessWorkspace />}
          {currentPage === 'personal' && <PersonalWorkspace />}
          {currentPage === 'calendar' && <CalendarPage />}
          {currentPage === 'vault' && <VaultPage />}
          {currentPage === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* 3. Mobile Bottom Sticky Nav */}
      <MobileNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onOpenCapture={handleOpenCapture}
      />

      {/* 4. Desktop Floating Action Button (FAB) */}
      <FloatingCaptureButton onClick={handleOpenCapture} />

      {/* 5. Multimodal Voice/Text AI Capture Modal */}
      <CaptureModal
        isOpen={isCaptureOpen}
        onClose={handleCloseCapture}
      />
    </div>
  );
}

export default AppShell;
