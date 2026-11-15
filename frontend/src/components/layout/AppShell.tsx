import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopStatusBar } from './TopStatusBar';
import { LeftSidebar } from './LeftSidebar';

export const AppShell: React.FC = () => {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-space-950 text-space-200">
      <TopStatusBar />
      <div className="flex flex-1 overflow-hidden">
        <LeftSidebar />
        <main className="flex-1 overflow-y-auto bg-space-950 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
